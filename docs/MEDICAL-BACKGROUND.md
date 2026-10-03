# Medizinischer Hintergrund: Krabbe, MLD, PSAP und der Mechanismus-Cluster

Für drei Informatiker ohne Medizinhintergrund. Jede Faktenaussage trägt eine Quelle (OMIM, PMID, ORPHA, EMA/FDA, URL). Stand der Recherche: 03.10.2026. Was nicht belegbar war, ist mit ⚠️ markiert oder weggelassen. Vollständige URL-Liste am Ende.

**Nomenklatur:** OMIM = Katalog Gen↔Krankheit (Johns Hopkins), 6-stellige Nummer. ORPHA = Orphanet-Krankheits-ID. PMID = PubMed-Artikel-ID. NCT = ClinicalTrials.gov-Studien-ID.

---

## 1. Lysosomale Speicherkrankheiten (LSD) in 10 Sätzen

1. Das Lysosom ist das Recycling-Organell der Zelle: ein saures Kompartiment mit ~60 Hydrolasen, das Lipide, Zucker und Proteine in ihre Bausteine zerlegt.
2. Fällt eine dieser Hydrolasen (oder ein Hilfsprotein/Transporter) genetisch aus, bleibt ihr Substrat liegen und sammelt sich in der Zelle an – das ist ein „Speicherdefekt".
3. LSDs sind deshalb ein **Mechanismus-Cluster**: dieselbe Logik (Enzym fehlt → Substrat akkumuliert → Zelltyp stirbt), nur mit anderem Enzym und anderem Substrat – Platt et al. 2018 (PMID 30275469).
4. Welche Zellen leiden, hängt vom Substrat ab: Myelin-Lipide → weiße Substanz (Leukodystrophie), Glucosylceramid → Makrophagen in Milz/Leber/Knochen (Gaucher).
5. Es gibt über 70 LSDs, zusammen ca. 1 : 5.000 Lebendgeburten (Platt 2018, PMID 30275469).
6. **ERT (Enzymersatztherapie):** rekombinantes Enzym per Infusion; Beispiel Imiglucerase (Cerezyme) für Gaucher Typ 1, FDA 1994. ERT passiert die Blut-Hirn-Schranke nicht – daher für Krabbe/MLD bisher kein Standard.
7. **SRT (Substratreduktion):** das Substrat wird gar nicht erst gebildet; Beispiel Miglustat (Zavesca), EU-Zulassung 20.11.2002 für Gaucher Typ 1 und Niemann-Pick C (EMA EPAR Zavesca).
8. **HSCT (hämatopoetische Stammzelltransplantation):** Spender-Blutstammzellen wandern als Mikroglia ins Hirn und liefern dort Enzym; Standard bei Hurler-Syndrom (MPS I) und präsymptomatischem Krabbe (Escolar 2005, PMID 15901860; MPS I: PMC7911293).
9. **Gentherapie:** eigene Stammzellen ex vivo per Lentivirus korrigiert (Libmeldy/Lenmeldy für MLD, EU 2020, FDA 2024) oder AAV direkt in den Körper (FBX-101 für Krabbe, Phase 1/2).
10. Für fast alle LSDs gilt: Therapie muss **vor** irreversiblem Zellverlust beginnen → deshalb Newborn Screening (NBS) und Natural-History-Daten so zentral.

---

## 2. Sphingolipidosen (Untergruppe der LSDs)

Sphingolipide = Membranlipide mit Sphingosin-Rückgrat; Myelin ist voll davon. Alle Einträge autosomal-rezessiv außer Fabry (X-chromosomal). ORPHA-IDs über EBI OLS4/ORDO verifiziert, OMIM über OMIM-Spiegel.

| Krankheit | Gen | Enzym / Protein | Akkumulierendes Substrat | ORPHA | OMIM |
|---|---|---|---|---|---|
| Krabbe (Globoidzell-Leukodystrophie) | GALC | Galactocerebrosidase | Galactosylceramid, **Psychosin** | 487 | 245200 |
| Metachromatische Leukodystrophie (MLD) | ARSA | Arylsulfatase A | Sulfatid (3-O-Sulfogalactosylceramid) | 512 | 250100 |
| Gaucher | GBA1 | β-Glucocerebrosidase | Glucosylceramid | 355 | 230800 (Typ 1) |
| Niemann-Pick A/B (ASMD) | SMPD1 | Saure Sphingomyelinase | Sphingomyelin | 77292 (A, infantil neuroviszeral) / 77293 (B, chronisch viszeral) | 257200 (A) / 607616 (B) |
| Niemann-Pick C | NPC1 (95 %), NPC2 | **kein Enzym** – Cholesterin-Transportprotein | unverestertes Cholesterin, Glykosphingolipide | 646 | 257220 (NPC1) |
| Fabry | GLA | α-Galaktosidase A | Globotriaosylceramid (Gb3) | 324 | 301500 |
| Tay-Sachs | HEXA | β-Hexosaminidase A | GM2-Gangliosid | 845 | 272800 |
| Sandhoff | HEXB | β-Hexosaminidase A + B | GM2-Gangliosid, Globosid | 796 | 268800 |

