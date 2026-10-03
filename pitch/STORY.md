# Die Verkaufsgeschichte · Constellate

Stand So 04.10.2026, ca. 02:00 (Wien). Entwurf des Story-Agents, Entscheidungen bei Hanno. Quellenregel wie im ganzen Repo: jede Zahl und jede medizinische Aussage trägt ihre Primärquelle (PMID, OMIM, ORPHA, NCT, EMA/FDA) oder stammt aus `app/public/data/meta.json` (Export `2026-10-03+397464a`). Was in [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) mit ⚠️ markiert ist, kommt hier nicht vor. Die Mutter ist eine Komposit-Figur und wird in jedem Video so genannt.

## 1. Das Problem in einem Satz, den jeder fühlt

Eine Familie bekommt eine Diagnose, für die es kein Medikament gibt, und wird über Nacht zur Leitung eines Forschungsprojekts, das sie nie führen wollte, ohne zu wissen, dass die Nachbarkrankheit schon die Hälfte des Wegs gegangen ist.

Kürzer, für den Pitch: **Your family is not the first. What you need may already exist under another disease's name.** (Hannos Satz aus dem Grilling, steht bereits als Überschrift auf `/about`.)

Warum das jeder fühlt, auch ohne Medizinwissen: Jeder kennt das Gefühl, bei null anzufangen, während irgendwo die Lösung schon liegt. Das Rare-Disease-Feld macht daraus eine Tragödie mit Zeitstempel, denn bei der infantilen Form von Krabbe liegt die mediane Lebenserwartung bei 24 Monaten (GeneReviews NBK1238). Diese Zahl wird im Pitch **nicht** gesagt (siehe Abschnitt 6, Kitsch-Grenze), aber sie ist der Grund, warum Zeit hier die eigentliche Währung ist.

## 2. Drei Blickwinkel

### (a) Die Mutter · Komposit-Figur

**Name-Vorschlag: Nora.** Begründung: Der Name steht bereits in [docs/STORY.md](../docs/STORY.md) und im Code (`app/lib/persona.ts`, Persona-ID `nora`), er ist zweisilbig, in Englisch und Deutsch gleich auszusprechen, klingt europäisch ohne Klischee, ist kein Name einer bekannten realen Patientin oder Gründerin in diesem Feld (geprüft gegen MEDICAL-BACKGROUND §3 und §4: Jill Kelly, Stacy Pike-Langenfeld, Anne Rugari, Teryn Suhr), und er ist nicht „Maria", die jedes Team aus dem Brief übernimmt. Alternativen: „Lena" (ähnlich neutral, aber häufiger in Hackathon-Demos), „Maria mit unseren Details" (sicherste Jury-Kompatibilität, austauschbar). Empfehlung aus [docs/briefing/WIRTSCHAFT-NUTZER.md](../docs/briefing/WIRTSCHAFT-NUTZER.md) W2: Nora als „our Maria", ein Satz Brücke. **Entscheidung: Hanno.**

