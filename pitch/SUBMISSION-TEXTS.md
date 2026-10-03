# Abgabetexte · Constellate (HackOS und Google Form)

Stand So 04.10.2026, 01:40 (Wien), **v1**. Alle Texte für die Jury auf Englisch, je Feld in einem Code-Block zum Kopieren. Zahlen per Skript aus `app/public/data/meta.json`, Export **`2026-10-04+f35b3a5`** (gebaut 2026-10-03 22:49 UTC); vor dem Einfügen gegen den dann aktuellen Export prüfen (Befehl in §11). Live-App am 04.10. 01:30 gegengeprüft: Action Card Krabbe → MLD zeigt Libmeldy (EMA 2020-12-17) und Lenmeldy (FDA 2024-03-18) mit Quelle, Krabbe zeigt „Honest Gap" bei zugelassenen Therapien, `/d/MONDO_0012720` zeigt 0 Gruppen und 0 offene Studien mit „What was searched".

Feldnamen und Zeichenlimits von HackOS und Google Form kennt Osman ab 08:00–09:00; bis dahin sind die Felder generisch (§1–§9). v2 passt sie 1:1 an.

## 1 · Project name

```
Constellate
```

Gilt, solange D1 nicht anders entschieden ist.

## 2 · One-liner (≤ 15 Wörter)

