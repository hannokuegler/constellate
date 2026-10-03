"""B4 · Researcher network (KOL-Overlap).

Loads people from three input sources (all optional — missing files are silently
skipped with a diagnostic entry):

  data/enrich/europepmc.jsonl   – paper records with author lists (from enrich.europepmc)
  data/enrich/reporter.jsonl    – NIH grant records with PI lists (from enrich.reporter)
  data/enrich/extra_ctgov.jsonl – extra ClinicalTrials.gov records with overall officials

For disambiguation it also makes live Europe PMC fetch requests to retrieve the
four "hero" PMIDs (15901860, 23348427, 32912261, 21707604) so that their full
author+affiliation metadata is available.  Requests go to the allowed Europe PMC
REST API only (www.ebi.ac.uk), obeying the 10-second crawl-delay enforced by
common.fetch_json via the http rate-limit machinery.  All fetched records are
cached under data/cache/extra/people/ so a second run requires no network.

Identity rules
--------------
1. ORCID first: if a valid ORCID (checksum-verified) is present, the person_key
   is ``ORCID:<id>``.  Two records with the same valid ORCID are always merged.
2. Without ORCID: identity requires EXACT full name AND EXACT institution (first
   affiliation string after stripping parenthetical notes).  Initials are
   rejected as a full name (must contain at least two distinct name tokens of
   which the first has ≥ 2 characters and the second has ≥ 2 characters).
3. When affiliation is missing the record gets a record-scoped identity key
   (``NOAFF:<source>:<record_id>:<index>``).  No merging with other records.
4. No fuzzy / transliterated merging.  Same name + different institution = two
   separate person nodes.

Public API
----------
person_key(name, orcid, affiliations, *, source_record_key='')
    Pure function.  Returns the canonical string key for a person.

run(disease_list, offline=False) -> dict
    Returns::

        {
          "people":      list[dict],   # one record per unique person_key
          "overlap":     list[dict],   # people (or pairs) active in ≥ 2 diseases
          "edges":       list[dict],   # finalized edge records
          "nodes":       list[dict],   # finalized node records
          "diagnostics": list[dict],   # missing inputs, ambiguous IDs, fetch errors
        }

Edge types:
  authored_by    PMID:<id> -> PERSON:<key>   level curated (metadata)
  investigator_of PERSON:<key> -> <grant/NCT>  level curated (metadata)
  kol_overlap    <MONDO_A> -> <MONDO_B>       level inferred (formula in snippet)
"""
from __future__ import annotations

import hashlib
import itertools
import json
import logging
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Plumbing imports – works whether executed directly or imported as module.
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve()
_PIPELINE = _HERE.parents[1]
if str(_PIPELINE) not in sys.path:
    sys.path.insert(0, str(_PIPELINE))

from enrich.diseases import normalize  # noqa: E402 – after sys.path fixup
from enrich.edges import Draft, edge_id  # noqa: E402
from enrich.http import now_iso  # noqa: E402
from enrich_extra.common import (  # noqa: E402
    OfflineMiss,
    evidence,
    fetch_json,
    finalize,
)

log = logging.getLogger(__name__)

ROOT = _HERE.parents[2]
ENRICH_DIR = ROOT / "data" / "enrich"

# Europe PMC source constant (same as enrich.europepmc)
EUROPEPMC_SOURCE = "europepmc"
EUROPEPMC_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

# Hero PMIDs to retrieve for author verification (spec §B4)
HERO_PMIDS = ["15901860", "23348427", "32912261", "21707604"]


# ---------------------------------------------------------------------------
# ORCID checksum validation  (ISO 7064 MOD 11-2)
# ---------------------------------------------------------------------------

_ORCID_RE = re.compile(r"^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$")


def _orcid_checksum_ok(orcid: str) -> bool:
    """Return True if the ORCID passes the ISO 7064 MOD 11-2 checksum.

    Pure function; no I/O.

    >>> _orcid_checksum_ok("0000-0002-1825-0097")
    True
    >>> _orcid_checksum_ok("0000-0002-1825-0098")
    False
    >>> _orcid_checksum_ok("0000-0001-5109-3700")
    True
    """
    digits = orcid.replace("-", "")
    if len(digits) != 16:
        return False
    total = 0
    for ch in digits[:-1]:
        total = (total + int(ch)) * 2
    check = digits[-1]
    remainder = (12 - (total % 11)) % 11
    if remainder == 10:
        return check == "X"
    return check == str(remainder)


