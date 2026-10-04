// Star map data (public/world/sky.json, built by scripts/build-sky.mjs) plus the tiny event bus between the
// start page (search box, tour button) and whichever sky renderer is mounted (3D or 2D fallback).

import { loadMeta } from "@/lib/data";

export const KIND = { disease: 0, lonely: 1, gene: 2, backgroundGene: 3, symptom: 4 } as const;

export interface SkyFile {
  format: string;
  data_version: string;
  data_built_at: string;
  counts: {
    diseases: number;
    genes: number | null;
    symptoms: number | null;
    symptoms_in_index: number;
    core_edges: number;
    clusters: number;
    without_neighbour: number;
    stars: number;
  };
  clusters: { id: number; size: number; hub: number }[];
  ids: string[];
  labels: string[];
  kind: number[];
  degree: number[];
  cluster: number[];
  pos: number[];
  edges: number[];
}

export interface Sky {
  file: SkyFile;
  count: number;
  positions: Float32Array; // xyz per star, sky units (radius ~100)
  kind: Uint8Array;
  degree: Uint16Array;
  indexById: Map<string, number>;
  edgeCount: number;
  edgeSource: Uint32Array;
  edgeTarget: Uint32Array;
  edgeCode: Uint8Array; // type * 4 + level
  adjacency: number[][]; // star -> edge indices
}

let skyPromise: Promise<Sky> | null = null;

export function loadSky(): Promise<Sky> {
  // ?v=<data version> keeps a cached sky from outliving a data republish
  skyPromise ??= loadMeta()
    .catch(() => null)
    .then((meta) => fetch(`/world/sky.json?v=${encodeURIComponent(meta?.version ?? "0")}`))
    .then((r) => {
      if (!r.ok) throw new Error(`sky.json ${r.status}`);
      return r.json() as Promise<SkyFile>;
    })
    .then(decodeSky);
  skyPromise.catch(() => (skyPromise = null));
  return skyPromise;
}

function decodeSky(file: SkyFile): Sky {
  const count = file.ids.length;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = file.pos[i] / 10;
  const edgeCount = file.edges.length / 3;
  const edgeSource = new Uint32Array(edgeCount);
  const edgeTarget = new Uint32Array(edgeCount);
  const edgeCode = new Uint8Array(edgeCount);
  const adjacency: number[][] = Array.from({ length: count }, () => []);
  for (let e = 0; e < edgeCount; e++) {
    edgeSource[e] = file.edges[e * 3];
    edgeTarget[e] = file.edges[e * 3 + 1];
    edgeCode[e] = file.edges[e * 3 + 2];
    adjacency[edgeSource[e]].push(e);
    adjacency[edgeTarget[e]].push(e);
  }
  return {
    file,
    count,
    positions,
    kind: Uint8Array.from(file.kind),
    degree: Uint16Array.from(file.degree),
    indexById: new Map(file.ids.map((id, i) => [id, i])),
    edgeCount,
    edgeSource,
    edgeTarget,
    edgeCode,
    adjacency,
  };
}

export function hrefOfStar(sky: Sky, i: number): string {
  const id = sky.file.ids[i];
  const kind = sky.kind[i];
  if (kind === KIND.gene || kind === KIND.backgroundGene) return `/g/${encodeURIComponent(id)}`;
  if (kind === KIND.symptom) return `/p/${id.replace(":", "_")}`;
  return `/d/${id.replace(":", "_")}`;
}

export function kindLabel(kind: number): string {
  if (kind === KIND.gene || kind === KIND.backgroundGene) return "Gene";
  if (kind === KIND.symptom) return "Symptom";
  return "Disease";
}

/**
 * The constellation of one star: its direct edges (hop 1) and the edges among its neighbours (hop 2).
 * delays: per star, ms after ignition start; neighbours staggered by degree (<= 25 ms each, <= 600 ms total).
 */
export interface Constellation {
  center: number;
  stars: Map<number, { hop: 0 | 1 | 2; delay: number }>;
  edges: Map<number, { hop: 1 | 2; delay: number }>;
}

