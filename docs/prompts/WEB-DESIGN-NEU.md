# Prompt · Web-Design von null (Fable 5.1)

Neue Session, am besten mit **Fable 5.1** (stärkstes Modell für Design). Alles unter der Linie gilt. Hanno füttert danach laufend nach.

---

Du baust die Oberfläche von **Constellate** neu, von null (Hack-Nation 7th Global AI Hackathon, Vienna Hub, Challenge C5 "AI Atlas for the World's Rare Diseases"). Live heute: https://constellate-vert.vercel.app. Ziel: die schönste und zugleich einfachste Seite im ganzen Feld. Du konzipierst, schickst Agents los, prüfst und baust in PDCA-Runden nach, bis es sitzt. Deutsch mit Hanno, knapp, Optionen mit klarer Empfehlung. Die Oberfläche selbst ist englisch.

## 1. Für wen und wofür (das Wichtigste)

**Die Nutzerin:** eine Mutter, deren Kind gerade die Diagnose einer seltenen Krankheit bekommen hat (Beispiel: Krabbe disease). Sie ist erschöpft, hat keine Fachkenntnis, sitzt um 2 Uhr nachts am Handy und fragt: *Was ist das? Gibt es eine Behandlung? Gibt es andere Familien? Gibt es eine Studie? Was kann ich als Nächstes tun?*

**Der Kern-Gedanke:** "Your family is not the first. What you need may already exist under another disease's name." Krankheiten, die denselben Mechanismus teilen (gleiches Gen, gleicher Stoffwechselweg), sind Nachbarn. Was ein Nachbar schon aufgebaut hat (Zulassung, Natural-History-Studie, Register, Patientengruppe), kann die eigene Community wiederverwenden.

**So muss es sich anfühlen:**
1. **Landing page: ein Satz, ein Suchfeld, fertig.** Etwa "Type the diagnosis your family received." Darunter 2–3 Beispiele zum Antippen (Krabbe disease, metachromatic leukodystrophy). Kein Graph, keine Zahlenwand, kein Fachjargon über dem Falz. Tippfehler und Synonyme findet die Suche schon (Fuse, bis 16 Synonyme je Kernkrankheit).
2. **Krankheitsseite: zuerst einfach, auf Wunsch tief (Progressive Disclosure).** Oben wenige Antwort-Karten in Klartext, jede mit Quelle und Datum:
   - *What this is*: Definition in einfachen Worten.
   - *Is there an approved treatment?* Ja: welche, Behörde, Datum. Nein: ehrlich "Not found in EMA or FDA records as of <Datum>", **und direkt darunter die Alternativen** (Punkt 3).
   - *Families like yours*: Patientenorganisationen (Link zur offiziellen Seite).
   - *Studies*: offene Studien, Land, Status, Link zum Registereintrag.
   - *Your nearest neighbours*: verwandte Krankheiten mit gleichem Mechanismus, und was dort schon existiert. Von hier geht es zur Action Card.
   Erst darunter, hinter "Show the evidence" / "Show details": Graph, jede Kante mit Quelle, Konfidenz, Gegenevidenz, Formel. Forschende kommen mit einem Klick in die volle Tiefe, die Mutter wird nie davon erschlagen.
3. **Keine Therapie gefunden → nie eine Sackgasse.** Dann zeigt die Seite, was ähnlich ist: Nachbarn mit gleichem Gen oder Stoffwechselweg, die eine Zulassung, eine Natural-History-Studie, ein Register oder eine offene Studie haben (`neighbours`, `gap.nearest_communities`, `approved_therapies`, `assets` und `trials` der Nachbar-Shards). Jede Alternative klar beschriftet: "Approved for <Nachbar>, not for <Krankheit>. What carries over and what differs needs expert review." Dazu der Weg zur Action Card. **Nie** andeuten, dass eine Therapie des Nachbarn bei dieser Krankheit wirkt.
4. **Honest Gap ist ein Feature:** Wo wir nichts haben, sagen wir es schön und ehrlich: was durchsucht wurde, wann, mit wie vielen Treffern, und was die Lücke schließen würde.
5. **Action Card:** eine Seite zum Mitnehmen (zum Arzt, zur Patientengruppe): What transfers / What differs / Needs expert review, jeder Satz mit Quelle. Druck- und teilbar.

