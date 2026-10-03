# Hero-Pfad: Prüfliste für Recep (ca. 15 Minuten)

Datei zum Prüfen: `data/curated/hero_path_draft.yaml` (66 Einträge, alle `status: DRAFT`). Stand der Recherche: Sa 03.10.2026.

**So gehst du vor:** Öffne den Link und suche das Zitat mit Strg+F (der Anfang steht jeweils dabei), und prüf, ob die Seite es wörtlich zeigt und im Sinn des Claims sagt. Passt es, setzt du im Entwurf bei diesem Eintrag `status: DRAFT` auf `status: VERIFIED` (bei den OMIM-Einträgen zusätzlich `confidence: low` auf `high`) und hakst hier ab, und passt es nicht oder findest du es nicht, ändert du nichts und schreibst kurz in den Chat. Zum Schluss kopierst du alle VERIFIED-Einträge (von der Zeile `# E..` bis zur Leerzeile) nach `data/curated/hero_path.yaml` und ersetzt dort den Platzhalter von Schritt 1, dann die Git-Schritte aus WORKFLOW.md.

## Zeitplan

- **Block A, ca. 15 Min, Pflicht (17 Einträge):** Seiten, die ich als Bot nicht lesen konnte (OMIM, Orphanet, NCBI, HPO, Open Targets, HRSA) oder wo ein Urteil nötig ist (Negativ-Belege, UNBELEGT). Ohne dein Okay bleiben diese Einträge DRAFT.
- **Block B, ca. 5 Min Stichprobe (49 Einträge):** Ich habe die Seiten selbst geöffnet und das Zitat maschinell gegen den abgerufenen Text geprüft (alle wörtlich enthalten). Du prüfst mindestens diese 6: E13, E26, E29, E30, E36, E47. Stimmen alle sechs, setzt du alle Block-B-Einträge auf VERIFIED. Findest du einen Fehler, melde ihn im Chat, dann gehen wir Block B komplett durch.

## Block A: Pflicht

- [ ] **E03 · Schritt 1 · PMC PMC13528073**
  - Link: https://pmc.ncbi.nlm.nih.gov/articles/PMC13528073/
  - Sehen: Volltext, Suche (Strg+F) nach 'only available disease'. Zitat steht im Abschnitt zu Ergebnissen/Diskussion. Frage an dich: fällt dir ein zugelassenes Krabbe-Medikament ein? (FDA/EMA-Suche 'Krabbe' kurz überfliegen)
  - Zitat beginnt mit: „While HSCT is not curative it is currently the …“

- [ ] **E05 · Schritt 1 · ORPHA 487**
  - Link: https://www.orpha.net/en/disease/detail/487
  - Sehen: Kopf der Seite: 'Krabbe disease', ORPHAcode: 487; Abschnitt 'Disease definition': Zitat
  - Zitat beginnt mit: „A rare lysosomal disorder that affects the white matter …“

- [ ] **E07 · Schritt 2 · URL Gene:2581**
  - Link: https://www.ncbi.nlm.nih.gov/gene/2581
  - Sehen: Abschnitt 'Summary' der Gene-Seite: letzter Satz über Krabbe disease
  - Zitat beginnt mit: „Mutations in this gene have been associated with Krabbe …“

- [ ] **E08 · Schritt 2 · URL ClinVar VCV 4855581**
  - Link: https://www.ncbi.nlm.nih.gov/clinvar/variation/4855581/
  - Sehen: Variantenseite: Name, 'Germline classification: Pathogenic', Condition 'Galactosylceramide beta-galactosidase deficiency' (Link zu OMIM 245200 / Krabbe)
  - Zitat beginnt mit: „NM_000153.4(GALC):c.1670+2T>G“

- [ ] **E17 · Schritt 4 · OMIM 611722**
  - Link: https://omim.org/entry/611722
  - Sehen: Eintragstitel oben: 'KRABBE DISEASE, ATYPICAL, DUE TO SAPOSIN A DEFICIENCY' (Groß-/Kleinschreibung egal); Gen: PSAP
  - Zitat beginnt mit: „Krabbe disease, atypical, due to saposin A deficiency“
  - Zusätzlich: Gen **PSAP** auf der Seite? Dann `confidence: high`.

