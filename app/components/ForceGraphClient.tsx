"use client";

// Loaded only in the browser (dynamic import, ssr: false) — react-force-graph-2d touches window on import.
// "Close-up of the sky": a dark window in both themes. Colour = evidence, shape = type.
//   disease: filled soft light point with a halo · gene: hollow ring · symptom: small dimmed point
//   family: point with two fine rings and a count · counter-example: point with a red dashed ring · centre: amber with halo
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Edge } from "@/lib/types";
import { LEVEL_INFO, hasCounterEvidence } from "@/lib/evidence";
import { EDGE_PANEL_EVENT } from "./EdgePanel";

export type GraphNodeKind = "center" | "gene" | "phenotype" | "neighbour" | "counter" | "disease" | "family";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  /** family node: how many subtypes it bundles */
  members?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  edge: Edge;
  secondHop?: boolean;
  /** counter-example: similar phenotypes, different mechanism */
  counter?: boolean;
}

type N = NodeObject<GraphNode>;
type L = LinkObject<GraphNode, GraphLink>;

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  height: number;
  onLinkClick: (edge: Edge) => void;
  onNodeClick: (node: GraphNode) => void;
  /** gene pages: the centre is a gene, so it is drawn as an amber ring instead of a point */
  centerShape?: "point" | "ring";
}

const VARS = ["--bg", "--ink", "--ink-2", "--star", "--star-dim", "--amber", "--lvl-text", "--lvl-inferred", "--contra"] as const;
type Palette = Record<(typeof VARS)[number], string> & { sans: string; display: string };

const FALLBACK: Record<(typeof VARS)[number], string> = {
  "--bg": "#0B1020",
  "--ink": "#ECEEF6",
  "--ink-2": "#A3AAC4",
  "--star": "#D7DBEA",
  "--star-dim": "#8D94B0",
  "--amber": "#F5C46B",
  "--lvl-text": "#7CB4FF",
  "--lvl-inferred": "#B8A2FF",
  "--contra": "#FF7B7B",
};

