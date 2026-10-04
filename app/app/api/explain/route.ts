import type { Edge, EdgeLevel, Evidence } from "@/lib/types";
import { EXPLAIN_SYSTEM_PROMPT, buildExplainUserPrompt } from "@/lib/prompts/explain";
import { checkSentence, plainSentences, splitSentences, type ExplainEvent, type PlainContext } from "@/lib/explain";
import { therapyState } from "@/lib/nextSteps";
import { allDiseaseEdges, nodeLabels } from "@/lib/normalize";
import { FixedWindowLimiter, clientKey } from "@/lib/ratelimit";
import { explainKey, type PrecomputedExplain } from "@/lib/explaincache";
import type { DiseaseFile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EDGES = 60;
// largest real edge is ~7 kB, so 60 full edges plus labels fit; anything above is not an action card
const MAX_BODY_BYTES = 600_000;
const EDGE_ID = /^e_[0-9a-f]{6,16}$/;
const DISEASE_ID = /^MONDO[:_]\d{7}$/;
const LEVELS = new Set(["observed", "curated", "text_mined", "inferred", "contradicted", "search_hit"]);
// caps the cost of one LLM call (reasoning tokens count too); override per deployment
const MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_EXPLAIN) || 4000;
const UPSTREAM_TIMEOUT_MS = 90_000;

// best effort, per server instance (lib/ratelimit.ts): requests per client per minute,
// and an hourly LLM budget after which the route answers with template text instead of calling OpenAI
const perClient = new FixedWindowLimiter(Number(process.env.EXPLAIN_RATE_PER_MIN) || 10, 60_000);
const llmBudget = new FixedWindowLimiter(Number(process.env.EXPLAIN_LLM_PER_HOUR) || 200, 3_600_000);

interface ExplainRequest {
  edges?: unknown;
  edge_ids?: unknown;
  disease?: unknown;
  labels?: unknown;
  audience?: unknown;
  /** the card's disease and the related disease (MONDO ids): used for the approval status and the shared symptoms */
  from?: unknown;
  via?: unknown;
}

const str = (value: unknown, max: number): string | undefined =>
  typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]+/g, " ").slice(0, max) : undefined;
const num = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const level = (value: unknown): EdgeLevel => (typeof value === "string" && LEVELS.has(value) ? (value as EdgeLevel) : "inferred");

function cleanEvidence(value: unknown): Evidence | null {
  if (!value || typeof value !== "object") return null;
  const ev = value as Record<string, unknown>;
  return { db: str(ev.db, 40) ?? "unknown", record: str(ev.record, 80), level: level(ev.level), date: str(ev.date, 32), confidence: num(ev.confidence), snippet: str(ev.snippet, 240) };
}

/** Client-sent edges reach the LLM prompt: keep only the fields the prompt and the template use, each length-capped. */
function cleanEdge(value: unknown): Edge | null {
  if (!value || typeof value !== "object") return null;
  const e = value as Record<string, unknown>;
  if (typeof e.id !== "string" || !EDGE_ID.test(e.id) || typeof e.source !== "string" || typeof e.target !== "string" || !Array.isArray(e.evidence)) return null;
  const list = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n).map(cleanEvidence).filter((x): x is Evidence => x !== null) : []);
  return {
    id: e.id,
    source: str(e.source, 64) ?? "",
    target: str(e.target, 64) ?? "",
    type: str(e.type, 40) ?? "related",
    evidence: list(e.evidence, 3),
    contradicting: list(e.contradicting, 10),
    confidence: num(e.confidence) ?? 0,
    level: level(e.level),
    independent_sources: Array.isArray(e.independent_sources) ? e.independent_sources.slice(0, 10).map((s) => str(s, 40) ?? "").filter(Boolean) : [],
    ...(typeof e.formula === "string" ? { formula: str(e.formula, 400) } : {}),
  };
}

/** Labels only for ids that occur in the edges, length-capped. */
function cleanLabels(value: unknown, edges: Edge[]): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const wanted = new Set(edges.flatMap((e) => [e.source, e.target]));
  const out: Record<string, string> = {};
  for (const [id, label] of Object.entries(value as Record<string, unknown>)) {
    const text = wanted.has(id) ? str(label, 160) : undefined;
    if (text) out[id] = text;
  }
  return out;
}

