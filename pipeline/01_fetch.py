"""01_fetch — download the bulk sources into data/raw/ and log them in data/MANIFEST.md.

Idempotent: a file whose size matches the server's Content-Length is skipped.
Sources: HPO (annotations, gene links, ontology), MONDO (ontology), Orphanet (diseases, phenotypes, genes, prevalence).
"""
from __future__ import annotations

import hashlib
import sys
from datetime import date
from pathlib import Path

import httpx
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
MANIFEST = ROOT / "data" / "MANIFEST.md"

HPO = "https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/"
MONDO = "https://github.com/monarch-initiative/mondo/releases/latest/download/"
ORPHA = "https://www.orphadata.com/data/xml/"

SOURCES: dict[str, tuple[str, str]] = {
    # filename: (url, what it is)
    "phenotype.hpoa": (HPO + "phenotype.hpoa", "HPO disease→phenotype annotations (OMIM + ORPHA ids, frequency, evidence)"),
    "genes_to_phenotype.txt": (HPO + "genes_to_phenotype.txt", "HPO gene→phenotype→disease"),
    "hp.json": (HPO + "hp.json", "HPO ontology (OBO Graphs JSON)"),
    "mondo.json": (MONDO + "mondo.json", "MONDO disease ontology with xrefs and synonyms"),
    "en_product1.xml": (ORPHA + "en_product1.xml", "Orphanet diseases, synonyms, definitions, xrefs"),
    "en_product4.xml": (ORPHA + "en_product4.xml", "Orphanet disease→HPO with frequency"),
    "en_product6.xml": (ORPHA + "en_product6.xml", "Orphanet disease→gene associations"),
    "en_product9_prev.xml": (ORPHA + "en_product9_prev.xml", "Orphanet epidemiology / prevalence"),
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, target: Path, client: httpx.Client) -> None:
    with client.stream("GET", url) as response:
        response.raise_for_status()
        total = int(response.headers.get("Content-Length", 0)) or None
        if target.exists() and total and target.stat().st_size == total:
            print(f"  skip {target.name} (already complete)")
            return
        with target.open("wb") as fh, tqdm(total=total, unit="B", unit_scale=True, desc=target.name, leave=False) as bar:
            for chunk in response.iter_bytes(1 << 20):
                fh.write(chunk)
                bar.update(len(chunk))


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    rows: list[str] = []
    with httpx.Client(follow_redirects=True, timeout=httpx.Timeout(30.0, read=300.0)) as client:
        for name, (url, what) in SOURCES.items():
            target = RAW / name
            try:
                download(url, target, client)
            except Exception as exc:  # keep going, report at the end
                print(f"  FAILED {name}: {exc}", file=sys.stderr)
                rows.append(f"| `{name}` | {what} | {url} | FAILED | | |")
                continue
            size_mb = target.stat().st_size / 1e6
            rows.append(f"| `{name}` | {what} | {url} | {date.today().isoformat()} | {size_mb:.1f} MB | `{sha256(target)[:16]}…` |")
            print(f"  ok   {name} ({size_mb:.1f} MB)")

    MANIFEST.write_text(
        "# Data manifest\n\n"
        "Written by `pipeline/01_fetch.py`. Raw files live in `data/raw/` (gitignored); this table makes the dataset reproducible.\n\n"
        "| File | What | Source URL | Downloaded | Size | sha256 (prefix) |\n|---|---|---|---|---|---|\n"
        + "\n".join(rows) + "\n"
    )
    failed = sum("FAILED" in r for r in rows)
    print(f"\n{len(rows) - failed}/{len(rows)} sources fetched → {MANIFEST.relative_to(ROOT)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
