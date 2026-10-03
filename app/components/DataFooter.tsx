import Link from "next/link";
import type { Meta } from "@/lib/types";
import { formatDate } from "@/lib/evidence";
import { metaCount } from "@/lib/normalize";
import DotChain from "./brand/DotChain";

const count = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("en") : "?");

export default function DataFooter({ meta }: { meta: Meta | null }) {
  return (
    <footer className="mx-auto mt-16 max-w-[960px] border-t border-line pt-6 text-[13px] text-ink-2">
      {meta?.fixture && (
        <p className="mb-3 rounded-[12px] bg-warn-soft px-3 py-2 text-warn">
          Development fixture: a small slice built by app/scripts/make_fixture.py. Similarity scores are placeholders until the pipeline publishes its analytics.
        </p>
      )}
      <p className="zaehler flex items-start gap-3 text-[15px] text-ink">
        <span className="mt-[9px] shrink-0"><DotChain states={["idle", "linked"]} /></span>
        <span>
          {meta ? (
            <>
              {count(metaCount(meta, "diseases"))} diseases · {count(metaCount(meta, "genes"))} genes · {count(metaCount(meta, "phenotypes"))} symptoms · built {formatDate(meta.built_at)}
              <span className="block text-[13px] text-ink-2">Data {meta.version}</span>
            </>
          ) : (
            "Data status loading…"
          )}
        </span>
      </p>
      {!!meta?.sources.length && (
        <p className="mt-3">
          Sources:{" "}
          {meta.sources.map((s, i) => (
            <span key={s.db}>
              {i > 0 && " · "}
              {s.url ? (
                <a className="underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">
                  {s.db}
                </a>
              ) : (
                s.db
              )}
              {s.license ? ` (${s.license})` : ""}
            </span>
          ))}
        </p>
      )}
      <p className="mt-2">
        Research navigation, not medical advice. ·{" "}
        <Link href="/about" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">About</Link> ·{" "}
        <Link href="/methods" className="inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2">How we know</Link>
      </p>
    </footer>
  );
}
