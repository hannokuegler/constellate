"""B1 · Reusable assets: natural-history / registry / longitudinal studies (ClinicalTrials.gov) and named outcome scales.

Studies: ClinicalTrials.gov API v2, query.cond=<term> restricted to observational studies. A study is an asset only if
"natural history", "registry" or "longitudinal" stands in its brief/official title or the design flags it as a patient
registry, and its conditions/keywords/titles name the disease (same whole-word noise filter as 04/ctgov). Merged NCT ids
are kept as nct_aliases (CT.gov answers the old id with the new record, e.g. NCT04693598 -> NCT05739643).
Snippet = the literal title (or the literal design flag) from the CT.gov record.

Scales: named outcome instruments (GMFC-MLD, GMFM, ...) found verbatim in the outcome measures of those studies or in
the abstracts of data/enrich/europepmc.jsonl (only papers matched to the disease) plus PMID 21707604 (GMFC-MLD).
Snippet = the outcome measure text or the abstract sentence containing the scale name.
"""
from __future__ import annotations

import json
import re

from enrich import ctgov, diseases, europepmc, http
from enrich.edges import Draft, load_jsonl

from .common import OfflineMiss, evidence, fetch_json

NATURAL = re.compile(r"natural[ -]history|registr(?:y|ies)|longitudinal", re.I)
FIELDS = ",".join(["protocolSection.identificationModule", "protocolSection.statusModule",
                   "protocolSection.sponsorCollaboratorsModule.leadSponsor", "protocolSection.conditionsModule",
                   "protocolSection.designModule", "protocolSection.outcomesModule",
                   "protocolSection.contactsLocationsModule.overallOfficials"])
SCALES = {  # canonical name -> literal pattern
    "GMFC-MLD": r"GMFC[- ]?MLD|Gross Motor Function Classification (?:System )?(?:for|in|-) ?(?:MLD|Metachromatic Leukodystrophy)",
    "Gross Motor Function Measure (GMFM)": r"GMFM(?:[- ]?(?:88|66))?|Gross Motor Function Measure",
    "Vineland Adaptive Behavior Scales": r"Vineland",
    "Bayley Scales of Infant Development": r"Bayley",
    "Mullen Scales of Early Learning": r"Mullen Scales",
    "Loes score (MRI)": r"Loes (?:MRI )?score",
    "PedsQL": r"PedsQL",
    "6-minute walk test": r"6[- ]?(?:minute|min) walk(?:ing)? (?:test|distance)|6MWT",
    "Expanded Disability Status Scale (EDSS)": r"\bEDSS\b|Expanded Disability Status Scale",
    "Scale for the Assessment and Rating of Ataxia (SARA)": r"(?-i:\bSARA\b)|Scale for the Assessment and Rating of Ataxia",  # "Sara" is a name
}
SCALE_RE = {name: re.compile(pattern, re.I) for name, pattern in SCALES.items()}
GMFC_PMID = "21707604"
SENTENCE = re.compile(r"[^.!?]*[.!?]")


def _day(value: str | None) -> str | None:
    value = (value or "")[:10]
    return value if len(value) == 10 else (f"{value}-01" if len(value) == 7 else None)


def classify(study: dict) -> tuple[str, str] | None:
    p = study.get("protocolSection", {})
    design = p.get("designModule", {})
    if design.get("studyType") != "OBSERVATIONAL":
        return None
    ident = p.get("identificationModule", {})
    for text in (ident.get("briefTitle") or "", ident.get("officialTitle") or ""):
        match = NATURAL.search(text)
        if match:
            kind = "registry" if match.group(0).lower().startswith("registr") else "natural_history_study"
            return kind, text
    if design.get("patientRegistry"):
        return "registry", "patientRegistry: true"
    return None


def search(term: str, offline: bool) -> tuple[list[dict], dict]:
    studies, token, total, first = [], None, 0, None
    while True:
        params = {"query.cond": term, "filter.advanced": "AREA[StudyType]OBSERVATIONAL", "pageSize": 100,
                  "countTotal": "true", "format": "json", "fields": FIELDS}
        if token:
            params["pageToken"] = token
        response = fetch_json("ctgov_obs", ctgov.URL, params=params, offline=offline)
        first = first or response
        data = response.data or {}
        total = data.get("totalCount", total)
        studies.extend(data.get("studies", []))
        token = data.get("nextPageToken")
        if not token or len(studies) >= 300:
            break
    return studies, {"query": term, "url": first.url, "retrieved": first.fetched_at, "total": total}


