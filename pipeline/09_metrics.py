"""09_metrics — quality numbers for the jury: writes meta.metrics into app/public/data/meta.json (nothing else changes).

Schema (app/README.md, "meta.metrics"; /methods shows "pending" for every null entry):
  extract_precision   {value, n, source}  hand review of LLM-extracted claims (05)
                      data/curated/extract_review.csv  pmid,claim_id,correct,reviewer   (correct = yes | no, other values
                      are not counted; a claim reviewed twice counts once and is correct only if every review says yes).
                      Fallback: data/curated/extract_check.csv from extract_sample.py (check = ok | wrong: ...).
                      Neither filled in: data/curated/extract_model_review.csv (verdict = ok | wrong, an independent model
                      judged every accepted claim), then with kind "model_review" and a source that says so. Else null.
  reconcile_accuracy  {value, n, source}  06 org-name -> MONDO matches of verified orgs (data/reconcile/org_disease_edges.json)
                      that agree with the ORPHA ids Osman entered by hand in data/curated/orgs.csv (match is correct when the
                      matched disease carries one of the org's ORPHA ids as Orphanet xref in the export). No reconcile output,
                      no verified org with orpha_ids or no judged match -> null.
  monarch_spearman    {value, n, source, p, label, secondary}  from data/enrich/extra_metrics.json (04b, B5): main value =
                      HPO-profile variant (measures the same thing as simGIC), secondary = disease-disease variant (MONDO
                      classes). Missing -> null.
  coverage            {trial, paper, asset, org, denominator}  core diseases (index.json in_core) with >= 1 trial / paper
                      mention / has_asset / patient org in their export shard; a count is null when no shard carries that
                      field at all (not delivered). denominator = number of core diseases (350).
  hero_regression     {pass, checked_at, checks, failed}  hero checks of pipeline/validate.py (incl. the data-v2 ones that
                      are active), run on the export.
Deterministic (sorted inputs; checked_at = SOURCE_DATE_EPOCH date if set, else today).
Override folders (tests): CONSTELLATE_OUT_DIR, CONSTELLATE_EXTRA_DIR, CONSTELLATE_CURATED_DIR, CONSTELLATE_RECONCILE_DIR.
"""
from __future__ import annotations

import contextlib
import csv
import datetime as dt
import io
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import validate  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("CONSTELLATE_OUT_DIR") or ROOT / "app" / "public" / "data")
EXTRA_DIR = Path(os.environ.get("CONSTELLATE_EXTRA_DIR") or ROOT / "data" / "enrich")
CURATED = Path(os.environ.get("CONSTELLATE_CURATED_DIR") or ROOT / "data" / "curated")
RECONCILE_DIR = Path(os.environ.get("CONSTELLATE_RECONCILE_DIR") or ROOT / "data" / "reconcile")
REVIEW_COLUMNS = ["pmid", "claim_id", "correct", "reviewer"]


def today() -> str:
    epoch = os.environ.get("SOURCE_DATE_EPOCH")
    return (dt.datetime.fromtimestamp(int(epoch), dt.timezone.utc).date() if epoch else dt.date.today()).isoformat()


def read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        return [{(k or "").strip(): (v or "").strip() for k, v in row.items()} for row in csv.DictReader(fh)]


