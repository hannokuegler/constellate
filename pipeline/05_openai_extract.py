"""05_openai_extract — OpenAI Structured Outputs: PubMed abstracts -> grounded claims -> text_mined edges.

Input : data/enrich/europepmc.jsonl (04), data/graph_base.json (03) + data/slice.json (02) for entity mapping,
        prompts/extract.md, model from OPENAI_MODEL_EXTRACT (pipeline/openai_config.py; never guessed)
Output: data/extract/claims.jsonl            accepted claims (mapped to graph node IDs)
        data/extract/rejected.jsonl          every claim that failed a grounding check, with the reasons
        data/extract/edges_text_mined.json   edges in the 03_build_graph evidence format (level text_mined, origin "OpenAI extract")
Cache : data/cache/openai/extract/<model>/<prompt_version>/<pmid>.json (one model answer per abstract)

Grounding checks (hard, all must pass; the model's word counts for nothing):
  1. snippet occurs verbatim (whitespace/Unicode-normalised, case-sensitive) in the abstract, 20..500 chars
  2. pmid equals the PMID of the abstract that was sent
  3. subject and object resolve to graph nodes (label, synonym, gene symbol/name; case- and punctuation-insensitive)
     and are mentioned in title or abstract
  4. predicate from the closed vocabulary, node types fit the predicate (EDGE_RULES), no self-loop
Confidence = model self-assessment capped at 0.7. polarity "contradicts" -> edge["contradicting"].

  uv run --project pipeline python pipeline/05_openai_extract.py                 # hero scope (~342 abstracts)
  uv run --project pipeline python pipeline/05_openai_extract.py --scope core --limit 50
Without OPENAI_API_KEY: rebuilds the outputs from the cache if there is one, otherwise prints a hint and exits 0.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import threading
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Literal

from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
import openai_config  # noqa: E402
from enrich.diseases import normalize as normalize_name  # noqa: E402  (shared with the 04 noise filter)

ROOT = Path(__file__).resolve().parents[1]
EUROPEPMC = ROOT / "data" / "enrich" / "europepmc.jsonl"
GRAPH_BASE = ROOT / "data" / "graph_base.json"
SLICE = ROOT / "data" / "slice.json"
OUT_DIR = ROOT / "data" / "extract"
CACHE_DIR = ROOT / "data" / "cache" / "openai" / "extract"
PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "extract.md"

# ---------------------------------------------------------------------------------------------------- vocabulary
# Closed predicate vocabulary (subject -> object). Shown to the model and enforced in code.
PREDICATES: dict[str, str] = {
    "causes": "gene -> disease: (pathogenic variants in) the gene cause the disease",
    "associated_with": "gene/disease/phenotype -> disease/gene/phenotype: association without stated causality",
    "has_phenotype": "disease -> phenotype, symptom or clinical sign",
    "treated_by": "disease -> therapy, drug or procedure",
    "studied_in": "disease -> model organism, cohort or trial named in the abstract",
    "biomarker_of": "metabolite, gene or phenotype -> the disease it indicates",
    "shares_mechanism_with": "disease -> disease (or gene -> gene) with an explicitly stated shared mechanism",
}
PredicateName = Literal["causes", "associated_with", "has_phenotype", "treated_by", "studied_in", "biomarker_of", "shares_mechanism_with"]
ANY = "*"
# predicate -> allowed (subject type, object type, graph edge type, orientation). Edge types and directions follow
# 03_build_graph (disease -caused_by-> gene, disease -has_phenotype-> HPO), so text-mined evidence lands on the same edge IDs.
EDGE_RULES: dict[str, list[tuple[str, str, str, str]]] = {
    "causes": [("gene", "disease", "caused_by", "reverse"), ("disease", "gene", "caused_by", "forward")],
    "associated_with": [("gene", "disease", "associated_gene", "reverse"), ("disease", "gene", "associated_gene", "forward"),
                        ("phenotype", "disease", "has_phenotype", "reverse"), ("disease", "phenotype", "has_phenotype", "forward"),
                        ("disease", "disease", "associated_with", "undirected"), ("gene", "gene", "associated_with", "undirected")],
    "has_phenotype": [("disease", "phenotype", "has_phenotype", "forward")],
    "treated_by": [("disease", ANY, "treated_by", "forward")],
    "studied_in": [("disease", ANY, "studied_in", "forward")],
    "biomarker_of": [(ANY, "disease", "biomarker_of", "forward")],
    "shares_mechanism_with": [("disease", "disease", "shares_mechanism", "undirected"), ("gene", "gene", "shares_mechanism", "undirected")],
}
assert set(EDGE_RULES) == set(PREDICATES) == set(PredicateName.__args__)

CONFIDENCE_CAP = 0.7          # text_mined never outranks curated databases (0.9+)
MIN_SNIPPET_CHARS = 20
MAX_SNIPPET_CHARS = 500       # snippets only: abstracts can carry publisher rights
LEVEL = "text_mined"
ORIGIN = "OpenAI extract"
DB = "PubMed"


class Claim(BaseModel):
    subject: str
    predicate: PredicateName
    object: str
    polarity: Literal["supports", "contradicts"]
    pmid: str
    snippet: str
    confidence: float
    study_context: Literal["human", "animal_model", "cell_model", "not_stated"]


class ExtractionResult(BaseModel):
    claims: list[Claim]


ExtractionResult.model_rebuild()  # resolves the postponed annotations even when loaded via importlib (tests)


# ---------------------------------------------------------------------------------------------------- prompt
def prompt_text() -> str:
    vocabulary = "\n".join(f"- `{name}`: {meaning}" for name, meaning in PREDICATES.items())
    return PROMPT_FILE.read_text().replace("{{PREDICATES}}", vocabulary)


def prompt_version() -> str:
    """Changes whenever prompt, vocabulary or schema change, so the cache never serves answers to an old question."""
    material = prompt_text() + json.dumps(ExtractionResult.model_json_schema(), sort_keys=True)
    return "extract-" + hashlib.sha1(material.encode()).hexdigest()[:8]


def user_message(record: dict) -> str:
    return f"PMID: {record['pmid']}\nTITLE (context only, never quote it): {record.get('title') or ''}\nABSTRACT:\n{record['abstract']}"


# ---------------------------------------------------------------------------------------------------- grounding
QUOTE_MAP = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", "−": "-", " ": " "})


def normalize_text(text: str) -> str:
    """Unicode NFKC, typographic quotes/dashes unified, whitespace collapsed. Case is kept: the snippet must be verbatim."""
    return " ".join(unicodedata.normalize("NFKC", text or "").translate(QUOTE_MAP).split())


def snippet_in_abstract(snippet: str, abstract: str) -> bool:
    needle = normalize_text(snippet).strip("\"' ")
    return len(needle) >= MIN_SNIPPET_CHARS and needle in normalize_text(abstract)


def pmid_digits(value: str) -> str:
    return re.sub(r"\D", "", str(value or ""))


class EntityIndex:
    """Normalised name -> graph node IDs. Priority 0 = label / gene symbol, 1 = synonym / gene full name."""

    def __init__(self, nodes: list[dict]) -> None:
        self.types: dict[str, str] = {}
        self.labels: dict[str, str] = {}
        self.names: dict[str, set[str]] = {}
        self.index: dict[str, dict[str, int]] = {}
        for node in nodes:
            node_id, node_type = node["id"], node.get("type")
            if node_type not in ("disease", "gene", "phenotype"):
                continue
            self.types[node_id] = node_type
            self.labels.setdefault(node_id, node.get("label") or node_id)
            primary = [node.get("label") or node_id] + ([node_id] if node_type == "gene" else [])
            secondary = list(node.get("synonyms") or []) + ([node["full_name"]] if node.get("full_name") else [])
            for priority, names in ((0, primary), (1, secondary)):
                for name in names:
                    key = normalize_name(name).strip()
                    if len(key) < 2:
                        continue
                    self.names.setdefault(node_id, set()).add(key)
                    bucket = self.index.setdefault(key, {})
                    bucket[node_id] = min(priority, bucket.get(node_id, priority))

    @classmethod
    def from_files(cls, graph_path: Path | None = None, slice_path: Path | None = None) -> "EntityIndex":
        graph_path, slice_path = graph_path or GRAPH_BASE, slice_path or SLICE
        nodes: list[dict] = []
        if graph_path.exists():
            nodes.extend(json.loads(graph_path.read_text())["nodes"])
        if slice_path.exists():  # diseases from the slice, in case graph_base is older than the slice
            slice_data = json.loads(slice_path.read_text())
            nodes.extend({"id": mondo_id, "type": "disease", "label": m["label"], "synonyms": m.get("synonyms", [])}
                         for mondo_id, m in slice_data["mondo"].items())
        if not nodes:
            raise SystemExit("no graph nodes: run `make slice build` first (data/slice.json, data/graph_base.json)")
        return cls(nodes)

    def resolve(self, name: str) -> list[str]:
        """Node IDs for a free-text name, best priority only (label beats synonym). Tries a naive singular as fallback."""
        key = normalize_name(name).strip()
        candidates = [key]
        if key.endswith("s") and len(key) > 4:
            candidates.append(key[:-1])
        for candidate in candidates:
            bucket = self.index.get(candidate)
            if bucket:
                best = min(bucket.values())
                return sorted(node_id for node_id, priority in bucket.items() if priority == best)
        return []

    def mentioned(self, node_id: str, raw_name: str, text: str) -> bool:
        """The entity occurs in the text as whole words: either the model's mention or any name of the node."""
        haystack = normalize_name(text)
        keys = {normalize_name(raw_name).strip()} | self.names.get(node_id, set())
        return any(key and f" {key} " in haystack for key in keys)


