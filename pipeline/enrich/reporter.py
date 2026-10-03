"""NIH RePORTER v2 -> grants per core disease (max 1 req/s).

Query: advanced text search over project title + abstract, operator OR over the quoted label and up to 5 synonyms.
RePORTER returns one record per project and fiscal year; they are grouped by core project number (one grant node,
all fiscal years + awards listed). Noise filter: title or abstract must contain a term as whole words
(hits that only match the NIH thesaurus `terms` field are dropped and counted).
"""
from __future__ import annotations

from .diseases import Disease, coverage_record, match_text
from .http import FetchError, now_iso, parallel_map, post_json

SOURCE = "reporter"
URL = "https://api.reporter.nih.gov/v2/projects/search"
INCLUDE_FIELDS = ["ApplId", "ProjectNum", "CoreProjectNum", "ProjectTitle", "PrincipalInvestigators", "Organization", "FiscalYear",
                  "AwardAmount", "AbstractText", "ProjectStartDate", "ProjectEndDate", "AgencyIcAdmin", "AwardNoticeDate",
                  "ProjectDetailUrl"]
PAGE = 500
MAX_QUERY_TERMS = 6


def raw_cap(disease: Disease) -> int:
    return 1000 if disease.is_hero else 500


def search_text(disease: Disease) -> str:
    return " ".join(f'"{t}"' for t in disease.query_terms[:MAX_QUERY_TERMS])


def fetch_all(text: str, cap: int) -> tuple[list[dict], int, str, str]:
    records: list[dict] = []
    total = 0
    first_fetched = ""
    offset = 0
    while True:
        body = {"criteria": {"advanced_text_search": {"operator": "or", "search_field": "projecttitle,abstracttext", "search_text": text}},
                "include_fields": INCLUDE_FIELDS, "offset": offset, "limit": min(PAGE, cap - offset),
                "sort_field": "fiscal_year", "sort_order": "desc"}
        response = post_json(SOURCE, URL, body)
        data = response.data or {}
        first_fetched = first_fetched or response.fetched_at
        total = data.get("meta", {}).get("total", 0)
        page = data.get("results", [])
        records.extend(page)
        offset += len(page)
        if not page or offset >= min(total, cap):
            break
    return records, total, first_fetched, URL


def group_grants(fy_records: list[dict], disease: Disease, retrieved: str) -> dict[str, dict]:
    """FY records (already noise-filtered, newest first) -> one record per core project number."""
    grants: dict[str, dict] = {}
    for rec in fy_records:
        core = rec["core_project_num"]
        org = rec.get("organization") or {}
        grant = grants.setdefault(core, {
            "source": SOURCE, "core_project_num": core, "project_num": rec["project_num"], "title": rec.get("project_title"),
            "pis": [{"name": " ".join((p.get("full_name") or "").split()), "is_contact": bool(p.get("is_contact_pi")), "profile_id": p.get("profile_id")}
                    for p in rec.get("principal_investigators") or []],
            "organization": org.get("org_name"), "org_city": org.get("org_city"), "org_state": org.get("org_state"), "org_country": org.get("org_country"),
            "institute": (rec.get("agency_ic_admin") or {}).get("abbreviation"),
            "latest_fiscal_year": rec["fiscal_year"], "latest_award": rec.get("award_amount"),
            "start_date": (rec.get("project_start_date") or "")[:10] or None, "end_date": (rec.get("project_end_date") or "")[:10] or None,
            "award_notice_date": (rec.get("award_notice_date") or "")[:10] or None,
            "abstract": " ".join((rec.get("abstract_text") or "").split()) or None, "appl_id": rec.get("appl_id"),
            "url": rec.get("project_detail_url") or f"https://reporter.nih.gov/project-details/{rec.get('appl_id')}",
            "awards": [], "fiscal_years": [], "total_award_fetched": 0, "retrieved": retrieved, "diseases": [],
        })
        grant["awards"].append({"fiscal_year": rec["fiscal_year"], "project_num": rec["project_num"], "amount": rec.get("award_amount")})
        grant["fiscal_years"] = sorted({a["fiscal_year"] for a in grant["awards"]})
        grant["total_award_fetched"] += rec.get("award_amount") or 0
    return grants


def collect(disease: Disease) -> tuple[dict[str, dict], dict]:
    text = search_text(disease)
    query = f"advanced_text_search[projecttitle,abstracttext] OR {text}"
    try:
        records, total, fetched_at, _ = fetch_all(text, raw_cap(disease))
    except FetchError as exc:
        return {}, coverage_record(disease, SOURCE, queries=[{"query": query}], hits_raw=None, hits_kept=0, hits_discarded=0,
                                   retrieved=now_iso(), error=str(exc))
    kept_records: list[dict] = []
    matches: dict[str, tuple[str, list[str]]] = {}
    discarded_projects: set[str] = set()
    for rec in records:
        match = match_text({"title": rec.get("project_title") or "", "abstract": rec.get("abstract_text") or ""}, disease.match_terms)
        if match:
            kept_records.append(rec)
            old = matches.get(rec["core_project_num"])
            if not old or len(match[0]) > len(old[0]):
                matches[rec["core_project_num"]] = match
        else:
            discarded_projects.add(rec["core_project_num"])
    grants = group_grants(kept_records, disease, fetched_at)
    for core, grant in grants.items():
        term, matched_in = matches[core]
        grant["diseases"].append({"mondo_id": disease.mondo_id, "matched_term": term, "matched_in": matched_in, "query": query})
    discarded = len(discarded_projects - set(grants))
    queries = [{"query": query, "url": URL, "total_hits": total, "fetched": len(records), "kept": len(grants), "truncated": total > len(records)}]
    return grants, coverage_record(disease, SOURCE, queries=queries, hits_raw=total, hits_kept=len(grants), hits_discarded=discarded,
                                   retrieved=fetched_at, note="hits_raw counts project-year records; hits_kept counts distinct grants")


def run(diseases: list[Disease]) -> tuple[list[dict], list[dict]]:
    core_diseases = [d for d in diseases if d.is_core]  # spec: grants for core diseases only
    results = parallel_map(SOURCE, collect, core_diseases, workers=1, every=10)
    grants: dict[str, dict] = {}
    for found, _ in results:
        for core, record in found.items():
            if core in grants:
                grants[core]["diseases"].extend(record["diseases"])
            else:
                grants[core] = record
    return list(grants.values()), [coverage for _, coverage in results]
