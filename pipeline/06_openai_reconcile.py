"""06_openai_reconcile — patient-organisation disease names (free text) -> MONDO IDs -> advocated_by edges.

Input : data/curated/orgs.csv, ONLY rows with verified_date set (checked by hand on the org's own page). Unverified rows are
        skipped and listed. data/curated/orgs_draft.csv is read only with --allow-draft; those org nodes and their evidence
        carry draft_input: true and meta.warning (tests only, never ship). An org without url gets no node and no edge: its
        names land in unmatched.csv with reason "no url". Column disease_names is split at ";".
        Disease catalog: label + synonyms of all slice diseases.
Method: openai (default when OPENAI_API_KEY, OPENAI_MODEL_EMBED and OPENAI_MODEL_JUDGE are set)
          1. embeddings (OPENAI_MODEL_EMBED) of every catalog name, computed once and cached; top-5 MONDO by cosine
          2. judge (OPENAI_MODEL_JUDGE, Structured Outputs) picks one of the 5 or "none"; the schema only allows those IDs
          -> evidence origin "OpenAI judge", level text_mined. An API failure for one name falls back to fuzzy for that name.
        fuzzy (no key): rapidfuzz token_sort_ratio >= FUZZY_THRESHOLD on normalised names, unique best, label beats
          synonym -> evidence origin "fuzzy", level inferred.
Output: data/reconcile/org_disease_edges.json   {meta, nodes: org nodes ORG:<slug>, edges: disease -advocated_by-> org}
        data/reconcile/unmatched.csv            names without a MONDO match (input for the honest-gap screen)
Cache : data/cache/openai/reconcile/embeddings_<model>.npz, data/cache/openai/reconcile/judge/<model>/<prompt_version>/

  uv run --project pipeline python pipeline/06_openai_reconcile.py [--method auto|openai|fuzzy] [--orgs PATH] [--allow-draft [--draft PATH]]
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Callable, Literal

import numpy as np
from pydantic import create_model
from rapidfuzz import fuzz, process

sys.path.insert(0, str(Path(__file__).resolve().parent))
import openai_config  # noqa: E402
from enrich.diseases import normalize as normalize_name  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ORGS = ROOT / "data" / "curated" / "orgs.csv"
ORGS_DRAFT = ROOT / "data" / "curated" / "orgs_draft.csv"
SLICE = ROOT / "data" / "slice.json"
OUT_DIR = ROOT / "data" / "reconcile"
CACHE_DIR = ROOT / "data" / "cache" / "openai" / "reconcile"
PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "reconcile.md"

TOP_K = 5
FUZZY_THRESHOLD = 92          # token_sort_ratio on normalised names; exact label/synonym = 100
JUDGE_MIN_CONFIDENCE = 0.5    # below: treated as "none" and listed in unmatched.csv
EMBED_BATCH = 256
EDGE_TYPE = "advocated_by"
DB = "Constellate reconcile"
ORIGIN_OPENAI, ORIGIN_FUZZY = "OpenAI judge", "fuzzy"
LEVEL_BY_ORIGIN = {ORIGIN_OPENAI: "text_mined", ORIGIN_FUZZY: "inferred"}
LEVEL_ORDER = ["observed", "curated", "text_mined", "inferred"]
ORG_FIELDS = ["country", "has_registry", "registry_url", "has_natural_history_study", "nhs_url", "has_biobank", "contact_url",
              "notes", "verified_date"]
UNMATCHED_COLUMNS = ["org_name", "org_id", "org_url", "disease_name", "method", "reason", "top_candidates", "input_file"]
NO_URL = "no url"


class CacheMiss(RuntimeError):
    pass


# ---------------------------------------------------------------------------------------------------- input
def read_orgs(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return [row for row in csv.DictReader(handle) if (row.get("org_name") or "").strip()]


def load_input(orgs: Path | None = None, draft: Path | None = None, allow_draft: bool = False) -> tuple[list[dict], dict]:
    """Rows that may enter the product: orgs.csv rows with verified_date; with allow_draft also orgs_draft.csv rows
    (flagged _draft, skipped when the same org is already verified). Every row gets _input_file and _draft."""
    orgs, draft = orgs or ORGS, draft or ORGS_DRAFT
    rows: list[dict] = []
    report = {"verified": 0, "skipped_unverified": [], "draft": 0, "draft_skipped_as_verified": 0}
    seen: set[str] = set()
    for row in read_orgs(orgs):
        if not (row.get("verified_date") or "").strip():
            report["skipped_unverified"].append(row["org_name"].strip())
            continue
        seen.add(slugify(row["org_name"]))
        rows.append(row | {"_input_file": orgs.name, "_draft": False})
        report["verified"] += 1
    if allow_draft:
        for row in read_orgs(draft):
            if slugify(row["org_name"]) in seen:
                report["draft_skipped_as_verified"] += 1
                continue
            seen.add(slugify(row["org_name"]))
            rows.append(row | {"_input_file": draft.name, "_draft": True})
            report["draft"] += 1
    return rows, report


def split_names(value: str | None) -> list[str]:
    seen: set[str] = set()
    names = []
    for name in re.split(r";(?![^()]*\))", value or ""):  # ';' inside parentheses belongs to the name: "Niemann-Pick (ASMD; NPC)"
        name = " ".join(name.split())
        if name and name.lower() not in seen:
            seen.add(name.lower())
            names.append(name)
    return names


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", normalize_name(text).strip()).strip("-") or "org"


# ---------------------------------------------------------------------------------------------------- catalog
@dataclass
class Catalog:
    mondo_ids: list[str] = field(default_factory=list)        # one entry per (disease, name)
    names: list[str] = field(default_factory=list)
    normalized: list[str] = field(default_factory=list)
    is_label: list[bool] = field(default_factory=list)
    labels: dict[str, str] = field(default_factory=dict)
    synonyms: dict[str, list[str]] = field(default_factory=dict)
    definitions: dict[str, str] = field(default_factory=dict)
    by_normalized: dict[str, list[int]] = field(default_factory=dict)

    @classmethod
    def from_slice(cls, slice_data: dict) -> "Catalog":
        catalog = cls()
        for mondo_id in sorted(slice_data["mondo"]):
            node = slice_data["mondo"][mondo_id]
            catalog.labels[mondo_id] = node["label"]
            catalog.synonyms[mondo_id] = list(node.get("synonyms") or [])
            catalog.definitions[mondo_id] = node.get("definition") or ""
            seen: set[str] = set()
            for is_label, name in [(True, node["label"])] + [(False, s) for s in node.get("synonyms") or []]:
                key = normalize_name(name).strip()
                if not key or key in seen:
                    continue
                seen.add(key)
                catalog.by_normalized.setdefault(key, []).append(len(catalog.names))
                catalog.mondo_ids.append(mondo_id)
                catalog.names.append(name)
                catalog.normalized.append(key)
                catalog.is_label.append(is_label)
        return catalog

    @classmethod
    def from_file(cls, path: Path | None = None) -> "Catalog":
        return cls.from_slice(json.loads((path or SLICE).read_text()))


@dataclass
class Decision:
    name: str
    mondo_id: str | None
    confidence: float
    reason: str
    origin: str
    details: dict = field(default_factory=dict)
    candidates: list[dict] = field(default_factory=list)


def name_variants(name: str) -> list[str]:
    """'Krabbe Disease (Globoid Cell Leukodystrophy)' -> full, without parentheses, the parenthesised part."""
    variants = [name]
    stripped = re.sub(r"\s*\([^)]*\)", "", name).strip()
    if stripped and stripped != name:
        variants.append(stripped)
    variants += [inner.strip() for inner in re.findall(r"\(([^)]*)\)", name) if len(inner.strip()) >= 4]
    return variants


# ---------------------------------------------------------------------------------------------------- fuzzy
ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6", "vii": "7", "viii": "8", "ix": "9", "x": "10"}
NUMBERED = {"type", "group", "class", "form", "subtype", "grade"}


def fuzzy_key(text: str) -> str:
    """Normalised name with roman type numbers as digits: 'Gaucher disease type I' -> 'gaucher disease type 1'."""
    tokens = normalize_name(text).split()
    out = []
    for i, token in enumerate(tokens):
        numbered = (i > 0 and tokens[i - 1] in NUMBERED) or i == len(tokens) - 1
        out.append(ROMAN[token] if token in ROMAN and (token != "i" or numbered) else token)
    return " ".join(out)


def discriminators(key: str) -> frozenset[str]:
    """Tokens that tell sibling diseases apart: numbers ('1', '3c') and single letters ('a' in 'type A')."""
    return frozenset(t for t in key.split() if any(c.isdigit() for c in t) or len(t) == 1)


def fuzzy_match(name: str, catalog: Catalog, threshold: int = FUZZY_THRESHOLD) -> Decision:
    """Unique best token_sort_ratio >= threshold; label beats synonym on ties; type numbers/letters must agree
    (otherwise 'Gaucher disease type 1' scores 93 against 'Gaucher disease type 3C')."""
    by_key: dict[str, list[int]] = {}
    for i, normalized in enumerate(catalog.normalized):
        by_key.setdefault(fuzzy_key(normalized), []).append(i)
    best: dict[str, tuple[float, bool, str]] = {}      # mondo -> (score, is_label, matched name), discriminators agree
    near_misses: dict[str, tuple[float, str]] = {}      # same, but different type number/letter: shown, never chosen
    for variant in name_variants(name):
        query = fuzzy_key(variant)
        if not query:
            continue
        for choice, score, _ in process.extract(query, list(by_key), scorer=fuzz.token_sort_ratio, limit=15):
            agrees = discriminators(choice) == discriminators(query)
            for i in by_key[choice]:
                mondo_id = catalog.mondo_ids[i]
                if not agrees:
                    if score > near_misses.get(mondo_id, (-1.0, ""))[0]:
                        near_misses[mondo_id] = (float(score), catalog.names[i])
                    continue
                candidate = (float(score), catalog.is_label[i], catalog.names[i])
                if mondo_id not in best or candidate[:2] > best[mondo_id][:2]:
                    best[mondo_id] = candidate
    ranked = sorted(best.items(), key=lambda kv: (-kv[1][0], not kv[1][1], kv[0]))
    candidates = [{"mondo_id": m, "label": catalog.labels[m], "score": round(s, 1), "matched_name": n} for m, (s, _, n) in ranked[:TOP_K]]
    candidates += [{"mondo_id": m, "label": catalog.labels[m], "score": round(s, 1), "matched_name": n, "type_differs": True}
                   for m, (s, n) in sorted(near_misses.items(), key=lambda kv: -kv[1][0])[:2] if m not in best]
    details = {"scorer": "rapidfuzz token_sort_ratio on normalised names", "threshold": threshold}
    if not ranked or ranked[0][1][0] < threshold:
        top = f"best {ranked[0][1][0]:.0f} < {threshold}" if ranked else "no candidate with the same type number"
        return Decision(name, None, 0.0, f"no fuzzy match ({top})", ORIGIN_FUZZY, details, candidates)
    top_score = ranked[0][1][0]
    tied = [(m, info) for m, info in ranked if info[0] == top_score]
    if len(tied) > 1:
        label_hits = [(m, info) for m, info in tied if info[1]]
        tied = label_hits if len(label_hits) == 1 else tied
    if len(tied) > 1:
        return Decision(name, None, 0.0, "ambiguous: " + ", ".join(f"{m} {catalog.labels[m]}" for m, _ in tied[:4]),
                        ORIGIN_FUZZY, details, candidates)
    mondo_id, (score, is_label, matched) = tied[0]
    details.update(score=round(score, 1), matched_name=matched, matched_as="label" if is_label else "synonym")
    reason = f"fuzzy {score:.0f}/100 against MONDO {'label' if is_label else 'synonym'} '{matched}'"
    return Decision(name, mondo_id, round(score / 100, 2), reason, ORIGIN_FUZZY, details, candidates)


# ---------------------------------------------------------------------------------------------------- embeddings
def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", value)


def text_key(text: str) -> str:
    return hashlib.sha1(text.encode()).hexdigest()


class EmbeddingCache:
    """sha1(text) -> unit vector, one .npz per embedding model. Only missing texts are sent to the API."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.vectors: dict[str, np.ndarray] = {}
        self.input_tokens = 0
        self.calls = 0
        self.lock = threading.Lock()
        if path.exists():
            data = np.load(path, allow_pickle=False)
            self.vectors = dict(zip(data["keys"].tolist(), data["vectors"]))

    def save(self) -> None:
        if not self.vectors:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        keys = list(self.vectors)
        tmp = self.path.with_name(self.path.stem + ".tmp.npz")
        np.savez(tmp, keys=np.array(keys), vectors=np.stack([self.vectors[k] for k in keys]).astype(np.float32))
        tmp.replace(self.path)

    def embed(self, texts: list[str], client, model: str, sleep: Callable[[float], None] | None = None) -> np.ndarray:
        with self.lock:  # judge threads may embed concurrently when the batch pre-embedding failed
            return self._embed(texts, client, model, sleep)

    def _embed(self, texts: list[str], client, model: str, sleep: Callable[[float], None] | None) -> np.ndarray:
        missing = list(dict.fromkeys(t for t in texts if text_key(t) not in self.vectors))
        if missing and client is None:
            raise CacheMiss(f"{len(missing)} texts not embedded yet and no API key")
        retry_kwargs = {"sleep": sleep} if sleep else {}
        for start in range(0, len(missing), EMBED_BATCH):
            batch = missing[start:start + EMBED_BATCH]
            response = openai_config.with_retry(lambda: client.embeddings.create(model=model, input=batch), **retry_kwargs)
            self.calls += 1
            self.input_tokens += openai_config.usage_tokens(getattr(response, "usage", None))[0]
            for item in sorted(response.data, key=lambda d: d.index):
                vector = np.asarray(item.embedding, dtype=np.float32)
                self.vectors[text_key(batch[item.index])] = vector / (np.linalg.norm(vector) or 1.0)
        if missing:
            self.save()
        return np.stack([self.vectors[text_key(t)] for t in texts]) if texts else np.zeros((0, 0), dtype=np.float32)