- [ ] **E18 · Schritt 4 · OMIM 249900**
  - Link: https://omim.org/entry/249900
  - Sehen: Eintragstitel oben: 'METACHROMATIC LEUKODYSTROPHY DUE TO SAPOSIN B DEFICIENCY'; Gen: PSAP
  - Zitat beginnt mit: „Metachromatic leukodystrophy due to saposin B deficiency“
  - Zusätzlich: Gen **PSAP** auf der Seite? Dann `confidence: high`.

- [ ] **E19 · Schritt 4 · OMIM 610539**
  - Link: https://omim.org/entry/610539
  - Sehen: Eintragstitel oben: 'GAUCHER DISEASE, ATYPICAL, DUE TO SAPOSIN C DEFICIENCY'; Gen: PSAP
  - Zitat beginnt mit: „Gaucher disease, atypical, due to saposin C deficiency“
  - Zusätzlich: Gen **PSAP** auf der Seite? Dann `confidence: high`.

- [ ] **E20 · Schritt 4 · URL ENSG00000197746**
  - Link: https://platform.opentargets.org/target/ENSG00000197746/associations
  - Sehen: Tab 'Associated diseases' für PSAP: obere Zeilen = Gaucher/SapC, Krabbe/SapA, combined PSAP deficiency; weiter unten MLD und Gaucher disease
  - Zitat beginnt mit: „Gaucher disease due to saposin C deficiency“

- [ ] **E23 · Schritt 5 · URL OMIM:245200 | OMIM:250100**
  - Link: https://hpo.jax.org/browse/disease/OMIM:250100
  - Sehen: Beide Seiten (OMIM:245200 und OMIM:250100) öffnen und in der Phänotypliste 'Peripheral demyelination' und 'Optic atrophy' finden (Strg+F)
  - Zitat beginnt mit: „Peripheral demyelination“

- [ ] **E25 · Schritt 6 · EMA EMEA/H/C/005321**
  - Link: https://www.ema.europa.eu/en/documents/assessment-report/libmeldy-epar-public-assessment-report_en.pdf
  - Sehen: PDF öffnen, Strg+F 'appropriate comparator' → Absatz zu Scientific Advice 2009
  - Zitat beginnt mit: „The SAWP also agreed that untreated MLD patients from …“

- [ ] **E37 · Schritt 7 · URL HHS letter 2024-07-01**
  - Link: https://www.hrsa.gov/sites/default/files/hrsa/advisory-committees/heritable-disorders/reports-recommendations/infantile-krabbe-final-response.pdf
  - Sehen: 1. Seite des Briefs: Datum 'July 1, 2024' und Absatz 2 'I accept the Committee’s recommendation ...'
  - Zitat beginnt mit: „I accept the Committee’s recommendation to expand the RUSP …“
  - Falls hrsa.gov dich blockt: Kopie https://web.archive.org/web/20251014221931/https://www.hrsa.gov/sites/default/files/hrsa/advisory-committees/heritable-disorders/reports-recommendations/infantile-krabbe-final-response.pdf

- [ ] **E39 · Schritt 7 · NCT NCT05739643**
  - Link: https://clinicaltrials.gov/study/NCT05739643
  - Sehen: URL-Test: clinicaltrials.gov/study/NCT04693598 öffnen: du landest bei NCT05739643 ('Gene Transfer Clinical Trial for Infantile and Late Infantile Krabbe Disease Treated Previously With HSCT'); Brief Summary = Zitat
  - Zitat beginnt mit: „This is a non-blinded, non-randomized dose escalation study of …“
  - Zweiter Link zum Testen (soll umleiten): https://clinicaltrials.gov/study/NCT04693598

- [ ] **E41 · Schritt 7 · URL ÖNGS Erkrankungen (MedUni Wien)**
  - Link: https://kinder-jugendheilkunde.meduniwien.ac.at/unsere-abteilungen/klinische-abteilung-fuer-paediatrische-pulmologie-allergologie-und-endokrinologie/neugeborenen-screening/erkrankungen/
  - Sehen: Strg+F 'Krabbe' → 0 Treffer; oberster Absatz mit Zahl (2 Hormonstörungen, 25 Stoffwechselkrankheiten ...)
  - Zitat beginnt mit: „Im Rahmen des Neugeborenen-Screenings werden derzeit zwei Hormonstörungen, 25 …“

