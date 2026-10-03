"""Shared helpers for enrich_extra sources.

Public API
----------
fetch_json(source, url, params=None, body=None, offline=False) -> enrich.http.Fetched
    Fetch JSON from a URL, caching under data/cache/extra/<source>/ via enrich.http.request_json.
    Raises OfflineMiss if the item is not cached and offline=True.

fetch_document(source, url, offline=False) -> enrich.http.Fetched
    Fetch an HTML/text document, returning a Fetched whose .data is a dict:
        text          visible, whitespace-normalised plain text (lxml)
        raw_text      original response.text
        final_url     resolved URL (after redirects)
        content_type  Content-Type response header
        body_base64   (only for binary content types)
    Robots.txt is checked for every destination URL (including after redirects).
    Robots are cached under data/cache/extra/robots/; 404 → permit; other errors → fail-closed.
    Raises OfflineMiss  if offline and not cached.
    Raises PolicyBlocked(FetchError) if robots.txt disallows access.
    Raises FetchError for other HTTP/parse failures.

evidence(db, record, url, snippet, source_text, retrieved, *, date=None,
         level='curated', **extra) -> dict
    Build a validated evidence dict.  snippet must be a non-empty exact substring of
    source_text.  Inferred level requires explicit keyword argument inferred_formula.
    Returns a dict with required fields (db, origin, record, url, level, date,
    confidence, snippet, retrieved) plus any **extra fields.

finalize(draft) -> dict
    Deterministic {nodes, edges} from a Draft.  Sorts nodes/edges, deduplicates and
    aggregates evidence.  Asserts no edge-id collisions.  Missing/failed sources must
    not call draft.evidence(); finalize itself adds no positive edges.
"""
from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import random
import re
import threading
import time
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

from lxml import html as lxml_html

from enrich.edges import Draft
from enrich.http import (
    CACHE_DIR,
    MAX_ATTEMPTS,
    TIMEOUT,
    USER_AGENT,
    FetchError,
    Fetched,
    _bump,
    _canonical,
    _client,
    _store,
    _wait_for_slot,
    now_iso,
    request_json,
)

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EXTRA_CACHE = CACHE_DIR / "extra"
ROBOTS_CACHE = EXTRA_CACHE / "robots"
# Default crawl-delay per EBI recommendation
DEFAULT_CRAWL_DELAY = 10.0  # seconds (EBI asks 10 s between requests)
ROBOTS_CRAWL_DELAY = 10.0   # EBI style: respect up to 10 s

# Level ordering (same as enrich.edges)
LEVEL_ORDER = ["observed", "curated", "text_mined", "inferred", "search_hit"]

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class OfflineMiss(LookupError):
    """Requested item is not in the disk cache and offline mode is active."""


class PolicyBlocked(FetchError):
    """robots.txt disallows fetching this URL."""


# ---------------------------------------------------------------------------
# Robots.txt helpers
# ---------------------------------------------------------------------------

_robots_lock = threading.Lock()
_robots_crawl_delay: dict[str, float] = {}  # host -> seconds


def _robots_cache_path(host: str) -> Path:
    safe = re.sub(r"[^\w.\-]", "_", host)
    return ROBOTS_CACHE / f"{safe}.json"


def _fetch_robots_raw(robots_url: str) -> tuple[int, str]:
    """Return (status, body_text); never raises – errors return (status, '')."""
    try:
        _wait_for_slot(urlsplit(robots_url).netloc)
        response = _client.get(robots_url, headers={"User-Agent": USER_AGENT})
        return response.status_code, response.text
    except Exception as exc:  # noqa: BLE001
        log.warning("robots fetch error %s: %s", robots_url, exc)
        return 0, ""