/** Reads the body up to MAX_BODY_BYTES; null when it is larger. */
async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Never echo anything key-shaped from an upstream error. */
const scrub = (message: string) => message.replace(/sk-[A-Za-z0-9_*.-]+/g, "sk-***").slice(0, 300);

/** Resolve edge ids against the disease file served from /data (same origin). */
async function edgesFromIds(request: Request, ids: string[], disease: string): Promise<{ edges: Edge[]; labels: Record<string, string> }> {
  const url = new URL(`/data/disease/${disease.replace(":", "_")}.json`, request.url);
  const response = await fetch(url);
  if (!response.ok) return { edges: [], labels: {} };
  const file = (await response.json()) as DiseaseFile;
  const wanted = new Set(ids);
  return { edges: allDiseaseEdges(file).filter((e) => wanted.has(e.id)), labels: nodeLabels(file) };
}

async function diseaseFile(request: Request, id: string): Promise<DiseaseFile | null> {
  const response = await fetch(new URL(`/data/disease/${id.replace(":", "_")}.json`, request.url)).catch(() => null);
  return response?.ok ? ((await response.json().catch(() => null)) as DiseaseFile | null) : null;
}

/** Approval status of the card's disease (searched EMA/FDA records in its data file) and the symptoms it shares with the related disease. */
async function cardContext(request: Request, from: string | undefined, via: string | undefined): Promise<{ status: Extract<ExplainEvent, { type: "status" }> | null; ctx: PlainContext }> {
  const fromId = from && DISEASE_ID.test(from) ? from.replace("_", ":") : null;
  const viaId = via && DISEASE_ID.test(via) ? via.replace("_", ":") : null;
  const file = fromId ? await diseaseFile(request, fromId) : null;
  if (!file) return { status: null, ctx: { fromId, viaId } };
  const D = file.node.label;
  const sharedSymptoms = (file.neighbours.find((n) => n.id === viaId)?.shared_phenotypes ?? []).map((p) => p.label);
  const state = therapyState(file);
  let status: Extract<ExplainEvent, { type: "status" }> | null = null;
  if (state.kind === "none") {
    status = {
      type: "status",
      text: `No approved medicine for ${D} was found in ${state.authorities} records${state.asOf ? ` as of ${state.asOf}` : ""}.`,
      source: state.sources.length ? `searched ${state.sources.join("; ")}` : `searched ${state.authorities} records`,
    };
  } else if (state.kind === "approved") {
    const names = [...new Set(state.items.map((t) => t.name))].slice(0, 3);
    status = {
      type: "status",
      text: `${D} has ${names.length > 1 ? "approved medicines" : "an approved medicine"} in EMA or FDA records: ${names.join(", ")}. Whether it fits is for your specialist to decide.`,
      source: state.items.slice(0, 3).map((t) => [t.authority, t.record].filter(Boolean).join(" ") || t.name).join("; "),
    };
  } else {
    status = { type: "status", text: `The EMA and FDA medicine records have not been searched for ${D} yet, so this summary cannot say whether a medicine is approved.`, source: "no search recorded in the data" };
  }
  return { status, ctx: { fromId, viaId, sharedSymptoms } };
}

/** Explanation generated ahead of time for exactly this edge set (same origin, static file), or null. */
async function precomputed(request: Request, ids: Set<string>): Promise<PrecomputedExplain | null> {
  if (process.env.EXPLAIN_PRECOMPUTED === "0") return null;
  const key = explainKey(ids);
  const response = await fetch(new URL(`/data/explain/${key}.json`, request.url)).catch(() => null);
  if (!response?.ok) return null;
  const file = (await response.json().catch(() => null)) as PrecomputedExplain | null;
  return file?.key === key && Array.isArray(file.sentences) ? file : null;
}

