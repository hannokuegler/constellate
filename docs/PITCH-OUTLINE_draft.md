# Pitch-Gliederung (Entwurf) · Constellate

Owner: Recep (Pitch-Slides, R4). Entwurf vom Doku-Agent, Stand Sa 03.10.2026, 23:55. Nur relevant, falls das Team in die Top 2 kommt (Live-Pitch Sa 10.10., 3 min laut [VIDEOS.md](VIDEOS.md)). Gleiche Geschichte wie das Demo-Video. Offene Marketing-Punkte (Jury-Satz, Name, Einstieg, Honest-Gap-Fall) stehen in [DECISIONS.md](DECISIONS.md) und sind hier nicht entschieden.

Acht Folien, je 2 bis 3 Stichpunkte plus Quelle. Jede Zahl stammt aus einer Datei im Repo oder einer genannten Primärquelle.

## Folie 1 · Titel

- Constellate: evidence-graded knowledge graph for rare diseases (Name vorläufig, D1)
- Tagline aus dem Brief: "Five thousand points of light. One map to see the constellations."
- Hack-Nation 7th Global AI Hackathon, Challenge 05, Vienna Hub
- Quelle: [C5-Challenge-Brief.pdf](C5-Challenge-Brief.pdf), [../README.md](../README.md)

## Folie 2 · Problem

- 10,000 known rare diseases, 80 % trace back to DNA, fewer than 5 % have an approved treatment
- Knowledge is scattered, groups rebuild registries that exist next door, names hide mechanisms
- Option für den Jury-Satz (nicht entschieden): "Your family is not the first. What you need already exists under another disease's name."
- Quelle: C5-Challenge-Brief S. 2; Jury-Satz-Optionen in [briefing/WIRTSCHAFT-NUTZER.md](briefing/WIRTSCHAFT-NUTZER.md) (W11)

## Folie 3 · Persona

- One composite mother in two moments (als Komposit benannt, keine echte Familie): "We just got the diagnosis" and "I lead a patient group"
- Moment 1: her group or an honest gap, plus open studies; Moment 2: a related community, an existing asset, a sourced Action Card
- Brief-Personas (Maria, Devon, Priya, Dr. Osei) bleiben als Nebenlinsen
- Quelle: DECISIONS P1, P2; [STORY.md](STORY.md)

## Folie 4 · Demo (Hero-Pfad)

- Krabbe → GALC / PSAP → MLD → ARSA → gene therapy and natural-history precedent → Action Card
- One gene, three names: PSAP behind Krabbe-like, MLD-like and Gaucher-like disease (OMIM 611722, 249900, 610539)
- MLD gene therapy approved in the EU (17.12.2020) and by the FDA (18.03.2024) against a natural-history control cohort, 29 treated vs. 31 untreated children (Fumagalli, Lancet 2022, PMID 35065785)
- Quelle: [MEDICAL-BACKGROUND.md](MEDICAL-BACKGROUND.md) §4 und §5; Skript: [DEMO-SCRIPT_draft.md](DEMO-SCRIPT_draft.md)

## Folie 5 · Evidenzmodell und Honest Gap

- Four levels: observed, curated, text_mined, inferred; every edge has source, date, confidence and a counter-evidence slot that is never missing
- Inferred edges show their formula; roll-ups from subtypes are marked and never gain confidence
- Honest Gap: what was searched and when, nearest related communities, next question to test. Counter-example: Pelizaeus-Merzbacher (PLP1), similar symptoms, different mechanism (OMIM 312080, PMC9313024)
- Quelle: [ARCHITECTURE.md](ARCHITECTURE.md), DECISIONS D5 und Default 2 bis 4, `app/public/data/meta.json`

## Folie 6 · Metriken

- Dataset today: 874 diseases (350 core), 1,066 genes, 4,717 phenotypes in the index; edges: 14,512 observed, 27,066 curated, 4,181 inferred, 488 contradicted; 17 clusters, 251 counter-example pairs
- Evaluation (Platzhalter, noch nicht gemessen): Extract precision pending · Reconcile accuracy pending · similarity vs. Monarch Spearman pending · coverage pending · hero regression pending
- OpenAI at three visible points: Extract, Reconcile, Explain (every sentence cited, otherwise dropped)
- Quelle: `app/public/data/meta.json` (Version 2026-10-03+397464a); Metrik-Tabelle in [../README.md](../README.md)

## Folie 7 · Moonshot

- Platzhalter: needs docs/MOONSHOT.md from Recep
- Brief-Ziel: help rare disease research advance 10x faster; Meilenstein, Zahlen mit Quelle und Annahmen kommen allein aus MOONSHOT.md
- Offen (W10, W16): "join an existing natural-history effort" statt "start a new one"
- Quelle: noch keine (MOONSHOT.md fehlt); Briefing W10 und W16

## Folie 8 · Team und Ask

- Hanno Kügler (tech lead: pipeline and app), Osman (ops and curation), Recep (story, evidence, videos)
- Built on open data with licenses listed (HPO, MONDO, Orphanet, ClinVar, ClinicalTrials.gov, Europe PMC, NIH RePORTER, Open Targets, Reactome CC0); repo and live demo `https://constellate-vert.vercel.app`
- Ask: Platzhalter, nicht entschieden (z. B. Zugang zu verifizierten Patientenregistern, Expertenprüfung der Action Cards durch Fachärzte)
- Quelle: [../README.md](../README.md), [DATA-SOURCES.md](DATA-SOURCES.md)
