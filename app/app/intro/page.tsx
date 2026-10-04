import type { Metadata } from "next";
import StoryPlayer from "@/components/StoryPlayer";
import { STORY_HAS_VOICE, STORY_NOTE, STORY_TITLE, STORY_VOICE_NOTE } from "@/lib/story";

export const metadata: Metadata = {
  title: `${STORY_TITLE} · Constellate`,
  description: "A mother types her child's diagnosis into Constellate on the first night; Consti explains what the map shows, where it comes from and what is missing.",
};

export default function IntroPage() {
  return (
    <div className="mx-auto mt-6 max-w-[1040px] md:mt-10">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-accent">The story first, then the app</p>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight md:text-[40px]">{STORY_TITLE}</h1>
      <p className="mt-2 max-w-[720px] text-[15px] text-ink-2">
        {STORY_NOTE}
        {STORY_HAS_VOICE && ` ${STORY_VOICE_NOTE}`}
      </p>
      <div className="mt-6">
        <StoryPlayer />
      </div>
    </div>
  );
}
