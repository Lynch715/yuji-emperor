import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,assertState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {seedMemorials,resolveMemorial,pickMemorialist} from '../src/core/events.js';
import {IMPERIAL_AGENDA,imperialTemplates} from '../src/core/memorial-agenda.js';
import {routineOptions} from '../src/core/memorial-templates.js';
import {memorialCounts} from '../src/ui/memorial-state.js';
import {memorialListHTML,chapterHTML} from '../src/ui/render.js';
import {briefingsHTML} from '../src/ui/briefings.js';
import {createMemorialSession,memorialHTML} from '../src/ui/memorials.js';
import {memorialMessages} from '../src/llm/prompts.js';
import {createSaveStore,pack,unpack} from '../src/store/save.js';
import {requestTurnContent} from '../src/ui/turn-request.js';
const fresh=()=>createState({seed:'御前亲裁分级验收',demo:true,freedom:'free'});

test('平稳一年只按月呈御前大政，非月首不强塞小事',()=>{
 let s=fresh(),count=0;const seen=new Set();
 for(let turn=0;turn<36;turn++){
  s.turn=turn;s.memorials=[];s=seedMemorials(s);count+=s.memorials.length;
  assert.ok(s.memorials.length<=(turn===0?3:turn%3===0?2:0));
  for(const m of s.memorials){
   seen.add(m.templateId);assert.equal(m.agendaVersion,1);assert.ok(m.escalation.length>15);
   assert.match(m.text,/奉旨后/);assert.ok(m.text.includes(m.request));assert.ok(m.text.includes(m.escalation));
   assert.doesNotMatch(m.title,/灯油|修漏|借书|屋瓦|轮灌|秤尺|借官舍/);
   assert.equal(m.urgent,false);assert.deepEqual({...pickMemorialist(s,m.type,m.provinceId)},
    {from:m.from,fromId:m.fromId,fromPost:m.fromPost,fromRole:m.fromRole});
  }
 }
 assert.ok(count>=14&&count<=25,'全年御前大政 '+count);assert.ok(seen.size>=14);
});

test('灾情、缺粮与边患按真实门槛优先呈急折，普通小灾不升级',()=>{
 const s=fresh();s.turn=1;s.nation.provinces[0].disaster=5;
 assert.equal(seedMemorials(s).memorials.length,0);
 s.nation.provinces[0].disaster=45;let n=seedMemorials(s);
 assert.equal(n.memorials[0].templateId,'imperial-relief');assert.equal(n.memorials[0].provinceId,s.nation.provinces[0].id);
 assert.equal(n.memorials[0].urgent,true);assert.match(n.memorials[0].context,/45/);
 const grain=fresh();grain.turn=1;grain.nation.grain=0;
 n=seedMemorials(grain);assert.equal(n.memorials[0].templateId,'imperial-grain');assert.match(n.memorials[0].context,/粮储 0/);
 const border=fresh();border.turn=1;border.nation.army.frontiers[0].threat=70;
 n=seedMemorials(border);assert.equal(n.memorials[0].templateId,'imperial-border');assert.match(n.memorials[0].context,/70/);
 const full=seedMemorials(fresh());full.turn=3;let crowded=seedMemorials(full);crowded.turn=6;crowded=seedMemorials(crowded);
 assert.equal(crowded.memorials.length,6);crowded.turn=7;crowded.nation.provinces[0].disaster=45;
 assert.ok(seedMemorials(crowded).memorials.some(m=>m.templateId==='imperial-relief'),'急务不受平稳待批上限拦截');
});

test('同旬重入不重复呈折或简报，同题在办及全年冷却均不重发',()=>{
 const s=fresh(),n=seedMemorials(s);assert.deepEqual(seedMemorials(n),n);
 const ids=new Set(n.memorials.map(m=>m.templateId));n.turn=3;
 const next=seedMemorials(n),added=next.memorials.filter(m=>!n.memorials.some(old=>old.id===m.id));
 assert.ok(added.every(m=>!ids.has(m.templateId)));
 n.memorials=[];assert.ok(imperialTemplates(n,30).every(t=>!ids.has(t.id)));
 n.turn=36;assert.ok(imperialTemplates(n,30).some(t=>ids.has(t.id)));
});

