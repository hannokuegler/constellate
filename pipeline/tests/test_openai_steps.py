"""05 extract + 06 reconcile without a key: grounding, contradicting, judge choice, fuzzy fallback, output formats."""
from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path

import httpx
import openai
import pytest
from pydantic import ValidationError

import openai_config

REPO = Path(__file__).resolve().parents[2]
PMID = "31234567"
ABSTRACT = ("Globoid cell leukodystrophy (Krabbe disease) is caused by biallelic pathogenic variants in the GALC gene. "
            "We followed 12 patients with late-onset disease. Seizures were not observed in any of the 12 patients. "
            "Spasticity was present in 10 of 12 patients.")
RECORD = {"pmid": PMID, "title": "Late-onset Krabbe disease: a cohort", "abstract": ABSTRACT, "pub_date": "2024-05-01",
          "is_hero": True, "diseases": [{"mondo_id": "MONDO:0009499", "rank": 1}]}
NODES = [
    {"id": "MONDO:0009499", "type": "disease", "label": "Krabbe disease", "synonyms": ["globoid cell leukodystrophy", "GALC deficiency"]},
    {"id": "MONDO:0018868", "type": "disease", "label": "metachromatic leukodystrophy", "synonyms": ["MLD"]},
    {"id": "GALC", "type": "gene", "label": "GALC", "full_name": "galactosylceramidase"},
    {"id": "PSAP", "type": "gene", "label": "PSAP", "full_name": "prosaposin"},
    {"id": "HP:0001250", "type": "phenotype", "label": "Seizure"},
    {"id": "HP:0001257", "type": "phenotype", "label": "Spasticity"},
]
EVIDENCE_KEYS = {"db", "origin", "record", "url", "level", "date", "confidence", "snippet"}


def claim(**overrides) -> dict:
    base = {"subject": "GALC", "predicate": "causes", "object": "Krabbe disease", "polarity": "supports", "pmid": PMID,
            "snippet": "Globoid cell leukodystrophy (Krabbe disease) is caused by biallelic pathogenic variants in the GALC gene.",
            "confidence": 0.95, "study_context": "human"}
    return base | overrides


def expected_edge_id(source: str, target: str, edge_type: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:12]


@pytest.fixture
def index(extract_mod):
    return extract_mod.EntityIndex(NODES)


# ------------------------------------------------------------------------------------------------- 05 grounding
def test_valid_claim_maps_to_curated_edge_id(extract_mod, index):
    placement, reasons, _ = extract_mod.validate_claim(claim(), RECORD, index)
    assert reasons == []
    assert placement[:3] == ("MONDO:0009499", "GALC", "caused_by")  # same direction + type as 03_build_graph


def test_invented_snippet_is_rejected(extract_mod, index):
    _, reasons, _ = extract_mod.validate_claim(claim(snippet="GALC variants cause Krabbe disease in all patients worldwide."), RECORD, index)
    assert "snippet_not_in_abstract" in reasons


def test_wrong_pmid_is_rejected(extract_mod, index):
    _, reasons, _ = extract_mod.validate_claim(claim(pmid="99999999"), RECORD, index)
    assert reasons == ["pmid_mismatch"]


def test_snippet_whitespace_and_quotes_are_normalised(extract_mod, index):
    snippet = "Globoid cell leukodystrophy  (Krabbe disease)\nis caused by biallelic pathogenic variants in the GALC gene."
    assert extract_mod.validate_claim(claim(snippet=snippet), RECORD, index)[1] == []


def test_paraphrased_snippet_case_or_ellipsis_is_rejected(extract_mod, index):
    for snippet in ["globoid cell leukodystrophy (krabbe disease) is caused by biallelic pathogenic variants in the galc gene.",
                    "Globoid cell leukodystrophy ... is caused by biallelic pathogenic variants in the GALC gene."]:
        assert "snippet_not_in_abstract" in extract_mod.validate_claim(claim(snippet=snippet), RECORD, index)[1]


def test_entity_not_in_graph_is_rejected(extract_mod, index):
    _, reasons, details = extract_mod.validate_claim(claim(subject="psychosine", predicate="biomarker_of"), RECORD, index)
    assert "subject_not_in_graph" in reasons and details["subject_candidates"] == []