Hinweis fürs Produkt: Niemann-Pick C ist mechanistisch ein Transport-, kein Enzymdefekt – ein Graph, der nur „Enzym→Substrat" modelliert, ordnet NPC falsch ein. Tay-Sachs und Sandhoff sind klinisch kaum unterscheidbar (OMIM 268800) – zwei Namen, zwei Gene, ein Pathway.

---

## 3. Krabbe disease (Globoidzell-Leukodystrophie)

**Gen / Enzym.** GALC auf Chromosom 14q31 kodiert Galactocerebrosidase (GALC), die Galactosylceramid (Hauptbestandteil von Myelin) und Psychosin (Galactosylsphingosin) abbaut (OMIM 245200; GeneReviews NBK1238).

**Psychosin-Hypothese.** Nicht das Myelin-Lipid selbst, sondern das Nebenprodukt Psychosin gilt als toxisch: es tötet Oligodendrozyten (die Myelin-bildenden Zellen) und Schwann-Zellen → Demyelinisierung; charakteristische „Globoidzellen" (Makrophagen voll Galactosylceramid) im Gewebe. Konkurrierende Erklärung: Mikroglia-Hypothese. Beides offen (Übersicht PMC8633897). Psychosin in Trockenblut ist inzwischen der entscheidende Second-Tier-Biomarker im NBS (Escolar 2017, PMID 28579020).

**Formen.** Infantil (Beginn < 12 Monate), historisch 85–90 % der symptomatischen Fälle; spätere Formen (late-infantile 6 Mo–3 J, juvenil 3–8 J, adult bis in die 7. Dekade) 10–15 % – NBS-Daten deuten auf höheren Anteil später Formen (GeneReviews NBK1238; ORDO 206436/206443/206448).

**Symptome in Laiensprache.** Infantil: Baby entwickelt sich erst normal, dann ab ~3–6 Monaten extreme Reizbarkeit, Schreien, Steifheit, Fieber ohne Infekt, Verlust erlernter Fähigkeiten, Blindheit/Taubheit; mittlere Lebenserwartung 24 Monate (Spanne 8 Monate–9 Jahre; GeneReviews NBK1238). Späte Formen: Gangstörung, Sehverlust, Spastik, viel variabler.

**Prävalenz.** Ca. 1 : 100.000 Geburten (Orphanet 487; GeneReviews). NBS-Realität: New York + Missouri fanden in ~2,5 Mio. gescreenten Kindern (2006–2015) 5 bestätigte infantile Fälle (Orsini 2016, PMID 27638592) – d. h. die infantile Form ist seltener als die Lehrbuchzahl.

**Diagnostik.** GALC-Enzymaktivität in Leukozyten/Trockenblut → Psychosin → GALC-Sequenzierung; MRT (Demyelinisierung), Nervenleitgeschwindigkeit (GeneReviews NBK1238; Konsensus-Guideline Kwon et al. 2018, PMID 29391017).

**Newborn Screening (USA).** New York seit 07.08.2006 als erster Staat (Orsini 2016, PMID 27638592). Laut KrabbeConnect (Stand 2025) 18 Staaten: NY 2006, MO 2012, OH 2016, KY 2016, TN 2017, IL 2017, NJ 2019, IN 2020, GA 2021, PA 2021, SC 2023, MN 2024, MD/IA/TX/KS/NM/OR 2025 (krabbeconnect.org/krabbe-disease/newborn-screening; MN: Pressemitteilung MDH 26.02.2024). Hunter's Hope nennt „19 Staaten" (Stand 07/2024) – Zählweise differiert ⚠️. **RUSP:** Das Bundes-Beratungsgremium ACHDNC stimmte am 30.01.2024 für die Aufnahme (HRSA chair letter); der HHS-Secretary hat Krabbe 2024 in den Recommended Uniform Screening Panel aufgenommen (Datum 01.07.2024 laut Pressemitteilung Rep. Langworthy ⚠️ Primärquelle HHS nicht abgerufen).

