"use client";

// 2D fallback of the same sky: static Canvas2D projection of sky.json with the 3D camera's angles.
// Used without WebGL, with prefers-reduced-motion, after a context loss or a blank 3D frame, and with ?sky=2d.
// The scroll story is drawn as each chapter's end state (no animation): bokeh, glasses with a sharp connected
// sky inside, Krabbe's constellation, the amber MLD edge, the dashed ring of the gap. Hover labels and clicks work.

import { useEffect, useRef } from "react";
import { KIND, constellationOf, readPalette, registerSkyController, watchTheme, type Constellation, type Sky } from "./sky";
import { NEIGHBOUR_SHIFT, STORY_GAP, STORY_KRABBE, STORY_MLD, computeStoryFit, lensGeometry, story, storyEndFrame, type CameraKey, type StoryFrame } from "./story";
import { placeStarLabels } from "./labels";
import type { HoverInfo } from "./SkyCanvas";

interface Props {
  sky: Sky;
  initialFocus?: string | null;
  onReady: () => void;
  onHover: (info: HoverInfo | null) => void;
  onSelect: (index: number) => void;
}

const YAW = 0.35;
const PITCH = -0.18;
const HOME = 235;
const REF_DISTANCE = 290;
const FOV = (42 * Math.PI) / 180;

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export default function SkyFallback2D({ sky, initialFocus, onReady, onHover, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onReady, onHover, onSelect });
  callbacks.current = { onReady, onHover, onSelect };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const n = sky.count;
    const screen = new Float32Array(n * 3); // x, y, scale
    let width = 1;
    let height = 1;
    // a search choice lights its star until the visitor scrolls to another chapter
    let manual: { index: number; chapter: number } | null = null;
    if (initialFocus && sky.indexById.has(initialFocus)) manual = { index: sky.indexById.get(initialFocus)!, chapter: story.chapter };

    const krabbe = sky.indexById.get(STORY_KRABBE);
    const gap = sky.indexById.get(STORY_GAP);
    const mld = sky.indexById.get(STORY_MLD);
    const at = (i: number | undefined): [number, number, number] =>
      i === undefined ? [0, 0, 0] : [sky.positions[i * 3], sky.positions[i * 3 + 1], sky.positions[i * 3 + 2]];
    // same framing as the 3D story: Krabbe's constellation centred, sized by fitDistance()
    const centre: [number, number, number] = computeStoryFit(sky) ?? at(krabbe);
    const keys: Record<CameraKey, [number, number, number]> = {
      home: [0, 0, 0],
      krabbe: centre,
      gap: at(gap),
      between: [0, 1, 2].map((k) => (centre[k] + at(gap)[k]) / 2) as [number, number, number],
    };
    // every edge between Krabbe and MLD is drawn amber (they share one line on screen)
    const amberEdges = new Set<number>();
    if (krabbe !== undefined && mld !== undefined) {
      for (const e of sky.adjacency[krabbe]) {
        const other = sky.edgeSource[e] === krabbe ? sky.edgeTarget[e] : sky.edgeSource[e];
        if (other === mld) amberEdges.add(e);
      }
    }

    const project = (frame: StoryFrame | null) => {
      const target = frame ? keys[frame.camera.to] : keys.home;
      const distance = frame ? frame.camera.toDistance : HOME;
      const shift = frame ? frame.shift : width >= 1024 ? 0.16 : 0;
      const lift = frame ? frame.lift : width < 1024 ? 0.28 : 0;
      const cx = target[0] + distance * Math.sin(YAW) * Math.cos(PITCH);
      const cy = target[1] + distance * Math.sin(PITCH);
      const cz = target[2] + distance * Math.cos(YAW) * Math.cos(PITCH);
      const fx = target[0] - cx;
      const fy = target[1] - cy;
      const fz = target[2] - cz;
      const fl = Math.hypot(fx, fy, fz);
      const f = [fx / fl, fy / fl, fz / fl];
      const rl = Math.hypot(f[2], f[0]);
      const r = [-f[2] / rl, 0, f[0] / rl]; // f x up, as three.js lookAt
      const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      const focal = height / 2 / Math.tan(FOV / 2);
      const centreX = width / 2 + (width >= 1024 ? shift * width : 0);
      const centreY = height / 2 - (width < 1024 ? lift * height : 0);
      for (let i = 0; i < n; i++) {
        const x = sky.positions[i * 3] - cx;
        const y = sky.positions[i * 3 + 1] - cy;
        const z = sky.positions[i * 3 + 2] - cz;
        const depth = x * f[0] + y * f[1] + z * f[2];
        if (depth < 1) {
          screen[i * 3] = -1e5;
          continue;
        }
        screen[i * 3] = centreX + ((x * r[0] + y * r[1] + z * r[2]) * focal) / depth;
        screen[i * 3 + 1] = centreY - ((x * u[0] + y * u[1] + z * u[2]) * focal) / depth;
        screen[i * 3 + 2] = Math.min(Math.pow(REF_DISTANCE / depth, 0.75), 2.2);
      }
    };

    const drawPass = (constellation: Constellation | null, opts: { sharp: boolean; lines: boolean; centreOnly: boolean; amber: boolean; dim?: number; preview?: boolean }) => {
      const palette = readPalette();
      const dimmed = constellation ? 1 - 0.68 * (opts.dim ?? 1) : 1;
      context.lineWidth = 1;
      for (let e = 0; e < sky.edgeCount; e++) {
        const s = sky.edgeSource[e];
        const t = sky.edgeTarget[e];
        if (screen[s * 3] < -1e4 || screen[t * 3] < -1e4) continue;
        const lit = opts.centreOnly ? undefined : constellation?.edges.get(e);
        const level = sky.edgeCode[e] % 4;
        if (opts.amber && amberEdges.has(e)) continue; // drawn last, on top, with its glow
        else if (opts.centreOnly && opts.preview && constellation?.edges.get(e)?.hop === 1) {
          // Krabbe chapter: its direct links as faint hairlines before they ignite
          context.strokeStyle = rgba(palette.starDim, 0.5);
          context.lineWidth = 1;
        } else if (lit) {
          const colour = lit.hop === 1 ? (level === 0 ? palette.lvlStrong : level === 1 ? palette.lvlText : palette.lvlInferred) : palette.starDim;
          context.strokeStyle = rgba(colour, lit.hop === 1 ? 0.9 : 0.45);
          context.lineWidth = 1;
        } else if (opts.lines) {
          context.strokeStyle = rgba(palette.starDim, (palette.dark ? 0.12 : 0.14) * (constellation ? 0.4 : 1));
          context.lineWidth = 1;
        } else continue;
        context.beginPath();
        context.moveTo(screen[s * 3], screen[s * 3 + 1]);
        context.lineTo(screen[t * 3], screen[t * 3 + 1]);
        context.stroke();
      }
      if (opts.amber) {
        // the read edge: amber, thick, glowing
        context.save();
        context.strokeStyle = rgba(palette.amber, 1);
        context.lineCap = "round";
        context.shadowColor = rgba(palette.amber, palette.dark ? 0.9 : 0.6);
        context.shadowBlur = 14;
        context.lineWidth = 4;
        for (const e of amberEdges) {
          const s = sky.edgeSource[e];
          const t = sky.edgeTarget[e];
          if (screen[s * 3] < -1e4 || screen[t * 3] < -1e4) continue;
          context.beginPath();
          context.moveTo(screen[s * 3], screen[s * 3 + 1]);
          context.lineTo(screen[t * 3], screen[t * 3 + 1]);
          context.stroke();
        }
        context.restore();
      }
      const order = [KIND.symptom, KIND.backgroundGene, KIND.lonely, KIND.gene, KIND.disease];
      for (const kind of order) {
        for (let i = 0; i < n; i++) {
          if (sky.kind[i] !== kind || screen[i * 3] < -1e4) continue;
          let lit = constellation?.stars.get(i);
          const previewed = !!opts.preview && opts.centreOnly && lit?.hop === 1;
          if (lit && opts.centreOnly && lit.hop !== 0) lit = undefined;
          let radius: number;
          let colour = palette.star;
          let a = 1;
          if (kind === KIND.disease) radius = 1.2 + Math.min(Math.sqrt(sky.degree[i]), 9) * 0.22;
          else if (kind === KIND.gene) {
            radius = 1.0 + Math.min(Math.sqrt(sky.degree[i]), 6) * 0.15;
            a = 0.9;
          } else if (kind === KIND.lonely) {
            radius = 1.1;
            colour = palette.starDim;
            a = 0.6;
          } else {
            radius = 0.7;
            colour = palette.starDim;
            a = kind === KIND.symptom ? 0.45 : 0.55;
          }
          radius *= screen[i * 3 + 2];
          if (lit) {
            a = 1;
            colour = lit.hop === 0 ? palette.amber : palette.star;
            radius *= lit.hop === 0 ? 2.4 : 1.4;
          } else {
            if (!previewed) a *= dimmed;
            if (!opts.sharp) {
              // out of focus: a larger, fainter disc
              radius *= kind >= KIND.backgroundGene ? 2.2 : 2.8;
              a *= kind >= KIND.backgroundGene ? 0.22 : 0.3;
            }
          }
          context.fillStyle = rgba(colour, a);
          context.beginPath();
          context.arc(screen[i * 3], screen[i * 3 + 1], Math.max(radius, 0.6), 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const ring = (index: number | undefined, colour: string, dashed: boolean) => {
      if (index === undefined || screen[index * 3] < -1e4) return;
      context.save();
      context.strokeStyle = colour;
      context.lineWidth = 1.5;
      if (dashed) context.setLineDash([4, 4]);
      context.beginPath();
      context.arc(screen[index * 3], screen[index * 3 + 1], dashed ? 13 : 15, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    };

    const draw = () => {
      const palette = readPalette();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (manual && story.active && manual.chapter !== story.chapter) manual = null;
      const frame = story.active ? storyEndFrame(story.chapter, width, height) : null;
      project(frame);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = palette.bg;
      context.fillRect(0, 0, width, height);

      const storyFocus = !manual && frame?.focus && krabbe !== undefined ? krabbe : null;
      const focusIndex = manual ? manual.index : storyFocus;
      const constellation = focusIndex !== null ? constellationOf(sky, focusIndex) : null;
      const centreOnly = !manual && !!frame && frame.clock < NEIGHBOUR_SHIFT;
      drawPass(constellation, {
        sharp: !frame || frame.blur < 0.3,
        lines: !frame || frame.lines > 0.5,
        centreOnly,
        amber: !manual && !!frame && frame.amberEdge > 0.5,
        dim: frame && !manual ? frame.dim : 1,
        preview: !manual && !!frame && frame.preview > 0.5,
      });

      // glasses: inside the two lenses the sky is sharp and connected
      const lens = story.active ? lensGeometry(story.chapter, story.t, width, height, true) : null;
      if (lens?.on) {
        context.save();
        context.beginPath();
        context.arc(lens.ax, lens.ay, lens.r, 0, Math.PI * 2);
        context.moveTo(lens.bx + lens.r, lens.by);
        context.arc(lens.bx, lens.by, lens.r, 0, Math.PI * 2);
        context.clip();
        context.fillStyle = palette.bg;
        context.fillRect(0, 0, width, height);
        drawPass(null, { sharp: true, lines: true, centreOnly: false, amber: false });
        context.restore();
      }
      if (focusIndex !== null) ring(focusIndex, rgba(palette.amber, 0.85), false);
      if (!manual && frame && frame.ring > 0.5) ring(gap, rgba(palette.star, 0.9), true);
      placeStarLabels((id) => {
        const i = sky.indexById.get(id);
        return i === undefined || screen[i * 3] < -1e4 ? null : [screen[i * 3], screen[i * 3 + 1]];
      });
    };

    const resize = () => {
      width = Math.max(canvas.clientWidth, 1);
      height = Math.max(canvas.clientHeight, 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const stopTheme = watchTheme(draw);
    // redraw on chapter changes only: each chapter is a still
    let lastChapter = story.chapter;
    const onStory = () => {
      if (story.chapter === lastChapter) return;
      lastChapter = story.chapter;
      draw();
    };
    story.listeners.add(onStory);

    const pick = (x: number, y: number): number | null => {
      let best: number | null = null;
      let bestScore = Infinity;
      for (let i = 0; i < n; i++) {
        const dx = screen[i * 3] - x;
        const dy = screen[i * 3 + 1] - y;
        const d2 = dx * dx + dy * dy;
        const radius = sky.kind[i] >= KIND.backgroundGene ? 6 : 11;
        if (d2 > radius * radius) continue;
        const score = d2 - (sky.kind[i] <= KIND.gene ? 30 : 0);
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      return best;
    };
    const local = (event: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const p = local(event);
      const hovered = pick(p.x, p.y);
      canvas.style.cursor = hovered !== null ? "pointer" : "default";
      callbacks.current.onHover(hovered !== null ? { index: hovered, x: p.x, y: p.y } : null);
    };
    const onLeave = () => callbacks.current.onHover(null);
    const onClick = (event: MouseEvent) => {
      const p = local(event);
      const index = pick(p.x, p.y);
      if (index !== null) callbacks.current.onSelect(index);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);

    const light = (id: string | null) => {
      const index = id ? sky.indexById.get(id) : undefined;
      manual = index === undefined ? null : { index, chapter: story.chapter };
      draw();
    };
    registerSkyController({
      flyTo: (id) => {
        light(id);
        return Promise.resolve();
      },
      preview: (id) => {
        if (id) light(id);
      },
    });
    // test hook: where a star sits on screen (used by the screenshot checks)
    (window as Window & { __constellateSky?: unknown }).__constellateSky = {
      mode: "2d",
      screenOf: (id: string) => {
        const i = sky.indexById.get(id);
        return i === undefined ? null : [screen[i * 3], screen[i * 3 + 1]];
      },
    };
    resize();
    callbacks.current.onReady();

    return () => {
      registerSkyController(null);
      resizeObserver.disconnect();
      stopTheme();
      story.listeners.delete(onStory);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
    // the sky is fixed for the life of this canvas; later focus and story changes arrive over the bus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sky]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
