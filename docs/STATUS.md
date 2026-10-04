# Status · Constellate

**Letzte Aktualisierung: So 04.10.2026, 09:10 (Wien)**. **Fertig und abgabebereit:** App, Daten und alle Videos stehen, die Abgabe (HackOS und Google Form) läuft jetzt, Frist 15:00. Ab 14:45 keine Pushes mehr. Live: **https://constellate-vert.vercel.app** (Vercel, Root `app`, jeder Push auf `main` deployt), Einstieg mit Video: **https://constellate-vert.vercel.app/intro**.

Pflege: nach jeder Arbeitseinheit nachziehen (Zeitstempel oben setzen). Der Skill `/constellate` ([.claude/skills/constellate/SKILL.md](../.claude/skills/constellate/SKILL.md)) hält die Status-Karte im Teamboard und diese Datei im Gleichschritt. Was entschieden ist und was offen: [DECISIONS.md](DECISIONS.md).

## Auf einen Blick

| Status | Was |
|---|---|
| **Fertig** | App live (Suche, Ego-Graph mit Familienknoten, Edge-Panel, Action Card v2, Honest Gap, offene Studien mit 142 Trial-Shards, `/methods`, `/about`) · Hero-Pfad-E2E grün · Security-Review (keine Secrets in der History, `/api/explain` mit Limits, Security-Header) · Explain wird vorberechnet (`make explain`), die Webseite braucht keinen Key · Data Chief fertig: PR hannokuegler/constellate#1 (`data-v2`: 135 Beobachtungsstudien + 9 Outcome-Skalen, 39 Medikamente inkl. Libmeldy/Lenmeldy, keine Krabbe-Zulassung, NBS 11 belegt/11 UNBELEGT, Prävalenz 638 Einträge, Monarch ρ = 0,661) · Data Steward: Review-Fixes C1–C8 in 04b, Re-Export `2026-10-04+917470a` seit So 01:27 auf `main` und live (validate, tsc, lint, E2E grün; Krabbe 140 KB, MLD 144 KB, größter Shard 149 KB); Dauer-Prompt `docs/prompts/DATA-STEWARD-STANDING.md` · `pitch/` (Story, 60-s-Pitch, Video-Strategie, ElevenLabs, Motion) · Entscheidungen P9–P13 · Neue Seite (Branch `maria`, klassisches Design mit allen neuen Funktionen) und `/impact` live auf `main` · Story `/intro` live: „Maria's first night“, 59,6 s, Playwright-Aufnahme der Live-App mit ElevenLabs-Stimmen (Maria und Consti), Rahmen auf jedem erklärten Bereich, Button „Play with sound“, Transkript, Link auf der Startseite, E2E `e2e/intro.spec.ts`; Skript und Stimmwahl in `app/story/VOICE.md`, Neuaufnahme mit `npm run story:voice` und `npm run story:record` · Alle Videos fertig |
| **Dran** | Abgabe auf HackOS und im Google Form bis 15:00 |
| **Blockiert** | nichts |
| **Nächster Block** | Abgabe, ab 14:45 kein Push und kein Redeploy · Sa 10.10. Preisverleihung (Top 2 pitchen live) |

## Branches (P8: ein Branch je Agent, `main` = live)

| Branch | Inhalt | Stand |
|---|---|---|
| `integrate` | Sammel-Branch des Orchestrators, tsc/lint/E2E/Validator grün | 2 Commits vor `main` (precomputed Explain, Design-Prompt) |
| `data-v2` | PR #1, Data Chief | im Review |
| `data-trials` | 142 Studien-Shards | in `main` |
| `data-quality`, `integrate-v2` | Review/Performance, 07+09 | Agents laufen |
| `design` | lokale Design-Session | läuft |
| `maria` | Design-Lead (So 07:40): altes helles Design von `main` plus alle neuen Funktionen, dazu die Story `/intro` | in `main` (So 09:05), live |
| `claude/mother-walkthrough` | Story `/intro` mit Playwright-Aufnahme und ElevenLabs-Stimmen | in `maria` und `main`, live |
| `app-graph`, `app-action`, `docs-submission`, `pitch-story`, `security`, `explain-precompute` | abgeschlossene Agent-Branches | in `integrate` |

## OpenAI: wofür und wo

Der Brief (S. 5) sagt: Track-Preise nur, wenn OpenAI-Modelle genutzt werden ("Built with OpenAI": Extract, Reconcile, Explain). Entwickelt wird mit Claude, das ist erlaubt; OpenAI muss **im Produkt** arbeiten. Der Key muss dafür **nicht** auf die Webseite: Extract und Reconcile laufen in der Pipeline (lokal), Explain wird für den Hero-Pfad und die wichtigsten Paare lokal vorberechnet und als statisches JSON ausgeliefert. Sichtbar wird es über das Edge-Panel (Modell und Prompt-Version an text-mined Kanten), die Explain-Texte und das Tech-Video. Ohne Key: App läuft, aber kein Anspruch auf Track-Preis.

## Moonshot: was das ist

