# 👥 Rollen & Tasks

> Prinzip: **Hanno hat die Tokens und baut den Kern.** Osman und Recep bekommen kleine, klar abgegrenzte Aufgaben mit festem Output-Format, die mit wenig AI-Budget gehen (Recherche, Kuration, Story, Ops, Testen). Jeder Task hat: Output, Ablageort, Deadline, Definition of Done. Übergabe über Dateien in `03_Build/`, nicht über Chat-Romane.

| Rolle | Wer | Verantwortung |
|---|---|---|
| **Tech Lead / Build** | Hanno | Pipeline, Graph, OpenAI-Integration, Frontend, Deploy, Tech-Video |
| **Ops & Daten-Kuration** | Osman | HackOS/Discord/Accounts, Repo & Vercel & Keys, Patientenorg-CSV, README, Reproduzierbarkeits-Test, Team-Video, QA als „Devon" |
| **Story & Evidenz** | Recep | Hero-Pfad fact-checken (PMIDs), Moonshot-Zahlen, Demo-Skript, Demo-Video + 1-min-Walkthrough, Pitch-Slides 10.10., QA als „Maria" |

---

## Osman

### O1 · Ops sofort (bis 20:30)
- HackOS: eigener Account, alle drei unter **Team & Submission** eintragen, Teamname „Constellate" (sobald Hanno ok gibt)
- Discord: Challenge-Ansage posten (Text unten)
- HackOS → **Credits & Codes**: OpenAI-Credits/Key holen, in `03_Build/.env.local` (nie committen) → an Hanno
- Vercel-Account (GitHub-Login), Hanno als Collaborator
- GitHub: Repo `constellate` (erst privat, So 11:00 public), Hanno + Recep als Admins
- **Done:** Screenshot „Team & Submission" mit 3 Namen in `04_Submission/`

Discord-Text (Klartext):
```
Team Constellate (Vienna Hub) · Challenge 05 Rare Disease Atlas (Buffalo × OpenAI).
We're building an evidence-graded knowledge graph for the lysosomal-storage cluster:
every edge carries source, date, confidence and counter-evidence, and the UI walks a
patient-group leader from her diagnosis to a reusable study design and a sourced partner proposal.
```

### O2 · Patientenorg-Kuration (20:30–23:30) · **wichtigster Osman-Task**
Datei: `03_Build/data/curated/orgs.csv`, UTF-8, Kopfzeile exakt:
```
org_name,url,country,disease_names,orpha_ids,has_registry,registry_url,has_natural_history_study,nhs_url,has_biobank,contact_url,notes,verified_date
```
- 25–35 Organisationen aus der Startliste in [DATA-SOURCES.md](../DATA-SOURCES.md), Website **selbst aufrufen**, nichts aus dem Gedächtnis
- `disease_names`: Freitext wie auf der Website (mehrere mit `;`), `orpha_ids` nur wenn auf der Seite oder bei Orphanet eindeutig gefunden, sonst leer (Reconcile macht den Rest)
- `has_registry` / `has_natural_history_study` / `has_biobank`: `yes` / `no` / `unknown`, URL nur wenn gesehen
- **Done:** ≥ 25 Zeilen, jede URL klickt (kurz `curl -I` oder im Browser), `verified_date=2026-10-03`

### O3 · README-Skelett + Lizenzen (23:30–02:00)
Datei: `03_Build/README.md` mit Abschnitten: What · Why (Maria in 3 Sätzen) · Live Demo (Link) · Architecture (Diagramm aus [ARCHITECTURE.md](../ARCHITECTURE.md), als Mermaid) · Reproduce the dataset (Platzhalter `make reproduce`, Hanno füllt Befehle) · Data sources & licenses (Tabelle aus 03_Datenquellen) · Evidence model (Tabelle Evidenzstufen) · Built with OpenAI (3 Stellen) · Limitations & honest gaps · Team.
**Done:** Markdown rendert auf GitHub ohne kaputte Tabellen.

### O4 · QA als Devon (06:00–08:00)
Live-URL durchklicken wie ein frisch Diagnostizierter ohne Vorwissen. 10 Suchbegriffe (Krankheit, Gen, Symptom auf Englisch, Tippfehler, etwas Nicht-Existentes). Jede Auffälligkeit eine Zeile in `03_Build/BUGS.md`: `[P1|P2|P3] Screen · Schritte · erwartet · gesehen`. P1 = Demo-Killer.

