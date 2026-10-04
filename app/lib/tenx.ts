// The 10x case (brief: "Think Bigger: The 10x Moonshot"). One milestone, two routes, every week labelled.
// Milestone: the first family's data enters a natural-history registry or study.
// Route data per disease comes from public/impact/tenx.json (scripts/build-tenx.mjs); the weeks below are the model.
import type { Edge } from "./types";

export type StepKind = "atlas" | "published" | "anchored" | "assumption";
export type Route = "join" | "extend" | "gap";

export interface TenxAsset {
  id: string;
  label: string;
  type: string;
  status: string | null;
  record: string | null;
  url: string | null;
  sponsor: string | null;
  start: string | null;
  end: string | null;
  enrollment: number | null;
  last_update: string | null;
  retrieved: string | null;
  countries: string[] | null;
  open_sites: number | null;
  named_by: number;
  edge: Edge;
}

export interface TenxDisease {
  id: string;
  label: string;
  is_group: boolean;
  route: Route;
  asset: TenxAsset | null;
  via: { id: string; label: string; relation: string; shared_genes: string[]; shared_mechanism: string[]; edge: Edge } | null;
  own_total: number;
  own_open: number;
  alternatives: number;
}

export interface TenxFile {
  version: string;
  milestone: string;
  core_total: number;
  counts: Record<Route, number>;
  diseases: TenxDisease[];
}

export interface Step {
  id: string;
  title: string;
  kind: StepKind;
  lo: number;
  hi: number;
  note: string;
  /** how to replace the assumption with a measured number */
  check?: string;
  source?: { label: string; url: string };
  /** the edge behind an atlas step, opened in the evidence panel */
  edge?: Edge;
}

export const KIND_LABEL: Record<StepKind, string> = {
  atlas: "From the atlas",
  published: "Published figure",
  anchored: "Assumption on a published figure",
  assumption: "Assumption",
};

const KRABBE_FAMILY = new Set(["MONDO:0009499", "MONDO:0012720"]);

/** The usual route: the group builds its own registry. Same for every disease, only the context line changes. */
export function buildRoute(d: TenxDisease): Step[] {
  const krabbe = KRABBE_FAMILY.has(d.id) || d.via?.id === "MONDO:0009499";
  return [
    {
      id: "b-search",
      title: "Search by hand for anything reusable",
      kind: "assumption",
      lo: 4,
      hi: 12,
      note: "Trial registries, papers and group websites, one by one, without knowing which neighbouring diseases share the mechanism.",
      check: "Ask three patient-group leaders how long their search took.",
    },
    {
      id: "b-protocol",
      title: "Write a protocol and secure funding",
      kind: "assumption",
      lo: 12,
      hi: 26,
      note: "A small group drafts its own registry protocol, data dictionary and grant.",
      check: "Ask groups that have built a registry, for example via the NCATS toolkit.",
      source: { label: "NCATS toolkit: starting a registry", url: "https://toolkit.ncats.nih.gov/module/discovery/starting-a-patient-registry-natural-history-study-database/" },
    },
    {
      id: "b-ethics",
      title: "Ethics approval and the first site opened",
      kind: "assumption",
      lo: 20,
      hi: 35,
      note: "Ethics committee, contracts and site start-up after the money is in place.",
      check: "Replace with a published study-activation benchmark; we have not verified one yet.",
    },
    {
      id: "b-enrol",
      title: "Find and enrol the first family",
      kind: krabbe ? "anchored" : "assumption",
      lo: 12,
      hi: 52,
      note: krabbe
        ? "A new registry starts with no participants. One specialised Krabbe centre followed 35 patients over 17 years (2000 to 2017), about two a year; the range of weeks is our reading of that rate."
        : "A new registry starts with no participants, and an ultra-rare disease has few families to find.",
      check: "Compare with enrolment logs of other ultra-rare registries.",
      source: krabbe ? { label: "Bascou 2018, PMID 30089515", url: "https://pubmed.ncbi.nlm.nih.gov/30089515/" } : undefined,
    },
  ];
}

const monthsBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / (1000 * 60 * 60 * 24 * 30.44);

/** Has the registered end date passed on the day we retrieved the record? */
export function endPassed(a: TenxAsset): boolean {
  if (!a.end || !a.retrieved) return false;
  const end = a.end.length === 7 ? `${a.end}-28` : a.end;
  return Date.parse(end) < Date.parse(a.retrieved);
}

/** Recently updated, still open and not past its end date: the first e-mail is a formality, not an investigation. */
export function looksCurrent(a: TenxAsset): boolean {
  const fresh = a.last_update && a.retrieved ? monthsBetween(a.last_update, a.retrieved) <= 12 : false;
  return fresh && !endPassed(a);
}

const statusWords = (s: string | null) => (s ? s.toLowerCase().replaceAll("_", " ") : "unknown");

export function assetName(a: TenxAsset): string {
  return `${a.label}${a.record ? ` (${a.record})` : ""}`;
}

