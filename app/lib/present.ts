// Presentation helpers: turn pipeline strings and numbers into wording a reader can use. No data is changed, only how it reads.
import type { Edge } from "./types";

const ORDINAL_SUFFIX = ["th", "st", "nd", "rd"];

/** 1 -> "1st", 2 -> "2nd", 7 -> "7th", 11 -> "11th", 22 -> "22nd". */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : ORDINAL_SUFFIX[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** Phenotype-similarity edges carry a simGIC score, which is an overlap measure and not a probability. */
export function isSimilarityEdge(edge: Pick<Edge, "type">): boolean {
  return edge.type === "similar_phenotype";
}

/** Everything the pipeline computes itself (not copied from a database): "07_analytics@917470a". */
const COMPUTED_RECORD = /^(\d{2})_[a-z_]+@([0-9a-f]{6,})$/i;

export function computedRecord(record: string | undefined | null): { step: string; build: string } | null {
  const match = record ? COMPUTED_RECORD.exec(record) : null;
  return match ? { step: match[1], build: match[2] } : null;
}

export function computedRecordLabel(record: string): string | null {
  const parsed = computedRecord(record);
  return parsed ? `Computed by Constellate (pipeline step ${parsed.step}, build ${parsed.build})` : null;
}

/**
 * simGIC bands in words. The thresholds come from the distribution of all 1,965 phenotype-similarity edges in this build:
 * median 0.21, top quarter from 0.25, top tenth from 0.30, maximum 0.78 (and the pipeline's counter-example floor is 0.15).
 * So 0.30 and above is "closely related" (about the top 10 %), 0.20 up to 0.30 "somewhat related" (the broad middle), below 0.20 "loosely related".
 */
export function similarityWords(simgic: number | undefined | null): "closely related" | "somewhat related" | "loosely related" | null {
  if (simgic === undefined || simgic === null || Number.isNaN(simgic)) return null;
  if (simgic >= 0.3) return "closely related";
  if (simgic >= 0.2) return "somewhat related";
  return "loosely related";
}

const RANK = /rank\s+(\d+)\s*\/\s*(\d+|[–-])/;

/**
 * "rank 7/2" in the pipeline means: this disease is the 7th closest for the edge's source, and the source is the 2nd closest for the target.
 * A dash means the other side did not keep the pair in its list of closest diseases.
 */
export function rankSentence(text: string, sourceLabel: string, targetLabel: string): string | null {
  const match = RANK.exec(text);
  if (!match) return null;
  const sourceRank = Number(match[1]);
  const targetRank = /^\d+$/.test(match[2]) ? Number(match[2]) : null;
  return `${targetLabel} is the ${ordinal(sourceRank)} closest to ${sourceLabel}${targetRank !== null ? ` and ${sourceLabel} is the ${ordinal(targetRank)} closest to ${targetLabel}` : `, but ${sourceLabel} is not among the closest ones listed for ${targetLabel}`}`;
}

/** Replaces "rank 7/2" inside a formula or snippet by words; text without a rank is returned unchanged. */
export function humanizeRank(text: string, sourceLabel: string, targetLabel: string): string {
  const sentence = rankSentence(text, sourceLabel, targetLabel);
  return sentence ? text.replace(RANK, sentence) : text;
}

/** Trial phase as a reader sees it: the registry's "n/a" means "no phase" (observational or non-drug study), never shown raw. */
export function phaseText(node: Record<string, unknown>, raw: string | null): string | null {
  if (!raw) return null;
  if (!/^n\/?a$/i.test(raw.trim())) return raw;
  return node.study_type === "OBSERVATIONAL" ? "Observational (no phase)" : null;
}

/** Registry flags such as "patientRegistry: true" in plain words. Anything else is returned unchanged. */
export function plainSnippet(text: string | undefined): string | undefined {
  const match = text ? /^([a-z][A-Za-z]+):\s*(true|false)$/.exec(text.trim()) : null;
  if (!match) return text;
  const words = match[1].replace(/([A-Z])/g, " $1").toLowerCase().trim();
  return match[2] === "true" ? `The study record says it has a ${words}` : `The study record says it has no ${words}`;
}
