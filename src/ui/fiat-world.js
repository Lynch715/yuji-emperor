import {esc} from './common.js';
export function fiatWorldHTML(s){
 const f=s?.fiat;if(!f||!f.objects.length&&!f.rules.length)return '';
 const text=v=>typeof v==='boolean'?(v?'是':'否'):String(v);
 const objects=f.objects.map(o=>'<article class="card"><h4>'+esc(o.name)+'</h4><p>'+esc(o.description)+'</p>'+Object.entries(o.values||{}).map(([k,v])=>'<p>'+esc(k)+'：'+esc(text(v))+'</p>').join('')+'</article>').join('');
 const rules=f.rules.map(r=>'<article class="card"><h4>'+esc(r.name)+'</h4><p>'+esc(r.description)+'</p><small>'+ (r.period==='eachTurn'?(s.settings.freedom==='free'?'每旬执行':'切回言出法随后继续每旬执行'):'已颁行')+'</small></article>').join('');
 return '<section class="section-spacer"><h3>御旨改定的天下</h3><p class="muted">你创造的事物与制度随本卷保存。可继续下旨修改或撤销。</p><div class="grid">'+objects+rules+'</div></section>';
}
