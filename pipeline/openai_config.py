"""OpenAI configuration shared by 05_openai_extract and 06_openai_reconcile.

- Loads .env.local from the repo root (python-dotenv, never overrides variables already set in the shell).
- Model IDs come ONLY from the environment. No default model names: a guessed ID is a silent wrong model.
    OPENAI_MODEL_EXTRACT   claims from abstracts (Structured Outputs)       05
    OPENAI_MODEL_JUDGE     picks one of 5 MONDO candidates (Structured Outputs) 06
    OPENAI_MODEL_EMBED     embeddings for the reconcile candidates           06
  Optional: OPENAI_REASONING_EXTRACT / OPENAI_REASONING_JUDGE (sent as reasoning.effort only when set),
            OPENAI_PRICE_<ROLE>="<usd per 1M input>,<usd per 1M output>" for the cost estimate.
- `python pipeline/openai_config.py`          shows which variables are set / missing (no API call)
  `python pipeline/openai_config.py --list`   lists the model IDs this key can use, grouped (one API call)
"""
from __future__ import annotations

import argparse
import os
import random
import sys
import time
from pathlib import Path
from typing import Callable, TypeVar

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.local"
KEY_VAR = "OPENAI_API_KEY"
MODEL_VARS = {"extract": "OPENAI_MODEL_EXTRACT", "judge": "OPENAI_MODEL_JUDGE", "embed": "OPENAI_MODEL_EMBED"}
REASONING_VARS = {"extract": "OPENAI_REASONING_EXTRACT", "judge": "OPENAI_REASONING_JUDGE"}

# USD per 1M tokens (input, output) as documented in docs/RESOURCES.md §1 (official model page, checked 2026-10-03).
# Lookup for the cost estimate only, never used to choose a model. Unknown model -> set OPENAI_PRICE_<ROLE>.
DOCUMENTED_PRICES_PER_MTOK = {"gpt-6-astra": (10.0, 50.0), "gpt-6.1-sol": (2.0, 10.0), "gpt-6-luna": (0.1, 0.5)}

RETRYABLE_STATUS = {408, 409, 429, 500, 502, 503, 504}
T = TypeVar("T")


def load_env() -> None:
    load_dotenv(ENV_FILE, override=False)


def env_file_display() -> str:
    return str(ENV_FILE.relative_to(ROOT)) if ENV_FILE.is_relative_to(ROOT) else str(ENV_FILE)


def api_key() -> str | None:
    load_env()
    return os.environ.get(KEY_VAR, "").strip() or None


def model_for(role: str) -> str | None:
    load_env()
    return os.environ.get(MODEL_VARS[role], "").strip() or None


def reasoning_for(role: str) -> dict | None:
    """{'effort': value} only if OPENAI_REASONING_<ROLE> is set; otherwise the parameter is not sent at all."""
    load_env()
    effort = os.environ.get(REASONING_VARS.get(role, ""), "").strip()
    return {"effort": effort} if effort else None


def missing(roles: list[str], need_key: bool = True) -> list[str]:
    """Names of the environment variables that still have to be set for these roles."""
    names = [KEY_VAR] if need_key and not api_key() else []
    return names + [MODEL_VARS[r] for r in roles if not model_for(r)]


def hint(roles: list[str], purpose: str) -> str:
    absent = missing(roles)
    if not absent:
        return f"OpenAI ready for {purpose}: " + ", ".join(f"{MODEL_VARS[r]}={model_for(r)}" for r in roles)
    return (f"OpenAI not configured for {purpose}: missing {', '.join(absent)} (in {env_file_display()} or the shell). "
            f"Model IDs are never guessed: run `uv run --project pipeline python pipeline/openai_config.py --list` with a key "
            f"and copy the IDs into .env.local.")


def make_client(timeout: float = 120.0):
    """OpenAI client with SDK retries disabled (with_retry below owns backoff, so attempts are not multiplied)."""
    from openai import OpenAI

    key = api_key()
    if not key:
        raise RuntimeError(hint([], "this call"))
    return OpenAI(api_key=key, max_retries=0, timeout=timeout)


def is_retryable(exc: Exception) -> bool:
    import openai

    if getattr(exc, "code", None) == "insufficient_quota":  # a 429 that no amount of waiting fixes
        return False
    if isinstance(exc, (openai.APIConnectionError, openai.RateLimitError, openai.InternalServerError)):  # APITimeoutError is a connection error
        return True
    return isinstance(exc, openai.APIStatusError) and exc.status_code in RETRYABLE_STATUS


