"""B6 · Coverage audit: is a zero in data/enrich/coverage.jsonl a real gap or a naming problem?

For every core disease with 0 kept hits for trials (ctgov), papers (europepmc) or grants (reporter) the audit retries
with alternative names that 04 did not use: Orphanet synonyms (en_product1.xml via the ORPHA xref), MONDO synonyms
beyond the ones 04 queried, and OMIM titles (phenotype.hpoa via the OMIM xref). Same whole-word filter as 04 (the
alternative term must occur in conditions/titles/abstract). Verdict per (disease, source):
  recovered  >= 1 record found under an alternative name (names listed)  ·  gap  still 0: a real gap, shown as such
No edges are written; the recovered records are leads for the next enrichment run.
"""
from __future__ import annotations

import csv
import json
import re
import threading
from functools import lru_cache
from pathlib import Path

from lxml import etree

from enrich import ctgov, diseases, europepmc, http, reporter

from .common import OfflineMiss, fetch_json

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ("ctgov", "europepmc", "reporter")
QUERIED_BY_04 = {"ctgov": ctgov.MAX_QUERIES, "europepmc": europepmc.MAX_QUERY_TERMS, "reporter": reporter.MAX_QUERY_TERMS}


@lru_cache(maxsize=1)
def orphanet_synonyms() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for _, disorder in etree.iterparse(str(ROOT / "data" / "raw" / "en_product1.xml"), tag="Disorder"):
        code = disorder.findtext("OrphaCode")
        if code:
            names = [disorder.findtext("Name") or ""] + [s.text or "" for s in disorder.iterfind("SynonymList/Synonym")]
            out[f"ORPHA:{code}"] = [n for n in names if n]
        disorder.clear()
    return out


@lru_cache(maxsize=1)
def omim_titles() -> dict[str, str]:
    out = {}
    with (ROOT / "data" / "raw" / "phenotype.hpoa").open() as fh:
        rows = csv.reader((line for line in fh if not line.startswith("#")), delimiter="\t")
        for row in rows:
            if row and row[0].startswith("OMIM:") and row[0] not in out:
                out[row[0]] = row[1]
    return out


def alternative_terms(disease, source: str) -> list[tuple[str, str]]:
    node = diseases.load_slice()["mondo"][disease.mondo_id]
    used = {diseases.normalize(t).strip() for t in disease.query_terms[:QUERIED_BY_04[source]]}
    candidates: list[tuple[str, str]] = []
    for xref in node.get("xrefs", []):
        if xref.startswith(("Orphanet:", "ORPHA:")):
            for name in orphanet_synonyms().get("ORPHA:" + xref.split(":")[1], []):
                candidates.append((name, xref.replace("Orphanet:", "ORPHA:")))
        if xref.startswith("OMIM:") and xref in omim_titles():
            candidates.append((omim_titles()[xref], xref))
    candidates += [(t, "MONDO synonym") for t in disease.query_terms[QUERIED_BY_04[source]:]]
    out, seen = [], set(used)
    for term, origin in candidates:
        for variant in diseases.variants(term):
            norm = diseases.normalize(variant).strip()
            if len(norm) < diseases.MIN_TERM_LENGTH or norm in diseases.STOP_TERMS or norm in seen or len(norm.split()) < 2 and len(norm) < 6:
                continue
            seen.add(norm)
            out.append((variant, origin))
    return out[: 3 if disease.is_hero else 2]


def _probe(source: str, term: str, offline: bool) -> tuple[int, int, list[str], str]:
    """(raw hits, kept hits, kept record ids, request url) for one alternative term."""
    norm = [diseases.normalize(term).strip()]
    if source == "ctgov":
        response = fetch_json("audit_ctgov", ctgov.URL, params={"query.cond": term, "pageSize": 100, "countTotal": "true",
                                                                "format": "json", "fields": ctgov.FIELDS}, offline=offline)
        data = response.data or {}
        kept = [s["protocolSection"]["identificationModule"]["nctId"] for s in data.get("studies", [])
                if diseases.match_text({"c": diseases.expand_list_field(s["protocolSection"].get("conditionsModule", {}).get("conditions", [])),
                                        "t": s["protocolSection"]["identificationModule"].get("briefTitle", "")}, norm)]
        return data.get("totalCount", 0), len(kept), kept[:10], response.url, response.fetched_at
    if source == "europepmc":
        response = fetch_json("audit_europepmc", europepmc.URL, params={"query": f'TITLE_ABS:"{term}" AND HAS_ABSTRACT:y AND SRC:MED',
                                                                        "format": "json", "resultType": "core", "pageSize": 25,
                                                                        "synonym": "false"}, offline=offline)
        data = response.data or {}
        results = data.get("resultList", {}).get("result", [])
        kept = [r["pmid"] for r in results if r.get("pmid") and diseases.match_text(
            {"t": europepmc.clean(r.get("title")), "a": europepmc.clean(r.get("abstractText"))}, norm)]
        return data.get("hitCount", 0), len(kept), [f"PMID:{p}" for p in kept[:10]], response.url, response.fetched_at
    body = {"criteria": {"advanced_text_search": {"operator": "or", "search_field": "projecttitle,abstracttext", "search_text": f'"{term}"'}},
            "include_fields": ["CoreProjectNum", "ProjectTitle", "AbstractText"], "offset": 0, "limit": 50}
    response = fetch_json("audit_reporter", reporter.URL, body=body, offline=offline)
    data = response.data or {}
    kept = sorted({r["core_project_num"] for r in data.get("results", []) if diseases.match_text(
        {"t": r.get("project_title") or "", "a": r.get("abstract_text") or ""}, norm)})
    return data.get("meta", {}).get("total", 0), len(kept), kept[:10], reporter.URL, response.fetched_at


def run(disease_list, offline: bool = False) -> list[dict]:
    coverage = [json.loads(line) for line in (ROOT / "data" / "enrich" / "coverage.jsonl").read_text().splitlines() if line.strip()]
    zero = {(c["mondo_id"], c["source"]) for c in coverage if c["source"] in SOURCES and (c.get("hits_kept") or 0) == 0 and not c.get("error")}
    tasks = [(d, s) for d in disease_list for s in SOURCES if (d.mondo_id, s) in zero]

    def check(task):
        disease, source = task
        tries = []
        for term, origin in alternative_terms(disease, source):
            try:
                raw, kept, ids, url, fetched_at = _probe(source, term, offline)
                tries.append({"term": term, "origin": origin, "hits_raw": raw, "hits_kept": kept, "records": ids, "url": url,
                              "retrieved": fetched_at[:10]})
            except (http.FetchError, OfflineMiss) as exc:
                tries.append({"term": term, "origin": origin, "error": str(exc)[:160]})
        recovered = [t for t in tries if t.get("hits_kept")]
        return {"mondo_id": disease.mondo_id, "label": disease.label, "source": source, "hits_kept_04": 0,
                "alternative_terms": tries, "verdict": "recovered" if recovered else "gap", "no_alternative_name": not tries,
                "recovered_with": [t["term"] for t in recovered],
                "retrieved": min((t["retrieved"] for t in tries if t.get("retrieved")), default=None)}

    by_source = {s: [t for t in tasks if t[1] == s] for s in SOURCES}
    results: dict[str, list] = {}
    threads = [threading.Thread(target=lambda s=s: results.__setitem__(s, http.parallel_map(f"extra/audit_{s}", check, by_source[s], workers=1)))
               for s in SOURCES]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    out = [r for s in SOURCES for r in results.get(s, [])]
    return sorted(out, key=lambda r: (r["mondo_id"], r["source"]))
