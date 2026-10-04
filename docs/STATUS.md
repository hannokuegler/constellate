# Status · Constellate

**Letzte Aktualisierung: So 04.10.2026, 03:40 (Wien)**. Freeze So 12:00 (in 8 h), Abgabe So 15:00 (in 11 h). Mentor-Gespräch Woan-Yu Lin 03:45. **Orchestrierung ab jetzt lokal:** [prompts/LOCAL-ORCHESTRATOR.md](prompts/LOCAL-ORCHESTRATOR.md), Daten: [prompts/LOCAL-DATA-STEWARD.md](prompts/LOCAL-DATA-STEWARD.md). Live: **https://constellate-vert.vercel.app** (Vercel, Root `app`, jeder Push auf `main` deployt).

Pflege: nach jeder Arbeitseinheit nachziehen (Zeitstempel oben setzen). Der Skill `/constellate` ([.claude/skills/constellate/SKILL.md](../.claude/skills/constellate/SKILL.md)) hält die Status-Karte im Teamboard und diese Datei im Gleichschritt. Was entschieden ist und was offen: [DECISIONS.md](DECISIONS.md).

## Auf einen Blick

| Status | Was |
|---|---|
| **Fertig** | App live, E2E grün lokal und live · QA-Lauf live: kein P1 (4 × P2, 5 × P3 in BUGS.md) · Repo-Check vor public: keine Secrets · Zahlen-Check Texte gegen Daten, Fixes im Pitch umgesetzt · Branch `integrate-claude` geprüft: Claude-Extract (50 Kanten aus 342 Abstracts, Precision 0,897 Modell-Review), 39 Orgs (coverage 43/350), 53 Explain-Dateien, Such-Synonyme, neutrale KI-Labels · Entscheidungen P14–P16 |
| **Dran** | Design-Relaunch `design-v2` (Scroll-Story „Brille", 3D, Personas raus), pausiert 03:45, Übergabe `pitch/DESIGN-HANDOVER.md` · Drehbuch nach P16 (Branch `marketing`) · Cloud: `claude/public-readme` · Osman: orgs.csv gegenlesen · Recep: hero_path.yaml, MOONSHOT.md |
| **Blockiert** | `integrate-claude` wartet auf Hannos Go (mit oder ohne Orgs) · Track-Preis: Brief S. 5 verlangt OpenAI, Run nutzt Claude, Orga fragen · Challenge-PDF im Repo (raus vor 11:00?) · Receps Mail in Commit 2b14b1f |
| **Nächster Block** | Go → integrate-claude nach main, live testen → design-v2 auf neuen main mergen · bis 10:30 Design-Endstand · 11:00 Repo public · 12:00 Freeze und Aufnahme · 14:00 Abgabe |

## Branches (P8: ein Branch je Agent, `main` = live)

| Branch | Inhalt | Stand |
|---|---|---|
| `integrate` | Sammel-Branch des Orchestrators, tsc/lint/E2E/Validator grün | 2 Commits vor `main` (precomputed Explain, Design-Prompt) |
| `data-v2` | PR #1, Data Chief | im Review |
| `data-trials` | 142 Studien-Shards | in `main` |
| `data-quality`, `integrate-v2` | Review/Performance, 07+09 | Agents laufen |
| `design` | lokale Design-Session | läuft |
| `app-graph`, `app-action`, `docs-submission`, `pitch-story`, `security`, `explain-precompute` | abgeschlossene Agent-Branches | in `integrate` |

## OpenAI: wofür und wo

Der Brief (S. 5) sagt: Track-Preise nur, wenn OpenAI-Modelle genutzt werden ("Built with OpenAI": Extract, Reconcile, Explain). Entwickelt wird mit Claude, das ist erlaubt; OpenAI muss **im Produkt** arbeiten. Der Key muss dafür **nicht** auf die Webseite: Extract und Reconcile laufen in der Pipeline (lokal), Explain wird für den Hero-Pfad und die wichtigsten Paare lokal vorberechnet und als statisches JSON ausgeliefert. Sichtbar wird es über das Edge-Panel (Modell und Prompt-Version an text-mined Kanten), die Explain-Texte und das Tech-Video. Ohne Key: App läuft, aber kein Anspruch auf Track-Preis.

## Moonshot: was das ist

Pflichtteil des Briefs ("Think Bigger: The 10× Moonshot", S. 6): einen Meilenstein auf dem Weg zur Therapie wählen (bei uns: eine gemeinsame Natural-History-Studie für Krabbe nach dem Vorbild MLD), die heutige Dauer mit unserer Route vergleichen und die Annahmen hinter "10× schneller" offenlegen. Lieferung: `docs/MOONSHOT.md` (Recep, R2) mit Quelle je Zahl und 4 bis 6 Annahmen; danach als Panel in der App und als Folie im Pitch.

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
