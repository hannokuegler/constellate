"""04b enrich_extra: format and id rules, verbatim snippets, level rules, conservative identity, determinism.

Unit tests run without network or data. The output tests read data/enrich/extra_*.json(l) and skip when 04b has not run;
the snippet and determinism tests use only the disk cache (--offline), so they never touch the network.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import pytest

from conftest import load_script
from enrich import diseases
from enrich_extra import kol, nbs, therapies
from enrich_extra.common import evidence

REPO = Path(__file__).resolve().parents[2]
ENRICH = REPO / "data" / "enrich"
EDGES = ENRICH / "extra_edges.json"
CURATED_TYPES = {"approved_therapy", "screened_in", "authored_by", "investigator_of"}
EVIDENCE_FIELDS = {"db", "origin", "record", "url", "level", "date", "confidence", "snippet", "retrieved"}
needs_output = pytest.mark.skipif(not EDGES.exists(), reason="run 04b_enrich_extra.py first")


def jsonl(name: str) -> list[dict]:
    path = ENRICH / name
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()] if path.exists() else []


# --- unit: evidence builder -------------------------------------------------------------------------------------------

def test_evidence_requires_verbatim_snippet():
    text = "Libmeldy is indicated for the treatment of metachromatic leukodystrophy (MLD)."
    ev = evidence("EMA", "EMEA/H/C/005321", "https://example.org", "indicated for the treatment of metachromatic", text, "2026-10-03T10:00:00Z")
    assert EVIDENCE_FIELDS <= set(ev) and ev["retrieved"] == "2026-10-03"
    with pytest.raises(ValueError):
        evidence("EMA", "x", "u", "approved for Krabbe disease", text, "2026-10-03")


def test_inferred_needs_formula():
    with pytest.raises(ValueError):
        evidence("Constellate", "x", "u", "a", "a", "2026-10-03", level="inferred")
    assert evidence("Constellate", "x", "u", "a", "a", "2026-10-03", level="inferred", inferred_formula="f")["level"] == "inferred"


# --- unit: conservative identity ----------------------------------------------------------------------------------------

def test_same_name_different_institution_stays_separate():
    a = kol.identity("Maria Escolar", None, "University of Pittsburgh", "PMID:1:0")
    b = kol.identity("Maria Escolar", None, "Duke University", "PMID:2:0")
    c = kol.identity("Maria Escolar", None, "University of Pittsburgh", "PMID:3:4")
    assert a != b and a == c and a.startswith("NAME:")


def test_orcid_wins_and_initials_never_merge():
    assert kol.identity("Joanne Kurtzberg", "0000-0002-3370-0703", "Duke", "x") == "ORCID:0000-0002-3370-0703"
    assert kol.identity("Joanne Kurtzberg", "0000-0002-3370-0704", "Duke", "x").startswith("NAME:")  # bad checksum
    assert kol.full_name("M L", "Escolar") is None and kol.full_name("Maria L", "Escolar") == "Maria L Escolar"
    assert kol.identity(None, None, "Duke", "PMID:1:0") != kol.identity(None, None, "Duke", "PMID:2:0")


def test_phone_numbers_are_scrubbed_but_orcids_kept():
    assert kol.scrub("Dept of Pediatrics, Tel: +49 7071 29-83732, Germany") == "Dept of Pediatrics, , Germany"
    assert kol.scrub("Hospital, +1 (412) 692-5000") == "Hospital"
    assert kol.scrub("ORCID 0000-0002-1825-0097, Tel Aviv University") == "ORCID 0000-0002-1825-0097, Tel Aviv University"


def test_prevalence_value_only_from_valmoy():
    from lxml import etree
    from enrich_extra import prevalence

    def parse(type_, qualification, valmoy):
        xml = (f"<Prevalence id='1'><Source>x</Source><PrevalenceType><Name lang='en'>{type_}</Name></PrevalenceType>"
               f"<PrevalenceQualification><Name lang='en'>{qualification}</Name></PrevalenceQualification>"
               f"<PrevalenceClass><Name lang='en'>1-9 / 1 000 000</Name></PrevalenceClass>"
               + (f"<ValMoy>{valmoy}</ValMoy>" if valmoy is not None else "") + "</Prevalence>")
        return prevalence.parse_prevalence_element(etree.fromstring(xml))

    point = parse("Point prevalence", "Value and class", 0.3)
    assert (point["valmoy"], point["unit"]) == (0.3, "per 100 000") and point["snippet"] in etree.tostring(
        etree.fromstring(point["snippet"]), encoding="unicode")
    assert parse("Prevalence at birth", "Class only", None)["valmoy"] is None  # no midpoint from the class
    assert parse("Prevalence at birth", "Class only", 0)["valmoy"] is None
    assert parse("Cases/families", "Case(s)", 12)["unit"] == "cases"
    assert parse("Cases/families", "Family(ies)", 3)["unit"] == "families"
    assert parse("Annual incidence", "Value and class", 1.2)["unit"] == "per 100 000"


@needs_output
def test_prevalence_output_units():
    for row in jsonl("extra_prevalence.jsonl"):
        has_valmoy = re.search(r"<ValMoy>\s*([0-9.Ee+-]+)\s*</ValMoy>", row["snippet"])  # also 4.0E-4
        if row["value"] is not None:
            assert has_valmoy and float(has_valmoy.group(1)) == row["value"]
            assert row["unit"] == ("per 100 000" if not row["type"].lower().startswith("cases") else row["unit"])
            assert not row["type"].lower().startswith("cases") or row["unit"] in ("cases", "families")


@needs_output
def test_kol_people_sorted_and_counted():
    for pair in json.loads((ENRICH / "extra_kol_overlap.json").read_text())[:300]:
        people = pair["people"]
        assert all(p["n_records_a"] >= 1 and p["n_records_b"] >= 1 for p in people)
        keys = [(not p["independent"], -min(p["n_records_a"], p["n_records_b"])) for p in people]
        assert keys == sorted(keys), pair["edge_id"]
        assert "keyword-matched" in pair["formula"]


def test_institution_segment_and_no_email():
    aff = "Department of Pediatrics, University of Pittsburgh, Pittsburgh, PA, USA. someone@example.org"
    assert kol.institution(aff) == "University of Pittsburgh"
    assert kol.DEGREES.sub("", "Paul Orchard, M.D.") == "Paul Orchard" and kol.DEGREES.sub("", "Li Ma") == "Li Ma"
    assert kol.PLACEHOLDER.search("Study Director")


def test_therapy_matching_prefers_specific_term():
    general = diseases.Disease("A", "Gaucher disease", [], [], True, False, ["Gaucher disease"], ["gaucher disease"])
    specific = diseases.Disease("B", "Gaucher disease type 1", [], [], True, False, ["Gaucher disease type 1"], ["gaucher disease type 1"])
    hits = therapies._matches("indicated for adults with Gaucher disease type 1 (GD1)", [general, specific])
    assert [d.mondo_id for d, _ in hits] == ["B"]


# --- output: format, ids, levels -----------------------------------------------------------------------------------------

@needs_output
def test_edge_format_and_ids():
    graph = json.loads(EDGES.read_text())
    assert graph["edges"], "no edges"
    ids = [e["id"] for e in graph["edges"]]
    assert len(ids) == len(set(ids))
    for edge in graph["edges"]:
        assert edge["id"] == "e_" + hashlib.sha1(f"{edge['source']}|{edge['target']}|{edge['type']}".encode()).hexdigest()[:12]
        assert edge["contradicting"] == [] and edge["evidence"]
        for ev in edge["evidence"]:
            assert EVIDENCE_FIELDS <= set(ev), (edge["id"], set(ev))
            assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", ev["retrieved"])


@needs_output
def test_level_rules():
    for edge in json.loads(EDGES.read_text())["edges"]:
        levels = {ev["level"] for ev in edge["evidence"]}
        assert "observed" not in levels  # nothing here is a clinical observation
        if edge["type"] == "kol_overlap":
            assert levels == {"inferred"} and edge.get("formula") and edge["formula"] in edge["evidence"][0]["snippet"]
        elif edge["type"] in CURATED_TYPES:
            assert levels == {"curated"}, edge["id"]
        elif edge["type"] == "has_asset":  # CT.gov record = curated, regex find in an abstract = text_mined
            for ev in edge["evidence"]:
                assert (ev["level"], ev["db"]) in {("curated", "ClinicalTrials.gov"), ("curated", "Official newborn screening programme"),
                                                   ("text_mined", "Europe PMC")}, edge["id"]
                assert ev["level"] != "text_mined" or ev["origin"] == "regex"
        if edge["type"] == "screened_in":
            assert edge["evidence"][0]["screening_status"] in edge["evidence"][0]["snippet"]


@needs_output
def test_hero_regulatory_facts():
    edges = json.loads(EDGES.read_text())["edges"]
    krabbe = {"MONDO:0009499", *diseases.descendants("MONDO:0009499")}
    assert not [e for e in edges if e["type"] == "approved_therapy" and e["source"] in krabbe], "a Krabbe approval appeared: stop and check"
    mld = {(e["target"], ev["db"], ev["date"]) for e in edges if e["type"] == "approved_therapy" and e["source"] == "MONDO:0018868"
           for ev in e["evidence"]}
    assert ("DRUG:Libmeldy", "EMA", "2020-12-17") in mld and ("DRUG:Lenmeldy", "FDA", "2024-03-18") in mld


@needs_output
def test_no_email_addresses_stored():
    for name in ("extra_kol_overlap.json", "extra_people.jsonl", "extra_edges.json"):
        path = ENRICH / name
        if path.exists():
            text = path.read_text()
            assert not re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text), name
            free_text = re.sub(r"\b(?:NAME|REC|NIH|ORCID|PERSON):[\w:-]+", " ", text)  # ids and hashes are not free text
            assert not kol.PHONE.search(free_text), name


# --- output: snippets are verbatim (re-derived from the cache only) -------------------------------------------------------

@needs_output
def test_asset_snippets_are_verbatim():
    studies = {s["nct_id"]: s for s in jsonl("extra_ctgov.jsonl")}
    papers = {p["pmid"]: p for p in jsonl("europepmc.jsonl")}
    for row in jsonl("extra_assets.jsonl"):
        if row["asset_type"] in ("natural_history_study", "registry") and row["source_type"] == "NCT":
            study = studies[row["source_id"]]
            assert row["snippet"] in (study["title"] or "", study["official_title"] or "", "patientRegistry: true")
        elif row["asset_type"] == "outcome_scale" and row["source_type"] == "NCT":
            assert row["snippet"] in [o["measure"][:400] for o in studies[row["source_id"]]["outcomes"]]
        elif row["asset_type"] == "outcome_scale" and row["source_id"] in papers:
            assert row["snippet"] in papers[row["source_id"]]["abstract"]


def test_therapy_and_screening_snippets_are_verbatim():
    try:
        hero = diseases.select("hero")
        ema, _ = therapies.ema(hero, offline=True)
        fda, _ = therapies.fda(hero, offline=True)
        screening = nbs.run(hero, offline=True)
    except Exception as exc:  # noqa: BLE001 - cache not warm
        pytest.skip(f"cache not warm: {exc}")
    for item in ema + fda:
        assert item["snippet"] and item["snippet"] in item["source_text"]
    assert any(i["drug"] == "Libmeldy" for i in ema) and any(i["drug"] == "Lenmeldy" for i in fda)
    for row in screening["rows"]:
        assert (row["check"] == "machine") == bool(row["snippet"]) and row["status"] != "not screened"


# --- determinism ----------------------------------------------------------------------------------------------------------

def test_two_offline_runs_are_byte_identical(tmp_path, monkeypatch):
    if not (REPO / "data" / "cache" / "extra").exists():
        pytest.skip("cache not warm")
    module = load_script("04b_enrich_extra.py", "enrich_extra_main")
    outputs = []
    for run in ("a", "b"):
        out = tmp_path / run
        out.mkdir()
        monkeypatch.setattr(module, "OUT", out)
        monkeypatch.setattr(module, "ASSETS_CSV", out / "assets.csv")
        monkeypatch.setattr(sys, "argv", ["04b", "--scope", "hero", "--offline", "--sources", "nbs,therapies,prevalence,assets"])
        assert module.main() == 0
        outputs.append({p.name: p.read_bytes() for p in sorted(out.iterdir()) if p.name != "extra_run_log.jsonl"})
    assert outputs[0].keys() == outputs[1].keys() and len(outputs[0]) > 5
    for name in outputs[0]:
        assert outputs[0][name] == outputs[1][name], name