Pflichtteil des Briefs ("Think Bigger: The 10× Moonshot", S. 6): einen Meilenstein auf dem Weg zur Therapie wählen (bei uns: eine gemeinsame Natural-History-Studie für Krabbe nach dem Vorbild MLD), die heutige Dauer mit unserer Route vergleichen und die Annahmen hinter "10× schneller" offenlegen. Lieferung: `docs/MOONSHOT.md` (Recep, R2) mit Quelle je Zahl und 4 bis 6 Annahmen; danach als Panel in der App und als Folie im Pitch.

**In der App seit So 08:27 auf `main`, Ausbau 09:00:** `/impact?d=<id>`, Meilenstein = erste Familie in Natural-History-Daten. Für alle 350 Kernkrankheiten berechnet (`make tenx`): 91 können einer offenen Studie beitreten, die sie schon nennt, 103 über eine Studie mit gleichem Gen oder gleicher Mechanismusklasse, 156 Honest Gap (kein 10× behauptet). Krabbe: Krabbe Disease Global Patient Registry NCT02993796, 3,7× bis 42× (Mitte 11×; Sponsor-Update 17.07.2026 zählt als Bestätigung, abgelaufenes Enddatum steht auf der Prüfliste), dazu 3 offene Ausweichstudien als Plan B; Saposin-A-Defizienz über PSAP: 1,1× bis 8,9×, 10× nicht erreicht. Jede Woche als Atlas / Annahme / Annahme auf Publikation markiert und live änderbar; die Studienstart-Dauer ist eine Annahme, weil kein Benchmark geprüft ist (PubMed in der Cloud gesperrt). Dazu: wichtigste Annahme (Sensitivität), Kontakt-Link zum Studienteam, Portfolio (10× in der Spanne für 73 Krankheiten, Mitte ≥ 10× für 41). E2E `e2e/impact.spec.ts` grün.

## Fertig, mit Zahlen

| Baustein | Stand | Beleg |
|---|---|---|
| Pipeline 01 bis 03 | 8 Bulk-Quellen (HPO, MONDO, Orphanet) mit sha256 im Manifest; Slice deterministisch: 350 Kern plus 524 Nachbarn; Basisgraph mit stabilen 12-hex-Edge-IDs und ehrlicher Provenienz | `data/MANIFEST.md`, `pipeline/01_fetch.py` bis `03_build_graph.py` |
| Evidenzmodell-Fixes | 531 Einträge „0 von n" sind Gegenevidenz; 217 `caused_by` wurden `associated_gene`; Orphanet „nicht ursächlich" und OMIM „susceptibility" gewinnen | Git-Log `a63077d`, `661445c` |
| 04 Enrichment | 1.055 Studien, 1.855 Papers, 1.687 Grants, dazu Open Targets, Reactome, ClinVar; Coverage-Records für 350 Krankheiten (Basis für Honest Gap) | `pipeline/04_enrich_apis.py`, `pipeline/enrich/` |
| 05 und 06 OpenAI | Extract (Structured Outputs, harte Verankerung: wörtliches Snippet, PMID, Entität im Abstract) und Reconcile (Embeddings plus Judge, Fuzzy-Fallback); Modell-IDs nur per Env; 31 Tests mit Mock, ohne Key | `pipeline/05_*.py`, `06_*.py`, `pipeline/tests/` |
| 07 Analytics | Subtyp-Roll-up (markiert), IC, simGIC und Resnik, Gegenbeispiele über Mechanismus-Klassen (251 Paare), Louvain (17 Cluster, Modularität 0,68), Export, Merge von Text-mined und Orgs | `pipeline/07_analytics.py` |
| Validator | grün: Index und Shards decken sich, Budgets, Hero-Pfad vorhanden | `make validate` |
| App-Daten | 874 Krankheiten, 1.066 Gene, 4.717 Phänotype im Index (5.642 Phänotypknoten gesamt), 6.660 Dateien; Kanten nach Stufe: 14.512 observed, 27.066 curated, 4.181 inferred, 488 contradicted | `app/public/data/meta.json` |
| Hero-Pfad in den Daten | Krabbe, GALC und PSAP, MLD, ARSA komplett; Pelizaeus-Merzbacher als Gegenbeispiel | Validator, `meta.json` |
| App v0 | Next.js: Patientenorgs (`/o/[slug]`, Draft-Badge), Honest Gap aus dem Pipeline-`gap`-Block, Text-mined gestrichelt + Literatur-Block; Suche, Ego-Graph nach Evidenzstufe, Edge-Panel mit Gegenevidenz-Slot, Gen- und Phänotyp-Seiten, Action Card (Export), Honest Gap, `/api/explain` mit Zitat-Post-Check und Template-Fallback; bisher nur lokal | [app/README.md](../app/README.md) |
| Teamboard | live unter https://constellate.flowary.at (Login im Team-Chat), temporär bis 11.10.2026 | [TEAMBOARD.md](TEAMBOARD.md) |
| Docs | Team-Briefing (Technik, Wirtschaft und Nutzer mit je 30 Fragen) per Mail, Abgabe-Checkliste, RESOURCES geprüft, MEDICAL-BACKGROUND korrigiert (FBX-101 NCT05739643, HOME-Sponsor NORD, Österreich ohne Krabbe-NBS) | `docs/` |
| Kuratierte Entwürfe | `hero_path_draft.yaml` + `hero_path_CHECK.md` (66 Einträge, 17 Pflichtprüfung für Recep), `orgs_draft.csv` + `orgs_CHECK.md` (40 Orgs, 13 DACH; Osman prüft) | `data/curated/` |
| Team im Repo | Osman (`OsmanTuerkmen`) und Recep (`Reczec`) sind Collaborators mit Schreibrechten | GitHub |