def test_entity_not_mentioned_in_abstract_is_rejected(extract_mod, index):
    """PSAP is a graph node but the abstract never mentions it: the model brought outside knowledge."""
    _, reasons, _ = extract_mod.validate_claim(claim(subject="PSAP"), RECORD, index)
    assert reasons == ["subject_not_mentioned_in_abstract"]


def test_predicate_type_mismatch_is_rejected(extract_mod, index):
    _, reasons, _ = extract_mod.validate_claim(claim(subject="Krabbe disease", predicate="has_phenotype", object="GALC"), RECORD, index)
    assert reasons == ["predicate_type_mismatch"]


def test_vocabulary_is_closed(extract_mod):
    with pytest.raises(ValidationError):
        extract_mod.Claim.model_validate(claim(predicate="cures"))
    assert set(extract_mod.PREDICATES) == set(extract_mod.EDGE_RULES)


def test_synonym_and_plural_resolve(extract_mod, index):
    assert index.resolve("Globoid cell leukodystrophy") == ["MONDO:0009499"]
    assert index.resolve("seizures") == ["HP:0001250"]
    assert index.resolve("galactosylceramidase") == ["GALC"]


# ------------------------------------------------------------------------------------------------- 05 run + formats
def run_extract(extract_mod, index, tmp_path, client, claims, records=(RECORD,)):
    return extract_mod.run(list(records), client, "test-extract-model", index, out_dir=tmp_path / "extract",
                           cache_dir=tmp_path / "cache", concurrency=8, sleep=lambda s: None)


def test_contradicts_lands_in_contradicting_and_formats(extract_mod, index, tmp_path, fake_client):
    answer = {"claims": [
        claim(),
        claim(subject="Krabbe disease", predicate="has_phenotype", object="seizures", polarity="contradicts",
              snippet="Seizures were not observed in any of the 12 patients.", confidence=0.9),
        claim(snippet="GALC is the only gene ever linked to Krabbe disease."),   # invented -> rejected
        claim(pmid="11111111"),                                                   # wrong PMID -> rejected
    ]}
    client = fake_client(lambda kwargs: answer)
    summary = run_extract(extract_mod, index, tmp_path, client, answer)
    assert summary["claims_accepted"] == 2 and summary["claims_rejected"] == 2
    out = tmp_path / "extract"
    data = json.loads((out / "edges_text_mined.json").read_text())
    edges = {e["type"]: e for e in data["edges"]}

    seizure = edges["has_phenotype"]
    assert seizure["evidence"] == [] and len(seizure["contradicting"]) == 1 and seizure["level"] == "contradicted"
    assert seizure["id"] == expected_edge_id("MONDO:0009499", "HP:0001250", "has_phenotype")

    causal = edges["caused_by"]
    assert causal["id"] == expected_edge_id("MONDO:0009499", "GALC", "caused_by") and re.fullmatch(r"e_[0-9a-f]{12}", causal["id"])
    evidence = causal["evidence"][0]
    assert EVIDENCE_KEYS <= set(evidence)
    assert (evidence["level"], evidence["db"], evidence["origin"]) == ("text_mined", "PubMed", "OpenAI extract")
    assert evidence["record"] == f"PMID:{PMID}" and evidence["url"] == f"https://pubmed.ncbi.nlm.nih.gov/{PMID}/"
    assert evidence["confidence"] == 0.7  # 0.95 from the model, capped
    assert evidence["model"] == "test-extract-model" and evidence["prompt_version"].startswith("extract-")
    assert evidence["snippet"] in ABSTRACT
    assert causal["contradicting"] == [] and causal["level"] == "text_mined"

    rejected = [json.loads(line) for line in (out / "rejected.jsonl").read_text().splitlines()]
    assert sorted(r["reasons"][0] for r in rejected) == ["pmid_mismatch", "snippet_not_in_abstract"]
    claims = [json.loads(line) for line in (out / "claims.jsonl").read_text().splitlines()]
    assert {c["edge_id"] for c in claims} == {causal["id"], seizure["id"]}
    assert all(c["pmid"] == PMID and c["snippet"] in ABSTRACT for c in claims)

    request = client.responses.calls[0]
    assert request["model"] == "test-extract-model" and request["text_format"] is extract_mod.ExtractionResult
    assert "Do not add anything you know" in request["instructions"] and "`shares_mechanism_with`" in request["instructions"]
    assert PMID in request["input"] and ABSTRACT in request["input"]