Keine Personas oder Linsen im Produkt (Entscheidung P16): kein Persona-Umschalter, keine Persona-Namen. Die Einfachheit kommt aus der Reihenfolge der Inhalte und dem Aufklappen, nicht aus Modi.

## 2. Repo, Branch, Daten

- Repo `hannokuegler/constellate`. Zuerst `CLAUDE.md` lesen. Diese Datei, `docs/prompts/HIG-web.md` und `docs/DECISIONS.md` gibt es auf `origin/orchestrator`: `git fetch origin && git show origin/orchestrator:docs/prompts/HIG-web.md`.
- **Dein Branch: `web-neu` von `origin/integrate-claude`.** Der hat den neuesten Export und die richtigen KI-Texte und geht als Nächstes nach `main`. Eigener Worktree, wenn lokal: `git worktree add ../constellate-web-neu -b web-neu origin/integrate-claude`.
- **Von null heißt:** neues Designsystem, neue Seitenstruktur, neue Komponenten. Behalten: Datenschicht (`app/lib/data.ts`, `ids.ts`, `types.ts`, `normalize.ts`, `evidence.ts`, `actioncard.ts`, `actionv2.ts`, `search.ts`, `explain*.ts`), API-Route `/api/explain`, Datenvertrag. `origin/design-v2` (3D-Scroll-Story, pausiert) darfst du ansehen und Teile übernehmen, musst du aber nicht.
- Stack: Next.js 15, React 19, Tailwind 4, `react-force-graph-2d`, Fuse. Neue npm-Pakete nur nach Hannos Freigabe (Name, Größe, wofür). CSP in `app/next.config.*`: `script-src 'self' 'unsafe-inline'`, kein CDN, Schriften lokal (next/font).

### Daten-Briefing (vom Data Steward, Stand 02:15)

**Wo:** `app/public/data/` sind statische JSON-Dateien, ausgeliefert als `/data/...` (Cache 5 min). **Nie von Hand ändern**, das schreibt die Pipeline. Datenfehler gehen an den Data Steward über den Orchestrator. Vertrag: `app/README.md`, Typen: `app/lib/types.ts`.

**Dateien:** `meta.json` (built_at, version, counts, sources mit Lizenz, metrics) · `index.json` (~1,25 MB, gzip ~210 KB, Sucheinträge `{id, type disease|gene|phenotype|org, label, synonyms, xrefs, in_core, degree}`) · `core.json` (~1,7 MB, Startgraph mit 1.027 Knoten) · `disease/<MONDO_x>.json` (874) · `gene/<SYMBOL>.json` (1.066) · `phenotype/<HP_x>.json` (4.716) · `trial/<NCT>.json` (142) · `org/<slug>.json` (39) · `explain/<key>.json` (53). Dateinamen: ":" wird "_" (`toFileKey` in `lib/ids.ts`).

**Disease-Shard:** `node` (label, definition, synonyms, xrefs, parents/children, cluster_id, mechanism_classes) · `genes: Edge[]` · `phenotypes: {edge, phenotype}[]` · `neighbours` (Ähnlichkeit, gemeinsame Gene, Flag `mechanism_differs` fürs Gegenbeispiel) · `enrichment` (trials, grants, papers, targets) · `coverage` (was je Quelle gesucht wurde) · `orgs: {org, edge}[]` · `gap` (nearest_communities, searched, closing_the_gap) · `text_mined` · data-v2: `assets`, `approved_therapies`, `newborn_screening`, `kol_overlap`, `prevalence`, Form `{items: [{node, edge}], searched: [{source, retrieved, hits}]}`.
**WICHTIG:** Feld fehlt = "Data pending". Feld da, `items` leer, `searched` gefüllt = Honest Gap: "Not found in <source> as of <retrieved>". **Nie dasselbe UI für beide Fälle.** Knotentypen `ASSET:`, `DRUG:`, `COUNTRY:`, `PERSON:` gibt es nur in Shards (nicht suchbar, keine eigene Seite).

