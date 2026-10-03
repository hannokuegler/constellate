"""08 trial details: normalisation of a ClinicalTrials.gov v2 record (no network)."""
from __future__ import annotations

import json

from conftest import load_script

mod = load_script("08_trial_details.py", "trial_details")

STUDY = {"protocolSection": {
    "identificationModule": {"nctId": "NCT00000001"},
    "statusModule": {"overallStatus": "RECRUITING", "lastUpdatePostDateStruct": {"date": "2026-09-01"}},
    "contactsLocationsModule": {
        "centralContacts": [{"name": "Jane Doe", "email": "jane@example.org", "phone": "+1 555"}],
        "overallOfficials": [{"name": "Dr X", "affiliation": "University of Pittsburgh", "role": "PRINCIPAL_INVESTIGATOR"}],
        "locations": [
            {"facility": "Site A", "city": "Pittsburgh", "country": "United States", "status": "RECRUITING",
             "contacts": [{"name": "Site Person", "email": "site@example.org"}]},
            {"facility": "Site B", "city": "Tübingen", "country": "Germany", "status": "COMPLETED"},
            {"facility": "Site C", "city": "Boston", "country": "United States"},
        ]},
    "eligibilityModule": {"minimumAge": "0 Months", "maximumAge": "18 Years", "sex": "ALL", "stdAges": ["CHILD"]},
}}


def test_normalize_counts_countries_and_open_sites():
    r = mod.normalize(STUDY, "2026-10-03T00:00:00Z")
    assert r["id"] == "NCT00000001" and r["status"] == "RECRUITING"
    assert r["countries"] == [{"country": "United States", "sites": 2, "open_sites": 1},
                              {"country": "Germany", "sites": 1, "open_sites": 0}]
    assert r["sites_total"] == 3 and r["sites"][0]["facility"] == "Site A"  # open site first
    assert r["eligibility"]["max_age"] == "18 Years"
    assert r["contact_url"].endswith("#contacts-and-locations")


def test_normalize_stores_no_personal_contact_data():
    blob = json.dumps(mod.normalize(STUDY, "2026-10-03T00:00:00Z"))
    for personal in ("Jane Doe", "jane@example.org", "+1 555", "Dr X", "site@example.org", "Site Person"):
        assert personal not in blob
    assert "University of Pittsburgh" in blob
