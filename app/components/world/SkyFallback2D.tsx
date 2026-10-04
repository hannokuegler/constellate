"use client";

// 2D fallback of the same sky: static Canvas2D projection of sky.json (same view as the 3D home camera).
// Used without WebGL, with prefers-reduced-motion, after a context loss or a blank 3D frame, and with ?sky=2d.
// Fully usable: hover label, click opens the page, search lights the constellation (no flight, end state at once).

import { useEffect, useRef } from "react";
import { KIND, constellationOf, readPalette, registerSkyController, watchTheme, type Sky } from "./sky";
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
const DISTANCE = 235;
const REF_DISTANCE = 290;
const FOV = (42 * Math.PI) / 180;

function alpha(hex: string, a: number) {
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
    let focus: number | null = initialFocus ? sky.indexById.get(initialFocus) ?? null : null;

    const project = () => {
      // camera on a sphere around the origin, looking at it (same angles as the 3D home view)
      const cx = DISTANCE * Math.sin(YAW) * Math.cos(PITCH);
      const cy = DISTANCE * Math.sin(PITCH);
      const cz = DISTANCE * Math.cos(YAW) * Math.cos(PITCH);
      // camera basis
      const fl = Math.hypot(cx, cy, cz);
      const f = [-cx / fl, -cy / fl, -cz / fl];
      const r0 = [-f[2], 0, f[0]]; // f x up, as three.js lookAt
      const rl = Math.hypot(r0[0], r0[2]);
      const r = [r0[0] / rl, 0, r0[2] / rl];
      // up = r x f
      const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      const focal = height / 2 / Math.tan(FOV / 2);
      const centreX = width >= 1024 ? width * 0.66 : width / 2;
      const centreY = width >= 1024 ? height / 2 : height * 0.22;
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
        screen[i * 3 + 2] = Math.pow(REF_DISTANCE / depth, 0.75);
      }
    };

    const draw = () => {
      const palette = readPalette();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = palette.bg;
      context.fillRect(0, 0, width, height);
      const constellation = focus !== null ? constellationOf(sky, focus) : null;
      const dimmed = constellation ? 0.32 : 1;

      // edges: hairlines, almost invisible; the focused constellation in its evidence colours
      context.lineWidth = 1;
      for (let e = 0; e < sky.edgeCount; e++) {
        const s = sky.edgeSource[e];
        const t = sky.edgeTarget[e];
        if (screen[s * 3] < -1e4 || screen[t * 3] < -1e4) continue;
        const lit = constellation?.edges.get(e);
        const level = sky.edgeCode[e] % 4;
        if (lit) {
          const colour = lit.hop === 1 ? (level === 0 ? palette.lvlStrong : level === 1 ? palette.lvlText : palette.lvlInferred) : palette.starDim;
          context.strokeStyle = alpha(colour, lit.hop === 1 ? 0.9 : 0.45);
        } else {
          context.strokeStyle = alpha(palette.starDim, (palette.dark ? 0.08 : 0.12) * (constellation ? 0.4 : 1));
        }
        context.beginPath();
        context.moveTo(screen[s * 3], screen[s * 3 + 1]);
        context.lineTo(screen[t * 3], screen[t * 3 + 1]);
        context.stroke();
      }

      // stars: dust first, bright on top
      const order = [KIND.symptom, KIND.backgroundGene, KIND.lonely, KIND.gene, KIND.disease];
      for (const kind of order) {
        for (let i = 0; i < n; i++) {
          if (sky.kind[i] !== kind || screen[i * 3] < -1e4) continue;
          const lit = constellation?.stars.get(i);
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
          } else a *= dimmed;
          context.fillStyle = alpha(colour, a);
          context.beginPath();
          context.arc(screen[i * 3], screen[i * 3 + 1], Math.max(radius, 0.6), 0, Math.PI * 2);
          context.fill();
        }
      }
      if (focus !== null && screen[focus * 3] > -1e4) {
        context.strokeStyle = alpha(palette.amber, 0.85);
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(screen[focus * 3], screen[focus * 3 + 1], 15, 0, Math.PI * 2);
        context.stroke();
      }
    };

    const resize = () => {
      width = Math.max(canvas.clientWidth, 1);
      height = Math.max(canvas.clientHeight, 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      project();
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const stopTheme = watchTheme(draw);

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
    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    let hovered: number | null = null;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const p = local(event);
      hovered = pick(p.x, p.y);
      canvas.style.cursor = hovered !== null ? "pointer" : "default";
      callbacks.current.onHover(hovered !== null ? { index: hovered, x: p.x, y: p.y } : null);
    };
    const onLeave = () => callbacks.current.onHover(null);
    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const index = pick(event.clientX - rect.left, event.clientY - rect.top);
      if (index !== null) callbacks.current.onSelect(index);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);

    const light = (id: string | null) => {
      focus = id ? sky.indexById.get(id) ?? null : null;
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
    resize();
    callbacks.current.onReady();

    return () => {
      registerSkyController(null);
      resizeObserver.disconnect();
      stopTheme();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
    // the sky is fixed for the life of this canvas; a later focus arrives over the bus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sky]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
