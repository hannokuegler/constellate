import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Records the story video (story/maria.story.ts); not part of `npm run e2e`.
export default defineConfig({
  ...base,
  testDir: "./story",
  testMatch: /.*\.story\.ts$/,
  timeout: 480_000,
  use: { ...base.use, viewport: { width: 1280, height: 720 } },
  projects: undefined,
});
