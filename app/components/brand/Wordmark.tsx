/** Brand mark: three points, two joined, one amber (the amber one joins on hover of the parent link). */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="wordmark-mark" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <line x1="5" y1="19" x2="12" y2="9" stroke="var(--line-strong)" strokeWidth="1.2" strokeLinecap="round" />
      <line className="wm-link-amber" x1="12" y1="9" x2="22" y2="17" stroke="var(--amber)" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5" cy="19" r="2.6" fill="var(--star)" />
      <circle cx="12" cy="9" r="2.6" fill="var(--star)" />
      <circle cx="22" cy="17" r="5" fill="var(--amber-soft)" />
      <circle cx="22" cy="17" r="3" fill="var(--amber)" />
    </svg>
  );
}

/** Mark plus the name in Fraunces. Wrap in a link; the hover state lives on the anchor. */
export default function Wordmark({ size = 28, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark size={size} />
      {showName && <span className="font-display text-[20px] font-semibold leading-none tracking-tight" style={{ fontVariationSettings: '"SOFT" 50' }}>Constellate</span>}
    </span>
  );
}