export async function POST(request: Request) {
  const retryAfter = perClient.hit(clientKey(request));
  if (retryAfter) {
    return Response.json({ error: "too many requests, try again shortly" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }
  const raw = await readBody(request);
  if (raw === null) return Response.json({ error: `body larger than ${MAX_BODY_BYTES} bytes` }, { status: 413 });
  let body: ExplainRequest;
  try {
    body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error("not an object");
  } catch {
    return Response.json({ error: "body must be JSON: {edges: Edge[]} or {edge_ids: string[], disease: string}" }, { status: 400 });
  }
  let edges = (Array.isArray(body.edges) ? body.edges.slice(0, MAX_EDGES) : []).map(cleanEdge).filter((e): e is Edge => e !== null);
  let labels = cleanLabels(body.labels, edges);
  if (!edges.length && Array.isArray(body.edge_ids) && typeof body.disease === "string") {
    if (!DISEASE_ID.test(body.disease)) return Response.json({ error: "disease must be a MONDO id" }, { status: 400 });
    const ids = body.edge_ids.slice(0, MAX_EDGES).filter((id): id is string => typeof id === "string" && EDGE_ID.test(id));
    if (ids.length) {
      const resolved = await edgesFromIds(request, ids, body.disease);
      edges = resolved.edges.slice(0, MAX_EDGES);
      labels = { ...resolved.labels, ...cleanLabels(body.labels, edges) };
    }
  }
  if (!edges.length) return Response.json({ error: "no valid edges in request" }, { status: 400 });
  const validIds = new Set(edges.map((e) => e.id));
  const audience = str(body.audience, 80)?.trim() || "a patient-group leader without medical training";

  const [stored, context] = await Promise.all([precomputed(request, validIds), cardContext(request, str(body.from, 20), str(body.via, 20))]);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL_EXPLAIN;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let kept = 0;
      let dropped = 0;
      const send = (event: ExplainEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      const emit = (raw: string) => {
        const checked = checkSentence(raw, validIds);
        if (!checked) return;
        if (checked.type === "sentence") kept++;
        else dropped++;
        send(checked);
      };
      // the reason for a fallback stays in the server log; the reader sees a neutral label (components/ExplainStream.tsx)
      const template = (reason: string) => {
        if (reason) console.info(`explain: plain-language fallback (${reason})`);
        send({ type: "meta", mode: "template", note: "Plain-language summary built from the sources on this card" });
        plainSentences(edges, labels, context.ctx).forEach(emit);
      };
      // approval status first, in every mode: it is the sentence a parent must not miss
      if (context.status) send(context.status);

      try {
        if (stored) {
          // generated offline with the same prompt; re-checked here so a stale file can never cite an edge outside this card
          send({ type: "meta", mode: "llm", model: stored.model, note: `AI-written summary, every sentence checked against the sources (${stored.model}, generated ${stored.generated_at.slice(0, 10)})` });
          stored.sentences.forEach((s) => emit(s.text));
          stored.dropped.forEach((d) => {
            dropped++;
            send(d);
          });
        } else if (!apiKey || !model) {
          template("no model configured");
        } else if (llmBudget.hit("llm")) {
          template("hourly model budget reached");
        } else {
          const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
          const upstream = await fetch(`${baseUrl}/responses`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              instructions: EXPLAIN_SYSTEM_PROMPT,
              input: buildExplainUserPrompt(edges, labels, audience),
              stream: true,
              max_output_tokens: MAX_OUTPUT_TOKENS,
            }),
            signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
          });
          if (!upstream.ok || !upstream.body) {
            template(`OpenAI returned HTTP ${upstream.status}`);
          } else {
            send({ type: "meta", mode: "llm", model, note: "AI-written summary, every sentence checked against the sources" });
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            let sse = "";
            let text = "";
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              sse += decoder.decode(value, { stream: true });
              const lines = sse.split("\n");
              sse = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                  const event = JSON.parse(payload);
                  if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                    text += event.delta;
                    const [complete, rest] = splitSentences(text);
                    complete.forEach(emit);
                    text = rest;
                  } else if (event.type === "error" || event.type === "response.failed") {
                    send({ type: "error", message: scrub(String(event.error?.message ?? event.response?.error?.message ?? "OpenAI stream error")) });
                  } else if (event.type === "response.incomplete") {
                    send({ type: "error", message: `answer cut off (${event.response?.incomplete_details?.reason ?? "incomplete"})` });
                  }
                } catch {
                  // ignore keep-alive or partial lines
                }
              }
            }
            if (text.trim()) emit(text);
          }
        }
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? scrub(error.message) : "explain failed" });
      }
      send({ type: "done", kept, dropped });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function GET() {
  return Response.json({
    usage: "POST {edges: Edge[], labels?: {id: label}, audience?: string} or {edge_ids: string[], disease: 'MONDO:…'}",
    stream: "application/x-ndjson events: meta | sentence | dropped | error | done",
    llm: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL_EXPLAIN),
  });
}
