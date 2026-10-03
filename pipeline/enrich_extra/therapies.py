"""B2 · Approved therapies from the regulators' own data.

EMA: the official "Download medicine data" table (medicines-output-medicines-report_en.xlsx, human, status Authorised).
FDA: openFDA drug label API (indications_and_usage, NDA/BLA only, generics/ANDA left out) plus the original approval date
     from openFDA Drugs@FDA; biologics regulated by CBER (cell and gene therapies) are not in Drugs@FDA, so their date
     comes from the product page on fda.gov ("<date> Approval Letter - <BRAND>", earliest letter).
Matching: disease label/synonyms as whole words in the indication text (same filter as 04). When several diseases match
the same indication, only the most specific term wins ("Gaucher disease type 1" beats "Gaucher disease").
Snippet = the indication sentence containing the matched term (verbatim). Edge approved_therapy: disease -> DRUG:<name>.
"""
from __future__ import annotations

import base64
import io
import re
from datetime import datetime

from enrich import diseases, http
from enrich.edges import Draft

from .common import OfflineMiss, evidence, fetch_document, fetch_json

EMA_URL = "https://www.ema.europa.eu/en/documents/report/medicines-output-medicines-report_en.xlsx"
FDA_LABEL = "https://api.fda.gov/drug/label.json"
FDA_DRUGSFDA = "https://api.fda.gov/drug/drugsfda.json"
CBER_PAGES = ["https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/{slug}",
              "https://www.fda.gov/vaccines-blood-biologics/{slug}"]
TERMS_PER_QUERY = 8


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.;:])\s+(?=[A-Z0-9•\-])", text) if s.strip()]


def _matches(text: str, disease_list) -> list[tuple[object, str]]:
    """(disease, matched term) for every disease named in text, most specific term only."""
    hits = []
    for disease in disease_list:
        # short abbreviations ("ml 3") collide with dosing text in indications: need >= 6 letters/digits
        match = diseases.match_text({"text": text}, [t for t in disease.match_terms if len(t.replace(" ", "")) >= 6])
        if match:
            hits.append((disease, match[0]))
    return [(d, t) for d, t in hits if not any(t != other and f" {t} " in f" {other} " for _, other in hits)]


HEADING = re.compile(r"^\d*\s*INDICATIONS (?:AND|&) USAGE\s*", re.I)


def _snippet(text: str, term: str) -> str:
    for sentence in _sentences(text):
        sentence = HEADING.sub("", sentence)
        if f" {term} " in diseases.normalize(sentence):
            return sentence[:500]
    return text[:500]


def _title(name: str) -> str:
    return name if not name.isupper() else name.title()


def ema(disease_list, offline: bool) -> tuple[list[dict], dict]:
    import openpyxl
    response = fetch_document("ema", EMA_URL, offline=offline)
    workbook = openpyxl.load_workbook(io.BytesIO(base64.b64decode(response.data["body_base64"])), read_only=True)
    rows = list(workbook.active.iter_rows(values_only=True))
    header_index = next(i for i, r in enumerate(rows) if r and r[0] == "Category")
    header = [str(h).strip() if h else "" for h in rows[header_index]]
    approvals = []
    for raw in rows[header_index + 1:]:
        row = dict(zip(header, raw))
        if row.get("Category") != "Human" or row.get("Medicine status") != "Authorised":
            continue
        indication = re.sub(r"\s+", " ", str(row.get("Therapeutic indication") or "").replace("\xa0", " ")).strip()
        for disease, term in _matches(indication, disease_list):
            date = row.get("Marketing authorisation date")
            approved = datetime.strptime(date, "%d/%m/%Y").date().isoformat() if isinstance(date, str) and date else None
            approvals.append({"mondo_id": disease.mondo_id, "drug": row["Name of medicine"], "authority": "EMA",
                              "approved": approved, "holder": row.get("Marketing authorisation developer / applicant / holder"),
                              "inn": row.get("International non-proprietary name (INN) / common name"),
                              "active_substance": row.get("Active substance"), "orphan": row.get("Orphan medicine") == "Yes",
                              "record": row.get("EMA product number"), "url": row.get("Medicine URL") or EMA_URL,
                              "snippet": _snippet(indication, term), "source_text": indication, "matched_term": term,
                              "retrieved": response.fetched_at, "date_source": "EMA medicine data: Marketing authorisation date"})
    return approvals, {"authority": "EMA", "source": "EMA medicine data (EPAR table)", "retrieved": response.fetched_at[:10], "url": EMA_URL}


def _fda_original_date(application: str, brand: str, offline: bool) -> tuple[str | None, str, str, str | None]:
    """(YYYY-MM-DD, source url, snippet, source text) of the original approval."""
    try:
        response = fetch_json("drugsfda", FDA_DRUGSFDA, params={"search": f'application_number:"{application}"', "limit": 1}, offline=offline)
        for result in (response.data or {}).get("results", []):
            for submission in result.get("submissions", []):
                if submission.get("submission_type") == "ORIG" and submission.get("submission_status") == "AP":
                    raw = submission["submission_status_date"]
                    text = f"{application} ORIG {submission.get('submission_number', '')} AP {raw}"
                    return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}", response.url, text, text
    except (http.FetchError, OfflineMiss):
        pass
    slug = re.sub(r"[^a-z0-9]+", "-", brand.lower()).strip("-")
    for template in CBER_PAGES:
        url = template.format(slug=slug)
        try:
            page = fetch_document("fda_cber", url, offline=offline)
        except (http.FetchError, OfflineMiss):
            continue
        text = re.sub(r"\s+", " ", (page.data or {}).get("text", "")) if page.status == 200 else ""
        letters = []
        for m in re.finditer(r"((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}) "
                             r"(Replacement )?Approval Letter - " + re.escape(brand.upper()), text):
            if not m.group(2):  # a replacement letter re-issues an earlier approval
                letters.append((datetime.strptime(m.group(1), "%B %d, %Y").date(), m.group(0)))
        if letters:
            day, snippet = min(letters)
            return day.isoformat(), url, snippet, text
    return None, "", "", None


