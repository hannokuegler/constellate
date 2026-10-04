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
import HonestGap from "./HonestGap";
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
  if (file === null)
    return (
      <div className="mx-auto mt-8 max-w-[1100px]">
        <HonestGap
          variant="screen"
          title={`No organisation page for “${slug}”`}
          reason="This organisation is not in the curated list of the current data set."
          searched={[{ source: "Curated organisation list (hand-checked)", query: `entry “${slug}”`, hits: 0 }]}
          close={["An entry in the curated organisation list with URL and verification date"]}
        />
      </div>
    );

  const org = file.node;
  const links = [
    { label: "Website", url: org.url },
    { label: "Registry", url: org.registry_url },
    { label: "Natural history study", url: org.nhs_url },
    { label: "Contact", url: org.contact_url },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  return (
    <div className="mx-auto mt-6 max-w-[1000px]">
      <nav className="mb-3 text-[13px] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / patient organisation
      </nav>
      {org.draft_input && (
        <p className="mb-4 rounded-[12px] border border-dashed border-line-strong px-4 py-3 text-[15px]" role="note">
          <span className="font-semibold">Unverified draft.</span> This entry comes from a draft list and has not been checked against the organisation&apos;s own website yet. Do not contact on this basis alone.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="t-h1 text-[28px] font-semibold tracking-tight md:text-[40px]">{org.label}</h1>
        {org.draft_input && <DraftBadge />}
      </div>
      <p className="mt-1 text-[15px] text-ink-2">
        {[org.country, org.verified_date ? `verified ${org.verified_date}` : "not verified"].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-3"><OrgAssets org={org} /></div>
      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="btn-secondary">
              {l.label} ↗
            </a>
          ))}
        </div>
      )}

      <section className="card mt-6 px-4 py-4">
        <h2 className="text-[20px] font-semibold">
          Diseases it represents <span className="tabular text-[13px] font-normal text-ink-2">{file.diseases.length}</span>
        </h2>
        <p className="text-[13px] text-ink-2">Matched from the disease names on the organisation&apos;s website; open “Evidence” to see how each name was matched.</p>
        <ul className="mt-2 divide-y divide-line">
          {file.diseases.map((d) => (
            <li key={d.edge.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <Link href={diseaseHref(d.id)} className="flex min-h-11 min-w-0 basis-full items-center break-words text-[15px] underline decoration-line underline-offset-2 hover:decoration-current sm:basis-0 sm:flex-1">
                {d.label}
              </Link>
              {d.in_core && <span className="rounded-full border border-line px-2 text-[12px] font-medium text-ink-2">core</span>}
              <span className="text-[12px] text-ink-2">{RELATION_LABEL[d.edge.type] ?? d.edge.type}</span>
              <LevelBadge level={d.edge.level} small />
              <EvidenceButton edge={d.edge} onEdge={openEdge} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
