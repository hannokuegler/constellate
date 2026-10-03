# 📦 Datenquellen · live geprüft Sa 03.10.2026, 19:40

Alle Quellen unten habe ich **heute per curl getestet**. Kein Key nötig außer dort markiert. Gesamt-Ladezeit der Pflichtquellen: **< 10 Minuten**.

## Pflicht (Block 1, 20:30–23:30)

| Quelle | Was | Zugriff | Key | Lizenz | Größe / Zeit | Status |
|---|---|---|---|---|---|---|
| **HPO** `phenotype.hpoa` | Krankheit → Phänotyp (8.478 OMIM + 4.357 ORPHA Krankheiten), mit Frequenz, Evidenzcode, Quelle | `https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa` | nein | HPO-Lizenz (frei, Attribution) | 36 MB, ~30 s | ✅ 200 |
| **HPO** `genes_to_phenotype.txt` | Gen → Phänotyp → Krankheit (OMIM-IDs) | gleiche URL-Basis | nein | wie oben | 21 MB | ✅ 200 |
| **HPO** `hp.json` | Ontologie (für IC + Hierarchie) | gleiche URL-Basis | nein | wie oben | 22 MB | ✅ 200 |
| **MONDO** `mondo.json` | stabile Krankheits-IDs, Synonyme, xrefs (OMIM/ORPHA/DOID/UMLS), is_a-Hierarchie → **Slice = Subtree von MONDO:0002561 „lysosomal storage disease"** | `https://github.com/monarch-initiative/mondo/releases/latest/download/mondo.json` | nein | CC-BY 4.0 | 108 MB, ~2 min | ✅ 200 |
| **Orphanet** `en_product6.xml` | Krankheit → Gen (mit HGNC/OMIM/Ensembl-Refs, Assoziationstyp „disease-causing germline mutation") | `https://www.orphadata.com/data/xml/en_product6.xml` | nein | CC-BY 4.0 | ~15 MB | ✅ 200 |
| **Orphanet** `en_product4.xml` | Krankheit → HPO mit Frequenz | `…/en_product4.xml` | nein | CC-BY 4.0 | ~10 MB | ✅ 200 |
| **Orphanet** `en_product1.xml` | Krankheiten + Synonyme + Definition + xrefs | `…/en_product1.xml` | nein | CC-BY 4.0 | ~15 MB | ✅ 200 |
| **Orphanet** `en_product9_prev.xml` | Prävalenz (für „wie selten") | `…/en_product9_prev.xml` | nein | CC-BY 4.0 | ~7 MB | ✅ 200 |

**OMIM direkt** (`genemap2.txt`): braucht Registrierung + Freigabe (Stunden bis Tage). **Nicht einplanen.** OMIM-Inhalte kommen indirekt über HPO-Annotationen (OMIM-IDs + Namen), Orphanet-Refs und Monarch (`primary_knowledge_source: infores:omim`). Im README ehrlich so schreiben.

## APIs für Enrichment (Block 4, 02:00–04:00), alle ohne Key

| Quelle | Endpoint (getestet) | Liefert | Rate | Status |
|---|---|---|---|---|
| **ClinicalTrials.gov v2** | `GET https://clinicaltrials.gov/api/v2/studies?query.cond=<disease>&pageSize=50&format=json` | Trials: NCT, Titel, Sponsor, Phase, Status, Interventions, Conditions | großzügig | ✅ 200, 0.6 s |
| **NIH RePORTER v2** | `POST https://api.reporter.nih.gov/v2/projects/search` Body `{"criteria":{"advanced_text_search":{"operator":"and","search_field":"projecttitle,terms","search_text":"Krabbe"}},"limit":50}` | Grants: PI-Namen, Organisation, Fiscal Year, Abstract, Betrag | 1 req/s | ✅ 200, 480 Treffer für NPC |
| **PubMed E-utilities** | `esearch.fcgi?db=pubmed&term=<q>&retmax=100&retmode=json` → `efetch.fcgi?db=pubmed&id=…&rettype=abstract&retmode=xml` | PMIDs, Abstracts, Autoren, Datum | 3 req/s ohne Key, 10 mit (`NCBI_API_KEY`, 2 min Registrierung, optional) | ✅ 200 |
| **Europe PMC** | `GET https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=<q>&format=json&pageSize=100&resultType=core` | wie PubMed, plus Preprints, plus Text-Mining-Annotationen (`/annotations_api`) | großzügig | ✅ 200 |
| **ClinVar E-utilities** | `esearch.fcgi?db=clinvar&term=<GENE>[gene]+AND+pathogenic[CLNSIG]` → `esummary` | Varianten mit klinischer Signifikanz, Review-Status | wie PubMed | ✅ 200, 833 pathogene NPC1 |
| **Open Targets GraphQL** | `POST https://api.platform.opentargets.org/api/v4/graphql` (GET liefert 500!) `disease(efoId:"MONDO_0009499"){associatedTargets{rows{target{approvedSymbol} score datatypeScores{id score}}}}` | Krankheit → Gene mit Score **je Datentyp** (genetic_association, literature, clinical, animal_model) → perfekt für Konfidenz + observed/inferred | großzügig | ✅ 200 |
| **Reactome ContentService** | `GET https://reactome.org/ContentService/data/mapping/UniProt/<P04062>/pathways?species=9606` | Gen (UniProt) → Pathways mit stId, Name | großzügig | ✅ 200 |
| **mygene.info** | `GET https://mygene.info/v3/query?q=symbol:GALC&species=human&fields=symbol,name,uniprot,MIM,summary` | Symbol → UniProt-ID (Brücke zu Reactome), Gen-Summary | großzügig | ✅ 200 |
| **Monarch API v3** | `GET https://api-v3.monarchinitiative.org/v3/api/search?q=<text>` · `/association?object=MONDO:…&category=biolink:CausalGeneToDiseaseAssociation` · `/semsim/compare/MONDO:A/MONDO:B` | Suche über alle Vokabulare, Gen-Krankheit mit `primary_knowledge_source`, **fertige Phänotyp-Ähnlichkeit als Cross-Check** | großzügig | ✅ 200 |

## Patientenorganisationen: kuratiert, nicht gescrapt

Orphanet gibt Org-Daten nicht über Orphadata frei (Lizenzvertrag), NORD/Global Genes sind Websites ohne API, GARD-Seiten sind eine JS-App. Scraping kostet Stunden und ist rechtlich grau. **Entscheidung:** `data/curated/orgs.csv` von Hand, ~30 Orgs für den LSD-Cluster (Task O2, Osman), jede mit URL, Krankheit(en) als MONDO/ORPHA-ID, Assets (Register ja/nein, NHS ja/nein, Biobank, Kontaktseite), Prüfdatum. Der Brief nennt „verified group sites" ausdrücklich als Quelle. OpenAI **Reconcile** mappt die Freitext-Krankheitsnamen der Orgs auf MONDO-IDs. Im Honest-Gap-Screen steht die Coverage genau dieser Liste.

Startliste für Osman (Namen zum Verifizieren, keine URLs raten): National Gaucher Foundation · International Gaucher Alliance · National Niemann-Pick Disease Foundation (NNPDF) · Niemann-Pick UK · INPDR (Register) · Ara Parseghian Medical Research Fund · Hunter's Hope (Krabbe) · Krabbe Connect · MLD Foundation · United Leukodystrophy Foundation · ELA International · National MPS Society · MPS Society UK · Cure Sanfilippo Foundation · National Tay-Sachs & Allied Diseases Association (NTSAD) · Cure Tay-Sachs Foundation · Batten Disease Support & Research Association (BDSRA) · Beyond Batten · Fabry Support & Information Group · Fabry International Network · Acid Maltase Deficiency Association / International Pompe Association · Cystinosis Research Network · Cystinosis Research Foundation · ISMRD (Glycoproteinoses) · Wolman/LAL-D: LAL Solace · Mucolipidosis IV Foundation · Cure CLN2 / Noah's Hope · CDG CARE (Nachbar) · ULF.

## Lizenz-Zeile fürs README (Osman, Task O3)
HPO (frei mit Attribution, Köhler et al.) · MONDO CC-BY 4.0 · Orphanet/Orphadata CC-BY 4.0 · HPO-Annotationen enthalten OMIM-abgeleitete Daten (Attribution OMIM) · ClinVar, ClinicalTrials.gov, PubMed, RePORTER: US Public Domain · Open Targets CC0 · Reactome CC-BY 4.0 · Europe PMC: Open-Access-Teilmenge · Monarch CC-BY 4.0.
