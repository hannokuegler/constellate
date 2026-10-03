// Precomputes /api/explain answers for action cards, so the live site needs no OpenAI key.
// Same prompt, same edge set and same citation post-check as the live route; output in public/data/explain/<key>.json.
//
//   cd app && npx tsx scripts/precompute-explain.ts --dry-run            # pairs, edge counts, token estimate, no API call
//   OPENAI_API_KEY=… OPENAI_MODEL_EXPLAIN=… npx tsx scripts/precompute-explain.ts [--core 50] [--pair MONDO:a,MONDO:b]
//
// Default pairs: the hero path (Krabbe -> default via, Krabbe -> Pelizaeus-Merzbacher, MLD -> Krabbe) plus the first
// --core N core diseases (index order) with their default via. Existing files are kept unless --force.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildActionCard, pickDefaultVia } from "../lib/actioncard";
import { checkSentence, splitSentences, type ExplainEvent } from "../lib/explain";
import { explainKey, type PrecomputedExplain } from "../lib/explaincache";
import { EXPLAIN_SYSTEM_PROMPT, buildExplainUserPrompt } from "../lib/prompts/explain";
import type { DiseaseFile, GeneFile, IndexEntry } from "../lib/types";

const DATA = join(__dirname, "..", "public", "data");
const OUT = join(DATA, "explain");
const AUDIENCE = "a parent or patient-group leader without medical training";
const HERO: [string, string | null][] = [
  ["MONDO:0009499", null], // Krabbe -> default via (MLD)
  ["MONDO:0009499", "MONDO:0010714"], // Krabbe -> Pelizaeus-Merzbacher spectrum (counter-example)
  ["MONDO:0018868", "MONDO:0009499"], // MLD -> Krabbe
];

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const readJson = <T>(path: string): T | null => (existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null);
const disease = (id: string) => readJson<DiseaseFile>(join(DATA, "disease", `${id.replace(":", "_")}.json`));
const gene = (symbol: string) => readJson<GeneFile>(join(DATA, "gene", `${symbol}.json`));

/** Exactly the edge set the action card sends to /api/explain (components/ActionCard.tsx). */
function cardFor(fromId: string, viaId: string | null) {
  const file = disease(fromId);
  if (!file) return null;
  const via = viaId ?? pickDefaultVia(file.neighbours);
  const neighbour = file.neighbours.find((n) => n.id === via);
  if (!neighbour) return null;
  const neighbourFile = disease(neighbour.id);
  const symbols = [...new Set([...file.genes, ...(neighbourFile?.genes ?? [])].map((e) => e.target))].slice(0, 8);
  const geneFiles = symbols.map(gene).filter((g): g is GeneFile => Boolean(g));
  return buildActionCard({ disease: file, neighbour, neighbourFile, geneFiles });
}

async function callModel(input: string, model: string, key: string): Promise<{ text: string; usage: { input: number; output: number } }> {
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, instructions: EXPLAIN_SYSTEM_PROMPT, input, max_output_tokens: Number(process.env.OPENAI_MAX_OUTPUT_EXPLAIN) || 4000 }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const body = (await response.json()) as {
    output?: { type: string; content?: { type: string; text?: string }[] }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (body.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
  return { text, usage: { input: body.usage?.input_tokens ?? 0, output: body.usage?.output_tokens ?? 0 } };
}

async function main() {
  const pairs: [string, string | null, boolean][] = HERO.map(([a, b]) => [a, b, false]);
  const extra = value("--pair");
  if (extra) {
    const [a, b] = extra.split(",");
    pairs.push([a, b ?? null, false]);
  }
  const core = Number(value("--core") ?? 0);
  if (core > 0) {
    const index = readJson<IndexEntry[]>(join(DATA, "index.json")) ?? [];
    // candidates in index order; only diseases that yield a card count towards --core N
    for (const entry of index.filter((e) => e.type === "disease" && (e as IndexEntry & { in_core?: boolean }).in_core)) {
      if (!pairs.some(([a, b]) => a === entry.id && b === null)) pairs.push([entry.id, null, true]);
    }
  }

  const dry = flag("--dry-run");
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL_EXPLAIN;
  if (!dry && (!key || !model)) {
    console.error(`missing ${!key ? "OPENAI_API_KEY" : "OPENAI_MODEL_EXPLAIN"} (model id only from the env, check it with pipeline/openai_config.py --list); use --dry-run to preview`);
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });
  const promptSha = createHash("sha1").update(EXPLAIN_SYSTEM_PROMPT).digest("hex").slice(0, 12);
  let tokensIn = 0;
  let tokensOut = 0;
  let written = 0;
  let coreCards = 0;

  for (const [fromId, viaId, isCore] of pairs) {
    if (isCore && coreCards >= core) break;
    const card = cardFor(fromId, viaId);
    if (!card || !card.edges.size) {
      if (!isCore) console.log(`skip ${fromId} -> ${viaId ?? "default"}: no card or no edges`);
      continue;
    }
    if (isCore) coreCards++;
    const edges = [...card.edges.values()];
    const ids = edges.map((e) => e.id);
    const fileKey = explainKey(ids);
    const path = join(OUT, `${fileKey}.json`);
    const input = buildExplainUserPrompt(edges, card.labels, AUDIENCE);
    const label = `${card.from.label} -> ${card.via.label} (${ids.length} edges, key ${fileKey})`;
    if (dry) {
      console.log(`plan  ${label} · ~${Math.round((input.length + EXPLAIN_SYSTEM_PROMPT.length) / 4)} input tokens`);
      continue;
    }
    if (existsSync(path) && !flag("--force")) {
      console.log(`keep  ${label}`);
      continue;
    }
    const { text, usage } = await callModel(input, model!, key!);
    tokensIn += usage.input;
    tokensOut += usage.output;
    const [complete, rest] = splitSentences(text);
    const valid = new Set(ids);
    const events = [...complete, rest].map((s) => checkSentence(s, valid)).filter((e): e is ExplainEvent => e !== null);
    const out: PrecomputedExplain = {
      key: fileKey,
      edge_ids: [...ids].sort(),
      from: card.from.id,
      via: card.via.id,
      model: model!,
      prompt_sha: promptSha,
      audience: AUDIENCE,
      generated_at: new Date().toISOString(),
      sentences: events.filter((e): e is Extract<ExplainEvent, { type: "sentence" }> => e.type === "sentence"),
      dropped: events.filter((e): e is Extract<ExplainEvent, { type: "dropped" }> => e.type === "dropped"),
    };
    writeFileSync(path, JSON.stringify(out, null, 1) + "\n");
    written++;
    console.log(`wrote ${label} · ${out.sentences.length} kept, ${out.dropped.length} dropped · ${usage.input}/${usage.output} tokens`);
  }
  if (!dry) console.log(`done: ${written} files, ${tokensIn} input + ${tokensOut} output tokens with ${model}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