def with_retry(call: Callable[[], T], *, attempts: int = 6, base_delay: float = 1.0, max_delay: float = 30.0,
               sleep: Callable[[float], None] = time.sleep) -> T:
    """Exponential backoff with jitter for rate limits, timeouts and 5xx. Other errors are raised immediately."""
    for attempt in range(attempts):
        try:
            return call()
        except Exception as exc:  # noqa: BLE001 - filtered by is_retryable
            if attempt == attempts - 1 or not is_retryable(exc):
                raise
            wait = min(max_delay, _retry_after(exc) or base_delay * 2 ** attempt)
            sleep(wait + random.uniform(0, wait / 4))
    raise AssertionError("unreachable")


def _retry_after(exc: Exception) -> float:
    headers = getattr(getattr(exc, "response", None), "headers", None) or {}
    try:
        return float(headers.get("retry-after", 0) or 0)
    except (TypeError, ValueError):  # HTTP-date form: fall back to exponential backoff
        return 0.0


def price_for(role: str, model: str | None) -> tuple[float, float] | None:
    load_env()
    override = os.environ.get(f"OPENAI_PRICE_{role.upper()}", "").strip()
    if override:
        parts = [float(p) for p in override.split(",")]
        return (parts[0], parts[1] if len(parts) > 1 else 0.0)
    return DOCUMENTED_PRICES_PER_MTOK.get(model or "")


def cost_line(role: str, model: str | None, input_tokens: int, output_tokens: int, calls: int, cached: int) -> str:
    price = price_for(role, model)
    tokens = f"{calls} API calls ({cached} from cache, not billed) · {input_tokens:,} input + {output_tokens:,} output tokens"
    if price is None:
        return f"[cost] {role} {model}: {tokens} · price unknown (set OPENAI_PRICE_{role.upper()}=in,out per 1M tokens)"
    usd = input_tokens / 1e6 * price[0] + output_tokens / 1e6 * price[1]
    return f"[cost] {role} {model}: {tokens} · ≈ {usd:.4f} USD (at {price[0]}/{price[1]} USD per 1M in/out)"


def usage_tokens(usage) -> tuple[int, int]:
    """(input, output) from a Responses or Embeddings usage object; missing fields count as 0."""
    if usage is None:
        return 0, 0
    input_tokens = getattr(usage, "input_tokens", None)
    if input_tokens is None:
        input_tokens = getattr(usage, "prompt_tokens", 0)
    return int(input_tokens or 0), int(getattr(usage, "output_tokens", 0) or 0)


NON_CHAT_MARKERS = ("tts", "whisper", "transcribe", "dall-e", "image", "sora", "moderation", "audio", "realtime", "search", "computer-use")


def group_models(model_ids: list[str]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {"Chat / Responses": [], "Embedding": [], "Other (audio, image, moderation, ...)": []}
    for model_id in sorted(model_ids):
        if "embedding" in model_id:
            groups["Embedding"].append(model_id)
        elif any(marker in model_id for marker in NON_CHAT_MARKERS):
            groups["Other (audio, image, moderation, ...)"].append(model_id)
        else:
            groups["Chat / Responses"].append(model_id)
    return groups


def list_models(client=None) -> int:
    if client is None:
        if not api_key():
            print(f"No {KEY_VAR} found (shell or {env_file_display()}), so the model list cannot be fetched.\n"
                  f"Put the key into .env.local, then run this again and copy the IDs into "
                  f"{', '.join(MODEL_VARS.values())}.")
            return 0
        client = make_client(timeout=30.0)
    ids = [m.id for m in with_retry(lambda: client.models.list()).data]
    for group, members in group_models(ids).items():
        print(f"\n{group} ({len(members)})")
        for model_id in members:
            print(f"  {model_id}")
    print(f"\nSet in .env.local: {MODEL_VARS['extract']}=<chat id> · {MODEL_VARS['judge']}=<chat id> · {MODEL_VARS['embed']}=<embedding id>")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true", help="list the model IDs available to this key (one API call)")
    args = parser.parse_args(argv)
    if args.list:
        return list_models()
    load_env()
    print(f"{KEY_VAR}: {'set' if api_key() else 'MISSING'}")
    for role, var in MODEL_VARS.items():
        print(f"{var}: {model_for(role) or 'MISSING'}")
    for role, var in REASONING_VARS.items():
        print(f"{var}: {os.environ.get(var, '').strip() or '(not sent)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
