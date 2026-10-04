# Stimmen für „Maria's first night“ (In-App-Intro /intro)

## Fassung 2 (04.10., nach Hannos Kritik)

Stand So 04.10.2026, vormittags (Wien). Entwurf für Hanno, nichts davon ist final (Regel 6). Ersetzt Skript und Maria-Stimme aus Fassung 1 (unten); Consti bleibt Lily `pFZP5JQG7iQjIQuC4Bku` mit unveränderten Settings. Texte stehen in `app/lib/story.ts` (`STORY`), Stimme und Settings in `app/story/voices.json`.

### Warum eine Fassung 2

| Kritik (Hanno, wörtlich) | Was sich ändert |
|---|---|
| „schau dass sich die sachen ned doppelt wiederholen (2 am und so, zum schluss der satz is a doppelt)“ | Jede Info und jede Phrase kommt genau einmal vor (Prüfliste unten). „2 a.m.“ nur in m-start. Der Schlusssatz wird nur noch gesprochen (c-end); Schlusskarte und /intro-Endbildschirm sagen etwas anderes (Vorschlag unten). Das Echo „how we know“ / „How do I know“ ist raus. |
| „dass die section bissi allgemeiner erklärt wird“ | Consti sagt je Bereich zuerst, was er für jede Familie ist (Suche verzeiht Tippfehler, geprüfte Gruppen, Studien nach Land, Beleg je Linie, verwandte Krankheiten, Namen verbergen Gemeinsames), der konkrete Krabbe-Bezug kommt aus dem Bild oder in zwei bis vier Wörtern. |
| „stimme von maria zu eintönig depressiv … einfach gut“ | Neue Stimme (Jessica statt Sarah), stability 0,30 statt 0,40, neue Regie je Zeile mit klarem Bogen: unruhig und kämpferisch, ungeduldig, misstrauisch, dann Staunen und warme Erleichterung mit Atem-Lachen. Kein Flüstern, kein Brechen der Stimme mehr. |
| Referenzvideo (pitch/VOICE-ELEVENLABS.md §5, D2, D3, D5, D7) | Übernommen, soweit im Bild belegt: „how sure we are … what speaks against it“ (c-evidence, Panel zeigt Konfidenz und Counter-evidence), „Names hide what they share“ (c-psap, Seite zeigt „Names hide mechanisms“), Zulassungs-Kontrast (c-card, Action Card zeigt „No approved medicine for Krabbe disease found in EMA or FDA records as of 3 Oct 2026“ und die EMA- und FDA-Zulassungen für MLD; Markennamen werden nicht gesprochen). „Don't rebuild what a neighbouring disease already built.“ wird Endbildschirm-Überschrift auf /intro, nicht c-end (Begründung unten). |

### Maria, neu

| Merkmal | Fassung 1 | Fassung 2 |
|---|---|---|
| Grundhaltung | erschöpft, taub, kurz vor dem Weinen | übermüdet, aber hellwach und kämpferisch: sie wartet nicht bis morgen |
| Lautstärke, Nähe | fast geflüstert | normale Sprechstimme, nah am Mikro, natürliche Atmer |
| Tempo | langsam, stockend (gemessen 2,0 bis 2,3 Silben/s) | zügig und ungleichmäßig; schnell bei Ungeduld und Misstrauen, kurz langsamer nur beim Staunen am Schluss |
| Bewegung | eine Farbe über alle Zeilen | jede Zeile eine andere Farbe (Bogen unten) |
| Was sie nie sein darf | Opferton | weinerlich, flüsternd, monoton, Hörbuch, Werbestimme |

Bogen über die vier Zeilen:

| Zeile | Gefühl | Stimme | Regie-Idee |
|---|---|---|---|
| m-start | übermüdet, gereizt, will sofort handeln | tief, schnell, etwas rau; scharfes Ausatmen vor dem Eingeständnis | Sie läuft in der Küche auf und ab, nicht am Tisch zusammengesunken |
| m-alone | Ungeduld, dann ein Funken Hoffnung | „Other families?“ schnell und fordernd, „Anyone?“ leiser, offen | Sie scrollt und sucht, die Frage ist ein Ruf, keine Klage |
| m-trust | Misstrauen | stoppt, kurz und scharf | Sie lässt sich nichts verkaufen; das macht Consti glaubwürdig |
| m-end | Staunen, dann echte Erleichterung | ein Takt Stille, weiches Atem-Lachen, Stimme wird warm und fest | Kein Triumph, kein Weinen: ein Plan statt Ohnmacht |

### Stimmwahl Maria

Alle IDs vor dem Take mit `npm run story:voice -- --list` im eigenen Account prüfen; ⚠️ heißt: ID nur aus Drittquelle oder Erinnerung, nicht gegen die ElevenLabs-Doku verifiziert.

| Rang | Stimme | Voice-ID | Warum | Status |
|---|---|---|---|---|
| 1 (in voices.json) | Jessica (Default) | `cgSgspJ2msm6clMCkdW9` | laut Default-Voice-Liste „young, American, expressive, conversational“ (Fassung 1, S7); Standardstimme, die jeder Account hat; trägt Ungeduld und Lachen besser als die „soft“ Sarah | ⚠️ ID nur aus Drittquelle (Fassung 1, S8) |
| 2 | Aria (Default) | `9BWtsMINqrJLrRacOk9x` | „middle-aged, American, expressive“, etwas rauer und älter als Jessica, passt zu „übermüdet, Mitte 30“ | ⚠️ ID und Beschreibung aus Erinnerung; evtl. nicht mehr in der Default-Liste |
| 3 | Laura (Default) | `FGY2WhTYpPnrIDTdsKH5` | jung, amerikanisch, lebhaft; Reserve, falls Jessica zu glatt klingt | ⚠️ ID und Beschreibung aus Erinnerung; Risiko zu fröhlich |
| Design | Voice Design v2 (Prompt unten) | entsteht beim Speichern | maßgeschneidert, wenn keine Default-Stimme den Bogen trägt | `npm run story:voice -- --design maria`, dann `--save maria <id>` |
| raus | Sarah (bisher) | `EXAVITQu4vr4xnSDxMaL` | „soft“, wirkt mit der Flüster-Regie flach und depressiv | verifiziert, aber ersetzt |

