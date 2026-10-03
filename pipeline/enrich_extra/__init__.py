"""enrich_extra – supplemental enrichment sources with robots-respecting HTTP and document fetching.

Public re-exports from common.py:
    fetch_json      fetch JSON with disk cache, rate-limits, retries, offline mode
    fetch_document  fetch HTML/text page → {text, raw_text, final_url, content_type}
    evidence        build a validated evidence dict
    finalize        deterministic {nodes, edges} from a Draft
    OfflineMiss     raised when item not cached and offline=True
    PolicyBlocked   FetchError subclass raised when robots.txt blocks a URL
"""
from .common import (
    OfflineMiss,
    PolicyBlocked,
    evidence,
    fetch_document,
    fetch_json,
    finalize,
)

__all__ = [
    "OfflineMiss",
    "PolicyBlocked",
    "evidence",
    "fetch_document",
    "fetch_json",
    "finalize",
]
