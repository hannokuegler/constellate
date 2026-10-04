"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import type { Edge } from "@/lib/types";
import { hrefFor } from "@/lib/ids";
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
  /** gene page: the centre is a gene (drawn as a ring) */
  centerShape?: "point" | "ring";
}

const KIND_GROUPS: { kinds: GraphNode["kind"][]; title: string }[] = [
  { kinds: ["gene"], title: "Genes" },
  { kinds: ["neighbour", "disease", "counter", "family"], title: "Diseases" },
  { kinds: ["phenotype"], title: "Symptoms" },
];

/** Text alternative to the canvas: every node as a link, grouped by kind. Collapsed by default so it costs the page nothing. */
function NodeList({ nodes }: { nodes: GraphNode[] }) {
  const others = nodes.filter((n) => n.kind !== "center");
  // the entries are only in the DOM while the list is open: a closed list would otherwise answer every text query on the page twice
  const [open, setOpen] = useState(false);
  return (
    <details className="mt-2" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-[16px] font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-current">
        Show the graph as a list ({others.length})
      </summary>
      {open && <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
        {KIND_GROUPS.map((group) => {
          const items = others.filter((n) => group.kinds.includes(n.kind));
          if (!items.length) return null;
          return (
            <div key={group.title} className="min-w-0">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">{group.title} ({items.length})</h3>
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    {n.kind === "family" ? (
                      <span className="flex min-h-11 items-center text-[16px]">{n.label} ({n.members} subtypes, shown as one point)</span>
                    ) : (
                      <Link href={hrefFor(n.kind === "gene" ? "gene" : n.kind === "phenotype" ? "phenotype" : "disease", n.id)} className="flex min-h-11 items-center text-[16px] underline decoration-line underline-offset-2 hover:decoration-current">
                        {n.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>}
    </details>
  );
}

export default function EgoGraph({ nodes, links, height, onLinkClick, onNodeClick, caption, showCounter = true, families = 0, expanded = false, onToggleFamilies, centerShape = "point" }: Props) {
  const center = nodes.find((n) => n.kind === "center");
  const neighbourCount = nodes.length - (center ? 1 : 0);
  return (
    <figure className="card overflow-hidden">
      <div
        role="img"
        aria-label={`${caption}. Centre: ${center?.label ?? "none"}, with ${neighbourCount} connected points and ${links.length} links. Every link has an evidence button in the lists on this page; a list of all points is below the graph.`}
        style={{ height }}
      >
        <ForceGraphClient nodes={nodes} links={links} height={height} onLinkClick={onLinkClick} onNodeClick={onNodeClick} centerShape={centerShape} />
      </div>
      <figcaption className="border-t border-line px-4 py-3">
        <Legend showCounter={showCounter} gene={centerShape === "ring"} />
        {families > 0 && onToggleFamilies && (
          <button onClick={onToggleFamilies} aria-pressed={expanded} className="mt-2 inline-flex min-h-11 items-center rounded-full border border-line px-3 text-[16px] font-medium text-accent hover:bg-accent-soft">
            {expanded ? "Group subtypes into families" : `Show all subtypes (${families} ${families === 1 ? "family" : "families"} grouped)`}
          </button>
        )}
        <p className="mt-2 text-[16px] text-ink-2">Click a line for its evidence, a node to open it. Hover a node for its name. Drag to rearrange, scroll or pinch to zoom.</p>
        <NodeList nodes={nodes} />
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

export function Legend({ showCounter = true, gene = false }: { showCounter?: boolean; gene?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink-2">
      {NODE_KEYS.map((k) => (
        <span key={k.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: k.color }} aria-hidden="true" />
          {gene && k.label === "this disease" ? "this gene" : k.label}
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