test('例行奏报与细务只供备览，不改数值与骰、不入待批、不收逾期罚款',()=>{
 const s=fresh(),before=structuredClone(s),n=seedMemorials(s);
 assert.deepEqual(s,before);assert.equal(n.rng,s.rng);assert.deepEqual(n.nation,s.nation);assert.deepEqual(n.ledger,s.ledger);
 assert.equal(n.briefings.length,3);assert.equal(n.briefings.filter(b=>b.kind==='local').length,1);
 assert.ok(n.briefings.every(b=>!b.options&&!b.due&&!b.effects));
 assert.equal(memorialCounts(n).total,n.memorials.length);
 n.memorials=[];assert.deepEqual(memorialCounts(n),{pending:0,queued:0,total:0});
 assert.throws(()=>resolveMemorial(n,n.briefings[0].id),/不存在/);
 const withReports=forecastTurn(n);n.briefings=[];const withoutReports=forecastTurn(n);
 assert.deepEqual(withReports.entries,withoutReports.entries);assert.equal(withReports.die,withoutReports.die);
});

test('有司常报引用实际钱粮，不虚构灾情或已办大事',()=>{
 const s=fresh();s.nation.treasury=123.4;s.nation.grain=321.2;s.nation.arrears=17;
 const n=seedMemorials(s),text=n.briefings.map(b=>b.text).join('');
 assert.match(text,/123.4 万两/);assert.match(text,/321.2 万石/);assert.match(text,/17 万两/);
 assert.ok(n.briefings.every(b=>b.fromId&&s.court.officials.some(o=>o.id===b.fromId&&o.alive)));
 const pending=n.memorials.map(m=>m.id);assert.ok(n.briefings.every(b=>!pending.includes(b.id)));
});

test('平稳待批不超过六本，真实事件不被裁去，简报长期限制在72条',()=>{
 let s=fresh();s.memorials=[{id:'real-event',type:'事件',due:999,options:[],text:''}];
 for(let i=0;i<120;i++){s.turn=i;s=seedMemorials(s);}
 assert.ok(s.memorials.some(m=>m.id==='real-event'));
 assert.ok(s.memorials.filter(m=>m.agendaVersion===1).length<=6);assert.equal(s.briefings.length,72);
 assert.equal(new Set(s.briefings.map(b=>b.id)).size,72);assertState(s);
});

test('每道新策都有不同代价，正文及真实接口强调请裁缘由',()=>{
 const s=fresh(),z=s.nation.provinces[0];
 for(const t of IMPERIAL_AGENDA){
  const options=routineOptions(t,z,s,'o0').filter(o=>o.id!=='hold');
  assert.ok(options.length>=2);assert.equal(new Set(options.map(o=>JSON.stringify(o.effects))).size,options.length);
  for(const o of options){assert.ok(o.label&&o.consequence);assert.ok(Object.keys(o.effects).length);}
 }
 const n=seedMemorials(s),prompt=JSON.stringify(memorialMessages(n,n.memorials));
 assert.match(prompt,/为何需要皇帝裁决/);for(const m of n.memorials){assert.ok(prompt.includes(m.escalation));assert.ok(prompt.includes(m.context));}
 const session=createMemorialSession(n,'批折','午');assert.match(memorialHTML(n,session),/御前亲裁/);
 const personnel=imperialTemplates(s,30).find(t=>t.type==='铨选');assert.ok(personnel);
 const author=pickMemorialist(s,personnel.type,personnel.provinceId);assert.equal(author.fromPost,'吏部尚书');
});

