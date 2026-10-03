"""Europe PMC REST -> papers per disease (PubMed records with abstract), input for the later OpenAI extract step.

Query: (TITLE_ABS:"label" OR TITLE_ABS:"synonym" ...) AND HAS_ABSTRACT:y AND SRC:MED, relevance order.
Cap: 10 papers per core disease, 50 per hero disease. Noise filter: title or abstract must contain a term as whole words.
Only a search hit, not a fact: downstream level is "search_hit" until the extract step has read the abstract.
"""
from __future__ import annotations

import html
import re

from .diseases import Disease, coverage_record, match_text, paper_cap
from .http import FetchError, get_json, now_iso, parallel_map

SOURCE = "europepmc"
URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
MAX_QUERY_TERMS = 8
TAG = re.compile(r"<[^>]+>")


def build_query(disease: Disease, hero_terms: int = MAX_QUERY_TERMS) -> str:
    terms = disease.query_terms[:hero_terms]
    clause = " OR ".join(f'TITLE_ABS:"{t}"' for t in terms)
    return f"({clause}) AND HAS_ABSTRACT:y AND SRC:MED"


def clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", html.unescape(TAG.sub(" ", text or ""))).strip()


def normalize_paper(result: dict, retrieved: str) -> dict:
    authors = []
    for a in result.get("authorList", {}).get("author", []):
        affiliations = [x["affiliation"] for x in a.get("authorAffiliationDetailsList", {}).get("authorAffiliation", [])]
        authors.append({"name": a.get("fullName") or a.get("collectiveName"), "first_name": a.get("firstName"), "last_name": a.get("lastName"),
                        "orcid": (a.get("authorId") or {}).get("value") if (a.get("authorId") or {}).get("type") == "ORCID" else None,
                        "affiliations": affiliations})
    pmid = result["pmid"]
    journal = (result.get("journalInfo") or {}).get("journal", {})
    return {"source": SOURCE, "pmid": pmid, "pmcid": result.get("pmcid"), "doi": result.get("doi"), "title": clean(result.get("title")),
            "abstract": clean(result.get("abstractText")), "year": int(result["pubYear"]) if result.get("pubYear") else None,
            "pub_date": result.get("firstPublicationDate"), "journal": journal.get("title"), "authors": authors,
            "cited_by": result.get("citedByCount", 0), "pub_types": result.get("pubTypeList", {}).get("pubType", []),
            "is_open_access": result.get("isOpenAccess") == "Y",
            "url": f"https://europepmc.org/article/MED/{pmid}", "pubmed_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            "retrieved": retrieved, "diseases": []}


def collect(disease: Disease) -> tuple[dict[str, dict], dict]:
    cap = paper_cap(disease)
    query = build_query(disease)
    try:
        response = get_json(SOURCE, URL, params={"query": query, "format": "json", "resultType": "core",
                                                 "pageSize": cap + 10, "synonym": "false"})
    except FetchError as exc:
        return {}, coverage_record(disease, SOURCE, queries=[{"query": query}], hits_raw=None, hits_kept=0, hits_discarded=0,
                                   retrieved=now_iso(), error=str(exc))
    data = response.data or {}
    results = data.get("resultList", {}).get("result", [])
    accepted: dict[str, dict] = {}
    discarded = 0
    for result in results:
        if not result.get("pmid"):
            continue
        record = normalize_paper(result, response.fetched_at)
        match = match_text({"title": record["title"], "abstract": record["abstract"]}, disease.match_terms)
        if not match:
            discarded += 1
            continue
        if len(accepted) >= cap:
            break
        record["diseases"].append({"mondo_id": disease.mondo_id, "matched_term": match[0], "matched_in": match[1],
                                   "rank": len(accepted) + 1})
        accepted[record["pmid"]] = record
    queries = [{"query": query, "url": response.url, "total_hits": data.get("hitCount", 0), "fetched": len(results),
                "kept": len(accepted), "truncated": data.get("hitCount", 0) > len(accepted)}]
    return accepted, coverage_record(disease, SOURCE, queries=queries, hits_raw=data.get("hitCount", 0), hits_kept=len(accepted),
                                     hits_discarded=discarded, retrieved=response.fetched_at)


def run(diseases: list[Disease]) -> tuple[list[dict], list[dict]]:
    results = parallel_map(SOURCE, collect, diseases, workers=3)
    papers: dict[str, dict] = {}
    for accepted, _ in results:
        for pmid, record in accepted.items():
            if pmid in papers:
                papers[pmid]["diseases"].extend(record["diseases"])
            else:
                papers[pmid] = record
    return list(papers.values()), [coverage for _, coverage in results]
