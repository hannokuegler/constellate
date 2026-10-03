# Abgabe-Checkliste Constellate · Challenge C5

Stand: Sa 03.10.2026, 21:30 · **Deadline So 04.10., 15:00 Wien (9:00 ET)**

**Quellenverweise.** `C5-Brief` = [C5-Challenge-Brief.pdf](C5-Challenge-Brief.pdf) im Repo. `Hackathon-Infos.md` und `Hackathon-Briefing.pdf` sind Organisator-Unterlagen, die nur lokal bei Hanno liegen (nicht im Repo, nicht öffentlich); die Seitenzahlen bleiben als Hinweis stehen. `PLAN.md`, `WORKFLOW.md`, `VIDEOS.md` liegen in `docs/`. Diese Datei ist ab Sa 03.10. 22:00 die gepflegte Fassung (Haken bitte hier setzen); Stand der Arbeit: [STATUS.md](STATUS.md).

## 1. Pflicht-Anforderungen aus den Briefs

| Anforderung | Exakter Wortlaut / Zahl | Quelle | Verantwort | ✓ |
|---|---|---|---|---|
| **Deadline & Zeitzone** | 9:00 ET = 15:00 Wiener Zeit (So 04.10.2026), keine Late Submissions | Hackathon-Infos.md, S. 17 + C5-Brief S. 6 | — | ☐ |
| **Einreichungsweg primär** | HackOS app.hack-nation.ai | Hackathon-Infos.md S. 4, 38 · C5-Brief S. 6 | — | ☐ |
| **Einreichungsweg Backup** | Google Form (plus HackOS) | Hackathon-Infos.md S. 4, 38 | — | ☐ |
| **Team in HackOS** | Jedes Teammitglied muss Account haben + unter „Team & Submission" eingetragen sein | Hackathon-Infos.md S. 37 | Osman | ☐ |
| **Working Prototype** | Deployed ODER lokal leicht zu starten; live durchsuchbar, keine Login-Wand | C5-Brief S. 6 | Hanno | ☐ |
| **Live-Demo-URL** | Vercel, Replit oder Lovable; öffentlich aufrufbar | Hackathon-Infos.md S. 49 · C5-Brief S. 6 | Hanno | ☐ |
| **Repo: öffentlich** | GitHub, public, mit vollständigem README | Hackathon-Infos.md S. 48 · C5-Brief S. 6 | Hanno | ☐ |
| **Repo: README-Inhalt** | Architektur + wie Datensatz aus Primärquellen reproduzierbar (`make reproduce`) | C5-Brief S. 6 · WORKFLOW.md S. 142 | Osman | ☐ |
| **Repo: Datensatz-Lizenzen** | Alle Quellen gelistet (HPO CC-BY 4.0, Orphanet CC-BY 4.0, MONDO, PubMed, NIH Public Domain usw.) | C5-Brief S. 5 · PLAN.md S. 49 | Osman | ☐ |
| **Video: Team Introduction** | **≤ 60 s**, echte Gesichter und Stimmen (Hanno, Osman, Recep), je ~15 s Name + Rolle + ein Satz warum, gemeinsamer Schluss | Team-Vorgabe 04.10., pitch/VIDEO-STRATEGY.md §1 | Osman | ☐ |
| **Video: Product Demo** | **≤ 60 s**, Screen-Recording Live-URL, Voice-over ElevenLabs, Noras Weg Krabbe → Graph → PSAP → MLD → Action Card → Honest Gap; erfüllt den C5-„1-minute walkthrough" (C5-Brief S. 6) | Team-Vorgabe 04.10., pitch/VIDEO-STRATEGY.md §2 | Recep | ☐ |
| **Video: Technical Walkthrough** | **≤ 60 s**, Architektur in einem Satz, `make validate` grün, **OpenAI Extract/Reconcile/Explain mit Datei sichtbar**, E2E grün | Team-Vorgabe 04.10., pitch/VIDEO-STRATEGY.md §3 | Hanno | ☐ |
| **Video: Format** | Genau drei Videos, jedes **maximal 60 s**, Datei **MP4 (H.264, 1920×1080, 30 fps) oder MOV**; Englisch, Querformat, ruhige Stimme, keine Musik/Effekte; Länge nach Export prüfen | Team-Vorgabe 04.10., VIDEOS.md | — | ☐ |
| **Video-Upload-Platform vorab prüfen** | YouTube unlisted oder Google Drive (HackOS Anforderung vorher checken!) | WORKFLOW.md S. 154 | Osman | ☐ |
| **OpenAI-Nutzung** | Extract (Abstracts → Claims) + Reconcile (Namen → MONDO-IDs) + Explain (Pfade erklärt) sichtbar im Produkt | C5-Brief S. 5–6 · PLAN.md S. 51 | Hanno | ☐ |
| **Honest-Gap-Screen** | Funktion vorhanden: Fehlende Evidenz zeigt „was gesucht", „was fehlt", „nächste Frage zu testen" | PLAN.md S. 25, 54 · WORKFLOW.md S. 137 | Hanno | ☐ |
| **Graph: Module 1–3 implementiert** | Module 1: Connect Evidence (stabile IDs, Quellen) · Modul 2: Trustworthy (Quellen zeigen, Gegenevidenz) · Modul 3: Action (Mechanistischer Overlap, Shared Assets, Network Overlap) | C5-Brief S. 3–4 | Hanno | ☐ |
| **Preisverleihung (Top 2)** | Sa 10.10. im Kalender eingetragen; beide Team-Member, die pitchen müssen reisen nach Annahme können | Hackathon-Infos.md S. 27 | — | ☐ |

