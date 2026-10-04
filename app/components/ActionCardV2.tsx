"use client";

import { useEffect } from "react";
import type { V2Group, V2Model, V2Row } from "@/lib/actionv2";
import { useEdgePanel } from "./Providers";
import { LevelBadge } from "./Badges";
import CiteLink from "./CiteLink";
import { GapNote } from "./HonestGap";
import { plainSnippet } from "@/lib/present";

function Row({ row }: { row: V2Row }) {
  return (
    <li className="border-b border-line py-2.5 last:border-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[17px] font-medium">{row.title}</span>
        <LevelBadge level={row.level} small />
        {row.edgeId && <CiteLink id={row.edgeId} />}
      </div>
      {!!row.chips.length && <p className="mt-0.5 text-[16px] text-ink-2">{row.chips.join(" · ")}</p>}
      {row.detail && <p className="text-[16px] text-ink-2">{row.detail}</p>}
      {row.caveat && (
        <p className="mt-1.5 flex items-start gap-2 text-[16px] font-medium leading-snug text-ink">
          <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line-strong text-[12px] font-semibold leading-none" aria-hidden="true">≠</span>
          <span className="min-w-0">{row.caveat}</span>
        </p>
      )}
      {row.snippet && <p className="mt-1 text-[16px] italic text-ink-2">“{plainSnippet(row.snippet)}”</p>}
      {!!row.sources.length && (
        <p className="mt-1 flex flex-wrap gap-x-3 text-[16px]">
          {row.sources.map((s) =>
            s.href ? (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-ink underline decoration-line underline-offset-2 hover:decoration-current">
                {s.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span key={s.label} className="inline-flex min-h-11 items-center text-ink-2">{s.label}</span>
            ),
          )}
        </p>
      )}
    </li>
  );
}

function Group({ group, showName, Heading }: { group: V2Group; showName: boolean; Heading: "h3" | "h4" | "h5" }) {
  return (
    <div className="mt-3">
      {showName && <Heading className="mb-1 text-[16px] font-semibold text-ink-2">{group.diseaseLabel}</Heading>}
      {group.state === "items" ? (
        <>
          <ul>{group.rows.map((r) => <Row key={r.key} row={r} />)}</ul>
          {group.note && (
            <details className="mt-1 text-[15px] text-ink-2">
              <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-current">How this link is computed</summary>
              <p className="break-words pb-1 leading-snug">{group.note}</p>
            </details>
          )}
        </>
      ) : (
        <GapNote kind={group.state}>{group.note}</GapNote>
      )}
    </div>
  );
}

/** The five data-v2 sections of the action card. `level` is the heading level of the card's section titles. */
export default function ActionCardV2({ model, level }: { model: V2Model; level: "h2" | "h3" }) {
  const { register } = useEdgePanel();
  useEffect(() => {
    register(model.edges, model.labels);
  }, [model, register]);

  const Title = level;
  const Sub = level === "h2" ? "h3" : "h4";
  return (
    <div className="border-t border-line px-5 py-5 md:px-6" data-testid="action-card-v2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">Assets and context</p>
        {model.fixture && (
          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[12px] font-semibold text-warn" title="Test data from app/fixtures, not pipeline output">
            FIXTURE data, not real
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        {model.sections.map((section) => (
          <section key={section.key} aria-label={section.title} data-section={section.key}>
            <Title className="text-[20px] font-semibold">{section.title}</Title>
            <p className="text-[16px] text-ink-2">{section.hint}</p>
            {section.groups.map((g) => (
              <Group key={g.role} group={g} showName={section.groups.length > 1 || g.role === "pair"} Heading={Sub} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
