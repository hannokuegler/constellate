// Shared by /api/explain (server) and the client renderer: template fallback, sentence splitting, citation post-check.
import type { Edge } from "./types";
import { formatConfidence } from "./evidence";

export const EDGE_ID_PATTERN = /\[(e_[0-9a-f]{6,16})\]/g;

export type ExplainEvent =
  | { type: "meta"; mode: "llm" | "template"; model?: string; note: string }
  | { type: "sentence"; text: string; edge_ids: string[]; invalid_ids: string[] }
  | { type: "dropped"; text: string; reason: string }
  | { type: "error"; message: string }
  | { type: "done"; kept: number; dropped: number };

/** Post-check: a sentence survives only if it cites at least one edge id from the input. */
export function checkSentence(raw: string, validIds: Set<string>): ExplainEvent | null {
  const text = raw.trim();
  if (!text) return null;
  const cited = [...text.matchAll(EDGE_ID_PATTERN)].map((m) => m[1]);
  const valid = cited.filter((id) => validIds.has(id));
  const invalid = cited.filter((id) => !validIds.has(id));
  if (!valid.length) {
    return { type: "dropped", text, reason: cited.length ? `cites unknown edge ${invalid.join(", ")}` : "no edge citation" };
  }
  // keep the sentence (it has support) but strip references the model invented, so no dead link is rendered
  const cleaned = invalid.reduce((t, id) => t.replaceAll(` [${id}]`, "").replaceAll(`[${id}]`, ""), text);
  return { type: "sentence", text: cleaned, edge_ids: [...new Set(valid)], invalid_ids: [...new Set(invalid)] };
}

/** Splits streamed text into complete sentences; returns [complete sentences, remainder]. */
export function splitSentences(buffer: string): [string[], string] {
  const sentences: string[] = [];
  const boundary = /([.!?])(\s+)(?=[A-Z0-9“"(])|\n+/g;
  let last = 0;
  for (const match of buffer.matchAll(boundary)) {
    const end = (match.index ?? 0) + (match[1] ? 1 : 0);
    sentences.push(buffer.slice(last, end));
    last = (match.index ?? 0) + match[0].length;
  }
  return [sentences.filter((s) => s.trim()), buffer.slice(last)];
}

const rel = (e: Edge, labels: Record<string, string>) => ({ S: labels[e.source] ?? e.source, T: labels[e.target] ?? e.target });

/** Deterministic text when no LLM is configured: one sentence per edge, built from its fields only. */
export function templateSentences(edges: Edge[], labels: Record<string, string>): string[] {
  const sentences: string[] = [];
  for (const e of edges) {
    const { S, T } = rel(e, labels);
    const ev = e.evidence[0];
    const source = ev ? `${ev.db}${ev.record ? ` ${ev.record}` : ""}` : "no source";
    const tag = `[${e.id}]`;
    switch (e.type) {
      case "caused_by":
        sentences.push(`${S} is annotated with the disease gene ${T} (${e.level}, ${source}) ${tag}.`);
        break;
      case "associated_gene":
        sentences.push(`${S} is associated with ${T}, but not recorded as its cause (${e.level}, ${source}) ${tag}.`);
        break;
      case "has_phenotype":
        sentences.push(`${T} is recorded as a feature of ${S} (${source}, confidence ${formatConfidence(e.confidence)}) ${tag}.`);
        break;
      case "similar_phenotype":
        sentences.push(`${S} and ${T} have similar phenotype profiles, a link computed by Constellate: ${e.formula ?? ev?.snippet ?? "formula not recorded"} ${tag}.`);
        break;
      case "shares_gene":
        sentences.push(`${S} and ${T} share a disease gene: ${e.formula ?? ev?.snippet ?? ""} ${tag}.`);
        break;
      case "in_pathway":
        sentences.push(`${S} takes part in the Reactome pathway ${T} ${tag}.`);
        break;
      case "studied_in":
        sentences.push(`${S} is the subject of the trial record ${T} (${source}) ${tag}.`);
        break;
      case "funded_by":
        sentences.push(`Research on ${S} is funded through ${T} (${source}) ${tag}.`);
        break;
      case "mentioned_in":
        sentences.push(`${S} is mentioned in ${T}, a ${e.level === "search_hit" ? "search hit that is not yet verified" : e.level} link ${tag}.`);
        break;
      default:
        sentences.push(`${S} is linked to ${T} by ${e.type.replaceAll("_", " ")} (${e.level}) ${tag}.`);
    }
    if (e.contradicting.length) {
      const dbs = [...new Set(e.contradicting.map((c) => c.db))].join(", ");
      sentences.push(`Counter-evidence for this link is recorded in ${dbs} ${tag}.`);
    }
  }
  return sentences;
}
