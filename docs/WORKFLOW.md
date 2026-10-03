# 🔁 Workflow · wie wir 19 Stunden zusammenarbeiten

> Deadline **So 04.10.2026, 15:00 Wien** · **Feature-Freeze 12:00** · E2E live **06:00**.
> Ressourcen und Keys: [RESOURCES.md](RESOURCES.md) · Tasks: [ROLES-TASKS.md](ROLES-TASKS.md)

## Arbeitsprinzipien

1. **Hanno baut den Kern** (Pipeline, App, Deploy). Niemand sonst fasst `pipeline/` oder `app/` an.
2. **Osman und Recep bekommen kleine Tasks** mit einem Datei-Output und einem Done-Kriterium. Kein Task ohne Zieldatei.
3. **Übergabe über Dateien im Repo**, nicht über Chat. Wenn's nicht in `data/curated/`, `docs/` oder `BUGS.md` steht, existiert es nicht.
4. **Jede Behauptung im Produkt oder Video braucht eine Primärquelle**, die du selbst geöffnet hast (PMID, OMIM, NCT, EPAR, Org-URL). LLM-Gedächtnis ist keine Quelle.
5. **Lieber `UNBELEGT` als geraten.** Eine ehrliche Lücke ist ein Ergebnis — dann ändern wir den Pfad.
6. **06:00 ist die App E2E live** (Krabbe → PSAP → MLD → Action Card, Honest Gap). Ab da wird nur noch getestet und poliert.
7. **12:00 Feature-Freeze.** Danach nur noch P1-Bugs, Videos, README, Submission. Kein „nur noch schnell".
8. **Erst der Hero-Pfad, dann alles andere.** Ein Klickpfad, der in 2 Minuten sitzt, schlägt zehn halbe Features.
9. **Schlafblöcke sind Pflicht**, nicht optional. Wer nach Plan schläft, macht um 13 Uhr weniger Fehler.
10. **Blockiert > 15 Minuten → in den Chat.** Nicht alleine kämpfen.

## Git-Workflow in 8 Schritten (für Nicht-Profis)

Einmalig:
```bash
git clone https://github.com/<hanno>/constellate.git
cd constellate
git config user.name "Dein Name"
git config user.email "deine@mail"
```

Jedes Mal, wenn du etwas abgibst:

