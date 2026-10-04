#!/usr/bin/env node
// Precomputes the 3D star map for the start page: public/world/sky.json.
// Reads public/data/{meta,core,index}.json plus gene and phenotype shards (only their disease lists), never writes there.
// Deterministic: same data in, same sky out (seeded PRNG, hash jitter, fixed iteration count).
//
//   node scripts/build-sky.mjs          (from app/)
//
// Layout
//   connected core nodes (diseases + genes with >= 1 core edge): 3D force layout, every Louvain cluster pulled
//     towards its own anchor on a sphere, so each cluster reads as one constellation region
//   221 diseases without any core edge: pale dust on an outer shell (Fibonacci sphere + hash jitter)
//   genes outside the core: close to one of their diseases (gene shard)
//   symptoms (index.json): close to one of their diseases (phenotype shard), slightly pulled to the centroid
//
// Output (columnar, compact): positions are integers in 1/10 units of a sky with radius ~100.
//   kind: 0 disease with edges · 1 disease without mapped neighbour · 2 core gene · 3 background gene · 4 symptom
//   edges: flat [source, target, code] with code = typeCode * 4 + levelCode
//     typeCode 0 caused_by/associated_gene · 1 similar_phenotype · 2 shares_gene
//     levelCode 0 curated/observed · 1 text_mined · 2 inferred

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(appDir, "public", "data");
const outDir = join(appDir, "public", "world");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fileKey = (id) => id.replace(":", "_");

// ---------------------------------------------------------------------------------------------------
// deterministic randomness

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
const rngFor = (text) => mulberry32(hashString(text));
function randomUnitVector(rand) {
  const z = rand() * 2 - 1;
  const phi = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(phi), r * Math.sin(phi), z];
}
function fibonacciSphere(count, index) {
  const y = 1 - ((index + 0.5) / count) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = Math.PI * (3 - Math.sqrt(5)) * index;
  return [r * Math.cos(theta), y, r * Math.sin(theta)];
}

// ---------------------------------------------------------------------------------------------------
// input

const meta = readJson(join(dataDir, "meta.json"));
const core = readJson(join(dataDir, "core.json"));
const index = readJson(join(dataDir, "index.json"));

const coreNodes = core.nodes;
const coreIndexById = new Map(coreNodes.map((n, i) => [n.id, i]));
const coreDegree = new Array(coreNodes.length).fill(0);
for (const edge of core.edges) {
  coreDegree[coreIndexById.get(edge.source)]++;
  coreDegree[coreIndexById.get(edge.target)]++;
}

// ---------------------------------------------------------------------------------------------------
// 1 force layout of the connected core

const connected = coreNodes.map((_, i) => i).filter((i) => coreDegree[i] > 0);
const layoutSlot = new Map(connected.map((nodeIdx, slot) => [nodeIdx, slot]));
const count = connected.length;

const clusterSizes = new Map();
for (const i of connected) {
  const c = coreNodes[i].cluster_id;
  if (c != null) clusterSizes.set(c, (clusterSizes.get(c) ?? 0) + 1);
}
const clusterOrder = [...clusterSizes.keys()].sort((a, b) => clusterSizes.get(b) - clusterSizes.get(a) || a - b);
const ANCHOR_RADIUS = 95;
const anchors = new Map();
clusterOrder.forEach((c, k) => {
  // big clusters closer to the middle, small ones further out: the eye finds the dense regions first
  const unit = fibonacciSphere(clusterOrder.length, (k * 7) % clusterOrder.length);
  const radius = ANCHOR_RADIUS * (0.6 + 0.4 * (k / Math.max(clusterOrder.length - 1, 1)));
  anchors.set(c, unit.map((v) => v * radius));
});

const rand = mulberry32(20261004);
const px = new Float64Array(count), py = new Float64Array(count), pz = new Float64Array(count);
const vx = new Float64Array(count), vy = new Float64Array(count), vz = new Float64Array(count);
const anchorOf = connected.map((i) => anchors.get(coreNodes[i].cluster_id) ?? null);
for (let s = 0; s < count; s++) {
  const base = anchorOf[s] ?? [0, 0, 0];
  const dir = randomUnitVector(rand);
  const r = 4 + rand() * 14;
  px[s] = base[0] + dir[0] * r;
  py[s] = base[1] + dir[1] * r;
  pz[s] = base[2] + dir[2] * r;
}

const springs = core.edges.map((e) => {
  const a = layoutSlot.get(coreIndexById.get(e.source));
  const b = layoutSlot.get(coreIndexById.get(e.target));
  const gene = e.type === "caused_by" || e.type === "associated_gene";
  // links across two clusters stay long and soft, so each cluster keeps its own region of the sky
  const sameCluster = coreNodes[coreIndexById.get(e.source)].cluster_id === coreNodes[coreIndexById.get(e.target)].cluster_id;
  return { a, b, length: gene ? 4 : sameCluster ? 6 : 14, strength: gene ? 0.09 : sameCluster ? 0.04 : 0.006 };
});