def test_cache_is_reused_without_client(extract_mod, index, tmp_path, fake_client):
    client = fake_client(lambda kwargs: {"claims": [claim()]})
    run_extract(extract_mod, index, tmp_path, client, None)
    assert len(client.responses.calls) == 1
    summary = run_extract(extract_mod, index, tmp_path, None, None)  # no key: cache-only
    assert summary["from_cache"] == 1 and summary["claims_accepted"] == 1 and summary["usage"]["input_tokens"] == 0


def test_no_key_and_no_cache_writes_nothing(extract_mod, index, tmp_path):
    summary = run_extract(extract_mod, index, tmp_path, None, None)
    assert summary["answered"] == 0 and summary["skipped_no_key"] == 1
    assert not (tmp_path / "extract").exists()


def test_failed_call_is_reported_not_fatal(extract_mod, index, tmp_path, fake_client):
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    error = openai.BadRequestError("bad", response=httpx.Response(400, request=request), body=None)
    summary = run_extract(extract_mod, index, tmp_path, fake_client(lambda kwargs: error), None)
    assert summary["failed"][0]["pmid"] == PMID and summary["answered"] == 0


def test_extract_main_without_key_exits_zero(extract_mod, tmp_path, capsys):
    source = tmp_path / "europepmc.jsonl"
    source.write_text(json.dumps(RECORD) + "\n")
    assert extract_mod.main(["--input", str(source)]) == 0
    assert "OPENAI_MODEL_EXTRACT" in capsys.readouterr().out


def test_load_abstracts_scope_and_order(extract_mod, tmp_path):
    rows = [RECORD | {"pmid": "1", "diseases": [{"mondo_id": "MONDO:CORE", "rank": 1}]},
            RECORD | {"pmid": "2", "diseases": [{"mondo_id": "MONDO:0009499", "rank": 3}]},
            RECORD | {"pmid": "3", "abstract": "", "diseases": [{"mondo_id": "MONDO:0009499", "rank": 1}]}]
    source = tmp_path / "europepmc.jsonl"
    source.write_text("".join(json.dumps(r) + "\n" for r in rows))
    hero, core = {"MONDO:0009499"}, {"MONDO:0009499", "MONDO:CORE"}
    assert [r["pmid"] for r in extract_mod.load_abstracts(source, "hero", None, hero, core)] == ["2"]
    assert [r["pmid"] for r in extract_mod.load_abstracts(source, "core", None, hero, core)] == ["2", "1"]
    assert [r["pmid"] for r in extract_mod.load_abstracts(source, "core", 1, hero, core)] == ["2"]


# ------------------------------------------------------------------------------------------------- retry + config
def test_retry_backs_off_on_rate_limit_then_succeeds():
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    attempts, waits = [], []

    def call():
        attempts.append(1)
        if len(attempts) < 3:
            raise openai.RateLimitError("slow down", response=httpx.Response(429, request=request), body=None)
        return "ok"

    assert openai_config.with_retry(call, sleep=waits.append) == "ok"
    assert len(attempts) == 3 and len(waits) == 2 and waits[1] > waits[0] * 1.2


def test_retry_does_not_retry_bad_request():
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    attempts = []

    def call():
        attempts.append(1)
        raise openai.BadRequestError("bad", response=httpx.Response(400, request=request), body=None)

    with pytest.raises(openai.BadRequestError):
        openai_config.with_retry(call, sleep=lambda s: None)
    assert len(attempts) == 1


def test_config_has_no_default_models_and_hints(capsys):
    assert openai_config.model_for("extract") is None
    assert openai_config.missing(["extract", "judge", "embed"]) == ["OPENAI_API_KEY", "OPENAI_MODEL_EXTRACT", "OPENAI_MODEL_JUDGE", "OPENAI_MODEL_EMBED"]
    assert openai_config.list_models() == 0
    assert "No OPENAI_API_KEY" in capsys.readouterr().out


def test_config_list_groups_models(fake_client, capsys):
    client = fake_client(model_ids=["model-b", "text-embedding-x", "tts-y", "model-a"])
    assert openai_config.list_models(client) == 0
    out = capsys.readouterr().out
    assert out.index("model-a") < out.index("model-b") < out.index("Embedding") < out.index("text-embedding-x") < out.index("tts-y")


