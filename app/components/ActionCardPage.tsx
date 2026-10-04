"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DiseaseFile, Meta } from "@/lib/types";
import { loadDisease, loadMeta } from "@/lib/data";
import { diseaseHref, toFileKey } from "@/lib/ids";
import { useRouter } from "next/navigation";
import ActionCard from "./ActionCard";
import { GLANCE_RESERVE_PX, pickDefaultVia } from "@/lib/actioncard";
import { ActionCardBodySkeleton, ExplainPlaceholder, SkelDots } from "./Skeleton";

/**
 * Same blocks in the same order as the loading card in ActionCard.tsx (header, "At a glance" reserve, "In plain language", columns),
 * so the switch from this skeleton to the card moves nothing (layout shift at 375 px was 0.106 from a block that vanished).
 */
function PageSkeleton() {
  return (
    <div className="mx-auto mt-6 max-w-[1200px]" aria-busy="true" aria-label="Loading">
      <div className="mb-4 flex h-11 items-center"><SkelDots /></div>
      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-5 md:px-6">
          <div className="skel-block h-4 w-24 !rounded-[8px]" />
          <div className="skel-block mt-2 h-8 w-4/5 max-w-[640px] !rounded-[12px]" />
          <div className="skel-block mt-2 h-5 w-full max-w-[720px] !rounded-[10px]" />
          <div className="mt-4 flex flex-wrap gap-2">
            {[200, 170, 90, 190].map((w) => (
              <span key={w} className="skel-block inline-block h-11 !rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="border-b border-line" style={{ minHeight: GLANCE_RESERVE_PX }} />
        <div className="border-b border-line px-5 py-5 md:px-6"><ExplainPlaceholder /></div>
        <ActionCardBodySkeleton />
      </div>
    </div>
  );
}

export default function ActionCardPage({ id, via }: { id: string; via: string | null }) {
  const router = useRouter();
  const [file, setFile] = useState<DiseaseFile | null | undefined>(undefined);
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    loadDisease(id).then(setFile, () => setFile(null));
    loadMeta().then(setMeta, () => undefined);
  }, [id]);

  if (file === undefined) return <PageSkeleton />;
  if (file === null)
    return (
      <div className="card mx-auto mt-8 max-w-[720px] px-5 py-5">
        <p className="font-semibold">No data file for {id}.</p>
        <Link href={diseaseHref(id)} className="mt-2 inline-block text-ink underline decoration-line underline-offset-2 hover:decoration-current">Open the disease page</Link>
      </div>
    );

  const viaId = via ?? pickDefaultVia(file.neighbours);
  return (
    <div className="mx-auto mt-6 max-w-[1200px]">
      <nav className="no-print mb-4 text-[16px] text-ink-2" aria-label="Breadcrumb">
        <Link href="/" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">Search</Link> /{" "}
        <Link href={diseaseHref(id)} className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">{file.node.label}</Link> / Action card
      </nav>
      {viaId ? (
        <ActionCard
          disease={file}
          viaId={viaId}
          meta={meta}
          standalone
          onViaChange={(next) => router.replace(`${diseaseHref(id)}/action?via=${toFileKey(next)}`)}
        />
      ) : (
        <p className="card px-5 py-5">No related disease for {file.node.label}, so there is nothing to build an action card from.</p>
      )}
    </div>
  );
}
