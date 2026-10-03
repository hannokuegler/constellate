import type { NodeType } from "./types";

export type PersonaId = "family" | "nora" | "devon" | "priya" | "osei";
export type PanelSection = "community" | "studies" | "neighbours" | "genes" | "phenotypes" | "research";

export interface Persona {
  id: PersonaId;
  /** the two moments of one mother (start page cards); other lenses are secondary */
  moment?: { step: string; title: string; text: string };
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
    id: "family",
    moment: {
      step: "Moment 1 · the first nights",
      title: "We just got the diagnosis",
      text: "Find families like yours, or an honest answer if there is no group yet, and studies that are looking for children like yours.",
    },
    name: "Just diagnosed",
    role: "Parent or caregiver",
    goal: "Find a community and open studies",
    placeholder: "Type your child's diagnosis, e.g. Krabbe",
    typeBoost: { disease: 0.1, org: 0.06 },
    panelOrder: ["community", "studies", "neighbours", "phenotypes", "genes"],
    graphPhenotypes: 6,
    wording: { neighbours: "Families with a related diagnosis", neighboursHint: "Other diseases that share a gene or a pattern of symptoms: their groups may help" },
  },
  {
    id: "nora",
    moment: {
      step: "Moment 2 · months later",
      title: "I lead a patient group",
      text: "Find related communities, a study or registry you can join instead of building it, and send a sourced proposal.",
    },
    name: "Group leader (Maria)",
    role: "Patient-group leader",
    goal: "Find a related community and assets to reuse",
    placeholder: "Search a disease, gene, symptom or ID",
    typeBoost: { disease: 0.06, org: 0.06 },
    panelOrder: ["neighbours", "studies", "genes", "phenotypes", "research"],
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
    panelOrder: ["phenotypes", "neighbours", "genes", "research", "studies"],
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
    panelOrder: ["research", "studies", "neighbours", "genes", "phenotypes"],
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
    panelOrder: ["genes", "neighbours", "phenotypes", "research", "studies"],
    graphPhenotypes: 10,
    wording: { neighbours: "Related diseases", neighboursHint: "Shared genes, phenotypes and pathways" },
  },
];

export const DEFAULT_PERSONA: PersonaId = "family";

export function personaById(id: string | null | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
