// Keep the game at its intended scale without delaying ordinary scrolling.
// Android pinch is stopped by touch-action: pan-x pan-y; only iOS gesture
// events need a non-passive listener, and they fire for pinches alone.
export const GUARDED_EVENTS = ["gesturestart", "gesturechange"];
export function blockPinch(event) {
  if ((event.touches?.length || 0) > 1 || GUARDED_EVENTS.includes(event.type)) {
    if (event.cancelable) event.preventDefault();
  }
}
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
  for (const type of GUARDED_EVENTS)
    document.addEventListener(type, blockPinch, { passive: false });
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
