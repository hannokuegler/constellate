# Video-Strategie · drei Pflichtvideos, je maximal 60 Sekunden

Stand So 04.10.2026, 04:25 (Europe/Vienna), Branch `recep-video`: Team-Texte nach den Antworten von Osman und Recep; P14–P16 aus `origin/orchestrator` berücksichtigt. **Maria gehört nur in Video und Pitch; die App hat keine Persona-Auswahl.** Verbindlich sind **drei Videos, jedes höchstens 60 Sekunden, MP4 oder MOV**: Team Introduction, Product Demo, Technical Walkthrough. Die Product Demo erfüllt den Brief-Walkthrough. Produktionsablauf und offene Entscheidungen: [VIDEO-ACTIONPLAN.md](VIDEO-ACTIONPLAN.md).

Für alle drei: Englisch, Querformat, vorerst ohne Musik (Entscheidung Hanno offen), finale Aufnahme nach dem Freeze (So 12:00), Upload bis 14:00. Shotlists zielen auf 0:58, zwei Sekunden Puffer für Schnitt und Export. Voice-over mit ca. 2,3 Wörtern/s, höchstens 135 Wörter je Video; Blöcke in [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md). Jeder gesprochene Produkt- oder Evidenzfakt muss im selben Moment im Tool sichtbar sein; eine spätere Szene oder eine Quelle nur im Repo reicht nicht. Maria wird als Figur aus dem C5-Brief eingeführt, mit „Maria: persona from the challenge brief, not a real person" im Bild. Ein Fachwort wird im selben Moment im Bild erklärt. Keine Prognosen, echten Patientengeschichten, Kinder oder Krankenhäuser im Bild.

**Export für alle drei:** MP4, H.264, 1920×1080, 30 fps, Ton AAC 48 kHz; MOV ist als Alternative erlaubt (Vorgabe). Dateinamen `constellate_team.mp4`, `constellate_demo.mp4`, `constellate_tech.mp4`. Länge nach Export mit `ffprobe` prüfen: **unter 60,0 s**, sonst wird der Clip nicht angenommen.

## 0. Befunde aus dem Export, die für den Dreh gelten

Geprüft gegen `app/public/data/` (Version `2026-10-04+f35b3a5`, kein Fixture), vor dem Dreh gegen den dann aktuellen Export wiederholen (Skript über die Shards, nie die Dateien in den Kontext laden).

| Befund | Folge |
|---|---|
| `e_e270315fe572` (Krabbe → MLD) ist eine `similar_phenotype`-Kante, `inferred`, Konfidenz 0,216, Formel vorhanden, `mechanism_differs = false`. Es ist nicht die „shared gene PSAP"-Kante. | Demo sagt „linked by shared symptoms, formula shown"; die PSAP-Brücke zeigt `/g/PSAP`. |
| **Update 04.10. 01:30, Export `2026-10-04+f35b3a5`:** `approved_therapies`, `assets`, `newborn_screening` sind live. Action Card zeigt Libmeldy (`e_f3ef159024b6`, EMA 2020-12-17), Lenmeldy (`e_62876fa60e22`, FDA 2024-03-18), für Krabbe „Honest Gap: Not found in EMA … FDA … as of 2026-10-03", HOME-Studie `e_7ee9ef63ec03` (NCT04628364, Natural history study). Stand davor: fehlten (PR #1). | D1 bleibt ohne Therapie-Aussage. In D5 Zulassung und Studie nur gleichzeitig mit den jeweiligen Quellenabschnitten zeigen und sprechen; sonst Ersatztext. |
| `data/curated/orgs.csv` hat nur die Kopfzeile; `docs/MOONSHOT.md` fehlt. | Keine Organisation, keine 10×-Zahl in keinem Video. |
| Honest-Gap-Fall `MONDO:0012720` „Krabbe disease due to saposin A deficiency" (P11): ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2, abgefragt 2026-10-03; Gen PSAP (`e_795da9c4a6cd`, OMIM:611722). | Gap-Szene zeigt „What was searched, as of …" und „What would close this gap". Zahlen werden nicht vorgelesen, sie stehen im Bild. |
| `app/public/data/trial/` enthält 142 Studien-Shards. | Die Studienliste darf kurz im Bild sein; kein eigener Satz dazu (Zeit). |

