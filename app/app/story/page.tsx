import type { Metadata } from "next";
import ScrollStory from "@/components/world/ScrollStoryLazy";

// Preview of the start page scroll story on its own (the start page mounts the same component under its hero).
export const metadata: Metadata = {
  title: "The story · Constellate",
  description: "Every light is a real rare disease, gene or symptom: the map of rare diseases, told step by step.",
};

export default function StoryPage() {
  return (
    <>
      <h1 className="sr-only">The map of rare diseases, told step by step</h1>
      <ScrollStory underHeader />
    </>
  );
}
