# Prompt · lokale Daten-Session (Hannos Mac, freies Netz)

In eine neue lokale Claude-Code-Session im Repo `constellate` kopieren (alles unter der Linie). Grund: Die Cloud-Umgebung erreicht nur GitHub und PyPI, alle Datenhosts liefern 403. Stand Sa 03.10.2026, 23:40 Wien.

---

Du bist die Daten-Session für Constellate, einen evidenzgestuften Wissensgraphen für seltene Erkrankungen (Hack-Nation 7th Global AI Hackathon, Challenge 05 "AI Atlas for the World's Rare Diseases", Buffalo Initiative x OpenAI). Abgabe So 04.10.2026 15:00 Wien, Feature-Freeze 12:00. Zwischenstand spätestens So 02:00, fertig spätestens So 05:00 (Uhrzeit immer mit `TZ=Europe/Vienna date`). Lieber B1 bis B3 sauber als alles halb. Deutsch, knapp.

Dein Auftrag: die fehlenden Daten aus dem Internet ziehen, prüfen, sauber und reproduzierbar ablegen und die Daten-Doku aktualisieren. Parallel arbeiten Cloud-Sessions an `app/` und `pipeline/07_analytics.py`. Halte dich strikt an deinen Schreibbereich.

## Start

```bash
git fetch origin
git switch data-v2 2>/dev/null || git switch -c data-v2 --track origin/data-v2
git pull --rebase
```

Auf `data-v2` liegt schon:
- `2b14b1f` (Recep): `pipeline/enrich_extra/{__init__,common,assets,people,prevalence,reproduce}.py`, ca. 2.300 Zeilen. Offline geprüft, alle Module importieren, Schnittstellen zu `enrich.ctgov`, `diseases`, `europepmc` stimmen. **Verwerten statt neu schreiben**, aber mit Netz verifizieren (NCT-Alias, Prävalenz-XML-Format, NBS-Regex in `assets.py`).
- `ef9b494`: Fix `check_robots`-Alias in `common.py` und `docs/DATA-REPORT.md` mit dem Cloud-Netzblocker (diesen Abschnitt durch echte Ergebnisse ersetzen).
- Es fehlen: `pipeline/04b_enrich_extra.py`, Therapien (B2), NBS-Daten, Monarch (B5), Coverage-Audit (B6), `pipeline/tests/test_enrich_extra.py`, `data/curated/assets.csv`, MANIFEST und DATA-SOURCES.

Produktentscheidungen (Hanno, `docs/DECISIONS.md` P1 bis P8): eine Mutter in zwei Momenten (frisch diagnostiziert, später Gruppenleiterin); Side-Feature offene Studien mit Ländern, Standorten, Alter und Link zum offiziellen Studienkontakt. Die offenen **Interventions**studien macht schon `pipeline/08_trial_details.py` (Branch `claude/friendly-heisenberg-bh6pfd`, geht nach `main`). Nicht duplizieren: dein B1 sind Beobachtungs-, Natural-History- und Register-Studien als wiederverwendbare Assets. UI ist Englisch, Snippets bleiben wörtlich in Quellsprache.

## Regeln

1. Primärquellen-Pflicht: Jeder Datensatz trägt Quelle (DB + ID), URL, Abrufdatum und, wo es um eine Aussage geht, ein wörtliches Snippet aus der abgerufenen Seite oder dem Abstract. Das Snippet wird maschinell als Teilstring geprüft. Nichts aus Modellwissen. Was nicht belegbar ist, bekommt status UNBELEGT und wird als Lücke gezeigt; das ist ein gewolltes Ergebnis.
2. Evidenzstufen wie im Repo: observed = klinisch beobachtet, mit Primärquelle · curated = Datenbank, Register, EMA/FDA, ClinicalTrials.gov · text_mined = LLM-extrahiert, mit PMID und Snippet · inferred = von uns berechnet, Formel im Snippet. Nie hochstufen. Jede Kante hat `contradicting: []`.
3. Format wie `pipeline/03_build_graph.py`: Kanten-ID `"e_" + sha1(f"{source}|{target}|{type}")[:12]`, je Beleg db, origin, record, url, level, date, confidence, snippet, retrieved.
4. Nur offene Quellen und öffentliche Seiten, robots.txt respektieren, OMIM nicht scrapen. Lizenz jeder neuen Quelle dokumentieren.
5. Git: nur Branch `data-v2`, nie `main`, nie force-push, vor jedem Push `git pull --rebase`. Commit-Präfixe `pipeline:` / `data:` / `docs:`, ein Satz, **keine Co-Authored-By-Trailer**, keine AI-Attribution. Nur eigene Dateien stagen, nie `git add .`. Je Phase ein Commit. Am Ende Branch pushen und PR gegen `main` öffnen (`gh pr create`); ohne gh die PR-Beschreibung in `docs/DATA-REPORT.md`.
6. Schreibbereich, nur hier ändern:
   - `pipeline/04b_enrich_extra.py`, `pipeline/enrich_extra/`, `pipeline/tests/test_enrich_extra.py`
   - `data/curated/assets.csv`, `data/enrich/*` (gitignored)
   - `data/MANIFEST.md`, `docs/DATA-SOURCES.md`, `docs/DATA-REPORT.md`
   - `Makefile`: nur das neue Target `enrich-extra`
   - `pipeline/pyproject.toml` und `uv.lock`: nur neue Pakete

   Nicht anfassen: `app/`, `pipeline/01` bis `08`, `pipeline/validate.py`, `CLAUDE.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/HANDOVER.md`.
