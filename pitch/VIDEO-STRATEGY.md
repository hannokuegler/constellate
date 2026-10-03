# Video-Strategie · drei Pflichtvideos, je maximal 60 Sekunden

Stand So 04.10.2026, 01:20 (Wien); Team-Video nach Osmans Feedback auf Background umgebaut, Persona heißt wieder **Maria** (wie im C5-Brief und in der App-Linse „Group leader (Maria)"), Demo-Timing gegen 2,3 Wörter/s nachgerechnet. Verbindliche Vorgabe des Teams: **genau drei Videos, jedes höchstens 60 Sekunden, MP4 oder MOV.** (1) Team Introduction, (2) Product Demo, (3) Technical Walkthrough. Die früheren Formate (Demo 2:00, Tech 3:00, Team 60–90 s, separater 1-min-Walkthrough) gelten nicht mehr; der C5-Brief („a 1-minute walkthrough: follow a family or patient group through the graph …", S. 6) wird durch die Product Demo erfüllt.

Für alle drei: Englisch, Querformat, keine Musik, keine Effekte, Aufnahme erst nach dem Freeze (So 12:00), Upload bis 14:00. Shotlists summieren auf höchstens 0:58, zwei Sekunden Puffer für Schnitt und Export. Voice-over (Demo, Tech) mit ca. 2,3 Wörtern pro Sekunde, also höchstens 135 Wörter je Video; Skript-Blöcke für ElevenLabs in [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md). Jede Aussage im Voice-over steht im Tool als Kante mit Quelle oder mit Primärquelle in [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) (ohne ⚠️). Maria ist die Persona aus dem C5-Brief (keine reale Person) und wird im ersten Satz so eingeführt; dazu eine Einblendung „Maria: persona from the challenge brief, not a real person". Fachwort-Regel aus [PITCH-60S.md](PITCH-60S.md): ein Fachwort nur, wenn es im selben Moment im Bild erklärt wird.

**Export für alle drei:** MP4, H.264, 1920×1080, 30 fps, Ton AAC 48 kHz; MOV ist als Alternative erlaubt (Vorgabe). Dateinamen `constellate_team.mp4`, `constellate_demo.mp4`, `constellate_tech.mp4`. Länge nach Export mit `ffprobe` oder im Player prüfen: **unter 60,0 s**, sonst wird der Clip nicht angenommen.

## 0. Befunde aus dem Export, die für den Dreh gelten

Geprüft gegen `app/public/data/` (Version `2026-10-04+f35b3a5`, kein Fixture), vor dem Dreh gegen den dann aktuellen Export wiederholen (Skript über die Shards, nie die Dateien in den Kontext laden).

| Befund | Folge |
|---|---|
| `e_e270315fe572` (Krabbe → MLD) ist eine `similar_phenotype`-Kante, `inferred`, Konfidenz 0,216, Formel vorhanden, `mechanism_differs = false`. Es ist nicht die „shared gene PSAP"-Kante. | Demo sagt „linked by shared symptoms, formula shown"; die PSAP-Brücke zeigt `/g/PSAP`. |
| **Update 04.10. 01:30, Export `2026-10-04+f35b3a5`:** `approved_therapies`, `assets`, `newborn_screening` sind live. Action Card zeigt Libmeldy (`e_f3ef159024b6`, EMA 2020-12-17), Lenmeldy (`e_62876fa60e22`, FDA 2024-03-18), für Krabbe „Honest Gap: Not found in EMA … FDA … as of 2026-10-03", HOME-Studie `e_7ee9ef63ec03` (NCT04628364, Natural history study). Stand davor: fehlten (PR #1). | Die Sätze „no approved medicine" (Krabbe) und „MLD has an approved gene therapy" nur sprechen, wenn die Action Card die Abschnitte „Approved therapies" mit EMA/FDA-Quelle und „Not found in EMA, FDA as of …" aus Pipeline-Daten zeigt (kein Fixture-Badge). Sonst die markierten Ersatzsätze. |
| `data/curated/orgs.csv` hat nur die Kopfzeile; `docs/MOONSHOT.md` fehlt. | Keine Organisation, keine 10×-Zahl in keinem Video. |
| Honest-Gap-Fall `MONDO:0012720` „Krabbe disease due to saposin A deficiency" (P11): ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2, abgefragt 2026-10-03; Gen PSAP (`e_795da9c4a6cd`, OMIM:611722). | Gap-Szene zeigt „What was searched, as of …" und „What would close this gap". Zahlen werden nicht vorgelesen, sie stehen im Bild. |
| `app/public/data/trial/` enthält 142 Studien-Shards. | Die Studienliste darf kurz im Bild sein; kein eigener Satz dazu (Zeit). |