- [ ] **E56 · Schritt 9 · UNBELEGT**
  - Claim: The MLD Foundation is a suitable partner to adopt NHS design and GMFC-MLD for Krabbe disease (Action Card proposal).
  - Entscheidung/Check: Kein Link zu prüfen. Entscheidung: Soll die Action Card die MLD Foundation als Methodengeber (statt als Empfänger) adressieren? Satz auf mld.foundation/about-us: 'specifically focused on MLD'

- [ ] **E58 · Schritt 9 · UNBELEGT**
  - Claim: GMFC-MLD has been validated as a motor endpoint in Krabbe disease.
  - Entscheidung/Check: Optional: PubMed-Suche selbst wiederholen und schauen, ob dir ein Krabbe-GMFC-Paper auffällt.

- [ ] **E65 · Schritt 10 · URL OMIM:312080 | OMIM:245200**
  - Link: https://hpo.jax.org/browse/disease/OMIM:312080
  - Sehen: Seite OMIM:312080 öffnen, 'CNS hypomyelination' finden; Seite OMIM:245200 öffnen, 'CNS demyelination' finden
  - Zitat beginnt mit: „CNS hypomyelination“

- [ ] **E66 · Schritt 10 · URL P60201**
  - Link: https://reactome.org/ContentService/data/mapping/UniProt/P60201/pathways?species=9606
  - Sehen: Link öffnen (zeigt JSON-Fehlermeldung 'No pathways found for UniProt:P60201'). Optional: reactome.org, Suche 'PLP1'
  - Zitat beginnt mit: „No pathways found for UniProt:P60201“

## Block B: Stichprobe (mindestens E13, E26, E29, E30, E36, E47)

- [ ] **E01 · Schritt 1 · PMID 20301416** — https://pubmed.ncbi.nlm.nih.gov/20301416/
  - Sehen: Abschnitt MANAGEMENT im Abstract: Zeile 'Targeted therapy: Hematopoietic stem cell transplantation (HSCT) ...'. Zitat beginnt mit: „Targeted therapy: Hematopoietic stem cell transplantation (HSCT) …“
- [ ] **E02 · Schritt 1 · PMID 15901860** — https://pubmed.ncbi.nlm.nih.gov/15901860/
  - Sehen: Abstract, Abschnitt CONCLUSIONS (letzte zwei Sätze). Zitat beginnt mit: „Transplantation of umbilical-cord blood from unrelated donors …“
- [ ] **E04 · Schritt 1 · PMC PMC12870309** — https://pmc.ncbi.nlm.nih.gov/articles/PMC12870309/
  - Sehen: Volltext, Suche nach 'only established disease-modifying'. Zitat beginnt mit: „Regarding treatment, the only established disease-modifying therapy …“
- [ ] **E06 · Schritt 2 · URL P54803** — https://www.uniprot.org/uniprotkb/P54803/entry
  - Sehen: Reiter 'Disease & Variants' → 'Krabbe disease', Querverweis MIM:245200. Zitat beginnt mit: „An autosomal recessive disorder characterized by insufficient …“
- [ ] **E09 · Schritt 3 · URL R-HSA-1606564** — https://reactome.org/content/detail/R-HSA-1606564
  - Sehen: Summation-Text der Reaktion; oben Pfad 'Glycosphingolipid catabolism'. Zitat beginnt mit: „Defects in GALC are the cause of …“
- [ ] **E10 · Schritt 3 · URL R-HSA-9840310** — https://reactome.org/content/detail/R-HSA-9840310
  - Sehen: Pathway-Seite, Beschreibung (Summation) letzter Satz. Zitat beginnt mit: „Lack of any participating enzyme or cofactor …“
- [ ] **E11 · Schritt 3 · PMC PMC8633897** — https://pmc.ncbi.nlm.nih.gov/articles/PMC8633897/
  - Sehen: Einleitung (Introduction), 1. Absatz. Zitat beginnt mit: „The absence of GALC results in the …“