Hero-Kanten im Export verifiziert: `e_3dbc42738b5a` (Krabbe → GALC, curated, OMIM:245200 via HPO, Konfidenz 0,90, Counter-evidence 0), `e_2c5236d2f740` (Krabbe → PSAP, inferred, Roll-up aus ORPHA:206436, Konfidenz 0,475), `e_795da9c4a6cd` (Saposin A → PSAP, OMIM:611722), `e_316e60c8ee91` (MLD due to saposin B → PSAP, OMIM:249900), `e_b4f9b02250a7` (Gaucher due to saposin C → PSAP, ORPHA:309252, OMIM:610539), `e_00a92bfb7837` (Krabbe → Pelizaeus-Merzbacher, similar_phenotype, `mechanism_differs = true`).

## 1. Team Introduction · ≤ 60 s · Osman filmt, echte Gesichter, echte Stimmen, kein Voice-over

Umgebaut nach Osmans Feedback (04.10., 01:15 und 01:40): Das Team-Video zeigt **die Menschen und ihre Interessen**, nicht ihren Beitrag zum Projekt und keinen Projekt-Schlusssatz je Person. Wer was gebaut hat, sieht die Jury in Demo und Tech-Video.

**Ziel:** Drei Menschen, denen man eine Mutter um zwei Uhr nachts anvertrauen würde: ruhig, konkret, kein Pitch. Die Jury sieht, wer hinter dem Tool steht, was jeder mitbringt und warum ihn das Thema packt.

**Zuschauer:** Jury, Hack-Nation-Community.

**Kernbotschaft:** Drei verschiedene Hintergründe (Daten und Rettungsdienst, Risiko und Geodaten, KI-Automation), gemeinsames Interesse an Daten und Gesundheit. Der Bogen zum Projekt kommt erst im gemeinsamen Schluss.

**Form:** Handy quer (16:9), gleicher Ort, Tageslicht, derselbe Hintergrund, Kamera auf Augenhöhe, eine Person pro Take, ohne Zoom. Keine KI-Stimme, kein Avatar, kein Voice-over. Öffentliche Verwendung von Osman und Recep bestätigt; Hanno bestätigt seine Einwilligung vor dem Dreh. Namens-Einblendung unten links während des jeweiligen Takes, Untertitel aus dem Schnittprogramm.

### Shotlist

| Zeit | Bild | Einblendung | Text |
|---|---|---|---|
| 0:00–0:02 | Titelkarte, Klartext: „Constellate · Vienna Hub · Hack-Nation C5" | – | kein Ton |
| 0:02–0:18 | Hanno, Brustbild | Hanno Kügler · BSc WU Vienna (Data Science) · MSc WU & Dipl.-Ing. TU Wien · EMT, Red Cross | Text H unten |
| 0:18–0:34 | Osman, Brustbild | Osman · Business Informatics (WU Vienna) · Retail Risk and Methodology, Raiffeisen Bank International | Text O unten |
| 0:34–0:50 | Recep, Brustbild | Recep Bas · TGM Vienna, Industrial Engineering and Business Informatics | Text R unten |
| 0:50–0:57 | alle drei im Bild | – | Hanno: „Your family is not the first." Recep: „What you need may already exist under another disease's name." Osman: „We're Constellate, Vienna Hub." |
| 0:57–0:58 | Schlussbild `/about` mit URL, oder die Titelkarte | – | kein Ton |

Ziel 0:58. Je Person 16 s: Osman und Recep je 34 Wörter; Hanno unverändert 41 Wörter (ca. 2,56 Wörter/s). Der gemeinsame Schluss hat 21 Wörter in 7 s und muss ebenfalls geprobt werden. Keine Timing-Freigabe allein durch Wortzahl: vor dem Dreh mit Stoppuhr prüfen, Pausen und Titelzeit bei Bedarf neu verteilen; Hannos Wortlaut und der gemeinsame Schluss bleiben unverändert.

### Sprechtexte v4 · bestätigter Background, Wortzahlen mit `wc -w`

