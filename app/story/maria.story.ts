import { test, expect, type Locator, type Page } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { SPEAKERS, STORY_NOTE, STORY_TITLE, storyLine } from "../lib/story";

// Records Maria's walkthrough through the live app with Consti's speech bubbles and a visible cursor,
// then encodes it to public/story/maria.mp4 and maria.webm plus a poster frame. Run: npm run story:record (needs ffmpeg).
const OUT = join(__dirname, "..", "public", "story");
const RAW = join(__dirname, "..", "story-raw");
const SIZE = { width: 1280, height: 720 };
const MAX_SECONDS = 59.5;
const VOICE = join(__dirname, "voice"); // one MP3 per line from `npm run story:voice`; without them the video stays silent

// when each voice clip starts, in ms since the context opened (the video clock)
const cues: { file: string; at: number }[] = [];
let t0 = 0;

const seconds = (file: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

// where the speech in a clip ends: trailing silence does not count, pauses inside the line do
function speechEnd(file: string): number {
  const total = seconds(file);
  const log = spawnSync("ffmpeg", ["-nostdin", "-i", file, "-af", "silencedetect=n=-45dB:d=0.2", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const starts = [...log.matchAll(/silence_start: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...log.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const last = starts.at(-1);
  if (last === undefined) return total;
  return ends.length < starts.length || (ends.at(-1) ?? 0) >= total - 0.1 ? last : total;
}

// injected into every document: speech bubbles, title cards and a cursor, appended lazily so hydration never sees them
function overlay() {
  const w = window as unknown as Record<string, unknown>;
  let root: HTMLDivElement | null = null;
  const css = `
    #story-root{position:fixed;inset:0;pointer-events:none;z-index:2147483646;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    #story-chat{position:absolute;left:24px;bottom:24px;width:470px;display:flex;flex-direction:column;gap:10px}
    #story-chat.right{left:auto;right:24px}
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
    #story-cursor{position:absolute;left:0;top:0;width:26px;height:26px;transition:transform .05s linear}
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
  w.__storyDock = (side: string) => ensure().querySelector("#story-chat")!.classList.toggle("right", side === "right");
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

// shows the bubble and returns when the line ends: the voice clip plus a breath, or reading time without a clip;
// actions between show() and until() run while the line is spoken
async function bubble(page: Page, id: string) {
  const line = storyLine(id);
  const sp = SPEAKERS[line.who];
  await page.evaluate(([who, name, role, text]) => (window as unknown as { __storySay: (...a: string[]) => void }).__storySay(who, name, role, text), [line.who, sp.name, sp.role, line.text]);
}

async function show(page: Page, id: string, withBubble = true): Promise<number> {
  const line = storyLine(id);
  if (withBubble) await bubble(page, id);
  const clip = join(VOICE, `${id}.mp3`);
  if (!existsSync(clip)) return Date.now() + readMs(line.text);
  cues.push({ file: clip, at: Date.now() - t0 });
  return Date.now() + Math.round(speechEnd(clip) * 1000) + 180;
}

async function until(page: Page, end: number) {
  const left = end - Date.now();
  if (left > 0) await page.waitForTimeout(left);
}

async function say(page: Page, id: string, bubble = true) {
  await until(page, await show(page, id, bubble));
}

async function dock(page: Page, side: "left" | "right") {
  await page.evaluate((x) => (window as unknown as { __storyDock: (s: string) => void }).__storyDock(x), side);
}

async function card(page: Page, title: string | null, text = "") {
  await page.evaluate(([t, x]) => (window as unknown as { __storyCard: (a: string | null, b: string) => void }).__storyCard(t, x), [title, text] as const);
}

// eased scroll (cubic in-out) instead of the browser's abrupt smooth scroll; "start" leaves room for the sticky header
async function scrollTo(page: Page, target: Locator, block: "start" | "center" | "top" = "center") {
  await target.evaluate(async (el, b) => {
    const r = el.getBoundingClientRect();
    const from = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const goal = b === "top" ? 0 : b === "start" ? from + r.top - 76 : from + r.top + r.height / 2 - window.innerHeight / 2;
    const to = Math.max(0, Math.min(max, goal));
    const ms = Math.min(1100, 450 + Math.abs(to - from) * 0.35);
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        window.scrollTo({ top: from + (to - from) * e, behavior: "instant" });
        if (k < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
  }, block);
  await page.waitForTimeout(120);
}

// glide the cursor to the element (and click it)
// the cursor travels on an eased path at a hand's pace; off-screen targets are scrolled into view first
let cursor = { x: 900, y: 300 };
async function glideTo(page: Page, target: Locator) {
  let box = await target.boundingBox();
  if (!box || box.y < 70 || box.y + box.height > SIZE.height - 10) {
    await scrollTo(page, target);
    box = await target.boundingBox();
  }
  if (!box) throw new Error("target not visible");
  const to = { x: box.x + Math.min(box.width / 2, 60), y: box.y + box.height / 2 };
  const steps = Math.round(Math.min(30, Math.max(12, Math.hypot(to.x - cursor.x, to.y - cursor.y) / 22)));
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(cursor.x + (to.x - cursor.x) * e, cursor.y + (to.y - cursor.y) * e);
    await page.waitForTimeout(14);
  }
  cursor = to;
}

async function glideClick(page: Page, target: Locator) {
  await glideTo(page, target);
  await page.waitForTimeout(120);
  await target.click();
}

test("record Maria's story", async ({ browser }) => {
  test.setTimeout(480_000);
  rmSync(RAW, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const ctx = await browser.newContext({ viewport: SIZE, colorScheme: "light", recordVideo: { dir: RAW, size: SIZE } });
  cues.length = 0;
  await ctx.addInitScript(overlay);
  const page = await ctx.newPage();
  t0 = Date.now(); // the video starts with the page

  // title card over the start page
  await page.goto("/");
  await expect(page.getByRole("combobox", { name: /search diseases/i })).toBeVisible();
  await card(page, STORY_TITLE, STORY_NOTE);
  const lead = Date.now() - t0;
  cursor = { x: 900, y: 300 };
  await page.mouse.move(cursor.x, cursor.y);
  // warm the data the story opens, so no page shows its loading state on camera
  await page.evaluate(() => Promise.all(["/data/disease/MONDO_0009499.json", "/data/gene/PSAP.json"].map((u) => fetch(u))));
  await page.evaluate(() => {
    const router = (window as unknown as { next?: { router?: { prefetch: (href: string) => void } } }).next?.router;
    ["/d/MONDO_0009499", "/g/PSAP"].forEach((href) => router?.prefetch(href));
  });
  await page.waitForTimeout(1000);

  // the first night: Maria's voice starts in the dark, the start page fades in under her line;
  // Consti introduces herself while Maria types (bubbles right, clear of the search list)
  await dock(page, "right");
  let end = await show(page, "m-start", false); // the voice starts in the dark, the bubble comes with the page
  await page.waitForTimeout(1600);
  await card(page, null);
  await bubble(page, "m-start");
  await until(page, end);
  end = await show(page, "c-hello");
  const box = page.getByRole("combobox", { name: /search diseases/i });
  await glideClick(page, box);
  for (const [ch, ms] of [["k", 140], ["r", 95], ["a", 170], ["b", 120], ["e", 210]] as const) await box.press(ch, { delay: 30 }).then(() => page.waitForTimeout(ms));
  const hit = page.getByRole("listbox").getByRole("option", { name: /Krabbe disease/ }).first();
  await expect(hit).toBeVisible();
  await until(page, end);
  await glideClick(page, hit);
  await expect(page).toHaveURL(/\/d\/MONDO_0009499/);
  await expect(page.locator("canvas").first()).toBeVisible();
  await dock(page, "left");
  await page.waitForTimeout(300);

  // alone: the honest gap, then the open studies
  end = await show(page, "m-alone");
  await scrollTo(page, page.locator("#patient-organisations"));
  await until(page, end);
  await say(page, "c-gap");
  end = await show(page, "c-studies");
  await scrollTo(page, page.getByRole("heading", { name: /Studies looking for participants/ }), "start");
  await until(page, end);

  // trust: one line of the graph opens its evidence
  end = await show(page, "m-trust");
  await scrollTo(page, page.getByRole("heading", { level: 1, name: "Krabbe disease" }), "start");
  const line = page.getByRole("button", { name: /Evidence: (caused by|associated gene|disease gene)/i }).first();
  await glideTo(page, line);
  await until(page, end);
  await line.click();
  end = await show(page, "c-evidence");
  await expect(page.getByRole("dialog")).toBeVisible();
  await until(page, end);

  // next door: MLD shares PSAP, then the PSAP page
  end = await show(page, "c-related");
  await glideClick(page, page.getByRole("button", { name: /close evidence panel/i }));
  await scrollTo(page, page.locator("#related"), "start");
  await until(page, end);
  await glideClick(page, page.getByRole("link", { name: "PSAP", exact: true }).first());
  end = await show(page, "c-psap"); // the line starts with the click, the page arrives under it
  await expect(page).toHaveURL(/\/g\/PSAP/);
  await expect(page.getByText(/One gene, \d+ disease names/)).toBeVisible();
  await until(page, end);

  // the action card
  await page.goBack();
  await expect(page).toHaveURL(/\/d\/MONDO_0009499/);
  await scrollTo(page, page.locator("body"), "top");
  await glideClick(page, page.getByRole("button", { name: "Action card" }).first());
  end = await show(page, "c-card");
  await expect(page.locator("#action-card")).toBeVisible();
  await until(page, end);
  await say(page, "m-end");

  // silence, then the last line over the closing card
  await page.waitForTimeout(700);
  await page.evaluate(() => (window as unknown as { __storyClear: () => void }).__storyClear());
  await card(page, "Your family is not the first.", "Now try it yourself: search your diagnosis, open any line, take your action card.");
  await page.waitForTimeout(300);
  await say(page, "c-end", false); // the card carries the words
  await page.waitForTimeout(700);

  const video = page.video();
  await ctx.close();
  const raw = await video!.path();

  // trim the blank lead-in, lay the voice clips on the video clock, encode H.264/AAC for every browser and VP9/Opus as fallback
  const cut = lead + 650; // start once the title card has faded in
  const audioIn = cues.flatMap((c) => ["-i", c.file]);
  // the story must stay under a minute: if it runs long, play everything up to 5 % faster (atempo keeps the pitch)
  const length = seconds(raw) - cut / 1000;
  const tempo = Math.min(1.05, Math.max(1, length / MAX_SECONDS));
  if (length / tempo > MAX_SECONDS) console.warn(`story is ${(length / tempo).toFixed(1)} s even at +5 %: shorten a line or a pause`);
  const mix = cues.length
    ? ["-filter_complex", cues.map((c, i) => `[${i + 1}:a]adelay=${c.at - cut}:all=1[a${i}]`).join(";") + `;${cues.map((_, i) => `[a${i}]`).join("")}amix=inputs=${cues.length}:normalize=0:dropout_transition=0,atempo=${tempo.toFixed(4)},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[voice];[0:v]setpts=PTS/${tempo.toFixed(4)}[v]`, "-map", "[v]", "-map", "[voice]"]
    : ["-vf", `setpts=PTS/${tempo.toFixed(4)}`, "-an"];
  const input = ["-y", "-loglevel", "error", "-ss", (cut / 1000).toFixed(3), "-i", raw, ...audioIn, ...mix];
  const mp4 = join(OUT, "maria.mp4");
  execFileSync("ffmpeg", [...input, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-r", "25", ...(cues.length ? ["-c:a", "aac", "-b:a", "128k"] : []), "-movflags", "+faststart", mp4]);
  execFileSync("ffmpeg", [...input, "-c:v", "libvpx-vp9", "-crf", "42", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-r", "25", ...(cues.length ? ["-c:a", "libopus", "-b:a", "96k"] : []), join(OUT, "maria.webm")]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "0.6", "-i", mp4, "-frames:v", "1", "-q:v", "4", join(OUT, "maria.jpg")]);
  rmSync(RAW, { recursive: true, force: true });
});