def test_cost_line_uses_env_price(monkeypatch):
    monkeypatch.setenv("OPENAI_PRICE_EXTRACT", "1,2")
    assert "≈ 3.0000 USD" in openai_config.cost_line("extract", "test-model", 1_000_000, 1_000_000, 3, 1)
    assert "price unknown" in openai_config.cost_line("judge", "test-model", 10, 10, 1, 0)


# ------------------------------------------------------------------------------------------------- 06 reconcile
SLICE = {"mondo": {
    "MONDO:0009499": {"label": "Krabbe disease", "synonyms": ["globoid cell leukodystrophy", "GALC deficiency"], "definition": "A lysosomal disorder."},
    "MONDO:0016089": {"label": "infantile Krabbe disease", "synonyms": ["early infantile Krabbe disease"], "definition": ""},
    "MONDO:0018868": {"label": "metachromatic leukodystrophy", "synonyms": ["MLD", "arylsulfatase A deficiency"], "definition": ""},
    "MONDO:0009591": {"label": "metachromatic leukodystrophy, juvenile form", "synonyms": ["MLD"], "definition": ""},
    "MONDO:0009265": {"label": "Gaucher disease type I", "synonyms": ["Gaucher's disease type I"], "definition": ""},
    "MONDO:0009268": {"label": "Gaucher disease-ophthalmoplegia-cardiovascular calcification syndrome", "synonyms": ["Gaucher disease type 3C"], "definition": ""},
    "MONDO:0018150": {"label": "Gaucher disease", "synonyms": [], "definition": ""},
}}
ORG_HEADER = "org_name,url,country,disease_names,orpha_ids,has_registry,registry_url,has_natural_history_study,nhs_url,has_biobank,contact_url,notes,verified_date\n"
ORG_ROWS = [{"org_name": "Hunter's Hope Foundation", "url": "https://www.huntershope.org", "disease_names": "Krabbe disease; Leukodystrophies",
             "has_registry": "yes", "verified_date": "2026-10-03"}]


@pytest.fixture
def catalog(reconcile_mod):
    return reconcile_mod.Catalog.from_slice(SLICE)


def test_fuzzy_finds_krabbe(reconcile_mod, catalog):
    decision = reconcile_mod.fuzzy_match("Krabbe disease", catalog)
    assert decision.mondo_id == "MONDO:0009499" and decision.origin == "fuzzy"


def test_fuzzy_respects_type_numbers_and_ambiguity(reconcile_mod, catalog):
    assert reconcile_mod.fuzzy_match("Gaucher disease type 1", catalog).mondo_id == "MONDO:0009265"   # roman I, not type 3C
    assert reconcile_mod.fuzzy_match("Gaucher disease type 2", catalog).mondo_id is None              # no type II in the fixture
    assert reconcile_mod.fuzzy_match("Metachromatic Leukodystrophy (MLD)", catalog).mondo_id == "MONDO:0018868"
    assert reconcile_mod.fuzzy_match("MLD", catalog).reason.startswith("ambiguous")
    assert reconcile_mod.fuzzy_match("Morbus Gaucher", catalog).mondo_id is None


@pytest.mark.skipif(not (REPO / "data" / "slice.json").exists(), reason="data/slice.json not built")
def test_fuzzy_finds_krabbe_in_real_slice(reconcile_mod):
    real = reconcile_mod.Catalog.from_file(REPO / "data" / "slice.json")
    assert reconcile_mod.fuzzy_match("Krabbe disease", real).mondo_id == "MONDO:0009499"
    assert reconcile_mod.fuzzy_match("Gaucher disease type 1", real).mondo_id != "MONDO:0009268"


def test_judge_schema_only_allows_candidates(reconcile_mod):
    schema = reconcile_mod.decision_model(["MONDO:0009499", "MONDO:0016089"])
    assert schema.model_validate({"reason": "r", "mondo_id": "none", "confidence": 0.1}).mondo_id == "none"
    with pytest.raises(ValidationError):
        schema.model_validate({"reason": "r", "mondo_id": "MONDO:0018868", "confidence": 0.9})


def judge_picking(label_to_pick: str | None, confidence: float = 0.93):
    def handler(kwargs):
        candidates = re.findall(r"^\d+\. (MONDO:\d+) \| ([^|]+) \|", kwargs["input"], flags=re.M)
        chosen = next((m for m, label in candidates if label.strip() == label_to_pick), "none")
        return {"reason": f"exact label match {label_to_pick}", "mondo_id": chosen, "confidence": confidence}
    return handler


