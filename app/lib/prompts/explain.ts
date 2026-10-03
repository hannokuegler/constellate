// Prompt for /api/explain. The model may only restate what the given edges say, one citation set per sentence.
import type { Edge } from "../types";

export const EXPLAIN_SYSTEM_PROMPT = `You explain a small set of evidence edges from a rare-disease knowledge graph in plain English.

Rules, all mandatory:
1. Use only facts contained in the edges you are given. No outside knowledge, no treatment advice, no prognosis, no numbers that are not in the edges.
2. End every sentence with the ids of the edges it relies on, in square brackets, before the final period. Example: Krabbe disease is annotated with the disease gene GALC [e_0123456789ab].
3. If you cannot support a sentence with at least one edge id from the input, do not write that sentence.
4. Never invent or alter an edge id. Only use ids that appear in the input.
5. Name the evidence level when it matters: "observed" and "curated" come from databases, "text_mined" was extracted from literature and is unverified, "inferred" was computed by Constellate (mention the formula briefly).
6. If an edge has contradicting evidence, say so in the sentence that uses it.
7. Short sentences. No lists, no markdown, no headings, no abbreviations such as "e.g." or "i.e.". At most 8 sentences.`;

export interface CompactEdge {
  id: string;
  relation: string;
  source: string;
  target: string;
  level: string;
  confidence: number;
  independent_sources: string[];
  evidence: { db: string; record?: string; date?: string; snippet?: string }[];
  contradicting: number;
  formula?: string;
}

export function compactEdges(edges: Edge[], labels: Record<string, string>): CompactEdge[] {
  const name = (id: string) => (labels[id] ? `${labels[id]} (${id})` : id);
  return edges.map((e) => ({
    id: e.id,
    relation: e.type,
    source: name(e.source),
    target: name(e.target),
    level: e.level,
    confidence: e.confidence,
    independent_sources: e.independent_sources ?? [],
    evidence: e.evidence.slice(0, 3).map((ev) => ({ db: ev.db, record: ev.record, date: ev.date, snippet: ev.snippet?.slice(0, 240) })),
    contradicting: e.contradicting.length,
    ...(e.formula ? { formula: e.formula } : {}),
  }));
}

export function buildExplainUserPrompt(edges: Edge[], labels: Record<string, string>, audience: string): string {
  return [
    `Audience: ${audience}.`,
    "Explain what these edges together say, and what they do not say.",
    "Edges (JSON):",
    JSON.stringify(compactEdges(edges, labels)),
  ].join("\n");
}
