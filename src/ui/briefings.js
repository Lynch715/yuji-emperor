import {esc} from './common.js';
export function briefingsHTML(items=[],limit=9){
 if(!items.length)return '';
 const rows=items.slice(-limit).reverse();
 return '<section class="briefings"><h3>例行奏报与有司细务</h3><p class="muted">备览，无须拟批；遇超例事项另折请裁。</p>'+rows.map(b=>
  '<details class="briefing"><summary><span class="briefing-kind">'+(b.kind==='report'?'例行奏报':'有司细务')+'</span> '+esc(b.title)+'</summary><div class="chapter-detail"><p>'+esc(b.text)+'</p><small>'+esc(b.fromPost||b.from||'有司')+' · 第 '+(b.turn+1)+' 旬</small></div></details>').join('')+'</section>';
}
