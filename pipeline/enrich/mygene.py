"""mygene.info -> gene symbol -> UniProt (Swiss-Prot) + Entrez/Ensembl ids + summary. Bridge to Reactome."""
from __future__ import annotations

from .http import FetchError, get_json, now_iso, parallel_map

SOURCE = "mygene"
URL = "https://mygene.info/v3/query"
FIELDS = "symbol,name,uniprot,entrezgene,ensembl.gene,summary"


def _swissprot(hit: dict) -> str | None:
    value = (hit.get("uniprot") or {}).get("Swiss-Prot")
    return value[0] if isinstance(value, list) else value


def resolve(symbol: str) -> dict:
    """Exact symbol first, then alias (e.g. old symbol GBA -> GBA1). Never raises: errors land in the record."""
    record = {"source": SOURCE, "symbol": symbol, "uniprot": None, "entrez_id": None, "ensembl_id": None, "gene_name": None,
              "summary": None, "approved_symbol": None, "resolved_via": None, "retrieved": now_iso(), "error": None, "url": None}
    for scope in ("symbol", "alias"):
        try:
            response = get_json(SOURCE, URL, params={"q": f"{scope}:{symbol}", "species": "human", "fields": FIELDS, "size": 5})
        except FetchError as exc:
            record["error"] = str(exc)
            return record
        hits = (response.data or {}).get("hits", [])
        # exact symbol match first; for alias lookups prefer hits that actually carry a Swiss-Prot id
        hits.sort(key=lambda h: (h.get("symbol", "").upper() != symbol.upper(), _swissprot(h) is None))
        if hits and (scope == "alias" or hits[0].get("symbol", "").upper() == symbol.upper()):
            hit = hits[0]
            ensembl = hit.get("ensembl")
            ensembl = ensembl[0] if isinstance(ensembl, list) else ensembl
            record.update(uniprot=_swissprot(hit), entrez_id=hit.get("entrezgene"), ensembl_id=(ensembl or {}).get("gene"),
                          gene_name=hit.get("name"), summary=hit.get("summary"), approved_symbol=hit.get("symbol"),
                          resolved_via=scope, retrieved=response.fetched_at, url=response.url)
            return record
    record["error"] = "symbol not found in mygene.info"
    return record


def run(symbols: list[str]) -> list[dict]:
    return parallel_map(SOURCE, resolve, symbols, workers=4)
