"""B4 · Researcher network: who works on which core diseases, and which disease pairs share researchers.

Inputs: data/enrich/europepmc.jsonl (authors, ORCID, affiliations of papers matched to a disease), the four hero PMIDs
(15901860, 23348427, 32912261, 21707604, fetched from Europe PMC and matched with the same whole-word filter),
data/enrich/reporter.jsonl (grant PIs with NIH profile id), and ClinicalTrials.gov overall officials of every trial in
data/enrich/ctgov.jsonl and every B1 study (fetched in batches of 50 NCT ids).

Identity (conservative, never fuzzy; rules and ORCID checksum from people.py):
  1. valid ORCID (checksum)          -> ORCID:<id>
  2. NIH RePORTER profile id         -> NIH:<id>          (PIs only; RePORTER's own person id)
  3. exact full name (given name, not only initials) AND exact same institution (the university/hospital/institute
     segment of the affiliation)     -> NAME:<sha1(name|institution)>
  4. otherwise a record-scoped id that never merges.  Same name at two institutions = two people.
No e-mail addresses are stored (affiliation strings are cut before any e-mail).

kol_overlap (inferred): disease A <-> disease B when >= 1 person has records matched to both (pairs where one disease is
a subtype of the other are skipped). Formula in edge.formula and in the snippet. authored_by / investigator_of (curated)
are written only for people in an overlap, to keep the draft small.
"""
from __future__ import annotations

import hashlib
import itertools
import re
from collections import defaultdict

from enrich import ctgov, diseases, europepmc, http
from enrich.edges import Draft, load_jsonl

from .common import OfflineMiss, evidence, fetch_json
from .people import HERO_PMIDS, _clean_affiliation, validate_orcid

INSTITUTION = re.compile(r"univ|hospital|institut|center|centre|college|klinik|clinic|school|foundation|ospedale|hôpital|"
                         r"children's|research|laborator|inserm|cnrs|nih|national|academ", re.I)
EMAIL = re.compile(r"\S+@\S+")
INITIAL = re.compile(r"^[A-Za-z]\.?$")
PLACEHOLDER = re.compile(r"director|study|medical|clinical|trial|sponsor|call cent|monitor|manager|contact|information|"
                         r"department|office|team|investigator|chair|lead|transparency|disclosure|inc\b|ltd\b|gmbh", re.I)
DEGREES = re.compile(r",?\s+(?:M\.?D\.?|Ph\.?D\.?|D\.?O\.?|MBBS|MBChB|FRC\w*|M\.?Sc\.?|MPH|MS|RN|PharmD|Prof\.?|Dr\.?|"
                     r"Professor|DSc|BSc|FAAP|FACMG)(?=[\s,]|$)\.?")  # case-sensitive: "Li Ma" keeps its surname


def institution(affiliation: str | None) -> str | None:
    text = _clean_affiliation(EMAIL.sub("", affiliation or ""))
    if not text:
        return None
    for part in (p.strip(" .;") for p in text.split(",")):
        if INSTITUTION.search(part):
            return part
    return None


def full_name(first: str | None, last: str | None) -> str | None:
    first, last = " ".join((first or "").split()), " ".join((last or "").split())
    if not first or not last or all(INITIAL.match(t) for t in first.replace(".", ". ").split()):
        return None  # initials only: not identifiable
    return f"{first} {last}"


def identity(name: str | None, orcid: str | None, inst: str | None, record_slot: str, nih_profile=None) -> str:
    valid = validate_orcid(orcid)
    if valid:
        return f"ORCID:{valid}"
    if nih_profile:
        return f"NIH:{nih_profile}"
    if name and inst:
        return "NAME:" + hashlib.sha1(f"{name.lower()}|{inst.lower()}".encode()).hexdigest()[:16]
    return "REC:" + hashlib.sha1(record_slot.encode()).hexdigest()[:16]


def _officials(nct_ids: list[str], offline: bool) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for start in range(0, len(nct_ids), 50):
        chunk = nct_ids[start:start + 50]
        try:
            response = fetch_json("ctgov_officials", ctgov.URL, params={
                "filter.ids": ",".join(chunk), "pageSize": 50, "format": "json",
                "fields": "protocolSection.identificationModule.nctId,protocolSection.contactsLocationsModule.overallOfficials"},
                offline=offline)
        except (http.FetchError, OfflineMiss):
            continue
        for study in (response.data or {}).get("studies", []):
            p = study["protocolSection"]
            out[p["identificationModule"]["nctId"]] = [{**o, "retrieved": response.fetched_at}
                                                       for o in p.get("contactsLocationsModule", {}).get("overallOfficials", [])]
    return out


