# Simulierter Nutzer-Test, Runde 1 (Teilprüfung)

Prüfzeit: 04.10.2026, 04:40–04:42 Europe/Vienna. Ziel: http://localhost:3100, Chrome headless, 375 × 812 px, hell. Keine echten Nutzer beteiligt. Bewertungen sind heuristische Persona-Simulationen, keine gemessene Nutzerzufriedenheit. Der Hauptagent änderte parallel CSS; dies ist eine Momentaufnahme.

## Tatsächlich ausgeführter Weg

Landing geöffnet, Combobox mit `Krabbe` ausgefüllt, sichtbare Option `Krabbe disease` angeklickt, Krankheitsüberschrift abgewartet. Automatisierte Dauer von Eingabe bis bereitstehender Krankheitsseite: **1.131 ms**; keine menschliche Such-/Lesezeit. Kein erfasster Console- oder pageerror im erfolgreichen Durchlauf (siehe `journey.json`). Landing: `home-inspect.png`; Krankheitsseite: `02-mother-disease.png`, vollständiger gelesener Inhalt `02-mother-disease.txt`.

Die Fortsetzung wurde beim zweiten Durchlauf durch einen inkonsistenten Entwicklungsbuild unterbrochen. Auf Anweisung des Hauptagenten gestoppt. Der danach sichtbare `Internal Server Error` wird **nicht als App-Befund** bewertet. `01-mother-home*` stammt aus diesem fehlgeschlagenen Wiederholungsversuch und ist keine Produktaufnahme.

## Persona-Bewertung der beobachteten Oberfläche

| Persona / Kriterium | Bewertung | Beobachtung / Beleg |
| --- | --- | --- |
| Mutter: Einstieg finden | 9/10 | Ruhiger klarer Suchfokus; passende Beispiele; echter Suche-Klickweg gelingt. `home-inspect.png` |
| Mutter: Behandlung erkennen | 8/10 | `Is there an approved treatment?` folgt direkt auf die Definition; klare Aussage `No approved treatment found for Krabbe disease`, Quellen und Suchdatum. `02-mother-disease.txt` |
| Mutter: nächsten Schritt finden | 5/10 | Globale Action Card erst nach fünf ausführlichen Studien und 13 Nachbarn; gesamte Seite 9.991 px hoch im Screenshot. In der nahen Alternative steht bei dieser Momentaufnahme noch `Checking resources in related communities...`; ein dauerhaftes Ladeproblem wurde nicht nachgewiesen. |
| Forscherin/Buffalo-Jurorin: Gap nachvollziehen | 8/10 | EMA/FDA-Datenbasis, Datum und Einschränkung `This does not describe every care option` sichtbar. Suchdetails als aufklappbare Zusammenfassung. |
| Forscherin/Buffalo-Jurorin: Tiefe entdecken | 5/10 | `Show the evidence` am Ende des sehr langen Inhalts; zwischen Studien und Nachbarn stehen Fachbegriffe, Scores und Gene bereits im einfachen Bereich. Evidenzöffnung wurde noch nicht ausgeführt. |
| Tech-Juror: beobachtete Reaktionszeit | 8/10 | Automatisierter Suchweg 1.131 ms; erfolgreicher Lauf ohne erfasste JS-/Console-Fehler. Kein LCP-Labormesswert und kein Productionbenchmark. |
| Tech-Juror: mobile Informationsdichte | 5/10 | Landing übersichtlich; Krankheitsscreen erfordert sehr viel Scrollen. Keyboard, 200%-Text und gesamte Touchzielmessung sind noch ungeprüft. |

## Konkrete Verbesserungen vor Runde 2

1. Einen klaren nächsten Schritt direkt nach der Behandlungsantwort anbieten; Action Card zusätzlich dort erreichbar machen.
2. Studien zunächst kompakt zusammenfassen, lange Informationen pro Studie aufklappbar machen; Nachbarn auf wenige passende Einträge begrenzen und weitere explizit öffnen lassen.
3. `Show the evidence` auch im oberen Krankheitsbereich erreichbar machen, ohne den langen einfachen Bereich zu durchlaufen.
4. Ladeabschluss der nahen Ressourcen unter sauberem Server erneut prüfen; der aktuelle Screenshot belegt nur einen Ladezustand.

## Noch nicht abgenommen

Evidenzpanel samt Gegenbelegen/Escape, Gene-Klickweg, Action-Card-Klickweg, 200%-Text, Dunkel-Demo 1920 × 1080 bei 110%-Zoom. Der reproduzierbare Skriptentwurf `journey.cjs` enthält diese Folgeaktionen, sie wurden im unterbrochenen Durchlauf nicht erreicht. Runde 2 braucht einen stabilen Produktionsserver und frische Screenshots.
