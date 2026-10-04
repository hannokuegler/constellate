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
