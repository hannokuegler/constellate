import Link from "next/link";
import SearchBox from "./SearchBox";

export default function StartView() {
  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="welcome">
        <Constellation />
        <p className="eyebrow">A little direction. A place to begin.</p>
        <h1 id="welcome">Your family<br />is not the first.</h1>
        <div className="landing-search">
          <SearchBox />
          <div className="examples" aria-label="Example diagnoses">
            <span className="source-line">Try an example</span>
            <Link prefetch={false} href="/d/MONDO_0009499">Krabbe disease <span aria-hidden="true">↗</span></Link>
            <Link prefetch={false} href="/d/MONDO_0018868">Metachromatic leukodystrophy <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
      <section className="landing-note" aria-label="About this map">
        <span className="note-marker" aria-hidden="true">✳</span>
        <p>What you need may already exist<br className="desktop-break" /> under another disease’s name.</p>
        <Link href="/about">See how we connect the dots <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}

function Constellation() {
  return (
    <svg className="constellation" viewBox="0 0 700 220" fill="none" aria-hidden="true">
      <path className="constellation-line" d="M85 118 197 75 300 117 379 46 491 100 594 61M197 75l35 105 68-63 131 61 60-78 120 73M300 117l79-71M431 178l180-5" />
      <g className="constellation-dots">
        <circle cx="85" cy="118" r="3"/><circle cx="197" cy="75" r="4"/><circle cx="232" cy="180" r="3"/>
        <circle cx="379" cy="46" r="3"/><circle cx="491" cy="100" r="4"/><circle cx="594" cy="61" r="3"/>
        <circle cx="431" cy="178" r="3"/><circle cx="611" cy="173" r="3"/>
      </g>
      <circle className="family-halo" cx="300" cy="117" r="23" />
      <circle className="family-point" cx="300" cy="117" r="6" />
      <path className="constellation-dust" d="M51 48h2m73 149h2M265 28h2m246 169h2m124-80h2M441 19h2M346 196h2" />
    </svg>
  );
}