### O5 · Reproduzierbarkeits-Test (08:00–11:00)
Frischer Clone in ein neues Verzeichnis, nur README befolgen: `make reproduce` + `make dev`. Jede Stelle, wo du raten musstest, als Zeile ins README (oder in BUGS.md für Hanno). **Done:** Graph baut sich auf deinem Rechner aus den Rohquellen.

### O6 · Team-Video (12:00–13:00, 60–90 s)
Drei Gesichter, je 20 s: Name, Rolle, ein Satz „warum C5". Handy, Querformat, ruhiger Hintergrund. Skript in [VIDEOS.md](VIDEOS.md). Upload als unlisted YouTube oder Google Drive-Link (was HackOS akzeptiert, vorher prüfen!).

---

## Recep

### R1 · Hero-Pfad fact-checken (bis 23:30) · **wichtigster Recep-Task**
Datei: `03_Build/data/curated/hero_path.yaml`. Für jede Zeile der Hero-Journey in [SCOPE.md](../SCOPE.md) (Schritte 1–10) **eine Primärquelle mit Link**: PMID oder PMC-ID, OMIM-Eintrag, EMA-EPAR/FDA-Label, ClinicalTrials-NCT, Orphanet-Seite. Nichts aus ChatGPT-Gedächtnis übernehmen, jeden Link öffnen. Besonders prüfen:
- PSAP: Saposin-A-Mangel ↔ Krabbe-Phänotyp, Saposin B ↔ MLD, Saposin C ↔ Gaucher (OMIM-Nummern)
- Libmeldy/Lenmeldy-Zulassung: Natural-History-Kohorte als Vergleichsarm (EPAR / FDA Summary Basis of Approval / Publikation)
- Krabbe: aktuell **keine** zugelassene medikamentöse Therapie? Gentherapie-Trial (NCT-Nummer)?
- GMFC-MLD-Skala (Publikation)
- MLD Natural History Study (Publikation/Register), Krabbe Newborn Screening (welche US-Staaten, Quelle)
- Pelizaeus-Merzbacher als Gegenbeispiel: Hypomyelinisierung vs. Demyelinisierung (Quelle)
- Ein KOL, der zu Krabbe **und** MLD publiziert (PubMed-Autorensuche, 2 PMIDs je Krankheit)
Format je Eintrag: `step: 4`, `claim: "…"`, `source_type: OMIM|PMID|EMA|FDA|NCT|ORPHA`, `id: "…"`, `url: "…"`, `snippet: "wörtliches Zitat ≤ 40 Wörter"`, `confidence: high|medium|low`, `note: "…"`.
**Done:** alle 10 Schritte belegt oder als `UNBELEGT` markiert (das ist auch ein Ergebnis, dann ändern wir den Pfad).

### R2 · Moonshot-Zahlen (23:30–02:00)
Datei: `docs/MOONSHOT.md`. Meilenstein: gemeinsame Natural-History-Studie. Brauche mit Quelle: typische Dauer von Patientengruppen-Gründung bis NHS-Start bei seltenen Erkrankungen · typische NHS-Rekrutierungsdauer · Beispiel, wo ein NHS als externer Kontrollarm eine Zulassung getragen hat (MLD, evtl. weitere) · Kosten/Dauer eines NHS-Designs · wie viele LSD-Gruppen es grob gibt. Dann eine Tabelle „heute vs. mit Constellate" und **4–6 explizite Annahmen**. Kein Marketing, lieber „3–5×, wenn Annahme X hält".

### R3 · Demo-Skript v1 (02:00 oder morgens, 06:00–08:00)
Datei: `04_Submission/Demo-Skript.md`, Struktur in [VIDEOS.md](VIDEOS.md). Nach dem QA-Durchlauf als „Maria" an die echte UI anpassen (echte Button-Namen, echte Klickreihenfolge). Beim QA Bugs in `03_Build/BUGS.md` wie Osman.

### R4 · Pitch-Slides 10.10. (08:00–11:00, 5 Slides)
Google Slides / Keynote: Problem (Maria) · Was Constellate macht (1 Screenshot) · Evidenzmodell · Moonshot-Timeline · Was als Nächstes validiert wird. Nur für den Fall Top 2. Ablage `04_Submission/Pitch/`.

### R5 · Demo-Video (2 min) + 1-min-Walkthrough (12:00–14:00)
Screen-Recording der Live-URL (QuickTime / OBS), Voice-over auf Englisch, ruhig. Walkthrough = exakt die Maria-Journey, **ohne** Schnitt-Spielereien. Upload wie O6.

---

## Hanno

