// Scroll story of the start page ("putting on the lens"). The page measures which chapter block sits under the
// reading line and how far through it the visitor is (chapter, t); everything visual is a pure function of that:
// the 3D renderer lerps its camera and uniforms towards storyFrame(), the 2D fallback draws each chapter's end state,
// and the glasses overlay uses lensGeometry() so its rims sit exactly on the sharp circles in the shader.

import { constellationOf, type Sky } from "./sky";

export const STORY_CHAPTERS = ["hero", "lights", "lens", "wearing", "krabbe", "constellation", "neighbour", "gap", "end"] as const;
export type ChapterId = (typeof STORY_CHAPTERS)[number];

/** scroll length of each chapter block that ScrollStory renders (the hero lives on the start page, not here) */
export const STORY_HEIGHTS: Partial<Record<ChapterId, number>> = {
  lights: 80,
  lens: 120,
  wearing: 100,
  krabbe: 90,
  constellation: 80,
  neighbour: 80,
  gap: 90,
  end: 110,
};
/** total scroll length in svh, used for the placeholder while the story chunk loads */
export const STORY_TOTAL_SVH = Object.values(STORY_HEIGHTS).reduce((a, b) => a + (b ?? 0), 0);

export const STORY_KRABBE = "MONDO:0009499";
export const STORY_MLD = "MONDO:0018868";
export const STORY_GAP = "MONDO:0012720";

export interface StoryPosition {
  active: boolean;
  chapter: number; // index into STORY_CHAPTERS
  t: number; // 0..1 inside the chapter
}

/** shared, mutable: written by the page on scroll, read by the renderers every frame */
export const story: StoryPosition & { listeners: Set<() => void> } = { active: false, chapter: 0, t: 0, listeners: new Set() };

export function setStory(next: StoryPosition) {
  const changed = next.chapter !== story.chapter || Math.abs(next.t - story.t) > 1e-4 || next.active !== story.active;
  story.active = next.active;
  story.chapter = next.chapter;
  story.t = next.t;
  if (changed) story.listeners.forEach((fn) => fn());
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export interface Lens {
  on: boolean;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number; // CSS px, viewport coordinates (top-left origin)
  frame: number; // opacity of the drawn glasses frame
  full: number; // 1 = the lenses cover the whole view
}

/** glasses: two round lenses and a bridge. descend in "lens", grow to full screen in "wearing" */
export function lensGeometry(chapter: number, t: number, width: number, height: number, staticMode = false): Lens {
  const id = STORY_CHAPTERS[chapter];
  const phone = width < 640;
  const wide = width >= 1024;
  const r0 = phone ? Math.min(width * 0.21, height * 0.17) : Math.min(width * 0.13, height * 0.23);
  const gap = r0 * 1.14;
  // wide screens: the glasses sit right of the caption column (bottom left), centred over the sky
  const cx = wide ? width * (0.5 + LENS_SHIFT) : width / 2;
  const cy = phone ? height * 0.3 : height * 0.38;
  const base = { ax: cx - gap, ay: cy, bx: cx + gap, by: cy, r: r0 };
  const off: Lens = { on: false, ...base, frame: 0, full: 0 };
  if (id === "lens") {
    const drop = staticMode ? 1 : ease(span(t, 0, 0.45));
    const dy = (1 - drop) * -(cy + r0 + 60);
    return { on: true, ...base, ay: cy + dy, by: cy + dy, frame: 1, full: 0 };
  }
  if (id === "wearing") {
    if (staticMode) return { ...off, full: 1 }; // fallback: the end state, the whole sky sharp
    const grow = ease(span(t, 0, 0.75));
    const big = Math.hypot(width, height);
    return { on: true, ...base, r: r0 + (big - r0) * grow, frame: 1 - span(t, 0.45, 0.75), full: grow };
  }
  if (STORY_CHAPTERS.indexOf(id) > STORY_CHAPTERS.indexOf("wearing")) return { ...off, full: 1 };
  return off;
}

/** horizontal sky shift while the glasses are on (fraction of the width), shared by shader, overlay and 2D */
export const LENS_SHIFT = 0.1;
/** sky shift once the constellation is told: its centre sits in the free space right of the captions */
const STORY_SHIFT = 0.18;

/** camera orbit angles shared by the 3D renderer and the 2D fallback */
export const STORY_YAW = 0.35;
export const STORY_PITCH = -0.18;
const HALF_FOV = Math.tan((21 * Math.PI) / 180); // vertical field of view 42 deg

/**
 * spread of Krabbe's constellation as seen by the story camera (sky units, 90th percentile of the members'
 * offsets from their centroid along the screen axes); set once from the real star positions by computeStoryFit()
 */
export const storyFit = { halfX: 20, halfY: 14 };

/** centroid of Krabbe's constellation, and its on-screen spread for fitDistance() */
export function computeStoryFit(sky: Sky): [number, number, number] | null {
  const krabbe = sky.indexById.get(STORY_KRABBE);
  if (krabbe === undefined) return null;
  const members = [...constellationOf(sky, krabbe).stars.keys()];
  const at = (i: number, k: number) => sky.positions[i * 3 + k];
  const centre = [0, 1, 2].map((k) => members.reduce((sum, i) => sum + at(i, k), 0) / members.length) as [number, number, number];
  // screen axes of a camera at (yaw, pitch) looking at the centroid, as three.js lookAt builds them
  const f = [-Math.sin(STORY_YAW) * Math.cos(STORY_PITCH), -Math.sin(STORY_PITCH), -Math.cos(STORY_YAW) * Math.cos(STORY_PITCH)];
  const rl = Math.hypot(f[2], f[0]);
  const r = [-f[2] / rl, 0, f[0] / rl];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const i of members) {
    const d = [at(i, 0) - centre[0], at(i, 1) - centre[1], at(i, 2) - centre[2]];
    xs.push(Math.abs(d[0] * r[0] + d[1] * r[1] + d[2] * r[2]));
    ys.push(Math.abs(d[0] * u[0] + d[1] * u[1] + d[2] * u[2]));
  }
  const p90 = (v: number[]) => v.sort((a, b) => a - b)[Math.floor((v.length - 1) * 0.9)] || 10;
  storyFit.halfX = p90(xs);
  storyFit.halfY = p90(ys);
  return centre;
}