Hero-Kanten im Export verifiziert: `e_3dbc42738b5a` (Krabbe → GALC, curated, OMIM:245200 via HPO, Konfidenz 0,90, Counter-evidence 0), `e_2c5236d2f740` (Krabbe → PSAP, inferred, Roll-up aus ORPHA:206436, Konfidenz 0,475), `e_795da9c4a6cd` (Saposin A → PSAP, OMIM:611722), `e_316e60c8ee91` (MLD due to saposin B → PSAP, OMIM:249900), `e_b4f9b02250a7` (Gaucher due to saposin C → PSAP, ORPHA:309252, OMIM:610539), `e_00a92bfb7837` (Krabbe → Pelizaeus-Merzbacher, similar_phenotype, `mechanism_differs = true`).

## 1. Team Introduction · ≤ 60 s · Osman filmt, echte Gesichter, echte Stimmen, kein Voice-over

Umgebaut nach Osmans Feedback (04.10., ca. 01:30): Das Team-Video zeigt **den Hintergrund der Menschen**, nicht ihren Beitrag zum Projekt. Wer was gebaut hat, sieht die Jury in Demo und Tech-Video.

**Ziel:** Drei Menschen, denen man eine Mutter um zwei Uhr nachts anvertrauen würde: ruhig, konkret, kein Pitch. Die Jury sieht, wer hinter dem Tool steht, was jeder mitbringt und warum ihn das Thema packt.

**Zuschauer:** Jury, Hack-Nation-Community.

**Kernbotschaft:** Drei verschiedene Hintergründe (Daten, Risiko, Automation), ein Grund: Niemand soll bei null anfangen, wenn die Nachbarkrankheit schon weiter ist.

**Form:** Handy quer (16:9), gleicher Ort, Tageslicht, derselbe Hintergrund, Kamera auf Augenhöhe, eine Person pro Take, ohne Zoom. Keine KI-Stimme, kein Avatar, kein Voice-over. Einwilligung aller drei vorher (Recep holt sie ein). Namens-Einblendung unten links für zwei Sekunden, Untertitel aus dem Schnittprogramm.

### Shotlist

| Zeit | Bild | Einblendung | Text |
|---|---|---|---|
| 0:00–0:02 | Titelkarte, Klartext: „Constellate · Vienna Hub · Hack-Nation C5" | – | kein Ton |
| 0:02–0:18 | Hanno, Brustbild | Hanno Kügler · Data Science (WU Vienna) · Business Informatics (TU Wien) | Text H unten |
| 0:18–0:34 | Osman, Brustbild | Osman [Nachname] · Business Informatics (WU Vienna) · Retail Risk, Raiffeisen Bank International | Text O unten |
| 0:34–0:50 | Recep, Brustbild | Recep [Nachname] · TGM Vienna, Business Informatics | Text R unten |
| 0:50–0:57 | alle drei im Bild | – | Hanno: „Your family is not the first." Recep: „What you need may already exist under another disease's name." Osman: „We're Constellate, Vienna Hub." |
| 0:57–0:58 | Schlussbild `/about` mit URL, oder die Titelkarte | – | kein Ton |

Summe 0:58. Je Person 16 s, Sprechtext 36 bis 40 Wörter (echte Stimmen sprechen etwas schneller als die KI, ca. 2,5 Wörter/s). Die Teile in eckigen Klammern sind optional; mit ihnen sind es 44 bis 45 Wörter, das ist für 16 s zu schnell. Erst mit Stoppuhr proben, dann entscheiden.

### Sprechtexte (Vorschlag, jeder sagt es in eigenen Worten nach)

**Text H · Hanno (39 Wörter ohne Klammer)**

```
I'm Hanno. I studied data science at WU Vienna, and I'm starting business informatics at TU Wien. I also teach first aid for the Red Cross. [There's one thing you learn there:] in a crisis, people don't need a textbook. They need the next step.
```

**Text O · Osman (40 Wörter ohne Klammer)**

```
I'm Osman. I study business informatics at WU Vienna and work in retail risk and methodology at Raiffeisen Bank International. I'm into machine learning and automation. In risk, a number only counts if you can trace where it came from. [Families deserve that too.]
```