- [ ] **E12 · Schritt 3 · PMC PMC8633897** — https://pmc.ncbi.nlm.nih.gov/articles/PMC8633897/
  - Sehen: Abschnitt zu Psychosine/zellulären Zielen; Strg+F 'Psychosine-mediated loss'. Gegen-Satz: Strg+F 'independent of oligodendrocytes'. Zitat beginnt mit: „Psychosine-mediated loss of oligodendrocytes and Schwann cells …“
- [ ] **E13 · Schritt 4 · PMID 31439510** ★ — https://pubmed.ncbi.nlm.nih.gov/31439510/
  - Sehen: Abstract, 2. Satz. Zitat beginnt mit: „Deficiency of saposin A leads to a …“
- [ ] **E14 · Schritt 4 · PMID 19267410** — https://pubmed.ncbi.nlm.nih.gov/19267410/
  - Sehen: Abstract, Mitte: 'SapB-d, who presented with a metachromatic leukodystrophy-like disorder'. Zitat beginnt mit: „the other with SapB-d, who presented with …“
- [ ] **E15 · Schritt 4 · PMID 22652185** — https://pubmed.ncbi.nlm.nih.gov/22652185/
  - Sehen: Abstract, 6. Satz ('In humans, saposin C deficiency ...'). Zitat beginnt mit: „In humans, saposin C deficiency due to …“
- [ ] **E16 · Schritt 4 · URL P07602** — https://www.uniprot.org/uniprotkb/P07602/entry
  - Sehen: Function-Abschnitt; dann 'Disease & Variants': vier Krankheiten mit MIM-Nummern 611721, 249900, 610539, 611722. Zitat beginnt mit: „They are derived from a common precursor …“
- [ ] **E21 · Schritt 5 · URL P15289** — https://www.uniprot.org/uniprotkb/P15289/entry
  - Sehen: 'Disease & Variants' → 'Metachromatic leukodystrophy', MIM:250100. Zitat beginnt mit: „An autosomal recessive disease caused by abnormal …“
- [ ] **E22 · Schritt 5 · URL R-HSA-9840310** — https://reactome.org/content/detail/R-HSA-9840310
  - Sehen: Pathway-Seite, Inhaltsverzeichnis/Hierarchie der Reaktionen: Zeilen 'GALC hydrolyzes GalCer' und 'ARSA removes sulfate from PSAP(195-273):Sulfatide' suchen (Strg+F). Zitat beginnt mit: „GALC hydrolyzes GalCer“
- [ ] **E24 · Schritt 6 · EMA EMEA/H/C/005321** — https://www.ema.europa.eu/en/medicines/human/EPAR/libmeldy
  - Sehen: Seite scrollen bis 'Other information about Libmeldy'. Zitat beginnt mit: „Libmeldy received a marketing authorisation valid throughout …“
- [ ] **E26 · Schritt 6 · EMA EMEA/H/C/005321** ★ — https://www.ema.europa.eu/en/documents/overview/libmeldy-epar-medicine-overview_en.pdf
  - Sehen: Seite 2 des PDF, Abschnitt 'What benefits ...', Zahlen 72.5 / 7.4 / 76.5 / 36.3. Zitat beginnt mit: „was 72.5 in the group with late …“
- [ ] **E27 · Schritt 6 · FDA Lenmeldy (BLA), press release 2024-03-18** — https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapy-children-metachromatic-leukodystrophy
  - Sehen: Erster Absatz nach 'For Immediate Release: March 18, 2024'. Zitat beginnt mit: „Today, the U.S. Food and Drug Administration …“
- [ ] **E28 · Schritt 6 · FDA Lenmeldy (BLA), press release 2024-03-18** — https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapy-children-metachromatic-leukodystrophy
  - Sehen: Absatz 'The safety and effectiveness of Lenmeldy was assessed ...'. Zitat beginnt mit: „Children who received treatment with Lenmeldy were …“
