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
}

export default function EgoGraph({ nodes, links, height, onLinkClick, onNodeClick, caption, showCounter = true }: Props) {
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
        <p className="mt-2 text-[12px] text-ink-2">Click a line for its evidence, a node to open it. Drag to rearrange, scroll or pinch to zoom.</p>
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

export function Legend({ showCounter = true }: { showCounter?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ink-2">
      {NODE_KEYS.map((k) => (
        <span key={k.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: k.color }} aria-hidden="true" />
          {k.label}
        </span>
      ))}
      {showCounter && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full outline-2 outline-dashed outline-offset-1" style={{ background: "var(--n-neighbour)", outlineColor: "var(--warn)" }} aria-hidden="true" />
          mechanism differs
        </span>
      )}
      <span className="inline-flex items-center gap-1.5"><LevelLine level="curated" color="var(--lvl-strong)" />observed / curated</span>
      <span className="inline-flex items-center gap-1.5"><LevelLine level="text_mined" color="var(--lvl-text)" />text-mined</span>
      <span className="inline-flex items-center gap-1.5"><LevelLine level="inferred" color="var(--lvl-inferred)" />inferred</span>
      <span className="inline-flex items-center gap-1.5"><LevelLine level="curated" color="var(--contra)" />has counter-evidence</span>
    </div>
  );
}
