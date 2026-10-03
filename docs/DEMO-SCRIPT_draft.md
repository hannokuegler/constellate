# Demo-Skript (Entwurf) · Constellate

Owner: Recep (prüft und übernimmt). Entwurf vom Doku-Agent, Stand Sa 03.10.2026, 23:55. Nichts hiervon ist entschieden; offene Punkte stehen als Optionen unten.

Format laut [VIDEOS.md](VIDEOS.md): Demo-Video 2:00, Englisch, Querformat, ruhige Stimme, keine Musik, keine Effekte, Live-URL (Browserleiste) sichtbar, aufnehmen erst nach Feature-Freeze (So 12:00). Der 1-min-Walkthrough (C5-Pflicht) ist ein Schnitt aus den Szenen 2 bis 6 (ohne Szene 1, 7 und 8), in einem Take.

Figur: eine Mutter in zwei Momenten, im Video als Komposit benannt (Satz in Szene 1). Keine echten Familien, keine Kinderfotos, keine echten Namen ([STORY.md](STORY.md), DECISIONS P1).

## Regeln für jede Szene

1. Jede Aussage im Voice-over muss im Tool als Kante mit Quelle sichtbar sein ([VIDEOS.md](VIDEOS.md), Regeln). Was nicht sichtbar ist, bleibt aus dem Text.
2. Kanten-IDs unten stammen aus dem Export `2026-10-03+397464a` (`app/public/data/meta.json`). Sie sind deterministisch, aber nach jedem neuen Export vor dem Dreh gegenprüfen (Spalte "Beleg sichtbar").
3. Nur Verifiziertes zeigen: `data/curated/orgs.csv` und `hero_path.yaml` sind heute noch leer. Szenen oder Sätze, die eine Patientenorganisation nennen, gelten erst, wenn Osman die Zeile übernommen hat.

## Szenen

| # | Zeit | Screen / Route | Klick | Voice-over (Englisch) | Beleg sichtbar |
|---|---|---|---|---|---|
| 1 | 0:00 bis 0:12 | `/` Startseite, Karten "We just got the diagnosis" und "I lead a patient group" | Karte "We just got the diagnosis" wählen, "Krabbe" tippen | "This is a composite character, not a real person: a mother whose child has just been diagnosed with Krabbe disease. Two moments, the first nights and the months after." (Einstieg ist Option B in den Geparkten Punkten) | keiner, Titelbild |
| 2 | 0:12 bis 0:32 | `/d/MONDO_0009499` Krabbe disease, Ego-Graph | Kante Krabbe zu GALC anklicken, Edge-Panel öffnet | "For Krabbe disease there is still no approved drug anywhere in the world; the only established treatment is a stem-cell transplant, and it only works before symptoms start. Every line in this graph is an edge with a source, a date, an evidence level and a slot for counter-evidence." | Edge `e_3dbc42738b5a` (Krabbe zu GALC, curated, OMIM:245200); Quelle für den Satz zur Therapie: GeneReviews NBK1238, Escolar 2005, PMID 15901860 (nur nennen, wenn im Edge-Panel oder Hero-Pfad belegt gezeigt) |
| 3 | 0:32 bis 0:55 | `/g/PSAP` "One gene, N disease names" | von Krabbe über das Gen-Kästchen zu PSAP; die Zeilen Saposin A, B, C anklicken | "One gene, PSAP, sits behind three disease names at once: a Krabbe-like, an MLD-like and a Gaucher-like disorder, depending on which piece of the protein is broken. Names hide mechanisms." | Kanten `e_795da9c4a6cd` (Krabbe due to saposin A deficiency, OMIM:611722), `e_316e60c8ee91` (MLD due to saposin B deficiency, OMIM:249900), `e_b4f9b02250a7` (Saposin C, Orphanet 309252 und OMIM:610539; Krankheitslabel vor dem Dreh prüfen) |
| 4 | 0:55 bis 1:10 | zurück auf `/d/MONDO_0009499`, Umschalter "I lead a patient group", Liste "Related communities" | "metachromatic leukodystrophy" (`MONDO:0018868`) anklicken, Edge-Panel | "Months later, she leads a group. The graph shows her the closest related community: metachromatic leukodystrophy, linked by the shared gene PSAP. The Krabbe-to-PSAP link is labelled inferred, rolled up from subtypes, with a lower confidence. We show that instead of hiding it." | Kante `e_e270315fe572` (Krabbe zu MLD, gemeinsames Gen PSAP); `e_2c5236d2f740` (Krabbe zu PSAP, Stufe `inferred`, Konfidenz 0,47, Roll-up) |
| 5 | 1:10 bis 1:25 | gleiche Seite, Nachbar "Pelizaeus-Merzbacher spectrum disorder" | Kante anklicken, Markierung "mechanism differs" zeigen | "And here is the counter-example: Pelizaeus-Merzbacher disease looks similar, but it is a hypomyelinating disease caused by PLP1, not a lysosomal one. Similar symptoms, different cause, so the assets do not transfer." | Kante `e_00a92bfb7837`, Flag `mechanism_differs`; Quelle OMIM 312080, Orphanet 702, PMC9313024 |
| 6 | 1:25 bis 1:45 | `/d/MONDO_0009499/action?via=MONDO_0018868` Action Card | Karte öffnen, einen Satz mit `[e_…]` anklicken | "The Action Card says what transfers, what differs and what needs expert review. Every sentence ends in the edge behind it, and a sentence without an edge is removed. MLD already has an approved gene therapy, approved against a natural-history control cohort, so that study design is something she can join or adapt instead of building from zero." | Kante aus der Karte (Satz-Zitat `[e_…]`, Wert nach dem Dreh eintragen); Quellen für den MLD-Satz: EMA EPAR Libmeldy (Zulassung 17.12.2020), FDA 18.03.2024, Fumagalli 2022, PMID 35065785, nur zeigen, wenn als Kante oder Studie im Tool sichtbar |
| 7 | 1:45 bis 1:55 | Honest-Gap-Screen (Fall offen, siehe Option D) | Diagnose ohne belegte Spur suchen | "And when there is no supported lead, Constellate says so: what we searched and when, which communities are closest, and the next question to test." | Abschnitte "What was searched, as of …", "Nearest related communities", "What would close this gap" |
| 8 | 1:55 bis 2:00 | Logo und URL `<VERCEL_URL>` | keiner | "Five thousand points of light. One map. Constellate." | URL in der Browserleiste |