def validate_orcid(raw: str | None) -> str | None:
    """Return cleaned ORCID if syntactically valid and checksum passes, else None.

    Pure function; no I/O.

    >>> validate_orcid("0000-0002-1825-0097")
    '0000-0002-1825-0097'
    >>> validate_orcid("https://orcid.org/0000-0002-1825-0097")
    '0000-0002-1825-0097'
    >>> validate_orcid(None) is None
    True
    >>> validate_orcid("0000-0002-1825-0098") is None  # bad checksum
    True
    """
    if not raw:
        return None
    # Strip URL prefix
    cleaned = re.sub(r"^https?://orcid\.org/", "", raw.strip())
    if not _ORCID_RE.match(cleaned):
        return None
    return cleaned if _orcid_checksum_ok(cleaned) else None


# ---------------------------------------------------------------------------
# Name validation – reject initials as a full name
# ---------------------------------------------------------------------------

def _is_full_name(name: str | None) -> bool:
    """Return True only when name looks like a genuine full name (not initials).

    Rules:
    - Must be non-empty and contain at least one space.
    - The first token must have ≥ 2 characters (not a bare initial like "J.").
    - The last token (surname) must have ≥ 2 characters.
    - A token that is a single letter with an optional period is an initial.
      If all tokens except the last are initials, reject.

    Pure function; no I/O.

    >>> _is_full_name("Maria Escolar")
    True
    >>> _is_full_name("J Smith")  # "J" is an initial
    False
    >>> _is_full_name("J. Smith")  # "J." is an initial
    False
    >>> _is_full_name("Maria E. Escolar")  # middle initial ok, given name ok
    True
    >>> _is_full_name("M. E. Escolar")  # all non-surname tokens are initials
    False
    >>> _is_full_name("Escolar")  # single token – no space
    False
    >>> _is_full_name(None)
    False
    >>> _is_full_name("")
    False
    """
    if not name:
        return False
    tokens = name.split()
    if len(tokens) < 2:
        return False
    # Check surname (last token)
    if len(tokens[-1]) < 2:
        return False
    # Check that at least one non-surname token is a real name part (≥ 2 chars
    # and not just a letter + optional period)
    prefix_tokens = tokens[:-1]

    def _is_initial(tok: str) -> bool:
        return bool(re.fullmatch(r"[A-Za-z]\.?", tok))

    non_initial = [t for t in prefix_tokens if not _is_initial(t)]
    return bool(non_initial)


# ---------------------------------------------------------------------------
# Affiliation normalisation  (strip parenthetical asides, leading noise)
# ---------------------------------------------------------------------------

_PAREN_RE = re.compile(r"\([^)]*\)")
_LEADING_NOISE_RE = re.compile(r"^[0-9\s,;:*†‡§¶#]+")


def _clean_affiliation(raw: str | None) -> str | None:
    """Return a normalised affiliation string or None if empty after cleaning.

    Pure function; no I/O.

    >>> _clean_affiliation("Department of Neurology, University Hospital Cologne (UHC), Cologne, Germany.")
    'Department of Neurology, University Hospital Cologne , Cologne, Germany.'
    >>> _clean_affiliation("   ") is None
    True
    >>> _clean_affiliation(None) is None
    True
    """
    if not raw:
        return None
    # Remove parenthetical remarks
    s = _PAREN_RE.sub("", raw)
    # Strip leading numeric/punctuation noise (affiliation indices in concatenated strings)
    s = _LEADING_NOISE_RE.sub("", s)
    s = " ".join(s.split())
    return s or None


# ---------------------------------------------------------------------------
# person_key – the canonical identity function (pure, testable)
# ---------------------------------------------------------------------------