def embedding_candidates(query_vector: np.ndarray, catalog_matrix: np.ndarray, catalog: Catalog, k: int = TOP_K) -> list[dict]:
    """Top-k MONDO diseases by cosine, max over each disease's label + synonyms."""
    scores = catalog_matrix @ query_vector
    best: dict[str, tuple[float, int]] = {}
    for i in np.argsort(-scores):
        mondo_id = catalog.mondo_ids[int(i)]
        if mondo_id not in best:
            best[mondo_id] = (float(scores[int(i)]), int(i))
            if len(best) == k:
                break
    return [{"mondo_id": m, "label": catalog.labels[m], "similarity": round(s, 4), "matched_name": catalog.names[i]} for m, (s, i) in best.items()]


# ---------------------------------------------------------------------------------------------------- judge
def prompt_text() -> str:
    return PROMPT_FILE.read_text()


def prompt_version() -> str:
    return "reconcile-" + hashlib.sha1(prompt_text().encode()).hexdigest()[:8]


def decision_model(candidate_ids: list[str]):
    """Structured Output schema whose mondo_id can only be one of the candidates or 'none'."""
    choice = Literal[tuple(candidate_ids) + ("none",)]  # type: ignore[valid-type]
    return create_model("ReconcileDecision", reason=(str, ...), mondo_id=(choice, ...), confidence=(float, ...))


