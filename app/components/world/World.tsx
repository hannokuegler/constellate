"use client";

// Full-bleed sky behind the start page hero. First paint = static SVG backdrop (server-rendered, LCP-safe).
// After the load event and an idle slot: ?sky= switch, reduced motion and WebGL probe pick the renderer,
// three.js arrives as its own chunk (next/dynamic, ssr: false) and fades in. Any 3D failure -> 2D canvas.

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SkyBackdrop from "./SkyBackdrop";
import { KIND, chooseSkyMode, hrefOfStar, kindLabel, loadSky, type Sky, type SkyMode } from "./sky";
import type { HoverInfo } from "./SkyCanvas";

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });
const SkyFallback2D = dynamic(() => import("./SkyFallback2D"), { ssr: false });

export type Phase = "static" | SkyMode;

function afterFirstPaint(fn: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(() => !cancelled && fn(), { timeout: 600 });
    else window.setTimeout(() => !cancelled && fn(), 120);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
  };
}

export default function World({
  initialFocus,
  onSky,
  onModeChange,
}: {
  initialFocus?: string | null;
  onSky?: (sky: Sky) => void;
  onModeChange?: (mode: Phase) => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("static");
  const [reason, setReason] = useState("");
  const [sky, setSky] = useState<Sky | null>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState<{ info: HoverInfo; label: string; kind: number; degree: number } | null>(null);

  useEffect(
    () =>
      afterFirstPaint(() => {
        const choice = chooseSkyMode();
        setReason(choice.reason);
        loadSky().then(
          (loaded) => {
            setSky(loaded);
            onSky?.(loaded);
            setPhase(choice.mode);
          },
          () => setPhase("off"),
        );
      }),
    // runs once per mount; onSky is read when the sky arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    onModeChange?.(phase);
    // report each renderer switch (3d -> 2d after a failure, too)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onReady = useCallback(() => setVisible(true), []);
  const onFail = useCallback((why: string) => {
    setVisible(false);
    setReason(why);
    setPhase("2d");
  }, []);
  const onHover = useCallback(
    (info: HoverInfo | null) => {
      if (!info || !sky) return setHover(null);
      setHover({ info, label: sky.file.labels[info.index], kind: sky.kind[info.index], degree: sky.degree[info.index] });
    },
    [sky],
  );
  const onSelect = useCallback(
    (index: number) => {
      if (sky) router.push(hrefOfStar(sky, index));
    },
    [sky, router],
  );

  const motion = reason !== "reduced-motion";

  return (
    <div className="absolute inset-0 overflow-hidden" data-sky={phase} data-sky-reason={reason || undefined} data-sky-visible={visible || undefined}>
      <SkyBackdrop />
      {sky && phase !== "static" && phase !== "off" && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
          {phase === "3d" ? (
            <SkyCanvas sky={sky} motion={motion} initialFocus={initialFocus} onReady={onReady} onFail={onFail} onHover={onHover} onSelect={onSelect} />
          ) : (
            <SkyFallback2D sky={sky} initialFocus={initialFocus} onReady={onReady} onHover={onHover} onSelect={onSelect} />
          )}
        </div>
      )}
      {hover && (
        <div
          role="tooltip"
          className="glass pointer-events-none absolute z-10 max-w-[280px] rounded-[12px] border border-line px-3 py-2 shadow-[var(--shadow)]"
          style={{ left: Math.max(8, hover.info.x + 14), top: Math.max(8, hover.info.y + 14) }}
        >
          <span className="block text-[15px] font-medium leading-snug text-ink">{hover.label}</span>
          <span className="mt-0.5 block text-[13px] text-ink-2">
            {hover.kind === KIND.lonely
              ? "No mapped neighbour in this release"
              : `${kindLabel(hover.kind)}${hover.kind <= KIND.gene && hover.degree ? ` · ${hover.degree} mapped link${hover.degree === 1 ? "" : "s"}` : ""}`}
          </span>
        </div>
      )}
    </div>
  );
}
