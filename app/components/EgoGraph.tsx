"use client";

import dynamic from "next/dynamic";
import type { Edge } from "@/lib/types";
import type { GraphLink, GraphNode } from "./ForceGraphClient";
import { LevelLine } from "./Badges";

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
}

export default function EgoGraph({ nodes, links, height, onLinkClick, onNodeClick, caption, showCounter = true, families = 0, expanded = false, onToggleFamilies }: Props) {
  return (
    <figure className="card overflow-hidden">
      <div
        role="img"
        aria-label={`${caption}. ${nodes.length} nodes and ${links.length} links. Every link is also listed with its evidence in the panel.`}
        style={{ height }}
      >
        <ForceGraphClient nodes={nodes} links={links} height={height} onLinkClick={onLinkClick} onNodeClick={onNodeClick} />
      </div>
      <figcaption className="border-t border-line px-4 py-3">
        <Legend showCounter={showCounter} />
        {families > 0 && onToggleFamilies && (
          <button onClick={onToggleFamilies} aria-pressed={expanded} className="mt-2 inline-flex min-h-11 items-center rounded-full border border-line px-3 text-[13px] font-medium text-accent hover:bg-accent-soft">
            {expanded ? "Group subtypes into families" : `Show all subtypes (${families} ${families === 1 ? "family" : "families"} grouped)`}
          </button>
        )}
        <p className="mt-2 text-[12px] text-ink-2">Click a line for its evidence, a node to open it. Hover a node for its name. Drag to rearrange, scroll or pinch to zoom.</p>
      </figcaption>
    </figure>
  );
}

const NODE_KEYS = [
  { label: "this disease", color: "var(--n-center)" },
  { label: "gene", color: "var(--n-gene)" },
  { label: "phenotype", color: "var(--n-phenotype)" },
  { label: "related disease", color: "var(--n-neighbour)" },
];

function FamilyKey() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-grid h-3.5 w-3.5 place-items-center rounded-full outline-1 outline-offset-1" style={{ background: "var(--n-neighbour)", outlineColor: "var(--n-neighbour)" }} aria-hidden="true" />
      subtype family (click to open)
    </span>
  );
}

export function Legend({ showCounter = true }: { showCounter?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ink-2">
      {NODE_KEYS.map((k) => (
        <span key={k.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: k.color }} aria-hidden="true" />
          {k.label}
        </span>
      ))}
      <FamilyKey />
      {showCounter && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full outline-2 outline-dashed outline-offset-1" style={{ background: "var(--n-neighbour)", outlineColor: "var(--warn)" }} aria-hidden="true" />
          mechanism differs
        </span>
      )}
      <span className="inline-flex items-center gap-1.5"><LevelLine level="curated" color="var(--lvl-strong)" />observed / curated (solid)</span>
      <span className="inline-flex items-center gap-1.5"><LevelLine level="text_mined" color="var(--lvl-text)" />text-mined (dashed)</span>
      <span className="inline-flex items-center gap-1.5"><LevelLine level="inferred" color="var(--lvl-inferred)" />inferred (dotted)</span>
      <span className="inline-flex items-center gap-1.5"><LevelLine level="curated" color="var(--contra)" />counter-evidence / counter-example</span>
    </div>
  );
}
