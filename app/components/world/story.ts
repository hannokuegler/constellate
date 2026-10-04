// Scroll story of the start page ("putting on the lens"). The page measures which chapter block sits under the
// reading line and how far through it the visitor is (chapter, t); everything visual is a pure function of that:
// the 3D renderer lerps its camera and uniforms towards storyFrame(), the 2D fallback draws each chapter's end state,
// and the glasses overlay uses lensGeometry() so its rims sit exactly on the sharp circles in the shader.

export const STORY_CHAPTERS = ["hero", "lights", "lens", "wearing", "krabbe", "constellation", "neighbour", "gap", "end"] as const;
export type ChapterId = (typeof STORY_CHAPTERS)[number];

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

/**
 * camera distance that frames Krabbe's constellation at ~55 % of the view height; set by the renderer from the
 * real star positions (the default is only used before that)
 */
export const storyFit = { near: 66, gap: 52 };

/** which chapter's caption is on screen: one at a time, the lens caption only once the glasses are down */
export function captionVisible(chapter: number, t: number, id: ChapterId): boolean {
  if (STORY_CHAPTERS[chapter] !== id) return false;
  if (id === "lens") return t >= 0.32;
  return t >= 0.04;
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
}

/** neighbours ignite after the centre: their delays are shifted by this many ms in story mode */
export const NEIGHBOUR_SHIFT = 400;
const HOME = 235;
const LENS = 175; // closer while the glasses are on: the sky fills both lenses

export function storyFrame(chapter: number, t: number, width: number): StoryFrame {
  const id = STORY_CHAPTERS[chapter];
  const wide = width >= 1024;
  const narrow = !wide;
  const NEAR = storyFit.near;
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
        camera: { from: "home", to: "krabbe", k: ease(span(t, 0, 0.6)), fromDistance: LENS, toDistance: NEAR },
        focus: t >= 0.3,
        clock: span(t, 0.3, 0.65) * 300,
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
        camera: { from: "krabbe", to: "gap", k: ease(span(t, 0, 0.6)), fromDistance: NEAR, toDistance: storyFit.gap },
        focus: true,
        clock: 3000,
        amberEdge: 1 - span(t, 0, 0.4),
        ring: span(t, 0.35, 0.75),
      };
    case "end":
      return {
        ...frame,
        camera: { from: "gap", to: "between", k: ease(span(t, 0, 0.6)), fromDistance: storyFit.gap, toDistance: NEAR * 1.6 },
        focus: true,
        clock: 3000,
        ring: 1,
      };
  }
}

/** end state of a chapter, for the 2D fallback and reduced motion */
export function storyEndFrame(chapter: number, width: number): StoryFrame {
  return storyFrame(chapter, 1, width);
}