def edge_id(source: str, target: str, edge_type: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:12]  # identical to 03_build_graph


def place_edge(predicate: str, subject_ids: list[str], object_ids: list[str], types: dict[str, str]) -> tuple[list[tuple], str | None]:
    """All (source, target, edge_type, subject_id, object_id) combinations the rules allow; plus a reason if none."""
    placements = []
    for subject_id in subject_ids:
        for object_id in object_ids:
            if subject_id == object_id:
                continue
            for subject_type, object_type, edge_type, orientation in EDGE_RULES[predicate]:
                if subject_type not in (ANY, types[subject_id]) or object_type not in (ANY, types[object_id]):
                    continue
                if orientation == "reverse":
                    source, target = object_id, subject_id
                elif orientation == "undirected":
                    source, target = sorted((subject_id, object_id))
                else:
                    source, target = subject_id, object_id
                placements.append((source, target, edge_type, subject_id, object_id))
                break
    if placements:
        return placements, None
    if set(subject_ids) == set(object_ids) or (len(subject_ids) == 1 and subject_ids == object_ids):
        return [], "self_loop"
    return [], "predicate_type_mismatch"


def validate_claim(raw: dict, record: dict, index: EntityIndex) -> tuple[dict | None, list[str], dict]:
    """(placement, reasons, details). An empty reasons list means the claim passed every grounding check."""
    reasons: list[str] = []
    details: dict = {}
    if pmid_digits(raw.get("pmid")) != pmid_digits(record["pmid"]):
        reasons.append("pmid_mismatch")
    snippet = raw.get("snippet") or ""
    if not snippet_in_abstract(snippet, record["abstract"]):
        reasons.append("snippet_too_short" if len(normalize_text(snippet)) < MIN_SNIPPET_CHARS else "snippet_not_in_abstract")
    elif len(normalize_text(snippet)) > MAX_SNIPPET_CHARS:
        reasons.append("snippet_too_long")
    if raw.get("predicate") not in PREDICATES:
        reasons.append("predicate_not_in_vocabulary")
    text = f"{record.get('title', '')} {record['abstract']}"
    resolved: dict[str, list[str]] = {}
    for role in ("subject", "object"):
        ids = index.resolve(raw.get(role) or "")
        details[f"{role}_candidates"] = ids
        if not ids:
            reasons.append(f"{role}_not_in_graph")
            continue
        ids = [node_id for node_id in ids if index.mentioned(node_id, raw[role], text)]
        if not ids:
            reasons.append(f"{role}_not_mentioned_in_abstract")
        resolved[role] = ids
    placement = None
    if not reasons:
        placements, problem = place_edge(raw["predicate"], resolved["subject"], resolved["object"], index.types)
        if problem:
            reasons.append(problem)
        elif len({p[:3] for p in placements}) > 1:
            reasons.append("ambiguous_entity")
            details["placements"] = [list(p[:3]) for p in placements]
        else:
            placement = placements[0]
    return (placement if not reasons else None), reasons, details


