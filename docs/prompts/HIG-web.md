# Apple HIG als Web-Referenz (destilliert)

Stand: 30.09.2026 · Quelle: developer.apple.com/design/human-interface-guidelines (Details je Abschnitt).
Eigene Worte, Zahlen wie in den HIG. **1 pt = 1 CSS-px** (Web hat kein eigenes pt). HIG meint native Apps: was nicht 1:1 aufs Web passt, steht als „Web-Übersetzung" — Übersetzungen sind Empfehlung, keine Apple-Aussage.
Nicht in den HIG (also hier bewusst NICHT behauptet): Animationsdauern in ms, Rand-/Abstandsraster in pt für iOS, konkrete Safe-Area-Werte. Diese Werte kommen aus `design/SKILL.md`, nicht von hier.

## 1. Drei Grundsätze
Hinweis: „Hierarchie / Harmonie / Konsistenz" stammt aus Apples Design-Vorträgen zum aktuellen Designsystem (Liquid Glass), nicht wörtlich aus den gelesenen HIG-Seiten; inhaltlich decken es Layout, Materials, Branding und Color ab.
- **Hierarchie:** Steuerung und Inhalt sind getrennte Ebenen; das Wichtigste steht oben/vorn (Lesereihenfolge), der Rest tritt zurück (Layout, Materials). Web: pro Screen ein Fokus, eine Primäraktion, Ebenen über Größe/Gewicht/Farbe/Abstand — nicht über Deko.
- **Harmonie:** Form, Farbe und Bewegung passen zu Gerät und Inhalt; Elemente sitzen konzentrisch (Radien passen zum Container), Farbe kommt sparsam. Web: ein Token-System (Radien, Farben, Abstände), Marke wandert in den Inhalt statt in die Bedienelemente.
- **Konsistenz:** Gleiche Dinge sehen gleich aus und verhalten sich gleich; bekannte Muster (Zurück, Tabs, Sheets) statt Eigenbau; Layout passt sich dem verfügbaren Platz an, nicht dem Gerätetyp. Web: Container-/Viewport-Breite als Maßstab, Standard-HTML-Elemente vor Custom-Widgets.