def judge_message(name: str, org: dict, candidates: list[dict], catalog: Catalog) -> str:
    lines = [f"Organisation: {org.get('org_name')} ({org.get('url') or 'no url'}), country {org.get('country') or 'n/a'}",
             f"All disease names listed by the organisation: {org.get('disease_names') or ''}",
             f"Free-text disease name to map: \"{name}\"", "", "Candidates:"]
    for n, c in enumerate(candidates, 1):
        synonyms = "; ".join(catalog.synonyms.get(c["mondo_id"], [])[:10]) or "none"
        definition = (catalog.definitions.get(c["mondo_id"]) or "n/a")[:300]
        lines.append(f"{n}. {c['mondo_id']} | {c['label']} | synonyms: {synonyms} | definition: {definition}")
    return "\n".join(lines)


def judge(name: str, org: dict, candidates: list[dict], catalog: Catalog, client, model: str, cache_dir: Path,
          reasoning: dict | None = None, sleep: Callable[[float], None] | None = None) -> tuple[dict, dict]:
    """(decision dict, usage). Cached per (model, prompt_version, name, org, candidate IDs)."""
    ids = [c["mondo_id"] for c in candidates]
    version = prompt_version()
    key = text_key(json.dumps([name, org.get("org_name"), ids]))
    path = cache_dir / "judge" / safe_name(model) / version / f"{key}.json"
    if path.exists():
        cached = json.loads(path.read_text())
        return cached["decision"], {"input_tokens": 0, "output_tokens": 0, "cached": True}
    if client is None:
        raise CacheMiss("judge answer not cached and no API key")
    schema = decision_model(ids)
    kwargs = {"model": model, "instructions": prompt_text(), "input": judge_message(name, org, candidates, catalog), "text_format": schema}
    if reasoning:
        kwargs["reasoning"] = reasoning
    retry_kwargs = {"sleep": sleep} if sleep else {}
    response = openai_config.with_retry(lambda: client.responses.parse(**kwargs), **retry_kwargs)
    parsed = getattr(response, "output_parsed", None)
    if parsed is None:
        raise RuntimeError("judge returned no parsed output (refusal or truncated)")
    decision = parsed.model_dump()
    input_tokens, output_tokens = openai_config.usage_tokens(getattr(response, "usage", None))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"name": name, "org": org.get("org_name"), "candidates": ids, "model": model, "prompt_version": version,
                                "decision": decision, "usage": {"input_tokens": input_tokens, "output_tokens": output_tokens}}, indent=1))
    return decision, {"input_tokens": input_tokens, "output_tokens": output_tokens, "cached": False}


