# Übergabe · Design-Orchestrator design-v2

Stand So 04.10.2026, 03:45 (Wien). Auf Hannos Wunsch angehalten, alle Agents und Server sind gestoppt. Diese Datei reicht, um in einer neuen Session weiterzumachen. Konzept: [DESIGN.md](DESIGN.md). Rahmen für jeden Bauer: [docs/hackathon-log/prompts/DESIGN-BAUER-COMMON.md](../docs/hackathon-log/prompts/DESIGN-BAUER-COMMON.md) (`<scratchpad>` durch den Scratchpad der neuen Session ersetzen). Ursprünglicher Auftrag: [docs/hackathon-log/prompts/LOCAL-DESIGN-ORCHESTRATOR.md](../docs/hackathon-log/prompts/LOCAL-DESIGN-ORCHESTRATOR.md).

## 1. Entscheidungen von Hanno (gelten)

| Wann | Entscheidung |
|---|---|
| 02:00 | 3D ja, Installationen frei („du darfst alles installieren"). `three` 0.186 + `@types/three` sind drin. |
| 02:10 | Richtung „Deep Sky": Der Himmel ist die Datenbank, Markenmuster isolierter Lichtpunkt → Bernstein-Punkt, Fraunces + Inter + JetBrains Mono, Farbe = Evidenz. |
| 02:40 | Rollen/Personas raus aus der Oberfläche („versteht keiner, alles einfacher"). Startseite = große Scroll-Animation, Metapher „Brille aufsetzen", danach durch die Tour. |

Absprachen mit dem Haupt-Orchestrator (Chef): P15-Texte (OpenAI → neutral) macht **Chef** auf Branch `integrate-claude`, design-v2 fasst die „OpenAI"-Sätze in `MethodsView.tsx`, `about/page.tsx` und `lib/normalize.ts` nicht an (eigener P15-Commit wurde zurückgenommen, 9a83220). Probe-Merge design-v2 × integrate-claude: **ein Konflikt** in `app/app/about/page.tsx`, beim Merge Chefs Formulierungen nehmen. Erst mergen, wenn Chef Bescheid gibt. Chef weiß, dass im Drehbuch der Umschalter „I lead a patient group" wegfällt und die Scroll-Story der Opener werden kann.

## 2. Branches und Stand

Alle gepusht, Identität `hannokuegler`, keine AI-Attribution.

| Branch / Worktree (`03_Build/…`) | HEAD | Stand |
|---|---|---|
| **`design-v2`** (`constellate-design-v2`) | 3342763 | **Integrationsbranch.** Drin: System (Tokens, Fonts, Marke, Header, Footer, Icon), Seiten (Himmels-Graph, Evidence-Panel, Honest Gap, Gen, Action Card), Vereinfachung (keine Personas), Welt (3D-Himmel, Scroll-Story 0–8 mit Brille, 2D-Rückfall, TourBar im Layout). Build ok. E2E zuletzt auf den Einzelbranches grün, auf dem Merge-Stand nicht erneut gelaufen. |
| `dv2-fix1` (`constellate-dv2-fix1`) | 0527475 | **Fix-Runde 1, fertig committet, noch NICHT gemerged.** Drin: globaler Footer mit Disclaimer + Zählerzeile, IDs am Handy eingeklappt, „similarity" statt „confidence" bei inferred, Action Card sortiert, Gen-Seite mit Namen am Orbit und Quellen-Markern, Graph-Text-Alternative, Zentrumslabel-Pille, vertikale Provenienz-Kette, 15 px in Listen. Agent wurde kurz vor dem E2E-Lauf gestoppt → **tsc/lint/e2e/design_check vor dem Merge laufen lassen.** Achtung `layout.tsx`: fix1 hängt den DataFooter ein, design-v2 hat inzwischen `<TourBar />` dort → beides behalten. |
| `dv2-world` (`constellate-dv2-world`) | 408d1b1 | Letzter Commit ist **WIP** (Stern-Labels `world/labels.ts`, Caption-Fixes), mitten in der Arbeit gestoppt, **ungeprüft**. Vorher abbbc6b = auf design-v2. |
| `dv2-system`, `dv2-pages`, `dv2-simple` | – | fertig und in design-v2 gemerged, können weg. |

Der alte Branch `design` / Worktree `constellate-design` bleibt unberührt.

## 3. Prüfstand (PDCA Runde 1)

Belege (Screenshots, Berichte) außerhalb des Repos in `~/Desktop/Hackathon/02_Konzept/design-v2-belege/` (`ist/` Vorher-Stand Live-App, `pruefer1/`, `jury1/`, `pages/`, `orch/` Scroll-Story-Kontaktbogen `sheet.jpg`).

- **Jury (3 Personas, ohne Startseite):** alle drei würden uns über Rare Atlas setzen (Forscherin: echte Belege; Maria: knapp; Tech: LCP 0,3–1,9 s, 0 Konsolenfehler, Fokus überall). Rare Atlas gewinnt nur beim ersten Wow → dafür die Scroll-Story.
- **Blinder Prüfer:** durchgefallen wegen P1 „not medical advice" fehlt auf /d, /g, Action Card (→ in `dv2-fix1` behoben, ungeprüft). Sonst bestanden: kein Überlauf bei 375, Favicon, Fokus, Konsole leer, reduced-motion, Honest Gap hält.
- In `dv2-fix1` behoben (laut Bauer, ungeprüft): Jury-Top-8 Punkte 1, 2, 3, 5, 7, 8 und Prüfer P1, P2-1, P3-1, P3-2. Punkt 4 (About/Methods ehrlich) erledigt Chef.

## 4. Offene Punkte (nächste Session, in dieser Reihenfolge)

1. `dv2-fix1` prüfen (tsc, lint, e2e, design_check) und in design-v2 mergen (`layout.tsx`: Footer + TourBar).
2. Scroll-Story fertig machen, Funde aus der Abnahme 03:30 (echtes Chrome, 1920 @1.1, dark):
   1. Namen an den Sternen (Krabbe, GALC, PSAP, MLD, saposin A) als projizierte Glas-Pillen, nur im jeweiligen Kapitel. WIP in `dv2-world` 408d1b1 (`world/labels.ts`) prüfen oder neu.
   2. Kamera näher: Sternbild soll 50–60 % der Höhe füllen, mittig rechts der Caption. Kapitel „Krabbe disease" zeigt heute nur einen einsamen Punkt.
   3. Captions sticky mit Crossfade, immer nur eine sichtbar (heute zwei gleichzeitig, eine oben angeschnitten).
   4. MLD-Kante klar Bernstein, dicker, mit Glühen (heute blass gelb-grün).
   5. Brille nicht über die Caption legen; „Put on the lens." erscheint doppelt vor der Brille.
   6. Unterzeilen der Captions und des Heros ≥ 17 px (heute ~13 px).
   7. Optional: Hero-Bokeh weniger „Blumenkohl", mehr Streuung.
3. Prüfrunde 2 komplett (mit Startseite, Tour, hell und dunkel, 375, reduced-motion, `?sky=2d`): blinder Prüfer (`pruefer`) + Jury drei Personas. WebGL nur im echten Chrome (`channel:'chrome'`, `headless:false`, DPR 1 und 2).
4. Noch nicht gesehen: Hellmodus der Scroll-Story, 375 der Scroll-Story, Tour-Schritte 2–6 im Bild, Org- und Explain-Ansichten mit echten Einträgen (kommen mit integrate-claude: 61 text-mined Kanten, 39 Organisationen, 53 Explain-Dateien).
5. Nach Chefs Go: `origin/main` (mit integrate-claude) in design-v2 mergen, Konflikt `about/page.tsx` mit Chefs Text lösen, alles neu prüfen, dann Abgabe an Chef (Branch, Commit, Prüfergebnisse, Risiko, 5 Zeilen). **Termine:** 06:00 erste Runde durch, 09:00 zweite Runde, **10:30 Endstand an Chef**, 12:00 Freeze + Demo-Aufnahme.
6. Aufräumen am Ende: Worktrees `constellate-dv2-{system,pages,simple,fix1,world}` per `git worktree remove`.

## 5. Ansehen und Prüfen

```bash
cd ~/Desktop/Hackathon/03_Build/constellate-design-v2/app && npm run build && npx next start -p 3300
```

Dann http://localhost:3300 im echten Chrome (dunkel = Video-Ansicht). Startseite langsam scrollen; Tour: `/d/MONDO_0009499?tour=hero&step=2`; Testschalter `?sky=2d`, `?sky=off`. Sky-Daten neu rechnen: Befehl steht in `app/scripts/build-sky.*` (Output `app/public/world/sky.json`, committet).

Prüflauf: siehe `docs/hackathon-log/prompts/DESIGN-BAUER-COMMON.md` (tsc, lint, `E2E_PORT` + `CHROMIUM_PATH` auf Chrome, `design_check.mjs` mit `DESIGN_CHECK_PW=<worktree>/app/node_modules`).

## 6. Neustart-Prompt (in eine neue Session kopieren)

```
Du bist der Design-Orchestrator von Constellate. Lies zuerst komplett:
~/Desktop/Hackathon/03_Build/constellate-orchestrator/docs/prompts/LOCAL-DESIGN-ORCHESTRATOR.md
und dann die Übergabe ~/Desktop/Hackathon/03_Build/constellate-design-v2/pitch/DESIGN-HANDOVER.md sowie pitch/DESIGN.md dort.
Arbeite im bestehenden Worktree ../constellate-design-v2 (Branch design-v2), nicht neu anlegen. Lade vor der ersten Zeile CSS den Skill /design.
Mach weiter bei Abschnitt 4 der Übergabe: fix1 prüfen und mergen, Scroll-Story fertig, dann Prüfrunde 2 mit blindem Prüfer und Jury. Fable nur für neue Ideen, Sonnet baut, Opus für 3D.
Starte mit 5 Zeilen Lage und was du als Erstes tust.
```
