"""Reactome ContentService -> gene (via UniProt from mygene.info) -> pathways (stId, name), human only."""
from __future__ import annotations

from . import mygene
from .http import FetchError, get_json, parallel_map

SOURCE = "reactome"
URL = "https://reactome.org/ContentService/data/mapping/UniProt/{uniprot}/pathways"


def pathways_for(symbol: str) -> dict:
    gene = mygene.resolve(symbol)  # disk-cached, so this is free after the mygene step
    record = {"source": SOURCE, "symbol": symbol, "uniprot": gene["uniprot"], "pathways": [], "retrieved": gene["retrieved"],
              "url": None, "error": gene["error"]}
    if not gene["uniprot"]:
        record["error"] = record["error"] or "no Swiss-Prot id for symbol"
        return record
    try:
        response = get_json(SOURCE, URL.format(uniprot=gene["uniprot"]), params={"species": 9606})
    except FetchError as exc:
        record["error"] = str(exc)
        return record
    record["url"], record["retrieved"] = response.url, response.fetched_at
    for pathway in response.data or []:  # a 404 (cached as None) means: UniProt id not mapped in Reactome
        record["pathways"].append({"st_id": pathway["stId"], "name": pathway["displayName"], "is_in_disease": pathway.get("isInDisease"),
                                   "release_date": pathway.get("releaseDate"), "url": f"https://reactome.org/content/detail/{pathway['stId']}"})
    return record


def run(symbols: list[str]) -> list[dict]:
    return parallel_map(SOURCE, pathways_for, symbols, workers=4)
