"""validate — checks the browser export in app/public/data/ against the data contract. Exit code 1 on any error.

Checks: every edge has >= 1 evidence entry with db/record/url/level/date (or is a pure counter-evidence edge),
`contradicting` always present, edge ids unique and consistent (id <-> source|target|type), all edge endpoints exist,
inferred edges carry a `formula`, size budgets hold (core+index < 3 MB, every disease / gene / phenotype shard
< 150 KB), every index entry has its shard (and no shard lacks an index entry), meta is not a fixture, and the hero
path is complete:
Krabbe -> GALC, Krabbe family -> PSAP, PSAP -> MLD family, MLD -> ARSA, Krabbe <-> PMD with mechanism_differs = true
(and Krabbe <-> MLD not flagged).

data-v2 fields of disease shards (07 step 11, optional): assets / approved_therapies / newborn_screening as array or
{items: [{node, edge}], items_total?, searched?}, kol_overlap as {items: [{disease, edge, people}]}, prevalence as array.
Edge type and level per field (approved_therapy / screened_in curated, has_asset curated or text_mined and never curated
for a Europe PMC abstract hit, no WITHDRAWN study, kol_overlap inferred with formula), NBS snippet verbatim, <= 24 KB
of data-v2 fields per shard, <= 4 prevalence records without XML snippet, no phone numbers in people,
edge source = the shard's disease, target = node id (ASSET: / DRUG: / COUNTRY:), every evidence with a snippet unless the
item is UNBELEGT, no "email" / "phone" keys and no e-mail addresses in people, shard-only nodes never in index.json.
Hero checks (only when the field is in the export, otherwise a note): MLD has approved_therapy Libmeldy and Lenmeldy,
Krabbe has no approved_therapy, Krabbe has >= 1 has_asset.
`run()` returns {errors, warnings, notes, hero}; 09_metrics imports it for meta.metrics.hero_regression.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("CONSTELLATE_OUT_DIR") or ROOT / "app" / "public" / "data")

KRABBE, MLD, PMD = "MONDO:0009499", "MONDO:0018868", "MONDO:0010714"
CORE_INDEX_BUDGET = 3_000_000
SHARD_BUDGET = 150_000
PHENOTYPE_SHARD_CAP = 100
EVIDENCE_LEVELS = {"observed", "curated", "text_mined", "inferred"}
EDGE_LEVELS = EVIDENCE_LEVELS | {"contradicted"}  # "contradicted" = edge with counter-evidence only (03)
REQUIRED_EDGE_KEYS = ("id", "source", "target", "type", "evidence", "contradicting", "confidence", "level", "independent_sources")
REQUIRED_EVIDENCE_KEYS = ("db", "record", "url", "level", "date")
ID_RE = re.compile(r"^e_[0-9a-f]{12}$")
PMID_RE = re.compile(r"^PMID:\d+$")
EMAIL_RE = re.compile(r"[^\s@]+@[^\s@]+\.[A-Za-z]{2,}")
V2_ITEM_FIELDS = {"assets": ("has_asset", "ASSET:"), "approved_therapies": ("approved_therapy", "DRUG:"),
                  "newborn_screening": ("screened_in", "COUNTRY:")}
V2_SHARD_ONLY_PREFIXES = ("ASSET:", "DRUG:", "COUNTRY:", "PERSON:")
PERSONAL_KEYS = {"email", "e_mail", "mail", "phone", "telephone"}
PHONE_RE = re.compile(r"(?:\b(?:tel|phone|fax)\b\.?:?\s*\+?\d)|(?:\+\d[\d\s().-]{7,}\d)|(?:\(\d{2,4}\)\s*\d{3,}[\s.-]?\d{3,})", re.I)
V2_SHARD_BYTES = 24_000  # all data-v2 fields of one disease shard together (same cap as 07)
V2_PREVALENCE_MAX = 4

errors: list[str] = []
warnings: list[str] = []
notes: list[str] = []  # data-v2 hints that are no error (e.g. field not delivered yet)
seen_ids: dict[str, tuple[str, str, str]] = {}
edge_counter: Counter = Counter()


def err(msg: str) -> None:
    errors.append(msg)


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        err(f"{path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}: unreadable ({exc})")
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
        if ev.get("origin") == "fuzzy" and ev["level"] != "inferred":
            err(f"{where}: {bucket}[{i}] fuzzy match must stay inferred, is {ev['level']}")
            continue
        if ev["level"] == "text_mined" and (ev.get("db") == "PubMed" or ev.get("origin") == "OpenAI extract"):
            problems = [name for name, ok in (("record is no PMID", PMID_RE.match(str(ev.get("record", "")))),
                                              ("empty snippet", (ev.get("snippet") or "").strip()),
                                              ("no model", ev.get("model")), ("no prompt_version", ev.get("prompt_version"))) if not ok]
            if problems:
                err(f"{where}: {bucket}[{i}] text_mined claim: {', '.join(problems)}")
                continue
        if ev["level"] == "text_mined" and ev.get("origin") == "OpenAI judge":
            problems = [name for name, ok in (("empty snippet", (ev.get("snippet") or "").strip()), ("no model", ev.get("model")),
                                              ("no prompt_version", ev.get("prompt_version"))) if not ok]
            if problems:
                err(f"{where}: {bucket}[{i}] OpenAI judge evidence: {', '.join(problems)}")
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
    if edge.get("rolled_up_from") is not None:
        if edge.get("level") not in ("inferred", "text_mined"):  # text_mined only when a paper supports it directly
            err(f"{loc}: rolled-up edge must be inferred (or text_mined with direct paper support), is {edge.get('level')}")
        if any(ev.get("via_subtype") and ev.get("level") != "inferred" for ev in edge.get("evidence", [])):
            err(f"{loc}: subtype evidence on a rolled-up edge must stay inferred")
    if endpoints is not None:
        for end in ("source", "target"):
            if edge.get(end) not in endpoints:
                err(f"{loc}: {end} {edge.get(end)} does not exist")


def v2_rows(where: str, shard: dict, field: str) -> list | None:
    """Array or {items, items_total?, searched?}; None = field absent. Format errors are reported."""
    if field not in shard:
        return None
    raw = shard[field]
    if isinstance(raw, list):
        return raw
    if not isinstance(raw, dict) or not isinstance(raw.get("items"), list):
        err(f"{where}: `{field}` must be an array or {{items: [...], searched?: [...]}}")
        return []
    if "searched" in raw and (not isinstance(raw["searched"], list) or
                              any(not isinstance(s_, dict) or not isinstance(s_.get("source"), str) for s_ in raw["searched"])):
        err(f"{where}: `{field}.searched` must be a list of {{source, retrieved?, hits?}}")
    if "items_total" in raw and (not isinstance(raw["items_total"], int) or raw["items_total"] < len(raw["items"])):
        err(f"{where}: `{field}.items_total` must be an int >= len(items)")
    return raw["items"]


def personal_keys(obj, path: str = "") -> list[str]:
    found = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if str(k).lower() in PERSONAL_KEYS:
                found.append(f"{path}.{k}")
            found += personal_keys(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            found += personal_keys(v, f"{path}[{i}]")
    return found


def check_v2(where: str, shard: dict) -> None:
    node_id = shard.get("node", {}).get("id")
    for field, (etype, prefix) in V2_ITEM_FIELDS.items():
        for i, it in enumerate(v2_rows(where, shard, field) or []):
            it = it if isinstance(it, dict) else {}
            node, edge = it.get("node") or {}, it.get("edge") or {}
            loc = f"{where} {field}[{i}]"
            if not isinstance(node.get("id"), str) or not node["id"].startswith(prefix) or not node.get("label"):
                err(f"{loc}: node needs id {prefix}... and a label")
            check_edge(loc, edge)
            if edge.get("type") != etype or edge.get("source") != node_id or edge.get("target") != node.get("id"):
                err(f"{loc}: edge must be {etype} from {node_id} to the item node")
            allowed = ("curated", "text_mined") if etype == "has_asset" else ("curated",)
            if edge.get("level") not in allowed:
                err(f"{loc}: {etype} must be {' or '.join(allowed)}, is {edge.get('level')!r}")
            if etype == "has_asset":
                if str(node.get("status") or "").upper() == "WITHDRAWN":
                    err(f"{loc}: withdrawn study exported as asset")
                if any(ev.get("level") == "curated" and (ev.get("db") == "Europe PMC" or str(ev.get("record", "")).startswith("PMID:"))
                       for ev in edge.get("evidence", [])):
                    err(f"{loc}: scale from a Europe PMC abstract hit must not be curated (text_mined at most)")
            if etype == "screened_in" and any(str(ev.get("snippet") or "").startswith("[") for ev in edge.get("evidence", [])):
                err(f"{loc}: screening snippet must be the verbatim quote, not '[status] ...'")
            unbelegt = "UNBELEGT" in (str(node.get("status")), str(node.get("check")))
            if not unbelegt and any(not (ev.get("snippet") or "").strip() for ev in edge.get("evidence", [])):
                err(f"{loc}: evidence without snippet (only UNBELEGT items may lack one)")
    for i, it in enumerate(v2_rows(where, shard, "kol_overlap") or []):
        loc = f"{where} kol_overlap[{i}]"
        it = it if isinstance(it, dict) else {}
        other, edge = it.get("disease") or {}, it.get("edge") or {}
        if not other.get("id") or not other.get("label") or not isinstance(it.get("people"), list):
            err(f"{loc}: entry needs disease {{id, label}}, edge and people")
            continue
        check_edge(loc, edge)
        if edge.get("type") != "kol_overlap" or {edge.get("source"), edge.get("target")} != {node_id, other["id"]}:
            err(f"{loc}: edge must be kol_overlap between {node_id} and {other['id']}")
        if edge.get("level") != "inferred" or not (edge.get("formula") or "").strip():
            err(f"{loc}: kol_overlap must be inferred with a formula")
        if any(not (ev.get("snippet") or "").strip() for ev in edge.get("evidence", [])):
            err(f"{loc}: evidence without snippet")
        for p in it["people"]:
            if not isinstance(p, dict) or not isinstance(p.get("name"), str) or not isinstance(p.get("records"), list):
                err(f"{loc}: person needs name and records")
                continue
            text = " ".join(str(p.get(k) or "") for k in ("name", "affiliation"))
            if EMAIL_RE.search(text):
                err(f"{loc}: e-mail address in a person entry")
            if PHONE_RE.search(text):
                err(f"{loc}: phone number in a person entry")
            if any(not (isinstance(r_, dict) and r_.get("db") and r_.get("record")) for r_ in p["records"]):
                err(f"{loc}: person record needs db and record")
    if "prevalence" in shard:
        prev = shard["prevalence"]
        if not isinstance(prev, list) or any(not isinstance(p, dict) for p in prev):
            err(f"{where}: `prevalence` must be an array of records")
        else:
            if len(prev) > V2_PREVALENCE_MAX:
                err(f"{where}: {len(prev)} prevalence records (cap {V2_PREVALENCE_MAX})")
            for i, p in enumerate(prev):
                if "snippet" in p:
                    err(f"{where} prevalence[{i}]: XML snippet must not be exported")
                src = p.get("source") or {}
                if not (src.get("db") and src.get("record")):
                    err(f"{where} prevalence[{i}]: needs source {{db, record}}")
                if p.get("value") is not None and not isinstance(p["value"], str):
                    err(f"{where} prevalence[{i}]: value must be a display string (e.g. '0.3 per 100 000') or null")
    v2_part = {k: shard[k] for k in (*V2_ITEM_FIELDS, "kol_overlap", "prevalence") if k in shard}
    if bad := personal_keys(v2_part):
        err(f"{where}: personal contact keys in data-v2 fields: {bad[:3]}")
    if (size := len(json.dumps(v2_part, ensure_ascii=False, separators=(",", ":")).encode())) > V2_SHARD_BYTES:
        err(f"budget: {where} data-v2 fields are {size} bytes (limit {V2_SHARD_BYTES})")


def v2_hero(shards: dict) -> dict[str, bool]:
    """Active only when the field exists in the export; otherwise a note (data-v2 not delivered yet)."""
    hero: dict[str, bool] = {}

    def items(disease: str, field: str):
        shard = shards.get(disease) or {}
        if field not in shard:
            notes.append(f"hero (data-v2): `{field}` not in the {disease} shard (pending), check skipped")
            return None
        raw = shard[field]
        if isinstance(raw, list):
            return raw
        return raw.get("items", []) if isinstance(raw, dict) else []

    mld = items(MLD, "approved_therapies")
    if mld is not None:
        names = {str((it.get("node") or {}).get(k) or "").lower() for it in mld for k in ("label", "id")}
        names |= {n.split(":", 1)[1] for n in names if ":" in n}
        hero["MLD approved_therapy Libmeldy + Lenmeldy"] = {"libmeldy", "lenmeldy"} <= names
    krabbe_t = items(KRABBE, "approved_therapies")
    if krabbe_t is not None:
        hero["Krabbe has no approved_therapy"] = not krabbe_t
    krabbe_a = items(KRABBE, "assets")
    if krabbe_a is not None:
        hero["Krabbe has >= 1 has_asset"] = any((it.get("edge") or {}).get("type") == "has_asset" for it in krabbe_a)
    return hero


def run(out: Path | None = None) -> dict:
    """All checks; returns {errors, warnings, notes, hero}. Safe to call repeatedly (state is reset)."""
    global OUT
    if out is not None:
        OUT = Path(out)
    for state in (errors, warnings, notes):
        state.clear()
    seen_ids.clear()
    edge_counter.clear()
    hero = check_all()
    return {"errors": list(errors), "warnings": list(warnings), "notes": list(notes), "hero": hero}


def main() -> int:
    run()
    return report()


def check_all() -> dict[str, bool]:
    meta = load(OUT / "meta.json")
    index = load(OUT / "index.json")
    core = load(OUT / "core.json")
    if meta is None or index is None or core is None:
        return {}

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
        max_synonyms = 16 if n.get("type") == "disease" and n.get("in_core") else 8  # core diseases: MONDO exact + Orphanet + OMIM
        if len(n.get("synonyms", [])) > max_synonyms:
            err(f"index.json: {n.get('id')} has more than {max_synonyms} synonyms")
        if str(n.get("id", "")).startswith(V2_SHARD_ONLY_PREFIXES):
            err(f"index.json: {n.get('id')} is a shard-only data-v2 node (no search hit)")
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
    has_orgs = "org_shards" in meta.get("counts", {})
    for folder, kind in (("disease", "disease"), ("gene", "gene"), ("phenotype", "phenotype"), ("org", "org")):
        overrides = meta.get("shard_overrides", {})
        expected = {Path(overrides[n["id"]]).stem if n["id"] in overrides else
                    file_safe(n["id"].split(":", 1)[1] if kind == "org" else n["id"]) for n in index if n["type"] == kind}
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
                for e in shard.get("text_mined", []):
                    check_edge(where, e, index_set)
                for it in shard.get("orgs", []):
                    check_edge(where, it.get("edge", {}), index_set)
                    if it.get("edge", {}).get("type") != "advocated_by" or it["edge"].get("target") != it.get("org", {}).get("id"):
                        err(f"{where}: org entry does not match its advocated_by edge")
                if has_orgs:
                    if "orgs" not in shard:
                        err(f"{where}: `orgs` missing although the build has orgs")
                    elif not shard["orgs"]:
                        gap = shard.get("gap") or {}
                        if gap.get("orgs") != "none_in_curated_list" or "searched" not in gap or "nearest_communities" not in gap:
                            err(f"{where}: disease without org needs gap {{orgs, nearest_communities, searched}}")
                        elif len(gap["nearest_communities"]) > 3 or any(not c.get("orgs") for c in gap["nearest_communities"]):
                            err(f"{where}: gap.nearest_communities must be <= 3 diseases that have orgs")
                        elif not any(s_.get("source") == "curated org list" for s_ in gap["searched"]):
                            err(f"{where}: gap.searched must name the curated org list")
                check_v2(where, shard)
            elif kind == "org":
                if not all(shard.get("node", {}).get(k) for k in ("id", "label")):
                    err(f"{where}: org node needs id + label")
                for it in shard.get("diseases", []):
                    e = it.get("edge", {})
                    check_edge(where, e, index_set)
                    if e.get("type") != "advocated_by" or e.get("target") != node_id or e.get("source") != it.get("id"):
                        err(f"{where}: entry {it.get('id')} is not an advocated_by edge of this org")
            elif kind == "gene":
                for e in shard.get("text_mined", []):
                    check_edge(where, e, index_set)
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

    # ---- trial details (08, optional: a missing folder means the app shows trials without countries)
    listed_trials = {it.get("node", {}).get("id") for s in shards.values() for it in s.get("enrichment", {}).get("trials", [])}
    for f in sorted((OUT / "trial").glob("*.json")) if (OUT / "trial").is_dir() else []:
        where = f"trial/{f.name}"
        if f.stat().st_size >= SHARD_BUDGET:
            err(f"budget: {where} is {f.stat().st_size/1e3:.0f} KB (limit 150 KB)")
        t = load(f) or {}
        if t.get("id") != f.stem or t.get("id") not in listed_trials:
            err(f"{where}: id must match the file name and a trial listed in a disease shard")
        if not all(k in t for k in ("status", "retrieved", "url", "contact_url", "source", "eligibility", "countries", "sites", "sites_total")):
            err(f"{where}: incomplete trial detail")
        if any(k in json.dumps(t) for k in ('"email"', '"phone"')):
            err(f"{where}: personal contact data must not be exported")
    shard_counts["trial"] = len(list((OUT / "trial").glob("*.json"))) if (OUT / "trial").is_dir() else 0

    # ---- precomputed explanations (app/scripts/precompute-explain.ts, optional)
    for f in sorted((OUT / "explain").glob("*.json")) if (OUT / "explain").is_dir() else []:
        where = f"explain/{f.name}"
        x = load(f) or {}
        ids = set(x.get("edge_ids", []))
        if x.get("key") != f.stem or not ids or not x.get("model") or not x.get("generated_at"):
            err(f"{where}: key must match the file name, edge_ids, model and generated_at are required")
        if unknown := sorted(i for i in ids if i not in seen_ids):
            err(f"{where}: edge ids not in the export: {unknown[:3]}")
        for s_ in x.get("sentences", []):
            if not s_.get("edge_ids") or not set(s_["edge_ids"]) <= ids:
                err(f"{where}: sentence without a valid citation: {str(s_.get('text'))[:60]}")
    shard_counts["explain"] = len(list((OUT / "explain").glob("*.json"))) if (OUT / "explain").is_dir() else 0

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
    hero.update(v2_hero(shards))
    for name, ok in hero.items():
        if not ok:
            err(f"hero path: {name} FAILED")

    print(f"index: {dict(by_type)} · core: {len(core_nodes)} nodes, {dict(sorted(edge_counter.items()))}")
    print(f"sizes: core.json {sizes['core.json']/1e6:.2f} MB + index.json {sizes['index.json']/1e6:.2f} MB = "
          f"{(sizes['core.json'] + sizes['index.json'])/1e6:.2f} MB · largest shard {max_shard[1]} {max_shard[0]/1e3:.0f} KB · "
          f"shards {shard_counts} · {len(seen_ids)} distinct edge ids")
    print("hero: " + " · ".join(f"{name} {'ok' if ok else 'FAIL'}" for name, ok in hero.items()))
    return hero


def report() -> int:
    for n in notes:
        print(f"note: {n}")
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