def run(disease_list, offline: bool = False) -> dict:
    in_scope = {d.mondo_id: d for d in disease_list}
    people: dict[str, dict] = {}
    diagnostics: list[dict] = []

    def person(key: str, name: str, orcid: str | None, inst: str | None) -> dict:
        p = people.setdefault(key, {"person_key": key, "name": name, "orcid": validate_orcid(orcid), "institutions": set(),
                                    "diseases": defaultdict(set), "records": {}})
        if inst:
            p["institutions"].add(inst)
        return p

    # papers
    papers = load_jsonl("europepmc")
    have = {p["pmid"] for p in papers}
    for pmid in HERO_PMIDS:
        if pmid in have:
            continue
        try:
            response = fetch_json("people", europepmc.URL, params={"query": f"EXT_ID:{pmid} AND SRC:MED", "format": "json",
                                                                  "resultType": "core"}, offline=offline)
            for result in (response.data or {}).get("resultList", {}).get("result", []):
                paper = europepmc.normalize_paper(result, response.fetched_at)
                for disease in disease_list:
                    match = diseases.match_text({"title": paper["title"], "abstract": paper["abstract"]}, disease.match_terms)
                    if match:
                        paper["diseases"].append({"mondo_id": disease.mondo_id, "matched_term": match[0]})
                papers.append(paper)
        except (http.FetchError, OfflineMiss) as exc:
            diagnostics.append({"type": "fetch_failure", "pmid": pmid, "error": str(exc)[:160]})
    for paper in papers:
        linked = [m["mondo_id"] for m in paper.get("diseases", []) if m["mondo_id"] in in_scope]
        if not linked:
            continue
        record = f"PMID:{paper['pmid']}"
        for index, author in enumerate(paper.get("authors", [])):
            name = full_name(author.get("first_name"), author.get("last_name"))
            affiliation = (author.get("affiliations") or [None])[0]
            inst = institution(affiliation)
            key = identity(name, author.get("orcid"), inst, f"{record}:{index}")
            p = person(key, name or author.get("name") or "", author.get("orcid"), inst)
            p["records"][record] = {"db": "Europe PMC", "record": record, "url": paper["pubmed_url"], "retrieved": paper["retrieved"][:10],
                                    "date": (paper.get("pub_date") or "")[:10] or None,
                                    "verbatim": "; ".join(x for x in [author.get("name"), EMAIL.sub("", affiliation or "").strip()] if x),
                                    "type": "authored_by"}
            for mondo in linked:
                p["diseases"][mondo].add(record)

    # grants
    for grant in load_jsonl("reporter"):
        linked = [m["mondo_id"] for m in grant.get("diseases", []) if m["mondo_id"] in in_scope]
        if not linked:
            continue
        for index, pi in enumerate(grant.get("pis", [])):
            if not pi.get("name"):
                continue
            key = identity(None, None, None, f"{grant['core_project_num']}:{index}", nih_profile=pi.get("profile_id"))
            p = person(key, pi["name"].title() if pi["name"].isupper() else pi["name"], None, grant.get("organization"))
            p["records"][grant["core_project_num"]] = {"db": "NIH RePORTER", "record": grant["core_project_num"], "url": grant["url"],
                                                       "retrieved": grant["retrieved"][:10], "date": grant.get("start_date"),
                                                       "verbatim": f"{pi['name']}; {grant.get('organization') or ''}".strip("; "),
                                                       "type": "investigator_of"}
            for mondo in linked:
                p["diseases"][mondo].add(grant["core_project_num"])

    # trial officials (interventional trials from 04 + observational assets from B1)
    trials = {}
    for trial in load_jsonl("ctgov") + load_jsonl("extra_ctgov"):
        linked = [m["mondo_id"] for m in trial.get("diseases", []) if m["mondo_id"] in in_scope]
        if linked:
            trials.setdefault(trial["nct_id"], set()).update(linked)
    officials = _officials(sorted(trials), offline)
    for nct, linked in sorted(trials.items()):
        for index, official in enumerate(officials.get(nct, [])):
            official = {**official, "affiliation": EMAIL.sub("", official.get("affiliation") or "").strip(" ;,") or None}
            raw = " ".join((official.get("name") or "").split())
            raw = DEGREES.sub("", re.sub(r"^(?:Prof\.?|Dr\.?|Professor)\s+", "", raw, flags=re.I)).strip(" ,")
            if not raw or PLACEHOLDER.search(raw):
                continue  # "Study Director", "Medical Monitor", sponsor names: not a person
            tokens = raw.split()
            name = full_name(" ".join(tokens[:-1]), tokens[-1]) if len(tokens) >= 2 else None
            inst = institution(official.get("affiliation")) or (official.get("affiliation") or "").strip() or None
            key = identity(name, None, inst, f"{nct}:{index}")
            p = person(key, name or raw, None, inst)
            p["records"][nct] = {"db": "ClinicalTrials.gov", "record": nct, "url": f"https://clinicaltrials.gov/study/{nct}",
                                 "retrieved": official["retrieved"][:10], "date": None,
                                 "verbatim": "; ".join(x for x in [official.get("name"), official.get("affiliation")] if x),
                                 "type": "investigator_of"}
            for mondo in linked:
                p["diseases"][mondo].add(nct)

    # overlap
    def related(a: str, b: str) -> bool:
        return a in diseases.descendants(b) or b in diseases.descendants(a)

    pairs: dict[tuple[str, str], list[str]] = defaultdict(list)
    for key, p in people.items():
        if key.startswith("REC:"):
            continue
        for a, b in itertools.combinations(sorted(p["diseases"]), 2):
            if not related(a, b):
                pairs[(a, b)].append(key)
    draft = Draft()
    overlap = []
    kols = set()
    for (a, b), keys in sorted(pairs.items()):
        keys = sorted(keys, key=lambda k: (-len(people[k]["records"]), k))
        kols.update(keys)
        names = [people[k]["name"] for k in keys]
        formula = (f"shared_researchers({a}, {b}) = |P({a}) ∩ P({b})| = {len(keys)}; P(X) = people with >= 1 paper, grant or trial "
                   f"matched to X, identity by ORCID, NIH profile or exact name + institution")
        snippet = f"{formula}; people: {', '.join(names[:8])}{' …' if len(names) > 8 else ''}"
        ev = evidence("Constellate", "04b_enrich_extra/kol", "https://github.com/hannokuegler/constellate/blob/main/pipeline/enrich_extra/kol.py",
                      snippet, snippet, max(r["retrieved"] for k in keys for r in people[k]["records"].values()), level="inferred",
                      confidence=round(min(0.3 + 0.1 * len(keys), 0.7), 2), inferred_formula=formula,
                      person_ids=keys[:50])
        draft.evidence(a, b, "kol_overlap", ev)
        draft.edges[(a, b, "kol_overlap")]["formula"] = formula
        overlap.append({"disease_a": a, "label_a": in_scope[a].label, "disease_b": b, "label_b": in_scope[b].label, "n_people": len(keys),
                        "formula": formula, "edge_id": draft.edges[(a, b, "kol_overlap")]["id"],
                        "people": [{"name": people[k]["name"], "orcid": people[k]["orcid"], "person_key": k,
                                    "affiliation": sorted(people[k]["institutions"])[0] if people[k]["institutions"] else None,
                                    "records": [{"db": r["db"], "record": r["record"], "url": r["url"]}
                                                for rid, r in sorted(people[k]["records"].items())
                                                if rid in people[k]["diseases"][a] | people[k]["diseases"][b]][:12]}
                                   for k in keys]})
    for key in sorted(kols):
        p = people[key]
        node = f"PERSON:{key}"
        draft.node(node, "person", p["name"], orcid=p["orcid"], institutions=sorted(p["institutions"]), diseases=sorted(p["diseases"]))
        for rid, r in sorted(p["records"].items()):
            source, target = (rid, node) if r["type"] == "authored_by" else (node, rid)
            draft.evidence(source, target, r["type"], evidence(r["db"], r["record"], r["url"], r["verbatim"] or rid, r["verbatim"] or rid,
                                                               r["retrieved"], level="curated", date=r["date"], confidence=0.9,
                                                               note="record metadata (author list / PI / overall official)"))
    hero_check = []
    for surname in ("Escolar", "Kurtzberg", "Krägeloh-Mann"):
        found = [p for p in people.values() if surname.lower() in p["name"].lower()]
        diseases_hit = sorted({d for p in found for d in p["diseases"]})
        bridged = [p["person_key"] for p in found if {"MONDO:0009499", "MONDO:0018868"} <= set(p["diseases"])
                   or (any(d in ("MONDO:0009499", *diseases.descendants("MONDO:0009499")) for d in p["diseases"])
                       and any(d in ("MONDO:0018868", *diseases.descendants("MONDO:0018868")) for d in p["diseases"]))]
        hero_check.append({"name": surname, "identities": [p["person_key"] for p in found], "diseases": diseases_hit,
                           "bridges_krabbe_mld": bool(bridged), "bridging_identities": bridged})
    serial = [{"person_key": k, "name": p["name"], "orcid": p["orcid"], "institutions": sorted(p["institutions"]),
               "diseases": {d: sorted(r) for d, r in sorted(p["diseases"].items())}}
              for k, p in sorted(people.items()) if not k.startswith("REC:")]
    searched = []
    for d in disease_list:
        n = sum(1 for p in people.values() if d.mondo_id in p["diseases"] and not p["person_key"].startswith("REC:"))
        searched.append({"mondo_id": d.mondo_id, "section": "kol", "source": "Europe PMC authors, NIH RePORTER PIs, ClinicalTrials.gov officials",
                         "retrieved": None, "hits": sum(1 for o in overlap if d.mondo_id in (o["disease_a"], o["disease_b"])),
                         "people_identified": n})
    return {"people": serial, "overlap": overlap, "draft": draft, "searched": searched,
            "diagnostics": {"hero_check": hero_check, "fetch": diagnostics, "people_total": len(people),
                            "record_scoped": sum(k.startswith("REC:") for k in people)}}
