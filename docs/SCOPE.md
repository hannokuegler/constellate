# 🎯 Scope · Welcher Cluster, welche Journey

> Prinzip aus dem Brief: *„Start with one disease cluster, then scale."* Ein Cluster tief, mit 2-Hop-Nachbarn außerhalb des Clusters, damit „names hide mechanisms" sichtbar wird.

## Drei Optionen

| | A · Lysosomale Speicherkrankheiten (LSD) | B · Ciliopathien | C · Leukodystrophien |
|---|---|---|---|
| Größe | ~70 Orphanet-Krankheiten, ~60 Gene | ~35 Krankheiten, ~190 Gene | ~30 Krankheiten, ~40 Gene |
| Mechanismus-Anker | ein Organell (Lysosom), klare Enzym-Substrat-Logik | ein Organell (Cilium), stark überlappende Phänotype | ein Gewebe (Myelin), **gemischte** Mechanismen (lysosomal, peroxisomal, PLP1) |
| Offene Daten | ⭐⭐⭐ sehr dicht (OMIM/HPO/ClinVar/Trials/RePORTER) | ⭐⭐ gut bei HPO, dünn bei Trials | ⭐⭐ gut |
| Patientenorgs | ⭐⭐⭐ viele, alt, mit Registern (Gaucher Registry seit 1991, INPDR, MPS Society, Hunter's Hope, MLD Foundation) | ⭐⭐ BBS Foundation, Joubert Foundation, Alström Int. | ⭐⭐ ULF, ELA, GLIA |
| Existierende Assets zum Teilen | ⭐⭐⭐ ERT/SRT-Plattformen, Gentherapie-Präzedenz (Libmeldy), NHS als externer Kontrollarm | ⭐ wenig Therapie | ⭐⭐ NHS, Newborn Screening |
| Demo-Story | ⭐⭐⭐ Krabbe → PSAP → MLD → Gentherapie-Präzedenz | ⭐⭐ „30 Gene, 1 Cilium" visuell stark | ⭐⭐ |
| Risiko | **im Brief genannt → Konkurrenz nimmt es auch** | weniger Konkurrenz, aber schwächere Action-Story | Mischcluster ist konzeptionell unsauber als Startpunkt |

### 💡 Empfehlung: **A, LSD-Kern + Leukodystrophie-Nachbarn als 2-Hop**
Begründung: Der Brief bewertet *Patient Progress* und *10× Impact* schwer, dafür braucht es **existierende Assets** (Register, NHS, Therapie-Präzedenz). Die hat nur A in Dichte. Dass andere Teams auch LSD nehmen, ist egal: wir gewinnen über Evidenz-Tiefe und die Journey, nicht über die Cluster-Wahl. Der Krabbe-Pfad führt automatisch zu Nicht-LSD-Nachbarn (Pelizaeus-Merzbacher, Canavan) und erzeugt damit das geforderte Gegenbeispiel.

## Die Hero-Journey (Maria, Krabbe)

| Schritt | Node / Edge | Evidenz (zu verifizieren: Recep, Task R1) |
|---|---|---|
| 1 | **Krabbe disease** (MONDO:0009499, ORPHA:487) · keine zugelassene medikamentöse Therapie, HSCT nur präsymptomatisch | Orphanet, OMIM 245200 |
| 2 | Krabbe → Gen **GALC** (observed, OMIM/ClinVar) | ClinVar pathogene Varianten |
| 3 | GALC → Mechanismus **lysosomaler Sphingolipid-Abbau** (Reactome „Glycosphingolipid catabolism") → Psychosin-Akkumulation → Oligodendrozyten-Tod | Reactome, PubMed |
| 4 | **PSAP** (Prosaposin) kodiert Saposine A–D: Saposin-A-Mangel = Krabbe-Phänotyp, Saposin-B-Mangel = MLD-Phänotyp, Saposin-C-Mangel = Gaucher-Phänotyp → **ein Gen, drei Krankheitsnamen** | OMIM 611722 / 249900 / 610539, Open Targets listet PSAP bei Gaucher |
| 5 | → **Metachromatische Leukodystrophie (MLD)**, Gen ARSA · gleicher Pathway, gleiches Zielgewebe, überlappende HPO-Phänotype (Demyelinisierung, Regression, Spastik, periphere Neuropathie) | HPO-Ähnlichkeit (IC-gewichtet), Reactome |
| 6 | MLD hat **Libmeldy / Lenmeldy** (Gentherapie, EU 2020, FDA 2024); Zulassung stützte sich auf eine **Natural-History-Kohorte als externen Vergleichsarm** | EMA EPAR, FDA, PubMed |
| 7 | Assets: MLD Natural History Study, GMFC-MLD-Skala, MLD Foundation, Newborn Screening Pilotprogramme; Krabbe: Hunter's Hope, NBS in mehreren US-Staaten, Gentherapie-Trial FBX-101 (ClinicalTrials.gov) | ClinicalTrials.gov, RePORTER |
| 8 | Netzwerk-Overlap: dieselben KOLs publizieren zu Krabbe **und** MLD (aus PubMed-Autorennetz; z. B. M. Escolar, Pittsburgh — verifizieren) | PubMed Autoren |
| 9 | **Action Card:** „Vorschlag an MLD Foundation: NHS-Design + GMFC-Skala auf Krabbe adaptieren. Übertragbar: Endpunkte Motorik, MRT-Scoring. Unterschied: Substrat (Psychosin vs. Sulfatid), Onset-Verteilung. Expertenprüfung: Validität der Motorikskala bei Krabbe, NBS-Kohorte als Rekrutierungsquelle." | OpenAI *Explain* aus den Kanten 1–8, jeder Satz mit Edge-Referenz |
| 10 | **Gegenbeispiel:** Pelizaeus-Merzbacher (PLP1) ist phänotypisch ähnlich, aber Hypomyelinisierung statt Demyelinisierung, kein lysosomaler Mechanismus → „ähnliche Symptome, andere Ursache, Assets nicht übertragbar" | HPO vs. Reactome: hohe Phänotyp-Ähnlichkeit, Pathway-Overlap = 0 |

## Honest-Gap-Journey (Devon)
Devon tippt „CLN14" oder eine ultra-seltene LSD ohne Organisation in unserer kuratierten Liste → Screen: *„Keine Patientengruppe für genau diese Diagnose gefunden. Durchsucht: Orphanet, NORD-Liste, Global Genes, kuratierte Gruppen-Seiten (Stand Datum). Nächste verwandte Communities: … (via Phänotyp + Pathway). Was die Lücke schließen würde: …"* Das ist ein eigener First-Class-Screen, kein Fehlerfall.

## Persona-Linse (gleicher Graph, 4 Filter)
- **Maria**: Krankheit → Nachbarn → Assets → Partner → Action Card
- **Devon**: Freitext-Symptome → HPO-Terme (OpenAI) → Krankheit(en) → Community oder Honest Gap
- **Priya**: Mechanismus/Pathway → gerankte Cluster mit Orgs, Trials, Funding
- **Dr. Osei**: Gen/Mechanismus → alle Gen-Namen → Autoren + RePORTER-Grants

## Was wir NICHT bauen
Kein Login, kein Neo4j, keine 10.000 Krankheiten, keine Volltext-PDF-Verarbeitung, keine User-Contributions (nur als Moonshot-Slide), kein Investor-Modul.

## Moonshot (10×)
Meilenstein: **Start einer gemeinsamen Natural-History-Studie** für einen mechanistischen Cluster.
Heute: Gruppe gründen → Forscher finden → NHS-Design von null → Ethik → Rekrutierung über eine Krankheit: typischerweise **5–8 Jahre** bis zu belastbaren NH-Daten (Zahlen: Recep, Task R2).
Mit Constellate: Partner + existierendes Design in Minuten → Adaption statt Neubau → Rekrutierung über den Cluster (3–5× mehr Patienten) → **~6–12 Monate** bis zum Studienstart. Annahmen offenlegen: Design übertragbar (Expertenprüfung), Gruppen kooperieren, Ethik-Templates wiederverwendbar, Register-Interoperabilität.
