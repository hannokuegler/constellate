import type { EdgeLevel, NodeType } from "@/lib/types";
import { LEVEL_INFO } from "@/lib/evidence";

const LEVEL_STYLE: Record<EdgeLevel, string> = {
  observed: "bg-ok-soft text-ok",
  curated: "bg-surface-2 text-ink",
  text_mined: "bg-accent-soft text-accent",
  search_hit: "bg-accent-soft text-accent",
  inferred: "bg-[color-mix(in_srgb,var(--n-neighbour)_16%,transparent)] text-[color-mix(in_srgb,var(--n-neighbour)_70%,var(--ink))]",
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

const TYPE_STYLE: Record<NodeType, { label: string; dot: string }> = {
  disease: { label: "Disease", dot: "var(--n-disease)" },
  gene: { label: "Gene", dot: "var(--n-gene)" },
  phenotype: { label: "Symptom", dot: "var(--n-phenotype)" },
};

export function TypeBadge({ type }: { type: NodeType }) {
  const style = TYPE_STYLE[type];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-ink-2">
      <span className="h-2 w-2 rounded-full" style={{ background: style.dot }} aria-hidden="true" />
      {style.label}
    </span>
  );
}
