import { test, expect, type Locator, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { SPEAKERS, STORY_NOTE, STORY_TITLE, storyLine } from "../lib/story";

// Records Maria's walkthrough through the live app with Consti's speech bubbles and a visible cursor,
// then encodes it to public/story/maria.mp4 and maria.webm plus a poster frame. Run: npm run story:record (needs ffmpeg).
const OUT = join(__dirname, "..", "public", "story");
const RAW = join(__dirname, "..", "story-raw");
const SIZE = { width: 1280, height: 720 };

// injected into every document: speech bubbles, title cards and a cursor, appended lazily so hydration never sees them
function overlay() {
  const w = window as unknown as Record<string, unknown>;
  let root: HTMLDivElement | null = null;
  const css = `
    #story-root{position:fixed;inset:0;pointer-events:none;z-index:2147483646;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    #story-chat{position:absolute;left:24px;bottom:24px;width:470px;display:flex;flex-direction:column;gap:10px}
    .story-msg{display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid #dfe2ea;border-radius:20px;padding:14px 16px;
      box-shadow:0 2px 4px rgb(20 24 38/.08),0 16px 40px rgb(20 24 38/.18);opacity:0;transform:translateY(10px);transition:opacity .35s,transform .35s}
    .story-msg.in{opacity:1;transform:none}
    .story-msg.old{background:#f4f5f8;box-shadow:0 1px 2px rgb(20 24 38/.08)}
    .story-msg.old .story-text{color:#4a5168;font-size:15px}
    .story-msg.maria{border-color:#f2c9b8}
    .story-av{flex:none;width:40px;height:40px;border-radius:999px;display:grid;place-items:center;font-weight:700;font-size:17px}
    .maria .story-av{background:#e8704f;color:#fff}
    .consti .story-av{background:#12142a}
    .story-who{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
    .maria .story-who{color:#c4512f}
    .consti .story-who{color:#4b49c8}
    .story-who span{font-weight:500;text-transform:none;letter-spacing:0;color:#4a5168;margin-left:6px}
    .story-text{margin-top:2px;font-size:17px;line-height:1.4;color:#141826}
    #story-card{position:absolute;inset:0;display:grid;place-items:center;background:#0d1020;color:#eef0f8;opacity:0;transition:opacity .6s;text-align:center}
    #story-card.in{opacity:1}
    #story-card h1{font-size:46px;font-weight:700;letter-spacing:-.02em;margin:0}
    #story-card p{font-size:19px;color:#a9b0cc;margin:14px auto 0;max-width:640px;line-height:1.45}
    #story-cursor{position:absolute;left:0;top:0;width:26px;height:26px;transition:transform .08s linear}
    #story-cursor.down circle{r:13}
  `;
  const consti = `<svg width="26" height="26" viewBox="0 0 28 28"><path d="M6 20 L12 8 L20 12 L23 22 Z M12 8 L23 22" fill="none" stroke="#2c3254" stroke-width="1.2"/><circle cx="6" cy="20" r="2.4" fill="#42d1b9"/><circle cx="12" cy="8" r="3.2" fill="#ffc94a"/><circle cx="20" cy="12" r="2.4" fill="#8f8dff"/><circle cx="23" cy="22" r="2" fill="#c48af0"/></svg>`;
  const pointer = `<svg width="26" height="26" viewBox="0 0 26 26"><circle cx="5" cy="5" r="0" fill="rgb(75 73 200/.25)"/><path d="M4 3l14 6.5-6 1.6-2.4 6.2z" fill="#141826" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  function ensure(): HTMLDivElement {
    if (root && root.isConnected) return root;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    root = document.createElement("div");
    root.id = "story-root";
    root.innerHTML = `<div id="story-chat"></div><div id="story-cursor">${pointer}</div>`;
    document.body.appendChild(root);
    const cur = root.querySelector<HTMLDivElement>("#story-cursor")!;
    const last = (w.__storyPos as [number, number] | undefined) ?? [640, 360];
    cur.style.transform = `translate(${last[0] - 4}px,${last[1] - 3}px)`;
    return root;
  }

  document.addEventListener("mousemove", (e) => {
    w.__storyPos = [e.clientX, e.clientY];
    const cur = ensure().querySelector<HTMLDivElement>("#story-cursor")!;
    cur.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 3}px)`;
  }, true);
  document.addEventListener("mousedown", () => ensure().querySelector("#story-cursor")!.classList.add("down"), true);
  document.addEventListener("mouseup", () => ensure().querySelector("#story-cursor")!.classList.remove("down"), true);

  w.__storySay = (who: string, name: string, role: string, text: string) => {
    const chat = ensure().querySelector<HTMLDivElement>("#story-chat")!;
    const msgs = chat.querySelectorAll(".story-msg");
    msgs.forEach((m, i) => (i < msgs.length - 1 ? m.remove() : m.classList.add("old")));
    const msg = document.createElement("div");
    msg.className = `story-msg ${who}`;
    const av = document.createElement("div");
    av.className = "story-av";
    if (who === "consti") av.innerHTML = consti;
    else av.textContent = name[0];
    const body = document.createElement("div");
    const label = document.createElement("div");
    label.className = "story-who";
    label.textContent = name;
    const sub = document.createElement("span");
    sub.textContent = role;
    label.appendChild(sub);
    const p = document.createElement("div");
    p.className = "story-text";
    p.textContent = text;
    body.append(label, p);
    msg.append(av, body);
    chat.appendChild(msg);
    requestAnimationFrame(() => requestAnimationFrame(() => msg.classList.add("in")));
  };
  w.__storyClear = () => ensure().querySelector("#story-chat")!.replaceChildren();
  w.__storyCard = (title: string | null, text: string) => {
    const r = ensure();
    let card = r.querySelector<HTMLDivElement>("#story-card");
    if (title === null) {
      card?.classList.remove("in");
      return;
    }
    if (!card) {
      card = document.createElement("div");
      card.id = "story-card";
      r.insertBefore(card, r.firstChild);
    }
    card.innerHTML = "";
    const box = document.createElement("div");
    const h = document.createElement("h1");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = text;
    box.append(h, p);
    card.appendChild(box);
    requestAnimationFrame(() => requestAnimationFrame(() => card!.classList.add("in")));
  };
}

