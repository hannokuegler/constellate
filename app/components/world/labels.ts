// Star name labels of the scroll story: HTML pills ([data-star-label="<node id>"]) rendered by StoryStage, moved here
// by whichever renderer is active (every 3D frame, every 2D redraw). React only decides which ones are visible.

export function placeStarLabels(screenOf: (id: string) => [number, number] | null) {
  const labels = document.querySelectorAll<HTMLElement>("[data-star-label]");
  labels.forEach((label) => {
    const at = screenOf(label.dataset.starLabel ?? "");
    if (!at || !Number.isFinite(at[0]) || at[0] < -1e4) {
      label.style.visibility = "hidden";
      return;
    }
    label.style.visibility = "";
    // to the right of the star, vertically centred on it
    label.style.transform = `translate3d(${Math.round(at[0] + 16)}px, ${Math.round(at[1])}px, 0) translateY(-50%)`;
  });
}
