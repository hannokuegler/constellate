// Maria's story: the script for the recorded walkthrough (story/maria.story.ts) and the transcript on /intro.
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
export const STORY_HAS_VOICE = false;

/** H.264 first (Safari, Chrome, Edge, Firefox), VP9 for browsers without H.264 */
export const STORY_SOURCES = [
  { src: "/story/maria.mp4", type: 'video/mp4; codecs="avc1.64001F"' },
  { src: "/story/maria.webm", type: 'video/webm; codecs="vp9"' },
];
export const STORY_POSTER = "/story/maria.jpg";

export const STORY: StoryLine[] = [
  { id: "m-start", who: "maria", text: "2 a.m. The doctor said “Krabbe disease”. I can't even spell it. Where do I even start?" },
  { id: "c-hello", who: "consti", text: "Hi Maria, I'm Consti. I won't guess. I'll show you what is known, where it comes from, and what is still missing." },
  { id: "c-typo", who: "consti", text: "A typo is fine. That one is Krabbe disease." },
  { id: "c-map", who: "consti", text: "This is the neighbourhood of your child's diagnosis: genes, symptoms and related diseases, from open medical databases." },
  { id: "m-alone", who: "maria", text: "Is there anyone else like us? Anyone?" },
  { id: "c-gap", who: "consti", text: "I found no checked patient group for Krabbe yet. I say so, and I show you what I searched, instead of making one up." },
  { id: "c-studies", who: "consti", text: "But these studies list Krabbe disease and are taking participants now or soon." },
  { id: "m-trust", who: "maria", text: "How do I know any of this is true?" },
  { id: "c-evidence", who: "consti", text: "Click any line. You get the source, the date, how confident it is, and a slot for evidence that disagrees." },
  { id: "c-related", who: "consti", text: "Now look next door. Metachromatic leukodystrophy, MLD, shares a gene with Krabbe: PSAP." },
  { id: "c-psap", who: "consti", text: "One gene, four disease names. Names hide mechanisms, so families who should talk often never meet." },
  { id: "m-what", who: "maria", text: "So what do I actually do with this?" },
  { id: "c-card", who: "consti", text: "Your action card: what may transfer from MLD, what differs, what needs experts. Every sentence cites its evidence." },
  { id: "m-end", who: "maria", text: "So we don't have to start from zero." },
  { id: "c-end", who: "consti", text: "Your family is not the first. Now it's your turn." },
];

export function storyLine(id: string): StoryLine {
  const line = STORY.find((l) => l.id === id);
  if (!line) throw new Error(`unknown story line ${id}`);
  return line;
}
