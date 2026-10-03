"""07_analytics — derived edges + browser export (the data contract the app loads from app/public/data/).

Input : data/graph_base.json (03), data/slice.json (02), data/raw/{hp.json, phenotype.hpoa, mondo.json, en_product6.xml},
        optional data/enrich/edges_draft.json + coverage.jsonl (04; skipped cleanly when missing)
Output: app/public/data/meta.json · index.json · core.json · disease/<MONDO_x>.json · gene/<SYMBOL>.json

What it derives (every derived claim is an edge with level "inferred", a `formula` and a Constellate evidence entry):
 1. subtype roll-up      parent disease inherits the gene edges of its MONDO subtypes (own edge, `rolled_up_from`),
                         phenotypes only when the parent has none of its own (consensus over subtypes)
 2. information content  IC(t) = -ln(share of all HPO-annotated diseases annotated with t or a descendant of t)
 3. similar_phenotype    simGIC (Pesquita 2008) core x all, Resnik-BMA for the top 20, top 10 per core disease as edges
 4. shares_gene          disease-disease, same causal gene (incl. roll-up)
 5. counterexamples      mechanism_differs only from curated MONDO mechanism classes (MECHANISM_CLASSES below)
 6. Louvain clusters     fixed seed, weight = simGIC + 0.3 * shared causal genes
 7. top-k phenotypes     k = 25 by IC x confidence, counter-evidence always kept
 8. enrichment hook      trials / papers / grants / targets / coverage per disease, pathways per gene
Deterministic: sorted iteration, fixed seed, single-threaded BLAS, rounded floats; built_at lives only in meta.json.
"""
from __future__ import annotations

import os

for _var in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS", "VECLIB_MAXIMUM_THREADS"):
    os.environ.setdefault(_var, "1")  # single-threaded BLAS: float sums are bit-identical run to run

import datetime as dt
import hashlib
import json
import math
import re
import subprocess
import time
from collections import Counter, defaultdict
from pathlib import Path

import networkx as nx
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
ENRICH = DATA / "enrich"
OUT = ROOT / "app" / "public" / "data"

HERO_START = "MONDO:0009499"  # Krabbe disease
TOP_K_PHENOTYPES = 25
TOP_SIMILAR = 10              # similar_phenotype edges per core disease
TOP_RESNIK = 20               # Resnik-BMA is computed for this many simGIC candidates per core disease
COUNTEREXAMPLE_MAX_RANK = 20  # "high phenotype similarity" = within the top 20 of either disease
COUNTEREXAMPLE_MIN_SIMGIC = 0.15
MAX_SYNONYMS = 8
MAX_PHENOTYPE_SYNONYMS = 3  # index budget; layperson synonyms first (Devon types symptoms in plain words)
INDEX_XREF_PREFIXES = {"OMIM", "Orphanet", "MESH", "UMLS", "DOID", "GARD"}
ROLLUP_CONFIDENCE_FACTOR = 0.5  # rolled-up claim = weakest subtype confidence x 0.5 (never stronger than the subtype)
MAX_ROLLUP_GENES = 15           # a parent whose subtypes span more causal genes is a category, not a disease family
PHENOTYPE_ROLLUP_MIN_SHARE = 0.5  # rolled-up phenotype must be annotated in >= half of the subtypes with phenotypes
ROLLUP_EVIDENCE_CAP = 6
LOUVAIN_SEED = 42
LOUVAIN_RESOLUTION = 1.0
W_SIMGIC, W_SHARED_GENE = 1.0, 0.3
SHARD_BUDGET = 150_000
CORE_INDEX_BUDGET = 3_000_000
ENRICH_KINDS = ("trials", "grants", "targets", "papers_mentioning")
PHENOTYPE_SHARD_CAP = 100  # diseases per phenotype shard (counter-evidence edges are always kept on top)
ENRICH_CAP = 20  # items per enrichment kind and disease shard (totals are kept)
PATHWAY_HUB_SHARE, PATHWAY_HUB_MIN_GENES = 0.15, 10  # generic Reactome pathway = carried by >= 15 % (min 10) of annotated genes
GENE_EDGE_TYPES = ("caused_by", "associated_gene")
LEVEL_ORDER = ["observed", "curated", "text_mined", "inferred"]

# Curated mechanism classes. A disease belongs to a class when an anchor is the disease itself or one of its MONDO
# is_a ancestors, or (where label_pattern is set) when its own MONDO label says so. Tissue / phenotype groupings such as
# "leukodystrophy" or "neurodegenerative disease" are deliberately NOT mechanism classes: they are what names hide.
# Two diseases differ in mechanism only when their class sets are disjoint; no class on one side -> unknown (null).
MECHANISM_CLASSES = [
    {"key": "lysosomal", "label": "lysosomal storage (degradation inside the lysosome fails)",
     "anchors": ["MONDO:0002561"], "label_pattern": None},
    {"key": "lysosome_related_organelle", "label": "lysosome-related organelle biogenesis",
     "anchors": ["MONDO:0017739"], "label_pattern": None},
    {"key": "peroxisomal", "label": "peroxisomal biogenesis / peroxisomal enzyme or transporter defect",
     "anchors": ["MONDO:0019053"], "label_pattern": None},
    {"key": "mitochondrial", "label": "mitochondrial energy metabolism",
     "anchors": ["MONDO:0044970", "MONDO:0004069"], "label_pattern": None},
    {"key": "hypomyelination", "label": "primary hypomyelination (myelin is never properly formed; PLP1 / PMD spectrum, POLR3)",
     "anchors": ["MONDO:0010714", "MONDO:0017226", "MONDO:0100605"], "label_pattern": "hypomyelinat",
     "source": "OMIM 312080 (PMD: PLP1, hypomyelination, not lysosomal); PMC9313024"},
    {"key": "amino_organic_acid", "label": "amino acid / organic acid metabolism",
     "anchors": ["MONDO:0019189", "MONDO:0004736", "MONDO:0017686"], "label_pattern": None},
    {"key": "glycosylation", "label": "congenital disorder of glycosylation",
     "anchors": ["MONDO:0015286"], "label_pattern": None},
    {"key": "interferonopathy", "label": "type 1 interferonopathy (innate immune activation)",
     "anchors": ["MONDO:0700264"], "label_pattern": None},
    {"key": "eif2b_translation", "label": "eIF2B translation-initiation defect (vanishing white matter)",
     "anchors": ["MONDO:0800448"], "label_pattern": None},
]


# ----------------------------------------------------------------------------------------------- helpers
def edge_id(source: str, target: str, edge_type: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:12]  # same scheme as 03


def iri_to_curie(iri: str) -> str:
    return iri.rsplit("/", 1)[-1].replace("_", ":", 1)


def r(x: float, n: int = 4) -> float:
    return float(round(float(x), n))


def git(*args: str) -> str:
    try:
        return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return ""


# record = last commit that touched this script (other agents' commits must not change our exports); "+dirty" when the
# working copy differs from that commit
GIT_SHA = git("log", "-1", "--format=%h", "--", "pipeline/07_analytics.py") or git("rev-parse", "--short", "HEAD") or "nogit"
GIT_DIRTY = bool(git("status", "--porcelain", "--", "pipeline/07_analytics.py"))
REPO_URL = (git("config", "--get", "remote.origin.url") or "https://github.com/hannokuegler/constellate").removesuffix(".git")
BUILD_DATE = (dt.datetime.fromtimestamp(int(os.environ["SOURCE_DATE_EPOCH"]), dt.timezone.utc).date().isoformat()
              if os.environ.get("SOURCE_DATE_EPOCH") else dt.date.today().isoformat())
RECORD = f"07_analytics@{GIT_SHA}" + ("+dirty" if GIT_DIRTY else "")
CODE_URL = f"{REPO_URL}/blob/{GIT_SHA}/pipeline/07_analytics.py"


def computed_evidence(confidence: float, snippet: str, inputs: dict) -> dict:
    return {"db": "Constellate", "origin": "computed", "record": RECORD, "url": CODE_URL, "level": "inferred",
            "date": BUILD_DATE, "confidence": r(confidence, 3), "snippet": snippet, "inputs": inputs}


def make_edge(source: str, target: str, edge_type: str, evidence: list[dict], confidence: float, formula: str,
              **extra) -> dict:
    edge = {"id": edge_id(source, target, edge_type), "source": source, "target": target, "type": edge_type,
            "evidence": evidence, "contradicting": [], "confidence": r(confidence, 3),
            "independent_sources": sorted({ev["origin"] for ev in evidence}), "level": "inferred", "formula": formula}
    edge.update(extra)
    return edge


