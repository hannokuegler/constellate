# Prompt · OpenAI-Daten-Session (Codex)

Für eine leere OpenAI-Coding-Session im geklonten Repo. Stand Sa 03.10.2026, 22:40 Wien.

---

Du bist der **Daten-Orchestrator** für Constellate, einen evidenzgestuften Wissensgraphen für seltene Erkrankungen (Hack-Nation 7th Global AI Hackathon, Challenge 05 „AI Atlas for the World's Rare Diseases“, Buffalo Initiative × OpenAI). Abgabe ist So 04.10.2026, 15:00 Wien, Feature-Freeze 12:00. **Dein Auftrag:** die fehlenden Daten aus dem Internet ziehen, prüfen, sauber und reproduzierbar ablegen und die Daten-Doku aktualisieren. Du arbeitest im geklonten Repo. Parallel arbeitet eine andere Session (Claude) an der App und an `pipeline/07_analytics.py` auf `main`. Halte dich deshalb strikt an deinen Schreibbereich.

## 0 · Regeln (nicht verhandelbar)
1. **Primärquellen-Pflicht.** Jeder Datensatz trägt Quelle (DB + ID), URL, Abrufdatum und, wo es um eine Aussage geht, ein **wörtliches Snippet** aus der abgerufenen Seite oder dem Abstract. Das Snippet muss maschinell als Teilstring im abgerufenen Text bestätigt sein. **Nichts aus Modellwissen.** Was nicht belegbar ist, bekommt `status: UNBELEGT` und erscheint als Lücke; das ist ein gewolltes Ergebnis.
2. **Evidenzstufen exakt wie im Repo:**
   - `observed`: klinisch beobachtet, mit Primärquelle
   - `curated`: Experten-Datenbank, Register, EMA/FDA, ClinicalTrials.gov-Record
   - `text_mined`: LLM-extrahiert, mit PMID und Snippet
   - `inferred`: von uns berechnet, Formel steht im Snippet
   Nie hochstufen. Jede Kante hat `contradicting: []`.
3. **Format wie in `pipeline/03_build_graph.py`:**
   - Kanten-ID `e_` + sha1(f"{source}|{target}|{type}")[:12]
   - je Beleg `db, origin, record, url, level, date, confidence, snippet`, dazu `retrieved` (Abrufdatum)
4. **Lizenzen und Recht:**
   - nur offene Quellen und öffentliche Seiten, `robots.txt` respektieren
   - **OMIM nicht scrapen** (Lizenz), OMIM nur indirekt über HPO
   - Lizenz jeder neuen Quelle in der Doku festhalten
5. **Git:**
   - Arbeite auf Branch `data-v2` (`git switch -c data-v2`), **nie auf main**, nie force-push.
   - Commit-Präfixe `pipeline:` / `data:` / `docs:`, keine Co-Authored-By-Trailer.
   - Am Ende Branch pushen und einen PR gegen main öffnen.
6. **Schreibbereich, nur hier darfst du ändern:**
   - `pipeline/04b_enrich_extra.py` (neu)
   - `pipeline/enrich_extra/` (neu)
   - `pipeline/tests/test_enrich_extra.py` (neu)
   - `data/curated/assets.csv` (neu)
   - `data/enrich/*` (gitignored)
   - `data/MANIFEST.md`, `docs/DATA-SOURCES.md`, `docs/DATA-REPORT.md` (neu)
   - `Makefile`: nur das neue Target `enrich-extra`
   - `pipeline/pyproject.toml` / `uv.lock`: nur neue Pakete
   **Nicht anfassen:** `app/`, `pipeline/01–07`, `pipeline/validate.py`, `CLAUDE.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/HANDOVER.md`.
7. **Keine Secrets ins Repo.** Ab So 11:00 ist das Repo öffentlich. Keys nur aus der Env. Keine privaten Daten, keine Patientendaten.
8. Ausführen immer mit `uv run --project pipeline python …`. Große JSONs (`data/graph_base.json` ~30 MB, `data/slice.json`) nie komplett in den Kontext laden, nur per Skript auswerten.

## 1 · Zuerst lesen
`CLAUDE.md` · `docs/STATUS.md` · `docs/DATA-SOURCES.md` · `data/MANIFEST.md` · `docs/ARCHITECTURE.md` (Datenmodell, Evidenzstufen) · `docs/briefing/TECHNIK.md` (Abschnitte 3–5, „Die Lücke“) · `docs/MEDICAL-BACKGROUND.md` (geprüfter Faktenstand inkl. Quellen) · `docs/SCOPE.md` (Hero-Journey Krabbe → GALC/PSAP → MLD → Gentherapie/Natural-History-Studie → Action Card) · `app/README.md` (Datenvertrag) · `pipeline/03_build_graph.py`, `pipeline/04_enrich_apis.py`, `pipeline/enrich/*.py` (wiederverwenden: `http.py` mit Retry/Rate-Limit/Cache, `diseases.py` mit Scope und Suchbegriffen).

## 2 · Phase A: lokalen Stand rekonstruieren und Reproduzierbarkeit prüfen (ca. 30 min)
Rohdaten und Caches sind gitignored und fehlen im frischen Clone.
1. `cd pipeline && uv sync && cd ..`
2. `make fetch slice build`: 8 Bulk-Quellen (HPO, MONDO, Orphanet), ca. 330 MB
3. `make enrich`: ClinicalTrials.gov, Europe PMC, NIH RePORTER, Open Targets, mygene, Reactome, ClinVar; ohne Cache ca. 12 min, RePORTER mit 1 req/s
4. `make analytics && make validate`
5. **Reproduzierbarkeits-Check:** `git status` bzw. `git diff --stat app/public/data`. Erwartet wird: Unterschiede höchstens bei `built_at` in `meta.json`, plus Unterschiede, die erklärbar sind, weil sich die Quellen seit dem 03.10. geändert haben. Ergebnis in `docs/DATA-REPORT.md` notieren. **Die Exporte unter `app/public/data` danach NICHT committen.** Mit `git restore app/public/data` zurücksetzen; die gehören der anderen Session.

## 3 · Phase B: die Datenlücken schließen (Priorität absteigend)
Baue alles als `pipeline/04b_enrich_extra.py` mit Modulen in `pipeline/enrich_extra/`, CLI analog zu 04 (`--sources …`, `--scope hero|core`, `--limit`). Disk-Cache unter `data/cache/extra/`, ein zweiter Lauf muss ohne Netz durchgehen. Output nach `data/enrich/extra_*.jsonl` und `data/enrich/extra_edges.json` (`{edges, nodes}`, Format wie `data/enrich/edges_draft.json`). Hero-Krankheiten zuerst (Krabbe, MLD, Gaucher, Pelizaeus-Merzbacher, PSAP-Defizienzen), dann die 350 Kern-Krankheiten.

**B1 · Assets: Natural-History-Studien, Register, Outcome-Skalen, Newborn Screening. Wichtigste Lücke, sie trägt die Action Card.**
- **Natural-History-Studien und Register:** ClinicalTrials.gov API v2. Beobachtungsstudien je Kern-Krankheit, deren Titel oder Design „natural history“, „registry“ oder „longitudinal“ enthält. Je Studie: NCT, Titel, Sponsor, Status, Start/Ende, Enrollment, Outcome-Measures (Namen), Conditions. Redirects auflösen (Beispiel: NCT04693598 → NCT05739643) und Aliase mitführen.
- **Outcome-Skalen** (z. B. GMFC-MLD, PMID 21707604): aus den Outcome-Measures der Studien und den Europe-PMC-Abstracts (`data/enrich/europepmc.jsonl`). Nur mit Snippet.
- **Newborn Screening:** je Krankheit, wo eine offizielle Quelle es belegt (US-RUSP/HRSA, nationale Programme wie Österreich MedUni Wien, Deutschland, Italien, Norwegen). Für Krabbe/MLD stehen Startpunkte in `docs/MEDICAL-BACKGROUND.md` §3/§4. Status je Land: `screened` | `pilot/research` | `not screened` | `UNBELEGT`.
- **Kuratierte Tabelle `data/curated/assets.csv`:** Spalten `asset_id,asset_type(natural_history_study|registry|outcome_scale|newborn_screening|biobank),name,disease_mondo,disease_label,country,status,source_type(NCT|PMID|EMA|FDA|URL|ORPHA),source_id,url,snippet,retrieved,check(machine|UNBELEGT),notes`
- **Kanten:**
  - `has_asset` (Krankheit → `ASSET:<id>`), level `curated`
  - `screened_in` (Krankheit → `COUNTRY:<iso>`), level `curated`, mit Status im Snippet

**B2 · Zugelassene Therapien.**
- **EMA:** Medicines-Daten als offizieller Download auf ema.europa.eu („Download medicine data“, EPAR-Tabelle). Orphan- und Zulassungsstatus, Wirkstoff, Indikation.
- **FDA:** openFDA (`api.fda.gov/drug/label.json`, Indikations-Text) und/oder Drugs@FDA. Gegen Kern-Krankheiten matchen: exakter Name oder Synonym im Indikations-Text, Snippet = Indikationssatz.
- **Kanten:** `approved_therapy` (Krankheit → `DRUG:<name>`), level `curated`, mit Datum der Zulassung. Für die Hero-Story ist Pflicht: Libmeldy (EMA 17.12.2020) und Lenmeldy (FDA 18.03.2024) für MLD. Für Krabbe soll **keine** Zulassung herauskommen. Taucht doch eine auf: stoppen und melden.

**B3 · Prävalenz.** `data/raw/en_product9_prev.xml` ist schon geladen und noch ungenutzt. Parsen nach `data/enrich/extra_prevalence.jsonl`: ORPHA → MONDO (über `data/slice.json` xrefs), Prävalenztyp, Klasse bzw. Wert, Region, Validierungsstatus, Quelle. Daraus wird ein Knoten-Attribut, keine Kante.

**B4 · Forschenden-Netzwerk (KOL-Overlap).**
- **Personen:** aus `data/enrich/europepmc.jsonl` (Autoren mit ORCID und Affiliation), `data/enrich/reporter.jsonl` (PIs) und ClinicalTrials.gov (Overall Officials).
- **Disambiguierung konservativ:** ORCID zuerst. Ohne ORCID nur bei exakt gleichem vollen Namen **und** gleicher Institution. Im Zweifel getrennt lassen.
- **Output:** `data/enrich/extra_people.jsonl` und `extra_kol_overlap.json` mit Personen, die bei ≥ 2 Kern-Krankheiten aktiv sind. Je Krankheit die Belege (PMIDs, Grant-IDs, NCTs).
- **Kanten:**
  - `authored_by` bzw. `investigator_of`, level `curated`, weil aus Metadaten
  - `kol_overlap` (Krankheit ↔ Krankheit), level `inferred`, Formel im Snippet (Anzahl gemeinsamer Personen, Namen, Beleg-IDs)
- **Erwartete Stichprobe:** Escolar, Kurtzberg und Krägeloh-Mann verbinden Krabbe und MLD (PMIDs 15901860, 23348427, 32912261, 21707604). Fehlt das, Ursache melden.

**B5 · Cross-Check der Ähnlichkeit.** Für die Top-50-Krankheitspaare aus `app/public/data/core.json` (`similar_phenotype`) die Monarch-API v3 `semsim/compare/<MONDO>/<MONDO>` abfragen. Spearman-Korrelation zu unserem simGIC in `docs/DATA-REPORT.md` berichten. Das ist Validierung, keine neue Kante.

**B6 · Coverage-Audit gegen falsche Lücken.** Für Kern-Krankheiten mit 0 Trials, 0 Grants oder 0 Papers in `data/enrich/coverage.jsonl` alternative Suchbegriffe probieren: Orphanet-Synonyme aus `en_product1.xml`, MONDO-Synonyme, OMIM-Titel aus HPO. Ergebnis als `data/enrich/extra_coverage_audit.jsonl`, mit welchem Begriff wie viele Treffer kamen. Bleibt es bei 0, ist das eine echte Lücke; so markieren.

**B7 · Nur wenn `OPENAI_API_KEY` in der Env ist: Extract.**
1. `uv run --project pipeline python pipeline/openai_config.py --list`
2. Modell-IDs aus der Liste wählen, **nicht raten**. Orientierung in `docs/RESOURCES.md` §1: Volumen-Modell für Extract und Judge, dazu ein Embedding-Modell.
3. Die IDs nur als Env setzen, nicht committen.
4. `make extract` mit `--limit 20`, dann `uv run --project pipeline python pipeline/extract_sample.py`, dann Scope hero.
5. Annahme- und Ablehnungsquote sowie Kosten in `docs/DATA-REPORT.md`.
Diese Dateien gehören zum Code der anderen Session. Nur ausführen, nicht ändern.

## 4 · Phase C: prüfen, dokumentieren, übergeben
1. **Tests** `pipeline/tests/test_enrich_extra.py`: Format- und ID-Regeln, Snippet-Teilstring-Check, Level-Regeln, Disambiguierung (zwei gleichnamige Personen mit verschiedener Institution bleiben getrennt), Determinismus (zwei Läufe ergeben byte-identische Outputs).
2. **`data/MANIFEST.md`:** neue Bulk-Dateien mit URL, Datum, Größe und sha256, dazu eine Tabelle der API-Quellen (Endpoint, Query-Parameter, Abrufdatum, Records).
3. **`docs/DATA-SOURCES.md`:** neue Quellen mit Zweck, Endpoint, Lizenz, Rate-Limit, Status und Prüfdatum.
4. **`docs/DATA-REPORT.md` (neu):**
   - Ergebnis von Phase A
   - Tabelle Quelle → Records → Kanten → Laufzeit
   - Hero-Stichprobe Krabbe/MLD/PMD (Assets, Therapien, NBS, KOL)
   - Lücken, die bewusst Lücken bleiben
   - offene Punkte
   - **Integrations-Anleitung für 07**: Dateinamen, Felder, welche Kantentypen in Disease-Shards gehören. 07 baut die andere Session ein.
5. Commits auf `data-v2`, Branch pushen, PR gegen main mit Zusammenfassung (Zahlen, Hero-Stichprobe, Lücken, Integrationsschritte). Wenn `gh` nicht verfügbar ist, die PR-Beschreibung in `docs/DATA-REPORT.md` ablegen und den Branch pushen.

## 5 · Zeit und Rückmeldung
Zwischenstand spätestens **So 02:00**, fertig spätestens **So 05:00**. Pro Phase einen Commit. Lieber B1–B3 sauber als alles halb. Schlussmeldung in 15 Zeilen: Branch/PR, Zahlen je Quelle, Hero-Stichprobe, Lücken, was die Claude-Session in 07 integrieren muss.