Offene Studien (DECISIONS P3): Wenn nach `make trials` die Länderfilter auf der Krabbe-Seite erscheinen, passt ein 5-Sekunden-Schnitt in Szene 2 ("Studies looking for participants with Krabbe disease", Länderfilter, Button "Contact the study team"). Nur zeigen, wenn die Daten geladen sind; die App meldet sich nirgends für die Familie an.

## Geparkte Punkte als Optionen (nicht entschieden, Hanno entscheidet)

A. Jury-Satz (W11). Hannos notierter Vorschlag: "Your family is not the first. What you need already exists under another disease's name." Als Hauptsatz in Szene 1 oder 8. Zweiter Satz laut Briefing: "Every edge has a source, and when there is none, we say so." (Szene 2 oder 7). Alternative aus dem Briefing: "Don't rebuild what a neighbouring disease already built."

B. Video-Einstieg (W28). Option 1: Komposit-Figur in höchstens 10 s Kontext, dann Suche (Szene 1 wie oben, Empfehlung im Briefing). Option 2: direkt mit dem PSAP-Aha beginnen (Szene 3 nach vorn), schneller, aber ohne Figur.

C. Name (D1). Constellate (Default) oder Kindred. Der Schlusssatz in Szene 8 und die Domain-Zeile hängen daran; bis zur Entscheidung steht "Constellate".

D. Honest-Gap-Demo-Fall (W30, T28). "CLN14" aus SCOPE.md hat keinen Knoten im Slice. Kandidat laut Briefing: Saposin-A-Defizienz ("atypical Krabbe", OMIM 611722), nur wenn Osman bestätigt, dass es keine eigene Gruppe gibt; sonst eine Kern-Krankheit mit Gen, ohne Studie und ohne Org, per Abfrage gewählt. Bis dahin Szene 7 mit Platzhalter "<GAP_DISEASE>".

E. Kernversprechen (W10). "Join an existing study instead of starting from zero" (Briefing-Empfehlung) oder "build a shared natural-history study". Dieser Entwurf nutzt die erste Variante.

## Bewusst weggelassen (keine Primärquelle oder offen markiert)

1. Zeitvergleiche wie "5 to 8 years versus 6 to 12 months" (SCOPE.md, im Briefing als unbelegt markiert; gehört, wenn überhaupt, in `docs/MOONSHOT.md` mit Quelle).
2. Anzahl der US-Staaten mit Krabbe-Screening (Zählweise der Quellen differiert, in MEDICAL-BACKGROUND mit ⚠️).
3. Österreich ohne Krabbe-Screening (Quelle ist eine undatierte Seite, die Liste wurde nicht vollständig geprüft).
4. Namen von Forschenden und die Rolle von Maria Escolar bei Forge (⚠️ in MEDICAL-BACKGROUND).
5. Patientenorganisationen (MLD Foundation, Hunter's Hope, KrabbeConnect) im Voice-over, solange `orgs.csv` leer ist. Sobald Osman verifiziert hat, kann Szene 4 oder 6 einen Satz bekommen.
6. FBX-101 und PBKR03 als Studienstatus: nur sagen, wenn die Studie als Kante im Tool zu sehen ist (NCT05739643 aktiv, nicht rekrutierend; NCT04771416 suspendiert, jeweils geprüft 03.10.2026).

## Vor dem Dreh prüfen (Checkliste)

- Alle Kanten-IDs in der Tabelle im Live-Tool öffnen und den Evidenz-Eintrag lesen.
- Szene 6: die tatsächlichen Sätze der Action Card ansehen und das Voice-over daran anpassen, nicht umgekehrt.
- Jede genannte Zahl oder Jahreszahl im Voice-over steht in [MEDICAL-BACKGROUND.md](MEDICAL-BACKGROUND.md) mit Quelle, oder sie fliegt raus.
- Live-URL ersetzen: `<VERCEL_URL>`.