def _load_robots(host: str, offline: bool) -> RobotFileParser | None:
    """Load robots.txt for *host* from cache or network.

    Returns a RobotFileParser or None.
    - 404 → returns a permissive parser.
    - other errors → raises FetchError (fail-closed).
    - offline and not cached → raises OfflineMiss.
    """
    path = _robots_cache_path(host)
    with _robots_lock:
        if path.exists():
            try:
                stored = json.loads(path.read_text())
                status = stored["status"]
                body = stored.get("body", "")
                delay = stored.get("crawl_delay", 0.0)
                _robots_crawl_delay[host] = float(delay) if delay else 0.0
                if status == 404:
                    return _permissive_parser()
                parser = RobotFileParser()
                parser.parse(body.splitlines())
                return parser
            except (json.JSONDecodeError, KeyError):
                path.unlink(missing_ok=True)

        if offline:
            raise OfflineMiss(f"offline: robots.txt for {host} not cached")

        robots_url = f"https://{host}/robots.txt"
        status, body = _fetch_robots_raw(robots_url)

        # Extract Crawl-delay
        crawl_delay = 0.0
        for line in body.splitlines():
            line = line.strip()
            if line.lower().startswith("crawl-delay:"):
                try:
                    crawl_delay = float(line.split(":", 1)[1].strip())
                except ValueError:
                    pass

        stored = {"host": host, "robots_url": robots_url, "status": status,
                  "body": body, "crawl_delay": crawl_delay, "fetched_at": now_iso()}
        ROBOTS_CACHE.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(f".{threading.get_ident()}.tmp")
        tmp.write_text(json.dumps(stored, ensure_ascii=False))
        os.replace(tmp, path)

        _robots_crawl_delay[host] = crawl_delay

        if status == 404:
            return _permissive_parser()
        if status == 0 or (status >= 400 and status != 404):
            raise FetchError(f"robots.txt fetch failed (HTTP {status}) for {host}: fail-closed")

        parser = RobotFileParser()
        parser.parse(body.splitlines())
        return parser


def _permissive_parser() -> RobotFileParser:
    """Return a RobotFileParser that allows everything."""
    parser = RobotFileParser()
    parser.parse([])
    parser.allow_all = True  # type: ignore[attr-defined]
    return parser


def _check_robots(url: str, offline: bool) -> None:
    """Raise PolicyBlocked if robots.txt disallows *url*."""
    host = urlsplit(url).netloc
    if not host:
        return
    parser = _load_robots(host, offline)
    if parser is None:
        return
    # Use longest-specific matching: RobotFileParser does this correctly per RFC
    if not parser.can_fetch(USER_AGENT, url) and not parser.can_fetch("*", url):
        raise PolicyBlocked(f"robots.txt blocks {url}")
    # Respect Crawl-delay
    delay = _robots_crawl_delay.get(host, 0.0)
    if delay > 0:
        effective = min(delay, ROBOTS_CRAWL_DELAY)
        time.sleep(effective)


def check_robots(url: str, offline: bool = False) -> None:
    """Public alias used by reproduce.py: raise PolicyBlocked if robots.txt disallows *url*."""
    _check_robots(url, offline)


# ---------------------------------------------------------------------------
# Cache key helpers
# ---------------------------------------------------------------------------

def _doc_cache_path(source: str, url: str) -> Path:
    key = f"GET\n{url}\n"
    digest = hashlib.sha1(key.encode()).hexdigest()
    return EXTRA_CACHE / source / f"{digest}.json"


def _json_source_name(source: str) -> str:
    return f"extra/{source}"


# ---------------------------------------------------------------------------
# Text extraction from HTML
# ---------------------------------------------------------------------------

_SPACE_RE = re.compile(r"\s+")


def _extract_text(response_text: str, content_type: str) -> str:
    """Extract visible, whitespace-normalised text from an HTML response."""
    ct = (content_type or "").lower()
    if "html" not in ct and "xml" not in ct:
        # Plain text – just normalise whitespace
        return _SPACE_RE.sub(" ", response_text).strip()
    try:
        doc = lxml_html.fromstring(response_text)
        # Remove script/style
        for tag in doc.xpath("//script|//style|//noscript"):
            tag.getparent().remove(tag)
        raw = doc.text_content()
        return _SPACE_RE.sub(" ", raw).strip()
    except Exception:  # noqa: BLE001
        return _SPACE_RE.sub(" ", response_text).strip()


def _is_binary(content_type: str) -> bool:
    ct = (content_type or "").lower().split(";")[0].strip()
    text_types = {"text/", "application/json", "application/xml", "application/xhtml"}
    return not any(ct.startswith(t) for t in text_types)


# ---------------------------------------------------------------------------
# Public: fetch_json
# ---------------------------------------------------------------------------