def extract_precision(curated: Path) -> dict | None:
    review, check = curated / "extract_review.csv", curated / "extract_check.csv"
    verdicts: dict[str, list[bool]] = defaultdict(list)
    if review.exists():
        rows, name = read_csv(review), review.name
        for row in rows:
            verdict = row.get("correct", "").lower()
            if verdict in ("yes", "no") and (row.get("claim_id") or row.get("pmid")):
                verdicts[f"{row.get('pmid', '')}|{row.get('claim_id', '')}"].append(verdict == "yes")
        reviewers = sorted({row.get("reviewer") for row in rows if row.get("reviewer")})
    elif check.exists():
        rows, name, reviewers = read_csv(check), check.name, []
        for row in rows:
            verdict = row.get("check", "").lower()
            if verdict == "ok" or verdict.startswith("wrong"):
                verdicts[f"{row.get('pmid', '')}|{row.get('claim', '')}"].append(verdict == "ok")
    else:
        return extract_precision_model(curated)
    if not verdicts:
        return extract_precision_model(curated)  # hand sample not filled in yet
    correct = sum(all(v) for v in verdicts.values())
    by = f", {len(reviewers)} reviewer{'s' if len(reviewers) != 1 else ''}" if reviewers else ""
    return {"value": round(correct / len(verdicts), 3), "n": len(verdicts),
            "source": f"hand review of {len(verdicts)} extracted claims against the abstract (data/curated/{name}{by})"}


def extract_precision_model(curated: Path) -> dict | None:
    """Fallback until the hand sample is filled in: an independent model (not the extractor) judged every accepted claim."""
    review = curated / "extract_model_review.csv"
    if not review.exists():
        return None
    rows = [r for r in read_csv(review) if r.get("verdict", "").lower() in ("ok", "wrong")]
    if not rows:
        return None
    reviewers = sorted({r.get("reviewer") for r in rows if r.get("reviewer")})
    correct = sum(r["verdict"].lower() == "ok" for r in rows)
    return {"value": round(correct / len(rows), 3), "n": len(rows), "kind": "model_review",
            "source": f"independent model review of all {len(rows)} accepted claims against the abstract "
                      f"({', '.join(reviewers) or 'model'}; not a hand review; data/curated/{review.name})"}


def disease_orpha(out: Path, meta: dict, disease: str) -> set[str] | None:
    stem = Path(meta.get("shard_overrides", {}).get(disease, "")).stem or re.sub(r"[^A-Za-z0-9._-]", "_", disease)
    path = out / "disease" / f"{stem}.json"
    if not path.exists():
        return None
    xrefs = json.loads(path.read_text(encoding="utf-8")).get("node", {}).get("xrefs", [])
    return {"ORPHA:" + x.split(":", 1)[1] for x in xrefs if x.split(":", 1)[0] in ("Orphanet", "ORPHA")}


def reconcile_accuracy(curated: Path, reconcile_dir: Path, out: Path, meta: dict) -> dict | None:
    orgs_csv, edges_json = curated / "orgs.csv", reconcile_dir / "org_disease_edges.json"
    if not orgs_csv.exists() or not edges_json.exists():
        return None
    truth = {}
    for row in read_csv(orgs_csv):
        ids = {x.strip().upper().replace("ORPHANET:", "ORPHA:") for x in row.get("orpha_ids", "").split(";") if x.strip()}
        if row.get("verified_date") and row.get("org_name") and ids:
            truth[row["org_name"].strip().lower()] = ids
    graph = json.loads(edges_json.read_text(encoding="utf-8"))
    org_names = {n["id"]: (n.get("label") or "").strip().lower() for n in graph.get("nodes", []) if not n.get("draft_input")}
    judged = {}
    for e in sorted(graph.get("edges", []), key=lambda e: e["id"]):
        expected = truth.get(org_names.get(e["target"], ""))
        if not expected:
            continue
        orpha = disease_orpha(out, meta, e["source"])
        if orpha is None:
            continue
        for ev in e.get("evidence", []):
            if ev.get("draft_input"):
                continue
            judged[(e["target"], ev.get("free_text_name") or "", e["source"])] = bool(orpha & expected)
    if not judged:
        return None
    correct = sum(judged.values())
    return {"value": round(correct / len(judged), 3), "n": len(judged),
            "source": f"06 matches of {len({k[0] for k in judged})} verified orgs vs the hand-entered ORPHA ids in data/curated/orgs.csv"}


