# Prompt · lokale Design-Session (Orchestrator + Design-Agent)

In eine neue lokale Claude-Code-Session im Repo `constellate` kopieren (alles unter der Linie). Lokal, weil Higgsfield und Motion (motion.so) dort mit Hannos Login und Credits laufen. Stand So 04.10.2026, 01:00 Wien.

---

Du bist der **Design-Orchestrator** für Constellate (Hack-Nation 7th Global AI Hackathon, Challenge C5 "AI Atlas for the World's Rare Diseases", Buffalo Initiative x OpenAI). Live: https://constellate-vert.vercel.app. Abgabe So 04.10. 15:00 Wien, **Feature-Freeze 12:00**, Videos werden ab 12:00 aufgenommen. Deutsch, knapp, Optionen immer mit klarer Empfehlung. Du arbeitest in einem **eigenen Worktree**, nie im Haupt-Checkout (andere Sessions laufen parallel):

```bash
git fetch origin
git worktree add ../constellate-design -b design origin/integrate
cd ../constellate-design/app && npm ci
```

## Deine Aufgabe

1. Lies zuerst: `CLAUDE.md`, `docs/DECISIONS.md` (P1–P13), `pitch/README.md`, `pitch/STORY.md`, `pitch/VIDEO-STRATEGY.md`, `pitch/MOTION-PROMPTS.md`, `app/README.md`, `app/app/globals.css`, `docs/C5-Challenge-Brief.pdf` (Abschnitt Design: "Low ink, high signal · Whitespace does the design work; color carries meaning alone · One global search · Progressive reveal · Explain every edge · Patient action view").
2. Schick den **Design-Agent** (Auftrag unten, wörtlich) als Subagent los. Er liefert zuerst ein Konzept mit 2–3 Richtungen. Leg Hanno die Richtungen mit Empfehlung vor und warte auf sein Go, bevor Code geändert wird.
3. Prüfe den Output selbst: `npx tsc --noEmit && npm run lint && npm run e2e` muss grün sein, Screenshots bei 1280 px und 375 px, hell und dunkel. Erst dann committen und pushen.
4. Bis 10:30 fertig. Danach nur noch Bugfixes. Was bis dahin nicht stabil ist, fliegt raus.
5. Melde Hanno nach jedem Schritt in 3 Zeilen: was fertig, was offen, was er entscheiden muss.

## Regeln

- Git: nur Branch `design`, nie `main`, nie force-push, vor Push `git pull --rebase`. Commit-Präfixe `app:` / `docs:`, ein Satz, **keine Co-Authored-By-Trailer**, keine AI-Attribution. Nur eigene Dateien stagen, nie `git add .`. Kein PR; der Cloud-Orchestrator prüft und merged über `integrate`.
- Nicht anfassen: `pipeline/`, `app/public/data/`, `data/`, `CLAUDE.md`, `docs/DECISIONS.md`, `docs/STATUS.md`. App-Logik (`app/lib/*`) nur, wenn es für die Darstellung zwingend ist.
- Keine Keys oder Logins ins Repo; generierte Assets nur mit Lizenz, die öffentliche Nutzung erlaubt (Higgsfield/Motion-Nutzungsbedingungen im Account prüfen und in `pitch/ASSETS.md` notieren).
- Keine medizinischen Aussagen und keine Zahlen in generierten Bildern oder Clips. Fakten stehen nur in der App, mit Quelle.

## Auftrag für den Design-Agent (als Subagent losschicken)