/**
 * camera distance at which Krabbe's constellation fills ~55 % of the height right of the caption (desktop),
 * or the upper part of the screen above the caption (phone, tablet)
 */
export function fitDistance(width: number, height: number): number {
  const halfH = HALF_FOV;
  const halfW = HALF_FOV * (width / Math.max(height, 1));
  const wide = width >= 1024;
  const fillH = wide ? 0.55 : 0.4;
  const fillW = wide ? 0.5 : 0.78;
  return Math.max(24, storyFit.halfY / (fillH * halfH), storyFit.halfX / (fillW * halfW));
}

/** chapters whose caption may be shown; "end" brings its own card */
const CAPTIONED: readonly ChapterId[] = STORY_CHAPTERS.filter((id) => id !== "hero" && id !== "end");

/**
 * the one caption on screen: the current chapter's once it is due (the lens caption only after the glasses are
 * down), until then the previous chapter's stays, so the sticky caption never blinks between chapters
 */
export function activeCaption(chapter: number, t: number, has: (id: ChapterId) => boolean): ChapterId | null {
  const id = STORY_CHAPTERS[chapter];
  if (!CAPTIONED.includes(id)) return null;
  const due = id === "lens" ? t >= 0.32 : t >= 0.04;
  if (due && has(id)) return id;
  for (let k = chapter - 1; k >= 0; k--) {
    const prev = STORY_CHAPTERS[k];
    if (CAPTIONED.includes(prev) && has(prev)) return prev;
  }
  return null;
}

export type CameraKey = "home" | "krabbe" | "gap" | "between";

export interface StoryFrame {
  blur: number; // 1 = bokeh everywhere outside the lenses, 0 = sharp
  lines: number; // line visibility outside the lenses
  shift: number; // horizontal view offset, fraction of the width (sky centre moves right)
  lift: number; // vertical view offset on narrow screens, fraction of the height
  camera: { from: CameraKey; to: CameraKey; k: number; fromDistance: number; toDistance: number };
  focus: boolean; // Krabbe constellation present
  clock: number; // ignition clock in ms (centre 0..260, neighbours from NEIGHBOUR_SHIFT on)
  amberEdge: number; // 0..1 Krabbe -> MLD edge in amber
  ring: number; // 0..1 dashed ring around the gap disease
  dim: number; // 0..1 how far the sky outside the lit constellation fades back
  preview: number; // 0..1 Krabbe's direct neighbours and links drawn as faint hairlines before they ignite
}

