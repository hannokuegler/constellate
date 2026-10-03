import type { Metadata } from "next";
import MethodsView from "@/components/MethodsView";

export const metadata: Metadata = { title: "How we know · Constellate", description: "Evidence levels, counter-evidence, data sources and measured quality of the Constellate graph." };

export default function MethodsPage() {
  return <MethodsView />;
}
