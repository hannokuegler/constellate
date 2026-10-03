// Server-only: key and shape of precomputed explanations in public/data/explain/ (written by scripts/precompute-explain.ts).
import { createHash } from "node:crypto";
import type { ExplainEvent } from "./explain";

/** One file per edge set: the same edges always map to the same key, independent of order. */
export function explainKey(edgeIds: Iterable<string>): string {
  return createHash("sha1").update([...new Set(edgeIds)].sort().join("|")).digest("hex").slice(0, 16);
}

export interface PrecomputedExplain {
  key: string;
  edge_ids: string[];
  from: string;
  via: string;
  model: string;
  prompt_sha: string;
  audience: string;
  generated_at: string;
  sentences: Extract<ExplainEvent, { type: "sentence" }>[];
  dropped: Extract<ExplainEvent, { type: "dropped" }>[];
}