## 2. Abweichungen / Wo unsere Pläne von den Briefs abweichen

| Thema | Was der Brief sagt | Was PLAN/WORKFLOW sagt | Status / Empfehlung |
|---|---|---|---|
| **Challenge Auswahl** | C5 muss im Discord angekündigt werden | Steht noch offen in Discord; PLAN.md nur intern | ⚠️ **OFFEN**: Im Discord unter #hackathon posten (wer?) |
| **Datensätze: Scope** | Brief sagt „eine fokussierte Slice" für 24 h | PLAN.md nennt konkrete Beispiele (Krabbe, PSAP, MLD) + LSD-Familie | ✓ Konservativ geplant |
| **Module Vollständigkeit** | Brief sagt „alle 3 Module + Stretch / Moonshot" | PLAN.md priorisiert Hero-Pfad bis 06:00, dann Polish | ✓ Angemessen, realistisch |
| **Feature-Freeze Zeitpunkt** | Brief nennt keinen Feature-Freeze | PLAN.md setzt 12:00 (So) als Hard Stop | ✓ Sinnvoll, nicht im Widerspruch |
| **Test-Umfang Gegenevidenz** | C5-Brief erwartet „counterexamples" und „contradictory findings" | PLAN.md nennt nur ein Gegenbeispiel (Pelizaeus-Merzbacher) | ⚠️ GRENZ: Mindestens 2 Gegenbeispiele wären stärker, aber ein gutes reicht für 24 h |
| **Persona: Devon** | C5-Brief verlangt Devon-View (neue Patient) | PLAN.md nennt Devon nur als Test-Persona für Live-Demo (06:00 Gate) | ✓ Implementierbar als separate Search-Flow, nicht als separate UI-Seite |
| **Licensing: Bright Data** | Brief verbietet Scraping lizenzierter DBs (Orphanet-Orgs, OMIM); open sources OK | PLAN.md nutzt Bright Data + OpenAI Extraction | ✓ Korrekt, aber im Tech-Video + README **offenlegen** |
| **Video-Länge** | Brief nennt nur den „1-minute walkthrough" | Team-Vorgabe 04.10.: drei Videos à ≤ 60 s (Team, Demo, Tech), MP4/MOV; PLAN.md (2/3 min) ist überholt | ✓ Demo erfüllt den Walkthrough; Shotlists in pitch/VIDEO-STRATEGY.md |
| **Problem Statement EN** | Brief verlangt 1-Satz-Statement | PLAN.md hat es im PS-Feld | ✓ Vorhanden |

