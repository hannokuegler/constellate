"""validate — checks the browser export in app/public/data/ against the data contract. Exit code 1 on any error.

Checks: every edge has >= 1 evidence entry with db/record/url/level/date (or is a pure counter-evidence edge),
`contradicting` always present, edge ids unique and consistent (id <-> source|target|type), all edge endpoints exist,
inferred edges carry a `formula`, size budgets hold (core+index < 3 MB, every disease / gene / phenotype shard
< 150 KB), every index entry has its shard (and no shard lacks an index entry), meta is not a fixture, and the hero
path is complete:
Krabbe -> GALC, Krabbe family -> PSAP, PSAP -> MLD family, MLD -> ARSA, Krabbe <-> PMD with mechanism_differs = true
(and Krabbe <-> MLD not flagged).
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "app" / "public" / "data"

KRABBE, MLD, PMD = "MONDO:0009499", "MONDO:0018868", "MONDO:0010714"
CORE_INDEX_BUDGET = 3_000_000
SHARD_BUDGET = 150_000
PHENOTYPE_SHARD_CAP = 100
EVIDENCE_LEVELS = {"observed", "curated", "text_mined", "inferred"}
EDGE_LEVELS = EVIDENCE_LEVELS | {"contradicted"}  # "contradicted" = edge with counter-evidence only (03)
REQUIRED_EDGE_KEYS = ("id", "source", "target", "type", "evidence", "contradicting", "confidence", "level", "independent_sources")
REQUIRED_EVIDENCE_KEYS = ("db", "record", "url", "level", "date")
ID_RE = re.compile(r"^e_[0-9a-f]{12}$")

errors: list[str] = []
warnings: list[str] = []
seen_ids: dict[str, tuple[str, str, str]] = {}
edge_counter: Counter = Counter()


def err(msg: str) -> None:
    errors.append(msg)


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        err(f"{path.relative_to(ROOT)}: unreadable ({exc})")
        return None


def file_safe(node_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", node_id)


def check_evidence_list(where: str, items, bucket: str) -> int:
    if not isinstance(items, list):
        err(f"{where}: `{bucket}` missing or not a list")
        return 0
    good = 0
    for i, ev in enumerate(items):
        missing = [k for k in REQUIRED_EVIDENCE_KEYS if not ev.get(k)]
        if missing:
            err(f"{where}: {bucket}[{i}] lacks {missing}")
            continue
        if ev["level"] not in EVIDENCE_LEVELS:
            err(f"{where}: {bucket}[{i}] has unknown level {ev['level']!r}")
            continue
        good += 1
    return good


def check_edge(where: str, edge: dict, endpoints: set | None = None) -> None:
    eid = edge.get("id", "?")
    loc = f"{where} {eid}"
    for k in REQUIRED_EDGE_KEYS:
        if k not in edge:
            err(f"{loc}: missing key `{k}`")
    if not ID_RE.match(str(eid)):
        err(f"{loc}: id does not match e_ + 12 hex")
    key = (edge.get("source"), edge.get("target"), edge.get("type"))
    if eid in seen_ids and seen_ids[eid] != key:
        err(f"{loc}: id reused for a different edge {seen_ids[eid]} vs {key}")
    seen_ids.setdefault(eid, key)
    expected = "e_" + hashlib.sha1(f"{key[0]}|{key[1]}|{key[2]}".encode()).hexdigest()[:12]
    if eid != expected:
        warnings.append(f"{loc}: id is not sha1(source|target|type) (type {key[2]})")
    n_ev = check_evidence_list(loc, edge.get("evidence"), "evidence")
    n_contra = check_evidence_list(loc, edge.get("contradicting"), "contradicting")
    if n_ev == 0 and not (n_contra > 0 and not edge.get("evidence")):
        err(f"{loc}: no valid evidence and not a pure counter-evidence edge")
    if edge.get("level") not in EDGE_LEVELS:
        err(f"{loc}: unknown edge level {edge.get('level')!r}")
    if edge.get("level") == "inferred" and not edge.get("formula"):
        err(f"{loc}: inferred edge without formula")
    if edge.get("rolled_up_from") is not None and edge.get("level") != "inferred":
        err(f"{loc}: rolled-up edge must be level inferred")
    if endpoints is not None:
        for end in ("source", "target"):
            if edge.get(end) not in endpoints:
                err(f"{loc}: {end} {edge.get(end)} does not exist")


def main() -> int:
    meta = load(OUT / "meta.json")
    index = load(OUT / "index.json")
    core = load(OUT / "core.json")
    if meta is None or index is None or core is None:
        return report()

    # ---- meta
    for k in ("version", "built_at", "fixture", "sources", "counts", "hero"):
        if k not in meta:
            err(f"meta.json: missing `{k}`")
    if meta.get("fixture") is not False:
        err("meta.json: fixture must be false")
    for s in meta.get("sources", []):
        if not all(s.get(k) for k in ("db", "version", "license", "url")):
            err(f"meta.json: incomplete source {s}")
    if meta.get("hero", {}).get("start") != KRABBE:
        err("meta.json: hero.start must be Krabbe disease")

    # ---- index
    index_ids = [n.get("id") for n in index]
    dupes = [i for i, c in Counter(index_ids).items() if c > 1]
    if dupes:
        err(f"index.json: duplicate ids {dupes[:5]}")
    for n in index:
        if not all(k in n for k in ("id", "type", "label", "synonyms", "xrefs", "in_core", "degree")):
            err(f"index.json: incomplete entry {n.get('id')}")
        if len(n.get("synonyms", [])) > 8:
            err(f"index.json: {n.get('id')} has more than 8 synonyms")
    index_set = set(index_ids)
    by_type = Counter(n["type"] for n in index)

    # ---- core
    core_nodes = {n["id"] for n in core.get("nodes", [])}
    if len(core_nodes) != len(core.get("nodes", [])):
        err("core.json: duplicate node ids")
    if any(n.get("type") == "phenotype" for n in core.get("nodes", [])):
        err("core.json: phenotype nodes must not be in core")
    core_edge_ids = [e.get("id") for e in core.get("edges", [])]
    if len(set(core_edge_ids)) != len(core_edge_ids):
        err("core.json: duplicate edge ids")
    for e in core.get("edges", []):
        check_edge("core.json", e, core_nodes)
        edge_counter[e.get("type")] += 1
    core_edges = {(e["source"], e["target"], e["type"]): e for e in core.get("edges", [])}

    # ---- shards
    sizes = {"core.json": (OUT / "core.json").stat().st_size, "index.json": (OUT / "index.json").stat().st_size}
    if sizes["core.json"] + sizes["index.json"] >= CORE_INDEX_BUDGET:
        err(f"budget: core.json + index.json = {(sizes['core.json'] + sizes['index.json'])/1e6:.2f} MB (limit 3 MB)")
    shards: dict[str, dict] = {}
    shard_counts: dict[str, int] = {}
    max_shard = (0, "")
    for folder, kind in (("disease", "disease"), ("gene", "gene"), ("phenotype", "phenotype")):
        overrides = meta.get("shard_overrides", {})
        expected = {Path(overrides[n["id"]]).stem if n["id"] in overrides else file_safe(n["id"])
                    for n in index if n["type"] == kind}
        present = {f.stem for f in (OUT / folder).glob("*.json")}
        if expected - present:
            err(f"{folder}/: {len(expected - present)} shards missing, e.g. {sorted(expected - present)[:3]}")
        if present - expected:
            err(f"{folder}/: {len(present - expected)} shards without index entry, e.g. {sorted(present - expected)[:3]}")
        shard_counts[folder] = len(present)
        for f in sorted((OUT / folder).glob("*.json")):
            size = f.stat().st_size
            max_shard = max(max_shard, (size, f.name))
            if size >= SHARD_BUDGET:
                err(f"budget: {folder}/{f.name} is {size/1e3:.0f} KB (limit 150 KB)")
            shard = load(f)
            if shard is None:
                continue
            where = f"{folder}/{f.name}"
            node_id = shard.get("node", {}).get("id")
            shards[node_id] = shard
            if kind == "disease":
                for k in ("node", "genes", "phenotypes", "neighbours"):
                    if k not in shard:
                        err(f"{where}: missing `{k}`")
                for e in shard.get("genes", []):
                    check_edge(where, e, index_set)
                for p in shard.get("phenotypes", []):
                    check_edge(where, p.get("edge", {}), index_set)
                    if not all(k in p.get("phenotype", {}) for k in ("id", "label", "ic")):
                        err(f"{where}: phenotype entry incomplete")
                for nb in shard.get("neighbours", []):
                    check_edge(where, nb.get("edge", {}), index_set)
                    for k in ("id", "label", "shared_phenotypes", "shared_genes", "mechanism_differs", "mechanism_note"):
                        if k not in nb:
                            err(f"{where}: neighbour {nb.get('id')} lacks `{k}`")
                    if nb.get("mechanism_differs") not in (True, False, None):
                        err(f"{where}: neighbour {nb.get('id')} mechanism_differs must be true/false/null")
                for kind_e in ("trials", "grants", "targets"):
                    for it in shard.get("enrichment", {}).get(kind_e, []):
                        check_edge(where, it.get("edge", {}))
                        if it["edge"].get("target") != it.get("node", {}).get("id"):
                            err(f"{where}: enrichment {kind_e} edge target != node id")
                for paper in shard.get("enrichment", {}).get("papers_mentioning", []):
                    if not all(paper.get(k) for k in ("id", "db", "record", "url")):
                        err(f"{where}: paper mention lacks id/db/record/url")
            elif kind == "gene":
                for e in shard.get("diseases", []):
                    check_edge(where, e, index_set)
                for it in shard.get("pathways", []) + shard.get("pathways_more", []):
                    check_edge(where, it.get("edge", {}))
            else:
                if not all(k in shard.get("node", {}) for k in ("id", "label", "ic")) or "diseases_total" not in shard:
                    err(f"{where}: node needs id/label/ic and the shard diseases_total")
                positive = 0
                for it in shard.get("diseases", []):
                    e = it.get("edge", {})
                    check_edge(where, e, index_set)
                    if not all(k in it for k in ("id", "label", "edge", "confidence")):
                        err(f"{where}: disease entry {it.get('id')} incomplete")
                    if e.get("type") != "has_phenotype" or e.get("target") != node_id or e.get("source") != it.get("id"):
                        err(f"{where}: entry {it.get('id')} is not a has_phenotype edge of this phenotype")
                    positive += bool(e.get("evidence"))
                if positive > PHENOTYPE_SHARD_CAP:
                    err(f"{where}: {positive} diseases listed (cap {PHENOTYPE_SHARD_CAP})")

    # ---- hero path
    def children_closure(root: str) -> set[str]:
        seen, stack = set(), [root]
        while stack:
            x = stack.pop()
            if x in seen:
                continue
            seen.add(x)
            stack.extend(shards.get(x, {}).get("node", {}).get("children", []))
        return seen

    def has_gene(diseases: set[str], gene: str) -> list[str]:
        return sorted(d for d in diseases if (d, gene, "caused_by") in core_edges)

    krabbe_family, mld_family = children_closure(KRABBE), children_closure(MLD)
    hero = {
        "Krabbe -> GALC": bool(has_gene({KRABBE}, "GALC")),
        "Krabbe family -> PSAP": bool(has_gene(krabbe_family, "PSAP")),
        "PSAP -> MLD family": bool(has_gene(mld_family, "PSAP")),
        "MLD -> ARSA": bool(has_gene({MLD}, "ARSA")),
    }
    krabbe_shard = shards.get(KRABBE, {})
    krabbe_genes = {e["target"] for e in krabbe_shard.get("genes", [])}
    hero["Krabbe shard shows GALC + PSAP"] = {"GALC", "PSAP"} <= krabbe_genes
    mld_shard = shards.get(MLD, {})
    hero["MLD shard shows ARSA (roll-up)"] = any(e["target"] == "ARSA" and e.get("rolled_up_from") for e in mld_shard.get("genes", []))
    nb = {n["id"]: n for n in krabbe_shard.get("neighbours", [])}
    hero["Krabbe <-> PMD mechanism_differs = true"] = nb.get(PMD, {}).get("mechanism_differs") is True
    hero["Krabbe <-> MLD not a counterexample"] = MLD in nb and nb[MLD].get("mechanism_differs") is not True
    hero["Krabbe -> MLD neighbour has formula"] = bool(nb.get(MLD, {}).get("edge", {}).get("formula"))
    for name, ok in hero.items():
        if not ok:
            err(f"hero path: {name} FAILED")

    print(f"index: {dict(by_type)} · core: {len(core_nodes)} nodes, {dict(sorted(edge_counter.items()))}")
    print(f"sizes: core.json {sizes['core.json']/1e6:.2f} MB + index.json {sizes['index.json']/1e6:.2f} MB = "
          f"{(sizes['core.json'] + sizes['index.json'])/1e6:.2f} MB · largest shard {max_shard[1]} {max_shard[0]/1e3:.0f} KB · "
          f"shards {shard_counts} · {len(seen_ids)} distinct edge ids")
    print("hero: " + " · ".join(f"{name} {'ok' if ok else 'FAIL'}" for name, ok in hero.items()))
    return report()


def report() -> int:
    if warnings:
        kinds = Counter(w.split("(type ")[-1].rstrip(")") for w in warnings)
        print(f"warnings: {len(warnings)} edge ids outside the sha1 scheme by type {dict(kinds)}")
    if errors:
        print(f"FAIL: {len(errors)} errors")
        for e in errors[:40]:
            print("  -", e)
        return 1
    print("OK: export matches the data contract")
    return 0


if __name__ == "__main__":
    sys.exit(main())
