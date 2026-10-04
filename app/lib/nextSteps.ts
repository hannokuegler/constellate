// "What you can do now": a plain-language view model over one disease shard (and, on demand, a few related shards).
// Pure functions, nothing invented: every row carries the edge it came from, a source link and a date.
import type { DiseaseFile, Edge, EnrichmentItem, OrgCard, SearchLog } from "./types";
import { openTrials, orgItems, sourceHref, trialStatusLabel, v2Assets, v2Therapies } from "./normalize";
import { familyKey } from "./nextFamily";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-03" or an ISO timestamp -> "3 Oct 2026"; null when there is no date */
export function plainDate(value: string | null | undefined): string | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null;
}

// ---------------------------------------------------------------------------------------------------
// countries: the "Where do you live?" choice of the studies block also orders groups and next steps

const foldName = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s*\(.*\)\s*$/, "").trim();

/** English country name for a two-letter code ("DE" -> "Germany", "GB" -> "United Kingdom"); a name is returned as it is. */
export function countryName(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (v === "INT") return "International";
  if (!/^[A-Z]{2}$/.test(v)) return v;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(v === "UK" ? "GB" : v) ?? v;
  } catch {
    return v;
  }
}

/** Does a country (code or name) mean the chosen country? "DE" matches "Germany", "Turkey (Türkiye)" matches "Turkey". */
export function sameCountry(value: string | null | undefined, chosen: string | null | undefined): boolean {
  if (!value || !chosen) return false;
  return foldName(countryName(value)) === foldName(chosen);
}

/** A real country choice (not "All countries", not "Country not listed"). */
export const isCountry = (chosen: string | null | undefined): chosen is string => Boolean(chosen) && chosen !== "(none)";

/** Stable sort: rows in the chosen country first, the rest in their order. */
export function inCountryFirst<T>(rows: T[], countryOf: (row: T) => string | null | undefined, chosen: string | null | undefined): T[] {
  if (!isCountry(chosen)) return rows;
  return [...rows.filter((r) => sameCountry(countryOf(r), chosen)), ...rows.filter((r) => !sameCountry(countryOf(r), chosen))];
}

function latest(dates: (string | null | undefined)[]): string | null {
  const sorted = dates.filter((d): d is string => Boolean(d)).sort();
  return sorted.length ? sorted[sorted.length - 1] : null;
}

// ---------------------------------------------------------------------------------------------------
// approved medicines

export interface TherapyRow {
  key: string;
  name: string;
  authority: string | null;
  date: string | null;
  holder: string | null;
  href: string | null;
  record: string | null;
  edge: Edge;
}

export type TherapyState =
  /** the shard has no approved_therapies field: nobody searched yet */
  | { kind: "unchecked" }
  /** searched, nothing found */
  | { kind: "none"; authorities: string; asOf: string | null; sources: string[]; regulators: string[] }
  /** total: the shard's items_total when it is larger than the listed items */
  | { kind: "approved"; items: TherapyRow[]; total: number; asOf: string | null; regulators: string[] };

function authorityNames(searched: SearchLog[]): string {
  const names = [...new Set(searched.map((s) => (/\bEMA\b/i.test(s.source) ? "EMA" : /FDA/i.test(s.source) ? "FDA" : null)).filter(Boolean))];
  return names.length ? names.join(" or ") : "EMA or FDA";
}

