"""08 trial details — where open studies run and whom they take, from ClinicalTrials.gov API v2.

Runs after 07 (reads the exported disease shards, writes next to them). For every trial that a disease shard lists
with an open status (recruiting, not yet recruiting, enrolling by invitation, available) it fetches the
contacts-and-locations and eligibility modules and writes app/public/data/trial/<NCT>.json:

    {id, status, last_update, retrieved, url, contact_url, source: {db, record, url},
     eligibility: {min_age, max_age, sex, std_ages, healthy_volunteers},
     countries: [{country, sites, open_sites}], sites: [{facility, city, country, status}], sites_total,
     officials: [{affiliation, role}]}

Personal contact data (names, e-mails, phone numbers of study staff) is deliberately not stored: the app sends
families to the study's official contact section on ClinicalTrials.gov (contact_url). Responses are disk-cached
like every enrichment call (data/cache/ctgov_details/), so a second run is offline.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from enrich.http import FetchError, get_json, now_iso, set_refresh

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "app" / "public" / "data"
SOURCE = "ctgov_details"
URL = "https://clinicaltrials.gov/api/v2/studies"
OPEN_STATUSES = {"RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION", "AVAILABLE"}
OPEN_SITE_STATUSES = OPEN_STATUSES
FIELDS = "|".join([
    "protocolSection.identificationModule.nctId",
    "protocolSection.statusModule.overallStatus",
    "protocolSection.statusModule.lastUpdatePostDateStruct",
    "protocolSection.contactsLocationsModule.locations",
    "protocolSection.contactsLocationsModule.overallOfficials",
    "protocolSection.eligibilityModule.minimumAge",
    "protocolSection.eligibilityModule.maximumAge",
    "protocolSection.eligibilityModule.sex",
    "protocolSection.eligibilityModule.stdAges",
    "protocolSection.eligibilityModule.healthyVolunteers",
])
BATCH = 50
MAX_SITES = 150  # the country counts always cover every site; the site list is capped for the shard budget


def open_trial_ids(out: Path) -> list[str]:
    ids: set[str] = set()
    for shard in sorted((out / "disease").glob("*.json")):
        data = json.loads(shard.read_text())
        for item in data.get("enrichment", {}).get("trials", []):
            node = item.get("node", {})
            if node.get("status") in OPEN_STATUSES and node.get("id"):
                ids.add(node["id"])
    return sorted(ids)


def normalize(study: dict, retrieved: str) -> dict:
    p = study.get("protocolSection", {})
    nct = p["identificationModule"]["nctId"]
    status = p.get("statusModule", {})
    contacts = p.get("contactsLocationsModule", {})
    elig = p.get("eligibilityModule", {})
    locations = contacts.get("locations", [])
    per_country: Counter = Counter()
    open_per_country: Counter = Counter()
    sites = []
    for loc in locations:
        country = loc.get("country") or "Unknown"
        per_country[country] += 1
        if loc.get("status") in OPEN_SITE_STATUSES:
            open_per_country[country] += 1
        sites.append({"facility": loc.get("facility"), "city": loc.get("city"), "country": country, "status": loc.get("status")})
    # open sites first, then alphabetically, so the capped list keeps the useful ones
    sites.sort(key=lambda s: (s["status"] not in OPEN_SITE_STATUSES, s["country"], s["city"] or "", s["facility"] or ""))
    url = f"https://clinicaltrials.gov/study/{nct}"
    return {
        "id": nct,
        "status": status.get("overallStatus"),
        "last_update": status.get("lastUpdatePostDateStruct", {}).get("date"),
        "retrieved": retrieved,
        "url": url,
        "contact_url": f"{url}#contacts-and-locations",
        "source": {"db": "ClinicalTrials.gov", "record": nct, "url": url},
        "eligibility": {
            "min_age": elig.get("minimumAge"),
            "max_age": elig.get("maximumAge"),
            "sex": elig.get("sex"),
            "std_ages": elig.get("stdAges", []),
            "healthy_volunteers": elig.get("healthyVolunteers"),
        },
        "countries": [{"country": c, "sites": n, "open_sites": open_per_country.get(c, 0)}
                      for c, n in sorted(per_country.items(), key=lambda kv: (-kv[1], kv[0]))],
        "sites": sites[:MAX_SITES],
        "sites_total": len(locations),
        "officials": [{"affiliation": o.get("affiliation"), "role": o.get("role")} for o in contacts.get("overallOfficials", [])
                      if o.get("affiliation")],
    }


def fetch(ids: list[str]) -> tuple[list[dict], list[str]]:
    records, failed = [], []
    for start in range(0, len(ids), BATCH):
        batch = ids[start:start + BATCH]
        params = {"filter.ids": ",".join(batch), "fields": FIELDS, "pageSize": BATCH, "format": "json"}
        try:
            response = get_json(SOURCE, URL, params=params)
        except FetchError as exc:
            print(f"  batch {start // BATCH + 1}: {exc}", file=sys.stderr)
            failed.extend(batch)
            continue
        got = {}
        for study in (response.data or {}).get("studies", []):
            record = normalize(study, response.fetched_at)
            got[record["id"]] = record
        records.extend(got.values())
        failed.extend(i for i in batch if i not in got)
        print(f"  batch {start // BATCH + 1}: {len(got)}/{len(batch)} studies", file=sys.stderr)
    return records, failed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--refresh", action="store_true", help="ignore the disk cache")
    args = parser.parse_args()
    set_refresh(args.refresh)
    ids = open_trial_ids(OUT)
    print(f"08 trial details: {len(ids)} open trials in the disease shards", file=sys.stderr)
    records, failed = fetch(ids)
    folder = OUT / "trial"
    folder.mkdir(exist_ok=True)
    for old in folder.glob("*.json"):
        old.unlink()
    for record in records:
        (folder / f"{record['id']}.json").write_text(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
    meta_path = OUT / "meta.json"
    meta = json.loads(meta_path.read_text())
    meta.setdefault("counts", {})["trial_shards"] = len(records)
    meta["trial_details"] = {"retrieved": now_iso(), "open_trials": len(ids), "fetched": len(records), "missing": failed}
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    countries = Counter(c["country"] for r in records for c in r["countries"])
    print(f"  wrote {len(records)} trial shards, {len(failed)} missing; top countries: {countries.most_common(8)}", file=sys.stderr)
    return 0 if records or not ids else 1


if __name__ == "__main__":
    sys.exit(main())
