# Prompt · Data Manager (lokale Session auf Hannos Mac, freies Netz)

In eine neue lokale Claude-Code-Session im Repo `constellate` kopieren (alles unter der Linie). Grund: Die Prüfungen brauchen `data/enrich/extra_*` und `data/raw/`, die nur lokal liegen (gitignored). Der Review steht in [docs/DATA-QUALITY.md](../../DATA-QUALITY.md) auf Branch `data-quality`. Stand So 04.10.2026, 00:45 Wien.

---

Du bist der **Data Manager** für Constellate (evidenzgestufter Wissensgraph für seltene Krankheiten, Hack-Nation C5). Du behebst die Daten-Blocker aus dem Review von PR #1 (`data-v2`), prüfst die lokalen Ausgaben per Skript und übergibst sie sauber. Feature-Freeze So 12:00, Abgabe 15:00 Wien. Zwischenstand bis 03:30, fertig bis 05:00 (Uhrzeit: `TZ=Europe/Vienna date`). Deutsch, knapp. Große Dateien nie ganz in den Kontext laden, nur per Skript auswerten.

## Start

```bash
git fetch origin
git switch data-v2 && git pull --rebase
git show origin/data-quality:docs/DATA-QUALITY.md > /tmp/DATA-QUALITY.md   # Review lesen: Blocker 1-3, Should-fix 1-13, Abschnitt 2 und 4
ls -la data/enrich/extra_* data/raw/en_product9_prev.xml
```

Schreibbereich: `pipeline/04b_enrich_extra.py`, `pipeline/enrich_extra/`, `pipeline/tests/test_enrich_extra.py`, `data/curated/assets.csv`, neu `data/curated/person_aliases.csv`, `docs/DATA-REPORT.md`, `data/MANIFEST.md`, `docs/DATA-SOURCES.md`. **Nicht** anfassen: `pipeline/01`–`08`, `validate.py`, `app/` und `app/public/data/` (das macht die Integrations-Session in 07).

## Phase 1 · Checks auf den echten Daten (erst messen, dann fixen)

Schreib ein Skript `/tmp/dq_checks.py` und gib eine Tabelle aus:

- **C1 Prävalenz:** Zähle in `extra_prevalence.jsonl` die Einträge je `type`. Parse für jeden Eintrag `<ValMoy>` aus `snippet`. Zähle (a) Einträge ohne `ValMoy > 0`, bei denen trotzdem `value` gesetzt ist (Fallback aus der Klasse, falsche Einheit), und (b) Einträge vom Typ `Cases/families` mit `value`. Gib Krabbe (MONDO:0009499), MLD (MONDO:0018868) und PMD (MONDO:0010714) komplett aus (type, class, value, unit, region, ambiguous_xref).
- **C2 Therapien:** Gib alle 45 `approved_therapy`-Kanten aus `extra_edges.json` aus: Krankheit, Drug, Behörde, Datum, Snippet (120 Zeichen). Markiere Snippets mit `not indicated`, `limitation`, `not been established`, `except`, `excluding`: Dort steht die Krankheit womöglich in einer Einschränkung statt in der Indikation. Jede markierte Zeile von Hand gegen die Quelle prüfen.
- **C3 Skalen aus Abstracts:** Gib je `has_asset` mit Evidenz-`db = Europe PMC` die Krankheit, die Skala, die PMID und den Titel aus `europepmc.jsonl` aus. Prüfe vor allem Krabbe ↔ „Loes score" (PMID 41604001) und PMD ↔ „GMFM" (PMID 42060827): Handelt das Paper von der Krankheit? Zähle auch Treffer, bei denen `SARA` ein Vorname ist.
- **C4 KOL-Größe:** Je Krankheit die Zahl der Paare, Personen und Records; Top 10 nach Bytes (`len(json.dumps(...))` der Einträge, die 07 in den Shard schreiben würde). Hero-Paare Krabbe↔MLD und Krabbe↔PMD mit Personenliste.
- **C5 Personendaten:** Regex über `extra_kol_overlap.json`, `extra_people.jsonl` und `extra_edges.json` nach E-Mail `[\w.+-]+@[\w-]+\.[\w.]+` und Telefon `(?:\+|00)\d[\d\s()./-]{7,}\d|\b(?:tel|phone|fax)\b`. Erwartung: 0 Treffer. Bei Treffern den Feldnamen ausgeben.
- **C6 NBS:** Alle 22 Zeilen mit Status, URL und `retrieved`; die 11 belegten Seiten im Browser öffnen und notieren, ob dort Regelscreening oder Forschung/Pilot steht (vor allem NO MLD und IT-52).
- **C7 Krägeloh-Mann:** Alle Identitäten mit `Krägeloh` oder `Kraegeloh` aus `extra_people.jsonl`: `person_key`, Institutionen, Krankheiten, Records.
- **C8 Determinismus:** Zwei Offline-Läufe vergleichen (`--offline --scope core`); alle `extra_*` müssen außer `extra_run_log.jsonl` byte-identisch sein.

## Phase 2 · Fixes (in dieser Reihenfolge, jeweils mit Test)

