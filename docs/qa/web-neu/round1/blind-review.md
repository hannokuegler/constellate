# Blinder Review – PDCA Runde 1

Basis: origin/orchestrator:docs/prompts/WEB-DESIGN-NEU.md und HIG-web.md; unabhängige Codeprüfung ohne Builderbericht. Keine App-Quelldateien verändert.

## Findings

1. **P2 – Action Card erfindet bei fehlendem Suchprotokoll einen negativen Suchbefund.** `app/lib/actionv2.ts:125` erzeugt für vorhandene leere Gruppen immer `state: "gap"`; `:71–73` ergänzt dann Default-Quellen. Reproduktion ohne Dateiänderung: Krabbe-Shard im Speicher laden, `approved_therapies={items:[],searched:[]}` setzen und `buildV2(...)` ausführen. Tatsächliche Ausgabe: `Not found in EMA medicine list, openFDA drug labels as of the last data build.` Dieser Input belegt keine durchgeführte Suche. `DiseaseAnswers` behandelt denselben Input bereits korrekt als pending. Abhilfe: Für leere Items ohne Suchprotokoll pending; keine Default-Suchen behaupten. Der aktuelle Export enthält in diesen objektförmigen v2-Gruppen keine solche leere Suchliste; es ist ein reproduzierter Vertrags-/Folgedatenfehler, kein behaupteter aktueller Krabbe-Datenfehler.

2. **P2 – Evidenz-Sheet ist auf Mobilgeräten visuell modal, erlaubt aber Hintergrundfokus.** `app/components/EdgePanel.tsx:54–60`: mobiler Backdrop bedeckt und sperrt die Seite für Pointer, Dialog bleibt `aria-modal="false"`. `:42–47` setzt nur initialen Fokus und Escape-Handler; weder Tab-Fokusgrenze noch Rückkehr zum auslösenden Control vorhanden. Tastatur-/Screenreader-Nutzer können in verdeckte Seitenbereiche gelangen; nach Schließen ist der Fokus nicht verlässlich am Auslöser. Abhilfe: Mobile als echtes Dialogmodell mit Fokusführung und Fokus-Rückgabe, oder konsequent nichtmodales, unbedeckendes Layout. Statischer Befund; Live-Reproduktion nach Build/Dev-Konflikt nicht abschließbar.

3. **P2 – Die erste Antwort bleibt Fachsprache statt der beauftragten einfachen Erklärung.** `app/components/DiseaseView.tsx:153` zeigt `node.definition` unverändert. Live auf `/d/MONDO_0018868` bei 390 px: „A rare lysosomal storage disorder characterized by intralysosomal accumulation of sulfatides … progressive deterioration of motor and neurocognitive function.“ Krabbe beginnt „A lysosomal disorder … central and peripheral nervous systems“. Für die ausdrücklich nichtfachliche Mutter ist „What this is“ damit keine Klartext-Antwort. Abhilfe: Quellengebundene kurze Erklärung in einfacher Sprache; Originaldefinition im Detailbereich erhalten. Keine eigenen Diagnosefakten ergänzt.

## Prüfbelege und Grenzen

- `npm.cmd run typecheck`: grün; `npm.cmd run lint`: grün, exit 0.
- Chrome Systempfad, Playwright headless, 390×844: Landing, Krabbe, PSAP, MLD, eigenständige Action Card, Honest Gap und Methods geladen; jeweils h1 vorhanden, document.scrollWidth=390, keine pageerror-Ereignisse.
- PSAP live: „One gene, 4 disease names“. MLD: Libmeldy / EMA 2020-12-17 und Lenmeldy / FDA 2024-03-18. Krabbe: kein gefundenes zugelassenes Medikament, EMA/FDA-Quellen und Suchdatum 2026-10-03 sichtbar. Honest-Gap-Studienkarte zeigt Suchdatum. Action Card öffnet mit belegten Transfer-/Unterschied-Aussagen.
- NeighbourResources lädt nur drei Kandidaten nach IntersectionObserver; Landing lädt den Suchindex, keinen Core-Graph. Kein belastbarer Produktions-LCP-Benchmark durchgeführt.
- `npm run e2e -- hero.spec.ts` löst vor Playwright einen Build aus. Dieser kollidierte mit dem gemeinsamen Dev-.next und endete mit `Invariant: no direct app page entry found for /_not-found`; daher kein Produktfinding und kein E2E-Erfolg behauptet. Root informiert, Prozess beendet. Nachfolgende Reflow-Messungen ohne ausreichende Bereitschaftsprüfung werden nicht als Nachweis gewertet.
