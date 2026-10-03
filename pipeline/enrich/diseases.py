"""Disease scope + search terms + noise filter, shared by all enrichment clients.

Scope:  hero (Krabbe/MLD + subtypes, Gaucher, PSAP deficiencies, Pelizaeus-Merzbacher) | core (350) | all (core + neighbours)
Terms:  label + synonyms (+ comma-reordered MONDO variants), minus synonyms that several diseases share (ambiguous)
Filter: text matches only if a term occurs as whole words (case-insensitive, punctuation-insensitive)
"""
from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

HERO_WITH_SUBTYPES = ["MONDO:0009499", "MONDO:0018868"]                         # Krabbe, MLD
HERO_SINGLE = ["MONDO:0018150", "MONDO:0010714"]                                # Gaucher, Pelizaeus-Merzbacher
HERO_PSAP = ["MONDO:0012719", "MONDO:0012720", "MONDO:0009590", "MONDO:0012517", "MONDO:0100517"]
HERO_PSAP_GENE = "PSAP"                                                         # + every slice disease annotated with PSAP
STOP_TERMS = {"disease", "disorder", "syndrome", "deficiency", "type", "form"}
MIN_TERM_LENGTH = 4


@dataclass
class Disease:
    mondo_id: str
    label: str
    synonyms: list[str]
    genes: list[str]
    is_core: bool
    is_hero: bool
    query_terms: list[str] = field(default_factory=list)   # display forms, best first (label first)
    match_terms: list[str] = field(default_factory=list)   # normalised, unambiguous, used by the noise filter

    @property
    def ot_id(self) -> str:
        return self.mondo_id.replace(":", "_")


def normalize(text: str) -> str:
    """lowercase, strip accents and possessive 's, punctuation -> single spaces, padded with spaces for whole-word search."""
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode().lower()
    text = re.sub(r"['`]s\b", "", text)
    return " " + re.sub(r"[^a-z0-9]+", " ", text).strip() + " "


def variants(name: str) -> list[str]:
    """Display variants of a MONDO name: full, without parentheses, and the un-inverted form
    ('leukodystrophy, hypomyelinating, 3' -> 'hypomyelinating leukodystrophy 3')."""
    name = " ".join(name.split())
    stripped = re.sub(r"\s*\([^)]*\)", "", name).strip()
    out = [name]
    if stripped and stripped != name:
        out.append(stripped)
    if "," in stripped:
        parts = [p.strip() for p in stripped.split(",") if p.strip()]
        suffix = parts[-1] if re.fullmatch(r"(type )?[0-9ivx]+[a-z]?", parts[-1].lower()) else None
        head = parts[:-1] if suffix else parts
        if len(head) == 2:
            out.append(" ".join([head[1], head[0]] + ([suffix] if suffix else [])))
        elif len(head) == 1 and suffix:
            out.append(f"{head[0]} {suffix}")
    seen: set[str] = set()
    return [v for v in out if not (v.lower() in seen or seen.add(v.lower()))]


@lru_cache(maxsize=1)
def load_slice() -> dict:
    return json.loads((ROOT / "data" / "slice.json").read_text())


@lru_cache(maxsize=1)
def _descendants_index() -> dict[str, set[str]]:
    children: dict[str, set[str]] = {}
    for mondo_id, node in load_slice()["mondo"].items():
        for parent in node.get("parents", []):
            children.setdefault(parent, set()).add(mondo_id)
    return children


def descendants(root: str) -> set[str]:
    index = _descendants_index()
    seen: set[str] = set()
    stack = [root]
    while stack:
        for child in index.get(stack.pop(), ()):
            if child not in seen:
                seen.add(child)
                stack.append(child)
    return seen


@lru_cache(maxsize=1)
def hero_ids() -> frozenset[str]:
    slice_data = load_slice()
    ids = set(HERO_SINGLE) | set(HERO_PSAP)
    for root in HERO_WITH_SUBTYPES:
        ids |= {root} | descendants(root)
    ids |= {d for d, genes in slice_data["disease_genes"].items() if HERO_PSAP_GENE in genes}
    return frozenset(i for i in ids if i in set(slice_data["core"]))  # hero is always a subset of core


@lru_cache(maxsize=1)
def _term_owners() -> dict[str, set[str]]:
    """normalised variant -> set of diseases claiming it (as label or synonym), for the ambiguity filter."""
    owners: dict[str, set[str]] = {}
    for mondo_id, node in load_slice()["mondo"].items():
        for name in [node["label"], *node["synonyms"]]:
            for variant in variants(name):
                owners.setdefault(normalize(variant).strip(), set()).add(mondo_id)
    return owners


def _rank_synonym(name: str) -> tuple:
    words = len(name.split())
    return (words < 2, len(name) < 8, len(name), name.lower(), name)  # multi-word, not tiny, then shortest = most commonly used wording; name = deterministic tie-break


