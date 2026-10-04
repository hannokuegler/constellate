// Precomputed explanations from answers written outside this script (e.g. by Claude Code subagents when no OpenAI key
// is available). Same pairs, card, prompt and citation post-check as precompute-explain.ts; only the model call differs.
//   npx tsx scripts/explain-from-answers.ts dump <dir> [--core N]            -> <dir>/<key>.md (system + user prompt per card)
//   (a model answers each <key>.md as plain text in <dir>/<key>.txt)
//   npx tsx scripts/explain-from-answers.ts ingest <dir> <model> [--core N]  -> public/data/explain/<key>.json
// Use the same --core N for dump and ingest. Re-run after every re-export (a changed edge set changes the key).
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
const HERO: [string, string | null][] = [["MONDO:0009499", null], ["MONDO:0009499", "MONDO:0010714"], ["MONDO:0018868", "MONDO:0009499"]];
const [mode, dir, third] = process.argv.slice(2);
const coreArg = process.argv.indexOf("--core");
const core = coreArg > 0 ? Number(process.argv[coreArg + 1]) : 0;
const readJson = <T>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null);
const disease = (id: string) => readJson<DiseaseFile>(join(DATA, "disease", `${id.replace(":", "_")}.json`));
const gene = (s: string) => readJson<GeneFile>(join(DATA, "gene", `${s}.json`));
function cardFor(fromId: string, viaId: string | null) {
  const file = disease(fromId);
  if (!file) return null;
  const via = viaId ?? pickDefaultVia(file.neighbours);
  const neighbour = file.neighbours.find((n) => n.id === via);
  if (!neighbour) return null;
  const neighbourFile = disease(neighbour.id);
  const symbols = [...new Set([...file.genes, ...(neighbourFile?.genes ?? [])].map((e) => e.target))].slice(0, 8);
  return buildActionCard({ disease: file, neighbour, neighbourFile, geneFiles: symbols.map(gene).filter((g): g is GeneFile => Boolean(g)) });
}
const pairs: [string, string | null, boolean][] = HERO.map(([a, b]) => [a, b, false]);
if (core > 0) for (const e of (readJson<IndexEntry[]>(join(DATA, "index.json")) ?? []).filter((e) => e.type === "disease" && (e as IndexEntry & { in_core?: boolean }).in_core))
  if (!pairs.some(([a, b]) => a === e.id && b === null)) pairs.push([e.id, null, true]);
const promptSha = createHash("sha1").update(EXPLAIN_SYSTEM_PROMPT).digest("hex").slice(0, 12);
mkdirSync(dir, { recursive: true });
mkdirSync(OUT, { recursive: true });
let coreCards = 0, n = 0;
for (const [fromId, viaId, isCore] of pairs) {
  if (isCore && coreCards >= core) break;
  const card = cardFor(fromId, viaId);
  if (!card || !card.edges.size) continue;
  if (isCore) coreCards++;
  const edges = [...card.edges.values()];
  const ids = edges.map((e) => e.id);
  const key = explainKey(ids);
  if (mode === "dump") {
    writeFileSync(join(dir, `${key}.md`), `# SYSTEM\n${EXPLAIN_SYSTEM_PROMPT}\n\n# USER\n${buildExplainUserPrompt(edges, card.labels, AUDIENCE)}\n`);
    n++;
    console.log(`dump ${key} ${card.from.label} -> ${card.via.label} (${ids.length} edges)`);
  } else if (mode === "ingest") {
    const answer = join(dir, `${key}.txt`);
    if (!existsSync(answer)) { console.log(`missing ${key}`); continue; }
    // formatting only: "[e_a, e_b]" -> "[e_a] [e_b]" (the post-check reads one id per bracket, as in the prompt's example)
    const text = readFileSync(answer, "utf8").replace(/\[(e_[0-9a-f]{6,16}(?:\s*,\s*e_[0-9a-f]{6,16})+)\]/g, (_m, ids: string) => ids.split(/\s*,\s*/).map((id) => `[${id}]`).join(" "));
    const [complete, rest] = splitSentences(text);
    const valid = new Set(ids);
    const events = [...complete, rest].map((s) => checkSentence(s, valid)).filter((e): e is ExplainEvent => e !== null);
    const out: PrecomputedExplain = {
      key, edge_ids: [...ids].sort(), from: card.from.id, via: card.via.id, model: third, prompt_sha: promptSha, audience: AUDIENCE,
      generated_at: new Date().toISOString(),
      sentences: events.filter((e): e is Extract<ExplainEvent, { type: "sentence" }> => e.type === "sentence"),
      dropped: events.filter((e): e is Extract<ExplainEvent, { type: "dropped" }> => e.type === "dropped"),
    };
    writeFileSync(join(OUT, `${key}.json`), JSON.stringify(out, null, 1) + "\n");
    n++;
    console.log(`wrote ${key} ${card.from.label} -> ${card.via.label}: ${out.sentences.length} kept, ${out.dropped.length} dropped`);
  }
}
console.log(`${mode}: ${n}`);
