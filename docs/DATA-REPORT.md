# Daten-Report data-v2 (Zwischenstand Sa 03.10.2026, ca. 23:30 Wien)

## Blocker: Netzwerk der Cloud-Session

Die Session erreicht nur GitHub und PyPI. Alle Datenquellen antworten mit "CONNECT tunnel failed, response 403" (Proxy-Allowlist):
www.orphadata.com, clinicaltrials.gov, www.ebi.ac.uk, api.reporter.nih.gov, api.platform.opentargets.org, mygene.info, reactome.org, eutils.ncbi.nlm.nih.gov, api.fda.gov, www.ema.europa.eu, api.monarchinitiative.org, pubmed.ncbi.nlm.nih.gov, www.hrsa.gov, oslo-universitetssykehus.no, kinder-jugendheilkunde.meduniwien.ac.at, www.health.state.mn.us, www.g-ba.de, www.fondazionetelethon.it, api.openai.com.
Folge: make fetch holt nur HPO und MONDO (GitHub), Orphanet (product1/4/6/9) scheitert mit 403. Phase A (enrich, analytics, Vergleich mit app/public/data) und alle Quellen aus Phase B sind in dieser Umgebung nicht ausführbar. Es wurden keine Daten erzeugt und keine Zahlen erfunden.
Abhilfe: Environment-Settings, Network access Custom mit den obigen Hosts unter Allowed domains (oder Full), dann Session neu starten.

## Review von Receps Code (offline)

- enrich_extra/reproduce.py importiert check_robots aus common.py, die Funktion hieß dort _check_robots (ImportError bei fetch/enrich). Fix: öffentlicher Alias check_robots in common.py.
- Import aller Module (assets, people, prevalence) und die Schnittstellen zu enrich.ctgov, enrich.diseases, enrich.europepmc stimmen. Bestehende Tests: 33 grün, 1 rot (test_extract_main_without_key_exits_zero, nicht aus diesem Branch, vermutlich Env-abhängig).
- Offene Punkte, nicht verifiziert (braucht Netz): Alias-Auflösung NCT04693598 -> NCT05739643, Format der Prävalenz-XML, NBS-Seiten-Patterns in assets.py.
