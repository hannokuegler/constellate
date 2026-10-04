"use client";

// Scroll story frame: a full-bleed section whose first child is a sticky full-screen stage (sky + glasses) and whose
// chapter blocks ([data-chapter]) scroll over it. The reading line at 60 % of the viewport decides the chapter and
// the progress t inside it; both go to the shared story state (renderers) and to the glasses overlay.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import World from "./World";
import { forgetStarLabels, replaceStarLabels } from "./labels";
import { STORY_CHAPTERS, activeCaption, lensGeometry, setStory, type ChapterId, type Lens } from "./story";
import type { Sky } from "./sky";

const READING_LINE = 0.6;

export interface StarLabel {
  id: string;
  text: string;
  chapters: ChapterId[];
}

export default function StoryStage({
  children,
  captions = {},
  labels = [],
  onSky,
  underHeader = true,
}: {
  children: ReactNode;
  /** one caption per chapter; a single sticky glass box bottom-left shows the active one (crossfade) */
  captions?: Partial<Record<ChapterId, ReactNode>>;
  /** star names, placed on screen by the renderer, shown only in their chapters */
  labels?: StarLabel[];
  onSky?: (sky: Sky) => void;
  /** pull the stage up under the site header (the story is the first thing on the page) */
  underHeader?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ chapter: 0, t: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [staticLens, setStaticLens] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const blocks = [...section.querySelectorAll<HTMLElement>("[data-chapter]")];
      const line = window.innerHeight * READING_LINE;
      let chapter = 0;
      let t = 0;
      for (const block of blocks) {
        const index = STORY_CHAPTERS.indexOf(block.dataset.chapter as (typeof STORY_CHAPTERS)[number]);
        const rect = block.getBoundingClientRect();
        if (index < 0) continue;
        if (rect.top <= line) {
          chapter = index;
          t = Math.min(Math.max((line - rect.top) / Math.max(rect.height, 1), 0), 1);
        }
      }
      setStory({ active: true, chapter, t });
      setPosition((p) => (p.chapter === chapter && Math.abs(p.t - t) < 0.002 ? p : { chapter, t }));
      setViewport((v) => (v.width === window.innerWidth && v.height === window.innerHeight ? v : { width: window.innerWidth, height: window.innerHeight }));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setStaticLens(media.matches || new URLSearchParams(window.location.search).get("sky") === "2d");
    onMotion();
    media.addEventListener("change", onMotion);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", onMotion);
      setStory({ active: false, chapter: 0, t: 0 });
      forgetStarLabels();
    };
  }, []);

  const lens = viewport.width ? lensGeometry(position.chapter, position.t, viewport.width, viewport.height, staticLens) : null;
  const chapterId = STORY_CHAPTERS[position.chapter];
  const active = activeCaption(position.chapter, position.t, (id) => !!captions[id]);

  // the box takes the height of the active caption (animated), so a short caption never sits in a tall empty box
  const layerRefs = useRef<Partial<Record<ChapterId, HTMLDivElement | null>>>({});
  const [boxHeight, setBoxHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const layer = active ? layerRefs.current[active] : null;
    if (!layer) return;
    const update = () => setBoxHeight(layer.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(layer);
    return () => observer.disconnect();
  }, [active]);
  // pills and caption changed in the DOM: the renderer's last projection places the pills again (2D draws only per chapter)
  useEffect(() => {
    replaceStarLabels();
  }, [active, chapterId, position.t, boxHeight]);

  return (
    <section ref={sectionRef} aria-label="The map of rare diseases, told step by step" className={`relative left-1/2 w-screen -translate-x-1/2 ${underHeader ? "-mt-16" : ""}`}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <World onSky={onSky} onModeChange={(mode) => setStaticLens(mode !== "3d")} />
        {lens && lens.on && lens.frame > 0.01 && <Glasses lens={lens} />}
        {labels.map((label) => {
          const on = label.chapters.includes(chapterId) && (chapterId !== "krabbe" || position.t >= 0.3);
          return (
            <span
              key={label.id}
              data-star-label={label.id}
              data-on={on ? "1" : "0"}
              aria-hidden="true"
              className={`glass pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full border border-line px-3 py-1 text-[15px] font-medium leading-6 text-ink shadow-[var(--shadow)] transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0"}`}
              style={{ visibility: "hidden" }}
            >
              {label.text}
            </span>
          );
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(16px,4svh,env(safe-area-inset-bottom))] px-4 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] lg:px-10">
          <div
            data-caption-box
            data-open={active ? "" : undefined}
            className={`glass relative w-full max-w-[640px] overflow-hidden rounded-[24px] shadow-[var(--shadow)] transition-[opacity,height,transform] duration-[250ms] ease-out ${
              active ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
            style={{ height: boxHeight ?? undefined }}
          >
            {STORY_CHAPTERS.map((id) => {
              const caption = captions[id];
              if (!caption) return null;
              const on = id === active;
              return (
                <div
                  key={id}
                  ref={(el) => {
                    layerRefs.current[id] = el;
                  }}
                  data-caption={id}
                  aria-hidden={!on}
                  inert={!on}
                  className={`absolute inset-x-0 top-0 px-5 py-5 transition-opacity ease-out md:px-8 md:py-7 ${on ? "opacity-100 delay-100 duration-[250ms]" : "opacity-0 duration-150"}`}
                >
                  {caption}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="relative z-[1] -mt-[100svh]">{children}</div>
    </section>
  );
}

/** two round lenses and a bridge, thin ink rims with an amber glint; drawn exactly on the shader's sharp circles */
function Glasses({ lens }: { lens: Lens }) {
  const { ax, ay, bx, by, r, frame } = lens;
  const glint = (cx: number, cy: number) => {
    const from = (205 * Math.PI) / 180;
    const to = (250 * Math.PI) / 180;
    const rr = r * 0.82;
    return `M ${cx + rr * Math.cos(from)} ${cy + rr * Math.sin(from)} A ${rr} ${rr} 0 0 1 ${cx + rr * Math.cos(to)} ${cy + rr * Math.sin(to)}`;
  };
  const bridgeY = Math.min(ay, by) - r * 0.32;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: frame }} aria-hidden="true">
      <g fill="none" stroke="var(--ink)" strokeWidth={Math.max(1.5, r * 0.022)} strokeLinecap="round">
        <circle cx={ax} cy={ay} r={r} />
        <circle cx={bx} cy={by} r={r} />
        <path d={`M ${ax + r * 0.94} ${bridgeY} Q ${(ax + bx) / 2} ${bridgeY - r * 0.34} ${bx - r * 0.94} ${bridgeY}`} />
        <path d={`M ${ax - r} ${ay - r * 0.12} L ${ax - r * 1.32} ${ay - r * 0.3}`} />
        <path d={`M ${bx + r} ${by - r * 0.12} L ${bx + r * 1.32} ${by - r * 0.3}`} />
      </g>
      <g fill="none" stroke="var(--amber)" strokeWidth={Math.max(2, r * 0.03)} strokeLinecap="round" opacity="0.85">
        <path d={glint(ax, ay)} />
        <path d={glint(bx, by)} />
      </g>
    </svg>
  );
}