Empfehlung **A**: greift den Pitch-Schluss auf („Don't rebuild what a neighbouring disease already built"), ohne Fachwort.

```
A map of rare diseases that shows what a neighbouring disease already built.
```

13 Wörter.

Alternative B (Herz-Einstieg, 14 Wörter):

```
Your family is not the first: rare diseases mapped by biology, every link sourced.
```

## 3 · Short description (≤ 50 Wörter)

```
Constellate maps 874 rare diseases by shared genes and symptoms, not names. A family facing Krabbe disease finds its neighbour MLD, which already has an approved gene therapy and the study behind it, and leaves with a one-page proposal. Every link shows its source; where nothing exists, Constellate says so.
```

50 Wörter.

## 4 · Problem statement (ein Satz, falls ein eigenes Feld kommt)

```
Rare-disease families rebuild registries and studies that a neighbouring disease already has, because disease names hide shared biology and the evidence is scattered.
```

## 5 · Long description

Gliederung Problem → Herangehensweise → Lösung → Evidenzmodell → OpenAI → Messung → Nächste Schritte. Länge: Haupttext 415 Wörter / ca. 2.650 Zeichen, mit OpenAI-Absatz ca. 510 Wörter / 3.250 Zeichen. Hat das Feld ein Limit darunter, streicht v2 in dieser Reihenfolge: „What we measured", „Evidence model" auf einen Satz, Quellenliste im Absatz „Approach". Der Absatz „Built with OpenAI" kommt in zwei Varianten (§5b); **Hanno wählt um 11:00** je nachdem, ob Extract und Explain bis dahin mit Key gelaufen sind. Heute (01:30) ist Variante B die wahre: Action Card zeigt „Template text", `/methods` zeigt Extract precision „pending", der Export hat keine OpenAI-Kanten.

### 5a · Haupttext

```
Problem. There are about 10,000 known rare diseases, and fewer than 5 % have an approved therapy. A family that receives a rare diagnosis often ends up organising research it never planned to lead. The knowledge it needs is scattered across databases, and disease names hide shared biology: one gene, PSAP, sits behind a Krabbe-like, an MLD-like and a Gaucher-like disease, three names in three separate communities. So groups rebuild registries and studies that already exist next door.

Approach. Constellate is a map of rare diseases sorted by what goes wrong in the body, not by name. An offline pipeline joins open primary sources (HPO, MONDO, Orphanet, ClinVar, ClinicalTrials.gov, Europe PMC, NIH RePORTER, Open Targets, Reactome, EMA and FDA records) into a graph of 874 diseases (350 lysosomal and leukodystrophy core diseases plus 524 neighbours), 1,066 genes and 5,642 phenotypes. Every link carries its source, date, evidence level, confidence and a slot for counter-evidence.

Solution. We follow Maria, the patient leader from the challenge brief, in two moments. The night after the diagnosis, her child has Krabbe disease; Constellate shows open studies, patient groups from a hand-checked list, or an honest answer. Months later, she leads a patient group and finds metachromatic leukodystrophy (MLD) as a neighbour on the map. MLD has an approved gene therapy (EMA 2020, FDA 2024) and a natural-history study that shows how the disease unfolds over time. The Action Card turns this into a one-page proposal: what transfers, what differs, what needs expert review, every sentence citing the links it rests on. Where there is no trail, the Honest Gap screen lists what was searched, when, and what would close the gap.

Evidence model. Four levels: observed, curated, text-mined, inferred. A level is never raised, and computed links show their formula. 251 disease pairs that look alike but differ in mechanism are flagged automatically, for example Pelizaeus-Merzbacher disease next to Krabbe disease.

[BUILT WITH OPENAI: Variante A oder B aus §5b einsetzen]

What we measured. Our symptom similarity agrees with Monarch semantic similarity (Spearman 0.66, n = 49). Of the 350 core diseases, 126 have a trial, 233 a paper and 117 a reusable asset such as a registry or natural-history study. An automated check confirms the hero path after every data build.

What we validate next. Extract precision and Reconcile accuracy on hand-labelled samples, and, with patient-group leaders, whether an Action Card leads to a real conversation with a neighbouring community.

Constellate is research navigation, not medical advice. Maria is the persona from the challenge brief, not a real patient.
```

### 5b · Built with OpenAI

Variante **A**, nur wenn bis 11:00 Extract mit Key gelaufen ist (text-mined Kanten mit Modell im Edge-Panel sichtbar) und Explain-Texte vorberechnet live sind:

```
Built with OpenAI. OpenAI runs at three points, each marked in the product. Extract reads PubMed abstracts and returns structured claims with the PMID and the quoted sentence (Structured Outputs); a claim without a quote is dropped, and every claim stays at level text-mined. Reconcile matches patient-organisation names to MONDO disease IDs: embeddings propose candidates, a model judges them and gives a reason. Explain turns the links of an Action Card into plain language; every sentence must end with a link ID or it is struck out. Explain is precomputed, so no API key sits on the website.
```

Variante **B**, wenn der Key-Lauf nicht geklappt hat (ehrlich, kostet aber den Track-Anspruch):

```
Built with OpenAI. OpenAI is designed in at three points, each marked in the product: Extract (PubMed abstracts to structured claims with PMID and quoted sentence, Structured Outputs), Reconcile (patient-organisation names to MONDO disease IDs with embeddings and a judging model) and Explain (Action Card links to plain language, every sentence citing a link ID). In this build the API key was not available in time: the pipeline steps are covered by mocked tests, and Explain shows template text, labelled as such in the app.
```

Teilvarianten (z. B. Extract ja, Explain nein) baue ich aus A und B, sobald der Stand um 11:00 feststeht.

## 6 · Tech stack

```
Pipeline: Python (uv), steps 01 to 09 (fetch, slice, build graph, enrich, OpenAI extract, OpenAI reconcile, analytics, trial details, metrics), validator against a data contract (make validate), full rebuild from primary sources (make reproduce).
Analytics: information content over HPO, simGIC and Resnik phenotype similarity, curated mechanism classes for counter-examples, Louvain clustering.
Data delivery: static JSON shards per disease, gene and phenotype, no database and no server to fail during a demo.
App: Next.js 15 (App Router, TypeScript, Tailwind 4), react-force-graph-2d, deployed on Vercel, no login.
AI: OpenAI API (Structured Outputs, embeddings) for Extract, Reconcile and Explain; model IDs set by environment variable only.
Video: voice-over generated with ElevenLabs (Eleven v4).
```

## 7 · Data sources and licences

Aus `meta.json` → `sources` (19 Einträge, hier zusammengefasst). Lange Fassung steht auf `/methods` und im README.

```
HPO 2026-09-02 (free with attribution) · MONDO 2026-09-01 (CC-BY 4.0) · Orphanet / Orphadata JDBOR 2026-06-23, incl. prevalence (CC-BY 4.0) · OMIM, only indirectly via HPO annotations (attribution OMIM) · ClinVar, ClinicalTrials.gov, NIH RePORTER (US public domain, retrieved 2026-10-03) · Europe PMC (metadata CC0, abstracts under publisher terms, short snippets only) · Open Targets 26.09 (CC0) · Reactome (CC0) · MyGene.info (free, see terms) · EMA medicine data (© EMA, reproduced with source acknowledgement) · openFDA drug labels, Drugs@FDA, FDA CBER product pages (US public domain / CC0) · official newborn screening programme pages for AT, NO, IT-52, US-MN, US-NY (short verbatim quote with link) · Monarch Initiative API v3 semsim, validation metric only (CC-BY 4.0). Code: MIT. Data keeps the licence of its source.
```

## 8 · Team

Vorschlag; Osman und Recep tragen ihren Nachnamen selbst ein (steht bewusst nicht geraten hier). Keine Mailadressen, keine Telefonnummern.

```
Hanno Kügler: tech lead, data pipeline and app.
Osman [surname]: operations and curation, patient-organisation list, README, QA, team video.
Recep [surname]: story and evidence, hero path, moonshot, demo video.
```

## 9 · Links

Ein Link gilt erst als eingetragen, wenn er im privaten Fenster geklickt wurde.

| Feld | Link | geprüft |
|---|---|---|
| Live demo | https://constellate-vert.vercel.app | ☑ 01:30 (ohne Login) |
| Repository | https://github.com/hannokuegler/constellate | ☐ erst ab 11:00 public |
| Video Team Introduction | offen | ☐ |
| Video Product Demo | offen | ☐ |
| Video Technical Walkthrough | offen | ☐ |

Video-Beschreibung (Demo und Tech, je unter das Video):

```
Constellate, Hack-Nation 7th Global AI Hackathon, Challenge 5 "AI Atlas for the World's Rare Diseases", Vienna Hub. Live demo: https://constellate-vert.vercel.app. Voice-over generated with ElevenLabs (Eleven v4). Maria is the persona from the challenge brief, not a real person. Research navigation, not medical advice.
```

Team-Video: dieselbe Zeile ohne den Voice-over-Satz (echte Stimmen).

## 10 · Offenlegung (für ein Feld „Anything else" oder das README)

```
Voice-over in the demo and technical videos generated with ElevenLabs (Eleven v4); the team video uses our own voices. Maria is the persona from the challenge brief; no real patient story is used. Patient organisations appear only after a team member verified them by hand.
```

Offen für Hanno (siehe §12): ob ein Satz zur Entwicklung mit KI-Coding-Assistenten dazukommt.

## 11 · Prüfen vor dem Einfügen

```
python3 -c "import json;m=json.load(open('app/public/data/meta.json'));c=m['counts'];n=c['nodes'];print(m['version'],n['disease'],n['core_disease'],n['gene'],n['phenotype'],c['counterexample_pairs'],m['metrics']['monarch_spearman'],m['metrics']['coverage'])"
```

Stand v1: `2026-10-04+f35b3a5` · 874 · 350 · 1066 · 5642 · 251 · Spearman 0.661 (n = 49) · Coverage trial 126, paper 233, asset 117 von 350. Weicht etwas ab, Text nachziehen. Wortzahlen mit `wc -w` gezählt (Einzeiler A 13, B 14, Kurzbeschreibung 50).

Belege im Text, die nicht aus `meta.json` kommen: 10.000 Krankheiten und unter 5 % mit Therapie (C5-Challenge-Brief S. 2); PSAP-Saposin-Defizienzen (OMIM 611722, 249900, 610539); MLD-Gentherapie (EMA EPAR Libmeldy 17.12.2020, FDA 18.03.2024, im Tool als `e_f3ef159024b6` und `e_62876fa60e22`); Natural-History-Studie (NCT04628364, im Tool `e_7ee9ef63ec03`; Fumagalli et al., Lancet 2022, PMID 35065785). Alles in [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) ohne ⚠️.

## 12 · Offene Punkte für Hanno

| # | Frage | Empfehlung |
|---|---|---|
| 1 | Einzeiler A oder B | A (Pitch-Schluss, kein Fachwort) |
| 2 | OpenAI-Absatz A oder B | um 11:00 nach echtem Stand; ohne Key-Lauf ehrlich B, nie A „auf Vorrat" |
| 3 | Satz zu KI-Coding-Assistenten (Claude Code) in der Offenlegung | ja, ein Satz: „The code was written with the help of AI coding assistants." Kostet nichts, schützt vor Nachfragen; OpenAI bleibt das Modell im Produkt |
| 4 | Nachnamen Osman und Recep | die beiden tragen selbst ein |