- [ ] **E29 · Schritt 6 · PMID 35065785** ★ — https://pubmed.ncbi.nlm.nih.gov/35065785/
  - Sehen: Abstract, METHODS: '...compared with an untreated natural history (NHx) cohort of 31 patients ...'. Zitat beginnt mit: „compared with an untreated natural history (NHx) …“
- [ ] **E30 · Schritt 7 · NCT NCT04628364** ★ — https://clinicaltrials.gov/study/NCT04628364
  - Sehen: Study Overview → Brief Summary, 1. Aufzählungspunkt; rechts 'Sponsor: National Organization for Rare Disorders', 'Collaborators: FDA'. Zitat beginnt mit: „Design and implement a natural history study …“
- [ ] **E31 · Schritt 7 · PMID 21707604** — https://pubmed.ncbi.nlm.nih.gov/21707604/
  - Sehen: Abstract METHOD: 'Fifty-nine patients ... German LEUKONET', letzter Satz METHOD zur GMFC. Zitat beginnt mit: „Gross motor function was assessed using the …“
- [ ] **E32 · Schritt 7 · PMC PMC10946116** — https://pmc.ncbi.nlm.nih.gov/articles/PMC10946116/
  - Sehen: Strg+F 'seven categories' im Volltext. Zitat beginnt mit: „It has seven categories representing clinically relevant …“
- [ ] **E33 · Schritt 7 · NCT NCT03333200** — https://clinicaltrials.gov/study/NCT03333200
  - Sehen: Brief Summary; Bereich 'Conditions' zeigt MLD + Krabbe Disease + Pelizaeus-Merzbacher Disease. Zitat beginnt mit: „The purpose of this study is to …“
- [ ] **E34 · Schritt 7 · URL mld.foundation/about-us** — https://mld.foundation/about-us/
  - Sehen: Seite 'About Us', 1. Absatz. Zitat beginnt mit: „MLD Foundation was formed in May 2001 …“
- [ ] **E35 · Schritt 7 · PMID 41283365** — https://pubmed.ncbi.nlm.nih.gov/41283365/
  - Sehen: Abstract, Strg+F 'Nationwide NBS'. Zitat beginnt mit: „Nationwide NBS for MLD is currently carried …“
- [ ] **E36 · Schritt 7 · URL krabbeconnect NBS-Seite** ★ — https://krabbeconnect.org/krabbe-disease/krabbe-disease-newborn-screening/
  - Sehen: Abschnitt 'Which states currently screen newborns for Krabbe disease?': Satz 'Currently there are 18 states' + Tabelle mit NY 2006 zuerst. Zitat beginnt mit: „Currently there are 18 states screening for …“
- [ ] **E38 · Schritt 7 · URL huntershope.org/about-us** — https://www.huntershope.org/about-us/
  - Sehen: Seite 'About Us', 1. Absatz. Zitat beginnt mit: „Hunter’s Hope was established in 1997 by …“
- [ ] **E40 · Schritt 7 · NCT NCT02993796** — https://clinicaltrials.gov/study/NCT02993796
  - Sehen: Brief Summary; Sponsor 'State University of New York at Buffalo'; Status 'Recruiting'. Zitat beginnt mit: „The purpose of this study is to …“
- [ ] **E42 · Schritt 7 · URL ÖNGS Erkrankungen (MedUni Wien)** — https://kinder-jugendheilkunde.meduniwien.ac.at/unsere-abteilungen/klinische-abteilung-fuer-paediatrische-pulmologie-allergologie-und-endokrinologie/neugeborenen-screening/erkrankungen/
  - Sehen: Gleiche Seite, Satz 2 im obersten Absatz: 'Seit Dezember 2024 ...'. Zitat beginnt mit: „Seit Dezember 2024 screenen wir im Rahmen …“
- [ ] **E43 · Schritt 7 · URL MedUni Wien Presseinformation 2026-06-24** — https://www.meduniwien.ac.at/web/fileadmin/content/presseservice/presseaussendungen/pdf_2026/PA_60_Jahre_Neugeborenen-Screening_de.pdf
  - Sehen: Abschnitt 'Programm wird kontinuierlich erweitert und verbessert', 2. Absatz (beginnt 'Seither wird ...'): 'Heute umfasst das Programm mehr als 30 Krankheitsbilder'. Zitat beginnt mit: „Heute umfasst das Programm mehr als 30 …“