7. Keine Secrets, privaten Mailadressen oder Server-Interna ins Repo (ab So 11:00 public). Keys nur aus der Env. Von Personen keine Mailadressen speichern.
8. Ausführen mit `uv run --project pipeline python ...`. `data/graph_base.json` (30 MB) und `data/slice.json` nie komplett in den Kontext laden, nur per Skript auswerten.

## Zuerst lesen

`CLAUDE.md`, `docs/STATUS.md`, `docs/DATA-SOURCES.md`, `data/MANIFEST.md`, `docs/ARCHITECTURE.md`, `docs/briefing/TECHNIK.md` (Abschnitte 3 bis 5), `docs/MEDICAL-BACKGROUND.md`, `docs/SCOPE.md`, `app/README.md` (Datenvertrag), `pipeline/03_build_graph.py`, `pipeline/04_enrich_apis.py`, `pipeline/enrich/*.py`. Wiederverwenden: `http.py` (Retry, Rate-Limit, Cache), `diseases.py` (Scope, Suchbegriffe), `edges.py` (Draft, edge_id).

## Phase A: lokalen Stand rekonstruieren, Reproduzierbarkeit prüfen (ca. 40 min)

1. `cd pipeline && uv sync && cd ..`
2. `make fetch slice build` (8 Bulk-Quellen, ca. 330 MB)
3. `make enrich` (ohne Cache ca. 12 min)
4. `make analytics && make validate`
5. `git diff --stat app/public/data`. Erwartet: Unterschiede höchstens bei built_at plus erklärbare Änderungen, weil sich Quellen seit dem 03.10. geändert haben. Ergebnis in `docs/DATA-REPORT.md`.
6. Danach `git restore app/public/data`. Die Exporte gehören der App-Session, NICHT committen.

## Phase B: Datenlücken schließen

Alles als `pipeline/04b_enrich_extra.py` mit Modulen in `pipeline/enrich_extra/`, CLI analog zu 04 (`--sources`, `--scope hero|core`, `--limit`). Cache unter `data/cache/extra/`; ein zweiter Lauf muss ohne Netz durchgehen. Output: `data/enrich/extra_*.jsonl` und `data/enrich/extra_edges.json` (`{edges, nodes}`, Format wie `data/enrich/edges_draft.json`). Zuerst die Hero-Krankheiten (Krabbe MONDO:0009499, MLD, Gaucher, Pelizaeus-Merzbacher, PSAP-Defizienzen), dann die 350 Kern-Krankheiten.

**B1 Assets** (wichtigste Lücke, trägt die Action Card)
- ClinicalTrials.gov API v2: Beobachtungsstudien je Kern-Krankheit mit "natural history", "registry" oder "longitudinal" in Titel oder Design. Je Studie NCT, Titel, Sponsor, Status, Start/Ende, Enrollment, Outcome-Measures. Redirects auflösen (z. B. NCT04693598 -> NCT05739643) und Aliase mitführen.
- Outcome-Skalen wie GMFC-MLD (PMID 21707604) aus Outcome-Measures und `data/enrich/europepmc.jsonl`, nur mit Snippet.
- Newborn Screening je Land, nur mit offizieller Quelle (US RUSP/HRSA, MedUni Wien, Deutschland, Italien, Norwegen). Startpunkte in MEDICAL-BACKGROUND §3/§4. Status: screened | pilot/research | not screened | UNBELEGT.
- `data/curated/assets.csv` mit den Spalten: asset_id, asset_type (natural_history_study|registry|outcome_scale|newborn_screening|biobank), name, disease_mondo, disease_label, country, status, source_type (NCT|PMID|EMA|FDA|URL|ORPHA), source_id, url, snippet, retrieved, check (machine|UNBELEGT), notes
- Kanten: has_asset (Krankheit -> ASSET:<id>, curated) und screened_in (Krankheit -> COUNTRY:<iso>, curated, Status im Snippet).

**B2 Zugelassene Therapien**
- EMA: offizieller Download "Download medicine data" (EPAR-Tabelle) auf ema.europa.eu.
- FDA: openFDA api.fda.gov/drug/label.json (Indikationstext) und/oder Drugs@FDA.
- Matching gegen Kern-Krankheiten über Name/Synonym im Indikationstext; Snippet = Indikationssatz.
- Kante approved_therapy (Krankheit -> DRUG:<name>, curated, mit Zulassungsdatum).
- Pflicht: Libmeldy (EMA 17.12.2020) und Lenmeldy (FDA 18.03.2024) für MLD. Für Krabbe darf keine Zulassung herauskommen; taucht doch eine auf, stoppen und melden.

