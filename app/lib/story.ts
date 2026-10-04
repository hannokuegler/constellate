// Maria's story: the script for the recorded walkthrough (story/maria.story.ts) and the transcript on /intro.
// Voice direction, voice choice and the reasoning behind every line: story/VOICE.md.
// Consti only says what the app itself shows on screen; no medical claim lives here.

export type Speaker = "maria" | "consti";

export interface StoryLine {
  id: string;
  who: Speaker;
  /** the speech bubble and the transcript */
  text: string;
  /** what ElevenLabs reads, when it differs: audio tags, spelled-out abbreviations */
  tts?: string;
}

export const SPEAKERS: Record<Speaker, { name: string; role: string }> = {
  maria: { name: "Maria", role: "mother, composite character" },
  consti: { name: "Consti", role: "the Constellate guide" },
};

export const STORY_TITLE = "Maria's first night";
export const STORY_NOTE = "Maria is a composite character. Every screen is the live app; Consti only points at what the data shows.";
/** true once the recorded video carries the ElevenLabs voice track (story/voice/*.mp3) */
export const STORY_HAS_VOICE = true;
export const STORY_VOICE_NOTE = "Voices generated with ElevenLabs (Eleven v4).";

/** H.264 first (Safari, Chrome, Edge, Firefox), VP9 for browsers without H.264 */
export const STORY_SOURCES = [
  { src: "/story/maria.mp4", type: 'video/mp4; codecs="avc1.64001F"' },
  { src: "/story/maria.webm", type: 'video/webm; codecs="vp9"' },
];
export const STORY_POSTER = "/story/maria.jpg";

export const STORY: StoryLine[] = [
  { id: "m-start", who: "maria", text: "2 a.m. \u201cKrabbe disease.\u201d Can't even spell it.", tts: "[wired and exhausted, low and quick, restless, a frustrated edge] Two a.m. Krabbe disease. [sharp exhale] Can't even spell it." },
  { id: "c-hello", who: "consti", text: "I'm Consti. Just type it. Typos are fine.", tts: "[calm, warm, unhurried] I'm Consti. Just type it\u2026 typos are fine." },
  { id: "m-alone", who: "maria", text: "Other families? Anyone?", tts: "[impatient, urgent, scanning the screen] Other families? [quieter, a flicker of raw hope] Anyone?" },
  { id: "c-gap", who: "consti", text: "Yes. Patient groups for this diagnosis, each one checked.", tts: "[warmly, gently] Yes. Patient groups for this diagnosis\u2026 each one checked." },
  { id: "c-studies", who: "consti", text: "Studies that need participants, by country.", tts: "[a little brighter] Studies that need participants, by country." },
  { id: "m-trust", who: "maria", text: "Wait. Who says this is true?", tts: "[stops short, suspicious, a little sharp] Wait. Who says this is true?" },
  { id: "c-evidence", who: "consti", text: "Each line shows its source, how sure we are\u2026 and what speaks against it.", tts: "[calm, steady, not offended] Each line shows its source, how sure we are\u2026 and what speaks against it." },
  { id: "c-related", who: "consti", text: "Related by a gene or symptoms: their families may help.", tts: "[softly, curious] Related by a gene or symptoms: their families may help." },
  { id: "c-psap", who: "consti", text: "Names hide what they share. One gene, four names.", tts: "[quietly, a touch of wonder] Names hide what they share. One gene\u2026 four names." },
  { id: "c-card", who: "consti", text: "Your action card. No approved medicine for Krabbe in EU or US records yet\u2026 MLD has one.", tts: "[calm, clear, no drama] Your action card. No approved medicine for Krabbe in E-U or U-S records yet\u2026 M-L-D has one." },
  { id: "m-end", who: "maria", text: "Okay. I can work with this.", tts: "[a beat of disbelief, then a soft laugh of relief, voice warming] Okay. I can work with this." },
  { id: "c-end", who: "consti", text: "Your family is not the first.", tts: "[softly, slowly, warm, close to the mic] Your family is not the first." },
];

export function storyLine(id: string): StoryLine {
  const line = STORY.find((l) => l.id === id);
  if (!line) throw new Error(`unknown story line ${id}`);
  return line;
}