def fetch_json(source: str, url: str, params: dict | None = None,
               body: object | None = None, offline: bool = False) -> Fetched:
    """Fetch JSON from *url*, caching under data/cache/extra/<source>/.

    Parameters
    ----------
    source:  short identifier used as cache sub-directory name.
    url:     target URL.
    params:  optional query parameters.
    body:    if provided, a POST with JSON body is made; otherwise GET.
    offline: if True and item not cached, raises OfflineMiss immediately.
    """
    cache_source = _json_source_name(source)
    # Check offline before trying network
    if offline:
        method = "POST" if body is not None else "GET"
        full_url, key = _canonical(method, url, params, body)
        path = CACHE_DIR / cache_source / (hashlib.sha1(key.encode()).hexdigest() + ".json")
        if not path.exists():
            raise OfflineMiss(f"offline: {url} not cached under {cache_source}")

    method = "POST" if body is not None else "GET"
    return request_json(cache_source, method, url, params=params, body=body)


# ---------------------------------------------------------------------------
# Public: fetch_document
# ---------------------------------------------------------------------------


def fetch_document(source: str, url: str, offline: bool = False) -> Fetched:
    """Fetch an HTML/text document, returning a Fetched whose .data is a dict.

    The data dict contains:
        text          visible, whitespace-normalised plain text (via lxml)
        raw_text      original response.text
        final_url     resolved URL (after redirects)
        content_type  Content-Type response header
        body_base64   (only for binary content types)

    Robots.txt is checked for every destination URL including after redirects.
    Cache lives under data/cache/extra/<source>/.

    Raises
    ------
    OfflineMiss    if offline and not cached.
    PolicyBlocked  if robots.txt disallows.
    FetchError     for HTTP failures.
    """
    path = _doc_cache_path(source, url)

    # Check cache first
    if path.exists():
        try:
            cached = json.loads(path.read_text())
            return Fetched(cached["data"], cached["status"], cached["url"],
                           cached["fetched_at"], True)
        except (json.JSONDecodeError, KeyError):
            path.unlink(missing_ok=True)

    if offline:
        raise OfflineMiss(f"offline: document {url} not cached")

    # Check robots before first request
    _check_robots(url, offline)

    host = urlsplit(url).netloc
    last_error = ""
    for attempt in range(MAX_ATTEMPTS):
        _wait_for_slot(host)
        try:
            response = _client.get(url, headers={"User-Agent": USER_AGENT})
        except Exception as exc:  # noqa: BLE001
            last_error = type(exc).__name__
            _bump(source, "retries")
            time.sleep(min(60, 2 ** attempt) + random.random())
            continue

        _bump(source, "network")

        # Check robots for final URL if different from original
        final_url = str(response.url)
        if final_url != url:
            _check_robots(final_url, offline=False)

        if response.status_code in (429, 500, 502, 503, 504):
            last_error = f"HTTP {response.status_code}"
            _bump(source, "retries")
            retry_after = response.headers.get("Retry-After", "")
            wait = (float(retry_after) if retry_after.replace(".", "", 1).isdigit()
                    else min(60, 2 ** attempt * 2))
            time.sleep(wait + random.random())
            continue

        if response.status_code == 404:
            return _store_doc(path, url, None, 404)

        if response.status_code >= 400:
            _bump(source, "errors")
            raise FetchError(f"HTTP {response.status_code} for {url}: {response.text[:200]!r}")

        ct = response.headers.get("content-type", "")
        if _is_binary(ct):
            body_b64 = base64.b64encode(response.content).decode()
            data = {
                "text": "",
                "raw_text": "",
                "final_url": final_url,
                "content_type": ct,
                "body_base64": body_b64,
            }
        else:
            raw_text = response.text
            text = _extract_text(raw_text, ct)
            data = {
                "text": text,
                "raw_text": raw_text,
                "final_url": final_url,
                "content_type": ct,
            }

        return _store_doc(path, url, data, response.status_code)

    _bump(source, "errors")
    raise FetchError(f"gave up after {MAX_ATTEMPTS} attempts ({last_error}) for {url}")


def _store_doc(path: Path, url: str, data: object, status: int) -> Fetched:
    """Persist document cache entry and return a Fetched."""
    fetched_at = now_iso()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(f".{threading.get_ident()}.tmp")
    tmp.write_text(json.dumps({"url": url, "fetched_at": fetched_at,
                                "status": status, "data": data}, ensure_ascii=False))
    os.replace(tmp, path)
    return Fetched(data, status, url, fetched_at, False)


# ---------------------------------------------------------------------------
# Public: evidence
# ---------------------------------------------------------------------------


