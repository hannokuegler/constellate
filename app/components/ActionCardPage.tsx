"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DiseaseFile, Meta } from "@/lib/types";
import { loadDisease, loadMeta } from "@/lib/data";
import { diseaseHref, toFileKey } from "@/lib/ids";
import { useRouter } from "next/navigation";
import ActionCard from "./ActionCard";
import { pickDefaultVia } from "@/lib/actioncard";
import { Skeleton } from "./Skeleton";

export default function ActionCardPage({ id, via }: { id: string; via: string | null }) {
  const router = useRouter();
  const [file, setFile] = useState<DiseaseFile | null | undefined>(undefined);
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    loadDisease(id).then(setFile, () => setFile(null));
    loadMeta().then(setMeta, () => undefined);
  }, [id]);

  if (file === undefined) return <Skeleton />;
  if (file === null)
    return (
      <div className="card mx-auto mt-8 max-w-[720px] px-5 py-5">
        <p className="font-semibold">No data file for {id}.</p>
        <Link href={diseaseHref(id)} className="mt-2 inline-block text-accent underline">Open the disease page</Link>
      </div>
    );

  const viaId = via ?? pickDefaultVia(file.neighbours);
  return (
    <div className="page-shell">
      <nav className="no-print mb-4 text-[1rem] text-ink-2" aria-label="Breadcrumb">
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
