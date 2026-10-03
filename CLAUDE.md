# CLAUDE.md · Constellate (Landkarte für jede Claude-Session)

Dieses Repo ist die **einzige Quelle der Wahrheit** für das Hackathon-Projekt. Wer hier arbeitet (lokal oder in der Cloud), findet alles Wichtige im Repo und braucht keinen Zugriff auf Hannos Mac. Stand der Arbeit: [docs/STATUS.md](docs/STATUS.md). Offene Entscheidungen: [docs/DECISIONS.md](docs/DECISIONS.md).

## Was Constellate ist

Ein evidenzgraduierter Wissensgraph für seltene Krankheiten: Krankheiten, Gene, Phänotype, Studien, Papers, Förderungen und Patientenorganisationen, jede Kante mit Quelle, Datum, Evidenzstufe, Konfidenz und Gegenevidenz. Die App führt eine Patientengruppen-Leitung von ihrer Diagnose zu einer mechanistisch verwandten Community, einem wiederverwendbaren Asset (Register, Natural-History-Studie) und einer belegten Action Card. Wo es keine belegte Spur gibt, zeigt sie die **Honest Gap** (was gesucht wurde, was fehlt, welche Frage als Nächstes zu testen ist), statt zu raten.

- Challenge: Hack-Nation 7th Global AI Hackathon, Vienna Hub, **C5 „AI Atlas for the World's Rare Diseases"** (Buffalo Initiative × OpenAI). Brief: [docs/C5-Challenge-Brief.pdf](docs/C5-Challenge-Brief.pdf).
- Hero-Pfad: Krabbe (MONDO:0009499) → GALC / PSAP → MLD → ARSA → Gentherapie und Natural-History-Studie als Präzedenz → Action Card. Gegenbeispiel: Pelizaeus-Merzbacher (PLP1). Details: [docs/SCOPE.md](docs/SCOPE.md).
- Scope: 350 Kernkrankheiten (MONDO-Teilbäume lysosomal storage disease + leukodystrophy) plus 524 Nachbarn.

## Deadlines (Europe/Vienna)

| Wann | Was |
|---|---|
| So 04.10.2026, 06:00 | Ziel: End-to-End live (Hero-Pfad klickbar) |
| So 04.10., 11:00 | Repo wird **public** (Git-History bleibt sichtbar) |
| So 04.10., 12:00 | **Feature-Freeze**, danach nur P1-Bugs, Videos, README, Submission |
| So 04.10., 15:00 | **Abgabe** (HackOS und Google Form), keine späte Abgabe |
| Sa 10.10.2026 | Preisverleihung, Pflicht (Top 2 pitchen live) |

## Team

| Wer | Rolle |
|---|---|
| Hanno Kügler | Tech Lead, baut Pipeline und App, **entscheidet** |
| Osman | Ops und Kuration: `data/curated/orgs.csv`, README, Reproduce-Test, Team-Video, QA |
| Recep | Story, Evidenz, Videos: `hero_path.yaml`, `docs/MOONSHOT.md`, Demo-Skript, Demo-Video, Pitch-Slides |

Osman und Recep bekommen kleine Aufgaben mit Datei-Output (siehe [docs/ROLES-TASKS.md](docs/ROLES-TASKS.md)). Übergabe über Dateien im Repo oder über das Teamboard ([docs/TEAMBOARD.md](docs/TEAMBOARD.md)), nicht über Chat-Romane. Kontaktdaten stehen bewusst nicht im Repo.

## Ordnerstruktur

| Ordner / Datei | Inhalt |
|---|---|
| `pipeline/` | Python (uv): `01_fetch` bis `07_analytics`, `validate.py`, `openai_config.py`, `prompts/`, `enrich/` (API-Clients), `tests/` |
| `data/curated/` | Handgepflegte Daten: `orgs.csv` (Osman), `hero_path.yaml` (Recep) plus Entwürfe `*_draft.*` und Prüflisten `*_CHECK.md` |
| `data/` (Rest) | `MANIFEST.md` (Quellen mit URL, Datum, sha256); `raw/`, `cache/`, `enrich/`, `slice.json`, `graph_base.json` sind gitignored und werden von `make` neu erzeugt |
| `app/` | Next.js 15 (App Router, TypeScript, Tailwind 4), react-force-graph-2d; Daten statisch aus `app/public/data/` |
| `app/public/data/` | **Pipeline-Output und Datenvertrag**: `meta.json`, `index.json`, `core.json`, Shards je Krankheit, Gen, Phänotyp. Die App schreibt hier nie |
| `docs/` | Konzept, Plan, Status, Entscheidungen, Briefing, Medizin-Hintergrund (Details unten) |
| `memes/` | Memes für den Meme-Wettbewerb plus Discord-Oneliner (gepostet wird von Osman) |
| `tools/board.py` | CLI fürs Teamboard (Login über Umgebungsvariablen) |
| `.claude/skills/constellate/` | Projekt-Skill `/constellate`: Teamboard und `docs/STATUS.md` aktuell halten |
| `BUGS.md` | Bug-Liste, Format `[P1\|P2\|P3] Screen · Schritte · erwartet · gesehen · (wer)`, erledigt = durchstreichen |

