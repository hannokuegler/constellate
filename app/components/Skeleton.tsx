export function Skeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-2/3 max-w-[420px] rounded-[12px] bg-surface-2" />
      <div className="mt-3 h-5 w-1/3 max-w-[240px] rounded-[12px] bg-surface-2" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="h-[380px] rounded-[20px] bg-surface-2 lg:h-[560px]" />
        <div className="space-y-4">
          <div className="h-32 rounded-[20px] bg-surface-2" />
          <div className="h-48 rounded-[20px] bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
