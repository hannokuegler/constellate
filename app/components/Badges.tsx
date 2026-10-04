import type { EdgeLevel, NodeType } from "@/lib/types";
import { LEVEL_INFO } from "@/lib/evidence";

const LEVEL_STYLE: Record<EdgeLevel, string> = {
  observed: "bg-surface-2 text-ink",
  curated: "bg-surface-2 text-ink",
  text_mined: "bg-[color-mix(in_srgb,var(--lvl-text)_14%,transparent)] text-lvl-text",
  search_hit: "bg-[color-mix(in_srgb,var(--lvl-text)_14%,transparent)] text-lvl-text",
  inferred: "bg-[color-mix(in_srgb,var(--lvl-inferred)_14%,transparent)] text-lvl-inferred",
  contradicted: "bg-contra-soft text-contra",
};

export function LevelBadge({ level, small = false }: { level: EdgeLevel; small?: boolean }) {
  return (
    <span
      title={LEVEL_INFO[level]?.meaning}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${small ? "px-2 py-0 text-[12px]" : "px-2.5 py-0.5 text-[12px]"} ${LEVEL_STYLE[level] ?? "bg-surface-2"}`}
    >
      <LevelLine level={level} />
      {LEVEL_INFO[level]?.label ?? level}
    </span>
  );
}

/** Tiny line sample that matches the edge style in the graph. */
export function LevelLine({ level, color = "currentColor" }: { level: EdgeLevel; color?: string }) {
  const dash = LEVEL_INFO[level]?.dash;
  return (
    <svg width="16" height="6" viewBox="0 0 16 6" aria-hidden="true">
      <line x1="1" y1="3" x2="15" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dash ? dash.join(" ") : undefined} />
    </svg>
  );
}

/** Node type is carried by shape and brightness, never by hue: disease filled, gene hollow ring, symptom small dim point, patient group rounded square. */
const TYPE_LABEL: Record<NodeType, string> = { disease: "Disease", gene: "Gene", phenotype: "Symptom", org: "Patient group" };

function TypeShape({ type }: { type: NodeType }) {
  if (type === "gene") return <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-star" aria-hidden="true" />;
  if (type === "phenotype") return <span className="h-1.5 w-1.5 rounded-full bg-star-dim" aria-hidden="true" />;
  if (type === "org") return <span className="h-2.5 w-2.5 rounded-[3px] border-[1.5px] border-ink-2" aria-hidden="true" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-star" aria-hidden="true" />;
}

export function TypeBadge({ type }: { type: NodeType }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-ink-2">
      <span className="grid h-3 w-3 place-items-center"><TypeShape type={type} /></span>
      {TYPE_LABEL[type]}
    </span>
  );
}
