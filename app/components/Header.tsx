"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrefs } from "./Providers";
import SearchBox from "./SearchBox";
import Wordmark, { Mark } from "./brand/Wordmark";

export default function Header() {
  const { theme, setTheme } = usePrefs();
  const onStart = usePathname() === "/";
  const nextTheme = theme === "auto" ? "dark" : theme === "dark" ? "light" : "auto";

  return (
    <header className="glass sticky top-0 z-30 border-0 border-b pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-4 py-1.5 sm:flex-nowrap md:gap-4 md:px-6">
        <Link href="/" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[12px] pr-1" aria-label="Constellate home">
          <Wordmark />
        </Link>
        {/* phones: the header is too narrow for a usable field, so search lives on the start page */}
        <div className="hidden min-w-0 flex-1 sm:block">{!onStart && <SearchBox compact />}</div>
        <div className="flex-1 sm:hidden" />
        {!onStart && (
          <Link href="/" className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 sm:hidden" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        )}
        <nav aria-label="About" className={`hidden shrink-0 items-center gap-1 ${onStart ? "md:flex" : "lg:flex"}`}>
          <Link href="/about" className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-medium text-ink-2 hover:text-ink">About</Link>
          <Link href="/methods" className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-medium text-ink-2 hover:text-ink">How we know</Link>
        </nav>
        <button
          onClick={() => setTheme(nextTheme)}
          className="ml-auto grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 hover:text-ink sm:ml-0"
          aria-label={`Theme: ${theme}. Switch to ${nextTheme}`}
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? <MoonIcon /> : theme === "light" ? <SunIcon /> : <AutoIcon />}
        </button>
      </div>
    </header>
  );
}

/** Kept for StartView and About: same mark as the header. */
export function Logo({ size = 28 }: { size?: number }) {
  return <Mark size={size} />;
}

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M14.5 11.5A6 6 0 0 1 6.5 3.5a6 6 0 1 0 8 8z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
);
const AutoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M9 2.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" /></svg>
);
