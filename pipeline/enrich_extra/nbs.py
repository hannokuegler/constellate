"""B1b · Newborn screening per country, only from official programme pages.

Every seed below names an official page and the literal text that states the programme status. At run time the page is
fetched (robots.txt respected, cached under data/cache/extra/screening/) and the snippet must occur verbatim in the page
text; otherwise the row stays UNBELEGT and no edge is written. No negative claim is derived from a disease missing on a
list: "absent from the list" stays UNBELEGT with a note. Subnational programmes get their own COUNTRY:<ISO 3166-2> node so
they never read as nation-wide screening.
"""
from __future__ import annotations

import json
import re

from enrich import http
from enrich.edges import Draft

from .common import EXTRA_CACHE, OfflineMiss, evidence, fetch_document

FAILURES = EXTRA_CACHE / "screening" / "_failures.json"  # fetch errors are cached too, so an offline run reports the same gap

HRSA_RUSP = "https://www.hrsa.gov/advisory-committees/heritable-disorders/rusp"
MEDUNI = ("https://kinder-jugendheilkunde.meduniwien.ac.at/unsere-abteilungen/"
          "klinische-abteilung-fuer-paediatrische-pulmologie-allergologie-und-endokrinologie/neugeborenen-screening/erkrankungen/")
OUS = "https://www.oslo-universitetssykehus.no/avdelinger/barne-og-ungdomsklinikken/nyfodtscreeningen/nyfodtscreening/"
TOSCANA = "https://www.regione.toscana.it/it/-/screening-neonatale"
GBA_PDF = "https://www.g-ba.de/downloads/62-492-3998/Kinder-RL_2025-05-15_iK-2026-01-01.pdf"
TOSCANA_LSD = "sono sei: malattia di Pompe, malattia di Fabry, mucopolisaccaridosi di tipo I, leucodistrofia metacromatica (MLD), malattia di Gaucher e il difetto di"

KRABBE, MLD, POMPE, MPS1, MPS2, XALD, FABRY, GAUCHER, ASMD = (
    "MONDO:0009499", "MONDO:0018868", "MONDO:0009290", "MONDO:0001586", "MONDO:0010674", "MONDO:0018544", "MONDO:0010526",
    "MONDO:0018150", "MONDO:0100464")

RUSP_NOTE = "RUSP is a federal recommendation (table as of January 2023); each state decides implementation."
TOSCANA_NOTE = "Regional programme (Regione Toscana), not the national Italian panel."
SEEDS = [
    # (jurisdiction, label, disease, status, url, literal snippet, note)
    ("US", "United States (RUSP core panel)", KRABBE, "screened", HRSA_RUSP, "Infantile Krabbe Disease", RUSP_NOTE),
    ("US", "United States (RUSP core panel)", POMPE, "screened", HRSA_RUSP, "Type II (Pompe)", RUSP_NOTE),
    ("US", "United States (RUSP core panel)", MPS1, "screened", HRSA_RUSP, "Mucopolysaccharidosis Type I", RUSP_NOTE),
    ("US", "United States (RUSP core panel)", MPS2, "screened", HRSA_RUSP, "Mucopolysaccharidosis Type II", RUSP_NOTE),
    ("US", "United States (RUSP core panel)", XALD, "screened", HRSA_RUSP, "X-linked Adrenoleukodystrophy", RUSP_NOTE),
    ("US-MN", "United States · Minnesota (state programme)", KRABBE, "screened",
     "https://www.health.state.mn.us/news/pressrel/2024/newborn022624.html",
     "Minnesota’s Newborn Screening Program began universal screening today for Krabbe disease",
     "State programme (Minnesota Department of Health, press release 2024-02-26), not all US states."),
    ("US-NY", "United States · New York (state programme)", KRABBE, "screened",
     "https://www.wadsworth.org/programs/newborn/screening/screened-disorders",
     "Krabbe Disease Also Known as globoid cell leukodystrophy or galactosylceramide lipidosis",
     "Listed on the screened-disorders page of the New York State newborn screening program (Wadsworth Center); state only."),
    ("AT", "Austria", MLD, "pilot/research", MEDUNI,
     "Seit Dezember 2024 screenen wir im Rahmen eines Forschungsprojekts auch auf Metachromatische Leukodystrophie (MLD).",
     "Research project within the Austrian newborn screening (MedUni Wien), not yet routine."),
    ("NO", "Norway", MLD, "screened", OUS, "Metakromatisk leukodystrofi (MLD)",
     "Listed under the conditions all newborns are offered screening for (Oslo universitetssykehus)."),
    *[("IT-52", "Italy · Tuscany (regional)", d, "screened", TOSCANA, TOSCANA_LSD, TOSCANA_NOTE)
      for d in (POMPE, FABRY, MPS1, MLD, GAUCHER, ASMD)],
    ("IT-52", "Italy · Tuscany (regional)", XALD, "screened", TOSCANA, "adrenoleucodistrofia legata all’X", TOSCANA_NOTE),
]
# Searched but without an explicit official statement for these hero diseases: shown as UNBELEGT, never as "not screened".
GAP_SOURCES = {
    "US": HRSA_RUSP, "AT": MEDUNI, "NO": OUS, "DE": GBA_PDF, "IT": TOSCANA,
}
GAP_DISEASES = [KRABBE, MLD]


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").replace(" ", " ")).strip()


