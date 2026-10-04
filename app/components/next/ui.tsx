"use client";

import type { ReactNode } from "react";
import type { Edge } from "@/lib/types";
import { useEdgePanel } from "../Providers";

const linkStyle = "text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current";

/** One plain-language card of the "What you can do now" block. */
export function NowCard({ id, title, children, wide = false, gap = false }: { id?: string; title: string; children: ReactNode; wide?: boolean; gap?: boolean }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`card scroll-mt-20 px-5 py-4 ${wide ? "md:col-span-2" : ""}`}>
      <h3 id={headingId} className="flex items-center gap-3 text-[20px] font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
        {gap ? <span className="dot-ring" aria-hidden="true" /> : <span className="dot" data-state="linked" style={{ ["--dot-link" as string]: "0px" }} aria-hidden="true" />}
        {title}
      </h3>
      <div className="mt-2 space-y-2.5 text-[17px] leading-relaxed">{children}</div>
    </section>
  );
}

/** External link that opens in a new tab, at least 44 px tall. */
export function Ext({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`inline-flex min-h-11 items-center ${linkStyle} ${className}`}>
      {children}
    </a>
  );
}

/**
 * "Source: EMA EMEA/H/C/005321 · 17 Dec 2020 · How we know" as one line of text that wraps like a sentence.
 * Link and button get a 44 px hit area from padding / negative margin, so the line itself stays compact.
 */
export function Source({ label, href, date, edge, about, prefix = true }: { label?: string | null; href?: string | null; date?: string | null; edge?: Edge | null; about: string; prefix?: boolean }) {
  const { openEdge } = useEdgePanel();
  const parts: ReactNode[] = [];
  if (label)
    parts.push(
      href ? (
        <a key="l" href={href} target="_blank" rel="noreferrer" className={`py-[13px] ${linkStyle} text-ink-2`}>
          {label}
        </a>
      ) : (
        <span key="l">{label}</span>
      ),
    );
  if (date) parts.push(<span key="d" className="tabular">{date}</span>);
  if (edge)
    parts.push(
      <button key="e" type="button" onClick={() => openEdge(edge)} className={`-my-3 inline-flex min-h-11 items-center align-middle font-medium ${linkStyle}`} aria-label={`How we know: ${about}`}>
        How we know
      </button>,
    );
  return (
    <p className="text-[16px] leading-relaxed text-ink-2">
      {prefix && label && "Source: "}
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {part}
        </span>
      ))}
    </p>
  );
}

export function Explain({ children }: { children: ReactNode }) {
  return <p className="rounded-[14px] bg-surface-2 px-4 py-3 text-[16px] leading-relaxed text-ink-2">{children}</p>;
}