/** Constellate's route: join what exists, or ask a mechanistic neighbour's study to extend. Empty for a gap. */
export function atlasRoute(d: TenxDisease): Step[] {
  const a = d.asset;
  if (!a || d.route === "gap") return [];
  const current = looksCurrent(a);
  const confirm: Step = {
    id: "c-confirm",
    title: "Confirm with the study team that it still enrols",
    kind: "assumption",
    lo: current ? 1 : 2,
    hi: current ? 4 : 8,
    note: `Registered status ${statusWords(a.status)}${a.last_update ? `, record last updated ${a.last_update}` : ""}${
      a.end ? `, registered end ${a.end}${endPassed(a) ? " (already passed, so the first e-mail asks whether it is extended)" : ""}` : ""
    }.`,
    check: "Record how long the study team takes to reply.",
  };
  const consent: Step = {
    id: "c-consent",
    title: "The first family consents at a site that is already running",
    kind: "assumption",
    lo: 2,
    hi: 8,
    note: `No new protocol and no new ethics approval for the group: families consent into an existing study${
      a.open_sites ? `, ${a.open_sites} open site${a.open_sites === 1 ? "" : "s"}${a.countries?.length ? ` in ${a.countries.join(", ")}` : ""}` : ""
    }.`,
    check: "Ask the study team for their consent-to-first-data time.",
  };

  if (d.route === "join") {
    return [
      {
        id: "c-find",
        title: "Find the open study that already names the disease",
        kind: "atlas",
        lo: 0,
        hi: 1,
        note: `${assetName(a)} lists ${d.label} as a condition on ClinicalTrials.gov${a.retrieved ? ` (retrieved ${a.retrieved})` : ""}. Found in one search; the week to read it with an expert is our assumption.`,
        edge: a.edge,
      },
      confirm,
      consent,
    ];
  }

  const via = d.via!;
  const why = via.shared_genes.length
    ? `the same gene (${via.shared_genes.join(", ")})`
    : via.shared_mechanism.length
      ? `the same mechanism class (${via.shared_mechanism[0].split(" (")[0]}) and similar symptoms`
      : "a computed link";
  return [
    {
      id: "c-find",
      title: "Find an open study at a disease with the same mechanism",
      kind: "atlas",
      lo: 0,
      hi: 1,
      note: `No open study names ${d.label}. ${via.label} shares ${why}, and ${assetName(a)} is open for it. A name search would not find this.`,
      edge: via.edge,
    },
    {
      id: "c-review",
      title: "Expert review: does the shared mechanism make the families eligible?",
      kind: "assumption",
      lo: 2,
      hi: 6,
      note: "Same mechanism is not the same eligibility. A clinician or the study's scientific lead decides whether the families fit the protocol.",
      check: "Record the review time with the first expert asked.",
    },
    {
      id: "c-amend",
      title: "The study adds the disease (protocol and ethics amendment)",
      kind: "assumption",
      lo: 8,
      hi: 20,
      note: "An amendment to a running study instead of a new study: the protocol, data dictionary and sites already exist.",
      check: "Ask the study team how long their last amendment took.",
    },
    { ...confirm, id: "c-confirm", title: "Confirm the study still enrols and agree how the group sees its data", lo: confirm.lo, hi: confirm.hi },
    consent,
  ];
}

export interface Range {
  lo: number;
  hi: number;
}

export const total = (steps: Step[], w: Record<string, Range>): Range =>
  steps.reduce((s, st) => ({ lo: s.lo + (w[st.id]?.lo ?? st.lo), hi: s.hi + (w[st.id]?.hi ?? st.hi) }), { lo: 0, hi: 0 });

/** Speed-up range: our worst case against their best case, our best against their worst; mid uses both midpoints. */
export function speedup(build: Range, atlas: Range): { lo: number; hi: number; mid: number } | null {
  if (atlas.hi <= 0) return null;
  const lo = build.lo / atlas.hi;
  const hi = build.hi / Math.max(atlas.lo, 0.5);
  const mid = (build.lo + build.hi) / 2 / Math.max((atlas.lo + atlas.hi) / 2, 0.5);
  return { lo, hi, mid };
}

export const fmtX = (v: number) => (v >= 10 ? `${Math.round(v)}×` : `${v.toFixed(1)}×`);

/** What a team has to check before the speed-up is real. Generated from the record, not written per disease. */
export function validateNext(d: TenxDisease): string[] {
  const a = d.asset;
  if (!a) return [];
  const out: string[] = [];
  out.push(
    `${a.label} still enrols: registered status ${statusWords(a.status)}${a.last_update ? `, last updated ${a.last_update}` : ""}.`,
  );
  if (endPassed(a)) out.push(`Its registered end date (${a.end}) has passed: ask whether enrolment is extended.`);
  if (d.route === "extend" && d.via)
    out.push(`${d.label} fits its protocol. Our link is ${d.via.relation === "shares_gene" ? "a shared gene" : "a shared mechanism class plus similar symptoms"}, not an eligibility decision.`);
  else out.push(`It accepts the group's genotypes and age range.`);
  if (a.named_by > 3) out.push(`It names ${a.named_by} diseases in our data: check that ${d.label} families get their own analysis, not only a row.`);
  out.push("Its consent terms let the group see and reuse the data it contributes.");
  out.push("Each assumption above, by recording the real number of weeks with the first family.");
  return out;
}