Settings Maria (in `voices.json`): `stability` **0,30** (vorher 0,40; niedriger = mehr Ausdruck, Fassung 1, S2), `similarity_boost` 0,75, `seed` 404 wie bisher. Wenn einzelne Zeilen ins Theatralische kippen: 0,35. ⚠️ Falls `eleven_v4` stability wie v3 nur in Stufen annimmt (0 Creative, 0,5 Natural, 1 Robust) und 0,30 ablehnt oder rundet: 0,0 testen, sonst 0,5.

Voice-Design-Prompt v2 (`voice_description`, `model_id: "eleven_ttv_v3"`, `should_enhance: false`, `seed: 404`):

```
A woman in her mid-thirties, warm American English with a natural General American accent. Mid-range pitch with a little grit from a sleepless night, but fully alive: quick, restless and determined, a mother who refuses to wait until morning. Her voice moves from line to line: urgency and impatience, a sharp flash of suspicion, sudden wonder, then warm relief with a soft, breathy laugh. Conversational and close to the microphone, natural breaths, real rather than performed. Never weepy, never whispering, never monotone, never an announcer or audiobook narrator. Dry, clean studio recording, no reverb, no background noise.
```

Vorschau-Text (`text`, 126 Zeichen): `Two a.m. Krabbe disease. Can't even spell it. Other families? Anyone? Wait. Who says this is true? Okay. I can work with this.`

### Skript Fassung 2

`Bubble` geht nach `text` (Sprechblase und Transkript), `TTS` nach `tts`. Die Sprechblase ist der Untertitel der Zeile, das ist gewollt. IDs und Reihenfolge sind unverändert, der Recorder bindet sie an dieselben Bilder.

