"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { Edge } from "@/lib/types";
import type { GraphLink, GraphNode } from "./ForceGraphClient";

const ForceGraphClient = dynamic(() => import("./ForceGraphClient"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[13px] text-ink-2">Drawing the graph…</div>,
});

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  height: number;
  onLinkClick: (edge: Edge) => void;
  onNodeClick: (node: GraphNode) => void;
  caption: string;
  showCounter?: boolean;
  /** number of subtype families that can be bundled; 0 hides the toggle */
  families?: number;
  expanded?: boolean;
  onToggleFamilies?: () => void;
  /** gene page: the centre is a gene (amber ring) */
  centerShape?: "point" | "ring";
}

/** The graph window is the night sky in both themes: it carries its own dark tokens, the canvas reads them from here. */
export const SKY_VARS = {
  "--bg": "#0B1020",
  "--surface": "#121831",
  "--surface-2": "#1A2142",
  "--ink": "#ECEEF6",
  "--ink-2": "#A3AAC4",
  "--line": "#262E52",
  "--accent": "#ECEEF6",
  "--accent-ink": "#0B1020",
  "--accent-soft": "rgb(236 238 246 / 0.10)",
  "--amber": "#F5C46B",
  "--star": "#D7DBEA",
  "--star-dim": "#8D94B0",
  "--lvl-strong": "#D7DBEA",
  "--lvl-text": "#7CB4FF",
  "--lvl-inferred": "#B8A2FF",
  "--contra": "#FF7B7B",
  colorScheme: "dark",
} as CSSProperties;

const SKY_BACKGROUND = [
  "radial-gradient(1.2px 1.2px at 9% 14%, rgb(236 238 246 / 0.55) 50%, transparent 51%)",
  "radial-gradient(1px 1px at 27% 83%, rgb(236 238 246 / 0.4) 50%, transparent 51%)",
  "radial-gradient(1.2px 1.2px at 71% 9%, rgb(236 238 246 / 0.5) 50%, transparent 51%)",
  "radial-gradient(1px 1px at 91% 66%, rgb(236 238 246 / 0.45) 50%, transparent 51%)",
  "radial-gradient(1px 1px at 56% 93%, rgb(236 238 246 / 0.35) 50%, transparent 51%)",
  "radial-gradient(1.2px 1.2px at 4% 58%, rgb(236 238 246 / 0.4) 50%, transparent 51%)",
  "radial-gradient(1px 1px at 84% 31%, rgb(236 238 246 / 0.35) 50%, transparent 51%)",
  "radial-gradient(ellipse 70% 60% at 50% 46%, #141b38 0%, #0B1020 75%)",
].join(", ");

export default function EgoGraph({ nodes, links, height, onLinkClick, onNodeClick, caption, showCounter = true, families = 0, expanded = false, onToggleFamilies, centerShape = "point" }: Props) {
  return (
    <figure className="card overflow-hidden text-ink" style={{ ...SKY_VARS, background: "var(--bg)", borderColor: "var(--line)" }}>
      <div
        role="img"
        aria-label={`${caption}. ${nodes.length} nodes and ${links.length} links. Every link is also listed with its evidence in the panel.`}
        style={{ height, background: SKY_BACKGROUND }}
      >
        <ForceGraphClient nodes={nodes} links={links} height={height} onLinkClick={onLinkClick} onNodeClick={onNodeClick} centerShape={centerShape} />
      </div>
      <figcaption className="border-t border-line px-4 py-3">
        <Legend showCounter={showCounter} gene={centerShape === "ring"} />
        {families > 0 && onToggleFamilies && (
          <button onClick={onToggleFamilies} aria-pressed={expanded} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[13px] font-medium text-ink hover:bg-surface-2">
            {expanded ? "Group subtypes into families" : `Show all subtypes (${families} ${families === 1 ? "family" : "families"} grouped)`}
          </button>
        )}
        <p className="mt-2 text-[13px] text-ink-2">Click a line for its evidence, a node to open it. Hover a node for its name. Drag to rearrange, scroll or pinch to zoom.</p>
      </figcaption>
    </figure>
  );
}

const STAR = "var(--star, #D7DBEA)";
const DIM = "var(--star-dim, #8D94B0)";
const AMBER = "var(--amber, #F5C46B)";
const CONTRA = "var(--contra, #FF7B7B)";

function Shape({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

/** Line sample in the exact style the graph draws. */
function Line({ kind }: { kind: "solid" | "dashed" | "dotted" | "counter" }) {
  const color = kind === "dashed" ? "var(--lvl-text, #7CB4FF)" : kind === "dotted" ? "var(--lvl-inferred, #B8A2FF)" : kind === "counter" ? CONTRA : STAR;
  return (
    <svg width="22" height="8" viewBox="0 0 22 8" aria-hidden="true" className="shrink-0">
      <line
        x1="2"
        y1="4"
        x2="20"
        y2="4"
        stroke={color}
        strokeWidth={kind === "counter" ? 2 : kind === "dotted" ? 1.6 : 1.4}
        strokeLinecap="round"
        strokeDasharray={kind === "dashed" ? "6 4" : kind === "dotted" ? "1 3.5" : undefined}
      />
    </svg>
  );
}

export function Legend({ showCounter = true, gene = false }: { showCounter?: boolean; gene?: boolean }) {
  const item = "inline-flex items-center gap-1.5";
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink-2">
      <span className={item}>
        <Shape>
          <circle cx="9" cy="9" r="7.5" fill={AMBER} opacity=".16" />
          {gene ? <circle cx="9" cy="9" r="4" fill="none" stroke={AMBER} strokeWidth="2" /> : <circle cx="9" cy="9" r="4" fill={AMBER} />}
        </Shape>
        {gene ? "this gene" : "this disease"}
      </span>
      <span className={item}>
        <Shape>
          <circle cx="9" cy="9" r="4.4" fill="none" stroke={STAR} strokeWidth="1.8" />
        </Shape>
        gene
      </span>
      <span className={item}>
        <Shape>
          <circle cx="9" cy="9" r="2.4" fill={DIM} />
        </Shape>
        phenotype
      </span>
      <span className={item}>
        <Shape>
          <circle cx="9" cy="9" r="7" fill={STAR} opacity=".14" />
          <circle cx="9" cy="9" r="4.2" fill={STAR} />
        </Shape>
        related disease
      </span>
      <span className={item}>
        <Shape>
          <circle cx="9" cy="9" r="8.4" fill="none" stroke={STAR} strokeWidth="1" opacity=".4" />
          <circle cx="9" cy="9" r="6.4" fill="none" stroke={STAR} strokeWidth="1" opacity=".7" />
          <circle cx="9" cy="9" r="4" fill={STAR} />
        </Shape>
        subtype family (click to open)
      </span>
      {showCounter && (
        <span className={item}>
          <Shape>
            <circle cx="9" cy="9" r="3.8" fill={STAR} />
            <circle cx="9" cy="9" r="7" fill="none" stroke={CONTRA} strokeWidth="1.6" strokeDasharray="3 2.4" strokeLinecap="round" />
          </Shape>
          mechanism differs
        </span>
      )}
      <span className={item}><Line kind="solid" />observed / curated (solid)</span>
      <span className={item}><Line kind="dashed" />text-mined (dashed)</span>
      <span className={item}><Line kind="dotted" />inferred (dotted)</span>
      <span className={item}><Line kind="counter" />counter-evidence / counter-example</span>
    </div>
  );
}