def evidence(
    db: str,
    record: str,
    url: str,
    snippet: str,
    source_text: str,
    retrieved: str,
    *,
    date: str | None = None,
    level: str = "curated",
    **extra: Any,
) -> dict:
    """Build a validated evidence dict.

    Parameters
    ----------
    db          : database display name (e.g. "OrphaNet").
    record      : record identifier (e.g. "ORPHA:586").
    url         : canonical URL for the record.
    snippet     : short text snippet (must be a non-empty exact substring of source_text).
    source_text : the full text from which snippet is drawn; used for validation only.
    retrieved   : ISO date string (YYYY-MM-DD) of retrieval.
    date        : optional publication/update date (YYYY-MM-DD).
    level       : evidence level; one of LEVEL_ORDER.
    **extra     : additional fields; 'inferred_formula' required when level='inferred'.

    Raises
    ------
    ValueError if snippet is empty or not a substring of source_text.
    ValueError if level is not in LEVEL_ORDER.
    ValueError if level='inferred' and inferred_formula not in extra.
    """
    if not snippet:
        raise ValueError("evidence snippet must be non-empty")
    if snippet not in source_text:
        raise ValueError(
            f"snippet is not an exact substring of source_text.\n"
            f"  snippet:     {snippet!r}\n"
            f"  source_text: {source_text[:200]!r}"
        )
    if level not in LEVEL_ORDER:
        raise ValueError(f"level {level!r} not in {LEVEL_ORDER}")
    if level == "inferred" and "inferred_formula" not in extra:
        raise ValueError("level='inferred' requires explicit keyword argument 'inferred_formula'")

    return {
        "db": db,
        "origin": db,
        "record": record,
        "url": url,
        "level": level,
        "date": date or retrieved[:10],
        "confidence": extra.pop("confidence", 0.5),
        "snippet": snippet,
        "retrieved": retrieved[:10],
        **extra,
    }


# ---------------------------------------------------------------------------
# Public: finalize
# ---------------------------------------------------------------------------


def finalize(draft: Draft) -> dict:
    """Produce a deterministic {nodes, edges} from a Draft.

    - Nodes and edges are sorted by id.
    - Evidence within each edge is deduplicated (by (db, record, url)) and aggregated.
    - Edge confidence = max of evidence confidences.
    - Edge level = best (lowest index in LEVEL_ORDER) evidence level.
    - Edge independent_sources = sorted unique set of evidence origins.
    - Asserts no edge-id collisions.
    - Contradicting list is always present (may be empty).
    """
    # Assert no edge-id collisions
    id_counter: Counter[str] = Counter()
    for (src, tgt, etype) in draft.edges:
        from enrich.edges import edge_id
        eid = edge_id(src, tgt, etype)
        id_counter[eid] += 1
    collisions = [eid for eid, count in id_counter.items() if count > 1]
    assert not collisions, f"Edge-id collisions detected: {collisions}"

    # Build sorted nodes
    nodes = sorted(draft.nodes.values(), key=lambda n: n["id"])

    # Build and aggregate edges
    edges_out = []
    for (src, tgt, etype), edge in sorted(draft.edges.items(), key=lambda kv: kv[1]["id"]):
        evs = edge["evidence"]

        # Deduplicate evidence by (db, record, url)
        seen: dict[tuple, dict] = {}
        for ev in evs:
            key = (ev.get("db", ""), ev.get("record", ""), ev.get("url", ""))
            if key not in seen:
                seen[key] = ev
        deduped = list(seen.values())

        if not deduped:
            continue

        # Aggregate
        confidence = max(ev.get("confidence", 0.0) for ev in deduped)
        levels = [ev.get("level", "search_hit") for ev in deduped]
        best_level = min(levels, key=lambda lv: LEVEL_ORDER.index(lv) if lv in LEVEL_ORDER else len(LEVEL_ORDER))
        independent_sources = sorted({ev.get("origin", ev.get("db", "")) for ev in deduped})

        edge_out = {
            "id": edge["id"],
            "source": src,
            "target": tgt,
            "type": etype,
            "evidence": deduped,
            "contradicting": edge.get("contradicting", []),
            "confidence": confidence,
            "level": best_level,
            "independent_sources": independent_sources,
        }
        edges_out.append(edge_out)

    return {"nodes": nodes, "edges": edges_out}