| id | wer | Bubble | TTS | Bild | Dauer (s) |
|---|---|---|---|---|---|
| m-start | Maria | 2 a.m. “Krabbe disease.” Can't even spell it. | `[wired and exhausted, low and quick, restless, a frustrated edge] Two a.m. Krabbe disease. [sharp exhale] Can't even spell it.` | Titelkarte blendet aus, Startseite „Just received a rare diagnosis? Start here.“ | 5,4 |
| c-hello | Consti | Start typing. Typos are fine. | `[calm, warm, unhurried] Start typing. Typos are fine.` | Maria tippt „krabe“, Treffer „Krabbe disease“ | 2,6 |
| m-alone | Maria | Other families? Anyone? | `[impatient, urgent, scanning the screen] Other families? [quieter, a flicker of raw hope] Anyone?` | Krabbe-Seite (oben „What you can do now“, Graph), Scroll zu den Patientengruppen | 2,4 |
| c-gap | Consti | Yes. Checked patient groups. | `[warmly, gently] Yes. Checked patient groups.` | „Patient organisations 4: Groups for this diagnosis, each checked against the organisation's website“ | 2,0 |
| c-studies | Consti | Studies that need participants, by country. | `[a little brighter] Studies that need participants, by country.` | „Studies looking for participants with Krabbe disease“, Länderfilter, „Contact the study team“ | 3,4 |
| m-trust | Maria | Wait. Who says this is true? | `[stops short, suspicious, a little sharp] Wait. Who says this is true?` | Graph, Cursor auf einer Linie | 2,4 |
| c-evidence | Consti | Each line shows its source, how sure we are… and what speaks against it. | `[calm, steady, not offended] Each line shows its source, how sure we are… and what speaks against it.` | Evidenz-Panel: Source, Record, Date, Level, confidence, independent sources, Counter-evidence | 5,2 |
| c-related | Consti | Related by a gene or symptoms: their families may help. | `[softly, curious] Related by a gene or symptoms: their families may help.` | „Related communities“, MLD „shares PSAP“ | 4,5 |
| c-psap | Consti | Names hide what they share. Here, four. | `[quietly, a touch of wonder] Names hide what they share. Here, four.` | `/g/PSAP` „Names hide mechanisms. One gene, 4 disease names“ | 3,4 |
| c-card | Consti | Action card: Krabbe has no approved medicine in EU or US records… MLD does. | `[calm, clear, no drama] Action card: Krabbe has no approved medicine in E-U or U-S records… M-L-D does.` | Action Card „What Krabbe disease can learn from metachromatic leukodystrophy“, „At a glance“ mit den EMA- und FDA-Zeilen | 7,7 |
| m-end | Maria | Okay. I can work with this. | `[a beat of disbelief, then a soft laugh of relief, voice warming] Okay. I can work with this.` | Action Card, Cursor steht | 3,8 |
| c-end | Consti | Your family is not the first. | unverändert: `[softly, slowly, warm, close to the mic] Your family is not the first.` | Schlusskarte (ohne Satz, siehe unten), keine Sprechblase | 2,8 (echter Clip) |
| | | | | **Summe Sprechzeit** | **45,6** |

Rechenweg (Skript, nicht geschätzt aus dem Kopf): Netto-Sprechrate und Pausen aus den zwölf echten Clips vom 04.10. gemessen (`ffprobe` und `silencedetect -45 dB, 0,2 s`). Maria: 2,0 bis 2,3 Silben/s bei langsamer Regie (m-start, m-end), 2,9 bei m-alone, 3,4 bei m-trust; Consti: 3,5 bis 4,2 bei ruhiger Regie (c-hello, c-gap, c-studies, c-end), 3,2 bis 3,3 bei betonter (c-evidence, c-card), 1,8 bei „slowly, with weight“ (c-psap). Pause je Satzzeichen-Bruch im Mittel 0,40 s, Rand-Stille 0,25 s je Clip, Lachen 0,6 s, Ausatmen 0,4 s. Angesetzt: Maria zügig 3,4, gemischt 2,8; Consti ruhig 3,6, betont 3,0 Silben/s. Gegenprobe: Dasselbe Modell schätzt Fassung 1 auf 57,4 s, die echten Clips sind 56,0 s lang; es liegt also etwa 2,5 % zu hoch. Regie mit „slowly“ wurde bewusst vermieden, außer in c-end (dessen Clip bleibt).

Länge des Videos: Fassung 1 hatte 56,0 s Sprechzeit und ergab 59,6 s Video nach 5 % Beschleunigung, also rund 6,6 s Bild ohne Stimme (Titelkarte, Tippen, Scrolls, Stille vor c-end). Mit 45,6 s Sprechzeit sind das etwa 52 s ohne Beschleunigung ⚠️ (der Recorder `maria.story.ts` wird gerade parallel überarbeitet; die festen Wartezeiten können sich ändern).

Neu erzeugen: c-end bleibt wortgleich, sein Clip bleibt. Weil die übrigen MP3s schon existieren, erzeugt `npm run story:voice` ohne Argumente nichts neu; deshalb explizit:

```
npm run story:voice -- m-start c-hello m-alone c-gap c-studies m-trust c-evidence c-related c-psap c-card m-end
```

### Keine Doppelung (Prüfliste)

| Element | kommt vor in | sonst nirgends |
|---|---|---|
| „2 a.m.“ | m-start | Titelkarte sagt „Maria's first night“, nicht die Uhrzeit |
| „Your family is not the first.“ | c-end (nur gesprochen) | Schlusskarte und /intro-Endbildschirm sagen es nicht mehr (Vorschlag unten); ⚠️ `/about` hat den Satz als H1, das ist eine andere Seite außerhalb des Videos |
| Beleg, Konfidenz, Gegenevidenz | c-evidence | „how we know“ in c-hello ist gestrichen |
| „share“ | c-psap | c-related sagt „Related by“ |
| „four“ | c-psap | c-gap nennt keine Zahl, die 4 steht im Bild |
| „action card“ | c-card | Schlusskarten-Unterzeile „take your action card“ entfällt |
| „Try it yourself“ | Button auf /intro | Schlusskarten-Unterzeile „Now try it yourself …“ entfällt |
| „Krabbe“ | m-start (Maria), c-card (Kontrast zu MLD) | Consti sagt es sonst nicht, der Name steht im Bild |
| „families“ / „family“ | m-alone, c-related, c-end | gewollt als Leitwort: Frage, Antwort, Schluss; jeweils andere Info |

### Schlusskarte und /intro-Endbildschirm (Vorschlag, Hanno entscheidet)

| Ort | heute | Vorschlag | Wo ändern |
|---|---|---|---|
| Schlusskarte im Video | „Your family is not the first.“ plus „Now try it yourself: search your diagnosis, open any line, take your action card.“ | nur das Constellate-Zeichen und der Name „Constellate“, keine Unterzeile; c-end wird darüber gesprochen und steht allein | `maria.story.ts`: `card(page, "Constellate", "")` |
| /intro-Endbildschirm | „Your family is not the first.“ plus Buttons | Überschrift „Don't rebuild what a neighbouring disease already built.“, Buttons unverändert („Try it yourself“, „Open Krabbe disease“, „Watch again“) | `components/StoryPlayer.tsx`, Zeile mit dem `<p>` über den Buttons; e2e-Test prüft nur die Buttons |
| Titelkarte (optional) | „Maria's first night“ plus STORY_NOTE; derselbe STORY_NOTE steht auf /intro direkt über dem Player | Karte behält den Hinweis (das Video muss die Komposit-Figur selbst offenlegen); auf /intro unter der Überschrift nur noch `STORY_VOICE_NOTE` | `app/intro/page.tsx` |

Warum c-end „Your family is not the first.“ bleibt und „Don't rebuild …“ auf den Endbildschirm geht: c-end antwortet einer Mutter um 2 Uhr nachts; ein Trostsatz an sie trägt dort mehr als ein Imperativ, der nach Strategie für Gruppenleitungen klingt. Nach „Okay. I can work with this.“ wäre „Don't rebuild …“ eine zweite Handlungsanweisung, „not the first“ schließt dagegen den Bogen von „Other families? Anyone?“. Der Endbildschirm spricht dagegen den Zuschauer an (Jury, Gruppenleitung), der gleich selbst sucht; dort ist der allgemeine Leitsatz richtig und doppelt nichts. Nebeneffekt: Der c-end-Clip bleibt gültig.

### Grenzen und offene Punkte

- Consti sagt nur, was im Bild steht: Tippfehler („typos allowed“ auf der Startseite), geprüfte Gruppen, Studien mit Länderfilter, Beleg und Gegenevidenz im Panel, „Related communities“, „Names hide mechanisms. One gene, 4 disease names“, die EMA- und FDA-Zeilen der Action Card. Keine Organisationsnamen, keine Markennamen, kein „cure“, keine Zahl außer „four“ (im Bild) und Marias „2 a.m.“.
- ⚠️ c-card setzt voraus, dass „At a glance“ beim Take die Zeilen „No approved medicine for Krabbe disease found in EMA or FDA records as of 3 Oct 2026“ und die MLD-Zulassungen zeigt (Frame bei 46 s des heutigen Videos: ja). Fehlen sie, Ersatz: `Action card: what transfers, what differs, what needs an expert.` (ca. 5,0 s).
- ⚠️ c-psap „Here, four.“ setzt voraus, dass `/g/PSAP` weiter „One gene, 4 disease names“ zeigt (die Zahl kommt aus den Daten).
- c-card spricht nicht mehr „what transfers, what differs, what needs an expert“; das steht im Bild unter „At a glance“. Wer die allgemeine Erklärung lieber will, nimmt den Ersatzsatz oben; dann fällt der Zulassungs-Kontrast weg.
- Vorschlag für eine zusätzliche Zeile zur Krabbe-Seite oben (nicht eingefügt): id `c-page`, Consti, Bubble „Every diagnosis gets one page: what you can do now, and its map.“, TTS `[calm, warm] Every diagnosis gets one page: what you can do now, and its map.`, Bild direkt nach dem Klick auf „Krabbe disease“, vor m-alone, ca. 6,0 s. Sie passt nur in die 46 s, wenn dafür c-studies (3,4 s) und c-gap auf „Yes.“ (ca. 0,9 s) gekürzt werden; Empfehlung: weglassen, der Graph ist im Bild, während Maria m-alone spricht.

## Fassung 1 (04.10., ca. 04:30, überholt durch Fassung 2)

Stand So 04.10.2026, ca. 04:30 (Wien). Entwurf für Hanno, nichts davon ist final (Regel 6). Gilt nur für das In-App-Intro, nicht für die drei Pflichtvideos (dort gilt [pitch/VOICE-ELEVENLABS.md](../../pitch/VOICE-ELEVENLABS.md)). Grundlage: aktuelles Drehbuch in `app/lib/story.ts`, Video `app/public/story/maria.mp4` (95 s, Bildfolge gesichtet), [docs/RESOURCES.md](../../docs/RESOURCES.md) §4, [docs/STORY.md](../../docs/STORY.md), [pitch/PITCH-60S.md](../../pitch/PITCH-60S.md).

Prüfweg: elevenlabs.io war aus dieser Umgebung gesperrt (auch per Web-Fetch). Verifiziert wurde deshalb gegen die **öffentlichen GitHub-Repos von ElevenLabs** (Python-SDK Commit `963b4a5` vom 28.09.2026, Skills-Repo Commit `81f1eaf` vom 01.10.2026) und gegen Suchergebnis-Auszüge der ElevenLabs-Doku. Was nur aus Drittquellen oder Suchauszügen stammt, trägt ⚠️. Quellen am Ende (S1 bis S8).

## 1. Stimm-Analyse

### 1.1 Die zwei Figuren

| Merkmal | Maria (Mutter, Komposit-Figur) | Consti (Constellate-Guide) |
|---|---|---|
| Geschlecht | weiblich | **Empfehlung: weiblich** (Alternativen in 1.2) |
| Alter (Klang) | Mitte 30 | Anfang 50 |
| Tonlage, Höhe | mittel bis leicht hoch, sprechend, nicht gesungen; die Höhe wackelt an Satzenden | tiefes Alt, deutlich unter Maria (hörbarer Registerabstand, damit zwei Frauenstimmen nie verwechselt werden) |
| Klangfarbe | behaucht, leicht heiser (geweint, nicht geschlafen), wenig Glanz | warm, rund, dunkel, „Holz statt Glas“; kein Lächeln in der Stimme bis zur letzten Zeile |
| Akzent | General American, unauffällig | neutral Mid-Atlantic oder weich britisch; der Akzentunterschied trennt die Figuren zusätzlich |
| Tempo | langsam und ungleichmäßig, stockt vor dem schweren Wort („said… Krabbe disease“) | ruhig, gleichmäßig, eher langsam; nie schneller als Maria, nie Werbe-Rhythmus |
| Atem und Pausen | hörbarer Atem vor dem ersten Wort und ein Ausatmen nach „Krabbe disease“; Ellipsen statt Punkte an den Bruchstellen | wenig Atem, aber Luft vor dem wichtigsten Wort; kurze Sätze, Punkt statt Komma |
| Mikrofon-Nähe | sehr nah, fast geflüstert, „Küchentisch um zwei Uhr, damit niemand aufwacht“ | nah, aber in normaler Sprechlautstärke; Ruhe statt Intimität |
| Was sie nie sein darf | Schluchzen, Schauspielerei, Opferton | Werbestimme, Nachrichtensprecherin, Roboter, zuckersüß, Trailer-Ton |

### 1.2 Bogen über die 60 Sekunden

| Phase (Zeilen) | Maria | Consti |
|---|---|---|
| Nacht (m-start, c-hello) | erschöpft, fast flüsternd, taub | ruhig, warm, stellt sich vor und verspricht nur eins: nicht raten |
| Einsamkeit (m-alone, c-gap, c-studies) | Stimme kurz vor dem Brechen, eine echte Frage | ehrlich und sanft beim Nein („No checked patient group yet“), eine Spur wärmer beim „But“ |
| Misstrauen (m-trust, c-evidence) | leise, vorsichtig, nicht aggressiv | sachlich-ruhig, fast handwerklich: Linie anklicken, Quelle sehen |
| Entdeckung (c-related, c-psap, c-card) | schweigt | leise Neugier bei MLD, Gewicht und Langsamkeit bei „One gene. Four disease names.“, klar bei der Action Card |
| Hoffnung (m-end, c-end) | erstes Licht, mehr zu sich selbst als zu Consti, keine Freude | langsamste Zeile des Videos, leiser als zuvor, erst hier ein Hauch Lächeln |

### 1.3 Warum das Vertrauen und Gänsehaut erzeugt

- **Kontrast statt Melodram.** Maria trägt das Gefühl, Consti trägt die Ruhe. Rührend wird es, wenn die ruhige Stimme *nicht* mitweint; zwei emotionale Stimmen heben sich gegenseitig auf.
- **Nähe zum Mikrofon.** Ein behauchtes, nahes Flüstern wirkt wie eine Stimme im eigenen Raum. Die erste Zeile entscheidet, ob man bleibt.
- **Stille als Text.** Die Pausen vor „Krabbe disease“, vor „like us?“ und vor dem Schlusssatz sind die eigentlichen Gänsehaut-Momente. Deshalb kürzt dieses Skript Wörter, nicht Pausen.
- **Wenige, kurze Sätze bei Consti.** Wer um zwei Uhr nachts viel redet, verkauft etwas. „I won't guess.“ und „Here's what I searched.“ sind Zurückhaltung als Vertrauensbeweis.
- **Echo-Struktur.** Consti verspricht „I'll show you how we know“, Maria fragt später „How do I know this is true?“, Consti zeigt die Quelle. Das Ohr merkt, dass das Versprechen gehalten wird.
- **Keine Musik als Gefühlshilfe.** Das Gefühl muss aus Stimme und Stille kommen; Musik würde in einem Medizinkontext manipulativ wirken (Option in §5).

### 1.4 Consti: weiblich, männlich oder neutral?

| Option | Für | Gegen | Urteil |
|---|---|---|---|
| **Weiblich, tiefes Alt, Anfang 50** | Archetyp „erfahrene Nachtschwester“, die schon viele Familien durch diese Nacht begleitet hat; kein Gefälle „Mann erklärt Mutter die Welt“; passt zu einer Zielgruppe, in der meist Mütter nachts suchen ⚠️ (Annahme, nicht belegt) | zwei Frauenstimmen: Trennung nur über Register, Alter, Akzent und Tempo | **Empfehlung** |
| Männlich, weicher Bariton, 50er | maximaler Kontrast; der Schlusssatz bekommt Gewicht | Risiko paternalistisch oder „Arzt-Ton“; Bariton kippt leicht in Trailer-Stimme | **Alternative**, falls die Trennung der zwei Frauenstimmen im Test nicht klappt |
| Bewusst neutral | passt zu einer nicht-menschlichen Guide-Figur | neutrale Bibliotheksstimmen klingen oft flach oder nach Social-Media-Ton; genau der „Roboter“-Eindruck, den wir vermeiden wollen | nein |

## 2. Konkrete Stimmwahl

Vorgehen: zuerst die Bibliotheks-Kandidaten mit den Testsätzen aus 2.3 hören (10 Minuten), erst wenn keiner trägt, Voice Design. IDs immer mit `npm run story:voice -- --list` im eigenen Account gegenprüfen.

### 2.1 Kandidaten

| Figur | Rang | Stimme | Voice-ID | Beschreibung laut Quelle | Status |
|---|---|---|---|---|---|
| Maria | 1 | **Voice Design** (Prompt 2.2) | entsteht beim Speichern | maßgeschneidert „erschöpfte Mutter, nah am Mikro“; keine Default-Stimme ist dafür gebaut | Empfehlung |
| Maria | 2 | Sarah (Default) | `EXAVITQu4vr4xnSDxMaL` | „female, soft“ (S1) | ID verifiziert (S1) |
| Maria | 3 | Jessica (Default) | `cgSgspJ2msm6clMCkdW9` | „female, young, American, expressive, conversational“ (S7), Drittquelle: „Playful, Bright, Warm“ | ⚠️ ID nur aus Drittquelle (S8); evtl. zu hell |
| Maria | Reserve | Katie – Soft Whispering ASMR (Community, Voice Library) | `jdrqQ2ZMWENd1cuRByWG` | weiblich, flüsternd | ⚠️ Drittquelle; Gefahr ASMR-Ton statt Erschöpfung |
| Consti | 1 | **Lily (Default)** | `pFZP5JQG7iQjIQuC4Bku` | „female, middle-aged, British, warm, narration“ (S7), Drittquelle: „Velvety Actress“ | Empfehlung; ⚠️ ID nur aus Drittquelle (S8) |
| Consti | 2 | Matilda (Default) | `XrExE9yKIg1WjnnlVkGX` | „female, middle-aged, American, friendly, narration“ (S7) | ⚠️ ID nur aus Drittquelle (S8) |
| Consti | 3 | Voice Design (Prompt 2.2) | entsteht beim Speichern | tiefes Alt, Nachtschwester | wenn Lily zu „Schauspielerin“ klingt |
| Consti männlich | Alt. | George (Default) | `JBFqnCBsd6RMkjVDRZzb` | „male, narrative“ (S1) | ID verifiziert (S1) |
| Consti neutral | nur zum Vergleich | River (Default) | `SAz9YHcvj6GT2YYXdXww` | „non-binary, middle-aged, American, confident, social media“ (S7) | ⚠️ Drittquelle (S8) |

### 2.2 Voice-Design-Prompts (reproduzierbar per API)

Endpunkt (S3, SDK `text_to_voice/client.py`):

| Schritt | Aufruf | Pflicht | Wichtige optionale Parameter |
|---|---|---|---|
| 1. Vorschauen erzeugen | `POST https://api.elevenlabs.io/v1/text-to-voice/design` | `voice_description` | `model_id` (`eleven_ttv_v3` oder `eleven_multilingual_ttv_v2`), `text` (100 bis 1.000 Zeichen), `auto_generate_text`, `seed` (gleicher Seed plus gleiche Eingaben gleich Stimme), `guidance_scale` (hoch kann künstlich klingen; lange Prompts mit niedrigem Wert), `loudness` (−1 bis 1, 0 ≈ −24 LUFS), `quality`, `should_enhance` (Standard false), `output_format` |
| 2. Gewählte Vorschau speichern | `POST https://api.elevenlabs.io/v1/text-to-voice` | `voice_name`, `voice_description`, `generated_voice_id` (aus Schritt 1) | `labels` |

