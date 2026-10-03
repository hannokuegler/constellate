# 60-Sekunden-Pitch · Constellate

Stand So 04.10.2026, 01:00 (Wien). Fassung nach dem Team-Feedback: weniger Fachbegriffe, Reihenfolge **Problem → Herangehensweise → Lösung → Schluss**, verständlich ohne Medizinwissen. Englisch, Wort für Wort, Regie in eckigen Klammern (nicht sprechen). Jede medizinische Aussage trägt ihre Primärquelle in der Fußnote, nicht im gesprochenen Text. Zahlen stammen aus [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) (ohne ⚠️) oder `app/public/data/meta.json` (Export `2026-10-04+f35b3a5`). Nora ist eine Komposit-Figur (DECISIONS P9).

Einsatz: Live-Pitch 10.10. (falls Top 2, als erste Minute), Discord-Post als Text, HackOS-Feld „Description". Für die drei 60-s-Videos gelten die Skripte in [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md); die Demo folgt derselben Dramaturgie.

## Hauptfassung · „Herz zuerst" · 60 s

Tempo ruhig, ca. 2,3 Wörter pro Sekunde. Fett = Betonung. Pausen sind Teil der Minute.

**Problem (0:00–0:15)**

[Bild: Startseite von Constellate, die zwei Karten „We just got the diagnosis" und „I lead a patient group". Sprecher ruhig, kein Trailer-Ton. Blick ins Publikum.]

**Your family is not the first.** What you need may already exist under another disease's name.

[Pause, eine Sekunde.]

Imagine the night after the diagnosis. Your child has Krabbe disease. There is no approved medicine, anywhere in the world.¹

[Pause, zwei Sekunden. Nichts klicken.]

**Herangehensweise (0:15–0:35)**

