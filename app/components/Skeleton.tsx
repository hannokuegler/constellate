/** Loading state: a row of points that light up one after another, over quiet placeholder blocks. */
export function SkelDots({ className = "" }: { className?: string }) {
  return (
    <span className={`skel-dots ${className}`.trim()} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}

export function Skeleton() {
  return (
    <div className="mt-6" aria-busy="true" aria-label="Loading">
      <SkelDots />
      <div className="skel-block mt-5 h-8 w-2/3 max-w-[420px] !rounded-[12px]" />
      <div className="skel-block mt-3 h-5 w-1/3 max-w-[240px] !rounded-[12px]" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="skel-block h-[380px] lg:h-[560px]" />
        <div className="space-y-4">
          <div className="skel-block h-32" />
          <div className="skel-block h-48" />
        </div>
      </div>
    </div>
  );
}

/** Same frame as the "In plain language" block, so the explanation slot does not jump when the card is ready. */
export function ExplainPlaceholder() {
  return (
    <div className="rounded-[20px] border border-line bg-surface-2 px-4 py-5 md:px-6" aria-hidden="true">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">In plain language</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="skel-block inline-block h-11 w-[220px] !rounded-full" />
      </div>
    </div>
  );
}

/** Placeholder for the three action-card columns and the assets block below them.
 *  It reserves at least a screen of height, so the footer is never pulled into view and pushed out again (layout shift). */
export function ActionCardBodySkeleton() {
  return (
    <div className="min-h-[calc(100vh-120px)]" aria-busy="true" aria-label="Loading the action card">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-line px-5 py-5 md:border-b-0 md:border-r md:px-6 last:border-0">
            <div className="skel-block h-7 w-2/3 !rounded-[10px]" />
            <div className="skel-block mt-2 h-5 w-1/2 !rounded-[10px]" />
            <div className="mt-4 space-y-3.5">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="skel-block h-[84px] !rounded-[12px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading state of the action-card page: breadcrumb, card header and body in their final places, at least a screen tall. */
export function ActionCardSkeleton() {
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
        <div className="border-b border-line px-5 py-5 md:px-6"><ExplainPlaceholder /></div>
        <ActionCardBodySkeleton />
      </div>
    </div>
  );
}
