"use client";

// Loaded only in the browser (dynamic import, ssr: false) — react-force-graph-2d touches window on import.
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Edge } from "@/lib/types";
import { LEVEL_INFO, hasCounterEvidence } from "@/lib/evidence";

export type GraphNodeKind = "center" | "gene" | "phenotype" | "neighbour" | "counter" | "disease";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
}

export interface GraphLink {
  source: string;
  target: string;
  edge: Edge;
  secondHop?: boolean;
}

type N = NodeObject<GraphNode>;
type L = LinkObject<GraphNode, GraphLink>;

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  height: number;
  onLinkClick: (edge: Edge) => void;
  onNodeClick: (node: GraphNode) => void;
}

const VARS = ["--n-center", "--n-gene", "--n-phenotype", "--n-neighbour", "--n-disease", "--lvl-strong", "--lvl-text", "--lvl-inferred", "--contra", "--warn", "--ink", "--ink-2", "--bg", "--surface"] as const;
type Palette = Record<(typeof VARS)[number], string>;

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(VARS.map((v) => [v, style.getPropertyValue(v).trim() || "#888"])) as Palette;
}

function usePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const update = () => setPalette(readPalette());
    update();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return palette;
}

const RADIUS: Record<GraphNodeKind, number> = { center: 9, gene: 6, neighbour: 6.5, counter: 6.5, disease: 6, phenotype: 4 };

export default function ForceGraphClient({ nodes, links, height, onLinkClick, onNodeClick }: Props) {
  const graphRef = useRef<ForceGraphMethods<N, L> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverLink, setHoverLink] = useState<L | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const palette = usePalette();
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const fitted = useRef(false);

  // the library mutates node/link objects, so hand it fresh copies whenever the input changes
  const data = useMemo(() => {
    fitted.current = false;
    return { nodes: nodes.map((n) => ({ ...n })) as N[], links: links.map((l) => ({ ...l })) as L[] };
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

  if (!palette) return <div ref={wrapRef} style={{ height }} />;

  const nodeColor = (kind: GraphNodeKind) =>
    ({ center: palette["--n-center"], gene: palette["--n-gene"], phenotype: palette["--n-phenotype"], neighbour: palette["--n-neighbour"], counter: palette["--n-neighbour"], disease: palette["--n-disease"] })[kind];

  const linkColor = (link: L) => {
    if (hasCounterEvidence(link.edge)) return palette["--contra"];
    if (link.edge.level === "inferred") return palette["--lvl-inferred"];
    if (link.edge.level === "text_mined" || link.edge.level === "search_hit") return palette["--lvl-text"];
    return palette["--lvl-strong"];
  };

  return (
    <div ref={wrapRef} style={{ height }} className="relative w-full">
      {width > 0 && (
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
            graphRef.current?.zoomToFit(reducedMotion ? 0 : 400, 36);
          }}
          linkColor={(link) => linkColor(link)}
          linkWidth={(link) => (link === hoverLink ? 3.5 : link.secondHop ? 0.8 : 1.6)}
          linkLineDash={(link) => {
            const dash = LEVEL_INFO[link.edge.level]?.dash;
            if (link.secondHop) return [1, 4];
            return dash ? dash.map((d) => d * 1.4) : null;
          }}
          onLinkHover={(link) => setHoverLink(link ?? null)}
          onLinkClick={(link) => onLinkClick(link.edge)}
          onNodeHover={(node) => setHoverNode(node ? String(node.id) : null)}
          onNodeClick={(node) => onNodeClick(node as GraphNode)}
          nodeLabel={(node) => `${node.label}`}
          linkLabel={(link) => `${link.edge.type.replaceAll("_", " ")} · ${link.edge.level} · click for evidence`}
          nodeCanvasObject={(node, ctx, scale) => {
            const r = RADIUS[node.kind];
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = nodeColor(node.kind);
            ctx.fill();
            if (node.kind === "center") {
              ctx.lineWidth = 3;
              ctx.strokeStyle = palette["--surface"];
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = palette["--n-center"];
              ctx.stroke();
            }
            if (node.kind === "counter") {
              ctx.beginPath();
              ctx.arc(x, y, r + 3.5, 0, 2 * Math.PI);
              ctx.setLineDash([3, 2]);
              ctx.lineWidth = 2;
              ctx.strokeStyle = palette["--warn"];
              ctx.stroke();
              ctx.setLineDash([]);
            }
            const hovered = hoverNode === node.id;
            const showLabel = node.kind !== "phenotype" || scale > 1.6 || hovered;
            if (!showLabel) return;
            const max = hovered || node.kind === "center" ? 48 : 26;
            const text = node.label.length > max ? `${node.label.slice(0, max - 1)}…` : node.label;
            const size = (node.kind === "center" ? 14 : node.kind === "phenotype" ? 10.5 : 12) / Math.max(scale, 0.6);
            ctx.font = `${node.kind === "center" || hovered ? 600 : 500} ${size}px ui-sans-serif, -apple-system, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.lineWidth = 3 / Math.max(scale, 0.6);
            ctx.strokeStyle = palette["--bg"];
            ctx.strokeText(text, x, y + r + 3);
            ctx.fillStyle = node.kind === "phenotype" ? palette["--ink-2"] : palette["--ink"];
            ctx.fillText(text, x, y + r + 3);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, RADIUS[node.kind] + 6, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />
      )}
    </div>
  );
}