# ----------------------------------------------------------------------------------------------- loading
def load_hpo() -> dict:
    graph = json.loads((RAW / "hp.json").read_text())["graphs"][0]
    labels, synonyms, xrefs, alt, parents, definitions = {}, {}, {}, {}, defaultdict(list), {}
    for node in graph["nodes"]:
        if "HP_" not in node["id"]:
            continue
        hp = iri_to_curie(node["id"])
        meta = node.get("meta", {})
        labels[hp] = node.get("lbl", hp)
        syns = meta.get("synonyms", [])
        lay = sorted({x["val"] for x in syns if "layperson" in x.get("synonymType", "")})
        synonyms[hp] = lay + sorted({x["val"] for x in syns} - set(lay))
        xrefs[hp] = sorted({x["val"] for x in meta.get("xrefs", [])})
        if meta.get("definition", {}).get("val"):
            definitions[hp] = meta["definition"]["val"]
        for prop in meta.get("basicPropertyValues", []):
            if prop.get("pred", "").endswith("hasAlternativeId"):
                alt[prop["val"]] = hp
    for edge in graph["edges"]:
        if edge.get("pred") == "is_a" and "HP_" in edge["sub"] and "HP_" in edge["obj"]:
            parents[iri_to_curie(edge["sub"])].append(iri_to_curie(edge["obj"]))
    version = graph.get("meta", {}).get("version", "")
    return {"labels": labels, "synonyms": synonyms, "xrefs": xrefs, "alt": alt, "parents": parents, "definitions": definitions,
            "version": (re.search(r"releases/([\d-]+)/", version) or [None, version])[1]}


def ancestor_closure(parents: dict[str, list[str]], terms) -> dict[str, frozenset]:
    """term -> itself + all is_a ancestors (memoised)."""
    memo: dict[str, frozenset] = {}

    def walk(term: str) -> frozenset:
        if term in memo:
            return memo[term]
        acc = {term}
        for p in parents.get(term, ()):
            acc |= walk(p)
        memo[term] = frozenset(acc)
        return memo[term]

    for t in terms:
        walk(t)
    return memo


def load_mondo() -> dict:
    graph = json.loads((RAW / "mondo.json").read_text())["graphs"][0]
    labels, parents = {}, defaultdict(list)
    for node in graph["nodes"]:
        if "MONDO_" in node["id"]:
            labels[iri_to_curie(node["id"])] = node.get("lbl", "")
    for edge in graph["edges"]:
        if edge.get("pred") == "is_a" and "MONDO_" in edge["sub"] and "MONDO_" in edge["obj"]:
            parents[iri_to_curie(edge["sub"])].append(iri_to_curie(edge["obj"]))
    version = graph.get("meta", {}).get("version", "")
    return {"labels": labels, "parents": parents,
            "version": (re.search(r"releases/([\d-]+)/", version) or [None, version])[1]}


def information_content(hpo: dict, closure) -> tuple[dict[str, float], int]:
    """IC over the full HPO annotation corpus (all OMIM/ORPHA/DECIPHER diseases), with ancestor propagation."""
    disease_terms: dict[str, set[str]] = defaultdict(set)
    for line in (RAW / "phenotype.hpoa").read_text().splitlines():
        if line.startswith(("#", "database_id")):
            continue
        cols = line.split("\t")
        db_id, qualifier, hpo_id, frequency, aspect = cols[0], cols[2], cols[3], cols[7], cols[10]
        if qualifier == "NOT" or aspect != "P" or frequency == "HP:0040285" or frequency.startswith("0/") or frequency == "0%":
            continue  # same filter as 02_slice: negated / excluded / 0-of-n are not annotations
        disease_terms[db_id].add(hpo["alt"].get(hpo_id, hpo_id))
    counts: Counter = Counter()
    for terms in disease_terms.values():
        closed: set[str] = set()
        for t in terms:
            closed |= closure(t)
        counts.update(closed)
    n = len(disease_terms)
    ic = {t: -math.log(c / n) for t, c in counts.items()}
    return ic, n