def person_key(
    name: str | None,
    orcid: str | None,
    affiliations: list[str] | None,
    *,
    source_record_key: str = "",
) -> str:
    """Return the canonical string key for a person.

    Priority:
    1. ``ORCID:<validated_orcid>`` when a checksum-valid ORCID is supplied.
    2. ``NAFF:<sha1(norm_name + "||" + norm_affiliation)[:16]>`` when both a
       full name (passing _is_full_name) and at least one affiliation are present.
    3. ``NOAFF:<sha1(source_record_key)[:16]>`` – record-scoped identity used
       when affiliation is absent or name fails validation.  source_record_key
       must be unique per author slot to avoid merging distinct unknown persons.

    Pure function; no I/O.

    >>> person_key("Maria Escolar", "0000-0002-1825-0097", None)
    'ORCID:0000-0002-1825-0097'
    >>> person_key("Maria Escolar", None, ["UPMC Children's Hospital of Pittsburgh"])
    'NAFF:...'
    >>> person_key("J Smith", None, ["Some Uni"])  # initial name → NOAFF
    'NOAFF:...'
    >>> person_key(None, None, None, source_record_key="PMID:123:0")
    'NOAFF:...'
    """
    validated = validate_orcid(orcid)
    if validated:
        return f"ORCID:{validated}"

    affs = [_clean_affiliation(a) for a in (affiliations or [])]
    affs = [a for a in affs if a]

    if _is_full_name(name) and affs:
        # Use first affiliation for identity (most stable)
        norm_name = " ".join(name.strip().split()).lower()
        norm_aff = affs[0].lower()
        digest = hashlib.sha1(f"{norm_name}||{norm_aff}".encode()).hexdigest()[:16]
        return f"NAFF:{digest}"

    # Record-scoped fallback
    digest = hashlib.sha1((source_record_key or "unknown").encode()).hexdigest()[:16]
    return f"NOAFF:{digest}"


# ---------------------------------------------------------------------------
# JSONL helpers
# ---------------------------------------------------------------------------

def _load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    records = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                log.warning("Skipping malformed JSONL line in %s: %s", path.name, exc)
    return records


def _day(value: str | None, fallback: str) -> str:
    """Normalise a date string to YYYY-MM-DD, padding or truncating as needed."""
    value = (value or "")[:10]
    if len(value) == 10:
        return value
    if len(value) == 7:
        return f"{value}-01"
    return fallback[:10]


# ---------------------------------------------------------------------------
# Europe PMC lookup for hero PMIDs
# ---------------------------------------------------------------------------

from enrich.europepmc import normalize_paper  # noqa: E402


def _fetch_pmid(pmid: str, offline: bool) -> dict | None:
    """Fetch a single PMID from Europe PMC and return a normalized paper dict.

    Uses fetch_json from common (which caches under data/cache/extra/people/).
    Returns None on fetch failure.
    """
    params = {
        "query": f"EXT_ID:{pmid} AND SRC:MED",
        "format": "json",
        "resultType": "core",
        "pageSize": "1",
    }
    try:
        resp = fetch_json("people", EUROPEPMC_URL, params=params, offline=offline)
    except OfflineMiss:
        log.warning("PMID %s not in cache and offline=True – skipping", pmid)
        return None
    except Exception as exc:  # noqa: BLE001
        log.warning("Failed to fetch PMID %s from Europe PMC: %s", pmid, exc)
        return None

    data = resp.data or {}
    results = data.get("resultList", {}).get("result", [])
    if not results:
        log.warning("Europe PMC returned no result for PMID %s", pmid)
        return None
    return normalize_paper(results[0], resp.fetched_at)


# ---------------------------------------------------------------------------
# Extract people from europepmc records
# ---------------------------------------------------------------------------

