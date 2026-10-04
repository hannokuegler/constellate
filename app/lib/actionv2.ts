// Action Card v2: reusable assets, approved therapies, newborn screening, researchers bridging diseases, prevalence.
// Pure view model. Nothing is invented: a section shows what the disease shards carry, or says why it is empty.
import type { DiseaseFile, Edge, EdgeLevel, Meta, SearchLog, V2Item } from "./types";
import { sourceHref, v2Assets, v2Kol, v2Prevalence, v2Screening, v2Therapies } from "./normalize";
import { formatDate } from "./evidence";
import { studyCaveat, therapyCaveat } from "./actioncard";

export interface V2Source {
  label: string;
  href: string | null;
}

export interface V2Row {
  key: string;
  title: string;
  chips: string[];
  detail?: string;
  /** what this row does NOT say, shown next to it: a neighbour's therapy or study never transfers on its own */
  caveat?: string;
  /** verbatim snippet from the source, as stored on the evidence */
  snippet?: string;
  sources: V2Source[];
  level: EdgeLevel;
  edgeId?: string;
}

export interface V2Group {
  /** which disease the rows belong to ("pair" = the link between the two) */
  role: "own" | "via" | "pair";
  diseaseLabel: string;
  state: "items" | "gap" | "pending";
  rows: V2Row[];
  /** gap or pending sentence when state is not "items" */
  note?: string;
}

export interface V2Section {
  key: "assets" | "therapies" | "screening" | "researchers" | "prevalence";
  title: string;
  hint: string;
  groups: V2Group[];
}

export interface V2Model {
  sections: V2Section[];
  edges: Edge[];
  labels: Record<string, string>;
  fixture: boolean;
}

const DEFAULT_SOURCES = {
  assets: "ClinicalTrials.gov (observational studies), Europe PMC, curated asset list",
  therapies: "EMA medicine list, openFDA drug labels",
  screening: "official newborn-screening programme pages",
  researchers: "Europe PMC authors, NIH RePORTER investigators, ClinicalTrials.gov officials",
  prevalence: "Orphanet epidemiology data",
} as const;

const ASSET_ORDER = ["natural_history_study", "registry", "outcome_scale", "biobank"];
const ASSET_LABEL: Record<string, string> = {
  natural_history_study: "Natural history study",
  registry: "Registry",
  outcome_scale: "Outcome scale",
  biobank: "Biobank",
};
const SCREEN_ORDER = ["screened", "pilot/research", "not screened"];

function asOf(searched: SearchLog[], builtAt?: string): string {
  const dates = searched.map((s) => s.retrieved).filter((d): d is string => Boolean(d)).sort();
  const date = dates[dates.length - 1] ?? builtAt;
  return date ? formatDate(date) : "the last data build";
}

function gapNote(key: keyof typeof DEFAULT_SOURCES, searched: SearchLog[], builtAt?: string): string {
  const sources = searched.length ? searched.map((s) => s.source).join(", ") : DEFAULT_SOURCES[key];
  return `Not found in ${sources} as of ${asOf(searched, builtAt)}.`;
}

function pendingNote(noun: string, label: string): string {
  return `Data pending: the pipeline has not delivered ${noun} for ${label} yet, so nothing is shown instead of a guess.`;
}

function dedupe(sources: V2Source[]): V2Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const k = s.href ?? s.label;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function evidenceSources(edge: Edge, extra: V2Source[] = []): V2Source[] {
  return dedupe([
    ...edge.evidence.map((ev) => ({ label: `${ev.db}${ev.record ? ` ${ev.record}` : ""}`, href: sourceHref(ev.db, ev.record, ev.url) })),
    ...extra,
  ]);
}

function itemRow<N extends { id: string; label: string }>(item: V2Item<N>, chips: (string | null | undefined)[], extra: V2Source[] = []): V2Row {
  const ev = item.edge.evidence[0];
  return {
    key: item.edge.id,
    title: item.node.label,
    chips: chips.filter((c): c is string => Boolean(c)),
    snippet: ev?.snippet,
    sources: evidenceSources(item.edge, extra),
    level: item.edge.level,
    edgeId: item.edge.id,
  };
}

/** Studies and registries are "studies"; scales and biobanks get the same caveat in their own words. */
function assetCaveat(row: V2Row, neighbour: string, disease: string): string {
  return /^(Natural history study|Registry)$/.test(row.chips[0] ?? "")
    ? `${studyCaveat(neighbour, disease)}.`
    : `Recorded for ${neighbour}; whether it fits ${disease} is a question for clinical experts.`;
}

