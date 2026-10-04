# 🧰 Ressourcen · was wir wofür nutzen (und wofür nicht)

Stand Sa 03.10.2026 · alle Fakten mit Quelle am **2026-10-03** per Web-Check geprüft (Prüfdatum gilt für jeden verlinkten Beleg) · ✅ = geprüft, Quelle verlinkt · ⚠️ = offen, jemand muss im Account/HackOS nachsehen oder entscheiden.

Grundregel: **ein Werkzeug pro Job.** Kern-App = Next.js, Daten = Python-Pipeline, LLM in Pipeline/App = OpenAI. Alles andere ist Beschleuniger, kein zweiter Stack.

## Übersicht

| Ressource | Wofür wir sie nutzen | Wer | Bis wann | Kosten / Limit | Status |
|---|---|---|---|---|---|
| **OpenAI API** | Pflicht: Extract · Reconcile · Explain · Resolve | Hanno (Key holt Osman) | Key Sa 20:30 · Extract/Reconcile So 04:00 · Explain So 06:00 | GPT-6-Familie, Budget < 10 USD (Rechnung §1) | ✅ Modelle geprüft · ⚠️ Key/Credits aus HackOS, IDs per `models.list()` |
| **Claude Code** | Build-Werkzeug (Pipeline, App, Deploy) | Hanno | laufend | Hannos Abo | ✅ |
| **Bright Data** | Patientenorg-Seiten holen, OpenAI extrahiert, Osman prüft | Osman (Skript: Hanno) | Account + Zone Sa 21:30 · Entwurf Sa 23:30 | 5.000 Requests/Monat gratis, danach 1,50 USD je 1.000 | ✅ geprüft · ⚠️ `scripts/fetch_orgs.py` noch nicht geschrieben |
| **ElevenLabs** | Voice-over für Demo, Walkthrough, Tech (`eleven_v4`) · optional „Read aloud" | Hanno (Account) · Recep liefert Skripte | Stimme So 09:00 · Final-MP3 So 11:45 · Feature So 10:30 | Creator 22 USD/Monat, 121.000 Credits; Bedarf ca. 30.000 | ✅ Doku geprüft · ⚠️ Hannos Plan + v4-Credit-Faktor im Account ablesen |
| **Lovable** | optional: Story-/Moonshot-Page (nicht die App) | Recep (oder Osman) | Timebox So 08:00–10:30, nur wenn R1–R3 fertig | Free: 5 Build-Credits/Tag, max. 30/Monat | ✅ geprüft · ⚠️ Entscheidung offen (Empfehlung: nur bei Luft) |
| **Motion** | optional: Pitch-Opener 10.10. (nicht die 4 Pflichtvideos) | Hanno | nach Abgabe | Credits-Preis ⚠️ nicht geprüft (nichts aufgerufen) | ⚠️ |
| **/brag** (Hyperframes) | optional: 20-s-Teaser für Discord/LinkedIn | Hanno | nach Abgabe 15:00 | Open Source, braucht Node 22+ und FFmpeg | ✅ |
| **GitHub** | Repo `constellate`, Übergabe-Ort | alle | steht | gratis | ✅ |
| **Vercel** | Hosting der Next.js-App | Hanno oder Osman, siehe §7 | erster Deploy So 02:00 | Hobby gratis, nur Owner-Commits deployen | ✅ geprüft · ⚠️ Owner-Entscheidung nötig |
| **HackOS Credits & Codes** | OpenAI-Key, evtl. Codes für Bright Data, ElevenLabs, Lovable | Osman | Sa 20:30 | – | ⚠️ Login nötig, nicht geprüft |
| **Offene Datenquellen** | HPO, MONDO, Orphanet, ClinVar, CT.gov, RePORTER, PubMed/EPMC, Open Targets, Reactome, Monarch | Hanno | läuft | kein Key (optional `NCBI_API_KEY`) | ✅ → [DATA-SOURCES.md](DATA-SOURCES.md) |

## Kurzfassung (das Wichtigste in 9 Zeilen)

1. **ElevenLabs „v4" gibt es wirklich:** `eleven_v4` (Qualität) und `eleven_v4_turbo` (Echtzeit), erschienen am 28.09.2026. Für Video-Voice-over nehmen wir `eleven_v4` in der Web-App, Fallback `eleven_multilingual_v2`.
2. **v4 hat keinen Speed-/Style-Regler und kein SSML.** Tempo und Pausen laufen über den Text (Absätze, Ellipsen).
3. **ElevenLabs-Login nicht teilen** (Nutzungsbedingungen verbieten es). Recep liefert das Skript, Hanno erzeugt die MP3s. Notlösung: Recep nutzt einen eigenen Free-Account und nennt „elevenlabs.io" im Titel.
4. **Team-Video mit echten Gesichtern**, die anderen drei Videos mit ElevenLabs-Voice-over, Offenlegung im README.
5. **Read aloud: ja, aber nur vorgerendert** (statische MP3 im Repo, ca. 1,5 h), erst wenn kein P1-Bug mehr offen ist, harte Grenze So 10:30.
6. **Lovable nur optional** für eine Story-Page (Recep, 90 min Timebox), nie für die App, nie für Klick-Prototyp oder Pitch.
7. **Vercel Hobby deployt nur Commits des Team-Owners.** Vor dem ersten Deploy klären, wem das Vercel-Projekt gehört (§7), sonst blockiert jeder Push von Osman/Recep.
8. **OpenAI-Modelle sind die GPT-6-Familie** (`gpt-6-luna`, `gpt-6.1-sol`, `gpt-6-astra`); IDs trotzdem einmal per `models.list()` prüfen und in `pipeline/config.py` festschreiben.
9. **Motion und /brag nicht für die Pflichtvideos** (kein echter Screen, eigene Fakten), höchstens Teaser nach der Abgabe.

## Korrekturen gegenüber dem Stand von 20:30

- ElevenLabs: Modell-Stand von „Multilingual v2 / Flash" auf **v4** aktualisiert; „Speed 0.95–1.0" gilt für v4 nicht; „Recep braucht den Web-Login" verstößt gegen die Nutzungsbedingungen und ist gestrichen.
- Lovable: Standard-Stack ist seit 13.05.2026 **TanStack Start** (nicht mehr React/Vite), Supabase heißt jetzt „Lovable Cloud" (brauchen wir nicht), Free-Plan hat **keinen** Code-Download und **keine** Custom Domain.
- Vercel: die Rollen „Osman Team-Owner, Hanno Collaborator" funktionieren auf Hobby nur für öffentliche Repos (§7). Deployment-URLs sind bei Standard Protection geschützt, nur die Production-Domain ist öffentlich.
- Bright Data: Zahlen bestätigt; neu: ohne KYC beachtet Web Unlocker automatisch `robots.txt`; Cache-Dateiname im Skript auf stabilen Hash umgestellt (Pythons `hash()` ist bei jedem Lauf anders).
- OpenAI: konkrete Modell-IDs und Preise ergänzt, Kostenrechnung neu.
- Offener Widerspruch: [VIDEOS.md](hackathon-log/VIDEOS.md) schreibt „Recep spricht" im Demo-Video, dieses Dokument empfiehlt ElevenLabs-Voice-over. Entscheidung Hanno (Empfehlung: ElevenLabs, Begründung unten).

---

## 1 · OpenAI API (Pflicht für Track-Preise)

**Was:** LLM-API (Responses, Structured Outputs, Embeddings). Credits kommen aus HackOS → **Credits & Codes** (Osman holt, Task O1).

**Wofür wir es einsetzen — exakt vier Aufrufstellen, alle im Tech-Video sichtbar:**

| Stelle | Datei | Modellklasse | Technik |
|---|---|---|---|
| **Extract** | `pipeline/05_openai_extract.py` | Volumen-Modell | Structured Outputs, Pydantic-Schema `Claim{subject, predicate, object, polarity, pmid, snippet}`; nur Abstracts der Slice-Krankheiten |
| **Reconcile** | `pipeline/06_openai_reconcile.py` | `text-embedding-3-small` + Volumen-Modell als Judge | Org-Krankheitsnamen → Top-5 MONDO-Kandidaten per Embedding → LLM entscheidet mit Begründung |
| **Explain** | `app/api/explain` | Flaggschiff oder ausgewogenes Modell, streaming | Pfad-Kanten als JSON rein → Klartext für eine Familie, jeder Satz endet mit `[e_xxx]`; Systemprompt verbietet Aussagen ohne Kante |
| **Resolve** | `app/api/resolve` | Volumen-Modell | Freitext-Symptome → HPO-IDs aus mitgelieferter Term-Liste |