## 2. Harte Zahlen
| Größe | HIG-Wert | Web-Umsetzung | Messen (Playwright `page.evaluate`) |
|---|---|---|---|
| Tippfläche Standard | **44×44 pt** (Buttons: Hit-Region ≥ 44×44) | `min-block-size:44px; min-inline-size:44px` (Icon-Buttons: Padding statt Größe des Icons) | `[...document.querySelectorAll('a,button,input,select,[role=button],[tabindex]')].map(e=>({e,r:e.getBoundingClientRect()})).filter(x=>x.r.width&&(x.r.width<44\|\|x.r.height<44))` |
| Tippfläche absolutes Minimum | **28×28 pt** (iOS) | nur für dichte Desktop-Tabellen; auf Touch nie darunter | wie oben, Schwelle 28 |
| Abstand zwischen Controls | ca. **12 pt** um Elemente mit Rahmen/Hintergrund, ca. **24 pt** um rahmenlose (Icon/Text) | `gap:12px` bzw. `gap:24px` | Nachbar-Rechtecke: Lücke = `b.left-a.right` bzw. `b.top-a.bottom` |
| Schrift Standard (iOS) | **17 pt** Body | `font-size:1.0625rem` (17px) bei 16px-Root, oder 16px als Web-Standard | `getComputedStyle(el).fontSize` für Textknoten |
| Schrift Minimum (iOS) | **11 pt** (Caption 2) | nie unter 11px; Lesetext ≥ 16px (auch weil iOS Safari unter 16px in Felder zoomt — Web-Fakt) | alle Textknoten: `parseFloat(fs)<11` = Fehler, `<16` bei Fließtext = Warnung |
| Text-Stufen iOS (Large) | Large Title 34/41 · Title1 28/34 · Title2 22/28 · Title3 20/25 · Headline 17 semibold/22 · Body 17/22 · Callout 16/21 · Subhead 15/20 · Footnote 13/18 · Caption1 12/16 · Caption2 11/13 (Größe/Zeilenhöhe) | als Typo-Leiter in `--t-*`-Tokens; `line-height` ≈ 1.2–1.3 | Anzahl verschiedener Schriftgrößen: `new Set(...fontSize).size` (Ziel ≤ 7–8) |
| Schriftgewicht | Ultralight/Thin/Light meiden; Regular, Medium, Semibold, Bold | `font-weight:400–700` | `getComputedStyle(el).fontWeight<400` = Fehler |
| Zeilenabstand | ab 3 Zeilen keinen engen Zeilenabstand; breite Spalten → mehr | `line-height:1.4–1.6` für Fließtext | `parseFloat(lh)/parseFloat(fs)` |
| Textvergrößerung | mind. **200 %** ermöglichen | rem/em, keine festen Höhen, Reflow statt Abschneiden | `page.evaluate("document.documentElement.style.fontSize='200%'")`, dann `document.documentElement.scrollWidth<=innerWidth` und keine überlaufenden Boxen |
| Kontrast Text | bis 17 pt: **4,5:1**; ab 18 pt: **3:1**; fett: **3:1** (WCAG AA) | Tokens vorab rechnen | WCAG-Formel (unten) über Vorder-/Hintergrund |
| Kontrast Dark Mode | mind. **4,5:1**, für kleinen Text und eigene Farben **7:1** anstreben | eigene Dark-Token-Werte, nie „invertieren" | Formel im Dark-Kontext (`colorScheme:'dark'`) |
| Klar-Glas-Abdunklung | heller Untergrund unter „clear glass": **35 %** dunkle Schicht | `background:rgb(0 0 0/.35)` hinter Text auf Foto | Kontrast Text gegen gemessenen Bildpunkt |
| Modal-/Alert-Buttons | max. **3** Buttons in einem Alert | — | Anzahl `dialog button` |
| Prominente Buttons | **1–2** je Ansicht | eine Klasse `.primary` je Screen | `querySelectorAll('.primary,.btn-primary').length` |
| Toolbar-/Fenstertitel | unter **15 Zeichen** | kurze Header-Titel | `textContent.length` |
| Sidebar-Hierarchie | max. **2 Ebenen** | Navigation flach halten | Verschachtelungstiefe `nav ul ul ul` = 0 |
| Bildauflösung | @2x + @3x (iOS) | `srcset="a.jpg 1x, a@2x.jpg 2x, a@3x.jpg 3x"`, Fotos JPEG/HEIC(→WebP/AVIF), flache Grafiken SVG | `img.naturalWidth >= clientWidth*devicePixelRatio` |
| Safe Area | Inhalt bleibt aus Notch/Home-Indikator/Leisten | `<meta viewport-fit=cover>` + `padding:env(safe-area-inset-*)` | Emuliertes iPhone (Playwright `devices['iPhone 15']`): Elemente am Rand prüfen, `getComputedStyle(body).paddingBottom` |
| Animationsdauer | **HIG nennt keine Zahl**: kurz und präzise, abbrechbar, nicht bei häufigen Interaktionen | Web-Faustregel (nicht HIG): Feedback 100–200 ms, Übergänge ≤ 300–400 ms | `document.getAnimations().map(a=>a.effect.getTiming().duration)` |

**WCAG-Kontrast (JS):** `L=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4}; lum=(r,g,b)=>.2126*L(r)+.7152*L(g)+.0722*L(b); ratio=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05)` — Farben aus `getComputedStyle(el).color` und dem ersten Vorfahren mit nicht-transparentem `backgroundColor` (Alpha vorher mischen). Text über Bild/Muster: siehe 4.

## 3. Themen: Tu / Lass / Prüffrage
Quellen je Thema am Ende jedes Blocks (Basis `https://developer.apple.com/design/human-interface-guidelines/`).

### Farbe (color)
- **Tu:** Farbe hat eine feste Bedeutung (Link/Interaktiv, Erfolg, Fehler) und wird nur dafür benutzt. **Lass:** dieselbe Farbe für interaktiv und dekorativen Text.
- **Tu:** Farbe nie als einziger Informationsträger — Icon, Text oder Form dazu (Fehler = Rot + Symbol + Text). **Lass:** Rot/Grün- oder Blau/Orange-Paarungen allein.
- **Tu:** jede Farbe in Hell, Dunkel und erhöhtem Kontrast prüfen; auch bei Einmodus-Seiten beide Varianten definieren. **Lass:** harte Hex-Werte im Code verstreuen — semantische Tokens (`--fg`, `--bg-elevated`, `--accent`).
- **Tu:** Farbe bei Sonne und Dunkelheit testen (helles Umfeld dunkelt Farben ab). **Lass:** Zurückhaltung vergessen: kulturelle Farbbedeutungen bedenken.
- Prüffrage: *Wäre die Seite in Graustufen noch bedienbar?* (`filter:grayscale(1)` per Screenshot vergleichen) · `/color`