type Side = { file: DiseaseFile | null; label: string; role: "own" | "via" };

function twoSides<T>(
  sides: Side[],
  read: (file: DiseaseFile) => { present: boolean; items: T[]; searched: SearchLog[] },
  key: keyof typeof DEFAULT_SOURCES,
  noun: string,
  toRows: (items: T[], side: Side) => V2Row[],
  builtAt?: string,
): V2Group[] {
  return sides.map((side) => {
    const { file, label, role } = side;
    if (!file) return { role, diseaseLabel: label, state: "pending", rows: [], note: pendingNote(noun, label) };
    const r = read(file);
    if (!r.present) return { role, diseaseLabel: label, state: "pending", rows: [], note: pendingNote(noun, label) };
    const rows = toRows(r.items, side);
    if (!rows.length) return { role, diseaseLabel: label, state: "gap", rows: [], note: gapNote(key, r.searched, builtAt) };
    return { role, diseaseLabel: label, state: "items", rows };
  });
}

export function buildV2(disease: DiseaseFile, viaFile: DiseaseFile | null, via: { id: string; label: string }, meta?: Meta | null): V2Model {
  const builtAt = meta?.built_at;
  const D = disease.node.label;
  const sides: Side[] = [
    { file: disease, label: D, role: "own" },
    { file: viaFile, label: via.label, role: "via" },
  ];

  const assets = twoSides(
    sides,
    (f) => v2Assets(f),
    "assets",
    "registries, natural history studies or outcome scales",
    (items, side) =>
      items
        .filter((i) => ASSET_ORDER.includes(i.node.asset_type))
        .sort((a, b) => ASSET_ORDER.indexOf(a.node.asset_type) - ASSET_ORDER.indexOf(b.node.asset_type))
        .map((i) =>
          itemRow(i, [ASSET_LABEL[i.node.asset_type], i.node.country, i.node.status, i.node.check === "UNBELEGT" ? "UNBELEGT" : null], [
            ...(i.node.source_id || i.node.url ? [{ label: `${i.node.source_type ?? "Source"}${i.node.source_id ? ` ${i.node.source_id}` : ""}`, href: sourceHref(i.node.source_type, i.node.source_id, i.node.url) }] : []),
          ]),
        )
        .map((row) => (side.role === "via" ? { ...row, caveat: assetCaveat(row, via.label, D) } : row)),
    builtAt,
  );

  const therapies = twoSides(
    sides,
    (f) => v2Therapies(f),
    "therapies",
    "approved therapies",
    (items, side) =>
      items.map((i) => {
        const ev = i.edge.evidence[0];
        const date = i.node.approved ?? ev?.date;
        const row = itemRow(i, [i.node.authority ?? ev?.db, date ? `approved ${formatDate(date)}` : "approval date not recorded", i.node.holder]);
        return side.role === "via" ? { ...row, caveat: `${therapyCaveat(via.label, D)}.` } : row;
      }),
    builtAt,
  );

  const screening = twoSides(
    sides,
    (f) => v2Screening(f),
    "screening",
    "newborn screening status",
    (items) =>
      [...items]
        .sort((a, b) => SCREEN_ORDER.indexOf(a.node.status ?? "") - SCREEN_ORDER.indexOf(b.node.status ?? "") || a.node.label.localeCompare(b.node.label))
        .map((i) => itemRow(i, [i.node.status ?? "status not recorded"], i.node.url ? [{ label: "Programme page", href: i.node.url }] : [])),
    builtAt,
  );

  // researchers: the entry that links the two diseases, taken from whichever shard carries it
  const own = v2Kol(disease);
  const other = viaFile ? v2Kol(viaFile) : null;
  const pair = own.items.find((k) => k.disease.id === via.id) ?? other?.items.find((k) => k.disease.id === disease.node.id);
  const searched = [...own.searched, ...(other?.searched ?? [])];
  let researchers: V2Group;
  if (!own.present && !other?.present) {
    researchers = { role: "pair", diseaseLabel: `${D} and ${via.label}`, state: "pending", rows: [], note: pendingNote("researcher overlap", `${D} and ${via.label}`) };
  } else if (!pair || !pair.people.length) {
    researchers = { role: "pair", diseaseLabel: `${D} and ${via.label}`, state: "gap", rows: [], note: gapNote("researchers", searched, builtAt) };
  } else {
    researchers = {
      role: "pair",
      diseaseLabel: `${D} and ${via.label}`,
      state: "items",
      rows: pair.people.map((p) => ({
        key: `${pair.edge.id}-${p.name}`,
        title: p.name,
        chips: [p.affiliation, p.orcid ? `ORCID ${p.orcid}` : null].filter((c): c is string => Boolean(c)),
        detail: `Active in both diseases, ${p.records.length} record${p.records.length === 1 ? "" : "s"}`,
        snippet: undefined,
        sources: dedupe(p.records.map((r) => ({ label: `${r.db} ${r.record}`, href: sourceHref(r.db, r.record, r.url) }))),
        level: pair.edge.level,
        edgeId: pair.edge.id,
      })),
    };
    const formula = pair.edge.formula ?? pair.edge.evidence[0]?.snippet;
    if (formula) researchers.note = formula;
  }

  const prevalence = sides.map<V2Group>(({ file, label, role }) => {
    if (!file) return { role, diseaseLabel: label, state: "pending", rows: [], note: pendingNote("a prevalence record", label) };
    const r = v2Prevalence(file);
    if (!r.present) return { role, diseaseLabel: label, state: "pending", rows: [], note: pendingNote("a prevalence record", label) };
    if (!r.items.length) return { role, diseaseLabel: label, state: "gap", rows: [], note: gapNote("prevalence", [], builtAt) };
    return {
      role,
      diseaseLabel: label,
      state: "items",
      rows: r.items.map((p, i) => ({
        key: `${file.node.id}-prev-${i}`,
        title: [p.value, p.class].filter(Boolean).join(" · ") || "value not recorded",
        chips: [p.type, p.region, p.validation].filter((c): c is string => Boolean(c)),
        sources: p.source ? [{ label: `${p.source.db}${p.source.record ? ` ${p.source.record}` : ""}`, href: sourceHref(p.source.db, p.source.record, p.source.url) }] : [],
        level: p.level ?? "curated",
      })),
    };
  });

  const sections: V2Section[] = [
    { key: "assets", title: "Reusable assets", hint: "Natural history studies, registries and outcome scales that already exist", groups: assets },
    { key: "therapies", title: "Approved therapies", hint: "Authorised by EMA or FDA, with the date", groups: therapies },
    { key: "screening", title: "Newborn screening by country", hint: "Official programme status", groups: screening },
    { key: "researchers", title: "Researchers bridging diseases", hint: "People with records in both diseases", groups: [researchers] },
    { key: "prevalence", title: "Prevalence", hint: "Orphanet", groups: prevalence },
  ];

  const edges = new Map<string, Edge>();
  const labels: Record<string, string> = {};
  for (const f of [disease, viaFile]) {
    if (!f) continue;
    for (const read of [v2Assets(f), v2Therapies(f), v2Screening(f)]) {
      for (const i of read.items) {
        edges.set(i.edge.id, i.edge);
        labels[i.node.id] = i.node.label;
      }
    }
    for (const k of v2Kol(f).items) {
      edges.set(k.edge.id, k.edge);
      labels[k.disease.id] = k.disease.label;
    }
  }
  labels[disease.node.id] = D;
  labels[via.id] = via.label;

  return { sections, edges: [...edges.values()], labels, fixture: Boolean(disease.fixture_v2 || viaFile?.fixture_v2) };
}

export function v2Markdown(model: V2Model): string {
  const lines: string[] = [];
  if (model.fixture) lines.push("_FIXTURE data for development, not pipeline output._", "");
  for (const section of model.sections) {
    lines.push(`## ${section.title}`, "");
    for (const group of section.groups) {
      lines.push(`**${group.diseaseLabel}**`, "");
      if (group.state !== "items") {
        lines.push(`- ${group.note}`, "");
        continue;
      }
      for (const row of group.rows) {
        const src = row.sources.map((s) => (s.href ? `[${s.label}](${s.href})` : s.label)).join(", ");
        lines.push(`- ${row.title}${row.chips.length ? ` (${row.chips.join("; ")})` : ""}. Evidence level: ${row.level}.${src ? ` Source: ${src}.` : ""}${row.edgeId ? ` [${row.edgeId}]` : ""}${row.caveat ? ` ${row.caveat}` : ""}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}
