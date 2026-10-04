# Orgs-Agentenprüfung vom 04.10.2026

Geprüft: alle 40 Zeilen aus `orgs_draft.csv` gegen die Live-Seiten. Ergebnis in `orgs_agent_check.csv` (Spaltenreihenfolge wie `orgs.csv` plus `verdict`, `agent_evidence`, `checked_at`). `orgs.csv` und die Draft-Datei sind unverändert.

Methode: Seiten per curl mit ehrlichem Bot-User-Agent (`ConstellateResearchBot/1.0`) geholt, weil WebFetch nur zusammenfasst und kein wörtliches Matchen erlaubt. Jedes Zitat wurde whitespace-tolerant (Anführungszeichen und Gedankenstriche normalisiert) gegen den Seitentext geprüft. Alle Cloudflare-Seiten luden mit dem Bot-UA. Kein Bright Data, keine CAPTCHAs. Kein `yes` ohne wörtliches Zitat auf einer gefetchten Seite.

## Zahlen

- Verdict: pass 31, fixed 8, fail 1 (Summe 40).
- Register yes: 19 vorher, 17 nachher.
- NHS yes: 14 vorher, 11 nachher.
- Biobank yes: 3 vorher, 2 nachher.
- Es wurde nichts auf `no` gesetzt und kein `unknown` zu `yes` hochgestuft.

## Geänderte Felder

- 04 MLD Foundation: NHS yes zu unknown, `nhs_url` geleert. Beleg ist ein alter Blogpost über eine nicht benannte Studie, von der die Stiftung Familien vorerst abrät; keine aktuelle NHS auf der Seite. Register bleibt yes (Zitat steht wörtlich auf `/privacy-data-policy/`). Land US bestätigt (about-us).
- 07 Alex TLC: NHS yes zu unknown, `nhs_url` geleert. Das Zitat betrifft nur die LCC-Studie (andere Krankheit, Leukoenzephalopathie mit Verkalkungen und Zysten). Register bleibt yes (NHS-England-Register, Charity war in den Gremien).
- 08 ELA (FR): Register yes zu unknown, `registry_url` geleert. Auf leuconnect.com steht „Online-Plattform zur Unterstützung der klinischen Forschung“, das Wort Register kommt auf der zitierten Seite nicht vor. ELA Deutschland (Zeile 28) nennt Leuconnect dagegen wörtlich „Das Patientenregister“ und bleibt yes.
- 10 International Gaucher Alliance: NHS yes zu unknown, `nhs_url` geleert. Die Clinical-Trials-Seite ist eine Studienliste; der Treffer ist eine allgemeine NIH-Studie zu Glykosphingolipid-Speicherkrankheiten. Register bleibt yes (GARDIAN, patientengeführt, IGA-Publikationsseite).
- 12 NPUK: `contact_url` von der Startseite auf `https://www.npuk.org/contact/` korrigiert (Seite lädt). Die Mailadresse und Telefonnummer-Hinweise aus den Notes entfernt.
- 20 NTSAD: Biobank yes zu unknown. Die „Virtual Biorepository“ ist ein Vermittlungs-Katalog; die Seite sagt, NTSAD sei „connection point“, eigene Proben werden nicht gezeigt. NHS bleibt yes (NIH-Studie, die NTSAD listet).
- 21 BDSRA: Register yes zu unknown, `registry_url` geleert. „Family Register“ ist nur eine Kontaktdatenbank. Ein Nachrichtenpost von 2014 sagt, BDSRA habe die Erweiterung eines Batten-Patientenregisters (DEM-CHILD) finanziert, der heutige Stand ist nicht belegt (in den Notes erwähnt). NHS bleibt yes (NCL-Studie am UKE Hamburg, NCT04613089, in der Studientabelle).
- 40 Niemann-Pick Selbsthilfegruppe Deutschland: `url` und `contact_url` ergänzt: `https://niemann-pick-selbsthilfegruppe.de/` und `/kontakt/`, gefunden über die INPDA-Mitgliederliste (`inpda.org/about-us/`), Seite lädt, Name, e.V., ASMD und NPC passen. Die alte Domain niemann-pick.de wurde nicht geöffnet. Register, NHS, Biobank unknown (nichts gefunden).
- Notes in den Zeilen 10, 12, 26, 35 von Mailadressen und Telefonhinweisen bereinigt; im gesamten Output steht keine Mailadresse und keine Telefonnummer.

## Fail