/** The regulators whose records were searched, with their region: ["EMA (EU)", "FDA (US)"]; read from the shard's `searched` log. */
export function checkedRegulators(searched: SearchLog[]): string[] {
  const out: string[] = [];
  for (const s of searched) {
    const name = /\bEMA\b/i.test(s.source) ? "EMA (EU)" : /FDA/i.test(s.source) ? "FDA (US)" : /MHRA/i.test(s.source) ? "MHRA (UK)" : null;
    if (name && !out.includes(name)) out.push(name);
  }
  const order = ["EMA (EU)", "FDA (US)", "MHRA (UK)"];
  return out.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

// EU member states (ISO 3166-1 alpha-2), so "a country outside the EU and US" can be told from the country choice
const EU_CODES = "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" ");

/** Is the chosen country covered by the regulators we checked (EMA for the EU, FDA for the US)? Unknown (no choice) counts as covered. */
export function coveredByRegulators(chosen: string | null | undefined, regulators: string[]): boolean {
  if (!isCountry(chosen)) return true;
  if (regulators.some((r) => r.startsWith("FDA")) && sameCountry("US", chosen)) return true;
  if (regulators.some((r) => r.startsWith("MHRA")) && sameCountry("GB", chosen)) return true;
  return regulators.some((r) => r.startsWith("EMA")) && EU_CODES.some((code) => sameCountry(code, chosen));
}

export function therapyState(file: DiseaseFile): TherapyState {
  const read = v2Therapies(file);
  if (!read.present) return { kind: "unchecked" };
  const asOf = plainDate(latest(read.searched.map((s) => s.retrieved)));
  const regulators = checkedRegulators(read.searched);
  if (!read.items.length) return { kind: "none", authorities: authorityNames(read.searched), asOf, sources: read.searched.map((s) => s.source), regulators };
  // the shard may list fewer items than its items_total says (pipeline cut-off): count with the larger number, say how many are listed
  const declared = Number((file.approved_therapies as { items_total?: unknown } | undefined)?.items_total);
  return {
    kind: "approved",
    asOf,
    regulators,
    total: Number.isFinite(declared) ? Math.max(declared, read.items.length) : read.items.length,
    items: read.items.map(({ node, edge }) => {
      const ev = edge.evidence[0];
      return {
        key: node.id,
        name: node.label,
        authority: node.authority ?? ev?.db ?? null,
        date: plainDate(node.approved ?? ev?.date),
        holder: node.holder ?? null,
        href: node.url ?? ev?.url ?? null,
        record: ev?.record ?? null,
        edge,
      };
    }),
  };
}

// ---------------------------------------------------------------------------------------------------
// registries and natural history studies (the reusable assets a family can take part in)

export interface AssetRow {
  key: string;
  label: string;
  kind: "natural_history_study" | "registry";
  status: string | null;
  record: string | null;
  href: string | null;
  date: string | null;
  edge: Edge;
}

export function familyAssets(file: DiseaseFile): AssetRow[] {
  const rows: AssetRow[] = [];
  for (const { node, edge } of v2Assets(file).items) {
    if (node.asset_type !== "natural_history_study" && node.asset_type !== "registry") continue;
    const ev = edge.evidence[0];
    rows.push({
      key: node.id,
      label: node.label,
      kind: node.asset_type,
      status: node.status ? trialStatusLabel(node.status) : null,
      record: node.source_id ?? ev?.record ?? null,
      href: node.url ?? sourceHref(node.source_type, node.source_id, ev?.url) ?? null,
      date: plainDate(ev?.date),
      edge,
    });
  }
  // natural history studies first: they are the precedent a regulator has accepted as comparison group
  return rows.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "natural_history_study" ? -1 : 1));
}

// ---------------------------------------------------------------------------------------------------
// patient organisations

export interface OrgRow {
  key: string;
  label: string;
  site: string | null;
  contact: string | null;
  country: string | null;
  verified: string | null;
  /** matched to this disease by a language model and not yet confirmed by a person */
  aiMatched: boolean;
  edge: Edge | null;
  /** set when the group belongs to a related disease, not to this one */
  forDisease?: { id: string; label: string };
}

export function ownOrgs(file: DiseaseFile): OrgRow[] {
  return orgItems(file).map(({ org, edge }) => orgRow(org, edge));
}

/** A link a language model proposed (text-mined, or a model judged the match), not a person or a name match. */
export function isAiMatched(edge: Edge | null): boolean {
  if (!edge) return false;
  return edge.level === "text_mined" || edge.evidence.some((ev) => /judge|openai|gpt|claude|llm|model/i.test(`${ev.origin ?? ""} ${ev.db ?? ""}`));
}