const ITERATIONS = 420;
const REPULSION = 26;
for (let it = 0; it < ITERATIONS; it++) {
  const alpha = 1 - it / ITERATIONS;
  const fx = new Float64Array(count), fy = new Float64Array(count), fz = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = px[i] - px[j], dy = py[i] - py[j], dz = pz[i] - pz[j];
      const d2 = dx * dx + dy * dy + dz * dz + 0.6;
      if (d2 > 900) continue; // beyond 30 units repulsion is irrelevant next to the cluster pull
      const f = REPULSION / (d2 * Math.sqrt(d2));
      fx[i] += dx * f; fy[i] += dy * f; fz[i] += dz * f;
      fx[j] -= dx * f; fy[j] -= dy * f; fz[j] -= dz * f;
    }
  }
  for (const { a, b, length, strength } of springs) {
    const dx = px[b] - px[a], dy = py[b] - py[a], dz = pz[b] - pz[a];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
    const f = ((d - length) / d) * strength;
    fx[a] += dx * f; fy[a] += dy * f; fz[a] += dz * f;
    fx[b] -= dx * f; fy[b] -= dy * f; fz[b] -= dz * f;
  }
  for (let s = 0; s < count; s++) {
    const anchor = anchorOf[s];
    const pull = anchor ? 0.035 : 0.004;
    const target = anchor ?? [0, 0, 0];
    fx[s] += (target[0] - px[s]) * pull;
    fy[s] += (target[1] - py[s]) * pull;
    fz[s] += (target[2] - pz[s]) * pull;
    vx[s] = (vx[s] + fx[s] * alpha) * 0.62;
    vy[s] = (vy[s] + fy[s] * alpha) * 0.62;
    vz[s] = (vz[s] + fz[s] * alpha) * 0.62;
    px[s] += vx[s]; py[s] += vy[s]; pz[s] += vz[s];
  }
}

// centre and scale: 95th percentile radius = 78
{
  let cx = 0, cy = 0, cz = 0;
  for (let s = 0; s < count; s++) { cx += px[s]; cy += py[s]; cz += pz[s]; }
  cx /= count; cy /= count; cz /= count;
  const radii = [];
  for (let s = 0; s < count; s++) {
    px[s] -= cx; py[s] -= cy; pz[s] -= cz;
    radii.push(Math.hypot(px[s], py[s], pz[s]));
  }
  radii.sort((a, b) => a - b);
  const scale = 78 / radii[Math.floor(radii.length * 0.95)];
  for (let s = 0; s < count; s++) { px[s] *= scale; py[s] *= scale; pz[s] *= scale; }
}

const corePosition = new Array(coreNodes.length);
connected.forEach((nodeIdx, s) => (corePosition[nodeIdx] = [px[s], py[s], pz[s]]));

// ---------------------------------------------------------------------------------------------------
// 2 diseases without any core edge: outer shell

const lonely = coreNodes.map((_, i) => i).filter((i) => coreDegree[i] === 0);
lonely
  .slice()
  .sort((a, b) => hashString(coreNodes[a].id) - hashString(coreNodes[b].id))
  .forEach((nodeIdx, k) => {
    const r = rngFor(coreNodes[nodeIdx].id);
    const unit = fibonacciSphere(lonely.length, k);
    const jitter = randomUnitVector(r);
    const radius = 104 + r() * 12;
    corePosition[nodeIdx] = unit.map((v, axis) => v * radius + jitter[axis] * 5);
  });

// ---------------------------------------------------------------------------------------------------
// 3 background: genes outside the core and symptoms, near one of their diseases

function diseasesOfShard(path) {
  if (!existsSync(path)) return [];
  try {
    const shard = readJson(path);
    return (shard.diseases ?? [])
      .map((row) => {
        // gene shards list edges ({source, target}), phenotype shards list diseases ({id, label, edge})
        const edge = row.source && row.target ? row : null;
        if (edge) return edge.source.startsWith("MONDO") ? edge.source : edge.target;
        return row.id;
      })
      .filter((id) => typeof id === "string" && coreIndexById.has(id));
  } catch {
    return [];
  }
}