Antwort von Schritt 1: Liste von Vorschauen, je `generated_voice_id` plus MP3 als Base64. Ein Voice-Design-Modell „v4“ gibt es im SDK vom 28.09. nicht, nur `eleven_ttv_v3` und `eleven_multilingual_ttv_v2`. ⚠️ Dass eine mit `eleven_ttv_v3` entworfene Stimme mit `eleven_v4` sprechen kann, ist nicht belegt; erwartbar, weil gespeicherte Stimmen normale Voice-IDs sind, aber im ersten Take prüfen.

Empfohlene Werte: `model_id: "eleven_ttv_v3"`, `seed: 404`, `guidance_scale` niedrig lassen (Standard), `should_enhance: false` (sonst schreibt die KI den Prompt um und es ist nicht mehr reproduzierbar), `loudness: 0`.

**Maria, `voice_description`:**

```
A woman in her mid-thirties, American English with a soft, unremarkable General American accent. Natural mid-to-high pitch, slightly breathy and a little hoarse, as if she has been crying and has not slept. She speaks very quietly and very close to the microphone, like someone at a kitchen table at two in the morning who does not want to wake anyone. Slow, hesitant pacing with small audible breaths between phrases; the voice wavers at the ends of sentences but never sobs and never sounds theatrical. Raw, intimate, real, not an actress performance. Dry, clean studio recording, no reverb, no background noise.
```

