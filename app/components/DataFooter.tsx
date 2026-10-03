import type { Meta } from "@/lib/types";
import { formatDate } from "@/lib/evidence";
import { metaCount } from "@/lib/normalize";

export default function DataFooter({ meta }: { meta: Meta | null }) {
  return (
    <footer className="mx-auto mt-16 max-w-[960px] border-t border-line pt-6 text-[13px] text-ink-2">
      {meta?.fixture && (
        <p className="mb-3 rounded-[12px] bg-warn-soft px-3 py-2 text-warn">
          Development fixture: a small slice built by app/scripts/make_fixture.py. Similarity scores are placeholders until the pipeline publishes its analytics.
        </p>
      )}
      <p>
        {meta ? (
          <>
            Data {meta.version}, built {formatDate(meta.built_at)} · {metaCount(meta, "diseases") ?? "?"} diseases · {metaCount(meta, "genes") ?? "?"} genes ·{" "}
            {metaCount(meta, "phenotypes") ?? "?"} phenotypes · {metaCount(meta, "edges")?.toLocaleString("en") ?? "?"} edges
          </>
        ) : (
          "Data status loading…"
        )}
      </p>
      {!!meta?.sources.length && (
        <p className="mt-2">
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
      <p className="mt-2">A research-navigation tool, not medical advice.</p>
    </footer>
  );
}