def _people_from_papers(
    papers: list[dict],
    extra_papers: dict[str, dict],
    disease_list: list,
) -> tuple[dict[str, dict], list[dict]]:
    """Build person records from paper author lists.

    Returns (persons dict keyed by person_key, diagnostics list).
    """
    persons: dict[str, dict] = {}
    diagnostics: list[dict] = []

    # Merge hero papers into the base set (without overwriting existing records)
    merged_papers: dict[str, dict] = {p["pmid"]: p for p in papers}
    for pmid, paper in extra_papers.items():
        merged_papers.setdefault(pmid, paper)

    for paper in merged_papers.values():
        pmid = paper["pmid"]
        retrieved = paper.get("retrieved", now_iso())
        pub_date = _day(paper.get("pub_date"), retrieved)
        paper_url = paper.get("pubmed_url") or f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        authors = paper.get("authors") or []

        # Collect disease associations for this paper
        paper_diseases = {d["mondo_id"] for d in (paper.get("diseases") or [])}

        for idx, author in enumerate(authors):
            name = author.get("name")
            orcid_raw = author.get("orcid")
            affs = author.get("affiliations") or []
            record_key = f"PMID:{pmid}:{idx}"

            key = person_key(name, orcid_raw, affs, source_record_key=record_key)

            validated_orcid = validate_orcid(orcid_raw)
            clean_affs = [a for a in (_clean_affiliation(a) for a in affs) if a]

            # Track diagnostics for ambiguous/missing identifiers
            if key.startswith("NOAFF:"):
                reason = "missing_affiliation"
                if name and not _is_full_name(name):
                    reason = "initials_rejected"
                diagnostics.append({
                    "type": "ambiguous_identity",
                    "reason": reason,
                    "source": "europepmc",
                    "record": f"PMID:{pmid}",
                    "author_index": idx,
                    "name": name,
                    "orcid_raw": orcid_raw,
                    "orcid_valid": validated_orcid,
                    "person_key": key,
                })

            # Build or update the person record
            person = persons.setdefault(key, {
                "person_key": key,
                "name": name,
                "orcid": validated_orcid,
                "affiliations": clean_affs,
                "diseases": set(),
                "papers": [],
                "grants": [],
                "trials": [],
                "sources": set(),
            })
            # Keep the most complete name (longest)
            if name and (not person["name"] or len(name) > len(person["name"])):
                person["name"] = name
            # Merge affiliations (unique)
            for a in clean_affs:
                if a not in person["affiliations"]:
                    person["affiliations"].append(a)
            person["diseases"].update(paper_diseases)
            person["sources"].add("europepmc")
            paper_ref = {
                "pmid": pmid,
                "author_index": idx,
                "url": paper_url,
                "retrieved": retrieved[:10],
                "pub_date": pub_date,
                "title": paper.get("title"),
                "diseases": sorted(paper_diseases),
            }
            if not any(p["pmid"] == pmid for p in person["papers"]):
                person["papers"].append(paper_ref)

    return persons, diagnostics


# ---------------------------------------------------------------------------
# Extract people from reporter records
# ---------------------------------------------------------------------------

def _people_from_grants(
    grants: list[dict],
    persons: dict[str, dict],
    diagnostics: list[dict],
) -> None:
    """Augment persons dict in-place with PI data from reporter grants."""
    for grant in grants:
        core = grant.get("core_project_num") or grant.get("project_num") or ""
        grant_url = grant.get("url") or f"https://reporter.nih.gov/project-details/{core}"
        retrieved = grant.get("retrieved", now_iso())
        grant_diseases = {d["mondo_id"] for d in (grant.get("diseases") or [])}

        for idx, pi in enumerate(grant.get("pis") or []):
            name = (pi.get("name") or "").strip() or None
            # Reporter does not supply ORCID or affiliations for PIs
            # Use organization as affiliation proxy
            org = grant.get("organization")
            affs = [org] if org else []
            record_key = f"GRANT:{core}:{idx}"

            key = person_key(name, None, affs, source_record_key=record_key)

            if key.startswith("NOAFF:"):
                reason = "missing_affiliation" if not affs else "initials_rejected"
                diagnostics.append({
                    "type": "ambiguous_identity",
                    "reason": reason,
                    "source": "reporter",
                    "record": core,
                    "pi_index": idx,
                    "name": name,
                    "person_key": key,
                })

            person = persons.setdefault(key, {
                "person_key": key,
                "name": name,
                "orcid": None,
                "affiliations": [org] if org else [],
                "diseases": set(),
                "papers": [],
                "grants": [],
                "trials": [],
                "sources": set(),
            })
            if name and (not person["name"] or len(name) > len(person["name"])):
                person["name"] = name
            if org and org not in person["affiliations"]:
                person["affiliations"].append(org)
            person["diseases"].update(grant_diseases)
            person["sources"].add("reporter")
            grant_ref = {
                "core_project_num": core,
                "pi_index": idx,
                "url": grant_url,
                "retrieved": retrieved[:10],
                "diseases": sorted(grant_diseases),
                "organization": org,
            }
            if not any(g["core_project_num"] == core for g in person["grants"]):
                person["grants"].append(grant_ref)


# ---------------------------------------------------------------------------
# Extract people from extra_ctgov records (Overall Officials)
# ---------------------------------------------------------------------------