/** Reads the tokens from the (always dark) graph wrapper, not from <html>, so the light theme never reaches the canvas. */
function readPalette(wrapper: HTMLElement): Palette {
  const style = getComputedStyle(wrapper);
  const colours = Object.fromEntries(VARS.map((v) => [v, style.getPropertyValue(v).trim() || FALLBACK[v]])) as Record<(typeof VARS)[number], string>;
  const sans = getComputedStyle(document.body).fontFamily || "ui-sans-serif, system-ui, sans-serif";
  const display = style.getPropertyValue("--font-display").trim() || sans;
  return { ...colours, sans, display };
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const RADIUS: Record<GraphNodeKind, number> = { center: 8, gene: 6, neighbour: 5.5, counter: 6, disease: 5.5, phenotype: 3, family: 7.5 };
const LABEL_PRIORITY: Record<GraphNodeKind, number> = { center: 0, gene: 1, family: 2, counter: 3, neighbour: 4, disease: 4, phenotype: 5 };
const FADE_MS = 200;
const STAGGER_MS = 25;
const MAX_DELAY_MS = 400; // last node starts at 400 ms, is fully lit at 600 ms

interface LabelBox { x0: number; y0: number; x1: number; y1: number }

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s,.;:]+$/, "")}…`;
    return kept;
  }
  return lines;
}

export default function ForceGraphClient({ nodes, links, height, onLinkClick, onNodeClick, centerShape = "point" }: Props) {
  const graphRef = useRef<ForceGraphMethods<N, L> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverLink, setHoverLink] = useState<L | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [activeEdge, setActiveEdge] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const fitted = useRef(false);
  const igniteStart = useRef<number | null>(null);

  useEffect(() => {
    if (wrapRef.current) setPalette(readPalette(wrapRef.current));
  }, []);

  useEffect(() => {
    const onPanel = (event: Event) => setActiveEdge((event as CustomEvent<{ id: string | null }>).detail?.id ?? null);
    window.addEventListener(EDGE_PANEL_EVENT, onPanel);
    return () => window.removeEventListener(EDGE_PANEL_EVENT, onPanel);
  }, []);

  // the library mutates node/link objects, so hand it fresh copies whenever the input changes
  const data = useMemo(() => {
    fitted.current = false;
    igniteStart.current = null;
    return { nodes: nodes.map((n) => ({ ...n })) as N[], links: links.map((l) => ({ ...l })) as L[] };
  }, [nodes, links]);

  // ignition order: centre first, then its direct neighbours, then everything else; 25 ms apart, 600 ms in total
  const igniteDelay = useMemo(() => {
    const center = nodes.find((n) => n.kind === "center")?.id;
    const direct = new Set(links.filter((l) => l.source === center || l.target === center).flatMap((l) => [l.source, l.target]));
    const rank = (n: GraphNode) => (n.id === center ? 0 : direct.has(n.id) ? 1 : 2);
    const order = [...nodes].sort((a, b) => rank(a) - rank(b));
    return new Map(order.map((n, i) => [n.id, Math.min(i * STAGGER_MS, MAX_DELAY_MS)]));
  }, [nodes, links]);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const linkForce = graph.d3Force("link");
    linkForce?.distance?.((link: L) => {
      const target = link.target as N;
      const kind = typeof target === "object" ? target.kind : "disease";
      if (link.secondHop) return 120;
      return kind === "phenotype" ? 70 : kind === "gene" ? 80 : 130;
    });
    graph.d3Force("charge")?.strength?.(-220);
    fitted.current = false; // fit again once the re-configured simulation settles
    graph.d3ReheatSimulation();
  }, [data, width]);

  const narrow = width > 0 && width < 500;

  // endpoints of the edge whose panel is open get a halo
  const activeEnds = useMemo(() => {
    const ends = new Set<string>();
    if (!activeEdge) return ends;
    for (const l of links) {
      if (l.edge.id !== activeEdge) continue;
      ends.add(l.source);
      ends.add(l.target);
    }
    return ends;
  }, [activeEdge, links]);

  const lit = (id: string): number => {
    if (reducedMotion) return 1;
    if (igniteStart.current === null) igniteStart.current = performance.now();
    const elapsed = performance.now() - igniteStart.current - (igniteDelay.get(id) ?? 0);
    return Math.max(0, Math.min(1, elapsed / FADE_MS));
  };

  const linkStroke = (link: L, p: Palette): string => {
    if (link.edge.id === activeEdge) return p["--amber"];
    if (link.counter || hasCounterEvidence(link.edge)) return p["--contra"];
    if (link.edge.level === "inferred") return p["--lvl-inferred"];
    if (link.edge.level === "text_mined" || link.edge.level === "search_hit") return p["--lvl-text"];
    return p["--star"];
  };

  return (
    <div ref={wrapRef} style={{ height }} className="relative w-full">
      {palette && width > 0 && (
        <ForceGraph2D<GraphNode, GraphLink>
          ref={graphRef}
          width={width}
          height={height}
          graphData={data}
          backgroundColor="rgba(0,0,0,0)"
          nodeId="id"
          warmupTicks={reducedMotion ? 160 : 20}
          cooldownTicks={reducedMotion ? 0 : 140}
          enableNodeDrag={!reducedMotion}
          linkHoverPrecision={8}
          onEngineStop={() => {
            if (fitted.current) return;
            fitted.current = true;
            graphRef.current?.zoomToFit(reducedMotion ? 0 : 400, narrow ? 28 : 56);
          }}
          linkCanvasObjectMode={() => "replace"}
          linkCanvasObject={(link, ctx, scale) => {
            const s = link.source as N;
            const t = link.target as N;
            if (typeof s !== "object" || typeof t !== "object" || s.x == null || t.x == null || s.y == null || t.y == null) return;
            const visible = Math.min(lit(String(s.id)), lit(String(t.id)));
            if (visible <= 0) return;
            const active = link.edge.id === activeEdge;
            const counter = link.counter || hasCounterEvidence(link.edge);
            const hovered = link === hoverLink;
            const level = LEVEL_INFO[link.edge.level]?.dash;
            // curated/observed 1.4 solid · text-mined [6,4] · inferred [1,3.5] round dots · counter-evidence 2 red · second hop 0.8 at half strength
            const px = active ? 2.4 : counter ? 2 : link.secondHop ? 0.8 : link.edge.level === "inferred" ? 1.6 : 1.4;
            const dash = counter || active ? null : level;
            ctx.save();
            ctx.globalAlpha = visible * (link.secondHop && !active ? 0.5 : 1) * (hovered ? 1 : 0.92);
            ctx.lineCap = "round";
            ctx.lineWidth = (px + (hovered ? 1.2 : 0)) / scale;
            ctx.strokeStyle = linkStroke(link, palette);
            ctx.setLineDash(dash ? dash.map((d) => d / scale) : []);
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.stroke();
            ctx.restore();
          }}
          linkPointerAreaPaint={(link, color, ctx, scale) => {
            const s = link.source as N;
            const t = link.target as N;
            if (typeof s !== "object" || typeof t !== "object" || s.x == null || t.x == null || s.y == null || t.y == null) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = 10 / scale;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            ctx.stroke();
          }}
          onLinkHover={(link) => setHoverLink(link ?? null)}
          onLinkClick={(link) => onLinkClick(link.edge)}
          onNodeHover={(node) => setHoverNode(node ? String(node.id) : null)}
          onNodeClick={(node) => onNodeClick(node as GraphNode)}
          nodeLabel={() => ""}
          linkLabel={(link) => `${link.counter ? "counter-example: similar phenotypes, different mechanism · " : ""}${link.edge.type.replaceAll("_", " ")} · ${link.edge.level} · click for evidence`}
          nodeCanvasObject={(node, ctx, scale) => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const r = RADIUS[node.kind];
            const alpha = lit(String(node.id));
            if (alpha <= 0) return;
            const px = 1 / scale; // one screen pixel in graph units
            const star = palette["--star"];
            const amber = palette["--amber"];
            ctx.save();
            ctx.globalAlpha = alpha;
            if (activeEnds.has(String(node.id))) {
              // the read edge keeps both ends lit
              ctx.fillStyle = withAlpha(amber, 0.22);
              ctx.beginPath();
              ctx.arc(x, y, r + 9, 0, 2 * Math.PI);
              ctx.fill();
              ctx.strokeStyle = amber;
              ctx.lineWidth = 1.2 * px;
              ctx.beginPath();
              ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
              ctx.stroke();
            }
            if (node.kind === "center") {
              for (const [grow, strength] of [[18, 0.07], [11, 0.13]] as const) {
                ctx.fillStyle = withAlpha(amber, strength);
                ctx.beginPath();
                ctx.arc(x, y, r + grow, 0, 2 * Math.PI);
                ctx.fill();
              }
              if (centerShape === "ring") {
                ctx.fillStyle = palette["--bg"];
                ctx.beginPath();
                ctx.arc(x, y, r + 1, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = amber;
                ctx.lineWidth = 2.6;
                ctx.stroke();
              } else {
                ctx.fillStyle = amber;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fill();
              }
            } else if (node.kind === "gene") {
              ctx.fillStyle = palette["--bg"];
              ctx.strokeStyle = star;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            } else if (node.kind === "phenotype") {
              ctx.fillStyle = palette["--star-dim"];
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              // disease, related disease, family, counter-example: filled soft light point, halo as a second circle
              ctx.fillStyle = withAlpha(star, 0.13);
              ctx.beginPath();
              ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
              ctx.fill();
              ctx.fillStyle = star;
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI);
              ctx.fill();
              if (node.kind === "family") {
                for (const k of [1, 2]) {
                  ctx.strokeStyle = withAlpha(star, k === 1 ? 0.7 : 0.38);
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.arc(x, y, r + k * 3.2, 0, 2 * Math.PI);
                  ctx.stroke();
                }
                ctx.fillStyle = palette["--bg"];
                ctx.font = `700 ${9 * px}px ${palette.sans}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(node.members ?? ""), x, y + 0.4 * px);
              }
              if (node.kind === "counter") {
                ctx.strokeStyle = palette["--contra"];
                ctx.lineWidth = 1.8;
                ctx.setLineDash([3, 2.4]);
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
                ctx.stroke();
              }
            }
            ctx.restore();
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, RADIUS[node.kind] + 9, 0, 2 * Math.PI);
            ctx.fill();
          }}
          onRenderFramePost={(ctx, scale) => {
            // labels in one pass on top of everything: hover first, then centre, genes, families, counter-examples; overlapping ones are skipped
            const px = 1 / scale;
            const graph = graphRef.current;
            const topLeft = graph?.screen2GraphCoords(0, 0);
            const bottomRight = graph?.screen2GraphCoords(width, height);
            const candidates = (data.nodes as N[])
              .filter((n) => n.x != null && n.y != null && (n.id === hoverNode || n.kind === "center" || n.kind === "gene" || n.kind === "family" || n.kind === "counter"))
              .sort((a, b) => (a.id === hoverNode ? -1 : b.id === hoverNode ? 1 : LABEL_PRIORITY[a.kind] - LABEL_PRIORITY[b.kind]));
            const placed: LabelBox[] = [];
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            for (const node of candidates) {
              const alpha = lit(String(node.id));
              if (alpha <= 0.4) continue;
              const hovered = node.id === hoverNode;
              const isCenter = node.kind === "center";
              const sizePx = isCenter ? (narrow ? 14 : 16) : 12;
              const maxWidthPx = isCenter ? (narrow ? 176 : 260) : narrow ? 112 : 168;
              ctx.font = isCenter
                ? `600 ${sizePx * px}px ${palette.display}`
                : `${hovered ? 600 : 500} ${sizePx * px}px ${palette.sans}`;
              // centre: wraps onto up to three lines and is cut with an ellipsis only beyond that (almost no disease name gets there)
              const lines = wrapLines(ctx, node.label, maxWidthPx * px, isCenter || hovered || node.kind === "family" ? 3 : 2);
              const lineHeight = (sizePx + 3) * px;
              const textWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
              const padX = 6 * px;
              const padY = 3 * px;
              const boxW = textWidth + padX * 2;
              const boxH = lines.length * lineHeight + padY * 2 - 3 * px;
              let cx = node.x as number;
              // keep the pill inside the window (375 px: nothing cut off)
              if (topLeft && bottomRight) {
                const margin = 4 * px;
                cx = Math.min(Math.max(cx, topLeft.x + boxW / 2 + margin), bottomRight.x - boxW / 2 - margin);
              }
              const gap = RADIUS[node.kind] + (node.kind === "family" ? 9 : isCenter ? 24 : 6);
              const boxAt = (top: number): LabelBox => ({ x0: cx - boxW / 2, y0: top - padY, x1: cx + boxW / 2, y1: top - padY + boxH });
              const belowTop = (node.y as number) + gap;
              const aboveTop = (node.y as number) - gap - boxH + padY * 2 - 1 * px;
              const clear = (b: LabelBox) =>
                !placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) &&
                !(data.nodes as N[]).some((o) => {
                  if (o === node || o.x == null || o.y == null) return false;
                  const reach = RADIUS[o.kind] + 4;
                  const nearestX = Math.max(b.x0, Math.min(o.x, b.x1));
                  const nearestY = Math.max(b.y0, Math.min(o.y, b.y1));
                  return (o.x - nearestX) ** 2 + (o.y - nearestY) ** 2 < reach * reach;
                });
              const hero = isCenter || node.kind === "gene" || node.kind === "family";
              const sideTop = (node.y as number) - boxH / 2 + padY;
              const spots: { box: LabelBox; top: number; x: number }[] = [
                { box: boxAt(belowTop), top: belowTop, x: cx },
                { box: boxAt(aboveTop), top: aboveTop, x: cx },
              ];
              if (hero && !narrow) {
                const side = gap + boxW / 2;
                for (const dx of [side, -side]) {
                  const sx = (node.x as number) + dx;
                  spots.push({ box: { x0: sx - boxW / 2, y0: sideTop - padY, x1: sx + boxW / 2, y1: sideTop - padY + boxH }, top: sideTop, x: sx });
                }
              }
              const labelFree = (b: LabelBox) => !placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
              let chosen = isCenter || hovered ? spots[0] : spots.find((spot) => clear(spot.box));
              if (!chosen && hero) chosen = spots.find((spot) => labelFree(spot.box)) ?? spots[0];
              if (!chosen) continue; // no free spot: skip this label (hover always shows it)
              const box = chosen.box;
              const top = chosen.top;
              cx = chosen.x;
              placed.push(box);
              ctx.globalAlpha = hovered || isCenter ? 1 : alpha;
              // the centre label is an opaque pill under the centre point, so lines and points behind it do not run through the text
              ctx.fillStyle = withAlpha(palette["--bg"], isCenter ? 0.94 : 0.8);
              ctx.beginPath();
              ctx.roundRect(box.x0, box.y0, boxW, boxH, 7 * px);
              ctx.fill();
              if (isCenter) {
                ctx.strokeStyle = withAlpha(palette["--amber"], 0.55);
                ctx.lineWidth = 1 * px;
                ctx.stroke();
              }
              ctx.fillStyle = node.kind === "counter" ? palette["--contra"] : palette["--ink"];
              lines.forEach((line, i) => ctx.fillText(line, cx, top + i * lineHeight));
            }
            ctx.restore();
          }}
        />
      )}
    </div>
  );
}
