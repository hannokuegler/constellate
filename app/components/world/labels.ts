// Star name labels of the scroll story: glass pills ([data-star-label="<node id>"]) rendered by StoryStage, moved here
// by whichever renderer is active (every 3D frame, every 2D redraw). React only decides which ones are on
// (data-on="1"). Placement: right of the star, else left, below or above; never over the caption box
// ([data-caption-box][data-open]), the header strip or another pill, never outside the stage. No room: hidden.

const HEADER = 72; // the site header overlays the top of the sticky stage
const EDGE = 8;
const GAP = 14;

type Rect = { l: number; t: number; r: number; b: number };
const hits = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

let lastScreenOf: ((id: string) => [number, number] | null) | null = null;

/** place again with the renderer's last projection (after React switched pills or the caption) */
export function replaceStarLabels() {
  if (lastScreenOf) placeStarLabels(lastScreenOf);
}

export function forgetStarLabels() {
  lastScreenOf = null;
}

export function placeStarLabels(screenOf: (id: string) => [number, number] | null) {
  lastScreenOf = screenOf;
  const labels = [...document.querySelectorAll<HTMLElement>("[data-star-label]")];
  if (!labels.length) return;
  const stage = (labels[0].offsetParent as HTMLElement | null)?.getBoundingClientRect();
  if (!stage) return;
  const W = stage.width;
  const H = stage.height;
  const blocked: Rect[] = [];
  const box = document.querySelector<HTMLElement>("[data-caption-box][data-open]");
  if (box) {
    const r = box.getBoundingClientRect();
    blocked.push({ l: r.left - stage.left - 8, t: r.top - stage.top - 8, r: r.right - stage.left + 8, b: r.bottom - stage.top + 8 });
  }
  // read every size first, then write (one layout per frame)
  const sizes = labels.map((label) => [label.offsetWidth, label.offsetHeight] as const);
  const places: (Rect | null)[] = labels.map((label, k) => {
    const at = screenOf(label.dataset.starLabel ?? "");
    if (!at || !Number.isFinite(at[0]) || !Number.isFinite(at[1]) || at[0] < -1e4) return null;
    const [x, y] = at;
    if (x < 0 || x > W || y < HEADER || y > H) return null;
    const [w, h] = sizes[k];
    const clampX = (left: number) => Math.min(Math.max(left, EDGE), W - w - EDGE);
    const candidates: [number, number][] = [
      [x + GAP, y - h / 2],
      [x - GAP - w, y - h / 2],
      [clampX(x - w / 2), y + GAP],
      [clampX(x - w / 2), y - GAP - h],
    ];
    const on = label.dataset.on === "1";
    for (const [left, top] of candidates) {
      const rect = { l: left, t: top, r: left + w, b: top + h };
      if (rect.l < EDGE || rect.r > W - EDGE || rect.t < HEADER || rect.b > H - EDGE) continue;
      if (blocked.some((b) => hits(rect, b))) continue;
      if (on) blocked.push(rect);
      return rect;
    }
    return null;
  });
  labels.forEach((label, k) => {
    const rect = places[k];
    if (!rect) {
      label.style.visibility = "hidden";
      return;
    }
    label.style.visibility = "";
    label.style.transform = `translate3d(${Math.round(rect.l)}px, ${Math.round(rect.t)}px, 0)`;
  });
}
