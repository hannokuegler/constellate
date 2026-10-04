import Link from "next/link";
export default function SiteFooter() {
  return <footer className="site-footer no-print"><p>Research navigation, not medical advice.</p><div><Link href="/methods">Sources &amp; methods</Link><span className="footer-note">Made to connect.</span></div></footer>;
}
