"""B3 · Prevalence — parse data/raw/en_product9_prev.xml and emit prevalence records.

Output schema (one dict per <Prevalence> element that maps to a known MONDO id):
  {
    "mondo_id":   str,                   # MONDO:xxxxxxx (resolved via slice xrefs)
    "orpha_code": str,                   # "ORPHA:NNNN"
    "orpha_name": str,                   # disorder label from XML
    "type":       str,                   # PrevalenceType/Name text, e.g. "Point prevalence"
    "class":      str | None,            # PrevalenceClass/Name text, e.g. "1-9 / 1 000 000"
    "valmoy":     float | None,          # Orphanet ValMoy if > 0 (rate per 100 000, or a count for Cases/families), else None
    "unit":       str | None,            # "per 100 000" | "cases" | "families", None without ValMoy
    "qualification": str | None,         # PrevalenceQualification/Name ("Value and class", "Class only", "Case(s)", "Family(ies)")
    "region":     str | None,            # PrevalenceGeographic/Name, e.g. "Europe"
    "validation": str | None,            # PrevalenceValidationStatus/Name, e.g. "Validated"
    "source":     str,                   # source description from XML (Prevalence/Source)
    "db":         "Orphanet",
    "origin":     "Orphanet",
    "record":     str,                   # "ORPHA:NNNN"
    "url":        str,                   # canonical disease page URL
    "retrieved":  str,                   # YYYY-MM-DD, taken from XML date attribute (never invented)
    "snippet":    str,                   # literal substring of the XML serialised <Prevalence> element
    "ambiguous_xref": bool,              # True when multiple MONDO ids map to the same ORPHA code
  }

No edges are emitted. The records are node *attributes*, not graph edges.

Key design constraints
----------------------
- Never invent dates.  `retrieved` is the date= attribute on the root <JDBOR> element
  (the Orphadata download timestamp embedded in the XML itself).  If that attribute is
  absent the function raises FileNotFoundError-equivalent with a clear message.
- Ambiguous xrefs: when load_slice() maps the same ORPHA code to ≥ 2 MONDO ids, the
  record is emitted for EACH candidate with ``ambiguous_xref: True``.  Callers must
  handle ambiguity themselves; we do not arbitrarily pick the first.
- Missing raw file: raises ``FileNotFoundError`` with an actionable message.
- Robustness: empty/missing XML sub-elements are None rather than KeyError crashes.
- Pure parser helpers are exposed at module level so unit tests can import them directly.
- lxml is used for parsing (already a project dependency).
- No network access; no new package dependencies.

Orphanet en_product9_prev.xml structure (abridged):
  <JDBOR date="2026-09-01" ...>
    <DisorderList>
      <Disorder id="...">
        <OrphaCode>166</OrphaCode>
        <Name lang="en">Krabbe disease</Name>
        <PrevalenceList count="...">
          <Prevalence id="...">
            <Source>PMID_15901860</Source>
            <PrevalenceType><Name lang="en">Point prevalence</Name></PrevalenceType>
            <PrevalenceQualification><Name lang="en">Value and class</Name></PrevalenceQualification>
            <PrevalenceClass><Name lang="en">1-9 / 1 000 000</Name></PrevalenceClass>
            <ValMoy>4.0</ValMoy>                  <!-- mean value per million, absent when no numeric mean -->
            <PrevalenceGeographic><Name lang="en">Europe</Name></PrevalenceGeographic>
            <PrevalenceValidationStatus><Name lang="en">Validated</Name></PrevalenceValidationStatus>
          </Prevalence>
        </PrevalenceList>
      </Disorder>
    </DisorderList>
  </JDBOR>
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from lxml import etree

ROOT = Path(__file__).resolve().parents[2]
RAW_FILE = ROOT / "data" / "raw" / "en_product9_prev.xml"

# ---------------------------------------------------------------------------
# Pure parser helpers — importable by unit tests without touching the FS
# ---------------------------------------------------------------------------

# Mapping from PrevalenceClass text to approximate midpoint value per million.
# Ranges are taken from the Orphadata data dictionary (orphadata.com/docs).
# "Unknown", "Not yet documented", absent class → None.
_CLASS_TO_VALUE: dict[str, float | None] = {
    ">1 / 1 000":                   5_000.0,    # > 1 / 1 000  (use 5 000 / million as mid-estimate)
    "6-9 / 10 000":                  750.0,
    "1-5 / 10 000":                  300.0,
    "1-9 / 100 000":                  50.0,
    "1-9 / 1 000 000":                 5.0,
    "<1 / 1 000 000":                  0.5,
    "Unknown":                        None,
    "Not yet documented":             None,
}


def unit_for(prev_type: str | None, qualification: str | None) -> str:
    """Unit of Orphanet's ValMoy: cases or families for "Cases/families", otherwise a rate per 100 000.

    >>> unit_for("Point prevalence", "Value and class")
    'per 100 000'
    >>> unit_for("Cases/families", "Case(s)")
    'cases'
    >>> unit_for("Cases/families", "Family(ies)")
    'families'
    """
    if (prev_type or "").lower().startswith("cases"):
        return "families" if (qualification or "").lower().startswith("famil") else "cases"
    return "per 100 000"


def class_to_value(class_text: str | None) -> float | None:
    """Return approximate midpoint prevalence per million for an Orphanet class string.

    Pure function — no I/O.  Returns None for unknown/missing classes.

    >>> class_to_value("1-9 / 1 000 000")
    5.0
    >>> class_to_value(None) is None
    True
    >>> class_to_value("Unknown") is None
    True
    >>> class_to_value(">1 / 1 000")
    5000.0
    """
    if class_text is None:
        return None
    return _CLASS_TO_VALUE.get(class_text.strip(), None)


def extract_date_from_root(root: etree._Element) -> str:
    """Return the date= attribute of the root element as YYYY-MM-DD.

    This is the Orphadata download/export date embedded in the XML file itself.
    It is the canonical provenance date for ``retrieved``.

    Raises ValueError with a clear message when the attribute is absent or
    malformed, so callers know exactly what went wrong and can fix the source.

    >>> from lxml import etree
    >>> r = etree.fromstring(b'<JDBOR date="2026-09-01T00:00:00"><DisorderList/></JDBOR>')
    >>> extract_date_from_root(r)
    '2026-09-01'
    >>> r2 = etree.fromstring(b'<JDBOR><DisorderList/></JDBOR>')
    >>> extract_date_from_root(r2)
    Traceback (most recent call last):
        ...
    ValueError: en_product9_prev.xml root element has no 'date' attribute ...
    """
    raw_date: str | None = root.get("date")
    if not raw_date:
        raise ValueError(
            "en_product9_prev.xml root element has no 'date' attribute — "
            "cannot determine provenance date for 'retrieved'. "
            "Check the raw file; it may be truncated or corrupt."
        )
    # Accept ISO datetime or date
    match = re.match(r"(\d{4}-\d{2}-\d{2})", raw_date.strip())
    if not match:
        raise ValueError(
            f"en_product9_prev.xml root date attribute {raw_date!r} is not a "
            "recognised date (expected YYYY-MM-DD or ISO datetime). "
            "Cannot determine provenance date for 'retrieved'."
        )
    return match.group(1)


def _text(el: etree._Element | None, *path: str) -> str | None:
    """Walk a chain of child tag names and return .text of the last, or None."""
    node: etree._Element | None = el
    for tag in path:
        if node is None:
            return None
        node = node.find(tag)
    return (node.text or "").strip() or None if node is not None else None


def parse_prevalence_element(prev_el: etree._Element) -> dict[str, Any]:
    """Extract fields from a single <Prevalence> lxml element.

    Pure function — no I/O, no cross-references.  Returns a dict with all
    prevalence-specific fields; caller adds mondo_id, orpha_code, etc.

    Fields returned:
      type, class_, valmoy, unit, qualification, region, validation, source, snippet

    >>> from lxml import etree
    >>> xml = b'''<Prevalence id="123">
    ...   <Source>PMID_15901860</Source>
    ...   <PrevalenceType><Name lang="en">Point prevalence</Name></PrevalenceType>
    ...   <PrevalenceQualification><Name lang="en">Value and class</Name></PrevalenceQualification>
    ...   <PrevalenceClass><Name lang="en">1-9 / 1 000 000</Name></PrevalenceClass>
    ...   <ValMoy>4.0</ValMoy>
    ...   <PrevalenceGeographic><Name lang="en">Europe</Name></PrevalenceGeographic>
    ...   <PrevalenceValidationStatus><Name lang="en">Validated</Name></PrevalenceValidationStatus>
    ... </Prevalence>'''
    >>> result = parse_prevalence_element(etree.fromstring(xml))
    >>> result['type']
    'Point prevalence'
    >>> result['class_']
    '1-9 / 1 000 000'
    >>> result['valmoy'], result['unit'], result['qualification']
    (4.0, 'per 100 000', 'Value and class')
    >>> result['region']
    'Europe'
    >>> result['validation']
    'Validated'
    >>> result['source']
    'PMID_15901860'
    >>> 'Point prevalence' in result['snippet']
    True
    """
    prev_type  = _text(prev_el, "PrevalenceType",         "Name")
    class_text = _text(prev_el, "PrevalenceClass",        "Name")
    region     = _text(prev_el, "PrevalenceGeographic",   "Name")
    validation = _text(prev_el, "PrevalenceValidationStatus", "Name")
    source_raw = _text(prev_el, "Source")

    qualification = _text(prev_el, "PrevalenceQualification", "Name")

    # ValMoy is Orphanet's own mean value: a rate per 100 000 for prevalence/incidence types, a count for
    # "Cases/families". Only a real ValMoy > 0 becomes a value; no midpoint is computed from the class.
    val_moy_text = _text(prev_el, "ValMoy")
    valmoy: float | None = None
    if val_moy_text is not None:
        try:
            parsed = float(val_moy_text)
            if parsed > 0:  # Orphanet uses 0 / -99 as "not available"
                valmoy = parsed
        except ValueError:
            pass
    unit = unit_for(prev_type, qualification) if valmoy is not None else None

    # Snippet = literal substring of the serialised element (cut, never padded, so it stays a substring)
    snippet = etree.tostring(prev_el, encoding="unicode").strip()[:1000]

    return {
        "type":              prev_type,
        "class_":            class_text,
        "valmoy":            valmoy,
        "unit":              unit,
        "qualification":     qualification,
        "region":            region,
        "validation":        validation,
        "source":            source_raw,
        "snippet":           snippet,
    }


def parse_disorder_block(
    disorder_el: etree._Element,
    xref_to_mondos: dict[str, list[str]],
    retrieved: str,
) -> list[dict[str, Any]]:
    """Parse one <Disorder> element and return zero or more output records.

    Returns [] when the ORPHA code is not in any MONDO xref.

    When a single ORPHA code maps to multiple MONDO ids (ambiguous), one record
    is emitted for each with ``ambiguous_xref: True``.

    Pure function — all inputs are provided; no I/O.

    >>> from lxml import etree
    >>> disorder_xml = b'''<Disorder id="1">
    ...   <OrphaCode>166</OrphaCode>
    ...   <Name lang="en">Krabbe disease</Name>
    ...   <PrevalenceList count="1">
    ...     <Prevalence id="1000">
    ...       <Source>PMID_15901860</Source>
    ...       <PrevalenceType><Name lang="en">Point prevalence</Name></PrevalenceType>
    ...       <PrevalenceQualification><Name lang="en">Value and class</Name></PrevalenceQualification>
    ...       <PrevalenceClass><Name lang="en">1-9 / 1 000 000</Name></PrevalenceClass>
    ...       <ValMoy>4.0</ValMoy>
    ...       <PrevalenceGeographic><Name lang="en">Europe</Name></PrevalenceGeographic>
    ...       <PrevalenceValidationStatus><Name lang="en">Validated</Name></PrevalenceValidationStatus>
    ...     </Prevalence>
    ...   </PrevalenceList>
    ... </Disorder>'''
    >>> xrefs = {"Orphanet:166": ["MONDO:0009499"]}
    >>> records = parse_disorder_block(etree.fromstring(disorder_xml), xrefs, "2026-09-01")
    >>> len(records)
    1
    >>> records[0]['mondo_id']
    'MONDO:0009499'
    >>> records[0]['orpha_code']
    'ORPHA:166'
    >>> records[0]['type']
    'Point prevalence'
    >>> records[0]['ambiguous_xref']
    False
    >>> records[0]['retrieved']
    '2026-09-01'
    >>> # Ambiguous case: two MONDO ids for one ORPHA
    >>> xrefs2 = {"Orphanet:166": ["MONDO:0009499", "MONDO:0000001"]}
    >>> records2 = parse_disorder_block(etree.fromstring(disorder_xml), xrefs2, "2026-09-01")
    >>> len(records2)
    2
    >>> all(r['ambiguous_xref'] for r in records2)
    True
    """
    orpha_code_num = _text(disorder_el, "OrphaCode")
    if not orpha_code_num:
        return []

    orpha_key = f"Orphanet:{orpha_code_num}"
    orpha_code = f"ORPHA:{orpha_code_num}"
    orpha_name = _text(disorder_el, "Name") or orpha_code
    url = f"https://www.orpha.net/en/disease/detail/{orpha_code_num}"

    mondo_ids = xref_to_mondos.get(orpha_key, [])
    if not mondo_ids:
        return []

    ambiguous = len(mondo_ids) > 1
    records: list[dict[str, Any]] = []

    for prev_el in disorder_el.iterfind(".//Prevalence"):
        fields = parse_prevalence_element(prev_el)
        for mondo_id in mondo_ids:
            records.append({
                "mondo_id":          mondo_id,
                "orpha_code":        orpha_code,
                "orpha_name":        orpha_name,
                # prevalence-specific fields
                "type":              fields["type"],
                "class":             fields["class_"],
                "valmoy":            fields["valmoy"],
                "unit":              fields["unit"],
                "qualification":     fields["qualification"],
                "region":            fields["region"],
                "validation":        fields["validation"],
                "source":            fields["source"],
                # provenance / evidence fields (schema from 03_build_graph / edges.py)
                "db":                "Orphanet",
                "origin":            "Orphanet",
                "record":            orpha_code,
                "url":               url,
                "retrieved":         retrieved,
                "snippet":           fields["snippet"],
                "ambiguous_xref":    ambiguous,
            })

    return records


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def _build_xref_index(slice_data: dict) -> dict[str, list[str]]:
    """Build Orphanet:NNN -> [MONDO:xxxxxxx, ...] mapping from slice.json.

    A code that appears in multiple diseases' xrefs is flagged as ambiguous by
    having a list of length > 1.  We keep all candidates; callers decide what to
    do with ambiguous entries.

    >>> index = _build_xref_index({
    ...     "mondo": {
    ...         "MONDO:0009499": {"xrefs": ["Orphanet:166", "OMIM:245200"]},
    ...         "MONDO:0000001": {"xrefs": ["Orphanet:999"]},
    ...     },
    ...     "core": [], "disease_genes": {},
    ... })
    >>> index["Orphanet:166"]
    ['MONDO:0009499']
    >>> index["Orphanet:999"]
    ['MONDO:0000001']
    >>> "OMIM:245200" not in index   # only Orphanet xrefs
    True
    """
    result: dict[str, list[str]] = {}
    for mondo_id, node in slice_data["mondo"].items():
        for xref in node.get("xrefs", []):
            if xref.startswith("Orphanet:"):
                result.setdefault(xref, [])
                if mondo_id not in result[xref]:
                    result[xref].append(mondo_id)
    return result


def run(disease_list: list) -> list[dict[str, Any]]:
    """Parse en_product9_prev.xml and return a list of prevalence record dicts.

    Parameters
    ----------
    disease_list:
        List of ``Disease`` objects (from ``pipeline.enrich.diseases``).
        Used to restrict output to diseases in scope (is_core=True members and
        any other IDs present).  Passing an empty list returns records for ALL
        diseases that have an Orphanet xref in slice.json.

    Returns
    -------
    list[dict]
        One dict per matched <Prevalence> element.  See module docstring for
        the full schema.

    Raises
    ------
    FileNotFoundError
        When ``data/raw/en_product9_prev.xml`` does not exist.  The raw file
        must be present before calling this function; network fetching is out
        of scope here.
    ValueError
        When the XML root element lacks a ``date`` attribute (provenance cannot
        be established without it).
    """
    if not RAW_FILE.exists():
        raise FileNotFoundError(
            f"Raw prevalence file not found: {RAW_FILE}\n"
            "The coordinator is responsible for downloading "
            "https://www.orphadata.com/data/xml/en_product9_prev.xml "
            f"to {RAW_FILE} before calling this function. "
            "Do not call run() until the file is present."
        )

    # Import here to avoid circular import; diseases.load_slice is cached.
    # Support both `python pipeline/...` (sys.path has repo root) and
    # `uv run --project pipeline python pipeline/...` (sys.path has pipeline/).
    try:
        from enrich.diseases import load_slice  # type: ignore[import]  # pipeline/ on sys.path
    except ModuleNotFoundError:
        from pipeline.enrich.diseases import load_slice  # type: ignore[import]  # repo root on sys.path

    slice_data = load_slice()
    xref_to_mondos = _build_xref_index(slice_data)

    # Restrict to disease_list scope when a non-empty list is provided.
    # Build a set of MONDO ids in scope.
    if disease_list:
        scope_ids: set[str] | None = {d.mondo_id for d in disease_list}
    else:
        scope_ids = None  # unrestricted

    tree = etree.parse(str(RAW_FILE))
    root = tree.getroot()

    retrieved = extract_date_from_root(root)

    records: list[dict[str, Any]] = []
    for disorder_el in root.iterfind(".//Disorder"):
        block = parse_disorder_block(disorder_el, xref_to_mondos, retrieved)
        for rec in block:
            if scope_ids is None or rec["mondo_id"] in scope_ids:
                records.append(rec)

    return records


# ---------------------------------------------------------------------------
# Schema and limitations documentation
# ---------------------------------------------------------------------------

SCHEMA = {
    "mondo_id":          "str  — MONDO:xxxxxxx resolved via slice.json Orphanet xrefs",
    "orpha_code":        "str  — ORPHA:NNNN",
    "orpha_name":        "str  — Orphanet disorder label",
    "type":              "str | None  — PrevalenceType/Name (e.g. 'Point prevalence', 'Annual incidence')",
    "class":             "str | None  — PrevalenceClass/Name (e.g. '1-9 / 1 000 000')",
    "valmoy":            "float | None  — Orphanet ValMoy if > 0, else None (no midpoint is computed)",
    "unit":              "str | None  — 'per 100 000', or 'cases'/'families' for type Cases/families",
    "qualification":     "str | None  — PrevalenceQualification/Name",
    "region":            "str | None  — PrevalenceGeographic/Name (e.g. 'Europe')",
    "validation":        "str | None  — PrevalenceValidationStatus/Name",
    "source":            "str | None  — raw source text from XML (PMID_xxx, registry name, etc.)",
    "db":                "str  — 'Orphanet' (literal)",
    "origin":            "str  — 'Orphanet' (literal)",
    "record":            "str  — 'ORPHA:NNNN'",
    "url":               "str  — https://www.orpha.net/en/disease/detail/<NNNN>",
    "retrieved":         "str  — YYYY-MM-DD from root date= attribute (XML provenance, never invented)",
    "snippet":           "str  — serialised <Prevalence> XML element (literal substring of source file)",
    "ambiguous_xref":    "bool — True when ≥ 2 MONDO ids share this ORPHA code",
}

LIMITATIONS = """
Limitations
-----------
1. Xref ambiguity: some ORPHA codes map to multiple MONDO ids (e.g. Orphanet splits one
   disease entry after MONDO was minted, or merging has not propagated). Such records are
   emitted once per candidate with ambiguous_xref=True. The caller must decide which
   MONDO id to use; we do NOT arbitrarily pick the first.

2. Values: valmoy is only Orphanet's own ValMoy (> 0). Without it there is no number, only
   the class string; class_to_value() is kept for reference but never used for a value.

3. No region standardisation: region is the raw Orphanet string. "Europe", "Worldwide",
   "United States", country names, etc. are not normalised to ISO codes here.

4. Date provenance: retrieved is the date= attribute from the XML root. This reflects
   when Orphadata exported the file, not when the underlying data changed.

5. No edges: prevalence data is a node attribute, not a graph edge. This module does
   not emit edge records.

6. Out-of-scope ORPHA codes: disorders in en_product9_prev.xml that have no Orphanet
   xref in slice.json are silently skipped (they are outside the project scope).
"""