# ----------------------------------------------------------------------------------------------- main build
def main() -> int:
    t0 = time.time()
    base = json.loads((DATA / "graph_base.json").read_text())
    sl = json.loads((DATA / "slice.json").read_text())
    hpo = load_hpo()
    mondo = load_mondo()
    core_set = set(sl["core"])
    nodes = {n["id"]: n for n in base["nodes"]}
    diseases = sorted(n["id"] for n in base["nodes"] if n["type"] == "disease")
    disease_set = set(diseases)
    genes = sorted(n["id"] for n in base["nodes"] if n["type"] == "gene")
    print(f"[load] {len(diseases)} diseases · {len(genes)} genes · {len(base['edges'])} edges · {time.time()-t0:.1f}s")

    # ---- HPO closure + IC
    hp_memo = ancestor_closure(hpo["parents"], sorted(hpo["labels"]))

    def hp_closure(term: str) -> frozenset:
        return hp_memo.get(term) or frozenset({term})

    pheno_root_desc = "HP:0000118"  # Phenotypic abnormality

    def hp_closure_p(term: str) -> frozenset:  # restricted to the phenotypic-abnormality subtree
        full = hp_closure(term)
        return full if pheno_root_desc in full else frozenset()

    ic, n_ic_corpus = information_content(hpo, hp_closure_p)
    ic_max = math.log(n_ic_corpus)  # a term never annotated anywhere counts as maximally specific
    def ic_of(term: str) -> float:
        return ic.get(term, ic_max)
    print(f"[ic] {len(ic)} HPO terms with IC over {n_ic_corpus} annotated diseases · {time.time()-t0:.1f}s")

    # ---- MONDO hierarchy (full ontology for ancestors; slice for subtype children)
    mondo_anc_memo = ancestor_closure(mondo["parents"], list(disease_set))

    def mondo_ancestors(d: str) -> frozenset:
        return mondo_anc_memo.get(d, frozenset({d})) - {d}

    slice_parents = {d: [p for p in sl["mondo"][d]["parents"] if p in disease_set] for d in diseases}
    slice_children: dict[str, list[str]] = defaultdict(list)
    for d in diseases:
        for p in slice_parents[d]:
            slice_children[p].append(d)
    slice_desc: dict[str, list[str]] = {}
    for d in diseases:
        seen, stack = set(), list(slice_children.get(d, []))
        while stack:
            x = stack.pop()
            if x in seen:
                continue
            seen.add(x)
            stack.extend(slice_children.get(x, []))
        slice_desc[d] = sorted(seen)

    def related_by_hierarchy(a: str, b: str) -> bool:
        return a in mondo_ancestors(b) or b in mondo_ancestors(a)

    # ---- base edge indexes
    edges_by_key: dict[tuple, dict] = {}
    gene_edges_of: dict[str, list[dict]] = defaultdict(list)    # disease -> own gene edges
    pheno_edges_of: dict[str, list[dict]] = defaultdict(list)   # disease -> own has_phenotype edges (incl. contra)
    for e in base["edges"]:
        edges_by_key[(e["source"], e["target"], e["type"])] = e
        if e["type"] in GENE_EDGE_TYPES:
            gene_edges_of[e["source"]].append(e)
        elif e["type"] == "has_phenotype":
            pheno_edges_of[e["source"]].append(e)
    own_pos_phenos = {d: sorted(e["target"] for e in pheno_edges_of[d] if e["evidence"]) for d in diseases}

    # ================================================================ 1. subtype roll-up
    rollup_edges: list[dict] = []
    rollup_skipped_categories = []
    for parent in diseases:
        desc = slice_desc[parent]
        if not desc:
            continue
        # genes
        carriers: dict[tuple[str, str], list[dict]] = defaultdict(list)  # (gene, type) -> subtype edges
        for child in desc:
            for e in gene_edges_of[child]:
                if e["evidence"]:
                    carriers[(e["target"], e["type"])].append(e)
        causal_genes = {g for (g, t) in carriers if t == "caused_by"}
        if len(causal_genes) > MAX_ROLLUP_GENES:
            rollup_skipped_categories.append((parent, len(causal_genes)))
        else:
            for (gene, etype), child_edges in sorted(carriers.items()):
                if (parent, gene, etype) in edges_by_key:
                    continue  # parent already carries this edge itself: nothing to infer
                if etype == "associated_gene" and ((parent, gene, "caused_by") in edges_by_key or (gene, "caused_by") in carriers):
                    continue  # the causal claim (own or rolled up) already covers this gene
                child_edges = sorted(child_edges, key=lambda e: e["source"])
                rollup_edges.append(rolled_up_edge(parent, gene, etype, child_edges, sl, nodes))
        # phenotypes, only when the parent has none of its own
        if own_pos_phenos[parent]:
            continue
        with_phenos = [c for c in desc if own_pos_phenos[c]]
        if not with_phenos:
            continue
        pheno_carriers: dict[str, list[dict]] = defaultdict(list)
        for child in with_phenos:
            for e in pheno_edges_of[child]:
                if e["evidence"]:
                    pheno_carriers[e["target"]].append(e)
        need = max(1, math.ceil(PHENOTYPE_ROLLUP_MIN_SHARE * len(with_phenos)))
        for hp_id, child_edges in sorted(pheno_carriers.items()):
            if len(child_edges) < need:
                continue
            child_edges = sorted(child_edges, key=lambda e: e["source"])
            rollup_edges.append(rolled_up_edge(parent, hp_id, "has_phenotype", child_edges, sl, nodes,
                                               n_with=len(with_phenos)))
    rolled_gene_of: dict[str, list[dict]] = defaultdict(list)
    rolled_pheno_of: dict[str, list[dict]] = defaultdict(list)
    for e in rollup_edges:
        (rolled_pheno_of if e["type"] == "has_phenotype" else rolled_gene_of)[e["source"]].append(e)
    print(f"[rollup] {sum(1 for e in rollup_edges if e['type'] != 'has_phenotype')} gene edges, "
          f"{sum(1 for e in rollup_edges if e['type'] == 'has_phenotype')} phenotype edges; "
          f"{len(rollup_skipped_categories)} categories over {MAX_ROLLUP_GENES} genes skipped · {time.time()-t0:.1f}s")

    all_gene_edges_of = {d: gene_edges_of[d] + rolled_gene_of[d] for d in diseases}
    causal_of: dict[str, dict[str, dict]] = {}  # disease -> gene -> causal edge (own or rolled-up)
    for d in diseases:
        causal_of[d] = {e["target"]: e for e in all_gene_edges_of[d] if e["type"] == "caused_by" and e["evidence"]}

    # grouping classes (T2): no own phenotype, no own gene, but subtypes in the slice -> search, navigation and
    # roll-up target only; they take part in neither similarity nor shares_gene
    is_group = {d: not own_pos_phenos[d] and not any(e["evidence"] for e in gene_edges_of[d]) and bool(slice_children.get(d))
                for d in diseases}

    # ================================================================ 2./3. phenotype similarity
    pheno_set = {d: own_pos_phenos[d] or sorted(e["target"] for e in rolled_pheno_of[d]) for d in diseases}
    pheno_set = {d: [hpo["alt"].get(t, t) for t in ts] for d, ts in pheno_set.items()}
    closed_sets: dict[str, set[str]] = {}
    for d in diseases:
        acc: set[str] = set()
        for t in pheno_set[d]:
            acc |= hp_closure_p(t)
        closed_sets[d] = acc
    terms = sorted(set().union(*closed_sets.values()))
    term_index = {t: i for i, t in enumerate(terms)}
    ic_vec = np.array([ic_of(t) for t in terms], dtype=np.float64)
    x = np.zeros((len(diseases), len(terms)), dtype=np.float64)
    for i, d in enumerate(diseases):
        x[i, [term_index[t] for t in closed_sets[d]]] = 1.0
    weighted = x * ic_vec
    inter = weighted @ x.T
    size = weighted.sum(axis=1)
    union = size[:, None] + size[None, :] - inter
    with np.errstate(invalid="ignore", divide="ignore"):
        simgic = np.where(union > 0, inter / union, 0.0)
    simgic = np.round(simgic, 6)  # rounding before ranking: ties are broken by id, never by float noise
    dindex = {d: i for i, d in enumerate(diseases)}
    print(f"[simgic] {len(diseases)}x{len(diseases)} over {len(terms)} closed terms · {time.time()-t0:.1f}s")

    term_anc_idx = {}

    def anc_idx(term: str) -> np.ndarray:
        if term not in term_anc_idx:
            term_anc_idx[term] = np.array(sorted(term_index[a] for a in hp_closure_p(term) if a in term_index), dtype=np.int64)
        return term_anc_idx[term]

    def resnik_bma(a: str, b: str) -> tuple[float, str | None]:
        ta, tb = sorted(set(pheno_set[a])), sorted(set(pheno_set[b]))
        ta = [t for t in ta if len(anc_idx(t))]
        tb = [t for t in tb if len(anc_idx(t))]
        if not ta or not tb:
            return 0.0, None
        shared = np.intersect1d(np.nonzero(x[dindex[a]])[0], np.nonzero(x[dindex[b]])[0])
        if not len(shared):
            return 0.0, None
        pos = np.full(len(terms), -1, dtype=np.int64)
        pos[shared] = np.arange(len(shared))
        cb = np.zeros((len(tb), len(shared)), dtype=bool)
        for j, t in enumerate(tb):
            cols = pos[anc_idx(t)]
            cb[j, cols[cols >= 0]] = True
        ic_shared = ic_vec[shared]
        cb_ic = cb * ic_shared  # q x K
        sim = np.zeros((len(ta), len(tb)))
        for i, t in enumerate(ta):
            cols = pos[anc_idx(t)]
            cols = cols[cols >= 0]
            if len(cols):
                sim[i] = cb_ic[:, cols].max(axis=1)
        bma = 0.5 * (sim.max(axis=1).mean() + sim.max(axis=0).mean())
        mica = terms[shared[int(np.argmax(ic_shared))]]  # first max: shared is sorted by term id -> deterministic
        return float(bma), mica

    # candidate ranking per core disease
    ranked: dict[str, list[str]] = {}
    for d in sorted(core_set):
        if not closed_sets[d] or is_group[d]:
            ranked[d] = []
            continue
        row = simgic[dindex[d]]
        cands = [o for o in diseases if o != d and row[dindex[o]] > 0 and not is_group[o] and not related_by_hierarchy(d, o)]
        cands.sort(key=lambda o: (-row[dindex[o]], o))
        ranked[d] = cands
    rank_of = {d: {o: i + 1 for i, o in enumerate(cands)} for d, cands in ranked.items()}

    pair_info: dict[tuple[str, str], dict] = {}

    def pair_key(a: str, b: str) -> tuple[str, str]:
        return (a, b) if a < b else (b, a)

    def describe_pair(a: str, b: str, with_resnik: bool) -> dict:
        key = pair_key(a, b)
        info = pair_info.get(key)
        if info is None:
            ia, ib = dindex[a], dindex[b]
            shared_closed = closed_sets[a] & closed_sets[b]
            shared_direct = sorted(set(pheno_set[a]) & set(pheno_set[b]))
            info = {"simgic": r(simgic[ia, ib]), "n_shared_direct": len(shared_direct),
                    "n_shared_closed": len(shared_closed), "n_union_closed": len(closed_sets[a] | closed_sets[b]),
                    "shared_specific": most_specific(shared_closed, hp_closure_p, ic_of)}
            pair_info[key] = info
        if with_resnik and "resnik_bma" not in info:
            bma, mica = resnik_bma(*key)
            info["resnik_bma"] = r(bma, 3)
            info["mica"] = mica
        return info

    t_resnik = time.time()
    for d in sorted(core_set):
        for o in ranked[d][:TOP_RESNIK]:
            describe_pair(d, o, with_resnik=True)
    print(f"[resnik] {sum(1 for v in pair_info.values() if 'resnik_bma' in v)} pairs · {time.time()-t_resnik:.1f}s")

    # ================================================================ 5. mechanism classes (needed for counterexamples)
    class_of: dict[str, list[dict]] = {}
    for d in diseases:
        lineage = mondo_ancestors(d) | {d}
        hits = []
        for cls in MECHANISM_CLASSES:
            via = sorted(a for a in cls["anchors"] if a in lineage)
            if via:
                hits.append({"key": cls["key"], "via": via[0], "via_label": mondo["labels"].get(via[0], via[0])})
            elif cls["label_pattern"] and cls["label_pattern"] in nodes[d]["label"].lower():
                hits.append({"key": cls["key"], "via": d, "via_label": f"MONDO label '{nodes[d]['label']}'"})
        class_of[d] = hits
    class_label = {c["key"]: c["label"] for c in MECHANISM_CLASSES}

    def shared_causal_genes(a: str, b: str) -> list[str]:
        out = []
        for g in sorted(set(causal_of[a]) & set(causal_of[b])):
            ca = set(causal_of[a][g].get("rolled_up_from", [a]))
            cb = set(causal_of[b][g].get("rolled_up_from", [b]))
            if not any(x1 != x2 for x1 in ca for x2 in cb):
                continue  # both inherit the gene from the very same subtype: not two diseases sharing a gene
            out.append(g)
        return out

    def high_similarity(a: str, b: str) -> bool:
        sim = simgic[dindex[a], dindex[b]]
        best_rank = min(rank_of.get(a, {}).get(b, 10**6), rank_of.get(b, {}).get(a, 10**6))
        return best_rank <= COUNTEREXAMPLE_MAX_RANK and sim >= COUNTEREXAMPLE_MIN_SIMGIC

    def mechanism_verdict(a: str, b: str) -> tuple[bool | None, str]:
        ka, kb = {c["key"] for c in class_of[a]}, {c["key"] for c in class_of[b]}
        la, lb = nodes[a]["label"], nodes[b]["label"]
        if not ka or not kb:
            missing = [lbl for lbl, k in ((la, ka), (lb, kb)) if not k]
            return None, (f"No curated mechanism class for {' and '.join(missing)} (none of the {len(MECHANISM_CLASSES)} "
                          f"MONDO mechanism classes is an ancestor), so mechanism similarity cannot be judged.")
        def desc_cls(d: str) -> str:
            return "; ".join(f"{class_label[c['key']]} (via {c['via']} {c['via_label']})" for c in class_of[d])
        genes_shared = shared_causal_genes(a, b)
        sim = simgic[dindex[a], dindex[b]]
        if ka & kb:
            same = sorted(ka & kb)
            text = f"Same curated mechanism class: {', '.join(class_label[k] for k in same)}."
            if genes_shared:
                text += f" Shared causal gene(s): {', '.join(genes_shared)}."
            return False, text
        if genes_shared:
            return False, (f"MONDO places them in different mechanism classes ({la}: {desc_cls(a)}; {lb}: {desc_cls(b)}), "
                           f"but they share causal gene(s) {', '.join(genes_shared)}, so this is not a counterexample.")
        if not high_similarity(a, b):
            return False, (f"Different mechanism classes ({la}: {desc_cls(a)}; {lb}: {desc_cls(b)}), but phenotype "
                           f"similarity is not high (simGIC {sim:.2f}), so not flagged as counterexample.")
        return True, (f"Similar symptoms, different cause. {la}: {desc_cls(a)}. {lb}: {desc_cls(b)}. "
                      f"No shared causal gene; phenotype similarity simGIC {sim:.2f}. Assets and trial designs do not "
                      f"transfer between them without expert review.")

    # ================================================================ similar_phenotype edges
    sim_edges: dict[str, dict] = {}
    counterexample_pairs = set()
    for d in sorted(core_set):
        for o in ranked[d][:TOP_SIMILAR]:
            a, b = pair_key(d, o)
            eid = edge_id(a, b, "similar_phenotype")
            if eid in sim_edges:
                continue
            info = describe_pair(a, b, with_resnik=True)
            verdict, _ = mechanism_verdict(a, b)
            if verdict is True:
                counterexample_pairs.add((a, b))
            sim_edges[eid] = similarity_edge(a, b, info, rank_of, nodes, hpo, ic_of, n_ic_corpus, verdict)
    print(f"[similar_phenotype] {len(sim_edges)} edges · {len(counterexample_pairs)} counterexample pairs")

    # ================================================================ 4. shares_gene edges
    carriers_of_gene: dict[str, list[str]] = defaultdict(list)
    for d in diseases:
        for g in causal_of[d]:
            carriers_of_gene[g].append(d)
    shared_genes_pairs: dict[tuple[str, str], list[str]] = defaultdict(list)
    for g, ds in sorted(carriers_of_gene.items()):
        for i, a in enumerate(ds):
            for b in ds[i + 1:]:
                if (a not in core_set and b not in core_set) or is_group[a] or is_group[b]:
                    continue
                if related_by_hierarchy(a, b):
                    continue
                if g in shared_causal_genes(a, b):
                    shared_genes_pairs[(a, b)].append(g)
    gene_share_edges: dict[str, dict] = {}
    for (a, b), gs in sorted(shared_genes_pairs.items()):
        e = shares_gene_edge(a, b, gs, causal_of, nodes)
        gene_share_edges[e["id"]] = e
    print(f"[shares_gene] {len(gene_share_edges)} edges")

    # ================================================================ 6. Louvain
    graph = nx.Graph()
    graph.add_nodes_from(diseases)
    weights: dict[tuple[str, str], float] = defaultdict(float)
    for e in sim_edges.values():
        weights[pair_key(e["source"], e["target"])] += W_SIMGIC * e["inputs_simgic"]
    for (a, b), gs in shared_genes_pairs.items():
        weights[pair_key(a, b)] += W_SHARED_GENE * min(len(gs), 2)
    for (a, b), w in sorted(weights.items()):
        if w > 0:
            graph.add_edge(a, b, weight=round(w, 6))
    communities = nx.community.louvain_communities(graph, weight="weight", resolution=LOUVAIN_RESOLUTION, seed=LOUVAIN_SEED)
    communities = sorted((sorted(c) for c in communities), key=lambda c: (-len(c), c[0]))
    modularity = nx.community.modularity(graph, [set(c) for c in communities], weight="weight") if graph.number_of_edges() else 0.0
    cluster_of: dict[str, int | None] = {}
    n_clusters = 0
    for c in communities:
        if len(c) == 1 and graph.degree(c[0]) == 0:
            cluster_of[c[0]] = None
            continue
        for d in c:
            cluster_of[d] = n_clusters
        n_clusters += 1
    for d in diseases:
        if is_group[d] and cluster_of.get(d) is None:
            votes = Counter(cluster_of.get(c) for c in slice_desc[d] if cluster_of.get(c) is not None)
            if votes:
                cluster_of[d] = sorted(votes.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    print(f"[louvain] {n_clusters} clusters (modularity {modularity:.3f}), "
          f"{sum(1 for v in cluster_of.values() if v is None)} isolated diseases")
    for e in sim_edges.values():
        e.pop("inputs_simgic", None)

    # ================================================================ 8. enrichment (optional)
    enrich = load_enrichment()

    # ================================================================ 9. export
    export(base=base, sl=sl, hpo=hpo, mondo=mondo, nodes=nodes, diseases=diseases, genes=genes, core_set=core_set,
           ic_of=ic_of, n_ic_corpus=n_ic_corpus, slice_parents=slice_parents, slice_children=slice_children,
           pheno_edges_of=pheno_edges_of, rolled_pheno_of=rolled_pheno_of, all_gene_edges_of=all_gene_edges_of,
           own_pos_phenos=own_pos_phenos, rollup_edges=rollup_edges, sim_edges=sim_edges, gene_share_edges=gene_share_edges,
           shared_genes_pairs=shared_genes_pairs, describe_pair=describe_pair, mechanism_verdict=mechanism_verdict,
           cluster_of=cluster_of, class_of=class_of, enrich=enrich, is_group=is_group, stats={
               "ic_terms": len(ic), "ic_corpus_diseases": n_ic_corpus, "clusters": n_clusters,
               "modularity": r(modularity, 4), "counterexample_pairs": len(counterexample_pairs),
               "rollup_categories_skipped": len(rollup_skipped_categories)})
    print(f"[done] {time.time()-t0:.1f}s")
    return 0


# ----------------------------------------------------------------------------------------------- edge builders
def rolled_up_edge(parent: str, target: str, etype: str, child_edges: list[dict], sl: dict, nodes: dict,
                   n_with: int | None = None) -> dict:
    children = sorted({e["source"] for e in child_edges})
    conf = min(e["confidence"] for e in child_edges) * ROLLUP_CONFIDENCE_FACTOR
    evidence = []
    for e in child_edges:
        for ev in sorted(e["evidence"], key=lambda ev: (-ev["confidence"], ev["record"])):
            copy = {k: v for k, v in ev.items() if k != "snippet"}
            copy.update({"level": "inferred", "source_level": ev["level"], "via_subtype": e["source"], "via_edge": e["id"],
                         "confidence": r(ev["confidence"] * ROLLUP_CONFIDENCE_FACTOR, 3),
                         "snippet": f"via subtype {nodes[e['source']]['label']} ({e['source']}): {ev.get('snippet', '')}"})
            evidence.append(copy)
    evidence.sort(key=lambda ev: (-ev["confidence"], ev["via_subtype"], ev["record"]))
    total = len(evidence)
    evidence = evidence[:ROLLUP_EVIDENCE_CAP]
    target_label = nodes[target]["label"] if target in nodes else target
    via = ", ".join(f"{c} [{next(e['id'] for e in child_edges if e['source'] == c)}]" for c in children)
    if etype == "has_phenotype":
        formula = (f"roll-up: parent has no own phenotypes; {target_label} in {len(children)} of {n_with} subtypes "
                   f"(min {PHENOTYPE_ROLLUP_MIN_SHARE:.0%}): {via} · confidence = min(subtypes) x {ROLLUP_CONFIDENCE_FACTOR} = {r(conf, 3)}")
    else:
        formula = (f"roll-up via subtype{'s' if len(children) > 1 else ''} {via} · holds for these subtypes, not "
                   f"necessarily every form · confidence = min(subtypes) x {ROLLUP_CONFIDENCE_FACTOR} = {r(conf, 3)}")
    edge = {"id": edge_id(parent, target, etype), "source": parent, "target": target, "type": etype,
            "evidence": evidence, "contradicting": [], "confidence": r(conf, 3),
            "independent_sources": sorted({ev["origin"] for ev in evidence}), "level": "inferred",
            "formula": formula, "rolled_up_from": children}
    return edge


def similarity_edge(a: str, b: str, info: dict, rank_of: dict, nodes: dict, hpo: dict, ic_of, n_corpus: int,
                    verdict) -> dict:
    mica = info.get("mica")
    rank_a = rank_of.get(a, {}).get(b)
    rank_b = rank_of.get(b, {}).get(a)
    ranks = "/".join(str(rk) if rk else "–" for rk in (rank_a, rank_b))
    mica_txt = f"top: {mica} {hpo['labels'].get(mica, mica)} (IC {ic_of(mica):.2f})" if mica else "no shared term"
    formula = (f"simGIC {info['simgic']:.3f} · Resnik-BMA {info.get('resnik_bma', 0):.2f} over {info['n_shared_direct']} "
               f"shared terms · {mica_txt} · rank {ranks}")
    method = (f"Computed phenotype similarity. simGIC = IC-weighted Jaccard over ancestor-closed HPO term sets (Pesquita 2008); "
              f"Resnik-BMA = best-match average of the IC of the most informative common ancestor (Resnik 1995); "
              f"IC = -ln(share of {n_corpus} HPO-annotated diseases with the term or a descendant); "
              f"{info['n_shared_closed']} of {info['n_union_closed']} ancestor-closed terms shared; rank = position in the "
              f"source's / target's similarity list. {formula}")
    if verdict is True:
        method += " Counterexample candidate: different curated mechanism class, no shared causal gene."
    inputs = {"simgic": info["simgic"], "resnik_bma": info.get("resnik_bma"), "n_shared_terms": info["n_shared_direct"],
              "n_shared_closed": info["n_shared_closed"], "n_union_closed": info["n_union_closed"],
              "mica": {"id": mica, "label": hpo["labels"].get(mica, mica), "ic": r(ic_of(mica), 3)} if mica else None,
              "rank": {a: rank_a, b: rank_b}, "ic_corpus": n_corpus}
    ev = computed_evidence(info["simgic"], method, inputs)
    edge = make_edge(a, b, "similar_phenotype", [ev], info["simgic"], formula)
    edge["inputs_simgic"] = info["simgic"]  # internal, popped before export
    return edge


def shares_gene_edge(a: str, b: str, gs: list[str], causal_of: dict, nodes: dict) -> dict:
    parts, conf, underlying = [], 1.0, []
    for g in gs:
        ea, eb = causal_of[a][g], causal_of[b][g]
        conf = min(conf, ea["confidence"], eb["confidence"])
        underlying += [ea["id"], eb["id"]]
        tag = lambda e: " via subtype " + ",".join(e["rolled_up_from"]) if e.get("rolled_up_from") else ""
        parts.append(f"{g} ({ea['id']}{tag(ea)} + {eb['id']}{tag(eb)})")
    formula = f"shared causal gene{'s' if len(gs) > 1 else ''}: " + "; ".join(parts) + f" · confidence = min of the caused_by edges = {r(conf, 3)}"
    snippet = (f"{nodes[a]['label']} and {nodes[b]['label']} both have {', '.join(gs)} as causal gene "
               f"(caused_by edges incl. subtype roll-up). {formula}")
    ev = computed_evidence(conf, snippet, {"genes": gs, "edges": underlying})
    return make_edge(a, b, "shares_gene", [ev], conf, formula)


def most_specific(shared_closed: set[str], closure, ic_of) -> list[str]:
    """Shared terms that have no shared descendant (the most specific common phenotypes), by IC desc."""
    redundant = set()
    for t in shared_closed:
        redundant |= (closure(t) - {t})
    keep = [t for t in shared_closed if t not in redundant]
    keep.sort(key=lambda t: (-ic_of(t), t))
    return keep[:5]


# ----------------------------------------------------------------------------------------------- enrichment
def load_enrichment() -> dict | None:
    draft = ENRICH / "edges_draft.json"
    if not draft.exists():
        print("[enrich] data/enrich/edges_draft.json missing — skipped")
        return None
    d = json.loads(draft.read_text())
    nodes = {n["id"]: n for n in d.get("nodes", [])}
    trial_extra = {}
    if (ENRICH / "ctgov.jsonl").exists():  # study type / enrollment / url live in the normalised records, not the draft node
        for line in (ENRICH / "ctgov.jsonl").read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                trial_extra[row["nct_id"]] = {k: row.get(k) for k in ("study_type", "enrollment", "url")}
    by_disease: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    pathways: dict[str, list] = defaultdict(list)
    for e in d.get("edges", []):
        node = nodes.get(e["target"], {"id": e["target"]})
        if e["type"] == "mentioned_in":
            # search hits are not facts: listed as "papers mentioning" without an evidence level (coordinator rule)
            ev = e["evidence"][0] if e["evidence"] else {}
            by_disease[e["source"]]["papers_mentioning"].append({
                "id": node["id"], "title": node.get("label", ""), "year": node.get("year"), "journal": node.get("journal"),
                "cited_by": node.get("cited_by"), "authors": (node.get("authors") or [])[:3], "db": ev.get("db"),
                "record": ev.get("record"), "url": ev.get("url"), "date": ev.get("date"), "retrieved": ev.get("retrieved"),
                "matched_term": ev.get("matched_term"), "matched_in": ev.get("matched_in")})
            continue
        kind = {"studied_in": "trials", "funded_by": "grants", "target_score": "targets"}.get(e["type"])
        if kind == "trials":
            node = dict(node) | {k: v for k, v in trial_extra.get(node["id"], {}).items() if v is not None}
            phases = node.get("phases") or []
            node["phase_label"] = ("/".join(p.replace("EARLY_PHASE", "Early Phase ").replace("PHASE", "Phase ").replace("NA", "n/a")
                                            for p in phases) if phases else
                                   "observational (no phase)" if node.get("study_type") == "OBSERVATIONAL" else "phase n/a")
            node.setdefault("nct_aliases", [])
        if kind:
            by_disease[e["source"]][kind].append({"node": node, "edge": e})
        elif e["type"] == "in_pathway":
            pathways[e["source"]].append({"node": node, "edge": e})
    # pathway specificity: how many slice genes carry it. A pathway carrying >= PATHWAY_HUB_SHARE of all genes with a
    # Reactome annotation (e.g. Neutrophil degranulation) is generic and only listed under "more".
    pathway_genes: dict[str, set] = defaultdict(set)
    for g, items in pathways.items():
        for it in items:
            pathway_genes[it["node"]["id"]].add(g)
    hub_cut = max(PATHWAY_HUB_MIN_GENES, math.ceil(PATHWAY_HUB_SHARE * len(pathways)))
    generic = {pw for pw, gs in pathway_genes.items() if len(gs) >= hub_cut}
    coverage: dict[str, list] = defaultdict(list)
    cov_file = ENRICH / "coverage.jsonl"
    if cov_file.exists():
        for line in cov_file.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                coverage[row["mondo_id"]].append({k: row.get(k) for k in (
                    "source", "query", "hits_raw", "hits_kept", "hits_discarded", "retrieved", "note", "error")}
                    | {"queries": [{k: q.get(k) for k in ("query", "url", "total_hits")} for q in row.get("queries", [])][:6]})
    reactome_queried = set()
    rx = ENRICH / "reactome.jsonl"
    if rx.exists():
        for line in rx.read_text().splitlines():
            if line.strip():
                row = json.loads(line)
                if not row.get("error"):
                    reactome_queried.add(row["symbol"])
    gene_nodes = {n["id"]: n for n in d.get("nodes", []) if n.get("type") == "gene"}
    print(f"[enrich] {len(d.get('edges', []))} draft edges · {len(by_disease)} diseases · {len(pathways)} genes with pathways · "
          f"coverage for {len(coverage)} diseases")
    return {"by_disease": by_disease, "pathways": pathways, "pathway_genes": pathway_genes, "generic_pathways": generic,
            "coverage": coverage, "reactome_queried": reactome_queried,
            "gene_nodes": gene_nodes, "gene_attributes": d.get("gene_attributes", {}),
            "meta": d.get("meta", {}), "versions": enrichment_versions()}


def enrichment_versions() -> list[dict]:
    sources = {}
    for name, db, lic, url in (("ctgov", "ClinicalTrials.gov", "US public domain", "https://clinicaltrials.gov"),
                               ("europepmc", "Europe PMC", "abstracts: publisher terms; metadata CC0", "https://europepmc.org"),
                               ("reporter", "NIH RePORTER", "US public domain", "https://reporter.nih.gov"),
                               ("opentargets", "Open Targets", "CC0 1.0", "https://platform.opentargets.org"),
                               ("reactome", "Reactome", "CC-BY 4.0", "https://reactome.org"),
                               ("clinvar", "ClinVar", "US public domain", "https://www.ncbi.nlm.nih.gov/clinvar/"),
                               ("mygene", "MyGene.info", "free (see mygene.info terms)", "https://mygene.info")):
        f = ENRICH / f"{name}.jsonl"
        if not f.exists():
            continue
        retrieved, data_version = set(), set()
        for line in f.read_text().splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get("retrieved"):
                retrieved.add(str(row["retrieved"])[:10])
            if row.get("data_version"):
                data_version.add(str(row["data_version"]))
        version = (f"{sorted(data_version)[-1]} · " if data_version else "") + (f"retrieved {max(retrieved)}" if retrieved else "")
        sources[db] = {"db": db, "version": version or "unknown", "license": lic, "url": url}
    return [sources[k] for k in sorted(sources)]


# ----------------------------------------------------------------------------------------------- export
def dump(path: Path, obj) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def file_safe(node_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", node_id)


def shard_names(ids: list[str]) -> dict[str, str]:
    """id -> file stem. Ids that differ only in case (C19ORF12 / C19orf12 from two sources) would overwrite each other on
    case-insensitive file systems: the later one in sort order gets a __2 suffix, listed in meta.json shard_overrides."""
    names, taken = {}, set()
    for node_id in sorted(ids):
        stem = file_safe(node_id)
        n = 2
        while stem.lower() in taken:
            stem = f"{file_safe(node_id)}__{n}"
            n += 1
        taken.add(stem.lower())
        names[node_id] = stem
    return names


CORE_EVIDENCE_KEYS = ("db", "record", "url", "level", "date")


def core_edge(edge: dict, max_evidence: int) -> dict:
    """Overview form for core.json: evidence keeps only db/record/url/level/date (no snippet), at most
    `max_evidence` entries (+ evidence_omitted). The full edge with snippets lives in the disease / gene shard."""
    out = dict(edge)
    for bucket in ("evidence", "contradicting"):
        items = [{k2: ev[k2] for k2 in CORE_EVIDENCE_KEYS if k2 in ev} for ev in edge.get(bucket, [])]
        if len(items) > max_evidence:
            out[f"{bucket}_omitted"] = len(items) - max_evidence
            items = items[:max_evidence]
        out[bucket] = items
    return out


def compact_edge(edge: dict, snippet_len: int | None, max_evidence: int | None = None) -> dict:
    """Shorten snippets (and optionally drop surplus evidence entries) — db/record/url/level/date always stay."""
    out = dict(edge)
    for bucket in ("evidence", "contradicting"):
        items = []
        for ev in edge.get(bucket, []):
            ev2 = {k: v for k, v in ev.items() if k != "inputs"} if snippet_len is not None and snippet_len < 120 else dict(ev)
            if snippet_len is not None and len(ev2.get("snippet", "")) > snippet_len:
                ev2["snippet"] = ev2["snippet"][:max(snippet_len - 1, 0)].rstrip() + "…"
            items.append(ev2)
        if max_evidence is not None and len(items) > max_evidence:
            out[f"{bucket}_omitted"] = len(items) - max_evidence
            items = items[:max_evidence]
        out[bucket] = items
    return out


def export(**k) -> None:
    nodes, diseases, genes, core_set = k["nodes"], k["diseases"], k["genes"], k["core_set"]
    hpo, ic_of, enrich = k["hpo"], k["ic_of"], k["enrich"]
    sim_edges, gene_share_edges, rollup_edges = k["sim_edges"], k["gene_share_edges"], k["rollup_edges"]
    OUT.mkdir(parents=True, exist_ok=True)

    # ---- full edge list (for degree + counts)
    gene_edges_all = [e for e in k["base"]["edges"] if e["type"] in GENE_EDGE_TYPES] + \
                     [e for e in rollup_edges if e["type"] in GENE_EDGE_TYPES]
    gene_edges_all.sort(key=lambda e: (e["source"], e["target"], e["type"]))
    pheno_rollups = [e for e in rollup_edges if e["type"] == "has_phenotype"]
    analytic_edges = sorted(sim_edges.values(), key=lambda e: e["id"]) + sorted(gene_share_edges.values(), key=lambda e: e["id"])
    all_edges = k["base"]["edges"] + rollup_edges + analytic_edges
    degree: Counter = Counter()
    for e in all_edges:
        degree[e["source"]] += 1
        degree[e["target"]] += 1
    ids = [e["id"] for e in all_edges]
    dupes = [i for i, c in Counter(ids).items() if c > 1]
    if dupes:
        raise SystemExit(f"edge id collision: {dupes[:5]}")

    # ---- top-k phenotypes per disease
    topk: dict[str, list[dict]] = {}
    pheno_total: dict[str, int] = {}
    for d in diseases:
        own = k["pheno_edges_of"][d]
        pos = [e for e in own if e["evidence"]] or k["rolled_pheno_of"][d]
        contra = [e for e in own if e["contradicting"]]
        pos_sorted = sorted(pos, key=lambda e: (-(ic_of(hpo["alt"].get(e["target"], e["target"])) * e["confidence"]), e["target"]))
        chosen = pos_sorted[:TOP_K_PHENOTYPES]
        chosen_ids = {e["id"] for e in chosen}
        chosen += sorted((e for e in contra if e["id"] not in chosen_ids), key=lambda e: e["target"])
        topk[d] = chosen
        pheno_total[d] = len(pos)
    topk_phenos = sorted({e["target"] for es in topk.values() for e in es})

    gene_edges_of_gene: dict[str, list[dict]] = defaultdict(list)
    for e in gene_edges_all:
        gene_edges_of_gene[e["target"]].append(e)
    genes_in_core = {e["target"] for e in gene_edges_all if e["source"] in core_set}
    phenos_in_core = {e["target"] for d in core_set for e in k["pheno_edges_of"][d]}
    is_group = k["is_group"]

    def gene_cluster(g: str):
        votes = Counter(k["cluster_of"].get(e["source"]) for e in gene_edges_of_gene[g] if k["cluster_of"].get(e["source"]) is not None)
        return sorted(votes.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] if votes else None

    # ---- index.json
    index = []
    for d in diseases:
        n = nodes[d]
        index.append({"id": d, "type": "disease", "label": n["label"], "synonyms": [s for s in n["synonyms"] if s != n["label"]][:MAX_SYNONYMS],
                      "xrefs": [x for x in n["xrefs"] if x.split(":")[0] in INDEX_XREF_PREFIXES], "in_core": d in core_set, "degree": degree[d]})
    for g in genes:
        n = nodes[g]
        syn = [n["full_name"]] if n.get("full_name") and n["full_name"] != g else []
        gn = (enrich or {}).get("gene_nodes", {}).get(g, {})
        xr = [f"NCBIGene:{n['ncbi_gene_id']}"] if n.get("ncbi_gene_id") else []
        if gn.get("uniprot"):
            xr.append(f"UniProt:{gn['uniprot']}")
        index.append({"id": g, "type": "gene", "label": n["label"], "synonyms": syn[:MAX_SYNONYMS], "xrefs": xr,
                      "in_core": g in genes_in_core, "degree": degree[g]})
    for p in topk_phenos:
        index.append({"id": p, "type": "phenotype", "label": nodes[p]["label"] if p in nodes else hpo["labels"].get(p, p),
                      "synonyms": hpo["synonyms"].get(p, [])[:MAX_PHENOTYPE_SYNONYMS], "xrefs": [],
                      "in_core": p in phenos_in_core, "degree": degree[p]})

    # ---- core.json
    n_genes_of = {d: len({e["target"] for e in k["all_gene_edges_of"][d] if e["evidence"]}) for d in diseases}
    core_nodes = []
    for d in diseases:
        core_nodes.append({"id": d, "type": "disease", "label": nodes[d]["label"], "in_core": d in core_set,
                           "cluster_id": k["cluster_of"].get(d), "n_genes": n_genes_of[d], "n_phenotypes": pheno_total[d],
                           "is_group": is_group[d]})
    for g in genes:
        core_nodes.append({"id": g, "type": "gene", "label": nodes[g]["label"], "in_core": g in genes_in_core,
                           "cluster_id": gene_cluster(g), "n_genes": None, "n_phenotypes": None,
                           "n_diseases": len({e["source"] for e in gene_edges_of_gene[g]})})
    core_gene_edges = [e for e in gene_edges_all if e["source"] in core_set or e["target"] in genes_in_core]
    core_edges_full = core_gene_edges + analytic_edges
    core_gene_ids = {e["target"] for e in core_gene_edges}
    core_nodes = [n for n in core_nodes if n["type"] != "gene" or n["id"] in core_gene_ids]
    sizes = {}
    for max_ev in (3, 2, 1):
        core_edges = [core_edge(e, max_ev) for e in core_edges_full]
        core_obj = {"nodes": core_nodes, "edges": core_edges}
        size_core = len(json.dumps(core_obj, ensure_ascii=False, separators=(",", ":")).encode())
        size_index = len(json.dumps(index, ensure_ascii=False, separators=(",", ":")).encode())
        if size_core + size_index < CORE_INDEX_BUDGET:
            break
    sizes["core.json"] = dump(OUT / "core.json", core_obj)
    sizes["index.json"] = dump(OUT / "index.json", index)
    print(f"[export] core.json {sizes['core.json']/1e6:.2f} MB (max {max_ev} evidence/edge) · index.json {sizes['index.json']/1e6:.2f} MB")

    # ---- disease shards
    neighbours_of: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for e in analytic_edges:
        neighbours_of[e["source"]].append((e["target"], e))
        neighbours_of[e["target"]].append((e["source"], e))
    written = set()
    shard_sizes = []
    shard_stem = shard_names(diseases) | shard_names(genes)
    shard_overrides = {i: f"{'disease' if i in set(diseases) else 'gene'}/{stem}.json"
                       for i, stem in sorted(shard_stem.items()) if stem != file_safe(i)}
    enrich_by = (enrich or {}).get("by_disease", {})
    coverage = (enrich or {}).get("coverage", {})
    pathways = (enrich or {}).get("pathways", {})
    reactome_queried = (enrich or {}).get("reactome_queried", set())
    for d in diseases:
        n = nodes[d]
        gene_list = sorted((e for e in k["all_gene_edges_of"][d]),
                           key=lambda e: (e["type"] != "caused_by", bool(e.get("rolled_up_from")), -e["confidence"], e["target"]))
        phenos = [{"edge": e, "phenotype": {"id": e["target"], "label": nodes[e["target"]]["label"] if e["target"] in nodes else hpo["labels"].get(e["target"], e["target"]),
                                             "ic": r(ic_of(hpo["alt"].get(e["target"], e["target"])), 3)}} for e in topk[d]]
        # neighbours: one entry per partner, similar_phenotype preferred, then shares_gene
        partners: dict[str, dict] = {}
        for other, e in neighbours_of[d]:
            cur = partners.get(other)
            if cur is None or (cur["type"] == "shares_gene" and e["type"] == "similar_phenotype"):
                partners[other] = e
        neigh = []
        for other, e in partners.items():
            info = k["describe_pair"](d, other, with_resnik=False)
            verdict, note = k["mechanism_verdict"](d, other)
            note += pathway_note(d, other, k["all_gene_edges_of"], enrich)
            pair = (d, other) if d < other else (other, d)
            neigh.append({"id": other, "label": nodes[other]["label"], "edge": e,
                          "shared_phenotypes": [{"id": t, "label": hpo["labels"].get(t, t), "ic": r(ic_of(t), 3)} for t in info["shared_specific"]],
                          "shared_genes": k["shared_genes_pairs"].get(pair, []),
                          "mechanism_differs": verdict, "mechanism_note": note, "_sim": info["simgic"]})
        neigh.sort(key=lambda x: (x["edge"]["type"] != "similar_phenotype", -x["_sim"], x["id"]))
        for x in neigh:
            x.pop("_sim")
        shard = {"node": {"id": d, "label": n["label"], "definition": n.get("definition", ""),
                          "synonyms": [s for s in n["synonyms"] if s != n["label"]][:MAX_SYNONYMS], "xrefs": n["xrefs"],
                          "parents": sorted(k["slice_parents"][d]),
                          "parents_labels": {p: nodes[p]["label"] for p in sorted(k["slice_parents"][d])},
                          "children": sorted(k["slice_children"].get(d, [])),
                          "children_labels": {c: nodes[c]["label"] for c in sorted(k["slice_children"].get(d, []))},
                          "in_core": d in core_set, "cluster_id": k["cluster_of"].get(d), "is_group": is_group[d],
                          "n_genes": n_genes_of[d], "n_phenotypes": pheno_total[d],
                          "mechanism_classes": [{"key": c["key"], "label": next(m["label"] for m in MECHANISM_CLASSES if m["key"] == c["key"]),
                                                 "via": c["via"], "via_label": c["via_label"]} for c in k["class_of"][d]]},
                 "genes": gene_list, "phenotypes": phenos, "phenotypes_total": pheno_total[d], "neighbours": neigh}
        if enrich is not None:
            ed = enrich_by.get(d, {})
            shard["enrichment"] = {kind: sorted_enrichment(kind, ed.get(kind, []))[:ENRICH_CAP] for kind in ENRICH_KINDS}
            shard["enrichment"]["totals"] = {kind: len(ed.get(kind, [])) for kind in ENRICH_KINDS}
            shard["coverage"] = sorted(coverage.get(d, []), key=lambda c: c["source"]) or None
            if shard["coverage"] is None:
                shard["coverage"] = []
                shard["coverage_note"] = "not queried by 04_enrich_apis (outside the enrichment scope of this build)"
        size = fit_shard(shard)
        path = OUT / "disease" / f"{shard_stem[d]}.json"
        shard_sizes.append(dump(path, shard))
        written.add(path)

    # ---- gene shards
    gene_nodes_enrich = (enrich or {}).get("gene_nodes", {})
    gene_attrs = (enrich or {}).get("gene_attributes", {})
    for g in genes:
        n = dict(nodes[g])
        n["in_core"] = g in genes_in_core
        if gene_nodes_enrich.get(g, {}).get("uniprot"):
            n["uniprot"] = gene_nodes_enrich[g]["uniprot"]
        if g in gene_attrs:
            n.update(gene_attrs[g])
        shard = {"node": n, "diseases": sorted(gene_edges_of_gene[g], key=lambda e: (e["type"] != "caused_by", bool(e.get("rolled_up_from")), -e["confidence"], e["source"]))}
        if enrich is not None:
            pw_genes, generic = enrich["pathway_genes"], enrich["generic_pathways"]
            items = [dict(it, slice_genes=len(pw_genes[it["node"]["id"]]),
                          shared_with=sorted(pw_genes[it["node"]["id"]] - {g})[:12]) for it in pathways.get(g, [])]
            items.sort(key=lambda it: (-it["slice_genes"], it["node"]["id"]))
            shard["pathways"] = [it for it in items if it["node"]["id"] not in generic]
            shard["pathways_more"] = [it for it in items if it["node"]["id"] in generic]
            if items:
                shard["pathways_note"] = ("ordered by how many slice genes share the pathway; pathways_more = generic pathways "
                                          f"carried by >= {PATHWAY_HUB_SHARE:.0%} of annotated genes")
            if not items:
                shard["pathways_note"] = ("Reactome queried: no pathway annotated for this gene (coverage gap, not evidence of a different mechanism)"
                                          if g in reactome_queried else "Reactome not queried for this gene in this build")
        fit_shard(shard)
        path = OUT / "gene" / f"{shard_stem[g]}.json"
        shard_sizes.append(dump(path, shard))
        written.add(path)
    # ---- phenotype shards (every phenotype in index.json): annotated diseases, own has_phenotype edges only
    diseases_of_pheno: dict[str, list[dict]] = defaultdict(list)
    for d in diseases:
        for e in k["pheno_edges_of"][d]:
            diseases_of_pheno[e["target"]].append(e)
    for ph in topk_phenos:
        edges_here = diseases_of_pheno.get(ph, [])
        ranked_edges = sorted(edges_here, key=lambda e: (-(e["confidence"] * (1.0 if e["source"] in core_set else 0.0)),
                                                         -e["confidence"], e["source"]))
        positive = [e for e in ranked_edges if e["evidence"]]
        chosen = positive[:PHENOTYPE_SHARD_CAP]
        chosen += [e for e in ranked_edges if not e["evidence"]]  # pure counter-evidence: always listed
        term = hpo["alt"].get(ph, ph)
        node = {"id": ph, "label": nodes[ph]["label"] if ph in nodes else hpo["labels"].get(ph, ph), "ic": r(ic_of(term), 3)}
        if hpo["definitions"].get(term):
            node["definition"] = hpo["definitions"][term]
        shard = {"node": node,
                 "diseases": [{"id": e["source"], "label": nodes[e["source"]]["label"], "in_core": e["source"] in core_set,
                               "edge": e, "confidence": e["confidence"]} for e in chosen],
                 "diseases_total": len(positive), "diseases_contradicted": len(edges_here) - len(positive)}
        fit_shard(shard)
        path = OUT / "phenotype" / f"{file_safe(ph)}.json"
        shard_sizes.append(dump(path, shard))
        written.add(path)
    for folder in ("disease", "gene", "phenotype"):
        for f in (OUT / folder).glob("*.json"):
            if f not in written:
                f.unlink()  # stale shard from an earlier build or fixture

    # ---- meta.json (only file allowed to change between identical runs: built_at)
    edge_counts = Counter(e["type"] for e in all_edges)
    level_counts = Counter(e["level"] for e in all_edges)
    rolled_counts = Counter(e["type"] for e in rollup_edges)
    sources = [
        {"db": "HPO", "version": hpo_annotation_version(), "license": "HPO license (free with attribution)", "url": "https://hpo.jax.org"},
        {"db": "MONDO", "version": k["mondo"]["version"], "license": "CC-BY 4.0", "url": "https://mondo.monarchinitiative.org"},
        {"db": "Orphanet", "version": orphanet_version(), "license": "CC-BY 4.0", "url": "https://www.orphadata.com"},
        {"db": "OMIM (via HPO annotations)", "version": hpo_annotation_version(), "license": "attribution OMIM; only indirectly via HPO", "url": "https://omim.org"},
    ] + ((enrich or {}).get("versions") or [])
    meta = {"version": f"{BUILD_DATE}+{GIT_SHA}", "built_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
            "fixture": False, "sources": sources,
            "counts": {"nodes": {"disease": len(diseases), "core_disease": len(core_set), "gene": len(genes),
                                 "phenotype": sum(1 for n in k["base"]["nodes"] if n["type"] == "phenotype"),
                                 "phenotype_in_index": len(topk_phenos)},
                       "edges": dict(sorted(edge_counts.items())), "edges_rolled_up": dict(sorted(rolled_counts.items())),
                       "levels": dict(sorted(level_counts.items())),
                       "core_edges": len(core_edges_full), "disease_shards": len(diseases), "gene_shards": len(genes),
                       "phenotype_shards": len(topk_phenos),
                       **k["stats"]},
            "parameters": {"top_k_phenotypes": TOP_K_PHENOTYPES, "top_similar": TOP_SIMILAR, "top_resnik": TOP_RESNIK,
                           "counterexample": {"max_rank": COUNTEREXAMPLE_MAX_RANK, "min_simgic": COUNTEREXAMPLE_MIN_SIMGIC},
                           "rollup_confidence_factor": ROLLUP_CONFIDENCE_FACTOR, "max_rollup_genes": MAX_ROLLUP_GENES,
                           "phenotype_rollup_min_share": PHENOTYPE_ROLLUP_MIN_SHARE,
                           "louvain": {"seed": LOUVAIN_SEED, "resolution": LOUVAIN_RESOLUTION, "w_simgic": W_SIMGIC, "w_shared_gene": W_SHARED_GENE},
                           "mechanism_classes": MECHANISM_CLASSES},
            "analytics": {"record": RECORD, "url": CODE_URL, "date": BUILD_DATE},
            "files": {"core.json": sizes["core.json"], "index.json": sizes["index.json"],
                      "shard_max": max(shard_sizes), "shard_median": int(np.median(shard_sizes))},
            **({"shard_overrides": shard_overrides} if shard_overrides else {}),
            "hero": {"start": HERO_START}}
    dump(OUT / "meta.json", meta)
    print(f"[export] {len(diseases)} disease + {len(genes)} gene + {len(topk_phenos)} phenotype shards · max {max(shard_sizes)/1e3:.0f} KB · "
          f"median {np.median(shard_sizes)/1e3:.1f} KB → {OUT.relative_to(ROOT)}")
    print("[counts] " + " · ".join(f"{t} {c}" for t, c in sorted(edge_counts.items())))


def sorted_enrichment(kind: str, items: list[dict]) -> list[dict]:
    def key(it):
        if kind == "papers_mentioning":
            return (-(it.get("cited_by") or 0), -(it.get("year") or 0), it["id"])
        n, e = it["node"], it["edge"]
        if kind == "trials":
            return (-(int(str(n.get("start_date") or "0")[:4] or 0)), n["id"])
        if kind == "grants":
            return (-(n.get("latest_fiscal_year") or 0), n["id"])
        return (-e.get("confidence", 0), n["id"])
    return sorted(items, key=key)


def pathway_note(a: str, b: str, gene_edges_of: dict, enrich: dict | None) -> str:
    """Reactome context for a disease pair. Specific pathways that connect *different* causal genes come first; generic
    hub pathways never count as a mechanism link; a gene without any Reactome pathway is called a data gap."""
    if not enrich:
        return ""
    pathways, queried = enrich["pathways"], enrich["reactome_queried"]
    pw_genes, generic = enrich["pathway_genes"], enrich["generic_pathways"]
    ga = sorted({e["target"] for e in gene_edges_of[a] if e["type"] == "caused_by"})
    gb = sorted({e["target"] for e in gene_edges_of[b] if e["type"] == "caused_by"})
    if not ga or not gb:
        return ""
    label, genes_a, genes_b = {}, defaultdict(set), defaultdict(set)
    for side, gl in ((genes_a, ga), (genes_b, gb)):
        for g in gl:
            for it in pathways.get(g, []):
                side[it["node"]["id"]].add(g)
                label[it["node"]["id"]] = it["node"].get("label", it["node"]["id"])
    shared = set(genes_a) & set(genes_b)
    specific = [p for p in shared if p not in generic]
    cross = sorted((p for p in specific if genes_a[p] != genes_b[p]), key=lambda p: (-len(pw_genes[p]), p))
    same = sorted((p for p in specific if genes_a[p] == genes_b[p]), key=lambda p: (-len(pw_genes[p]), p))
    n_generic = len(shared) - len(specific)
    gap = sorted({g for g in ga + gb if g in queried and not pathways.get(g)})
    unqueried = [g for g in ga + gb if g not in queried]
    more = f" (+{n_generic} generic)" if n_generic else ""
    if cross:
        parts = [f"{p} {label[p]} ({'+'.join(sorted(genes_a[p] | genes_b[p]))})" for p in cross[:2]]
        return " Reactome: shared specific pathway " + "; ".join(parts) + more + "."
    if same:
        via = sorted(set().union(*(genes_a[p] for p in same)))
        return (f" Reactome: pathways shared only through the common gene {', '.join(via)} (e.g. {same[0]} {label[same[0]]})"
                f"{more}.")
    if gap:
        return (f" Reactome: no pathway annotated for {', '.join(gap)}, so pathway overlap 0 is a data gap, "
                f"not evidence of a different mechanism.")
    if genes_a and genes_b and not unqueried:
        return f" Reactome: no shared specific pathway between the causal genes{more}."
    return ""


def fit_shard(shard: dict) -> int:
    """Shrink a shard until it fits SHARD_BUDGET: shorten snippets, then cap evidence, then cap long lists."""
    def size() -> int:
        return len(json.dumps(shard, ensure_ascii=False, separators=(",", ":")).encode())
    if size() <= SHARD_BUDGET:
        return size()
    for snippet_len, max_ev in ((200, None), (120, 6), (80, 3), (60, 2)):
        for key in ("genes", "diseases"):
            if key in shard:
                shard[key] = [dict(it, edge=compact_edge(it["edge"], snippet_len, max_ev)) if "edge" in it
                              else compact_edge(it, snippet_len, max_ev) for it in shard[key]]
        if "phenotypes" in shard:
            for p in shard["phenotypes"]:
                p["edge"] = compact_edge(p["edge"], snippet_len, max_ev)
        if "neighbours" in shard:
            for nb in shard["neighbours"]:
                nb["edge"] = compact_edge(nb["edge"], snippet_len, max_ev)
        for kind in ("trials", "grants", "targets"):
            for it in shard.get("enrichment", {}).get(kind, []):
                it["edge"] = compact_edge(it["edge"], snippet_len, max_ev)
        if size() <= SHARD_BUDGET:
            return size()
    for key in ("genes", "diseases", "neighbours"):
        if key in shard and size() > SHARD_BUDGET:
            total = len(shard[key])
            while size() > SHARD_BUDGET and len(shard[key]) > 10:
                shard[key] = shard[key][: max(10, int(len(shard[key]) * 0.8))]
            if len(shard[key]) < total:
                shard.setdefault(f"{key}_total", total)
                shard[f"{key}_truncated"] = True
    return size()


def hpo_annotation_version() -> str:
    for line in (RAW / "phenotype.hpoa").open():
        if line.startswith("#version"):
            return line.split(": ", 1)[1].strip()
    return "unknown"


def orphanet_version() -> str:
    head = (RAW / "en_product6.xml").open().read(500)
    m = re.search(r'date="(\d{4}-\d{2}-\d{2})', head)
    return f"JDBOR {m.group(1)}" if m else "unknown"


if __name__ == "__main__":
    raise SystemExit(main())
