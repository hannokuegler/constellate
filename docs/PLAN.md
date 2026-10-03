# 🧭 Masterplan · von jetzt (Sa 03.10., 19:45) bis Platz 1

> Stand Sa 03.10.2026 19:45 · Deadline **So 04.10., 15:00 Wien** (9:00 ET) · verbleibend **~19 h**
> Dateien hier: [SCOPE.md](SCOPE.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [DATA-SOURCES.md](DATA-SOURCES.md) · [ROLES-TASKS.md](ROLES-TASKS.md) · [VIDEOS.md](VIDEOS.md)

## Name & Pitch

**Constellate** · *Five thousand points of light. One map.*
Alternativen: *Kindred* (Krankheiten als Verwandte, passt zu Familien) · *Lumen Atlas*. Empfehlung **Constellate**: Verb, greift die Tagline aus dem Brief auf („see the constellations") und ist nicht das abgenutzte „Constellation", das 5 andere Teams nehmen werden.

**Problem Statement (1 Satz, EN für die Submission):**
*Because of Constellate, a patient-group leader like Maria finds in one session a mechanistically related disease community, a reusable registry or study design, and a sourced next step she can act on this week, instead of spending months rebuilding what already exists; we know because fewer than 5 % of rare diseases have a therapy while the evidence connecting them sits unlinked across OMIM, HPO, PubMed, ClinicalTrials.gov, NIH RePORTER and hundreds of patient-group sites.*

**30-Sekunden-Demo-Moment:**
Maria tippt „Krabbe disease". Der Graph zeigt GALC → Mechanismus „lysosomaler Sphingolipid-Abbau / Myelin" → das versteckte Gen **PSAP** (Saposine), das Krabbe, Metachromatische Leukodystrophie (MLD) **und** Gaucher unter drei Namen verbindet → MLD hat eine zugelassene Gentherapie, deren Zulassung auf einer **Natural-History-Studie als externem Kontrollarm** beruhte → Action Card: „Schlage der MLD Foundation vor, das NHS-Design für Krabbe zu adaptieren. Übertragbar: X. Unterschiedlich: Y. Expertenprüfung nötig: Z." Jede Kante klickbar mit Quelle. Daneben ein Gegenbeispiel: Pelizaeus-Merzbacher sieht phänotypisch gleich aus, ist aber mechanistisch anders. Das Tool sagt das.

## Was gewinnt (Judging-Logik, bewusst gegen die Masse)

| Judges wollen | Was die meisten Teams liefern | Was wir liefern |
|---|---|---|
| Graph Quality | bunter Force-Graph aus 3 CSVs | kleiner Graph, **jede Kante mit Evidenzstufe** (observed / curated / text-mined / inferred), Gegenbeispiele |
| Evidence Integrity | „Quelle: PubMed" | PMID + Snippet + Datum + Konfidenz + **Gegenevidenz-Slot**, Open-Targets-Scores je Datentyp |
| Patient Progress | Suchmaske + Graph | **eine komplette Journey** Krabbe → PSAP → MLD → NHS-Design → Partner-Proposal, als Action Card exportierbar |
| 10× Impact | Slide mit „10×" | Timeline heute vs. unsere Route mit **Zahlen und Annahmen**, ehrlich |
| Product Craft | Dashboard | low ink · eine Suche · progressive reveal · Persona-Linse · **ehrliche Lücke** als First-Class-Screen |

## Zeitplan (Blöcke, Feature-Freeze So 12:00)

| Wann | Block | Hanno | Osman | Recep |
|---|---|---|---|---|
| **Sa 19:45–20:30** | Kickoff | PS + Demo-Moment absegnen, Repo anlegen, Pipeline-Skeleton | HackOS: alle 3 im Team, Discord-Ansage, OpenAI-Key aus „Credits & Codes", Vercel-Account | Hero-Pfad fact-checken (PMIDs), siehe Task R1 |
| **20:30–23:30** | Daten v0 | HPO + Orphanet + MONDO → LSD-Slice → `graph.json` (Krankheit–Gen–Phänotyp) | Patientenorg-Kuration CSV (Task O2) | Moonshot-Zahlen (Task R2) |
| **23:30–02:00** | App v0 | Next.js: Suche → Ego-Graph → Edge-Panel, Deploy auf Vercel (hässlich, aber live) | README-Skelett + Datenquellen-Lizenzen (Task O3) | Demo-Skript v1 (Task R3) |
| **02:00–04:00** | Evidenz | ClinicalTrials, RePORTER, Europe PMC, Open Targets, Reactome einhängen · OpenAI **Extract** (Abstracts → Claims) + **Reconcile** (Org-Namen → MONDO) | Schlafen | Schlafen |
| **04:00–06:00** | Action | Phänotyp-Ähnlichkeit (IC-gewichtet), Louvain-Cluster, Action Card, **Explain** (OpenAI, streaming), Honest-Gap-Screen | Schlafen | Schlafen |
| **06:00–08:00** | ⭐ E2E-Check | Schlafen (2 h) | Live-Demo als „Devon" durchklicken, Bugs in `03_Build/BUGS.md` | Live-Demo als „Maria" durchklicken, Walkthrough-Text an echte UI anpassen |
| **08:00–11:00** | Polish | Bugs, Persona-Linse, Gegenevidenz, Coverage-Anzeige, Moonshot-Panel | README fertig, `make reproduce` auf frischem Clone testen | Video-Setup, Slides für Moonshot |
| **11:00–12:00** | Härtung | letzte Fixes, Seeds einfrieren, Vercel final | Repo public, Lizenz, Screenshots | Takes proben |
| **12:00** | 🔒 **FEATURE FREEZE** | | | |
| **12:00–14:00** | Videos | Tech Video (3 min) | Team Video (1 min) | Demo Video (2 min) + **1-min Walkthrough** |
| **14:00–14:30** | Abgabe | HackOS + Google Form + Backup, Links checken | gegenchecken | gegenchecken |
| **14:30–15:00** | Puffer | nichts mehr anfassen | | |

Regel: **ab 06:00 ist das Ding end-to-end live**. Alles danach ist Polish. Brennt es um 03:00: Extract streichen (Edges nur aus kuratierten DBs), Reconcile auf Fuzzy-Match zurückfallen, Explain bleibt (das ist der OpenAI-Pflichtteil, der am wenigsten kostet).

## Abgabe-Checkliste (C5-spezifisch, ergänzt den README-Standard)

- [ ] Live-Demo auf Vercel, durchsuchbar ohne Login
- [ ] README: Architektur-Diagramm + `make reproduce` baut den Datensatz aus den Rohquellen
- [ ] Datensatz-Lizenzen gelistet (HPO, Orphanet CC-BY 4.0, MONDO CC-BY 4.0, Public Domain NIH)
- [ ] OpenAI sichtbar genutzt: Extract · Reconcile · Explain (im Tech-Video zeigen!)
- [ ] 1-min-Walkthrough folgt Maria durch den Graphen bis zum Vorschlag
- [ ] Honest-Gap-Beispiel im Demo-Video
- [ ] Moonshot: Meilenstein + Timeline heute vs. neu + Annahmen
- [ ] Team-Video, Tech-Video, Demo-Video
- [ ] Alle 3 in HackOS unter „Team & Submission"
- [ ] Sa 10.10. Preisverleihung im Kalender (Pflicht, Top 2 pitchen live)

## Offene Entscheidungen (Hanno)

1. **Name** Constellate? (ja/nein/anders)
2. **PS-Satz** oben ok?
3. **Demo-Moment** Krabbe → PSAP → MLD ok? (Alternative: Gaucher → GBA1 → Parkinson, bekannter, aber Gaucher hat 4 Therapien, Maria soll „no approved treatment" haben)
4. Osman/Recep: wie viel Coding trauen wir ihnen zu? Der Plan geht von **wenig Code, viel Kuration/Story** aus.