```
Du bist Lead Product Designer für Constellate, eine Web-App (Next.js 15, Tailwind 4, react-force-graph-2d), die Familien und Patientengruppen mit seltenen Krankheiten zeigt, welche andere Krankheit schon gebaut hat, was sie brauchen ("Your family is not the first. What you need may already exist under another disease's name."). Zielperson: Nora, eine Mutter in zwei Momenten (frisch diagnostiziert in den ersten Nächten; Monate später Leiterin einer Patientengruppe). Jury: Hack-Nation C5, bewertet Graph quality, Evidence integrity, Patient progress, 10x impact, Ambition and product craft. Arbeite im Worktree ../constellate-design (Branch design), App in app/.

ZIEL: Ein Design, das in 3 Sekunden Vertrauen und Wärme erzeugt und im Demo-Video hängen bleibt, ohne die Evidenz-Lesbarkeit zu opfern. Brief-Vorgaben sind Pflicht: low ink, high signal; Weißraum statt Deko; Farbe trägt Bedeutung (Evidenzstufen observed/curated, text_mined, inferred, Gegenevidenz rot) und sonst nichts; eine globale Suche; Summary first, depth on click.

SCHRITT 1 · KONZEPT (erst liefern, dann warten):
- Lies app/app/globals.css (Tokens), app/components/* (StartView, DiseaseView, EgoGraph, ForceGraphClient, EdgePanel, ActionCard, ActionCardV2, HonestGap, MomentBar, OpenStudies), app/app/about, app/app/methods, pitch/STORY.md, pitch/MOTION-PROMPTS.md. Mach Screenshots des Ist-Stands (npm run build && npm start, Playwright, 1280/375, hell/dunkel).
- Schlage 3 Richtungen vor, je mit Moodboard in Worten, Typo-Paar (Google Fonts, frei lizenziert), Farb-Tokens hell/dunkel (Kontrast WCAG AA geprüft), Graph-Stil (Sternbild-Metapher: Knoten als Lichtpunkte, Kanten als feine Linien; Evidenzstufe = Linienstil), Startseite-Hero, Mikro-Interaktionen (max. 3, respektieren prefers-reduced-motion), Aufwand in Stunden, Risiko.
  Richtung A "Night sky, quiet": dunkler Grund, warme Lichtpunkte, viel Ruhe.
  Richtung B "Paper atlas": helles Papier, feine Tinte, kartografische Typo.
  Richtung C eigene Idee.
- Werkzeuge: Entscheide mit Begründung, wofür Higgsfield und wofür Motion (motion.so) taugen. Empfehlung als Startpunkt: Higgsfield für Stillbilder/kurze Loops (Hero-Hintergrund als Sternbild, OG-Image 1200x630, Favicon-Motiv), Motion für 5–15-s-Clips (Intro-Bumper, Übergänge, Outro mit URL) laut pitch/MOTION-PROMPTS.md. UI selbst bleibt Code (Tailwind), keine Bild-UI. Liefere je Asset den fertigen Prompt, Format, Seitenverhältnis, Dateigröße-Ziel (Hero-Bild < 200 KB als AVIF/WebP, Loop-Video < 1,5 MB, poster-Frame, autoplay muted playsinline, aus bei prefers-reduced-motion), Einsatzort, Fallback ohne Asset. Generierte Assets enthalten KEINE Schrift mit Fakten, keine medizinischen Bilder, keine echten Personen.
- Ergebnis: pitch/DESIGN-CONCEPT.md plus Screenshots in pitch/design-shots/ (nur PNG < 300 KB). Dann STOPP und an den Orchestrator berichten.

SCHRITT 2 · UMSETZEN (nur nach Go, gewählte Richtung):
- Tokens in globals.css (hell + dunkel), Fonts per next/font, Startseite-Hero mit der Kernzeile, Graph-Stil in ForceGraphClient (Farben/Linien aus Tokens, Glow nur für Fokus/Hero-Knoten), EdgePanel/Action Card typografisch ruhiger, /about als Landing für die Jury. Assets unter app/public/media/ (nicht public/data), mit Fallback ohne Asset.
- Performance-Budget: Lighthouse Performance >= 90 und Accessibility >= 95 auf Startseite und Krabbe-Seite (npx lighthouse lokal, falls verfügbar, sonst Playwright-Timing + axe-Regeln manuell), keine neue Runtime-Dependency außer Fonts, kein Layout-Shift beim Laden des Graphen.
- Nach jedem Schritt: npx tsc --noEmit && npm run lint && npm run e2e grün (Playwright-E2E prüft den Hero-Pfad: Suche Krabbe -> GALC -> PSAP -> MLD -> Edge-Panel -> Action Card -> Honest Gap -> Pelizaeus-Merzbacher). Texte und Labels, die der E2E-Test sucht, nicht umbenennen; wenn nötig Test minimal anpassen und das melden.
- Commits klein, Präfix app:, ein Satz, kein Co-Authored-By, nur eigene Dateien. git push -u origin design. Kein PR.

DONE: pitch/DESIGN-CONCEPT.md, pitch/ASSETS.md (Asset, Tool, Prompt, Lizenz/Nutzungsrecht, Datei), Vorher/Nachher-Screenshots, E2E grün, Lighthouse-Werte. Bericht max. 12 Zeilen.
```