# ---------------------------------------------------------------------------------------------------- reconcile
@dataclass
class OpenAIContext:
    client: object
    embed_model: str
    judge_model: str
    embeddings: EmbeddingCache
    catalog_matrix: np.ndarray
    cache_dir: Path
    reasoning: dict | None = None
    sleep: Callable[[float], None] | None = None
    usage: dict = field(default_factory=lambda: {"judge_calls": 0, "judge_cached": 0, "input_tokens": 0, "output_tokens": 0})


def openai_decide(name: str, org: dict, catalog: Catalog, ctx: OpenAIContext) -> Decision:
    vector = ctx.embeddings.embed([name], ctx.client, ctx.embed_model, ctx.sleep)[0]
    candidates = embedding_candidates(vector, ctx.catalog_matrix, catalog)
    decision, usage = judge(name, org, candidates, catalog, ctx.client, ctx.judge_model, ctx.cache_dir, ctx.reasoning, ctx.sleep)
    ctx.usage["judge_calls"] += 1
    ctx.usage["judge_cached"] += int(usage["cached"])
    ctx.usage["input_tokens"] += usage["input_tokens"]
    ctx.usage["output_tokens"] += usage["output_tokens"]
    details = {"model": ctx.judge_model, "embedding_model": ctx.embed_model, "prompt_version": prompt_version()}
    confidence = max(0.0, min(1.0, float(decision.get("confidence") or 0.0)))
    chosen = decision.get("mondo_id")
    if chosen not in {c["mondo_id"] for c in candidates}:  # schema already forbids it; checked again because it is cheap
        return Decision(name, None, confidence, f"judge: none ({decision.get('reason')})", ORIGIN_OPENAI, details, candidates)
    if confidence < JUDGE_MIN_CONFIDENCE:
        return Decision(name, None, confidence, f"judge confidence {confidence:.2f} < {JUDGE_MIN_CONFIDENCE} ({decision.get('reason')})",
                        ORIGIN_OPENAI, details, candidates)
    return Decision(name, chosen, round(confidence, 2), decision.get("reason") or "", ORIGIN_OPENAI, details, candidates)


