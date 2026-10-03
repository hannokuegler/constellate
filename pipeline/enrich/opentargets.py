"""Open Targets Platform GraphQL (POST only; GET answers 500) -> disease -> genes with overall score + datatype scores.

MONDO:0009499 is queried as MONDO_0009499. Default association mode (indirect = includes evidence of descendant diseases,
which is what a parent node like 'metachromatic leukodystrophy' needs). Top 50 targets for hero diseases, top 25 otherwise.
"""
from __future__ import annotations

from .diseases import Disease, coverage_record
from .http import FetchError, now_iso, parallel_map, post_json

SOURCE = "opentargets"
URL = "https://api.platform.opentargets.org/api/v4/graphql"
DISEASE_QUERY = """query($id: String!, $size: Int!) {
  disease(efoId: $id) { id name
    associatedTargets(page: {index: 0, size: $size}) { count
      rows { target { id approvedSymbol approvedName } score datatypeScores { id score } } } } }"""
META_QUERY = "{ meta { dataVersion { year month iteration } } }"


def top_n(disease: Disease) -> int:
    return 50 if disease.is_hero else 25


def data_version() -> str:
    data = (post_json(SOURCE, URL, {"query": META_QUERY}).data or {}).get("data", {}).get("meta", {}).get("dataVersion", {})
    return f"{data.get('year')}.{data.get('month')}" if data else "unknown"


def collect(disease: Disease, version: str) -> tuple[list[dict], dict]:
    query_text = f"disease(efoId:{disease.ot_id}).associatedTargets top {top_n(disease)}"
    try:
        response = post_json(SOURCE, URL, {"query": DISEASE_QUERY, "variables": {"id": disease.ot_id, "size": top_n(disease)}})
    except FetchError as exc:
        return [], coverage_record(disease, SOURCE, queries=[{"query": query_text}], hits_raw=None, hits_kept=0, hits_discarded=0,
                                   retrieved=now_iso(), error=str(exc))
    payload = (response.data or {}).get("data", {}) or {}
    node = payload.get("disease")
    if not node:
        return [], coverage_record(disease, SOURCE, queries=[{"query": query_text, "url": URL, "total_hits": 0}], hits_raw=0, hits_kept=0,
                                   hits_discarded=0, retrieved=response.fetched_at, note="disease id not known to Open Targets")
    associated = node["associatedTargets"]
    rows = []
    for rank, row in enumerate(associated["rows"], start=1):
        target = row["target"]
        rows.append({"source": SOURCE, "mondo_id": disease.mondo_id, "ot_disease_id": node["id"], "ensembl_id": target["id"],
                     "symbol": target["approvedSymbol"], "gene_name": target["approvedName"], "score": round(row["score"], 4),
                     "datatype_scores": {d["id"]: round(d["score"], 4) for d in row["datatypeScores"]}, "rank": rank,
                     "total_associated": associated["count"], "url": f"https://platform.opentargets.org/evidence/{target['id']}/{node['id']}",
                     "data_version": version, "retrieved": response.fetched_at})
    queries = [{"query": query_text, "url": URL, "total_hits": associated["count"], "fetched": len(rows), "kept": len(rows),
                "truncated": associated["count"] > len(rows)}]
    return rows, coverage_record(disease, SOURCE, queries=queries, hits_raw=associated["count"], hits_kept=len(rows), hits_discarded=0,
                                 retrieved=response.fetched_at, note=f"top {top_n(disease)} of {associated['count']} associated targets kept")


def run(diseases: list[Disease]) -> tuple[list[dict], list[dict]]:
    version = data_version()
    results = parallel_map(SOURCE, lambda d: collect(d, version), diseases, workers=4)
    return [row for rows, _ in results for row in rows], [coverage for _, coverage in results]
