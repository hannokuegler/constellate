# Mentor-Gespräch Woan-Yu Lin (RDAP, RTW Foundation) · Vorbereitung

## 1. Warum genau sie
- Sie entscheidet beruflich, wohin Stiftungs- und Fördergeld fließt: genau der Test für **Patient progress** (führt die Action Card zu einem nächsten Meilenstein?) und **10× impact** (welcher Meilenstein ist realistisch, welche Annahmen sind unseriös?).
- Ihr Kernthema Mechanismus → Modalität (Loss/Gain of Function, Gentherapie, ASO, Small Molecule) ist unsere größte Lücke: per grep in `app/` und `pipeline/` (integrate, data-v2) gibt es keinen LoF/GoF- und keinen Modalitäts-Begriff; „Mechanismus" sind nur 9 kuratierte Klassen (lysosomal, Hypomyelinisierung …) in `07_analytics.py`. Das trifft **Graph quality** und **Evidence integrity**.
- Weitere offene Schwächen: Empfänger der Action Card offen (W9), `docs/MOONSHOT.md` fehlt, `orgs.csv` leer (Coverage org 0 von 350), data-v2 noch nicht in der Live-App (Action Card v2 zeigt dort ggf. „Data pending").

## 2. 60-Sekunden-Vorstellung (Englisch, ca. 150 Wörter)
"You help foundations decide where scarce money goes. We built a tool for the step before that decision. Constellate is an evidence-graded knowledge graph of 874 rare diseases, lysosomal storage diseases plus leukodystrophy neighbours, organised by mechanism rather than by name. Every link carries its source, date, evidence level and a counter-evidence slot. Our example: Krabbe disease has no approved drug. One gene, PSAP, sits behind a Krabbe-like, an MLD-like and a Gaucher-like disorder. MLD already has an approved gene therapy whose efficacy was shown against a natural-history cohort of untreated children. So the graph asks: could a Krabbe group reuse that playbook instead of starting from zero? It ends in an Action Card: what transfers, what differs, what needs expert review. Where we find nothing, we say so: the Honest Gap. We'd value your view on whether that card would change a funding decision, and on mechanism-to-modality, which we do not model yet."

Demo (2 min, https://constellate-vert.vercel.app):
1. `/d/MONDO_0009499` Krabbe: Ego-Graph, Linienstil = Evidenzstufe, Edge-Panel mit Beleg und Gegenevidenz-Slot; Pelizaeus-Merzbacher als Gegenbeispiel (ähnliche Symptome, anderer Mechanismus).
2. `/g/PSAP`: „One gene, N disease names".
3. `/d/MONDO_0009499/action?via=MONDO_0018868`: Action Card Krabbe vs MLD (What transfers / What differs / Needs expert review; v2: Assets, Therapien, NBS, Forschende, Prävalenz).
4. Honest Gap: `/d/MONDO_0012720` (Krabbe due to saposin A deficiency, P11): 0 Studien, 0 Grants im Shard.
5. `/methods`: vier Evidenzstufen, OpenAI-Stellen, Messwerte.
Zahlen nur aus DATA-REPORT, und nur wenn data-v2 integriert ist: 135 Beobachtungsstudien (82 NH, 53 Register) plus 9 Outcome-Skalen; NBS 22 Zeilen, 11 belegt, 11 UNBELEGT; 39 Medikamente, Libmeldy (EMA 17.12.2020) und Lenmeldy (FDA 18.03.2024), Krabbe 0; Prävalenz 638 Einträge (168 Kernkrankheiten); 2.717 Forschenden-Overlap-Paare (inferred); Monarch Spearman 0,661 (n = 49); 549 echte Coverage-Lücken.

## 3. Die eine Kernfrage
"If a Krabbe foundation had one grant to give next year, which milestone would you fund first, and what would our Action Card have to show for you to recommend it?"
- **A: gemeinsame Natural History / Register-Anschluss** (MLD-Playbook adaptieren) → Moonshot-Meilenstein bleibt NHS-Start; Recep schreibt MOONSHOT.md darauf, Action Card adressiert Krabbe-Stiftung plus MLD-NHS-Studienteam (W9 erledigt).
- **B: zuerst Modalitätsentscheidung** (Mechanismus → passende Therapieform) → P14 neu: eine Zeile „Mechanism → candidate modality" als `inferred` unter „Needs expert review" (Template-Text, kein neuer Kantentyp, kein Vertragsbruch vor Freeze); Moonshot = „modality decision".
- **C: Diagnose früher** (NBS, Biomarker) → Action Card führt mit NBS-Block, Moonshot = NBS-Aufnahme; Honest Gap für UNBELEGT-Länder wird Demo-Kern.

## 4. Priorisierte Fragen (Englisch) · löst bei uns
(a) Action Card
1. "Who in a foundation would actually act on this card: the board, a scientific advisory board, the study team of the neighbouring disease?" → W9 Empfänger, Action-Card-Kopf, Demo-Skript.
2. "What is missing for a funding decision: rough cost, timeline, the precedent's strength, a named next experiment?" → Action Card v2 Felder, DECISIONS (neuer P-Eintrag).
(b) Mechanismus → Modalität, Präzedenz
3. "Should we show loss vs gain of function and a candidate modality per disease, or is that too easy to over-read? How would you mark uncertainty?" → P14, D5 (Stufe `inferred`), Abschnitt „Needs expert review".
4. "Which open resources do you rely on to call loss vs gain of function and modality fit?" (nur zuhören, nichts erfinden) → DATA-SOURCES.md, Roadmap im README.
5. "Is Krabbe → MLD (via PSAP, natural-history cohort as external control, Libmeldy) a defensible precedent? Where would you push back?" → SCOPE.md Hero-Pfad, Pitch Fassung A („That study design exists"), Demo-Skript.
(c) Natural History, diagnostische Odyssee
6. "Which assets really transfer between neighbouring diseases: natural-history data, endpoints like GMFC-MLD, registry infrastructure, consent templates, biorepositories?" → Action Card „What transfers", MOONSHOT.md Annahmen.
(d) Honest Gap
7. "When the answer is 'we don't know', what does a funder value most: what was searched and when, the next question to test, or who could close the gap?" → Honest-Gap-Screen (P11), Demo-Skript.
(e) Moonshot 10×
8. "Which milestone would you accept as realistic for a 10× claim, and which assumption would make you stop listening?" → MOONSHOT.md (R2), W16.
(f) KI
9. "Where does AI genuinely help foundations, and where does it do harm, e.g. plausible but wrong links or false hope? What guardrail would convince you?" → /methods, Explain-Post-Check, Tech-Video, Pitch Fassung B.
10. (falls Zeit) "Is mechanism-first grouping useful for your landscape assessments, or would you slice differently?" → D3 Slice, Persona-Linse Priya.

## 5. Was wir vor ihr NICHT behaupten
- PSAP nicht „verursacht Krabbe": Saposin-A-Defizienz ist Krabbe-ähnlich mit normaler GALC (OMIM 611722); B MLD-ähnlich (249900); C Gaucher-ähnlich (610539); komplette Prosaposin-Defizienz 611721. Unser Roll-up hängt PSAP an „Krabbe disease", markiert und mit halbierter Konfidenz: offen sagen.
- Krabbe: keine zugelassene medikamentöse Therapie weltweit (GeneReviews NBK1238); HSCT nur präsymptomatisch wirksam (Escolar 2005, PMID 15901860) und keine Heilung, motorische Defizite bleiben (Wright 2017, PMID 28855403).
- Libmeldy: 29 behandelt vs 31 Natural-History-Kinder (Fumagalli 2022, PMID 35065785); die FDA nennt 37 Behandelte insgesamt, Zahlen nicht mischen. Indikation eng, subtyp- und symptomstatus-abhängig (EMA EPAR); der externe Kontrollarm ist subtypspezifisch, also keine „3–5× mehr Patienten durch Cluster".
- FBX-101: NCT05739643 active-not-recruiting, LTFU NCT06308718 terminated; PBKR03 NCT04771416 suspendiert. Wirksamkeit nur aus Firmen-PR, nicht als Beleg verkaufen.
- Psychosin- vs Mikroglia-Hypothese: beide offen (PMC8633897). US-Staaten mit Krabbe-NBS (18 vs 19) und HHS-RUSP-Datum: ⚠️; maschinell belegt sind bei uns nur US-MN und US-NY.
- Skalen sind „documented", nicht „validated for this disease"; Forschenden-Overlap ist `inferred` (gleicher Name plus Institution), keine Zusage zur Zusammenarbeit; keine Namen von Personen oder Orgs als Partner.
- Keine Zeitzahlen „5–8 Jahre → 6–12 Monate", keine 10×-Zahl, kein „cure".

## 6. Rollen, Timebox, Nachlauf
- 15 min: 1 Pitch (Hanno) · 2 Demo (Hanno klickt, Recep erzählt Nora in einem Satz) · 10 Fragen · 2 Abschluss (Kernantwort laut zusammenfassen, fragen, ob wir sie als „mentor feedback" nennen dürfen).
- Hanno: Kernfrage, Fragen 1–4, entscheidet am Ende nichts live. Recep: 5, 7, 8 (Story, Evidenz, Moonshot). Osman: 6, 9, 10 (Patientensicht, Orgs) und **Protokoll** (wörtliche Kernsätze, je Frage Antwort plus „löst X").
- Nachlauf binnen 30 min: Osman legt Notizen ins Teamboard; Hanno entscheidet und trägt in `docs/DECISIONS.md` ein (W9 und W16 aus „Geparkt" in P-Einträge, ggf. neu P14 Mechanismus/Modalität, Datum, Begründung „Mentor-Feedback Lin"); Recep zieht MOONSHOT.md und Demo-Skript nach; `docs/hackathon-log/STATUS.md` per `/constellate`.
- Regel 1 gilt weiter: ihre Aussagen sind Feedback, keine Primärquelle für medizinische Fakten im Produkt. Alles, was neuen Code braucht, nur wenn es vor dem Freeze 12:00 ohne Vertragsänderung geht.