# ---------------------------------------------------------------------------------------------------- input
def load_abstracts(path: Path, scope: str, limit: int | None, hero_ids: set[str] | None = None,
                   core_ids: set[str] | None = None) -> list[dict]:
    """Papers with an abstract linked to a disease in scope; hero papers first, then by search rank, then PMID."""
    if hero_ids is None or core_ids is None:
        from enrich import diseases  # scope definition lives in 04's module, not duplicated here

        hero_ids = set(diseases.hero_ids()) if hero_ids is None else hero_ids
        core_ids = set(diseases.load_slice()["core"]) if core_ids is None else core_ids
    scope_ids = hero_ids if scope == "hero" else core_ids
    records = []
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        linked = [d for d in record.get("diseases", []) if d["mondo_id"] in scope_ids]
        if not linked or not (record.get("abstract") or "").strip():
            continue
        record["is_hero"] = any(d["mondo_id"] in hero_ids for d in record.get("diseases", []))
        record["_order"] = (not record["is_hero"], min(d.get("rank", 999) for d in linked), int(pmid_digits(record["pmid"]) or 0))
        records.append(record)
    records.sort(key=lambda r: r["_order"])
    return records[:limit] if limit else records


# ---------------------------------------------------------------------------------------------------- model call + cache
def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", value)


