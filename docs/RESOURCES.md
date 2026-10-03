# 🧰 Ressourcen · was wir wofür nutzen (und wofür nicht)

> Stand Sa 03.10.2026, 20:30 · Fakten per Web-Check verifiziert, Unsicheres mit ⚠️ markiert.
> Grundregel: **ein Werkzeug pro Job.** Kern-App = Next.js, Daten = Python-Pipeline, LLM in der Pipeline/App = OpenAI. Alles andere ist Beschleuniger, kein zweiter Stack.

| Ressource | Rolle in Constellate | Wer | Key liegt in |
|---|---|---|---|
| OpenAI API | **Pflicht.** Extract · Reconcile · Explain · Resolve | Hanno | `.env.local` + `app/.env.local` + Vercel |
| Claude Code | Hannos Build-Werkzeug | Hanno | Hannos Account |
| Bright Data | Patientenorg-Seiten holen → OpenAI extrahiert → Osman prüft | Osman (Hanno-Skript) | `.env.local` (`BRIGHTDATA_API_KEY`) |
| ElevenLabs Creator | Voice-over für 3 Videos · optional „Read aloud" | Recep (Videos), Hanno (Feature) | `.env.local` + Vercel (`ELEVENLABS_API_KEY`) |
| Lovable | Landing-/Story-Page, **nicht** die App | Recep/Osman | Lovable-Account |
| GitHub | Repo `constellate`, Übergabe-Ort für alles | alle | GitHub-Login |
| Vercel | Hosting der Next.js-App, Preview je Push | Hanno (Osman Owner) | Vercel-Dashboard |
| Offene Datenquellen | HPO, MONDO, Orphanet, ClinVar, CT.gov, RePORTER, PubMed/EPMC, Open Targets, Reactome, Monarch | Hanno | kein Key (optional `NCBI_API_KEY`) → [DATA-SOURCES.md](DATA-SOURCES.md) |

---

## 1 · OpenAI API (Pflicht für Track-Preise)

**Was:** LLM-API (Chat/Responses, Structured Outputs, Embeddings). Credits kommen aus HackOS → **Credits & Codes** (Osman holt, Task O1).

**Wofür wir es einsetzen — exakt vier Aufrufstellen, alle im Tech-Video sichtbar:**

| Stelle | Datei | Modellklasse | Technik |
|---|---|---|---|
| **Extract** | `pipeline/05_openai_extract.py` | mini-Modell (Volumen) | Structured Outputs, Pydantic-Schema `Claim{subject, predicate, object, polarity, pmid, snippet}`; nur Abstracts der Slice-Krankheiten |
| **Reconcile** | `pipeline/06_openai_reconcile.py` | `text-embedding-3-small` + mini als Judge | Org-Krankheitsnamen → Top-5 MONDO-Kandidaten per Embedding → LLM entscheidet mit Begründung |
| **Explain** | `app/api/explain` | Flaggschiff, streaming | Pfad-Kanten als JSON rein → Klartext für eine Familie, jeder Satz endet mit `[e_xxx]`; Systemprompt verbietet Aussagen ohne Kante |
| **Resolve** | `app/api/resolve` | mini | Freitext-Symptome → HPO-IDs aus mitgelieferter Term-Liste |

**Wofür NICHT:** keine Faktenerzeugung ohne Quelle (jede Extract-Kante trägt PMID + Snippet, Level `text_mined`), kein „Chat mit dem Graphen", keine Zusammenfassungen im README.

**Modell-IDs:** nicht raten. Beim ersten Key-Test:
```python
from openai import OpenAI
for m in OpenAI().models.list().data: print(m.id)
```
Dann die IDs einmal in `pipeline/config.py` festschreiben (mini / flagship / embedding), nirgends hardcoden.

**Kostenabschätzung Extract, ~500 Abstracts:** ~500 × (300 Token Prompt + 250 Token Abstract + 200 Token Output) ≈ 0,4 M Token. Mit einem mini-Modell im Bereich < 1 USD, selbst beim Flaggschiff einstellig. Explain in der Demo: ~2k Token je Aufruf, < 0,05 USD. **Budget ist kein Thema — Latenz schon:** Explain streamen, Extract mit `concurrency=8` und Retry.