def _people_from_ctgov(
    ctgov_records: list[dict],
    persons: dict[str, dict],
    diagnostics: list[dict],
) -> None:
    """Augment persons dict in-place with Overall Officials from ClinicalTrials records."""
    for trial in ctgov_records:
        nct = trial.get("nct_id") or ""
        trial_url = trial.get("url") or f"https://clinicaltrials.gov/study/{nct}"
        retrieved = trial.get("retrieved", now_iso())
        trial_diseases = {d["mondo_id"] for d in (trial.get("diseases") or [])}

        # Support both "officials" and "contacts_locations" formats
        officials = trial.get("officials") or trial.get("overall_officials") or []
        for idx, off in enumerate(officials):
            name = (off.get("name") or off.get("official_name") or "").strip() or None
            affiliation = off.get("affiliation") or off.get("official_affiliation")
            affs = [affiliation] if affiliation else []
            record_key = f"NCT:{nct}:{idx}"

            key = person_key(name, None, affs, source_record_key=record_key)

            if key.startswith("NOAFF:"):
                reason = "missing_affiliation" if not affs else "initials_rejected"
                diagnostics.append({
                    "type": "ambiguous_identity",
                    "reason": reason,
                    "source": "ctgov",
                    "record": nct,
                    "official_index": idx,
                    "name": name,
                    "person_key": key,
                })

            clean_affs = [a for a in (_clean_affiliation(a) for a in affs) if a]
            person = persons.setdefault(key, {
                "person_key": key,
                "name": name,
                "orcid": None,
                "affiliations": clean_affs,
                "diseases": set(),
                "papers": [],
                "grants": [],
                "trials": [],
                "sources": set(),
            })
            if name and (not person["name"] or len(name) > len(person["name"])):
                person["name"] = name
            for a in clean_affs:
                if a not in person["affiliations"]:
                    person["affiliations"].append(a)
            person["diseases"].update(trial_diseases)
            person["sources"].add("ctgov")
            trial_ref = {
                "nct_id": nct,
                "official_index": idx,
                "url": trial_url,
                "retrieved": retrieved[:10],
                "diseases": sorted(trial_diseases),
                "affiliation": affiliation,
            }
            if not any(t["nct_id"] == nct for t in person["trials"]):
                person["trials"].append(trial_ref)


# ---------------------------------------------------------------------------
# Serialise persons – sets -> sorted lists
# ---------------------------------------------------------------------------

def _serialise_person(p: dict) -> dict:
    """Return a JSON-serialisable copy with sets converted to sorted lists."""
    return {
        "person_key": p["person_key"],
        "name": p["name"],
        "orcid": p["orcid"],
        "affiliations": p["affiliations"],
        "diseases": sorted(p["diseases"]),
        "papers": p["papers"],
        "grants": p["grants"],
        "trials": p["trials"],
        "sources": sorted(p["sources"]),
    }


# ---------------------------------------------------------------------------
# Build edges
# ---------------------------------------------------------------------------

