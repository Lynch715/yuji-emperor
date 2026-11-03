import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GUARDED_EVENTS,createViewportUpdater,applyFontScale,storedFontScale} from '../src/ui/mobile.js';

test('F1-U1 只为 iOS 手势注册非被动监听，滚动所用的 touch 事件不被阻塞',()=>{
  assert.deepEqual(GUARDED_EVENTS,['gesturestart','gesturechange']);
  const src=readFileSync('src/ui/mobile.js','utf8');
  assert.doesNotMatch(src,/['"]touch(start|move)['"]\s*[,\]]/);
  assert.match(readFileSync('src/ui/style.css','utf8'),/html,\nbody \{\n  touch-action: pan-x pan-y;/);
});
test('F1-U2 悬停样式只在可悬停设备生效，按钮有按压反馈',()=>{
  const css=readFileSync('src/ui/style.css','utf8');
  const bare=css.replace(/@media \(hover: hover\) \{[\s\S]*?\n\}/g,'');
  assert.doesNotMatch(bare,/:hover/);
  assert.match(css,/button:not\(:disabled\):active/);
  assert.match(css,/-webkit-tap-highlight-color: transparent/);
});
test('F1-U3 整页重绘前后保留内部滚动与焦点',()=>{
  const app=readFileSync('src/ui/app.js','utf8');
  assert.match(app,/captureView\(\$\("#app"\)\)[\s\S]*?innerHTML = renderApp[\s\S]*?restoreView\(\$\("#app"\), kept\)/);
});
test('F1-U4/U5 流式正文与视口变量每帧最多写一次，值不变不写',()=>{
  const frames=[],writes=[];let h=600;
  const update=createViewportUpdater(()=>({height:h,top:0}),(a,b)=>writes.push([a,b]),f=>frames.push(f));
  update();update();update();assert.equal(frames.length,1);frames.shift()();assert.deepEqual(writes,[[600,0]]);
  update();frames.shift()();assert.equal(writes.length,1,'值未变不应写入');
  h=420;update();frames.shift()();assert.deepEqual(writes.at(-1),[420,0]);
  assert.match(readFileSync('src/ui/app.js','utf8'),/onPartial: streamDraft/);
});
test('F1-U6 弹窗占用一条历史记录，返回手势先关弹窗；续写中离开页面需确认',()=>{
  const c=readFileSync('src/ui/common.js','utf8');
  assert.match(c,/d\.showModal\(\);\n  pushModalEntry\(\);/);
  assert.match(c,/addEventListener\("popstate"/);
  assert.match(c,/addEventListener\("beforeunload"/);
  assert.match(readFileSync('src/ui/app.js','utf8'),/setLeaveGuard\(\(\) => busy\)/);
});
test('F1-L4 正文字号三档，可存取，非法值回到标准',()=>{
  const attrs={},store={};
  const root={setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k]};
  const storage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v};
  assert.equal(applyFontScale('xl',root,storage),'xl');assert.equal(attrs['data-font'],'xl');assert.equal(storedFontScale(storage),'xl');
  assert.equal(applyFontScale('bad',root,storage),'m');assert.equal(attrs['data-font'],undefined);
});
