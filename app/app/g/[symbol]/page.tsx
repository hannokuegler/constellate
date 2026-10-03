import GeneView from "@/components/GeneView";

export default async function GenePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <GeneView symbol={decodeURIComponent(symbol)} />;
}
