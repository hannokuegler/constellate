# Design-Konzept · Constellate

Stand So 04.10.2026, ca. 01:45 (Wien). Schritt 1 von 2: nur Konzept, kein App-Code geändert. Entscheidung: Hanno. Ist-Stand-Screenshots in [design-shots/](design-shots/) (Benennung `before-<seite>-<breite>-<schema>.png`, 1280 und 375 px, hell und dunkel per `colorScheme`-Emulation, Build vom Branch `design`).

## 1. Ist-Stand in fünf Sätzen

1. Solide Basis: Tokens hell/dunkel, Fokusringe, 44-px-Tippflächen, kein horizontales Scrollen, **CLS 0,000** auf Start- und Krabbe-Seite (gemessen per PerformanceObserver in allen vier Varianten), kein Theme-Flash dank Inline-Skript.
2. **Farbe trägt mehr als Bedeutung** und verletzt damit die Brief-Regel „color carries meaning alone": fünf Knoten-Farbtöne plus drei Evidenz-Farbtöne plus Indigo als UI-Akzent. Zwei Werte sind sogar identisch doppelt belegt: `--lvl-inferred` = `--n-neighbour` (#8e44c4, „inferred" und „related disease" sehen gleich aus) und `--lvl-text` = `--n-pathway` (#2f6fb0). Amber steht zugleich für „this disease", „mechanism differs", „Honest gap" und Warnungen.
3. Die Startseite verschenkt den stärksten Satz: H1 ist das Wort „Constellate", „Your family is not the first." steht nur auf `/about`. Der Sternenhimmel (`.starfield`) besteht aus acht 1-px-Punkten und ist praktisch unsichtbar.
4. Der Graph ist inhaltlich stark (Linienstile, Gegenbeispiel-Kanten, Familienknoten), wirkt aber wie ein Netzwerkdiagramm, nicht wie ein Sternbild; die roten Gegenbeispiel-Kanten sind das lauteste Element der Seite.
5. Systemschrift überall: lesbar, aber ohne Wiedererkennung im Video.

### Auffälligkeiten (Bugs, Kontrast, Layout)

| # | Wo | Befund | Schwere |
|---|---|---|---|
| I1 | Graph hell | Zentrumsknoten `--n-center` #e0a100 auf Weiß: **2,27 : 1**, unter 3 : 1 für Grafikobjekte (WCAG 1.4.11) | P2 |
| I2 | Graph hell | `--n-gene` #0f8a78 auf Weiß 4,26 : 1 (als Grafik ok, als Text nicht) | P3 |
| I3 | Krabbe, Karte „Patient organisations" | Honest Gap sagt „Nearest related communities: None found with the current data", während MomentBar und Graph 13 verwandte Diagnosen zeigen. Ursache: `public/data/disease/MONDO_0009499.json` hat keinen `gap`-Block, also greift in `DiseaseView.tsx` (`CommunityBlock`) der Fallback-Zweig ohne `nearest`. Widerspruch im Herz-Screen des Demo-Videos; Fix entweder Pipeline (gap-Block exportieren) oder Fallback mit `file.neighbours` füllen | **P1 für die Story** |
| I4 | 375 px, Graph | Label „metachromatic leukodystrophy" links abgeschnitten („chromatic leu…"), genau der Hero-Nachbar | P2 |
| I5 | 375 px, MomentBar | Pill-Umschalter bricht um, zweiter Button hängt in einer großen ovalen Fläche (siehe `before-graph-375-dark.png`) | P2 |
| I6 | 375 px, Start | Platzhalter abgeschnitten („e.g. K"), Persona-Select im Header abgeschnitten („Just diagno…") | P3 |
| I7 | alle | Kein Favicon (404, im E2E bewusst ignoriert), kein OG-Bild: geteilte Links auf Discord/LinkedIn zeigen eine leere Karte | P2 |
| I8 | Header | Persona-Wahl an drei Stellen (Header-Select, Start-Karten, MomentBar). Für Nora ist eine genug; Header-Select auf Mobil verzichtbar | P3 |
| I9 | Graph | Gegenbeispiel-Knoten tragen amber gestrichelten Ring, die Kante ist rot: zwei Farben für eine Aussage | P3 |

Kontrast sonst im Ist-Stand gut: Text ink 16,2–17,7 : 1, ink-2 7,2–8,8 : 1, alle Evidenzfarben ≥ 5,2 : 1 hell und ≥ 6,2 : 1 dunkel.

