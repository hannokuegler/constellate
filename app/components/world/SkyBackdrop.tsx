// First paint of the start page: a static SVG star field (no data, no JS), drawn on the server.
// The real sky (3D or 2D) fades in over it once loaded; with ?sky=off it stays the only sky.

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// deterministic, so server and client render the same markup
const DOTS = (() => {
  const rand = mulberry32(874);
  const dots: { x: number; y: number; r: number; bright: boolean }[] = [];
  for (let i = 0; i < 170; i++) {
    // denser towards the sky centre (right of the hero on wide screens)
    const clustered = rand() < 0.55;
    const angle = rand() * Math.PI * 2;
    const radius = Math.pow(rand(), 0.8) * 34;
    const x = clustered ? 66 + Math.cos(angle) * radius : rand() * 100;
    const y = clustered ? 50 + Math.sin(angle) * radius * 1.5 : rand() * 100;
    const bright = rand() < 0.22;
    dots.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, r: bright ? 1.3 : 0.7, bright });
  }
  return dots;
})();

export default function SkyBackdrop() {
  return (
    <div className="sky-backdrop absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full">
        {DOTS.map((d, i) => (
          <circle
            key={i}
            cx={`${d.x}%`}
            cy={`${d.y}%`}
            r={d.r}
            fill={d.bright ? "var(--star, #D7DBEA)" : "var(--star-dim, #8D94B0)"}
            opacity={d.bright ? 0.8 : 0.45}
          />
        ))}
      </svg>
    </div>
  );
}
