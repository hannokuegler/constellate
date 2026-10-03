"""ClinicalTrials.gov API v2 -> trials per disease.

Query: query.cond = MONDO label (parentheses stripped); only if that yields no accepted trial, up to 3 more queries
(un-inverted label variant, then best synonyms). Noise filter: a trial counts only if its conditions, keywords or titles
contain the label or an unambiguous synonym as whole words. NCT ids that CT.gov merged keep their old id in nct_aliases
(e.g. FBX-101: NCT04693598 -> NCT05739643).
"""
from __future__ import annotations

from .diseases import Disease, coverage_record, expand_list_field, match_text
from .http import FetchError, get_json, now_iso, parallel_map

SOURCE = "ctgov"
URL = "https://clinicaltrials.gov/api/v2/studies"
FIELDS = "|".join(["NCTId", "NCTIdAlias", "BriefTitle", "OfficialTitle", "OverallStatus", "Phase", "LeadSponsorName",
                   "LeadSponsorClass", "CollaboratorName", "InterventionType", "InterventionName", "Condition", "Keyword",
                   "StartDate", "PrimaryCompletionDate", "CompletionDate", "LastUpdatePostDate", "EnrollmentCount", "StudyType"])
MAX_QUERIES = 4
PAGE_SIZE = 100


def raw_cap(disease: Disease) -> int:
    return 300 if disease.is_hero else 150


def normalize_study(study: dict, retrieved: str) -> dict:
    p = study["protocolSection"]
    ident, status, sponsor = p["identificationModule"], p.get("statusModule", {}), p.get("sponsorCollaboratorsModule", {})
    design, arms, cond = p.get("designModule", {}), p.get("armsInterventionsModule", {}), p.get("conditionsModule", {})
    nct = ident["nctId"]
    return {
        "source": SOURCE, "nct_id": nct, "nct_aliases": ident.get("nctIdAliases", []),
        "title": ident.get("briefTitle"), "official_title": ident.get("officialTitle"),
        "phases": design.get("phases", []), "status": status.get("overallStatus"),
        "sponsor": sponsor.get("leadSponsor", {}).get("name"), "sponsor_class": sponsor.get("leadSponsor", {}).get("class"),
        "collaborators": [c["name"] for c in sponsor.get("collaborators", [])],
        "interventions": [{"type": i.get("type"), "name": i.get("name")} for i in arms.get("interventions", [])],
        "conditions": cond.get("conditions", []), "keywords": cond.get("keywords", []),
        "start_date": status.get("startDateStruct", {}).get("date"),
        "primary_completion_date": status.get("primaryCompletionDateStruct", {}).get("date"),
        "completion_date": status.get("completionDateStruct", {}).get("date"),
        "last_update": status.get("lastUpdatePostDateStruct", {}).get("date"),
        "enrollment": design.get("enrollmentInfo", {}).get("count"), "study_type": design.get("studyType"),
        "url": f"https://clinicaltrials.gov/study/{nct}", "retrieved": retrieved, "diseases": [],
    }


def search(term: str, cap: int) -> tuple[list[dict], int, str, bool, str]:
    """Run query.cond=<term>; follow pageToken until `cap` raw studies. Returns (studies, totalCount, fetched_at, from_cache, first_url)."""
    studies: list[dict] = []
    token = None
    total = 0
    first_url = ""
    fetched_at, from_cache = "", True
    while len(studies) < cap:
        params = {"query.cond": term, "pageSize": PAGE_SIZE, "countTotal": "true", "format": "json", "fields": FIELDS}
        if token:
            params["pageToken"] = token
        response = get_json(SOURCE, URL, params=params)
        data = response.data or {}
        first_url = first_url or response.url
        fetched_at = fetched_at or response.fetched_at
        from_cache = from_cache and response.from_cache
        total = data.get("totalCount", total)
        studies.extend(data.get("studies", []))
        token = data.get("nextPageToken")
        if not token:
            break
    return studies[:cap], total, fetched_at, from_cache, first_url


def collect(disease: Disease) -> tuple[dict[str, dict], dict]:
    accepted: dict[str, dict] = {}
    queries: list[dict] = []
    raw_total = discarded = 0
    retrieved = None
    error = None
    seen_ids: set[str] = set()
    for term in disease.query_terms[:MAX_QUERIES]:
        if accepted:
            break
        try:
            studies, total, fetched_at, _, url = search(term, raw_cap(disease))
        except FetchError as exc:
            error = str(exc)
            break
        retrieved = retrieved or fetched_at
        kept = 0
        for study in studies:
            record = normalize_study(study, fetched_at)
            if record["nct_id"] in seen_ids:
                continue
            seen_ids.add(record["nct_id"])
            match = match_text({"conditions": expand_list_field(record["conditions"]), "keywords": expand_list_field(record["keywords"]),
                                "brief_title": record["title"] or "", "official_title": record["official_title"] or ""}, disease.match_terms)
            if not match:
                discarded += 1
                continue
            record["diseases"].append({"mondo_id": disease.mondo_id, "matched_term": match[0], "matched_in": match[1], "query": term})
            accepted[record["nct_id"]] = record
            kept += 1
        raw_total += total
        queries.append({"query": term, "url": url, "total_hits": total, "fetched": len(studies), "kept": kept, "truncated": total > len(studies)})
    coverage = coverage_record(disease, SOURCE, queries=queries, hits_raw=raw_total, hits_kept=len(accepted), hits_discarded=discarded,
                               retrieved=retrieved or now_iso(), error=error)
    return accepted, coverage


def run(diseases: list[Disease]) -> tuple[list[dict], list[dict]]:
    results = parallel_map(SOURCE, collect, diseases, workers=2)
    trials: dict[str, dict] = {}
    for accepted, _ in results:
        for nct, record in accepted.items():
            if nct in trials:
                trials[nct]["diseases"].extend(record["diseases"])
            else:
                trials[nct] = record
    return list(trials.values()), [coverage for _, coverage in results]