- [ ] **E44 · Schritt 8 · PMID 15901860** — https://pubmed.ncbi.nlm.nih.gov/15901860/
  - Sehen: Autorenzeile: 'Escolar ML ... Kurtzberg J'. Zitat beginnt mit: „Transplantation of umbilical-cord blood in babies with …“
- [ ] **E45 · Schritt 8 · PMID 28855403** — https://pubmed.ncbi.nlm.nih.gov/28855403/
  - Sehen: Autorenzeile endet mit 'Escolar ML'. Zitat beginnt mit: „Developmental outcomes of cord blood transplantation for …“
- [ ] **E46 · Schritt 8 · PMID 35042231** — https://pubmed.ncbi.nlm.nih.gov/35042231/
  - Sehen: Autorenzeile endet mit 'Kurtzberg J'. Zitat beginnt mit: „Benefits of newborn screening and hematopoietic cell …“
- [ ] **E47 · Schritt 8 · PMID 23348427** ★ — https://pubmed.ncbi.nlm.nih.gov/23348427/
  - Sehen: Autorenzeile: 'Kurtzberg J' an 4. Stelle, 'Escolar ML' zuletzt. Zitat beginnt mit: „Neurodevelopmental outcomes of umbilical cord blood transplantation …“
- [ ] **E48 · Schritt 8 · PMID 38964050** — https://pubmed.ncbi.nlm.nih.gov/38964050/
  - Sehen: Autorenzeile: 'Krägeloh-Mann I(45)' und 'Escolar ML(48)'. Zitat beginnt mit: „Developmental delay can precede neurologic regression in …“
- [ ] **E49 · Schritt 8 · PMID 35065771** — https://pubmed.ncbi.nlm.nih.gov/35065771/
  - Sehen: Ein Autor: 'Kurtzberg J'; 'Comment on Lancet 2022 ... 372-383'. Zitat beginnt mit: „Gene therapy offers new hope for children …“
- [ ] **E50 · Schritt 8 · PMID 32912261** — https://pubmed.ncbi.nlm.nih.gov/32912261/
  - Sehen: Autorenzeile: 2. Autorin 'Krägeloh-Mann I'. Zitat beginnt mit: „Natural history of Krabbe disease - a …“
- [ ] **E51 · Schritt 8 · PMID 28109651** — https://pubmed.ncbi.nlm.nih.gov/28109651/
  - Sehen: Autorenzeile beginnt mit 'Krägeloh-Mann I'. Zitat beginnt mit: „Late onset Krabbe disease due to the …“
- [ ] **E52 · Schritt 8 · PMID 21707604** — https://pubmed.ncbi.nlm.nih.gov/21707604/
  - Sehen: Autorenzeile: 'Krägeloh-Mann I' an 4. Stelle. Zitat beginnt mit: „The natural course of gross motor deterioration …“
- [ ] **E53 · Schritt 8 · PMID 20571983** — https://pubmed.ncbi.nlm.nih.gov/20571983/
  - Sehen: Autorenzeile: 'Gieselmann V, Krägeloh-Mann I'. Zitat beginnt mit: „Metachromatic leukodystrophy--an update.“
- [ ] **E54 · Schritt 8 · URL mld.foundation/about-us** — https://mld.foundation/about-us/
  - Sehen: Abschnitt 'Medical & Scientific Advisory Board', Eintrag 'Dr. Maria Escolar'. Zitat beginnt mit: „Dr. Maria Escolar …“
- [ ] **E55 · Schritt 8 · PMID 39499628** — https://pubmed.ncbi.nlm.nih.gov/39499628/
  - Sehen: Ganz unten im Abstract-Block: 'Conflict of interest statement: MLE is the Chief Medical Officer at Forge Biologics ...'. Zitat beginnt mit: „MLE is the Chief Medical Officer at …“
- [ ] **E57 · Schritt 9 · PMID 37461315** — https://pubmed.ncbi.nlm.nih.gov/37461315/
  - Sehen: Abstract, letzter Satz. Zitat beginnt mit: „GMFC-MLD shows a strong correlation with GMFCS-ER …“