**Wofür NICHT:** keine Faktenerzeugung ohne Quelle (jede Extract-Kante trägt PMID + Snippet, Level `text_mined`), kein „Chat mit dem Graphen", keine Zusammenfassungen im README.

**Modell-IDs: nicht raten, einmal prüfen und festschreiben.** Orientierung laut offizieller Modellseite ([O1](https://developers.openai.com/api/docs/models), geprüft 2026-10-03):

| Rolle | ID laut Doku | Preis je 1 Mio Token (Input / Output) | Vorschlag |
|---|---|---|---|
| Flaggschiff | `gpt-6-astra` | 10 / 50 USD | Explain nur, wenn Qualität vor Latenz geht |
| ausgewogen | `gpt-6.1-sol` | 2 / 10 USD | Explain-Standard |
| Volumen | `gpt-6-luna` | 0,1 / 0,5 USD | Extract, Reconcile-Judge, Resolve |
| Embeddings | `text-embedding-3-small` | siehe [O3](https://developers.openai.com/api/docs/guides/embeddings) | Reconcile |

Beim ersten Key-Test (⚠️ der Hackathon-Key kann Modelle einschränken):
```python
from openai import OpenAI
for m in OpenAI().models.list().data: print(m.id)
```
Dann mini/ausgewogen/Flaggschiff/Embedding einmal in `pipeline/config.py` festschreiben, nirgends hardcoden. Structured Outputs über `client.responses.parse(..., text_format=Model)` und `response.output_parsed` sind in der Doku bestätigt ([O2](https://developers.openai.com/api/docs/guides/structured-outputs)). Die GPT-6-Modelle haben einstellbaren Reasoning-Aufwand (Luna auch `none`) laut [O1](https://developers.openai.com/api/docs/models); für Extract/Resolve niedrig stellen, weil Reasoning-Token als Output zählen und Latenz kosten (⚠️ Parametername in der installierten SDK-Version prüfen).

**Kosten Extract, ca. 500 Abstracts** (275.000 Token Input + 100.000 Token Output, Preise oben): Luna ≈ 0,08 USD · Sol ≈ 1,55 USD · Astra ≈ 7,75 USD. Explain in der Demo (≈ 1.500 Token rein, 500 raus): Sol ≈ 0,01 USD, Astra ≈ 0,04 USD je Aufruf. **Budget ist kein Thema, Latenz schon:** Explain streamen, Extract mit `concurrency=8` und Retry.

**Zugang:** `OPENAI_API_KEY` in `.env.local` (Pipeline) + `app/.env.local` (lokal) + Vercel → Settings → Environment Variables. Nie committen (`.gitignore` deckt `.env*.local`). Osman hat den Key, Hanno auch; Recep braucht ihn nicht.

**Lizenz-/Offenlegungshinweis:** im README „Built with OpenAI" (Extract, Reconcile, Explain, Resolve) und im Explain-UI ein Satz „AI-generated explanation, not medical advice, check the cited sources".

---

## 2 · Claude / Claude Code

**Was:** Hannos Coding-Agent im Terminal ([Claude Code](https://code.claude.com/docs/en/overview)) + claude.ai im Browser.

**Wofür:** Hanno baut damit Pipeline, App, Deploy, Tests. Osman/Recep nutzen claude.ai oder ChatGPT **nur** zum Formulieren (README-Sätze, Skript-Text, Mail an Judges) und als Recherche-Hilfe („wo finde ich den EPAR zu Libmeldy?").

**Wofür NICHT:** nie als Faktenquelle. **Jede Zahl, jedes PMID, jede Org-URL im Produkt oder Video braucht eine Primärquelle, die ihr selbst geöffnet habt.** LLM-Gedächtnis zählt nicht, auch wenn es plausibel klingt (halluzinierte PMIDs sind das klassische Demo-Killer-Szenario beim Fact-Check durch Judges).

**Kosten/Zugang:** Hannos Abo. Osman/Recep: eigene Free-Accounts reichen. **Offenlegung:** README-Zeile „Code written with Claude Code" (siehe Abschnitt „Offenlegung").

---

## 3 · Bright Data (Hackathon-Zugang)

**Was:** Proxy-/Scraping-Infrastruktur. Drei Produkte kommen in Frage:

| Produkt | Macht | Für uns |
|---|---|---|
| **Web Unlocker API** | `POST` eine URL → HTML/Markdown zurück, kümmert sich um Proxys, Fingerprints, CAPTCHA, Retries | **Ja, genau das** |
| SERP API | strukturierte Google/Bing-Ergebnisse | nur als Fallback, um Org-URLs zu finden (⚠️ eigene Zone nötig) |
| Web Scraper API | fertige Scraper für große Plattformen (Amazon, LinkedIn …) | **Nein** — für NORD/Orphanet gibt es keinen fertigen Scraper |

**Kosten (✅ [B1](https://docs.brightdata.com/general/account/billing-and-pricing/free-tier), [B3](https://brightdata.com/pricing/web-unlocker)):** jeder neue Account bekommt **5.000 Credits/Monat gratis ohne Kreditkarte**, 1 Credit je Web-Unlocker-Request, Reset am 1. des Monats, Rate-Limit im Free-Tier 1.000 Requests/Minute, harter Stopp bei leerem Guthaben (keine Überraschungsrechnung). Danach Pay-as-you-go **1,50 USD je 1.000 Requests**. Unsere 50–100 Seitenabrufe sind kostenlos. ⚠️ Ob HackOS zusätzlich einen Bright-Data-Code ausgibt: Osman prüft bei „Credits & Codes".

**Wofür wir es einsetzen:** Osmans Patientenorg-Kuration (Task O2) beschleunigen. Statt 30 Websites komplett per Hand zu lesen:

```
Startliste (Namen)  →  URL finden (manuell/SERP)  →  Bright Data holt HTML/Markdown
→  OpenAI extrahiert strukturiert (Structured Outputs)  →  Osman öffnet jede Seite
   und bestätigt/korrigiert  →  data/curated/orgs.csv
```

Der Mensch bleibt der letzte Schritt. Die CSV heißt weiterhin „kuratiert", weil jede Zeile von Osman verifiziert ist — Bright Data + OpenAI sind nur der Vorfilter.

**How-to für Osman (ohne Code, 6 Schritte):**
1. brightdata.com → Account anlegen (E-Mail, keine Kreditkarte nötig).
2. Control Panel → **Web Unlocker API** → neue Zone anlegen → **Zone-Name** und **API-Key** kopieren (Reiter „Overview" der Zone, [B2](https://docs.brightdata.com/api-reference/rest-api/unlocker/unlock-website)).
3. In `.env.local` eintragen: `BRIGHTDATA_API_KEY=…`, `BRIGHTDATA_ZONE=…` (nie committen, Keys nur per Direktnachricht an Hanno).
4. `data/curated/org_urls.txt` füllen (eine URL pro Zeile), dann `uv run scripts/fetch_orgs.py data/curated/org_urls.txt` (⚠️ Skript schreibt Hanno, `scripts/` ist leer).
5. `orgs_draft.csv` Zeile für Zeile prüfen: **Seite selbst öffnen**, bestätigen/korrigieren, nach `orgs.csv` kopieren, `verified_date=2026-10-03` setzen.
6. Meldet Bright Data `ub_bad_endpoint_robots` (HTTP 400): die Seite sperrt Bots per `robots.txt`. **Überspringen und von Hand prüfen**, kein KYC beantragen ([B4](https://docs.brightdata.com/scraping-automation/web-unlocker/kyc-and-access)).

**Mini-Pipeline (Skizze, Hanno schreibt `scripts/fetch_orgs.py`, Osman führt aus):**

```python
# scripts/fetch_orgs.py  — uv run scripts/fetch_orgs.py data/curated/org_urls.txt
import requests, json, os, datetime, pathlib, hashlib
from openai import OpenAI
from pydantic import BaseModel

BD = "https://api.brightdata.com/request"          # offizieller Endpoint, siehe B2
HDR = {"Authorization": f"Bearer {os.environ['BRIGHTDATA_API_KEY']}",
       "Content-Type": "application/json"}
ZONE = os.environ.get("BRIGHTDATA_ZONE", "web_unlocker1")   # Zone-Name aus dem Dashboard

class OrgCard(BaseModel):
    org_name: str; country: str | None
    disease_names: list[str]
    has_registry: str; registry_url: str | None          # yes|no|unknown
    has_natural_history_study: str; nhs_url: str | None
    has_biobank: str; contact_url: str | None
    evidence_snippets: list[str]                          # wörtliche Belege von der Seite

def fetch(url: str) -> str:
    r = requests.post(BD, headers=HDR, timeout=60, json={
        "zone": ZONE, "url": url, "format": "raw",
        "data_format": "markdown"})                       # Markdown statt HTML spart Tokens
    r.raise_for_status()
    key = hashlib.sha1(url.encode()).hexdigest()[:12]     # stabil; Pythons hash() wechselt je Lauf
    cache = pathlib.Path(f"data/cache/orgs/{key}.md")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(f"<!-- source: {url} fetched: {datetime.date.today()} -->\n{r.text}")
    return r.text

def extract(url: str, page_md: str) -> OrgCard:
    client = OpenAI()
    resp = client.responses.parse(                        # Methode laut OpenAI-Doku bestätigt (O2)
        model=MINI_MODEL,                                 # aus pipeline/config.py
        input=[{"role": "system", "content":
                "Extract patient-organisation facts. Only use what is literally on the page. "
                "Unknown → 'unknown'. Quote the snippet that supports each yes."},
               {"role": "user", "content": f"URL: {url}\n\n{page_md[:20000]}"}],
        text_format=OrgCard)
    return resp.output_parsed

for url in open("data/curated/org_urls.txt"):
    card = extract(url, fetch(url.strip()))
    # → eine Zeile in data/curated/orgs_draft.csv, Spalten wie orgs.csv + source_url + fetched_date
```

Request-Felder `zone`, `url`, `format: raw`, `data_format: markdown` sind in der OpenAPI-Beschreibung bestätigt ([B2](https://docs.brightdata.com/api-reference/rest-api/unlocker/unlock-website)).

**Ziel-Seiten (nur öffentliche):** Websites der Orgs aus der Startliste in [DATA-SOURCES.md](DATA-SOURCES.md) · NORD Rare Disease Database, Abschnitt „Patient Organizations" je Krankheit · Global Genes Verzeichnis · Orphanet-Krankheitsseiten, Reiter Patientenorganisationen (nur Website-Ansicht; Orphadata gibt Org-Daten nicht frei).

**Wofür NICHT:** keine Bulk-Downloads der Fach-DBs (die haben offene Dateien/APIs, siehe DATA-SOURCES), kein Scraping von PubMed/CT.gov (eigene APIs), kein JS-Rendering-Gefrickel an GARD (`render: true` existiert, kostet aber Zeit, die wir nicht haben).

**Lizenz-/Offenlegungshinweis (ins README unter „Data sources"):** nur öffentlich erreichbare Seiten · `robots.txt` wird respektiert (Bright Data erzwingt das ohne KYC ohnehin) · zu jeder Zeile `source_url` + `fetched_date` speichern (steckt im Cache-Header und in `notes`) · wir speichern nur extrahierte Fakten, keine Seitenkopien im Repo (`data/cache/` ist gitignored) · offenlegen: „Patient-organisation facts were pre-extracted from public websites via Bright Data + OpenAI and manually verified on 2026-10-03".

**Zugang:** `BRIGHTDATA_API_KEY` und `BRIGHTDATA_ZONE` in `.env.local`. Osman legt den Account an, Hanno bekommt den Token für den Skript-Test. Nie committen.

---

## 4 · ElevenLabs (Voice-over + optional Read aloud)

Prüfdatum aller Quellen in diesem Abschnitt: 2026-10-03.

### 4.1 Welches Modell? Ja, „v4" gibt es

Eleven v4 und Eleven v4 Turbo wurden am **28.09.2026** veröffentlicht ([E1](https://elevenlabs.io/blog/eleven-v4), [E2](https://elevenlabs.io/docs/changelog/2026/9/28)). Das Modell ist fünf Tage alt: Die Doku sagt selbst, dass sich sein Verhalten nach dem Launch noch ändern kann ([E4](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4)).

| Modell-ID | Was es kann | Sprachen | Limit / Latenz | Für uns |
|---|---|---|---|---|
| **`eleven_v4`** | Flaggschiff, ausdrucksstärkstes TTS, laut Doku „net upgrade" gegenüber v3, Empfehlung für „video narration" ([E3](https://elevenlabs.io/docs/overview/models), [E12](https://elevenlabs.io/docs/eleven-api/choosing-the-right-model)) | 90+ (u. a. Englisch, Deutsch, Spanisch-LatAm) | 10.000 Zeichen je Request | **ja:** Voice-over (a) und vorgerenderte Read-aloud-Audios (b) |
| `eleven_v4_turbo` | Echtzeit-Variante, ca. 100 ms Inferenz, gedacht für Agents | 90+ | läuft über den Text-to-Dialogue-WebSocket ([E3](https://elevenlabs.io/docs/overview/models)) | nein (WebSocket-Aufwand ohne Nutzen) |
| `eleven_v3` | Vorgänger, expressiv | 70+ | 5.000 Zeichen | nein, v4 ist besser |
| `eleven_multilingual_v2` | stabil bei Langform, Standardmodell der TTS-API, SSML-Pausen möglich | 29 (u. a. de, es) | 10.000 Zeichen | **Fallback**, wenn v4 bei Fachbegriffen zickt |
| `eleven_flash_v2_5` | sehr schnell (ca. 75 ms Inferenz), API-Preis je Zeichen halb so hoch | 32 (u. a. de, es) | 40.000 Zeichen | nur für Live-Vorlesen, falls je nötig |
| `eleven_text_to_sound_v2` / `music_v2_5` / `scribe_v2` | Soundeffekte / Musik / Transkription | – | – | siehe 4.5 |

**Endpoint-Klarstellung ⚠️:** Die Modellseite sagt „v4 ist über die Text-to-Dialogue-API verfügbar" ([E3](https://elevenlabs.io/docs/overview/models)), die Best-Practices-Seite zeigt aber einen Aufruf mit `POST /v1/text-to-speech/{voice_id}` und `model_id: "eleven_v4"` ([E5](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)). **Beim ersten Test beide Wege probieren** (Aufruf unten); die Web-App ist davon nicht betroffen.

**Eigenheiten von v4, die eure Skripte betreffen** ([E4](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4), [E5](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)):
- Es gibt nur **Stability** und **Similarity**. **Kein Speed- und kein Style-Regler, kein SSML** (keine `<break>`-Tags). Tempo und Pausen über Text: Absätze, Ellipsen „…", Großbuchstaben für Betonung. Feintempo im Schnittprogramm (höchstens ±5 %).
- **Audio-Tags** in eckigen Klammern steuern den Vortrag. Für Voice-over reicht **ein** Tag am Anfang, z. B. `[calm, measured narration]`. Keine Tags, die wie Soundeffekte klingen (`[gunshot]`, `[applause]`), die Doku warnt, dass sie sonst als Effekt gelesen werden.
- **Aussprache:** Fachbegriffe vorab testen. v4 versteht IPA in Schrägstrichen und Anführungszeichen, z. B. `"/ˌbaɪoʊˈkemɪstri/"`; einfacher ist eine Lautschrift im Text („Krah-beh") oder Buchstabieren („P-S-A-P"). Zahlen und Prozente im TTS-Text ausschreiben („five percent").
- Nach dem Freigeben **nicht mehr neu erzeugen**: gleiches Skript kann bei späterem Modell-Update anders klingen. Finale MP3s sofort sichern.
- Für eine Stimme in einer anderen Sprache erzeugt v4 den **Muttersprachen-Akzent** der Zielsprache, nicht den der Referenzstimme ([E4](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4)). Für DE/ES relevant, für uns nicht.

### 4.2 Creator-Plan: was kann er?

| Punkt | Wert | Quelle |
|---|---|---|
| Preis | 22 USD/Monat (erster Monat 11 USD) | [E8](https://elevenlabs.io/pricing) |
| Credits | 121.000/Monat, ungenutzte Credits rollen bis zu 2 Monate mit | [E8](https://elevenlabs.io/pricing) |
| TTS in der Web-App | ca. 121 Minuten inklusive | [E8](https://elevenlabs.io/pricing) |
| Verbrauch | ca. 1 Credit je Zeichen (Multilingual v2); Flash/Turbo 0,5–1 Credit (API). **Faktor für v4 steht nirgends ⚠️**, nach dem ersten Take im Dashboard ablesen und konservativ mit 1 rechnen | [E8](https://elevenlabs.io/pricing) |
| Kommerzielle Lizenz | ab Starter, also im Creator enthalten | [E8](https://elevenlabs.io/pricing), [E10](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform) |
| Audioqualität | MP3 bis 192 kbps (ab Creator), WAV/PCM 44,1 kHz erst ab Pro | [E6](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) |
| Voice Cloning | Instant + 1 Professional Voice Clone vorhanden, **nutzen wir nicht** | [E8](https://elevenlabs.io/pricing) |
| Gleichzeitige Requests | 5 | [E8](https://elevenlabs.io/pricing) |
| Seats | 1; mehrere Seats erst ab Scale (3 Seats) | [E8](https://elevenlabs.io/pricing) |
| Aktion bis 12.10. | Banner „3x credits included on Creator+ until October 12" (ohne Detailtext ⚠️); „bis zu 2x deiner v4-TTS-Credits zählen nicht", **nur in Web- und Mobile-App**; API-Pay-as-you-go für v4 −72 % (0,022 statt 0,08 USD je 1.000 Zeichen) | [E8](https://elevenlabs.io/pricing), [E9](https://elevenlabs.io/pricing/api), [E1](https://elevenlabs.io/blog/eleven-v4) |

⚠️ **Hannos Account:** im Dashboard prüfen, ob der Creator-Plan wirklich aktiv ist, wie viele Credits da sind und ob `Eleven v4` in der Modellauswahl erscheint. Auch prüfen, ob HackOS bei „Credits & Codes" einen ElevenLabs-Code anbietet, bevor jemand bezahlt. Die ElevenLabs-Gewinne (Preisgeld und Pläne) der Hackathon-Challenge C1 gelten nur für C1-Teams, hier gibt es keinen Prize-Bezug.

**Credit-Bedarf (Rechnung mit 1 Credit je Zeichen):** Sprechtext der drei Voice-over-Videos ≈ 5.200 Zeichen (Demo ≈ 1.700, Walkthrough ≈ 850, Tech ≈ 2.600); mit Probelauf + 2 Takes ≈ 16.000 Credits. Read aloud vorgerendert: 8 Texte à ≈ 800 Zeichen ≈ 6.400 Credits. Summe mit Puffer ≈ **30.000 von 121.000 Credits**. Selbst der Free-Plan (10.000 Credits) würde für die drei Videos reichen, dann aber mit Attribution (siehe unten).

### 4.3 Lizenz, Attribution, Offenlegung

- **Bezahlter Plan:** kommerzielle Nutzung erlaubt, keine Pflicht-Attribution (vorbehaltlich der eigenen Vereinbarung). **Free-Plan oder nicht eingeloggt:** keine kommerzielle Nutzung, und im Titel muss „elevenlabs.io" oder „11.ai" stehen ([E10](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)).
- **Wichtig:** Inhalte, die **außerhalb eines bezahlten Abos** erzeugt wurden, bleiben dauerhaft attribution-pflichtig ([E10](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)). Finale Audios also erst erzeugen, wenn der Creator-Plan aktiv ist.
- **Login nicht teilen:** „You may not share or permit others to use your individual account credentials" ([E11](https://elevenlabs.io/terms-of-use)). Das gilt auch für den Web-Login und sinngemäß für den API-Key. Deshalb: Recep bekommt keinen Zugang, sondern liefert Text.
- **Offenlegung trotzdem machen,** auch mit bezahltem Plan: „Voice-over generated with ElevenLabs (Eleven v4)" in Video-Beschreibung und README. Das kostet nichts und beugt der Frage „echte Stimme?" vor. Keine Stimmen realer Personen klonen.

### 4.4 Einsatz (a): Voice-over der Videos

**Wofür:** englisches Voice-over für Demo (2 min), Walkthrough (1 min) und Tech (3 min). Eine konsistente Stimme, keine Mikro-/Raum-/Akzent-Probleme um 13 Uhr nach einer Nacht ohne Schlaf, und der Text ist gleichzeitig das Skript und damit fact-checkbar. **Das Team-Video bleibt echt** (eure Gesichter, eure Stimmen).

**Wofür NICHT:** kein Voice Cloning eurer Stimmen (Zeit, kein Mehrwert), keine Conversational Agents, kein Dubbing, kein TTS für den gesamten Graphen.

**How-to (6 Schritte, für Recep ohne Code; Hanno hält den Account):**
1. **Recep:** Skript final in `04_Submission/Demo-Skript.md`. Daneben `Demo-Skript.tts.txt`: gleicher Text, nur für die Maschine angepasst (Zahlen ausgeschrieben, schwere Wörter in Lautschrift, ein Absatz je Szene, erste Zeile `[calm, measured narration]`).
2. **Hanno:** elevenlabs.io → Text to Speech (Web-App) → Modell **Eleven v4** → Stimme Y → Stability 0,5 / Similarity 0,75 (Startwerte, bei zu wechselhafter Betonung Stability auf 0,65) → Text einfügen → Generate → MP3 herunterladen. (Die 2x-Credit-Aktion gilt nur in der Web-App, nicht per API.)
3. **Hörprobe (Recep + Hanno):** Krabbe, GALC, PSAP, metachromatic leukodystrophy, Pelizaeus-Merzbacher, Libmeldy richtig? Wenn nicht: Lautschrift im `.tts.txt` anpassen, neu erzeugen. Höchstens 3 Takes je Video.
4. MP3 nach Drive `04_Submission/audio/` (nicht ins Repo), Name `demo_vo_v1.mp3`.
5. **Recep** legt die MP3 im Schnittprogramm unter die Aufnahme.
6. Skript eingefroren = Audio eingefroren. Jede Textänderung bedeutet einen neuen Take und neu synchronisieren.

**Stimme Y ⚠️ noch nicht gewählt.** Auswahl in 15 Minuten: Voice Library → Englisch, amerikanisch, ruhig, mittleres Tempo, vertrauenswürdig (Gesundheitsthema, kein „Trailer-Ton") → 3 Kandidaten → alle mit denselben zwei Sätzen testen (Maria-Eröffnung + ein Satz mit „metachromatic leukodystrophy") → eine Stimme für alle drei Videos. Platzhalter, falls es schnell gehen muss: die Stimme `21m00Tcm4TlvDq8ikWAM` aus den offiziellen Doku-Beispielen ([E5](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices); Verfügbarkeit im eigenen Account prüfen). Gewählte Stimme hier eintragen: `________` (Name) / `ELEVENLABS_VOICE_ID` in `.env.local`.

**Notlösung, wenn Hanno zum Engpass wird:** Recep legt einen **eigenen** Free-Account an (Free enthält 10.000 Credits und Zugriff auf v4, [E1](https://elevenlabs.io/blog/eleven-v4), [E8](https://elevenlabs.io/pricing)) und schreibt „elevenlabs.io" in den Video-Titel (Pflicht laut [E10](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)). Nachteil: nicht-kommerzieller Plan, schlechtere Planbarkeit, andere Stimme möglich.

### 4.5 Weitere ElevenLabs-Funktionen: sinnvoll für uns?

| Funktion | Kosten | Entscheidung | Begründung |
|---|---|---|---|
| Sound Effects (`eleven_text_to_sound_v2`) | 40 Credits/Sekunde bei fester Dauer ([E14](https://elevenlabs.io/docs/overview/capabilities/sound-effects)); ca. 200 Credits je Erzeugung laut Pricing-FAQ ([E8](https://elevenlabs.io/pricing)) | **nein** | [VIDEOS.md](hackathon-log/VIDEOS.md): „keine Musik, keine Effekte"; Medizinthema, ruhiger Ton |
| Music (`music_v2_5`) | ca. 900 Credits/Minute ([E8](https://elevenlabs.io/pricing)) | **nein** | gleiche Regel; Musik lenkt vom Evidenz-Argument ab |
| Dubbing | 2.000–10.000 Credits/Minute ([E8](https://elevenlabs.io/pricing)) | **nein** | Judges sprechen Englisch; Aufwand ohne Wertung |
| Scribe v2 (Speech to Text) | 330 Credits/Minute ([E8](https://elevenlabs.io/pricing)) | **nein** für Untertitel | wir haben den exakten Text; YouTube „Auto-Sync" ist gratis und reicht ([Y1](https://support.google.com/youtube/answer/2734796)) |
| Conversational Agents (ElevenAgents) | getrennt abgerechnet | **nein** | Freitext-Chat kann die Zitierpflicht nicht garantieren; Terrain der Challenge C1; „kein Scope-Creep" |
| Voice Cloning | im Plan enthalten | **nein** | Zeit, Missbrauchsfragen, kein Judging-Nutzen |
| Mehrsprachigkeit (DE/ES) | Zeichenpreis wie oben | **nein im Produkt, ja als Ausblick** | Übersetzung ist ein zusätzlicher LLM-Schritt und bricht die `[e_xxx]`-Zitierpflicht; als „Next step" auf die Limitations-Folie |

### 4.6 Einsatz (b): „Read aloud" in der App (Details unter „Einsatz in der App")

**Modellwahl:** vorgerendert mit `eleven_v4` (beste Qualität, einmalige Kosten, kein Key zur Laufzeit). Nur falls je Text live vorgelesen werden soll: `eleven_flash_v2_5` über `POST /v1/text-to-speech/{voice_id}/stream` ([E13](https://elevenlabs.io/docs/api-reference/text-to-speech/stream)). `eleven_v4_turbo` wird laut Doku über den Text-to-Dialogue-WebSocket bereitgestellt ([E3](https://elevenlabs.io/docs/overview/models)), also für uns unpraktisch.

**API-Aufruf in 10 Zeilen** (Endpoint, Header, Body bestätigt in [E6](https://elevenlabs.io/docs/api-reference/text-to-speech/convert); Key nur als Variable):

```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/$ELEVENLABS_VOICE_ID?output_format=mp3_44100_64" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "[calm, measured narration] Maria leads a patient group for Krabbe disease.",
    "model_id": "eleven_v4",
    "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
  }' --output sample.mp3
```

Geht der Aufruf mit `eleven_v4` nicht durch, ist der Dialogue-Weg die dokumentierte Alternative ([E7](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)): `POST /v1/text-to-dialogue` mit Body `{"model_id":"eleven_v4","inputs":[{"text":"…","voice_id":"…"}],"settings":{"stability":0.5}}`; dort für zuverlässige Ergebnisse höchstens 2.000 Zeichen je Request. Für v4 **kein** `speed`/`style` setzen.

**Zugang:** `ELEVENLABS_API_KEY` (und `ELEVENLABS_VOICE_ID`) in `.env.local`; in Vercel **nur**, wenn zur Laufzeit synthetisiert wird, was wir nicht empfehlen. Nie committen, nie weitergeben.

---

## 5 · Lovable

Prüfdatum aller Quellen in diesem Abschnitt: 2026-10-03.

**Was (aktuell):** KI-Builder für Web-Apps per Chat ([L2](https://lovable.dev/pricing)). Neue Projekte nutzen seit 13.05.2026 **TanStack Start** (serverseitig gerendert), ältere React + Vite ([L7](https://docs.lovable.dev/features/upgrade-to-tanstack-start)). Hosting inklusive: Publish auf `*.lovable.app`, HTTPS automatisch, Publish selbst kostet nichts, auch bei null Credits ([L6](https://docs.lovable.dev/features/hosting), [L3](https://docs.lovable.dev/features/publish)). Der eingebaute Backend-Dienst heißt „Cloud" (verbraucht Run-Credits), den brauchen wir nicht und lassen ihn aus. **Git-Sync auf allen Plänen,** zwei Richtungen, immer nur ein Branch ([L5](https://docs.lovable.dev/integrations/github), [L1](https://docs.lovable.dev/introduction/subscription-plans)). Der Code gehört euch ([L2](https://lovable.dev/pricing)).

**Kosten und Grenzen ([L1](https://docs.lovable.dev/introduction/subscription-plans), [L2](https://lovable.dev/pricing)):**

| Plan | Preis | Build-Credits | Wichtige Grenzen |
|---|---|---|---|
| **Free** | 0 | 5 pro Tag, **höchstens 30 pro Monat** (praktisch nur die ersten 6 Tage des Monats; Reset 00:00 UTC = 02:00 Wien) | **keine Custom Domain, kein Code-Download, kein Code-Editor, Badge „Edit with Lovable" bleibt**; Git-Sync ja |
| Pro | ab 25 USD/Monat (100 Credits) | 100/Monat + 5 pro Tag | Custom Domain, Download, Editor, Badge entfernbar |
| Studentenrabatt | 50 % bis 12 Monate auf Pro/100 Credits (≈ 12,50 USD), nur für Free-Workspaces, Verifikation über Uni-Mail | – | falls Credits knapp werden (ich kaufe nichts, Entscheidung Hanno) |

Beispielkosten laut Preisseite: „Make the button gray" 0,50 Credits · „Build me a landing page, use images" **1,70 Credits** ([L2](https://lovable.dev/pricing)). Eine Landing-Page mit 3–4 Korrekturen passt also knapp in die 5 Free-Credits eines Tages. Am So 04.10. (Tag 4 des Monats) gibt es noch Tagesguthaben, ab 07.10. bis 31.10. nicht mehr. ⚠️ Das gilt nur, wenn der Account die Tage 1–3 nicht schon verbraucht hat; im Account nachsehen.

Weitere Grenzen: Auf Free und Pro ist die veröffentlichte Seite **immer öffentlich** (kein Zugriffsschutz, [L3](https://docs.lovable.dev/features/publish)). Bei neuen Free-Projekten gilt ein Limit von 1.000 Server-Requests je 10 Sekunden ([L6](https://docs.lovable.dev/features/hosting)), für eine Story-Page unkritisch. Den Ausschluss der Workspace-Daten vom KI-Training gibt es standardmäßig erst ab Business, auf Free und Pro nur per Opt-out je Account ([L1](https://docs.lovable.dev/introduction/subscription-plans)): **keine Keys und nichts Vertrauliches in den Lovable-Chat.**

**Wofür es sich bei uns lohnt (< 2 h, ohne Code):**

| Idee | Aufwand | Urteil |
|---|---|---|
| **Story-/Landing-Page** (Problem, 4-Schritte-Erklärung, Evidenzstufen als Legende, Team, Button „Open the Atlas") | 60–90 min | **optional, ja bei Luft:** hilft der Kommunikationswertung, blockiert Hanno nicht |
| **Moonshot-Seite** (Timeline heute vs. mit Constellate) | gehört in dieselbe Seite; braucht MOONSHOT.md (nie geschrieben; der Moonshot steht in der App unter `/impact`) von Recep (Task R2) | nur als Abschnitt der Story-Page; **das Moonshot-Panel in der App baut Hanno in Next.js** |
| **Pitch-Microsite** für den 10.10. | 1–2 h | **nein:** der Live-Pitch braucht Folien (Task R4); eine Microsite ist Zusatzrisiko |
| **Klick-Prototyp** der App | 1–2 h | **nein:** anderer Stack, Hanno baut schneller direkt in Next.js, Übernahme kostet mehr als sie bringt |

**Wofür NICHT: die Kern-App.** Die ist Next.js in `app/`, deployt über Vercel, mit API-Routes, Graph-Rendering und OpenAI-Streaming. Lovable daneben wäre ein zweiter Stack, ein zweites Deploy, eine zweite Fehlerquelle um 14:55. Auch kein Formular, keine E-Mail-Sammlung (DSGVO), keine Patientendaten, kein Cloud-Backend: unser Graph ist eine statische JSON-Datei, bewusst ohne Datenbank.

**Entscheidung:** nur wenn R1–R3 erledigt sind und Hanno So 08:00 grünes Licht gibt. Timebox **90 Minuten, hartes Ende So 10:30**, danach wird nichts mehr daran gearbeitet. Nie vor dem Hero-Pfad-Fact-Check, und auf der Seite steht nur, was in [STORY.md](STORY.md)/MOONSHOT.md (nie geschrieben; der Moonshot steht in der App unter `/impact`) fact-gecheckt ist. Hack-Nation akzeptiert für die Live Demo zwar auch Lovable (Briefing, Regeln 2/2), unsere Live Demo bleibt aber die Vercel-App; das Submission-Feld „Live Demo" bekommt die Vercel-URL.

**How-to für Recep/Osman (6 Schritte):**
1. Eigenen Account auf lovable.dev anlegen (GitHub-Login), Free reicht zum Start.
2. „New project" → den Prompt unten einfügen und **die fact-gecheckten Texte** aus STORY.md/MOONSHOT.md darunter kopieren.
3. Vorschau im Handy-Format prüfen. Höchstens 5 Korrektur-Nachrichten (je 0,5–1,7 Credits).
4. **Publish** → Subdomain `constellate-story` wählen → URL testen (privates Fenster).
5. URL an Hanno schicken; er trägt sie in README (oben) und App-Footer ein. Der Button „Open the Atlas" auf der Seite verlinkt die **Vercel-Production-URL**, nicht eine Deployment-URL.
6. Optional als Backup: Project settings → Git → neues GitHub-Repo `constellate-story` (**eigenes Repo**, nicht `constellate`, sonst liegen Lovable-Dateien neben Next.js).

```
Build a static, single-page story site: mobile-first, low ink, lots of whitespace, one accent colour,
system font, no stock photos, no forms, no login, no backend.
Name: Constellate. Tagline: "Five thousand points of light. One map."
Sections: 1) Hero with tagline and a button "Open the Atlas" linking to [VERCEL_PRODUCTION_URL].
2) The problem (3 sentences, text below). 3) How it works in 4 steps: search a disease, see the
mechanism, inspect the evidence on every edge, get a sourced Action Card. 4) Evidence levels as a
legend: observed, curated, text-mined, inferred. 5) Moonshot: table "today vs. with Constellate",
using ONLY the numbers pasted below. 6) Team: Hanno, Osman, Recep, Vienna Hub.
7) Footer: data sources and licences, "Built with OpenAI".
Use only the text I provide. Do not invent statistics, names or quotes.
[TEXT HIER EINFÜGEN]
```

**Verlinkung mit der App:** README ganz oben („Story: <URL>") · Footer-Link „Story & Moonshot" in der App (Hanno, eine Zeile) · Link in der Video-Beschreibung · Lovable-Button zurück zur Vercel-App.

**Lizenz-/Offenlegungshinweis:** README-Zeile „Story page built with Lovable". Das Badge „Edit with Lovable" bleibt auf Free sichtbar, das ist okay.

---

## 6 · GitHub

**Was:** `github.com/hannokuegler/constellate` — Code, Daten (`data/graph.json`, `data/curated/`), Doku, Übergabe-Ort für alle Tasks.

**Regeln (3 Leute, 19 h — bewusst minimal):**
- **Direkt auf `main`**, kein Branch-Schutz, keine PRs. Zu klein, zu kurz.
- Kleine Commits mit Präfix `data:` · `docs:` · `app:` · `pipeline:` (siehe [WORKFLOW.md](hackathon-log/WORKFLOW.md)).
- `git pull --rebase` vor jedem Push. Konflikt → Hanno fragen, **nie `--force`**.
- Keine Secrets, keine `data/raw/`, keine Videos (> 5 MB) im Repo. `.gitignore` steht.
- **Keine `Co-Authored-By`-Trailer** oder sonstige KI-Attribution in Commits.
- Repo bleibt privat bis So 11:00, dann public (Osman). Lizenz: MIT für den Code, Datenlizenzen pro Quelle im README. **Achtung:** privat/public beeinflusst das Vercel-Deployment, siehe §7.

**Zugang:** Osman und Recep als Collaborators. Push über HTTPS mit Personal Access Token oder SSH-Key — jeder sein eigener, nichts teilen. **Commit-E-Mail:** `git config user.email` muss die E-Mail des eigenen GitHub-Accounts sein, sonst ordnet Vercel Commits falsch zu.

---

## 7 · Vercel

Prüfdatum aller Quellen in diesem Abschnitt: 2026-10-03.

**Was:** Hosting für `app/` (Next.js), Root Directory = `app`.

**Hobby-Plan (gratis) ist für uns richtig, hat aber zwei Fallen:**
1. **Nur Commits des Owners deployen.** Auf Hobby muss der Autor jedes Commits der Owner des Vercel-Projekts sein; bei privaten Repos gibt es keine Zusammenarbeit ([V1](https://vercel.com/docs/git), [V2](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)). Zusammenarbeit ist **gratis nur bei öffentlichen Repos** ([V2](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)). Die frühere Planung „Osman Team-Owner, Hanno Collaborator" würde bis So 11:00 (Repo privat) jeden Push von Hanno **blockieren**.
2. **Hobby = nur nicht-kommerzielle, persönliche Nutzung** ([V3](https://vercel.com/docs/plans/hobby)). Für den Hackathon passt das.

**⚠️ Entscheidung vor dem ersten Deploy (Hanno + Osman, bis So 02:00):**

| Option | Wie | Vor- / Nachteil |
|---|---|---|
| **A (Empfehlung)** | Das Vercel-Projekt gehört **Hannos** Hobby-Account (Git-Login = Repo-Besitzer `hannokuegler`). Osman/Recep pushen `data:`/`docs:`-Commits; die deployen nicht, was erwünscht ist (am Commit erscheint ein roter Hinweis „Deployment blocked", das ist erwartet und kein Fehler). | einfach, kein Geld; Osman sieht das Dashboard nicht, Hanno schickt Screenshots |
| B | Repo schon jetzt **public** machen | Collaboration gratis, jeder Push deployt; Arbeit ist früher sichtbar (Plan sah So 11:00 vor) |
| C | Pro-Team | kostet pro Sitz, Zahlung nicht von mir; nur wenn A/B nicht gehen |

Unabhängig davon: Hobby-Teams können keine Repos von Git-Organisationen anbinden ([V1](https://vercel.com/docs/git)). Unser Repo liegt im persönlichen Account, also passt das.

**Regeln:**
- Jeder Push von Hanno auf `main` → Production-Deploy. Wir pushen nur auf `main`, also: **jeder Push ist live** — vor dem Push `npm run build` lokal laufen lassen, wenn du App-Code anfasst.
- Env-Vars (`OPENAI_API_KEY`, nur bei Laufzeit-TTS `ELEVENLABS_API_KEY`) **nur** im Vercel-Dashboard (Project → Settings → Environment Variables, alle drei Environments) und lokal in `app/.env.local`. Nirgends sonst.
- `data/graph.json` wird aus dem Repo mitgebaut (statisch importiert oder aus `public/`), kein Runtime-Fetch — damit die App auch dann steht, wenn alle APIs down sind.
- Ohne OpenAI-Key läuft alles außer Explain/Resolve (Template-Fallback). Das testen wir einmal bewusst.
- **Live-URL ohne Login:** Standard Protection schützt Preview- und Deployment-URLs, aber **nicht die Production-Domain** ([V5](https://vercel.com/docs/deployment-protection)). Ins HackOS-Formular und ins README gehört deshalb die Production-Domain `<projekt>.vercel.app` (Settings → Domains), **nie** eine Deployment-URL mit Hash. Vor der Abgabe im privaten Fenster testen. „All Deployments" als Schutzstufe wäre ein Fehler, dann sieht jeder Judge eine Login-Wand.
- **Funktionsdauer:** Hobby erlaubt 300 s je Function, Request-/Response-Body höchstens 4,5 MB ([V4](https://vercel.com/docs/functions/limitations)). Explain-Streaming ist damit unkritisch.

---

## 8 · Offene Datenquellen

Alles ohne Key, alles heute per curl getestet: HPO, MONDO, Orphanet (XML), ClinicalTrials.gov v2, NIH RePORTER v2, PubMed E-utilities, Europe PMC, ClinVar, Open Targets GraphQL, Reactome, mygene.info, Monarch v3. Endpoints, Lizenzen, Größen → **[DATA-SOURCES.md](DATA-SOURCES.md)**. Optional `NCBI_API_KEY` (3 → 10 req/s). OMIM direkt: nicht einplanen.

---

## 9 · Video-Werkzeuge über Claude: Motion und /brag

Nur dokumentiert, **nichts ausgeführt, nichts gekauft** (Prüfdatum 2026-10-03).

### Motion (Video aus einem Briefing)

**Was:** Claude-Connector, der aus einem Briefing (Ziel, Quellenmaterial wie Text/URL, Zielgruppe, Ton, Kernpunkte) ein Video erzeugt, optional mit Stil-Vorlage (`design_system_id`), Seitenverhältnis, Dauer und Bild-/Video-Anhängen. Läuft asynchron, nachbessern per Follow-up. Quelle: Beschreibung des Motion-Connectors in Claude (Tool-Beschreibung, kein Web-Link). Credit-Preise ⚠️ nicht geprüft (dafür müsste ein Motion-Tool aufgerufen werden, das war ausgeschlossen); Hanno sieht Plan und Stand selbst in Claude.

**Wofür:** ein **kurzer Animations-Opener** (10–30 s) für den Pitch am 10.10. („Five thousand points of light. One map.") oder ein Erklärclip zur Problem-Story, jeweils aus einem **von uns geschriebenen** Briefing mit fact-gecheckten Sätzen.

**Wofür NICHT:** nicht für Demo, Walkthrough, Tech oder Team. Die Judges müssen die **echte App** sehen (Live-URL im Bild), Motion erzeugt keine Aufnahme unserer Seite. Motion recherchiert laut Beschreibung selbst und kann Aussagen einbauen, die wir nicht belegt haben; das widerspricht unserer Regel „jede Aussage mit Primärquelle".

**How-to (Hanno, falls gewollt, nach der Abgabe):** 1) Briefing in 6 Zeilen: Ziel, Zielgruppe (Patientengruppen-Leiterin), Ton ruhig/low ink, drei erlaubte Fakten wörtlich, „keine weiteren Zahlen", Länge 20 s. 2) Mit Screenshot der App als Anhang. 3) Ergebnis gegen die Fakten prüfen. 4) Erst dann verwenden.

### /brag (Launch-Video aus dem Projektcode, Hyperframes)

**Was:** Claude-Skill, der aus dem Projektcode ein **ca. 20-Sekunden-Loop-Video** (MP4) mit eigenem Soundtrack und fertigem Share-Text erzeugt; optional KI-Stimme (Kokoro, standardmäßig aus). Er liest den Code, nicht die Live-URL. Technik dahinter: [Hyperframes](https://github.com/heygen-com/hyperframes), Open Source (Apache 2.0), rendert aus HTML per Chromium und FFmpeg zu MP4. Braucht Node.js 22+ und FFmpeg ([/brag-README](https://github.com/latent-spaces/brag), gelesen über jsDelivr). ⚠️ Ob beides auf Hannos Mac installiert ist, ist nicht geprüft.

**Wofür:** Teaser für Discord-Post (14:30 laut [WORKFLOW.md](hackathon-log/WORKFLOW.md)), LinkedIn oder README-Kopf. Ein Gewinn für die Reichweite, **nicht** für die Wertung.

**Wofür NICHT:** nicht als Demo-Video (stilisierter Nachbau statt echter Bildschirmaufnahme, eigene Musik widerspricht [VIDEOS.md](hackathon-log/VIDEOS.md)). Nicht vor der Abgabe: Hanno hat von 12:00 bis 14:30 keine freie Minute. Schätzung 30–45 min.

---

## 10 · HackOS „Credits & Codes"

⚠️ Nicht geprüft (Login nötig). **Osman prüft bis Sa 20:30** und meldet im Gruppenchat, was dort liegt: OpenAI (Pflicht, Key), außerdem ob es Codes oder Gutschriften für **Bright Data, ElevenLabs, Lovable** gibt. Bevor jemand für ElevenLabs oder Lovable bezahlt: erst dort nachsehen. Zusätzlich fragen/prüfen: **welches Upload-Format für Videos HackOS akzeptiert** (YouTube unlisted, Drive, Datei? maximale Länge/Größe?). Der C5-Brief selbst nennt dazu nichts (`docs/C5-Challenge-Brief.pdf`, S. 6).

---

## Video-Pipeline (4 Videos)

**Was verlangt wird:** Die Hack-Nation-Regeln fordern Demo-, Tech- und Team-Video (Zweck laut Folie: „Show project", „Explain build", „Introduce team", `00_Briefing/slides/Regeln-2_Submission.jpg`). Der C5-Brief fordert zusätzlich den **1-min-Walkthrough** und nennt nur „A Team video and a 1-minute walkthrough" (`docs/C5-Challenge-Brief.pdf`, S. 6), **ohne** Vorgabe zu Gesichtern, Länge oder Format. Insgesamt also vier Videos (siehe [VIDEOS.md](hackathon-log/VIDEOS.md)).

**Für alle:** 1920×1080, 16:9, Englisch, Live-URL mit Browserleiste sichtbar (keine localhost-Demos), keine Musik und keine Effekte, Upload als YouTube „nicht gelistet" oder Drive (⚠️ HackOS-Format klären, §10). Aufnahme erst nach dem Feature-Freeze (12:00), vorher nur Skript und Probe-Takes.

| Video | Wer | Aufnahme | Voice-over | Schnitt | Untertitel | Upload | Zeit |
|---|---|---|---|---|---|---|---|
| **Demo** 2:00 | Recep | QuickTime Player → Neue Bildschirmaufnahme (⌘⇧5), Live-URL, Mausklicks anzeigen, Hero-Pfad stumm, 2–3 Takes | `eleven_v4`, Stimme Y (ein Text, ≤ 2.000 Zeichen empfohlen) | iMovie, CapCut oder DaVinci Resolve, **was Recep schon kann, nicht neu lernen**; Sprache unter die Aufnahme, Pausen statt Effekte, Logo-Karte am Ende | YouTube „Auto-Sync" mit dem Skript, danach Fachbegriffe prüfen ([Y1](https://support.google.com/youtube/answer/2734796)) | YouTube unlisted | ca. 70 min |
| **Walkthrough** 1:00 | Recep | **Aus derselben Aufnahme** wie die Demo, gestrafft (nur die Maria-Journey, ohne Intro und Honest Gap) | gleiche Stimme, eigener kurzer Text (ca. 850 Zeichen) | nur kürzen, kein Schnitt-Gedöns | wie Demo | YouTube unlisted | ca. 30 min |
| **Tech** 3:00 | Hanno | Terminal + Editor + Architektur-Folie (QuickTime); `make reproduce` vorher einmal laufen lassen | gleiche Stimme; Text ≈ 2.600 Zeichen, in 2 Teilen erzeugen (Abschnitt 1+2 / 3+4) | wie oben | wie oben | YouTube unlisted | ca. 90 min |
| **Team** 60–90 s | Osman filmt | Handy quer, Tageslicht, ruhiger Hintergrund, derselbe Ort für alle, je 20–25 s pro Person | **keine** KI-Stimme, echte Stimmen | nur kürzen + Untertitel | Auto-Untertitel des Schnittprogramms | YouTube unlisted | ca. 45 min |

**Zeitbedarf gesamt ca. 4 h Personenzeit** (Recep ca. 100 min, Hanno ca. 90 min, Osman ca. 45 min). Das Zeitfenster 12:00–14:00 ist eng. Deshalb:
- **Skripte und TTS-Texte sind vor 12:00 fertig.** Hanno erzeugt die drei Voice-over-MP3s So 11:15–11:45 (je ca. 10 min inkl. Hörprobe). Bis dahin liegt eine Probe-Version vom Demo-Skript (So 08:00–09:00) zum Timing-Test.
- **Demo und Walkthrough aus einer Aufnahme** (Recep spart ca. 30 min). Osman hilft nach seinem Team-Video (ab 13:00) bei Untertiteln und Upload der Demo-Videos.
- Reihenfolge der Abgabe wie in [WORKFLOW.md](hackathon-log/WORKFLOW.md): alle Links 13:30 in `04_Submission/LINKS.md`.
- Nach dem Upload jeden Link im **privaten Fenster** öffnen; MP4s als Backup auf Drive (Google-Form-Backup).

**Empfehlung zum Team-Video: ja, mit echten Gesichtern, alle drei.** Gründe: Der Zweck laut Hack-Nation-Folie ist „Introduce team", der Brief verbietet nichts, und „Communication" ist ein Hack-Nation-Kriterium. Authentische Gesichter sind das Gegenstück zum KI-Voice-over der Demo. Voraussetzung: alle drei sind einverstanden. Wer partout nicht ins Bild will: Stimme plus Handaufnahme des Arbeitsplatzes, aber kein KI-Avatar. Keine echten Patienten oder Kinder im Bild, die Hauptfigur bleibt eine **Komposit-Figur** und wird so benannt ([STORY.md](STORY.md)).

**Warum KI-Voice-over statt Recep selbst (Widerspruch zu [VIDEOS.md](hackathon-log/VIDEOS.md) „Recep spricht"):** gleiche Stimme in drei Videos, kein Take-Chaos nach einer Nacht ohne Schlaf, Text ist gleich Skript. Gegenargument: ein menschlicher Sprecher wirkt wärmer. **Empfehlung ElevenLabs, offengelegt**; Entscheidung bei Hanno. Falls Recep spricht, entfällt §4.4, Rest bleibt gleich.

---

## Einsatz in der App (Feature-Vorschläge)

Aufwand in Stunden für Hanno, wenn nicht anders vermerkt. Alle Features erst nach „E2E live" (So 06:00) und nur, wenn kein P1-Bug offen ist. Niemals raus: Evidenz-Panel, Action Card, Honest Gap, Explain.

| # | Feature | Werkzeug | Aufwand | Nutzen fürs Judging | Empfehlung |
|---|---|---|---|---|---|
| A1 | **Read aloud** (🔊 „Listen") für Action-Card-Kurzfassung und Honest-Gap-Screen der 5–8 Demo-Krankheiten, **vorgerenderte MP3** unter `app/public/audio/` | ElevenLabs `eleven_v4` | **ca. 1,5 h** | Product Craft (Devon, 2 Uhr nachts, liest nicht mehr, er hört), Communication; 5-Sekunden-Moment im Demo-Video; kein Laufzeit-Key, funktioniert auch bei API-Ausfall | **JA**, frühestens So 08:00, **Abbruch So 10:30**, wenn nicht fertig |
| A2 | Live-Vorlesen **beliebiger** Texte (`/api/tts`) | ElevenLabs `eleven_flash_v2_5` | +1,5 h | gering; Credit-Abfluss und Missbrauchsrisiko bei öffentlicher Route | **NEIN** |
| A3 | Mehrsprachig (DE/ES) vorlesen | v4 / Flash | 2–3 h | Brief: „a family can follow", aber Übersetzung bricht die Zitierpflicht `[e_xxx]` | **NEIN**, als „Next step" auf die Limitations-Folie |
| A4 | Symptome **sprechen** statt tippen (Devon) | ElevenLabs Scribe v2 Realtime + Resolve | 3–4 h | nett, aber Scope-Creep; Mikrofon-Rechte, Rauschen im Live-Demo | **NEIN** |
| A5 | „Ask the Atlas" als Voice-Agent | ElevenAgents | 6+ h | widerspricht Zitierpflicht, andere Challenge (C1) | **NEIN** |
| A6 | **Story-/Moonshot-Page** außerhalb der App | Lovable | 1,5 h (Recep) | Communication; blockiert Hanno nicht | **OPTIONAL**, nur nach R1–R3, Ende 10:30 (siehe §5) |
| A7 | Moonshot-Panel **in** der App | Next.js (Hanno), **nicht** Lovable | im Plan enthalten | 10×-Impact-Kriterium | **JA**, schon geplant |
| A8 | Teaser / Pitch-Opener | /brag oder Motion | 0,5–1 h | nur Reichweite bzw. Pitch am 10.10. | **NACH der Abgabe** |

**A1 im Detail (Umsetzung in 5 Schritten):**
1. Texte festlegen: je Krankheit eine **Kurzfassung ≤ 600 Zeichen** (ca. 40 s Hörzeit) statt der ganzen Action Card, plus Honest-Gap-Text. Die `[e_xxx]`-Marker **nicht vorlesen**, vor dem Aufruf entfernen.
2. Vorrender-Skript `scripts/tts_pregen.py` (Skizze unten) läuft einmal nach dem Freeze der Texte; Dateiname = Hash des Textes, damit veraltete Audios auffallen. Dazu `app/public/audio/index.json` (Krankheits-ID → Datei).
3. Button „🔊 Listen" mit `<audio>`-Tag, **sichtbarer Hinweis „AI-generated voice"**; ist für einen Text keine Datei da, wird der Button ausgeblendet.
4. Ausgabeformat `mp3_44100_64` (Sprache, ca. 0,5 MB je Datei, bleibt unter der 5-MB-Regel für das Repo).
5. Finale Texte = finale Audios. Ändert sich ein Text nach 11:00, Audio neu erzeugen oder Button für diesen Text ausblenden.

```python
# scripts/tts_pregen.py  (Skizze, nicht getestet)  —  uv run scripts/tts_pregen.py
import os, re, hashlib, json, pathlib, requests

VOICE, MODEL = os.environ["ELEVENLABS_VOICE_ID"], "eleven_v4"
OUT = pathlib.Path("app/public/audio"); OUT.mkdir(parents=True, exist_ok=True)

def speak(text: str) -> str:
    text = re.sub(r"\s*\[e_[^\]]+\]", "", text)                  # Zitat-Marker nicht vorlesen
    name = hashlib.sha1(text.encode()).hexdigest()[:12] + ".mp3"
    if (OUT / name).exists(): return name                         # Cache: kein Credit-Verbrauch
    r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}", timeout=120,
        params={"output_format": "mp3_44100_64"},
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
        json={"text": text, "model_id": MODEL,
              "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}})
    r.raise_for_status(); (OUT / name).write_bytes(r.content); return name

# texts = {"krabbe": "...", "mld": "...", "devon_gap": "..."}   # aus den finalen Action-Card-Texten
# (OUT / "index.json").write_text(json.dumps({k: speak(v) for k, v in texts.items()}))
```

**Harte Regel:** Eine öffentliche TTS-Route darf **nie** beliebigen Text annehmen, sonst kann jeder Besucher unsere Credits verbrauchen. Wenn je Laufzeit-TTS, dann nur `diseaseId` + `kind` annehmen und den Text serverseitig bauen, mit Zähler-Limit.

**Grenzen:** Vercel Functions sind für A1 gar nicht beteiligt (statische Dateien). Credits: ≈ 6.400 für acht Texte (siehe §4.2).

---

## Offenlegung (README-Block, kopierbar)

```
AI & tool disclosure
- Extract, Reconcile, Explain and Resolve use the OpenAI API (model IDs in pipeline/config.py).
- Patient-organisation facts were pre-extracted from public websites via Bright Data + OpenAI
  and manually verified on 2026-10-03.
- Voice-over of the Demo, Walkthrough and Tech videos was generated with ElevenLabs (Eleven v4).
  The Team video uses our real voices.
- The optional "Listen" buttons play pre-generated ElevenLabs audio (AI voice).
- The optional story page was built with Lovable.
- Code was written with Claude Code; the app runs on Vercel.
```

---

## Key-Übersicht (wer hat was)

| Variable | Wo | Hanno | Osman | Recep |
|---|---|---|---|---|
| `OPENAI_API_KEY` | `.env.local`, `app/.env.local`, Vercel | ✅ | ✅ (holt ihn) | — |
| `BRIGHTDATA_API_KEY` + `BRIGHTDATA_ZONE` | `.env.local` | ✅ (Skript-Test) | ✅ (nutzt) | — |
| `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` | `.env.local` (Vercel nur bei Laufzeit-TTS) | ✅ (einziger Account-Inhaber) | — | — (Login teilen verboten, siehe §4.3) |
| `NCBI_API_KEY` (optional) | `.env.local` | ✅ | — | — |

⚠️ `ELEVENLABS_VOICE_ID` fehlt noch in `.env.example` (Hanno ergänzt, falls A1 gebaut wird). Keys gehen per Signal/WhatsApp-Direktnachricht, nicht in den Gruppenchat, nie in eine Datei im Repo, nie in den Lovable-Chat. Nach dem Hackathon alle Keys rotieren.

## Offene ⚠️-Punkte (nach Person)

**Hanno**
- ElevenLabs: Plan im Dashboard prüfen (Creator aktiv? Credits? „Eleven v4" sichtbar?), **ein Test-Call** mit `eleven_v4` (TTS-Endpoint, sonst Dialogue-Endpoint), v4-Credit-Faktor ablesen, Stimme Y wählen.
- OpenAI: `models.list()` laufen lassen, IDs in `pipeline/config.py` festschreiben, Reasoning-Parameter prüfen.
- Vercel: Owner-Entscheidung A/B/C (§7) vor dem ersten Deploy.
- `scripts/fetch_orgs.py` schreiben (`scripts/` ist leer).
- VIDEOS.md angleichen, sobald „Voice-over durch ElevenLabs" entschieden ist.

**Osman**
- HackOS „Credits & Codes": OpenAI-Key, Codes für Bright Data/ElevenLabs/Lovable; **akzeptiertes Video-Format** klären.
- Bright-Data-Account und Web-Unlocker-Zone anlegen (§3).
- Repo-Sichtbarkeit zusammen mit Hanno entscheiden (§7).

**Recep**
- Schnittprogramm festlegen (was ihr schon könnt), Einwilligung für das Team-Video bei allen einholen.
- Lovable nur nach R1–R3 und Hannos Go (§5).
- Skript + `.tts.txt` bis So 11:00 fertig.

**Alle**
- Abgabe-URL ist die Vercel-**Production**-Domain, nie eine Deployment-URL; vor 14:45 im privaten Fenster testen.
