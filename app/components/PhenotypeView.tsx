"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { IndexEntry, PhenotypeFile } from "@/lib/types";
import { loadIndexMap, loadPhenotype } from "@/lib/data";
import { diseaseHref, xrefUrl } from "@/lib/ids";
import { formatConfidence, hasCounterEvidence } from "@/lib/evidence";
import { useEdgePanel } from "./Providers";
import { phenotypeDiseases } from "@/lib/normalize";
import { LevelBadge } from "./Badges";
import { EvidenceButton } from "./DiseaseView";
import { Skeleton } from "./Skeleton";

export default function PhenotypeView({ id }: { id: string }) {
  const [file, setFile] = useState<PhenotypeFile | null | undefined>(undefined);
  const [index, setIndex] = useState<Map<string, IndexEntry> | null>(null);
  const { openEdge, register } = useEdgePanel();

  useEffect(() => {
    loadPhenotype(id).then(setFile, () => setFile(null));
    loadIndexMap().then(setIndex, () => setIndex(new Map()));
  }, [id]);

  useEffect(() => {
    if (!file || !index) return;
    const rows = phenotypeDiseases(file);
    register(rows.map((r) => r.edge), Object.fromEntries([[file.node.id, file.node.label], ...rows.map((r) => [r.id, r.label ?? index.get(r.id)?.label ?? r.id])]));
  }, [file, index, register]);

  if (file === undefined || !index) return <Skeleton />;
  const label = index.get(id)?.label ?? id;
  if (file === null) return (
    <div className="page-shell max-w-[800px]">
      <p className="eyebrow">Data pending</p>
      <h1 className="page-heading">{label}</h1>
      <p className="subtle mt-5">No detail page for this clinical feature is included in the current dataset. This is a missing record, not evidence that no connections exist.</p>
      <Link href="/" className="button button-primary mt-6">Return to search</Link>
    </div>
  );

  const url = xrefUrl(id);
  const rows = phenotypeDiseases(file);
  return (
    <div className="page-shell">
      <nav className="mb-3 text-[1rem] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / phenotype
      </nav>
      <p className="eyebrow">Symptom or clinical feature</p>
      <h1 className="page-heading">{file.node.label}</h1>
      <p className="mt-1 text-[1rem] text-ink-2">
        {url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">{id}</a> : id}
        {file.node.ic !== undefined && ` · information content ${file.node.ic.toFixed(2)} (higher = more specific)`}
      </p>
      <section className="answer-card mt-8">
        <h2 className="text-[17px] font-semibold">
          Diseases with this phenotype <span className="tabular text-[1rem] font-normal text-ink-2">{file.diseases_total ?? rows.length}</span>
        </h2>
        {file.diseases_total !== undefined && file.diseases_total > rows.length && (
          <p className="text-[1rem] text-ink-2">Showing {rows.length} of {file.diseases_total}, sorted by annotation confidence.</p>
        )}
        <ul className="mt-2 divide-y divide-line">
          {rows.map(({ id: diseaseId, label: diseaseLabel, edge: e }) => (
            <li key={e.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <Link href={diseaseHref(diseaseId)} className="flex min-h-11 min-w-0 basis-full items-center text-[1.0625rem] underline-offset-2 hover:underline sm:basis-0 sm:flex-1">
                {diseaseLabel ?? index.get(diseaseId)?.label ?? diseaseId}
              </Link>
              <span className="tabular text-[0.875rem] text-ink-2">conf. {formatConfidence(e.confidence)}</span>
              {hasCounterEvidence(e) ? <span className="rounded-full bg-contra-soft px-2 text-[0.875rem] font-semibold text-contra">counter-evidence</span> : <LevelBadge level={e.level} small />}
              <EvidenceButton edge={e} onEdge={openEdge} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
