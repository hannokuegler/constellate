"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PERSONAS, type PersonaId } from "@/lib/persona";
import { usePrefs } from "./Providers";
import SearchBox from "./SearchBox";

export default function Header() {
  const { persona, setPersona, theme, setTheme } = usePrefs();
  const onStart = usePathname() === "/";
  const nextTheme = theme === "auto" ? "dark" : theme === "dark" ? "light" : "auto";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2 md:gap-4 md:px-6">
        <Link href="/" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-[12px] font-semibold sm:pr-1" aria-label="Constellate home">
          <Logo />
          <span className="hidden text-[17px] tracking-tight sm:inline">Constellate</span>
        </Link>
        {/* phones: the header is too narrow for a usable field, so search lives on the start page */}
        <div className="hidden min-w-0 flex-1 sm:block">{!onStart && <SearchBox compact />}</div>
        <div className="flex-1 sm:hidden" />
        {!onStart && (
          <Link href="/" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 sm:hidden" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        )}
        <label className="relative flex shrink-0 items-center">
          <span className="sr-only">Persona lens</span>
          <select
            value={persona.id}
            onChange={(e) => setPersona(e.target.value as PersonaId)}
            className="h-11 max-w-[132px] appearance-none truncate rounded-full border border-line bg-surface pl-3 pr-8 text-[13px] font-medium md:max-w-none"
            title={`${persona.role}: ${persona.goal}`}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.role}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 text-ink-2" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </label>
        <button
          onClick={() => setTheme(nextTheme)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2"
          aria-label={`Theme: ${theme}. Switch to ${nextTheme}`}
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? <MoonIcon /> : theme === "light" ? <SunIcon /> : <AutoIcon />}
        </button>
      </div>
    </header>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 20 L12 8 L20 12 L23 22 Z M12 8 L23 22" fill="none" stroke="var(--line)" strokeWidth="1.2" />
      <circle cx="6" cy="20" r="2.4" fill="var(--n-gene)" />
      <circle cx="12" cy="8" r="3.2" fill="var(--n-center)" />
      <circle cx="20" cy="12" r="2.4" fill="var(--n-disease)" />
      <circle cx="23" cy="22" r="2" fill="var(--n-neighbour)" />
    </svg>
  );
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
