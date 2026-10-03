import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-[560px] text-center">
      <h1 className="text-[28px] font-bold">Nothing at this address</h1>
      <p className="mt-2 text-[17px] text-ink-2">Try the search: diseases, genes, symptoms and IDs all live in one box.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-ink">
        Back to search
      </Link>
    </div>
  );
}