[Bild: Gen-Seite `/g/PSAP`, Überschrift „One gene, 4 disease names".]

Constellate is a map of rare diseases, sorted by what goes wrong in the body, not by name. One gene, P-S-A-P, sits behind four different disease names.²

[Bild: Edge-Panel mit Quelle, Datum, Stufe, „Counter-evidence".]

Every line shows its source, how sure we are, what speaks against it.

**Lösung und Wirkung (0:35–0:55)**

[Bild: Krabbe-Seite, „Related communities", Zeile „metachromatic leukodystrophy".]

A Krabbe family sees its neighbour on the map: metachromatic leukodystrophy, M-L-D. MLD has an approved gene therapy, proven with a study that followed untreated children for years.³

[Pause, zwei Sekunden. Cursor steht.]

**That study design exists.**

[Bild: Action Card, Spalten „What transfers / What differs / Needs expert review".]

The family leaves with a one-page proposal: what carries over, what differs, what an expert must check.

**Schluss (0:55–1:00)**

[Bild: Honest-Gap-Screen `/d/MONDO_0012720`, dann `/about` mit URL in der Browserleiste.]

Where there is no trail, we say so.
**Don't rebuild what a neighbouring disease already built.**

[Stehen bleiben. Kein „thank you".]

Wortzahl: 141 (ohne Regie, gezählt mit `wc -w`). Bei 2,3 bis 2,4 Wörtern pro Sekunde 60 Sekunden einschließlich der drei Pausen.

### Gesprochener Text am Stück (zum Kopieren, Discord und HackOS)

Your family is not the first. What you need may already exist under another disease's name. Imagine the night after the diagnosis. Your child has Krabbe disease. There is no approved medicine, anywhere in the world. Constellate is a map of rare diseases, sorted by what goes wrong in the body, not by name. One gene, PSAP, sits behind four different disease names. Every line shows its source, how sure we are, what speaks against it. A Krabbe family sees its neighbour on the map: metachromatic leukodystrophy, MLD. MLD has an approved gene therapy, proven with a study that followed untreated children for years. That study design exists. The family leaves with a one-page proposal: what carries over, what differs, what an expert must check. Where there is no trail, we say so. Don't rebuild what a neighbouring disease already built.

## Kurzfassung · 30 s

[Bild: Startseite, dann Action Card.]

**Your family is not the first.** Your child has Krabbe disease, and there is no approved medicine anywhere in the world.¹ Constellate maps rare diseases by what goes wrong in the body, not by name. A Krabbe family sees its neighbour, M-L-D, which already has an approved gene therapy and the study behind it.³ Every line shows its source; where there is none, we say so. **Don't rebuild what a neighbouring disease already built.**

Wortzahl: 73. Einsatz: Flur-Gespräch, Mentor-Session, Discord-Kurztext.

## Fachwort-Liste · was ersetzt wurde und warum

Regel aus dem Team-Feedback: Ein Fachwort darf nur bleiben, wenn es im selben Moment im Bild erklärt wird. Alles andere wird übersetzt. Gilt für Pitch und für die gesprochenen Teile der drei Videos.

| Vorher (Fassung vom 03.10.) | Jetzt | Warum |
|---|---|---|
| knowledge graph, evidence-graded | a map of rare diseases | „Graph" ist für Nicht-Informatiker ein Diagramm; „map" ist das Bild, das die App zeigt |
| organised by mechanism | sorted by what goes wrong in the body, not by name | „Mechanismus" braucht Biologie; die Übersetzung sagt dasselbe in Alltagswörtern |
| edge | line (Pitch), link (Video) | „Edge" ist Graphentheorie; auf dem Bildschirm sieht man Linien |
| source, date, evidence level, confidence, counter-evidence | its source, how sure we are, what speaks against it | drei Dinge statt fünf; „Datum" und „Stufe" stehen im Edge-Panel im Bild |
| natural-history cohort of untreated children | a study that followed untreated children for years | Vorgabe aus dem Feedback; Fachbegriff bleibt in der Fußnote |
| metachromatic leukodystrophy | einmal voll, danach M-L-D | Vorgabe; der volle Name steht beim ersten Nennen im Bild (Zeile „Related communities") |
| PSAP | One gene, P-S-A-P | erlaubt, weil „a gene" davor steht und `/g/PSAP` im Bild ist |
| phenotype similarity, simGIC 0.22 | linked by shared symptoms, formula shown (nur Demo) | „Phänotyp" wird zu „Symptome"; die Formel ist im Edge-Panel sichtbar, der Wert wird nicht vorgelesen |
| inferred | computed by Constellate (Demo) bzw. weggelassen (Pitch) | die Stufe steht als Badge im Bild |
| Action Card: what transfers, what differs, needs expert review | a one-page proposal: what carries over, what differs, what an expert must check | „transfers" ohne Objekt ist unklar; „Action Card" bleibt nur, wenn die Karte im Bild ist |
| Honest Gap | where there is no trail, we say so | der Screen-Titel steht im Bild; der Satz erklärt ihn |
| stem-cell transplant, helps only before symptoms start | weggelassen | Therapiedetail ohne Nutzen für die Botschaft; bleibt in Fußnote 1 |
| hypomyelinating, lysosomal, PLP1 (Gegenbeispiel) | weggelassen im Pitch; in der Demo „the tool says no, with the reason shown" | nur mit Bild erklärbar; das Gegenbeispiel bleibt in der App und im Tech-Video |
| 874 diseases, 1,066 genes, 251 counter-example pairs, 17 clusters | weggelassen | Jury-Zahlen ohne Gefühl; stehen auf `/methods` und im Tech-Video |
| Louvain, Resnik, simGIC, Structured Outputs | nur Tech-Video, dort mit Datei im Bild | gehören zur technischen Glaubwürdigkeit, nicht zur Botschaft |
| cure | nie | Heilsversprechen; Constellate ist Forschungs-Navigation |

Bewusst behalten: „gene", „gene therapy", „diagnosis", „approved medicine", „study". Diese Wörter kennt jeder aus Nachrichten.

## Regie

- Tempo 130 bis 145 Wörter pro Minute; drei Pausen (nach „anywhere in the world", vor „That study design exists", vor dem Schlusssatz), zusammen fünf Sekunden.
- Betonung: „your family is not the first", „That study design exists", „Don't rebuild".
- „P-S-A-P" und „M-L-D" buchstabieren, „metachromatic leukodystrophy" einmal voll (Aussprache in [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md) §5).
- Nur Screens der echten App mit sichtbarer URL. Kein Bild von Kindern, kein Klinik-Stock, keine Musik.
- Maria wird im Pitch nicht genannt (keine Zeit für die Einordnung); in der Demo heißt sie Maria wie im C5-Brief und wird im ersten Satz als Persona aus dem Brief eingeführt (seit 04.10. 01:20, vorher Nora).

## Fußnoten (Primärquellen)

1. Krabbe: kein zugelassenes Medikament weltweit; HSCT ist die einzige etablierte Option und wirkt nur präsymptomatisch. GeneReviews NBK1238; Escolar et al., NEJM 2005, PMID 15901860. ([docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) §3)
2. PSAP: Saposin-A-Defizienz Krabbe-ähnlich (OMIM 611722), Saposin-B-Defizienz MLD-ähnlich (OMIM 249900), Saposin-C-Defizienz Gaucher-ähnlich (OMIM 610539). Drei Krankheitsnamen in drei Patientengemeinschaften (§5). Die App zeigt auf `/g/PSAP` vier Namen (die vierte ist die kombinierte PSAP-Defizienz, OMIM 611721); der Pitch sagt seit 04.10. 01:25 „four", weil `/g/PSAP` im Bild „One gene, 4 disease names" zeigt (Hinweis Orchestrator: gesprochen „three" gegen „4" im Bild wäre ein sichtbarer Widerspruch).
3. MLD-Gentherapie (atidarsagene autotemcel, Libmeldy/Lenmeldy): EU-Zulassung 17.12.2020 (EMA EPAR Libmeldy), FDA 18.03.2024 (FDA-Pressemitteilung). Wirksamkeit gegen Natural-History-Kohorte: 29 behandelte vs. 31 unbehandelte Kinder, Fumagalli et al., Lancet 2022, PMID 35065785 (§4, §8). Im Video nur sprechen, wenn die Action Card den Abschnitt „Approved therapies" mit EMA- oder FDA-Quelle aus Pipeline-Daten zeigt (siehe VIDEO-STRATEGY §2).
4. Nicht mehr im gesprochenen Text, als Reserve für Q&A: `app/public/data/meta.json` Version `2026-10-04+f35b3a5`: 874 Krankheiten (350 Kern), 1.066 Gene, 4.717 Phänotype im Index; 14.512 observed, 27.066 curated, 4.181 inferred, 488 contradicted; 251 Gegenbeispiel-Paare; 17 Cluster. Vor dem Pitch gegen den aktuellen Export prüfen.
5. Q&A-Reserve: C5-Challenge-Brief S. 2, 10.000 bekannte seltene Krankheiten, unter 5 % mit zugelassener Therapie.