**Zugang:** `OPENAI_API_KEY` in `.env.local` (Pipeline) + `app/.env.local` (lokal) + Vercel → Settings → Environment Variables. Nie committen (`.gitignore` deckt `.env*.local`). Osman hat den Key, Hanno auch; Recep braucht ihn nicht.

---

## 2 · Claude / Claude Code

**Was:** Hannos Coding-Agent im Terminal (Claude Code) + claude.ai im Browser.

**Wofür:** Hanno baut damit Pipeline, App, Deploy, Tests. Osman/Recep nutzen claude.ai oder ChatGPT **nur** zum Formulieren (README-Sätze, Skript-Text, Mail an Judges) und als Recherche-Hilfe („wo finde ich den EPAR zu Libmeldy?").

**Wofür NICHT:** nie als Faktenquelle. **Jede Zahl, jedes PMID, jede Org-URL im Produkt oder Video braucht eine Primärquelle, die ihr selbst geöffnet habt.** LLM-Gedächtnis zählt nicht, auch wenn es plausibel klingt (Halluzinierte PMIDs sind das klassische Demo-Killer-Szenario bei Fact-Check durch Judges).

**Zugang:** Hannos Account. Osman/Recep: eigene Free-Accounts reichen.

---

## 3 · Bright Data (Hackathon-Zugang)

**Was:** Proxy-/Scraping-Infrastruktur. Drei Produkte, die für uns in Frage kommen:

| Produkt | Macht | Für uns |
|---|---|---|
| **Web Unlocker API** | `POST` eine URL → fertiges HTML/Markdown zurück, kümmert sich um Proxys, Fingerprints, CAPTCHA, Retries | **Ja, genau das** |
| SERP API | strukturierte Google/Bing-Ergebnisse | nur als Fallback, um Org-URLs zu finden (⚠️ Zone muss im Dashboard angelegt sein) |
| Web Scraper API | fertige Scraper für große Plattformen (Amazon, LinkedIn …) | **Nein** — für NORD/Orphanet gibt's keinen fertigen Scraper |

**Preis (offizielle Pricing-Seite, Stand heute):** Web Unlocker Free-Tier **5.000 Requests/Monat ohne Kreditkarte**, danach Pay-as-you-go **1,50 USD / 1k erfolgreiche Requests**. Unsere ~50–100 Seitenabrufe sind kostenlos. Hackathon-Zugang laut HackOS prüfen — eventuell gibt's ein Credit-Paket obendrauf (⚠️ prüfen).

**Wofür wir es einsetzen:** Osmans Patientenorg-Kuration (Task O2) beschleunigen. Statt 30 Websites komplett per Hand zu lesen:

```
Startliste (Namen)  →  URL finden (manuell/SERP)  →  Bright Data holt HTML/Markdown
→  OpenAI extrahiert strukturiert (Structured Outputs)  →  Osman öffnet jede Seite
   und bestätigt/korrigiert  →  data/curated/orgs.csv
```

Der Mensch bleibt der letzte Schritt. Die CSV heißt weiterhin „kuratiert", weil jede Zeile von Osman verifiziert ist — Bright Data + OpenAI sind nur der Vorfilter.

**Mini-Pipeline (Pseudocode, Hanno schreibt `scripts/fetch_orgs.py`, Osman führt aus):**

```python
# scripts/fetch_orgs.py  — uv run scripts/fetch_orgs.py data/curated/org_urls.txt
import requests, json, os, datetime, pathlib
from openai import OpenAI
from pydantic import BaseModel

BD = "https://api.brightdata.com/request"          # offizieller Endpoint (docs.brightdata.com)
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
    cache = pathlib.Path(f"data/cache/orgs/{hash(url)}.md")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(f"<!-- source: {url} fetched: {datetime.date.today()} -->\n{r.text}")
    return r.text

def extract(url: str, page_md: str) -> OrgCard:
    client = OpenAI()
    resp = client.responses.parse(                        # ⚠️ Methodenname gegen installierte SDK-Version prüfen
        model=MINI_MODEL,
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

Osman kopiert dann Zeile für Zeile aus `orgs_draft.csv` nach `orgs.csv`, **nachdem er die Seite selbst geöffnet hat**, und setzt `verified_date`.

**Ziel-Seiten (nur öffentliche):** Websites der Orgs aus der Startliste in [DATA-SOURCES.md](DATA-SOURCES.md) · NORD Rare Disease Database, Abschnitt „Patient Organizations" je Krankheit · Global Genes Verzeichnis · Orphanet-Krankheitsseiten, Reiter Patientenorganisationen (nur Website-Ansicht; Orphadata gibt Org-Daten nicht frei).

**Wofür NICHT:** keine Bulk-Downloads der Fach-DBs (die haben offene Dateien/APIs, siehe DATA-SOURCES), kein Scraping von PubMed/CT.gov (eigene APIs), kein JS-Rendering-Gefrickel an GARD (`render: true` existiert, aber das kostet Zeit, die wir nicht haben).

**Rechtliche Note (ins README unter „Data sources"):** nur öffentlich erreichbare Seiten · `robots.txt` der Zielseite vorher anschauen und respektieren · zu jeder Zeile `source_url` + `fetched_date` speichern (steckt im Cache-Header und in `notes`) · wir speichern nur extrahierte Fakten, keine Seitenkopien im Repo (`data/cache/` ist gitignored) · im README offenlegen: „Patient-organisation facts were pre-extracted from public websites via Bright Data + OpenAI and manually verified on 2026-10-03".

**Zugang:** API-Token + Zone-Name aus dem Bright-Data-Dashboard (Zone vom Typ Web Unlocker anlegen). `BRIGHTDATA_API_KEY` und `BRIGHTDATA_ZONE` in `.env.local`. Osman legt den Account an, Hanno bekommt Token für den Skript-Test. Nie committen.

---

## 4 · ElevenLabs Creator Tier

**Was:** Text-to-Speech, Voice Cloning, Dubbing, Conversational Agents. Creator = **22 USD/Monat, 121.000 Credits/Monat**, Professional Voice Cloning, Commercial License, 128/192 kbps. Credits-Verbrauch: Multilingual v2 ≈ 1 Credit/Zeichen, Flash/Turbo ≈ 0,5 Credit/Zeichen (⚠️ aktuelle Modell-IDs und Credit-Faktoren in den Docs prüfen).

**Wofür wir es einsetzen:**

**(a) Englisches Voice-over für die drei Videos** (Recep, Tech-Video-Text von Hanno). Vorteile: eine konsistente, saubere Stimme über Demo (2 min), Walkthrough (1 min), Tech-Video (3 min); keine Mikro-/Raum-/Akzent-Probleme um 13 Uhr nach einer Nacht ohne Schlaf; Text ist gleichzeitig das Skript und damit fact-checkbar. Ablauf: Skript in `04_Submission/Demo-Skript.md` final → in der ElevenLabs-Web-App einsprechen lassen (kein API-Code nötig) → MP3 → in iMovie/DaVinci/CapCut unter das Screen-Recording. Eine Stimme für alle drei Videos wählen, Speed 0.95–1.0. **Team-Video bleibt echt** (eure Gesichter, eure Stimmen).

**(b) Optional: „Read aloud" im Honest-Gap-/Action-Card-Screen** (Hanno, nur wenn nach 08:00 Luft ist). Devon um 2 Uhr früh, frisch diagnostiziert, liest nicht mehr — er hört. Button „🔊 Listen" → `app/api/tts` (Next.js Route Handler) → ElevenLabs → MP3 zurück, **gecacht nach Hash(text)** in `/tmp` bzw. Vercel Blob (⚠️ prüfen, ob Blob im Vercel-Free-Tier ohne Setup geht; sonst In-Memory-Cache reicht für die Demo). Niemals Explain-Text live synthetisieren, ohne vorher zu cachen — jeder Judge-Klick kostet sonst Credits.

```ts
// app/api/tts/route.ts (Skizze)
const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
  method: "POST",
  headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json" },
  body: JSON.stringify({ text, model_id: "eleven_multilingual_v2",   // ⚠️ oder Flash-Modell für halbe Credits
                         voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
});
return new Response(r.body, { headers: { "Content-Type": "audio/mpeg" } });
```
Endpoint und Header sind offiziell (`POST /v1/text-to-speech/{voice_id}`, Auth `xi-api-key`); Streaming-Variante `/stream` existiert.

**Passt das Budget?**
- (a) 6 min Sprechtext ≈ 900 Wörter ≈ **5.500 Zeichen**; mit 3 Takes/Korrekturen ≈ 15–20k Credits.
- (b) Action Card + Honest Gap ≈ 1.200 Zeichen je Krankheit; 10 Demo-Krankheiten vorgecacht ≈ 12k Credits; Judge-Klicks auf nicht gecachte Texte ≈ 1k je Klick.
- Summe realistisch **30–40k von 121k Credits** → passt locker, auch mit Multilingual v2. Falls der Creator-Tier über einen Hackathon-Code erst aktiviert werden muss: vorher checken, ob die Credits sofort da sind (⚠️ prüfen).

**Wofür NICHT:** kein Voice Cloning eurer eigenen Stimmen (Zeit, kein Mehrwert für Judges), keine Conversational Agents, kein Dubbing, kein TTS für den gesamten Graphen.

**Zugang:** API-Key im ElevenLabs-Dashboard (Profil → API Keys). `ELEVENLABS_API_KEY` in `.env.local` + Vercel (nur wenn (b) gebaut wird). Recep braucht nur den Web-Login für (a). Nie committen.

---

## 5 · Lovable

**Was:** No-Code/AI-Web-App-Builder; erzeugt eine React/Vite/Tailwind-App, Publish auf `*.lovable.app`, **GitHub-Sync auf allen Plänen** (zwei Wege: Lovable → Repo-Branch und zurück; ein Branch gleichzeitig), native Supabase-Integration, Custom Domain. ⚠️ Free-Plan-Credits sind knapp (Tagesbudget) — für eine Landing-Page reicht es, für Iterationen eher nicht.

**Wofür NICHT: die Kern-App.** Die ist Next.js in `app/`, deployt über Vercel, mit API-Routes, Graph-Rendering und OpenAI-Streaming. Lovable daneben = zweiter Stack, zweites Deploy, zweite Fehlerquelle um 14:55. Auch kein Supabase: unser Graph ist eine statische JSON-Datei, bewusst ohne Datenbank.

**Empfehlung A (wenn Recep/Osman Luft haben, 08:00–11:00):** eine **Story-/Landing-Page**, die Judges in 30 s abholt: Problem (Maria), Moonshot-Timeline heute vs. mit Constellate (Zahlen aus `docs/MOONSHOT.md`), Evidenz-Modell als Grafik, Team, großer Button „Open the Atlas" → Vercel-URL. Vorteile: blockiert Hanno null, sieht in einer Stunde gut aus, passt zu „Product Craft"-Kriterium. Ablage: Lovable-URL im README verlinken; GitHub-Sync in ein **eigenes Repo** `constellate-story`, nicht in `constellate` (sonst Vite-Dateien neben Next.js = Chaos).
**Empfehlung B:** Pitch-Visuals (Moonshot-Timeline als interaktive Grafik) für das Demo-Video abfilmen.
**Empfehlung C: gar nicht nutzen.** Völlig legitim. Eine saubere README + Live-App schlägt eine zweite Website, die unfertig aussieht.

**Entscheidung: C, es sei denn, Recep hat nach R1–R3 Zeit und Lust — dann A.** Nie vor dem Hero-Pfad-Fact-Check.

**Zugang:** eigener Lovable-Account (GitHub-Login) von Recep oder Osman. Kein Key im Repo.

---

## 6 · GitHub

**Was:** `github.com/<hanno>/constellate` — Code, Daten (`data/graph.json`, `data/curated/`), Doku, Übergabe-Ort für alle Tasks.

**Regeln (3 Leute, 19 h — bewusst minimal):**
- **Direkt auf `main`**, kein Branch-Schutz, keine PRs. Zu klein, zu kurz.
- Kleine Commits mit Präfix `data:` · `docs:` · `app:` · `pipeline:` (siehe [WORKFLOW.md](WORKFLOW.md)).
- `git pull --rebase` vor jedem Push. Konflikt → Hanno fragen, **nie `--force`**.
- Keine Secrets, keine `data/raw/`, keine Videos (> 5 MB) im Repo. `.gitignore` steht.
- **Keine `Co-Authored-By`-Trailer** oder sonstige KI-Attribution in Commits.
- Repo bleibt privat bis So 11:00, dann public (Osman). Lizenz: MIT für den Code, Datenlizenzen pro Quelle im README.

**Zugang:** Osman legt an, Hanno + Recep Admin. Push über HTTPS mit Personal Access Token oder SSH-Key — jeder sein eigener, nichts teilen.

---

## 7 · Vercel

**Was:** Hosting für `app/` (Next.js), Root Directory = `app`.

**Regeln:**
- Jeder Push auf `main` → Production-Deploy; jeder andere Branch → Preview-URL. Wir pushen nur auf `main`, also: **jeder Push ist live** — vor dem Push `npm run build` lokal laufen lassen, wenn du App-Code anfasst.
- Env-Vars (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`) **nur** im Vercel-Dashboard (Project → Settings → Environment Variables, alle drei Environments) und lokal in `app/.env.local`. Nirgends sonst.
- `data/graph.json` wird aus dem Repo mitgebaut (statisch importiert oder aus `public/`), kein Runtime-Fetch — damit die App auch dann steht, wenn alle APIs down sind.
- Ohne OpenAI-Key läuft alles außer Explain/Resolve (Template-Fallback). Das testen wir einmal bewusst.
- Live-URL ohne Login, ohne Vercel-Passwortschutz (Preview Protection **aus**, sonst sehen Judges eine Login-Wand).

