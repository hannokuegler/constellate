import { test, expect } from "@playwright/test";

// Story interstitial: the video loads, skip works, and the end of the video offers the way into the app.
test("intro story leads into the app", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon")) errors.push(`http ${r.status()}: ${r.url()}`);
  });

  await page.goto("/");
  await page.getByRole("link", { name: /Watch Maria's story/ }).click();
  await expect(page).toHaveURL(/\/intro$/);
  await expect(page.getByRole("heading", { level: 1, name: "Maria's first night" })).toBeVisible();

  const video = page.locator("video");
  for (const [file, type] of [["/story/maria.mp4", "video/mp4"], ["/story/maria.webm", "video/webm"]]) {
    const res = await page.request.get(file);
    expect(res.status(), file).toBe(200);
    expect(res.headers()["content-type"]).toContain(type);
  }
  // Playwright's Chromium has no H.264, so this also proves the VP9 fallback plays
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.duration), { timeout: 15_000 }).toBeGreaterThan(30);
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentSrc)).toMatch(/\/story\/maria\.(mp4|webm)$/);

  await page.getByText("Read the transcript").click();
  await expect(page.getByText(/Consti:/).first()).toBeVisible();

  // the end of the video swaps the controls for the way into the app
  await video.evaluate((v: HTMLVideoElement) => v.dispatchEvent(new Event("ended")));
  const go = page.getByRole("link", { name: "Try it yourself" });
  await expect(go).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Krabbe disease" })).toHaveAttribute("href", "/d/MONDO_0009499");
  await go.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("combobox", { name: /search diseases/i })).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});