**Kante, das Herz des Produkts:** `{id, source, target, type, level, confidence, evidence[], contradicting[], independent_sources, formula}` · `evidence[]: {db, origin, record, url, level, date, confidence, snippet (wörtliches Zitat), retrieved, model}`. Levels: observed, curated (Datenbank/Behörde), text_mined (aus Literatur, "unverified"), inferred (von uns berechnet, Formel zeigen), contradicted (Gegenbeleg). `contradicting` ist nie undefined: **Der Gegenevidenz-Slot wird immer gezeigt**, auch leer. KI-Herkunft ("Claude extract", "Claude judge") neutral beschriften: "AI-extracted", nie "OpenAI".

**Zugriff:** `loadMeta, loadIndex, loadCore, loadDisease(id), loadGene(symbol), loadPhenotype(id), loadTrial(nct), loadOrg(slug)` in `app/lib/data.ts`. 404 → `null` ist ein Zustand, kein Fehler (Honest Gap bzw. "not in our slice"). Explain: `/api/explain` nimmt zuerst `public/data/explain/<key>.json`; jeder Satz trägt `[e_...]`-IDs, ohne gültige ID fliegt der Satz raus. Gestalten mit `NEXT_PUBLIC_USE_FIXTURES=1`.

**Budgets:** Shard < 150 KB, index + core < 3 MB. Startseite lädt nur, was die Suche braucht. Shards erst beim Klick, nie alle vorladen. Listen sind gekappt (z. B. max. 8 Assets), das UI verträgt "+N more".

**Hero-Pfad (muss immer gehen, E2E prüft ihn):** Krabbe `MONDO:0009499` → GALC / PSAP (`/g/PSAP`: "One gene, 4 disease names") → MLD `MONDO:0018868` → ARSA → Libmeldy (EMA 17.12.2020) / Lenmeldy (FDA 18.03.2024) und Natural-History-Studie → Action Card. Gegenbeispiel: PMD `MONDO:0010714` (ähnliche Symptome, anderer Mechanismus). Honest Gap: `/d/MONDO_0012720`. **Krabbe hat keine Zulassung**, das muss so angezeigt werden.

**Inhaltsregeln:** Jede Zahl und Aussage mit Quelle (Link aus `evidence.url`), nichts aus Modellwissen ergänzen. Nie "cure", keine Prognosen. "Research navigation, not medical advice" sichtbar. Personendaten nur Name und Institution bei Forschenden, Kontakt nur als Link zur offiziellen Seite. Screening-Regionen (z. B. `COUNTRY:US-MN`) nie als "national" darstellen. Auf `/methods`: Ist `metrics.extract_precision.kind == "model_review"`, heißt es "independent model review", nicht "hand review". Keine Kinderfotos, kein Leid, keine Stockbilder.

## 3. Apple-Design (HIG), verbindlich

Volle Referenz: `docs/prompts/HIG-web.md` (auf `origin/orchestrator`), vor dem ersten CSS lesen. Kurzfassung:

**Grundsätze:** *Hierarchie*: pro Screen ein Fokus und eine Primäraktion, Ebenen über Größe, Gewicht, Farbe und Abstand statt Deko. *Harmonie*: ein Token-System (Radien, Farben, Abstände), Radien konzentrisch, Farbe sparsam. *Konsistenz*: gleiche Dinge sehen gleich aus, bekannte Muster statt Eigenbau, Standard-HTML vor Custom-Widgets.

**Harte Zahlen:** Tippflächen ≥ 44×44 px · Abstand zwischen Controls ≥ 12 px (rahmenlos ≥ 24) · Fließtext ≥ 17 px (nie < 16), nichts unter 11 px · ≤ 8 Schriftgrößen, ≤ 2 Familien, Gewichte 400–700 · Zeilenhöhe Fließtext 1,4–1,6 · Kontrast 4,5:1 (ab 18 px oder fett 3:1), im Dark Mode für kleinen Text 7:1 anstreben · 200 % Textgröße ohne seitliches Scrollen · kein Bruch bei 320, 390, 768 und 1280 px · Safe Areas (`viewport-fit=cover`, `env(safe-area-inset-*)`) · 1–2 prominente Buttons je Ansicht · max. 3 Buttons in einem Dialog · Navigation max. 2 Ebenen · Titel < 15 Zeichen.

