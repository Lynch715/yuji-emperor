import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION,assertState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {TECHS,TECH_LINES,techEffects,seaOpen} from '../src/core/tech-rules.js';
import {configureResearch,researchMonth,researchQuote,researchBlock} from '../src/core/tech.js';
import {issueEdict,edictCost} from '../src/core/edicts.js';
import {localIntents,intentInputs,validateIntents,intentMessages} from '../src/llm/intents.js';
import {turnMessages} from '../src/llm/prompts.js';
import {validateTurn} from '../src/llm/validate.js';
import {intentActionKey} from '../src/core/intents.js';
import {pack,unpack,createSaveStore} from '../src/store/save.js';
const fresh=()=>initialTurn(createState({seed:'第二批格物',freedom:'free'}));
const start=(s=fresh(),id='farming',funding=5)=>configureResearch(s,{techId:id,funding,lead:'o1'}).state;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('18项技艺覆盖五条线，前置无环、费用时间有效且科技效果来自规则',()=>{
 assert.equal(TECHS.length,18);assert.deepEqual([...new Set(TECHS.map(t=>t.line))],TECH_LINES);
 const seen=new Set();for(const t of TECHS){assert.ok(t.cost>=60&&t.cost<=300);assert.ok(t.months>0);assert.ok(t.prereq.every(id=>seen.has(id)));seen.add(t.id);}
});
test('研究进度严格按主持能力、吏治与清议系数结算，不改输入或随机数',()=>{
 const s=start();s.court.officials[1].abilities.政=100;s.nation.governance=100;
 const before=structuredClone(s),q=researchQuote(s);near(q.factor,1.4);near(q.progress,7);
 const r=researchMonth(s);near(r.nation.treasury,s.nation.treasury-5);near(r.tech.current.progress,7);assert.equal(r.rng,s.rng);assert.deepEqual(s,before);
 s.court.officials[1].abilities.政=0;s.nation.governance=0;near(researchQuote(s).factor,0.36);
 const f=s.court.factions[0];f.power=60;f.attitude=20;near(researchQuote(s).factor,0.36*0.8);f.power=59;near(researchQuote(s).factor,0.36);
});
test('月经费上限20，国库不足按余银扣，研究不新增积欠',()=>{
 let s=start(fresh(),'farming',999);assert.equal(s.tech.funding,20);s.nation.treasury=3;
 const r=researchMonth(s);near(r.nation.treasury,0);near(r.tech.current.spent,3);assert.equal(r.nation.arrears,s.nation.arrears);near(r.stats.expense-s.stats.expense,3);
 assert.throws(()=>configureResearch(s,{funding:NaN}),/有效/);assert.throws(()=>configureResearch(s,{funding:-1}),/有效/);
});
test('暂停、主持离任和余额为零保留进度，不凭空推进或收款',()=>{
 const s=start();s.tech.current.progress=12;
 for(const kind of ['pause','dead','empty']){
  const copy=structuredClone(s);if(kind==='pause')copy.tech.funding=0;if(kind==='dead')copy.court.officials[1].alive=false;if(kind==='empty')copy.nation.treasury=0;
  const r=researchMonth(copy);assert.deepEqual(r.tech.current,copy.tech.current);assert.equal(r.nation.treasury,copy.nation.treasury);
 }
});
test('前置、开海、已研成与同时改换研究方向均由引擎检查',()=>{
 const s=fresh();assert.match(researchBlock(s,'rice'),/精耕细作/);assert.match(researchBlock(s,'ships'),/开海/);assert.ok(!seaOpen(s));
 s.projects.push({edictType:'开海',done:true});assert.equal(researchBlock(s,'ships'),'');
 s.tech.done=['farming'];assert.match(researchBlock(s,'farming'),/已经研成/);assert.equal(researchBlock(s,'rice'),'');
 const r=start(fresh());assert.throws(()=>configureResearch(r,{techId:'waterwheel',funding:20}),/在研/);
});
test('重申或更换主持不丢研究进度，主持必须真实在朝任职',()=>{
 const s=start();s.tech.current.progress=12;const r=configureResearch(s,{techId:'farming',funding:10,lead:'o6'}).state;
 assert.equal(r.tech.current.progress,12);assert.equal(r.tech.lead,'o6');assert.equal(r.stats.edicts,s.stats.edicts+1);assert.equal(configureResearch(r,{techId:'farming',funding:10,lead:'o6'}).state.stats.edicts,r.stats.edicts);assert.equal(r.nation.treasury,s.nation.treasury);
 assert.throws(()=>configureResearch(s,{lead:'fake',funding:5}),/主持/);s.court.officials[6].jailed=true;assert.throws(()=>configureResearch(s,{lead:'o6'}),/主持/);
});
test('进度达标仍须最短月数，完成效果仅一次且不能反复刷战备',()=>{
 let s=start();s.tech.current.progress=60;s.tech.current.elapsed=0;
 for(let i=0;i<2;i++){s=researchMonth(s);assert.ok(s.tech.current);}s=researchMonth(s);assert.equal(s.tech.current,null);assert.deepEqual(s.tech.done,['farming']);near(techEffects(s).grain,0.1);
 assert.deepEqual(researchMonth(s),s);
 const gun=fresh();gun.tech.done=['salt','iron'];s=start(gun,'firearms');s.tech.current.progress=180;s.tech.current.elapsed=8;
 const before=s.nation.army.capital.readiness;s=researchMonth(s);assert.equal(s.nation.army.capital.readiness,before+3);assert.deepEqual(researchMonth(s),s);
});
test('突破同时进入旬结算和工部报捷奏折，commit幂等且不重掷',()=>{
 const s=start();s.turn=2;s.revision=2;s.day=20;s.tech.current.progress=60;s.tech.current.elapsed=2;
 const f=forecastTurn(s),before=JSON.stringify(f);assert.ok(f.notes.some(n=>n.includes('格物突破：精耕细作')));assert.ok(f.newMemorials.some(m=>m.id.startsWith('tech-done-')));
 const n=commitTurn(s,f,{});assert.deepEqual(n.tech.done,['farming']);assert.equal(n.rng,f.state.rng);assert.deepEqual(commitTurn(n,f,{}),n);assert.equal(JSON.stringify(f),before);
});
test('旧v20迁移仅增加零值字段，原有全部数值、奏文、待续预演逐字段保留',()=>{
 const old=fresh();old.v=20;delete old.briefings;delete old.keju;delete old.tech;for(const p of old.nation.provinces){delete p.prosperity;delete p.industries;}
 const f=forecastTurn(fresh());f.state.v=20;delete f.state.tech;for(const p of f.state.nation.provinces){delete p.prosperity;delete p.industries;}
 old.pending={forecast:f};const before=structuredClone(old),bytes=JSON.stringify(f),next=migrate(unpack(pack(old)).state);
 assert.equal(next.v,VERSION);assert.deepEqual(next.tech,{funding:0,current:null,done:[],lead:null,custom:[]});assert.ok(next.nation.provinces.every(p=>p.prosperity===0&&p.industries.length===0));
 const projected=structuredClone(next);projected.v=20;delete projected.briefings;delete projected.keju;delete projected.tech;for(const p of projected.nation.provinces){delete p.prosperity;delete p.industries;}
 assert.deepEqual(projected,before);assert.equal(JSON.stringify(next.pending.forecast),bytes);assert.deepEqual(old,before);
 const committed=commitTurn(next,next.pending.forecast,{});assert.equal(committed.v,VERSION);assert.equal(committed.rng,f.state.rng);assert.deepEqual(committed.nation.provinces.map(p=>p.pop),f.state.nation.provinces.map(p=>p.pop));
});
test('格物、繁荣和产业损坏拒读并保护原始副本',async()=>{
 for(const corrupt of [s=>delete s.tech,s=>s.tech.funding=21,s=>s.tech.done=['fake'],s=>s.tech.current={id:'farming',progress:Infinity,elapsed:0,spent:0},s=>s.nation.provinces[0].prosperity=101,s=>s.nation.provinces[0].industries=[{type:'fake',level:1,builtTurn:0}]]){
  const s=fresh();corrupt(s);assert.throws(()=>migrate(s));const raw=pack(s),io={primary:{get:async()=>raw},backup:{getItem:()=>raw},validate:migrate};const loaded=await createSaveStore(io).load(1);assert.equal(loaded.readOnly,true);
 }
});
test('口谕拨五万两研新式水车映射allocate→tech，仅月结真实扣款',()=>{
 const s=fresh();s.settings.freedom='mid';s.emperor.talents.权谋=100;const schedule={朝:{kind:'下旨',text:'拨五万两研新式水车'}},inputs=intentInputs(schedule),actions=localIntents(s,inputs);
 assert.equal(actions.length,1);assert.equal(actions[0].destination,'tech');assert.equal(actions[0].techId,'waterwheel');assert.equal(actions[0].amount,5);
 const f=forecastTurn(s,schedule,actions);assert.equal(f.state.tech.funding,5);assert.equal(f.state.tech.current.id,'waterwheel');assert.equal(f.entries.filter(e=>e.path==='nation.treasury'&&/格物/.test(e.source)).length,0);
 const content=JSON.stringify(intentMessages(s,inputs));assert.match(content,/destination/);assert.match(content,/techId/);assert.ok(!content.includes('炉温准式'),'意图请求仅发送当前涉及的技艺名册');
 const model=validateIntents({actions:[{inputId:'朝',type:'allocate',destination:'tech',amount:5000,techId:'waterwheel',effects:{treasury:99999}}]},s,inputs);
 const predicted=forecastTurn(s,schedule,model);assert.equal(predicted.state.tech.funding,20);assert.equal(predicted.state.tech.done.length,0);
});
test('只有最高自由度可命名树外发明，映射一次既有技艺而非无限叠加效果',()=>{
 const s=fresh(),schedule={朝:{kind:'下旨',text:'拨五万两研究飞天机'}},a=localIntents(s,intentInputs(schedule)),f=forecastTurn(s,schedule,a);
 assert.equal(f.state.tech.current.name,'飞天机');assert.ok(TECHS.some(t=>t.id===f.state.tech.current.id));
 s.settings.freedom='mid';const mid=localIntents(s,intentInputs(schedule));assert.ok(!mid.some(a=>a.destination==='tech'));
 let done=f.state;const t=TECHS.find(t=>t.id===done.tech.current.id);done.tech.current.progress=t.cost;done.tech.current.elapsed=t.months;done=researchMonth(done);
 assert.equal(done.tech.custom.length,1);assert.equal(done.tech.done.length,1);assert.deepEqual(researchMonth(done).tech,done.tech);
});
test('修河节费与水利减灾生效，已建开海是海贸真实前置',()=>{
 const s=fresh();s.tech.done=['waterwheel','river'];const r=issueEdict(s,{edictType:'修河'},11);near(s.nation.treasury-r.state.nation.treasury,48);near(edictCost(s,'修河'),48);
 assert.ok(techEffects(s).disasterProtection>0);assert.match(researchBlock(s,'ships'),/开海/);
});
test('每旬只加短格物进展，不发送科技树，不改变第一批请求结构',()=>{
 const s=fresh(),f=forecastTurn(s),prompt=turnMessages(s,f),text=prompt[1].content;
 const dynamic=text.match(/【本旬状态】([^\n]+)/)[1],parsed=JSON.parse(dynamic),copy={...parsed};delete copy.格物;
 assert.ok(JSON.stringify(parsed).length-JSON.stringify(copy).length<300);assert.deepEqual(parsed.格物,{在研:'无',进度百分比:0,本旬突破:[]});
 assert.ok(!text.includes('炉温准式'));assert.ok(!text.includes('farm-tools'));assert.ok(!prompt[0].content.includes('memorialTexts'));
 const body=validateTurn({chapter:{朝:'御案灯影渐低。',午:'',夜:''},tech:{done:TECHS.map(t=>t.id)},effects:{treasury:9999}},f);const n=commitTurn(s,f,body);assert.equal(n.tech.done.length,0);assert.equal(n.nation.treasury,f.state.nation.treasury);
});
test('研究状态可保存恢复，主持死后仍能重派且研究暂停不丢原账',()=>{
 let s=start();s=researchMonth(s);const loaded=migrate(unpack(pack(s)).state);assert.deepEqual(loaded.tech,s.tech);assertState(loaded);
 loaded.court.officials[1].alive=false;const r=configureResearch(loaded,{techId:'farming',funding:5}).state;assert.notEqual(r.tech.lead,'o1');assert.equal(r.tech.current.progress,loaded.tech.current.progress);
});
test('旧版动作去重键逐字保留，科技资金、方向和产业参数独立去重',()=>{
 const a={type:'allocate',targetId:'o0',amount:5,source:'treasury',destination:'privy',resource:'treasury'};
 const old=JSON.stringify(['type','targetId','postId','countryId','operation','resource','amount','source','destination','edictType','province'].map(k=>a[k]??null));
 assert.equal(intentActionKey(a),old);
 const tech={...a,destination:'tech',techId:'waterwheel',funding:5};assert.notEqual(intentActionKey(tech),intentActionKey({...tech,techId:'farming'}));assert.notEqual(intentActionKey(tech),intentActionKey({...tech,funding:10}));
});
