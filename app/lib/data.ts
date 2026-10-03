import type { Core, DiseaseFile, GeneFile, IndexEntry, Meta, OrgFile, PhenotypeFile, TrialDetail } from "./types";
import { toFileKey } from "./ids";

const cache = new Map<string, Promise<unknown>>();
// dev/test hook: serve data from another origin (CDN or a local mock) without touching public/data
const DATA_BASE = (process.env.NEXT_PUBLIC_DATA_BASE || "/data").replace(/\/$/, "");

/** Fetch a static data file from /data. Resolves null on 404 (missing file is a state, not an error). */
export function loadJson<T>(path: string): Promise<T | null> {
  const hit = cache.get(path);
  if (hit) return hit as Promise<T | null>;
  const request = fetch(`${DATA_BASE}/${path}`).then(async (response) => {
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`${DATA_BASE}/${path}: HTTP ${response.status}`);
    return (await response.json()) as T;
  });
  request.catch(() => cache.delete(path)); // allow retry after a network error
  cache.set(path, request);
  return request;
}

export const loadMeta = () => loadJson<Meta>("meta.json");
export const loadIndex = () => loadJson<IndexEntry[]>("index.json");
export const loadCore = () => loadJson<Core>("core.json");
const loadDiseaseShard = (id: string) => loadJson<DiseaseFile>(`disease/${toFileKey(id)}.json`);

/**
 * Dev switch NEXT_PUBLIC_USE_FIXTURES=1: overlays the data-v2 fields from app/fixtures/disease-v2.json onto the real shard.
 * Without the switch the condition is a build-time constant, the fixture import is dropped from the bundle.
 */
export const loadDisease: (id: string) => Promise<DiseaseFile | null> =
  process.env.NEXT_PUBLIC_USE_FIXTURES === "1"
    ? async (id) => {
        const [shard, fixture] = await Promise.all([loadDiseaseShard(id), import("../fixtures/disease-v2.json")]);
        const overlay = (fixture.default.shards as Record<string, Partial<DiseaseFile>>)[shard?.node.id ?? ""];
        return shard && overlay ? { ...shard, ...overlay } : shard;
      }
    : loadDiseaseShard;
export const loadGene = (symbol: string) => loadJson<GeneFile>(`gene/${encodeURIComponent(symbol)}.json`);
export const loadPhenotype = (id: string) => loadJson<PhenotypeFile>(`phenotype/${toFileKey(id)}.json`);
export const loadTrial = (nct: string) => loadJson<TrialDetail>(`trial/${encodeURIComponent(nct)}.json`);
export const loadOrg = (slug: string) => loadJson<OrgFile>(`org/${encodeURIComponent(slug)}.json`);

let labelMap: Promise<Map<string, IndexEntry>> | null = null;
export function loadIndexMap(): Promise<Map<string, IndexEntry>> {
  labelMap ??= loadIndex().then((entries) => new Map((entries ?? []).map((e) => [e.id, e])));
  return labelMap;
}
