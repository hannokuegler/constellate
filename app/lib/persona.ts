import type { NodeType } from "./types";

/** There is one fixed view for everybody; the persona object stays only because lib/search.ts ranks with it. */
export type PersonaId = "default";
export type PanelSection = "community" | "studies" | "neighbours" | "genes" | "phenotypes" | "research";

export interface Persona {
  id: PersonaId;
  placeholder: string;
  /** subtracted from the Fuse score (lower is better) for matching result types */
  typeBoost: Partial<Record<NodeType, number>>;
  panelOrder: PanelSection[];
  graphPhenotypes: number;
  wording: { neighbours: string; neighboursHint: string };
}

export const DEFAULT_PERSONA_VIEW: Persona = {
  id: "default",
  placeholder: "Search a disease, gene or symptom, e.g. Krabbe",
  typeBoost: { disease: 0.08, org: 0.06 },
  // own community (or the honest gap) first, then related communities, then studies
  panelOrder: ["community", "neighbours", "studies", "genes", "phenotypes", "research"],
  graphPhenotypes: 7,
  wording: {
    neighbours: "Related communities",
    neighboursHint: "Other diseases that share a gene or a pattern of symptoms: their families, groups and studies may help",
  },
};

export const PERSONAS: Persona[] = [DEFAULT_PERSONA_VIEW];