## 3. Offene Punkte / Unklar aus den Briefs

| Was | Quelle | Konsequenz |
|---|---|---|
| **HackOS Google Form**: Ist das Formular ein Pflicht-Duplikat oder nur Backup? | Hackathon-Infos.md S. 38 sagt „UND" — deutet auf Pflicht hin, aber kein direkter Link | **Aktion**: In HackOS schauen, ob Form-Link existiert. Fallback: Osman hat Link ab 13:00 Uhr |
| **Datensatz reproduzierbar**: Wie detailliert muss `make reproduce` sein? | C5-Brief S. 6, WORKFLOW.md S. 142: „auf frischem Clone" | **Aktion**: Osman testet So 11:00 auf neuem Verzeichnis, nicht nur lokal |
| **Moonshot Slide**: Ist das Video-Inhalt oder Pitch-Inhalt? | C5-Brief S. 5 nennt es als Anforderung, VIDEOS.md nennt es nicht. PLAN.md erwähnt nur Zahlen in MOONSHOT.md | **Aktion**: Falls Top 2 → eigene Pitch-Slides So 08:00–11:00. Video hat keinen Platz für Moonshot |
| **OpenAI-Tools Sichtbarkeit**: Was heißt „sichtbar"? Code im README, Logs, UI? | C5-Brief S. 6 und PLAN.md S. 51 sagen „im Tech-Video zeigen" | ✓ Klar: Tech-Video zeigt Code-Snippets Extract/Reconcile/Explain |
| **Gegenevidenz**: Muss Contradictory Evidence **im System** sein oder nur ein Konzept? | C5-Brief S. 4: „surface contradictory findings" | **Aktion**: Min. ein Gegenpaar (z. B. Pelizaeus vs. Krabbe) mit Edge-Label `contradicts` |
| **ClinicalTrials-Demo**: Brief erwähnt ClinicalTrials.gov als Quelle, steht es im Krabbe-Path? | C5-Brief S. 4 und PLAN.md S. 34 | **Aktion**: Hero-Path mindestens erwähnen (auch wenn Trials nicht im MLD-Beispiel selbst auftauchen) |
| **Preisverleihung Live-Pitch**: Top 2 Teams pitchen. Müssen alle 3 anwesend sein oder mind. einer? | Hackathon-Infos.md S. 27 sagt „Die Top 2 jeder Challenge pitchen live am Sa 10.10." | **Aktion**: Min. einer muss präsent sein; alle drei sind optimal für Q&A |

## 4. Fristplan & Qualitäts-Gating (aus WORKFLOW.md)

| Meilenstein | Datum/Zeit | Gate | Verantwort | ✓ |
|---|---|---|---|---|
| **Feature-Freeze** | So 04.10., 12:00 (Mittag) | Nur P1-Bugs nach diesem Punkt | Hanno | ☐ |
| **E2E live** | So 04.10., 06:00 (Früh) | Hero-Pfad klickbar (Krabbe → PSAP → MLD → Action Card) | Hanno | ☐ |
| **Quality-Gates vor Freeze** | So 04.10., 11:00–12:00 | 7 Gates: Live-URL, Hero-Pfad, Honest Gap, Edge-Quellen, OpenAI 3×, Fallback-Sicherheit, README `make reproduce`, Lizenzen, Secrets | Osman (prüft), Hanno (fixt) | ☐ |
| **Videos abgeschlossen** | So 04.10., 14:00 | Alle 3 hochgeladen (MP4/MOV, je ≤ 60 s), URLs im Teamboard (Bereich Links) und in `docs/STATUS.md` | Recep + Osman + Hanno | ☐ |
| **Abgabe HackOS + Google Form** | So 04.10., 14:00–14:30 | Alle Felder gefüllt, alle Video-Links verifiziert | Osman (HackOS), Osman (Form) | ☐ |
| **Backup & Finale Checks** | So 04.10., 14:30–14:45 | Zip des Repos + Discord-Post, letzte Live-URL-Check | Hanno (Zip), Recep (Discord), Recep (URL) | ☐ |
| **Submission-Ende** | So 04.10., 14:45 | **Nichts mehr pushen, kein Redeploy** | Alle | ☐ |

