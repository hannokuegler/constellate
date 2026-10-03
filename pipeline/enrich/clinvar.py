"""ClinVar via NCBI E-utilities -> number of pathogenic / likely pathogenic variants per gene (count + search URL only).

The CLNSIG field of older docs is not searchable anymore; ClinVar's [Properties] values "clinsig pathogenic" and
"clinsig likely pathogenic" are. NCBI_API_KEY (optional, .env.local) lifts the limit from 3 to 10 req/s and never enters
cache keys, stored URLs or logs.
"""
from __future__ import annotations

import os
from urllib.parse import quote_plus

from .http import FetchError, get_json, now_iso, parallel_map

SOURCE = "clinvar"
URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
TERMS = {
    "pathogenic": '{g}[gene] AND "clinsig pathogenic"[Properties]',
    "likely_pathogenic": '{g}[gene] AND "clinsig likely pathogenic"[Properties]',
    "pathogenic_or_likely": '{g}[gene] AND ("clinsig pathogenic"[Properties] OR "clinsig likely pathogenic"[Properties])',
    "total_variants": "{g}[gene]",
}


def _count(term: str) -> tuple[int, str, str]:
    key = os.environ.get("NCBI_API_KEY", "").strip()
    response = get_json(SOURCE, URL, params={"db": "clinvar", "term": term, "retmax": 0, "retmode": "json"},
                        secret_params={"api_key": key} if key else None)
    return int(response.data["esearchresult"]["count"]), response.url, response.fetched_at


def count_variants(symbol: str) -> dict:
    record = {"source": SOURCE, "symbol": symbol, "retrieved": now_iso(), "error": None}
    try:
        for name, template in TERMS.items():
            record[name], _, fetched_at = _count(template.format(g=symbol))
            record["retrieved"] = fetched_at
    except (FetchError, KeyError) as exc:
        record["error"] = str(exc)
    term = TERMS["pathogenic_or_likely"].format(g=symbol)
    record["query"] = term
    record["search_url"] = f"https://www.ncbi.nlm.nih.gov/clinvar/?term={quote_plus(term)}"
    return record


def run(symbols: list[str]) -> list[dict]:
    return parallel_map(SOURCE, count_variants, symbols, workers=3)