def openai_ctx(reconcile_mod, catalog, client, tmp_path):
    return reconcile_mod.build_context(catalog, client, "test-embed-model", "test-judge-model", cache_dir=tmp_path / "cache", sleep=lambda s: None)


def test_reconcile_judge_picks_correct_candidate(reconcile_mod, catalog, tmp_path, fake_client):
    client = fake_client(judge_picking("Krabbe disease"))
    ctx = openai_ctx(reconcile_mod, catalog, client, tmp_path)
    result = reconcile_mod.reconcile([ORG_ROWS[0] | {"disease_names": "Krabbe disease"}], "orgs.csv", False, catalog, ctx)
    assert result["summary"]["matched"] == 1
    edge = result["edges"][0]
    assert (edge["source"], edge["target"], edge["type"]) == ("MONDO:0009499", "ORG:hunter-hope-foundation", "advocated_by")
    assert edge["id"] == expected_edge_id("MONDO:0009499", "ORG:hunter-hope-foundation", "advocated_by")
    evidence = edge["evidence"][0]
    assert EVIDENCE_KEYS <= set(evidence)
    assert (evidence["db"], evidence["origin"], evidence["level"]) == ("Constellate reconcile", "OpenAI judge", "text_mined")
    assert evidence["record"] == evidence["url"] == "https://www.huntershope.org"
    assert evidence["snippet"].startswith('"Krabbe disease"') and evidence["snippet"].endswith("MONDO:0009499 Krabbe disease")
    assert evidence["reason"] and evidence["model"] == "test-judge-model" and evidence["embedding_model"] == "test-embed-model"
    assert len(evidence["candidates"]) == 5 and "MONDO:0009499" in {c["mondo_id"] for c in evidence["candidates"]}
    request = client.responses.calls[0]
    assert request["model"] == "test-judge-model" and "only choose among the candidates" in request["instructions"]
    # every distinct text embedded exactly once (the org name equals a catalog name); a second build only hits the cache
    embedded = [text for batch in client.embeddings.calls for text in batch]
    assert sorted(embedded) == sorted(set(catalog.names) | {"Krabbe disease"})
    openai_ctx(reconcile_mod, catalog, client, tmp_path)
    assert sum(len(batch) for batch in client.embeddings.calls) == len(embedded)


def test_reconcile_judge_none_and_low_confidence_go_to_unmatched(reconcile_mod, catalog, tmp_path, fake_client):
    for handler in (judge_picking(None), judge_picking("Krabbe disease", confidence=0.3)):
        ctx = openai_ctx(reconcile_mod, catalog, fake_client(handler), tmp_path / str(id(handler)))
        result = reconcile_mod.reconcile([ORG_ROWS[0] | {"disease_names": "Krabbe disease"}], "orgs.csv", False, catalog, ctx)
        assert result["edges"] == [] and result["unmatched"][0]["disease_name"] == "Krabbe disease"
        assert result["unmatched"][0]["method"] == "OpenAI judge"


def test_reconcile_api_failure_falls_back_to_fuzzy(reconcile_mod, catalog, tmp_path, fake_client):
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    client = fake_client(lambda kwargs: openai.InternalServerError("down", response=httpx.Response(500, request=request), body=None))
    ctx = openai_ctx(reconcile_mod, catalog, client, tmp_path)
    result = reconcile_mod.reconcile([ORG_ROWS[0] | {"disease_names": "Krabbe disease"}], "orgs.csv", False, catalog, ctx)
    evidence = result["edges"][0]["evidence"][0]
    assert result["edges"][0]["source"] == "MONDO:0009499"
    assert (evidence["origin"], evidence["level"]) == ("fuzzy", "inferred") and "fallback_from" in evidence