def edge_id(source: str, target: str, edge_type: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:12]  # identical to 03_build_graph


def org_node(row: dict, org_id: str) -> dict:
    node = {"id": org_id, "type": "org", "label": row["org_name"].strip(), "url": (row.get("url") or "").strip() or None,
            "disease_names": split_names(row.get("disease_names")),
            "orpha_ids": [x.strip() for x in (row.get("orpha_ids") or "").split(";") if x.strip()]}
    node.update({k: (row.get(k) or "").strip() or None for k in ORG_FIELDS})
    node.update(input_file=row.get("_input_file", ORGS.name), draft_input=bool(row.get("_draft")))
    return node


def evidence_for(decision: Decision, row: dict, org_url: str, catalog: Catalog) -> dict:
    label = catalog.labels[decision.mondo_id]
    evidence = {
        "db": DB, "origin": decision.origin, "record": org_url, "url": org_url, "level": LEVEL_BY_ORIGIN[decision.origin],
        "date": (row.get("verified_date") or "").strip() or date.today().isoformat(), "confidence": decision.confidence,
        "snippet": f"\"{decision.name}\" (disease name on the {row['org_name'].strip()} website) → {decision.mondo_id} {label}",
        "reason": decision.reason, "free_text_name": decision.name, "input_file": row.get("_input_file", ORGS.name),
        "draft_input": bool(row.get("_draft")), **decision.details,
    }
    if decision.origin == ORIGIN_OPENAI:
        evidence["candidates"] = [{k: c[k] for k in ("mondo_id", "label", "similarity")} for c in decision.candidates]
    return evidence