def collect(disease, offline: bool) -> tuple[dict[str, dict], dict]:
    found: dict[str, dict] = {}
    queries, error = [], None
    terms = disease.query_terms[:4]
    for index, term in enumerate(terms):
        if index and found and not disease.is_hero:
            break  # like 04/ctgov: further synonyms only while nothing was found (hero diseases: all four)
        try:
            studies, query = search(term, offline)
        except (http.FetchError, OfflineMiss) as exc:
            error = str(exc)[:200]
            break
        queries.append(query)
        for study in studies:
            kind = classify(study)
            if not kind:
                continue
            p = study["protocolSection"]
            record = ctgov.normalize_study(study, query["retrieved"])
            match = diseases.match_text({"conditions": diseases.expand_list_field(record["conditions"]),
                                         "keywords": diseases.expand_list_field(record["keywords"]),
                                         "brief_title": record["title"] or "", "official_title": record["official_title"] or ""},
                                        disease.match_terms)
            if not match:
                continue
            record.update(asset_type=kind[0], classified_by=kind[1], query=term, query_url=query["url"],
                          observational_model=p.get("designModule", {}).get("observationalModel"),
                          time_perspective=p.get("designModule", {}).get("timePerspective"),
                          outcomes=[{"kind": k.replace("Outcomes", ""), "measure": o.get("measure", ""), "time_frame": o.get("timeFrame")}
                                    for k in ("primaryOutcomes", "secondaryOutcomes") for o in p.get("outcomesModule", {}).get(k, [])],
                          officials=[{"name": o.get("name"), "affiliation": o.get("affiliation"), "role": o.get("role")}
                                     for o in p.get("contactsLocationsModule", {}).get("overallOfficials", [])])
            record["diseases"] = [{"mondo_id": disease.mondo_id, "matched_term": match[0], "matched_in": match[1], "query": term}]
            found.setdefault(record["nct_id"], record)
    searched = {"mondo_id": disease.mondo_id, "section": "assets", "source": "ClinicalTrials.gov (observational: natural history, registry, longitudinal)",
                "retrieved": (queries[0]["retrieved"][:10] if queries else None), "hits": len(found), "queries": queries, "error": error}
    return found, searched


CSV_FIELDS = ["asset_id", "asset_type", "name", "disease_mondo", "disease_label", "country", "status", "source_type",
              "source_id", "url", "snippet", "retrieved", "check", "notes"]


def _row(disease, **fields) -> dict:
    row = dict.fromkeys(CSV_FIELDS, "")
    row.update(disease_mondo=disease.mondo_id, disease_label=disease.label, **fields)
    return row


def _scale_id(name: str) -> str:
    return "scale_" + re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")[:40]


