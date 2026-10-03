import type { Edge } from "@/lib/types";
import { EXPLAIN_SYSTEM_PROMPT, buildExplainUserPrompt } from "@/lib/prompts/explain";
import { checkSentence, splitSentences, templateSentences, type ExplainEvent } from "@/lib/explain";
import { allDiseaseEdges, nodeLabels } from "@/lib/normalize";
import type { DiseaseFile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EDGES = 60;

interface ExplainRequest {
  edges?: Edge[];
  edge_ids?: string[];
  disease?: string;
  labels?: Record<string, string>;
  audience?: string;
}

function isEdge(value: unknown): value is Edge {
  const e = value as Edge;
  return Boolean(e && typeof e.id === "string" && typeof e.source === "string" && typeof e.target === "string" && Array.isArray(e.evidence));
}

/** Resolve edge ids against the disease file served from /data (same origin). */
async function edgesFromIds(request: Request, ids: string[], disease: string): Promise<{ edges: Edge[]; labels: Record<string, string> }> {
  const url = new URL(`/data/disease/${disease.replace(":", "_")}.json`, request.url);
  const response = await fetch(url);
  if (!response.ok) return { edges: [], labels: {} };
  const file = (await response.json()) as DiseaseFile;
  const wanted = new Set(ids);
  return { edges: allDiseaseEdges(file).filter((e) => wanted.has(e.id)), labels: nodeLabels(file) };
}

export async function POST(request: Request) {
  let body: ExplainRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON: {edges: Edge[]} or {edge_ids: string[], disease: string}" }, { status: 400 });
  }
  let edges = (body.edges ?? []).filter(isEdge);
  let labels = body.labels ?? {};
  if (!edges.length && body.edge_ids?.length && body.disease) {
    const resolved = await edgesFromIds(request, body.edge_ids, body.disease);
    edges = resolved.edges;
    labels = { ...resolved.labels, ...labels };
  }
  if (!edges.length) return Response.json({ error: "no valid edges in request" }, { status: 400 });
  edges = edges.slice(0, MAX_EDGES);
  const validIds = new Set(edges.map((e) => e.id));
  const audience = body.audience?.slice(0, 80) || "a patient-group leader without medical training";

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
      const template = (note: string) => {
        send({ type: "meta", mode: "template", note });
        templateSentences(edges, labels).forEach(emit);
      };

      try {
        if (!apiKey || !model) {
          template(`template, no LLM (${!apiKey ? "OPENAI_API_KEY" : "OPENAI_MODEL_EXPLAIN"} not set)`);
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
            }),
            signal: request.signal,
          });
          if (!upstream.ok || !upstream.body) {
            send({ type: "error", message: `OpenAI returned HTTP ${upstream.status}` });
            template("template, no LLM (OpenAI request failed)");
          } else {
            send({ type: "meta", mode: "llm", model, note: `${model} · sentences without a valid edge citation are removed` });
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
                    send({ type: "error", message: event.error?.message ?? event.response?.error?.message ?? "OpenAI stream error" });
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
        send({ type: "error", message: error instanceof Error ? error.message : "explain failed" });
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
