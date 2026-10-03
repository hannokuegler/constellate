# BUGS
Format: `[P1|P2|P3] Screen · Schritte · erwartet · gesehen · (wer)` — P1 = Demo-Killer, P2 = sichtbar, P3 = kosmetisch. Erledigt → `~~durchstreichen~~`.

~~[P2] Krabbe /d/MONDO_0009499 · "Studies looking for participants" öffnen · Länderfilter und Standorte je Studie (trial/NCT*.json) · die 8 Dateien fehlen in app/public/data/trial/, Karte zeigt nur "See the registry entry" (App probiert jetzt nur eine Datei, kein 404-Hagel; Datenfix: `make trials && make validate`, ClinicalTrials.gov in der Cloud gesperrt) · (app-agent)~~ erledigt: 142 Trial-Shards in main (data-trials), Krabbe 8/8
~~[P3] Krabbe · Action card öffnen · Hero-Kette Krabbe → MLD → ARSA als Vorauswahl · Standard-"via" ist "combined PSAP deficiency" (pickDefaultVia wählt nach Konfidenz; MLD ist per Dropdown wählbar) · (app-agent)~~ erledigt: pickDefaultVia bevorzugt die größte verwandte Familie (MLD)
