import { initMobileViewport } from "./mobile.js";
export const $ = (selector) => document.querySelector(selector);
// Display labels only; saves stay intact.
export function gameText(text) {
  return String(text ?? "")
    .replace(/^本旬引擎结算：人物、政务与岁时变化$/, "本旬变化")
    .replace(/^模型人物反应建议：引擎限额采纳$/, "人物态度变化")
    .replace(/^引擎结算$/, "本旬变化")
    .replace(/宫闱事件：引擎判定小产/g, "宫中小产")
    .replace(/；面谈结果已落账/g, "；已在面谈中议定")
    .replace(/^本旬面谈已落账，午槽须保留对应人物的召见$/, "午间已召见此人，请先过完本旬。")
    .replace(/^预演已过期，不能提交到此存档$/, "这次安排已过期，请刷新后重试。")
    .replace(/^本回合请求已达 240 秒预算，请保留预演结果后重试$/, "故事续写超时，请重试本旬。")
    .replace(/^模型回复未完成或格式有误，原有进度已保留$/, "这次没能续完故事，请重试本旬。")
    .replace(/^存档处于只读保护模式$/, "此存档暂时无法保存，请先导出备份。");
}
export function esc(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
// Full re-renders replace the DOM. Keep inner scroll positions (the phone
// layout scrolls inside fixed-height containers) and the focused control.
function nodePath(node, root) {
  const path = [];
  while (node && node !== root) {
    const parent = node.parentElement;
    if (!parent) return null;
    path.unshift([...parent.children].indexOf(node));
    node = parent;
  }
  return node === root ? path : null;
}
function nodeAt(root, path) {
  let node = root;
  for (const i of path) { node = node?.children?.[i]; if (!node) return null; }
  return node;
}
function keyOf(el, root) {
  if (el.id) return { id: el.id };
  for (const name of ["scrollKey", "command", "action", "slot", "panel", "clear"])
    if (el.dataset?.[name]) return { data: name, value: el.dataset[name] };
  return { path: nodePath(el, root) };
}
function find(root, key) {
  if (key.id) return root.querySelector("#" + CSS.escape(key.id));
  if (key.data) return root.querySelector("[data-" + key.data.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) + '="' + CSS.escape(key.value) + '"]');
  return key.path ? nodeAt(root, key.path) : null;
}
export function captureView(root) {
  if (!root) return { scrolls: [], focus: null };
  const scrolls = [];
  for (const el of root.querySelectorAll("*"))
    if (el.scrollTop > 0 || el.scrollLeft > 0)
      scrolls.push({ key: keyOf(el, root), top: el.scrollTop, left: el.scrollLeft });
  const active = document.activeElement;
  const focus = active && active !== document.body && root.contains(active)
    ? { key: keyOf(active, root), start: active.selectionStart ?? null, end: active.selectionEnd ?? null }
    : null;
  return { scrolls, focus };
}
export function restoreView(root, view) {
  if (!root || !view) return;
  for (const s of view.scrolls) {
    const el = find(root, s.key);
    if (el) { el.scrollTop = s.top; el.scrollLeft = s.left; }
  }
  if (view.focus) {
    const el = find(root, view.focus.key);
    if (el && !el.disabled) {
      el.focus({ preventScroll: true });
      if (view.focus.start !== null && typeof el.setSelectionRange === "function")
        try { el.setSelectionRange(view.focus.start, view.focus.end); } catch {}
    }
  }
}
export function throttleFrame(fn, schedule = (f) => requestAnimationFrame(f)) {
  let queued = false, latest;
  return (...args) => {
    latest = args;
    if (queued) return;
    queued = true;
    schedule(() => { queued = false; fn(...latest); });
  };
}
// Back gestures close the open dialog instead of leaving the game. One history
// entry is pushed per dialog session; replacing the dialog content reuses it.
let modalEntry = false, closingFromHistory = false, pendingBack = 0, leaveGuard = () => false;
export function setLeaveGuard(fn) { leaveGuard = fn; }
function pushModalEntry() {
  if (modalEntry) return;
  try { history.pushState({ ...(history.state || {}), yujiModal: true }, ""); modalEntry = true; } catch {}
}
let toastTimer;
export function toast(text) {
  text = gameText(text);
  $("#notice").textContent = text;
  $("#notice").classList.add("show");
  const dialog=$("#modal");
  if(dialog?.open){
    let status=dialog.querySelector('.dialog-notice');
    if(!status){
      status=document.createElement('p');
      status.className='dialog-notice';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      const header=dialog.querySelector('.dialog-head');
      if(header)header.insertAdjacentElement('afterend',status);
      else dialog.prepend(status);
    }
    status.textContent=text;
  }
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
  pushModalEntry();
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
function fitBrandText() {
  for(const date of document.querySelectorAll('.brand .date,.brand h1')) {
    date.style.removeProperty('font-size');
    const css=getComputedStyle(date),minimum=Number.parseFloat(css.getPropertyValue(date.matches('h1')?'--font-ui':'--font-minor'))||10;
    let size=Number.parseFloat(css.fontSize);
    while(date.scrollWidth>date.clientWidth&&size>minimum){size=Math.max(minimum,size-.5);date.style.fontSize=size+'px';}
  }
}
export function initCommon() {
  initMobileViewport();
  // Refit after rendering, viewport changes and the optional web fonts settle.
  new MutationObserver(fitBrandText).observe($('#app'),{childList:true});
  window.addEventListener('resize',fitBrandText);
  document.fonts?.ready.then(fitBrandText);
  $("#modal").addEventListener("keydown", e => {
    if(e.key!=='Tab')return;
    const d=$("#modal"),items=[...d.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(x=>x.tabIndex>=0&&x.getClientRects().length&&(!x.checkVisibility||x.checkVisibility()));
    if(!items.length){e.preventDefault();return;}
    const at=items.indexOf(document.activeElement);
    if((e.shiftKey&&at<=0)||(!e.shiftKey&&(at===items.length-1||at<0))){e.preventDefault();items[e.shiftKey?items.length-1:0].focus();}
  });
  window.addEventListener("popstate", () => {
    if (pendingBack > 0) {
      // Our own history.back() after a close. If a new dialog opened before the
      // traversal landed, the entry we arrived on still belongs to a dialog.
      pendingBack--;
      modalEntry = $("#modal").open;
      return;
    }
    if (!modalEntry) return;
    modalEntry = false;
    if ($("#modal").open) { closingFromHistory = true; $("#modal").close(); }
  });
  window.addEventListener("beforeunload", (e) => {
    if (!leaveGuard()) return;
    e.preventDefault();
    e.returnValue = "";
  });
  $("#modal").addEventListener("close", () => {
    if($("#modal").open)return;
    if (closingFromHistory) closingFromHistory = false;
    else if (modalEntry) { modalEntry = false; pendingBack++; try { history.back(); } catch { pendingBack--; } }
    document.documentElement.classList.remove("modal-open");
    if (returnFocus?.isConnected) returnFocus.focus();
    else if(returnSelector) document.querySelector(returnSelector)?.focus();
  });
}
