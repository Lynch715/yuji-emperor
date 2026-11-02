export const $ = (selector) => document.querySelector(selector);
export function esc(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
let toastTimer;
export function toast(text) {
  $("#notice").textContent = text;
  $("#notice").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#notice").classList.remove("show"), 6000);
}
let returnFocus;
export function openDialog(title, body, className = "") {
  const d = $("#modal");
  if (d.open) d.close();
  returnFocus = document.activeElement;
  d.className = className;
  d.innerHTML =
    '<div class="dialog-head"><h2 id="modal-title">' +
    esc(title) +
    '</h2><button type="button" id="close-modal" aria-label="关闭窗口">×</button></div>' +
    body;
  $("#close-modal").onclick = () => d.close();
  d.showModal();
  d.scrollTop = 0;
}
export function closeDialog() {
  $("#modal").close();
}
export function download(name, data, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function initCommon() {
  $("#modal").addEventListener("close", () => {
    if (returnFocus?.isConnected) returnFocus.focus();
  });
}
