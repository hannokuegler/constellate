// Voice for Maria's story: one ElevenLabs MP3 per story line into story/voice/<id>.mp3, read by the recorder.
// Key only from the environment (ELEVENLABS_API_KEY, or ../.env.local); voice IDs and settings in story/voices.json,
// overridable with ELEVENLABS_VOICE_MARIA, ELEVENLABS_VOICE_CONSTI and ELEVENLABS_MODEL.
//   npm run story:voice -- --list     voices the key can see (needs Voices: read)
//   npm run story:voice               missing lines only
//   npm run story:voice -- --force    all lines again
//   npm run story:voice -- c-gap      selected lines again
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STORY, type Speaker } from "../lib/story";

const API = "https://api.elevenlabs.io";
const DIR = join(__dirname, "voice");

interface VoiceCfg { voice_id: string; stability: number; similarity_boost: number }
interface Cfg { model: string; fallback_model: string; output_format: string; maria: VoiceCfg; consti: VoiceCfg }

function envLocal(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  for (const f of [join(__dirname, "..", ".env.local"), join(__dirname, "..", "..", ".env.local")]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    if (m) return m[1].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "") || undefined;
  }
  return undefined;
}

const key = envLocal("ELEVENLABS_API_KEY");
if (!key) {
  console.error("ELEVENLABS_API_KEY missing (environment variable or .env.local)");
  process.exit(1);
}
const cfg: Cfg = JSON.parse(readFileSync(join(__dirname, "voices.json"), "utf8"));
const model = envLocal("ELEVENLABS_MODEL") ?? cfg.model;
const voiceOf = (who: Speaker): VoiceCfg => {
  const v = cfg[who];
  const id = envLocal(`ELEVENLABS_VOICE_${who.toUpperCase()}`) ?? v.voice_id;
  if (!id) throw new Error(`no voice for ${who}: set ${who}.voice_id in story/voices.json or ELEVENLABS_VOICE_${who.toUpperCase()}`);
  return { ...v, voice_id: id };
};

async function call(path: string, body: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: "POST",
    headers: { "xi-api-key": key!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
}

// text-to-speech first; v4 may only be served by text-to-dialogue, then that endpoint, then the fallback model
async function speak(text: string, v: VoiceCfg): Promise<{ audio: Buffer; via: string }> {
  const settings = { stability: v.stability, similarity_boost: v.similarity_boost };
  const tries: [string, string, unknown][] = [
    [`tts ${model}`, `/v1/text-to-speech/${v.voice_id}?output_format=${cfg.output_format}`, { text, model_id: model, voice_settings: settings }],
    [`dialogue ${model}`, `/v1/text-to-dialogue?output_format=${cfg.output_format}`, { inputs: [{ text, voice_id: v.voice_id }], model_id: model, settings: { stability: v.stability } }],
    [`tts ${cfg.fallback_model}`, `/v1/text-to-speech/${v.voice_id}?output_format=${cfg.output_format}`, { text: text.replace(/\[[^\]]*\]\s*/g, ""), model_id: cfg.fallback_model, voice_settings: settings }],
  ];
  const errors: string[] = [];
  for (const [via, path, body] of tries) {
    const res = await call(path, body);
    if (res.ok) return { audio: Buffer.from(await res.arrayBuffer()), via };
    const msg = `${via}: ${res.status} ${(await res.text()).slice(0, 300)}`;
    if (res.status === 401 || res.status === 403) throw new Error(msg); // key or permission: no point in trying further
    errors.push(msg);
  }
  throw new Error(errors.join("\n"));
}

async function list() {
  const res = await fetch(`${API}/v1/voices`, { headers: { "xi-api-key": key! } });
  if (!res.ok) throw new Error(`voices: ${res.status} ${await res.text()}`);
  const { voices } = (await res.json()) as { voices: { voice_id: string; name: string; category: string; labels?: Record<string, string> }[] };
  for (const v of voices) console.log(`${v.voice_id}  ${v.name.padEnd(28)} ${v.category.padEnd(12)} ${Object.values(v.labels ?? {}).join(", ")}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--list")) return list();
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));
  mkdirSync(DIR, { recursive: true });
  for (const line of STORY) {
    const out = join(DIR, `${line.id}.mp3`);
    if (only.length ? !only.includes(line.id) : !force && existsSync(out)) continue;
    const { audio, via } = await speak(line.tts ?? line.text, voiceOf(line.who));
    writeFileSync(out, audio);
    console.log(`${line.id.padEnd(11)} ${line.who.padEnd(7)} ${via.padEnd(28)} ${(audio.length / 1024).toFixed(0)} KB`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
