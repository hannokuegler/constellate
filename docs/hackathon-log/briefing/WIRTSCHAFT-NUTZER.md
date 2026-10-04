**Hinweis, Stand Sa 03.10. 21:00 (Kopie aus dem Team-Briefing, Fragenkatalog inklusive).** Seither ist im Code und in den Daten gefixt, was unten noch als offen oder falsch steht. Aktuelle Zahlen und Stand: [STATUS.md](../STATUS.md), offene und vorläufig entschiedene Fragen: [DECISIONS.md](../../DECISIONS.md).

Seither gefixt:

- Determinismus: Slice mit Tie-Break auf die ID, Edge-IDs als stabiler Hash mit 12 Hex-Zeichen (`e_<12 hex>`, vorher 8), Provenienz je Beleg ehrlich (`origin` je Evidenz, `independent_sources` je Kante).
- Die 531 Einträge „0 von n Patienten" sind jetzt Gegenevidenz (`contradicting`), nicht mehr positive `has_phenotype`-Belege.
- 217 überbehauptete `caused_by`-Kanten wurden zu `associated_gene` (Orphanet „nicht ursächlich" und OMIM „susceptibility" gewinnen gegen HPO).
- HOME-Studie (MLD-Natural-History, NCT04628364): Sponsor ist NORD, mit FDA-Förderung, nicht Orchard.
- FBX-101 läuft jetzt unter NCT05739643 (der alte Alias NCT04693598 leitet dorthin um).
- Österreich hat kein Krabbe-Neugeborenenscreening; MLD-Screening gibt es dort nur als Forschungsscreening seit 12/2024.
- Zahlen im Text (869 Krankheiten, 1.073 Gene, 5.644 Phänotype, 42.307 Kanten) sind der Stand vom Build 20:40. Aktuell: 874 Krankheiten, 1.066 Gene, 5.642 Phänotypknoten (4.717 davon im Suchindex), Details in STATUS.md.

---

# Constellate · Teil 2: Wirtschaft & Nutzersicht

Team-Briefing für Hanno, Osman, Recep · Stand Sa 03.10.2026, abends · Quellen als [Q1] … am Ende, jede mit URL
Lesehinweis: Abschnitt 1 lesen alle. Osman und Recep reicht für heute Nacht 1, 2, 5, 6 und 8. Hanno liest alles. ⚠️ heißt: nicht belegt oder offen.

---

## 1. Kurzfassung

1. **Das Problem:** Es gibt über 10.000 seltene Erkrankungen [Q1] mit 263–446 Mio. Betroffenen [Q2]. Weniger als 5 % davon haben eine zugelassene Therapie [Q3]. Die Diagnose dauert in Europa im Schnitt 4,7 Jahre [Q6]. Allein in den USA lag die Krankheitslast 2019 bei 997 Mrd. USD, gerechnet über 379 Krankheiten [Q7].
2. **Ökonomischer Kern:** Wissen ist ein öffentliches Gut, die Märkte sind winzig und jede Patientengruppe optimiert nur für ihre eigene Krankheit. Deshalb werden Register und Natural-History-Studien (NHS) doppelt gebaut. Constellate senkt **Such- und Bewertungskosten**. Verhandlungs-, Daten- und Zulassungskosten bleiben gleich.
3. **Wichtigster Befund:** Die Assets, die für Krabbe angeblich fehlen, gibt es schon: eine Pittsburgh-NHS (35 Pat.) [Q15], eine deutsche NHS aus Tübingen (38 Pat.) [Q13], eine clusterweite Langzeitstudie mit Krabbe, MLD, PMD u. a. (seit 2012, Ziel 1.500 Pat.) [Q20] und mit der HOME-Studie ein NHS-Template von NORD + FDA [Q19]. Unser Versprechen heißt deshalb **„beitreten statt neu bauen"**.
4. **Challenge-Owner:** Die Buffalo Initiative ist ein von einer Mutter gegründeter Accelerator für seltene **pädiatrische Gehirnerkrankungen**. Sie finanziert Forschung, die Patientengruppen treiben, mit 2–8 Mio. USD je Org, und hat eine eigene „Knowledge Platform"-Säule [Q29]. Krabbe und MLD liegen genau in ihrem Fokus.
5. **Positionierung:** Daten, Register, Datenpools und Repurposing gibt es schon (Orphanet, Monarch, IAMRARE, RDCA-DAP, Every Cure). Was fehlt, ist die **Entscheidungsschicht** für Laien: verwandte Community → wiederverwendbares Asset → begründeter nächster Schritt, mit Beleg je Satz. Das stärkste Substitut ist ChatGPT, also der Sponsor selbst.
6. **10×:** Ehrlich vertretbar nur für den Meilenstein „nutzbarer externer Kontrollarm für eine Krabbe-Studie". Neu aufbauen dauert ~16 Jahre, bestehende Kohorten wiederverwenden ~1–2 Jahre. Das ergibt **~8–15×, wenn** Datenzugang, Endpunkt-Harmonisierung und Regulator-Akzeptanz halten.
7. **Top-Entscheidungen:** W1 primärer Nutzer · W9 Empfänger der Action Card · W10 beitreten statt bauen · W16 Meilenstein · W18 „3–5× mehr Patienten" korrigieren.

---

## 2. Das Problem ökonomisch

### 2.1 Krankheitslast

| Kennzahl | Wert | Quelle |
|---|---|---|
| Anzahl seltener Erkrankungen | über 10.000 (Mondo-Harmonisierung: 10.394); Orphanet-Analyse 2019: 6.172 | [Q1], [Q2] |
| davon genetisch | 71,9 % (Orphanet; der Brief nennt 80 %) | [Q2] |
| Beginn ausschließlich im Kindesalter | 69,9 % | [Q2] |
| Betroffene weltweit | 263–446 Mio. (3,5–5,9 % der Bevölkerung, konservativ) | [Q2] |
| Betroffene Europa | über 30 Mio. | [Q5] |
| mit zugelassener Therapie | unter 5 % (NIH/GARD). FDA: in 40 Jahren Orphan Drug Act hatten 392 seltene Krankheiten mindestens eine Zulassung | [Q3], [Q4] |
| Diagnosedauer Europa | Ø 4,7 Jahre; bei 56 % mehr als 6 Monate nach dem ersten Arztkontakt (6.507 Befragte, 1.675 Krankheiten) | [Q6] |
| ökonomische Last USA 2019 | 997 Mrd. USD (379 Krankheiten, 15,5 Mio. Menschen): 45 % direkt medizinisch, 44 % indirekt (Produktivität) | [Q7] |
| Kosten verspäteter Diagnose | 86.000–517.000 USD vermeidbare Kosten je Patient (7 Krankheiten, u. a. ALD, Pompe) | [Q8] |

Einordnung: 392 von ~10.400 sind ≈ 3,8 % (eigene Rechnung). Gezählt sind nur FDA-Zulassungen mit Orphan-Designation, und sieben der zehn häufigsten Ziele sind seltene Krebsarten [Q4]. Für nicht-onkologische, pädiatrische Erkrankungen sieht es noch dünner aus.

### 2.2 Unser Cluster in Zahlen

- **Krabbe infantil ~1 : 500.000.** In New York und Missouri wurden ~2,5 Mio. Neugeborene gescreent und 5 Fälle gefunden; 443 Kinder wurden zur Abklärung überwiesen [Q10]. DE + AT haben ~755.000 Geburten pro Jahr (677.117 DE 2024 [Q11], ~78.000 AT [Q12]). Das ergibt **~1–2 infantile Fälle pro Jahr** im deutschsprachigen Raum (eigene Rechnung). Dazu kommen spätere Formen, in der deutschen Kohorte 21 % [Q13].
- **Kein zugelassenes Medikament für Krabbe.** HSCT wirkt nur präsymptomatisch (siehe MEDICAL-BACKGROUND §3).
- **Österreichs Neugeborenen-Screening** deckt über 30 Krankheiten ab, Krabbe wird nicht genannt [Q12]. ⚠️ Die vollständige Zielkrankheiten-Liste habe ich nicht eingesehen.
- **MLD hat eine Gentherapie** (EU 2020, FDA 2024). Die Wirksamkeit wurde mit 29 behandelten Kindern gegen eine Natural-History-Kohorte von 31 unbehandelten Kindern belegt, gematcht nach Alter und Subtyp [Q14]. Entwickelt hat sie das SR-Tiget in Mailand, mitfinanziert von der **Fondazione Telethon (Charity)**; 2014 an GSK, 2018 an Orchard lizenziert [Q14]. Listenpreis in den USA: 4,25 Mio. USD einmalig, mit outcome-basierten Verträgen für Kostenträger [Q9].

Lehre: Der Markt (Pharma, Preis, Kostenträger) beginnt erst **nach** der Natural History. Die frühe Phase haben Charity, Klinik und Patientengruppen bezahlt.

### 2.3 Fragmentierung als Transaktionskostenproblem

Eine Kooperation zwischen zwei Patientengemeinschaften ist eine Transaktion mit klassischen Kostenphasen. Constellate wirkt nur auf die ersten drei:

