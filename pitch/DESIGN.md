# DESIGN · Constellate v2 „Deep Sky"

Stand So 04.10.2026, 02:10 (Wien). Verbindlich für alle Design-Agents auf `design-v2`. Grundlage: Apple HIG (Skill `/design`, `HIG-web.md`), Fable-Richtungen A/B/C, Konkurrenz Rare Atlas (nur lokal angesehen, nie ins Repo). Entscheidung Hanno 02:00: 3D ja, `three` 0.186 freigegeben.


**Entscheidung Hanno 06:05:** Das Design „Deep Sky" (dunkler Himmel, Brille, Scroll-Story, Fraunces, Glas, Bernstein) fällt. Zurück zum alten hellen Design von `main` (Inter, Indigo-Akzent, weiße Karten). Alle Funktionen aus §9 bleiben, Personas bleiben draußen (P16). Rückbau auf Branch `maria-classic`. Die Abschnitte 1 bis 8 unten sind damit historisch.

## 1. Referenzen

- Konkurrenz: begehbare 3D-Bibliothek mit schwebenden Knoten, „Evidence Desk", alles als synthetische Demo markiert. Stark im ersten Blick, leer in der Sache.
- Planetarium kurz bevor das Licht ausgeht; Sternatlas mit Haarlinien; Apple Sky Guide / Fitness-Ringe für Ruhe und Präzision.
- Unser Motion-Opener/-Outro: isolierte Lichtpunkte → Sternbilder. App und Video gehen nahtlos ineinander über.

## 2. Idee in einem Satz

**Der Himmel ist die Datenbank:** jeder Stern ist eine echte Krankheit, ein echtes Gen oder ein echtes Symptom, die Sternbilder sind die belegten Kanten, und wer sucht, fliegt zu seinem Licht.

