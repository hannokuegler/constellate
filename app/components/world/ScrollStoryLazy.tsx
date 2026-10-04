"use client";

// Entry point for pages: the scroll story arrives as its own chunk after the first paint (next/dynamic, ssr: false),
// so it never blocks the first image. Until then a placeholder of the same scroll length keeps the page from jumping.

import dynamic from "next/dynamic";
import { STORY_TOTAL_SVH } from "./story";

const ScrollStory = dynamic(() => import("./ScrollStory"), {
  ssr: false,
  loading: () => <div id="story-lights" aria-hidden="true" style={{ minHeight: `${STORY_TOTAL_SVH}svh` }} />,
});

export default function ScrollStoryLazy({ underHeader = false }: { underHeader?: boolean }) {
  return <ScrollStory underHeader={underHeader} />;
}
