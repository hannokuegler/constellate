"""data-v2 integration without raw data: 07 step 11 (shard fields, caps, hero minimum, determinism), validate.py v2 checks,
09_metrics (meta.metrics schema with and without inputs). Everything runs on a tiny hand-made export in tmp_path."""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import pytest

import validate
from conftest import load_script

mod = load_script("07_analytics.py", "analytics07")
metrics_mod = load_script("09_metrics.py", "metrics09")

KRABBE, MLD, PMD = "MONDO:0009499", "MONDO:0018868", "MONDO:0010714"
X, Y = "MONDO:0000101", "MONDO:0000102"  # two non-hero core diseases
PARTNERS = [f"MONDO:00002{i:02d}" for i in range(12)]  # kol partners of X without a shard
LABELS = {KRABBE: "Krabbe disease", MLD: "metachromatic leukodystrophy", PMD: "Pelizaeus-Merzbacher disease",
          X: "disease X", Y: "disease Y"}
SHARD_APP_FIELDS = ("assets", "approved_therapies", "newborn_screening", "kol_overlap", "prevalence")


def eid(source: str, target: str, etype: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{etype}".encode()).hexdigest()[:12]


def evidence(db="ClinicalTrials.gov", record="NCT02993796", level="curated", snippet="registry of patients", **extra) -> dict:
    return {"db": db, "origin": db, "record": record, "url": f"https://example.org/{record}", "level": level,
            "date": "2026-10-01", "confidence": 0.9, "snippet": snippet, "retrieved": "2026-10-03", **extra}


def edge(source: str, target: str, etype: str, level="curated", evs=None, **extra) -> dict:
    evs = evs or [evidence(level=level)]
    return {"id": eid(source, target, etype), "source": source, "target": target, "type": etype, "evidence": evs,
            "contradicting": [], "confidence": max(e["confidence"] for e in evs), "level": level,
            "independent_sources": sorted({e["origin"] for e in evs}), **extra}


# --------------------------------------------------------------------------------------------- fixtures: 04b output
def write_extra(d: Path, *, kol=True, prevalence=True) -> Path:
    d.mkdir(parents=True, exist_ok=True)
    nodes, edges = [], []

    def asset(disease, n, asset_type="natural_history_study", conf=0.9, status="RECRUITING"):
        node_id = f"ASSET:NCT{n:08d}"
        nodes.append({"id": node_id, "type": "asset", "label": f"Study {n}", "asset_type": asset_type, "country": "",
                      "status": status, "sponsor": "Sponsor", "enrollment": 40, "source_type": "NCT", "source_id": f"NCT{n:08d}", "url": f"https://clinicaltrials.gov/study/NCT{n:08d}",
                      "check": "machine", "outcome_measures": ["long outcome text"] * 12})
        e = edge(disease, node_id, "has_asset", evs=[evidence(record=f"NCT{n:08d}", confidence=conf)])
        edges.append(e)

    asset(KRABBE, 2993796, "registry")
    nodes.append({"id": "ASSET:scale_loes_score", "type": "asset", "label": "Loes score", "asset_type": "outcome_scale", "country": "",
                  "status": "documented", "source_type": "PMID", "source_id": "123", "url": "https://pubmed.ncbi.nlm.nih.gov/123/", "check": "machine"})
    edges.append(edge(KRABBE, "ASSET:scale_loes_score", "has_asset", evs=[evidence("Europe PMC", "PMID:123", snippet="Loes score")]))
    asset(KRABBE, 1093105, status="WITHDRAWN")  # withdrawn: never an asset
    asset(MLD, 639132, status="WITHDRAWN")
    # one scale node shared by two diseases: 04b keeps the first hit's source on the node
    nodes.append({"id": "ASSET:scale_gmfm", "type": "asset", "label": "GMFM", "asset_type": "outcome_scale", "country": "",
                  "status": "documented", "source_type": "NCT", "source_id": "NCT04628364",
                  "url": "https://clinicaltrials.gov/study/NCT04628364", "check": "machine"})
    edges.append(edge(MLD, "ASSET:scale_gmfm", "has_asset", evs=[evidence("ClinicalTrials.gov", "NCT04628364", snippet="GMFM-88")]))
    edges.append(edge(PMD, "ASSET:scale_gmfm", "has_asset",
                      evs=[{**evidence("Europe PMC", "PMID:42060827", snippet="GMFM"), "url": "https://pubmed.ncbi.nlm.nih.gov/42060827/"}]))
    for i in range(10):
        asset(MLD, 100 + i, status="COMPLETED" if i % 2 else "RECRUITING")
    for i in range(30):
        asset(X, 200 + i, "registry" if i % 2 else "natural_history_study", conf=0.5 + i / 100)
    for drug, authority, date in (("Libmeldy", "EMA", "2020-12-17"), ("Lenmeldy", "FDA", "2024-03-18")):
        nodes.append({"id": f"DRUG:{drug}", "type": "drug", "label": drug, "authority": authority, "approved": date,
                      "holder": "Orchard", "url": "https://example.org", "inn": "atidarsagene autotemcel", "approvals": []})
        edges.append(edge(MLD, f"DRUG:{drug}", "approved_therapy",
                          evs=[evidence(authority, drug, snippet="metachromatic leukodystrophy", date=date)]))
    nodes.append({"id": "COUNTRY:AT", "type": "country", "label": "Austria", "status": "pilot/research", "url": "https://example.org/at",
                  "jurisdiction": "AT"})
    for disease, status, quote in ((MLD, "pilot/research", "MLD research project"), (Y, "screened", "Disease Y is screened")):
        edges.append(edge(disease, "COUNTRY:AT", "screened_in", evs=[evidence(
            "Official newborn screening programme", "https://example.org/at", snippet=f"[{status}] {quote}", verbatim=quote,
            screening_status=status)]))

    overlap = []

    def pair(a, b, n_people, n_records):
        a, b = sorted((a, b))
        formula = f"shared_researchers({a}, {b}) = |P({a}) ∩ P({b})| = {n_people}"
        e = edge(a, b, "kol_overlap", level="inferred", formula=formula,
                 evs=[evidence("Constellate", "04b_enrich_extra/kol", level="inferred", snippet=formula, inferred_formula=formula,
                               person_ids=[f"ORCID:{i}" for i in range(n_people)])])
        edges.append(e)
        people = [{"name": f"Person {i}", "orcid": "0000-0002-1825-0097" if i == 0 else None, "person_key": f"NAME:{i}",
                   "affiliation": "Duke University someone@example.org" if i == 1 else "Duke University",
                   "records": [{"db": "Europe PMC", "record": f"PMID:{1000 + r}", "url": f"https://pubmed.ncbi.nlm.nih.gov/{1000 + r}/"}
                               for r in range(n_records)]} for i in range(n_people)]
        overlap.append({"disease_a": a, "label_a": LABELS.get(a, a), "disease_b": b, "label_b": LABELS.get(b, b),
                        "n_people": n_people, "formula": formula, "edge_id": e["id"], "people": people})

    pair(KRABBE, MLD, 12, 8)
    pair(KRABBE, PMD, 2, 1)
    for i, partner in enumerate(PARTNERS):
        pair(X, partner, 20 - i, 8)
    (d / "extra_edges.json").write_text(json.dumps({"meta": {}, "nodes": nodes, "edges": edges}))
    searched = [
        {"mondo_id": KRABBE, "section": "therapies", "source": "EMA medicine data", "retrieved": "2026-10-03T10:00:00Z", "hits": 0},
        {"mondo_id": KRABBE, "section": "therapies", "source": "openFDA drug label", "retrieved": "2026-10-03", "hits": 0},
        {"mondo_id": KRABBE, "section": "assets", "source": "ClinicalTrials.gov", "retrieved": "2026-10-03", "hits": 2},
        {"mondo_id": KRABBE, "section": "screening", "source": "official NBS programme DE · https://example.org/de",
         "retrieved": None, "hits": 0, "error": "HTTP 403"},
        {"mondo_id": Y, "section": "assets", "source": "ClinicalTrials.gov", "retrieved": "2026-10-03", "hits": 0},
        {"mondo_id": None, "section": "assets", "source": "Europe PMC PMID:21707604", "retrieved": None, "hits": 0},
    ] + [{"mondo_id": m, "section": "kol", "source": "Europe PMC authors", "retrieved": None, "hits": 1} for m in (KRABBE, MLD, Y)]
    (d / "extra_searched.jsonl").write_text("".join(json.dumps(s) + "\n" for s in searched))
    if prevalence:
        prev = [
            {"mondo_id": KRABBE, "type": "Point prevalence", "class": "1-9 / 1 000 000", "value": 0.327, "unit": "per 100 000 (Orphanet ValMoy)",
             "region": "Europe", "validation": "Validated", "references": "123[PMID]", "source": {"db": "Orphanet", "record": "ORPHA:487",
             "url": "https://www.orpha.net"}, "retrieved": "2026-10-01", "snippet": "<Prevalence><ValMoy>0.327</ValMoy></Prevalence>"},
            {"mondo_id": KRABBE, "type": "Birth prevalence", "class": "1-9 / 100 000", "value": 50.0, "unit": "per 100 000 (Orphanet ValMoy)",
             "region": "Worldwide", "validation": "Not yet validated", "references": "", "source": {"db": "Orphanet", "record": "ORPHA:487",
             "url": "https://www.orpha.net"}, "retrieved": "2026-10-01", "snippet": "<Prevalence><ValMoy>0.0</ValMoy></Prevalence>"},
        ]
        for i, (ptype, region, val) in enumerate((("Point prevalence", "Germany", 1.1), ("Point prevalence", "Europe", 1.6),
                                                  ("Birth prevalence", "Worldwide", 0.6), ("Annual incidence", "Italy", 0.3),
                                                  ("Cases/families", "Worldwide", 12.0), ("Point prevalence", "Europe", 2.0))):
            prev.append({"mondo_id": MLD, "type": ptype, "class": "1-9 / 100 000", "value": val, "region": region,
                         "validation": "Validated", "references": "x[PMID]", "ambiguous_xref": i == 5,
                         "source": {"db": "Orphanet", "record": "ORPHA:512", "url": "https://www.orpha.net"}, "retrieved": "2026-10-01",
                         "snippet": f"<Prevalence><Source>x</Source><ValMoy>{val}</ValMoy></Prevalence>"})
        (d / "extra_prevalence.jsonl").write_text("".join(json.dumps(p) + "\n" for p in prev))
        (d / "extra_run_log.jsonl").write_text(json.dumps({"scope": "core", "limit": None, "sources": {"prevalence": {}}}) + "\n")
    if kol:
        (d / "extra_kol_overlap.json").write_text(json.dumps(overlap))
    (d / "extra_metrics.json").write_text(json.dumps({"monarch_spearman": {
        "value": 0.661, "n": 49, "p": 2.4e-7, "source": "Monarch API v3 semsim (HPO profiles, ancestor_information_content), 2026-10-03",
        "ontology_variant": {"value": 0.326, "n": 50, "p": 0.021, "source": "Monarch API v3 semsim compare/<MONDO>/<MONDO>, 2026-10-03"}},
        "coverage": {}, "extract_precision": None}))
    return d


# --------------------------------------------------------------------------------------------- fixtures: tiny export
def write_export(out: Path, v2_fields: dict | None = None, v2_sources=()) -> Path:
    """Contract-conform mini export with a complete hero path; v2 fields attached the way 07 does it."""
    out.mkdir(parents=True, exist_ok=True)
    genes = {"GALC": [KRABBE], "PSAP": [KRABBE, MLD], "ARSA": [MLD]}
    gene_edges = [edge(d, g, "caused_by", evs=[evidence("Orphanet", "ORPHA:487", snippet="gene")]) for g, ds in genes.items() for d in ds]
    arsa_rolled = edge(MLD, "ARSA", "caused_by", level="inferred", formula="roll-up", rolled_up_from=["MONDO:0000999"],
                       evs=[evidence("Constellate", "07", level="inferred", snippet="roll-up")])
    sim = lambda a, b: edge(a, b, "similar_phenotype", level="inferred", formula="simGIC 0.4",  # noqa: E731
                            evs=[evidence("Constellate", "07", level="inferred", snippet="simGIC")])
    sim_km, sim_kp = sim(KRABBE, MLD), sim(KRABBE, PMD)
    index = [{"id": d, "type": "disease", "label": LABELS[d], "synonyms": [], "xrefs": [], "in_core": True, "degree": 1}
             for d in (KRABBE, MLD, PMD, X, Y)]
    index += [{"id": g, "type": "gene", "label": g, "synonyms": [], "xrefs": [], "in_core": True, "degree": 1} for g in genes]
    (out / "index.json").write_text(json.dumps(index))
    core = {"nodes": [{"id": n["id"], "type": n["type"], "label": n["label"], "in_core": True, "n_genes": 1, "n_phenotypes": 0}
                      for n in index], "edges": gene_edges + [sim_km, sim_kp]}
    (out / "core.json").write_text(json.dumps(core))
    meta = {"version": "test", "built_at": "2026-10-04T00:00:00+00:00", "fixture": False,
            "sources": [{"db": "MONDO", "version": "x", "license": "CC-BY 4.0", "url": "https://mondo.monarchinitiative.org"}, *v2_sources],
            "counts": {}, "hero": {"start": KRABBE}}
    (out / "meta.json").write_text(json.dumps(meta))
    nb = lambda other, e, differs: {"id": other, "label": LABELS[other], "edge": e, "shared_phenotypes": [], "shared_genes": [],  # noqa: E731
                                    "mechanism_differs": differs, "mechanism_note": "note"}
    xrefs = {KRABBE: ["Orphanet:487", "OMIM:245200"], MLD: ["Orphanet:512"]}
    for d in (KRABBE, MLD, PMD, X, Y):
        shard = {"node": {"id": d, "label": LABELS[d], "xrefs": xrefs.get(d, []), "children": [], "in_core": True},
                 "genes": [e for e in gene_edges if e["source"] == d] + ([arsa_rolled] if d == MLD else []),
                 "phenotypes": [], "neighbours": [nb(MLD, sim_km, False), nb(PMD, sim_kp, True)] if d == KRABBE else [],
                 "enrichment": {"trials": [], "grants": [], "targets": [], "papers_mentioning": [],
                                "totals": {"trials": 3 if d == KRABBE else 0, "papers_mentioning": 2 if d in (KRABBE, MLD) else 0}}}
        if v2_fields is not None:
            mod.attach_v2(shard, v2_fields.get(d, {}))
        mod.fit_shard(shard)
        mod.dump(out / "disease" / f"{mod.file_safe(d)}.json", shard)
    for g, ds in genes.items():
        mod.dump(out / "gene" / f"{g}.json", {"node": {"id": g, "label": g}, "diseases": [e for e in gene_edges if e["target"] == g]})
    return out


def build(tmp_path: Path, name="out", **kw):
    extra = mod.load_extra(write_extra(tmp_path / f"extra_{name}", **kw))
    neighbours = {KRABBE: {MLD, PMD}, MLD: {KRABBE}, PMD: {KRABBE}, X: {PARTNERS[9]}}
    v2 = mod.build_v2(extra, [KRABBE, MLD, PMD, X, Y], {KRABBE, MLD, PMD, X, Y}, neighbours)
    out = write_export(tmp_path / name, v2["fields"], v2["sources"])
    return v2, out


def shard(out: Path, d: str) -> dict:
    return json.loads((out / "disease" / f"{mod.file_safe(d)}.json").read_text())


# --------------------------------------------------------------------------------------------- 07
def test_fields_land_in_app_format(tmp_path):
    v2, out = build(tmp_path)
    mld = shard(out, MLD)
    for field in ("assets", "approved_therapies", "newborn_screening", "kol_overlap"):
        assert set(mld[field]) == {"items", "items_total", "searched"}
        for it in mld[field]["items"]:
            assert it["edge"]["contradicting"] == []
    therapy = {it["node"]["label"]: it for it in mld["approved_therapies"]["items"]}
    assert set(therapy) == {"Libmeldy", "Lenmeldy"} and therapy["Libmeldy"]["edge"]["evidence"][0]["date"] == "2020-12-17"
    assert therapy["Libmeldy"]["edge"]["level"] == "curated" and therapy["Libmeldy"]["edge"]["target"] == "DRUG:Libmeldy"
    nbs_mld = mld["newborn_screening"]["items"][0]
    assert nbs_mld["node"]["status"] == "pilot/research" and nbs_mld["edge"]["evidence"][0]["snippet"] == "MLD research project"
    assert "verbatim" not in nbs_mld["edge"]["evidence"][0]
    asset = mld["assets"]["items"][0]["node"]
    assert set(asset) == {"id", "label", "asset_type", "country", "status", "source_type", "source_id", "url", "check"}
    krabbe = shard(out, KRABBE)
    assert krabbe["approved_therapies"] == {"items": [], "items_total": 0, "searched": [
        {"source": "EMA medicine data", "retrieved": "2026-10-03", "hits": 0},
        {"source": "openFDA drug label", "retrieved": "2026-10-03", "hits": 0}]}
    assert [it["node"]["asset_type"] for it in krabbe["assets"]["items"]] == ["registry", "outcome_scale"]
    assert krabbe["assets"]["items"][0]["edge"]["level"] == "curated" and "matched_in" not in krabbe["assets"]["items"][0]["edge"]["evidence"][0]
    nbs = krabbe["newborn_screening"]
    assert nbs["items"] == [] and nbs["searched"][0]["source"].endswith("(fetch failed)") and nbs["searched"][0]["error"] == "HTTP 403"
    entry = next(k for k in krabbe["kol_overlap"]["items"] if k["disease"]["id"] == MLD)
    assert entry["disease"] == {"id": MLD, "label": LABELS[MLD]} and entry["edge"]["level"] == "inferred" and entry["edge"]["formula"]
    assert "person_ids" not in entry["edge"]["evidence"][0] and entry["edge"]["evidence"][0]["snippet"] == entry["edge"]["formula"]
    person = entry["people"][1]
    assert set(person) <= {"name", "orcid", "affiliation", "records", "records_total"} and "@" not in json.dumps(entry["people"])
    assert person["affiliation"] == "Duke University" and set(person["records"][0]) == {"db", "record", "url"}
    assert "orcid" not in person and entry["people"][0]["orcid"] == "0000-0002-1825-0097"
    # the pair is in both shards, seen from each side
    assert next(k for k in mld["kol_overlap"]["items"] if k["disease"]["id"] == KRABBE)["edge"]["id"] == entry["edge"]["id"]
    # prevalence: only records with an Orphanet ValMoy (the 0.0 one is 04b's class midpoint: dropped), no XML snippet
    prev = krabbe["prevalence"]
    assert [p["value"] for p in prev] == ["0.327 per 100 000"] and prev[0]["class"] == "1-9 / 1 000 000"
    assert "snippet" not in prev[0] and "references" not in prev[0] and set(prev[0]["source"]) == {"db", "record", "url"}
    # prevalence scope core: every core disease gets the field, empty = searched, nothing found
    assert shard(out, PMD)["prevalence"] == []
    # Y was searched for assets and kol only; PMD for nothing but its kol pair with Krabbe
    assert shard(out, Y)["assets"] == {"items": [], "items_total": 0, "searched": [
        {"source": "ClinicalTrials.gov", "retrieved": "2026-10-03", "hits": 0}]}
    assert "approved_therapies" not in shard(out, Y) and "newborn_screening" not in shard(out, PMD)
    assert [k["disease"]["id"] for k in shard(out, PMD)["kol_overlap"]["items"]] == [KRABBE]
    # meta.sources entries for the new sources, complete
    dbs = {s["db"] for s in v2["sources"]}
    assert any(s.startswith("EMA") for s in dbs) and any(s.startswith("Orphanet epidemiology") for s in dbs)
    assert any(s.startswith("Monarch") for s in dbs)
    assert all(all(s.get(k) for k in ("db", "version", "license", "url")) for s in v2["sources"])
    assert validate.run(out)["errors"] == []


def test_caps_and_hero_minimum(tmp_path, monkeypatch):
    monkeypatch.setattr(mod, "V2_SHARD_BYTES", 100_000)  # caps alone; the 12 KB shrink has its own test
    v2, out = build(tmp_path)
    x = shard(out, X)
    assert len(x["assets"]["items"]) == mod.V2_ASSETS_MAX == 8 and x["assets"]["items_total"] == 30
    types = [it["node"]["asset_type"] for it in x["assets"]["items"]]
    assert types == sorted(types, key=mod.V2_ASSET_ORDER.index)  # natural history first
    kol = x["kol_overlap"]
    # 5 strongest partners plus the graph neighbour PARTNERS[9] (rank 10), nothing else
    assert [k["disease"]["id"] for k in kol["items"]] == PARTNERS[:5] + [PARTNERS[9]] and kol["items_total"] == len(PARTNERS)
    top = kol["items"][0]
    assert len(top["people"]) == 6 and top["people_total"] == 20
    assert all(len(p["records"]) == 2 and p["records_total"] == 8 for p in top["people"])
    # hero: MLD keeps all 11 non-withdrawn assets (10 studies + scale), recruiting before completed
    mld = shard(out, MLD)
    assert len(mld["assets"]["items"]) == 11 and mld["assets"]["items_total"] == 11
    statuses = [it["node"]["status"] for it in mld["assets"]["items"] if it["node"]["asset_type"] == "natural_history_study"]
    assert statuses == ["RECRUITING"] * 5 + ["COMPLETED"] * 5
    entry = next(k for k in mld["kol_overlap"]["items"] if k["disease"]["id"] == KRABBE)
    assert len(entry["people"]) == 6 and entry["people_total"] == 12
    assert v2["stats"]["assets_items_capped"] == 22


def test_v2_fields_fit_the_default_shard_bytes(tmp_path):
    v2, out = build(tmp_path)
    for d in (KRABBE, MLD, PMD, X, Y):
        assert mod.v2_size({k: v for k, v in shard(out, d).items() if k in SHARD_APP_FIELDS}) <= mod.V2_SHARD_BYTES
    assert "over_v2_budget" not in v2["stats"]
    assert PARTNERS[9] in [k["disease"]["id"] for k in shard(out, X)["kol_overlap"]["items"]]


def test_withdrawn_studies_never_exported(tmp_path):
    v2, out = build(tmp_path)
    for d in (KRABBE, MLD):
        ids = {it["node"]["id"] for it in shard(out, d)["assets"]["items"]}
        assert not ids & {"ASSET:NCT01093105", "ASSET:NCT00639132"}
    assert v2["stats"]["assets_withdrawn_skipped"] == 2


def test_scale_from_abstract_is_text_mined_with_own_source(tmp_path):
    _, out = build(tmp_path)
    loes = next(it for it in shard(out, KRABBE)["assets"]["items"] if it["node"]["id"] == "ASSET:scale_loes_score")
    assert loes["edge"]["level"] == "text_mined" and loes["edge"]["evidence"][0]["level"] == "text_mined"
    gmfm_pmd = shard(out, PMD)["assets"]["items"][0]
    assert gmfm_pmd["node"]["source_type"] == "PMID" and gmfm_pmd["node"]["source_id"] == "42060827"
    assert gmfm_pmd["node"]["url"] == "https://pubmed.ncbi.nlm.nih.gov/42060827/" and gmfm_pmd["edge"]["level"] == "text_mined"
    gmfm_mld = next(it for it in shard(out, MLD)["assets"]["items"] if it["node"]["id"] == "ASSET:scale_gmfm")
    assert gmfm_mld["node"]["source_id"] == "NCT04628364" and gmfm_mld["edge"]["level"] == "curated"  # registry stays curated


def test_screening_status_per_edge_not_shared_node(tmp_path):
    _, out = build(tmp_path)
    y = shard(out, Y)["newborn_screening"]["items"][0]
    m = shard(out, MLD)["newborn_screening"]["items"][0]
    assert y["node"]["id"] == m["node"]["id"] == "COUNTRY:AT"
    assert (y["node"]["status"], m["node"]["status"]) == ("screened", "pilot/research")
    assert y["edge"]["evidence"][0]["snippet"] == "Disease Y is screened"


def test_prevalence_cap_order_and_cases(tmp_path):
    _, out = build(tmp_path)
    prev = shard(out, MLD)["prevalence"]
    assert len(prev) == mod.V2_PREVALENCE_MAX == 4
    assert [p["region"] for p in prev] == ["Worldwide", "Worldwide", "Europe", "Italy"]  # ambiguous xref dropped
    cases = next(p for p in prev if p["type"] == "Cases/families")
    assert cases["value"] == "12 cases/families" and cases["unit"] == "cases/families"
    assert next(p for p in prev if p["type"] == "Birth prevalence")["value"] == "0.6 per 100 000"


def test_v2_shrinks_kol_first(tmp_path, monkeypatch):
    monkeypatch.setattr(mod, "V2_SHARD_BYTES", 9_000)
    v2, out = build(tmp_path)
    x = shard(out, X)
    assert mod.v2_size({k: v for k, v in x.items() if k in SHARD_APP_FIELDS}) <= 9_000
    assert len(x["assets"]["items"]) == 8  # assets untouched, kol gave way
    assert PARTNERS[9] in [k["disease"]["id"] for k in x["kol_overlap"]["items"]]  # the graph neighbour pair stays longest


def test_hero_pair_kept_even_outside_top_pairs(tmp_path, monkeypatch):
    monkeypatch.setattr(mod, "V2_KOL_PAIRS_MAX", 1)
    v2, out = build(tmp_path)
    krabbe = shard(out, KRABBE)["kol_overlap"]
    assert [k["disease"]["id"] for k in krabbe["items"]] == [MLD, PMD]  # PMD (2 people) kept: hero pair and neighbour
    assert [k["disease"]["id"] for k in shard(out, X)["kol_overlap"]["items"]] == [PARTNERS[0], PARTNERS[9]]


def test_missing_extra_files_mean_no_fields(tmp_path):
    empty = tmp_path / "empty"
    empty.mkdir()
    assert mod.load_extra(empty) is None
    out = write_export(tmp_path / "out")
    for d in (KRABBE, MLD, X):
        assert not set(SHARD_APP_FIELDS) & set(shard(out, d))
    result = validate.run(out)
    assert result["errors"] == [] and len(result["notes"]) == 3 and all(result["hero"].values())


def test_partial_extra_files(tmp_path):
    v2, out = build(tmp_path, kol=False, prevalence=False)
    krabbe = shard(out, KRABBE)
    assert "kol_overlap" not in krabbe and "prevalence" not in krabbe and "assets" in krabbe


def test_v2_never_in_index_core_or_similarity(tmp_path):
    v2, out = build(tmp_path)
    ids = {n["id"] for n in json.loads((out / "index.json").read_text())}
    assert not any(i.startswith(("ASSET:", "DRUG:", "COUNTRY:", "PERSON:")) for i in ids)
    src = (Path(mod.__file__)).read_text()
    analytics_part = src.split("# ================================================================ 9. export")[0]
    assert "load_extra()" in analytics_part and "build_v2(" not in analytics_part  # loaded after the analytics, used in export only


def test_deterministic_two_runs_byte_identical(tmp_path):
    _, a = build(tmp_path, "a")
    _, b = build(tmp_path, "b")
    files_a = sorted(p.relative_to(a) for p in a.rglob("*.json"))
    assert files_a == sorted(p.relative_to(b) for p in b.rglob("*.json"))
    for rel in files_a:
        assert (a / rel).read_bytes() == (b / rel).read_bytes(), rel


def test_fit_shard_trims_records_not_people(tmp_path, monkeypatch):
    v2, _ = build(tmp_path)
    s = {"node": {"id": KRABBE}, "genes": [], "phenotypes": [], "neighbours": []}
    mod.attach_v2(s, v2["fields"][KRABBE])
    full = len(json.dumps(s, ensure_ascii=False, separators=(",", ":")).encode())
    monkeypatch.setattr(mod, "SHARD_BUDGET", full - 200)
    mod.fit_shard(s)
    entry = next(k for k in s["kol_overlap"]["items"] if k["disease"]["id"] == MLD)
    assert len(entry["people"]) == 6 and entry["people"][0]["records_total"] == 8 and len(entry["people"][0]["records"]) == 1


# --------------------------------------------------------------------------------------------- validate
def broken(out: Path, d: str, change) -> list[str]:
    s = shard(out, d)
    change(s)
    (out / "disease" / f"{mod.file_safe(d)}.json").write_text(json.dumps(s))
    return validate.run(out)["errors"]


@pytest.mark.parametrize("change, message", [
    (lambda s: s.__setitem__("assets", "nope"), "must be an array"),
    (lambda s: s["assets"]["items"][0]["edge"].__setitem__("level", "inferred"), "must be curated or text_mined"),
    (lambda s: s["assets"]["items"][0]["node"].__setitem__("status", "WITHDRAWN"), "withdrawn study"),
    (lambda s: s["assets"]["items"][1]["edge"]["evidence"][0].__setitem__("level", "curated"), "must not be curated"),
    (lambda s: s["kol_overlap"]["items"][0]["people"][0].__setitem__("affiliation", "Duke, Tel. +1 919 555 0100"), "phone number"),
    (lambda s: s["kol_overlap"]["items"][0]["people"][0].__setitem__("phone", "x"), "personal contact keys"),
    (lambda s: s["prevalence"][0].__setitem__("snippet", "<Prevalence/>"), "XML snippet"),
    (lambda s: s["assets"]["items"][0]["edge"]["evidence"][0].__setitem__("snippet", ""), "without snippet"),
    (lambda s: s["assets"]["items"][0]["node"].__setitem__("email", "a@b.org"), "personal contact keys"),
    (lambda s: s["assets"]["items"][0]["edge"].__setitem__("source", MLD), "edge must be has_asset"),
    (lambda s: s["assets"].__setitem__("items_total", 0), "items_total"),
    (lambda s: s["kol_overlap"]["items"][0]["edge"].pop("formula"), "inferred with a formula"),
    (lambda s: s["kol_overlap"]["items"][0]["people"][0].__setitem__("affiliation", "Duke someone@example.org"), "e-mail address"),
    (lambda s: s["kol_overlap"]["items"][0]["edge"].__setitem__("id", "e_123"), "12 hex"),
    (lambda s: s["prevalence"][0].__setitem__("value", 0.327), "display string"),
    (lambda s: s["approved_therapies"]["items"].append({"node": {"id": "DRUG:X", "label": "X"},
                                                         "edge": edge(KRABBE, "DRUG:X", "approved_therapy")}), "Krabbe has no approved_therapy"),
])
def test_validate_detects_broken_fields(tmp_path, change, message):
    _, out = build(tmp_path)
    errors = broken(out, KRABBE, change)
    assert any(message in e for e in errors), errors


def test_validate_unbelegt_item_may_lack_snippet(tmp_path):
    _, out = build(tmp_path)

    def unbelegt(s):
        s["newborn_screening"]["items"].append({"node": {"id": "COUNTRY:DE", "label": "Germany", "status": "UNBELEGT"},
                                                "edge": edge(KRABBE, "COUNTRY:DE", "screened_in", evs=[evidence(snippet="")])})
        s["newborn_screening"]["items_total"] += 1
    assert broken(out, KRABBE, unbelegt) == []


def test_validate_hero_v2_checks(tmp_path):
    _, out = build(tmp_path)
    result = validate.run(out)
    assert {"MLD approved_therapy Libmeldy + Lenmeldy", "Krabbe has no approved_therapy", "Krabbe has >= 1 has_asset"} <= set(result["hero"])
    errors = broken(out, MLD, lambda s: s["approved_therapies"].__setitem__(
        "items", [it for it in s["approved_therapies"]["items"] if it["node"]["label"] != "Lenmeldy"]))
    assert any("Libmeldy + Lenmeldy FAILED" in e for e in errors)
    errors = broken(out, KRABBE, lambda s: s["assets"].__setitem__("items", []))
    assert any("Krabbe has >= 1 has_asset FAILED" in e for e in errors)


def test_validate_rejects_shard_only_nodes_in_index(tmp_path):
    _, out = build(tmp_path)
    index = json.loads((out / "index.json").read_text())
    index.append({"id": "DRUG:Libmeldy", "type": "disease", "label": "Libmeldy", "synonyms": [], "xrefs": [], "in_core": False, "degree": 0})
    (out / "index.json").write_text(json.dumps(index))
    assert any("shard-only" in e for e in validate.run(out)["errors"])


# --------------------------------------------------------------------------------------------- 09
METRIC_KEYS = {"extract_precision", "reconcile_accuracy", "monarch_spearman", "coverage", "hero_regression"}


def run_metrics(tmp_path: Path, out: Path, extra: Path, curated: Path, reconcile: Path) -> dict:
    assert metrics_mod.main(out, extra, curated, reconcile) == 0
    return json.loads((out / "meta.json").read_text())["metrics"]


def test_metrics_without_inputs(tmp_path, monkeypatch):
    monkeypatch.setenv("SOURCE_DATE_EPOCH", "1791072000")  # 2026-10-04
    out = write_export(tmp_path / "out")
    before = json.loads((out / "meta.json").read_text())
    m = run_metrics(tmp_path, out, tmp_path / "none", tmp_path / "none", tmp_path / "none")
    assert set(m) == METRIC_KEYS
    assert m["extract_precision"] is None and m["reconcile_accuracy"] is None and m["monarch_spearman"] is None
    assert m["coverage"] == {"trial": 1, "paper": 2, "asset": None, "org": None, "denominator": 5}
    assert m["hero_regression"] == {"pass": True, "checked_at": "2026-10-04", "checks": 9, "failed": []}
    after = json.loads((out / "meta.json").read_text())
    after.pop("metrics")
    assert after == before  # only meta.metrics changes


def test_metrics_with_inputs_and_deterministic(tmp_path, monkeypatch):
    monkeypatch.setenv("SOURCE_DATE_EPOCH", "1791072000")
    _, out = build(tmp_path)
    extra = tmp_path / "extra_out"
    curated = tmp_path / "curated"
    curated.mkdir()
    with (curated / "extract_review.csv").open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(metrics_mod.REVIEW_COLUMNS)
        w.writerows([["31234567", "c1", "yes", "Recep"], ["31234567", "c2", "no", "Osman"], ["31234568", "c3", "YES", "Recep"],
                     ["31234568", "c3", "yes", "Osman"], ["31234569", "c4", "", "Recep"]])
    with (curated / "orgs.csv").open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["org_name", "url", "orpha_ids", "verified_date"])
        w.writerow(["KrabbeConnect", "https://krabbeconnect.org", "ORPHA:487", "2026-10-03"])
        w.writerow(["Unverified Org", "https://example.org", "ORPHA:512", ""])
    reconcile = tmp_path / "reconcile"
    reconcile.mkdir()
    org_ev = lambda name: evidence("Patient organisation website", "https://krabbeconnect.org", level="inferred",  # noqa: E731
                                   snippet=name, free_text_name=name)
    (reconcile / "org_disease_edges.json").write_text(json.dumps({"meta": {}, "nodes": [{"id": "ORG:krabbeconnect", "label": "KrabbeConnect"},
                                                                                       {"id": "ORG:unverified-org", "label": "Unverified Org"}],
        "edges": [edge(KRABBE, "ORG:krabbeconnect", "advocated_by", evs=[org_ev("Krabbe disease")]),
                  edge(MLD, "ORG:krabbeconnect", "advocated_by", evs=[org_ev("Leukodystrophy")]),
                  edge(MLD, "ORG:unverified-org", "advocated_by", evs=[org_ev("MLD")])]}))
    m = run_metrics(tmp_path, out, extra, curated, reconcile)
    first = (out / "meta.json").read_bytes()
    assert m["extract_precision"]["value"] == round(2 / 3, 3) and m["extract_precision"]["n"] == 3
    assert "extract_review.csv" in m["extract_precision"]["source"]
    assert m["reconcile_accuracy"] == {"value": 0.5, "n": 2, "source": m["reconcile_accuracy"]["source"]}
    ms = m["monarch_spearman"]
    assert ms["value"] == 0.661 and ms["n"] == 49 and ms["secondary"]["value"] == 0.326 and "rho 0.33, n = 50" in ms["source"]
    assert m["coverage"]["asset"] == 4 and m["coverage"]["denominator"] == 5  # Krabbe, MLD, PMD, X have assets
    assert m["hero_regression"]["pass"] is True and m["hero_regression"]["checks"] == 12
    run_metrics(tmp_path, out, extra, curated, reconcile)
    assert (out / "meta.json").read_bytes() == first


def test_metrics_extract_check_fallback(tmp_path):
    curated = tmp_path / "c"
    curated.mkdir()
    (curated / "extract_check.csv").write_text("pmid,claim,snippet,url,check\n1,a,s,u,ok\n2,b,s,u,wrong: mouse\n3,c,s,u,\n")
    r = metrics_mod.extract_precision(curated)
    assert r["value"] == 0.5 and r["n"] == 2 and "extract_check.csv" in r["source"]


def test_metrics_hero_regression_fails(tmp_path):
    _, out = build(tmp_path)
    broken(out, KRABBE, lambda s: s.__setitem__("genes", []))
    h = metrics_mod.hero_regression(out)
    assert h["pass"] is False and "Krabbe shard shows GALC + PSAP" in h["failed"]