**Maria, `text` für die Vorschau (157 Zeichen):**

```
Two a.m. The doctor said... Krabbe disease. I can't even spell it. Is there anyone else... like us? How do I know this is true? So we don't have to start from zero.
```

**Consti, `voice_description`:**

```
A woman in her early fifties with a warm, low alto voice and a calm, grounded presence, like an experienced night-shift nurse who has sat with many families on the worst night of their lives. Neutral mid-Atlantic English, clear but soft diction. Slow, unhurried, even pacing with short sentences and gentle pauses; soft but never whispery, reassuring but never sugary. Not a narrator, not an announcer, not a sales voice, no upbeat inflection, nothing robotic. Close, warm microphone, dry studio recording, no reverb, no background noise.
```

**Consti, `text` für die Vorschau (165 Zeichen):**

```
Maria, I'm Consti. I won't guess. I'll show you how we know. No checked patient group yet. Here's what I searched. One gene. Four disease names. Your family is not the first.
```

**Consti männlich (Alternative), `voice_description`:**

```
A man in his fifties with a soft, warm baritone, calm and kind, like a family doctor speaking quietly at a bedside at night. Neutral mid-Atlantic English. Slow, even pacing, short sentences, gentle pauses. Never deep trailer voice, never authoritative, never salesy, nothing robotic. Close, warm microphone, dry studio recording, no reverb.
```

