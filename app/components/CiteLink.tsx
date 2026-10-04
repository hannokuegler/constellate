"use client";

import { useEdgePanel } from "./Providers";

/** [e_xxx] reference that opens the edge panel. */
export default function CiteLink({ id }: { id: string }) {
  const { openEdge } = useEdgePanel();
  return (
    <button
      onClick={() => openEdge(id)}
      className="group -my-3 inline-flex min-h-11 items-center align-baseline"
      aria-label={`Open evidence ${id}`}
    >
      <sup className="relative ml-0.5 mr-0.5 font-mono text-[12px] font-medium leading-none text-ink-2 underline decoration-line decoration-dotted underline-offset-2 group-hover:text-ink group-hover:decoration-current">
        {id}
      </sup>
    </button>
  );
}

/** Renders text with inline [e_…] tokens as clickable citations. */
export function CitedText({ text }: { text: string }) {
  const parts = text.split(/(\[e_[0-9a-f]{6,16}\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(e_[0-9a-f]{6,16})\]$/);
        return match ? <CiteLink key={i} id={match[1]} /> : <span key={i}>{part}</span>;
      })}
    </>
  );
}
