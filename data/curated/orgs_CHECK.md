# Orgs-Prüfliste für Osman (Entwurf vom 03.10.2026)

Öffne je Zeile den Link und prüfe kurz, ob Name, Land und Krankheit stimmen und ob der Beleg bei jedem `yes` wirklich auf der Seite steht (Ctrl+F nach dem Zitat aus `draft_evidence`). Stimmt es, setze in `data/curated/orgs_draft.csv` `verified_date=2026-10-03`, korrigiere falsche Felder (im Zweifel auf `unknown`, URLs nur wenn du sie gesehen hast) und hake unten ab. Dann übernimm die Zeile ohne die beiden Spalten `draft_evidence` und `draft_source_urls` nach `data/curated/orgs.csv`; die Kopfzeile dort bleibt unverändert.

Zeitplan: 40 Zeilen, je ca. 30 Sekunden, also etwa 20 bis 25 Minuten. Zeilen mit `unknown` überall brauchen nur: Seite lädt, Name passt, Ctrl+F nach „registry“ / „natural history“ / „biobank“ (DACH: Register / Studie / Biobank) findet nichts.

Lesehilfe: `yes` heißt, die Seite belegt ein Register, eine Natural-History-Studie oder Biobank zur Krankheit. Das kann selbst betrieben, mit-betrieben oder nur verlinkt sein; `notes` sagt welches. `unknown` heißt nichts gefunden, nicht „gibt es nicht“. `no` habe ich nirgends vergeben. Alle Zitate habe ich per Skript wörtlich gegen die Live-Seite geprüft. Hinweis: Cloudflare-Seiten (Hunter's Hope, KrabbeConnect, NNPDF, IGA, Cystinosis Research Foundation) blocken curl mit generischem Browser-Header, im Browser laden sie normal.

Stand: 40 Zeilen. Register yes: 19, NHS yes: 14, Biobank yes: 3.

## A. International, US, UK (27 Zeilen)

- [ ] **01 Hunter's Hope Foundation** (US) · [Startseite](https://www.huntershope.org) · [Kontakt](https://www.huntershope.org/contact-us/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: Nur Familien-Anmeldeformular (Support) gefunden. Suche auf der Seite nach „registry“; findest du eine Forschungs-Registry, Feld auf yes.
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **02 KrabbeConnect** (US) · [Startseite](https://krabbeconnect.org) · [Kontakt](https://krabbeconnect.org/about-krabbeconnect/contact-us/)
  - Sehen: Register: auf [krabbeconnect.org/community-engagement/krabbecures/](https://krabbeconnect.org/community-engagement/krabbecures/) steht „KrabbeCURES is more than a versatile online system that securely collects and stores data …“; Register: auf [krabbeconnect.org/community-engagement/krabbecures/](https://krabbeconnect.org/community-engagement/krabbecures/) steht „a collaborative effort between KrabbeConnect and the National Organization for Rare Disord…“
  - Achtung: KrabbeCURES-Seite öffnen: „supports research on Krabbe disease and how it progresses over time“. Entscheide, ob das NHS=yes heißt.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **03 Krabbe UK** (GB) · [Startseite](https://www.krabbeuk.org) · [Kontakt](https://www.krabbeuk.org/contact)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: Kleine Seite. Ctrl+F nach „registry“ und „research“, sonst bleibt alles unknown.
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **04 MLD Foundation** (US) · [Startseite](https://mld.foundation) · [Kontakt](https://mld.foundation/contactus/)
  - Sehen: Register: auf [mld.foundation/privacy-data-policy/](https://mld.foundation/privacy-data-policy/) steht „The MLD Patient Powered Registry is managed and hosted by a third party, Sanford Health.“; NHS: auf [mld.foundation/join-our-call-for-open-natural-history-…](https://mld.foundation/join-our-call-for-open-natural-history-studies/) steht „A new Natural History Study (NHS) for MLD was launched a few weeks ago.“
  - Achtung: NHS-Beleg ist ein alter Blogpost (ca. 2014). Aktuelle NHS genannt? Sonst NHS auf unknown. Land US nur aus Events abgeleitet.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **05 United Leukodystrophy Foundation** (US) · [Startseite](https://ulf.org) · [Kontakt](https://ulf.org/contact-us/)
  - Sehen: NHS: auf [ulf.org/research/clinical-trials/](https://ulf.org/research/clinical-trials/) steht „Note that we are actibely recruiting participants for other GLIA-CTN natural history studi…“
  - Draft: Register unknown · NHS yes · Biobank unknown

- [ ] **06 The Global Leukodystrophy Initiative (GLIA)** (INT) · [Startseite](https://theglia.org) · [Kontakt](https://theglia.org/contact)
  - Sehen: NHS: auf [theglia.org/gliactn/projects](https://theglia.org/gliactn/projects) steht „PROJECT 1 - Longitudinal Natural History Study“; Biobank: auf [theglia.org/participate](https://theglia.org/participate) steht „The GLIA-CTN is home to a multi-center “research biorepository” that is open to all indivi…“
  - Achtung: Konsortium, keine Patientengruppe. Biobank und NHS stehen auf participate/projects.
  - Draft: Register unknown · NHS yes · Biobank yes

- [ ] **07 Alex, The Leukodystrophy Charity** (GB) · [Startseite](https://alextlc.org) · [Kontakt](https://alextlc.org/contact-us/)
  - Sehen: Register: auf [alextlc.org/condition-management/nhs-patient-service-r…](https://alextlc.org/condition-management/nhs-patient-service-registry/) steht „In 2021 NHS England commissioned a new IWMD (leukodystrophy) patient service and clinical …“; NHS: auf [alextlc.org/news/lcc-patient-registry/](https://alextlc.org/news/lcc-patient-registry/) steht „establish a long-term natural history as a means to develop clinical outcome measures for …“
  - Achtung: Das Register gehört NHS England, die Charity verweist nur. NHS-Beleg betrifft nur die LCC-Studie.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **08 ELA - Association Européenne contre les Leucodystrophies** (FR) · [Startseite](https://ela-asso.com) · [Kontakt](https://ela-asso.com/contacts/)
  - Sehen: Register: auf [www.leuconnect.com/de-DE](https://www.leuconnect.com/de-DE) steht „ELA Frankreich und ELA International führen Leuconnect ein, eine Online-Plattform zur Unte…“
  - Achtung: Leuconnect steht nicht auf ela-asso.com, der Beleg liegt auf leuconnect.com.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **09 National Gaucher Foundation** (US) · [Startseite](https://www.gaucherdisease.org) · [Kontakt](https://www.gaucherdisease.org/contact-us/)
  - Sehen: Register: auf [www.gaucherdisease.org/blog/medical-history-internatio…](https://www.gaucherdisease.org/blog/medical-history-international-gaucher-registry/) steht „the registry is the largest and most comprehensive database of de-identified Gaucher stati…“; NHS: auf [www.gaucherdisease.org/research/current-research-proto…](https://www.gaucherdisease.org/research/current-research-protocols/) steht „The NIH is conducting a Natural History Study pertaining to those who have Gaucher disease…“
  - Achtung: Register ist das ICGG-Register (Sanofi), NGF beschreibt es nur. Studie ist eine NIH-NHS, nur gelistet.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **10 International Gaucher Alliance** (INT) · [Startseite](https://gaucheralliance.org) · [Kontakt](https://gaucheralliance.org/partner-with-us/)
  - Sehen: Register: auf [gaucheralliance.org/scientific-publicati/a-global-neur…](https://gaucheralliance.org/scientific-publicati/a-global-neuropathic-gaucher-disease-registry-gardian-a-patient-led-initiative/) steht „Describes GARDIAN, a patient-led and patient-owned registry for neuropathic Gaucher diseas…“; Register: auf [gaucheralliance.org/clinical-trials/](https://gaucheralliance.org/clinical-trials/) steht „International Collaborative Gaucher Group (ICGG) Gaucher Disease Registry & Pregnancy Sub-…“; NHS: auf [gaucheralliance.org/clinical-trials/](https://gaucheralliance.org/clinical-trials/) steht „Natural History of Glycosphingolipid Storage Disorders and Glycoprotein Disorders“
  - Achtung: GARDIAN-Seite auf IGA-Domain prüfen. Clinical-Trials-Seite listet fremde Register/NHS.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **11 National Niemann-Pick Disease Foundation, Inc. (NNPDF)** (US) · [Startseite](https://nnpdf.org) · [Kontakt](https://nnpdf.org/about-us/)
  - Sehen: Register: auf [nnpdf.org/family-support/inpdr/](https://nnpdf.org/family-support/inpdr/) steht „a disease-specific global registry, a subsidiary of the International Niemann-Pick disease…“; NHS: auf [nnpdf.org/treatments-and-research/natural-history-stud…](https://nnpdf.org/treatments-and-research/natural-history-study/) steht „National Institutes of Health shares Survival Data in NPC Natural History Study“
  - Achtung: Register = INPDR (verlinkt). NHS-Seite: NIH NPC Natural History Study.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **12 Niemann-Pick UK (NPUK)** (GB) · [Startseite](https://www.npuk.org) · [Kontakt](https://www.npuk.org)
  - Sehen: Register: auf [www.npuk.org/research/international-niemann-pick-disea…](https://www.npuk.org/research/international-niemann-pick-disease-registry-inpdr/) steht „Now operating as an independently governed global registry, the INPDR captures and manages…“
  - Achtung: Alte Start-Domain niemannpick.org.uk ist leer, offizielle Seite ist npuk.org. Kein Kontakt-Unterseite, Mail steht auf der Startseite.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **13 International Niemann-Pick Disease Registry (INPDR)** (INT) · [Startseite](https://inpdr.org) · [Kontakt](https://inpdr.org/contact/)
  - Sehen: Register: auf [inpdr.org/what-is-the-inpdr/about-the-registry/](https://inpdr.org/what-is-the-inpdr/about-the-registry/) steht „The International Niemann-Pick Disease Registry (INPDR) is a disease-specific patient regi…“
  - Achtung: Das Register selbst, keine Patientengruppe.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **14 Ara Parseghian Medical Research Foundation** (US) · [Startseite](https://parseghian.org) · [Kontakt](https://parseghian.org/contactus.html)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: Startseite hat nur einen Bild-Link zu einer Registry-Seite, ohne Text. Bleibt unknown, außer du siehst mehr.
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **15 National MPS Society** (US) · [Startseite](https://mpssociety.org/en/) · [Kontakt](https://mpssociety.org/en/contact-us/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: News vom 05.02.2026: Registry in Entwicklung. Ist die Einschreibung offen, Register auf yes.
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **16 MPS Society (UK)** (GB) · [Startseite](https://mpssociety.org.uk) · [Kontakt](https://mpssociety.org.uk/about-mps-society/contact-us)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **17 Cure Sanfilippo Foundation** (US) · [Startseite](https://curesanfilippofoundation.org) · [Kontakt](https://curesanfilippofoundation.org/meet-the-families/contact-us-families/)
  - Sehen: NHS: auf [curesanfilippofoundation.org/what-is-sanfilippo/curren…](https://curesanfilippofoundation.org/what-is-sanfilippo/current-research-on-sanfilippo/clinical-trials-sanfilippo/) steht „Natural History Study of Participants With Sanfilippo Syndrome Type IIIC“
  - Achtung: NHS sind Studien Dritter, die die Stiftung listet.
  - Draft: Register unknown · NHS yes · Biobank unknown

- [ ] **18 International Society for Mannosidosis & Related Diseases (ISMRD)** (INT) · [Startseite](https://www.ismrd.org) · [Kontakt](https://www.ismrd.org/contact-us/)
  - Sehen: NHS: auf [www.ismrd.org/news-and-events/research-and-grants/](https://www.ismrd.org/news-and-events/research-and-grants/) steht „ISMRD has partnered with Dr Sara Cathey the lead investigator and the Greenwood Genetic Ce…“
  - Achtung: NHS läuft am Greenwood Genetic Center, ISMRD finanziert/partnert. ORPHA-Liste kurz prüfen.
  - Draft: Register unknown · NHS yes · Biobank unknown

- [ ] **19 ML4 Foundation** (US) · [Startseite](https://ml4.org) · [Kontakt](https://ml4.org/contact-us/)
  - Sehen: Register: auf [ml4.org/glossary/registry/](https://ml4.org/glossary/registry/) steht „The MLIV disease registry is housed at Sanford by Coordination of Rare Diseases at Sanford…“; NHS: auf [ml4.org/mliv-research/](https://ml4.org/mliv-research/) steht „The ML4 Foundation has funded a 3-year prospective and retrospective natural history study…“
  - Achtung: Register liegt bei Sanford (CoRDS), steht auf der Glossar-Seite.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **20 National Tay-Sachs & Allied Diseases Association (NTSAD)** (US) · [Startseite](https://ntsad.org) · [Kontakt](https://ntsad.org/about/contact-us/)
  - Sehen: NHS: auf [ntsad.org/ntsad-research/research-for-families-and-ind…](https://ntsad.org/ntsad-research/research-for-families-and-individuals/natural-history-studies/) steht „This is a natural history study that will evaluate any patient with enzyme or DNA confirme…“; Biobank: auf [ntsad.org/ntsad-research/virtual-biorepository/](https://ntsad.org/ntsad-research/virtual-biorepository/) steht „NTSAD has created a virtual biorepository to facilitate the sharing of research samples in…“
  - Achtung: Biobank = „Virtual Biorepository“ (Vermittlung von Proben). NHS sind gelistete Fremdstudien.
  - Draft: Register unknown · NHS yes · Biobank yes

- [ ] **21 Batten Disease Support & Research Association (BDSRA)** (US) · [Startseite](https://bdsrafoundation.org) · [Kontakt](https://bdsrafoundation.org/contact-us/)
  - Sehen: Register: auf [bdsrafoundation.org/family-register/](https://bdsrafoundation.org/family-register/) steht „The BDSRA Foundation Family Register is a confidential contact database that enables us to…“; NHS: auf [bdsrafoundation.org/research/clinical-studies/](https://bdsrafoundation.org/research/clinical-studies/) steht „Natural History Study - all NCL types“
  - Achtung: „Family Register“ ist nur eine Kontaktdatenbank. Wenn dir das nicht reicht, Register auf unknown.
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **22 Beyond Batten Disease Foundation** (US) · [Startseite](https://beyondbatten.org) · [Kontakt](https://beyondbatten.org/contact/)
  - Sehen: NHS: auf [beyondbatten.org/research/cln3-natural-history-study/](https://beyondbatten.org/research/cln3-natural-history-study/) steht „BBDF is proud to support the CLN3 Natural History Study at the National Institutes of Heal…“
  - Achtung: NHS ist die NIH-CLN3-Studie, die BBDF unterstützt.
  - Draft: Register unknown · NHS yes · Biobank unknown

- [ ] **23 International Pompe Association (IPA)** (INT) · [Startseite](https://worldpompe.org) · [Kontakt](https://worldpompe.org/about-us/ipa-members-a-contacts/)
  - Sehen: Register: auf [worldpompe.org/pompe-disease/pompe-registry/](https://worldpompe.org/pompe-disease/pompe-registry/) steht „The Pompe Registry is an ongoing, international multi-center, strictly observational progr…“
  - Achtung: Register (Genzyme/Sanofi) wird nur dargestellt, nicht betrieben.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **24 AMDA Pompe (Acid Maltase Deficiency Association)** (US) · [Startseite](https://amda-pompe.org) · [Kontakt](https://amda-pompe.org/contact-us/)
  - Sehen: Register: auf [amda-pompe.org/professional-registry/](https://amda-pompe.org/professional-registry/) steht „The AMDA maintains a patient registry to help determine the number of people affected by t…“
  - Achtung: AMDA nennt ein eigenes Patientenregister. Die Seite /patients-registry/ ist verlinkt, ich habe sie nicht gelesen.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **25 Cystinosis Research Foundation** (US) · [Startseite](https://www.cystinosisresearch.org) · [Kontakt](https://www.cystinosisresearch.org/contact/)
  - Sehen: Register: auf [www.cystinosisresearch.org/cure-cystinosis-internation…](https://www.cystinosisresearch.org/cure-cystinosis-international-registry/) steht „The Cystinosis Research Foundation has partnered with CoRDS (Coordination of Rare Diseases…“
  - Achtung: Register CCIR läuft mit CoRDS. Seite sagt nichts zu natural history oder Biobank.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **26 CDG CARE** (US) · [Startseite](https://cdgcare.org) · [Kontakt](https://cdgcare.org/research/)
  - Sehen: Register: auf [cdgcare.org/research/](https://cdgcare.org/research/) steht „Rare Commons Research Project and Patient Registry“; Biobank: auf [cdgcare.org/](https://cdgcare.org/) steht „CDG CARE has partnered with COMBINEDBrain to launch the new CDG Biorepository“
  - Achtung: Nachbar-Krankheit (kein LSD). Registry-Beleg ist ein Link-Text auf der Research-Seite.
  - Draft: Register yes · NHS unknown · Biobank yes

- [ ] **27 LAL Solace, Inc.** (US) · [Startseite](https://www.lalsolace.org)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: Seite lädt nicht (HTTP 525). Nochmal probieren, sonst als inaktiv notieren. URL stammt vom NORD-Verzeichnis.
  - Draft: Register unknown · NHS unknown · Biobank unknown

## B. Deutschsprachiger Raum (13 Zeilen)

- [ ] **28 ELA Deutschland e.V.** (DE) · [Startseite](https://elaev.de) · [Kontakt](https://elaev.de/der-verein/kontakt/)
  - Sehen: Register: auf [elaev.de/leukodystrophien/](https://elaev.de/leukodystrophien/) steht „Leuconnect – Das Patientenregister“; NHS: auf [elaev.de/leukodystrophien/forschungsfoerderung/](https://elaev.de/leukodystrophien/forschungsfoerderung/) steht „ELA förderte Studien zum natürlichen Verlauf von Metachromatischer Leukodystrophie (MLD) d…“
  - Achtung: Wichtigste DACH-Gruppe für Krabbe/MLD. Register = Leuconnect (Link auf der Seite), NHS = von ELA gefördert (Uni Tübingen).
  - Draft: Register yes · NHS yes · Biobank unknown

- [ ] **29 Gesellschaft für MPS e.V. (MPS-Deutschland)** (DE) · [Startseite](https://mps-ev.de) · [Kontakt](https://mps-ev.de/beratungs-und-geschaeftsstelle/)
  - Sehen: Register: auf [mps-ev.de/patientendatenbank/](https://mps-ev.de/patientendatenbank/) steht „2018 sind wir deswegen mit dem Mammutprojekt „Patientendatenbank“ gestartet.“
  - Achtung: „Patientendatenbank“ seit 2018, Mitglieder-Daten, alle 1 bis 2 Jahre aktualisiert.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **30 MPS Austria - Gesellschaft für MukoPolySaccharidosen und ähnliche Erkrankungen** (AT) · [Startseite](https://www.mps-austria.at) · [Kontakt](https://www.mps-austria.at/wichtige-kontakte/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **31 Pompe Deutschland e.V.** (DE) · [Startseite](https://www.mpompe.de) · [Kontakt](https://www.mpompe.de/kontakt)
  - Sehen: Register: auf [www.mpompe.de/pompe/pompe-register](https://www.mpompe.de/pompe/pompe-register) steht „finanzierte Pompe Registry zur Erfassung klinischer Daten“
  - Achtung: Seite informiert über das Sanofi-Register und den Pompe Survey (Erasmus), betreibt sie nicht.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **32 Morbus Fabry Selbsthilfegruppe e.V. (MFSH)** (DE) · [Startseite](https://fabry-shg.org) · [Kontakt](https://fabry-shg.org/kontakt-alt/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **33 Morbus Fabry Selbsthilfegruppe Österreich** (AT) · [Startseite](https://morbus-fabry.eu) · [Kontakt](https://morbus-fabry.eu/kontakt/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **34 Gaucher Gesellschaft Deutschland e.V.** (DE) · [Startseite](https://www.ggd-ev.de) · [Kontakt](https://www.ggd-ev.de/kontakt/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **35 ÖGG Österreichische Gesellschaft für Gauchererkrankungen (Morbus Gaucher Austria)** (AT) · [Startseite](https://morbus-gaucher-oegg.at) · [Kontakt](https://morbus-gaucher-oegg.at/impressum/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **36 Verein Hand in Hand für Tay-Sachs & Palliativkinder** (AT) · [Startseite](http://www.tay-sachs.net) · [Kontakt](http://www.tay-sachs.net/de/verein/kontakt)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **37 NCL-Stiftung** (DE) · [Startseite](https://www.ncl-stiftung.de) · [Kontakt](https://www.ncl-stiftung.de/kontakt/)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **38 Pro Rare Austria, Allianz für seltene Erkrankungen** (AT) · [Startseite](https://www.prorare-austria.org) · [Kontakt](https://www.prorare-austria.org/kontakte)
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: Mitgliederliste öffnen: LSD-Mitglieder sind MPS, Fabry, ÖGG, Hand in Hand. Kein Krabbe/MLD/Niemann-Pick-Eintrag.
  - Draft: Register unknown · NHS unknown · Biobank unknown

- [ ] **39 ProRaris - Allianz Seltener Krankheiten Schweiz** (CH) · [Startseite](https://www.proraris.ch) · [Kontakt](https://www.proraris.ch/de/kontakt-375/)
  - Sehen: Register: auf [www.proraris.ch/de/seltene-krankheiten/forschung-zu-se…](https://www.proraris.ch/de/seltene-krankheiten/forschung-zu-seltenen-krankheiten/schweizerisches-register-fuer-seltene-krankheiten-279/) steht „Das Schweizer Register für Seltene Krankheiten (SRSK) ist ein nationales Register für Selt…“
  - Achtung: yes bezieht sich auf das nationale Schweizer Seltene-Krankheiten-Register, nicht krankheitsspezifisch. Entscheide, ob yes bleibt.
  - Draft: Register yes · NHS unknown · Biobank unknown

- [ ] **40 Niemann-Pick Selbsthilfegruppe Deutschland e.V.** (DE) · keine URL
  - Sehen: Seite lädt, Name und Krankheit passen. Kein Beleg im Entwurf (alles unknown).
  - Achtung: Keine URL. niemann-pick.de NICHT öffnen (leitet auf fremden Werbehost um). Aktuelle Seite über die INPDA-Mitgliederliste suchen.
  - Draft: Register unknown · NHS unknown · Biobank unknown

## Honest-Gap-Kandidaten (Krankheiten ohne eigene Organisation in dieser Liste)

- **Saposin-A-Defizienz / atypischer Krabbe (PSAP)**: keine eigene Organisation gefunden. Zwei Websuchen und ein Scan von Startseiten und Sitemaps der 21 lesbaren Seiten fanden nur einen ULF-Newsbeitrag (2024/12) über eine PSAP-Mutation bei MLD. Orphanet führt ORPHA:139406 (Encephalopathy due to prosaposin deficiency) und ORPHA:309252 (atypischer Gaucher durch Saposin C), aber keinen eigenen Eintrag für Saposin A. Die Global-Genes-Seiten dazu waren nicht abrufbar (403), Verzeichnisse nennen laut Suche nur allgemeine LSD-Dachgruppen.
- **Österreich: Krabbe, MLD, Niemann-Pick, Pompe, Leukodystrophien allgemein**: in der Pro-Rare-Austria-Mitgliederliste (geöffnet 03.10.2026) gibt es keinen Eintrag dafür. Für 4H, X-ALD/AMN und NCL stehen dort nur Einzelpersonen als Kontakt (nicht aufgenommen). Morbus Pompe Österreich existiert (morbus-pompe.at), ist aber kein Pro-Rare-Mitglied und steht nicht in der Tabelle.
- **Krabbe im deutschsprachigen Raum**: keine Krabbe-spezifische Gruppe gefunden, nur ELA Deutschland (Leukodystrophien allgemein, nennt Krabbe und MLD).
- **Schweiz**: ELA Suisse wird auf ELA-Seiten genannt, eine eigene Website habe ich nicht gefunden. ProRaris ist nur Dachverband.
- **Niemann-Pick Deutschland**: Gruppe wird in INPDA-Material erwähnt, aktuelle Website nicht auffindbar (Zeile 40 ohne URL).
- **Register, die ELA/Hunter's Hope selbst betreiben**: Hunter's Hope zeigt nur ein Support-Anmeldeformular. Das Krabbe-Register (NCT02993796) gehört laut ClinicalTrials.gov zu SUNY Buffalo.

## Geprüft, nicht aufgenommen (wegen 40-Zeilen-Grenze oder ohne Befund)

- ACHSE e.V. ([achse-online.de](https://www.achse-online.de)), DE-Dachverband: erwähnt nur die NARSE-Initiative, kein krankheitsspezifisches Register.
- Fabry International Network ([fabrynetwork.org](https://www.fabrynetwork.org)): News 2021, dass Takeda das FOS-Register schließt.
- Fabry Support & Information Group ([fabry.org](https://www.fabry.org)): nichts zu Register/NHS/Biobank gefunden.
- Cystinosis Research Network ([cystinosis.org](https://cystinosis.org)) und Cystinosis Network Europe ([cystinosis-europe.eu](https://www.cystinosis-europe.eu)): kein Register/NHS/Biobank der Org belegt.
- Cystinose-Selbsthilfe e.V. ([cystinose-selbsthilfe.de](https://www.cystinose-selbsthilfe.de)), DE: existiert, ohne Befund.
- Morbus Pompe Österreich ([morbus-pompe.at](https://www.morbus-pompe.at)), AT: existiert, ohne Befund.
- Cure Tay-Sachs Foundation ([curetay-sachs.org](https://www.curetay-sachs.org)): Research-Seite ohne Register/NHS/Biobank.
- Gaucher Community Alliance ([gauchercommunity.org](https://www.gauchercommunity.org)): existiert, ohne Befund.
- Noah's Hope ([noahshope.com](https://www.noahshope.com)): Seite blockt (HTTP 403, Cloudflare-Challenge), nicht geöffnet.
- Legacy of Angels Foundation (Krabbe): keine offizielle Website gefunden (nur Uni-Buffalo-Seiten), nichts geraten.
- Nicht geprüft: EURORDIS, Glykogenose Deutschland, Pelizaeus-Merzbacher-Organisationen (PMD ist Gegenbeispiel im Graph).