Belegte Zahlen (meta.json `2026-10-04+917470a`, core.json): 874 Krankheiten, 1.066 Gene, 5.642 Symptome, 17 Cluster, 2.966 Kern-Kanten, **221 von 874 Krankheiten ohne eine einzige Kante** (die „isolierten Lichtpunkte" sind wörtlich wahr). Jede Zahl im UI wird zur Laufzeit aus den Daten gelesen, nie hart geschrieben.

## 3. Markenmuster: isolierter Lichtpunkt → verbundener Bernstein-Punkt

Durchgehend, nicht einmalig (Komponente `components/brand/Dot.tsx`, Zustände `idle | lit | linked`):

| Ort | Muster |
|---|---|
| Wortmarke | drei Punkte, zwei verbunden, einer Bernstein |
| Primärbutton | Punkt links im Button, Hover/aktiv: wird Bernstein, feine Linie zum Text |
| Fokusring | `:focus-visible` 2 px Bernstein, Offset 2 px |
| Laden (Skelett) | Punktreihe, die nacheinander aufglimmt (reduced-motion: statisch) |
| Tour-Balken | Schritte als Punkte-Kette, erledigt = Bernstein, verbunden |
| Edge-Panel-Kopf | Quelle → Datensatz → Datum → Stufe als vier verbundene Punkte |
| Honest Gap | ein Punkt ohne Linie, gestrichelter Ring („a finding, not a failure") |
| Footer | Zählerzeile „874 diseases · 1,066 genes · 5,642 symptoms · 221 still without a mapped neighbour" |
| Favicon / icon.svg | Bernstein-Punkt mit einer Linie zu einem weißen Punkt |

## 4. Farb-Tokens (Namen sind Vertrag, Werte darf nur der System-Agent ändern)

**Farbe = Evidenz, sonst nichts.** Knotentyp über Form und Helligkeit, nie über Farbton. Genau ein warmes Licht: Bernstein = „du bist hier / diese Krankheit / gelesene Kante".

| Token | dunkel (Video) | hell | Zweck |
|---|---|---|---|
| `--bg` | #0B1020 | #F5F6FA | Seite / Himmel |
| `--surface` | #121831 | #FFFFFF | Karten, Panels (deckend) |
| `--surface-2` | #1A2142 | #EEF0F5 | Felder, Zeilen-Hover |
| `--glass` | rgb(18 24 49 / .72) + blur 16 | rgb(255 255 255 / .78) + blur 16 | nur Overlays über dem 3D-Himmel |
| `--ink` | #ECEEF6 | #121629 | Text |
| `--ink-2` | #A3AAC4 | #4B526B | Sekundärtext |
| `--line` | #262E52 | #DCDFE8 | Haarlinien, Rahmen |
| `--accent` / `--accent-ink` | #ECEEF6 / #0B1020 | #121629 / #FFFFFF | Primärbutton = Tinte, kein Indigo |
| `--amber` | #F5C46B | #9A5E0E | Zentrum, Fokus, Markenpunkt, gelesene Kante |
| `--amber-soft` | rgb(245 196 107 / .14) | rgb(154 94 14 / .10) | Halo, Auswahl-Hintergrund |
| `--star` | #D7DBEA | #3A4157 | Krankheits-Punkt, curated/observed-Linie |
| `--star-dim` | #8D94B0 | #6E7590 | Symptom-Punkte, zweiter Hop |
| `--lvl-strong` | #D7DBEA | #3A4157 | curated/observed |
| `--lvl-text` | #7CB4FF | #1F64B8 | text-mined |
| `--lvl-inferred` | #B8A2FF | #6B4FD1 | inferred |
| `--contra` / `--contra-soft` | #FF7B7B / #2E1620 | #C2303B / #FBEAEB | Gegenevidenz, mechanism differs |

Alte Namen (`--n-center`, `--n-disease`, `--n-gene`, `--n-phenotype`, `--n-neighbour`, `--n-pathway`, `--warn*`, `--ok*`) bleiben als Aliase auf die neuen Werte bestehen, bis kein Code sie mehr liest. Kontrast aller Paare ist im alten Konzept (Richtung A) gemessen, ≥ 4,5 Text / ≥ 3 Grafik in beiden Themen; Abweichungen misst der System-Agent nach.

## 5. Typo

- **Fraunces** (Display, `opsz` an, SOFT 50, 400/600) für H1/H2 und das Zentrums-Label. **Inter** (UI, `tabular-nums` für alle Zahlen). **JetBrains Mono** nur für Kanten-IDs `e_…`. Alle OFL, über `next/font/google` (selbst gehostet zur Laufzeit), CSS-Variablen `--font-display`, `--font-sans`, `--font-mono`.
- Leiter: 12 · 13 · 15 · **17 (Fließtext)** · 22 · 28 · 44/56 (Hero) px. Gewichte 400 · 500 · 600.
- Canvas- und WebGL-Labels lesen die Familie aus `getComputedStyle(document.body).fontFamily`.

## 6. Bewegung (genau drei Signature-Momente, alles hinter `prefers-reduced-motion`)

1. **Kameraflug** zum Suchtreffer / Tour-Schritt, 900 ms ease-in-out; Ziel zündet Bernstein.
2. **Konstellation zündet**: Nachbarn blenden vom Zentrum nach außen ein, gestaffelt nach Grad (≤ 25 ms je Knoten, gesamt ≤ 600 ms).
3. **Gelesene Kante bleibt Bernstein**, solange ihr Evidence-Panel offen ist.
Sonst: Übergänge ≤ 250 ms über `--anim`. Leichtes Funkeln der Sterne nur im 3D und nur ohne reduced-motion. Reduced motion = Endzustand sofort, kein Flug, Himmel statisch.

## 7. Screens

| Screen | Was |
|---|---|
| `/` Start | Vollflächiger 3D-Himmel (alle Knoten, Position aus Cluster-Layout, vorberechnet in `public/world/sky.json`). Darüber Glas: H1 „Your family is not the first.", Unterzeile, Combobox „search diseases", CTA „Start with Krabbe disease", Zählerzeile. Suche → Kamera fliegt zum Stern, Klick → Krankheitsseite. Die 221 Isolierten als blasser Staub am Rand, ehrlich beschriftet. |
| Tour | `?tour=hero&step=n`, teilbar. Tour-Balken unten als Punkte-Kette: Krabbe → GALC → PSAP (ein Gen, vier Namen) → MLD (Why linked) → Action Card → Honest Gap. Jeder Schritt nennt Kanten-ID und Quelle. |
| `/d/[id]` Krankheit | Kopf mit Fraunces-Titel; Ego-Graph als Nahaufnahme desselben Himmels (dunkles Fenster auch im Hellmodus), Knotentyp = Form (Krankheit gefüllt, Gen hohler Ring, Symptom kleiner gedimmter Punkt, Gegenbeispiel rot gestrichelter Ring, Zentrum Bernstein mit Halo). |
| Evidence-Panel | Rechts (Desktop) / Sheet (375). Kopf als Punkte-Kette Quelle → Datensatz (Link) → Datum → Stufe; Konfidenz als Balken mit Zahl; „Evidence (n)" und „Counter-evidence (n)" mit geprüften Quellen; Formel bei inferred; Kanten-ID in Mono, kopierbar; „Where AI is used" bei text-mined. Schlägt den „Evidence Desk" in jeder Zeile. |
| `/g/[id]` Gen | Ring in der Mitte, die Krankheitsnamen als Punkte drum herum; „One gene, N disease names". |
| Action Card | drei Spalten „What transfers ✓ / What differs ≠ / Needs expert review ?" in Tinte; Approved therapies und Reusable assets mit Quelle und Datum. |
| Honest Gap | eigener ruhiger Moment: ein Punkt ohne Linie, gestrichelter Ring, „What was searched, as of <Datum>" als Tabelle (Quelle · Query-Link · Treffer), „What would close this gap". Nie aus der Karte laufen. |
| `/methods`, `/about` | Fraunces-Überschriften, Quellen-Tabelle aus `meta.sources`, „Where AI is used" (P15). |

## 8. Was nicht fallen darf

- E2E-Zugänge aus `app/e2e/hero.spec.ts` (Rollen und Texte), Konsole fehlerfrei.
- 2D-Rückfall ohne WebGL / reduced-motion / schwaches Gerät / Fehler, voll bedienbar; Pixel-Selbsttest gegen leeres Bild; Composer `samples: 0`.
- LCP Startseite < 2,5 s: 3D nur per `next/dynamic` (`ssr:false`), erstes Bild ist der statische Glas-Hero.
- HIG: 44 px Tippflächen, 17 px Fließtext, 4,5:1 / 3:1, kein seitliches Scrollen bei 375, `:focus-visible`, Safe Areas.
- „research navigation, not medical advice" sichtbar. Keine Zahl ohne Quelle. Maria nie als echte Person. KI-Labels neutral (P15).
- `app/public/data/` und `pipeline/` tabu.

## 9. Marias Weg (Konzept-Check, Stand 05:15)

Maria ist eine Persona aus dem Brief und taucht im Produkt nie mit Namen auf. Ihr Kind hat gestern die Diagnose bekommen. Es ist 2 Uhr nachts, sie sitzt am Handy (375 px, dunkel), ist geschockt und hat kein Fachwissen. Jeder Schritt beantwortet genau eine ihrer Fragen, mit Quelle und Datum. Die Tiefe ist einen Klick weiter, nie im Weg.

| # | Ihre Frage | Was sie sieht | Wer baut |
|---|---|---|---|
| 0 | Wo fange ich an? | Startseite: ein Satz, ein Suchfeld, 2 bis 3 Beispiele, zweiter Einstieg „I have a finding or symptom". Kein Graph, keine Zahlenwand. Die Scroll-Story folgt erst darunter und blockiert das erste Bild nie. | A (`StartView`), Story: Welt (`world/ScrollStory`) |
| 1 | Was ist das? | Sie tippt „Krabbe", wählt „Krabbe disease", landet auf der Krankheitsseite: H1, ein Satz Definition (MONDO, Quelle sichtbar). | A |
| 2 | Gibt es eine Behandlung? | Block „What you can do now". Erste Zeile ehrlich: „Not found in EMA or FDA records as of <Datum>". Direkt darunter die Alternativen bei Nachbarn: „Approved for metachromatic leukodystrophy, not for Krabbe disease", Libmeldy (EMA 17.12.2020) und Lenmeldy (FDA 18.03.2024) mit Link. Nie andeuten, dass das bei Krabbe wirkt. | A |
| 3 | Wo melde ich mich? | Patientengruppen (Hunter's Hope, Krabbe UK, KrabbeConnect, ELA Deutschland) mit Land und Knopf zur offiziellen Seite. | A (nutzt `Orgs`) |
| 4 | Gibt es eine Studie? | Offene Studien mit Länderfilter, Status in Klartext („Recruiting now", „Observes, no treatment"), „Contact the study team" zum Registereintrag, dazu der Hinweis, dass Arzt und Studienteam über die Teilnahme entscheiden. | A (nutzt `OpenStudies`) |
| 5 | Was gibt es bei MLD? | Höchstens drei nächste Nachbarn mit dem, was dort schon existiert (Zulassung, Natural-History-Studie, Register), der Rest hinter „Show all N". Von dort führt der Weg zur Action Card. | A |
| 6 | Was nehme ich zum Arzt mit? | Action Card, oben „In plain language" (Explain), dann What transfers, What differs, Needs expert review, jeder Satz mit Kanten-ID. Drucken und teilen. | Integrator (`ActionCardPage`) |
| 7 | Kann ich helfen? | Knopf „Share what you know" auf der Krankheitsseite und der Action Card → `/share` in drei Schritten, die Krankheit ist vorausgefüllt, mit Datenschutz-Sperre, am Ende ein GitHub-Issue oder Text kopieren. | B |
| 8 | Ich habe nur einen Befund | Zweiter Einstieg → Symptom-Seite `/p/<HP>`: welche Krankheiten passen (mit Quelle, ohne Diagnose-Anspruch), welche Studien es gibt. | A (`PhenotypeView`) |

Die Detail-Ebene liegt unter den Klartext-Blöcken: Graph, Evidence-Panel mit Gegenevidenz-Slot, Formel und Forschende. Forschende erreichen sie mit einem Klick, Maria muss nicht durch sie hindurch.

**Ist-Befund `maria` (d382620, 375 dunkel, 0 Konsolenfehler, kein seitliches Scrollen):**

- Die Krankheitsseite ist bei 375 px 12.175 px hoch. Oben stehen gute Zahlen (4 patient groups, 8 open studies, 13 related diagnoses, „What now?").
- Die Antwort auf „Gibt es eine Behandlung?" fehlt oben.
- Der Graph kommt schon an zweiter Stelle.
- Die 13 Nachbarn hängen alle offen, jeder mit eigenem Action-Card-Knopf.
- Bei den Patientengruppen steht als Label „inferred", das versteht Maria nicht.
- Der Linktext „Why the mechanism call" ist unklar.
- Auf der Action Card ist „Explain in plain language" ganz unten.
- Auf der Startseite fehlt der zweite Einstieg (Befund oder Symptom).

**Nachaufträge an A und B (über Chef, raus 05:10).** Ego-Graph: nach unten schieben, nicht einklappen, E2E bleibt (Entscheidung Hanno 05:10).

1. A · `DiseaseView.tsx`: Bei 375 px stehen „What you can do now" (Behandlung ja/nein plus Alternativen), Patientengruppen und Studien vor dem Graphen. Kriterium: In den ersten 2 Bildschirmhöhen (1.624 px) stehen die Behandlungsantwort und mindestens eine Patientengruppe.
2. A · `DiseaseView.tsx` / `components/next/*`: Nachbarn im einfachen Block höchstens 3, der Rest hinter „Show all N related diagnoses". Kriterium: Seitenhöhe bis zum Graphen bei 375 px ≤ 5.000 px.
3. A · Linktext „Why the mechanism call" → „How these two are linked". Kriterium: kein „mechanism call" mehr im sichtbaren Text (der E2E-Button „Why linked" bleibt).
4. A und B · „Share what you know" verlinkt `/share?d=<MONDO_id>` (`?disease=` geht auch), und `/share` füllt die Krankheit daraus vor. Kriterium: `/share?d=MONDO_0009499` zeigt „Krabbe disease" im ersten Schritt.
5. A · Patientengruppen: Auf der einfachen Ebene steht „checked against the organisation's website, <Datum>" statt des Level-Badges „inferred". Die 39 Orgs hat ein Agent geprüft, kein Mensch, deshalb nirgends „hand-checked" (Korrektur Hanno 05:10). Betrifft auch die vier Stellen in `DiseaseView.tsx` (Zeilen 172, 655, 656, 658). Das Badge bleibt im Evidence-Panel.
