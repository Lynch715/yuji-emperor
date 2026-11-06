// Coalesce viewport writes to one per frame and skip unchanged values, so a
// visualViewport scroll does not restyle the whole document on every event.
export function createViewportUpdater(read, write, schedule = (f) => requestAnimationFrame(f)) {
  let queued = false, last = "";
  return () => {
    if (queued) return;
    queued = true;
    schedule(() => {
      queued = false;
      const { height, top } = read(), key = height + "|" + top;
      if (key === last) return;
      last = key;
      write(height, top);
    });
  };
}
export const FONT_SCALES = { m: "标准", l: "较大", xl: "特大" };
export function applyFontScale(value, root = document.documentElement, storage = globalThis.localStorage) {
  const scale = FONT_SCALES[value] ? value : "m";
  if (scale === "m") root.removeAttribute("data-font");
  else root.setAttribute("data-font", scale);
  try { storage?.setItem("yuji:font", scale); } catch {}
  return scale;
}
export function storedFontScale(storage = globalThis.localStorage) {
  try { return FONT_SCALES[storage?.getItem("yuji:font")] ? storage.getItem("yuji:font") : "m"; } catch { return "m"; }
}
let installed = false;
export function initMobileViewport() {
  if (installed) return;
  installed = true;
  const root = document.documentElement;
  const update = createViewportUpdater(
    () => ({
      height: window.visualViewport?.height || window.innerHeight,
      top: window.visualViewport?.offsetTop || 0,
    }),
    (height, top) => {
      root.style.setProperty("--app-height", height + "px");
      root.style.setProperty("--viewport-top", top + "px");
    },
  );
  window.addEventListener("resize", update);
  window.visualViewport?.addEventListener("resize", update);
  window.visualViewport?.addEventListener("scroll", update);
  update();
  applyFontScale(storedFontScale());
}
