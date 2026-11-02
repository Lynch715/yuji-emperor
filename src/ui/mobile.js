// Keep the game at its intended scale while preserving ordinary scrolling and text selection.
export function blockPinch(event) {
  if ((event.touches?.length || 0) > 1 || ['gesturestart','gesturechange'].includes(event.type)) {
    if (event.cancelable) event.preventDefault();
  }
}
let installed=false;
export function initMobileViewport() {
  if(installed)return;
  installed=true;
  for(const type of ['touchstart','touchmove','gesturestart','gesturechange'])
    document.addEventListener(type,blockPinch,{passive:false});
  const update=()=>{
    const viewport=window.visualViewport;
    document.documentElement.style.setProperty('--app-height',(viewport?.height||window.innerHeight)+'px');
    document.documentElement.style.setProperty('--viewport-top',(viewport?.offsetTop||0)+'px');
  };
  window.addEventListener('resize',update);
  window.visualViewport?.addEventListener('resize',update);
  window.visualViewport?.addEventListener('scroll',update);
  update();
}