export function orgRow(org: OrgCard, edge: Edge | null, forDisease?: { id: string; label: string }): OrgRow {
  const aiMatched = isAiMatched(edge);
  return {
    key: org.id,
    label: org.label,
    site: org.url ?? null,
    contact: org.contact_url ?? null,
    country: org.country ?? null,
    // "checked against the organisation's website" only for links a person or an exact name match made
    verified: aiMatched ? null : plainDate(org.verified_date),
    aiMatched,
    edge,
    forDisease,
  };
}

/** Groups the pipeline lists for the nearest communities (honest-gap block), without loading their shards. */
export function gapOrgs(file: DiseaseFile): OrgRow[] {
  const verified = file.gap?.searched.find((s) => s.verified)?.verified ?? null;
  const rows: OrgRow[] = [];
  const seen = new Set<string>();
  // a shared causal gene (tier 1) is closer than a parent class (tier 0)
  const communities = [...(file.gap?.nearest_communities ?? [])].sort((a, b) => Number((a.tier ?? 0) < 1) - Number((b.tier ?? 0) < 1));
  for (const c of communities) {
    if (c.mechanism_differs) continue;
    for (const o of c.orgs ?? []) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      rows.push({ key: o.id, label: o.label, site: o.url ?? null, contact: null, country: null, verified: plainDate(verified), aiMatched: false, edge: null, forDisease: { id: c.id, label: c.label } });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------------
// open studies

export interface StudyRow {
  key: string;
  title: string;
  status: string;
  observational: boolean;
  href: string;
  date: string | null;
  /** the conditions the registry entry lists */
  conditions: string[];
  /** where ClinicalTrials.gov matched the disease: "conditions", "keywords", "title" */
  matchedIn: string[];
  edge: Edge;
}

function matchedIn(ev: unknown): string[] {
  const value = (ev as { matched_in?: unknown } | undefined)?.matched_in;
  return Array.isArray(value) ? value.map(String) : [];
}

export function studyRow(item: EnrichmentItem): StudyRow {
  const n = item.node as Record<string, unknown> & { id: string; label: string };
  const ev = item.edge.evidence[0];
  return {
    key: n.id,
    title: String(n.label ?? n.id),
    status: trialStatusLabel(n.status),
    observational: n.study_type === "OBSERVATIONAL",
    href: typeof n.url === "string" ? n.url : `https://clinicaltrials.gov/study/${n.id}`,
    date: plainDate(ev?.retrieved ?? ev?.date),
    conditions: Array.isArray(n.conditions) ? n.conditions.map(String) : [],
    matchedIn: matchedIn(ev),
    edge: item.edge,
  };
}

/**
 * How the study stands to the disease, from its registry entry: "Krabbe disease only", "Lists Krabbe disease among 6 conditions",
 * or "Names Krabbe disease in its keywords, not among its 3 conditions". 0 = only this disease, 1 = one of several, 2 = mentioned.
 */
export function studyFocus(s: StudyRow, label: string): { text: string; rank: number } {
  const n = s.conditions.length;
  if (s.matchedIn.includes("conditions") || (!s.matchedIn.length && n)) {
    if (n <= 1) return { text: `${label} only`, rank: 0 };
    return { text: `Lists ${label} among ${n} conditions`, rank: 1 };
  }
  if (s.matchedIn.length) {
    const where = s.matchedIn.filter((m) => m !== "conditions").join(" and ");
    return { text: `Names ${label} in its ${where}${n ? `, not among its ${n === 1 ? "one condition" : `${n} conditions`}` : ""}`, rank: 2 };
  }
  return { text: `Lists ${label}; conditions: see the registry`, rank: 1 };
}

/** Age range of a study, as the registry gives it, and whether children can take part (null = not listed). */
export interface StudyAge {
  label: string;
  children: boolean | null;
}

export const ownStudies = (file: DiseaseFile): StudyRow[] => openTrials(file).map(studyRow);

// ---------------------------------------------------------------------------------------------------
// related diseases with the same mechanism

export interface RelatedCandidate {
  id: string;
  label: string;
  /** plain words: why it is related */
  why: string;
  /** the link edge, when the related disease is a graph neighbour (then an action card exists) */
  edge: Edge | null;
  neighbour: boolean;
}

/**
 * Nearest diseases with the same mechanism: graph neighbours with mechanism_differs === false, else the honest-gap
 * communities (shared causal gene first). Subtypes of one family collapse to the family root, so "metachromatic
 * leukodystrophy" stands for its juvenile, late-infantile and adult forms.
 */
export function relatedCandidates(file: DiseaseFile, max = 4): RelatedCandidate[] {
  const pool: (RelatedCandidate & { rank: number })[] = [];
  for (const c of file.gap?.nearest_communities ?? []) {
    if (c.mechanism_differs !== false || (c.tier ?? 0) < 1) continue; // tier 0 = a parent class, not one disease
    const genes = c.shared_genes ?? [];
    pool.push({ id: c.id, label: c.label, why: genes.length ? `shares the gene ${genes.join(", ")}` : c.relation, edge: null, neighbour: false, rank: 10 - (c.tier ?? 0) });
  }
  for (const n of file.neighbours) {
    if (n.mechanism_differs !== false) continue;
    const genes = n.shared_genes.map((g) => (typeof g === "string" ? g : g.id));
    // "Same curated mechanism class: lysosomal storage (degradation ...)" -> "lysosomal storage"
    const cls = n.mechanism_note?.match(/Same curated mechanism class: ([^(.;]+)/)?.[1]?.trim();
    pool.push({
      id: n.id,
      label: n.label,
      why: genes.length ? `shares the gene ${genes.join(", ")}` : cls ? `has the same kind of cause (${cls}) and similar symptoms` : "has the same kind of cause and similar symptoms",
      edge: n.edge,
      neighbour: true,
      rank: (genes.length ? 2 : 0) + n.edge.confidence,
    });
  }
  // a neighbour beats a gap community for the same id (it has an edge, so an action card)
  const byId = new Map<string, (typeof pool)[number]>();
  for (const c of pool) {
    const prev = byId.get(c.id);
    if (!prev) byId.set(c.id, c);
    else if (c.neighbour && !prev.neighbour) byId.set(c.id, { ...c, rank: Math.max(c.rank, prev.rank) });
  }
  const families = new Map<string, (typeof pool)[number]>();
  for (const c of [...byId.values()].sort((a, b) => b.rank - a.rank)) {
    if (c.id === file.node.id) continue;
    const key = familyKey(c.label);
    const prev = families.get(key);
    const isRoot = c.label.toLowerCase() === key;
    if (!prev) families.set(key, c);
    else if (isRoot && prev.label.toLowerCase() !== key) families.set(key, { ...c, rank: Math.max(c.rank, prev.rank) });
  }
  return [...families.values()]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, max)
    .map((c) => ({ id: c.id, label: c.label, why: c.why, edge: c.edge, neighbour: c.neighbour }));
}

export interface RelatedFinding {
  candidate: RelatedCandidate;
  therapies: TherapyRow[];
  assets: AssetRow[];
  studies: StudyRow[];
  orgs: OrgRow[];
}

export function relatedFinding(candidate: RelatedCandidate, file: DiseaseFile): RelatedFinding {
  const therapy = therapyState(file);
  const forDisease = { id: candidate.id, label: candidate.label };
  return {
    candidate,
    therapies: therapy.kind === "approved" ? therapy.items : [],
    // studies named after this disease (the HOME study for MLD) before umbrella studies of many diseases
    assets: (() => {
      const own = familyKey(candidate.label);
      const named = (label: string) => (label.toLowerCase().includes(own) ? 0 : 1);
      return familyAssets(file).sort((x, y) => named(x.label) - named(y.label) || (x.kind === y.kind ? 0 : x.kind === "natural_history_study" ? -1 : 1));
    })(),
    studies: ownStudies(file),
    orgs: orgItems(file).map(({ org, edge }) => orgRow(org, edge, forDisease)),
  };
}

export const hasFindings = (f: RelatedFinding) => f.therapies.length + f.assets.length + f.studies.length + f.orgs.length > 0;

/** richest first: an approved medicine, then a natural history study or registry, then open studies */
export function rankFindings(findings: RelatedFinding[]): RelatedFinding[] {
  const score = (f: RelatedFinding) => f.therapies.length * 100 + Math.min(f.assets.length, 5) * 10 + Math.min(f.studies.length, 5) * 2 + f.orgs.length;
  return [...findings].sort((a, b) => score(b) - score(a));
}

/** Every edge the "What you can do now" block cites, so the evidence panel can open each of them by id. */
export function citedEdges(file: DiseaseFile): Edge[] {
  return [...v2Therapies(file).items.map((i) => i.edge), ...v2Assets(file).items.map((i) => i.edge), ...orgItems(file).map((o) => o.edge), ...openTrials(file).map((t) => t.edge)];
}

export function citedLabels(file: DiseaseFile): Record<string, string> {
  return Object.fromEntries([
    [file.node.id, file.node.label],
    ...v2Therapies(file).items.map((i) => [i.node.id, i.node.label]),
    ...v2Assets(file).items.map((i) => [i.node.id, i.node.label]),
    ...orgItems(file).map((o) => [o.org.id, o.org.label]),
    ...openTrials(file).map((t) => [t.node.id, String(t.node.label ?? t.node.id)]),
  ]);
}

// ---------------------------------------------------------------------------------------------------
// next steps: only what the shard links to

/**
 * The related disease an action card should compare with: a graph neighbour whose mechanism was compared and found the
 * same (shared gene or same mechanism class), and for which something exists (an approved medicine, a natural history study
 * or a registry). A neighbour linked only by similar symptoms, or with "mechanism differs / not compared", is never picked.
 * Null when there is none: then the next step is left out.
 */
export function cardPartner(file: DiseaseFile, related: RelatedFinding[], preferred?: string | null): { id: string; label: string } | null {
  const sameMechanism = new Set(file.neighbours.filter((n) => n.mechanism_differs === false).map((n) => n.id));
  const usable = related.filter((f) => f.candidate.neighbour && sameMechanism.has(f.candidate.id) && (f.therapies.length || f.assets.length));
  const pick = usable.find((f) => f.therapies.length) ?? usable.find((f) => f.candidate.id === preferred) ?? usable[0];
  return pick ? { id: pick.candidate.id, label: pick.candidate.label } : null;
}

export interface NextStep {
  key: string;
  text: string;
  link?: { href: string; label: string; external: boolean };
}

export function nextSteps({
  file,
  therapy,
  orgs,
  studies,
  assets,
  related,
  actionVia,
  country,
  studyCountries,
  studyAges,
}: {
  file: DiseaseFile;
  therapy: TherapyState;
  orgs: OrgRow[];
  studies: StudyRow[];
  assets: AssetRow[];
  related: RelatedFinding[];
  actionVia: { id: string; label: string } | null;
  /** the "Where do you live?" choice of the studies block ("" = all countries) */
  country?: string;
  /** per study (NCT id): the countries with an open site, once the registry details have loaded */
  studyCountries?: Record<string, string[] | null>;
  /** per study (NCT id): the age range from the registry details */
  studyAges?: Record<string, StudyAge>;
}): NextStep[] {
  const label = file.node.label;
  const steps: NextStep[] = [];
  const chosen = isCountry(country) ? country : null;
  const where = (o: OrgRow) => (o.country ? ` (${countryName(o.country)})` : "");
  const own = inCountryFirst(orgs.filter((o) => !o.forDisease), (o) => o.country, chosen);
  const org = own[0];
  const relatedOrg = inCountryFirst(orgs.filter((o) => o.forDisease), (o) => o.country, chosen)[0];
  if (org) {
    const local = !chosen || sameCountry(org.country, chosen);
    steps.push({
      key: "org",
      text:
        (local
        ? `Contact ${org.label}${where(org)}, a patient group for ${label}.`
        : `No patient group for ${label} in ${chosen} in our list; groups elsewhere: contact ${org.label}${where(org)}.`)
        + (org.aiMatched ? " This group was matched to the diagnosis by AI and is not yet confirmed: ask them whether they support families with it." : ""),
      link: { href: org.contact ?? org.site ?? "", label: "Contact page", external: true },
    });
  } else if (relatedOrg?.forDisease) {
    const local = !chosen || sameCountry(relatedOrg.country, chosen);
    steps.push({
      key: "org",
      text: `${local ? "" : `No patient group for ${label} in ${chosen} in our list. `}Contact ${relatedOrg.label}${where(relatedOrg)}, a patient group for the related ${relatedOrg.forDisease.label}, and ask whether they also support families with ${label}.`,
      link: { href: relatedOrg.contact ?? relatedOrg.site ?? "", label: "Contact page", external: true },
    });
  }
  if (therapy.kind === "approved") {
    const t = therapy.items[0];
    // outside the EU and US: say that only EMA and FDA records were checked, and ask about the local regulator
    const regulatorNote = chosen && !coveredByRegulators(chosen, therapy.regulators) ? ` We only checked ${andWords(therapy.regulators)} records; ask whether it is approved and available in ${chosen}.` : "";
    steps.push({
      key: "therapy",
      text: `Ask your specialist about ${t.name}${t.authority ? `, approved by the ${t.authority}` : ""} for ${label}, and whether it fits.${regulatorNote}`,
      link: t.href ? { href: t.href, label: `${t.name}: official record`, external: true } : undefined,
    });
  }
  const sitesOf = (s: StudyRow) => studyCountries?.[s.key] ?? null;
  // studies that include children before studies for adults only (unknown ages in between)
  const ageOf = (s: StudyRow) => studyAges?.[s.key];
  const childRank = (s: StudyRow) => (ageOf(s)?.children === true ? 0 : ageOf(s)?.children === false ? 2 : 1);
  const openNow = (s: StudyRow) => (/^recruiting/i.test(s.status) ? 0 : 1);
  const byAge = studies
    .map((s, i) => ({ s, i }))
    .sort((a, b) => childRank(a.s) - childRank(b.s) || openNow(a.s) - openNow(b.s) || studyFocus(a.s, label).rank - studyFocus(b.s, label).rank || a.i - b.i)
    .map(({ s }) => s);
  const isLocal = (s: StudyRow) => Boolean(chosen) && (sitesOf(s) ?? []).some((c) => sameCountry(c, chosen!));
  const adultsOnly = (s: StudyRow) => ageOf(s)?.children === false;
  // a local study that takes children; else a study elsewhere that does (and name the local adults-only one); else what there is
  const localKid = byAge.find((s) => isLocal(s) && !adultsOnly(s));
  const localAdult = byAge.find((s) => isLocal(s) && adultsOnly(s));
  const otherKid = byAge.find((s) => !adultsOnly(s));
  const localStudy = localKid ?? (otherKid ? undefined : localAdult);
  const study = localStudy ?? otherKid ?? byAge[0];
  const registry = assets.find((a) => a.kind === "registry" && /recruiting/i.test(a.status ?? ""));
  if (study) {
    const age = ageOf(study)?.label;
    const ages = `${age ? ` ${age}${adultsOnly(study) ? ", so it is for adults only" : ""}.` : ""}${!localStudy && localAdult && localAdult !== study ? ` The study with a site in ${chosen}, ${localAdult.key}, takes adults only (${ageOf(localAdult)?.label.toLowerCase()}).` : ""}`;
    const what = `“${study.title}” (${study.status.toLowerCase()}; ${study.observational ? "observes, no treatment" : "tests a treatment"}; ${lowerFirst(studyFocus(study, label).text)}${localStudy && chosen ? `; open site in ${chosen}` : ""})`;
    const elsewhere = sitesOf(study)?.length ? `, with open sites in ${sitesOf(study)!.slice(0, 3).join(", ")}${sitesOf(study)!.length > 3 ? " and more" : ""}` : "";
    const text =
      chosen && !localStudy
        ? `${localAdult ? `No study for ${label} that takes children lists an open site in ${chosen}` : `No study for ${label} lists an open site in ${chosen}`}; studies elsewhere: ask your specialist about ${study.key}, ${what}${elsewhere}, and ask the study team whether they accept participants from other countries.${ages}`
        : `Ask your specialist about the study ${study.key}, ${what}.${ages} The registry entry lists who to contact.`;
    steps.push({ key: "study", text, link: { href: study.href, label: `${study.key} on ClinicalTrials.gov`, external: true } });
  } else if (registry?.href) {
    steps.push({ key: "registry", text: `Ask whether you or your family member can be added to the ${registry.label}${registry.record ? ` (${registry.record})` : ""}.`, link: { href: registry.href, label: `Open ${registry.record ?? "the registry entry"}`, external: true } });
  }
  // only a same-mechanism neighbour with a medicine, natural history study or registry (see cardPartner); else no card step
  const partner = actionVia && file.neighbours.some((n) => n.id === actionVia.id && n.mechanism_differs === false) ? related.find((r) => r.candidate.id === actionVia.id && (r.therapies.length || r.assets.length)) : undefined;
  if (actionVia && partner) {
    const has = partner.therapies.length ? "an approved medicine" : partner.assets.some((x) => x.kind === "natural_history_study") ? "a natural history study" : "a registry";
    steps.push({
      key: "card",
      text: `Take the action card comparing ${label} with ${actionVia.label} to your next appointment. ${cap(actionVia.label)} ${partner.candidate.why} and has ${has}; the card shows what is the same, what differs and what needs an expert.`,
      link: { href: `/d/${file.node.id.replace(":", "_")}/action?via=${actionVia.id.replace(":", "_")}`, label: "Open the action card", external: false },
    });
  }
  return steps.filter((s) => !s.link || s.link.href).slice(0, 4);
}

// ---------------------------------------------------------------------------------------------------
// words explained on first use, each with the primary source named in docs/MEDICAL-BACKGROUND.md

const lowerFirst = (t: string) => (/^[A-Z][a-z]/.test(t) && !/^[A-Z][a-z]+ disease/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
const cap = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const andWords = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

// leukodystrophy / white matter: no primary source in docs/MEDICAL-BACKGROUND.md for a plain definition, so no sentence (rule 1)
export const PLAIN_WORDS = {
  lysosomal: "Lysosomal means: inside the body's cells, some waste cannot be broken down, so it builds up.",
  naturalHistory: "A natural history study follows the course of a disease over time, without treatment.",
} as const;

/** Sources for the medical word explanations (checked in docs/MEDICAL-BACKGROUND.md). */
export const PLAIN_SOURCES = {
  lysosomal: { label: "Platt et al. 2018, PMID 30275469", href: "https://pubmed.ncbi.nlm.nih.gov/30275469/" },
  naturalHistory: {
    label: "FDA draft guidance, Rare Diseases: Natural History Studies for Drug Development (2019)",
    href: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/rare-diseases-natural-history-studies-drug-development",
  },
} as const;

export interface PlainWord {
  text: string;
  source: { label: string; href: string };
}

/** Plain explanations for the words a definition uses, in reading order, each once, each with its source. */
export function wordsIn(text: string): PlainWord[] {
  const rules: [RegExp, PlainWord][] = [[/lysosom/i, { text: PLAIN_WORDS.lysosomal, source: PLAIN_SOURCES.lysosomal }]];
  return rules.filter(([re]) => re.test(text)).map(([, word]) => word);
}
