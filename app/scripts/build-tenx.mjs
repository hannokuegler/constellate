#!/usr/bin/env node
// Precomputes the 10x case for every core disease: public/impact/tenx.json.
// Reads public/data/{index,disease/*,trial/*}.json and, when present, ../data/curated/assets.csv (sponsor, dates,
// enrolment of the ClinicalTrials.gov record). Never writes to public/data. Deterministic: same data in, same file out.
//
//   node scripts/build-tenx.mjs          (from app/)
//
// Route per disease (milestone: the first family's data enters a natural-history registry or study):
//   join    an open (recruiting / enrolling) registry or natural-history study already names this disease (has_asset edge)
//   extend  none names it, but a mechanistic neighbour has one open: shared gene, or similar symptoms AND the same
//           mechanism class. Eligibility is a question for the study team, so this route has extra steps.
//   gap     neither: the group would build its own. No speed-up is claimed (Honest Gap).

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(appDir, "public", "data");
const outDir = join(appDir, "public", "impact");
const assetsCsv = join(appDir, "..", "data", "curated", "assets.csv");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fileKey = (id) => id.replace(":", "_");

const OPEN = new Set(["RECRUITING", "ENROLLING_BY_INVITATION"]);
const REUSABLE = new Set(["registry", "natural_history_study"]);

// --- assets.csv: sponsor, start, end, enrolment per NCT (optional) ---
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const recordMeta = new Map();
if (existsSync(assetsCsv)) {
  for (const r of parseCsv(readFileSync(assetsCsv, "utf8"))) {
    if (r.source_type !== "NCT" || recordMeta.has(r.source_id)) continue;
    try {
      const n = JSON.parse(r.notes || "{}");
      recordMeta.set(r.source_id, { sponsor: n.sponsor ?? null, start: n.start ?? null, end: n.end ?? null, enrollment: n.enrollment ?? null });
    } catch { /* notes without JSON: no extra metadata */ }
  }
}

const index = readJson(join(dataDir, "index.json"));
const core = index.filter((e) => e.type === "disease" && e.in_core).sort((a, b) => a.id.localeCompare(b.id));

const shardCache = new Map();
function shard(id) {
  if (!shardCache.has(id)) {
    const path = join(dataDir, "disease", `${fileKey(id)}.json`);
    shardCache.set(id, existsSync(path) ? readJson(path) : null);
  }
  return shardCache.get(id);
}
const trialCache = new Map();
function trial(nct) {
  if (!nct) return null;
  if (!trialCache.has(nct)) {
    const path = join(dataDir, "trial", `${nct}.json`);
    trialCache.set(nct, existsSync(path) ? readJson(path) : null);
  }
  return trialCache.get(nct);
}

const itemsOf = (field) => (Array.isArray(field) ? field : field?.items ?? []);
const reusable = (file) => itemsOf(file?.assets).filter((x) => REUSABLE.has(x.node.asset_type));
const mechKeys = (file) => new Set((file?.node?.mechanism_classes ?? []).map((m) => m.key));

// How many diseases name each asset: a registry for one disease beats a catch-all study for hundreds.
const namedBy = new Map();
for (const name of readdirSync(join(dataDir, "disease"))) {
  const file = readJson(join(dataDir, "disease", name));
  shardCache.set(file.node.id, file);
  for (const x of reusable(file)) namedBy.set(x.node.id, (namedBy.get(x.node.id) ?? 0) + 1);
}

// Best asset: open first, then the stronger condition match (edge confidence), the more specific record,
// registry before study, larger enrolment.
function score(item) {
  const meta = recordMeta.get(item.node.source_id) ?? {};
  return [OPEN.has(item.node.status) ? 1 : 0, item.edge.confidence ?? 0, -(namedBy.get(item.node.id) ?? 0), item.node.asset_type === "registry" ? 1 : 0, meta.enrollment ?? 0];
}
function byScore(a, b) {
  const sa = score(a), sb = score(b);
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sb[i] - sa[i];
  return a.node.id.localeCompare(b.node.id);
}