## Befehle (Repo-Root)

```bash
cp .env.example .env.local     # Keys eintragen, nie committen
make setup                     # uv sync + npm install
make fetch      # 01 Bulk-Downloads (HPO, MONDO, Orphanet), Cache in data/raw, Manifest
make slice      # 02 Kern (350) + Nachbarn (524), deterministisch
make build      # 03 Knoten, Kanten, Evidenz (Basisgraph)
make enrich     # 04 ClinicalTrials.gov, Europe PMC, NIH RePORTER, Open Targets, Reactome, ClinVar, mygene
make extract    # 05 OpenAI: Abstracts -> Claims (braucht OPENAI_API_KEY und OPENAI_MODEL_*)
make reconcile  # 06 OpenAI: Org-Namen -> MONDO-IDs (Fuzzy-Fallback ohne Key)
make analytics  # 07 Roll-up, IC, simGIC/Resnik, Gegenbeispiele, Louvain, Export nach app/public/data/
make validate   # prüft app/public/data/ gegen den Datenvertrag (muss grün sein)
make reproduce  # fetch -> ... -> analytics, alles aus den Rohquellen
make dev        # App auf http://localhost:3000
```

## Datenvertrag

Pipeline → `app/public/data/` → App. Format, Felder und Normalisierung: [app/README.md](app/README.md). Kanten haben `id: "e_<12 hex>"`, `evidence[]` (db, origin, record, url, level, date, confidence, snippet), `contradicting[]` (darf leer sein, fehlt nie), `confidence`, `level`, `independent_sources`. Evidenzstufen: `observed` · `curated` · `text_mined` · `inferred` (Modell in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). Eine Änderung am Vertrag geht nur zusammen mit `pipeline/validate.py` und `app/lib/normalize.ts`.

## Harte Regeln

1. **Primärquelle für jede Zahl und jede medizinische Aussage** (PMID, OMIM, ORPHA, NCT, EMA/FDA), im Produkt wie in Videos und Docs. LLM-Gedächtnis ist keine Quelle. Geprüfter Stand: [docs/MEDICAL-BACKGROUND.md](docs/MEDICAL-BACKGROUND.md), die ⚠️-Marker dort sind offen.
2. **Lücken zeigen statt erfinden.** Was nicht belegbar ist, steht als `UNBELEGT` oder als Honest Gap im Produkt. Das ist ein Feature.
3. **OpenAI an 3 Stellen sichtbar:** Extract, Reconcile, Explain, sonst kein Track-Preis. Modell-IDs nur per Umgebungsvariable (`OPENAI_MODEL_*`), nie hartcodiert, vorher `client.models.list()` prüfen.
4. **Keys nie committen.** Nur `.env.local` (Root) und `app/.env.local`, beide gitignored. Das Repo wird So 11:00 öffentlich und die History bleibt sichtbar: **keine** Passwörter, API-Keys, privaten Mail-Adressen oder Telefonnummern, keine Server-Interna (IPs, Serverpfade, Tunnel-IDs). Teamboard-Zugang immer als „Login im Team-Chat" beschreiben. Namen der Teammitglieder sind ok.
5. **Commits:** Präfix `pipeline:` · `app:` · `data:` · `docs:`, ein Satz, **kein** `Co-Authored-By` und keine andere AI-Attribution. Vor dem Push `git pull --rebase`. **Nie `git push --force`.** Nur eigene Dateien stagen, nie `git add .`.
6. **Entscheidungen trifft Hanno.** Offenes steht in [docs/DECISIONS.md](docs/DECISIONS.md); gebaut wird mit den dortigen umkehrbaren Defaults, nichts davon wird als final behauptet.
7. **Zuständigkeit:** `pipeline/` und `app/` nur Hanno oder von ihm beauftragte Agents. Osman und Recep schreiben nur in ihre Dateien (`data/curated/`, `BUGS.md`, README, `docs/MOONSHOT.md`). Nichts löschen, was ein anderer pflegt.
8. **Nur verifizierte Orgs ins Produkt.** `orgs_draft.csv` ist ein Entwurf; ins Produkt kommt nur, was Osman geprüft und nach `orgs.csv` übernommen hat. Dasselbe gilt für `hero_path_draft.yaml` (Recep).
9. **Deadline ist hart.** Nach dem Freeze (So 12:00) nur P1-Bugs. Ab So 14:45 nichts mehr pushen, kein Redeploy.
10. Keine Blockquotes (`>`) in neuen Docs, Texte zum Weiterleiten als Klartext.

