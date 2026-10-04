"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Constellate home"><Logo /><span>constellate<span className="brand-period">.</span></span></Link>
        <nav aria-label="Main navigation" className="header-nav">
          {path !== "/" && <Link href="/" aria-label="Search diseases" className="header-search"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5"/></svg><span>Search</span></Link>}
          <Link href="/methods" aria-current={path === "/methods" ? "page" : undefined}>Our evidence</Link>
          <Link href="/about" aria-current={path === "/about" ? "page" : undefined}>About</Link>
        </nav>
      </div>
    </header>
  );
}
export function Logo({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="m4 20 8-14 11 5-5 13L4 20l19-9M12 6l6 18" stroke="currentColor" strokeWidth="1.1"/><circle cx="4" cy="20" r="2.3" fill="currentColor"/><circle cx="12" cy="6" r="3" fill="var(--family)"/><circle cx="23" cy="11" r="2.3" fill="currentColor"/><circle cx="18" cy="24" r="2" fill="currentColor"/></svg>;
}
