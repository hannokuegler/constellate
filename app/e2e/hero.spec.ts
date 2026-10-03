import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Hero path: search Krabbe -> disease page -> GALC -> PSAP -> MLD -> edge panel -> action card -> honest gap -> Pelizaeus-Merzbacher.
// Screenshots at 1280 px and 375 px go to E2E_SHOTS (default: app/e2e-shots, gitignored).
const SHOTS = process.env.E2E_SHOTS ?? join(__dirname, "..", "e2e-shots");
mkdirSync(SHOTS, { recursive: true });

// data contract: trial/<NCT>.json is optional (step 08 `make trials`); a missing file is a state, not an error
const isOptionalTrialShard = (url: string, status: number) => status === 404 && /\/data\/trial\/NCT\d+\.json$/.test(url);

function collect(page: Page, sink: string[]) {
  page.on("console", (m) => {
    // the browser logs a failed resource without its URL; the 404 itself is judged in the response handler
    if (m.type() === "error" && !/Failed to load resource: the server responded with a status of 404/.test(m.text())) sink.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => sink.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon") && !isOptionalTrialShard(r.url(), r.status())) sink.push(`http ${r.status()}: ${r.url()}`);
  });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false });
}

for (const vp of [
  { tag: "1280", width: 1280, height: 900 },
  { tag: "375", width: 375, height: 812 },
]) {
  test(`hero path @${vp.tag}`, async ({ page }) => {
    const errors: string[] = [];
    collect(page, errors);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const s = (n: string) => shot(page, `${vp.tag}-${n}`);

    // 1 search
    await page.goto("/");
    const box = page.getByRole("combobox", { name: /search diseases/i });
    await box.fill("Krabbe");
    const hit = page.getByRole("option", { name: /Krabbe disease/ }).first();
    await expect(hit).toBeVisible();
    await s("1-search");
    await hit.click();

    // 2 disease page
    await expect(page).toHaveURL(/\/d\/MONDO_0009499/);
    await expect(page.getByRole("heading", { level: 1, name: "Krabbe disease" })).toBeVisible();
    await expect(page.getByText("MONDO:0009499").first()).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible();
    await page.waitForTimeout(2500); // let the force layout settle
    await s("2-krabbe");

    // 2b graph: subtypes bundled into families, expandable; legend names the evidence styles
    const toggle = page.getByRole("button", { name: /Show all subtypes/ });
    await expect(toggle).toBeVisible();
    await expect(page.getByText("text-mined (dashed)")).toBeVisible();
    await toggle.click();
    await expect(page.getByRole("button", { name: /Group subtypes into families/ })).toBeVisible();
    await page.waitForTimeout(2500);
    await s("2b-krabbe-expanded");
    await page.getByRole("button", { name: /Group subtypes into families/ }).click();

    // 3 GALC
    await page.getByRole("link", { name: "GALC", exact: true }).first().click();
    await expect(page).toHaveURL(/\/g\/GALC/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("GALC");
    await s("3-galc");

    // 4 PSAP via the gene page
    await page.goBack();
    await page.getByRole("link", { name: "PSAP", exact: true }).first().click();
    await expect(page).toHaveURL(/\/g\/PSAP/);
    await expect(page.getByText(/One gene, \d+ disease names/)).toBeVisible();
    await s("4-psap");

    // 5 MLD from the PSAP page
    await page.getByRole("link", { name: /metachromatic leukodystrophy/i }).first().click();
    await expect(page).toHaveURL(/\/d\/MONDO_/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/metachromatic leukodystrophy/i);
    await s("5-mld");

    // 6 back to Krabbe: edge panel with evidence, counter-evidence slot
    await page.goto("/d/MONDO_0009499");
    await page.getByRole("button", { name: /Evidence: (caused by|associated gene|disease gene)/i }).first().click();
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/confidence/i).first()).toBeVisible();
    await expect(panel.getByText(/independent sources/i).first()).toBeVisible();
    await expect(panel.getByRole("heading", { name: /^Evidence \(/ })).toBeVisible();
    await expect(panel.getByRole("heading", { name: /^Counter-evidence \(/ })).toBeVisible();
    await expect(panel.locator("a[href^='http']").first()).toBeVisible(); // a source link
    await page.waitForTimeout(600); // slide-in transition
    await s("6-edge-panel");
    await page.getByRole("button", { name: /close evidence panel/i }).click();

    // 7 action card
    await page.getByRole("button", { name: "Action card" }).first().click();
    const card = page.locator("#action-card");
    await expect(card).toBeVisible();
    await expect(card.getByText(/e_[0-9a-f]{12}/).first()).toBeVisible();
    await page.waitForTimeout(1200); // smooth scroll
    await s("7-action-card");

    // 8 honest gap (no verified patient organisation yet)
    await expect(page.getByText("Honest gap", { exact: false }).first()).toBeVisible();
    await page.locator("#patient-organisations").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await s("8-honest-gap");

    // 9 Pelizaeus-Merzbacher as counter-example
    await expect(page.getByText("Pelizaeus-Merzbacher spectrum disorder").first()).toBeVisible();
    await expect(page.getByText("mechanism differs").first()).toBeVisible();
    const pmd = page.locator("li", { hasText: "Pelizaeus-Merzbacher spectrum disorder" }).first();
    await pmd.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await s("9-pmd-counter");
    await pmd.getByRole("button", { name: /Why linked/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.waitForTimeout(600);
    await s("9b-pmd-edge");

    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("dark mode renders the disease page", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  collect(page, errors);
  await page.goto("/d/MONDO_0009499");
  await expect(page.getByRole("heading", { level: 1, name: "Krabbe disease" })).toBeVisible();
  await page.waitForTimeout(2500);
  await shot(page, "375-dark-krabbe");
  await page.locator("canvas").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await shot(page, "375-dark-graph");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow, "horizontal scroll at 375 px").toBe(false);
  expect(errors, errors.join("\n")).toEqual([]);
  await ctx.close();
});
