# Motion-Prompts · kurze Clips (5 bis 15 s)

Stand So 04.10.2026, 01:30. Für das Werkzeug „Motion" (Claude-Connector), das aus einem Brief ein Video erzeugt. Nichts hiervon ist bisher ausgeführt oder gekauft; Credit-Preise sind nicht geprüft ([docs/RESOURCES.md](../docs/RESOURCES.md) §9). Ausführung: Hanno, **nach der Abgabe** (So nach 15:00) oder in der Woche vor dem 10.10.

## Einordnung seit der 60-s-Vorgabe

Die drei Pflichtvideos (Team Introduction, Product Demo, Technical Walkthrough) dürfen je höchstens 60 Sekunden lang sein ([VIDEO-STRATEGY.md](VIDEO-STRATEGY.md)); ihre Shotlists sind auf 0:58 ausgereizt. Für einen Motion-Clip bleibt dort kein Platz: Ein 8-s-Bumper würde ein Siebtel der Demo kosten. Deshalb gilt:

| Prompt | Länge | In den 60-s-Videos | Einsatz |
|---|---|---|---|
| 1 Intro-Bumper | 8 s | **nein** | nur Pitch 10.10., Teaser, README-GIF |
| 2 Übergang „Name → Mechanismus" | 10 s | **nein** | nur Pitch 10.10., Teaser |
| 3 „Jede Kante hat eine Quelle" | 8 s | **nein** | nur Pitch 10.10., Teaser |
| 4 „Honest Gap" | 8 s | **nein** | nur Pitch 10.10., Teaser |
| 5 Outro mit URL | 6 s | **nein** | nur Pitch 10.10., Teaser, README |
| 6 Pitch-Opener komplett | 15 s | **nein** | nur Live-Pitch 10.10. |