1. **Prävalenz (Blocker 1):** `value` nur aus `ValMoy > 0`, sonst `null`. `unit` je Typ: Point prevalence, Birth prevalence, Lifetime prevalence und Annual incidence → `"per 100 000"`; `Cases/families` → `"cases"` oder `"families"` (aus `PrevalenceQualification`). `qualification` parsen. Feld `value_per_million` in `valmoy` umbenennen. `class_to_value()` nicht mehr für `value` nutzen. Tests: je Typ ein XML-Beispiel, und ein Eintrag ohne ValMoy ergibt `value is None`.
2. **NBS:** `retrieved` auch für fehlgeschlagene Abrufe setzen (Datum des Versuchs); `RUSP_NOTE` ohne „January 2023"; MN-Evidenz `date = 2024-02-26` (Pressemitteilung, steht in MEDICAL-BACKGROUND). Den `[status]`-Präfix im Snippet nur entfernen, wenn die Integrations-Session zustimmt (der Test `test_level_rules` ändert sich mit); sonst bleibt er, und 07 nimmt `verbatim`.
3. **Skalen aus Abstracts:** für `source_type = PMID` Level `text_mined` mit `origin: "regex"` (kein LLM). CT.gov-Outcome-Measures bleiben `curated`. `SARA` nur in Großbuchstaben matchen. Falsche Zuordnungen aus C3 rausfiltern (Regel im Code, keine Handliste).
4. **KOL:** an `extra_kol_overlap.json` je Person `n_records_a` und `n_records_b` schreiben, Personen danach sortieren (zuerst die mit Records auf beiden Seiten aus verschiedenen Quellen). Formeltext: „people with ≥ 1 keyword-matched paper, grant or trial for each disease". Das Telefon-Regex aus C5 vor dem Speichern anwenden (wie bei E-Mail) und einen Test ergänzen.
5. **Krägeloh-Mann (optional, 30 min):** `data/curated/person_aliases.csv` mit Spalten `person_key, canonical_key, orcid, source_url, checked_by, checked_date`. Nur Zeilen, die du selbst belegt hast: ORCID-Datensatz auf orcid.org geöffnet und Publikationen PMID 32912261 und 21707604 dort gefunden. `kol.py` liest die Datei und führt die Identitäten zusammen, nie fuzzy. Keine ORCID aus dem Gedächtnis.
6. **Makefile:** `enrich-extra` in `reproduce` nach `enrich`; den `.PHONY`-Konflikt mit `origin/integrate` vorab lösen (beide Ziele `explain` und `enrich-extra`).

Danach: `make enrich-extra` (oder `--offline`, wenn nur Code geändert wurde) und `uv run --project pipeline pytest pipeline/tests -q`. Phase-1-Checks noch einmal laufen lassen, die Vorher-Nachher-Tabelle in `docs/DATA-REPORT.md` (neuer Abschnitt „Review-Fixes").

## Phase 3 · Übergabe an 07 (nur Dateien, kein Export)

Die `extra_*`-Dateien liegen nur hier (`data/enrich/` ist gitignored, **nicht** committen). Die Cloud-Session schreibt den 07-Code, kann ihn aber nicht mit echten Daten laufen lassen. Der Export läuft deshalb hier: sobald der 07-Code auf seinem Branch liegt und Hanno ihn freigibt, ausführen: `git fetch`, den Branch auschecken, `make analytics validate`. Dabei gelten die Kappen aus DATA-QUALITY Abschnitt 4: `make validate` grün, größter Disease-Shard < 150 KB, v2-Anteil ≤ 12 KB je Shard (per Skript messen), keine `ASSET:`/`DRUG:`/`COUNTRY:`/`PERSON:`-Knoten in `index.json`/`core.json`. Den Export committet nur, wer von Hanno dafür beauftragt ist (Präfix `data:`).

## Commit-Regeln

- Branch `data-v2` (der PR #1), **nie** `main`, nie `git push --force`, vor dem Push `git pull --rebase`.
- Präfixe `pipeline:` / `data:` / `docs:`, ein Satz, **keine** `Co-Authored-By`-Zeile und keine AI-Attribution.
- Nur eigene Dateien stagen (`git add <pfad>`), nie `git add .`. Keine Keys, keine Mailadressen oder Telefonnummern, keine lokalen Pfade (`/Users/...`) in Commits oder Docs.

## Done-Kriterien

- C1: 0 Einträge mit `value` ohne ValMoy, 0 `Cases/families` mit `per 100 000`.
- C2: jede markierte Therapie von Hand geprüft, falsche raus (mit Regel), Liste im DATA-REPORT.
- C3: Krabbe-Loes und PMD-GMFM entschieden und begründet.
- C5: 0 Treffer.
- C8: byte-identisch.
- Tests grün (bis auf Tests, die Rohdaten aus anderen Schritten brauchen; diese nennen).
- `docs/DATA-REPORT.md` hat einen Abschnitt „Review-Fixes" mit Vorher-Nachher-Zahlen; gepusht auf `data-v2`.
- Endbericht max. 10 Zeilen: Fixes, Zahlen vorher/nachher, offene Punkte für 07.
