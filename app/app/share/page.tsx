import type { Metadata } from "next";
import ShareFlow from "@/components/share/ShareFlow";

export const metadata: Metadata = {
  title: "Share what you know · Constellate",
  description: "Tell us about a patient group, a registry, a study or a correction. A person checks every note before it can appear in the data.",
};

// The disease comes from the query on the server, so the first step is in the HTML at its full height:
// no near-empty page that grows after hydration (layout shift on /share was 0.89 at 375 px).
export default async function SharePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return <ShareFlow rawDisease={first(params.disease) ?? first(params.d)} />;
}
