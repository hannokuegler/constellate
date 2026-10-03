# BUGS
Format: `[P1|P2|P3] Screen · Schritte · erwartet · gesehen · (wer)` — P1 = Demo-Killer, P2 = sichtbar, P3 = kosmetisch. Erledigt → `~~durchstreichen~~`.

~~[P2] Krabbe /d/MONDO_0009499 · "Studies looking for participants" öffnen · Länderfilter und Standorte je Studie (trial/NCT*.json) · die 8 Dateien fehlen in app/public/data/trial/, Karte zeigt nur "See the registry entry" (App probiert jetzt nur eine Datei, kein 404-Hagel; Datenfix: `make trials && make validate`, ClinicalTrials.gov in der Cloud gesperrt) · (app-agent)~~ erledigt: 142 Trial-Shards in main (data-trials), Krabbe 8/8
~~[P3] Krabbe · Action card öffnen · Hero-Kette Krabbe → MLD → ARSA als Vorauswahl · Standard-"via" ist "combined PSAP deficiency" (pickDefaultVia wählt nach Konfidenz; MLD ist per Dropdown wählbar) · (app-agent)~~ erledigt: pickDefaultVia bevorzugt die größte verwandte Familie (MLD)
[P2] Disease-Seite mit Honest Gap bei Studien · /d/MONDO_0008215 öffnen (1280 und 375) · Seite passt in den Viewport · seitlicher Scroll (scrollWidth 1854), Synonymliste unter "What was searched" läuft aus der Karte; betrifft vermutlich alle Krankheiten mit coverage.query > 100 Zeichen (bis 295 von 874) · (QA-Agent, offen)
[P2] Suche · "globoid cell leukodystrophy" tippen · Krabbe disease als Treffer 1 · Treffer sind "Sudanophilic leukodystrophy" (HP), Enter landet auf /p/HP_0003269; Synonym fehlt in index.json · (QA-Agent → Data-Chat)
[P2] Honest-Gap-Karte "Studies" · /d/MONDO_0012720 runterscrollen · "What was searched, as of <Datum>" wie im Demo-Skript · roh "ctgov / 0 hits / 2026-10-03 / Querytext", Org-Gap nennt nur "data/curated/orgs.csv" ohne Datum · (QA-Agent, offen)
[P2] /about und /methods · "Source code on GitHub" und Links auf pipeline/enrich_extra/kol.py, nbs.py · Repo erreichbar · 404, Repo bis So 11:00 privat; nach 11:00 nachprüfen · (Orchestrator)
[P3] Alle Seiten · Konsole · keine Fehler · /favicon.ico und /icon.svg 404 · (QA-Agent, offen)
[P3] /methods · "Four evidence levels" · jede Stufe mit Kantenzahl · "text-mined" ohne Zahl · (QA-Agent, hängt an OpenAI)
[P3] Mobil 375 · Disease-Seite · Persona-Umschaltung in einer Zeile · Segmented Control bricht um, Dropdown abgeschnitten ("Just diagno…", "Group lead…") · (QA-Agent, Design)
[P3] "Families with a related diagnosis" · Krabbe, MONDO_0012720 · nach Score absteigend · nicht strikt (0012720 beginnt mit 0.22, endet mit 0.90); Absicht (Subtypen hinten) oder Bug klären · (QA-Agent, offen)
[P3] Suche · "ARSA", "Alexander", "Morbus Krabbe" · relevante Krankheit oben · Gen ok, danach Symptom-Rauschen; "Morbus Krabbe" ohne Treffer · (QA-Agent → Data-Chat)
