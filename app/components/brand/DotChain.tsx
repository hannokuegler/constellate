import Dot, { type DotState } from "./Dot";

/** A row of dots joined by hairlines; a segment turns amber when the dot it leads to is linked or lit. */
export default function DotChain({ states, label, className = "" }: { states: DotState[]; label?: string; className?: string }) {
  return (
    <span className={`dot-chain ${className}`.trim()} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {states.map((state, i) => (
        <Dot key={i} state={state} />
      ))}
    </span>
  );
}
