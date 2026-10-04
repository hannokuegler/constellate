"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { STORY, STORY_HAS_VOICE, STORY_POSTER, STORY_SOURCES, STORY_TITLE, SPEAKERS } from "@/lib/story";

const HERO = "/d/MONDO_0009499";

export default function StoryPlayer() {
  const video = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);

  const replay = () => {
    const v = video.current;
    if (!v) return;
    setEnded(false);
    v.currentTime = 0;
    void v.play().catch(() => undefined);
  };

  // browsers only autoplay muted, so the voice starts with one click, from the beginning
  const soundOn = () => {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    replay();
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-[20px] border border-line bg-[#0d1020] shadow-[var(--shadow)]">
        <video
          ref={video}
          className={`aspect-video w-full ${ended ? "hidden md:block" : "block"}`}
          poster={STORY_POSTER}
          controls={!ended}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={() => setEnded(true)}
          onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
          onPlay={() => setEnded(false)}
          aria-label={`${STORY_TITLE}: a walkthrough of Constellate${STORY_HAS_VOICE ? "" : ", without sound"}. The transcript is below the video.`}
        >
          {STORY_SOURCES.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
        {STORY_HAS_VOICE && muted && !ended && (
          <button
            onClick={soundOn}
            className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a4a2ff] px-5 text-[15px] font-semibold text-[#12142a] shadow-[var(--shadow)] transition-transform hover:-translate-y-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" /><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
            Play with sound
          </button>
        )}
        {ended && (
          <div className="grid place-items-center bg-[#0d1020] px-4 py-10 text-center text-[#eef0f8] md:absolute md:inset-0">
            <div>
              <p className="text-[22px] font-bold tracking-tight md:text-[28px]">Your family is not the first.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  autoFocus
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a4a2ff] px-6 text-[17px] font-semibold text-[#12142a] transition-transform hover:-translate-y-0.5"
                >
                  Try it yourself
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
                </Link>
                <Link href={HERO} className="inline-flex min-h-11 items-center rounded-full border border-[#2c3254] px-5 text-[15px] font-medium">
                  Open Krabbe disease
                </Link>
                <button onClick={replay} className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-medium text-[#a9b0cc] hover:text-[#eef0f8]">
                  Watch again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <details className="min-w-0 flex-1 text-[15px]">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-ink-2 hover:text-ink">Read the transcript</summary>
          <ol className="mt-2 space-y-2">
            {STORY.map((l) => (
              <li key={l.id}>
                <span className={`font-semibold ${l.who === "maria" ? "text-warn" : "text-accent"}`}>{SPEAKERS[l.who].name}:</span> {l.text}
              </li>
            ))}
          </ol>
        </details>
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-medium">
          Skip to the app
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </Link>
      </div>
    </div>
  );
}