- [ ] **E59 · Schritt 9 · PMID 32912261** — https://pubmed.ncbi.nlm.nih.gov/32912261/
  - Sehen: Abstract METHODS, 4. Satz. Zitat beginnt mit: „MRI was assessed using the scoring system …“
- [ ] **E60 · Schritt 9 · PMID 23348427** — https://pubmed.ncbi.nlm.nih.gov/23348427/
  - Sehen: Abstract, Mitte. Zitat beginnt mit: „To evaluate whether signal intensity abnormalities on …“
- [ ] **E61 · Schritt 9 · PMID 33832819** — https://pubmed.ncbi.nlm.nih.gov/33832819/
  - Sehen: Abstract RESULTS, 1. Satz. Zitat beginnt mit: „Infants identified by newborn screening with possible …“
- [ ] **E62 · Schritt 10 · URL P60201** — https://www.uniprot.org/uniprotkb/P60201/entry
  - Sehen: 'Disease & Variants' → 'Leukodystrophy, hypomyelinating, 1', MIM:312080. Zitat beginnt mit: „An X-linked recessive disorder of the central …“
- [ ] **E63 · Schritt 10 · PMC PMC9313024** — https://pmc.ncbi.nlm.nih.gov/articles/PMC9313024/
  - Sehen: Einleitung (Introduction), 1. Absatz: Satz 'Therefore, Pelizaeus–Merzbacher Disease (PMD) became the prototype ...'. Zitat beginnt mit: „Pelizaeus–Merzbacher Disease (PMD) became the prototype of …“
- [ ] **E64 · Schritt 10 · PMID 20301361** — https://pubmed.ncbi.nlm.nih.gov/20301361/
  - Sehen: Abstract, CLINICAL CHARACTERISTICS, 1. Satz. Zitat beginnt mit: „PLP1-related disorders of central nervous system myelin …“

## Was sich gegenüber SCOPE und MEDICAL-BACKGROUND geändert hat

- **NCT04693598 und NCT05739643 sind derselbe Datensatz.** ClinicalTrials.gov leitet NCT04693598 per 301 auf NCT05739643 um (Alias). Der Datensatz heißt 'REKLAIM', Sponsor Forge Biologics, Start 03.02.2023 (MEDICAL-BACKGROUND nennt 'RESKUE, Start 05.11.2021'), Status ACTIVE_NOT_RECRUITING, geplantes Ende 11/2026, 9 Teilnehmer geplant. Im Produkt NCT05739643 verwenden, beide IDs notiert (E39). Das Langzeit-Follow-up NCT06308718 ist TERMINATED (2 Teilnehmer).
- **HOME-Studie NCT04628364:** Sponsor NORD, Collaborator FDA, nicht Orchard (E30). Bestätigt.
- **Krabbe-Studie PMID 32912261 (Krieg 2020):** Krägeloh-Mann ist 2. von 7 Autoren; sie steht auch auf GMFC-MLD (PMID 21707604, 4. von 5). Damit hat sie 2 Krabbe-PMIDs (32912261, 28109651) und 2 MLD-PMIDs (21707604, 20571983). Zusätzlich steht sie mit Escolar auf demselben MLD-Paper (PMID 38964050).
- **RUSP:** Der HHS-Secretary hat den Vorschlag am 01.07.2024 angenommen (Brief im Original, E37). Die KrabbeConnect-Seite spricht noch im Konjunktiv ('if the Secretary adds ...'), ist also veraltet; Zahl 18 Staaten steht dort trotzdem (E36). Gilt nur für infantile Krabbe (GALC niedrig und Psychosin ≥ 10 nM); Staaten müssen nicht screenen.
- **MLD-Screening ist nicht nur 'Pilot':** Norwegen national seit 2024; Illinois, Minnesota und Pennsylvania haben MLD in ihr Panel beschlossen; Deutschland und Österreich laufen als Projekt (E35, E42). MEDICAL-BACKGROUND §4 schreibt 'kein Regelscreening in USA/DE', das ist zu grob.
- **Escolar ist CMO bei Forge Biologics** (Sponsor von FBX-101), seit 02/2022, mit >5 % Beteiligung laut ihrer eigenen COI-Angabe (E55). MEDICAL-BACKGROUND nennt sie nur 'Prüfärztin'.
- **PBKR03 (NCT04771416):** Sponsor ist inzwischen Gemma Biotherapeutics (nicht mehr Passage Bio), Status weiterhin SUSPENDED. **NCT00983879** gehört Zymenex/Chiesi (6 Patienten, 2014 abgeschlossen), nicht Pittsburgh.
- **Reactome nennt MLD-Saposin-B als 'MIM:249290'** (Zahlendreher). Richtig ist 249900 (UniProt, HPO, Orphanet). Prüfen in E18.
- **Phänotyp-Überlappung (Schritt 5 und 10):** Gezählt über exakte HPO-Terme teilt PMD mit MLD 9 Terme, Krabbe mit MLD nur 6 (Krabbe mit PMD ebenfalls 6). Der Satz 'überlappende HPO-Phänotype Krabbe↔MLD' trägt also nur über die IC-gewichtete Ähnlichkeit aus 07_analytics, nicht über diese Zählung (E23, E65).
- **Pfad-Annahme PLP1 'Pathway-Overlap = 0':** PLP1 hat in Reactome gar keine Pathway-Annotation (E66). Das ist 'nicht annotiert', kein Beleg für einen anderen Mechanismus; der Mechanismus-Beleg sind E62 bis E64.
- **Krabbe 'keine zugelassene Therapie':** Nur als Negativ-Beleg abgesichert (zwei Fachartikel von 2026, ClinicalTrials.gov, Websuche), siehe E03/E04. Im Produkt als 'to our knowledge' formulieren.

