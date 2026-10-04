import TrialView from "@/components/TrialView";

export default async function TrialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrialView id={decodeURIComponent(id)} />;
}