## 2. Gemeinsame Regeln für alle drei Richtungen

Diese Regeln gelten unabhängig von der Richtung und lösen den Brief-Konflikt aus Punkt 2:

| Regel | Umsetzung |
|---|---|
| **Farbe = Evidenz, sonst nichts** | Nur vier bedeutungstragende Farbtöne: curated/observed (neutral, Tintenfarbe), text-mined (Blau), inferred (Violett), Gegenevidenz (Rot). Dazu genau ein warmes Licht für „diese Krankheit / du bist hier". |
| **Knotentyp = Form und Helligkeit, nicht Farbe** | Krankheit: gefüllter Lichtpunkt · Gen: hohler Ring · Phänotyp: kleiner, gedimmter Punkt · Familie: Punkt mit zwei feinen Ringen und Zahl · Gegenbeispiel: Punkt mit rotem gestricheltem Ring · Zentrum: warmes Licht mit Halo |
| **Evidenzstufe = Linienstil** (bleibt wie im Code) | observed/curated durchgezogen 1,4 px · text-mined gestrichelt [6,4] · inferred gepunktet [1,3.5] mit runden Enden · Gegenevidenz rot durchgezogen 2 px (statt 3 px) · zweiter Hop 0,8 px, 50 % Deckkraft. Legenden-Texte bleiben wörtlich (E2E prüft „text-mined (dashed)"). |
| **UI-Akzent wird neutral** | Primärbutton in Tinte (hell: dunkler Button, dunkel: heller Button), Links mit Unterstreichung statt Indigo. Fokusring als einzige Ausnahme (Amber oder Blau, ≥ 3 : 1). |
| **Honest Gap neutral** | gestrichelter Rahmen, Label in ink-2 fett, kein Amber, keine Warnfarbe: „a finding, not a failure" sieht auch so aus. |
| **Action Card ohne Farbpunkte** | „What transfers / What differs / Needs expert review" mit typografischen Markern (✓, ≠, ?) in Tinte statt Grün/Amber/Lila. |
| **Hero-Satz als H1** | „Your family is not the first." als H1, zweiter Satz als Unterzeile, Wortmarke „Constellate" darüber klein. Suche direkt darunter, ein Primär-CTA „Start with Krabbe disease". |
| **Schriften** | über `next/font` (selbst gehostet, kein Request an Google zur Laufzeit, `display: swap`, `adjustFontFallback` gegen Layout-Shift). Achtung: `next/font/google` lädt beim **Build** aus dem Netz. Vercel und der Mac haben Netz; falls die E2E-Umgebung offline baut, Ausweg `geist` (npm, OFL) bzw. `@fontsource/*` (npm, OFL). |
| **Canvas-Schrift** | Der Graph zeichnet Labels per `ctx.font`; dort die echte Familie aus `getComputedStyle(document.body).fontFamily` einsetzen, sonst fällt der Canvas auf die Systemschrift zurück. |

## 3. Drei Richtungen

### Richtung A · „Night sky, quiet"

**Moodboard in Worten:** Planetarium kurz bevor das Licht ausgeht. Tiefes Tintenblau, nicht Schwarz. Wenige warme Lichtpunkte, viel Leere. Keine Nebel, keine Galaxien, kein Sci-Fi. Haarlinien wie mit Silberstift. Ruhig wie eine Nachtschicht auf einer Station, in der jemand das Licht für dich angelassen hat. Die 2-Uhr-nachts-Mutter ist der Maßstab.

**Typo:** Fraunces (Display, Achse SOFT 50, opsz an, Gewicht 400–600) + Inter (UI, tabular nums). Beide OFL, beide in `next/font/google` verfügbar (geprüft in `font-data.json`). Fraunces mit SOFT wirkt warm und handgemacht, Inter trägt 12–13-px-Evidenztext sauber.

**Farb-Tokens und Kontrast** (dunkel ist das Hauptbild, hell ist der Tagmodus):

| Token | dunkel | hell |
|---|---|---|
| bg | #0B1020 | #F5F6FA |
| surface / surface-2 | #121831 / #1A2142 | #FFFFFF / #EEF0F5 |
| ink / ink-2 | #ECEEF6 / #A3AAC4 | #121629 / #4B526B |
| line | #262E52 | #DCDFE8 |
| accent (Button) | #ECEEF6 auf #0B1020 | #121629 auf #FFFFFF |
| center (warmes Licht) | #F5C46B | #9A5E0E |
| curated/observed | #D7DBEA | #3A4157 |
| text-mined | #7CB4FF | #1F64B8 |
| inferred | #B8A2FF | #6B4FD1 |
| contra / contra-soft | #FF7B7B / #2E1620 | #C2303B / #FBEAEB |
| Phänotyp-Punkt | #8D94B0 | #6E7590 |

| Prüfung (WCAG 2.x, Ziel) | dunkel | hell |
|---|---|---|
| ink auf bg / surface (4,5) | 16,34 / 15,10 | 16,58 / 17,91 |
| ink-2 auf bg / surface / surface-2 (4,5) | 8,21 / 7,58 / 6,79 | 7,15 / 7,73 / – |
| Button-Text auf Button (4,5) | 16,34 | 16,58 |
| center als Grafik auf Graph-Grund (3,0) | 11,71 | 5,27 |
| curated Linie (3,0) / als Text (4,5) | 13,71 / 12,67 | 10,13 / 10,13 |
| text-mined Linie / Text | 8,86 / 8,19 | 5,88 / 5,88 |
| inferred Linie / Text | 8,70 / 8,04 | 5,73 / 5,73 |
| contra Linie / Text | 7,55 / 6,97 | 5,56 / 5,56 |
| contra auf contra-soft (4,5) | 6,69 | 4,78 |
| Phänotyp-Punkt (3,0) | 6,31 | 4,56 |
| Fokusring Amber auf bg (3,0) | 11,71 | – |

Alle Paare bestehen AA.

**Graph-Stil:** Graph-Grund = bg (kein Kartenrahmen, der Himmel geht bis an den Rand). Krankheiten als warmweiße Punkte mit weichem Halo (zweiter Kreis, 12 % Deckkraft, kein `shadowBlur` wegen Performance), Zentrum Amber mit Halo-Ring. Linien 1,2–1,4 px, Evidenz wie in §2. Labels nur Zentrum, Gene, Familien, Hover.

**Startseite-Hero:** vollflächig dunkel, rechts ein Code-SVG-Sternbild (ca. 40 Punkte, 12 Linien), links H1 in Fraunces 48/56 px: „Your family is not the first." Darunter der zweite Satz in ink-2, die Suche, ein CTA. Momente-Karten unter dem Falz.

**Mikro-Interaktionen (max. 3):**
1. Sternbild zeichnet sich einmal (Linien per `stroke-dashoffset`, 1,2 s).
2. Graph „zündet": Knoten blenden vom Zentrum nach außen ein (Alpha-Rampe 400 ms im `nodeCanvasObject`).
3. Hover/aktive Kante: Linie hellt auf, beide Endpunkte bekommen Halo, solange das Edge-Panel offen ist.
Bei `prefers-reduced-motion: reduce` alles sofort im Endzustand (der Graph rechnet dann schon heute vorab, `warmupTicks 160`).

**Aufwand:** voll ca. 7 h (Tokens 0,5 · Schriften 0,5 · Graph 2 · Hero 1,5 · Komponenten-Durchgang Farbe 1,5 · Hellmodus nachziehen 0,5 · E2E/Screens 0,5). **Minimal (2 h):** nur Dark-Tokens + neutraler Akzent, Fraunces für H1/H2, Hero-Satz als H1 mit vorhandenem `.starfield` (Punkte größer), Graph nur Farben tauschen.

**Risiko:** mittel bis hoch. Lange Evidenz-Texte, Snippets und die Action Card lesen sich auf Dunkel schlechter, gedruckte/exportierte Proposals gehen ohnehin hell. Hellmodus wird zum Stiefkind. Im Video stark, im Alltag der Gruppenleiterin (Moment 2, tagsüber, Proposal schreiben) schwächer.

### Richtung B · „Paper atlas"

**Moodboard in Worten:** Ein alter Sternatlas und eine topografische Karte nebeneinander auf einem Holztisch. Elfenbeinpapier, Tusche, Haarlinien, gesperrte Kapitälchen für Regionen, Kursiv für Beschriftungen. Legende als Kartusche unten rechts. Maßstab, Gradnetz, nichts Glänzendes. Vertrauen durch Handwerk und Genauigkeit.

**Typo:** Source Serif 4 (Display und Überschriften, opsz an) + IBM Plex Sans (UI, Labels, gesperrte Kapitälchen) + optional IBM Plex Mono für Kanten-IDs (`e_3dbc42738b5a`). Alle OFL, alle in `next/font/google`.

**Farb-Tokens und Kontrast** (hell ist das Hauptbild, dunkel ist „Nachtatlas"):

| Token | hell (Papier) | dunkel (Nachtatlas) |
|---|---|---|
| bg | #F7F3EA | #15130F |
| surface / surface-2 | #FFFDF8 / #EFE9DC | #1D1A15 / #26221B |
| ink / ink-2 | #1D1B16 / #5A5447 | #EFE8DA / #B3AA97 |
| line | #DDD4C2 | #34302A |
| accent (Button) | #1D1B16 | #EFE8DA |
| center | #9A5B12 (Ocker) | #E3B25A |
| curated/observed | #2B2925 | #E2DACB |
| text-mined | #1E5FA8 (Kartenblau) | #79AEEB |
| inferred | #7244A8 | #BFA0F0 |
| contra / contra-soft | #B3261E / #F8E6E1 | #FF8A7A / #331A16 |
| Phänotyp-Punkt | #7A7262 | #958C7A |

| Prüfung (Ziel) | hell | dunkel |
|---|---|---|
| ink auf bg / surface (4,5) | 15,54 / 16,92 | 15,22 / 14,23 |
| ink-2 auf bg / surface / surface-2 (4,5) | 6,79 / 7,39 / 6,21 | 8,05 / 7,53 / – |
| center Grafik / Text | 5,33 / 5,33 | 8,90 / 8,90 |
| curated Linie / Text | 14,28 / 14,28 | 12,49 / 12,49 |
| text-mined Linie / Text | 6,34 / 6,34 | 7,49 / 7,49 |
| inferred Linie / Text | 6,65 / 6,65 | 7,85 / 7,85 |
| contra Linie / Text | 6,43 / 6,43 | 7,57 / 7,57 |
| contra auf contra-soft (4,5) | 5,42 | 7,05 |
| Phänotyp-Punkt (3,0) | 4,68 | 5,21 |
| Fokusring Kartenblau auf bg (3,0) | 5,82 | – |

Alle Paare bestehen AA.

**Graph-Stil:** Sternkarte auf Papier: Tuschepunkte, Gene als offene Kreise, feines Gradnetz (1 % Tinte) im Hintergrund, Labels in Plex Sans kursiv, Zentrum-Label in gesperrten Kapitälchen. Evidenz wie §2.

**Startseite-Hero:** Papier mit Gradnetz, oben gesperrt „CONSTELLATE · AN ATLAS OF RARE DISEASES", H1 Source Serif 48/56 px. Die Suche als „Index". Darunter eine Legenden-Kartusche mit den vier Linienstilen: lehrt die Evidenzsprache, bevor der Graph kommt.

**Mikro-Interaktionen:** 1. Kartusche-Linien zeichnen sich (Tusche-Strich, 0,8 s). 2. Graph-Kante beim Hover wird zur Doppellinie wie eine markierte Route. 3. Edge-Panel klappt wie ein Karteneinleger (bestehende Drawer-Animation, nur Schatten weicher). Reduced Motion: alles statisch.

**Aufwand:** voll ca. 7,5 h (Serif-Feinarbeit an Überschriften und Labels kostet extra). **Minimal (2 h):** Papier-Tokens, Source Serif für H1–H3, neutraler Akzent, Legenden-Kartusche auf der Startseite, Graph nur Farben.

**Risiko:** mittel. Höchstes Vertrauen, aber das Sternbild-Bild ist auf Papier schwächer (Punkte auf Hell lesen sich wie ein Streudiagramm), der Video-Moment bleibt weniger hängen. Wirkt eher „Archiv" als „Wärme in der Nacht". Dark-Variante muss als zweiter Atlas mitgepflegt werden.

### Richtung C · „Observatory: day page, night window" (eigene Idee, empfohlen)

**Idee:** Lesen im Tageslicht, Schauen in die Nacht. Alle Flächen, auf denen Nora Belege liest (Edge-Panel, Action Card, Honest Gap, Studien), sind ruhiges, warmes Tagpapier und folgen dem Systemschema. Der Graph und der Hero sind ein **Fenster in den Nachthimmel**: eine dunkle, abgerundete Fläche, immer dunkel, in beiden Schemata. Die Karte ist das Teleskop, der Rest ist das Logbuch. Auf der Startseite steht das Fenster unter dem Satz; auf der Krankheitsseite ist der Graph dasselbe Fenster, nur mit echten Daten. Im Video ist das ein durchgehendes Bild: der Himmel von der Startseite wird zu Krabbes Nachbarschaft.

**Moodboard in Worten:** Sternwarte am Abend. Holz und Papier am Schreibtisch, durch die Kuppel ein Ausschnitt Nachthimmel. Warmes Grau statt Weiß, Tintenblau statt Schwarz. Ein einziges warmes Licht: „hier bist du". Kein Glanz, keine Verläufe außer dem Halo.

**Typo:** Instrument Serif (nur Display: H1-Satz, Zentrum-Label, Zahlen in der MomentBar, Kursiv für „not") + Geist (UI und Fließtext) + Geist Mono (Kanten-IDs, Formeln). OFL, alle in `next/font/google`; offline-Ausweg `geist` (npm) und `@fontsource/instrument-serif`. Instrument Serif gibt dem einen Satz Wärme, Geist hält 12–13-px-Evidenztext sachlich.

**Farb-Tokens:** Seite folgt dem Schema, das Fenster hat einen eigenen Token-Satz (CSS-Klasse `.night`, die dieselben Variablennamen überschreibt).

| Token | Seite hell | Seite dunkel | Fenster (beide) |
|---|---|---|---|
| bg | #F6F5F2 | #0E1122 | #0B1020 (bei dunkler Seite #080B18 + Rahmen #262E52) |
| surface / surface-2 | #FFFFFF / #EEECE6 | #151A30 / #1C2240 | – |
| ink / ink-2 | #15182A / #4C5168 | #ECEEF6 / #A3AAC4 | #ECEEF6 / #A3AAC4 |
| line | #E4E2DC | #262B45 | #262E52 |
| accent (Button) | #15182A | #ECEEF6 | – |
| center | #9A5E0E (nur Badge) | #F5C46B | #F5C46B |
| curated/observed | #3A4157 | #D7DBEA | #D7DBEA |
| text-mined | #1F64B8 | #7CB4FF | #7CB4FF |
| inferred | #6B4FD1 | #B8A2FF | #B8A2FF |
| contra | #C2303B | #FF7B7B | #FF7B7B |
| Phänotyp-Punkt | #6E7590 | #8D94B0 | #8D94B0 |

| Prüfung (Ziel) | Seite hell | Seite dunkel | Fenster |
|---|---|---|---|
| ink auf bg / surface (4,5) | 16,11 / 17,56 | 16,16 / 14,83 | 16,34 |
| ink-2 auf bg / surface (4,5) | 7,18 / 7,82 | 8,11 / 7,45 | 8,21 |
| Button-Text auf Button (4,5) | 16,11 | 16,16 | – |
| center Grafik (3,0) / Badge-Text (4,5) | – / 5,27 | 12,13 / 10,63 | 11,71 |
| curated Linie (3,0) / Badge-Text (4,5) | – / 10,13 | 14,20 / 12,44 | 13,71 |
| text-mined Linie / Badge-Text | – / 5,88 | 9,17 / 8,04 | 8,86 |
| inferred Linie / Badge-Text | – / 5,73 | 9,01 / 7,89 | 8,70 |
| contra Linie / Badge-Text | – / 5,56 | 7,81 / 6,85 | 7,55 |
| Phänotyp-Punkt (3,0) | 4,56 (Badge) | 6,53 | 6,31 |
| Fenster gegen dunkle Seite | – | 1,05: Abgrenzung kommt vom 1-px-Rahmen #262E52, nicht von der Fläche | – |

Wichtig: Die Fensterfarben (helle Linien) dürfen auf der hellen Seite **nie** als Text stehen (curated #D7DBEA auf Weiß wären 1,38 : 1). Deshalb trägt die helle Seite eigene Badge-Werte; die Tabelle oben ist so gerechnet. Alle verwendeten Paare bestehen AA.

**Graph-Stil:** wie A im Fenster (warme Lichtpunkte, Halo nur am Zentrum und am Hover, Gene als Ringe, Phänotypen als Staub). Die Legende sitzt im Fenster unten in ink-2 (8,21 : 1). Technisch: `.night` auf der `figure` von EgoGraph; `ForceGraphClient.readPalette()` liest heute von `document.documentElement` und muss stattdessen vom Wrapper-Element lesen (eine Zeile plus Ref), sonst malt der Canvas die Seitenfarben.

**Startseite-Hero:** Wortmarke klein, H1 in Instrument Serif 44/56 px „Your family is *not* the first.", Unterzeile „What you need may already exist under another disease's name.", Suche, CTA. Darunter das Nachtfenster (Höhe 280 px Desktop, 200 px Mobil) mit einem Code-SVG-Sternbild und einer Legendenzeile im Fenster: „── observed / curated · ‒ ‒ text-mined · ··· inferred · ── counter-evidence". Die Evidenzsprache ist damit in den ersten 3 Sekunden sichtbar. Momente-Karten und „How it works" bleiben, nur ruhiger (keine Indigo-Nummern).

**Mikro-Interaktionen (max. 3):**
1. **Sternbild zeichnet sich** im Hero-Fenster einmal beim Laden (Linien `stroke-dashoffset`, 1,2 s, danach still).
2. **Graph zündet** vom Zentrum nach außen (Alpha-Rampe 400 ms).
3. **Gelesene Kante bleibt hell**: Kante unter dem offenen Edge-Panel bleibt markiert, beide Endpunkte mit Halo. Verbindet Panel und Bild, stärkt „Explain every edge".
Bei `prefers-reduced-motion: reduce`: 1 und 2 sofort im Endzustand, 3 bleibt (keine Bewegung, nur Zustand).

**Aufwand:** voll ca. 6 h (Tokens und `.night`-Scope 0,75 · Schriften 0,5 · Hero mit SVG 1 · Graph-Knotenformen und Halo 1,25 · Komponenten-Durchgang Farbe 1 · Mikro-Interaktionen 0,75 · E2E/Screens 0,75). **Minimal (2 bis 2,5 h):** neue Tokens hell/dunkel mit neutralem Akzent, `.night`-Fenster für Graph und Hero (inkl. `readPalette`-Fix), Instrument Serif nur für den H1-Satz, Geist global, Hero-SVG statisch mit Legendenzeile, Graph-Knoten Formen statt Farben. Ohne Mikro-Interaktionen, ohne Action-Card-Marker.

**Risiko:** niedrig bis mittel. Zwei Token-Scopes sind etwas mehr Pflege, dafür bleibt Lesetext immer optimal. E2E prüft Rollen und Texte, nicht Farben; die Legenden-Texte bleiben wörtlich gleich. Einziges technisches Risiko ist der Palette-Read im Canvas (klein, sofort sichtbar, wenn falsch).

### Vergleich

| | A Night sky | B Paper atlas | C Observatory |
|---|---|---|---|
| Wärme in 3 s | hoch | mittel | hoch |
| Vertrauen in 3 s | mittel | hoch | hoch |
| Evidenz-Lesbarkeit | mittel (Dunkel) | hoch | hoch |
| Video-Erinnerungswert | hoch | mittel | hoch (ein Bild von Start bis Graph) |
| Aufwand voll / minimal | 7 h / 2 h | 7,5 h / 2 h | 6 h / 2–2,5 h |
| Risiko | mittel–hoch | mittel | niedrig–mittel |

## 4. Werkzeuge: Higgsfield, Motion, Code

### Grundsatz

UI bleibt Code (Tailwind). Generierte Bilder und Clips enthalten keine Schrift mit Fakten, keine Zahlen, keine medizinischen Bilder, keine Personen.

### Kann Code die generierten Assets ersetzen? Ehrliche Bewertung

| Asset | Code-Variante | Aufwand | Risiko | Lizenz | Urteil |
|---|---|---|---|---|---|
| Hero-Hintergrund | Inline-SVG-Sternbild (ca. 3 KB), Farben aus Tokens, scharf auf jeder Pixeldichte, Theme-fähig | 45 min | niedrig | eindeutig (eigener Code, MIT mit dem Repo) | **Code gewinnt.** Ein Bild kann die Evidenz-Linienstile nicht exakt zeigen und reagiert nicht auf Hell/Dunkel |
| OG-Bild 1200×630 | `app/opengraph-image.tsx` mit `next/og` (`ImageResponse`), Sternbild als SVG-Elemente, Satz und Wortmarke als Text | 30 min | niedrig (Font für `next/og` als ArrayBuffer laden, sonst Fallback-Schrift) | eindeutig | **Code gewinnt.** Kein Asset im öffentlichen Repo mit unklarer Herkunft |
| Favicon | `app/icon.svg` (4 Punkte, 3 Linien, Amber-Zentrum) + `app/apple-icon.tsx` per `next/og` 180×180 | 15 min | niedrig | eindeutig | **Code gewinnt.** Generierte Bilder taugen bei 16 px nicht |
| Hero-Loop-Video | Canvas/SVG mit langsamem Drift wäre möglich, kostet aber CPU auf alten Handys | 1 h | mittel | eindeutig | **Weglassen.** Ruhe ist das Konzept; ein Loop lenkt vom Satz und der Suche ab und verschlechtert LCP |
| Intro-Bumper, Übergänge, Outro | nicht sinnvoll in Code | – | – | – | Motion, aber erst nach der Abgabe (siehe unten) |

Lizenz-Hinweis Higgsfield: Nutzungsrechte generierter Bilder hängen vom Plan und den AGB ab (nicht geprüft). Das Repo wird um 11:00 öffentlich; ein generiertes Bild mit ungeklärten Rechten im Repo ist ein vermeidbares Risiko. Code-Assets haben dieses Problem nicht.

### Higgsfield: wofür es taugt

Nur für Material außerhalb des Repos und außerhalb der Pflichtvideos: LinkedIn-/Discord-Teaser-Standbild nach der Abgabe, Folienhintergrund für den Pitch am 10.10. (falls Top 2). Falls Hanno trotzdem ein generiertes Hero- oder OG-Bild will, hier die fertigen Prompts:

| Asset | Prompt | Format | Ziel | Einsatzort | Fallback ohne Asset |
|---|---|---|---|---|---|
| H1 Hero-Hintergrund | „Minimal night sky, deep ink-blue background (#0B1020), sparse field of tiny warm-white and pale-gold points of light of different brightness, a few points joined by hair-thin straight lines forming abstract constellations, the left 40 percent nearly empty for text, flat, calm, high contrast, no nebula, no galaxy, no clouds, no lens flare, no glow bloom, no text, no letters, no numbers, no symbols, no people, no faces, no medical imagery." | 2400×1350, 16:9 (Mobil: 1080×1350 Ausschnitt per `object-position`) | AVIF q≈50 < 120 KB, WebP-Fallback < 200 KB | Start-Hero hinter Satz und Suche | Code-SVG (empfohlen) bzw. vorhandenes `.starfield` |
| H2 OG-Hintergrund | wie H1, plus „composition centred, empty band across the middle third for a headline" | 1200×630, 1,91:1 | PNG oder JPG < 300 KB (Crawler nehmen kein AVIF) | `opengraph-image`, Text in Code darübergelegt | `next/og` komplett in Code (empfohlen) |
| H3 Favicon-Motiv | nicht empfohlen; falls doch: „Four points of light joined by three thin lines on deep ink blue, one point warm amber, geometric, flat vector style, no text" | 512×512, 1:1 | PNG < 20 KB, danach von Hand als SVG nachzeichnen | `app/icon.svg` | Code-SVG (empfohlen) |
| H4 Hero-Loop | „Same night sky as reference image, points of light drift extremely slowly, lines fade in and out once, seamless 6 second loop, no camera movement, no flicker, no text" | 1920×1080, 6 s, 24 fps | H.264 und WebM VP9 < 1,5 MB, Poster-Frame AVIF < 80 KB; `autoplay muted loop playsinline preload="none"`; bei `prefers-reduced-motion` nur Poster | nicht empfohlen | Code-SVG statisch |

### Motion: wofür es taugt, und der Konflikt

`pitch/README.md` (Entscheidung 7), `pitch/MOTION-PROMPTS.md`, `docs/RESOURCES.md` Regel 9 und `docs/VIDEOS.md` („keine Musik, keine Effekte") sagen übereinstimmend: Motion **nicht** in den vier Pflichtvideos, nur nach der Abgabe (Pitch-Opener 10.10., Teaser). Der Auftrag für dieses Konzept schlägt Motion für Intro-Bumper, Übergänge und Outro vor. Das widerspricht sich.

**Empfehlung: Die bestehende Regel gilt.** Gründe: Die Jury muss die echte App mit Live-URL sehen; Motion recherchiert selbst und kann unbelegte Aussagen einbauen; ein Bumper vor dem Demo-Video kostet Sekunden von zwei Minuten; und Hanno hat zwischen 12:00 und 14:30 keine freie Minute. Vor 15:00 also keine Motion-Credits und keine Motion-Zeit. Nach der Abgabe: Prompts 1, 5 und 6 aus `MOTION-PROMPTS.md` mit einem an Richtung C angepassten Stil-Block:

```
Style: "low ink, high signal". Two worlds: a calm warm-grey day page (near #F6F5F2) with a rounded dark window
(near #0B1020) in which the night sky lives. Inside the window: warm-white points of light, one warm amber point
(#F5C46B) that marks "you are here", hair-thin pale lines between points. Generous whitespace.
Typography: an elegant high-contrast serif for the one headline (similar to Instrument Serif), a clean neutral
sans-serif for anything else, never more than two lines on screen.
Motion: slow, continuous, no cuts faster than 2 seconds, no camera shake, no lens flares, no particles.
Sound: none. Aspect ratio 16:9, 1920x1080. No logo other than the word "Constellate" as plain text.
Forbidden: any disease name, gene name, number, date, percentage, chart, hospital, child, face, stock footage,
medical imagery, any text other than the lines given verbatim, voice-over.
```

Formate nach der Abgabe: 16:9 1920×1080 für Pitch, 1:1 1080×1080 für LinkedIn, MP4 H.264, stumm, < 8 MB je Clip, nicht ins Repo (Team-Drive), Offenlegung „Opening animation generated with Motion".

## 5. Empfehlung

**Richtung C „Observatory", Minimal-Variante (2 bis 2,5 h), plus die drei Code-Assets (Hero-SVG, OG-Bild per `next/og`, Favicon), zusammen ca. 3 h. Keine generierten Assets vor der Abgabe, Motion erst danach.** Wenn danach noch eine Stunde Luft ist: Mikro-Interaktion 3 (gelesene Kante bleibt hell) vor 1 und 2, weil sie Evidenz zeigt und nicht nur schmückt.

Begründung aus Jury-Sicht:
- **Ambition and product craft:** Ein durchgehendes Bild (Hero-Fenster wird zum Graph) bleibt im Demo-Video hängen, ohne einen einzigen generierten Pixel.
- **Evidence integrity:** Farbe heißt nur noch Evidenz, die Linienstile stehen schon im Hero. Damit erfüllen wir die Brief-Zeile „color carries meaning alone" wörtlich; heute verletzen wir sie (gleiche Hex-Werte für „inferred" und „related disease").
- **Graph quality:** Knotentypen über Form statt Farbe machen den Graph lesbarer und lassen die roten Gegenbeispiele als einzige laute Farbe stehen, genau dort, wo das Tool „Nein" sagt.
- **Patient progress:** Lesetext (Edge-Panel, Action Card, Export) bleibt hell und druckbar; die Proposal-Seite sieht aus wie ein Dokument, das man verschicken kann.

Begründung aus Nora-Sicht:
- **Moment 1, 2 Uhr nachts:** Die Seite folgt dem Systemschema, also dunkel; der erste Satz, den sie sieht, sagt ihr, dass sie nicht die Erste ist. Ein warmes Licht markiert „hier bist du".
- **Moment 2, Gruppenleitung tagsüber:** Belege lesen, Proposal exportieren, auf Papier ruhig und klar.

Warum nicht A: im Video gleich stark, aber Evidenz-Lesbarkeit und Moment 2 leiden, und der Hellmodus wird Nebensache. Warum nicht B: höchstes Vertrauen, aber das Sternbild verliert seine Wirkung auf Papier, und der Erinnerungswert im Video ist am kleinsten.

**Zeitplan-Vorschlag:** Umsetzung im Branch `design`, Merge erst nach grünem E2E (1280, 375, Dark) und Screenshot-Abgleich, spätestens 09:30; Puffer bis 10:30. Der 06:00-Gate (Hero-Pfad live) hat Vorrang; Design-Merge nie davor, wenn er ihn gefährdet. Unabhängig von der Richtung zuerst I3 (Honest Gap widerspricht den 13 Nachbarn) klären, weil er im Herz-Screen des Demo-Videos steht.

## 6. Offene Fragen an Hanno

1. Richtung C freigeben, oder A/B? Minimal oder voll?
2. H1 der Startseite wird „Your family is not the first." statt „Constellate": einverstanden? (Demo-Skript und Walkthrough zeigen die Startseite.)
3. Honest Gap I3: Fix in der Pipeline (gap-Block für Krabbe exportieren) oder im App-Fallback (Nachbarn aus `file.neighbours` zeigen)? Kein Design-Thema, aber im Demo-Video sichtbar.
4. Header-Persona-Select auf Mobil ausblenden (I8)?
5. Schriften über `next/font/google` (Build braucht Netz) oder lokal über npm-Pakete (`geist`, `@fontsource/instrument-serif`)?