## 5. Daten-Output-Checkliste (aus WORKFLOW.md)

| Datei | Format | Done-Kriterium | Verantwort | ✓ |
|---|---|---|---|---|
| `data/curated/orgs.csv` | CSV UTF-8, exakte Kopfzeile, ≥25 Zeilen | Jede Org-URL selbst geklickt, `verified_date` gesetzt | Osman | ☐ |
| `data/curated/hero_path.yaml` | YAML 2-Space, 10 Schritte | Alle Schritte mit OMIM/PMID/URL oder `UNBELEGT` belegt | Recep | ☐ |
| `docs/MOONSHOT.md` | Abschnitte: Milestone · Numbers · Today vs. Constellate · Assumptions · Validate Next | Jede Zahl hat Quelle oder steht als Annahme | Recep | ☐ |
| `README.md` | Lizenz-Zeilen aus DATA-SOURCES.md + Abschnitte O3 | Rendert auf GitHub ohne kaputte Tabellen | Osman | ☐ |
| `BUGS.md` (live während Hackathon) | Format: `[P1|P2|P3] Screen · Schritte · erwartet · gesehen · (wer)` | P1-Bugs vor 06:00 behoben, nicht gelöschte sondern durchgestrichene | Osman + Hanno | ☐ |

## 6. GitHub & Deployment

| Schritt | Anforderung | Status | ✓ |
|---|---|---|---|
| **Repo-URL** | https://github.com/hannokuegler/constellate | Private bis So 11:00, dann public | Hanno | ☐ |
| **Repo: Public machen** | So 11:00 (1 h vor Freeze) | Kein `git push --force`, keine Co-Authored-By-Trailer (Hannos Regel) | Hanno | ☐ |
| **Vercel Live-URL** | Osman als Collaborator, Hanno Deploy | Keine Passwort-Protection, keine Preview-Beschränkung | Hanno | ☐ |
| **Test: Lokaler Clone** | `git clone <URL> && make reproduce` | Funktioniert auf frischem Verzeichnis, <5 min | Osman (So 11:00) | ☐ |

---

## Zusammenfassung: Die 5 kritischen Nummern

1. **Deadline**: So 04.10., **15:00 Wien** (nicht 14:45, nicht 15:30) · **9:00 ET**
2. **Team in HackOS**: alle 3 Mitglieder müssen unter „Team & Submission" eingetragen sein (nicht nur Hanno)
3. **OpenAI-Sichtbarkeit**: Extract, Reconcile, Explain müssen im **Technical Walkthrough (≤ 60 s) gezeigt** oder im Edge-Panel lesbar sein (nicht nur intern)
4. **Feature-Freeze**: **So 12:00** · Danach nur noch P1-Bugs + Videos, kein Code-Änderung
5. **Video-Upload-Platform**: **vorher in HackOS prüfen** ob YouTube (unlisted) oder Google Drive gefordert

## Offene Blockers für Hanno

1. ⚠️ **HackOS Challenge-Ansage**: Wer postet im Discord, dass wir C5 bauen?
2. ⚠️ **Google Form Link**: In HackOS / Email vorhanden?
3. ⚠️ **Vercel Account**: Osman hat Collaborator-Rechte?
4. ⚠️ **Video-Upload-Format**: HackOS akzeptiert YouTube unlisted oder nur Google Drive?

---

**Erstellte am 03.10.2026, 21:30 Wien**
Quellen: Hackathon-Briefing.pdf (12 S., lokal), Hackathon-Infos.md (lokal), C5-Challenge-Brief.pdf (6 S., `docs/`), README.md, PLAN.md, WORKFLOW.md, VIDEOS.md