def unmatched_row(row: dict, org_id: str, name: str, method: str, reason: str, candidates: list[dict] | None = None) -> dict:
    return {"org_name": row["org_name"].strip(), "org_id": org_id, "org_url": (row.get("url") or "").strip(), "disease_name": name,
            "method": method, "reason": reason, "input_file": row.get("_input_file", ORGS.name),
            "top_candidates": " | ".join(f"{c['mondo_id']} {c['label']} ({c.get('similarity', c.get('score'))})" for c in (candidates or [])[:3])}


def reconcile(rows: list[dict], catalog: Catalog, ctx: OpenAIContext | None = None, concurrency: int = 8) -> dict:
    """ctx None = fuzzy only. With ctx, a failing API call for one name falls back to fuzzy for that name.
    Orgs without url: no node, no edge, every name -> unmatched with reason NO_URL (an edge needs record/url)."""
    jobs: list[tuple[dict, str, str]] = []
    nodes: dict[str, dict] = {}
    unmatched: list[dict] = []
    no_url_orgs = 0
    for row in rows:
        org_id = "ORG:" + slugify(row["org_name"])
        if org_id in nodes:
            continue
        if not (row.get("url") or "").strip():
            no_url_orgs += 1
            unmatched.extend(unmatched_row(row, org_id, name, "skipped", NO_URL) for name in split_names(row.get("disease_names")) or [""])
            continue
        nodes[org_id] = org_node(row, org_id)
        jobs.extend((row, org_id, name) for name in split_names(row.get("disease_names")))

    def decide(job: tuple[dict, str, str]) -> Decision:
        row, _, name = job
        if ctx is None:
            return fuzzy_match(name, catalog)
        try:
            return openai_decide(name, row, catalog, ctx)
        except Exception as exc:  # noqa: BLE001 - one name must not stop the run; fuzzy is the documented fallback
            fallback = fuzzy_match(name, catalog)
            fallback.details["fallback_from"] = f"OpenAI failed: {type(exc).__name__}: {str(exc)[:200]}"
            return fallback

    if ctx is not None:  # embed all names in one go (fewer calls), then judge in parallel
        try:
            ctx.embeddings.embed([name for _, _, name in jobs], ctx.client, ctx.embed_model, ctx.sleep)
        except Exception as exc:  # noqa: BLE001
            print(f"[reconcile] embedding the org names failed ({type(exc).__name__}): per-name fallback to fuzzy")
    with ThreadPoolExecutor(max_workers=max(1, concurrency if ctx else 1)) as pool:
        decisions = list(pool.map(decide, jobs))

    edges: dict[tuple[str, str, str], dict] = {}
    for (row, org_id, name), decision in zip(jobs, decisions):
        org_url = nodes[org_id]["url"]
        if decision.mondo_id is None:
            unmatched.append(unmatched_row(row, org_id, name, decision.origin, decision.reason, decision.candidates))
            continue
        key = (decision.mondo_id, org_id, EDGE_TYPE)
        edge = edges.setdefault(key, {"id": edge_id(*key), "source": key[0], "target": key[1], "type": EDGE_TYPE,
                                      "evidence": [], "contradicting": []})
        edge["evidence"].append(evidence_for(decision, row, org_url, catalog))
    edge_list = sorted(edges.values(), key=lambda e: e["id"])
    for edge in edge_list:  # same aggregates as 03_build_graph
        edge["confidence"] = max(ev["confidence"] for ev in edge["evidence"])
        edge["independent_sources"] = sorted({ev["origin"] for ev in edge["evidence"]})
        edge["level"] = min((ev["level"] for ev in edge["evidence"]), key=LEVEL_ORDER.index)
    origins = [d.origin for d in decisions if d.mondo_id]
    return {"nodes": sorted(nodes.values(), key=lambda n: n["id"]), "edges": edge_list, "unmatched": unmatched,
            "summary": {"orgs": len(nodes), "orgs_without_url": no_url_orgs, "draft_orgs": sum(1 for n in nodes.values() if n["draft_input"]),
                        "names": len(jobs), "matched": sum(1 for d in decisions if d.mondo_id), "unmatched": len(unmatched),
                        "edges": len(edge_list), "matched_by": {o: origins.count(o) for o in sorted(set(origins))},
                        "fallbacks": sum(1 for d in decisions if "fallback_from" in d.details)}}


