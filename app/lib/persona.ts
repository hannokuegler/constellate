import type { NodeType } from "./types";

export type PersonaId = "nora" | "devon" | "priya" | "osei";
export type PanelSection = "neighbours" | "genes" | "phenotypes" | "research";

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  goal: string;
  placeholder: string;
  /** subtracted from the Fuse score (lower is better) for matching result types */
  typeBoost: Partial<Record<NodeType, number>>;
  panelOrder: PanelSection[];
  graphPhenotypes: number;
  wording: { neighbours: string; neighboursHint: string };
}

export const PERSONAS: Persona[] = [
  {
    id: "nora",
    name: "Nora (Maria)",
    role: "Patient-group leader",
    goal: "Find a related community and assets to reuse",
    placeholder: "Search a disease, gene, symptom or ID",
    typeBoost: { disease: 0.06 },
    panelOrder: ["neighbours", "genes", "phenotypes", "research"],
    graphPhenotypes: 8,
    wording: { neighbours: "Related communities", neighboursHint: "Diseases linked by shared genes or phenotypes" },
  },
  {
    id: "devon",
    name: "Devon",
    role: "Looking for a diagnosis",
    goal: "Go from symptoms to candidate diseases",
    placeholder: "Type a symptom, e.g. spasticity",
    typeBoost: { phenotype: 0.12 },
    panelOrder: ["phenotypes", "neighbours", "genes", "research"],
    graphPhenotypes: 14,
    wording: { neighbours: "Diseases with similar symptoms", neighboursHint: "Ranked by phenotype overlap" },
  },
  {
    id: "priya",
    name: "Priya",
    role: "Funder / programme lead",
    goal: "See trials, grants and mechanism clusters",
    placeholder: "Search a disease, gene or mechanism",
    typeBoost: { disease: 0.04 },
    panelOrder: ["research", "neighbours", "genes", "phenotypes"],
    graphPhenotypes: 6,
    wording: { neighbours: "Mechanism neighbours", neighboursHint: "Candidates for a shared programme" },
  },
  {
    id: "osei",
    name: "Dr. Osei",
    role: "Researcher",
    goal: "Trace a gene across disease names",
    placeholder: "Search a gene, OMIM/ORPHA ID or disease",
    typeBoost: { gene: 0.12 },
    panelOrder: ["genes", "neighbours", "phenotypes", "research"],
    graphPhenotypes: 10,
    wording: { neighbours: "Related diseases", neighboursHint: "Shared genes, phenotypes and pathways" },
  },
];

export const DEFAULT_PERSONA: PersonaId = "nora";

export function personaById(id: string | null | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
