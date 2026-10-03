"""Verifiable registry assets and deliberately explicit screening evidence gaps."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

from enrich import ctgov, diseases, europepmc, http
from enrich.edges import Draft
from .common import evidence, fetch_document, fetch_json, finalize

ROOT = Path(__file__).resolve().parents[2]
CSV_FIELDS = ["asset_id", "asset_type", "name", "disease_mondo", "disease_label", "country", "status",
              "source_type", "source_id", "url", "snippet", "retrieved", "check", "notes"]
NATURAL = re.compile(r"natural history|registr(?:y|ies)|longitudinal", re.I)
SCALE = re.compile(r"GMFC[- ]MLD|gross motor function classification[^.;\n]*|GMFM(?:[- ]\d+)?", re.I)
SCREENING = [
    {"country": "AT", "url": "https://kinder-jugendheilkunde.meduniwien.ac.at/unsere-abteilungen/klinische-abteilung-fuer-paediatrische-pulmologie-allergologie-und-endokrinologie/neugeborenen-screening/erkrankungen/",
     "pattern": r"Seit Dezember 2024[^.]*Forschungsprojekts[^.]*Metachromatische Leukodystrophie[^.]*\.",
     "disease": "MONDO:0018868", "status": "pilot/research", "notes": "Research project, not routine national screening."},
    {"country": "NO", "url": "https://oslo-universitetssykehus.no/avdelinger/barne-og-ungdomsklinikken/nyfodtscreeningen/nyfodtscreening/",
     "pattern": r"Metakromatisk leukodystrofi\s*\(MLD\)", "disease": "MONDO:0018868", "status": "screened",
     "context": "Alle nyfødte", "notes": "Listed in the national newborn screening offer; no implementation date inferred."},
    {"country": "US", "url": "https://www.health.state.mn.us/news/pressrel/2024/newborn022624.html",
     "pattern": r"[^.]*[Kk]rabbe[^.]*\.", "disease": "MONDO:0009499", "status": "screened",
     "context": "screen", "notes": "Minnesota only. Subnational programme, NOT all US states or nationwide implementation.",
     "jurisdiction": "US-MN"},
]
GAP_URLS = {
    "US": "https://www.hrsa.gov/sites/default/files/hrsa/advisory-committees/heritable-disorders/reports-recommendations/infantile-krabbe-final-response.pdf",
    "DE": "https://www.g-ba.de/richtlinien/15/",
    "IT": "https://www.fondazionetelethon.it/en/what-we-do/treatment-diagnosis/newborn-screening",
}


def row(disease, **fields):
    result = dict.fromkeys(CSV_FIELDS, "")
    result.update(disease_mondo=disease.mondo_id, disease_label=disease.label, **fields)
    return result


def add_asset(draft, record, ev):
    target = "ASSET:" + record["asset_id"]
    draft.node(target, "asset", record["name"], asset_type=record["asset_type"], status=record["status"],
               country=record["country"], source_id=record["source_id"], url=record["url"], notes=record["notes"])
    draft.evidence(record["disease_mondo"], target, "has_asset", ev)


def classify_study(study):
    protocol = study.get("protocolSection", {})
    if protocol.get("designModule", {}).get("studyType") != "OBSERVATIONAL":
        return None
    ident = protocol.get("identificationModule", {})
    texts = [ident.get("briefTitle", ""), ident.get("officialTitle", "")]
    design = protocol.get("designModule", {})
    texts.extend(str(design.get(k, "")) for k in ["observationalModel", "timePerspective"])
    # The detailed description can describe interventions unrelated to natural history.
    # Classification is deliberately restricted to title/design, as requested.
    for text in texts:
        if NATURAL.search(text):
            kind = "registry" if re.search(r"registr(?:y|ies)", text, re.I) else "natural_history_study"
            return kind, text
    return None


def run(disease_list, offline=False):
    draft = Draft()
    records, coverage, studies = [], [], {}
    selected = {d.mondo_id: d for d in disease_list}
    for disease in disease_list:
        count, queries, failure, retrieved = 0, [], None, None
        seen = set()
        for term in disease.query_terms[:4]:
            token = None
            while True:
                params = {"query.cond": term, "pageSize": 100, "countTotal": "true", "format": "json"}
                if token:
                    params["pageToken"] = token
                try:
                    response = fetch_json("ctgov", ctgov.URL, params=params, offline=offline)
                except http.FetchError as exc:
                    failure = str(exc)
                    break
                retrieved = response.fetched_at
                payload = response.data or {}
                queries.append({"query": term, "url": response.url, "retrieved": retrieved,
                                "total": payload.get("totalCount"), "page_token": token})
                for study in payload.get("studies", []):
                    classification = classify_study(study)
                    if not classification:
                        continue
                    p = study["protocolSection"]
                    ident = p["identificationModule"]
                    nct = ident["nctId"]
                    if nct in seen:
                        continue
                    match_fields = {"title": ident.get("briefTitle", ""),
                                    "conditions": diseases.expand_list_field(p.get("conditionsModule", {}).get("conditions", []))}
                    if not diseases.match_text(match_fields, disease.match_terms):
                        continue
                    seen.add(nct)
                    kind, snippet = classification
                    normalized = ctgov.normalize_study(study, retrieved)
                    normalized.update(outcomes=p.get("outcomesModule", {}),
                                      officials=p.get("contactsLocationsModule", {}).get("overallOfficials", []),
                                      raw_study=study, source_url=response.url)
                    normalized["diseases"] = [{"mondo_id": disease.mondo_id}]
                    if nct in studies:
                        studies[nct]["diseases"].extend(normalized["diseases"])
                    else:
                        studies[nct] = normalized
                    record = row(disease, asset_id=nct, asset_type=kind, name=normalized["title"],
                                 status=normalized["status"], source_type="NCT", source_id=nct,
                                 url=normalized["url"], snippet=snippet, retrieved=retrieved, check="machine",
                                 notes=json.dumps({k: normalized[k] for k in ["sponsor", "start_date", "completion_date", "enrollment", "outcomes", "nct_aliases"]}, ensure_ascii=False))
                    records.append(record)
                    ev = evidence("ClinicalTrials.gov", nct, response.url, snippet, snippet, retrieved,
                                  date=normalized["last_update"], record_aliases=normalized["nct_aliases"],
                                  matched_in=match_fields)
                    add_asset(draft, record, ev)
                    count += 1
                    for outcomes in normalized["outcomes"].values():
                        for outcome in outcomes:
                            measure = outcome.get("measure", "")
                            if SCALE.search(measure):
                                add_scale(records, draft, disease, measure, measure, nct, "NCT", response.url, retrieved)
                token = payload.get("nextPageToken")
                if not token:
                    break
            if failure:
                break
        coverage.append({"mondo_id": disease.mondo_id, "source": "ClinicalTrials.gov", "record": disease.mondo_id,
                         "url": ctgov.URL, "retrieved": retrieved, "queries": queries, "hits_kept": count,
                         "status": "UNBELEGT" if failure else "searched", "error": failure,
                         "note": "At most four unambiguous disease terms, all result pages; blocked is not zero evidence."})

    papers_path = ROOT / "data/enrich/europepmc.jsonl"
    papers = [json.loads(line) for line in papers_path.read_text(encoding="utf-8").splitlines()] if papers_path.exists() else []
    try:
        response = fetch_json("scales", europepmc.URL,
                              params={"query": "EXT_ID:21707604 AND SRC:MED", "format": "json", "resultType": "core"}, offline=offline)
        papers.extend(europepmc.normalize_paper(p, response.fetched_at) for p in (response.data or {}).get("resultList", {}).get("result", []))
    except http.FetchError as exc:
        coverage.append({"source": "Europe PMC", "record": "PMID:21707604", "url": europepmc.URL,
                         "status": "UNBELEGT", "error": str(exc), "retrieved": None})
    for paper in papers:
        abstract = paper.get("abstract") or ""
        for disease in disease_list:
            if not diseases.match_text({"abstract": abstract}, disease.match_terms):
                continue
            for match in SCALE.finditer(abstract):
                name = match.group(0)
                # A scale mentioned for another disease must not be attached to this one.
                if "mld" in name.lower() and disease.mondo_id != "MONDO:0018868":
                    continue
                add_scale(records, draft, disease, name, abstract, paper["pmid"], "PMID", paper["url"], paper["retrieved"])

    # Country-wide negative claims cannot be proved by a disease name missing from a list.
    screening_rows = {}
    for seed in SCREENING:
        if seed["disease"] not in selected:
            continue
        disease = selected[seed["disease"]]
        record = row(disease, asset_id=f"nbs_{seed['country']}_{disease.mondo_id.replace(':', '_')}",
                     asset_type="newborn_screening", name=f"Newborn screening: {disease.label} ({seed['country']})",
                     country=seed["country"], status="UNBELEGT", source_type="URL", source_id=seed["url"], url=seed["url"],
                     check="UNBELEGT", notes=seed["notes"])
        try:
            response = fetch_document("screening", seed["url"], offline=offline)
            text = response.data["text"]
            match = re.search(seed["pattern"], text)
            context_ok = seed.get("context", "").lower() in text.lower()
            if not match or not context_ok:
                raise ValueError("Expected explicit programme evidence not found; no status inferred from omission")
            snippet = match.group(0)
            record.update(status=seed["status"], check="machine", snippet=snippet, retrieved=response.fetched_at,
                          url=response.data["final_url"])
            ev = evidence("Official screening programme", seed["url"], record["url"], snippet, text, response.fetched_at,
                          screening_status=seed["status"], jurisdiction=seed.get("jurisdiction", seed["country"]),
                          status_basis=seed["notes"])
            add_asset(draft, record, ev)
            # Subnational observations must not masquerade as country-wide screening.
            if not seed.get("jurisdiction"):
                target = "COUNTRY:" + seed["country"]
                draft.node(target, "country", seed["country"])
                draft.evidence(disease.mondo_id, target, "screened_in", ev)
        except (http.FetchError, ValueError, KeyError) as exc:
            record["notes"] += " " + str(exc)
        screening_rows[(disease.mondo_id, seed["country"])] = record
    for mondo in ["MONDO:0009499", "MONDO:0018868"]:
        if mondo not in selected:
            continue
        for country in ["US", "AT", "DE", "IT", "NO"]:
            key = (mondo, country)
            if key not in screening_rows:
                url = GAP_URLS.get(country, next(s["url"] for s in SCREENING if s["country"] == country)) if country not in GAP_URLS else GAP_URLS[country]
                screening_rows[key] = row(selected[mondo], asset_id=f"nbs_{country}_{mondo.replace(':', '_')}",
                                          asset_type="newborn_screening", name=f"Screening evidence gap ({country})", country=country,
                                          status="UNBELEGT", source_type="URL", source_id=url, url=url, check="UNBELEGT",
                                          notes="Candidate source only; no verified explicit programme statement. No negative claim from omission; no retrieval date invented.")
    records.extend(screening_rows.values())
    unique = {(r["asset_id"], r["disease_mondo"], r["source_id"]): r for r in records}
    return {"records": [unique[k] for k in sorted(unique)], "coverage": coverage,
            "ctgov": [studies[k] for k in sorted(studies)], **finalize(draft)}


def add_scale(records, draft, disease, name, source_text, source_id, source_type, url, retrieved):
    asset_id = "scale_" + hashlib.sha1(name.casefold().encode()).hexdigest()[:12]
    record = row(disease, asset_id=asset_id, asset_type="outcome_scale", name=name, status="documented",
                 source_type=source_type, source_id=source_id, url=url, snippet=name, retrieved=retrieved, check="machine",
                 notes="Literal named measure; no claim of validation or transferability to another disease.")
    records.append(record)
    add_asset(draft, record, evidence("Europe PMC" if source_type == "PMID" else "ClinicalTrials.gov",
                                      f"PMID:{source_id}" if source_type == "PMID" else source_id, url, name, source_text, retrieved))