def run(disease_list, offline: bool = False) -> dict:
    by_id = {d.mondo_id: d for d in disease_list}
    draft = Draft()
    rows, searched = [], []
    studies: dict[str, dict] = {}
    results = http.parallel_map("extra/ctgov_obs", lambda d: collect(d, offline), disease_list, workers=2)
    for disease, (found, protocol) in zip(disease_list, results):
        searched.append(protocol)
        for nct, record in sorted(found.items()):
            studies.setdefault(nct, {**record, "diseases": []})["diseases"].extend(record["diseases"])
            match = record["diseases"][0]
            target = f"ASSET:{nct}"
            draft.node(target, "asset", record["title"] or nct, asset_type=record["asset_type"], country="",
                       status=record["status"], source_type="NCT", source_id=nct, url=record["url"], check="machine",
                       sponsor=record["sponsor"], start_date=record["start_date"], completion_date=record["completion_date"],
                       enrollment=record["enrollment"], nct_aliases=record["nct_aliases"],
                       outcome_measures=[o["measure"] for o in record["outcomes"]][:12])
            snippet = record["classified_by"]
            draft.evidence(disease.mondo_id, target, "has_asset", evidence(
                "ClinicalTrials.gov", nct, record["url"], snippet, snippet, record["retrieved"], level="curated",
                date=_day(record["last_update"]), confidence=0.9 if "conditions" in match["matched_in"] else 0.7,
                record_aliases=record["nct_aliases"], matched_term=match["matched_term"], matched_in=match["matched_in"]))
            rows.append(_row(disease, asset_id=nct, asset_type=record["asset_type"], name=record["title"] or nct, country="",
                             status=record["status"] or "", source_type="NCT", source_id=nct, url=record["url"], snippet=snippet,
                             retrieved=record["retrieved"][:10], check="machine",
                             notes=json.dumps({"sponsor": record["sponsor"], "start": record["start_date"], "end": record["completion_date"],
                                               "enrollment": record["enrollment"], "aliases": record["nct_aliases"]}, ensure_ascii=False)))
            for outcome in record["outcomes"]:
                for name, pattern in SCALE_RE.items():
                    if pattern.search(outcome["measure"]):
                        _add_scale(draft, rows, disease, name, outcome["measure"], outcome["measure"], "NCT", nct, record["url"],
                                   record["retrieved"], _day(record["last_update"]))

    # scales from abstracts: only papers that 04 matched to the disease, plus the GMFC-MLD validation paper
    papers = load_jsonl("europepmc")
    try:
        response = fetch_json("scales", europepmc.URL, params={"query": f"EXT_ID:{GMFC_PMID} AND SRC:MED", "format": "json",
                                                               "resultType": "core"}, offline=offline)
        for result in (response.data or {}).get("resultList", {}).get("result", []):
            paper = europepmc.normalize_paper(result, response.fetched_at)
            for disease in disease_list:
                match = diseases.match_text({"title": paper["title"], "abstract": paper["abstract"]}, disease.match_terms)
                if match:
                    paper["diseases"].append({"mondo_id": disease.mondo_id})
            papers.append(paper)
    except (http.FetchError, OfflineMiss) as exc:
        searched.append({"mondo_id": None, "section": "assets", "source": f"Europe PMC PMID:{GMFC_PMID}", "retrieved": None, "hits": 0,
                         "error": str(exc)[:200]})
    for paper in papers:
        abstract = paper.get("abstract") or ""
        for link in paper.get("diseases", []):
            disease = by_id.get(link["mondo_id"])
            if not disease:
                continue
            for sentence in SENTENCE.findall(abstract):
                # the paper is only a keyword hit for the disease: the scale counts only if the title or the same
                # sentence names the disease (e.g. a review "in the population with leukodystrophy" is not PMD-specific)
                if not diseases.match_text({"title": paper.get("title") or "", "sentence": sentence}, disease.match_terms):
                    continue
                for name, pattern in SCALE_RE.items():
                    if name == "GMFC-MLD" and disease.mondo_id != "MONDO:0018868" and not disease.label.startswith("metachromatic"):
                        continue  # an MLD-specific scale is attached only to MLD
                    if pattern.search(sentence):
                        _add_scale(draft, rows, disease, name, sentence.strip(), abstract, "PMID", paper["pmid"], paper["pubmed_url"],
                                   paper["retrieved"], _day(paper.get("pub_date")))
    unique = {(r["asset_id"], r["disease_mondo"], r["source_id"]): r for r in rows}
    return {"rows": [unique[k] for k in sorted(unique)], "searched": searched, "draft": draft,
            "studies": [studies[k] for k in sorted(studies)]}


def _add_scale(draft, rows, disease, name, snippet, source_text, source_type, source_id, url, retrieved, date) -> None:
    """CT.gov outcome measure = structured record (curated); a regex find in an abstract = text_mined (origin regex, no LLM)."""
    asset_id = _scale_id(name)
    target = f"ASSET:{asset_id}"
    record = f"PMID:{source_id}" if source_type == "PMID" else source_id
    draft.node(target, "asset", name, asset_type="outcome_scale", country="", status="documented", source_type=source_type,
               source_id=source_id, url=url, check="machine")
    draft.evidence(disease.mondo_id, target, "has_asset", evidence(
        "Europe PMC" if source_type == "PMID" else "ClinicalTrials.gov", record, url, snippet[:400], source_text, retrieved,
        level="curated" if source_type == "NCT" else "text_mined", date=date, confidence=0.6 if source_type == "NCT" else 0.4,
        **({} if source_type == "NCT" else {"origin": "regex"}),
        note="Named instrument used in this record; no claim of validation for this disease."))
    rows.append(_row(disease, asset_id=asset_id, asset_type="outcome_scale", name=name, status="documented", source_type=source_type,
                     source_id=source_id, url=url, snippet=snippet[:400], retrieved=retrieved[:10], check="machine",
                     notes="Literal named measure; no claim of validation or transferability."
                     + ("" if source_type == "NCT" else " Regex find in an abstract (text_mined).")))
