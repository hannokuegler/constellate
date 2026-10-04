import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Share flow: /share?disease=MONDO:0009499 -> choose -> details (privacy check) -> preview -> GitHub link -> thank-you.
// Nothing is sent: the GitHub tab is answered by a stub. Screenshots go to E2E_SHOTS (default: app/e2e-shots, gitignored).
const SHOTS = process.env.E2E_SHOTS ?? join(__dirname, "..", "e2e-shots");
mkdirSync(SHOTS, { recursive: true });

const isOptionalTrialShard = (url: string, status: number) => status === 404 && /\/data\/trial\/NCT\d+\.json$/.test(url);

function collect(page: Page, sink: string[]) {
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource: the server responded with a status of 404/.test(m.text())) sink.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => sink.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon") && !isOptionalTrialShard(r.url(), r.status())) sink.push(`http ${r.status()}: ${r.url()}`);
  });
}

const NAME = "Leukodystrophy Families Österreich";
const LINK = "https://example.org/krabbe-families?lang=en&ref=constellate";
const DESCRIPTION = "Parent-led group with a yearly meeting & an online forum (2015-2019 archive).";

for (const vp of [
  { tag: "375", width: 375, height: 812, query: "disease=MONDO:0009499" },
  { tag: "1280", width: 1280, height: 900, query: "d=MONDO:0009499" }, // short form ?d= works like ?disease=
]) {
  test(`share flow @${vp.tag} (?${vp.query.split("=")[0]}=)`, async ({ page }) => {
    const errors: string[] = [];
    collect(page, errors);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.context().route("https://github.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" }));
    const shot = (name: string) => page.screenshot({ path: join(SHOTS, `share-${vp.tag}-${name}.png`) });
    const noSideScroll = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // step 1
    await page.goto(`/share?${vp.query}`);
    await expect(page.getByRole("heading", { level: 1, name: "What would you like to share?" })).toBeVisible();
    await expect(page.getByText("About:")).toBeVisible();
    await expect(page.getByText("Krabbe disease", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(5);
    // no choice yet: friendly hint, no step change
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#share-choice-error")).toContainText("choose one");
    await shot("1-choose");
    await noSideScroll();
    await page.getByRole("radio", { name: /a patient organisation/i }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // step 2: privacy check blocks a phone number at the field
    await expect(page.getByRole("heading", { level: 1, name: "Tell us about it" })).toBeVisible();
    await expect(page.getByText("Please do not include names, dates of birth, medical records or anything that identifies a person.")).toBeVisible();
    await page.getByLabel(/Name of the group/).fill(NAME);
    await page.getByLabel(/Link to a public source/).fill(LINK);
    await page.getByLabel("Country").fill("Austria");
    const description = page.getByLabel(/What do they do/);
    await description.fill("Call us on 0664 1234567 any time.");
    await page.getByRole("button", { name: "Preview my note" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tell us about it" })).toBeVisible();
    await expect(page.locator("#share-description")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("This looks like a phone number")).toBeVisible();
    await shot("2-details-blocked");
    // email and date are blocked too
    await description.fill("Write to anna@example.com");
    await description.blur();
    await expect(page.getByText("This looks like an email address")).toBeVisible();
    await description.fill("Born on 28.08.2003");
    await description.blur();
    await expect(page.getByText("This looks like an exact date")).toBeVisible();
    // a year range is fine
    await description.fill(DESCRIPTION);
    await expect(page.getByText("This looks like")).toHaveCount(0);
    await shot("2-details");
    await noSideScroll();

    // back keeps the input
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("radio", { name: /a patient organisation/i })).toBeChecked();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel(/Name of the group/)).toHaveValue(NAME);
    await page.getByRole("button", { name: "Preview my note" }).click();

    // step 3: preview and the GitHub link
    await expect(page.getByRole("heading", { level: 1, name: "Check and send" })).toBeVisible();
    await expect(page.locator("[data-share-body]")).toContainText(NAME);
    await expect(page.locator("[data-share-body]")).toContainText("About: Krabbe disease (MONDO:0009499)");
    await expect(page.getByText("Please do not include names, dates of birth, medical records or anything that identifies a person.")).toBeVisible();
    await shot("3-send");
    await noSideScroll();
    const github = page.getByRole("link", { name: /Open GitHub to send/ });
    const href = (await github.getAttribute("href")) ?? "";
    expect(href.length).toBeLessThan(7000);
    expect(href).not.toMatch(/[\s"<>+]/); // fully percent-encoded
    const url = new URL(href);
    expect(`${url.origin}${url.pathname}`).toBe("https://github.com/hannokuegler/constellate/issues/new");
    expect(url.searchParams.get("template")).toBe("share-what-you-know.yml");
    expect(url.searchParams.get("title")).toBe(`Share: Patient organisation or support group: ${NAME} (Krabbe disease)`);
    expect(url.searchParams.get("kind")).toBe("Patient organisation or support group");
    expect(url.searchParams.get("disease")).toBe("Krabbe disease (MONDO:0009499)");
    expect(url.searchParams.get("source")).toBe(LINK);
    const details = url.searchParams.get("details") ?? "";
    expect(details).toContain(`Name of the group: ${NAME}`);
    expect(details).toContain(`Link to a public source: ${LINK}`);
    expect(details).toContain(DESCRIPTION); // "&" and umlaut survive the round trip
    await expect(github).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("button", { name: "Copy text" })).toBeVisible();

    // thank-you state after opening GitHub (a new tab, answered by the stub)
    const [popup] = await Promise.all([page.waitForEvent("popup"), github.click()]);
    expect(popup.url()).toContain("https://github.com/hannokuegler/constellate/issues/new");
    await popup.close();
    await expect(page.getByRole("heading", { level: 1, name: /Thank you/ })).toBeVisible();
    await expect(page.getByText("A curator reads your note and checks the source.")).toBeVisible();
    await shot("4-thanks");
    await noSideScroll();

    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("share flow: no disease given, link required, keyboard only", async ({ page }) => {
  const errors: string[] = [];
  collect(page, errors);
  await page.goto("/share");
  await expect(page.getByText("About:")).toHaveCount(0);
  await page.getByRole("radio", { name: /registry or natural-history study/i }).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter"); // Enter in a radio submits the step form
  await expect(page.getByRole("heading", { level: 1, name: "Tell us about it" })).toBeVisible();
  await expect(page.getByLabel("Which disease is it about?")).toBeVisible();
  await page.getByLabel(/Name of the registry or study/).fill("Example natural-history study");
  await page.getByRole("button", { name: "Preview my note" }).click();
  await expect(page.getByText(/Please fill in .Link to a public source/)).toBeVisible();
  await expect(page.locator("#share-link")).toBeFocused();
  await page.getByLabel(/Link to a public source/).fill("not a link");
  await page.getByRole("button", { name: "Preview my note" }).click();
  await expect(page.getByText("Please paste a full web address")).toBeVisible();
  await page.getByLabel(/Link to a public source/).fill("www.clinicaltrials.gov/study/NCT01234567");
  await page.getByRole("button", { name: "Preview my note" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Check and send" })).toBeVisible();
  const href = (await page.getByRole("link", { name: /Open GitHub to send/ }).getAttribute("href")) ?? "";
  expect(new URL(href).searchParams.get("source")).toBe("https://www.clinicaltrials.gov/study/NCT01234567");
  expect(errors, errors.join("\n")).toEqual([]);
});