**B3 Prävalenz:** `data/raw/en_product9_prev.xml` parsen nach `data/enrich/extra_prevalence.jsonl` (ORPHA -> MONDO über die xrefs in `data/slice.json`; Typ, Klasse/Wert, Region, Validierung, Quelle). Knoten-Attribut, keine Kante.

**B4 Forschenden-Netzwerk** (Receps `people.py` prüfen und nutzen)
- Personen aus `europepmc.jsonl` (ORCID, Affiliation), `reporter.jsonl` (PIs) und ClinicalTrials.gov (Overall Officials).
- Disambiguierung konservativ: ORCID zuerst. Sonst nur bei exakt gleichem vollen Namen UND gleicher Institution. Im Zweifel getrennt lassen.
- Output: `data/enrich/extra_people.jsonl` und `extra_kol_overlap.json` (Personen, die bei mindestens 2 Kern-Krankheiten aktiv sind, mit Beleg-IDs).
- Kanten: authored_by / investigator_of (curated) und kol_overlap Krankheit <-> Krankheit (inferred, Formel im Snippet).
- Stichprobe: Escolar, Kurtzberg und Krägeloh-Mann müssen Krabbe und MLD verbinden (PMIDs 15901860, 23348427, 32912261, 21707604). Wenn nicht, Ursache melden.

**B5 Cross-Check der Ähnlichkeit:** Für die Top-50-Paare similar_phenotype aus `app/public/data/core.json` die Monarch API v3 `semsim/compare/<MONDO>/<MONDO>` abfragen. Spearman-Korrelation zu unserem simGIC in `docs/DATA-REPORT.md`. Nur Validierung, keine Kanten. (Die Zahl wird eine der Metriken für die Jury.)

**B6 Coverage-Audit:** Für Kern-Krankheiten mit 0 Trials, 0 Grants oder 0 Papers in `data/enrich/coverage.jsonl` alternative Suchbegriffe probieren (Orphanet-Synonyme aus `en_product1.xml`, MONDO-Synonyme, OMIM-Titel aus HPO). Ergebnis nach `data/enrich/extra_coverage_audit.jsonl`. Bleibt es bei 0, ist es eine echte Lücke und wird so markiert.

**B7 Nur wenn `OPENAI_API_KEY` in der Env ist**
1. `uv run --project pipeline python pipeline/openai_config.py --list`
2. Modell-IDs aus der Liste wählen, nicht raten (Orientierung: `docs/RESOURCES.md` §1). Volumen-Modell für Extract und Judge, dazu ein Embedding-Modell. Nur als Env setzen, Wahl an Hanno melden (D7).
3. `make extract` mit `--limit 20`, dann `pipeline/extract_sample.py`, dann Scope hero.
4. Annahmequote und Kosten in `docs/DATA-REPORT.md`.

Diese Skripte nur ausführen, nicht ändern.

## Phase C: prüfen, dokumentieren, übergeben

1. `pipeline/tests/test_enrich_extra.py`: Format- und ID-Regeln, Snippet-Teilstring-Check, Level-Regeln, Disambiguierung (zwei Gleichnamige an verschiedenen Instituten bleiben getrennt), Determinismus (zwei Läufe byte-identisch). Muss grün sein.
2. `data/MANIFEST.md`: neue Bulk-Dateien mit URL, Datum, Größe und sha256, dazu eine Tabelle der API-Quellen (Endpoint, Query, Abrufdatum, Records).
3. `docs/DATA-SOURCES.md`: neue Quellen mit Zweck, Endpoint, Lizenz, Rate-Limit und Prüfdatum.
4. `docs/DATA-REPORT.md`:
   - Ergebnis Phase A
   - Tabelle Quelle -> Records -> Kanten -> Laufzeit
   - Hero-Stichprobe Krabbe/MLD/PMD (Assets, Therapien, NBS, KOL)
   - bewusste Lücken
   - Integrations-Anleitung für 07: Dateien, Felder, welche Kantentypen in die Disease-Shards gehören. Den Einbau macht die Cloud-Session.
5. Je Phase ein Commit auf `data-v2`, Branch pushen, PR gegen `main` mit Zahlen, Stichprobe, Lücken und Integrationsschritten.

## Phase D (optional, nur wenn B1 bis B3 fertig sind und vor 05:00)

Die Studien-Shards für die Karte "open studies" erzeugen. Dazu in einem **eigenen** Worktree auf Branch `data-trials` von `main` (nachdem `claude/friendly-heisenberg-bh6pfd` gemergt ist): `make trials && make validate`, dann nur `app/public/data/trial/` committen (`data: open-study shards (countries, sites, eligibility) from ClinicalTrials.gov`) und pushen. Kein PR, die Cloud-Session prüft und merged.

## Endbericht (max. 15 Zeilen)

Branch/PR-URL, Zahlen je Quelle (Records/Kanten), Hero-Stichprobe Krabbe/MLD/PMD, Testergebnis, Lücken, was in 07 integriert werden muss, was von Receps Code übernommen oder verworfen wurde.