/** neighbours ignite after the centre: their delays are shifted by this many ms in story mode */
export const NEIGHBOUR_SHIFT = 400;
const HOME = 235;
const LENS = 175; // closer while the glasses are on: the sky fills both lenses

export function storyFrame(chapter: number, t: number, width: number, height = (width * 9) / 16): StoryFrame {
  const id = STORY_CHAPTERS[chapter];
  const wide = width >= 1024;
  const narrow = !wide;
  const NEAR = fitDistance(width, height);
  const GAP = NEAR * 0.8;
  const frame: StoryFrame = {
    blur: 0,
    lines: 1,
    shift: wide ? STORY_SHIFT : 0,
    lift: narrow ? 0.16 : 0,
    camera: { from: "home", to: "home", k: 1, fromDistance: HOME, toDistance: HOME },
    focus: false,
    clock: 0,
    amberEdge: 0,
    ring: 0,
    dim: 1,
    preview: 0,
  };
  switch (id) {
    case "hero":
      return { ...frame, blur: 1, lines: 0, shift: wide ? 0.16 : 0, lift: narrow ? 0.28 : 0 };
    case "lights":
      return {
        ...frame,
        blur: 1 - 0.4 * span(t, 0, 0.8),
        lines: 0,
        shift: wide ? 0.16 + (LENS_SHIFT - 0.16) * span(t, 0.2, 1) : 0,
        lift: narrow ? 0.28 * (1 - span(t, 0.2, 1)) : 0,
        camera: { from: "home", to: "home", k: ease(span(t, 0.2, 1)), fromDistance: HOME, toDistance: LENS },
      };
    case "lens":
      return { ...frame, blur: 0.6, lines: 0, shift: wide ? LENS_SHIFT : 0, lift: 0, camera: { from: "home", to: "home", k: 1, fromDistance: LENS, toDistance: LENS } };
    case "wearing": {
      const sharp = span(t, 0.6, 0.85);
      return { ...frame, blur: 0.6 * (1 - sharp), lines: sharp, shift: wide ? LENS_SHIFT : 0, lift: 0, camera: { from: "home", to: "home", k: 1, fromDistance: LENS, toDistance: LENS } };
    }
    case "krabbe":
      return {
        ...frame,
        shift: wide ? LENS_SHIFT + (STORY_SHIFT - LENS_SHIFT) * span(t, 0, 0.6) : 0,
        lift: narrow ? 0.16 * span(t, 0, 0.6) : 0,
        camera: { from: "home", to: "krabbe", k: ease(span(t, 0, 0.5)), fromDistance: LENS, toDistance: NEAR },
        focus: t >= 0.3,
        clock: span(t, 0.3, 0.65) * 300,
        // the neighbourhood stays visible around the lit centre, it only ignites in the next chapter
        dim: 0.3,
        preview: span(t, 0.35, 0.7),
      };
    case "constellation":
      return {
        ...frame,
        camera: { from: "krabbe", to: "krabbe", k: 1, fromDistance: NEAR, toDistance: NEAR },
        focus: true,
        clock: NEIGHBOUR_SHIFT + span(t, 0, 0.7) * 900,
      };
    case "neighbour":
      return {
        ...frame,
        camera: { from: "krabbe", to: "krabbe", k: 1, fromDistance: NEAR, toDistance: NEAR },
        focus: true,
        clock: 3000,
        amberEdge: span(t, 0, 0.5),
      };
    case "gap":
      return {
        ...frame,
        camera: { from: "krabbe", to: "gap", k: ease(span(t, 0, 0.6)), fromDistance: NEAR, toDistance: GAP },
        focus: true,
        clock: 3000,
        amberEdge: 1 - span(t, 0, 0.4),
        ring: span(t, 0.35, 0.75),
      };
    case "end":
      return {
        ...frame,
        camera: { from: "gap", to: "between", k: ease(span(t, 0, 0.6)), fromDistance: GAP, toDistance: NEAR * 1.6 },
        focus: true,
        clock: 3000,
        ring: 1,
      };
  }
}

/** end state of a chapter, for the 2D fallback and reduced motion */
export function storyEndFrame(chapter: number, width: number, height?: number): StoryFrame {
  return storyFrame(chapter, 1, width, height);
}