// The page opens the edge in the evidence panel; three evidence records are enough there, the shard has all.
const slim = (edge) => ({ ...edge, evidence: edge.evidence.slice(0, 3), contradicting: edge.contradicting.slice(0, 3) });

function assetOut(item) {
  const nct = item.node.source_type === "NCT" ? item.node.source_id : null;
  const t = trial(nct);
  const meta = (nct && recordMeta.get(nct)) || {};
  return {
    id: item.node.id,
    label: item.node.label,
    type: item.node.asset_type,
    status: item.node.status ?? null,
    record: item.node.source_id ?? null,
    url: item.node.url ?? null,
    sponsor: meta.sponsor ?? null,
    start: meta.start ?? null,
    end: meta.end ?? null,
    enrollment: meta.enrollment ?? null,
    last_update: t?.last_update ?? null,
    retrieved: (t?.retrieved ?? item.edge.evidence?.[0]?.retrieved ?? null)?.slice(0, 10) ?? null,
    countries: t ? t.countries.map((c) => c.country) : null,
    open_sites: t ? t.countries.reduce((s, c) => s + (c.open_sites ?? 0), 0) : null,
    named_by: namedBy.get(item.node.id) ?? 1,
    edge: slim(item.edge),
  };
}

const diseases = [];
const counts = { join: 0, extend: 0, gap: 0 };
for (const entry of core) {
  const file = shard(entry.id);
  if (!file) continue;
  const own = reusable(file).sort(byScore);
  const ownOpen = own.filter((x) => OPEN.has(x.node.status));
  const out = { id: entry.id, label: entry.label, is_group: !!file.node.is_group, route: "gap", asset: null, via: null, own_total: own.length, own_open: ownOpen.length, alternatives: 0 };

  if (ownOpen.length) {
    out.route = "join";
    out.asset = assetOut(ownOpen[0]);
    out.alternatives = ownOpen.length - 1;
  } else {
    const mine = mechKeys(file);
    const candidates = [];
    for (const n of file.neighbours ?? []) {
      const nf = shard(n.id);
      if (!nf) continue;
      const sharedMech = [...mechKeys(nf)].filter((k) => mine.has(k));
      const mechanistic = n.edge.type === "shares_gene" || sharedMech.length > 0;
      if (!mechanistic) continue;
      for (const item of reusable(nf).filter((x) => OPEN.has(x.node.status))) {
        candidates.push({ n, nf, item, sharedMech, gene: n.edge.type === "shares_gene" });
      }
    }
    // shared gene beats shared mechanism class, then the asset score
    candidates.sort((a, b) => (b.gene ? 1 : 0) - (a.gene ? 1 : 0) || byScore(a.item, b.item));
    if (candidates.length) {
      const best = candidates[0];
      out.route = "extend";
      out.asset = assetOut(best.item);
      out.via = {
        id: best.n.id,
        label: best.n.label,
        relation: best.n.edge.type,
        shared_genes: (best.n.shared_genes ?? []).map((g) => (typeof g === "string" ? g : g.id)),
        shared_mechanism: (best.nf.node.mechanism_classes ?? []).filter((m) => best.sharedMech.includes(m.key)).map((m) => m.label),
        edge: slim(best.n.edge),
      };
      out.alternatives = new Set(candidates.map((c) => c.item.node.id)).size - 1;
    }
  }
  counts[out.route]++;
  diseases.push(out);
}

const meta = readJson(join(dataDir, "meta.json"));
mkdirSync(outDir, { recursive: true });
const result = {
  version: meta.version,
  milestone: "first family's data in a natural-history registry or study",
  core_total: diseases.length,
  counts,
  diseases,
};
writeFileSync(join(outDir, "tenx.json"), JSON.stringify(result));
console.log(`tenx.json: ${diseases.length} core diseases · join ${counts.join} · extend ${counts.extend} · gap ${counts.gap} · data ${meta.version}`);