- 27 LAL Solace: `https://www.lalsolace.org` liefert HTTP 525; die http-Variante leitet auf eine GoDaddy-Parking-Seite um. Domain wirkt inaktiv, Name und Krankheit nur über das NORD-Verzeichnis belegt. `verified_date` leer. Nicht nach `orgs.csv` übernehmen, außer es taucht eine aktive Seite auf.

## Entscheidungen nach „Achtung“ in der Checkliste

- 02 KrabbeConnect: Register yes bleibt (zusätzlich das Zitat „this is a unique rare disease patient registry.“ auf `krabbecures.iamrare.org`). NHS bleibt unknown: KrabbeCURES „supports research on Krabbe disease and how it progresses over time“, nennt sich aber nie Natural-History-Studie.
- 01 Hunter's Hope: auf Home, Family-Care und Historical-Research kein Register, nur das Support-Formular; bleibt unknown. Land US bestätigt (Orchard Park NY).
- 03 Krabbe UK, 14 Parseghian, 16 MPS Society UK, 30, 32 bis 38: Seite lädt, Name und Land passen, nichts zu Register, NHS, Biobank gefunden; bleibt unknown.
- 15 National MPS Society: Register nur als „in Entwicklung“ (News 05.02.2026, keine Einschreibung genannt); bleibt unknown.
- 39 ProRaris: yes bleibt, weil die Seite wörtlich sagt, ProRaris sitze im Vorstand des Schweizer Registers (SRSK). Es ist ein nationales Register für alle seltenen Krankheiten und nicht krankheitsspezifisch (in den Notes vermerkt). Wenn dir das zu weich ist, auf unknown setzen.
- 05, 09, 11, 17, 18, 19, 22, 23, 24, 25, 26, 28, 29, 31: yes bleibt, die Zitate stehen wörtlich auf der zitierten Seite und stützen die Aussage im Sinne der Lesehilfe (selbst betrieben, mit-betrieben, finanziert oder gelistet; die Notes sagen jeweils welches). 28 (ELA DE): NHS ist „förderte“ (Vergangenheit, Studien am UK Tübingen).
- Grenzfälle, die ich bewusst konservativ auf unknown gesetzt habe und die du bei Bedarf wieder auf yes drehen kannst: 08 Register, 20 Biobank, 10 NHS, 21 Register, 04 NHS, 07 NHS (alle oben begründet, Zitate stehen in `agent_evidence` mit dem Label `NOTE-...-not-counted`).

## ORPHA-Codes

Alle 37 vorkommenden Codes wurden gegen die Titel der orpha.net-Detailseiten geprüft; keiner ist falsch, keiner wurde geändert oder ergänzt. Auffälligkeiten ohne Änderung:

- ORPHA:88637 (Zeilen 28) ist 4H-Syndrom (Hypomyelination, hypogonadotroper Hypogonadismus, Hypodontie) und ein Subtyp-Code, passt zu „4H / Pol-III“.
- ORPHA:77292 und ORPHA:77293 (Zeile 12) sind die ASMD-Subtypen A (infantil neurovisceral) und B (chronisch viszeral); der Elterncode 618899 steht in Zeile 11 und 13.
- Zeile 18 (ISMRD): Die Seite listet auch ML II alpha/beta und Sialidose, dafür gibt es in der Liste keinen Code (ORPHA:576 fehlt); ORPHA:423461 ist ML III alpha/beta und durch „Mucolipidosis II, II/III, III alpha/beta“ auf der Startseite gedeckt.
- Leer gelassen, nicht erfunden: Zeile 3 (Krabbe UK; ORPHA:487 wäre passend), Zeile 40 (ORPHA:618899;646 wären passend), Zeilen 5 bis 8, 26, 38, 39.
- Hero-Krankheit Pelizaeus-Merzbacher (ORPHA:280): keine Organisation in den 40 Zeilen.

## Seiten, die nicht (oder zunächst nicht) luden

- lalsolace.org: siehe Fail.
- niemann-pick.de: absichtlich nicht geöffnet (Checkliste).
- Einzelne curl-Aufrufe auf gaucheralliance.org und ml4.org lieferten im ersten Lauf kurz Status 000 (Timeout); Wiederholung lief sauber (200).
- Kontakt-Seite: Für NNPDF (About Us), IGA (Partner With Us), CDG CARE (Research), Ö-Gaucher (Impressum) gibt es keine eigene Kontaktseite, die ich gefunden habe; `contact_url` bleibt wie im Draft.
