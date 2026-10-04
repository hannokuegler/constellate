import { test, expect } from "@playwright/test";

// The 10x case: Krabbe joins its own registry, saposin A deficiency is found only through PSAP, a gap claims nothing.
test("10x case: join, extend, edit, evidence, gap @375 and @1280", async ({ browser }) => {
  for (const width of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto("/impact");
    const verdict = page.getByLabel("Verdict");
    await expect(verdict).toContainText("Estimated speed-up");
    await expect(page.getByText("NCT02993796").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, `horizontal scroll at ${width} px`).toBe(false);

    // changing an assumption recomputes the range
    const before = (await verdict.textContent()) ?? "";
    await page.getByRole("button", { name: "Change the assumptions" }).click();
    await page.getByLabel("Ethics approval and the first site opened: most weeks").fill("80");
    await expect(verdict).not.toHaveText(before);
    await page.getByRole("button", { name: "Reset to our numbers" }).click();
    await expect(verdict).toHaveText(before);

    // the atlas step opens the real edge
    await page.getByRole("button", { name: "See the evidence" }).first().click();
    await expect(page.getByText("Evidence for one link")).toBeVisible();
    await page.keyboard.press("Escape");

    // mechanism route: no name match, found through the shared gene
    await page.goto("/impact?d=MONDO_0012720");
    await expect(page.getByText("shares the same gene (PSAP)")).toBeVisible();

    await page.goto("/impact?d=MONDO_0007247");
    await expect(page.getByText("Honest gap · no speed-up claimed")).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
    await ctx.close();
  }
});
