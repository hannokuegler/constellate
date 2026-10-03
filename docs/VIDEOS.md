# 🎬 Videos · von Anfang an mitgedacht

Vier Videos: Demo (2 min) · Tech (3 min) · Team (60–90 s) · **1-min-Walkthrough** (C5-Pflicht). Alle auf Englisch, Querformat, ruhige Stimme, keine Musik, keine Effekte. Upload-Format vorher in HackOS prüfen (YouTube unlisted vs. Drive).

## 1 · Demo Video (2:00) · Recep spricht, Screen-Recording der Live-URL

| Zeit | Bild | Text (Kern) |
|---|---|---|
| 0:00–0:15 | Schwarz, dann eine Suchbox | „Maria leads a patient group for Krabbe disease. No approved drug. She is building a registry from scratch, and she does not know that three universities away someone already solved half her problem." |
| 0:15–0:45 | tippt „Krabbe", Ego-Graph erscheint, klickt GALC → Mechanismus → PSAP | „Constellate organizes rare diseases by mechanism, not by name. One gene, PSAP, hides under three disease names: Krabbe, metachromatic leukodystrophy, Gaucher. Every edge shows its source, its evidence level, and its counter-evidence." (Edge-Panel aufklappen, PMID zeigen) |
| 0:45–1:15 | klickt MLD → Assets: Gentherapie, Natural-History-Studie, MLD Foundation | „MLD already has an approved gene therapy, and its approval leaned on a natural-history study as external control. That study design exists. Maria can adapt it instead of rebuilding it." |
| 1:15–1:40 | Action Card | „The Action Card tells her what transfers, what differs, and what needs expert review, with every sentence citing the edge behind it. She leaves with a sourced proposal for the MLD Foundation." |
| 1:40–1:55 | Devon-Suche: ultra-seltene Krankheit → Honest-Gap-Screen | „And when there is no evidence, Constellate says so: what we searched, what is missing, and the next question to test." |
| 1:55–2:00 | Logo + URL | „Five thousand points of light. One map. Constellate." |

## 2 · 1-min-Walkthrough (C5-Pflicht) · Recep
Exakt die Maria-Journey ohne Intro-Pathos: Suche → PSAP-Kante mit Quelle → MLD → Asset → Action Card → letzter Satz „here is what must be checked before we join forces". Ein Take, Cursor langsam, nichts erklären, was man sieht.

## 3 · Tech Video (3:00) · Hanno

| Zeit | Bild | Inhalt |
|---|---|---|
| 0:00–0:30 | Architektur-Diagramm | Pipeline → Graph-JSON → Next.js, warum kein Graph-DB |
| 0:30–1:15 | Terminal `make reproduce` läuft, dann `graph.json` im Editor | Quellen (HPO, Orphanet, MONDO, ClinVar, Trials, RePORTER, Open Targets, Reactome), Slice = MONDO-Subtree, Datenmodell mit **Evidenzstufen** zeigen |
| 1:15–2:15 | Code: `05_openai_extract.py` (Structured Outputs), `06_openai_reconcile.py` (Embeddings + Judge), `/api/explain` (Prompt mit Zitierpflicht) | **Built with OpenAI**: Extract, Reconcile, Explain, jeweils 20 s, Output live zeigen |
| 2:15–2:45 | `07_analytics.py` | IC-gewichtete Phänotyp-Ähnlichkeit, Pathway-Jaccard, Louvain, automatische Gegenbeispiele (PMD), Coverage |
| 2:45–3:00 | Limitations-Slide | OMIM nur indirekt, Orgs kuratiert, ein Cluster, was als Nächstes validiert wird |

## 4 · Team Video (60–90 s) · Osman filmt
Je 20–25 s pro Person, Handy, derselbe Hintergrund:
- Name, Rolle im Team, Studium/Background in einem Satz
- „Why this challenge" in einem Satz, persönlich, kein Pitch
- Abschluss alle drei im Bild: „We're Constellate, Vienna Hub."

## Regeln
- Erst aufnehmen, wenn Feature-Freeze (12:00) gilt. Vorher nur Skript und Probe-Takes.
- Live-URL im Video sichtbar lassen (Browserleiste), keine localhost-Demos.
- Jeder Claim im Demo-Video muss im Tool als Kante mit Quelle existieren. Was Recep in R1 nicht belegen konnte, kommt nicht ins Video.
- Pitch 10.10. (falls Top 2): Slides aus R4, 3 min, dieselbe Maria-Story + Moonshot-Timeline.