**Newborn Screening (Österreich).** Kein Krabbe-Screening: Die Zielkrankheiten-Liste des österreichischen Neugeborenen-Screenings (MedUni Wien) nennt Krabbe nicht; MLD läuft dort seit Dezember 2024 als Forschungsprojekt (Seite undatiert, abgerufen 03.10.2026: https://kinder-jugendheilkunde.meduniwien.ac.at/unsere-abteilungen/klinische-abteilung-fuer-paediatrische-pulmologie-allergologie-und-endokrinologie/neugeborenen-screening/erkrankungen/). Für die Nora-Story: Österreich screent die Nachbarkrankheit MLD (Forschung), Krabbe nicht.

**Therapie-Status.**
- **HSCT nur präsymptomatisch:** Nabelschnurblut-Transplantation bei 11 asymptomatischen Neugeborenen (12–44 Tage alt): 100 % Überleben, bei 14 symptomatischen Säuglingen 43 % und kein neurologischer Nutzen (Escolar 2005, NEJM, PMID 15901860). 15-Jahres-Daten: Transplantation in den ersten 7 Lebenswochen verändert den Verlauf, heilt aber nicht – motorische Defizite bleiben (Wright 2017, Neurology, PMID 28855403).
- **Zugelassenes Medikament: keines.** Weltweit gibt es keine zugelassene medikamentöse Therapie für Krabbe; HSCT ist die einzige etablierte Option (GeneReviews NBK1238; Übersicht Frontiers Pediatrics 2021, 10.3389/fped.2021.764626).
- **Gentherapie-Trials:**
  - **FBX-101 (Forge Biologics):** AAVrh10-GALC i.v. nach HSCT. Die ursprüngliche Registrierung „RESKUE“ NCT04693598 leitet bei ClinicalTrials.gov per 301 auf **NCT05739643** um (Gentransfer bei infantilem/late-infantile Krabbe nach HSCT, Start 03.02.2023, active-not-recruiting; geprüft 03.10.2026). Langzeit-Follow-up NCT06308718: **terminated** (Start 06.08.2024). Erste 2 Patienten mit motorischer Entwicklung über Natural-History-Erwartung (Forge-PR 29.01.2024, BusinessWire). Maria Escolar ist CMO bei Forge (Sponsor) ⚠️ laut Hero-Draft, nicht selbst geöffnet.
  - **PBKR03 (ursprünglich Passage Bio, Sponsor laut ClinicalTrials.gov jetzt Gemma Biotherapeutics):** AAVhu68-GALC intra-cisterna magna, „GALax-C", NCT04771416 – **suspendiert** („changes in company strategy", ClinicalTrials.gov, Status SUSPENDED, geprüft 03.10.2026).

**Patientenorganisationen.**
- **Hunter's Hope Foundation** (huntershope.org): 1997 gegründet von NFL-Quarterback Jim Kelly (Buffalo Bills) und Jill Kelly, nachdem ihr Sohn Hunter (geb. 14.02.1997) mit infantilem Krabbe diagnostiziert wurde; Hunter starb am 05.08.2005 mit 8 Jahren (ESPN 2005; huntershope.org). Treiber des NY-Screenings 2006 und der RUSP-Aufnahme; jährliches Medical Symposium seit 2008 (Wadsworth Center).
- **KrabbeConnect** (krabbeconnect.org): 501(c)(3) seit 2017, gegründet von Stacy Pike-Langenfeld und Anne Rugari; Fokus Patienten-Daten, NBS-Tracking, Studien-Vermittlung.

**Register / Natural History.**
- Prospektive Single-Center-Naturverlaufsstudie Pittsburgh: 35 Patienten mit Beginn 6–36 Monate, Beobachtung 2000–2017 (Bascou 2018, PMID 30089515).
- Deutschlandweite Naturverlaufsstudie Krabbe mit klinischen und MRT-Daten, Tübingen (Krieg et al., Orphanet J Rare Dis 2020, PMID 32912261) — Koautorin I. Krägeloh-Mann steht auch auf der GMFC-MLD-Publikation (Kehrer 2011, PMID 21707604), also eine belegte Krabbe-MLD-Brücke.
- „Natural History of Infantile Globoid Cell Leukodystrophy" NCT00983879 (Sponsor Zymenex A/S, Start 09/2009, completed; geprüft 03.10.2026); Pittsburgh „Longitudinal Study of Neurodegenerative Disorders" NCT03333200 (deckt Krabbe + MLD, geplant 1.500 Patienten, Ende 2035).

---

## 4. Metachromatische Leukodystrophie (MLD)

**Gen / Enzym / Substrat.** ARSA (22q13) kodiert Arylsulfatase A; Ausfall → Sulfatid-Akkumulation in Oligodendrozyten, Schwann-Zellen, Nierenepithel; „metachromatisch" = Farbumschlag des Sulfatids in der Histologie (OMIM 250100; Orphanet 512). Seltene Variante: ARSA normal, aber Aktivator Saposin B defekt (OMIM 249900, siehe §5).

**Formen** (Orphanet-Subtypen): late-infantile (Beginn < 30 Monate, ORDO 309256), juvenil (30 Monate–16 Jahre, ORDO 309263), adult (> 16 Jahre, ORDO 309271). Prävalenz 1 : 40.000–160.000; Isolate deutlich höher (systematische Übersicht 2024, PMC10880320).

**Symptome in Laiensprache.** Late-infantile: Kind lernt laufen, verliert es wieder, Muskelschwäche, Steifheit, Schluckstörung, Sehverlust, Krampfanfälle; bei late-infantile MLD verlieren alle Kinder jede grobmotorische Funktion bis 3 J 4 Mo (Kehrer 2011, PMID 21707604). Juvenil/adult: Schulprobleme, Verhaltensänderung, Psychose-ähnliche Bilder, dann motorischer Abbau.