def cache_path(cache_dir: Path, model: str, version: str, pmid: str) -> Path:
    return cache_dir / safe_name(model) / version / f"{pmid_digits(pmid)}.json"


def write_atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + f".tmp{threading.get_ident()}")
    tmp.write_text(text)
    tmp.replace(path)


def extract_one(client, model: str, record: dict, prompt: str, version: str, cache_dir: Path,
                reasoning: dict | None = None, sleep: Callable[[float], None] | None = None) -> dict:
    """One abstract -> raw claims. Cache hit if available; no client = cache-only (returns skipped)."""
    path = cache_path(cache_dir, model, version, record["pmid"])
    if path.exists():
        cached = json.loads(path.read_text())
        return {"pmid": record["pmid"], "claims": cached["claims"], "usage": cached.get("usage", {}), "from_cache": True}
    if client is None:
        return {"pmid": record["pmid"], "skipped": "no API key and not in cache"}
    kwargs = {"model": model, "instructions": prompt, "input": user_message(record), "text_format": ExtractionResult}
    if reasoning:
        kwargs["reasoning"] = reasoning
    retry_kwargs = {"sleep": sleep} if sleep else {}
    try:
        response = openai_config.with_retry(lambda: client.responses.parse(**kwargs), **retry_kwargs)
    except Exception as exc:  # noqa: BLE001 - one failed abstract must not stop the run
        return {"pmid": record["pmid"], "error": f"{type(exc).__name__}: {str(exc)[:300]}"}
    parsed = getattr(response, "output_parsed", None)
    input_tokens, output_tokens = openai_config.usage_tokens(getattr(response, "usage", None))
    usage = {"input_tokens": input_tokens, "output_tokens": output_tokens}
    if parsed is None:
        return {"pmid": record["pmid"], "error": "no parsed output (refusal or truncated)", "usage": usage}
    claims = [c.model_dump() for c in parsed.claims]
    write_atomic(path, json.dumps({"pmid": record["pmid"], "model": model, "prompt_version": version,
                                   "created": now_iso(), "claims": claims, "usage": usage}, ensure_ascii=False, indent=1))
    return {"pmid": record["pmid"], "claims": claims, "usage": usage, "from_cache": False}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


# ---------------------------------------------------------------------------------------------------- claims -> edges
def claim_text(subject: str, predicate: str, obj: str, polarity: str) -> str:
    return f"{subject} {predicate} {obj}" + (" (contradicted)" if polarity == "contradicts" else "")