| Block | Was | Done-Kriterium |
|---|---|---|
| 19:45–20:30 | Repo-Skeleton (Makefile, `pipeline/pyproject.toml` via uv, `app/` via `create-next-app`), `.env.example` | `make dev` startet leere App |
| 20:30–23:30 | `01_fetch.py` (Downloads + Cache + MANIFEST), `02_slice.py` (MONDO-Subtree 0002561 + Nachbarn via gemeinsame Gene/Phänotype), `03_build_graph.py` (Nodes/Edges/Evidence aus HPO + Orphanet + MONDO) | `data/graph.json` mit Krankheit–Gen–Phänotyp, Krabbe→GALC drin |
| 23:30–02:00 | Next.js: Suche (Fuse) → Ego-Graph (react-force-graph-2d) → Edge-Panel; Vercel-Deploy | Live-URL zeigt Krabbe-Ego-Netz mit klickbarer Kante |
| 02:00–04:00 | `04_enrich_apis.py` (Trials, RePORTER, Europe PMC, Open Targets, Reactome, mygene), `05_openai_extract.py`, `06_openai_reconcile.py` (orgs.csv → MONDO) | Kanten `studied_in`, `funded_by`, `in_pathway`, `advocated_by`, `text_mined`-Claims mit PMID |
| 04:00–06:00 | `07_analytics.py` (IC-Ähnlichkeit, Pathway-Jaccard, Louvain, Gegenbeispiele, KOL-Overlap, Coverage) · `/api/explain` streaming · Action Card · Honest-Gap-Screen | **E2E: Krabbe → PSAP → MLD → Action Card live, Devon-Gap live** |
| 06:00–08:00 | Schlaf | |
| 08:00–11:00 | BUGS.md P1/P2, Persona-Linse, Gegenevidenz-Anzeige, Moonshot-Panel, `/api/resolve`, Kantenstil nach Evidenzstufe | keine P1 offen |
| 11:00–12:00 | Freeze-Vorbereitung: Seeds fixieren, `make reproduce` final, Repo public | 🔒 |
| 12:00–13:30 | Tech-Video (3 min, Skript in 05_Videos) | hochgeladen |
| 13:30–14:30 | Submission HackOS + Google Form + Backup | Bestätigung gespeichert |

Fallback-Reihenfolge, wenn die Zeit knapp wird: (1) Extract raus, (2) Reconcile → Fuzzy-Match, (3) Persona-Linse raus, (4) Louvain → nur Top-k-Nachbarn. **Niemals raus:** Evidenz-Panel, Action Card, Honest Gap, Explain.

---

## Update Sa 22:00

Seit dem Kickoff hat sich die Arbeitsteilung bei O2 und R1 geändert: Entwürfe kommen von einem Agent, Osman und Recep **prüfen und übertragen**, statt bei null anzufangen. Die Done-Kriterien bleiben, geprüft wird weiter nur, was selbst geöffnet wurde.

- **O2 (Osman):** `data/curated/orgs_draft.csv` (Entwurf, 40 Zeilen) und `data/curated/orgs_CHECK.md` (Prüfliste) kommen von einem Agent. Osman öffnet jede Org-Seite selbst, korrigiert die Zeile, wenn sie nicht stimmt, und überträgt nur **geprüfte** Zeilen nach `data/curated/orgs.csv` mit `verified_date`. Ins Produkt kommt ausschließlich `orgs.csv`; der Entwurf bleibt Entwurf. Done unverändert: mindestens 25 Zeilen, jede URL klickt.
- **R1 (Recep):** `data/curated/hero_path_draft.yaml` (66 Einträge, alle `status: DRAFT`) und `data/curated/hero_path_CHECK.md` liegen bereit. Recep prüft **Block A** (17 Pflicht-Einträge, ca. 15 Minuten: Seiten, die ein Bot nicht lesen konnte, und Negativ-Belege) und die Stichprobe aus Block B (E13, E26, E29, E30, E36, E47). Was passt, bekommt `status: VERIFIED` und wird nach `data/curated/hero_path.yaml` übernommen; was nicht passt, bleibt DRAFT und geht als Notiz an Hanno.
- **Übergabe ohne Git:** Solange der GitHub-Zugang offen ist, geben Osman und Recep ihre Ergebnisse über das Teamboard ab (Notizen und Datei-Ablage, siehe [TEAMBOARD.md](TEAMBOARD.md)). Hanno bzw. der Orchestrator prüft das Format und committet. Sobald der Zugang steht, gilt wieder der Git-Workflow aus [WORKFLOW.md](WORKFLOW.md).
- Stand und Blocker: [STATUS.md](STATUS.md).
