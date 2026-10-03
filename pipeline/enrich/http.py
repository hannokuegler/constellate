"""Shared HTTP helper for the enrichment clients.

- httpx with retry + exponential backoff (429/5xx/transport errors, honours Retry-After)
- per-host rate limit (thread-safe, minimum interval between request starts)
- disk cache: data/cache/<source>/<sha1(key)>.json holding url, method, body, fetched_at, status, data.
  A second run only hits the cache. 200 and 404 are cached; 429/5xx/errors are never cached.
- secret query params (NCBI_API_KEY) are sent but never enter the cache key, the stored URL or error messages.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import random
import threading
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, urlsplit

import httpx

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / "data" / "cache"
USER_AGENT = "constellate-enrich/0.1 (Hack-Nation 2026 research prototype)"
MAX_ATTEMPTS = 8
TIMEOUT = httpx.Timeout(60.0, connect=15.0)

# minimum seconds between two request starts to the same host
HOST_MIN_INTERVAL: dict[str, float] = {
    "clinicaltrials.gov": 1.0,           # CT.gov documents ~50 req/min per IP
    "www.ebi.ac.uk": 0.3,                # Europe PMC answers 503 under load: stay gentle
    "api.reporter.nih.gov": 1.1,         # RePORTER asks for max 1 req/s
    "api.platform.opentargets.org": 0.2,
    "mygene.info": 0.15,
    "reactome.org": 0.15,
    "eutils.ncbi.nlm.nih.gov": 0.36,     # 3 req/s without key; set_ncbi_key_present() lowers it
}
DEFAULT_INTERVAL = 0.25

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

_client = httpx.Client(timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}, follow_redirects=True,
                       limits=httpx.Limits(max_connections=32, max_keepalive_connections=16))
_limit_lock = threading.Lock()
_next_slot: dict[str, float] = defaultdict(float)
_stats_lock = threading.Lock()
STATS: dict[str, dict[str, int]] = defaultdict(lambda: {"network": 0, "cache": 0, "retries": 0, "errors": 0})
_refresh = False


class FetchError(RuntimeError):
    """Request failed after all retries (message never contains secret params)."""


@dataclass
class Fetched:
    data: object            # parsed JSON (None for a cached 404)
    status: int
    url: str                # request URL without secret params
    fetched_at: str         # ISO UTC time of the real network call (also for cache hits)
    from_cache: bool


def set_refresh(flag: bool) -> None:
    global _refresh
    _refresh = flag


def set_ncbi_key_present() -> None:
    HOST_MIN_INTERVAL["eutils.ncbi.nlm.nih.gov"] = 0.11


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _wait_for_slot(host: str) -> None:
    interval = HOST_MIN_INTERVAL.get(host, DEFAULT_INTERVAL)
    with _limit_lock:
        now = time.monotonic()
        slot = max(now, _next_slot[host])
        _next_slot[host] = slot + interval
    delay = slot - now
    if delay > 0:
        time.sleep(delay)


def _bump(source: str, key: str, amount: int = 1) -> None:
    with _stats_lock:
        STATS[source][key] += amount


def _canonical(method: str, url: str, params: dict | None, body: object | None) -> tuple[str, str]:
    full_url = url + ("?" + urlencode(sorted((params or {}).items()), doseq=True) if params else "")
    key = f"{method}\n{full_url}\n{json.dumps(body, sort_keys=True, ensure_ascii=False) if body is not None else ''}"
    return full_url, key


def request_json(source: str, method: str, url: str, *, params: dict | None = None, body: object | None = None,
                 secret_params: dict | None = None, headers: dict | None = None) -> Fetched:
    """GET/POST returning parsed JSON; disk-cached under data/cache/<source>/."""
    full_url, key = _canonical(method, url, params, body)
    path = CACHE_DIR / source / (hashlib.sha1(key.encode()).hexdigest() + ".json")
    if path.exists() and not _refresh:
        try:
            cached = json.loads(path.read_text())
            _bump(source, "cache")
            return Fetched(cached["data"], cached["status"], cached["url"], cached["fetched_at"], True)
        except (json.JSONDecodeError, KeyError):
            path.unlink(missing_ok=True)  # corrupt cache file -> refetch

    host = urlsplit(url).netloc
    send_params = {**(params or {}), **(secret_params or {})} or None
    last_error = ""
    for attempt in range(MAX_ATTEMPTS):
        _wait_for_slot(host)
        try:
            response = _client.request(method, url, params=send_params, json=body, headers=headers)
        except httpx.TransportError as exc:
            last_error = type(exc).__name__
            _bump(source, "retries")
            time.sleep(min(60, 2 ** attempt) + random.random())
            continue
        _bump(source, "network")
        if response.status_code in (429, 500, 502, 503, 504):
            last_error = f"HTTP {response.status_code}"
            _bump(source, "retries")
            retry_after = response.headers.get("Retry-After", "")
            wait = float(retry_after) if retry_after.replace(".", "", 1).isdigit() else min(60, 2 ** attempt * 2)
            time.sleep(wait + random.random())
            continue
        if response.status_code == 404:
            return _store(path, full_url, method, body, None, 404)
        if response.status_code >= 400:
            _bump(source, "errors")
            raise FetchError(f"HTTP {response.status_code} for {full_url}: {response.text[:200]!r}")
        try:
            data = response.json()
        except json.JSONDecodeError as exc:
            _bump(source, "errors")
            raise FetchError(f"non-JSON answer for {full_url}: {response.text[:120]!r}") from exc
        return _store(path, full_url, method, body, data, response.status_code)
    _bump(source, "errors")
    raise FetchError(f"gave up after {MAX_ATTEMPTS} attempts ({last_error}) for {full_url}")


def _store(path: Path, url: str, method: str, body: object | None, data: object, status: int) -> Fetched:
    fetched_at = now_iso()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(f".{threading.get_ident()}.tmp")
    tmp.write_text(json.dumps({"url": url, "method": method, "body": body, "fetched_at": fetched_at,
                               "status": status, "data": data}, ensure_ascii=False))
    os.replace(tmp, path)
    return Fetched(data, status, url, fetched_at, False)


def get_json(source: str, url: str, *, params: dict | None = None, secret_params: dict | None = None,
             headers: dict | None = None) -> Fetched:
    return request_json(source, "GET", url, params=params, secret_params=secret_params, headers=headers)


def post_json(source: str, url: str, body: object, *, params: dict | None = None) -> Fetched:
    return request_json(source, "POST", url, params=params, body=body, headers={"Content-Type": "application/json"})


def parallel_map(label: str, function, items: list, workers: int = 1, every: int = 25) -> list:
    """Ordered map with a few worker threads and a one-line progress log (the host rate limit still applies)."""
    total = len(items)
    started = time.monotonic()
    done = 0
    lock = threading.Lock()
    last_log = [started]

    def run(item):
        nonlocal done
        result = function(item)
        with lock:
            done += 1
            if done == total or done % every == 0 or time.monotonic() - last_log[0] > 30:
                last_log[0] = time.monotonic()
                stats = STATS[label.split(":")[0]]
                print(f"[{label}] {done}/{total} · net {stats['network']} cache {stats['cache']} · {time.monotonic() - started:.0f}s", flush=True)
        return result

    if workers <= 1:
        return [run(item) for item in items]
    with ThreadPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(run, items))