**Text R · Recep (38 Wörter ohne Klammer)**

```
I'm Recep. I graduated from TGM in Vienna, industrial engineering with a focus on business informatics. I'm into general-purpose AI and automation: [systems that don't just answer, but] do the work. Here, that's the search a parent would otherwise do alone at 2 a.m.
```

**Warum diese „Warum"-Sätze:** Jeder Satz hängt am echten Hintergrund der Person, nicht an einer erfundenen Krankengeschichte. Hanno: Erste Hilfe → „der nächste Schritt" (genau das, was die Action Card liefert). Osman: Risikomethodik → „keine Zahl ohne Herkunft" (genau das Evidenzmodell, jede Linie mit Quelle). Recep: KI-Automation → „die Suche um zwei Uhr nachts" (genau Devon aus dem Brief). Damit erzählt das Team-Video nebenbei schon das Produkt, ohne über das Projekt zu reden.

**Bewusst nicht erfunden:** Osman wollte eine „kurze gute Story". Eine erfundene persönliche Verbindung zu einer seltenen Krankheit (Verwandte, Freunde) kommt nicht in Frage: Das Video zeigt echte Gesichter, die Jury nimmt es als wahr, und es widerspricht Regel 2 (keine erfundenen Patientengeschichten). Wer eine **echte** Verbindung hat, darf sie in einem Satz statt des Warum-Satzes sagen.

**Vor dem Dreh klären (je Person selbst):**

