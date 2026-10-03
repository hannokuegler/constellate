# Glossar · alle Begriffe in Normalsprache

Für Osman und Recep (und für die Videos). Wer einen Begriff im Repo nicht versteht: hier nachschlagen, sonst Hanno fragen.

## Die drei OpenAI-Schritte (müssen im Tech-Video sichtbar sein)

| Begriff | Heißt auf Deutsch | Beispiel |
|---|---|---|
| **Extract** | Rausziehen. GPT liest einen Paper-Abstract und gibt eine Tabelle zurück: Gen, Krankheit, Behauptung, Quelle | „PSAP-Mangel verursacht Krabbe-ähnliche Symptome", PMID 12345 |
| **Reconcile** | Abgleichen. Dieselbe Krankheit heißt überall anders. GPT entscheidet, was dasselbe ist, wir geben ihm eine stabile ID | „Krabbe disease" = „globoid cell leukodystrophy" = ORPHA:487 = OMIM:245200 = MONDO:0009499 |
| **Explain** | Erklären. Aus einem Pfad im Graphen werden drei Sätze für eine Familie, jeder Satz mit Quelle | „Krabbe und MLD teilen den Mechanismus, weil … [e_0042]" |
| **Resolve** | Freitext-Symptome → offizielle HPO-Nummern | „mein Kind ist steif und verliert Fähigkeiten" → HP:0001257 Spastik, HP:0002376 Regression |

## Graph

| Begriff | Bedeutung |
|---|---|
| **Knowledge Graph** | Netz aus Punkten (Krankheiten, Gene, Symptome, Gruppen, Studien) und Linien (Beziehungen) |
| **Node / Edge** | Punkt / Linie |
| **Ego-Graph** | Nur die Nachbarschaft eines Punktes, nicht das ganze Netz |
| **Evidenzstufe** | Wie sicher ist eine Linie: `observed` (in Patienten gemessen) · `curated` (Experten-Datenbank) · `text_mined` (GPT aus Paper, ungeprüft) · `inferred` (von uns gerechnet) |
| **Konfidenz** | Zahl 0–1, wie stark der Beleg ist |
| **Gegenevidenz** | Studien, die der Linie widersprechen. Eigenes Feld, darf leer sein, fehlt nie |
| **Honest Gap** | Screen „nichts gefunden" plus Liste, wo gesucht wurde und was fehlt |
| **Action Card** | Zettel am Ende: übertragbar / unterschiedlich / Expertenprüfung nötig, jeder Satz mit Quelle |
| **Gegenbeispiel** | Krankheit, die ähnlich aussieht, aber anderen Mechanismus hat (Pelizaeus-Merzbacher). Zeigt, dass der Graph nicht alles verbindet |
| **Cluster** | Gruppe von Krankheiten, die mechanistisch zusammengehören |
| **Persona-Linse** | Derselbe Graph, vier Sichten: Maria (Gruppenleiterin), Devon (frisch diagnostiziert), Priya (Biotech), Dr. Osei (Forscher) |

## Medizin

| Begriff | Bedeutung |
|---|---|
| **Phänotyp** | Symptom-Muster eines Patienten |
| **HPO** | Human Phenotype Ontology, offizielle Liste aller Symptome mit Nummern (HP:…) |
| **MONDO / ORPHA / OMIM** | Drei Nummernsysteme für Krankheiten. MONDO ist unser Hauptschlüssel |
| **Gen / Variante** | Bauplan / konkreter Tippfehler darin. ClinVar sagt, welche Tippfehler krank machen („pathogen") |
| **Mechanismus / Pathway** | Der biologische Prozess, der kaputt ist |
| **LSD** | Lysosomale Speicherkrankheiten: Zelle kann Abfall nicht abbauen, Müll stapelt sich. ~70 Krankheiten, unser Cluster |
| **Krabbe disease** | Unsere Hauptkrankheit. Gen GALC, zerstört Myelin (Nerven-Isolierung), kein zugelassenes Medikament |
| **MLD** | Metachromatische Leukodystrophie, Nachbar-Krankheit, gleiche Logik, anderes Enzym. Hat seit 2020 (EU) / 2024 (FDA) eine Gentherapie |
| **PSAP** | Das Gen, das Krabbe, MLD und Gaucher verbindet. Ein Gen, drei Krankheitsnamen |
| **Natural History Study (NHS)** | Unbehandelte Patienten über Jahre beobachten. Bei MLD die Vergleichsgruppe für die Zulassung, weil man kranke Kinder nicht mit Placebo behandelt |
| **Externer Kontrollarm** | Genau das: statt Placebo-Gruppe vergleicht man mit der NHS-Kohorte |
| **Newborn Screening** | Bluttest bei jedem Neugeborenen. 18 US-Staaten machen das für Krabbe, Österreich nicht |
| **HSCT** | Stammzelltransplantation, einzige Krabbe-Behandlung, nur vor Symptombeginn |
| **PMID** | Nummer eines Papers in PubMed. Unsere Währung für „belegt" |
| **Register** | Datenbank, in der eine Patientengruppe ihre Patienten sammelt |
| **Patientenorganisation** | Verein von Familien einer Krankheit (Hunter's Hope, MLD Foundation) |

## Pipeline (die Python-Skripte, nacheinander)

| Schritt | Macht |
|---|---|
| `01_fetch` | Dateien von HPO, MONDO, Orphanet runterladen |
| `02_slice` | Unseren Ausschnitt wählen: LSD + Leukodystrophien + Nachbarn |
| `03_build_graph` | Punkte und Linien bauen, jede Linie mit Beleg |
| `04_enrich_apis` | Studien (ClinicalTrials), Fördergelder (NIH RePORTER), Papers (PubMed), Pathways (Reactome) dazuholen |
| `05_openai_extract` | GPT: Abstracts → Behauptungen |
| `06_openai_reconcile` | GPT: Org-Namen → MONDO-IDs |
| `07_analytics` | Ähnlichkeit rechnen, Cluster finden, Gegenbeispiele markieren, Suchabdeckung zählen |
| **IC-gewichtet** | Seltene Symptome zählen mehr. „Krampfanfälle" haben 1.000 Krankheiten, „Globoidzellen" nur eine |
| **Louvain** | Algorithmus, der Cluster im Netz findet |
| **Jaccard** | Maß für Überlappung zweier Mengen (gemeinsame Pathways geteilt durch alle) |

## Tools

| Tool | Was es für uns tut |
|---|---|
| **Bright Data** | Ruft Webseiten für uns ab (Patientenorg-Seiten) |
| **Vercel** | Hosting, App läuft dort live, jeder Push = neue Vorschau-URL |
| **uv** | Python-Paketmanager (`uv sync` installiert alles) |
| **make** | Befehlssammlung: `make reproduce` baut alle Daten neu, `make dev` startet die App |
| **HackOS** | Hack-Nation-Plattform: Team eintragen, Credits holen, abgeben |
| **ElevenLabs** | KI-Stimme für die Video-Voice-over und „Vorlesen" in der App |
| **Structured Outputs** | OpenAI-Funktion, die GPT zwingt, eine exakte Tabelle statt Text zurückzugeben |
| **Feature Freeze** | Ab So 12:00 wird kein Code mehr geändert, nur noch Videos und Abgabe |