Einzige Ausnahme, die in 60 s passt: eine **Titelkarte von höchstens 2 s** (Klartext „Constellate · Vienna Hub · Hack-Nation C5") am Anfang des Team-Videos. Sie wird im Schnittprogramm als Standbild gesetzt, nicht mit Motion erzeugt; Anfang und Ende der Demo und des Tech-Videos sind die echte App (`/`, `/about`, `/methods`) mit Browserleiste. Ein 2-s-Motion-Standbild wäre nur dann eine Option, wenn Hanno es ausdrücklich will und die Gesamtlänge unter 60 s bleibt.

## Harte Regel (RESOURCES Regel 9 und Video-Pipeline)

Motion-Clips **ersetzen keines der drei Pflichtvideos** (Team, Demo, Tech) und kommen in keinem von ihnen vor. Die Jury muss die echte App mit sichtbarer Live-URL sehen; Motion erzeugt keine Aufnahme unserer Seite. Motion recherchiert laut Beschreibung selbst und kann Aussagen einbauen, die wir nicht belegt haben. Deshalb gilt für jeden Prompt:

- Keine medizinischen Aussagen, keine Krankheitsnamen, keine Gennamen, keine Zahlen, keine Jahreszahlen, keine Organisations-Logos.
- Erlaubter Text steht **wörtlich** im Prompt. Alles andere ist verboten („no other text, no voice-over, no numbers").
- Keine Kinder, keine Krankenhäuser, kein Stock-Leid, keine Gesichter.
- Jeder Clip wird vor Verwendung gegen diese Liste geprüft. Fällt eine Zahl oder ein Fachbegriff auf, der nicht im Prompt stand: verwerfen.
- Für die Pflichtvideos gilt außerdem VIDEOS.md: keine Musik, keine Effekte, höchstens 60 s. Also auch keine Motion-Bumper vor oder hinter Team, Demo oder Tech.

**Wo Motion-Clips erlaubt sind:** Pitch-Opener und Pitch-Übergänge am 10.10. (falls Top 2), Discord- und LinkedIn-Teaser nach der Abgabe, README-Kopf (als GIF oder Standbild). Jeder Prompt unten trägt sein Feld „Einsatz erlaubt".

## Gemeinsamer Stil-Block (in jeden Prompt kopieren)

```
Style: "low ink, high signal". Deep navy background (near #0B1020), fine white and pale-gold points of light,
thin hairlines between points, generous whitespace, one accent colour (warm amber) used only for meaning.
Typography: a clean humanist sans-serif, large, left-aligned or centred, never more than two lines on screen.
Motion: slow, continuous, no cuts faster than 2 seconds, no camera shake, no lens flares, no particles exploding.
Sound: none (silent clip) unless stated otherwise.
Aspect ratio: 16:9, 1920x1080. No logo other than the Constellate word mark as plain text.
Forbidden: any disease name, gene name, number, date, percentage, chart, hospital, child, face, stock footage,
medical imagery, other text than the lines given verbatim below, voice-over.
```

## Prompt 1 · Intro-Bumper „Sternbild aus Krankheiten" (8 s)

Einsatz erlaubt: Pitch-Opener 10.10. · Discord-/LinkedIn-Teaser · README-GIF. **Nicht** in den Pflichtvideos.

```
Goal: an 8-second silent opening bumper for a live pitch about a rare-disease knowledge map called Constellate.
Source material: the idea only. Thousands of isolated points of light (one per disease) scattered on a dark field.
Over 8 seconds, thin hairlines appear between some of them, and small groups of points reveal themselves as
constellations. Nothing is labelled. The last second shows the single word mark "Constellate" fading in, centred.
Audience: a hackathon jury and an audience of researchers and patient-group leaders.
Tone: calm, precise, hopeful without sentimentality. No drama.
Key points (the only text allowed, verbatim): "Constellate".
[Shared style block]
Duration: 8 seconds. Aspect ratio: 16:9.
```

## Prompt 2 · Übergang „Name → Mechanismus" (10 s)

Einsatz erlaubt: Pitch-Übergang 10.10. vor der PSAP-Demo · Teaser. **Nicht** in den Pflichtvideos. Der Clip ist bewusst abstrakt: keine echten Namen, damit keine medizinische Aussage entsteht; die echte Aussage macht danach die App-Seite `/g/PSAP`.

```
Goal: a 10-second silent transition that visualises the idea "names hide mechanisms" without naming anything.
Source material: three separate, closed doors or three separate labelled cards, each label shown only as a
blurred, unreadable placeholder bar (no real words). The three cards sit far apart. The camera slowly pulls back;
behind the three cards a single thin thread is revealed that connects all three. The cards fade, the thread stays.
Then one line of text appears: "Names hide mechanisms." Hold for 2 seconds, fade to the navy background.
Audience: hackathon jury, researchers, patient-group leaders.
Tone: quiet revelation. The viewer should feel "oh, they were the same room all along".
Key points (the only text allowed, verbatim): "Names hide mechanisms."
The placeholder labels must be unreadable bars, never letters. No disease or gene names anywhere.
[Shared style block]
Duration: 10 seconds. Aspect ratio: 16:9.
```

## Prompt 3 · Motiv „Jede Kante hat eine Quelle" (8 s)

Einsatz erlaubt: Pitch-Übergang 10.10. vor dem Edge-Panel · Teaser. **Nicht** in den Pflichtvideos.

```
Goal: an 8-second silent clip showing that every connection on the map carries its evidence.
Source material: two points of light on the navy field. A thin hairline draws itself between them over 2 seconds.
Then a small, plain tag slides in under the line, drawn as an empty rounded rectangle with a short unreadable
placeholder bar (no real words, no numbers), representing "source, date, confidence". A second, thinner tag in
muted red appears below it, representing counter-evidence; it may be empty. Then the text appears:
"Every edge has a source. When there is none, we say so." Hold 3 seconds, fade.
Audience: hackathon jury with a focus on evidence integrity.
Tone: sober, trustworthy, almost documentary.
Key points (the only text allowed, verbatim): "Every edge has a source. When there is none, we say so."
Tags contain placeholder bars only. No readable words or digits inside the tags.
[Shared style block]
Duration: 8 seconds. Aspect ratio: 16:9.
```

## Prompt 4 · „Honest Gap" (8 s)

Einsatz erlaubt: Pitch-Übergang 10.10. vor dem Honest-Gap-Screen · Teaser. **Nicht** in den Pflichtvideos.

```
Goal: an 8-second silent clip about an honest gap on a map: an area where nothing is known yet, shown as a
finding rather than an error.
Source material: a field of points of light with hairlines between them. The camera drifts to one region where
there are no lines and only one faint point. Instead of hiding it, a thin dashed outline gently draws itself around
the empty region, like a surveyor marking unexplored ground. Text appears: "Where there is no trail, we say so."
Hold 3 seconds, fade.
Audience: hackathon jury, patient-group leaders.
Tone: respectful, calm, no sadness, no alarm colours. The dashed outline is pale amber, nothing red.
Key points (the only text allowed, verbatim): "Where there is no trail, we say so."
[Shared style block]
Duration: 8 seconds. Aspect ratio: 16:9.
```

## Prompt 5 · Outro mit URL (6 s)

Einsatz erlaubt: Pitch-Ende 10.10. · Teaser-Ende · README. **Nicht** in den Pflichtvideos (dort ist das Schlussbild die echte `/about`- oder `/methods`-Seite mit Browserleiste, und die 60 s sind voll).

```
Goal: a 6-second silent closing card for a pitch about Constellate.
Source material: the constellation from the opening bumper, now fully connected, slowly settling into stillness.
Two lines of text fade in, centred, one after the other:
line 1: "Don't rebuild what a neighbouring disease already built."
line 2: "<LIVE_URL>"
Hold both lines for 3 seconds. No further motion.
Audience: hackathon jury and public audience.
Tone: quiet confidence.
Key points (the only text allowed, verbatim): the two lines above; replace <LIVE_URL> with the production URL
before generating, exactly as it appears in the browser bar.
[Shared style block]
Duration: 6 seconds. Aspect ratio: 16:9.
```

## Prompt 6 · Pitch-Opener 10.10., komplett (15 s)

Einsatz erlaubt: **nur** als Opener des Live-Pitchs am 10.10. (falls Top 2). Kombination aus Prompt 1 und dem Einstiegssatz. Nicht als Teaser verwenden, weil der Satz dort ohne den anschließenden Pitch im Raum hängen bliebe.

```
Goal: a 15-second opening for a 3-minute live pitch about Constellate, a rare-disease knowledge map.
Source material: seconds 0 to 7, thousands of isolated points of light on a navy field; thin hairlines begin to
connect a few of them into constellations. Seconds 7 to 12, two lines of text fade in, one after the other,
centred, large: line 1 "Your family is not the first." line 2 "What you need may already exist under another
disease's name." Seconds 12 to 15, the text fades, the word mark "Constellate" appears small at the bottom,
the constellation keeps moving slowly so the presenter can start speaking over the last frame.
Audience: a hackathon jury and an audience of researchers and patient-group leaders.
Tone: calm, direct, no music, no sound effects, no drama; the two sentences do the work.
Key points (the only text allowed, verbatim): "Your family is not the first." · "What you need may already exist
under another disease's name." · "Constellate".
[Shared style block]
Duration: 15 seconds. Aspect ratio: 16:9.
```

## Ablauf (Hanno, nach der Abgabe)

1. Prompt 1 zuerst erzeugen, Ergebnis gegen die Verbotsliste prüfen (Text? Zahlen? Namen? Bilder von Menschen?).
2. Wenn der Stil passt, denselben Stil-Block für 2 bis 6 verwenden; bei Abweichungen per Follow-up nachbessern, nicht neu briefen.
3. Finale Clips ohne Ton exportieren. Falls für den Live-Pitch doch ein leiser Klang gewünscht ist: Entscheidung Hanno, aber nichts, was wie ein Trailer klingt.
4. Clips nicht ins Repo (Größe, Lizenz unklar). Ablage im Team-Drive.
5. Offenlegung, wenn ein Clip öffentlich verwendet wird: „Opening animation generated with Motion" in der Beschreibung des Posts.

## Was bewusst nicht gebrieft wird

- Kein „Erklärclip" zur Krankheit oder zum Mechanismus: jede inhaltliche Aussage gehört in die App und die Pflichtvideos, wo sie mit Kante und Quelle steht.
- Keine Nora-Figur als Animation: Die Komposit-Figur lebt in zwei Sätzen und Klicks, nicht als gezeichnete Person.
- Kein Clip mit dem Brief-Slogan „Five thousand points of light": Jedes Team hat ihn.