def _squash(text: str) -> str:
    return re.sub(r"\s+", "", text or "")


def run(disease_list, offline: bool = False) -> dict:
    selected = {d.mondo_id: d for d in disease_list}
    draft = Draft()
    rows, searched = [], []
    pages: dict[str, tuple[str | None, str | None, str | None]] = {}  # url -> (text, fetched_at, error)

    def page(url: str):
        if url not in pages:
            try:
                response = fetch_document("screening", url, offline=offline)
                data = response.data or {}
                text = _norm(data.get("text", "")) if response.status == 200 else None
                pages[url] = (text, response.fetched_at, None if text else f"HTTP {response.status} or no text (PDF)")
            except (http.FetchError, OfflineMiss) as exc:
                failures = json.loads(FAILURES.read_text()) if FAILURES.exists() else {}
                message = str(exc)
                if isinstance(exc, OfflineMiss) and url in failures:
                    pages[url] = (None, None, failures[url])
                else:
                    pages[url] = (None, None, "HTTP 403, host blocks automated access" if "403" in message[:40] else message[:120])
                    if not isinstance(exc, OfflineMiss):
                        FAILURES.parent.mkdir(parents=True, exist_ok=True)
                        FAILURES.write_text(json.dumps({**failures, url: pages[url][2]}, indent=1, sort_keys=True))
        return pages[url]

    covered = set()
    for jurisdiction, label, mondo, status, url, snippet, note in SEEDS:
        if mondo not in selected:
            continue
        disease = selected[mondo]
        country = jurisdiction.split("-")[0]
        covered.add((mondo, country))
        text, fetched_at, error = page(url)
        verified = bool(text) and _squash(snippet) in _squash(text)  # lxml joins block elements without a space
        row = {"asset_id": f"nbs_{jurisdiction}_{mondo.replace(':', '_')}", "asset_type": "newborn_screening",
               "name": f"Newborn screening {label}: {disease.label}", "disease_mondo": mondo, "disease_label": disease.label,
               "country": jurisdiction, "status": status if verified else "UNBELEGT", "source_type": "URL", "source_id": url,
               "url": url, "snippet": _norm(snippet) if verified else "", "retrieved": (fetched_at or "")[:10],
               "check": "machine" if verified else "UNBELEGT",
               "notes": note if verified else f"{note} Snippet could not be verified on the page ({error or 'text not found'})."}
        rows.append(row)
        searched.append({"mondo_id": mondo, "section": "screening", "source": f"{label} · {url}", "retrieved": row["retrieved"] or None,
                         "hits": 1 if verified else 0, "error": None if verified else (error or "snippet not found")})
        if not verified:
            continue
        target = f"COUNTRY:{jurisdiction}"
        draft.node(target, "country", label, status=status, url=url, jurisdiction=jurisdiction)
        ev = evidence("Official newborn screening programme", url, url, _norm(snippet), _norm(snippet), fetched_at, level="curated",
                      confidence=0.9 if "-" not in jurisdiction else 0.8, screening_status=status, status_basis=note)
        ev["snippet"] = f"[{status}] {ev['snippet']}"  # status visible in the snippet; the verbatim part follows the tag
        ev["verbatim"] = _norm(snippet)
        draft.evidence(mondo, target, "screened_in", ev)

    for mondo in GAP_DISEASES:
        if mondo not in selected:
            continue
        for country, url in GAP_SOURCES.items():
            if (mondo, country) in covered:
                continue
            text, fetched_at, error = page(url)
            disease = selected[mondo]
            rows.append({"asset_id": f"nbs_{country}_{mondo.replace(':', '_')}", "asset_type": "newborn_screening",
                         "name": f"Newborn screening {country}: {disease.label}", "disease_mondo": mondo, "disease_label": disease.label,
                         "country": country, "status": "UNBELEGT", "source_type": "URL", "source_id": url, "url": url, "snippet": "",
                         "retrieved": (fetched_at or "")[:10], "check": "UNBELEGT",
                         "notes": "No explicit official statement found for this disease; absence from a list is not read as 'not screened'."
                                  + (f" Fetch: {error}." if error else "")})
            searched.append({"mondo_id": mondo, "section": "screening", "source": f"official NBS programme {country} · {url}",
                             "retrieved": (fetched_at or "")[:10] or None, "hits": 0, "error": error})
    return {"rows": rows, "searched": searched, "draft": draft}