def monarch_spearman(extra_dir: Path) -> dict | None:
    summary = None
    if (extra_dir / "extra_metrics.json").exists():
        summary = json.loads((extra_dir / "extra_metrics.json").read_text(encoding="utf-8")).get("monarch_spearman")
    if summary is None and (extra_dir / "extra_monarch.json").exists():
        summary = json.loads((extra_dir / "extra_monarch.json").read_text(encoding="utf-8")).get("summary")
    if not summary or summary.get("value") is None:
        return None
    out = {"value": summary["value"], "n": summary.get("n"), "source": summary.get("source") or "Monarch API v3 semsim",
           "p": summary.get("p"), "label": "HPO profiles: simGIC vs Monarch semsim (ancestor_information_content), top pairs by simGIC"}
    second = summary.get("ontology_variant") or {}
    if second.get("value") is not None:
        out["secondary"] = {"value": second["value"], "n": second.get("n"), "p": second.get("p"), "source": second.get("source"),
                            "label": "disease-disease: Monarch compare/<MONDO>/<MONDO> (MONDO classes only)"}
        out["source"] += f"; disease-disease variant (MONDO classes): rho {second['value']:.2f}, n = {second.get('n')}"
    return out


def coverage(out: Path, meta: dict) -> dict:
    index = json.loads((out / "index.json").read_text(encoding="utf-8"))
    core = sorted(n["id"] for n in index if n.get("type") == "disease" and n.get("in_core"))
    counts = {"trial": 0, "paper": 0, "asset": 0, "org": 0}
    seen = dict.fromkeys(counts, False)
    for d in core:
        stem = Path(meta.get("shard_overrides", {}).get(d, "")).stem or re.sub(r"[^A-Za-z0-9._-]", "_", d)
        path = out / "disease" / f"{stem}.json"
        if not path.exists():
            continue
        shard = json.loads(path.read_text(encoding="utf-8"))
        enrichment = shard.get("enrichment")
        if isinstance(enrichment, dict):
            totals = enrichment.get("totals") or {}
            seen["trial"] = seen["paper"] = True
            counts["trial"] += (totals.get("trials") or len(enrichment.get("trials") or [])) > 0
            counts["paper"] += (totals.get("papers_mentioning") or len(enrichment.get("papers_mentioning") or [])) > 0
        if "assets" in shard:
            seen["asset"] = True
            raw = shard["assets"]
            n = len(raw) if isinstance(raw, list) else (raw.get("items_total") or len(raw.get("items") or []))
            counts["asset"] += n > 0
        if "orgs" in shard:
            seen["org"] = True
            counts["org"] += bool(shard["orgs"])
    return {**{k: (counts[k] if seen[k] else None) for k in counts}, "denominator": len(core)}


def hero_regression(out: Path) -> dict:
    with contextlib.redirect_stdout(io.StringIO()):
        result = validate.run(out)
    hero = result["hero"]
    failed = sorted(name for name, ok in hero.items() if not ok)
    return {"pass": bool(hero) and not failed, "checked_at": today(), "checks": len(hero), "failed": failed}


def compute(out: Path = OUT, extra_dir: Path = EXTRA_DIR, curated: Path = CURATED, reconcile_dir: Path = RECONCILE_DIR) -> dict:
    meta = json.loads((out / "meta.json").read_text(encoding="utf-8"))
    return {"extract_precision": extract_precision(curated),
            "reconcile_accuracy": reconcile_accuracy(curated, reconcile_dir, out, meta),
            "monarch_spearman": monarch_spearman(extra_dir),
            "coverage": coverage(out, meta),
            "hero_regression": hero_regression(out)}


def main(out: Path = OUT, extra_dir: Path = EXTRA_DIR, curated: Path = CURATED, reconcile_dir: Path = RECONCILE_DIR) -> int:
    meta_path = out / "meta.json"
    if not meta_path.exists():
        print(f"[metrics] {meta_path} missing: run make analytics first")
        return 1
    metrics = compute(out, extra_dir, curated, reconcile_dir)
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    meta["metrics"] = metrics
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for key, value in metrics.items():
        print(f"[metrics] {key}: {json.dumps(value, ensure_ascii=False) if value is not None else 'null (pending)'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
