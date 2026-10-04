"use client";

import Link from "next/link";
import type { Edge, OrgCard } from "@/lib/types";
import { orgHref } from "@/lib/ids";
import { flag } from "@/lib/normalize";
import { LevelBadge } from "./Badges";

export function DraftBadge() {
  return (
    <span className="rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[12px] font-semibold text-ink" title="From a draft list, not yet hand-verified against the organisation's website">
      unverified draft
    </span>
  );
}

/** Registry / natural-history study / biobank as stated in the curated list (links when given). */
export function OrgAssets({ org }: { org: OrgCard }) {
  const items = [
    { label: "registry", value: flag(org.has_registry), url: org.registry_url },
    { label: "natural history study", value: flag(org.has_natural_history_study), url: org.nhs_url },
    { label: "biobank", value: flag(org.has_biobank), url: null },
  ].filter((i) => i.value !== null);
  if (!items.length) return <span className="text-[12px] text-ink-2">assets not recorded</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => {
        const chip = (
          <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${i.value ? "border border-line-strong text-ink" : "border border-dashed border-line text-ink-2"}`}>
            {i.value ? `✓ ${i.label}` : `no ${i.label}`}
          </span>
        );
        return i.value && i.url ? (
          <a key={i.label} href={i.url} target="_blank" rel="noreferrer" className="-my-2.5 inline-flex min-h-11 items-center" aria-label={`${org.label}: ${i.label}`}>
            {chip}
          </a>
        ) : (
          <span key={i.label}>{chip}</span>
        );
      })}
    </span>
  );
}

export function OrgList({ orgs, onEdge }: { orgs: { org: OrgCard; edge: Edge }[]; onEdge: (e: Edge) => void }) {
  return (
    <ul className="divide-y divide-line">
      {orgs.map(({ org, edge }) => (
        <li key={org.id} className="py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={orgHref(org.id)} className="flex min-h-11 min-w-0 flex-1 items-center text-[15px] font-semibold underline decoration-line underline-offset-2 hover:decoration-current">
              {org.label}
            </Link>
            {org.draft_input && <DraftBadge />}
            <LevelBadge level={edge.level} small />
            <button onClick={() => onEdge(edge)} aria-label={`Evidence: patient organisation ${org.label}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-current hover:bg-surface-2">
              Evidence
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
            {org.country && <span>{org.country}</span>}
            <OrgAssets org={org} />
            <span>{org.verified_date ? `verified ${org.verified_date}` : "not verified"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