def build_disease(mondo_id: str) -> Disease:
    slice_data = load_slice()
    node = slice_data["mondo"][mondo_id]
    owners = _term_owners()
    own_label_forms = {normalize(v).strip() for v in variants(node["label"])}

    def usable(display: str) -> bool:
        norm = normalize(display).strip()
        if len(norm) < MIN_TERM_LENGTH or norm in STOP_TERMS:
            return False
        return norm in own_label_forms or owners.get(norm, {mondo_id}) == {mondo_id}

    label_forms = [v for v in variants(node["label"]) if usable(v)]
    synonym_forms: list[str] = []
    for name in sorted(set(node["synonyms"]), key=_rank_synonym):  # set order varies per process; _rank_synonym breaks every tie
        synonym_forms.extend(v for v in variants(name) if usable(v))
    query_terms: list[str] = []
    # best query form of the label first: parentheses stripped (index 1 if present), then the un-inverted variant
    for form in sorted(label_forms, key=lambda v: ("(" in v, "," in v, len(v))):
        query_terms.append(form)
    query_terms.extend(synonym_forms)
    deduped: list[str] = []
    seen: set[str] = set()
    for term in query_terms:
        norm = normalize(term).strip()
        if norm not in seen:
            seen.add(norm)
            deduped.append(term)
    match_terms = sorted(seen, key=lambda t: (-len(t), t))
    return Disease(mondo_id, node["label"], node["synonyms"], slice_data["disease_genes"].get(mondo_id, []),
                   mondo_id in set(slice_data["core"]), mondo_id in hero_ids(), deduped, match_terms)


def select(scope: str, limit: int | None = None) -> list[Disease]:
    """Diseases in scope, hero diseases first (so --limit and partial runs always include the hero path)."""
    slice_data = load_slice()
    core = list(slice_data["core"])
    if scope == "hero":
        pool = [d for d in core if d in hero_ids()]
    elif scope == "core":
        pool = core
    elif scope == "all":
        pool = core + [d for d in slice_data["mondo"] if d not in set(core)]
    else:
        raise ValueError(f"unknown scope {scope!r}")
    hero_first = sorted(pool, key=lambda d: (d not in hero_ids(), pool.index(d)))
    if limit:
        hero_first = hero_first[:limit]
    return [build_disease(d) for d in hero_first]


def gene_scope(diseases: list[Disease], limit: int | None = None) -> dict[str, list[str]]:
    """gene symbol -> disease ids. Hero scope also pulls in genes of hero-root subtypes (e.g. GBA1 via Gaucher subtypes)."""
    gene_to_diseases: dict[str, list[str]] = {}
    slice_data = load_slice()
    for disease in diseases:
        related = [disease.mondo_id]
        if disease.mondo_id in HERO_SINGLE or disease.mondo_id in HERO_WITH_SUBTYPES:
            related += sorted(descendants(disease.mondo_id))
        for related_id in related:
            for symbol in slice_data["disease_genes"].get(related_id, []):
                gene_to_diseases.setdefault(symbol, [])
                if disease.mondo_id not in gene_to_diseases[symbol]:
                    gene_to_diseases[symbol].append(disease.mondo_id)
    symbols = sorted(gene_to_diseases)
    if limit:
        symbols = symbols[:limit]
    return {s: gene_to_diseases[s] for s in symbols}


def match_text(fields: dict[str, str], terms: list[str]) -> tuple[str, list[str]] | None:
    """Return (longest matching term, names of the fields containing a term) or None if nothing matches as whole words."""
    best_term = ""
    matched_in: list[str] = []
    for field_name, text in fields.items():
        normalized = normalize(text)
        for term in terms:
            if f" {term} " in normalized:
                matched_in.append(field_name)
                if len(term) > len(best_term):
                    best_term = term
                break
    return (best_term, matched_in) if matched_in else None


def paper_cap(disease: Disease) -> int:
    return 50 if disease.is_hero else 10


def expand_list_field(items: list[str]) -> str:
    """Join list entries (conditions, keywords) incl. their un-inverted forms: 'Leukodystrophy, Globoid Cell' also yields 'Globoid Cell Leukodystrophy'."""
    return " | ".join(v for item in items for v in variants(item))


def coverage_record(disease: Disease, source: str, *, queries: list[dict], hits_raw: int | None, hits_kept: int,
                    hits_discarded: int, retrieved: str | None, note: str | None = None, error: str | None = None,
                    **extra) -> dict:
    """One honest-gap record per (disease, source): what was asked, how many hits, how many dropped by the noise filter, when."""
    return {"mondo_id": disease.mondo_id, "label": disease.label, "source": source,
            "query": " ; ".join(q["query"] for q in queries) if queries else None, "queries": queries,
            "hits_raw": hits_raw, "hits_kept": hits_kept, "hits_discarded": hits_discarded,
            "retrieved": retrieved, "note": note, "error": error, "is_hero": disease.is_hero, **extra}