## Noras Frage: Gibt es in Österreich ein Neugeborenen-Screening auf Krabbe?

Nein. Die offizielle Liste des Österreichischen Neugeborenen-Screenings (MedUni Wien/AKH Wien, im Auftrag des Wissenschaftsministeriums) führt Krabbe nicht (E41). Auf der Liste stehen 2 Hormonstörungen, 25 Stoffwechselkrankheiten, Cystische Fibrose, projektbasiert seit 07.06.2021 SCID und SMA, und seit Dezember 2024 als Forschungsprojekt MLD (E42). Das ist für Noras Story brauchbar: Wien screent auf MLD, nicht auf Krabbe.

## Offene Entscheidungen für Hanno (kein Check für Recep)

- **Schritt 9 (E56):** Die Action Card schlägt vor, der MLD Foundation die Adaption für Krabbe vorzuschlagen. Die Stiftung schreibt auf ihrer About-Seite 'we are specifically focused on MLD in all aspects of our work'. Besser wäre vielleicht: MLD Foundation als Methodengeber, Hunter's Hope / KrabbeConnect / das Buffalo-Register (NCT02993796) als Empfänger. Das ist ein Vorschlag, kein Beleg.
- **Schritt 9 (E58):** Eine Validierung der GMFC-MLD-Skala für Krabbe habe ich nicht gefunden (UNBELEGT). Belegt ist nur der Einsatz bei TUBB4A-Leukodystrophie (E57). Die Action Card sollte die Skala als offene Expertenfrage zeigen, wie im Entwurf schon vorgesehen.

## Was ich nicht selbst öffnen konnte (Transparenz)

- OMIM (alle Seiten, HTTP 403), Orphanet (JS-Schranke), NCBI-Seiten inkl. GeneReviews-Volltext (reCAPTCHA), hrsa.gov (403, gelesen über Wayback-Kopie), HPO- und Open-Targets-Weboberfläche (JS). Ersatz: UniProt-, Reactome-, PubMed-, ClinicalTrials.gov-, Orphadata- und HPO-Rohdaten, die dieselben Namen und Texte tragen.
- Nicht geöffnet: FDA Summary Basis for Regulatory Action zu Lenmeldy, Kehrer-2011-Volltext, NIH RePORTER (SCOPE nennt es in Schritt 7, ich habe dazu keinen Eintrag).

Alles gucci, wenn Block A abgehakt ist und die VERIFIED-Einträge in `hero_path.yaml` stehen.
