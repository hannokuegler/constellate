import type { Edge, EdgeLevel } from "./types";

export const LEVEL_INFO: Record<EdgeLevel, { label: string; meaning: string; dash: number[] | null }> = {
  observed: { label: "observed", meaning: "Clinically or experimentally observed, with a primary source", dash: null },
  curated: { label: "curated", meaning: "Statement from an expert-curated database", dash: null },
  text_mined: { label: "text-mined", meaning: "Extracted from literature by a model, not yet verified", dash: [6, 4] },
  inferred: { label: "inferred", meaning: "Computed by Constellate; formula and inputs shown", dash: [1, 3.5] },
  search_hit: { label: "search hit", meaning: "Literature search match, not a verified claim", dash: [6, 4] },
  contradicted: { label: "contradicted", meaning: "Only counter-evidence recorded", dash: [6, 4] },
};

export const RELATION_LABEL: Record<string, string> = {
  caused_by: "disease gene",
  associated_gene: "associated gene",
  has_phenotype: "phenotype",
  similar_phenotype: "similar phenotype profile",
  shares_gene: "shares a disease gene",
  in_pathway: "pathway",
  studied_in: "trial",
  funded_by: "grant",
  mentioned_in: "paper",
  target_score: "target association",
  advocated_by: "patient organisation",
  associated_with: "associated with",
  biomarker_of: "biomarker of",
  treated_by: "treated by",
  shares_mechanism_with: "shares mechanism with",
  causes: "causes",
  has_asset: "reusable asset",
  screened_in: "newborn screening",
  approved_therapy: "approved therapy",
  kol_overlap: "researchers active in both",
  authored_by: "authored by",
  investigator_of: "investigator of",
};

export function hasCounterEvidence(edge: Edge): boolean {
  return edge.contradicting.length > 0 || edge.level === "contradicted";
}

export function formatConfidence(value: number | undefined): string {
  return value === undefined || value === null ? "n/a" : value.toFixed(2);
}

export function formatDate(value: string | undefined): string {
  if (!value) return "undated";
  return value.length > 10 ? value.slice(0, 10) : value;
}
