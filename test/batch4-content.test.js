import {INDUSTRIES,techEffects} from '../src/core/tech-rules.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn} from '../src/core/turn.js';
import {nationMonth,nationQuarter,nationYear} from '../src/core/nation.js';
import {grainBudget,quarterlyGrain} from '../src/core/finance.js';
import {simulate} from '../scripts/simulate.mjs';

const start=()=>initialTurn(createState({seed:'audit3'}));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≠ ${b}`);

test('C2 audit3先急件准奏30年粮储受收支和年损耗约束，连灾减产且超仓年霉变三成',()=>{
 let s=start();s.nation.grain=0;s.nation.provinces.forEach(p=>p.disaster=0);
 const militaryQuarter=grainBudget(s).military*3,harvest=nationQuarter(s).nation.grain;
 assert.ok(harvest>=militaryQuarter*1.2&&harvest<=militaryQuarter*1.5,`季粮/季军粮=${harvest/militaryQuarter}`);
 s.nation.provinces.forEach(p=>p.disaster=80);
 close(nationQuarter(s).nation.grain,harvest*0.2);
 const capacity=grainBudget(s).storageCapacity;s.nation.grain=capacity+100;
 close(nationYear(s).nation.grain,capacity+70);
 let normal=start(),disaster=start();const initial=disaster.nation.grain;
 for(let month=1;month<=24;month++){
  normal.nation.provinces.forEach(p=>p.disaster=0);disaster.nation.provinces.forEach(p=>p.disaster=80);
  normal=nationMonth(normal);disaster=nationMonth(disaster);
  if(month%3===0){normal=nationQuarter(normal);disaster=nationQuarter(disaster);}
  if(month%12===0){normal=nationYear(normal);disaster=nationYear(disaster);}
 }
 assert.ok(disaster.nation.grain<initial*0.5&&disaster.nation.grain<normal.nation.grain*0.5);
 let live=start(),maxCapacity=grainBudget(live).storageCapacity,maxAnnualHarvest=quarterlyGrain(live)*4;
 for(let turn=0;turn<30*36;turn++){
  live.history=[];live.volumes=[];live.ledger=[];
  const before=live,f=forecastTurn(live,makeSimulationSchedule(live,()=>0,'greedy'));
  // 年损耗只作用于超仓粮；仓容随军队、灾情变化，不能把当前仓容当硬上限。
  maxCapacity=Math.max(maxCapacity,grainBudget(before).storageCapacity,grainBudget(f.state).storageCapacity);
  const annualHarvest=s=>4*(quarterlyGrain(s)+s.nation.provinces.reduce((n,p)=>n+(p.industries||[]).reduce((n,i)=>n+(INDUSTRIES[i.type].grain||0)*i.level*(1+(techEffects(s).production||0)),0),0));
  maxAnnualHarvest=Math.max(maxAnnualHarvest,annualHarvest(before),annualHarvest(f.state));
  const bound=maxCapacity+maxAnnualHarvest/0.3;
  for(const e of f.entries.filter(e=>e.path==='nation.grain')){
   assert.ok(e.after>=0&&Math.max(e.before,e.after)<=bound+1e-7,`粮储${e.after}超过收支界限${bound}`);
   if(e.after>e.before)assert.match(e.source,/^季结：(赋税实收 .* 与新粮入仓|.*屯田／圩田产出)$/);
  }
  assert.ok(Number.isFinite(f.state.nation.grain)&&f.state.nation.grain>=0&&f.state.nation.grain<=bound);
  live=commitTurn(live,f,{});assert.equal(live.ending,null);
 }
 assert.equal(live.turn,1080);
});

import {seedMemorials,pickMemorialist} from '../src/core/events.js';
import {readFileSync} from 'node:fs';
test('D1 新御前议题覆盖国势与制度，50年标题至少二十五种且无灾不请赈',()=>{
 const templates=readFileSync(new URL('../src/core/memorial-templates.js',import.meta.url),'utf8');assert.ok(templates);
 const titles=new Set(),kinds=new Set();let s=start();
 for(let turn=0;turn<50*36;turn++){
  s.turn=turn;s.memorials=[];
  // Include both healthy and distressed years, rather than claiming coverage
  // through province-name variations of six stock titles.
  s.nation.treasury=turn%2?5:480;s.nation.arrears=turn%2?20:0;
  s.nation.provinces.forEach((p,i)=>p.disaster=turn%2&&i===0?30:0);
  s.nation.army.frontiers[0].threat=turn%2?80:20;
  s=seedMemorials(s);
  for(const m of s.memorials){titles.add(m.title);kinds.add(m.templateId);
   assert.ok(m.options.length>=2&&m.options.length<=4);
   if(m.type==='请赈')assert.ok(s.nation.provinces.find(p=>p.id===m.provinceId).disaster>0);
   assert.deepEqual({from:m.from,fromId:m.fromId,fromPost:m.fromPost,fromRole:m.fromRole},pickMemorialist(s,m.type,m.provinceId));
  }
 }
 assert.ok(titles.size>=25,`标题${titles.size}`);assert.ok(kinds.size>=18,`模板${kinds.size}`);
});

import {mockNarrative} from '../src/llm/validate.js';
import {forecastTurn} from '../src/core/turn.js';
test('D2 试读随回合季节场景与结算组句，固定回合可重试且不编数字硬结果',()=>{
 const f=forecastTurn(start());const before=JSON.stringify(f),seen=new Set();
 for(let i=0;i<80;i++){
  const fixture={...f,turnId:'mock:'+i,schedule:{朝:{kind:'上朝'},午:{kind:'外交'},夜:{kind:'后宫'}}};
  const n=mockNarrative(fixture);assert.deepEqual(mockNarrative(fixture),n);seen.add(JSON.stringify(n.chapter));
  for(const paragraph of Object.values(n.chapter)){
   const sentences=paragraph.match(/[^。！？]+[。！？]/g)||[];assert.ok(sentences.length>=2&&sentences.length<=4);
   assert.doesNotMatch(paragraph,/[0-9０-９零〇一二三四五六七八九十百千万亿]|拨银|受孕|身孕|诞下|晋位|驾崩|战胜|战败|已竣工/);
  }
 }
 assert.ok(seen.size>=25,`正文变化仅${seen.size}`);assert.equal(JSON.stringify(f),before);
 for(const kind of ['上朝','批折','下旨','后宫','外交','出巡','歇息']){
  const a={...f,schedule:{朝:{kind}},slotResults:{朝:['照办']},facts:[{kind:'execution',slot:'朝',label:'照办'}]};
  const b={...a,slotResults:{朝:['封驳']},facts:[{kind:'execution',slot:'朝',label:'封驳'}]};
  assert.notEqual(mockNarrative(a).chapter.朝,mockNarrative(b).chapter.朝,kind);
 }
 const summer={...f,state:{...f.state,era:{...f.state.era,month:6}}};
 assert.notEqual(mockNarrative(f).chapter.朝,mockNarrative(summer).chapter.朝);
});

import {migrate,VERSION} from '../src/core/state.js';
import {resolveMemorial} from '../src/core/events.js';
import {commitTurn} from '../src/core/turn.js';
import {createMemorialSession,memorialAction,memorialHTML} from '../src/ui/memorials.js';
import {classifyMessages} from '../src/llm/prompts.js';
function remarkState(){const s=start(),authors=s.court.officials.filter(o=>o.alive&&o.post).slice(0,2);s.memorials=authors.map((o,i)=>({id:'remark-'+i,from:'错误同名',fromId:o.id,title:'查册'+i,type:'政务',options:[{id:'approve',label:'准奏',effects:{treasury:-2}},{id:'reject',label:'驳回',effects:{}}],due:s.turn+5}));return {s,authors};}
test('D3 每本独立准驳朱批按fromId落账，正则保留责成并识别不必嘉奖等否定',()=>{
 const {s,authors}=remarkState(),[a,b]=s.memorials,old=s.court.officials.map(o=>o.favor);
 const schedule={朝:{kind:'上朝',memorials:[a.id,b.id],decisions:{[a.id]:{option:'approve',remark:'勤勉可嘉'},[b.id]:{option:'reject',remark:'严加申饬'}}}};
 const f=forecastTurn(s,schedule),n=commitTurn(s,f,{});
 close(n.court.officials.find(o=>o.id===authors[0].id).favor,authors[0].favor+2);
 close(n.court.officials.find(o=>o.id===authors[1].id).favor,authors[1].favor-3);
 assert.ok(!n.memorials.some(m=>[a.id,b.id].includes(m.id)));assert.deepEqual(commitTurn(n,f,{}),n);assert.deepEqual(s.court.officials.map(o=>o.favor),old);
 for(const text of ['责成户部核实','不必嘉奖','不要申饬，责成查明','勿以有功嘉奖','不可斥责']){
  const r=resolveMemorial(s,a.id,'remark',text).state;assert.equal(r.court.officials.find(o=>o.id===authors[0].id).favor,authors[0].favor,text);
 }
 for(const [text,delta]of [['勤勉可嘉',2],['严加申饬',-3]])close(resolveMemorial(s,a.id,'remark',text).state.court.officials.find(o=>o.id===authors[0].id).favor,authors[0].favor+delta);
});
test('D3 编辑逐本朱批互不串折，旧字符串共用朱批转成对象而显式空批保持为空',()=>{
 const {s}=remarkState(),ids=s.memorials.map(m=>m.id);s.schedule.朝={kind:'上朝',memorials:ids,decisions:{[ids[0]]:'approve',[ids[1]]:{option:'reject',remark:''}},remark:'旧共用朱批'};
 const session=createMemorialSession(s,'上朝','朝');
 assert.equal(session.remarks[ids[0]],'旧共用朱批');assert.equal(session.remarks[ids[1]],'');
 session.remarks[ids[0]]='勤勉可嘉';session.remarks[ids[1]]='责成查明';
 const action=memorialAction(s,session);assert.deepEqual(action.decisions[ids[0]],{option:'approve',remark:'勤勉可嘉'});assert.deepEqual(action.decisions[ids[1]],{option:'reject',remark:'责成查明'});
 const reopened=createMemorialSession({...s,schedule:{...s.schedule,朝:action}},'上朝','朝');assert.deepEqual(reopened.remarks,session.remarks);
 assert.match(memorialHTML(s,reopened),/御笔朱批（本折）/);assert.doesNotMatch(memorialHTML(s,reopened),/本次共用/);
});
test('D3 v1至v6共用朱批迁移到v7，v4/v5/v6已存预演不重算不重掷',()=>{
 assert.ok(VERSION>=8);
 for(let v=1;v<=6;v++){const {s}=remarkState();s.v=v;const id=s.memorials[0].id;s.schedule.朝={kind:'上朝',memorials:[id],decision:'remark',remark:'旧共用'};const n=migrate(s);assert.equal(n.v,VERSION);assert.deepEqual(n.schedule.朝.decisions[id],{option:'remark',remark:'旧共用'});}
 for(const v of [4,5,6]){
  const s=JSON.parse(readFileSync(new URL(`./fixtures/v${v}-pending.json`,import.meta.url),'utf8'));
  const forecast=s.pending.forecast,raw=JSON.stringify(forecast),n=migrate(s);
  assert.equal(JSON.stringify(n.pending.forecast),raw);const committed=commitTurn(n,n.pending.forecast,{});
  assert.equal(committed.v,VERSION);assert.equal(committed.lastTurn.die,forecast.die);assert.equal(committed.rng,forecast.state.rng);
  for(const key of ['treasury','grain','privy','morale','governance'])assert.equal(committed.nation[key],forecast.state.nation[key]);
 }
});
test('D3 朱批接口只分类嘉奖申饬附旨无，不复用口谕大分类',()=>{
 const p=classifyMessages('责成核查','remark');assert.match(p[0].content,/嘉奖.*申饬.*附旨.*无/);assert.doesNotMatch(p[0].content,/edictType/);
});

import {classifyMemorialSchedule} from '../src/llm/remark-classifier.js';
test('D3 逐本朱批不再请求，采用本地分类与合并意图返回的类别',()=>{
 const {s}=remarkState(),ids=s.memorials.map(m=>m.id),schedule={朝:{kind:'上朝',memorials:ids,decisions:{[ids[0]]:{option:'approve',remark:'好'},[ids[1]]:{option:'reject',remark:'申饬'}}}};
 const original=JSON.stringify(schedule),classified=classifyMemorialSchedule(schedule,[{inputId:'朝:remark:'+ids[0],remarkKind:'嘉奖',effects:{treasury:99999}}]);
 assert.deepEqual(classified.朝.decisions[ids[0]],{option:'approve',remark:'好',remarkKind:'嘉奖'});assert.equal(classified.朝.decisions[ids[1]].remarkKind,'申饬');assert.equal(JSON.stringify(schedule),original);
 const fallback=classifyMemorialSchedule(schedule,[{inputId:'朝:remark:'+ids[0],remarkKind:'越权'}]);assert.equal(fallback.朝.decisions[ids[0]].remarkKind,undefined);
 const n=forecastTurn(s,classified).state;close(n.court.officials.find(o=>o.id===s.memorials[0].fromId).favor,s.court.officials.find(o=>o.id===s.memorials[0].fromId).favor+2);
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');assert.match(app,/if \(!state.pending\) \{[\s\S]*?requestScheduleIntents[\s\S]*?forecastTurn/);
});

import {sealChronicle} from '../src/core/chronicles.js';
test('D4 同朝同档连续封卷谥号庙号不重复，跨朝独立且重封幂等',()=>{
 let s=start();s.ending={type:'驾崩',cause:'测试寿终'};const post=new Set(),temple=new Set();
 for(let i=0;i<24;i++){
  s.reign.number=i+1;s=sealChronicle(s);const r=s.chronicles.at(-1);
  assert.ok(!post.has(r.posthumous),r.posthumous);assert.ok(!temple.has(r.templeName),r.templeName);post.add(r.posthumous);temple.add(r.templeName);
  assert.equal(sealChronicle(s).chronicles.length,s.chronicles.length);
 }
 const fresh=start();fresh.runId='other-dynasty';fresh.chronicles=s.chronicles;fresh.ending={type:'驾崩',cause:'测试寿终'};const r=sealChronicle(fresh).chronicles.at(-1);
 assert.equal(r.posthumous,s.chronicles[0].posthumous);assert.equal(r.templeName,s.chronicles[0].templeName);
});

test('D5 本纪五段由本朝台账生成，年度取最大事件补叙且没有循环段落',()=>{
 let s=start();s.turn=108;s.reign.accessionTurn=36;s.reign.initialStats={petitions:10,edicts:2,warsWon:1,appointments:3,banquets:1};
 s.stats.petitions=17;s.stats.edicts=4;s.stats.warsWon=2;s.stats.appointments=5;s.stats.banquets=2;s.ending={type:'驾崩',cause:'寿终于寝殿'};
 s.history=[{turn:12,summary:'先帝旧案不可混入',entries:[{delta:999}]},{turn:40,summary:'轻微案牍',entries:[{delta:0.1}]},{turn:43,summary:'黄河大工竣事',entries:[{delta:-60}]},{turn:80,summary:'北境军报入档',entries:[{delta:-20}]}];
 const n=sealChronicle(s),r=n.chronicles.at(-1),parts=r.biography.split(/\n\n/);
 assert.equal(parts.length,5);['践祚','施政','边事','后宫','终局'].forEach((label,i)=>assert.ok(parts[i].startsWith(label+'：')));
 assert.match(r.biography,/处置奏报7本/);assert.match(r.biography,/年度纪事：第1年，黄河大工竣事/);assert.doesNotMatch(r.biography,/先帝旧案不可混入|轻微案牍/);
 assert.ok((r.biography.match(/[\u3400-\u9fff]/g)||[]).length>=500);assert.ok(r.biography.length<=800);
 assert.equal(new Set(parts).size,5);
 const sentences=r.biography.match(/[^。！？\n]+[。！？]/g)||[];assert.equal(new Set(sentences).size,sentences.length);
});

import {makeSimulationSchedule} from '../scripts/simulate.mjs';
import {scheduleEstimate} from '../src/ui/view-model.js';
test('C2 缺粮时模拟策略不下发付不起粮款的赈灾旨',()=>{
 const s=start();s.nation.grain=0;const sequence=[4,1,0];let i=0;
 const schedule=makeSimulationSchedule(s,n=>sequence[i++]%n,'diligent');
 assert.notEqual(schedule.午?.edictType,'赈灾');assert.doesNotThrow(()=>forecastTurn(s,schedule));
});
test('D3 对象式驳回的日程钱粮估算与旧字符串一致',()=>{
 const {s}=remarkState(),id=s.memorials[0].id;
 const old={...s,schedule:{朝:{kind:'上朝',memorials:[id],decisions:{[id]:'reject'}}}};
 const next={...s,schedule:{朝:{kind:'上朝',memorials:[id],decisions:{[id]:{option:'reject',remark:'责成查明'}}}}};
 assert.deepEqual(scheduleEstimate(next),scheduleEstimate(old));
});

test('D3 损坏的对象式决定进入保护，批语不接受数值或伪造分类',()=>{
 const {s}=remarkState(),id=s.memorials[0].id;
 for(const value of [{option:3,remark:'批语'},{option:'approve',remark:7},['approve'],{option:'approve',remark:'批语',remarkKind:'加银'}]){
  const n=structuredClone(s);n.schedule.朝={kind:'上朝',memorials:[id],decisions:{[id]:value}};
  assert.throws(()=>migrate(n),/朱批|决定/);assert.throws(()=>forecastTurn(n,n.schedule),/朱批|决定/);
 }
});


test('D1 实际先急件准奏50年御前大政标题至少二十五种',()=>{
 const titles=new Set(),templates=new Set();const r=simulate(50,'内容五十年',{strategy:'greedy',onForecast:(s,f)=>{for(const m of [...s.memorials,...f.newMemorials])if(m.templateId){titles.add(m.title);templates.add(m.templateId);}}});
 assert.equal(r.turns,1800);assert.ok(titles.size>=25,`标题${titles.size}`);assert.ok(templates.size>=16,`模板${templates.size}`);
});

test('D1 空仓核报粮缺，不请求翻晒搬运不存在的库存',()=>{
 let s=start();s.nation.grain=0;s.nation.grainArrears=20;s.nation.provinces.forEach(p=>p.disaster=0);
 const seen=new Set();for(let turn=0;turn<108;turn++){s.turn=turn;s.memorials=[];s=seedMemorials(s);for(const m of s.memorials.filter(m=>m.type==='仓储'||m.type==='漕运'||m.templateId==='imperial-grain')){assert.equal(m.templateId,'imperial-grain');assert.ok(m.options.every(o=>!(o.effects.grain<0)));assert.ok(m.options[0].effects.treasury<0);seen.add(m.templateId);}assert.equal(s.nation.grain,0);}
 assert.ok(seen.has('imperial-grain'));
});

test('D3 模拟器新决定也使用逐本对象，空批语的新旧写法结算完全一致',()=>{
 const s=start();
 for(const strategy of ['random','diligent','greedy']){
  const schedule=makeSimulationSchedule(s,()=>0,strategy);
  for(const d of Object.values(schedule.朝.decisions)){assert.equal(typeof d,'object');assert.equal(d.remark,'');}
  const legacy=structuredClone(schedule);for(const id of legacy.朝.memorials)legacy.朝.decisions[id]=legacy.朝.decisions[id].option;
  const a=forecastTurn(s,schedule),b=forecastTurn(s,legacy);assert.deepEqual(a.state,b.state);assert.deepEqual(a.entries,b.entries);assert.equal(a.die,b.die);
 }
});

test('D3 附旨和否定批语没有好感变化也逐本写入起居注',()=>{
 const {s}=remarkState(),ids=s.memorials.map(m=>m.id),schedule={朝:{kind:'上朝',memorials:ids,decisions:{[ids[0]]:{option:'approve',remark:'责成查明'},[ids[1]]:{option:'hold',remark:'不必嘉奖'}}}};
 const f=forecastTurn(s,schedule),n=commitTurn(s,f,{}),results=n.history.at(-1).settlement.slotResults.朝.join('；');
 assert.match(results,/责成查明/);assert.match(results,/不必嘉奖/);
 assert.equal(n.court.officials.find(o=>o.id===s.memorials[0].fromId).favor,s.court.officials.find(o=>o.id===s.memorials[0].fromId).favor);
 assert.deepEqual(migrate(n).history.at(-1).settlement.slotResults,n.history.at(-1).settlement.slotResults);
});
