# Teamboard

Das Teamboard ist die Ein-Seiten-Übersicht für Hanno, Osman und Recep: Countdown, Status, Aufgaben, Entscheidungen, Notizen, Dateien, Bugs und Links, dazu ein lesbarer Docs-Bereich aus diesem Repo. Es ersetzt keine Git-Arbeit, sondern ist der Kanal, wenn jemand (noch) nicht pushen kann.

- URL: https://constellate.flowary.at
- **Temporär bis 11.10.2026** (nach der Preisverleihung wird es abgebaut und danach nicht mehr gepflegt).
- Zugang: ein gemeinsames Login, **Login im Team-Chat**. Es steht nirgends im Repo und gehört nie hinein.
- Das **Repo bleibt die Quelle der Wahrheit** für alles, was abgegeben wird. Das Board spiegelt und sammelt nur.

## Bereiche

| Bereich | Inhalt |
|---|---|
| Kopf | Countdown bis Feature-Freeze (So 04.10. 12:00) und Abgabe (So 04.10. 15:00), Europe/Vienna |
| Ressourcen | `docs/RESOURCES.md`, gerendert (Tools, Accounts, Budgets, ohne Keys) |
| Wo wir stehen | Status-Karte: fertig, dran, blockiert, nächster Block |
| Timeline | Zeitplan als Blöcke und Meilensteine (Freeze) |
| Aufgaben | O1 bis O6 (Osman), R1 bis R5 (Recep), H1 bis H9 (Hanno) mit Status offen, dran, fertig, blockiert |
| TODOs | kleine Sachen mit Person und Priorität P1 bis P3 |
| Entscheidungen | D1 bis D7 (siehe [DECISIONS.md](../DECISIONS.md)) mit Empfehlung, Alternativen, Antwort |
| Notizen | freie Zeilen mit Autor, auch für Übergaben |
| Docs | Leseansicht für `README.md`, `BUGS.md`, `docs/*.md` und `data/curated/` (nur `.md`, `.yaml`, `.yml`, `.csv`); Unterordner wie `docs/hackathon-log/briefing/` sind nicht freigegeben, Mermaid erscheint als Code |
| Datei-Ablage | Upload und Download (max. 25 MB); `.md`, `.yaml`, `.csv`, `.txt` haben einen „Lesen"-Knopf |
| Bugs | Priorität, Screen, Schritte, erwartet, gesehen |
| Links | Repo, Live-Demo, Pitch-Deck, Briefing |

Übergabe ohne Git: Osman und Recep legen Ergebnisse (z. B. `orgs.csv`, `hero_path.yaml`) als Datei in die Datei-Ablage oder schreiben eine Notiz. Hanno bzw. der Orchestrator prüft das Format und übernimmt ins Repo. Nichts wird automatisch ins Repo kopiert.

## API in Kurzform

Alle Routen liegen hinter Auth. Für Skripte gilt **HTTP Basic Auth**; Zugangsdaten kommen aus der Umgebung, nie aus dem Repo:

```bash
export TEAMBOARD_URL=https://constellate.flowary.at
export TEAMBOARD_USER=...   # Login aus dem Team-Chat
export TEAMBOARD_PASS=...   # Login aus dem Team-Chat
export TEAMBOARD_WHO=Orchestrator   # Autor-Stempel (Header X-Who), z. B. Hanno, Osman, Recep
```

| Endpoint | Zweck |
|---|---|
| `GET /api/state` | alles lesen (Status, Timeline, Aufgaben, TODOs, Entscheidungen, Notizen, Bugs, Links, Dateien) |
| `PUT /api/status` | Status-Karte ersetzen: `{"done":[...],"doing":[...],"blocked":[...],"next":"...","updated_by":"..."}` |
| `POST /api/items/<collection>` | anlegen oder ändern per `id` (Felder werden gemerged; ohne `id` wird eine erzeugt; eine Liste von Objekten geht auch; `?replace=1` ersetzt komplett) |
| `DELETE /api/items/<collection>/<id>` | löschen (auch für `files`) |
| `POST /api/upload` | Datei hochladen (multipart, Feld `file`) |
| `GET /files/<stored-name>` | Datei herunterladen |
| `GET /api/log?since=<ISO>` | Änderungen seit einem Zeitpunkt (`+` als `%2B`) |
| `GET /api/docs` und `GET /api/docs/<pfad>` | Docs-Liste und Rohtext aus dem Repo |

Collections und wichtige Felder:

| Collection | Felder (frei erweiterbar) | Geprüft |
|---|---|---|
| `tasks` | `id person title output done_when deadline status` | `status` ∈ offen, dran, fertig, blockiert |
| `todos` | `text person prio done` | `prio` ∈ P1, P2, P3 |
| `decisions` | `title question recommendation alternatives status answer decided_by` | `status` ∈ offen, entschieden |
| `notes` | `text by` | |
| `bugs` | `prio screen steps expected seen done` | `prio` ∈ P1 bis P3 |
| `links` | `title url note` | |
| `timeline` | `name start end hanno osman recep kind` | `kind: "milestone"` für Punkte |

Beispiel (ohne Zugangsdaten im Text):

```bash
curl -s -u "$TEAMBOARD_USER:$TEAMBOARD_PASS" -H "X-Who: $TEAMBOARD_WHO" -H 'Content-Type: application/json' \
  -d '{"id":"O2","status":"fertig"}' "$TEAMBOARD_URL/api/items/tasks"
```

## Aus einer Session aktualisieren

Der Weg ist `tools/board.py` (nur Python-Standardbibliothek). Fehlen `TEAMBOARD_USER` oder `TEAMBOARD_PASS` in der Umgebung, bricht das Skript mit einer klaren Meldung ab; es gibt keine Standard-Zugangsdaten.

```bash
python3 tools/board.py state                      # Lage lesen
python3 tools/board.py status --done "Pipeline 01-07" --doing "App: Orgs" --blocked "Vercel" --next "Extract mit Key"
python3 tools/board.py upsert tasks '{"id":"R1","status":"dran"}'
python3 tools/board.py upsert notes '{"text":"orgs.csv geprüft, 27 Zeilen","by":"Osman"}'
python3 tools/board.py log --since last --exclude-who Orchestrator   # was die Kollegen getan haben
python3 tools/board.py upload data/curated/orgs.csv
python3 tools/board.py docs                       # Docs-Liste des Boards
python3 tools/board.py mark-sync                  # Zeitpunkt dieses Laufs merken (Datei ~/.constellate-board-last-sync)
```

Der stündliche Lauf ist als Projekt-Skill hinterlegt: `/constellate` ([.claude/skills/constellate/SKILL.md](../../.claude/skills/constellate/SKILL.md)). Er zieht das Lagebild aus Repo und Board, setzt Status-Karte und Task-Status, holt den Rückkanal von Osman und Recep ab und pflegt dabei [STATUS.md](STATUS.md) mit.

Regeln:
- **Keine Secrets ins Board**: keine API-Keys, Tokens, Passwörter, keine Inhalte aus `.env*`. Gilt für Status, Notizen, Uploads und Beschreibungen.
- Einträge anderer nicht löschen; abhaken darf nur, wer es belegen kann. Das Board hat keinen Löschschutz, `GET /api/log` ist die Historie.
- Uploads, die ins Repo gehören, nie automatisch übernehmen: Format prüfen, Vorschlag an Hanno, dann committen.
- Zeiten immer Europe/Vienna.
