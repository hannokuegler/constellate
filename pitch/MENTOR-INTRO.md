# Mentor-Gespräch Woan-Yu Lin · Vorstellung in Pitch-v2-Sprache

Stand So 04.10.2026, 01:30 (Wien). Vorschlag der Marketing-Session als Ersatz für Abschnitt 2 (nur der Vorstellungstext) in [docs/mentoring/MENTOR-LIN.md](../docs/mentoring/MENTOR-LIN.md); Demo-Route, Kernfrage, Fragenliste und "Was wir NICHT behaupten" bleiben dort unverändert. Sprecher: Hanno. Gleiche Dramaturgie wie [PITCH-60S.md](PITCH-60S.md): Problem → Herangehensweise → Lösung → Frage an sie.

## 60-Sekunden-Vorstellung (Englisch, 146 Wörter, ca. 60 s bei 2,4 Wörtern/s)

"You help foundations decide where scarce money goes. We built a tool for the step before that decision.

The problem: a family gets a rare diagnosis, and there is often nothing to start from. Krabbe disease has no approved medicine, anywhere in the world.¹

Our approach: Constellate is a map of rare diseases, sorted by what goes wrong in the body, not by name. One gene, P-S-A-P, sits behind three disease names: one like Krabbe, one like M-L-D, one like Gaucher.² Every line shows its source, how sure we are, and what speaks against it.

The result: a Krabbe group sees its neighbour M-L-D, which already has an approved gene therapy, proven with a study that followed untreated children for years.³ The group leaves with a one-page proposal: what carries over, what differs, what an expert must check. Where there is no trail, we say so."

Danach direkt die Kernfrage, unverändert aus MENTOR-LIN.md §3:

"If a Krabbe foundation had one grant to give next year, which milestone would you fund first, and what would our Action Card have to show for you to recommend it?"

Und als Brücke zu Frage 3 (Mechanismus → Modalität), nur falls Zeit ist:

"One thing we don't do yet: link what goes wrong in the body to the kind of therapy that could fit. We'd value your view on that."

## Was sich gegenüber der Fassung in MENTOR-LIN.md ändert

| Vorher | Jetzt | Warum |
|---|---|---|
| evidence-graded knowledge graph of 874 rare diseases, lysosomal storage diseases plus leukodystrophy neighbours | a map of rare diseases, sorted by what goes wrong in the body | Pitch-v2-Regel: keine Zahlen und keine Fachwörter im gesprochenen Text; 874 bleibt Q&A-Reserve (meta.json) |
| organised by mechanism rather than by name | sorted by what goes wrong in the body, not by name | Fachwort-Liste PITCH-60S.md |
| source, date, evidence level and a counter-evidence slot | its source, how sure we are, and what speaks against it | drei statt vier Dinge, im Edge-Panel steht der Rest |
| natural-history cohort of untreated children | a study that followed untreated children for years | Fachwort-Liste; sie kennt den Begriff, Recep darf ihn im Gespräch nachschieben |
| Action Card: what transfers, what differs, what needs expert review | a one-page proposal: what carries over, what differs, what an expert must check | Fachwort-Liste |
| Honest Gap | Where there is no trail, we say so | Fachwort-Liste; der Screen zeigt den Begriff in der Demo |
| mechanism-to-modality, which we do not model yet | eigener Satz nach der Kernfrage, Alltagssprache | Kernfrage bleibt allein stehen, die Lücke wird ehrlich benannt |

Neu ist die ausdrückliche Gliederung "The problem / Our approach / The result" (Team-Feedback: Problem, Herangehensweise, Lösung sofort erkennbar).

## Belegstand im Tool (geprüft 01:15, Export `2026-10-04+f35b3a5`)

- Krabbe `/d/MONDO_0009499`: Approved therapies leer, durchsucht EMA (EPAR) und openFDA/Drugs@FDA/CBER, Stand 2026-10-03, 0 Treffer.
- MLD `MONDO:0018868`: Libmeldy, EMA, zugelassen 2020-12-17, Quelle EPAR.
- Action Card `/d/MONDO_0009499/action?via=MONDO_0018868`: PSAP als gemeinsames Gen, Reactome "Glycosphingolipid catabolism", Krabbe-Register und Natural-History-Studien (NCT02993796, NCT00983879) unter "Reusable assets".
- Honest Gap `/d/MONDO_0012720`: Therapien 0, Beobachtungsstudien 0.

## Nach dem Gespräch (ab ca. 04:00)

Osmans Protokoll lesen (Teamboard bzw. Notizen), dann je nach Antwort auf die Kernfrage (A/B/C aus MENTOR-LIN.md §3) Hanno eine Liste vorgeschlagener Entscheidungen schicken und Pitch, Story und Demo-Text anpassen:

| Antwort | Pitch / Story | Demo (VIDEO-STRATEGY D5–D7) | Vorschlag an Hanno |
|---|---|---|---|
| A: gemeinsame Natural History / Register | "That study design exists" bleibt Pointe; Moonshot-Satz = Anschluss an bestehende Studie | D5 bleibt, Asset-Zeile Krabbe-Register ins Bild | W9 Empfänger: Krabbe-Stiftung plus MLD-Studienteam; W16 Meilenstein NHS-Start |
| B: zuerst Modalität | ein Satz "and what kind of therapy could fit" als offene Frage, kein Versprechen | D5 Ersatzsatz zu "Needs expert review" | P14 Modalitäts-Zeile `inferred` unter "Needs expert review" (nur wenn vor Freeze ohne Vertragsänderung) |
| C: Diagnose früher | Problem-Teil betont "found too late" statt "no medicine" | D6 Honest Gap um NBS-Länder ohne Beleg erweitern | W16 Meilenstein NBS-Aufnahme; Honest Gap als Demo-Kern |

Mentor-Aussagen sind Feedback, keine Primärquelle. Zitieren nur, wenn sie zugestimmt hat.

## Fußnoten

1. GeneReviews NBK1238; im Tool: Approved therapies Krabbe, 0 Treffer EMA/FDA (Export oben). MEDICAL-BACKGROUND.md §3.
2. OMIM 611722 (Saposin A, Krabbe-ähnlich), 249900 (Saposin B, MLD-ähnlich), 610539 (Saposin C, Gaucher-ähnlich); `/g/PSAP`. MEDICAL-BACKGROUND.md §5.
3. Libmeldy EMA EPAR, Zulassung 17.12.2020; Fumagalli et al., Lancet 2022, PMID 35065785 (29 behandelt vs. 31 Natural-History-Kinder). MEDICAL-BACKGROUND.md §4, §8.