def accept(raw: dict, record: dict, placement: tuple, index: EntityIndex, model: str, version: str) -> dict:
    source, target, edge_type, subject_id, object_id = placement
    pmid = pmid_digits(record["pmid"])
    model_confidence = max(0.0, min(1.0, float(raw.get("confidence") or 0.0)))
    claim_id = "c_" + hashlib.sha1(f"{pmid}|{subject_id}|{raw['predicate']}|{object_id}|{raw['polarity']}".encode()).hexdigest()[:12]
    return {
        "claim_id": claim_id, "pmid": pmid, "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/", "title": record.get("title"),
        "is_hero": record.get("is_hero", False), "subject": raw["subject"], "subject_id": subject_id, "subject_label": index.labels[subject_id],
        "predicate": raw["predicate"], "object": raw["object"], "object_id": object_id, "object_label": index.labels[object_id],
        "polarity": raw["polarity"], "study_context": raw.get("study_context", "not_stated"), "snippet": normalize_text(raw["snippet"]).strip("\"' "),
        "confidence_model": model_confidence, "confidence": round(min(model_confidence, CONFIDENCE_CAP), 2),
        "edge_id": edge_id(source, target, edge_type), "edge_source": source, "edge_target": target, "edge_type": edge_type,
        "date": (record.get("pub_date") or "")[:10] or None, "model": model, "prompt_version": version,
    }


def build_edges(claims: list[dict]) -> list[dict]:
    edges: dict[tuple[str, str, str], dict] = {}
    for claim in claims:
        key = (claim["edge_source"], claim["edge_target"], claim["edge_type"])
        edge = edges.setdefault(key, {"id": claim["edge_id"], "source": key[0], "target": key[1], "type": key[2],
                                      "evidence": [], "contradicting": []})
        evidence = {
            "db": DB, "origin": ORIGIN, "record": f"PMID:{claim['pmid']}", "url": claim["url"], "level": LEVEL,
            "date": claim["date"], "confidence": claim["confidence"], "snippet": claim["snippet"],
            "claim": claim_text(claim["subject"], claim["predicate"], claim["object"], claim["polarity"]),
            "claim_id": claim["claim_id"], "predicate": claim["predicate"], "polarity": claim["polarity"],
            "study_context": claim["study_context"], "model": claim["model"], "prompt_version": claim["prompt_version"],
        }
        (edge["contradicting"] if claim["polarity"] == "contradicts" else edge["evidence"]).append(evidence)
    out = sorted(edges.values(), key=lambda e: e["id"])
    for edge in out:  # same aggregates as 03_build_graph
        edge["confidence"] = max((ev["confidence"] for ev in edge["evidence"]), default=0.0)
        edge["independent_sources"] = sorted({ev["origin"] for ev in edge["evidence"]})  # as in 03: origins, not papers
        edge["pmids"] = sorted({ev["record"] for ev in edge["evidence"] + edge["contradicting"]})
        edge["level"] = LEVEL if edge["evidence"] else "contradicted"
    return out