1. **Aktuellen Stand holen:** `git pull --rebase` (immer zuerst, auch wenn du „nur eine Datei" änderst).
2. **Arbeiten** — nur in deinen Dateien (siehe Tabelle unten). Nichts in `pipeline/` oder `app/` ändern.
3. **Prüfen, was du geändert hast:** `git status` und `git diff`. Nur erwartete Dateien? Keine `.env`, keine Videos, kein `data/raw/`?
4. **Nur deine Dateien stagen:** `git add data/curated/orgs.csv` (nicht `git add .` — damit landet nichts versehentlich im Repo).
5. **Kleiner Commit mit Präfix:**
   `git commit -m "data: 12 weitere Orgs verifiziert (Gaucher, NPC)"`
   Präfixe: `data:` (CSV/YAML in `data/curated/`) · `docs:` (README, docs/, BUGS.md) · `app:` (Next.js, nur Hanno) · `pipeline:` (Python, nur Hanno). Englisch oder Deutsch egal, ein Satz, keine `Co-Authored-By`-Trailer.
6. **Noch einmal holen, dann pushen:** `git pull --rebase && git push`.
7. **Konflikt?** Wenn `git pull --rebase` meckert („CONFLICT"): **nichts weiter tippen**, `git rebase --abort` ausführen, Hanno im Chat fragen. **Nie `git push --force`.** Nie.
8. **Erfolg kurz melden:** eine Zeile im Chat („orgs.csv: 27 Zeilen gepusht"), damit Hanno weiß, dass er Reconcile laufen lassen kann.

Lieber alle 30–60 Minuten ein kleiner Commit als um 02:00 ein großer. Alles, was im Repo ist, ist gesichert; alles andere kann weg sein.

## Daten-Beschaffungs-Workflow

| Was | Wer | Wie | Ablage | Done |
|---|---|---|---|---|
| Bulk-Downloads (HPO, MONDO, Orphanet) | Hanno | `make fetch` → Cache in `data/raw/`, Hashes in `data/MANIFEST.md` | `data/raw/` (gitignored) | MANIFEST hat Datum + SHA je Datei |
| API-Enrichment (Trials, Grants, Papers, Pathways, Open Targets) | Hanno | `make enrich`, Cache in `data/cache/` | `data/graph.json` | Kanten `studied_in`, `funded_by`, `in_pathway` mit Quelle + Datum |
| **Patientenorganisationen** | **Osman** | Startliste → Bright Data holt Seite → OpenAI-Extract macht Entwurf (`orgs_draft.csv`) → Osman öffnet jede Seite, prüft, übernimmt | `data/curated/orgs.csv` | ≥ 25 Zeilen, jede URL klickt, `verified_date` gesetzt |
| **Hero-Pfad-Evidenz** | **Recep** | je Schritt 1–10 der Maria-Journey eine Primärquelle, Link selbst geöffnet, wörtliches Zitat | `data/curated/hero_path.yaml` | alle 10 Schritte belegt oder `UNBELEGT` |
| **Moonshot-Zahlen** | **Recep** | Dauer bis NHS-Start, NHS-Rekrutierungsdauer, NHS-als-Kontrollarm-Beispiel, Kosten, Anzahl LSD-Gruppen — je mit Quelle; Tabelle heute vs. Constellate; 4–6 Annahmen | `docs/MOONSHOT.md` | jede Zahl hat eine Quelle oder steht als Annahme |
| Lizenzen + README | Osman | Lizenz-Zeile aus [DATA-SOURCES.md](DATA-SOURCES.md), Abschnitte laut Task O3 | `README.md` | rendert auf GitHub ohne kaputte Tabellen |

### `data/curated/orgs.csv` — Format exakt

UTF-8, Komma-getrennt, Felder mit Komma oder `;` in Anführungszeichen. Kopfzeile **exakt**:

```
org_name,url,country,disease_names,orpha_ids,has_registry,registry_url,has_natural_history_study,nhs_url,has_biobank,contact_url,notes,verified_date
```

| Spalte | Inhalt |
|---|---|
| `org_name` | Name wie auf der Website |
| `url` | Startseite, mit `https://` |
| `country` | ISO-2 (`US`, `GB`, `DE`, …) oder `INT` für international |
| `disease_names` | Freitext wie auf der Seite, mehrere mit `;` getrennt, in Anführungszeichen |
| `orpha_ids` | `ORPHA:487;ORPHA:512` nur wenn auf der Seite oder bei Orphanet eindeutig; sonst leer (Reconcile mappt) |
| `has_registry` | `yes` / `no` / `unknown` |
| `registry_url` | nur wenn selbst gesehen, sonst leer |
| `has_natural_history_study` | `yes` / `no` / `unknown` |
| `nhs_url` | nur wenn selbst gesehen |
| `has_biobank` | `yes` / `no` / `unknown` |
| `contact_url` | Kontakt-/Partnerschaftsseite |
| `notes` | Freitext, z. B. `via brightdata+openai draft, verified manually` oder `registry run with NNPDF` |
| `verified_date` | `2026-10-03` (ISO) |

Beispielzeile:
```
Hunter's Hope,https://www.huntershope.org,US,"Krabbe disease;leukodystrophies",ORPHA:487,yes,https://www.huntershope.org/…,unknown,,unknown,https://www.huntershope.org/contact,"newborn screening advocacy; draft via brightdata",2026-10-03
```

### `data/curated/hero_path.yaml` — Format exakt

Eine Liste, ein Eintrag je Beleg (mehrere Belege je `step` erlaubt):

```yaml
- step: 4
  claim: "Saposin A deficiency (PSAP) produces a Krabbe-like phenotype"
  source_type: OMIM          # OMIM | PMID | PMC | EMA | FDA | NCT | ORPHA
  id: "611722"
  url: "https://omim.org/entry/611722"
  snippet: "wörtliches Zitat, max. 40 Wörter"
  confidence: high           # high | medium | low
  note: "Gegencheck mit Orphanet-Seite offen"
```

Unbelegter Schritt:
```yaml
- step: 7
  claim: "…"
  source_type: UNBELEGT
  id: ""
  url: ""
  snippet: ""
  confidence: low
  note: "3 Suchen in PubMed, nichts Direktes — Pfad ändern?"
```

Hanno liest die Datei in der Pipeline ein (`hero_path.yaml` → `evidence` der Hero-Kanten), deshalb Feldnamen nicht ändern, YAML-Einrückung mit 2 Spaces.

### `docs/MOONSHOT.md` — Struktur

`## Milestone` (gemeinsame NHS) · `## Numbers` (Tabelle: Zahl · Quelle · Link · Jahr) · `## Today vs. Constellate` (Tabelle) · `## Assumptions` (4–6 Bullets, jede testbar) · `## What we would validate next`. Kein Marketing-Ton, lieber „3–5×, wenn Annahme X hält".

## Kommunikation

- **Ein Gruppenchat** (Signal/WhatsApp), kein Discord-Nebenchat, keine DMs für Arbeitsinhalt. Keys per DM.
- **Status alle 2 h, 3 Zeilen:**
  ```
  fertig:    orgs.csv 18 Zeilen gepusht
  dran:      Rest der Startliste, Fabry + MPS
  blockiert: nichts  (oder: Bright Data Zone noch nicht aktiv)
  ```
  Keine Romane, keine Screenshots von Fehlern ohne Text dazu.
- **Bugs nur in `BUGS.md`**, eine Zeile je Fund:
  `[P1|P2|P3] Screen · Schritte · erwartet · gesehen · (wer)`
  P1 = Demo-Killer (Hero-Pfad bricht, Seite lädt nicht, Login-Wand) · P2 = sichtbar, aber umgehbar · P3 = kosmetisch. Erledigt → `~~durchstreichen~~`, nicht löschen.
  Beispiel: `[P1] Suche · "Krabbe" tippen, Enter · Ego-Graph · leere Seite, Konsole: graph.json 404 · (Osman)`
- Entscheidungen, die den Plan ändern (Pfad umlegen, Feature streichen), **trifft Hanno** nach kurzem Chat — und schreibt eine Zeile nach `docs/PLAN.md` unten.

## Qualitäts-Gates vor dem Freeze (So 11:00–12:00, Osman prüft, Hanno fixt)

- [ ] **Live-URL ohne Login** — in einem privaten Fenster öffnen, kein Vercel-Passwort, kein Preview-Schutz
- [ ] **Hero-Pfad klickbar:** Suche „Krabbe disease" → GALC → PSAP → MLD → Action Card, in < 2 min, ohne Konsolen-Fehler
- [ ] **Honest Gap klickbar:** eine Krankheit mit dünner Evidenz zeigt Coverage + „was fehlt" + nächsten Schritt
- [ ] **Jede Kante hat eine Quelle** — Stichprobe 10 zufällige Kanten im Edge-Panel: `db`, `record`, `url`, `level`, `date` gefüllt; `inferred`-Kanten zeigen die Formel
- [ ] **Gegenevidenz-Slot sichtbar** (auch wenn leer) und mindestens ein Gegenbeispiel (Pelizaeus-Merzbacher) im Graph
- [ ] **OpenAI an drei Stellen sichtbar:** Explain streamt mit `[e_xxx]`-Zitaten · Extract-Kanten tragen `text_mined` + PMID · Reconcile-Mapping der Orgs ist im Edge-Panel als Begründung lesbar
- [ ] **Fallback ohne Key:** `OPENAI_API_KEY` lokal leer → App läuft, Explain zeigt Template-Text statt Fehler
- [ ] **README `make reproduce` auf frischem Clone** (Osman, O5): neues Verzeichnis, nur README befolgen, Graph baut sich
- [ ] **Lizenzen** im README vollständig (Zeile aus DATA-SOURCES.md) + Bright-Data/OpenAI-Offenlegung für die Org-Daten
- [ ] **Keine Secrets im Repo:** `git log -p | grep -i "sk-"` leer, `.env*` nicht getrackt
- [ ] **Repo public** (So 11:00), Live-URL + Repo-URL im README oben
- [ ] **Hero-Pfad-Zahlen = Video-Zahlen = README-Zahlen** (Recep gleicht ab)

Alles grün → Freeze. Ein rotes Feld bei den ersten drei → kein Freeze, das wird zuerst gefixt.

## Submission-Ablauf (So 14:00–14:45)

| Zeit | Was | Wer klickt | Wer gegencheckt |
|---|---|---|---|
| 13:30 | Alle drei Videos hochgeladen (unlisted YouTube oder Drive, **vorher prüfen, was HackOS akzeptiert**), Links in `04_Submission/LINKS.md` | Recep (Demo + Walkthrough), Osman (Team), Hanno (Tech) | jeder klickt die Links der anderen in einem privaten Fenster |
| 14:00 | **HackOS** Submission: Teamname, Problem Statement (EN aus PLAN.md), Live-URL, Repo-URL, 3 Video-Links, Team-Mitglieder | **Osman** | **Hanno** liest jeden Eintrag vor dem Klick auf Submit mit |
| 14:15 | **Google Form** (falls im Brief gefordert): gleiche Inhalte, Copy-Paste aus `LINKS.md` | **Osman** | **Recep** |
| 14:25 | Bestätigungs-Mails/Screenshots in `04_Submission/` ablegen | Osman | Hanno |
| 14:30 | **Backup:** Zip des Repos (`git archive`) + Videos auf Drive, Link in `LINKS.md`; Discord-Post mit Live-URL + Repo | Hanno (Zip), Recep (Discord) | Osman |
| 14:40 | **Letzter Live-Check** der URL in einem privaten Fenster, Hero-Pfad einmal durchklicken | Recep | — |
| 14:45 | Fertig. Nichts mehr pushen. **Niemand deployt nach 14:45.** | | |

Falls HackOS um 14:00 hängt: nicht warten, sofort Google Form + Discord-Post, dann HackOS retry alle 5 Minuten bis 14:55. Die Bestätigung ist das Ziel, nicht der schönste Eintrag.

---

*Alles gucci, wenn um 14:45 drei Links in `LINKS.md` stehen, alle klicken, und niemand mehr pusht.*
