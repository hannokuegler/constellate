# Entscheidungen · Constellate

**Letzte Aktualisierung: Sa 03.10.2026, 22:00 (Wien).** Entscheidungen trifft **Hanno**. Wer etwas baut, nutzt die vorläufigen Defaults unten und behauptet nichts davon als final. Wird eine Frage entschieden, wandert sie in „Erledigt" (mit Datum, Antwort, Begründung) und der Default-Eintrag wird gestrichen oder angepasst. Das Teamboard führt dieselben Fragen D1 bis D7 (Bereich Entscheidungen); beim Entscheiden beides nachziehen.

Die ausführlichen Fragenkataloge mit Optionen, Vor- und Nachteilen, Empfehlung und Zeitschätzung:
- Technik: T1 bis T30 in [briefing/TECHNIK.md](briefing/TECHNIK.md), Abschnitt 6. Heute Abend zwingend waren T27, T1, T12, T23, T17 (alle fünf haben unten einen Default).
- Wirtschaft und Nutzer: W1 bis W30 in [briefing/WIRTSCHAFT-NUTZER.md](briefing/WIRTSCHAFT-NUTZER.md), Abschnitt 6.

## Offen (Hanno entscheidet)

| ID | Frage | Empfehlung | Alternativen | Fragenkatalog | Gebaut wird mit |
|---|---|---|---|---|---|
| **D1** | **Name**: Constellate oder Kindred? | Constellate: Verb, greift die Brief-Tagline („see the constellations") auf, Repo und Discord laufen schon darauf | Kindred (Krankheiten als Verwandte, passt zu Familien) · Lumen Atlas | W14 | Constellate |
| **D3** | **Slice**: 350 Kern plus 524 Nachbarn (874 Krankheiten) behalten? Subtypen zusammenfassen oder einzeln? | Slice behalten (LSD-Kern plus Leukodystrophie-Nachbarn); Subtypen auf den Oberbegriff hochziehen, Herleitung im Edge-Panel klickbar | alle Subtypen einzeln (unruhig) · nur Kern (kein Gegenbeispiel PMD) | T1, T2, T4, T5 | Slice wie oben, Roll-up (siehe Default 2) |
| **D4** | **Quellen in Schritt 4**, in welcher Reihenfolge? | Pathways (Reactome), Studien, Papers, Orgs, Grants, Varianten; Hero-Pfad zuerst | alles parallel (Zeitrisiko) · Varianten früher | T6 bis T9 | alle sechs sind gebaut und gelaufen (Open Targets, Reactome, ClinVar, mygene, ClinicalTrials.gov, Europe PMC, NIH RePORTER) |
| **D5** | **Evidenzmodell**: vier Stufen ok? | Ja: `observed`, `curated`, `text_mined`, `inferred`; Gegenevidenz-Slot je Kante; `inferred` zeigt die Formel | zusätzliche Stufe `predicted` (mehr Nuance, mehr UI-Aufwand) | T10 bis T15, W25, W26 | vier Stufen, `contradicting` immer vorhanden |
| **D6** | **App-Stack und Datenauslieferung** | Next.js plus react-force-graph-2d auf Vercel, statische JSON-Shards statt Datenbank, Live-URL ohne Login | Vite-SPA (kein `/api/explain` ohne Extra-Backend) · eine große `graph.json` (zu groß für Mobile) | T26, T27 | Next.js 15 mit Shards unter `app/public/data/` |
| **D7** | **OpenAI-Modelle** für Extract, Reconcile, Explain | erst `client.models.list()` gegen den Hackathon-Key; kleines Modell für Extract und Reconcile (Masse), größeres für Explain (Streaming, im Demo sichtbar) | ein Modell für alles | T21 bis T24 | Modell-IDs nur per Env, kein Default (siehe Default 6) |

Offen ist außerdem, welcher Honest-Gap-Fall in die Demo kommt (T28, W30): „CLN14" aus SCOPE.md hat im Slice keinen Knoten, Kandidaten stehen im Briefing.

## Vorläufige Defaults, mit denen gebaut wird (umkehrbar)

Jeder Default ist eine Entscheidung der Agents unter Zeitdruck, nicht von Hanno bestätigt. Umkehren heißt: Parameter oder Regel in `pipeline/07_analytics.py` bzw. `pipeline/03_build_graph.py` ändern, `make analytics validate` laufen lassen, Daten neu exportieren.

1. **Shards plus Top-25-Phänotype nach IC (T17).** Jede Krankheit hat einen eigenen Shard mit den 25 informativsten Phänotypen (Information Content). Phänotyp-Shards führen je HPO-Term die 100 stärksten Krankheiten, Gegenevidenz bleibt dabei immer erhalten. Grund: `graph_base.json` hat 26 MB, der Browser braucht Index plus Shards. Parameter `top_k_phenotypes` in `meta.json`. Umkehren: größeres k kostet Dateigröße, Budgets prüft `validate.py`.
2. **Subtyp-Roll-up, markiert, ohne Hochstufung (T1).** Gen-Kanten der Subtypen werden auf den Oberbegriff gezogen (damit PSAP an „Krabbe disease" hängt) und tragen `rolled_up_from` (die Subtyp-Kanten) samt Formel im Snippet. Konfidenz = schwächste Subtyp-Konfidenz mal 0,5, also nie stärker als der Subtyp; die Evidenzstufe wird nicht angehoben. Phänotype werden nur hochgezogen, wenn mindestens die Hälfte der Subtypen sie hat; Oberbegriffe mit mehr als 15 Ursachen-Genen gelten als Kategorie und werden übersprungen (4 Fälle). Ohne Roll-up bricht der Hero-Pfad im ersten Klick. Parameter in `meta.json`: `rollup_confidence_factor`, `max_rollup_genes`, `phenotype_rollup_min_share`.
3. **Orphanets „nicht ursächlich" und OMIM „susceptibility" werden `associated_gene` (T12).** Diese Quellen gewinnen gegen die HPO-Annotation, die alles als `caused_by` führt. Betroffen waren 217 Kanten. Grund: Evidence Integrity, eine überbehauptete Kausalität ist der teuerste Fehler. Umkehren: Priorität in `pipeline/03_build_graph.py`.
4. **Gegenbeispiele über kuratierte Mechanismus-Klassen statt Pathway-Overlap (T19).** Ein Gegenbeispiel ist ein Krankheitspaar mit hoher Phänotyp-Ähnlichkeit, aber verschiedener Mechanismus-Klasse (neun Klassen in `meta.json`, z. B. lysosomal gegen Hypomyelinisierung). Grund: PLP1 hat keine Reactome-Annotation, ein Pathway-Overlap von 0 wäre ein Datenartefakt. Heute 251 Paare; Pelizaeus-Merzbacher gegen Krabbe ist der Hero-Fall.
5. **Explain mit Post-Check (T23).** `/api/explain` verlangt `[e_id]` hinter jedem Satz; ein Satz ohne gültige Kanten-ID fliegt raus und wird in der UI durchgestrichen angezeigt. Ohne Key kommt Template-Text, als solcher gekennzeichnet. Code: `app/lib/explain.ts`, `app/lib/prompts/explain.ts`.
6. **Modell-IDs nur per Umgebungsvariable (T21).** `OPENAI_MODEL_EXTRACT`, `OPENAI_MODEL_JUDGE`, `OPENAI_MODEL_EMBED` (Pipeline) und `OPENAI_MODEL_EXPLAIN` (App). Kein Default im Code, weil eine geratene Modell-ID still das falsche Modell wäre. Fehlt eine Variable, sagt das Skript klar, welche, und fällt auf Fuzzy-Match bzw. Template zurück.
7. **Nur verifizierte Orgs ins Produkt (T24, W24).** Reconcile liest nur Zeilen aus `data/curated/orgs.csv` mit gesetztem `verified_date`. `orgs_draft.csv` bleibt Entwurf und kommt nur mit dem expliziten Schalter `--allow-draft` in einen Testlauf. Dasselbe Prinzip für `hero_path_draft.yaml` (nur `VERIFIED` kommt nach `hero_path.yaml`).

## Erledigt

| Datum | Was | Wo |
|---|---|---|
| Sa 03.10.2026 | Challenge C5 (AI Atlas for the World's Rare Diseases) gewählt, Name Constellate vorläufig | [PLAN.md](PLAN.md) |
| Sa 03.10.2026 20:30 | Cluster-Zuschnitt: LSD-Kern plus Leukodystrophie-Nachbarn, Hero-Journey Krabbe, PSAP, MLD | [SCOPE.md](SCOPE.md) |
| Sa 03.10.2026 21:20 | Teamboard live unter https://constellate.flowary.at, temporär bis 11.10.2026 | [TEAMBOARD.md](TEAMBOARD.md) |
| Sa 03.10.2026 21:30 | D1 bis D7 geparkt; Agents bauen den Kern mit umkehrbaren Defaults, Hanno nimmt ab | [PLAN.md](PLAN.md), Orchestrator-Log |
| Sa 03.10.2026 21:30 | Befunde aus dem Technik-Briefing umgesetzt: Determinismus und 12-hex Edge-IDs (R10), 0-von-n als Gegenevidenz (T11), 217 `caused_by` zu `associated_gene` (T12, vorläufig), Provenienz je Beleg | Git-Log, [briefing/TECHNIK.md](briefing/TECHNIK.md) |
| Sa 03.10.2026 21:30 | Medizin-Korrekturen: FBX-101 jetzt NCT05739643, HOME-Studie Sponsor NORD, Österreich ohne Krabbe-Neugeborenenscreening | [MEDICAL-BACKGROUND.md](MEDICAL-BACKGROUND.md) |
| Sa 03.10.2026 22:00 | Dieses Repo ist die einzige Quelle der Wahrheit; Kopien außerhalb des Repos (lokal bei Hanno) sind veraltet | [../CLAUDE.md](../CLAUDE.md) |
| Sa 03.10.2026 23:30 | **D2 entschieden.** Zielperson (W1, W2, W6): **eine Mutter in zwei Momenten**. Moment 1 „We just got the diagnosis" (Familie, erste Nächte: Gruppe oder Honest Gap, offene Studien), Moment 2 „I lead a patient group" (verwandte Communities, beitreten statt bauen, Action Card). Biohacker verworfen (nicht im Brief, Selbstexperiment-Risiko). Priya, Devon, Dr. Osei bleiben als Nebenlinsen | `app/lib/persona.ts`, `app/components/MomentBar.tsx`, Startseite |
| Sa 03.10.2026 23:30 | Side-Feature **offene Studien mit Ländern**: Studien aus ClinicalTrials.gov, die die Diagnose nennen und rekrutieren; Länderfilter, Standorte, Altersgrenzen; Button „Contact the study team" führt zum offiziellen Kontaktabschnitt der Studie. Keine Anmeldung in der App, keine Kontaktdaten von Studienpersonal im Repo; Teilnahme entscheiden Studienteam und Ärztin | `pipeline/08_trial_details.py`, `app/components/OpenStudies.tsx` |
