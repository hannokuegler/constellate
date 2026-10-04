// Guided tour ?tour=hero&step=n (shareable). Edge ids verified against the disease and gene shards of data
// 2026-10-04+917470a (node -e over disease/MONDO_0009499.json, gene/PSAP.json, gene/GALC.json, disease/MONDO_0018868.json).
// Medical wording only from docs/MEDICAL-BACKGROUND.md (§5, §10).

export const TOUR_ID = "hero";
export const TOUR_HERO_START = "MONDO:0009499";

export interface TourStep {
  path: string;
  title: string;
  text: string;
  ids: string[];
  source: string;
  /** edge the bar can open in the evidence panel when the page has registered it */
  openEdge?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/",
    title: "Find Krabbe disease",
    text: "Every star is a real disease, gene or symptom. Search for a diagnosis, or follow the amber light to Krabbe disease.",
    ids: ["MONDO:0009499"],
    source: "MONDO",
  },
  {
    path: "/d/MONDO_0009499",
    title: "Krabbe disease → GALC",
    text: "Krabbe disease is linked to one gene, GALC. The line is curated: open it to see the source record, date and confidence.",
    ids: ["e_3dbc42738b5a"],
    source: "OMIM:245200 via HPO annotations · curated",
    openEdge: "e_3dbc42738b5a",
  },
  {
    path: "/g/PSAP",
    title: "One gene, four disease names",
    text: "One gene, PSAP, sits behind a Krabbe-like, an MLD-like and a Gaucher-like disorder, depending on which piece of the protein is broken.",
    ids: ["e_795da9c4a6cd", "e_316e60c8ee91", "e_b4f9b02250a7"],
    source: "OMIM:611722 · OMIM:249900 · OMIM:610539 · curated",
  },
  {
    path: "/d/MONDO_0009499",
    title: "Why linked: the MLD neighbour",
    text: "Krabbe disease and metachromatic leukodystrophy share symptoms. This link is inferred, so it shows its formula instead of a citation.",
    ids: ["e_e270315fe572"],
    source: "Constellate analytics, phenotype similarity · inferred",
    openEdge: "e_e270315fe572",
  },
  {
    path: "/d/MONDO_0009499/action?via=MONDO_0018868",
    title: "Action card",
    text: "What transfers from the MLD community, what differs and what needs expert review. Every sentence cites an edge.",
    ids: ["e_e270315fe572"],
    source: "built from cited edges only",
  },
  {
    path: "/d/MONDO_0012720",
    title: "Honest gap",
    text: "Krabbe disease due to saposin A deficiency: where the data runs out, Constellate shows what was searched instead of guessing.",
    ids: ["e_795da9c4a6cd"],
    source: "OMIM:611722 · curated",
  },
];

export function tourHref(path: string, step: number): string {
  return `${path}${path.includes("?") ? "&" : "?"}tour=${TOUR_ID}&step=${step}`;
}