### Typografie (typography)
- **Tu:** wenige Schriften (Marken-Schrift für Überschriften, System-/Lesefont für Fließtext und Kleintext). **Lass:** mehr als 2 Familien.
- **Tu:** Hierarchie aus Größe + Gewicht + Farbe; Gewichte Regular bis Bold. **Lass:** Thin/Light, besonders klein.
- **Tu:** rem-basierte Größen, Layout reflowt bei 200 %. **Lass:** feste Höhen/px-Container um Text.
- **Tu:** bei Vergrößerung wichtige Inhalte mitwachsen lassen, Beschriftungen von Chrome dürfen klein bleiben. **Lass:** nur Überschriften skalieren.
- Prüffrage: *Kleinste Schrift ≥ 11 px, Fließtext ≥ 16 px, ≤ 8 verschiedene Größen?* · `/typography`

### Layout (layout)
- **Tu:** Wichtigstes oben und am Zeilenanfang; Ausrichtung und Einrückung erzeugen Zugehörigkeit. **Lass:** zufällige Versätze.
- **Tu:** Gruppieren über Leerraum, Container oder Trennlinie; Progressive Disclosure (Menüs, Aufklappen) gegen Überladung. **Lass:** alles gleichzeitig zeigen.
- **Tu:** Layout nach verfügbarer Breite (Container Queries/Breakpoints), nie nach Gerätetyp oder Ausrichtung; Funktion bleibt gleich, nur die sichtbare Menge ändert sich. **Lass:** Funktionen auf schmalen Screens weglassen.
- **Tu:** Safe Areas respektieren; Hintergrund darf unter Leisten laufen, Inhalt nicht. **Lass:** Controls am Rand hinter Home-Indikator/Notch.
- **Tu:** Steuerung visuell vom Inhalt trennen (Kopf-/Fußleiste als eigene Ebene). **Lass:** deckende Farbflächen unter jedem Control.
- Prüffrage: *Bei 320, 390, 768, 1280 px: nichts abgeschnitten, kein horizontales Scrollen, Safe Areas frei?* · `/layout`

### Bewegung (motion)
- **Tu:** Bewegung mit Zweck (Zusammenhang, Zustandswechsel), kurz und präzise. **Lass:** Animation als Dekoration bei jeder Interaktion.
- **Tu:** `prefers-reduced-motion` respektieren: Auto-/Wiederholanimationen, Zoom, Parallax, Blur-Übergänge und Tiefen-Wechsel raus; Überblenden statt Wegschieben. **Lass:** Information nur per Bewegung vermitteln.
- **Tu:** abbrechbar (kein Warten auf Ende), Bewegung folgt der Geste. **Lass:** Eingaben während Animation blockieren.
- **Tu:** Richtung logisch (kommt von unten → geht nach unten). **Lass:** widersprüchliche Ein-/Ausblend-Richtungen.
- Prüffrage: *Mit `reduced_motion='reduce'` läuft keine Endlos-/Scroll-Animation mehr?* (`page.emulate_media(reduced_motion='reduce')`; `document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity)` leer) · `/motion`, `/accessibility`

### Dark Mode (dark-mode)
- **Tu:** auf `prefers-color-scheme` folgen (Auto), beide Modi gleich gut. **Lass:** eigene App-Einstellung als Ersatz — höchstens Zusatz, der System folgt (HIG rät von app-eigenem Schalter ab).
- **Tu:** Dunkel = gedämpfte Flächen + hellere Vordergründe, nicht bloße Inversion; gestapelte Ebenen (Sheet, Popover) etwas heller als Basis. **Lass:** reines Schwarz überall und grelles Weiß auf Schwarz.
- **Tu:** ≥ 4,5:1, für kleine Schrift/eigene Farben 7:1; weiße Bildhintergründe leicht abdunkeln. **Lass:** helle Kartenbilder, die leuchten.
- **Tu:** Icons/Logos mit Dunkel-Variante (Kontur nachziehen). **Lass:** dunkle Logos auf dunklem Grund.
- Prüffrage: *Alle Kontraste im Dark-Modus (`color_scheme='dark'`) ≥ 4,5:1?* · `/dark-mode`

