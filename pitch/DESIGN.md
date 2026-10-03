# DESIGN · Constellate v2 „Deep Sky"

Stand So 04.10.2026, 02:10 (Wien). Verbindlich für alle Design-Agents auf `design-v2`. Grundlage: Apple HIG (Skill `/design`, `HIG-web.md`), Fable-Richtungen A/B/C, Konkurrenz Rare Atlas (nur lokal angesehen, nie ins Repo). Entscheidung Hanno 02:00: 3D ja, `three` 0.186 freigegeben.

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
