import type { Metadata } from "next";
import { Suspense } from "react";
import ShareFlow from "@/components/share/ShareFlow";

export const metadata: Metadata = {
  title: "Share what you know · Constellate",
  description: "Tell us about a patient group, a registry, a study or a correction. A person checks every note before it can appear in the data.",
};

export default function SharePage() {
  return (
    <Suspense fallback={<p className="mx-auto mt-10 max-w-[640px] text-ink-2">Loading…</p>}>
      <ShareFlow />
    </Suspense>
  );
}