**Tu / Lass (Auswahl):** Farbe hat eine feste Bedeutung und ist nie allein Bedeutungsträger (Graustufen-Test) · semantische Tokens (`--fg`, `--bg-elevated`, `--accent`), Hell und Dunkel eigens definiert, Dunkel = gedämpfte Flächen, nicht Inversion, `prefers-color-scheme` folgen · Bewegung nur mit Zweck, kurz (Feedback 100–200 ms, Übergänge ≤ 300–400 ms), abbrechbar, `prefers-reduced-motion` schaltet Parallax, Zoom und Endlos-Animation ab · sichtbarer Fokus, alles per Tastatur, Esc schließt · jedes Control mit Namen, jedes `img` mit `alt` · Buttons beginnen mit Verb, kein "Click here" · Leerzustände nennen den nächsten Schritt · Skeleton statt leerer Seite, jede Aktion reagiert binnen ~100 ms · Glas/Blur nur in der Steuerungsebene, nie unter Lesetext · Marke im Inhalt, Controls ruhig.

**Branding:** Die Marke steckt in der Sternbild-Idee (isolierter Lichtpunkt → verbundene Konstellation, ein warmer Akzent für "deine Familie"). Ein Marken-Moment je Screen: laut auf der Landing page, leise auf Arbeitsflächen. Nie Information über das Muster transportieren.

**Messen:** Ist `~/Vaults/ai/skills/design/design_check.mjs` vorhanden, vor jedem "fertig" laufen lassen (`node … http://127.0.0.1:3000 --pfade / /d/MONDO_0009499 /g/PSAP "/d/MONDO_0009499/action?via=MONDO_0018868" /d/MONDO_0012720 /methods /about --out <scratchpad>`). Sonst die Messungen aus `HIG-web.md` §2 als Playwright-Skript im Scratchpad bauen. Kontrast über Canvas, Verläufen und Glühen selbst am Screenshot prüfen.

## 4. Team und Modelle

| Rolle | Modell | Wofür |
|---|---|---|
| Du | Fable 5.1 | Konzept, Aufträge, Abnahme, Entscheidungsvorlagen |
| Ideen-Varianten | Fable 5.1 | 2–3 Richtungen für Landing page und Krankheitsseite, je ein Satz Idee plus Skizze in Worten |
| Bauer | Sonnet 5.5 (Opus 5.5 für Architektur, WebGL, harte Bugs) | Umsetzung in Wellen |
| Blinder Prüfer | Sonnet 5.5 | bekommt nur Auftrag, Schreibbereich und Prüfbefehle, nie den Bericht des Bauers |
| Nutzer-Test | Sonnet 5.5 | drei Personas klicken live (siehe §5) |

Parallele Agents bekommen **getrennte Dateien** und je einen eigenen Worktree und Branch von `web-neu`. Zusammenführen machst du. Jeder Auftrag hat die Form ZIEL / INPUT / OUTPUT / DONE (prüfbarer Befehl) / VERBOTEN / MELDEN (max. 5 Zeilen).

## 5. Ablauf: PDCA, mindestens zwei volle Runden

