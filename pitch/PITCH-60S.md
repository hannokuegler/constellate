# 60-Sekunden-Pitch · Constellate

Zwei Fassungen, Wort für Wort, Englisch, je ca. 145 Wörter (bei ruhigem Tempo 140 bis 150 Wörter pro Minute). Regieanweisungen in eckigen Klammern sind nicht zu sprechen. Jede medizinische Aussage trägt in der Fußnote ihre Primärquelle; jede Zahl stammt aus dem Brief oder aus `app/public/data/meta.json` (Export `2026-10-03+397464a`).

Einsatz: Live-Pitch am 10.10. (falls Top 2, dort als erste Minute der drei), Discord-Post als Text, Elevator-Version für Gespräche. Für die Videos gelten die Skripte in [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md).

## Fassung A · „Herz zuerst" (empfohlen)

[Bild: Startseite von Constellate, dunkel, die zwei Karten „We just got the diagnosis" und „I lead a patient group". Sprecher ruhig, kein Trailer-Ton.]

Imagine the first night after the diagnosis. Your child has Krabbe disease. You learn there is no approved drug, anywhere in the world.¹

[Pause, zwei Sekunden.]

What nobody tells you: **your family is not the first.** What you need may already exist under another disease's name.

[Bild: Gen-Seite `/g/PSAP`, Überschrift „One gene, 4 disease names".]

Constellate is a map of rare diseases organised by mechanism, not by name. One gene, P-S-A-P, sits behind three disease names: a Krabbe-like, an MLD-like and a Gaucher-like disorder.²

[Bild: Action Card, Abschnitt „What transfers".]

Metachromatic leukodystrophy, the neighbour, already has an approved gene therapy, proven against a natural-history cohort of untreated children.³ **That study design exists.** A Krabbe group could ask to join or adapt it, instead of starting from zero.

[Pause. Bild: Edge-Panel mit „Counter-evidence" und Honest-Gap-Screen.]

Every link shows its source, its date, its evidence level, and its counter-evidence. Where there is no trail, we say so, and show what we searched.

[Bild: `/about`, URL sichtbar.]

Eight hundred seventy-four diseases, one map. Constellate.⁴
**Don't rebuild what a neighbouring disease already built.**

Wortzahl: 147.

## Fassung B · „Jury zuerst"

[Bild: `/methods`, „How we know", die vier Evidenzstufen.]

Ten thousand rare diseases. Fewer than five percent have an approved treatment.⁵ The knowledge to connect them exists, in OMIM, HPO, PubMed and ClinicalTrials.gov, but it sits under ten thousand different names.

Constellate is an evidence-graded knowledge graph: eight hundred seventy-four diseases, one thousand sixty-six genes, four levels of evidence, and a counter-evidence slot on every edge that is never missing.⁴ Two hundred fifty-one counter-example pairs, similar symptoms, different mechanism, flagged automatically.⁴

[Bild: Tech-Folie „Built with OpenAI".]

OpenAI at three controlled points: Extract, with a verbatim snippet check; Reconcile, names to stable IDs; Explain, where a sentence without an edge is dropped. The graph is the guardrail.

[Bild: Action Card.]

And the journey: a mother types Krabbe. The graph leads her, through one shared gene, to MLD, whose gene therapy was approved against a natural-history cohort,³ and to an Action Card she can send this week. Where there is no trail, we say so.

**Don't rebuild what a neighbouring disease already built.**

Wortzahl: 146.

## Empfehlung

**Fassung A für Pitch und Discord, Fassung B als Antwort-Reservoir für die Q&A und als Text im HackOS-Feld „Problem Statement / Description".**

Begründung: Die Jury bewertet „Patient progress" und „Ambition" neben „Graph quality" und „Evidence integrity" (Brief S. 6). Nach vierzig Teams bleibt eine Figur hängen, nicht eine Architektur; Fassung A liefert die Figur in sieben Sekunden und die Architektur in einem Satz („source, date, evidence level, counter-evidence"). Fassung B gewinnt, wenn das Publikum ausschließlich aus Datenleuten besteht oder wenn der Pitch nach einer Demo kommt, die die Figur schon eingeführt hat.

Beide Fassungen vermeiden: Heilsversprechen, 10×-Zahlen (fehlt `docs/MOONSHOT.md`), Namen von Organisationen (orgs.csv leer), Namen von Forschenden, US-Screening-Staaten, Österreich-Screening (alle ⚠️ oder unbelegt, siehe [STORY.md](STORY.md) §9).

## Regie, für beide Fassungen

- Tempo: 140 bis 150 Wörter pro Minute, Pausen sind Teil der Minute. Fassung A hat zwei Pausen (nach „anywhere in the world" und nach „starting from zero"), zusammen vier Sekunden.
- Betonung (fett oben): „your family is not the first", „That study design exists", „Don't rebuild".
- „P-S-A-P" buchstabieren, „MLD" buchstabieren, „metachromatic leukodystrophy" einmal voll aussprechen (Aussprache in [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md)).
- Kein Bild von Kindern, kein Klinik-Stock. Nur Screens der echten App mit sichtbarer URL.
- Letzter Satz: Blick ins Publikum, dann stehen bleiben. Nicht „thank you" anhängen, der Satz ist der Schluss.

## Fußnoten (Primärquellen)

1. Krabbe: kein zugelassenes Medikament weltweit; HSCT ist die einzige etablierte Option und wirkt nur präsymptomatisch. GeneReviews NBK1238; Escolar et al., NEJM 2005, PMID 15901860. ([docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) §3)
2. PSAP: Saposin-A-Defizienz Krabbe-ähnlich (OMIM 611722), Saposin-B-Defizienz MLD-ähnlich (OMIM 249900), Saposin-C-Defizienz Gaucher-ähnlich (OMIM 610539). In der App zeigt `/g/PSAP` vier Namen (die vierte ist die kombinierte PSAP-Defizienz, OMIM 611721); der Pitch sagt „three disease names", weil die drei Verwandtschaften die Pointe sind, und die Gen-Seite steht als Beleg daneben. (§5)
3. MLD-Gentherapie (atidarsagene autotemcel, Libmeldy/Lenmeldy): EU-Zulassung 17.12.2020 (EMA EPAR Libmeldy), FDA 18.03.2024 (FDA-Pressemitteilung). Wirksamkeit gegen Natural-History-Kohorte: 29 behandelte vs. 31 unbehandelte Kinder, Fumagalli et al., Lancet 2022, PMID 35065785. (§4)
4. `app/public/data/meta.json`, Version `2026-10-03+397464a`: 874 Krankheiten (350 Kern), 1.066 Gene, 4.717 Phänotype im Index; Stufen 14.512 observed, 27.066 curated, 4.181 inferred, 488 contradicted; 251 Gegenbeispiel-Paare; 17 Cluster. Vor dem Pitch gegen den dann aktuellen Export prüfen.
5. C5-Challenge-Brief, Seite 2: 10,000 known rare diseases, <5 % have an approved treatment.