### Barrierefreiheit (accessibility)
- **Tu:** Steuerelemente ≥ 44×44 px mit Luft (12/24 px); nie unter 28. **Lass:** dichte Icon-Leisten am Handy.
- **Tu:** Tastatur reicht für alles (Fokus sichtbar, logische Tab-Reihenfolge, Esc schließt). **Lass:** `outline:none` ohne Ersatz.
- **Tu:** Alternativen zu Gesten (Wischen → auch Button). **Lass:** Komplexe Mehrfinger-Gesten.
- **Tu:** keine Zeitfallen (Auto-Schließen), kein Autoplay ohne Steuerung; Untertitel/Transkript für Medien. **Lass:** blinkende/schnelle Effekte.
- **Tu:** Elemente für Screenreader beschriften (Accessible Name, ARIA nur wo natives HTML fehlt). **Lass:** Icon-Buttons ohne Name.
- Prüffrage: *Axe/Lighthouse ohne kritische Funde, alles per Tab erreichbar, Zoom 200 % ok?* · `/accessibility`

### Schreiben / Microcopy (writing, inclusion)
- **Tu:** Aktiv, Verb im Button („Speichern", „In den Warenkorb"). **Lass:** kokette Labels („Los geht's!") und „Hier klicken".
- **Tu:** Fehler nah am Feld, ohne Schuldzuweisung, mit Lösung („Mindestens 8 Zeichen"). **Lass:** „Ungültig", „Oops!", „Wir haben ein Problem".
- **Tu:** Leerzustände nennen den nächsten Schritt (Button/Link). **Lass:** leere Flächen ohne Handlungsangebot.
- **Tu:** einheitliche Groß-/Kleinschreibung je Elementtyp und einheitliche Flow-Wörter (Weiter/Fertig). **Lass:** Mischformen.
- **Tu:** „du/dein" sparsam, „wir" nur für die eigene Firma; einfache, übersetzbare Sprache, Fachwörter erklären, geschlechtsneutral wo möglich. **Lass:** Jargon, Insider-Humor, kulturspezifische Redewendungen.
- **Tu:** „tippen" auf Touch, „klicken" nur mit Maus. **Lass:** falsches Gerätewort.
- Prüffrage: *Beginnt jeder Button mit einem Verb? Steht jeder Fehler beim Feld und sagt, was zu tun ist?* · `/writing`, `/inclusion`

### Bilder & Icons (images, icons)
- **Tu:** Fotos als JPEG/WebP/AVIF, flache Grafik/Icons als SVG, in 2×/3× ausliefern; Farbprofil (sRGB/P3) bewusst. **Lass:** Pixel-Icons in Standardgröße hochskalieren.
- **Tu:** Icons einfach, gleiche Strichstärke/Detailgrad, Gewicht passend zum Text daneben, optisch (nicht geometrisch) zentriert. **Lass:** Icon-Mischmasch aus mehreren Sets.
- **Tu:** bekannte Symbole für bekannte Aktionen (Teilen, Suche). **Lass:** neue Bedeutungen für Standardsymbole; kryptische Icons ohne Label.
- **Tu:** wichtige Icons wachsen mit der Textgröße. **Lass:** Icons als einzige Infoquelle.
- Prüffrage: *Alle `img` mit `alt`, scharf bei 2×/3× (`naturalWidth ≥ Anzeige×DPR`)?* · `/images`, `/icons`

### Materialien (materials)
- **Tu:** Blur/Glas nur für die Steuerungsebene (Leiste, Sheet, Popover), sparsam. **Lass:** Glas im Inhaltsbereich und auf jedem Element.
- **Tu:** bei viel Text dichtere Materialien; dünne nur, wenn Kontext sichtbar bleiben soll. **Lass:** Lesetext direkt auf durchscheinendem Foto.
- **Tu:** Fallback bei `prefers-reduced-transparency`/`prefers-contrast` (deckend). **Lass:** Lesbarkeit von Blur abhängig machen.
- Prüffrage: *Text auf Glas ≥ 4,5:1 im schlechtesten Hintergrundpunkt?* · `/materials`

### Navigation (tab-bars, sidebars, toolbars)
- **Tu:** Tab-Leiste nur zum Navigieren, nicht für Aktionen; immer sichtbar, Labels aus einem Wort. **Lass:** Tabs ausblenden/deaktivieren oder „Mehr"-Überlauf.
- **Tu:** Wenige Tabs; bei komplexer Struktur Sidebar, max. 2 Ebenen. **Lass:** tiefe Bäume in der Seitenleiste.
- **Tu:** Standard-Zurück und -Schließen; Titel kurz (< 15 Zeichen) und nicht der App-Name. **Lass:** Eigene Zurück-Metaphern, Logo als Titel.
- **Tu:** wenige Toolbar-Elemente, Rest ins „Mehr"-Menü. **Lass:** Überfüllung, getönte Hintergründe.
- Prüffrage: *Ist die aktuelle Position erkennbar (aktiver Tab, Titel), ohne Überlauf-Tab?* · `/tab-bars`, `/sidebars`, `/toolbars`

### Feedback & Laden (feedback, loading, progress-indicators)
- **Tu:** sofort etwas zeigen (Skeleton/Platzhalter), Rest nachladen; Nutzer kann derweil weiterarbeiten. **Lass:** leere Seite bis alles da ist.
- **Tu:** Fortschritt bestimmt (Balken), wenn Dauer bekannt; gleichmäßig; nie „stehend". **Lass:** Spinner→Balken wechseln, vage Texte wie „Lädt…".
- **Tu:** Status passiv nahe am Element; Alerts nur für kritisch und handlungsrelevant. **Lass:** Alert für reine Information oder beim Seitenstart.
- **Tu:** Erfolg nur bei wichtigen Aktionen bestätigen; Warnung nur bei unerwartetem, unumkehrbarem Verlust. **Lass:** Warnung bei erwartbarem, rückgängig machbarem Löschen.
- **Tu:** Feedback mehrkanalig (Farbe + Text + Icon; Ton nur zusätzlich). **Lass:** nur Farbe oder nur Ton.
- Prüffrage: *Hat jede Aktion binnen ~100 ms sichtbare Reaktion (Press-State, Spinner, Toast)?* · `/feedback`, `/loading`

### Formulare / Eingabe (entering-data, text-fields)
- **Tu:** so wenig Eingabe wie möglich: Vorbelegen, Auswahl statt Tippen, Autofill/Einfügen erlauben. **Lass:** Daten abfragen, die bekannt sind.
- **Tu:** sichtbares Label + Platzhalter als Format-Hinweis (Platzhalter verschwindet!). **Lass:** Platzhalter als einziges Label.
- **Tu:** passende Tastatur (`type`, `inputmode`, `autocomplete`), Passwortfeld verdeckt, nie vorbelegt. **Lass:** Text-Tastatur für Zahlen/E-Mail.
- **Tu:** live validieren (E-Mail beim Verlassen, Nutzername/Passwort beim Tippen), Fehler am Feld; „Weiter" erst aktiv, wenn Pflichtfelder gefüllt. **Lass:** Fehler erst nach dem Absenden, gesammelt oben.
- **Tu:** Felder vertikal, gleiche Breiten, Feldbreite passt zur erwarteten Länge. **Lass:** Zufällige Breiten.
- Prüffrage: *Hat jedes `input` ein `<label>`, passenden `type`/`inputmode`/`autocomplete` und Schrift ≥ 16 px?* · `/entering-data`, `/text-fields`

### Buttons & Toggles (buttons, toggles, menus)
- **Tu:** Hit-Region ≥ 44×44; immer Press-/Hover-/Fokus-Zustand. **Lass:** Custom-Buttons ohne Zustand.
- **Tu:** 1–2 prominente Buttons je Ansicht; Vorzugswahl über Stil, nicht Größe. **Lass:** mehrere gleich laute Primärbuttons.
- **Tu:** Rollen trennen: Primär, Abbrechen, Destruktiv (rot); destruktive Aktion nie als Primär. **Lass:** „Löschen" als hübschester Button.
- **Tu:** Toggle für zwei gegensätzliche Zustände; Zustand nicht nur per Farbe. **Lass:** Toggle für Aktionen/Listenwahl.
- **Tu:** Menü-Einträge mit Verb, „…" wenn noch Eingabe folgt, ausgegraute statt versteckte Einträge. **Lass:** Icons nur bei Teil der Einträge einer Gruppe.
- Prüffrage: *Jeder Button ≥ 44 px, klarer Label/Icon-Name, höchstens 2 `.primary` je Screen?* · `/buttons`, `/toggles`, `/menus`

### Modale Ebenen (modality, sheets, alerts)
- **Tu:** Modal nur mit klarem Nutzen, kurz, ein Pfad. **Lass:** „App in der App", verschachtelte Sheets.
- **Tu:** immer offensichtlicher Ausweg (Schließen, Abbrechen, Esc, Tippen auf Hintergrund wo passend). **Lass:** Done als einziger Ausgang; alle drei Buttons Cancel/Done/Back zugleich.
- **Tu:** Titel nennt die Aufgabe; bei ungespeicherten Eingaben vor Schließen nachfragen. **Lass:** Stiller Datenverlust.
- **Tu:** nur ein Modal (und max. ein Alert) sichtbar. **Lass:** Stapel aus Dialogen.
- Prüffrage: *Dialog mit `role=dialog`, Fokus gefangen, Esc/Schließen vorhanden, max. 3 Buttons?* · `/modality`, `/sheets`, `/alerts`

## 4. Branding
**Was die HIG sagen (branding):** Marke über Stimme/Ton, sparsam eingesetzte Akzentfarbe (Primäraktionen, Statusmarker) und bekannte Komponenten ausdrücken. Marke **weicht dem Inhalt**; Logo nicht überall wiederholen; Ladebildschirm ist keine Branding-Fläche; Marken-Schrift für Überschriften erlaubt, Fließ- und Kleintext in gut lesbarer Systemschrift; Marke darf in die **Inhaltsebene** wandern (sie scrollt dann unter der Steuerung durch), Controls bleiben ruhig/monochrom. Ähnliche Farbe in Control-Labels und buntem Hintergrund vermeiden. Quellen: `/branding`, `/color`, `/materials`.

**Starkes Muster (Kuh/Leopard) HIG-konform einsetzen:**
- **Ebene wählen:** Muster nur im Hintergrund/Inhalt (Hero, Sektionstrenner, Kartenrand, Leerzustände, 404) — nie hinter Fließtext, Formularen oder Bedienelementen.
- **Lesefläche statt Muster:** Text steht auf einer ruhigen Fläche („Plakette", Karte mit deckendem/dichtem Hintergrund) oder das Muster ist auf niedrige Deckkraft/Kontrast reduziert (Faustwert: Musterkontrast gegen Grund so gering, dass Text ≥ 4,5:1 auch am schlechtesten Musterpunkt hält).
- **Controls bleiben ruhig:** Buttons, Tabs, Navigation einfarbig und mit den normalen Kontrasten; die Marke steckt im Akzent und im Muster darunter, nicht im Button. Ein Primärbutton je Screen.
- **Dosieren:** ein Muster-Moment je Screen (großflächig ODER als Akzent), nicht beides; Stufen: laut auf Landing/Hero, leise (Ton-in-Ton) auf Arbeitsflächen (Dashboards, Formulare).
- **Nie Informationsträger:** Muster kodiert nichts (Status, Auswahl) — dafür Icons/Text.
- **Dunkel-Variante:** Muster und Untergrund für Dark Mode eigens umfärben (Kontur nachziehen), nicht invertieren; Kontrast dort neu messen.
- **Reduzierte Bewegung:** Muster statisch; Parallax/Animation aus bei `prefers-reduced-motion`.
- **Skalierung:** vektor (SVG/CSS) oder in 2×/3×; Musterkachel größenabhängig, damit Flecken auf 320 px nicht zu Rauschen werden.
- **Messen (Text über Muster):** Screenshot des Textbereichs ohne Text (`color:transparent` setzen), Pixel `min/max` der Luminanz lesen, dann WCAG-Verhältnis gegen die Textfarbe gegen den *schlechtesten* Pixel rechnen (Python/PIL): `lum(px)` für helleren und dunkleren Extremwert, `ratio ≥ 4.5` (Fließtext) bzw. 3 (≥ 18 px/fett).
- Prüffrage: *Ist der Text auch ohne das Muster die Hauptsache, und hält der Kontrast am hellsten und dunkelsten Punkt hinter ihm?*

## 5. Prüfliste (abhaken)
| # | Punkt | automatisch messbar |
|---|---|---|
| 1 | Alle Tippflächen ≥ 44×44 px (Ausnahme dichte Desktop-Tabellen ≥ 28) | ja |
| 2 | Abstand zwischen Controls ≥ 12 px (rahmenlos ≥ 24) | ja |
| 3 | Keine Schrift < 11 px, Fließtext ≥ 16 px | ja |
| 4 | Text-Kontrast ≥ 4,5:1 (≥ 3:1 ab 18 px oder fett) in Hell **und** Dunkel | ja |
| 5 | Kleiner Text/eigene Farben im Dark Mode idealerweise 7:1 | ja |
| 6 | Kein Thin/Light-Gewicht (< 400) | ja |
| 7 | ≤ 8 verschiedene Schriftgrößen, ≤ 2 Schriftfamilien | ja |
| 8 | Layout bei 200 % Textgröße ohne horizontales Scrollen/Abschneiden | ja |
| 9 | Kein Layout-Bruch bei 320/390/768/1280 px | ja |
| 10 | Safe Areas (`viewport-fit=cover`, `env(safe-area-inset-*)`) frei | teilweise |
| 11 | `prefers-color-scheme` wird befolgt; beide Modi getestet | ja |
| 12 | `prefers-reduced-motion`: keine Endlos-/Scroll-Animation | ja |
| 13 | Bewegung hat Zweck, ist abbrechbar, nicht bei Häufig-Interaktion | nein |
| 14 | Farbe nie allein Bedeutungsträger (Graustufen-Test, Icon/Text dabei) | teilweise |
| 15 | Fokus sichtbar, Tab-Reihenfolge logisch, Esc schließt Overlays | teilweise |
| 16 | Jedes Bedienelement hat Namen/Label; alle `img` mit `alt` | ja |
| 17 | Jedes Formularfeld: Label + passender `type`/`inputmode`/`autocomplete` | ja |
| 18 | Fehlertexte beim Feld, ohne Schuldzuweisung, mit Lösung | nein |
| 19 | Buttons beginnen mit Verb; kein „Hier klicken" | teilweise |
| 20 | 1–2 prominente Buttons je Ansicht; Destruktiv nie Primär | teilweise |
| 21 | Jede Aktion zeigt binnen ~100 ms sichtbare Rückmeldung (Press/Spinner) | teilweise |
| 22 | Ladezustand: Platzhalter statt leerer Seite; Fortschritt bestimmt wenn möglich | nein |
| 23 | Modal: Ausweg vorhanden, ein Modal zugleich, ≤ 3 Alert-Buttons | teilweise |
| 24 | Navigation flach (≤ 2 Ebenen), aktuelle Position erkennbar, kein Überlauf-Tab | teilweise |
| 25 | Bilder scharf bei 2×/3×, SVG für flache Grafik, sinnvolle Formate | ja |
| 26 | Glas/Blur nur in Steuerungsebene, Fallback bei reduzierter Transparenz | teilweise |
| 27 | Marke: Akzentfarbe sparsam, Logo nicht wiederholt, Marke im Inhalt statt in Controls | nein |
| 28 | Muster: nichts unter Fließtext ohne Lesefläche; Text ≥ 4,5:1 am schlechtesten Pixel | ja (Screenshot-Messung) |
| 29 | Interaktive Elemente haben Press-/Hover-/Fokus-Zustand | teilweise |
| 30 | Ein Fokus + eine Primäraktion je Screen (Hierarchie) | nein |

## 6. Quellen (abgerufen 30.09.2026)
Basis `https://developer.apple.com/design/human-interface-guidelines/` — Inhalt über die JSON-Endpunkte `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<seite>.json` gelesen (WebFetch lieferte die JS-Seiten nur als Titel bzw. Spekulation; die WebFetch-Zusammenfassungen wurden **nicht** verwendet).
Gelesen (32 Seiten): accessibility · color · dark-mode · layout · motion · typography · writing · images · branding · materials · icons · inclusion · loading · feedback · onboarding · entering-data · modality · progress-indicators · alerts · buttons · menus · tab-bars · sidebars · toolbars · text-fields · sheets · toggles · search-fields · lists-and-tables · pointing-devices · keyboards · gestures.
Lücken: keine eigene HIG-Seite „Navigation" (Pattern gibt es nicht als Einzelseite; aus tab-bars/sidebars/toolbars abgeleitet); Drei-Grundsätze-Formel nicht wörtlich in den Seiten (siehe Kopf von §1); keine Animationsdauern, keine iOS-Randmaße, keine Safe-Area-Werte in den HIG; Onboarding, Search-Fields, Lists/Tables, Pointing/Keyboards/Gestures nur überflogen (keine harten Zahlen).