### 2.3 Auswahltest (gleiche Sätze für alle Kandidaten)

Maria: `[exhausted, close to the mic, barely above a whisper] Two a.m. The doctor said… Krabbe disease. [exhales] I can't even spell it.` Consti: `[softly, slowly, warm, close to the mic] Your family is not the first.` Kriterium: Wer beim Consti-Satz nach Werbung klingt, fliegt raus; wer bei Maria nach Hörbuch klingt, fliegt raus. Dann einmal Maria und Consti direkt hintereinander hören: Sind sie blind unterscheidbar?

## 3. Finales Voice-Skript

Konventionen: `Bubble-Text` geht nach `text` in `app/lib/story.ts` (Sprechblase und Transkript), `TTS-Text` nach `tts`. Ein Request je Zeile, deshalb trägt jede Zeile ihr eigenes Audio-Tag (v4 trägt ein Tag über die Zeile weiter, S5). Abkürzungen buchstabiert, keine Zahlen außer „four“, das als Überschrift „One gene, 4 disease names“ auf `/g/PSAP` im Bild steht (⚠️ vor dem Take prüfen, ob der Export noch 4 zeigt; die Zahl wird aus den Daten berechnet).

| id | wer | Bubble-Text | TTS-Text | Bild in dem Moment | Dauer (s) |
|---|---|---|---|---|---|
| m-start | Maria | 2 a.m. The doctor said “Krabbe disease”. I can't even spell it. | `[exhausted, close to the mic, barely above a whisper] Two a.m. The doctor said… Krabbe disease. [exhales] I can't even spell it.` | Startseite, Suchfeld | 7,2 |
| c-hello | Consti | Maria, I'm Consti. I won't guess. I'll show you how we know. | `[calm, warm, unhurried] Maria, I'm Consti. I won't guess. I'll show you how we know.` | Cursor zum Suchfeld, Tippen „krabe“, Treffer „Krabbe disease“ (Tipp-Moment bleibt still) | 5,2 |
| m-alone | Maria | Is there anyone else like us? | `[softly, voice close to breaking] Is there anyone else… like us?` | Krabbe-Seite mit Graph | 3,3 |
| c-gap | Consti | You're not alone. These groups are there for Krabbe, each one checked against its own website. | `[warmly, gently] You're not alone. These groups are there for Krabbe… each one checked against its own website.` | „Patient organisations 4“, jede Gruppe gegen ihre Website geprüft (Stand Branch `maria`, 04.10.) | 5,0 |
| c-studies | Consti | But these studies are looking for participants. | `[a little warmer] But these studies are looking for participants.` | „Studies looking for participants with Krabbe disease“ | 3,6 |
| m-trust | Maria | How do I know this is true? | `[quietly, wary] How do I know this is true?` | Graph, Cursor auf einer Linie | 2,5 |
| c-evidence | Consti | Click any line: its source… and what speaks against it. | `[calm, steady] Click any line: its source… and what speaks against it.` | Evidenz-Panel: Quelle, Datum, Konfidenz, „Counter-evidence“ | 4,3 |
| c-related | Consti | MLD shares a gene with Krabbe: PSAP. | `[softly, curious] M-L-D shares a gene with Krabbe: P-S-A-P.` | „Related“: metachromatic leukodystrophy, „shares PSAP“ | 4,1 |
| c-psap | Consti | One gene. Four disease names. | `[slowly, with weight] One gene. Four disease names.` | `/g/PSAP` „One gene, 4 disease names“ | 2,2 |
| c-card | Consti | Your action card: what may transfer, what differs, what needs an expert. | `[calm, clear] Your action card: what may transfer, what differs, what needs an expert.` | Action Card: What transfers / What differs / Needs expert review | 5,3 |
| m-end | Maria | So we don't have to start from zero. | `[quietly, almost to herself, a first trace of hope] So we don't have to start from zero.` | Action Card, Cursor steht still | 3,2 |
| c-end | Consti | Your family is not the first. | `[softly, slowly, warm, close to the mic] Your family is not the first.` | nach 1,2 s Stille; Schlusskarte blendet danach ein | 2,5 |
| | | | | **Summe Sprechzeit** | **47,0** |

Rechnung Gesamtvideo: 47,0 s Sprechzeit + 6,0 s Titel- und Schlusskarte + 12 × 0,4 s Luft (4,8 s) + 1,2 s Stille vor c-end = **59,0 s**. Die Dauern sind Schätzungen (Silben je Sekunde: Maria 3,0, Consti 3,5, plus 0,45 s je Ellipse, 0,3 s je Satzende, 0,6 s für `[exhales]`); die echten MP3-Längen ersetzen sie nach dem ersten Take.

Änderungen gegenüber dem Input-Drehbuch:

| id | Änderung | Grund |
|---|---|---|
| c-typo | **gestrichen** | Das Bild (Tippfehler, Treffer „Krabbe disease“) erzählt es allein; die Stille beim Tippen wirkt stärker, und ein Witz direkt nach „I can't even spell it“ kann flapsig klingen. Spart 3,2 s. Rückweg: `[gently] A typo is fine. That's Krabbe disease.` (ca. 3,0 s), dann c-psap streichen |
| c-hello | „and where it comes from“ wird „how we know“ | kürzer, und es kündigt die Antwort auf m-trust an (Echo) |
| c-gap | „instead of making one up“ gestrichen | „I won't guess“ hat das Versprechen schon gegeben; spart 1,8 s |
| c-studies | „now or soon“ gestrichen | die Überschrift im Bild sagt „looking for participants“; Status je Studie steht als Badge |
| c-evidence | Aufzählung „source, date, confidence“ gekürzt auf „its source… and what speaks against it“ | Datum und Konfidenz stehen im Panel; Formulierung wie im Pitch |
| c-related / c-psap | wieder zwei Zeilen (c-psap ist die bestehende ID aus `story.ts`) | das Bild wechselt auf `/g/PSAP`; der Satz „One gene. Four disease names.“ muss auf diesem Bild fallen |
| c-card | „from MLD“ gestrichen | steht in der Kartenüberschrift „What Krabbe disease can learn from metachromatic leukodystrophy“ |

Streichreihenfolge, falls die echten MP3s zu lang sind: 1. m-start Ellipse nach „said“ (−0,5 s) · 2. c-card „Your“ (−0,3 s) · 3. c-hello „Maria,“ (−0,9 s) · 4. c-psap ganz (−2,6 s, die Überschrift im Bild trägt es). **Nie** streichen: die Pause vor „like us?“, `[exhales]`, die Stille vor c-end.

Aussprache (vor dem Take einzeln anhören):

| Wort | im TTS-Text | Fallback |
|---|---|---|
| Krabbe | `Krabbe` | `KRAH-bay` oder IPA `"/ˈkrɑːbeɪ/"` (laut RESOURCES §4.1 versteht v4 IPA in Schrägstrichen) |
| MLD, PSAP | `M-L-D`, `P-S-A-P` | – |
| Consti | `Consti` | `Kon-stee` |
| a.m. | `Two a.m.` | `Two in the morning` (dann auch die Bubble anpassen) |

Für die Umsetzung: `app/story/maria.story.ts` ruft noch `say()` für `c-typo`, `c-map` und `m-what` auf. Wer diese IDs aus `story.ts` entfernt, muss die Aufrufe durch stille Wartezeiten ersetzen, sonst wirft `storyLine()`. Die Bubble-Dauer sollte dann aus der MP3-Länge plus 0,4 s kommen statt aus `readMs()`. Das heutige Video ist 95 s lang; für ≤ 60 s müssen auch die festen Wartezeiten (Titelkarte 3,6 s, Scrolls 1,1 s) schrumpfen ⚠️ (nicht nachgemessen).

## 4. Modell und Voice-Settings

| Punkt | Maria | Consti | Quelle |
|---|---|---|---|
| Modell-ID | `eleven_v4` | `eleven_v4` | S1, RESOURCES §4.1 |
| Fallback | `eleven_multilingual_v2` (Tags werden dann entfernt, wie in `story/voice.ts`) | dto. | RESOURCES §4.1 |
| stability | **0,40** Start; 0,30 wenn zu flach, 0,50 wenn sprunghaft | **0,55** Start; 0,65 wenn die Betonung schwankt | Bereich 0 bis 1, Standard 0,5, niedriger = mehr Emotion (S2); Startwerte wie `story/voices.json` |
| similarity_boost | 0,75 | 0,75 (0,80, falls eine Bibliotheksstimme abdriftet) | Standard 0,75 (S2) |
| style | nicht verfügbar in v4 | nicht verfügbar in v4 | S1, S2 |
| speed | nicht verfügbar in v4; Tempo über Text, Tags (`[slowly]`) und höchstens ±5 % im Schnitt | dto. | S1, S2, RESOURCES §4.1 |
| use_speaker_boost | nicht setzen (Standard true) | nicht setzen | ⚠️ für v4 weder als unterstützt noch als ausgeschlossen dokumentiert (S2) |
| seed | fester Wert je Zeile, z. B. `404`, damit ein Re-Take vergleichbar bleibt | dto. | „best effort … Determinism is not guaranteed“ (S3) |
| output_format | `mp3_44100_192`, wenn Creator aktiv; sonst `mp3_44100_128` (heute in `voices.json`) | dto. | 192 kbps ab Creator (S1, S3) |

Endpunkte:

| Weg | Aufruf | Einstellungen | Wann |
|---|---|---|---|
| **A, empfohlen** | `POST /v1/text-to-speech/{voice_id}` mit `model_id: "eleven_v4"`, `voice_settings`, optional `previous_text`/`next_text` (Nachbarzeile, für Kontinuität) | je Figur eigene Settings | eine MP3 je Zeile, passt zu `story/voice.ts` und zum Recorder |
| B, Qualitätstest | `POST /v1/text-to-dialogue/with-timestamps` mit `inputs: [{text, voice_id}, …]` in Reihenfolge, `model_id: "eleven_v4"`; Antwort enthält `voice_segments` zum Schneiden | `settings` gilt für **alle** Stimmen gemeinsam: nur `stability` und `similarity` (S3) | wenn die Einzelzeilen nicht wie ein Gespräch klingen; v4 spielt laut Hersteller aus dem Kontext (S6). Gesamtlänge bei uns ca. 880 Zeichen, Grenze ca. 2.000 Zeichen je Request (S3) |

⚠️ Ob `eleven_v4` am TTS-Endpunkt läuft oder nur über Text-to-Dialogue: Die Doku war widersprüchlich (RESOURCES §4.1); das Skills-Repo vom 01.10. nennt `eleven_v4` ohne Einschränkung für „expressive content and dialogue“ (S1). `story/voice.ts` probiert beide Wege, das reicht.

Hinweis zum Dialogue-Fallback in `story/voice.ts`: Er schickt nur `stability`; `similarity` wird dort laut SDK ebenfalls angenommen („Not supported by every model“, S3).

Credits: 878 Zeichen TTS-Text, mit drei Takes ca. 2.700 Zeichen; v4-Faktor je Zeichen weiter unbekannt ⚠️ (RESOURCES §4.2).

Audio-Tags: Belegt sind Emotion und Vortrag (`[sad]`, `[calm]`, `[whispers]`, `[softly]`), Reaktionen (`[sighs]`, `[exhales]`), Pausen (`[pause]`, `[long pause]`), Tempo (`[slowly]`, `[hesitates]`) und frei formulierte Regie in Klammern wie `[low, steady voice, restrained urgency]`, auch kombiniert mit Komma (S4, S5) ⚠️ (nur aus Suchauszügen der ElevenLabs-Seiten, nicht im Volltext gelesen). Unsere Tags sind freie Regie nach diesem Muster; ob v4 `close to the mic` als Nähe umsetzt, ist ungeprüft ⚠️. Keine Tags, die nach Geräusch klingen (RESOURCES §4.1).

## 5. Mischung und Schnitt (Optionen, Hanno entscheidet)

| Punkt | Vorschlag | Begründung |
|---|---|---|
| Lautstärke | Consti als Anker, Maria 1 bis 2 dB leiser, aber nie unter die Verständlichkeit; Gesamt ca. −16 LUFS integriert, Spitzen ≤ −1 dBTP ⚠️ (übliche Web-Faustregel, nicht nachgeprüft) | Marias Nähe kommt aus dem Klang (Atem, Flüstern), nicht aus Lautstärke; ein lautes Flüstern zerstört die Intimität |
| Raumklang | Option A (Empfehlung): sehr leiser Raum-Ton unter allem (ruhiges Zimmer nachts, ca. −50 dBFS ⚠️), selbst 60 s mit dem Handy aufgenommen | ohne ihn klingen die Lücken zwischen TTS-Schnipseln nach digitalem Loch, mit ihm nach einem Raum |
| Musik | Option B: keine. Option C: ein einzelner, sehr leiser tiefer Klavierton ab c-studies | B empfohlen; Musik wirkt im Medizinkontext schnell manipulativ und verwischt die Stille. ElevenLabs-SFX und -Musik sind laut RESOURCES §4.5 für die Pflichtvideos ausgeschlossen, für das In-App-Intro nicht geregelt |
| Ende | nach m-end 1,2 s nichts: Cursor steht, Raum-Ton fällt auf null; dann c-end, langsamer und leiser als alles davor; danach 0,8 s Stille, erst dann blendet die Schlusskarte „Your family is not the first.“ stumm ein und steht 2,5 s | Stille vor dem Satz macht ihn groß; die Karte wiederholt ihn als Schrift, nicht als zweite Stimme |
| Anfang | Titelkarte stumm; erster Ton ist Marias Einatmen | `StoryPlayer` startet `autoPlay muted`; die Titelkarte überbrückt die Zeit, bis jemand den Ton einschaltet |
| Offenlegung | Zeile im Transkript oder unter dem Player: „Voices generated with ElevenLabs (Eleven v4). Maria is a composite character.“ | wie RESOURCES §4.3 und VOICE-ELEVENLABS §7 |

## Quellen

| Nr. | Quelle | Was belegt sie |
|---|---|---|
| S1 | [github.com/elevenlabs/skills, `text-to-speech/SKILL.md`](https://github.com/elevenlabs/skills/blob/main/text-to-speech/SKILL.md), Commit `81f1eaf`, 01.10.2026 | Modell-IDs inkl. `eleven_v4`; Voice-IDs Sarah, George, Daniel, Charlotte; Style und Speed in v4 nicht verfügbar; `mp3_44100_192` ab Creator |
| S2 | [github.com/elevenlabs/skills, `text-to-speech/references/voice-settings.md`](https://github.com/elevenlabs/skills/blob/main/text-to-speech/references/voice-settings.md), dto. | Bereiche und Standardwerte von stability, similarity_boost, style, speed, use_speaker_boost |
| S3 | [github.com/elevenlabs/elevenlabs-python](https://github.com/elevenlabs/elevenlabs-python), Commit `963b4a5`, 28.09.2026: `text_to_voice/client.py`, `text_to_dialogue/client.py`, `types/to_dialogue_settings_response_model.py`, `text_to_speech/client.py` | Voice-Design-Endpunkte und Parameter; Text-to-Dialogue (inkl. `with-timestamps`, `voice_segments`, 2.000 Zeichen); `seed`, `previous_text`/`next_text` |
| S4 | [ElevenLabs Blog: Audio Tags list for Eleven v4](https://elevenlabs.io/blog/elevenlabs-audio-tags-list) ⚠️ nur Suchauszug | Tag-Kategorien und Beispiele |
| S5 | [ElevenLabs Blog: Emotional text to speech with Eleven v4](https://elevenlabs.io/blog/emotional-text-to-speech-with-eleven-v4) ⚠️ nur Suchauszug | Tags wirken über die Zeile weiter, kombinierbar mit Komma, freie Regie möglich |
| S6 | [ElevenLabs Doku: Eleven v4](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4) und [Blog: Eleven v4](https://elevenlabs.io/blog/eleven-v4) ⚠️ nur Suchauszug | nur Stability und Similarity; v4 liest Kontext und Sprecher; Start 50/75 |
| S7 | [ElevenLabs Doku: Default Voices](https://elevenlabs.io/docs/voices/default-voices) ⚠️ nur Suchauszug | Geschlecht, Alter, Akzent, Einsatz von Lily, Matilda, Jessica, River |
| S8 | json2video.com Stimmenseiten (z. B. [River](https://json2video.com/ai-voices/elevenlabs/voices/SAz9YHcvj6GT2YYXdXww/), [Jessica](https://json2video.com/ai-voices/elevenlabs/voices/cgSgspJ2msm6clMCkdW9/), [Lily/Matilda/Alice](https://json2video.com/ai-voices/elevenlabs/voices/XrExE9yKIg1WjnnlVkGX/)) ⚠️ Drittanbieter | Voice-IDs, die nicht in S1 stehen |

## 6. Ablauf mit Befehlen (aus `app/`)

| Schritt | Befehl | Braucht |
|---|---|---|
| Key prüfen, Stimmen des Accounts sehen | `npm run story:voice -- --list` | `ELEVENLABS_API_KEY` (Umgebung oder `.env.local`), Berechtigung Voices: read |
| Optional: Stimme aus dem Design-Prompt | `npm run story:voice -- --design maria`, anhören in `story/voice/design/`, dann `npm run story:voice -- --save maria <generated_voice_id>` | Voices: write |
| Alle Zeilen erzeugen | `npm run story:voice` (fehlende) oder `-- --force` (alle) oder `-- c-gap m-end` (einzelne) | Text to Speech |
| Aufnehmen und mischen | `E2E_BASE_URL=https://<live-domain> npm run story:record` (ohne Variable startet die lokale App auf Port 3100) | ffmpeg; Video bleibt unter 59,5 s, notfalls bis +5 % Tempo |
| Abschalten des Stumm-Modus | in `app/lib/story.ts` `STORY_HAS_VOICE = true`, dann erscheint auf `/intro` „Play with sound“ | – |

Stimmen-IDs und Settings stehen in `app/story/voices.json`, die Texte in `app/lib/story.ts` (`text` für Blase und Transkript, `tts` für ElevenLabs). Die MP3s in `app/story/voice/` werden mit committet, weil v4 sie nicht identisch neu erzeugt.