def fda(disease_list, offline: bool) -> tuple[list[dict], dict]:
    terms = sorted({t for d in disease_list for t in d.query_terms[:2]})
    labels: dict[str, dict] = {}
    retrieved = None
    for start in range(0, len(terms), TERMS_PER_QUERY):
        chunk = terms[start:start + TERMS_PER_QUERY]
        query = "indications_and_usage:(" + " ".join('"' + t.replace('"', "") + '"' for t in chunk) + ")"
        skip = 0
        while True:
            try:
                response = fetch_json("openfda_label", FDA_LABEL, params={"search": query, "limit": 100, "skip": skip}, offline=offline)
            except (http.FetchError, OfflineMiss):
                break
            data = response.data or {}
            retrieved = retrieved or response.fetched_at
            for label in data.get("results", []):
                application = (label.get("openfda", {}).get("application_number") or [""])[0]
                if not application.startswith(("NDA", "BLA")):
                    continue
                key = application + "|" + (label.get("openfda", {}).get("brand_name") or [""])[0].upper()
                if key not in labels or label.get("effective_time", "") > labels[key].get("effective_time", ""):
                    labels[key] = label
            total = data.get("meta", {}).get("results", {}).get("total", 0)
            skip += 100
            if skip >= total or skip >= 1000:
                break
    approvals = []
    for key in sorted(labels):
        label = labels[key]
        application, brand = key.split("|")
        indication = re.sub(r"\s+", " ", " ".join(label.get("indications_and_usage", []))).strip()
        hits = _matches(indication, disease_list)
        if not hits:
            continue
        approved, date_url, date_snippet, date_text = _fda_original_date(application, brand, offline)
        for disease, term in hits:
            approvals.append({"mondo_id": disease.mondo_id, "drug": _title(brand), "authority": "FDA", "approved": approved,
                              "holder": (label.get("openfda", {}).get("manufacturer_name") or [None])[0],
                              "inn": (label.get("openfda", {}).get("generic_name") or [None])[0], "record": application,
                              "url": f"https://api.fda.gov/drug/label.json?search=set_id:{label.get('set_id')}",
                              "snippet": _snippet(indication, term), "source_text": indication, "matched_term": term,
                              "retrieved": retrieved, "label_effective": label.get("effective_time"),
                              "date_source": date_url, "date_snippet": date_snippet, "date_text": date_text})
    return approvals, {"authority": "FDA", "source": "openFDA drug label + Drugs@FDA / FDA CBER product pages", "retrieved": (retrieved or "")[:10] or None,
                       "url": FDA_LABEL}


def run(disease_list, offline: bool = False) -> dict:
    draft = Draft()
    approvals, protocols = [], []
    for name, function in (("EMA", ema), ("FDA", fda)):
        try:
            found, protocol = function(disease_list, offline)
            approvals += found
            protocols.append(protocol)
        except (http.FetchError, OfflineMiss) as exc:
            protocols.append({"authority": name, "source": name, "retrieved": None, "url": None, "error": str(exc)[:200]})
    approvals.sort(key=lambda a: (a["mondo_id"], a["authority"], a["drug"].lower()))
    for item in approvals:
        node_id = "DRUG:" + item["drug"]
        draft.node(node_id, "drug", item["drug"], authority=item["authority"], approved=item["approved"], holder=item["holder"],
                   url=item["url"], inn=item["inn"], approvals=[])
        node = draft.nodes[node_id]
        entry = {k: item[k] for k in ("authority", "approved", "holder", "url", "record")}
        if entry not in node["approvals"]:
            node["approvals"].append(entry)
        if item["approved"] and (not node["approved"] or item["approved"] < node["approved"]):
            node.update(authority=item["authority"], approved=item["approved"], holder=item["holder"], url=item["url"])
        ev = evidence(item["authority"], item["record"], item["url"], item["snippet"], item["source_text"], item["retrieved"],
                      level="curated", date=item["approved"], confidence=0.95, approved=item["approved"],
                      matched_term=item["matched_term"], date_source=item["date_source"])
        if item.get("date_snippet"):
            ev["date_snippet"] = item["date_snippet"]
        draft.evidence(item["mondo_id"], node_id, "approved_therapy", ev)
    by_disease = {}
    for item in approvals:
        by_disease.setdefault(item["mondo_id"], set()).add(item["drug"])
    searched = [{"mondo_id": d.mondo_id, "section": "therapies", "source": p["source"], "retrieved": p.get("retrieved"),
                 "hits": len({a["drug"] for a in approvals if a["mondo_id"] == d.mondo_id and a["authority"] == p["authority"]}),
                 "error": p.get("error")} for d in disease_list for p in protocols]
    records = [{k: v for k, v in a.items() if k not in ("source_text", "date_text")} for a in approvals]
    return {"records": records, "searched": searched, "draft": draft}