// reading time: about 3.8 words per second, never shorter than 2.4 s
const readMs = (text: string) => Math.max(2400, Math.round((text.split(/\s+/).length / 3.8) * 1000) + 800);

async function say(page: Page, id: string, extraMs = 0) {
  const line = storyLine(id);
  const sp = SPEAKERS[line.who];
  await page.evaluate(([who, name, role, text]) => (window as unknown as { __storySay: (...a: string[]) => void }).__storySay(who, name, role, text), [line.who, sp.name, sp.role, line.text]);
  await page.waitForTimeout(readMs(line.text) + extraMs);
}

async function card(page: Page, title: string | null, text = "") {
  await page.evaluate(([t, x]) => (window as unknown as { __storyCard: (a: string | null, b: string) => void }).__storyCard(t, x), [title, text] as const);
}

async function scrollTo(page: Page, target: Locator, block: "start" | "center" = "center") {
  await target.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b }), block);
  await page.waitForTimeout(1100);
}

// glide the cursor to the element, then click it
async function glideClick(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("target not visible");
  await page.mouse.move(box.x + Math.min(box.width / 2, 60), box.y + box.height / 2, { steps: 28 });
  await page.waitForTimeout(250);
  await target.click();
}

test("record Maria's story", async ({ browser }) => {
  test.setTimeout(480_000);
  rmSync(RAW, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const ctx = await browser.newContext({ viewport: SIZE, colorScheme: "light", recordVideo: { dir: RAW, size: SIZE } });
  const t0 = Date.now();
  await ctx.addInitScript(overlay);
  const page = await ctx.newPage();

  // title card over the start page
  await page.goto("/");
  await expect(page.getByRole("combobox", { name: /search diseases/i })).toBeVisible();
  await card(page, STORY_TITLE, STORY_NOTE);
  const lead = Date.now() - t0;
  await page.mouse.move(900, 300);
  await page.waitForTimeout(3600);
  await card(page, null);
  await page.waitForTimeout(700);

  // moment 1 (the start page default): Maria types the name she cannot spell
  await say(page, "m-start");
  await say(page, "c-hello");
  const box = page.getByRole("combobox", { name: /search diseases/i });
  await glideClick(page, box);
  await box.pressSequentially("krabe", { delay: 230 });
  const hit = page.getByRole("listbox").getByRole("option", { name: /Krabbe disease/ }).first();
  await expect(hit).toBeVisible();
  await say(page, "c-typo", -600);
  await glideClick(page, hit);

  // the neighbourhood map
  await expect(page).toHaveURL(/\/d\/MONDO_0009499/);
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.waitForTimeout(1500);
  await say(page, "c-map", 600);

  // honest gap, then open studies
  await say(page, "m-alone", -400);
  await scrollTo(page, page.locator("#patient-organisations"));
  await say(page, "c-gap", 500);
  await scrollTo(page, page.getByRole("heading", { name: /Studies looking for participants/ }), "start");
  await say(page, "c-studies", 400);

  // evidence panel on one line of the graph
  await say(page, "m-trust", -400);
  await scrollTo(page, page.getByRole("heading", { level: 1, name: "Krabbe disease" }), "start");
  await glideClick(page, page.getByRole("button", { name: /Evidence: (caused by|associated gene|disease gene)/i }).first());
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(700);
  await say(page, "c-evidence", 900);
  await glideClick(page, page.getByRole("button", { name: /close evidence panel/i }));

  // related families: MLD via PSAP, then the PSAP gene page
  await scrollTo(page, page.locator("#related"), "start");
  await say(page, "c-related");
  await glideClick(page, page.getByRole("link", { name: "PSAP", exact: true }).first());
  await expect(page).toHaveURL(/\/g\/PSAP/);
  await expect(page.getByText(/One gene, \d+ disease names/)).toBeVisible();
  await page.waitForTimeout(800);
  await say(page, "c-psap", 600);

  // action card
  await say(page, "m-what", -400);
  await page.goBack();
  await expect(page).toHaveURL(/\/d\/MONDO_0009499/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(900);
  await glideClick(page, page.getByRole("button", { name: "Action card" }).first());
  await expect(page.locator("#action-card")).toBeVisible();
  await page.waitForTimeout(1300);
  await say(page, "c-card", 1200);
  await say(page, "m-end");
  await say(page, "c-end", -300);

  // closing card
  await page.evaluate(() => (window as unknown as { __storyClear: () => void }).__storyClear());
  await card(page, "Your family is not the first.", "Now try it yourself: search your diagnosis, open any line, take your action card.");
  await page.waitForTimeout(3800);

  const video = page.video();
  await ctx.close();
  const raw = await video!.path();

  // trim the blank lead-in, encode H.264 for every browser, keep the file small
  const mp4 = join(OUT, "maria.mp4");
  const start = Math.max(0, lead / 1000 - 0.2).toFixed(2);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", start, "-i", raw, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-r", "25", "-movflags", "+faststart", "-an", mp4]);
  // VP9 fallback for browsers without H.264 (open-source Chromium, Playwright's own build)
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", start, "-i", raw, "-c:v", "libvpx-vp9", "-crf", "42", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-r", "25", "-an", join(OUT, "maria.webm")]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "1.5", "-i", mp4, "-frames:v", "1", "-q:v", "4", join(OUT, "maria.jpg")]);
  rmSync(RAW, { recursive: true, force: true });
});
