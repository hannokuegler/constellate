// Voice for Maria's story: one ElevenLabs MP3 per story line into story/voice/<id>.mp3, read by the recorder.
// Key only from the environment (ELEVENLABS_API_KEY, or ../.env.local); voice IDs and settings in story/voices.json,
// overridable with ELEVENLABS_VOICE_MARIA, ELEVENLABS_VOICE_CONSTI and ELEVENLABS_MODEL.
//   npm run story:voice -- --list     voices the key can see (needs Voices: read)
//   npm run story:voice               missing lines only
//   npm run story:voice -- --force    all lines again
//   npm run story:voice -- c-gap      selected lines again
//   npm run story:voice -- --design maria          three voice previews from the design prompt in voices.json (story/voice/design/)
//   npm run story:voice -- --save maria <gen_id>    keep one preview as a voice and write its voice_id into voices.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STORY, type Speaker } from "../lib/story";

const API = "https://api.elevenlabs.io";
const DIR = join(__dirname, "voice");

interface VoiceCfg { voice_id: string; stability: number; similarity_boost: number; design?: string; design_text?: string }
interface Cfg { model: string; fallback_model: string; output_format: string; seed?: number; maria: VoiceCfg; consti: VoiceCfg }

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
const CFG = join(__dirname, "voices.json");
const cfg: Cfg = JSON.parse(readFileSync(CFG, "utf8"));
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
    [`tts ${model}`, `/v1/text-to-speech/${v.voice_id}?output_format=${cfg.output_format}`, { text, model_id: model, voice_settings: settings, seed: cfg.seed }],
    [`dialogue ${model}`, `/v1/text-to-dialogue?output_format=${cfg.output_format}`, { inputs: [{ text, voice_id: v.voice_id }], model_id: model, settings: { stability: v.stability }, seed: cfg.seed }],
    [`tts ${cfg.fallback_model}`, `/v1/text-to-speech/${v.voice_id}?output_format=${cfg.output_format}`, { text: text.replace(/\[[^\]]*\]\s*/g, ""), model_id: cfg.fallback_model, voice_settings: settings, seed: cfg.seed }],
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

async function json<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: { "xi-api-key": key!, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

const speaker = (w: string | undefined): Speaker => {
  if (w !== "maria" && w !== "consti") throw new Error("speaker must be maria or consti");
  return w;
};

// Voice Design: previews from the text prompt, nothing is saved yet (needs Voices: write only for --save)
async function design(who: Speaker) {
  const v = cfg[who];
  if (!v.design || !v.design_text) throw new Error(`no design prompt for ${who} in voices.json`);
  const { previews } = await json<{ previews: { audio_base_64: string; generated_voice_id: string }[] }>("/v1/text-to-voice/design", {
    voice_description: v.design, text: v.design_text, model_id: "eleven_ttv_v3", seed: cfg.seed, should_enhance: false,
  });
  const dir = join(DIR, "design");
  mkdirSync(dir, { recursive: true });
  previews.forEach((p, i) => {
    const f = join(dir, `${who}-${i + 1}.mp3`);
    writeFileSync(f, Buffer.from(p.audio_base_64, "base64"));
    console.log(`${f}  generated_voice_id ${p.generated_voice_id}`);
  });
  console.log(`listen, then: npm run story:voice -- --save ${who} <generated_voice_id>`);
}

async function save(who: Speaker, generated: string | undefined) {
  if (!generated) throw new Error("generated_voice_id missing");
  const v = await json<{ voice_id: string }>("/v1/text-to-voice", {
    voice_name: `Constellate ${who === "maria" ? "Maria" : "Consti"}`, voice_description: cfg[who].design, generated_voice_id: generated,
  });
  cfg[who].voice_id = v.voice_id;
  writeFileSync(CFG, JSON.stringify(cfg, null, 2) + "\n");
  console.log(`${who}: voice_id ${v.voice_id} saved in story/voices.json; regenerate with --force`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--list")) return list();
  if (args[0] === "--design") return design(speaker(args[1]));
  if (args[0] === "--save") return save(speaker(args[1]), args[2]);
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
