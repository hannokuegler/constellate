---
name: constellate
description: Hält das Hackathon-Teamboard (Projekt Constellate, Hack-Nation C5) und docs/STATUS.md aktuell und holt den Rückkanal von Osman und Recep ab. Zieht das Lagebild aus Repo (git log, BUGS.md, docs/STATUS.md, docs/DECISIONS.md, docs/PLAN.md, orgs.csv, hero_path.yaml, MOONSHOT.md) und Board, setzt Status-Karte, Task-Status, TODOs und Entscheidungen, fasst Neues der Kollegen zusammen und gibt 5 Zeilen Lage aus. Nutzen bei "/constellate", "hackathon status", "update das teamboard", "was ist offen im hackathon", "status an alle".
---

# Constellate: Teamboard- und Status-Pflege (stündlicher Lauf des Orchestrators)

Das Teamboard (https://constellate.flowary.at, Login im Team-Chat, temporär bis 11.10.2026) ist die Übersicht für Hanno, Osman und Recep: Countdown bis Feature-Freeze (So 04.10.2026 12:00 Wien) und Abgabe (So 15:00), Status, Timeline, Aufgaben O1 bis O6 / R1 bis R5 / H1 bis H9, TODOs, Entscheidungen D1 bis D7, Notizen, Dateien, Bugs, Links, dazu Docs und Ressourcen aus dem Repo. Dieser Skill bringt das Board **und `docs/STATUS.md`** auf den Stand der Wirklichkeit und holt ab, was die Kollegen im Board eingetragen haben. Mehr zum Board: `docs/TEAMBOARD.md`.

Das **Repo** ist die Quelle der Wahrheit für Abgaben, das Board ist temporär. Alle Pfade unten sind relativ zum Repo-Root.

## Werkzeug

`tools/board.py` (nur Standardbibliothek).

| Befehl | Zweck |
|---|---|
| `python3 tools/board.py state [--json]` | Lesbare Zusammenfassung (oder volles JSON) |
| `python3 tools/board.py status --done X --doing Y --blocked Z --next "…"` | Status-Karte setzen. Mehrfach `--done` möglich; nicht genannte Felder bleiben, Liste leeren mit `--blocked ""` |
| `python3 tools/board.py upsert <collection> '<json>'` | Anlegen oder Ändern per `id` (merged). Collections: tasks, todos, decisions, notes, bugs, links, timeline. Liste von Objekten und `@datei` oder `-` gehen auch |
| `python3 tools/board.py delete <collection> <id>` | Löschen (auch `files`) |
| `python3 tools/board.py log --since last --exclude-who Orchestrator` | Was die Kollegen seit dem letzten Lauf getan haben. `--since <ISO>` geht auch |
| `python3 tools/board.py upload <datei>` | Datei ablegen |
| `python3 tools/board.py docs [pfad]` | Docs-Liste bzw. Rohtext aus dem Repo, wie das Board ihn sieht |
| `python3 tools/board.py mark-sync` | Zeitpunkt dieses Laufs nach `~/.constellate-board-last-sync` schreiben (Board-Zeit) |

Umgebung, **alles über Umgebungsvariablen, nie im Repo**:

- `TEAMBOARD_USER` und `TEAMBOARD_PASS`: Pflicht, das Login steht im Team-Chat. Fehlen sie, bricht `board.py` mit einer klaren Meldung ab. Dann nicht raten und nichts eintragen, sondern Hanno bitten, beide als Umgebungsvariablen oder Secrets der Session zu setzen.
- `TEAMBOARD_URL`: Default `https://constellate.flowary.at`.
- `TEAMBOARD_WHO`: Autor-Stempel, Default `Orchestrator`.

Fehler wie „Board nicht erreichbar" melden, nicht raten.

## Ablauf

### 1. Lagebild ziehen

Im Repo (nur lesen):

```bash
git log --oneline -15
cat BUGS.md
cat docs/STATUS.md docs/DECISIONS.md
sed -n 1,64p docs/PLAN.md                  # Zeitplan-Tabelle = Timeline
python3 -c "import csv;print('orgs.csv Zeilen:', sum(1 for _ in csv.DictReader(open('data/curated/orgs.csv', encoding='utf-8'))))" 2>&1
grep -c '^- step:' data/curated/hero_path.yaml; grep -o 'step: [0-9]*' data/curated/hero_path.yaml | sort -u | tr '\n' ' '; grep -c UNBELEGT data/curated/hero_path.yaml
test -f docs/MOONSHOT.md && wc -l docs/MOONSHOT.md || echo "MOONSHOT.md fehlt"
```

Auf dem Board:

```bash
python3 tools/board.py state
python3 tools/board.py log --since last --exclude-who Orchestrator
```

Fehlt die Sync-Datei (erster Lauf), zeigt `log --since last` alles. Uhrzeit und Restzeit immer aus `TZ=Europe/Vienna date` rechnen, nie schätzen.

### 2. Board und STATUS.md aktualisieren

- **Status-Karte** setzen: fertig / dran / blockiert / nächster Block, im „nächster Block" die Restzeit bis Freeze nennen. Aus Git-Log, Dateien, PLAN und STATUS ableiten, nicht aus dem Gefühl.
- **`docs/STATUS.md`** auf denselben Stand bringen: Zeitstempel „Letzte Aktualisierung" oben setzen (Wien), Tabelle „Auf einen Blick" und die Abschnitte „Dran und offen", „Blockiert", „Nächster Block" anpassen, Zahlen nur aus Dateien oder Skripten (`app/public/data/meta.json`, `make validate`). Das ist die **einzige** Repo-Datei, die dieser Skill ändert.
- **Task-Status** per `upsert tasks '{"id":"O2","status":"fertig"}'`. Erlaubt: offen, dran, fertig, blockiert. Faustregeln, wann ein Task „fertig" ist (Done-Kriterium aus `docs/ROLES-TASKS.md` prüfen, nicht nur Datei vorhanden):

  | Task | Beleg im Repo |
  |---|---|
  | O2 | `data/curated/orgs.csv` mit mindestens 25 Zeilen, `verified_date` gesetzt |
  | R1 | `data/curated/hero_path.yaml` deckt Schritte 1 bis 10 ab (belegt oder `UNBELEGT`) |
  | R2 | `docs/MOONSHOT.md` mit Numbers, Today-vs-Constellate, 4 bis 6 Assumptions |
  | O3 | `README.md` mit allen Abschnitten laut O3 |
  | O4, R3 | Zeilen in `BUGS.md` bzw. Demo-Skript (laut `docs/ROLES-TASKS.md`) |
  | H1 bis H9 | Commits im Git-Log, laufende App, Live-URL |

  Bei Zweifel nicht hochstufen: `dran` statt `fertig`, und eine Rückfrage in die Ausgabe.
- **TODOs** anlegen, wenn aus dem Lagebild etwas Konkretes folgt (z. B. „orgs.csv gepusht, Reconcile kann laufen"), erledigte per `upsert todos '{"id":"T7","done":true}'` abhaken. Keine Duplikate: erst `state` prüfen.
- **Entscheidungen**: hat Hanno im Chat oder im Board etwas entschieden, im Board `status: entschieden`, `answer` und `decided_by` setzen und den Eintrag in `docs/DECISIONS.md` von „Offen" nach „Erledigt" verschieben (Datum, Antwort, Begründung). Nur auf Hannos ausdrückliche Entscheidung; Defaults sind keine Entscheidungen.
- Danach `python3 tools/board.py mark-sync` ausführen (erst am Ende des Laufs, damit nichts durchrutscht).

### 3. Rückkanal von Osman und Recep

Alles, was sie auf dem Board neu eingetragen haben (Log seit letztem Lauf, ohne eigene Einträge): Notizen, TODOs, Bugs, Entscheidungs-Antworten, Task-Status-Klicks, Uploads. Kurz zusammenfassen, Wichtiges (P1-Bugs, Blocker, Fragen) nach oben.

- **Bugs** der Kollegen mit P1 nennt die Ausgabe sofort. `BUGS.md` im Repo wird **nicht** vom Skill beschrieben.
- **Uploads, die ins Repo gehören** (`orgs.csv`, `hero_path.yaml`, `MOONSHOT.md`, Demo-Skript): als **Vorschlag** melden („Upload `orgs.csv` von Osman, 27 Zeilen, Kopfzeile ok, soll nach `data/curated/orgs.csv`?"). Vorher Format prüfen (Kopfzeile exakt, YAML-Felder laut `docs/WORKFLOW.md`). **Nie automatisch committen, nie ins Repo kopieren, nie pushen.** Die Übernahme macht Hanno bzw. der Orchestrator auf Zuruf.
- Fragen an den Orchestrator im Board beantwortest du nicht selbst im Board, sondern gibst sie in der Ausgabe an Hanno weiter.

### 4. Ausgabe (genau so, knapp)

```
fertig:     …
dran:       …
blockiert:  …
nächster Block: … (Freeze in HH:MM h)
Restzeit:   Freeze in X h YY min · Abgabe in X h YY min
Neu von Osman/Recep: …   (oder „nichts Neues")
Vorschlag: …             (nur wenn ein Upload ins Repo gehört)
```

Nichts blockiert und nichts Neues: ein Satz „alles gucci" reicht. Deutsch, keine Romane.

## Regeln

- **Keine Secrets ins Board und nicht ins Repo**: keine API-Keys, Tokens, Passwörter, keine Inhalte aus `.env*`. Das Teamboard-Login nie in eine Datei schreiben, immer nur „Login im Team-Chat". Das Repo wird So 11:00 öffentlich, die Git-History bleibt sichtbar.
- **Repo bleibt die Quelle der Wahrheit** für Abgaben; das Board ist temporär (bis Preisverleihung 10.10.2026) und wird danach nicht gepflegt.
- **Im Repo ändert der Skill nur `docs/STATUS.md`** (und auf Hannos Entscheidung `docs/DECISIONS.md`). Nichts committen oder pushen. `app/`, `pipeline/`, `data/` nicht anfassen.
- Status-Karte immer vollständig neu setzen (fertig, dran, blockiert, nächster Block), aber Einträge anderer nicht löschen (Notizen, TODOs, Bugs der Kollegen bleiben, abhaken darf nur, wer es belegen kann).
- Zeiten immer Europe/Vienna, Freeze So 04.10.2026 12:00, Abgabe So 15:00. Danach: nur P1-Bugs, Videos, Submission.
- Entscheidungen, die den Plan ändern, trifft Hanno; der Skill schreibt sie nur mit (eine Zeile in `docs/PLAN.md` macht Hanno oder der Orchestrator).
- Docs und Ressourcen im Board kommen aus dem Repo und aktualisieren sich automatisch. Dort nichts pflegen, nur im Repo.