export function constellationOf(sky: Sky, center: number): Constellation {
  const stars = new Map<number, { hop: 0 | 1 | 2; delay: number }>([[center, { hop: 0, delay: 0 }]]);
  const edges = new Map<number, { hop: 1 | 2; delay: number }>();
  const neighbours: number[] = [];
  for (const e of sky.adjacency[center]) {
    const other = sky.edgeSource[e] === center ? sky.edgeTarget[e] : sky.edgeSource[e];
    if (!stars.has(other)) neighbours.push(other);
    stars.set(other, { hop: 1, delay: 0 });
    edges.set(e, { hop: 1, delay: 0 });
  }
  neighbours.sort((a, b) => sky.degree[b] - sky.degree[a]);
  const step = Math.min(25, 420 / Math.max(neighbours.length, 1));
  neighbours.forEach((n, k) => {
    stars.set(n, { hop: 1, delay: 80 + k * step });
  });
  for (const [e] of edges) {
    const other = sky.edgeSource[e] === center ? sky.edgeTarget[e] : sky.edgeSource[e];
    edges.set(e, { hop: 1, delay: stars.get(other)!.delay - 60 });
  }
  // hop 2: edges between two neighbours (closes the figure), never the whole second ring
  const neighbourSet = new Set(neighbours);
  for (const n of neighbours) {
    for (const e of sky.adjacency[n]) {
      if (edges.has(e)) continue;
      const other = sky.edgeSource[e] === n ? sky.edgeTarget[e] : sky.edgeSource[e];
      if (neighbourSet.has(other)) {
        edges.set(e, { hop: 2, delay: Math.min(600, Math.max(stars.get(n)!.delay, stars.get(other)!.delay) + 40) });
      }
    }
  }
  return { center, stars, edges };
}

// ---------------------------------------------------------------------------------------------------
// bus: page -> sky renderer. Without a mounted renderer every call resolves at once (navigation never waits).

export interface SkyController {
  /** fly to a star and ignite it; resolves when the flight has ended (<= ~1 s) */
  flyTo: (id: string, opts?: { instant?: boolean }) => Promise<void>;
  /** light a star's constellation without moving the camera; null clears */
  preview: (id: string | null) => void;
}

let controller: SkyController | null = null;
const readyListeners = new Set<() => void>();

export function registerSkyController(next: SkyController | null) {
  controller = next;
  if (next) readyListeners.forEach((fn) => fn());
}

export function onSkyReady(fn: () => void): () => void {
  readyListeners.add(fn);
  if (controller) fn();
  return () => readyListeners.delete(fn);
}

export const skyBus = {
  hasRenderer: () => controller !== null,
  flyTo: (id: string, opts?: { instant?: boolean }) =>
    controller ? Promise.race([controller.flyTo(id, opts), new Promise<void>((r) => setTimeout(r, 1400))]) : Promise.resolve(),
  preview: (id: string | null) => controller?.preview(id),
};

// ---------------------------------------------------------------------------------------------------
// theme colours from the CSS tokens (DESIGN.md §4), fallbacks per theme while a token is missing

export interface SkyPalette {
  dark: boolean;
  bg: string;
  star: string;
  starDim: string;
  amber: string;
  lvlStrong: string;
  lvlText: string;
  lvlInferred: string;
  ink: string;
}

function luminance(color: string): number | null {
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

export function readPalette(): SkyPalette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const bg = token("--bg") || "#0B1020";
  const dark = (luminance(bg) ?? 0) < 0.5;
  const pick = (name: string, darkValue: string, lightValue: string) => {
    const v = token(name);
    return /^#[0-9a-f]{6}$/i.test(v) ? v : dark ? darkValue : lightValue;
  };
  return {
    dark,
    bg,
    star: pick("--star", "#D7DBEA", "#3A4157"),
    starDim: pick("--star-dim", "#8D94B0", "#6E7590"),
    amber: pick("--amber", "#F5C46B", "#8F570C"),
    lvlStrong: pick("--lvl-strong", "#D7DBEA", "#3A4157"),
    lvlText: pick("--lvl-text", "#7CB4FF", "#1F64B8"),
    lvlInferred: pick("--lvl-inferred", "#B8A2FF", "#6B4FD1"),
    ink: pick("--ink", "#ECEEF6", "#121629"),
  };
}

/** calls fn whenever the theme can have changed (data-theme attribute or system scheme) */
export function watchTheme(fn: () => void): () => void {
  const observer = new MutationObserver(fn);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", fn);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", fn);
  };
}

export type SkyMode = "3d" | "2d" | "off";

/** URL switch ?sky=2d|off|3d, then reduced motion and WebGL support */
export function chooseSkyMode(): { mode: SkyMode; reason: string } {
  const param = new URLSearchParams(window.location.search).get("sky");
  if (param === "off") return { mode: "off", reason: "url" };
  if (param === "2d") return { mode: "2d", reason: "url" };
  if (param !== "3d" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { mode: "2d", reason: "reduced-motion" };
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return { mode: "2d", reason: "no-webgl" };
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return { mode: "2d", reason: "no-webgl" };
  }
  return { mode: "3d", reason: "ok" };
}