## Wenn die Zeit kippt: Fallback-Reihenfolge

1. Extract raus (Kanten nur aus kuratierten Datenbanken) · 2. Reconcile wird Fuzzy-Match plus Handprüfung · 3. Persona-Linse raus · 4. Louvain wird Top-k-Nachbarn.

**Niemals raus:** Edge-Panel mit Beleg und Gegenevidenz-Slot, Action Card, Honest Gap, Explain (notfalls als Template-Text, im Video offen gesagt).

## Wo was steht

| Frage | Datei |
|---|---|
| Wie ist der Stand, was blockiert? | [docs/STATUS.md](docs/STATUS.md) |
| Was ist offen, welche Defaults gelten? | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Zeitplan, Judging-Logik, Fallbacks, Planänderungen | [docs/PLAN.md](docs/PLAN.md) |
| Cluster, Hero-Journey, Honest-Gap-Journey, Moonshot | [docs/SCOPE.md](docs/SCOPE.md) |
| Stack, Datenmodell, Evidenzstufen, OpenAI-Stellen | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Quellen, Endpunkte, Lizenzen | [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) |
| Tasks O1–O6, R1–R5, Hannos Blöcke | [docs/ROLES-TASKS.md](docs/ROLES-TASKS.md) |
| Arbeitsprinzipien, Git-Workflow, CSV- und YAML-Format, Qualitäts-Gates | [docs/WORKFLOW.md](docs/WORKFLOW.md) |
| Story (Nora vs. Maria) | [docs/STORY.md](docs/STORY.md) |
| Videos (Demo, Tech, Team, 1-min-Walkthrough) | [docs/VIDEOS.md](docs/VIDEOS.md) |
| Medizin, geprüfte Fakten und Primärquellen | [docs/MEDICAL-BACKGROUND.md](docs/MEDICAL-BACKGROUND.md), [docs/GLOSSAR.md](docs/GLOSSAR.md) |
| Tools, Accounts, Budgets (ohne Keys) | [docs/RESOURCES.md](docs/RESOURCES.md) |
| Technik-Briefing mit Fragen T1–T30 | [docs/briefing/TECHNIK.md](docs/briefing/TECHNIK.md) |
| Wirtschaft und Nutzersicht mit Fragen W1–W30 | [docs/briefing/WIRTSCHAFT-NUTZER.md](docs/briefing/WIRTSCHAFT-NUTZER.md) |
| Abgabe-Checkliste aus den Original-Briefs | [docs/SUBMISSION-CHECKLIST.md](docs/SUBMISSION-CHECKLIST.md) |
| Übergabe-Prompt für eine Orchestrator-Session | [docs/ORCHESTRATOR.md](docs/ORCHESTRATOR.md) |
| Teamboard (Übersicht, API, Aktualisieren) | [docs/TEAMBOARD.md](docs/TEAMBOARD.md) |
| Datenvertrag und App-Aufbau | [app/README.md](app/README.md) |
| Datei-Herkunft der Rohdaten | [data/MANIFEST.md](data/MANIFEST.md) |

## Arbeitsstil in diesem Projekt

Deutsch, knapp und direkt. Bei Entscheidungen 2 bis 3 Optionen mit Vor- und Nachteilen und einer klaren Empfehlung. Zahlen immer aus Skript oder Datei, nie aus dem Gedächtnis. Große Dateien (`graph_base.json` 26 MB, `slice.json` 1,5 MB) nie ganz in den Kontext laden, nur per Skript auswerten. Nach einer Arbeitseinheit `docs/STATUS.md` nachziehen (Skill `/constellate` macht das mit dem Teamboard zusammen).
