# Gemeinsamer Rahmen für alle Design-Bauer (Constellate design-v2)

Lies VOR dem ersten Code:
1. `<dein-worktree>/pitch/DESIGN.md` — verbindliches Konzept (Tokens, Markenmuster, Screens, Was nicht fallen darf). Token-NAMEN sind Vertrag.
2. `<dein-worktree>/CLAUDE.md` (harte Regeln) und `<dein-worktree>/app/README.md` (Datenvertrag).
3. Skill Design: `/Users/hannokuegler/Vaults/ai/skills/design/SKILL.md` (Abschnitt „Für ALLE Oberflächen" + Prüfliste) und `/Users/hannokuegler/Vaults/ai/skills/design/referenz/HIG-web.md` §2 + §4. Die Landa/GYM-Regeln (keine Webfonts, kein Build) gelten hier NICHT.
4. `<dein-worktree>/app/e2e/hero.spec.ts` — Rollen/Texte, die bestehen bleiben müssen.

Harte Regeln:
- Nur in DEINEM Worktree und NUR in deinen Dateien schreiben (Liste im Auftrag). Brauchst du eine Änderung in einer fremden Datei: im Abschlussbericht als „Bitte an Orchestrator" melden, nicht selbst machen.
- `app/public/data/` und `pipeline/` sind tabu. Fehlt ein Datenfeld: melden.
- Keine neuen npm-Pakete außer den im Auftrag genannten (`three` und `@types/three` sind schon installiert).
- CSP in `app/next.config.ts`: kein CDN, keine externen Requests zur Laufzeit. next/font/google ist ok (selbst gehostet).
- Inhalt: keine Zahl ohne Quelle (zur Laufzeit aus meta.json/core.json/Shards lesen), medizinische Sätze nur aus `docs/MEDICAL-BACKGROUND.md`, „research navigation, not medical advice" sichtbar, Maria nie als echte Person, KI-Labels neutral („AI-extracted", „Where AI is used"), nirgends „OpenAI" im Präsens. Keine Kinderbilder, kein Leid.
- HIG: Tippflächen ≥ 44×44, Fließtext ≥ 17 px (Micro-Labels 12–15 ok), Kontrast 4,5:1 / 3:1 in HELL UND DUNKEL, kein seitliches Scrollen bei 375, `:focus-visible` sichtbar, `prefers-reduced-motion` respektiert.
- Git: Identität ist im Worktree gesetzt (hannokuegler). Commits `app: …` / `docs: …`, ein Satz, KEIN Co-Authored-By, keine AI-Attribution. Nur eigene Dateien stagen (nie `git add .` / `-A`). Nicht pushen nach main, kein force-push. Push deines Branches `dv2-<name>` nach origin ist ok. Nach jedem Commit `git log --format='%an <%ae>' -1` prüfen.

Dev & Prüfen (in `<dein-worktree>/app`):
- Dev-Server auf DEINEM Port (im Auftrag) im Hintergrund: `npx next dev -p <port>` (run_in_background). Nicht Port 3000/3100.
- Pflicht vor „fertig": `npx tsc --noEmit && npm run lint` grün. E2E: `npm run build && E2E_PORT=<port+100> CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx playwright test` grün (Dev-Server vorher stoppen, falls Port-Konflikt).
- Design-Prüflauf (gegen deinen Server): `DESIGN_CHECK_PW=<dein-worktree>/app/node_modules node /Users/hannokuegler/Vaults/ai/skills/design/design_check.mjs http://127.0.0.1:<port> --pfade / /d/MONDO_0009499 /g/PSAP "/d/MONDO_0009499/action?via=MONDO_0018868" /d/MONDO_0012720 /methods /about --out <scratchpad>/check-<name>` → kein FEHLER.
- Screenshots selbst ansehen (Playwright mit `channel:'chrome'`, colorScheme dark und light, 1920×1080 deviceScaleFactor 1.1 = Video-Ansicht, und 375×812). Kontrast über Canvas/Glühen misst kein Tool: selbst am Screenshot prüfen.
- Ist-Stand vorher zum Vergleich: `<scratchpad>/ist/*.png`.

Abschlussbericht (max. 250 Wörter): Branch + Commit-SHAs, Dateien, was gebaut, Prüfergebnisse (Statuszeilen wörtlich), Pfade zu 3–5 Belegscreenshots, offene Punkte, „Bitte an Orchestrator".
