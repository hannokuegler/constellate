"use client";

import { useEdgePanel } from "./Providers";

/** [e_xxx] reference that opens the edge panel. */
export default function CiteLink({ id }: { id: string }) {
  const { openEdge } = useEdgePanel();
  return (
    <button
      onClick={() => openEdge(id)}
      className="group -my-3 mx-0.5 inline-flex min-h-11 items-center align-baseline font-mono text-[12px] font-medium text-accent"
      aria-label={`Open evidence ${id}`}
    >
      <span className="rounded-[6px] bg-accent-soft px-1.5 py-0.5 leading-none group-hover:underline">{id}</span>
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
