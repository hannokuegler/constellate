export type DotState = "idle" | "lit" | "linked";

/** The brand point: idle = isolated light, lit = amber with halo, linked = amber and joined. Styles live in globals.css (.dot). */
export default function Dot({ state = "idle", label, className = "" }: { state?: DotState; label?: string; className?: string }) {
  return (
    <span
      className={`dot ${className}`.trim()}
      data-state={state === "idle" ? undefined : state}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
