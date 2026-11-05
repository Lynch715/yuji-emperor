import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {memorialArchive,memorialReviewDate} from '../src/core/memorial-records.js';
import {delegateSchedule} from '../src/ui/view-model.js';
import {filterMemorialArchive,memorialArchiveListHTML,memorialArchiveDetailHTML} from '../src/ui/memorial-archive.js';
import {wrapMemorialText,memorialImageLayout} from '../src/ui/memorial-image.js';
import {createSaveStore,pack,unpack} from '../src/store/save.js';
import {storedLayout} from '../src/store/layout.js';
const fresh=()=>initialTurn(createState({seed:'御批档案',freedom:'free',prose:'modern'}));
const schedule=(s,option='approve',remark='勤勉可嘉。')=>({朝:{kind:'批折',memorials:[s.memorials[0].id],decisions:{[s.memorials[0].id]:{option,remark}}}});
const settle=(s,option,remark)=>commitTurn(s,forecastTurn(s,schedule(s,option,remark)),{});
test('亲批档案只随正式提交生成，保留原文、处置和朱批，重复提交不重复收录',()=>{
 const s=fresh(),before=structuredClone(s),m=structuredClone(s.memorials[0]),f=forecastTurn(s,schedule(s));
 assert.deepEqual(s,before);assert.equal(memorialArchive(s).length,0);assert.equal(f.state.history,undefined);
 const n=commitTurn(s,f,{memorialTexts:[{id:m.id,text:'不可覆盖已批原文'}]}),r=memorialArchive(n)[0];
 assert.equal(r.text,m.text);assert.equal(r.from,m.from);assert.equal(r.title,m.title);assert.equal(r.remark,'勤勉可嘉。');
 assert.equal(r.decision,m.options.find(o=>o.id==='approve').label);assert.equal(r.emperor,s.emperor.name);assert.deepEqual(r.era,s.era);
 assert.equal(n.rng,f.state.rng);assert.equal(n.nation.treasury,f.state.nation.treasury);assert.deepEqual(commitTurn(n,f,{}),n);
 assert.deepEqual(s,before);assert.equal(unpack(pack(n)).state.history.at(-1).memorialReviews[0].text,m.text);
});
test('留中、再议、只作朱批照样留底，同一折下旬再批保留两次记录',()=>{
 for(const option of ['hold','discuss','remark']){
  const s=fresh(),id=s.memorials[0].id,n=settle(s,option,'此折再议，勿误民生。');
  assert.ok(n.memorials.some(m=>m.id===id));assert.equal(memorialArchive(n).length,1);
  n.memorials.sort((a,b)=>Number(b.id===id)-Number(a.id===id));const next=settle(n,'approve','准奏。');
  const rows=memorialArchive(next).filter(r=>r.memorialId===id);assert.equal(rows.length,2);assert.equal(rows[0].remark,'准奏。');
 }
});
test('逐本不同朱批与旧统一朱批均保留，内阁委政和权臣代批不冒充亲批',()=>{
 const s=fresh(),ms=s.memorials.slice(0,2),decisions=Object.fromEntries(ms.map((m,i)=>[m.id,{option:'approve',remark:'第'+i+'折'}]));
 const n=commitTurn(s,forecastTurn(s,{朝:{kind:'批折',memorials:ms.map(m=>m.id),decisions}}),{});
 assert.deepEqual(new Set(memorialArchive(n).map(r=>r.remark)),new Set(['第0折','第1折']));
 const old=commitTurn(s,forecastTurn(s,{朝:{kind:'批折',memorials:[ms[0].id],decision:'approve',remark:'旧式批语'}}),{});
 assert.equal(memorialArchive(old)[0].remark,'旧式批语');
 const plan=delegateSchedule(s);assert.ok(plan.schedule);assert.equal(memorialArchive(commitTurn(s,forecastTurn(s,plan.schedule),{})).length,0);
 assert.equal(memorialArchive(commitTurn(s,forecastTurn(s),{})).length,0);
});
test('v13待续不改原骰与预演，提交后收录；旧已结案原文不补编',()=>{
 const s=fresh();s.v=13;const f=forecastTurn(s,schedule(s));f.state.v=13;s.pending={forecast:f};
 const raw=JSON.stringify(f),n=migrate(s);assert.equal(n.v,VERSION);assert.equal(JSON.stringify(n.pending.forecast),raw);
 const done=commitTurn(n,n.pending.forecast,{});assert.equal(memorialArchive(done).length,1);assert.equal(done.rng,f.state.rng);
 const h={id:'old',turn:1,era:s.era,entries:[{source:'处置奏报：旧折 / 准奏'},{source:'处置奏报：旧折 / 准奏'},{source:'沈守正代批：别折 / 准奏'}],
  settlement:{slotResults:{朝:['旧折 · 准奏 · 朱批「勤勉可嘉」','留中旧折 · 留中 · 朱批「再议」'],午:[],夜:[]}}};
 n.history=[h];const before=structuredClone(n),rows=memorialArchive(n);assert.equal(rows.length,2);assert.equal(rows.find(r=>r.title==='旧折').remark,'勤勉可嘉');
 assert.ok(rows.every(r=>r.legacy&&r.text===''));assert.deepEqual(n,before);assert.match(memorialArchiveDetailHTML(rows[0]),/未留存奏折全文/);
});
test('分卷与完整JSON留存全部档案，保存重读及两个槽位互不混淆',async()=>{
 let s=fresh();s.court.officials.forEach(o=>o.ambition=0);s.memorials[0].due=999;const id=s.memorials[0].id;
 for(let i=0;i<40;i++){
  s.memorials.sort((a,b)=>Number(b.id===id)-Number(a.id===id));s=settle(s,'hold','第'+i+'次批示');
 }
 assert.ok(s.volumes.length);assert.equal(memorialArchive(s).length,40);
 const p=new Map(),v=new Map(),b=new Map(),store=createSaveStore({validate:migrate,
  primary:{get:async k=>p.get(k),put:async(k,x)=>p.set(k,structuredClone(x)),appendVolume:async(k,x)=>v.set(k,structuredClone(x)),getVolume:async k=>v.get(k)},
  backup:{getItem:k=>b.get(k),setItem:(k,x)=>b.set(k,x)}});
 await store.save(1,s);await store.save(2,fresh());
 const loaded=await store.load(1);assert.equal(loaded.readOnly,false);assert.deepEqual(memorialArchive(loaded.state),memorialArchive(s));
 assert.equal(memorialArchive((await store.load(2)).state).length,0);
 assert.deepEqual(memorialArchive(unpack(store.exportJSON(loaded.state)).state),memorialArchive(s));
});
test('档案损坏进入读档保护；旧历史及待续不被迁移篡改',async()=>{
 const s=settle(fresh());const before=structuredClone(s);migrate(s);assert.deepEqual(s,before);
 for(const change of [r=>r.remark=1,r=>r.text=null,r=>r.turn++,r=>r.era.month=13]){
  const bad=structuredClone(s);change(bad.history[0].memorialReviews[0]);assert.throws(()=>migrate(bad),/御批档案/);
 }
 const bad=structuredClone(s);bad.history[0].memorialReviews.push(structuredClone(bad.history[0].memorialReviews[0]));
 const raw=pack(bad),store=createSaveStore({validate:migrate,primary:{get:async()=>raw},backup:{getItem:()=>null}});
 assert.equal((await store.load(1)).readOnly,true);
});
test('历史分卷校验和正确但档案结构损坏时也进入保护，不改写原卷',async()=>{
 const s=settle(fresh()),h=s.history[0];h.memorialReviews[0].remark=99;
 s.history=[];s.volumes=[{from:h.turn,to:h.turn,chapters:[h],summary:'历史'}];
 const layout=storedLayout(s),raw=pack(layout.main),old=JSON.stringify(layout.volumes);
 const store=createSaveStore({validate:migrate,primary:{get:async()=>raw,getVolume:async k=>layout.volumes.find(v=>v.key===k).value},backup:{getItem:()=>null}});
 const loaded=await store.load(1);assert.equal(loaded.readOnly,true);assert.equal(JSON.stringify(layout.volumes),old);
});
test('档案可按关键词、类型和有无朱批筛选，列表分页且原文与批语安全转义',()=>{
 const s=settle(fresh(),'approve','<img src=x onerror=alert(1)>'),r=memorialArchive(s)[0],rows=Array.from({length:45},(_,i)=>({...r,id:'r'+i,remark:i?'':'特别批语'}));
 assert.equal(filterMemorialArchive(rows,'特别',r.type,true).length,1);assert.equal(filterMemorialArchive(rows,'','不存在').length,0);
 assert.equal((memorialArchiveListHTML(rows,1).match(/data-archive-record=/g)||[]).length,20);
 assert.equal((memorialArchiveListHTML(rows,2).match(/data-archive-record=/g)||[]).length,5);
 assert.doesNotMatch(memorialArchiveDetailHTML(r),/<img src=x/);assert.match(memorialArchiveDetailHTML(r),/&lt;img/);
 assert.equal(memorialReviewDate(r),r.era.name+'1年1月上旬');
});
test('分享图排版完整保存中英文、换行与长标题，超长全文分图不裁字',()=>{
 const text='朱批ABC😀\n第二段。',measure=t=>Array.from(t).length*20;
 assert.equal(wrapMemorialText(text,60,measure).join('').replaceAll('\n',''),text.replaceAll('\n',''));
 const chinese=wrapMemorialText('甲乙丙，丁戊己。庚辛壬（癸子）。',60,measure);
 assert.ok(chinese.every(t=>!(/^[，。；！？、）》」』】]/.test(t)||/[（《「『【]$/.test(t))));
 const r=memorialArchive(settle(fresh()))[0],base=memorialImageLayout(r,(t,size)=>Array.from(t).length*size);
 assert.equal(base.length,1);assert.ok(base[0].height>=1280);
 const long={...r,title:'长标题'.repeat(80),text:'奏文逐字保留。'.repeat(2000),remark:'百姓生计，务须照管。'.repeat(8)};
 const pages=memorialImageLayout(long,(t,size)=>Array.from(t).length*size);assert.ok(pages.length>1);
 for(const p of pages){assert.ok(p.height<=7600);assert.ok(p.runs.every(r=>r.y<p.height-100&&Array.from(r.text).length*r.size<=912));}
 const printed=pages.flatMap(p=>p.runs.map(r=>r.text)).join('');assert.ok(printed.includes(long.title));assert.ok(printed.includes(long.text));assert.ok(printed.includes(long.remark));
});