def _build_edges(persons: dict[str, dict], draft: Draft) -> None:
    """Populate the Draft with authored_by and investigator_of edges."""
    retrieved = now_iso()[:10]

    for key, person in persons.items():
        person_node_id = f"PERSON:{key}"
        person_label = person["name"] or key
        orcid = person.get("orcid")
        draft.node(
            person_node_id,
            "person",
            person_label,
            orcid=orcid,
            affiliations=person["affiliations"],
            diseases=sorted(person["diseases"]),
            sources=sorted(person["sources"]),
        )

        # authored_by: PMID:<id> -> PERSON:<key>
        for paper_ref in person["papers"]:
            pmid = paper_ref["pmid"]
            pmid_node = f"PMID:{pmid}"
            # Ensure the paper node exists (may already be there from other paper edges)
            draft.node(pmid_node, "paper", paper_ref.get("title") or pmid_node,
                       year=None, journal=None, cited_by=None, authors=[])
            source_text = (
                f"Author '{person_label}'"
                + (f" (ORCID {orcid})" if orcid else "")
                + f" of PMID:{pmid}"
                + (f" ({paper_ref.get('title', '')})" if paper_ref.get("title") else "")
            )
            snippet = source_text[:280]
            ev = evidence(
                db="Europe PMC",
                record=pmid_node,
                url=paper_ref["url"],
                snippet=snippet,
                source_text=source_text,
                retrieved=paper_ref["retrieved"],
                date=paper_ref["pub_date"],
                level="curated",
                confidence=0.9,
                origin="Europe PMC",
            )
            draft.evidence(pmid_node, person_node_id, "authored_by", ev)

        # investigator_of: PERSON:<key> -> grant core number
        for grant_ref in person["grants"]:
            core = grant_ref["core_project_num"]
            org = grant_ref.get("organization") or ""
            source_text = (
                f"PI '{person_label}'"
                + (f" at {org}" if org else "")
                + f" for NIH grant {core}"
            )
            snippet = source_text[:280]
            ev = evidence(
                db="NIH RePORTER",
                record=core,
                url=grant_ref["url"],
                snippet=snippet,
                source_text=source_text,
                retrieved=grant_ref["retrieved"],
                level="curated",
                confidence=0.85,
                origin="NIH RePORTER",
            )
            draft.evidence(person_node_id, core, "investigator_of", ev)
            # Ensure grant node exists
            draft.node(core, "grant", core, pis=[], organization=org)

        # investigator_of: PERSON:<key> -> NCT
        for trial_ref in person["trials"]:
            nct = trial_ref["nct_id"]
            aff = trial_ref.get("affiliation") or ""
            source_text = (
                f"Overall Official '{person_label}'"
                + (f" ({aff})" if aff else "")
                + f" for trial {nct}"
            )
            snippet = source_text[:280]
            ev = evidence(
                db="ClinicalTrials.gov",
                record=nct,
                url=trial_ref["url"],
                snippet=snippet,
                source_text=source_text,
                retrieved=trial_ref["retrieved"],
                level="curated",
                confidence=0.85,
                origin="ClinicalTrials.gov",
            )
            draft.evidence(person_node_id, nct, "investigator_of", ev)
            draft.node(nct, "trial", nct, phases=[], status=None, sponsor=None,
                       interventions=[], conditions=[])


# ---------------------------------------------------------------------------
# KOL-overlap edges
# ---------------------------------------------------------------------------