def write_outputs(result: dict, out_dir: Path, method: str, ctx: OpenAIContext | None, input_report: dict | None = None) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    is_draft = any(n["draft_input"] for n in result["nodes"])
    meta = {"generated": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"), "step": "06_openai_reconcile",
            "input_files": sorted({n["input_file"] for n in result["nodes"]} | {u["input_file"] for u in result["unmatched"]}),
            "input_is_draft": is_draft, "input_rule": "orgs.csv rows with verified_date; orgs_draft.csv only with --allow-draft",
            "method": method, "edge_type": EDGE_TYPE, "levels": LEVEL_BY_ORIGIN, "fuzzy_threshold": FUZZY_THRESHOLD,
            "judge_min_confidence": JUDGE_MIN_CONFIDENCE, **result["summary"]}
    if input_report:
        meta["skipped_unverified"] = input_report["skipped_unverified"]
    if is_draft:
        meta["warning"] = "contains orgs from orgs_draft.csv (unverified draft, tests only, draft_input: true): do not ship these edges"
    if ctx is not None:
        meta.update(judge_model=ctx.judge_model, embedding_model=ctx.embed_model, prompt_version=prompt_version())
    (out_dir / "org_disease_edges.json").write_text(json.dumps({"meta": meta, "nodes": result["nodes"], "edges": result["edges"]},
                                                               ensure_ascii=False, indent=1))
    with (out_dir / "unmatched.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=UNMATCHED_COLUMNS)
        writer.writeheader()
        writer.writerows(result["unmatched"])


def existing_is_draft(out_dir: Path) -> bool:
    path = out_dir / "org_disease_edges.json"
    try:
        return path.exists() and bool(json.loads(path.read_text()).get("meta", {}).get("input_is_draft"))
    except json.JSONDecodeError:
        return False


def existing_has_openai(out_dir: Path) -> bool:
    path = out_dir / "org_disease_edges.json"
    if not path.exists():
        return False
    try:
        edges = json.loads(path.read_text()).get("edges", [])
    except json.JSONDecodeError:
        return False
    return any(ev.get("origin") == ORIGIN_OPENAI for e in edges for ev in e.get("evidence", []))


def build_context(catalog: Catalog, client, embed_model: str, judge_model: str, cache_dir: Path | None = None,
                  reasoning: dict | None = None, sleep: Callable[[float], None] | None = None) -> OpenAIContext:
    cache_dir = cache_dir or CACHE_DIR
    embeddings = EmbeddingCache(cache_dir / f"embeddings_{safe_name(embed_model)}.npz")
    matrix = embeddings.embed(catalog.names, client, embed_model, sleep)
    return OpenAIContext(client, embed_model, judge_model, embeddings, matrix, cache_dir, reasoning, sleep)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--method", choices=["auto", "openai", "fuzzy"], default="auto")
    parser.add_argument("--orgs", type=Path, default=None, help="curated org CSV (default data/curated/orgs.csv); rows need verified_date")
    parser.add_argument("--allow-draft", action="store_true", help="also read the unverified draft CSV (tests only, flagged draft_input)")
    parser.add_argument("--draft", type=Path, default=None, help="draft org CSV (default data/curated/orgs_draft.csv), only with --allow-draft")
    parser.add_argument("--out-dir", type=Path, default=None)
    args = parser.parse_args(argv)
    args.out_dir = args.out_dir or OUT_DIR
    orgs_path, draft_path = args.orgs or ORGS, args.draft or ORGS_DRAFT

    rows, report = load_input(orgs_path, draft_path, args.allow_draft)
    if report["skipped_unverified"]:
        print(f"[reconcile] {len(report['skipped_unverified'])} rows in {orgs_path.name} without verified_date skipped: "
              + "; ".join(report["skipped_unverified"][:8]) + (" ..." if len(report["skipped_unverified"]) > 8 else ""))
    print(f"[reconcile] {report['verified']} verified orgs from {orgs_path.name}"
          + (f" + {report['draft']} UNVERIFIED draft orgs from {draft_path.name} (tests only, draft_input: true)" if args.allow_draft
             else f"; {draft_path.name} ignored (only with --allow-draft)"))
    if not rows:
        if existing_is_draft(args.out_dir):  # never leave draft orgs in the product after a default run
            write_outputs({"nodes": [], "edges": [], "unmatched": [], "summary": {"orgs": 0, "names": 0, "matched": 0, "unmatched": 0,
                                                                                   "edges": 0}}, args.out_dir, "none", None, report)
            print(f"[reconcile] no verified org rows: replaced the draft-based output in {args.out_dir} with an empty one.")
        else:
            print("[reconcile] no verified org rows: nothing to reconcile. Skipped.")
        return 0
    catalog = Catalog.from_file()
    ready = not openai_config.missing(["embed", "judge"])
    method = args.method if args.method != "auto" else ("openai" if ready else "fuzzy")
    if method == "openai" and not ready:
        print("[reconcile] " + openai_config.hint(["embed", "judge"], "reconcile"))
        return 0
    if method == "fuzzy" and args.method == "auto":
        print("[reconcile] " + openai_config.hint(["embed", "judge"], "reconcile") + f" Falling back to fuzzy (threshold {FUZZY_THRESHOLD}).")
        if existing_has_openai(args.out_dir) and not existing_is_draft(args.out_dir):
            print(f"[reconcile] {args.out_dir}/org_disease_edges.json "
                  "holds OpenAI-judged edges: kept, not overwritten by fuzzy. Use --method fuzzy to overwrite.")
            return 0
    ctx = None
    if method == "openai":
        embed_model, judge_model = openai_config.model_for("embed"), openai_config.model_for("judge")
        try:
            ctx = build_context(catalog, openai_config.make_client(), embed_model, judge_model, reasoning=openai_config.reasoning_for("judge"))
        except Exception as exc:  # noqa: BLE001 - catalog embeddings failed: whole run falls back to fuzzy
            print(f"[reconcile] catalog embeddings failed ({type(exc).__name__}: {str(exc)[:200]}): fuzzy fallback")
            method = "fuzzy"
    result = reconcile(rows, catalog, ctx)
    write_outputs(result, args.out_dir, method, ctx, report)
    s = result["summary"]
    print(f"[reconcile] {s['names']} names from {s['orgs']} orgs ({s['draft_orgs']} draft): {s['matched']} matched {s['matched_by']}, "
          f"{s['unmatched']} unmatched ({s['orgs_without_url']} orgs without url), {s['fallbacks']} fuzzy fallbacks · "
          f"{s['edges']} advocated_by edges → {args.out_dir}/")
    if ctx is not None:
        print(openai_config.cost_line("embed", ctx.embed_model, ctx.embeddings.input_tokens, 0, ctx.embeddings.calls, 0))
        print(openai_config.cost_line("judge", ctx.judge_model, ctx.usage["input_tokens"], ctx.usage["output_tokens"],
                                      ctx.usage["judge_calls"], ctx.usage["judge_cached"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
