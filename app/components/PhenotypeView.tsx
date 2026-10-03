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
import HonestGap from "./HonestGap";
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
  if (file === null)
    return (
      <div className="mx-auto mt-8 max-w-[1100px]">
        <HonestGap
          variant="screen"
          title={`${label}: no disease list yet`}
          reason="This phenotype is in the index, but no disease file with it is published in the current data. We do not guess which diseases show it."
          searched={[{ source: "HPO phenotype.hpoa" }, { source: "Orphanet product4" }]}
          close={["Publish phenotype/<HP_ID>.json from the pipeline (all diseases annotated with this term)"]}
        />
      </div>
    );

  const url = xrefUrl(id);
  const rows = phenotypeDiseases(file);
  return (
    <div className="mx-auto mt-6 max-w-[900px]">
      <nav className="mb-3 text-[13px] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> / phenotype
      </nav>
      <h1 className="text-[28px] font-bold tracking-tight">{file.node.label}</h1>
      <p className="mt-1 text-[13px] text-ink-2">
        {url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">{id}</a> : id}
        {file.node.ic !== undefined && ` · information content ${file.node.ic.toFixed(2)} (higher = more specific)`}
      </p>
      <section className="card mt-6 px-4 py-4">
        <h2 className="text-[17px] font-semibold">
          Diseases with this phenotype <span className="tabular text-[13px] font-normal text-ink-2">{file.diseases_total ?? rows.length}</span>
        </h2>
        {file.diseases_total !== undefined && file.diseases_total > rows.length && (
          <p className="text-[13px] text-ink-2">Showing {rows.length} of {file.diseases_total}, sorted by annotation confidence.</p>
        )}
        <ul className="mt-2 divide-y divide-line">
          {rows.map(({ id: diseaseId, label: diseaseLabel, edge: e }) => (
            <li key={e.id} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <Link href={diseaseHref(diseaseId)} className="flex min-h-11 min-w-0 basis-full items-center text-[15px] underline-offset-2 hover:underline sm:basis-0 sm:flex-1">
                {diseaseLabel ?? index.get(diseaseId)?.label ?? diseaseId}
              </Link>
              <span className="tabular text-[12px] text-ink-2">conf. {formatConfidence(e.confidence)}</span>
              {hasCounterEvidence(e) ? <span className="rounded-full bg-contra-soft px-2 text-[12px] font-semibold text-contra">counter-evidence</span> : <LevelBadge level={e.level} small />}
              <EvidenceButton edge={e} onEdge={openEdge} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