**Das Kind bleibt namenlos** („her son"). Begründung: Ein Kindername plus Diagnose plus Stadt liest sich wie eine echte Familie, auch mit Komposit-Hinweis. „Her son" hält die Figur erkennbar als Konstruktion und schützt reale Familien. Keine Kinderfotos, kein Stock-Leid, kein Krankenhausbild (VIDEOS.md, RESOURCES Video-Pipeline).

**Moment 1 · die ersten Nächte (Startkarte „We just got the diagnosis").** Nora sucht um zwei Uhr nachts. Sie findet Abstracts, die für Fachleute geschrieben sind, oder nichts. Was sie braucht: Gibt es Familien wie uns? Gibt es eine Studie, die Kinder wie unseres sucht? Wenn es keine Gruppe gibt: Sagt mir das ehrlich, und sagt mir, wer am nächsten dran ist. In der App: Startseite, Suche „Krabbe", Ego-Graph, MomentBar mit drei Antworten (Patientengruppen, offene Studien, verwandte Diagnosen), Edge-Panel, Honest Gap.

**Moment 2 · Monate später (Startkarte „I lead a patient group").** Dieselbe Mutter leitet jetzt eine Gruppe. Sie baut ein Register mit einem Online-Formular, schreibt Kliniken an, bekommt keine Antwort. Was sie nicht weiß: Die Nachbarkrankheit MLD hat eine zugelassene Gentherapie (EMA 17.12.2020, FDA 18.03.2024), und deren Wirksamkeit wurde nicht gegen Placebo, sondern gegen eine Natural-History-Kohorte belegt: 29 behandelte gegen 31 unbehandelte Kinder (Fumagalli et al., Lancet 2022, PMID 35065785). Dieses Studiendesign existiert. Eine Motorik-Skala existiert (GMFC-MLD, Kehrer 2011, PMID 21707604). Eine clusterweite Langzeitstudie, die Krabbe und MLD gemeinsam beobachtet, existiert (NCT03333200, Pittsburgh, geplant 1.500 Patienten). In der App: Umschalter auf Moment 2, „Related communities", Edge-Panel MLD, Gegenbeispiel Pelizaeus-Merzbacher, Action Card mit `[e_…]`-Zitaten und Export.

**Was Nora am Ende hat:** keinen Heilsversprechen-Satz, sondern einen Ein-Seiter, den sie diese Woche an eine Partnergruppe oder ein Zentrum schicken kann, mit „übertragbar / unterschiedlich / Expertenprüfung" und einer Quelle hinter jedem Satz. Das ist der Brief wörtlich: „Here is what must be checked before we join forces."

**Was Nora nicht bekommt (und wir sagen es):** keine Diagnose, keine Therapieempfehlung, keine Zusage einer Studie. Teilnahme entscheiden Studienteam und Ärztin (DECISIONS P4). Constellate ist Forschungs-Navigation, nicht medizinische Beratung.

### (b) Ein normaler Zuschauer ohne Medizinwissen

Was der Zuschauer verstehen muss, in dieser Reihenfolge, und nicht mehr:

1. Es gibt Krankheiten so selten, dass die Familien die Forschung selbst organisieren müssen. (Brief, Seite 2: „A diagnosis has made you the organizer of a research effort you never expected to lead.")
2. Krankheiten haben Namen, aber die Biologie hält sich nicht an Namen. Ein einziges Gen, PSAP, steht hinter drei Krankheitsnamen: einer Krabbe-ähnlichen, einer MLD-ähnlichen und einer Gaucher-ähnlichen Krankheit, je nachdem, welcher Abschnitt des Proteins kaputt ist (OMIM 611722, 249900, 610539). Das ist der Aha-Moment, den jeder ohne Vorwissen versteht: **drei Türen, ein Raum.**
3. Deshalb kann die Nachbarkrankheit schon gebaut haben, was du brauchst. MLD hat ein Studiendesign, das eine Zulassung getragen hat (PMID 35065785). Krabbe kann beitreten oder adaptieren, statt bei null zu beginnen.
4. Und jede Linie auf der Karte sagt, woher sie kommt, wie sicher sie ist, und was dagegen spricht. Wo nichts ist, steht „nichts gefunden, das haben wir durchsucht".

Was der Zuschauer **nicht** braucht: Lysosom, Sulfatid, Psychosin, simGIC, Louvain. Diese Wörter gehören ins Tech-Video und auf `/methods`, nicht in die Demo. Ausnahme: „metachromatic leukodystrophy" wird einmal ausgesprochen und dann „MLD" genannt.

Der Satz, den der Zuschauer mitnimmt: **Don't rebuild what a neighbouring disease already built.**

### (c) Die Jury · Kriterien aus dem Brief (C5-Challenge-Brief, Seite 6)

| Kriterium | Was die Jury sucht | Wo die Story es zeigt | Beleg im Produkt |
|---|---|---|---|
| **Graph quality** | sinnvolle Knoten und Kanten, verteidigbares Clustering, nützliche Pfade, Gegenbeispiele, klarer Umgang mit Unsicherheit | Szene Pelizaeus-Merzbacher: ähnliche Symptome, anderer Mechanismus, „assets do not transfer" | 251 Gegenbeispiel-Paare, 17 Cluster, Modularität 0,678 (`meta.json`); Kante `e_00a92bfb7837` mit `mechanism_differs` |
| **Evidence integrity** | belegte, gegengeprüfte Aussagen, Daten getrennt von Hypothesen und klinischem Beweis | jedes Edge-Panel: Quelle, Datum, Stufe, Konfidenz, Gegenevidenz-Slot, der nie fehlt; `inferred` zeigt die Formel | 14.512 observed, 27.066 curated, 4.181 inferred, 488 contradicted (`meta.json`); Krabbe→PSAP als `inferred`, Roll-up markiert, Konfidenz 0,47 (`e_2c5236d2f740`) |
| **Patient progress** | eine Familie oder Gruppe geht von isolierter Diagnose zu begründeter Kooperation, wiederverwendbarem Asset, nächstem Meilenstein | Nora in zwei Momenten, Action Card als Artefakt zum Verschicken | `/d/MONDO_0009499/action?via=MONDO_0018868`, Export proposal |
| **10× impact** | Meilenstein, heutige Timeline gegen unsere Route, Annahmen | Meilenstein „nutzbarer externer Kontrollarm", Präzedenz Libmeldy (29 vs. 31, PMID 35065785) | **offen:** `docs/MOONSHOT.md` fehlt (Recep, R2). Bis dahin keine 10×-Zahl in Videos oder Pitch, nur die Annahmen in Worten |
| **Ambition and product craft** | intuitive Erfahrung, Zusammenarbeit über Communitys hinweg | eine Suche, zwei Momente, Progressive Reveal, Honest Gap als eigener Screen | Startseite, MomentBar, `/methods`, `/about` |

Jury-Zusatz, den fast kein Team hat: Das Tool sagt **Nein**. Das Gegenbeispiel wird aktiv gezeigt, nicht versteckt. Die Honest Gap ist ein First-Class-Screen. Und beim OpenAI-Track: „The graph is the guardrail. No edge, no sentence." (W13, positive Abgrenzung, nie „ChatGPT halluziniert".)

## 3. Der Moment, der ans Herz geht

Nicht die Diagnose. Nicht die Zahl. Sondern der Moment, in dem Nora sieht, dass sie nicht allein ist, obwohl ihre Krankheit es behauptet.

Konkret, in der App: Sie hat „Krabbe" getippt und sieht eine Karte mit Nachbarn. Sie klickt „metachromatic leukodystrophy" und liest im Edge-Panel, warum die Krankheiten verbunden sind. Dann öffnet sie die Action Card, und dort steht in Klartext, mit Quelle, dass die Nachbar-Community ein Studiendesign hat, das eine Zulassung getragen hat. Der emotionale Kern ist **Erleichterung, nicht Hoffnung auf Heilung**: „Ich muss das nicht alleine erfinden."

Regie-Hinweis: Dieser Moment braucht im Video zwei Sekunden Stille nach dem Satz „That study design exists." Keine Musik. Der Cursor steht.

## 4. Wie aus Ohnmacht Handlung wird

Drei Übergänge, jeder mit einem Screen:

1. **Von „niemand weiß etwas" zu „es gibt Nachbarn".** Suche → Ego-Graph → Related communities. Die Karte zeigt, dass Krankheitsnamen Inseln sind, die Biologie aber ein Archipel.
2. **Von „wir müssen alles bauen" zu „wir können beitreten".** MLD → Natural-History-Präzedenz (PMID 35065785) → NCT03333200 (Krabbe schon Teil einer clusterweiten Studie). Das Kernversprechen heißt deshalb „join instead of build" (W10, Empfehlung B), nicht „build a shared study". Für Krabbe gibt es NHS-Daten schon (Bascou 2018, PMID 30089515, 35 Patienten; Krieg 2020, PMID 32912261); wer „wir bauen eine NHS" sagt, wird von einer kundigen Jurorin in einer Minute zerlegt.
3. **Von „Vorschlag im Kopf" zu „Vorschlag auf Papier".** Action Card → Export. „From graph to e-mail." Sie verlässt die App mit einem Dokument, nicht mit einem Gefühl.

Was wir dabei nie sagen: „cure", „bald auch für Krabbe", „die Gentherapie von MLD hilft Krabbe-Kindern". Die Action Card hat dafür die Spalte „What differs" und „Needs expert review".

## 5. Honest Gap als emotionale Stärke

Die Intuition sagt: Lücken zeigen ist Schwäche. Das Gegenteil stimmt, aus drei Gründen:

1. **Jede Mutter in diesem Feld hat schon einmal ein Tool erlebt, das etwas erfunden hat.** Ein Screen, der sagt „wir haben ClinicalTrials.gov, Europe PMC, NIH RePORTER am 3. Oktober durchsucht, null Treffer, und hier sind die nächsten Communitys", ist der erste Screen, dem sie glauben kann. Vertrauen entsteht über Bürgen, nicht über Technik (Briefing 5.2).
2. **Die Lücke ist eine Handlungsanweisung.** „What would close this gap" macht aus Leere eine Aufgabe: Das ist die nächste Frage, die eine Gruppe testen kann. Der Brief verlangt genau das: „If the graph reveals no supported lead, she leaves with a clear account of what is unknown and a next question to test."
3. **Die Jury kennt das Gegenteil.** Vierzig Teams werden Graphen zeigen, in denen alles mit allem verbunden ist. Ein Team, das an einer Stelle demonstrativ „nichts gefunden" sagt, wirkt als einziges glaubwürdig.

Emotionaler Ton für die Gap-Szene: ruhig, respektvoll, kein Bedauern in der Stimme. Der Satz „That is a finding, not a failure" steht wörtlich in der App (`app/components/HonestGap.tsx`).

**Vorschlag für den Demo-Fall (W30, T28, Entscheidung Hanno + Osman):** `MONDO:0012720` „Krabbe disease due to saposin A deficiency". Im aktuellen Export: Gen PSAP, ClinicalTrials.gov 0 Treffer, NIH RePORTER 0 Treffer, Europe PMC 2 Erwähnungen (Coverage-Block im Shard, Stand 2026-10-03). Der Fall hängt direkt am Hero-Pfad und schließt den Kreis: Diese Kinder fallen durch jeden GALC-Enzymtest, nur die Mechanismus-Sicht findet sie (OMIM 611722). Alternative: `MONDO:0009590` „MLD due to saposin B deficiency" (ClinicalTrials.gov 0, Europe PMC 0, RePORTER 0, Open Targets 0). Voraussetzung für die Org-Aussage „keine eigene Gruppe": Osman bestätigt; bis dahin zeigt die Szene nur die Studien- und Literatur-Lücke.

## 6. Grenzen, damit emotional nicht kitschig wird

- Keine Kinderfotos, kein Krankenhausflur, keine Musik, keine Zeitlupe.
- Die Lebenserwartungs-Zahl (GeneReviews NBK1238) wird nicht gesprochen. Wer sie kennt, braucht sie nicht; wer sie nicht kennt, soll nicht mit ihr erschlagen werden.
- Nora hat keinen Monolog. Sie wird in zwei Sätzen eingeführt und dann durch Klicks erzählt.
- Jeder emotionale Satz steht neben einem Screen mit Quelle. Gefühl und Beleg im selben Bild.
- Der Komposit-Hinweis kommt im ersten Satz, nicht im Kleingedruckten.

## 7. Einstiegssatz · drei Varianten

| # | Satz | Stärke | Schwäche |
|---|---|---|---|
| E1 | **„Your family is not the first."** (dann: „What you need may already exist under another disease's name.") | fünf Wörter, universell, direkt an den Zuschauer, steht schon auf `/about`, Hannos Satz | braucht den zweiten Satz, um zur Krankheit zu kommen |
| E2 | „Imagine the first night after the diagnosis." | setzt sofort die Szene, spiegelt den Brief („Imagine learning that your child …") | Brief-Sprache, andere Teams eröffnen ähnlich |
| E3 | „Ten thousand rare diseases, ten thousand names. The names are the problem." | Jury-Logik von Sekunde eins, Pointe am Ende | kalt, keine Figur, Zahl aus dem Brief, die alle nennen |

**Empfehlung: E1.** Er ist der einzige der drei, der die Zuschauerin direkt anspricht, und er trägt die ganze These (Nachbarn, Namen, Wiederverwendung) in zwei Sätzen. Im Demo-Video steht er in Szene 1 nach dem Komposit-Hinweis, im Pitch ist er der erste Satz.

## 8. Schlusssatz · drei Varianten

| # | Satz | Stärke | Schwäche |
|---|---|---|---|
| S1 | **„Don't rebuild what a neighbouring disease already built."** | Wert in einem Satz, merkbar, passt zu „join instead of build" (W10, W11) | sagt nichts über Vertrauen |
| S2 | „Every edge has a source, and when there is none, we say so." | Vertrauen, Honest Gap, Evidence Integrity | eher Methoden- als Schlusssatz |
| S3 | „Your family is not the first. Now the map shows you who else is on it." | schließt den Bogen zu E1 | „on it" ist schwach, klingt nach Liste |

**Empfehlung: S1 als Schlusssatz, S2 als Satz in der Honest-Gap-Szene.** Die Jury soll nach vierzig Teams einen Satz wiederholen können, und „Don't rebuild what a neighbouring disease already built" ist der, der unseren Unterschied benennt. S2 gehört an die Stelle, an der die Lücke gezeigt wird; dort wirkt er, am Ende würde er die Handlung relativieren. Die Brief-Tagline („Five thousand points of light …") erscheint höchstens als Bildschirmtext, nicht gesprochen: Jedes Team hat sie.

## 9. Was in keinem Video und keinem Pitch vorkommt (Quellenlage)

| Aussage | Warum nicht |
|---|---|
| „5–8 Jahre heute, 6–12 Monate mit Constellate" (SCOPE.md) | unbelegt, im Briefing als unbelegt markiert; gehört, wenn überhaupt, mit Quelle in `docs/MOONSHOT.md` |
| „3–5× mehr Patienten durch Cluster-Rekrutierung" | fachlich falsch, externer Kontrollarm ist subtypspezifisch (W18) |
| Anzahl US-Staaten mit Krabbe-Screening (18 oder 19) | Zählweise der Quellen differiert, ⚠️ in MEDICAL-BACKGROUND |
| Österreich ohne Krabbe-Screening | Quelle undatiert, Liste nicht vollständig geprüft |
| Namen von Forschenden (Escolar, Kurtzberg) | belegt per PMID, aber Personen nur über Publikation und Institution nennen (W24); im Video weglassen |
| Patientenorganisationen (MLD Foundation, Hunter's Hope, KrabbeConnect) als Partner oder im Voice-over | `data/curated/orgs.csv` ist leer; nur Verifiziertes ins Produkt (Regel 8) |
| „cure", „heilbar", „bald auch Krabbe" | Heilsversprechen, Honest-Gap-Prinzip |
| 10×-Zahl, „8–15×" | nur mit `docs/MOONSHOT.md` und Annahmen; bis dahin nur „the brief asks for ten times; here are the three assumptions that would have to hold" |

## 10. Die drei stärksten Ideen, zusammengefasst

1. **Drei Türen, ein Raum.** PSAP als Bild für „Namen verstecken Mechanismen": ein Gen, drei Krankheitsnamen, drei getrennte Communitys (OMIM 611722, 249900, 610539). Jeder versteht es in zehn Sekunden, und es steht als eigener Screen in der App (`/g/PSAP`).
2. **Das Tool sagt Nein.** Pelizaeus-Merzbacher als aktives Gegenbeispiel und die Honest Gap als eigener Screen. Vertrauen durch Verzicht.
3. **From graph to e-mail.** Die Action Card ist ein Dokument, nicht ein Screen. Nora verlässt die App mit etwas, das sie diese Woche verschicken kann, und jeder Satz trägt seine Kante.