**Zugang:** Osman ist Team-Owner (GitHub-Login), Hanno Collaborator mit Deploy-Rechten. Vercel-Token braucht niemand lokal.

---

## 8 · Offene Datenquellen

Alles ohne Key, alles heute per curl getestet: HPO, MONDO, Orphanet (XML), ClinicalTrials.gov v2, NIH RePORTER v2, PubMed E-utilities, Europe PMC, ClinVar, Open Targets GraphQL, Reactome, mygene.info, Monarch v3. Endpoints, Lizenzen, Größen → **[DATA-SOURCES.md](DATA-SOURCES.md)**. Optional `NCBI_API_KEY` (3 → 10 req/s). OMIM direkt: nicht einplanen.

---

## Key-Übersicht (wer hat was)

| Variable | Wo | Hanno | Osman | Recep |
|---|---|---|---|---|
| `OPENAI_API_KEY` | `.env.local`, `app/.env.local`, Vercel | ✅ | ✅ (holt ihn) | — |
| `BRIGHTDATA_API_KEY` + `BRIGHTDATA_ZONE` | `.env.local` | ✅ (Skript-Test) | ✅ (nutzt) | — |
| `ELEVENLABS_API_KEY` | `.env.local`, Vercel (nur bei Read-aloud) | ✅ | — | ✅ (Web-Login für Voice-over) |
| `NCBI_API_KEY` (optional) | `.env.local` | ✅ | — | — |

Keys gehen per Signal/WhatsApp-Direktnachricht, nicht in den Gruppenchat, nie in eine Datei im Repo. Nach dem Hackathon alle Keys rotieren.