**Therapie – Libmeldy (EU) / Lenmeldy (US), atidarsagene autotemcel, OTL-200.**
- Prinzip: eigene CD34+-Blutstammzellen, ex vivo mit Lentivirus ARSA-Gen eingebaut, nach Chemo-Konditionierung zurückinfundiert; korrigierte Mikroglia liefern ARSA ins Hirn (EMA EPAR Libmeldy).
- **EU:** Zulassung 17.12.2020 (Orchard Therapeutics), Indikation late-infantile/early-juvenile ohne Symptome oder early-juvenile mit frühen Symptomen, noch selbstständig gehfähig, ohne kognitiven Abbau (EMA EPAR Libmeldy).
- **USA:** FDA 18.03.2024, erste Gentherapie für MLD, Priority Review + Orphan Drug (FDA-Pressemitteilung 18.03.2024).
- **Wie die Wirksamkeit belegt wurde – externer Kontrollarm:** kein Placebo-Arm. 29 behandelte Kinder (Phase 1/2 + Expanded Access) wurden mit einer **Natural-History-Kohorte von 31 unbehandelten, nach Alter und Subtyp gematchten Kindern** verglichen (Fumagalli et al., Lancet 2022, PMID 35065785). EMA-Zahlen: GMFM-Score 2 Jahre nach Therapie 72,5 vs. 7,4 bei unbehandelten late-infantile Kindern; early-juvenile 76,5 vs. 36,3 (EMA EPAR). FDA-Zahlen: 37 behandelte Kinder insgesamt, primärer Endpunkt „severe motor impairment-free survival"; alle präsymptomatisch behandelten late-infantile Kinder lebten mit 6 Jahren vs. 58 % in der Natural-History-Gruppe; 71 % gingen mit 5 Jahren ohne Hilfe; 85 % normale Sprache/IQ (FDA-Pressemitteilung 18.03.2024).
- **Lehre fürs Produkt:** Ohne die Natural-History-Kohorte gäbe es keine Zulassung. Die Kohorte stammt aus jahrelanger Beobachtung unbehandelter Kinder (Mailand/Tübingen).

**GMFC-MLD-Skala.** Gross Motor Function Classification für MLD, 7 Stufen (0 = normal bis 6 = Verlust jeder Bewegung/Kopfkontrolle), entwickelt in Tübingen am LEUKONET-Kollektiv (59 Patienten); Publikation Kehrer et al., Dev Med Child Neurol 2011, PMID 21707604. Wird als Endpunkt in Zulassung und Natural-History-Studien verwendet.

**MLD Natural History Study.** „HOME Study" NCT04628364 (Sponsor National Organization for Rare Disorders (NORD), Kooperationspartner FDA; beobachtend, 21 Patienten, 10/2020–03/2025, abgeschlossen; ClinicalTrials.gov, geprüft 03.10.2026); Tübinger LEUKONET-Kohorte (Kehrer 2011); Pittsburgh NCT03333200.

**Newborn Screening (Pilotprojekte, kein Regelscreening in USA/DE).**
- Deutschland, Screeningzentrum Hannover: seit 2021 prospektiver Pilot, dreistufig (Sulfatide → ARSA-Aktivität → Sequenzierung); 109.259 Screens, 3 positiv, alle 3 bestätigt (ICNA-Poster 2024; systematische Übersicht PMC12641716).
- USA, New York „ScreenPlus": 18.352 Säuglinge sulfatid-basiert (PMC12641716).
- Italien, Lombardei: Pilot seit Juni 2024, ~100.000 Neugeborene in 3 Jahren, Buzzi-Kinderkrankenhaus Mailand (Fondazione Telethon).
- Norwegen: landesweites MLD-NBS (PMC12641716).