| Phase | Kosten heute | Wer trägt sie | Effekt von Constellate |
|---|---|---|---|
| Suche: wer ist mechanistisch verwandt? | Namen verstecken Mechanismen; das Wissen liegt verteilt auf OMIM, HPO, PubMed, ClinicalTrials.gov, RePORTER und hunderte Org-Seiten | Gruppenleitung, ehrenamtlich | **stark ↓**: eine Suche, Nachbarn über Mechanismus |
| Bewertung: ist das übertragbar? | erfordert Fachwissen; Informationsasymmetrie zwischen Laien und Klinik | Gruppenleitung + Gefallen von KOLs | **mittel ↓**: Action Card mit „übertragbar / anders / prüfen". Die Expertenprüfung ersetzt sie nicht |
| Anbahnung: wen anschreiben? | Cold-Mails ohne Antwort | Gruppenleitung | **leicht ↓**: KOL-Overlap, Institution, öffentlicher Kontaktweg |
| Verhandlung: Datenzugang, Governance, IP | Data Use Agreements, Ethik, Datenschutz. Bei RDCA-DAP entscheidet z. B. ein Data Use Committee [Q16] | beide Seiten | **keiner** |
| Betrieb: Harmonisierung, Pflege | Protokolle, Endpunkte, Plattform | beide Seiten | **keiner** |

Dahinter steckt ein **Koordinationsversagen mit positiven Externalitäten**. Jede Gruppe rechnet nur den Nutzen für ihre eigene Krankheit. Was ein gemeinsamer Endpunkt, eine gemeinsame Plattform oder eine gemeinsame Kontrollkohorte den Nachbarn bringen würde, bezahlt niemand. Ergebnis: zu wenig Kooperation, zu viel Doppelbau.

### 2.4 Doppelarbeit, belegt im eigenen Cluster

- **Krabbe-NHS gibt es mindestens dreimal:** Pittsburgh, prospektiv 2000–2017, 35 Pat., standardisierte Untersuchungen [Q15]. Deutschland bundesweit, 38 Pat., Fragebogen + Akten + MRT-Score [Q13]. Eine Industrie-NHS (Zymenex) 2009–2014 mit 6 Pat. [Q17]. **Drei Protokolle, schwer zu poolen.**
- **MLD:** Tübingen/LEUKONET 59 Pat., aus dieser Kohorte stammt die GMFC-MLD-Skala [Q18]. Mailand 31 NHx-Kinder [Q14]. HOME-Studie 2020–2025 mit 21 Pat., **ausdrücklich als wiederverwendbare externe Kontrolle mit Remote-Teilnahme gebaut**, Sponsor NORD, FDA als Partner [Q19].
- **Clusterweit:** Pittsburghs „Longitudinal Study of Neurodegenerative Disorders" rekrutiert seit 01/2012 bis voraussichtlich 2035, Ziel 1.500 Pat. Sie umfasst 27 Krankheitsbezeichnungen, darunter Krabbe, MLD, Gaucher, Tay-Sachs, Sandhoff, MPS I–IV und Pelizaeus-Merzbacher [Q20].
- **Industrie-Register als Silo:** Das ICGG Gaucher Registry läuft seit 04/1991 unter dem Sponsor Genzyme/Sanofi, Ziel 12.000 Pat. [Q21].

Zwei Lesarten, beide stimmen: (1) Die Doppelarbeit ist real und teuer. (2) Für Krabbe heißt das Problem nicht „es gibt nichts", sondern „es ist verstreut, nicht harmonisiert, und eine Gruppe in Wien sieht es nicht". Das ist genau unser Use Case, verschiebt aber die Story (W3, W10, W19).
⚠️ Korrektur für MEDICAL-BACKGROUND §4: Die HOME-Studie NCT04628364 läuft laut ClinicalTrials.gov unter Sponsor **NORD (mit FDA)**, nicht unter Orchard.

### 2.5 Warum der Markt das nicht löst

1. **Öffentliches Gut.** Ein Wissensgraph ist nicht-rival, und schwer ausschließbar ist er auch, weil die Rohdaten großteils CC-BY oder Public Domain sind. Privat wird deshalb zu wenig angeboten. Folgerichtig sind die bestehenden Angebote öffentlich finanziert: Orphanet (INSERM-geführt [Q2]), GARD (NIH [Q3]), RDCA-DAP (FDA [Q16]), RARe-SOURCE (NIH [Q34]).
2. **Kleine Märkte.** Bei ~1 : 500.000 gibt es vor einem Proof of Concept keinen Business Case. Die Orphan-Gesetze setzen erst bei der Zulassung an: US-ODA mit Steuergutschriften, Gebührenbefreiung und 7 Jahren Exklusivität [Q22], EU-VO 141/2000 mit 10 Jahren Exklusivität [Q23]. Die Vorarbeit (Register, NHS) fördern sie nicht.
3. **Finanzierungslücke in der Vorarbeit.** Die FDA schreibt selbst, dass es für Patientenorganisationen „very difficult" ist, NHS zu finanzieren. Ihre Grants decken prospektive NHS mit max. 400.000 USD pro Jahr für bis zu 5 Jahre [Q24]. Venture-Philanthropie zeigt, welcher Hebel möglich ist: Die CF Foundation gab 150 Mio. USD an Vertex und verkaufte die Royalties 2014 für 3,3 Mrd. USD [Q25]. Das ist aber die Ausnahme.
4. **Anreize.** Industrie-Register sind vertriebsnahe Silos. Forschende publizieren und beantragen Grants je Krankheit. Patientengruppen konkurrieren um Spenden und Aufmerksamkeit.
5. **Informationsasymmetrie.** Ob etwas übertragbar ist, können Laien nicht beurteilen. Das Wissen sitzt bei wenigen KOLs (Escolar/Kurtzberg in den USA, Krägeloh-Mann/Kehrer in Tübingen).

Die Politik reagiert: IRDiRC-Ziele 2017–2027 (Diagnose binnen eines Jahres, 1.000 neue Therapien) [Q26], ERDERA mit 380 Mio. EUR bis 2031 (INSERM-geführt, Fokus Daten und AI, patientengetriebene Forschung) [Q27], die 24 European Reference Networks inkl. MetabERN [Q28]. **Die Lücke „Laie findet wiederverwendbares Asset beim Nachbarn" schließt keines davon direkt.**

---

## 3. Stakeholder-Analyse