Aufbau je Person: wer ich bin → was ich studiere/mache → meine Interessen. **Kein eigener Schlusssatz mit Projektbezug mehr** (Osman: „auf Krampf", verwirrend). Die Interessen dürfen allgemein Richtung Gesundheit/Medizin zeigen, nicht auf seltene Krankheiten. Den Bogen zum Projekt macht nur der gemeinsame Schluss.

**Text H · Hanno (41 Wörter, Wortlaut final)**

```
Hi, I'm Hanno. I studied business and economics with a data science focus at WU Vienna, now a double master's at WU and TU Wien. I'm an EMT and first-aid trainer with the Red Cross, and I'm into AI and automation.
```

**Text O · Osman (34 Wörter)**

```
Hi, I'm Osman. I study business informatics at WU Vienna and work in retail risk and methodology at Raiffeisen Bank International. I'm interested in geospatial data and building solutions that matter, including in healthcare.
```

**Text R · Recep (34 Wörter)**

```
Hey, I'm Recep. I graduated from TGM in industrial engineering with a focus on business informatics. I build AI projects and explore agents, harnesses, and medical knowledge tools that help patients and doctors learn.
```

**Vor dem Dreh klären:** ruhigen Drehort festlegen, Hannos Einwilligung bestätigen, alle Texte und den gemeinsamen Schluss stoppen. Arbeitgeber, Studienform, TGM-Bezeichnung, Interessen und Namens-Einblendungen sind geklärt.

Regeln: kein „revolutionary", kein „cure", keine Zahlen, keine Organisationsnamen aus der Patientenwelt, keine Geschichte einer fremden Familie.

**Aufnahme-Checkliste:** Handy quer, 1080p 30 fps, Flugmodus an; Mikro des Handys reicht, wenn der Raum ruhig ist; Licht von vorn, Fenster nicht im Rücken; drei Takes je Person, den ruhigsten nehmen; jeder spricht frei nach dem Text oben, nicht abgelesen. **Schnitt:** nur kürzen, harte Schnitte, keine Übergänge, keine Musik; Untertitel; Export MP4 H.264 1920×1080 30 fps. **Wer:** Osman filmt und schneidet, Recep prüft Länge und Untertitel. **Deadline:** gemeinsamer Dreh 12:00–12:20, Schnitt bis 13:15, Upload bis 14:00.

## 2. Product Demo · ≤ 60 s · Recep nimmt auf, Voice-over ElevenLabs (P10)

**Ziel:** Die Jury sieht in einem Take das Problem, die Herangehensweise und die Lösung an Marias Weg, dazu einmal die ehrliche Lücke. Kriterien aus dem Brief: Patient progress, Evidence integrity, Product craft. Erfüllt zugleich die Brief-Vorgabe „1-minute walkthrough".

**Zuschauer:** Jury und Öffentlichkeit ohne Medizinwissen.

**Kernbotschaft:** Dein Problem hat einen Nachbarn, der es schon halb gelöst hat, und die Karte zeigt dir mit Quelle, wo.

**Dramaturgie:** Problem und Himmel (0:00–0:10) → Herangehensweise: Karte mit Quelle, ein Gen, vier Namen (0:10–0:24) → Lösung: Nachbar MLD, Action Card (0:24–0:48) → Honest Gap (0:48–0:54) → Schlusssatz (0:54–0:58).

**Seit P16 (Hanno 02:40):** In der App gibt es keine Personas, keine Linsen und keine Moment-Karten mehr. Die Startseite ist eine Scroll-Story („Brille aufsetzen"): ein unscharfer Himmel aus echten, isolierten Punkten, die Brille macht die Sternbilder sichtbar, dann fährt die Kamera auf Krabbe → GALC/PSAP → MLD → Honest Gap. Maria gibt es nur noch in Video und Pitch. Szenen 0:00–0:10 und 0:54–0:58 ab ca. 05:00 gegen `origin/design-v2` prüfen (Texte, Suchfeld, Scroll-Tempo).

**Aufnahme:** Hero-Pfad stumm in einem Take durchklicken (zwei bis drei Takes, den ruhigsten nehmen), Voice-over im Schnitt unterlegen. Live-URL `https://constellate-vert.vercel.app` in der Browserleiste, Fenster 1920×1080, Browser-Zoom 110 %, Dark Mode (vorher an 375 px und Dark Mode getestet, BUGS.md), Cursor langsam, Mausklicks sichtbar (QuickTime ⌘⇧5 mit „Mausklicks anzeigen", oder OBS). Keine Lesezeichen-Leiste, keine anderen Tabs.

### Shotlist

| Zeit | Screen / Route | Klick / sichtbar | Voice-over (Englisch, Wort für Wort) | Beleg im Bild |
|---|---|---|---|---|
| 0:00–0:10 | `/` Startseite, Scroll-Story: unscharfer Himmel → „Brille" → Sternbilder sichtbar | langsam scrollen bis die Sternbilder scharf sind, dann „Krabbe" ins Suchfeld (Ort in design-v2 prüfen) | „Meet Maria, from the challenge brief. Her son has Krabbe disease, and she leads a patient group." | Einblendung „Maria: persona from the challenge brief, not a real person"; echte Punkte im Bild |
| 0:10–0:17 | `/d/MONDO_0009499` Krabbe disease, Graph | Linie Krabbe → GALC anklicken, Edge-Panel öffnet | „She types Krabbe. Every line shows its source, how sure we are, what speaks against it." | `e_3dbc42738b5a`, Badge `curated`, OMIM:245200, Konfidenz 0,90, „Counter-evidence (0)" |
| 0:17–0:24 | `/g/PSAP` „One gene, 4 disease names" | vom Gen-Kästchen PSAP auf die Gen-Seite, Zeilen Saposin A, B, C sichtbar | „One gene, P-S-A-P, sits behind four disease names. Names hide what they share." | `e_795da9c4a6cd` OMIM:611722 · `e_316e60c8ee91` OMIM:249900 · `e_b4f9b02250a7` ORPHA:309252 / OMIM:610539 |
| 0:24–0:33 | zurück `/d/MONDO_0009499`, direkt zu „Related communities" scrollen (kein Umschalter mehr, P16) | Zeile „metachromatic leukodystrophy", Button „Why linked", Edge-Panel | „Below, the related communities. Her neighbour on the map: metachromatic leukodystrophy, M-L-D, linked by shared symptoms, formula shown." | `e_e270315fe572`, Badge `inferred`, Abschnitt „Formula (inferred)", Konfidenz 0,22 |
| 0:33–0:48 | `/d/MONDO_0009499/action?via=MONDO_0018868` Action Card | Spalten „What transfers / What differs / Needs expert review", ein `[e_…]`-Zitat anklicken, Abschnitt „Approved therapies" ins Bild | „The Action Card: what carries over, what differs, what an expert must check. MLD has an approved gene therapy, and a study of how the disease unfolds over time.** That study design exists." | `[e_…]` öffnet Edge-Panel; „Approved therapies" Libmeldy `e_f3ef159024b6` (EMA 2020-12-17); „Reusable assets" HOME-Studie `e_7ee9ef63ec03` (NCT04628364, Natural history study) |
| 0:48–0:54 | `/d/MONDO_0012720` Krabbe disease due to saposin A deficiency | Abschnitte „What was searched, as of …" und „What would close this gap" | „Where there is no trail, we say so, and show what we searched." | ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2, Datum 2026-10-03 (Export prüfen) |
| 0:54–0:58 | `/` Startseite, Himmel mit sichtbaren Sternbildern (Ende der Scroll-Story), oder `/about`; URL sichtbar | kein Klick, Cursor weg | „Don't rebuild what a neighbouring disease already built." | URL |

Summe 0:58. Wortzahl und Szenentempo siehe VOICE-ELEVENLABS; tatsächliche Dauer im Probe-Take prüfen. D1 führt Maria als Gruppenleiterin aus dem Brief ein, D4 benötigt keinen Umschalter. „anywhere in the world" bleibt bis zu Hannos Entscheidung draußen; EMA/FDA-Daten belegen keine weltweite Aussage.

D1 enthält keine Therapie-Aussage: Die Scroll-Story oder Motion zeigt dafür keinen gleichzeitigen Beleg. Auch ein späteres Bild der Action Card genügt nicht. Maria und ihre Rolle sind im Intro als Brief-Persona gekennzeichnet.

\** Stand 01:30 im Live-Tool belegt: Libmeldy (EMA) und Lenmeldy (FDA) unter „Approved therapies", HOME-Studie unter „Reusable assets". **Geändert gegenüber 01:15:** Früher hieß es „proven with a study that followed untreated children for years". Das ist medizinisch richtig (Fumagalli et al., Lancet 2022, PMID 35065785), aber diese Vergleichskohorte ist **nicht** im Tool sichtbar; die HOME-Studie im Bild ist eine andere Studie. Die Demo sagt deshalb nur, was die Karte zeigt. Im Pitch (ohne Tool im Bild, mit Fußnote) bleibt der alte Satz. Ersatz, falls die Karte vor dem Dreh anders aussieht: Nur, wenn der Abschnitt „Approved therapies" für MLD die Zulassung mit EMA- oder FDA-Quelle zeigt (Pipeline-Daten, kein „FIXTURE"-Badge). Ersatzsatz: „The MLD community already runs studies this group can ask to join, instead of starting from zero." (dazu die Studienliste der MLD-Seite kurz ins Bild; 48 Studien im Export). „That study design exists." entfällt dann.

Das Gegenbeispiel Pelizaeus-Merzbacher passt nicht in 60 s und bleibt im Tool (`mechanism differs`) und im Tech-Video.

**Aufnahme-Checkliste:** Live-URL (Production-Domain, nicht Deployment-URL) sichtbar; Browser-Zoom 110 %; Dark Mode; Cursor langsam, nach jedem Klick eine Sekunde stehen; keine Fixture-Badges, keine Dev-Hinweise, keine Konsole; Kanten-IDs aus Abschnitt 0 vorher im Live-Tool geöffnet. **Schnitt:** ein Take, Geschwindigkeit nicht verändern (höchstens Wartezeiten kürzen), Voice-over-Blöcke D1 bis D7 je Szene unterlegen, Untertitel aus dem Skript, Export MP4 H.264 1920×1080 30 fps, Länge unter 60 s prüfen. **Wer:** Recep nimmt auf und schneidet, Hanno liefert die MP3s, Osman unterstützt die Untertitel; Recep lädt die Demo hoch. **Deadline:** Probe-Take 08:00–09:00 gegen die Live-App, Aufnahme ab 12:00 vorbereiten, nach Team-Dreh 12:20–12:45 stumm aufnehmen, Schnitt bis 13:30, Upload bis 14:00.

### 2a. Motion-Opener: ja, kurz oder nein? (Frage an Hanno seit P16, 02:45)

Stand vorher (01:25): Motion-Hybrid mit 10 s Opener und 4 s Outro (Prompts 7 und 8 in [MOTION-PROMPTS.md](MOTION-PROMPTS.md)). Seit P16 ist die echte Startseite selbst ein animierter Himmel, der sich zu Sternbildern ordnet. Ein Motion-Himmel davor zeigt dasselbe Bild zweimal.

| Option | Was | Pro | Contra |
|---|---|---|---|
| **A · nein** (Empfehlung) | Opener und Outro sind die echte Scroll-Story (0:00–0:10 und 0:54–0:58) | echte Daten statt Illustration (Evidence integrity), keine Doppelung, keine Credits, kein Prüfaufwand für Motion-Output, Jury sieht ab Sekunde 0 das Produkt | hängt an design-v2; ist die Story bis 09:00 nicht stabil, fehlt der Wow-Einstieg |
| B · kurz | 3 s Motion-Titel („Constellate", nur Wortmarke) innerhalb der 10 s Introzeit vor der Scroll-Story; D1 neu timen | kinoreifer erster Moment | zwei Himmel hintereinander, 3 s weniger für Inhalte, Credits |
| C · wie geplant | 10 s Motion-Opener + 4 s Outro | maximal „Film" | doppelt zur Startseite, frisst ein Viertel der Demo, Motion erfindet Bilder neben echten Daten |

**Entscheidung Hanno offen:** Osman und Recep bevorzugen den Motion-Hybrid; die Empfehlung seit P16 bleibt A. Bis 09:00 A/B/C auswählen. A: echte Scroll-Story. B: 3 s Titel innerhalb der bestehenden 10 s Introzeit, D1 neu timen. C: Prompt 7 (10 s) und 8 (4 s) ersetzen Anfang und Ende; die Mitte bleibt echte App. Bei instabiler Scroll-Story entscheidet Hanno über den 5-s-Ersatz aus Prompt 7; restliche Introzeit mit echtem App-Bild füllen und neu timen. Keine Variante verlängert die 58-s-Timeline. Motion vor 11:00 erzeugen und gegen die Verbotsliste prüfen; unbrauchbare Clips durch geprüfte App-Bilder ersetzen. Musik separat entscheiden, bis dahin ohne.

## 3. Technical Walkthrough · ≤ 60 s · Hanno, Terminal und Editor, Voice-over ElevenLabs

**Ziel:** Glaubwürdigkeit durch echten Code und echte Terminals in einer Minute: Architektur in einem Satz, Validator grün, die drei Verarbeitungsschritte mit Datei (seit P15, 01:40: Extract und Explain mit Claude Sonnet 5.5, Reconcile als Fuzzy-Fallback, OpenAI-Pfade bleiben per Key aktivierbar), E2E grün. Kriterien: Graph quality, Evidence integrity. **Offen:** Die Claude-Dateien für Extract und Explain gibt es um 01:40 in keinem Branch; Dateinamen und Zeilen in den Zeilen 0:22–0:47 unten trägt Hanno nach, sobald gebaut. Die tatsächlich ausgeführten Claude-Dateien und Fuzzy-Match-Stellen müssen sichtbar sein; alte OpenAI-Dateien belegen diese Aussagen nicht.

**Zuschauer:** technische Jury.

**Kernbotschaft:** Der Graph ist die Leitplanke: kein Satz ohne Quelle, kein Modell ohne Prüfung durch Code.

**Vorbereitung (vor 12:00):** `make validate` muss grün sein; `cd app && npm run build` einmal durch, damit `npm run e2e:run` ohne Build läuft; Editor mit den benötigten Dateien unten in Tabs, Schrift 16 pt, Zeilennummern an, Zeilenbereiche vor dem Dreh mit `grep -n` prüfen (Stand `origin/integrate` 6254cd1). Terminal-Schrift 16 pt, Fenster 1920×1080, Dark Theme in Editor und Terminal gleich.

### Shotlist

| Zeit | Bild | Datei und Zeilen / Terminal-Befehl (live tippen) | Voice-over (Englisch, Wort für Wort) |
|---|---|---|---|
| 0:00–0:11 | Terminal: `grep -nE '^[a-z]+:' Makefile` (Targets `fetch` bis `reproduce`), dahinter kurz das README-Diagramm | `Makefile` Zeilen 8–27 | „Open databases feed a Python pipeline, exporting an evidence-graded graph as static JSON for a Next.js app. No server database." |
| 0:11–0:22 | Terminal: `make validate` live; letzte Zeile beginnt mit `hero:` und zeigt `Krabbe -> GALC ok · Krabbe family -> PSAP ok · …`; daneben Editor | `pipeline/validate.py` Zeilen 30 (`REQUIRED_EDGE_KEYS`, enthält `contradicting`) und 315–329 (Hero-Checks) | „Make validate checks sources, dates, confidence and counter-evidence fields, and asserts the hero path exists." |
| 0:22–0:37 | Editor, zwei Dateien nacheinander | Claude-Extract-Datei und laufende Fuzzy-Match-Datei samt Prüfstellen: Hanno trägt Pfade und Zeilen bis 11:00 nach | „Extract: Claude turns abstracts into claims. Code rejects quotes missing from the abstract. Reconcile maps names to MONDO ids by fuzzy match." |
| 0:37–0:47 | Editor, dann Browser Action Card mit Explain-Text | Claude-Explain-Datei und Citation-Post-Check: Hanno trägt Pfade und Zeilen bis 11:00 nach; tatsächliches Verhalten im Browser prüfen | „Explain: Claude writes the Action Card. A sentence without a source is dropped and shown struck through." |
| 0:47–0:55 | Terminal: `cd app && npm run e2e:run`, grüne Zeilen `hero path @1280`, `hero path @375`, `dark mode renders the disease page` | `app/e2e/hero.spec.ts` Zeile 5 (Kommentar mit dem Pfad), Zeilen 29–32 | „Playwright clicks the hero path at desktop and phone width, failing on console errors." |
| 0:55–0:58 | Browser `/methods`, Abschnitt mit den Limits, oder README-Abschnitt „Limitations" | – | „Research navigation, not medical advice." |

Summe 0:58. Wortzahl Voice-over siehe T1 in VOICE-ELEVENLABS; Codepfade und Aussagen vor dem Freeze am laufenden Stand prüfen.

Falls der E2E-Lauf länger als acht Sekunden braucht: vorher laufen lassen, im Video nur das grüne Ergebnis hochscrollen. Falls `make validate` länger als zehn Sekunden braucht: Ausgabe vorher erzeugen, im Video den Befehl tippen und auf das fertige Fenster schneiden; nichts fälschen, nur die Wartezeit schneiden.

**Offenlegung (Pflicht, als Untertitel bei 0:55 oder in der Video-Beschreibung):** „Voice-over generated with ElevenLabs (Eleven v4). Code written with Claude Code. Patient-organisation facts pre-extracted from public websites via Bright Data and OpenAI, verified by hand." Der dritte Satz nur, wenn Bright Data bis dahin tatsächlich gelaufen ist (`BRIGHTDATA_ZONE`, STATUS.md).

**Aufnahme-Checkliste:** Terminal und Editor 16 pt, Dark Theme; Terminal-Prompt ohne Hostname, Pfade ohne Benutzername (kein `/Users/<name>`); keine `.env`-Dateien, keine Keys, keine Tabs mit privaten Daten im Bild; Browser mit Live-URL für die Explain-Szene; Zeilennummern vorher per `grep -n` gegen den Stand des Freezes geprüft. **Schnitt:** harte Schnitte, Voice-over-Block T1 als ein Request, Untertitel aus dem Skript, Export MP4 H.264 1920×1080 30 fps, Länge unter 60 s. **Wer:** Hanno nimmt auf, schneidet und lädt Tech hoch; Osman unterstützt die Untertitel. **Deadline:** Vorbereitung ab 12:00, nach Team-Dreh Aufnahme 12:20–12:45, Schnitt bis 13:30, Upload bis 14:00.

## 4. Gemeinsame Checkliste vor dem Dreh (12:00)

1. Alle Kanten-IDs aus Abschnitt 0 im Live-Tool öffnen und den Evidenz-Eintrag lesen. Weicht eine ID ab (neuer Export), Skript und `.tts.txt` anpassen.
2. Action Card `?via=MONDO_0018868` ansehen: Welche Abschnitte stehen wirklich da? Voice-over an die Karte anpassen, nicht umgekehrt. Ein „FIXTURE"-Badge darf nirgends erscheinen. D5 vor Skript-Freeze um 11:00 festlegen; um 12:00 nur erneut prüfen. Bei Änderungen Ersatztext und MP3 aktualisieren.
3. Honest-Gap-Fall bestätigt (Hanno und Osman): `MONDO:0012720`; Coverage-Zahlen im Shard lesen.
4. Jede Zahl im Voice-over steht in MEDICAL-BACKGROUND mit Quelle oder im Export, oder sie fliegt raus. Produktzahlen nur nennen, wenn sie gleichzeitig im Bild stehen.
5. Production-Domain in der Browserleiste, nicht die Deployment-URL.
6. Upload auf der offiziellen Hackathon-Webseite (laut Osman); Osman prüft dort bis 09:00 die konkreten Datei-/Link-Felder. Nach dem Upload jeden Link im privaten Fenster öffnen, Länge und Ton prüfen.
7. Alle drei Links nach Prüfung im privaten Fenster bis 14:00 in `pitch/SUBMISSION-TEXTS.md` §9 eintragen.