def _build_kol_overlap(
    persons: dict[str, dict],
    draft: Draft,
    disease_list: list,
) -> list[dict]:
    """Build kol_overlap inferred edges and return the overlap records.

    An overlap is a pair of disease MONDO ids that share ≥ 1 person who has
    at least one evidence record (paper/grant/trial) for each disease.

    The snippet is the inferred formula (per spec level='inferred'):
      «N person(s) active in both <A> and <B>: [person names]; records: [IDs]»

    Returns a list of overlap dicts (one per qualifying person or pair).
    """
    retrieved = now_iso()[:10]

    # Build disease-label lookup from disease_list
    disease_label: dict[str, str] = {}
    for d in (disease_list or []):
        disease_label[d.mondo_id] = d.label

    # Build set of diseases per person
    person_to_diseases: dict[str, set[str]] = {}
    for key, person in persons.items():
        ds = person["diseases"]
        if ds:
            person_to_diseases[key] = ds

    # Build pair -> list of (person_key, person_name, record_ids)
    pair_persons: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for key, diseases in person_to_diseases.items():
        if len(diseases) < 2:
            continue
        person = persons[key]
        # Collect all record IDs for this person
        record_ids: list[str] = (
            [f"PMID:{p['pmid']}" for p in person["papers"]]
            + [g["core_project_num"] for g in person["grants"]]
            + [t["nct_id"] for t in person["trials"]]
        )
        sorted_diseases = sorted(diseases)
        for d_a, d_b in itertools.combinations(sorted_diseases, 2):
            pair = (d_a, d_b)
            # Only include if person has evidence in BOTH diseases
            diseases_a = {d["mondo_id"] for d in person["papers"] for d in d.get("diseases", [])} \
                       | {d["mondo_id"] for d in person["papers"] for d2 in [d.get("diseases", [])] for d in d2} \
                       | person["diseases"]
            # Simplified: person["diseases"] already reflects both; record IDs
            # include records for all diseases the person is linked to.
            # Since we got d_a and d_b from person["diseases"], both are confirmed.
            pair_persons[pair].append({
                "person_key": key,
                "name": person["name"],
                "record_ids": record_ids,
            })

    overlap_records: list[dict] = []
    for (d_a, d_b), p_list in sorted(pair_persons.items()):
        n = len(p_list)
        names = [p["name"] or p["person_key"] for p in p_list]
        all_record_ids = sorted({rid for p in p_list for rid in p["record_ids"]})
        person_ids = [p["person_key"] for p in p_list]

        label_a = disease_label.get(d_a, d_a)
        label_b = disease_label.get(d_b, d_b)

        # Formula per spec (inferred level)
        formula = (
            f"{n} person(s) active in both '{label_a}' ({d_a}) and '{label_b}' ({d_b}): "
            f"[{', '.join(names[:10])}{'...' if len(names) > 10 else ''}]; "
            f"person IDs: [{', '.join(person_ids[:10])}{'...' if len(person_ids) > 10 else ''}]; "
            f"record IDs: [{', '.join(all_record_ids[:10])}{'...' if len(all_record_ids) > 10 else ''}]"
        )
        snippet = formula[:600]

        ev = evidence(
            db="constellate-people",
            record=f"{d_a}|{d_b}",
            url=f"https://europepmc.org/search?query={d_a}+AND+{d_b}",
            snippet=snippet,
            source_text=formula,
            retrieved=retrieved,
            level="inferred",
            confidence=min(0.3 + 0.1 * n, 0.7),
            origin="constellate-people",
            inferred_formula=formula,
            person_ids=person_ids,
            record_ids=all_record_ids,
        )
        # Edges are undirected conceptually; use sorted pair for canonical direction
        draft.evidence(d_a, d_b, "kol_overlap", ev)
        # Ensure disease nodes exist (minimal stubs if not already present)
        draft.node(d_a, "disease", label_a)
        draft.node(d_b, "disease", label_b)

        overlap_records.append({
            "disease_a": d_a,
            "disease_b": d_b,
            "label_a": label_a,
            "label_b": label_b,
            "n_persons": n,
            "persons": p_list,
            "record_ids": all_record_ids,
            "snippet": snippet,
        })

    return overlap_records


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run(disease_list: list, offline: bool = False) -> dict:
    """B4 · Researcher network.

    Parameters
    ----------
    disease_list:
        List of ``enrich.diseases.Disease`` objects in scope.
    offline:
        When True, only use cached responses; raise OfflineMiss if a hero PMID
        is not cached.  Second runs are fully offline when cache is warm.

    Returns
    -------
    dict with keys:
        people      – list of serialised person dicts
        overlap     – list of overlap dicts (disease pairs with ≥ 1 shared person)
        edges       – finalised edge list
        nodes       – finalised node list
        diagnostics – list of diagnostic dicts (missing inputs, ambiguous IDs, etc.)
    """
    diagnostics: list[dict] = []
    retrieved = now_iso()[:10]

    # ---- 1. Load existing JSONL files -----------------------------------
    papers_raw = _load_jsonl(ENRICH_DIR / "europepmc.jsonl")
    if not papers_raw:
        diagnostics.append({
            "type": "missing_input",
            "file": str(ENRICH_DIR / "europepmc.jsonl"),
            "note": "europepmc.jsonl not found or empty; no paper-author edges will be built",
        })

    grants_raw = _load_jsonl(ENRICH_DIR / "reporter.jsonl")
    if not grants_raw:
        diagnostics.append({
            "type": "missing_input",
            "file": str(ENRICH_DIR / "reporter.jsonl"),
            "note": "reporter.jsonl not found or empty; no investigator_of edges from grants",
        })

    ctgov_raw = _load_jsonl(ENRICH_DIR / "extra_ctgov.jsonl")
    if not ctgov_raw:
        diagnostics.append({
            "type": "missing_input",
            "file": str(ENRICH_DIR / "extra_ctgov.jsonl"),
            "note": "extra_ctgov.jsonl not found or empty; no investigator_of edges from ClinicalTrials officials",
        })

    # ---- 2. Fetch hero PMIDs from Europe PMC ----------------------------
    # These are fetched individually to get full author+affiliation metadata.
    # Already-cached PMIDs in europepmc.jsonl are supplemented, not replaced.
    existing_pmids = {p["pmid"] for p in papers_raw}
    extra_papers: dict[str, dict] = {}

    for pmid in HERO_PMIDS:
        if pmid in existing_pmids:
            # Already in the main cache; don't double-fetch
            log.debug("Hero PMID %s already in europepmc.jsonl – skipping live fetch", pmid)
            continue
        log.info("Fetching hero PMID %s from Europe PMC …", pmid)
        paper = _fetch_pmid(pmid, offline)
        if paper is None:
            diagnostics.append({
                "type": "fetch_failure",
                "source": "europepmc",
                "pmid": pmid,
                "note": (
                    f"Could not retrieve PMID {pmid} from Europe PMC. "
                    "Hero bridge (Escolar/Kurtzberg/Krägeloh-Mann) may be incomplete."
                ),
            })
        else:
            # Hero papers are not disease-attributed from a search; mark diseases=[]
            # (they were retrieved for author verification, not disease association)
            paper.setdefault("diseases", [])
            extra_papers[pmid] = paper

    # ---- 3. Build persons -----------------------------------------------
    persons, person_diagnostics = _people_from_papers(papers_raw, extra_papers, disease_list)
    diagnostics.extend(person_diagnostics)

    _people_from_grants(grants_raw, persons, diagnostics)
    _people_from_ctgov(ctgov_raw, persons, diagnostics)

    # ---- 4. Report on expected hero bridges -----------------------------
    # Spec says: if Escolar, Kurtzberg, Krägeloh-Mann don't connect Krabbe+MLD,
    # we must report the reason (ORCID/affiliation incomplete).
    hero_names = ["escolar", "kurtzberg", "krageloh", "krageloh-mann", "krägeloh"]
    found_hero: dict[str, str] = {}  # normalised_name -> person_key

    for key, person in persons.items():
        name_lower = normalize(person["name"] or "").strip()
        for hero in hero_names:
            hero_norm = normalize(hero).strip()
            if hero_norm in name_lower and hero not in found_hero:
                found_hero[hero] = key

    krabbe_ids = {
        d.mondo_id for d in (disease_list or [])
        if "krabbe" in normalize(d.label).lower() or "globoid" in normalize(d.label).lower()
    }
    mld_ids = {
        d.mondo_id for d in (disease_list or [])
        if "metachromatic" in normalize(d.label).lower() or "mld" in normalize(d.label).lower()
    }

    for hero_name_key in ["escolar", "kurtzberg", "krageloh", "krageloh-mann", "krägeloh"]:
        p_key = found_hero.get(hero_name_key)
        if p_key is None:
            diagnostics.append({
                "type": "missing_hero_bridge",
                "name_hint": hero_name_key,
                "reason": (
                    f"No person matching '{hero_name_key}' found in any input source. "
                    "This is expected when europepmc.jsonl/reporter.jsonl are absent or "
                    "when the relevant papers are not in scope. "
                    "The bridge cannot be reported without ORCID or full name+affiliation."
                ),
            })
        else:
            person = persons[p_key]
            p_diseases = person["diseases"]
            has_krabbe = bool(p_diseases & krabbe_ids) if krabbe_ids else False
            has_mld = bool(p_diseases & mld_ids) if mld_ids else False
            if not (has_krabbe and has_mld):
                # Found the person but bridge is incomplete
                missing = []
                if not has_krabbe:
                    missing.append("Krabbe")
                if not has_mld:
                    missing.append("MLD")
                diagnostics.append({
                    "type": "incomplete_hero_bridge",
                    "name_hint": hero_name_key,
                    "person_key": p_key,
                    "missing_disease_connection": missing,
                    "reason": (
                        f"Person '{person['name']}' ({p_key}) was found but is not linked to "
                        f"{' or '.join(missing)} in the current data. "
                        "This is expected when the search scope or JSONL inputs do not include "
                        "the relevant papers/grants, or when ORCID/affiliation metadata is "
                        "insufficient to merge records across sources. Bridge reported as missing."
                    ),
                })

    # ---- 5. Build edges in a Draft --------------------------------------
    draft = Draft()
    _build_edges(persons, draft)
    overlap_records = _build_kol_overlap(persons, draft, disease_list)

    # ---- 6. Finalise ----------------------------------------------------
    graph = finalize(draft)

    # ---- 7. Serialise ---------------------------------------------------
    serialised_persons = [_serialise_person(p) for p in persons.values()]
    # Sort deterministically by person_key
    serialised_persons.sort(key=lambda p: p["person_key"])

    return {
        "people": serialised_persons,
        "overlap": overlap_records,
        "edges": graph["edges"],
        "nodes": graph["nodes"],
        "diagnostics": diagnostics,
    }
