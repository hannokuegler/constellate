import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell max-w-[700px] py-12">
      <p className="eyebrow">Page not found · 404</p>
      <h1 className="page-heading">Let’s find another way.</h1>
      <p className="subtle mt-5 max-w-[48ch]">This address does not lead to a page. Search for a diagnosis, gene or symptom to pick up from here.</p>
      <Link href="/" className="button button-primary mt-7">Return to search</Link>
    </div>
  );
}