## Dran und offen

| Was | Wer | Done-Kriterium |
|---|---|---|
| Reconcile mit verifizierten Orgs laufen lassen | nächste Session | sobald `data/curated/orgs.csv` Zeilen mit `verified_date` hat: `make reconcile && make analytics && make validate` |
| `hero_path.yaml` aus dem Entwurf übernehmen (R1) | Recep | Block A (17 Einträge) geprüft, Block-B-Stichprobe ok, VERIFIED nach `hero_path.yaml` |
| Länder und Standorte der offenen Studien laden (`make trials && make validate`, ca. 3 Abfragen für 142 Studien) | Hanno lokal (ClinicalTrials.gov ist in der Cloud-Umgebung gesperrt) | `app/public/data/trial/` hat Dateien, Länderfilter erscheint auf der Krabbe-Seite |
| `orgs.csv` (O2) | Osman | mindestens 25 Zeilen, jede URL selbst geöffnet, `verified_date` gesetzt; heute enthält die Datei nur die Kopfzeile |
| Moonshot-Zahlen (R2) | Recep | `docs/MOONSHOT.md` mit Quelle je Zahl und 4 bis 6 Annahmen; Datei fehlt noch |
| README (O3) | Osman | alle Abschnitte laut ROLES-TASKS; Status, Scope-Zahl und Reactome-Lizenz sind nachgezogen |

## Blockiert (Hanno)

| Blocker | Folge | Vorschlag |
|---|---|---|
| Vercel-Verbindung | keine Live-URL, kein E2E-Test gegen die echte Umgebung | zuerst lösen, dann alles andere; Deploy-Befehle führt Hanno selbst aus |
| OpenAI-Key | Extract und Explain laufen nur als Template oder Mock; zwei der drei Pflicht-Stellen ungetestet | Key in `.env.local` und `app/.env.local`, dann `client.models.list()` prüfen (D7) |

## Nächster Block

1. Vercel live (Hanno), Daten und App deployen.
2. Extract mit Key laufen lassen (20er-Stichprobe prüfen, T22), Reconcile mit den verifizierten Orgs.
3. Explain echt (Modell per Env), Post-Check im Browser testen.
4. E2E-Check Hero-Pfad: Suche Krabbe, GALC, PSAP, MLD, Edge-Panel mit Beleg, Action Card, Honest Gap, Pelizaeus-Merzbacher als Gegenbeispiel. Ziel 06:00.
5. Danach Polish: BUGS P1 und P2, Persona-Linse, Gegenevidenz-Anzeige, Moonshot-Panel (Plan: [PLAN.md](PLAN.md)).

## Bekannte Lücken und Hinweise

- `data/curated/orgs.csv` und `data/curated/hero_path.yaml` sind noch Platzhalter, bis Osman und Recep geprüft haben. Das Produkt zeigt bis dahin keine Orgs und keinen kuratierten Hero-Beleg (Regel: nur Verifiziertes).
- Die Lizenzangabe für Reactome lautet laut reactome.org/license **CC0**. `docs/DATA-SOURCES.md` und die README sind korrigiert; die Quellenliste in `app/public/data/meta.json` (geschrieben von `pipeline/07_analytics.py`) sagt noch CC-BY 4.0 und muss beim nächsten Export nachgezogen werden.
- Slice-Zahl: die älteren Docs nennen 517 oder 519 Nachbarn und 867 oder 869 Krankheiten. Aktuell gelten 524 Nachbarn und 874 Krankheiten (350 plus 524).
- Demo-Krankheit für den Honest Gap ist offen (T28): „CLN14" existiert im Slice nicht als Knoten.

## Bekannte Polish-Punkte (P2, nach E2E)

- Ego-Graph: Labels überlappen; viele MLD-Subtypen machen das Bild unruhig → Subtypen zur Familie bündeln oder Labels nur bei Hover.
- Neue App-Ansichten (Orgs, Gap, Literatur) noch nicht bei 375 px / Dark Mode geprüft; Design-Check neu laufen lassen.
- Text-mined-Endpunkte außerhalb des Index zeigen nur die ID.
- `app/README.md` um `orgs`, `gap`, `text_mined` und `NEXT_PUBLIC_DATA_BASE` ergänzen.
- Board-Docs-Bereich zeigt `docs/briefing/` nicht (Freigabe nur `docs/*.md`).