function placeNear(id, diseaseIds, spread) {
  const r = rngFor(id);
  const dir = randomUnitVector(r);
  if (!diseaseIds.length) {
    const radius = 150 + r() * 25;
    return dir.map((v) => v * radius);
  }
  const preferred = diseaseIds.filter((d) => coreDegree[coreIndexById.get(d)] > 0);
  const pool = preferred.length ? preferred : diseaseIds;
  const anchor = corePosition[coreIndexById.get(pool[Math.floor(r() * pool.length)])];
  const centroid = [0, 0, 0];
  for (const d of pool) corePosition[coreIndexById.get(d)].forEach((v, axis) => (centroid[axis] += v / pool.length));
  const base = anchor.map((v, axis) => v * 0.78 + centroid[axis] * 0.22);
  const outward = Math.hypot(...base) > 1 ? base.map((v) => v / Math.hypot(...base)) : dir;
  const distance = spread[0] + r() * (spread[1] - spread[0]);
  return base.map((v, axis) => v + dir[axis] * distance + outward[axis] * distance * 0.35);
}

const backgroundGenes = index.filter((e) => e.type === "gene" && !coreIndexById.has(e.id));
const symptoms = index.filter((e) => e.type === "phenotype");

// ---------------------------------------------------------------------------------------------------
// assemble

const ids = [], labels = [], kinds = [], degrees = [], clusters = [], positions = [];
const push = (id, label, kind, degree, cluster, pos) => {
  ids.push(id);
  labels.push(label);
  kinds.push(kind);
  degrees.push(degree);
  clusters.push(cluster ?? -1);
  for (const v of pos) positions.push(Math.round(v * 10));
};

const outIndexOfCore = new Map();
coreNodes.forEach((n, i) => {
  const kind = n.type === "disease" ? (coreDegree[i] > 0 ? 0 : 1) : 2;
  outIndexOfCore.set(i, ids.length);
  push(n.id, n.label, kind, coreDegree[i], n.cluster_id, corePosition[i]);
});
for (const g of backgroundGenes) {
  const diseases = diseasesOfShard(join(dataDir, "gene", `${encodeURIComponent(g.id)}.json`));
  push(g.id, g.label, 3, Math.min(g.degree ?? diseases.length, 255), -1, placeNear(g.id, diseases, [3, 10]));
}
for (const p of symptoms) {
  const diseases = diseasesOfShard(join(dataDir, "phenotype", `${fileKey(p.id)}.json`));
  push(p.id, p.label, 4, Math.min(p.degree ?? diseases.length, 255), -1, placeNear(p.id, diseases, [5, 18]));
}

const TYPE_CODE = { caused_by: 0, associated_gene: 0, similar_phenotype: 1, shares_gene: 2 };
const LEVEL_CODE = { curated: 0, observed: 0, text_mined: 1, inferred: 2 };
const edges = [];
for (const e of core.edges) {
  edges.push(
    outIndexOfCore.get(coreIndexById.get(e.source)),
    outIndexOfCore.get(coreIndexById.get(e.target)),
    (TYPE_CODE[e.type] ?? 1) * 4 + (LEVEL_CODE[e.level] ?? 2),
  );
}

const clusterSummary = clusterOrder.map((c) => {
  const members = connected.filter((i) => coreNodes[i].cluster_id === c);
  const hub = members.reduce((best, i) => (coreNodes[i].type === "disease" && coreDegree[i] > coreDegree[best] ? i : best), members[0]);
  return { id: c, size: members.length, hub: outIndexOfCore.get(hub) };
});

const counts = meta.counts?.nodes ?? {};
const sky = {
  format: "constellate-sky/1",
  data_version: meta.version,
  data_built_at: meta.built_at,
  generated_by: "app/scripts/build-sky.mjs",
  counts: {
    diseases: counts.disease ?? coreNodes.filter((n) => n.type === "disease").length,
    genes: counts.gene ?? null,
    symptoms: counts.phenotype ?? null,
    symptoms_in_index: counts.phenotype_in_index ?? symptoms.length,
    core_edges: core.edges.length,
    clusters: meta.counts?.clusters ?? clusterOrder.length,
    // diseases in core.json with no core edge at all ("no mapped neighbour in this release")
    without_neighbour: lonely.filter((i) => coreNodes[i].type === "disease").length,
    stars: ids.length,
  },
  clusters: clusterSummary,
  ids,
  labels,
  kind: kinds,
  degree: degrees,
  cluster: clusters,
  pos: positions,
  edges,
};

mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(sky);
writeFileSync(join(outDir, "sky.json"), text);
const gz = gzipSync(text).length;
console.log(
  `sky.json: ${ids.length} stars (${coreNodes.length} core, ${backgroundGenes.length} background genes, ${symptoms.length} symptoms), ` +
    `${core.edges.length} edges, ${lonely.length} without neighbour · ${(text.length / 1024).toFixed(0)} KB raw, ${(gz / 1024).toFixed(0)} KB gzip · data ${meta.version}`,
);
