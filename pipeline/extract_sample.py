"""extract_sample — 20 reproducible claims from data/extract/claims.jsonl for a manual check without code.

Output: data/curated/extract_check.csv with columns pmid, claim, snippet, url, check (empty).
How to check (Recep/Osman): open the url, find the snippet in the abstract, then write into `check`
  ok          entities, predicate, polarity right and the snippet says it
  wrong: ...  anything off (wrong entity, wrong direction, negation missed, 'in mice' reported as human, ...)
The share of `ok` rows goes into the README ("x/20 claims correct").
Sample: seed 42, half hero papers, half the rest (filled up from the other half if one side is short).
An existing CSV with filled `check` cells is never overwritten (use --force).
"""
from __future__ import annotations

import argparse
import csv
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLAIMS = ROOT / "data" / "extract" / "claims.jsonl"
OUT = ROOT / "data" / "curated" / "extract_check.csv"
COLUMNS = ["pmid", "claim", "snippet", "url", "check"]
SEED = 42
SIZE = 20


def claim_sentence(claim: dict) -> str:
    context = "" if claim.get("study_context") in (None, "human", "not_stated") else f" [{claim['study_context']}]"
    negation = "NOT " if claim["polarity"] == "contradicts" else ""
    return (f"{claim['subject']} ({claim['subject_id']}) {negation}{claim['predicate']} {claim['object']} ({claim['object_id']})"
            f"{context}")


def sample(claims: list[dict], size: int = SIZE, seed: int = SEED) -> list[dict]:
    ordered = sorted(claims, key=lambda c: c["claim_id"])  # input order must not change the sample
    rng = random.Random(seed)
    hero = [c for c in ordered if c.get("is_hero")]
    rest = [c for c in ordered if not c.get("is_hero")]
    take_hero = min(len(hero), max(size // 2, size - len(rest)))
    picked = rng.sample(hero, take_hero) + rng.sample(rest, min(len(rest), size - take_hero))
    return sorted(picked, key=lambda c: (int(c["pmid"]), c["claim_id"]))


def has_checks(path: Path) -> bool:
    if not path.exists():
        return False
    with path.open(newline="", encoding="utf-8") as handle:
        return any((row.get("check") or "").strip() for row in csv.DictReader(handle))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--claims", type=Path, default=CLAIMS)
    parser.add_argument("--out", type=Path, default=OUT)
    parser.add_argument("--size", type=int, default=SIZE)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--force", action="store_true", help="overwrite even if someone already filled the check column")
    args = parser.parse_args(argv)

    if not args.claims.exists():
        print(f"[sample] {args.claims} missing: run `make extract` (needs OpenAI key + model) first. Skipped.")
        return 0
    claims = [json.loads(line) for line in args.claims.read_text().splitlines() if line.strip()]
    if not claims:
        print("[sample] claims.jsonl is empty. Skipped.")
        return 0
    if has_checks(args.out) and not args.force:
        print(f"[sample] {args.out} already has filled checks: not overwritten (--force to replace).")
        return 0
    rows = sample(claims, args.size, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        for claim in rows:
            writer.writerow({"pmid": claim["pmid"], "claim": claim_sentence(claim), "snippet": claim["snippet"], "url": claim["url"], "check": ""})
    hero = sum(1 for c in rows if c.get("is_hero"))
    print(f"[sample] {len(rows)} of {len(claims)} claims ({hero} hero) → {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
