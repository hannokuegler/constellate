"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrgFile } from "@/lib/types";
import { loadOrg } from "@/lib/data";
import { diseaseHref } from "@/lib/ids";
import { RELATION_LABEL } from "@/lib/evidence";
import { useEdgePanel } from "./Providers";
import { LevelBadge } from "./Badges";
import { EvidenceButton } from "./DiseaseView";
import { DraftBadge, OrgAssets } from "./Orgs";
import { Skeleton } from "./Skeleton";

export default function OrgView({ slug }: { slug: string }) {
  const [file, setFile] = useState<OrgFile | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { openEdge, register } = useEdgePanel();

  useEffect(() => {
    loadOrg(slug).then(setFile, (e: Error) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (file) register(file.diseases.map((d) => d.edge), Object.fromEntries([[file.node.id, file.node.label], ...file.diseases.map((d) => [d.id, d.label])]));
  }, [file, register]);

  if (error) return <p className="card mt-6 px-5 py-5" role="alert">⚠️ Organisation data could not be loaded: {error}</p>;
  if (file === undefined) return <Skeleton />;
  if (file === null) return (
    <div className="page-shell max-w-[800px]">
      <p className="eyebrow">Data pending</p>
      <h1 className="page-heading">{slug}</h1>
      <p className="subtle mt-5">No detail page for this organisation is included in the current dataset. This is a missing record, not evidence that no connections exist.</p>
      <Link href="/" className="button button-primary mt-6">Return to search</Link>
    </div>
  );

  const org = file.node;
  const links = [
    { label: "Visit website", url: org.url },
    { label: "Open registry", url: org.registry_url },
    { label: "View natural history study", url: org.nhs_url },
    { label: "Find contact details", url: org.contact_url },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  return (
    <div className="page-shell">
      <nav className="mb-3 text-[1rem] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / patient organisation
      </nav>
      {org.draft_input && (
        <p className="mb-4 rounded-[12px] border border-warn/40 bg-warn-soft px-4 py-3 text-[1.0625rem] text-warn" role="note">
          <span className="font-semibold">Unverified draft.</span> This entry comes from a draft list and has not been checked against the organisation&apos;s own website yet. Do not contact on this basis alone.
        </p>
      )}
      <p className="eyebrow">Patient organisation</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="page-heading">{org.label}</h1>
        {org.draft_input && <DraftBadge />}
      </div>
      <p className="mt-1 text-[1.0625rem] text-ink-2">
        {[org.country, org.verified_date ? `verified ${org.verified_date}` : "not verified"].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-3"><OrgAssets org={org} /></div>
      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {links.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className={l.url === org.url ? "button button-primary" : "button"}>
              {l.label} ↗
            </a>
          ))}
        </div>
      )}

      <section className="answer-card mt-8">
        <h2 className="text-[17px] font-semibold">
          Diseases it represents <span className="tabular text-[1rem] font-normal text-ink-2">{file.diseases.length}</span>
        </h2>
        <p className="text-[1rem] text-ink-2">Matched from the disease names on the organisation&apos;s website; open “Evidence” to see how each name was matched.</p>
        <ul className="mt-2 divide-y divide-line">
          {file.diseases.map((d) => (
            <li key={d.edge.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <Link href={diseaseHref(d.id)} className="flex min-h-11 min-w-0 basis-full items-center text-[1.0625rem] underline-offset-2 hover:underline sm:basis-0 sm:flex-1">
                {d.label}
              </Link>

              <span className="text-[0.875rem] text-ink-2">{RELATION_LABEL[d.edge.type] ?? d.edge.type}</span>
              <LevelBadge level={d.edge.level} small />
              <EvidenceButton edge={d.edge} onEdge={openEdge} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
