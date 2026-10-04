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
  { id: "m-start", who: "maria", text: "2 a.m. The doctor said \u201cKrabbe disease\u201d. I can't even spell it.", tts: "[exhausted, close to the mic, barely above a whisper] Two a.m. The doctor said\u2026 Krabbe disease. [exhales] I can't even spell it." },
  { id: "c-hello", who: "consti", text: "Maria, I'm Consti. I won't guess. I'll show you how we know.", tts: "[calm, warm, unhurried] Maria, I'm Consti. I won't guess. I'll show you how we know." },
  { id: "m-alone", who: "maria", text: "Is there anyone else like us?", tts: "[softly, voice close to breaking] Is there anyone else\u2026 like us?" },
  { id: "c-gap", who: "consti", text: "You're not alone. These groups are there for Krabbe, each one checked against its own website.", tts: "[warmly, gently] You're not alone. These groups are there for Krabbe\u2026 each one checked against its own website." },
  { id: "c-studies", who: "consti", text: "But these studies are looking for participants.", tts: "[a little warmer] But these studies are looking for participants." },
  { id: "m-trust", who: "maria", text: "How do I know this is true?", tts: "[quietly, wary] How do I know this is true?" },
  { id: "c-evidence", who: "consti", text: "Click any line: its source\u2026 and what speaks against it.", tts: "[calm, steady] Click any line: its source\u2026 and what speaks against it." },
  { id: "c-related", who: "consti", text: "MLD shares a gene with Krabbe: PSAP.", tts: "[softly, curious] M-L-D shares a gene with Krabbe: P-S-A-P." },
  { id: "c-psap", who: "consti", text: "One gene. Four disease names.", tts: "[slowly, with weight] One gene. Four disease names." },
  { id: "c-card", who: "consti", text: "Your action card: what may transfer, what differs, what needs an expert.", tts: "[calm, clear] Your action card: what may transfer, what differs, what needs an expert." },
  { id: "m-end", who: "maria", text: "So we don't have to start from zero.", tts: "[quietly, almost to herself, a first trace of hope] So we don't have to start from zero." },
  { id: "c-end", who: "consti", text: "Your family is not the first.", tts: "[softly, slowly, warm, close to the mic] Your family is not the first." },
];

export function storyLine(id: string): StoryLine {
  const line = STORY.find((l) => l.id === id);
  if (!line) throw new Error(`unknown story line ${id}`);
  return line;
}
