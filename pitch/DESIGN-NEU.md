# Constellate · Design neu

## Idee und Entscheidung
Ein ruhiger Ort, der von einer Diagnose zum nächsten belegten Schritt führt. Hanno wählte in dieser Session ruhige Arbeitsflächen mit einem Sternbild auf der Startseite. Empfohlenes Konzept: Quiet constellation. Geprüfte Alternativen: Paper atlas (redaktionell) und Night observatory (stärker inszeniert).

## Weg und Informationsarchitektur
1. Ein Satz, ein beschriftetes Suchfeld, zwei Beispiel-Diagnosen. Nur Suchindex laden; kein Startgraph, keine Persona-Modi.
2. Krankheit: Definition mit Quelle und Stand; Zulassungsstatus; bei einer Lücke unmittelbar die Ressourcen mechanistisch verwandter Krankheiten. Die Zulassung gilt ausdrücklich nur für die benannte Nachbarkrankheit.
3. Familien, offene Studien und verwandte Krankheiten. Keine erfundenen Nullwerte: fehlendes Feld bleibt Data pending; dokumentiert leer bleibt Honest gap mit Quelle, Datum und Trefferzahl.
4. Show the evidence öffnet den Graph, Gene, Phänotypen und Forschung. Jede Kante zeigt Evidenz, Gegenbelege auch wenn leer, Konfidenz und Formel.
5. Gen-Seite verbindet Krankheitsnamen. Action Card hält What transfers, What differs und Needs expert review mit Quellen für Gespräch, Druck und Teilen zusammen.

## Designsystem
Heller Grund #f5f3ed, Lesefläche #fffefa, Schrift #172b32, Nebeninformation #526269, Interaktion #196357. Dunkler Grund #101c25, Fläche #192b36, Schrift #edf2ef, Nebeninformation #b2c2c8, Interaktion #9cdcd2. Bernstein ist nur der dekorative Familienpunkt. Farbe trägt keine Aussage allein.

Systemschrift lokal ohne Font-Download. Maximal acht rem-basierte Größen: 13, 16, 17, 20, 24, 32, 48, 64 px. Fließtext 17 px/1,55; Gewichte 400–700. Radien 8/16/24 px. Controls mindestens 44 px, Abstände 12 bzw. 24 px. Safe Areas, sichtbarer Fokus, umbrochene Quellen und mobile Stapel statt breiter Tabellen.

Keine WebGL-Abhängigkeit. Das dekorative Sternbild ist statisches SVG außerhalb der Lesefläche. Feedback 160 ms, reduzierte Bewegung beendet Animationen. Hell/dunkel folgen der Systemeinstellung.

## Screens und Prüfung
Landing, Krabbe, GALC, PSAP, MLD, ARSA, Gegenbeispiel PMD, Honest Gap, Action Card, Org, Studie, Methods, About, 404. 36 vorherige Live-Screens in app/_screens/baseline. Der neue Demo-Weg beginnt bei der Suche; Graph und Fachdetails werden bewusst aufgeklappt. Das ist eine Änderung gegenüber dem bisherigen Videoablauf.

Zwei PDCA-Runden: technische Checks und blinder Review, Fixes, neuer Review; anschließend Kriterien aus drei simulierten Nutzerperspektiven mit Screenshot-Belegen. Keine Aussagen über echte Nutzertests ohne echte Teilnehmende. Performance lokal ist keine Garantie für die Live-URL.

## Unverhandelbar
Datenvertrag und API unverändert; public/data und pipeline nicht bearbeiten. Krabbe ohne Zulassung. Kein Behandlungsversprechen über Krankheitsgrenzen hinweg. Kein Persona-Schalter. Jede medizinische Behauptung aus den vorhandenen Quellen. Nur Branch web-neu, Integration und Live-Deploy durch Orchestrator.