| Akteur | Interesse | Macht / Einfluss | Was er von Constellate hätte | Was er fürchtet |
|---|---|---|---|---|
| Familien, frisch diagnostiziert (Devon) | Orientierung, Community, Hoffnung | gering einzeln; hoch als Stimme in Videos/Medien | exakte Community oder ehrliche Lücke mit nächstem Schritt | falsche Hoffnung, Fachjargon, Datenpreisgabe |
| Leitung kleiner Gruppen (Nora, Maria) | Fortschritt für die eigene Krankheit, Partner, Legitimität | gering bis mittel; Gatekeeper der Familien | Partner + Asset + verschickbarer Vorschlag | Zeitverschwendung, als Laiin nicht ernst genommen zu werden, Kontrollverlust über „ihre" Daten |
| Etablierte Orgs (MLD Foundation, Hunter's Hope, KrabbeConnect, ELA [Q44]) | Mission, Sichtbarkeit, Spenden, Kontrolle über Register | mittel bis hoch im eigenen Feld | Sichtbarkeit ihrer Assets, Nachnutzung als Wirkungsbeleg | falsch dargestellt zu werden (z. B. „has_registry" falsch), Konkurrenz um Spenden, Anfragen-Flut |
| Dachverbände (EURORDIS: über 1.000 Orgs in 77 Ländern [Q5]; NORD: 360+ Orgs [Q31]; Global Genes) | Reichweite, Politik, eigene Plattformen (IAMRARE, RARE-X) | hoch, sie haben Vertrauen und Kanäle | Navigation als Zubringer zu ihren Programmen | Doppelstruktur neben ihren Tools, Qualitätsrisiko |
| Forschende / KOLs | Kollaborateure, Rekrutierung, Grants, Publikationen | hoch, sie entscheiden über Datenzugang | Partner über Krankheitsnamen hinweg (Brief: Dr. Osei) | Anfragen-Flut, falsche Zuordnung ihrer Arbeit, fehlerhafte text_mined-Kanten |
| Kliniken / Referenzzentren (MetabERN, ERN-RND [Q45]) | Versorgung, Studien, Fallzahlen | hoch | Zuweisung, Studienkandidaten | Selbstdiagnosen, Haftung |
| Pharma / Biotech (Orchard, Forge; Brief: Priya) | Patientenfindung, NH-Daten, KOLs, Trial Readiness | hoch (Kapital) | Cluster-Ranking mit Infrastruktur | dünne Abdeckung, Konkurrenz sieht dasselbe |
| Regulatoren (EMA, FDA) | belastbare NH-Daten, Standards; FDA hat HOME mitgetragen [Q19] | sehr hoch im Feld, keine direkte Rolle beim Hackathon | weniger unterdimensionierte Doppelstudien | schlechte externe Kontrollen, Bias |
| Kostenträger (NHS England, ÖGK/GKV, US-Payer) | Evidenz für Wert, Budget; Lenmeldy kommt mit Outcome-Verträgen [Q9] | hoch bei Zugang, kein Interesse an uns | bessere NH-Daten für HTA (indirekt) | Druck auf teure Therapien |
| Förderer (NIH/NCATS, FDA-Grants, CZI Rare As One [Q38], Telethon, ERDERA [Q27]) | Wirkung pro Euro, keine Doppelförderung | hoch, sie zahlen | Portfolio-Sicht: Wer baut doppelt? | Tool ohne Betreiber, das nach der Förderung stirbt |
| Datenanbieter (Orphanet, OMIM, HPO, Monarch, Open Targets) | korrekte Attribution, Lizenztreue, Nutzung | mittel; OMIM per Lizenz, Org-Daten bei Orphanet nicht frei | Reichweite ihrer Daten | veraltete Kopien, Lizenzbruch |
| **Buffalo Initiative** (Challenge-Owner) | Therapien für pädiatrische Gehirnerkrankungen; Fonds für patientengetriebene Querschnittsforschung, geteilte Infrastruktur, Open Science [Q29] | sehr hoch an diesem Wochenende | Prototyp ihrer Knowledge-Platform-Säule | falsche Hoffnung bei Familien, geschlossene Daten, Doppelplattformen |
| **OpenAI** (Sponsor) | sichtbare, verantwortliche Nutzung der eigenen Modelle im Gesundheitsbereich (z. B. HealthBench 05/2025 [Q40] ⚠️) | hoch, Track-Preis setzt OpenAI-Nutzung voraus | Vorzeigefall „LLM unter Evidenzkontrolle" | Halluzinations-Schlagzeilen, „KI ersetzt Arzt" |
| **Jury** | die fünf Kriterien des Briefs | entscheidet | eine komplette, belegte Journey | Übertreibung, unprüfbare Zahlen, hübsche Graphen ohne Substanz |

**Macht-Interesse-Matrix.** Macht heißt hier: Einfluss darauf, ob Constellate gewinnt und danach weiterlebt.

| | Interesse niedrig | Interesse hoch |
|---|---|---|
| **Macht hoch** | **Zufriedenstellen:** EMA/FDA, Kostenträger, Pharma/Biotech, OMIM (Lizenz) | **Eng managen:** Jury, Buffalo Initiative, OpenAI, Dachverbände (Pilot-Zugang), KOLs/Referenzzentren, Förderer |
| **Macht niedrig** | **Beobachten:** andere Teams, breite Öffentlichkeit | **Einbinden/informieren:** Familien, kleine Gruppen (Nora), etablierte Einzel-Orgs, offene Datenanbieter |

Konsequenz für dieses Wochenende: Wir bauen für Nora und **überzeugen Jury, Buffalo und OpenAI**. Danach entscheidet ein Dachverband oder Förderer über das Weiterleben. Dorthin führt die Nachhaltigkeitsfrage (Abschnitt 7).

---

## 4. Porter

### 4a. Five Forces · Feld „Wissens- und Navigationswerkzeuge für seltene Erkrankungen"

Das Feld funktioniert großteils als öffentliches Gut, nicht als Markt. „Abnehmer" sind deshalb die, die Nutzung finanzieren oder adoptieren.

| Kraft | Stärke | Konkret | Konsequenz |
|---|---|---|---|
| Rivalität bestehender Anbieter | mittel | viele öffentlich finanzierte Angebote konkurrieren um Aufmerksamkeit und Fördergeld, lösen aber unterschiedliche Jobs (siehe 4b). Am Hackathon: hoch, gleicher Brief, LSD steht darin | über den Job differenzieren, nicht über Datenmenge |
| Bedrohung durch neue Anbieter | **hoch** | offene Daten (MONDO/Orphanet CC-BY) + LLMs = Eintrittsbarriere ~24 h. Wir sind selbst der Beweis | Ein Burggraben entsteht nur aus Kuration (Assets, Orgs), Vertrauen und Einbettung bei einem Träger |
| Verhandlungsmacht der Abnehmer | **hoch** | Patientengruppen haben kein Budget. Förderer (Buffalo, CZI, ERDERA) und Pharma zahlen, haben aber Alternativen | kein SaaS-Modell gegenüber Gruppen; Finanzierung über Förderer |
| Verhandlungsmacht der Lieferanten | mittel | der Kern ist offen. OMIM aber nur per Lizenz (wir nutzen es nur indirekt), Org-Daten bei Orphanet nicht als offener Download (DATA-SOURCES.md), LLM-Abhängigkeit von OpenAI, Kurationszeit knapp | Kuration ist der echte Engpass-Lieferant |
| Bedrohung durch Substitute | **hoch** | ChatGPT/Deep Research, Google, Anruf beim KOL, ERN-Fallkonferenz, Facebook-Gruppen, NORD-Hotline. Kostenlos und für viele Fragen „gut genug" | Substitute sind schwach bei Beleg je Aussage, Gegenevidenz und ehrlicher Lücke. Genau dort setzen wir an |

**Fazit:** Als Geschäft strukturell unattraktiv, als **öffentliche Infrastruktur mit Förderträger** sinnvoll. Positionierung deshalb als Open Source + offene Daten, nicht als Produkt-Firma.

### 4b. Bestehende Angebote · ehrlich: was ist schon gelöst?

| Angebot | Träger | Löst | Löst nicht | Für uns |
|---|---|---|---|---|
| Orphanet | INSERM-geführtes Konsortium [Q2] | Krankheitskatalog, ORPHAcodes, Verzeichnisse für Orgs, Expertenzentren und Register | Mechanismus-Nachbarschaft mit Asset-Transfer | Fundament (Lieferant) |
| GARD | NIH/NCATS [Q3] | Info in Laiensprache, Org-Listen | Graph-Navigation; US-Fokus | Vorbild für Laiensprache |
| NORD + IAMRARE | US-Dachverband, 360+ Orgs [Q31] | Register- und NHS-Plattform für Gruppen (inkl. HOME mit FDA [Q19]) | Wer ist mechanistisch verwandt? | Ziel einer Action Card („tritt bei") |
| Monarch Initiative | akademisches Konsortium [Q32] | Wissensgraph Gen–Phänotyp–Krankheit, Phänotyp-Ähnlichkeit (semsim) | Assets von Patientengruppen, Handlungsempfehlung | Fundament: wir nutzen MONDO, HPO und die Monarch-API |
| Open Targets | Public-Private seit 2014 (EMBL-EBI, Sanger, GSK u. a.) [Q33] | Target–Krankheit-Evidenz mit Scores je Datentyp | Patientensicht | Lieferant für Konfidenz |
| NCATS RARe-SOURCE | NIH [Q34] | integrierte Bioinformatik, AI-Literatur-Mining; im Brief genannt | Handlung für Patientengruppen | nächster Verwandter; offen als Vorbild nennen |
| Global Genes / RARE-X | Fusion 2023 [Q35] | patienteneigene Datensammlung, Advocacy-Training | Matching über Krankheitsgrenzen | Partner |
| C-Path RDCA-DAP | FDA-finanziert, seit 09/2021, 42+ Krankheiten [Q16] | gepoolte Patientendaten inkl. NHS, kontrollierter Zugang | Entdeckung, UX für Laien; LSD/Leukodystrophien nicht genannt | Ziel für „beitreten statt bauen" |
| Every Cure (MATRIX) | ARPA-H, bis 48 Mio. USD (02/2024) [Q36] | wissensgraphbasiertes Repurposing: alle Medikamente × alle Krankheiten | Kooperation zwischen Patientengruppen | Konkurrent ums Narrativ „AI + KG + rare"; Vorbild |
| Mendelian | UK-Firma [Q37] | Patientenfindung in Hausarzt-Akten (Diagnose) | Navigation nach der Diagnose | anderer Job |
| Kommerzielle Pharma-Intelligence (Citeline, Cortellis, Evaluate) ⚠️ nicht im Detail geprüft | Lizenzen | Pipeline- und Deal-Daten für Priya | Laien, Gegenevidenz | Substitut für die Priya-Linse |
| ChatGPT & andere LLMs | OpenAI u. a. | schnelle, plausible Antworten | Beleg je Satz, Gegenevidenz, Lücke, Reproduzierbarkeit | größtes Substitut und zugleich Sponsor |
| Pittsburgh-Cluster-NHS NCT03333200 | Univ. Pittsburgh [Q20] | gemeinsame Langzeit-NHS für den halben Cluster | Sichtbarkeit für europäische Gruppen | **wichtigstes Asset in unserem Graphen** |

### 4c. Wertkette · Patient-Group-Journey bis zum Zugang

| Stufe | Engpass | Effekt von Constellate | schneller oder billiger? |
|---|---|---|---|
| 0 Neugeborenen-Screening | Krabbe in 18 US-Staaten (MEDICAL-BACKGROUND), AT nicht genannt [Q12] | keiner (höchstens Argumente für Advocacy) | nein |
| 1 Diagnose | Ø 4,7 J [Q6]. Bei Krabbe kurz (Pittsburgh-Kohorte, Beginn 6–36 Mo: Median 3,5 Mo von Symptom bis Diagnose [Q15]), dann aber oft zu spät für HSCT | gering. Devon-Resolve ist eine Suchhilfe, kein Diagnosetool | nein |
| 2 Community finden oder gründen | Orgs verstreut, exakte Gruppe fehlt oft | **mittel–stark**: Honest Gap + nächste verwandte Communities | schneller |
| 3 Register | doppelt gebaut, inkompatibel | **mittel**: zeigt Plattformen (IAMRARE, RARE-X) und Nachbar-Register; Entscheidung „beitreten oder bauen" | billiger |
| 4 Natural History | 30–60 Pat. über 10–17 J (MEDICAL-BACKGROUND §8) | **stark (größter Hebel)**: bestehende Kohorten, Endpunkte (GMFC-MLD) und Templates (HOME) finden. Den Zugang selbst verschafft es nicht | schneller + billiger, **wenn** Zugang gelingt |
| 5 Präklinik / Mechanismus | „Valley of death" (Buffalo [Q29]) | gering–mittel: Mechanismus-Nachbarn, Modelle (Stretch Goal) | kaum |
| 6 Studie: Design, Zentren, Rekrutierung | Rekrutierung bei 1 : 500.000 | mittel: KOL-Overlap, Zentren, Präzedenz für externen Kontrollarm | etwas schneller |
| 7 Zulassung | Akzeptanz externer Kontrollen (Präzedenz Libmeldy [Q14]) | keiner direkt; macht die Präzedenz sichtbar | nein |
| 8 Zugang, Preis, HTA | 4,25 Mio. USD [Q9], Verhandlungen mit Kostenträgern | keiner | nein |

**Kurz:** Constellate arbeitet in den Stufen 2–4 und 6. In den Stufen 0, 1, 7 und 8, wo Jahre und Milliarden liegen, ändert es nichts. Wer etwas anderes pitcht, übertreibt.

### 4d. Positionierung und Wettbewerbsvorteil

- **Generische Strategie:** Fokus-Differenzierung. Unsere Nische sind Leitungen von Patientengruppen und ihre Förderer im Moment der Entscheidung „beitreten oder bauen".
- **Differenzierungsachsen:** (1) Evidenz-Integrität: 4 Stufen, Gegenevidenz-Slot, Beleg je Satz. (2) Assets als eigene Knoten (Register, NHS, Endpunkt, Plattform), nicht nur Gene und Symptome. (3) Ehrliche Lücke als eigener Screen. (4) Ein Handlungsartefakt (Action Card).
- **Schon gelöst, nicht neu erfinden:** Gen–Krankheit–Phänotyp (Monarch, Orphanet), Phänotyp-Ähnlichkeit (Monarch semsim), Register-Plattformen (IAMRARE, RARE-X), Datenpools (RDCA-DAP), die Cluster-NHS selbst (NCT03333200).
- **Unser Delta in einem Satz:** die Verbindung *Mechanismus-Nachbar → konkretes wiederverwendbares Asset → begründeter nächster Schritt* für Laien, jeder Satz mit Beleg.
- **Nachhaltig wird der Vorteil nicht über Code** (in 24 h nachbaubar), sondern nur über gepflegte Asset-Daten, geliehenes Vertrauen (ein Dachverband als Träger) und Aktualität.

---

## 5. Nutzersicht

### 5.1 Personas

**Nora** (unsere Komposit-Figur: Wien, Sohn Emil mit infantilem Krabbe, leitet 11 Familien im deutschsprachigen Raum)
- Job-to-be-done: „Ich will in den nächsten Wochen einen Schritt machen, der in 5–10 Jahren eine Studie für Kinder wie Emil möglich macht, ohne Jahre in Doppelarbeit zu versenken."
- Pains: kein Krabbe-Screening in AT (⚠️), ein Google-Formular als „Register", Mails an Unikliniken ohne Antwort, Fachsprache, Ehrenamt neben einem schwerkranken Kind.
- Gains: ein Partner, ein übernehmbares Protokoll oder Endpunkt, ein Brief, den sie morgen abschicken kann, Legitimität gegenüber Kliniken.
- Workaround heute: WhatsApp, Facebook-Gruppen, ELA, Kongresse, warten auf Antworten.
- Moment des Werts: Die Mechanismus-Kante zeigt, dass **dieselbe Tübinger Gruppe die MLD-Motorikskala entwickelt [Q18] und eine deutsche Krabbe-NHS gemacht hat [Q13]**, und dass Krabbe schon in einer clusterweiten Studie steckt [Q20]. Danach öffnet sie die Action Card mit Empfänger.
- Vertrauensbarriere: „Hat das eine KI erfunden?"
- Risiko: falsche Hoffnung („MLD hat eine Gentherapie, also bald auch Krabbe"), Überforderung, Missverständnis als Therapieempfehlung.

**Maria** (Brief, Leitung einer Patientenorganisation): dieselben Jobs wie Nora, generisch und US-geprägt. Die Kriterien der Jury sind auf sie gemappt („a family or group moves from isolated diagnosis to …"). Ihr Zielsatz aus dem Brief: „Here is what must be checked before we join forces."

**Devon** (frisch diagnostiziert, um 2 Uhr nachts)
- Job: „Ich will heute Nacht verstehen, ob es Menschen wie uns gibt und was ich morgen tun kann."
- Pains: Suchmaschinen liefern nichts oder Abstracts für Fachleute.
- Gains: exakte Community oder ehrliche Lücke plus Handlung.
- Workaround: Google, ChatGPT, Facebook.
- Moment des Werts: der Honest-Gap-Screen mit „das haben wir durchsucht, das sind die nächsten verwandten Communities".
- Barriere: emotionale Lage, keine Vorbildung.
- Risiko: Selbstdiagnose über die Symptom-Suche, Panik, falsche Zuordnung.

**Priya** (Biotech-Scout)
- Job: „Alle Cluster finden, in denen meine Modalität (z. B. HSC-Gentherapie, AAV) plausibel wirkt, samt Gruppen und Infrastruktur."
- Pains: Monate pro Mechanismus.
- Gains: ein Ranking mit Evidenz, NHS, Registern und Screening-Status.
- Workaround: kommerzielle Datenbanken, Berater, Kongresse.
- Moment des Werts: Cluster-Ansicht mit vorhandenen NHS je Krankheit.
- Barriere: braucht Abdeckung und Export und misstraut text_mined-Kanten.
- Risiko für uns: Ein Cluster ist für sie zu dünn.

**Dr. Osei** (Forscher im Silo)
- Job: „Wer arbeitet an meinem Mechanismus unter einem anderen Gennamen, und wie erreiche ich die Person?"
- Pains: Silo, Grants je Krankheit.
- Gains: Kollaborateure, Infrastruktur, Förder-Signale (RePORTER).
- Workaround: Autorensuche in PubMed, persönliche Netzwerke.
- Moment des Werts: die KOL-Overlap-Kante (Escolar/Kurtzberg in den USA, Tübingen in Europa).
- Barriere: wissenschaftliche Strenge; will Methode und Gegenevidenz der inferred-Kanten sehen.
- Risiko: Findet er eine falsche Kante, verwirft er das ganze Tool.

**Förderer:in** (Typ Buffalo Initiative; versteckte Persona, nicht im Brief, aber Challenge-Owner)
- Job: „Mein Fonds (2–8 Mio. USD je Org [Q29]) soll Querschnittsforschung bezahlen. Welche Gruppen teilen Mechanismen, wer baut doppelt, wo bewegt ein Dollar mehrere Communities?"
- Pains: ~500 Gruppen im Fokus [Q29], jede pitcht für sich allein.
- Gains: Portfolio-Sicht, sichtbare Doppelarbeit, überprüfbare Open-Science-Pflicht.
- Workaround: Berater, Advisory Boards.
- Moment des Werts: Asset-Abdeckung je Cluster, z. B. „3 Krabbe-NHS, 3 Protokolle".
- Barriere: Abdeckung und Aktualität.
- Risiko: wird als Ranking von Familien missverstanden („wer bekommt Geld").

### 5.2 Warum sollte eine Mutter einem Graphen glauben?

Vertrauen entsteht in diesen Communities über Bürgen, nicht über Technik. Daraus folgen sechs Designregeln:
1. **Herkunft vor Inhalt:** Quelle, Datum und Evidenzstufe stehen sichtbar neben jeder Aussage, bevor die Erklärung kommt.
2. **Leere Gegenevidenz wird erklärt:** „Keine Gegenevidenz gefunden in: … (Datum)" statt eines leeren Felds.
3. **Das Tool sagt auch Nein:** Das Gegenbeispiel Pelizaeus-Merzbacher (ähnliche Symptome, anderer Mechanismus) wird aktiv gezeigt.
4. **Die ehrliche Lücke ist ein eigener Screen**, kein Fehlerfall.
5. **Ein Mensch als Schleuse:** Die Action Card endet mit „Was eine Fachperson prüfen muss" und richtet sich an Gruppen und Forschende, nie an Therapieentscheidungen für ein einzelnes Kind.
6. **Geliehenes Vertrauen:** Im Pilot läuft der Zugang über einen Dachverband oder eine Klinik (ELA, EURORDIS, NORD), nicht über unsere Marke.

### 5.3 Noras Journey heute vs. mit Constellate

| Schritt | Heute | Mit Constellate | Was sich nicht ändert |
|---|---|---|---|
| 1 Nach der Diagnose | Google, englische Abstracts, eine Facebook-Gruppe | eine Suche „Krabbe" → Ego-Graph mit Gen, Mechanismus, Communities und Status „keine zugelassene Therapie" | die Diagnose selbst, die Trauer |
| 2 Community | findet ELA und US-Gruppen, gründet eine WhatsApp-Gruppe mit 11 Familien | sieht Orgs mit Prüfdatum und Assets (Register ja/nein) | den Aufbau der Gruppe macht sie weiter selbst |
| 3 Register | Google-Formular, nicht interoperabel | sieht Plattformen (IAMRARE, RARE-X) und Nachbar-Register → Entscheidung beitreten statt bauen | Datenschutz, Einwilligungen |
| 4 Wissen über Nachbarn | weiß nicht, dass MLD eine Gentherapie auf Basis einer NHS hat | PSAP/Mechanismus → MLD → Libmeldy-Präzedenz mit 29 vs. 31 [Q14]; Gegenbeispiel PMD | ob das für Krabbe trägt, klärt erst die Expertenprüfung |
| 5 Partner | drei Mails an Unikliniken ohne Antwort | KOL-Overlap: Tübingen (GMFC-MLD + deutsche Krabbe-NHS), Pittsburgh-Cluster-NHS | ob jemand antwortet |
| 6 Vorschlag | gibt es nicht | Action Card als Ein-Seiter: übertragbar / anders / prüfen, jeder Satz mit Beleg | Verhandlung über Datenzugang |
| 7 Nach 4 Wochen | weiter Google-Formular | ein Gespräch mit einem Zentrum, das schon Krabbe-Daten hat; Familien können in eine laufende Studie | Studienteilnahme bleibt eine ärztliche Entscheidung |

---

## 6. 10× / Moonshot ökonomisch

### 6.1 Belegte Bausteine

| Baustein | Wert | Quelle |
|---|---|---|
| Zulassung über externen Kontrollarm | Libmeldy: 29 behandelt vs. 31 NHx, gematcht nach Alter und Subtyp | [Q14] |
| Kohortengrößen | Krabbe Pittsburgh 35 (2000–2017); Krabbe DE 38; MLD Tübingen 59; MLD HOME 21 (10/2020–03/2025) | [Q15], [Q13], [Q18], [Q19] |
| Rekrutierungsrate (abgeleitet) | Pittsburgh ≈ 2 Pat./J (35 ÷ 17); HOME ≈ 4–5 Pat./J (21 ÷ 4,5) | eigene Rechnung aus [Q15], [Q19] |
| Cluster-NHS existiert | NCT03333200, seit 2012, Ziel 1.500, inkl. Krabbe + MLD | [Q20] |
| Budgetgröße einer NHS (Proxy) | FDA-Grant max. 400.000 USD/J × 5 J prospektiv | [Q24] |
| Regulatorischer Rahmen | FDA-Draft-Guidance „Natural History Studies" (2019), externe Kontrolle möglich | MEDICAL-BACKGROUND §8, [Q41] |

### 6.2 Annahmen (alle ⚠️, offen auszuweisen)

- **A1** Eine neue prospektive NHS aufzusetzen (Partner, Protokoll, Ethik, Plattform) dauert 1,5–2 Jahre.
- **A2** Ein zulassungsfähiger Kontrollarm braucht ~30 nach Krankheit und Subtyp gematchte Patienten (Analogie Libmeldy: 31).
- **A3** Eine neue Krabbe-Kohorte in DACH rekrutiert nicht schneller als Pittsburgh (~2/J).
- **A4** Zugang zu bestehenden Kohorten (Data Use Agreement, Ethik-Amendment) gelingt in 6–12 Monaten.
- **A5** Die Harmonisierung auf einen gemeinsamen Endpunkt gelingt in 6–12 Monaten. Ob eine motorische Klassifikation analog GMFC-MLD bei Krabbe valide ist, ist offen. Und die Protokolle unterscheiden sich: Pittsburgh hat standardisiert untersucht, Tübingen mit Fragebogen + Akten gearbeitet [Q15], [Q13].
- **A6** EMA/FDA akzeptieren für Krabbe eine historische Kontrolle, analog zu Libmeldy.

### 6.3 Szenarien · Meilenstein „nutzbarer externer Kontrollarm für eine Krabbe-Interventionsstudie"

| Route | Logik | Zeit | Faktor vs. A |
|---|---|---|---|
| **A** Neuaufbau, eine Krankheit | A1 + 30 Pat. ÷ 2/J | ~16–17 J | 1× |
| **B** Neuaufbau mit Cluster-Protokoll (Krabbe + MLD + …) | Setup 0,5–1 J kürzer, weil Design übernommen. Krabbe-Rekrutierung bleibt ~2/J, **weil der Kontrollarm krankheitsspezifisch ist** | ~15–16 J | ~1,1× |
| **C** Bestehende Kohorten wiederverwenden (Pittsburgh 35 + DE 38) | A4 + A5, teilweise parallel | ~1–2 J | **~8–15×** |
| **D** Status quo mit gutem KOL-Zugang | wie C, aber Entdeckung über das persönliche Netzwerk | ~1,5–2,5 J ⚠️ | – |

**Ehrliche Lesart:**
- Der 10×-Hebel liegt in der **Wiederverwendung** (Route C), nicht im gemeinsamen Neubau (B). Die Behauptung in SCOPE.md „Rekrutierung über den Cluster: 3–5× mehr Patienten" stimmt für einen krankheitsspezifischen Kontrollarm **nicht**. MLD-Kinder sind keine Kontrollen für Krabbe. Pooling spart Infrastrukturkosten und hilft bei mechanismusweiten Biomarker-Fragen, mehr nicht (W18).
- **Kausaler Anteil von Constellate:** Es verkürzt direkt nur Entdeckung und Bewertung. Ob das von Wochen/Monaten auf eine Sitzung geht, ist ⚠️ nicht gemessen. Gruppen mit KOL-Zugang finden Route C auch ohne uns (Zeile D). Der eigentliche Hebel: **Gruppen ohne KOL-Zugang, wie Nora, landen sonst bei Route A.**
- **Satz für Pitch und MOONSHOT.md:** „For the milestone *a usable external control arm for a Krabbe trial*, reusing existing cohorts is roughly 8–15× faster than building a new one, if data access, endpoint harmonisation and regulatory acceptance hold. Constellate's job is to make that route visible to the groups that would otherwise rebuild."
- Die Zahlen in SCOPE.md („5–8 Jahre bis NH-Daten", „6–12 Monate bis Studienstart") sind unbelegt ⚠️ und sollten durch diese Tabelle ersetzt werden (Recep, R2).

### 6.4 Was als Nächstes validiert werden müsste

1. Wie lange ein Datenzugang real dauert: Anfrage bei Pittsburgh und Tübingen (A4).
2. Ob sich die Endpunkte Pittsburgh vs. Tübingen harmonisieren lassen (A5).
3. Wie EMA-Scientific-Advice gepoolte und historische Kontrollen bei Krabbe sieht (A6).
4. Nutzertest mit 3 Gruppenleitungen: Finden sie Route C mit Constellate in unter 1 h, und ohne?

---

## 7. Nachhaltigkeit nach dem Hackathon

| Möglicher Träger | Logik | Pro | Contra |
|---|---|---|---|
| Buffalo Initiative, Säule Knowledge Platform | Fit zu Fokus und Open-Science-Pflicht [Q29] | perfekter inhaltlicher Fit | laut MIT-Solve-Eintrag Prototyp-Stadium ohne bezahltes Personal [Q29]; der Eintrag stammt vermutlich von 2024, aktueller Stand ⚠️ |
| ERDERA / EURORDIS | europäisch, Fokus Daten und AI, 380 Mio. EUR [Q27] | Vertrauen, Reichweite (über 1.000 Orgs [Q5]) | Konsortium, langsam |
| NORD | Zubringer zu IAMRARE („tritt bei") | direkter Nutzerkanal | US-Fokus |
| Open Source im Monarch-/MONDO-Ökosystem | Datenfundament liegt dort schon [Q32] | billig, glaubwürdig | niemand bezahlt die Kuration |
| Förder-Grant (Typ CZI Rare As One [Q38]) | Anschub 1–2 Jahre | schnell | befristet |

- **Kostenstruktur:** Compute und Hosting kosten wenig. Die eigentlichen Kosten sind **Kuration pro Cluster** (Orgs, Assets, Prüfdatum), medizinisches Review und Pflege, weil die Daten veralten. Die Grenzkosten eines neuen Clusters sind also Kurationszeit, nicht Server.
- **Was für Pilotnutzer:innen stimmen muss:** 3–5 Gruppen eines Clusters (z. B. ELA, MLD Foundation, KrabbeConnect), eine klinische Patin pro Cluster, ein Korrekturweg für Orgs („unser Register ist falsch eingetragen"), sichtbare Aktualität, **keine Patientendaten** (DSGVO-arm) und eine klare Zweckbestimmung „Forschungsnavigation, keine Diagnose oder Therapieempfehlung". ⚠️ Die Abgrenzung zu Medizinprodukte-Software nach EU-MDR ist nicht geprüft.
- **Pilot-Kennzahl:** Anteil der Action Cards, die binnen 4 Wochen zu einem Kontakt mit Antwort führen, und Zeit bis zur Entscheidung „beitreten oder bauen".

---

## 8. Entscheidungsfragen Wirtschaft & Nutzer (Grill-me)

Format je Frage: Frage · *Warum es zählt* · Optionen · **Empfehlung** · Zeitkosten · wer entscheidet. Bei Unklarheit gilt die Empfehlung, bis Hanno sie überstimmt.

### Zielnutzer & Story

**W1 · Wer ist DER primäre Nutzer, auf den jede UI-Entscheidung optimiert wird?**
*Warum:* Patient Progress und Product Craft verlangen eine durchgehende Journey; zwei Primärnutzer ergeben zwei halbe.
- A Leitung einer Patientengruppe (Nora/Maria): + Kern des Briefs, Jury sucht sie, emotional stark / − Laien-UX ist schwer, Fachtiefe muss versteckt werden.
- B Forschende (Dr. Osei): + Datentiefe direkt zeigbar / − Patient Progress leidet.
- C Förderer:in: + trifft das Interesse des Challenge-Owners / − nicht im Brief, wirkt kalt.
**Empfehlung:** A primär; C als ein Satz im Pitch (W7), B nur als Linse. Die Kriterien der Jury sind auf „a family or group moves …" gemappt. · Zeit: 0 h, spart Diskussion · Entscheidet: Hanno (Recep konsultiert)

**W2 · Nora (eigene Komposit-Figur) oder Maria aus dem Brief?**
*Warum:* Erinnerbarkeit. Die Jury hört Maria von jedem Team.
- A Nora pur: + eigenständig, europäischer Blick / − die Jury muss die Brücke zu Maria selbst schlagen.
- B Maria mit unseren Details: + null Übersetzungsaufwand / − austauschbar.
- C Nora als „our Maria from Vienna": + beides / − ein Satz mehr.
**Empfehlung:** C. Erster Satz im Video: „Nora is our Maria: a composite patient leader in Vienna." Der Persona-Schalter heißt weiter „Maria". · Zeit: 15 min Skript · Entscheidet: Hanno + Recep

**W3 · Was weiß Nora am Anfang: „nichts" oder „die Dachorganisation, aber nicht die Wiederverwendung über den Mechanismus"?**
*Warum:* Glaubwürdigkeit. ELA Deutschland und eine ERN-Patientenvertretung für Leukodystrophien existieren [Q44], [Q45]; wer das Feld kennt, nimmt „weiß nichts" nicht ab.
- A Nora weiß nichts: + mehr Fallhöhe / − unrealistisch, angreifbar.
- B Nora kennt ELA, weiß aber nicht, dass Tübingen sowohl GMFC-MLD als auch eine deutsche Krabbe-NHS gemacht hat, dass Krabbe in NCT03333200 steckt und dass HOME ein NHS-Template ist: + realistisch, präziserer Aha-Moment / − etwas weniger Drama.
**Empfehlung:** B. Der Aha-Moment wird zu „assets hide behind other disease names". · Zeit: 20 min Story · Entscheidet: Recep, Hanno gibt frei

**W4 · Bleibt die Zahl „11 Familien im deutschsprachigen Raum"?**
*Warum:* Konkretes macht Videos glaubwürdig, falsch Konkretes macht sie angreifbar.
- A behalten: + plausibel (~1–2 infantile Fälle pro Jahr in DE + AT, eigene Rechnung aus [Q10]; deutsche Kohorte 38 Pat. [Q13]) / − könnte als echte Gruppe gelesen werden.
- B „about a dozen families": + unangreifbar / − weniger konkret.
**Empfehlung:** A, mit „composite" im Untertitel. · Zeit: 0 · Entscheidet: Recep

**W5 · Zeigt das Demo-Video Devon (Honest Gap) als zweite Szene?**
*Warum:* Der Brief fordert „either a justified collaboration … or an honest gap". Die ehrliche Lücke unterscheidet uns von ChatGPT.
- A ja, 15–20 s im Demo-Video, nicht im 1-min-Walkthrough: + zeigt Ehrlichkeit / − Länge.
- B nur im Tech-Video: + fokussiert / − die Jury sieht es vielleicht nicht.
**Empfehlung:** A. · Zeit: 30 min Aufnahme · Entscheidet: Recep

**W6 · Persona-Schalter: 4 Linsen, 2 oder keiner?**
*Warum:* Product Craft gegen Build-Zeit. Die Jury sucht ihre Personas.
- A 4 Linsen: + Wiedererkennung / − 4 halbe Ansichten, viel Testaufwand.
- B 2 Linsen (Maria, Devon), Priya/Osei nur als Filter-Presets: + fokussiert / − Priya dünner.
- C keiner: + Zeit / − verschenkt die Wiedererkennung.
**Empfehlung:** B, Fallback C (steht schon in der Fallback-Liste). · Zeit: ~2 h Hanno · Entscheidet: Hanno

**W7 · Sprechen wir die versteckte Persona „Förderer:in" an?**
*Warum:* Der Challenge-Owner ist ein Förderer, und der Brief nennt „funders whose RFAs …" als optional, aber wertvoll.
- A ein Satz und eine Zahl im Pitch („three Krabbe natural-history cohorts, three protocols"): + trifft Buffalo / − fast kostenlos.
- B eigene Förderer-Ansicht: + stark / − Build-Zeit; das Investor-Modul ist im SCOPE ausgeschlossen.
- C gar nicht.
**Empfehlung:** A. · Zeit: 10 min · Entscheidet: Hanno

### Wertversprechen & Positionierung

**W8 · Was ist am Ende der Demo das „Produkt"?**
*Warum:* Patient Progress verlangt einen konkreten nächsten Schritt „this week". Ein Artefakt bleibt im Kopf.
- A Action Card als Screen: + schon geplant / − nichts zum Mitnehmen.
- B Action Card als exportierbarer Ein-Seiter (PDF oder Markdown) mit Quellenliste und Anschreiben-Absatz: + „from graph to e-mail", hat kaum ein anderes Team / − 1–2 h.
- C fertiger Mail-Entwurf an Personen: + maximal konkret / − wirkt wie ein Spam-Tool, heikel bei KOL-Adressen.
**Empfehlung:** B, ohne Auto-Versand und ohne persönliche Mailadressen. · Zeit: 1–2 h Hanno · Entscheidet: Hanno

**W9 · An wen richtet sich Noras Action Card?**
*Warum:* Network Overlap und Patient Progress. Ob der Empfänger passt, entscheidet über den Realismus der ganzen Story.
- A MLD Foundation (USA): + nah am Brief / − für Wien unrealistisch, und eine Stiftung ist keine Forschungsstätte.
- B Tübinger Kinderneurologie (GMFC-MLD + deutsche Krabbe-NHS, [Q18], [Q13]) + ELA Deutschland: + europäisch, echte KOL-Overlap-Kante aus den Daten, erreichbar / − Personen nur über Institution und Publikation nennen.
- C B als Empfänger, MLD Foundation und HOME als Präzedenz („so hat es die MLD-Community gemacht").
**Empfehlung:** C. · Zeit: 30 min Recep (hero_path.yaml um [Q13], [Q19], [Q20] ergänzen) + 30 min Hanno (Kanten) · Entscheidet: Hanno

**W10 · Kernversprechen: „Baut gemeinsam eine NHS" oder „Tretet bestehenden bei, statt neu zu bauen"?**
*Warum:* Für Krabbe gibt es NHS-Daten schon (Abschnitt 2.4). „Wir bauen eine NHS" zerlegt eine kundige Jurorin in einer Minute.
- A bauen: + passt zum Wortlaut des Brief-Moonshots / − für Krabbe faktisch schwach.
- B beitreten / wiederverwenden: + ehrlich, stärkere 10×-Rechnung (Abschnitt 6), passt zu Buffalos „shared infrastructure" / − der Meilenstein muss umformuliert werden (W16).
**Empfehlung:** B. Aus „launching a shared natural history study" wird „joining a shared natural-history effort instead of starting from zero". · Zeit: 1 h Doku + Skript · Entscheidet: Hanno

**W11 · Welchen einen Satz sollen Juror:innen nachher wiederholen?**
*Warum:* Bei 40 Teams bleibt ein Satz hängen, nicht eine Architektur.
- A „Names hide mechanisms. Constellate shows the assets behind them."
- B „Don't rebuild what a neighbouring disease already built."
- C „Every edge has a source, and when there is none, we say so."
**Empfehlung:** B als Hauptsatz (Wert), C als zweiter Satz (Vertrauen). A ist Brief-Sprache, die jedes Team verwendet. · Zeit: 0 · Entscheidet: Team, Hanno final

**W12 · Welche bestehenden Tools nennen wir offen?**
*Warum:* Graph Quality und Evidence Integrity. Die Jury kennt Orphanet und Monarch; sie zu verschweigen wirkt naiv.
- A keine: − wirkt naiv.
- B als Fundament und Ziel: „built on MONDO, HPO, Orphanet, Open Targets, Monarch; we route groups to IAMRARE, RDCA-DAP and NCT03333200 instead of rebuilding them": + macht uns zur Schicht darüber, nicht zum Konkurrenten.
- C als Konkurrenz mit Vergleichstabelle: − kleinlich.
**Empfehlung:** B, dazu RARe-SOURCE als im Brief genanntes Vorbild. · Zeit: 15 min README + Slide · Entscheidet: Osman (README), Hanno

**W13 · Wie grenzen wir uns von ChatGPT ab, wenn OpenAI der Sponsor ist?**
*Warum:* Das stärkste Substitut gehört dem Sponsor. „ChatGPT halluziniert" ist schlechter Stil und Track-Selbstmord.
- A nicht thematisieren.
- B positiv: „OpenAI models at three controlled points; the graph is the guardrail. Every sentence cites an edge: no edge, no sentence."
- C Vergleichsdemo ChatGPT vs. Constellate: + stark / − riskant, unfair, kostet Zeit.
**Empfehlung:** B. · Zeit: 0 · Entscheidet: Hanno

**W14 · Name: Constellate oder Kindred?**
*Warum:* Erinnerbarkeit und Passung zur Story.
- A Constellate: + greift die Tagline des Briefs auf, Repo und Discord laufen schon darauf / − abstrakt, nah an „Constellation" anderer Teams.
- B Kindred: + Familien, Verwandtschaft, passt zu „beitreten" / − Umbenennung kostet ~1 h (Repo, HackOS, Discord, Deck), Markencheck nicht gemacht ⚠️.
**Empfehlung:** A behalten, „kindred" als Wort in der Tagline nutzen („diseases that are kindred by mechanism"). · Zeit: 0 vs. ~1 h · Entscheidet: Hanno

**W15 · Was lassen wir bewusst weg, und sagen wir es laut?**
*Warum:* Fokus ist Product Craft, ehrliche Grenzen sind Evidence Integrity.
- A still weglassen.
- B Limitations in README und Tech-Video: kein Investor-Modul, keine Diagnose (Devon-Resolve ist eine Suchhilfe), keine Patientendaten, ein Cluster, Orgs kuratiert statt vollständig, keine Vermittlung von Datenzugang.
**Empfehlung:** B. · Zeit: 15 min · Entscheidet: Osman (README)

### Moonshot & Zahlen

**W16 · Welcher Meilenstein trägt die 10×-Rechnung?**
*Warum:* Das 10×-Kriterium verlangt Meilenstein, Timeline und Annahmen.
- A „Start einer gemeinsamen NHS" (SCOPE): − die gibt es schon (NCT03333200), und die SCOPE-Zahlen sind unbelegt.
- B „nutzbarer externer Kontrollarm für eine Krabbe-Interventionsstudie": + direkt aus der Libmeldy-Präzedenz, mit Kohortengrößen und Raten belegbar / − technischer.
- C „Entscheidung beitreten oder bauen ist getroffen": + direkter Effekt von Constellate / − klein, kein 10×.
**Empfehlung:** B als Moonshot, C als das, was die App heute schon leistet. · Zeit: 1 h Recep (MOONSHOT.md) · Entscheidet: Hanno + Recep

**W17 · Eine Zahl oder eine Szenario-Tabelle?**
*Warum:* Der Brief verlangt „assumptions behind a 10× acceleration".
- A nur „10×": − die Jury straft unbegründete Zahlen.
- B Tabelle A–D aus Abschnitt 6 mit 6 Annahmen und Spanne „~8–15×": + ehrlich, prüfbar / − komplexer.
**Empfehlung:** B im Moonshot-Panel und in MOONSHOT.md; im Video nur „about ten times faster, if three assumptions hold" und die drei nennen (Datenzugang, Endpunkt, Regulator). · Zeit: 1 h · Entscheidet: Recep

**W18 · Was machen wir mit „Rekrutierung über den Cluster: 3–5× mehr Patienten" (SCOPE)?**
*Warum:* Ein externer Kontrollarm ist krankheits- und subtypspezifisch (Libmeldy: gematcht nach Alter und Subtyp [Q14]). Die Behauptung ist fachlich falsch, und eine Jurorin mit Studienerfahrung merkt das.
- A ersatzlos streichen.
- B umformulieren: Pooling spart Infrastruktur (ein Protokoll, eine Plattform, ein Ethikantrag) und hilft bei mechanismusweiten Biomarker-Fragen, beschleunigt aber nicht die Krabbe-Kontrollen.
**Empfehlung:** B. · Zeit: 15 min · Entscheidet: Hanno

**W19 · Zeigen wir offen, dass es eine clusterweite NHS (NCT03333200) schon gibt?**
*Warum:* „Useful paths" und Evidence Integrity. Eine Jurorin findet das in zwei Minuten selbst.
- A verschweigen: − Glaubwürdigkeitsrisiko.
- B als Asset-Knoten, den Nora entdeckt („Krabbe is already part of a 1,500-patient longitudinal study — here is the record"): + genau unser Wert / − der Moonshot klingt kleiner, wirkt aber größer.
**Empfehlung:** B. Das ist kein Bug in der Story, sondern der Beweis, dass der Graph Doppelarbeit findet. · Zeit: 30 min (Kante + Asset-Knoten) · Entscheidet: Hanno

**W20 · Wie formulieren wir den kausalen Anteil von Constellate?**
*Warum:* 10× ohne Übertreibung. Die Jury fragt: „What exactly did your tool do?"
- A „Constellate makes research 10× faster": − Übertreibung.
- B „Constellate makes the 10× route visible to groups without a KOL in their phone book; the speed-up comes from reuse": + präzise, verteidigbar / − weniger knackig.
**Empfehlung:** B. · Zeit: 0 · Entscheidet: Hanno

**W21 · Nehmen wir Kosten-Zahlen in den Pitch?**
*Warum:* 10× Impact gewinnt durch Ökonomie, aber ein Zahlenfriedhof erschlägt die Familien-Story.
- A keine: + emotional sauber / − die Förderer-Sicht fehlt.
- B genau eine: „A natural-history study is the most expensive thing a patient group builds itself; the FDA caps its grants at $400k a year [Q24]. Reuse is money saved." + verbindet Story und Ökonomie.
- C alle (997 Mrd., 4,25 Mio., 400 k): − Zahlenfriedhof.
**Empfehlung:** B. Den Lenmeldy-Preis höchstens als Fußnote, sonst landen wir in der Preisdebatte. · Zeit: 0 · Entscheidet: Recep

### Vertrauen & Ethik

**W22 · Wie gehen wir mit falscher Hoffnung um?**
*Warum:* Der Brief sagt: „what remains uncertain". Die Gründerin des Challenge-Owners ist Mutter eines betroffenen Kindes [Q29].
- A nur ein Disclaimer im Footer.
- B fester Abschnitt „What this does NOT mean" auf jeder Action Card (z. B. „MLD's gene therapy does not treat Krabbe; a shared endpoint is not a treatment") + PMD-Gegenbeispiel prominent: + baut Vertrauen, hat kaum jemand / − 45 min.
- C Erfolgswahrscheinlichkeiten anzeigen: − pseudo-präzise, gefährlich.
**Empfehlung:** B. · Zeit: 45 min (Prompt + UI) · Entscheidet: Hanno

**W23 · Wo verläuft die Grenze zur medizinischen Beratung?**
*Warum:* Risiko und Vertrauen, potenziell auch regulatorisch (Software mit medizinischer Zweckbestimmung ⚠️ nicht geprüft).
- A nur Disclaimer.
- B die Zweckbestimmung im Design: Action Cards richten sich an Gruppen und Forschende („research navigation"), nie „your child should …"; Devon-Resolve zeigt „related communities", keine Diagnose.
**Empfehlung:** B plus Disclaimer. · Zeit: 30 min Wording + Prompt · Entscheidet: Hanno

**W24 · Wie gehen wir mit echten Organisationen und Personen um?**
*Warum:* Der Brief will „named contacts", aber die Orgs und KOLs sind real und wurden nicht gefragt.
- A Namen und Kontaktwege vollständig.
- B Orgs mit öffentlicher URL und Prüfdatum; Personen nur über öffentliche Publikation (PMID) und Institution; Hinweis „not affiliated, no endorsement".
- C anonymisieren: − widerspricht dem Brief.
**Empfehlung:** B. · Zeit: 15 min · Entscheidet: Osman (orgs.csv) + Hanno

**W25 · Kommen text_mined-Kanten in die Hero-Journey?**
*Warum:* OpenAI Extract muss sichtbar sein (Track), aber text_mined heißt ungeprüft.
- A Hero-Pfad nur aus curated/observed; text_mined als gestrichelte Nebenkanten mit Badge „AI-extracted, unverified".
- B text_mined im Hero-Pfad: − eine Hero-Aussage auf ungeprüfter Kante ist Angriffsfläche.
**Empfehlung:** A; Extract im Tech-Video zeigen. · Zeit: 0 (Designregel) · Entscheidet: Hanno

**W26 · Was zeigt der Gegenevidenz-Slot, wenn er leer ist?**
*Warum:* Leer sieht aus wie „nicht gesucht".
- A leer lassen.
- B „No contradicting evidence found in: [Quellen], [Datum]".
**Empfehlung:** B. · Zeit: 20 min · Entscheidet: Hanno

### Pitch & Jury

**W27 · Was sagen wir zum Geschäftsmodell, wenn gefragt?**
*Warum:* Ambition. Die Frage kommt fast sicher.
- A „Freemium-SaaS für Pharma": − widerspricht Buffalos Open-Science-Pflicht und unserer Positionierung als öffentliches Gut.
- B „Public good: open source and open data, carried by a funder or alliance (a knowledge platform like Buffalo's, ERDERA, NORD); the cost driver is curation per cluster, not compute."
- C B plus optional bezahlte Industrie-Linse (Exporte, Alerts), deren Erlöse die Kuration finanzieren: + nachhaltiger / − Frage nach Interessenkonflikten.
**Empfehlung:** B als Antwort; C nur auf Nachfrage als „could be explored". · Zeit: 0 · Entscheidet: Hanno

**W28 · Womit eröffnet das Demo-Video: Emotion oder Aha?**
- A Nora und Emil, 10 s Kontext, dann Suche: + Patient Progress von Sekunde 1.
- B direkt der PSAP-Aha: + Tempo / − die Jury weiß nicht, für wen.
**Empfehlung:** A, maximal 10 s, keine Kinderfotos, kein Stock-Leid. · Zeit: 0 · Entscheidet: Recep

**W29 · Adressieren wir die Buffalo Initiative explizit?**
*Warum:* Fit zum Challenge-Owner: Fokus pädiatrische Gehirnerkrankungen, Säulen Fonds, geteilte Infrastruktur, Knowledge Platform [Q29].
- A explizit („a prototype of the knowledge platform Buffalo describes"): + Fit / − wirkt anbiedernd, wenn wir ihren Stand falsch einschätzen.
- B implizit: Cluster = pädiatrisch-neurodegenerativ, Vokabular „shared infrastructure", „open science".
**Empfehlung:** B in Video und README. A nur im Live-Pitch am 10.10., falls Top 2, nach einem Check des aktuellen Buffalo-Stands. · Zeit: 0 · Entscheidet: Hanno

**W30 · Welcher Honest-Gap-Fall kommt in die Demo?**
*Warum:* Die Lücke muss echt sein, nicht nur eine Lücke in unserer Kuration.
- A ultra-seltene LSD ohne Gruppe in orgs.csv (SCOPE: CLN14): − die Lücke könnte an unserer Liste liegen.
- B Saposin-A-Defizienz („atypical Krabbe", OMIM 611722): sehr wenige Fälle, vermutlich keine eigene Gruppe und keine NHS → nächste Communities sind die Krabbe-Gruppen: + hängt direkt am Hero-Pfad / − ⚠️ dass es keine Gruppe gibt, muss erst geprüft werden.
**Empfehlung:** B, wenn Osmans Kuration bestätigt, dass es keine Gruppe gibt; sonst A mit klarer Coverage-Angabe. · Zeit: 30 min · Entscheidet: Osman + Hanno

---

## Offene ⚠️-Punkte

- Krabbe fehlt im österreichischen Neugeborenen-Screening: MedUni nennt über 30 Zielkrankheiten ohne Krabbe [Q12]; die vollständige Liste habe ich nicht eingesehen.
- MEDICAL-BACKGROUND §4: HOME-Studie läuft unter Sponsor NORD + FDA, nicht Orchard [Q19]. Bitte korrigieren (Recep).
- Annahmen A1, A4, A5 und A6 (Setup-Dauer, Dauer des Datenzugangs, Harmonisierung, Regulator) sind unbelegt. Route D (KOL-Zugang) ist geschätzt.
- SCOPE.md: „5–8 Jahre", „6–12 Monate" und „3–5× mehr Patienten" sind unbelegt bzw. fachlich falsch (W18).
- Sunitha Malepati als Fellow bei Renaissance Philanthropy: nur aus Suchtreffern, die Seite gab 404 [Q30]. Die Herkunft des Namens „Buffalo" ist unklar; nicht mit Buffalo NY oder Hunter's Hope verknüpfen.
- OpenAI HealthBench: nur Sekundärquelle, openai.com gab 403 [Q40].
- Libmeldy-Listenpreis in England £2,875 Mio. (NICE HST18): Seite gab 403, Wert nur aus dem Suchtreffer [Q43]. Nicht verwendet, nur als Hinweis.
- Kommerzielle Pharma-Datenbanken: Existenz und Rolle nicht im Detail geprüft.
- EU-MDR-Abgrenzung (Software als Medizinprodukt): nicht geprüft.
- Saposin-A-Defizienz ohne eigene Patientengruppe (W30): nicht geprüft.

---

## Quellen

- [Q1] Haendel M et al. How many rare diseases are there? Nat Rev Drug Discov 2020;19:77–78. PMID 32020066 – https://pubmed.ncbi.nlm.nih.gov/32020066/ · Mondo-Zählung 10.394: https://zenodo.org/record/3477634
- [Q2] Nguengang Wakap S et al. Estimating cumulative point prevalence of rare diseases: analysis of the Orphanet database. Eur J Hum Genet 2020;28:165–173. PMID 31527858 – https://pubmed.ncbi.nlm.nih.gov/31527858/
- [Q3] NIH GARD, About – https://rarediseases.info.nih.gov/about
- [Q4] Fermaglich LJ, Miller KL. Orphan drug designations and approvals over forty years of the ODA. Orphanet J Rare Dis 2023;18:163. PMID 37353796 – https://pubmed.ncbi.nlm.nih.gov/37353796/
- [Q5] EURORDIS, Who we are – https://www.eurordis.org/who-we-are/
- [Q6] Faye F et al. Time to diagnosis … Rare Barometer. Eur J Hum Genet 2024;32:1116–1126. PMID 38755315 – https://pubmed.ncbi.nlm.nih.gov/38755315/
- [Q7] Yang G et al. The national economic burden of rare disease in the United States in 2019. Orphanet J Rare Dis 2022. PMID 35414039 – https://pubmed.ncbi.nlm.nih.gov/35414039/
- [Q8] EveryLife Foundation, Cost of Delayed Diagnosis (14.09.2023) – https://www.businesswire.com/news/home/20230914147014/en/
- [Q9] Orchard Therapeutics, US launch plans for Lenmeldy (20.03.2024) – https://ir.orchard-tx.com/news-releases/news-release-details/orchard-therapeutics-outlines-us-launch-plans-lenmeldytm
- [Q10] Orsini JJ et al. Newborn screening for Krabbe's disease. J Neurosci Res 2016. PMID 27638592 – https://pubmed.ncbi.nlm.nih.gov/27638592/
- [Q11] Destatis, Geburten – https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Geburten/geburten-aktuell.html
- [Q12] MedUni Wien, 60 Jahre Neugeborenen-Screening (06/2026) – https://www.meduniwien.ac.at/web/en/about-us/news/2026/news-in-june-2026/60-years-of-austrian-newborn-screening/
- [Q13] Krieg SI et al. Natural history of Krabbe disease – a nationwide study in Germany. Orphanet J Rare Dis 2020;15:243. PMID 32912261 – https://pubmed.ncbi.nlm.nih.gov/32912261/
- [Q14] Fumagalli F et al. Lentiviral HSC gene therapy for early-onset MLD. Lancet 2022;399:372–383. PMID 35065785 – https://pubmed.ncbi.nlm.nih.gov/35065785/
- [Q15] Bascou N et al. A prospective natural history study of Krabbe disease … Orphanet J Rare Dis 2018;13:126. PMID 30089515 – https://pubmed.ncbi.nlm.nih.gov/30089515/
- [Q16] Critical Path Institute, RDCA-DAP – https://c-path.org/program/rare-disease-cures-accelerators-data-and-analytics-platform
- [Q17] ClinicalTrials.gov NCT00983879 – https://clinicaltrials.gov/study/NCT00983879
- [Q18] Kehrer C et al. The natural course of gross motor deterioration in MLD. Dev Med Child Neurol 2011. PMID 21707604 – https://pubmed.ncbi.nlm.nih.gov/21707604/
- [Q19] ClinicalTrials.gov NCT04628364 (HOME Study, Sponsor NORD, Collaborator FDA) – https://clinicaltrials.gov/study/NCT04628364
- [Q20] ClinicalTrials.gov NCT03333200 (Longitudinal Study of Neurodegenerative Disorders) – https://clinicaltrials.gov/study/NCT03333200
- [Q21] ClinicalTrials.gov NCT00358943 (ICGG Gaucher Registry) – https://clinicaltrials.gov/study/NCT00358943
- [Q22] FDA, Designating an Orphan Product – https://www.fda.gov/industry/medical-products-rare-diseases-and-conditions/designating-orphan-product-drugs-and-biological-products
- [Q23] Verordnung (EG) Nr. 141/2000 über Arzneimittel für seltene Leiden – https://eur-lex.europa.eu/eli/reg/2000/141/oj
- [Q24] FDA Press Release, Grants for natural history studies (29.02.2016) – https://www.fda.gov/news-events/press-announcements/fda-providing-2-million-new-grants-natural-history-studies-rare-diseases
- [Q25] Scientific American, Cystic Fibrosis Charity Sells Drug Rights for $3.3 Billion (12/2014) – https://www.scientificamerican.com/article/cystic-fibrosis-charity-sells-drug-rights-to-pharma-for-3-3-billion/
- [Q26] IRDiRC, Vision and goals – https://irdirc.org/vision-goals/
- [Q27] Europäische Kommission, ERDERA €380 Mio. (12.09.2024) – https://research-and-innovation.ec.europa.eu/news/all-research-and-innovation-news/erdera-partnership-eu380-million-effort-transform-rare-disease-research-under-horizon-europe-2024-09-12_en
- [Q28] Research activity and capability in the European reference network MetabERN. Orphanet J Rare Dis 2019 – https://ojrd.biomedcentral.com/articles/10.1186/s13023-019-1091-8
- [Q29] MIT Solve, Buffalo Initiative – https://solve.mit.edu/solutions/92088
- [Q30] Renaissance Philanthropy, Sunitha Malepati (Seite 404, nur Suchtreffer) ⚠️ – https://www.renaissancephilanthropy.org/team/sunitha-malepati
- [Q31] NORD, About – https://rarediseases.org/about/
- [Q32] Putman TE et al. The Monarch Initiative in 2024. Nucleic Acids Res 2024;52:D938–D949 – https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10767791/
- [Q33] EMBL, Pfizer joins the Open Targets consortium – https://www.embl.org/news/science/pfizer-joins-the-open-targets-consortium/
- [Q34] NCATS RARe-SOURCE, About – https://raresource.nih.gov/about-us
- [Q35] Global Genes, Completion of RARE-X merger – https://globalgenes.org/press/global-genes-announces-completion-of-rare-x-merger-and-strategic-direction-for-combined-organization/
- [Q36] ARPA-H, MATRIX award to Every Cure (28.02.2024) – https://www.arpa-h.gov/news-and-events/arpa-h-awards-ai-driven-project-repurpose-approved-medications
- [Q37] EveryONE Medicines & Mendelian (29.04.2025) – https://www.businesswire.com/news/home/20250429827883/en
- [Q38] Chan Zuckerberg Initiative, $13.5 Mio. für 30 patient-led organizations (03.02.2020) – https://chanzuckerberg.com/newsroom/chan-zuckerberg-initiative-awards-13-5-million-to-drive-progress-against-rare-diseases/
- [Q40] Fierce Healthcare, OpenAI releases HealthBench (05/2025, Sekundärquelle) ⚠️ – https://fiercehealthcare.com/ai-and-machine-learning/openai-pushes-further-healthcare-release-healthbench-evaluate-ai-models
- [Q41] FDA Draft Guidance, Rare Diseases: Natural History Studies for Drug Development (03/2019) – https://www.fda.gov/regulatory-information/search-fda-guidance-documents/rare-diseases-natural-history-studies-drug-development
- [Q43] NICE HST18, Atidarsagene autotemcel (Seite 403) ⚠️ – https://www.nice.org.uk/guidance/HST18
- [Q44] ELA International, Our missions – https://ela-asso.com/en/lassociation-ela/our-missions/
- [Q45] ERN-RND, ePAG patient advocate for leukodystrophies from Germany – https://www.ern-rnd.eu/new-epag-patient-advocate-for-leukodystrophies-from-germany/
- Teamintern geprüft: `docs/MEDICAL-BACKGROUND.md` (Krabbe-Screening in US-Staaten, Therapiestatus, GMFC-MLD, FBX-101)