# ---------------------------------------------------------------------------------------------------- run
def run(records: list[dict], client, model: str, index: EntityIndex, out_dir: Path | None = None, cache_dir: Path | None = None,
        concurrency: int = 8, reasoning: dict | None = None, sleep: Callable[[float], None] | None = None, scope: str = "hero") -> dict:
    out_dir, cache_dir = out_dir or OUT_DIR, cache_dir or CACHE_DIR
    prompt, version = prompt_text(), prompt_version()
    by_pmid = {r["pmid"]: r for r in records}
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=max(1, concurrency)) as pool:
        futures = [pool.submit(extract_one, client, model, r, prompt, version, cache_dir, reasoning, sleep) for r in records]
        for done, future in enumerate(as_completed(futures), 1):
            results.append(future.result())
            if done % 25 == 0 or done == len(futures):
                print(f"[extract] {done}/{len(futures)} abstracts", flush=True)
    results.sort(key=lambda r: by_pmid[r["pmid"]]["_order"] if "_order" in by_pmid[r["pmid"]] else r["pmid"])

    accepted: dict[str, dict] = {}
    rejected: list[dict] = []
    for result in results:
        record = by_pmid[result["pmid"]]
        for raw in result.get("claims", []):
            placement, reasons, details = validate_claim(raw, record, index)
            if reasons:
                rejected.append({"pmid": record["pmid"], "reasons": reasons, "claim": raw, **details, "model": model, "prompt_version": version})
                continue
            claim = accept(raw, record, placement, index, model, version)
            if claim["claim_id"] not in accepted or claim["confidence_model"] > accepted[claim["claim_id"]]["confidence_model"]:
                accepted[claim["claim_id"]] = claim
    claims = list(accepted.values())
    edges = build_edges(claims)

    fresh = [r for r in results if r.get("claims") is not None and not r.get("from_cache")]
    failed = [{"pmid": r["pmid"], "error": r["error"]} for r in results if r.get("error")]
    skipped = [r["pmid"] for r in results if r.get("skipped")]
    input_tokens = sum(r.get("usage", {}).get("input_tokens", 0) for r in results if not r.get("from_cache"))
    output_tokens = sum(r.get("usage", {}).get("output_tokens", 0) for r in results if not r.get("from_cache"))
    reason_counts: dict[str, int] = {}
    for item in rejected:
        for reason in item["reasons"]:
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
    summary = {"abstracts": len(records), "answered": len(results) - len(failed) - len(skipped), "from_cache": sum(1 for r in results if r.get("from_cache")),
               "fresh_calls": len(fresh), "failed": failed, "skipped_no_key": len(skipped),
               "claims_raw": sum(len(r.get("claims", [])) for r in results), "claims_accepted": len(claims), "claims_rejected": len(rejected),
               "reject_reasons": dict(sorted(reason_counts.items(), key=lambda kv: -kv[1])),
               "edges": len(edges), "edges_with_contradicting": sum(1 for e in edges if e["contradicting"]),
               "usage": {"input_tokens": input_tokens, "output_tokens": output_tokens}}
    if summary["answered"] == 0:
        return summary  # nothing to write: keep whatever an earlier run produced

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "claims.jsonl").write_text("".join(json.dumps(c, ensure_ascii=False) + "\n" for c in claims))
    (out_dir / "rejected.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rejected))
    meta = {"generated": now_iso(), "step": "05_openai_extract", "model": model, "prompt_version": version, "scope": scope,
            "level": LEVEL, "origin": ORIGIN, "confidence_cap": CONFIDENCE_CAP, "predicates": PREDICATES,
            "note": "every edge has a PMID and a verbatim abstract snippet; model claims that failed a grounding check are in rejected.jsonl",
            **{k: v for k, v in summary.items() if k != "usage"}}
    (out_dir / "edges_text_mined.json").write_text(json.dumps({"meta": meta, "edges": edges}, ensure_ascii=False, indent=0))
    return summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--scope", choices=["hero", "core"], default="hero")
    parser.add_argument("--limit", type=int, default=None, help="only the first N abstracts (hero first)")
    parser.add_argument("--concurrency", type=int, default=8)
    parser.add_argument("--input", type=Path, default=EUROPEPMC)
    args = parser.parse_args(argv)

    if not args.input.exists():
        print(f"[extract] {args.input} missing: run `make enrich` first. Skipped.")
        return 0
    records = load_abstracts(args.input, args.scope, args.limit)
    approx_tokens = sum(len(r["abstract"]) + len(r.get("title") or "") for r in records) // 4 + len(records) * len(prompt_text()) // 4
    print(f"[extract] scope {args.scope}: {len(records)} abstracts (≈ {approx_tokens:,} input tokens incl. prompt)")
    model = openai_config.model_for("extract")
    if not model:
        print("[extract] " + openai_config.hint(["extract"], "extract") + " Skipped, nothing written.")
        return 0
    client = None
    if openai_config.api_key():
        client = openai_config.make_client()
    else:
        print(f"[extract] no {openai_config.KEY_VAR}: cache-only run (model {model}, prompt {prompt_version()})")
    index = EntityIndex.from_files()
    summary = run(records, client, model, index, concurrency=args.concurrency, reasoning=openai_config.reasoning_for("extract"), scope=args.scope)
    if summary["answered"] == 0:
        print("[extract] nothing answered (no key and no cache, or every call failed). Outputs left untouched. "
              + openai_config.hint(["extract"], "extract"))
        for failure in summary["failed"][:5]:
            print(f"  PMID {failure['pmid']}: {failure['error']}")
        return 0
    print(f"[extract] {summary['claims_accepted']} claims accepted, {summary['claims_rejected']} rejected {summary['reject_reasons']} · "
          f"{summary['edges']} edges ({summary['edges_with_contradicting']} with contradicting) → {OUT_DIR}/")
    if summary["failed"]:
        print(f"[extract] {len(summary['failed'])} abstracts failed, first: {summary['failed'][0]}")
    print(openai_config.cost_line("extract", model, summary["usage"]["input_tokens"], summary["usage"]["output_tokens"],
                                  summary["fresh_calls"] + summary["from_cache"], summary["from_cache"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