1. Osman: Darf der Arbeitgeber (Raiffeisen Bank International) in einem öffentlichen Video genannt werden? Viele Banken haben Social-Media-Regeln. Ausweichsatz ohne Namen: „… and work in retail risk and methodology at a bank."
2. Recep: Was machst du seit dem TGM (Studium, Job)? Ein Halbsatz macht den Background vollständiger; nicht raten, bitte selbst ergänzen. Englische Bezeichnung des Zweigs prüfen (Vorschlag: „industrial engineering, business informatics").
3. Hanno: Bachelor-Abschluss als „studied" ok? Rotes Kreuz nennen ok?
4. Nachnamen von Osman und Recep für die Einblendung.

Regeln: kein „revolutionary", kein „cure", keine Zahlen, keine Organisationsnamen aus der Patientenwelt, keine Geschichte einer fremden Familie.

**Aufnahme-Checkliste:** Handy quer, 1080p 30 fps, Flugmodus an; Mikro des Handys reicht, wenn der Raum ruhig ist; Licht von vorn, Fenster nicht im Rücken; drei Takes je Person, den ruhigsten nehmen; jeder spricht frei nach dem Text oben, nicht abgelesen. **Schnitt:** nur kürzen, harte Schnitte, keine Übergänge, keine Musik; Untertitel; Export MP4 H.264 1920×1080 30 fps. **Wer:** Osman filmt und schneidet, Recep prüft Länge und Untertitel. **Deadline:** Dreh 12:00–12:30, Schnitt bis 13:15, Upload bis 14:00.

## 2. Product Demo · ≤ 60 s · Recep nimmt auf, Voice-over ElevenLabs (P10)

**Ziel:** Die Jury sieht in einem Take das Problem, die Herangehensweise und die Lösung an Marias Weg, dazu einmal die ehrliche Lücke. Kriterien aus dem Brief: Patient progress, Evidence integrity, Product craft. Erfüllt zugleich die Brief-Vorgabe „1-minute walkthrough".

**Zuschauer:** Jury und Öffentlichkeit ohne Medizinwissen.

**Kernbotschaft:** Dein Problem hat einen Nachbarn, der es schon halb gelöst hat, und die Karte zeigt dir mit Quelle, wo.

**Dramaturgie:** Problem (0:00–0:09) → Herangehensweise: Karte mit Quelle, ein Gen, drei Namen (0:09–0:25) → Lösung: Nachbar MLD, Action Card (0:25–0:49) → Honest Gap (0:49–0:55) → Schlusssatz (0:55–0:58).

**Aufnahme:** Hero-Pfad stumm in einem Take durchklicken (zwei bis drei Takes, den ruhigsten nehmen), Voice-over im Schnitt unterlegen. Live-URL `https://constellate-vert.vercel.app` in der Browserleiste, Fenster 1920×1080, Browser-Zoom 110 %, Dark Mode (vorher an 375 px und Dark Mode getestet, BUGS.md), Cursor langsam, Mausklicks sichtbar (QuickTime ⌘⇧5 mit „Mausklicks anzeigen", oder OBS). Keine Lesezeichen-Leiste, keine anderen Tabs.

### Shotlist

| Zeit | Screen / Route | Klick / sichtbar | Voice-over (Englisch, Wort für Wort) | Beleg im Bild |
|---|---|---|---|---|
| 0:00–0:10 | `/` Startseite, Karten „We just got the diagnosis" und „I lead a patient group" | Karte Moment 1 anklicken, „Krabbe" tippen | „Meet Maria, from the challenge brief. Her son has Krabbe disease. There is no approved medicine, anywhere in the world.*" | Einblendung „Maria: persona from the challenge brief, not a real person"; Karten im Bild |
| 0:10–0:17 | `/d/MONDO_0009499` Krabbe disease, Graph | Linie Krabbe → GALC anklicken, Edge-Panel öffnet | „She types Krabbe. Every line shows its source, how sure we are, what speaks against it." | `e_3dbc42738b5a`, Badge `curated`, OMIM:245200, Konfidenz 0,90, „Counter-evidence (0)" |
| 0:17–0:24 | `/g/PSAP` „One gene, 4 disease names" | vom Gen-Kästchen PSAP auf die Gen-Seite, Zeilen Saposin A, B, C sichtbar | „One gene, P-S-A-P, sits behind four disease names. Names hide what they share." | `e_795da9c4a6cd` OMIM:611722 · `e_316e60c8ee91` OMIM:249900 · `e_b4f9b02250a7` ORPHA:309252 / OMIM:610539 |
| 0:24–0:33 | zurück `/d/MONDO_0009499`, Umschalter „I lead a patient group", „Related communities" | Zeile „metachromatic leukodystrophy", Button „Why linked", Edge-Panel | „Now she leads a patient group. Her neighbour on the map: metachromatic leukodystrophy, M-L-D, linked by shared symptoms, formula shown." | `e_e270315fe572`, Badge `inferred`, Abschnitt „Formula (inferred)", Konfidenz 0,22 |
| 0:33–0:48 | `/d/MONDO_0009499/action?via=MONDO_0018868` Action Card | Spalten „What transfers / What differs / Needs expert review", ein `[e_…]`-Zitat anklicken, Abschnitt „Approved therapies" ins Bild | „The Action Card: what carries over, what differs, what an expert must check. MLD has an approved gene therapy, and a study of how the disease unfolds over time.** That study design exists." | `[e_…]` öffnet Edge-Panel; „Approved therapies" Libmeldy `e_f3ef159024b6` (EMA 2020-12-17); „Reusable assets" HOME-Studie `e_7ee9ef63ec03` (NCT04628364, Natural history study) |
| 0:48–0:54 | `/d/MONDO_0012720` Krabbe disease due to saposin A deficiency | Abschnitte „What was searched, as of …" und „What would close this gap" | „Where there is no trail, we say so, and show what we searched." | ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2, Datum 2026-10-03 (Export prüfen) |
| 0:54–0:58 | `/about`, Überschrift „Your family is not the first …", URL sichtbar | kein Klick, Cursor weg | „Don't rebuild what a neighbouring disease already built." | URL |

Summe 0:58. Wortzahl Voice-over: 123 (je Szene ≤ 2,3 Wörter/s, nachgerechnet 01:20). Szenenzeiten gegenüber 01:15 verschoben (D1 +1 s, D2 −2 s, D7 +1 s), weil D1, D5, D6 und D7 vorher zu dicht waren.

\* Nur, wenn die Action Card für Krabbe „Approved therapies: Not found in EMA, FDA as of …" aus Pipeline-Daten zeigt (im Bild ab 0:34, also auch dann sprechbar, wenn es in Szene 1 noch nicht sichtbar ist). Stand 01:30: im Live-Tool belegt (Krabbe „Honest Gap" unter „Approved therapies"). Ersatzsatz nur noch für den Notfall: „Meet Maria, from the challenge brief. Her son has Krabbe disease, and families like hers end up leading the research." (C5-Brief S. 1.)

\** Stand 01:30 im Live-Tool belegt: Libmeldy (EMA) und Lenmeldy (FDA) unter „Approved therapies", HOME-Studie unter „Reusable assets". **Geändert gegenüber 01:15:** Früher hieß es „proven with a study that followed untreated children for years". Das ist medizinisch richtig (Fumagalli et al., Lancet 2022, PMID 35065785), aber diese Vergleichskohorte ist **nicht** im Tool sichtbar; die HOME-Studie im Bild ist eine andere Studie. Die Demo sagt deshalb nur, was die Karte zeigt. Im Pitch (ohne Tool im Bild, mit Fußnote) bleibt der alte Satz. Ersatz, falls die Karte vor dem Dreh anders aussieht: Nur, wenn der Abschnitt „Approved therapies" für MLD die Zulassung mit EMA- oder FDA-Quelle zeigt (Pipeline-Daten, kein „FIXTURE"-Badge). Ersatzsatz: „The MLD community already runs studies this group can ask to join, instead of starting from zero." (dazu die Studienliste der MLD-Seite kurz ins Bild; 48 Studien im Export). „That study design exists." entfällt dann.

Das Gegenbeispiel Pelizaeus-Merzbacher passt nicht in 60 s und bleibt im Tool (`mechanism differs`) und im Tech-Video.

**Aufnahme-Checkliste:** Live-URL (Production-Domain, nicht Deployment-URL) sichtbar; Browser-Zoom 110 %; Dark Mode; Cursor langsam, nach jedem Klick eine Sekunde stehen; keine Fixture-Badges, keine Dev-Hinweise, keine Konsole; Kanten-IDs aus Abschnitt 0 vorher im Live-Tool geöffnet. **Schnitt:** ein Take, Geschwindigkeit nicht verändern (höchstens Wartezeiten kürzen), Voice-over-Blöcke D1 bis D7 je Szene unterlegen, Untertitel aus dem Skript, Export MP4 H.264 1920×1080 30 fps, Länge unter 60 s prüfen. **Wer:** Recep nimmt auf und schneidet, Hanno liefert die MP3s, Osman Untertitel und Upload. **Deadline:** Probe-Take 08:00–09:00 gegen die Live-App, Aufnahme 12:00–12:30, Schnitt bis 13:30, Upload bis 14:00.

## 3. Technical Walkthrough · ≤ 60 s · Hanno, Terminal und Editor, Voice-over ElevenLabs

**Ziel:** Glaubwürdigkeit durch echten Code und echte Terminals in einer Minute: Architektur in einem Satz, Validator grün, drei OpenAI-Stellen mit Datei, E2E grün. Kriterien: Graph quality, Evidence integrity, Built with OpenAI.

**Zuschauer:** technische Jury, OpenAI-Track-Reviewer.

**Kernbotschaft:** Der Graph ist die Leitplanke: kein Satz ohne Quelle, kein Modell ohne Prüfung durch Code.

**Vorbereitung (vor 12:00):** `make validate` muss grün sein; `cd app && npm run build` einmal durch, damit `npm run e2e:run` ohne Build läuft; Editor mit den vier Dateien unten in Tabs, Schrift 16 pt, Zeilennummern an, Zeilenbereiche vor dem Dreh mit `grep -n` prüfen (Stand `origin/integrate` 6254cd1). Terminal-Schrift 16 pt, Fenster 1920×1080, Dark Theme in Editor und Terminal gleich.

### Shotlist

| Zeit | Bild | Datei und Zeilen / Terminal-Befehl (live tippen) | Voice-over (Englisch, Wort für Wort) |
|---|---|---|---|
| 0:00–0:11 | Terminal: `grep -nE '^[a-z]+:' Makefile` (Targets `fetch` bis `reproduce`), dahinter kurz das README-Diagramm | `Makefile` Zeilen 8–27 | „Open databases go through a Python pipeline into an evidence-graded graph, exported as static JSON for a Next.js app. No server database, nothing to go down." |
| 0:11–0:22 | Terminal: `make validate` live; letzte Zeile beginnt mit `hero:` und zeigt `Krabbe -> GALC ok · Krabbe family -> PSAP ok · …`; daneben Editor | `pipeline/validate.py` Zeilen 30 (`REQUIRED_EDGE_KEYS`, enthält `contradicting`) und 315–329 (Hero-Checks) | „make validate checks every edge: source, date, confidence, a counter-evidence field that may be empty but never missing. And it asserts the hero path exists." |
| 0:22–0:37 | Editor, zwei Dateien nacheinander | `pipeline/05_openai_extract.py` Zeilen 129 (`snippet_in_abstract`) und 226–233 (`validate_claim`); `pipeline/06_openai_reconcile.py` Zeilen 1–18 (Docstring: judge aus fünf Kandidaten oder `none`, Fuzzy-Fallback); `pipeline/openai_config.py` Zeilen 5–7 (`OPENAI_MODEL_EXTRACT`, `OPENAI_MODEL_JUDGE`, `OPENAI_MODEL_EMBED`) | „OpenAI at three points. Extract: claims from abstracts; code rejects any claim whose quoted snippet is not in the abstract. Reconcile: names to MONDO ids; the judge can only pick from five candidates, or none." |
| 0:37–0:47 | Editor, dann Browser Action Card mit Explain-Text | `app/lib/explain.ts` Zeilen 14–26 (Post-Check: `no edge citation` → `dropped`); `app/lib/prompts/explain.ts` Zeilen 8–10 (Regeln 2 bis 4); `app/app/api/explain/route.ts` Zeile 153 (`OPENAI_MODEL_EXPLAIN`) | „Explain, the third point: a sentence without a source is dropped and shown struck through. Model ids come from environment variables, never hard-coded." |
| 0:47–0:55 | Terminal: `cd app && npm run e2e:run`, grüne Zeilen `hero path @1280`, `hero path @375`, `dark mode renders the disease page` | `app/e2e/hero.spec.ts` Zeile 5 (Kommentar mit dem Pfad), Zeilen 29–32 | „The Playwright test clicks the hero path at desktop and phone width and fails on any console error." |
| 0:55–0:58 | Browser `/methods`, Abschnitt mit den Limits, oder README-Abschnitt „Limitations" | – | „Research navigation, not medical advice." |

Summe 0:58. Wortzahl Voice-over: 132.

Falls der E2E-Lauf länger als acht Sekunden braucht: vorher laufen lassen, im Video nur das grüne Ergebnis hochscrollen. Falls `make validate` länger als zehn Sekunden braucht: Ausgabe vorher erzeugen, im Video den Befehl tippen und auf das fertige Fenster schneiden; nichts fälschen, nur die Wartezeit schneiden.

**Offenlegung (Pflicht, als Untertitel bei 0:55 oder in der Video-Beschreibung):** „Voice-over generated with ElevenLabs (Eleven v4). Code written with Claude Code. Patient-organisation facts pre-extracted from public websites via Bright Data and OpenAI, verified by hand." Der dritte Satz nur, wenn Bright Data bis dahin tatsächlich gelaufen ist (`BRIGHTDATA_ZONE`, STATUS.md).

**Aufnahme-Checkliste:** Terminal und Editor 16 pt, Dark Theme; Terminal-Prompt ohne Hostname, Pfade ohne Benutzername (kein `/Users/<name>`); keine `.env`-Dateien, keine Keys, keine Tabs mit privaten Daten im Bild; Browser mit Live-URL für die Explain-Szene; Zeilennummern vorher per `grep -n` gegen den Stand des Freezes geprüft. **Schnitt:** harte Schnitte, Voice-over-Block T1 als ein Request, Untertitel aus dem Skript, Export MP4 H.264 1920×1080 30 fps, Länge unter 60 s. **Wer:** Hanno nimmt auf und schneidet, Osman Upload. **Deadline:** Aufnahme 12:00–12:45, Schnitt bis 13:30, Upload bis 14:00.

## 4. Gemeinsame Checkliste vor dem Dreh (12:00)

1. Alle Kanten-IDs aus Abschnitt 0 im Live-Tool öffnen und den Evidenz-Eintrag lesen. Weicht eine ID ab (neuer Export), Skript und `.tts.txt` anpassen.
2. Action Card `?via=MONDO_0018868` ansehen: Welche Abschnitte stehen wirklich da? Voice-over an die Karte anpassen, nicht umgekehrt. Ein „FIXTURE"-Badge darf nirgends erscheinen. Entscheidung über * und ** fällt hier.
3. Honest-Gap-Fall bestätigt (Hanno und Osman): `MONDO:0012720`; Coverage-Zahlen im Shard lesen.
4. Jede Zahl im Voice-over steht in MEDICAL-BACKGROUND mit Quelle oder im Export, oder sie fliegt raus. Aktuell werden keine Zahlen gesprochen.
5. Production-Domain in der Browserleiste, nicht die Deployment-URL.
6. Upload-Format in HackOS geprüft (Osman): Datei MP4/MOV direkt oder Link. Nach dem Upload jeden Link im privaten Fenster öffnen, Länge und Ton prüfen.
7. Alle drei Links bis 13:45 im Teamboard (Bereich Links) und in `docs/STATUS.md`.
