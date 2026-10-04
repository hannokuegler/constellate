"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Meta } from "@/lib/types";
import { loadMeta } from "@/lib/data";
import { formatDate } from "@/lib/evidence";
import { metaCount } from "@/lib/normalize";

const count = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("en") : "?");

/** Diseases without any mapped neighbour. Read from meta only: core.json (1.7 MB) is not downloaded for a footer line. */
function isolatedDiseases(meta: Meta): number | null {
  const counts = meta.counts as Record<string, unknown>;
  for (const key of ["isolated_diseases", "diseases_without_edge", "diseases_without_neighbour"]) {
    if (typeof counts[key] === "number") return counts[key] as number;
  }
  return null;
}

/** Global footer (layout): data figures from meta.json at run time, the standing disclaimer, sources. Shown on every page. */
export default function DataFooter({ meta: given }: { meta?: Meta | null }) {
  const [loaded, setLoaded] = useState<Meta | null>(null);
  useEffect(() => {
    if (given) return;
    loadMeta().then(setLoaded, () => setLoaded(null));
  }, [given]);
  const meta = given ?? loaded;
  const isolated = meta ? isolatedDiseases(meta) : null;

  return (
    <footer className="mx-auto mt-4 w-full max-w-[1400px] px-4 pb-10 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] md:px-6" data-site-footer>
      <div className="max-w-[960px] border-t border-line pt-6 text-[13px] text-ink-2">
        {meta?.fixture && (
          <p className="mb-3 rounded-[12px] bg-warn-soft px-3 py-2 text-warn">
            Development fixture: a small slice built by app/scripts/make_fixture.py. Similarity scores are placeholders until the pipeline publishes its analytics.
          </p>
        )}
        <p className="tabular min-h-[44px] text-[15px] text-ink">
          <span>
            {meta ? (
              <>
                {count(metaCount(meta, "diseases"))} diseases · {count(metaCount(meta, "genes"))} genes · {count(metaCount(meta, "phenotypes"))} symptoms
                {isolated !== null && <> · {count(isolated)} without a mapped neighbour</>} · built {formatDate(meta.built_at)}
                <span className="block text-[13px] text-ink-2">Data {meta.version}</span>
              </>
            ) : (
              "Data status loading…"
            )}
          </span>
        </p>
        <p className="mt-3 max-w-[68ch] text-[16px] leading-relaxed text-ink">
          Research navigation, not medical advice. Constellate shows what public sources say and where they are silent; it does not diagnose or recommend treatment.
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1">
          <Link href="/about" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[15px] underline underline-offset-2">About</Link>
          <span aria-hidden="true">·</span>
          <Link href="/methods" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[15px] underline underline-offset-2">How we know</Link>
          <span aria-hidden="true">·</span>
          <Link href="/share" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-[15px] underline underline-offset-2">Share what you know</Link>
        </p>
        {!!meta?.sources.length && (
          <details className="mt-1">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-[15px] underline decoration-line underline-offset-4">Sources ({meta.sources.length}) and licences</summary>
            <ul className="mt-1 columns-1 gap-8 sm:columns-2">
              {meta.sources.map((s) => (
                <li key={s.db} className="break-inside-avoid">
                  {s.url ? (
                    <a className="inline-flex min-h-11 min-w-11 items-center underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">
                      {s.db}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="inline-flex min-h-11 items-center">{s.db}</span>
                  )}
                  {s.license ? <span className="text-ink-2"> ({s.license})</span> : null}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </footer>
  );
}