**Plan** (bis 04:45): Ist-Stand aller Hero-Screens per Screenshot sichern (hell und dunkel, 375 und 1280, im Scratchpad). Ideen-Agent liefert die Richtungen. Du schreibst `pitch/DESIGN-NEU.md`: Idee in einem Satz → Nutzer-Weg Schritt für Schritt → Informationsarchitektur (was auf welcher Ebene, was hinter "Show details") → Tokens → Typo → Bewegung → Screens → was nicht fallen darf. Hanno bekommt **eine** Entscheidungsvorlage mit Empfehlung.
**Do:** Welle 1 (bis 06:30): Designsystem, Landing page, Krankheitsseite einfach plus Detail-Ebene, Alternativen bei fehlender Therapie. Welle 2 (bis 08:30): Gen-Seite, Action Card, Honest Gap, Studie, Org, `/methods`, `/about`, 404.
**Check:** `make validate` · `cd app && npx tsc --noEmit && npm run lint && npm run e2e` grün · HIG-Messung ohne Fehler · blinder Prüfer · Nutzer-Test mit drei Personas: (1) **die Mutter** am Handy, kein Fachwissen, Diagnose vor einer Stunde: Findet sie in 30 s, ob es eine Behandlung gibt und was sie als Nächstes tun kann? (2) **Jurorin der Buffalo Initiative**, Forscherin: Ist jede Aussage belegt, ist der Gap ehrlich, ist die Tiefe erreichbar? (3) **Tech-Juror**: Tempo, Zugänglichkeit, Konsolenfehler. Je Persona Note 1–10 je Kriterium mit Screenshot-Beleg. Dazu ein Video-Durchlauf: die Demo wird **um 12:00 von der Live-URL aufgenommen** (dunkel, 1920×1080, Zoom 110 %), jeder Screen muss dann sitzen. WebGL, falls gebaut: nur im echten Chrome abnehmen (Playwright `headless:false`, `channel:'chrome'`, DPR 1 und 2), MSAA im Composer aus (`samples: 0`), Rückfall ohne WebGL oder bei reduced-motion.
**Act:** alle Funde einer Runde sammeln, eine Fix-Runde, frischer Prüfer. Dann nächste Runde mit höherer Latte (Runde 2 bis 10:00).

## 6. Was nicht fallen darf

- `app/public/data/` und `pipeline/` nicht anfassen. Fehlt ein Feld: an den Orchestrator melden.
- E2E `app/e2e/hero.spec.ts` bleibt grün (1280 und 375 px, schlägt bei jedem Konsolenfehler fehl). Es greift über Rollen und Texte zu: Combobox "search diseases", Option "Krabbe disease", Überschrift h1 "Krabbe disease", Buttons "Evidence: …", "close evidence panel", "Why linked", "Action card", "Group subtypes into families", "Show all subtypes", Links GALC / PSAP / metachromatic leukodystrophy, Texte "One gene, N disease names", "Honest gap", "mechanism differs", "MONDO:0009499", Überschriften "Evidence (" und "Counter-evidence (". Ändert sich ein Zugang, den Test **im selben Commit** mitziehen und das begründen. Der Hero-Pfad selbst muss bleiben.
- Startseite LCP < 2,5 s, Shards lazy, keine Konsolenfehler, Favicon vorhanden.
- Hell und dunkel sitzen beide.
- Bekannte Bugs gleich miterledigen: Honest-Gap-Karte läuft bei langen Suchanfragen aus der Karte (seitlicher Scroll, z. B. `/d/MONDO_0008215`) · "What was searched, as of <Datum>" fehlt in der Studien-Gap-Karte · Favicon und `icon.svg` 404.

## 7. Git, Abgabe, Termine

- Git-Identität `hannokuegler` / `50925342+hannokuegler@users.noreply.github.com`, nach jedem Commit `git log --format='%an <%ae>' -1` prüfen, bei Abweichung stoppen. Präfix `app:` / `docs:`, ein Satz, keine Co-Authored-By-Zeile, keine AI-Attribution, nie `git add .`, nie force-push, **nie `main`**.
- Abgabe an den Haupt-Orchestrator ("Chef"; lokal per `ListAgents` und `SendMessage`, in der Cloud über Hanno): Branch, Commit, was drin ist, Prüfergebnisse, Risiko, max. 5 Zeilen. Ändert sich ein Screen, den das Demo-Video zeigt, sofort melden, damit das Drehbuch nachzieht.
- **Termine (Wien, So 04.10.):** 04:45 Konzept und Entscheidungsvorlage · 06:30 Welle 1 · 08:30 Welle 2 und Runde 1 durch · 10:00 Runde 2 durch · **10:30 Endstand an den Orchestrator** · 11:00 Repo öffentlich · 12:00 Feature-Freeze und Aufnahme · 15:00 Abgabe.
- Alle 60 Minuten 5 Zeilen an Hanno: fertig / dran / blockiert / nächster Schritt / was er entscheiden muss.

Leg los: Lies §1–§3, schau dir die Live-Seite am Handy-Format an, schick den Ideen-Agent los und gib Hanno in 5 Zeilen deinen Plan und die erste Frage.
