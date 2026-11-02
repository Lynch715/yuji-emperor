import { initMobileViewport } from "./mobile.js";
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
let returnFocus, returnSelector;
export function openDialog(title, body, className = "") {
  const d = $("#modal");
  const active=document.activeElement;
  if (d.open) d.close();
  if (!active?.closest?.('#modal')) {
    returnFocus=active;returnSelector=null;
    for (const key of ['command','action','slot','panel']) if(active?.dataset?.[key]) returnSelector='[data-'+key+'="'+CSS.escape(active.dataset[key])+'"]';
  }
  d.onkeydown=null;
  if (className === 'action-shell') body='<div class="dual-content"><article id="action-document" class="paper action-document"><h3>'+esc(title)+'</h3><p>御案上的事，请逐项裁定。</p></article><section class="action-options">'+body+'</section></div>';
  d.className = className;
  d.innerHTML =
    '<div class="dialog-head"><h2 id="modal-title">' +
    esc(title) +
    '</h2><button type="button" id="close-modal" aria-label="关闭窗口">×</button></div>' +
    body;
  $("#close-modal").onclick = () => d.close();
  d.showModal();
  document.documentElement.classList.add("modal-open");
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
function fitBrandDate() {
  for(const date of document.querySelectorAll('.brand .date')) {
    date.style.removeProperty('font-size');
    const css=getComputedStyle(date),minimum=Number.parseFloat(css.getPropertyValue('--font-minor'))||10;
    let size=Number.parseFloat(css.fontSize);
    while(date.scrollWidth>date.clientWidth&&size>minimum){size=Math.max(minimum,size-.5);date.style.fontSize=size+'px';}
  }
}
export function initCommon() {
  initMobileViewport();
  // Refit after rendering, viewport changes and the optional web fonts settle.
  new MutationObserver(fitBrandDate).observe($('#app'),{childList:true});
  window.addEventListener('resize',fitBrandDate);
  document.fonts?.ready.then(fitBrandDate);
  $("#modal").addEventListener("keydown", e => {
    if(e.key!=='Tab')return;
    const d=$("#modal"),items=[...d.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(x=>x.tabIndex>=0&&x.getClientRects().length&&(!x.checkVisibility||x.checkVisibility()));
    if(!items.length){e.preventDefault();return;}
    const at=items.indexOf(document.activeElement);
    if((e.shiftKey&&at<=0)||(!e.shiftKey&&(at===items.length-1||at<0))){e.preventDefault();items[e.shiftKey?items.length-1:0].focus();}
  });
  $("#modal").addEventListener("close", () => {
    if($("#modal").open)return;
    document.documentElement.classList.remove("modal-open");
    if (returnFocus?.isConnected) returnFocus.focus();
    else if(returnSelector) document.querySelector(returnSelector)?.focus();
  });
}