def test_reconcile_main_fuzzy_on_draft_without_key(reconcile_mod, tmp_path, monkeypatch, capsys):
    slice_file = tmp_path / "slice.json"
    slice_file.write_text(json.dumps(SLICE))
    monkeypatch.setattr(reconcile_mod, "SLICE", slice_file)
    monkeypatch.setattr(reconcile_mod, "ORGS", tmp_path / "orgs.csv")
    monkeypatch.setattr(reconcile_mod, "ORGS_DRAFT", tmp_path / "orgs_draft.csv")
    (tmp_path / "orgs.csv").write_text(ORG_HEADER)  # header only = empty -> draft is used
    (tmp_path / "orgs_draft.csv").write_text(ORG_HEADER + "Hunter's Hope Foundation,https://www.huntershope.org,US,Krabbe disease; Leukodystrophies,ORPHA:487,yes,,unknown,,unknown,,,\n")
    out = tmp_path / "reconcile"
    assert reconcile_mod.main(["--out-dir", str(out)]) == 0
    assert "Falling back to fuzzy" in capsys.readouterr().out
    data = json.loads((out / "org_disease_edges.json").read_text())
    assert data["meta"]["input_is_draft"] is True and "warning" in data["meta"] and data["meta"]["method"] == "fuzzy"
    node = data["nodes"][0]
    assert node["id"] == "ORG:hunter-hope-foundation" and node["type"] == "org" and node["has_registry"] == "yes" and node["draft_input"] is True
    assert node["orpha_ids"] == ["ORPHA:487"]
    edge = data["edges"][0]
    assert edge["source"] == "MONDO:0009499" and edge["evidence"][0]["origin"] == "fuzzy" and edge["evidence"][0]["level"] == "inferred"
    with (out / "unmatched.csv").open() as handle:
        rows = list(csv.DictReader(handle))
    assert list(rows[0]) == reconcile_mod.UNMATCHED_COLUMNS and rows[0]["disease_name"] == "Leukodystrophies"


def test_reconcile_main_skips_without_rows_and_keeps_openai_output(reconcile_mod, tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(reconcile_mod, "ORGS", tmp_path / "orgs.csv")
    monkeypatch.setattr(reconcile_mod, "ORGS_DRAFT", tmp_path / "missing_draft.csv")
    (tmp_path / "orgs.csv").write_text(ORG_HEADER)
    assert reconcile_mod.main(["--out-dir", str(tmp_path / "out")]) == 0
    assert "nothing to reconcile" in capsys.readouterr().out and not (tmp_path / "out").exists()

    (tmp_path / "orgs.csv").write_text(ORG_HEADER + "X,https://x.org,US,Krabbe disease,,,,,,,,,\n")
    out = tmp_path / "out"
    out.mkdir()
    kept = {"meta": {}, "nodes": [], "edges": [{"evidence": [{"origin": "OpenAI judge"}]}]}
    (out / "org_disease_edges.json").write_text(json.dumps(kept))
    slice_file = tmp_path / "slice.json"
    slice_file.write_text(json.dumps(SLICE))
    monkeypatch.setattr(reconcile_mod, "SLICE", slice_file)
    assert reconcile_mod.main(["--out-dir", str(out)]) == 0
    assert json.loads((out / "org_disease_edges.json").read_text()) == kept


# ------------------------------------------------------------------------------------------------- sample
def test_extract_sample_is_reproducible_and_protects_checks(sample_mod, tmp_path):
    claims = [{"claim_id": f"c_{i:03d}", "pmid": str(1000 + i), "is_hero": i % 3 == 0, "subject": "GALC", "subject_id": "GALC",
               "predicate": "causes", "object": "Krabbe disease", "object_id": "MONDO:0009499", "polarity": "supports" if i % 5 else "contradicts",
               "study_context": "human", "snippet": f"snippet {i}", "url": f"https://pubmed.ncbi.nlm.nih.gov/{1000 + i}/"} for i in range(40)]
    source = tmp_path / "claims.jsonl"
    source.write_text("".join(json.dumps(c) + "\n" for c in claims))
    out = tmp_path / "extract_check.csv"
    assert sample_mod.main(["--claims", str(source), "--out", str(out)]) == 0
    first = out.read_text()
    rows = list(csv.DictReader(first.splitlines()))
    assert len(rows) == 20 and list(rows[0]) == ["pmid", "claim", "snippet", "url", "check"]
    assert all(r["check"] == "" for r in rows)
    assert sum(1 for r in rows if int(r["pmid"]) % 3 == 1) == 10  # i % 3 == 0 <=> pmid % 3 == 1: 10 hero rows
    source.write_text("".join(json.dumps(c) + "\n" for c in reversed(claims)))
    assert sample_mod.main(["--claims", str(source), "--out", str(out)]) == 0 and out.read_text() == first
    out.write_text(first.replace(",\n", ",ok\n", 1))
    assert sample_mod.main(["--claims", str(source), "--out", str(out)]) == 0
    assert ",ok" in out.read_text()