test('手机奏报列表也可阅读常报，小事不带拟批按钮，所有正文均转义',()=>{
 const n=initialTurn(fresh()),before=structuredClone(n),html=memorialListHTML(n);
 assert.match(html,/例行奏报与有司细务/);assert.match(html,/备览，无须拟批/);
 const report=briefingsHTML([{...n.briefings[0],title:'<img src=x>',text:'<script>bad</script>'}]);
 assert.doesNotMatch(report,/<img|<script|data-memorial|data-review/);assert.match(report,/&lt;img/);assert.match(report,/&lt;script/);
 assert.deepEqual(n,before);
});

test('常报随本旬起居注留档、封卷与JSON往返保存，重复提交不重复入档',()=>{
 let s=fresh();s=initialTurn(s);
 for(let i=0;i<40;i++){const f=forecastTurn(s),n=commitTurn(s,f,{});assert.deepEqual(commitTurn(n,f,{}),n);s=n;}
 const chapters=[...s.volumes.flatMap(v=>v.chapters),...s.history],reportChapter=chapters.find(h=>h.briefings?.length);
 assert.ok(s.volumes.length);assert.equal(chapters.filter(h=>h.briefings?.length).length,13);
 assert.match(chapterHTML(reportChapter),/例行奏报与有司细务/);assert.deepEqual(migrate(unpack(pack(s)).state),s);
});

test('v22已收到的旧小折继续按原文原选项办理，待续原样且只提交一次',()=>{
 const old=fresh();old.v=22;delete old.briefings;
 let s=initialTurn(old);const original=JSON.stringify(s.memorials),f=forecastTurn(s);
 s.pending={forecast:f};const frozen=JSON.stringify(f),next=migrate(s);
 assert.equal(next.v,VERSION);assert.deepEqual(next.briefings,[]);assert.equal(JSON.stringify(next.memorials),original);
 assert.equal(JSON.stringify(next.pending.forecast),frozen);
 const done=commitTurn(next,next.pending.forecast,{});assert.equal(done.rng,f.state.rng);assert.equal(done.lastTurn.die,f.die);
 assert.equal(done.v,VERSION);assert.deepEqual(done.briefings,[]);assert.deepEqual(commitTurn(done,f,{}),done);
});

test('v1至v7历史待续保持原骰与原结算，v23损坏常报进入只读保护且不覆盖',async()=>{
 for(let v=1;v<=7;v++){
  const old=JSON.parse(readFileSync(`test/fixtures/v${Math.max(4,v)}-pending.json`));old.v=v;old.pending.forecast.state.v=v;
  const raw=JSON.stringify(old.pending.forecast),n=migrate(old);assert.deepEqual(n.briefings,[]);assert.equal(JSON.stringify(n.pending.forecast),raw);
  const done=commitTurn(n,n.pending.forecast,{});assert.equal(done.rng,old.pending.forecast.state.rng);
 }
 const bad=initialTurn(fresh());bad.briefings[0].kind='approve';const raw=pack(bad);let writes=0;
 const store=createSaveStore({validate:migrate,primary:{get:async()=>raw,put:async()=>writes++},backup:{getItem:()=>null}});
 assert.equal((await store.load(1)).readOnly,true);await assert.rejects(()=>store.save(1,fresh()),/保护/);assert.equal(writes,0);
});

test('真实平稳旬只有正文请求，常报和细务不额外调用模型',async()=>{
 const s=initialTurn(fresh()),f=forecastTurn(s);assert.equal(f.newMemorials.length,0);
 let calls=0;
 await requestTurnContent({key:'test',base:'https://hierarchy.test',model:'test'},s,f,{fetcher:async(url,o)=>{
  calls++;assert.doesNotMatch(JSON.parse(o.body).messages[0].content,/奏折正文任务/);
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({chapter:{朝:'晨光照入殿中。',午:'午后廊下风静。',夜:'夜色渐深。'}})}}]}),{headers:{'Content-Type':'application/json'}});
 }});
 assert.equal(calls,1);
});