**Patientenorganisationen.** **MLD Foundation** (mldfoundation.org), gegründet Mai 2001 in Oregon von Dean und Teryn Suhr nach der Erkrankung zweier Töchter (MLD Foundation „History"); aktiv in NBS-Politik und Zulassungsverfahren (ICER-Review). Weitere: ELA (Europa, elhks.de), United Leukodystrophy Foundation (ULF) ⚠️ nicht einzeln verifiziert.

---

## 5. PSAP / Prosaposin – das verbindende Gen

PSAP (OMIM 176801, Chromosom 10q22) kodiert ein Vorläuferprotein, das im Lysosom in vier kleine Aktivatorproteine zerschnitten wird: **Saposin A, B, C, D**. Saposine sind keine Enzyme – sie lösen Lipide aus der Membran und präsentieren sie dem jeweiligen Enzym. Fehlt der Aktivator, steht das Enzym ohne Substrat da – Phänotyp wie beim Enzymdefekt selbst, bei **normaler Enzymaktivität im Labor**.

| Defizienz | Phänotyp | OMIM | ORPHA |
|---|---|---|---|
| Saposin A | Krabbe-ähnlich („atypical Krabbe") – Regression ab ~3 Monaten, Dysmyelinisierung, GALC normal | 611722 | – |
| Saposin B | MLD-ähnlich – Sulfatid-Speicherung bei normaler ARSA | 249900 | – |
| Saposin C | Gaucher-ähnlich – Glucosylceramid-Speicherung bei normaler β-Glucosidase | 610539 | 309252 |
| Prosaposin komplett (alle vier) | schwere neonatale Enzephalopathie + Hepatosplenomegalie, < 10 Fälle weltweit | 611721 | 139406 |

Quellen: OMIM-Einträge (gespiegelt u. a. informatics.jax.org/disease/OMIM:611721, OMIM:610539); Orphanet 139406 „Encephalopathy due to prosaposin deficiency"; Wikipedia „Combined saposin deficiency" als Einstieg.

**Warum das die These „Namen verstecken Mechanismen" belegt:** Ein einziges Gen erzeugt – je nachdem, welcher Abschnitt mutiert ist – drei Krankheiten, die seit 100 Jahren unter drei verschiedenen Namen (Krabbe, MLD, Gaucher) in drei verschiedenen Patientengemeinschaften laufen. Die Kinder mit Saposin-A-Defekt haben klinisch Krabbe, fallen aber durch jeden GALC-Enzymtest und jede GALC-Sequenzierung – nur ein mechanismus-basierter Blick (Pathway Galactosylceramid-Abbau) findet sie. Umgekehrt heißt das: Krabbe-, MLD- und Gaucher-Gruppen teilen sich ein Gen, einen Pathway und potenziell Biomarker, Register-Designs und Gentherapie-Plattformen – ohne es anhand der Namen zu sehen.

---

## 6. Gegenbeispiel: Pelizaeus-Merzbacher-Krankheit (PLP1)

- X-chromosomale Leukodystrophie, Gen PLP1 (Proteolipid-Protein 1, Hauptprotein des ZNS-Myelins); 50–70 % Genduplikationen (OMIM 312080; Orphanet 702; MedlinePlus PLP1; GeneReviews „PLP1 Disorders" NBK1182).
- **Hypomyelinisierung, nicht Demyelinisierung:** Myelin wird von Anfang an nicht richtig gebildet – bei Krabbe/MLD wird vorhandenes Myelin zerstört. PMD ist der Prototyp der hypomyelinisierenden Leukodystrophien in Abgrenzung zu den demyelinisierenden (PMC9313024).
- **Nicht lysosomal:** kein Enzym, kein Substrat, keine Speicherung – ein Struktur-/Dosis-Problem des Oligodendrozyten.
- Phänotypisch ähnlich (Nystagmus, Hypotonie, Spastik, Entwicklungsverzögerung, weiße Substanz im MRT auffällig), aber: früherer Beginn (kongenital), Nystagmus als Leitsymptom, MRT zeigt diffus fehlendes statt zerstörtes Myelin.
- **Konsequenz fürs Produkt:** HSCT/Enzym-Gentherapie-Logik ist hier nicht übertragbar; wer Krabbe und PMD nur über HPO-Phänotypen clustert, zieht eine falsche Kante. Mechanismus-Ebene muss gewinnen.

---

## 7. Netzwerk-Overlap: Forschende mit Publikationen zu Krabbe UND MLD

Nur öffentlich belegte Autorenschaften (Europe PMC verifiziert):

| Person | Krabbe | MLD |
|---|---|---|
| **Maria L. Escolar** (Pittsburgh, zuvor UNC/Duke) | Escolar et al., NEJM 2005, PMID 15901860 (Erstautorin); Wright et al. 2017, PMID 28855403 | Martin et al., Biol Blood Marrow Transplant 2013, PMID 23348427 (Letztautorin) |
| **Joanne Kurtzberg** (Duke) | Escolar et al. 2005, PMID 15901860 (Letztautorin) | Martin et al. 2013, PMID 23348427 (Koautorin) |
| **Michael H. Gelb** (Univ. Washington, Biochemie/NBS-Assays) | Orsini et al., J Neurosci Res 2016, PMID 27638592 | Bekri et al., Mol Genet Metab 2024, PMID 38552449 (16:1-OH-Sulfatid NBS) |

Ergänzend: **Michele D. Poe** (Biostatistik) ist auf beiden Escolar-Arbeiten Koautor. Escolar ist zugleich Prüfärztin im FBX-101-Trial (CGTLive-Interview). Francesca Fumagalli / Alessandra Biffi (Mailand) sind MLD-zentriert – ein Krabbe-Paper wurde nicht verifiziert ⚠️.

---

## 8. „Natural-History-Study als externer Kontrollarm" in 8 Sätzen

1. Eine Natural-History-Studie beobachtet den Krankheitsverlauf **ohne** Intervention, von Beginn bis Auflösung oder Tod (FDA-Definition, Draft Guidance 03/2019).
2. Bei einer Krankheit mit 1 : 100.000 Geburten und tödlichem Verlauf im Kleinkindalter ist ein placebokontrollierter Arm weder rekrutierbar noch ethisch vertretbar.
3. Der externe Kontrollarm ersetzt das Placebo: behandelte Patienten werden mit historischen, nach Alter/Subtyp gematchten unbehandelten Patienten verglichen – genau so bei Libmeldy (29 behandelt vs. 31 Natural History; Fumagalli 2022, PMID 35065785).
4. Die FDA hat dafür die Draft Guidance „Rare Diseases: Natural History Studies for Drug Development" (März 2019, Docket FDA-2019-D-0481, 19 Seiten) veröffentlicht; sie beschreibt Studientypen (retrospektiv/prospektiv, Querschnitt/Längsschnitt), Common Data Elements und die Nutzung als externe Kontrolle. Stand 2026 weiterhin Draft, nicht finalisiert (FDA-Guidance-Seite).
5. Voraussetzung ist ein **standardisierter, validierter Endpunkt**, der in Kontrolle und Studie gleich gemessen wird – bei MLD die GMFC-MLD (Kehrer 2011, PMID 21707604), bei Krabbe standardisierte neuroentwicklungs-Protokolle (Bascou 2018).
6. Belastbare Daten brauchen Jahre: die Krabbe-Kohorte in Pittsburgh umfasst 35 Patienten aus 17 Jahren Beobachtung (2000–2017; Bascou 2018, PMID 30089515), die Tübinger MLD-Kohorte 59 Patienten aus einem nationalen Netzwerk (Kehrer 2011).
7. Eine allgemein gültige „typische Dauer bis belastbar" nennt die FDA-Guidance nicht ⚠️; faktisch liegen die zulassungsrelevanten Kohorten bei 30–60 Patienten über 10–17 Jahre.
8. **Daraus folgt die Produkt-These:** Eine Patientengruppe, die heute ein Register oder eine NHS startet, baut den Kontrollarm für die Zulassung in 10 Jahren – und wenn eine Nachbar-Community mit gleichem Mechanismus und gleichem Endpunkt (z. B. GMFC-MLD) schon eine hat, ist das der wertvollste wiederverwendbare Asset überhaupt.

---

## 9. Glossar

| Begriff | Eine Zeile |
|---|---|
| Phänotyp | Beobachtbares Merkmal/Symptom eines Patienten (im Gegensatz zum Genotyp). |
| HPO | Human Phenotype Ontology – standardisiertes Vokabular für Phänotypen mit IDs (z. B. HP:0001250 Krampfanfall). |
| Mechanismus | Die kausale Kette Gen → Protein → Zellfunktion → Gewebsschaden, die eine Krankheit erzeugt. |
| Pathway | Kette biochemischer Reaktionen (z. B. Sphingolipid-Abbau), in der mehrere Gene/Enzyme zusammenarbeiten. |
| Variante | Abweichung in der DNA-Sequenz gegenüber der Referenz; neutraler Begriff für „Mutation". |
| pathogen | Variante, die nach ACMG-Kriterien als krankheitsverursachend eingestuft ist (vs. benign, VUS). |
| ERT | Enzyme Replacement Therapy – fehlendes Enzym wird rekombinant hergestellt und infundiert. |
| SRT | Substrate Reduction Therapy – Medikament hemmt die Bildung des Substrats, das sich sonst speichert. |
| HSCT | Hematopoietic Stem Cell Transplantation – Blutstammzellen (Knochenmark/Nabelschnurblut) eines Spenders ersetzen das eigene blutbildende System. |
| AAV | Adeno-assoziiertes Virus – nicht-integrierender Gentherapie-Vektor für In-vivo-Gabe (FBX-101, PBKR03). |
| Lentivirus | Integrierender Vektor (HIV-abgeleitet) für Ex-vivo-Korrektur von Stammzellen (Libmeldy). |
| Natural History Study | Beobachtungsstudie des unbehandelten Krankheitsverlaufs über die Zeit. |
| Register | Strukturierte Langzeit-Sammlung von Patientendaten (Diagnose, Verlauf, Therapie), oft von Patientengruppen betrieben. |
| Biomarker | Messbare biologische Größe als Indikator für Krankheit/Verlauf/Therapieeffekt (z. B. Psychosin im Trockenblut). |
| Endpunkt | Vorab definierte Messgröße, an der Wirksamkeit in einer Studie beurteilt wird (z. B. GMFC-MLD ≥ Stufe 5). |
| externer Kontrollarm | Vergleichsgruppe außerhalb der Studie (historische/Natural-History-Patienten) statt randomisiertem Placebo. |
| Newborn Screening | Bevölkerungsweiter Test aus Trockenblut der Neugeborenen auf behandelbare Krankheiten; USA: RUSP als Empfehlungsliste. |
| Orphan Drug | Arzneimittel für seltene Krankheit: EU ≤ 5 / 10.000 Einwohner (VO 141/2000), USA < 200.000 Betroffene (Orphan Drug Act 1983); bringt Exklusivität/Anreize. |
| monogen | Durch Varianten in einem einzigen Gen verursacht (Krabbe, MLD, PSAP-Defizienzen). |
| autosomal-rezessiv | Beide Genkopien defekt nötig; Eltern meist gesunde Träger, 25 % Risiko pro Kind. |

---

## 10. Sprechzettel fürs Video (Englisch, wörtlich sagbar, alle belegt)

1. "Lysosomal storage diseases are a family of more than 70 disorders that share one mechanism: an enzyme is missing, its substrate piles up, and cells die." (Platt 2018, PMID 30275469)
2. "Krabbe disease and metachromatic leukodystrophy both destroy myelin, the insulation of our nerves, through exactly this logic – just with a different enzyme and a different lipid." (OMIM 245200, 250100)
3. "One gene, PSAP, sits behind three disease names at once: a Krabbe-like, an MLD-like and a Gaucher-like disorder, depending on which piece of the protein is broken." (OMIM 611722, 249900, 610539)
4. "Those children test normal for the Krabbe enzyme – only a mechanism-based view finds them. Names hide mechanisms." (OMIM 611722)
5. "For Krabbe disease there is still no approved drug anywhere in the world; the only established treatment is a stem-cell transplant, and it only works before symptoms start." (Escolar 2005, PMID 15901860; GeneReviews NBK1238)
6. "That is why 18 US states now screen every newborn for Krabbe, starting with New York in 2006, and why it was added to the federal screening panel in 2024." (KrabbeConnect; Orsini 2016, PMID 27638592; HRSA ACHDNC)
7. "For MLD, the neighbouring disease, a gene therapy was approved in Europe in December 2020 and by the FDA in March 2024." (EMA EPAR Libmeldy; FDA 18.03.2024)
8. "That approval had no placebo group. It was proven by comparing 29 treated children with 31 untreated children from a natural history cohort – years of carefully recorded disease course." (Fumagalli 2022, PMID 35065785)
9. "The same clinicians – Maria Escolar, Joanne Kurtzberg – have published on both Krabbe and MLD, yet the patient communities still build their registries separately." (PMID 15901860, 23348427)
10. "Constellate maps diseases by mechanism, so that a Krabbe family can see that the MLD community already holds the natural-history playbook they need – with every edge sourced and dated." (eigene Produktaussage, kein externer Beleg nötig)

---

## Quellen

**Übersichten / LSD**
- Platt FM et al. Lysosomal storage diseases. Nat Rev Dis Primers 2018. PMID 30275469 – https://pubmed.ncbi.nlm.nih.gov/30275469/
- Cerezyme (Imiglucerase) FDA 1994 – https://checkrare.com/fda-expands-indication-for-cerezyme-imiglucerase-to-treat-gaucher-disease-type-3/
- EMA EPAR Zavesca (Miglustat), EU-Zulassung 20.11.2002 – https://www.ema.europa.eu/en/medicines/human/EPAR/zavesca
- HSCT bei MPS I-Hurler als Standard – https://pmc.ncbi.nlm.nih.gov/articles/PMC7911293

**Krabbe**
- OMIM 245200 – https://www.omim.org/entry/245200
- Orphanet 487 (ORDO) – https://www.orpha.net/en/disease/detail/487
- GeneReviews Krabbe Disease (NBK1238) – https://www.ncbi.nlm.nih.gov/books/NBK1238/
- Psychosin-/Mikroglia-Hypothese, Übersicht – https://pmc.ncbi.nlm.nih.gov/articles/PMC8633897
- Escolar ML et al. NEJM 2005. PMID 15901860 – https://pubmed.ncbi.nlm.nih.gov/15901860/
- Wright MD et al. Neurology 2017. PMID 28855403 – https://pubmed.ncbi.nlm.nih.gov/28855403/
- Escolar ML et al. Psychosine marker. Mol Genet Metab 2017. PMID 28579020 – https://pubmed.ncbi.nlm.nih.gov/28579020/
- Bascou N et al. Natural history. Orphanet J Rare Dis 2018. PMID 30089515 – https://pubmed.ncbi.nlm.nih.gov/30089515/
- Orsini JJ et al. Newborn screening for Krabbe's disease. J Neurosci Res 2016. PMID 27638592 – https://pubmed.ncbi.nlm.nih.gov/27638592/
- Kwon JM et al. Consensus guidelines NBS Krabbe 2018. PMID 29391017 – https://pubmed.ncbi.nlm.nih.gov/29391017/
- KrabbeConnect NBS-Staatenliste – https://krabbeconnect.org/krabbe-disease/newborn-screening/
- Minnesota Dept. of Health, NBS Krabbe 26.02.2024 – https://www.health.state.mn.us/news/pressrel/2024/newborn022624.html
- HRSA ACHDNC Chair Letter Infantile Krabbe – https://www.hrsa.gov/sites/default/files/hrsa/advisory-committees/heritable-disorders/meetings/achdnc-chair-letter-secretary-infantile-krabbe.pdf
- Hunter's Hope ACHDNC/RUSP-Seite – https://www.huntershope.org/newborn-screening/achdnc/
- Rep. Langworthy, RUSP-Aufnahme – https://langworthy.house.gov/media/press-releases/congressman-nick-langworthy-celebrates-final-approval-krabbe-disease-screening
- FBX-101 RESKUE NCT04693598 – https://clinicaltrials.gov/study/NCT04693598
- FBX-101 nach HSCT NCT05739643 – https://clinicaltrials.gov/study/NCT05739643
- FBX-101 LTFU NCT06308718 – https://clinicaltrials.gov/study/NCT06308718
- Forge Biologics Update 29.01.2024 – https://www.businesswire.com/news/home/20240129951159/en/
- PBKR03 GALax-C NCT04771416 (suspendiert) – https://clinicaltrials.gov/study/NCT04771416
- Krabbe NHS NCT00983879 – https://clinicaltrials.gov/study/NCT00983879
- Pittsburgh Longitudinal Study NCT03333200 – https://clinicaltrials.gov/study/NCT03333200
- Hunter's Hope „Celebrating 20 Years of Hope" – https://www.huntershope.org/?p=152
- ESPN: Hunter Kelly dies at 8 (2005) – https://www.espn.com.sg/nfl/news/story?id=2125887
- KrabbeConnect About – https://krabbeconnect.org/about-us/
- Frontiers Pediatrics 2021, Krabbe-Therapieübersicht – https://www.frontiersin.org/journals/pediatrics/articles/10.3389/fped.2021.764626/full

**MLD**
- OMIM 250100 – https://www.omim.org/entry/250100
- Orphanet 512 (ORDO; Subtypen 309256/309263/309271) – https://www.orpha.net/en/disease/detail/512
- Birth prevalence systematic review 2024 – https://pmc.ncbi.nlm.nih.gov/articles/PMC10880320
- EMA EPAR Libmeldy (17.12.2020) – https://www.ema.europa.eu/en/medicines/human/EPAR/libmeldy
- FDA Press Release Lenmeldy (18.03.2024) – https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapy-children-metachromatic-leukodystrophy
- Fumagalli F et al. Lancet 2022. PMID 35065785 – https://pubmed.ncbi.nlm.nih.gov/35065785/
- Kehrer C et al. GMFC-MLD. Dev Med Child Neurol 2011. PMID 21707604 – https://pubmed.ncbi.nlm.nih.gov/21707604/
- MLD HOME Natural History Study NCT04628364 – https://clinicaltrials.gov/study/NCT04628364
- MLD NBS systematic review 2025 – https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12641716/
- Hannover-Pilot, ICNA 2024 – https://icnapedia.org/eposters/2024-764
- Fondazione Telethon, Lombardei-Pilot – https://www.fondazionetelethon.it/en/what-we-do/treatment-diagnosis/newborn-screening
- Bekri S et al. 16:1-OH-sulfatide NBS. Mol Genet Metab 2024. PMID 38552449 – https://pubmed.ncbi.nlm.nih.gov/38552449/
- Martin HR et al. UCBT in MLD. Biol Blood Marrow Transplant 2013. PMID 23348427 – https://pubmed.ncbi.nlm.nih.gov/23348427/
- MLD Foundation History – https://www.mldfoundation.org/history.php

**PSAP**
- OMIM 176801 (PSAP-Gen) – https://www.omim.org/entry/176801
- OMIM 611722 Krabbe, atypical, saposin A – https://www.omim.org/entry/611722
- OMIM 249900 MLD due to saposin B – https://www.omim.org/entry/249900
- OMIM 610539 Gaucher, atypical, saposin C – https://www.omim.org/entry/610539
- OMIM 611721 Combined saposin deficiency – https://www.omim.org/entry/611721 (Spiegel: https://www.informatics.jax.org/disease/OMIM:611721)
- Orphanet 139406 Encephalopathy due to prosaposin deficiency – https://www.orpha.net/en/disease/detail/139406
- Orphanet 309252 Atypical Gaucher due to saposin C deficiency

**Pelizaeus-Merzbacher**
- OMIM 312080 – https://www.omim.org/entry/312080
- Orphanet 702 – https://www.orpha.net/en/disease/detail/702
- GeneReviews PLP1 Disorders (NBK1182) – https://www.ncbi.nlm.nih.gov/books/NBK1182/
- MedlinePlus PLP1 – https://medlineplus.gov/genetics/gene/plp1
- Hypo- vs. Demyelinisierung, Übersicht – https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9313024/

**Regulatorik**
- FDA Draft Guidance „Rare Diseases: Natural History Studies for Drug Development" (03/2019) – https://www.fda.gov/regulatory-information/search-fda-guidance-documents/rare-diseases-natural-history-studies-drug-development (PDF: https://www.fda.gov/media/122425/download)
- Orphan-Drug-Definitionen EU/US – https://en.wikipedia.org/wiki/Orphan_drug (Primär: VO (EG) 141/2000; Orphan Drug Act 1983)

**Sphingolipidosen-Tabelle (ORDO via EBI OLS4)**
- Gaucher 355, NPC 646, ASMD 77292/77293, Fabry 324, Tay-Sachs 845, Sandhoff 796 – https://www.ebi.ac.uk/ols4/ontologies/ordo
- OMIM 230800, 257200, 607616, 257220, 301500, 272800, 268800 – https://www.omim.org/
