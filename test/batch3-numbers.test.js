import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {applyEffects,applyPackage} from '../src/core/effects.js';
import {nationMonth,nationQuarter,nationYear} from '../src/core/nation.js';
import * as court from '../src/core/court.js';
import * as harem from '../src/core/harem.js';
import * as finance from '../src/core/finance.js';
import {emperorMonth} from '../src/core/emperor.js';
import {seedMemorials,resolveMemorial,expireMemorials} from '../src/core/events.js';
import {issueEdict,advanceProjects} from '../src/core/edicts.js';
import {diplomacy,diplomacyBlock,advanceCampaigns} from '../src/core/foreign.js';
import {ledgerHTML} from '../src/ui/render.js';
const start=()=>initialTurn(createState({seed:'C批数值回归'}));
const hash=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≠ ${b}`);
const weighted=s=>s.nation.provinces.reduce((n,p)=>n+p.pop*p.morale,0)/s.nation.provinces.reduce((n,p)=>n+p.pop,0);

test('C1 民心按人口加权，普遍效果乘0.3且相关州效果不波及别州，四项高值收益递减并记实际账',()=>{
 let s=start();s.nation.provinces.forEach((p,i)=>{p.morale=i?40:80;p.pop=i?100:1000;});s.nation.morale=weighted(s);
 const before=hash(s),all=applyEffects(s,{morale:10},'全国');assert.equal(hash(s),before);close(all.state.nation.morale,weighted(all.state));close(all.state.nation.provinces[1].morale,43);
 const local=applyPackage(s,{province:{id:'z1',morale:10}});close(local.nation.provinces[1].morale,50);close(local.nation.provinces[2].morale,40);close(local.nation.morale,weighted(local));
 for(const [value,inc]of [[79,8],[80,4],[90,2]]){s=start();s.nation.governance=value;s.emperor.virtue=value;s.emperor.prestige=value;s.nation.provinces.forEach(p=>p.morale=value);s.nation.morale=value;
  const r=applyEffects(s,{governance:8,virtue:8,prestige:8,morale:8});close(r.state.nation.governance,value+inc);close(r.state.emperor.virtue,value+inc);close(r.state.emperor.prestige,value+inc);close(r.state.nation.morale,value+inc*0.3);assert.ok(r.entries.some(e=>e.path==='nation.governance'&&e.delta===inc));}
});

test('C1 六部履职成为治理回归目标，圣德皇威心情按月回归，例行准奏只加0.1吏治且驳回不扣民心',()=>{
 let s=start();s.nation.governance=95;s.emperor.virtue=90;s.emperor.prestige=90;s.emperor.mood=90;s.emperor.tags=[];
 const month=court.courtMonth(s);assert.ok(month.nation.governance<95);s=emperorMonth(s);close(s.emperor.virtue,89.2);close(s.emperor.prestige,89.2);close(s.emperor.mood,88.25);
 s=start();s.memorials=[];s=seedMemorials(s);const m=s.memorials.find(m=>m.options[0].effects.governance===0.1);assert.ok(m);assert.equal(m.options[0].effects.governance,0.1);assert.ok(!m.options[1].effects.morale);
 const approved=resolveMemorial(s,m.id,'approve').state;close(approved.nation.morale,s.nation.morale);
});

test('C2 季度新粮按季军粮1.2倍及人口灾情，三年仓容超额年霉变30%',()=>{
 let s=start();s.nation.provinces.forEach((p,i)=>{p.pop=200;p.disaster=i===0?50:0;});s.nation.grain=0;
 const expected=finance.monthlyBudget(s).grain*3*1.2*s.nation.provinces.reduce((a,p)=>a+p.pop*(1-p.disaster/100),0)/s.nation.provinces.reduce((a,p)=>a+p.pop,0);close(nationQuarter(s).nation.grain,expected);
 assert.equal(typeof finance.grainBudget,'function');const b=finance.grainBudget(s);close(b.relief,2);close(b.storageCapacity,b.monthly*36);
 s.nation.grain=1000;const monthly=nationMonth(s);close(monthly.nation.grain,1000-b.monthly);
 s.nation.grain=b.storageCapacity+100;const yr=nationYear(s);close(yr.nation.grain,b.storageCapacity+70);assert.ok(yr.ledger.some(e=>e.source.includes('霉变')));
});

test('C2 粮储不足一月军粮才使战力减三成，足粮战力不受影响',()=>{
 let s=start();s.foreign[0].frontier='北';s.foreign[0].power=42;s.court.officials.forEach(o=>o.abilities.军=50);s=diplomacy(s,{country:'w0',operation:'宣战'},20).state;
 const limit=finance.monthlyBudget(s).grain;s.nation.grain=limit-0.01;const hungry=advanceCampaigns(s);s.nation.grain=limit;const fed=advanceCampaigns(s);
 assert.ok(hungry.facts.some(e=>e.key==='缺粮战力'));assert.ok(!fed.facts.some(e=>e.key==='缺粮战力'));
});

test('C3 钱粮不足的每一份差额进入分币种积欠，收入先还欠且不重复记账',()=>{
 let s=start();s.nation.treasury=2;s.nation.privy=1;s.nation.grain=3;s.nation.arrears=0;
 const input=s,original=hash(s);s=applyPackage(s,{treasury:-7,privy:-5,grain:-10},'不足支付');assert.equal(s.nation.arrears,5);assert.equal(s.nation.privyArrears,4);assert.equal(s.nation.grainArrears,7);assert.equal(hash(input),original);
 assert.equal(s.nation.treasury+s.nation.privy+s.nation.grain,0);
 s=applyPackage(s,{treasury:10,privy:10,grain:10});s=finance.settleArrears(s);close(s.nation.treasury,5);close(s.nation.privy,6);close(s.nation.grain,3);assert.equal(s.nation.arrears+s.nation.privyArrears+s.nation.grainArrears,0);
 const paid=hash(s);assert.equal(hash(finance.settleArrears(s)),paid);
});

test('C3 皇庄盐课每月收入三万两，节俭真实降低宫费三成',()=>{
 const s=start();s.emperor.tags=[];const base=nationMonth(s);s.emperor.tags=['节俭'];const frugal=nationMonth(s);
 const cost=2+s.harem.consorts.filter(c=>!c.retired&&c.health>0).length*0.15;
 close(base.nation.privy-s.nation.privy,3-cost);close(frugal.nation.privy-base.nation.privy,cost*0.3);
});

test('C3 当前版迁移补新字段且v1至v5旧预演逐字保留，提交不重掷不重算',()=>{
 for(let v=1;v<=5;v++){
  let s=start();s.pending={forecast:forecastTurn(s,{朝:null,午:null,夜:null})};s.v=v;s.pending.forecast.state.v=v;
  delete s.nation.privyArrears;delete s.nation.grainArrears;delete s.emperor.depressedMonths;
  s.foreign.forEach(f=>delete f.trade);s.court.officials.forEach(o=>delete o.banquetTurn);
  const old=hash(s),pending=hash(s.pending.forecast),n=migrate(s);assert.ok(VERSION>=8);assert.equal(n.v,VERSION);assert.equal(n.nation.privyArrears,0);assert.equal(n.nation.grainArrears,0);assert.equal(n.emperor.depressedMonths,0);assert.ok(n.foreign.every(f=>f.trade===null));assert.equal(hash(s),old);assert.equal(hash(n.pending.forecast),pending);
  const c=commitTurn(n,n.pending.forecast,{});assert.equal(c.v,VERSION);assert.equal(c.lastTurn.die,s.pending.forecast.die);assert.equal(c.nation.treasury,s.pending.forecast.state.nation.treasury);assert.equal(c.rng,s.pending.forecast.state.rng);assert.deepEqual(commitTurn(c,n.pending.forecast,{}),c);
 }
 const bad=start();bad.nation.privyArrears=-1;assert.throws(()=>migrate(bad));
});

test('C4 京营按四万五编制月补1%并付饷，民心或军粮不足不补，征兵可指定一军',()=>{
 let s=start();s.nation.army.capital.troops=35000;const before=hash(s);const next=nationMonth(s);assert.equal(hash(s),before);assert.equal(next.nation.army.capital.troops,35100);assert.ok(next.ledger.some(e=>e.source.includes('京营补员')&&e.path==='nation.treasury'));
 for(const low of ['morale','grain']){const a=structuredClone(s);if(low==='morale'){a.nation.morale=10;a.nation.provinces.forEach(p=>p.morale=10);}else a.nation.grain=0;assert.equal(nationMonth(a).nation.army.capital.troops,35000);}
 for(const armyTarget of ['capital','北']){let a=issueEdict(s,{edictType:'征兵',armyTarget},20).state;const p=a.projects.at(-1);assert.equal(p.armyTarget,armyTarget);a.turn=p.end;a=advanceProjects(a);assert.equal(a.nation.army.capital.troops,armyTarget==='capital'?38000:35000);assert.equal(a.nation.army.frontiers[0].troops,armyTarget==='北'?38000:35000);assert.equal(a.nation.army.frontiers[1].troops,35000);}
 assert.throws(()=>issueEdict(s,{edictType:'征兵',armyTarget:'不存在'},20),/军/);
});

test('C5 派系势力取决于在任职位能力，任免立即改变且无人执政不凭空同步漂移',()=>{
 let s=start();const before=hash(s);const empty=court.courtMonth({...s,court:{...s.court,posts:s.court.posts.map(p=>({...p,holder:null}))}});assert.equal(hash(s),before);assert.ok(empty.court.factions.every(f=>f.power<10));
 const p=s.court.posts.find(p=>p.holder),old=s.court.officials.find(o=>o.id===p.holder);const normalized=court.courtMonth(s);const after=court.appoint(normalized,{post:p.id,operation:'remove'}).state;assert.ok(after.court.factions.find(f=>f.id===old.faction).power<normalized.court.factions.find(f=>f.id===old.faction).power);
});

test('C5 任一在任官员野心势力低皇威可触发真实代批，弱势者不会每旬代批',()=>{
 let s=start();s.emperor.prestige=45;s.court.factions.forEach(f=>f.power=30);const o=s.court.officials.find(o=>court.inCapital(o)&&o.post);o.ambition=100;s.court.factions.find(f=>f.id===o.faction).power=60;
 assert.equal(court.strongman(s),true);const r=court.proxyMemorial(s);assert.ok(r.note);assert.ok(r.state.memorials.length<s.memorials.length);assert.equal(r.officialId,o.id);
 s.emperor.prestige=90;s.court.officials.forEach(o=>o.ambition=10);assert.equal(court.strongman(s),false);assert.equal(court.proxyMemorial(s).note,null);
});

test('C6 郁结连续满三个月后按月损健康，恢复心情重置，常规月心情回归55',()=>{
 let s=start();s.emperor.tags=[];s.emperor.health=80;s.emperor.mood=0;
 for(let i=0;i<3;i++){s.emperor.mood=0;s=emperorMonth(s);}assert.equal(s.emperor.depressedMonths,3);const h=s.emperor.health;s.emperor.mood=0;s=emperorMonth(s);close(s.emperor.health,h-1);assert.ok(s.ledger.some(e=>e.source.includes('郁结')&&e.delta===-1));
 s.emperor.mood=55;s=emperorMonth(s);assert.equal(s.emperor.depressedMonths,0);close(s.emperor.mood,55);
});

test('C7 官员年龄死亡率有阶梯，七十岁请致仕可准留，科举按空缺取一至五人',()=>{
 assert.equal(typeof court.officialDeathChance,'function');for(const [age,chance]of [[59,0],[60,0.02],[69,0.02],[70,0.06],[79,0.06],[80,0.15]])assert.equal(court.officialDeathChance(age),chance);
 let s=start();s.turn=36;s.court.officials.forEach(o=>o.age=30);const person=s.court.officials.find(o=>o.post);person.age=69;s=court.courtYear(s);const m=s.memorials.find(m=>m.type==='致仕'&&m.fromId===person.id);assert.ok(m);assert.equal(m.options.length,2);
 const retired=resolveMemorial(s,m.id,'opt0').state;assert.equal(retired.court.officials.find(o=>o.id===person.id).retired,true);assert.ok(!retired.court.posts.some(p=>p.holder===person.id));const kept=resolveMemorial(s,m.id,'opt1').state;assert.equal(kept.court.officials.find(o=>o.id===person.id).retired||false,false);
 for(const vacancies of [0,1,3,9]){let a=start();a.turn=108;a.court.officials.forEach(o=>o.age=30);a.court.posts.forEach((p,i)=>p.holder=i<vacancies?null:a.court.officials[0].id);const prev=a.court.officials.length;a=court.courtYear(a);assert.equal(a.court.officials.length-prev,Math.min(5,vacancies));}
});

test('C8 宫斗发起者按心机加权且选择最差关系目标，小产概率独立限制2至8%',()=>{
 assert.equal(typeof harem.choosePalacePlot,'function');assert.equal(typeof harem.miscarriageChance,'function');
 let s=start();s.harem.consorts.forEach((c,i)=>{c.ambition=80;c.scheming=[90,10,40][i];c.relations={};});s.harem.consorts[0].relations={c1:80,c2:0};
 const input=s,original=hash(s),counts={c0:0,c1:0,c2:0};for(let i=0;i<300;i++){const r=harem.choosePalacePlot(s);assert.ok(r.schemerId);counts[r.schemerId]++;if(r.schemerId==='c0')assert.equal(r.targetId,'c2');s={...s,rng:r.state.rng};}
 assert.ok(counts.c0>counts.c2&&counts.c2>counts.c1);assert.ok(counts.c1>0);assert.equal(hash(input),original);
 assert.equal(harem.miscarriageChance({scheming:100},{scheming:0}),0.08);assert.equal(harem.miscarriageChance({scheming:0},{scheming:100}),0.02);
});

test('C9 宴请好感按俭常盛加2加4加7，同客六旬内减半且不影响其他宾客',()=>{
 for(const [cost,inc]of [['俭',2],['常',4],['盛',7]]){let s=start();const guests=s.court.officials.filter(court.inCapital).slice(0,3);s.court.officials.forEach(o=>o.favor=20);
  const first=court.banquet(s,{guests:guests.slice(0,2).map(o=>o.id),cost}).state;close(first.court.officials.find(o=>o.id===guests[0].id).favor,20+inc);
  const second=court.banquet(first,{guests:[guests[0].id,guests[2].id],cost}).state;close(second.court.officials.find(o=>o.id===guests[0].id).favor,20+inc*1.5);close(second.court.officials.find(o=>o.id===guests[2].id).favor,20+inc);
  const later=court.banquet({...first,turn:first.turn+6},{guests:guests.slice(0,2).map(o=>o.id),cost}).state;close(later.court.officials.find(o=>o.id===guests[0].id).favor,20+2*inc);
 }
});

test('C9 互市成功只设季度收入与一年期限，同国外邦一年只能议一次，交战停收',()=>{
 let s=start();s.emperor.talents.魅力=100;s.foreign[0].attitude=100;const treasury=s.nation.treasury;
 let r=diplomacy(s,{country:'w0',operation:'互市'},20);assert.equal(r.state.nation.treasury,treasury);assert.ok(r.state.foreign[0].trade.income>0);assert.equal(r.state.foreign[0].trade.until,s.turn+36);assert.match(diplomacyBlock(r.state,{country:'w0',operation:'互市'}),/一年/);
 const traded=structuredClone({...r.state,turn:9}),none=structuredClone(traded);none.foreign[0].trade=null;close(nationQuarter(traded).nation.treasury-nationQuarter(none).nation.treasury,r.state.foreign[0].trade.income);
 traded.foreign[0].status='交战';close(nationQuarter(traded).nation.treasury,nationQuarter(none).nation.treasury);assert.equal(diplomacyBlock({...r.state,turn:36},{country:'w0',operation:'互市'}),'');
});

test('C6 当廷驳回另记皇威来源，成功问责祭天胜仗和代批仍走核心效果包',()=>{
 const s=start(),m=s.memorials.find(m=>m.options.some(o=>o.id==='reject'));
 const f=forecastTurn(s,{朝:{kind:'上朝',memorials:[m.id],decisions:{[m.id]:'reject'}},午:null,夜:null});
 assert.ok(f.entries.some(e=>e.source==='当廷驳回'&&e.path==='emperor.prestige'&&e.delta>0));
});

test('C1 例行积压每月记一次治理成本，低治理影响各州民心但不篡改全国口径',()=>{
 let s=start();s.memorials=Array.from({length:15},(_,i)=>({...s.memorials[0],id:'pending'+i,due:100}));s.turn=1;
 assert.ok(!expireMemorials(s).ledger.some(e=>e.source.includes('积压超过')));
 s.turn=3;const n=expireMemorials(s);assert.ok(n.ledger.some(e=>e.source.includes('积压超过')&&e.delta===-1));
 s=start();s.nation.governance=0;const low=nationMonth(s);s.nation.governance=50;const middle=nationMonth(s);assert.ok(low.nation.morale<middle.nation.morale);close(low.nation.morale,weighted(low));
 s.nation.governance=35;assert.ok(nationMonth(s).nation.morale<middle.nation.morale);
});

test('C1 有灾请赈的驳回损圣德，普通案牍驳回不扣民心圣德',()=>{
 let s=start();s.memorials=[];s.nation.provinces[0].disaster=50;s=seedMemorials(s);
 const relief=s.memorials.find(m=>m.type==='请赈');assert.ok(relief);assert.equal(relief.options.find(o=>o.id==='reject').effects.virtue,-2);
 const routine=s.memorials.find(m=>m.type!=='请赈');assert.ok(!routine.options.find(o=>o.id==='reject').effects.virtue);
});

test('C6 真实急报逾期损皇威，普通案牍逾期不额外损皇威',()=>{
 let s=start();s.turn=10;s.memorials=[{...s.memorials[0],urgent:true,due:9}];const urgent=expireMemorials(s);assert.ok(urgent.emperor.prestige<s.emperor.prestige);
 s.memorials[0].urgent=false;const routine=expireMemorials(s);assert.equal(routine.emperor.prestige,s.emperor.prestige);
});

test('C3 超过旧余额上限的短缺仍完整记债，不把积欠截成一百万',()=>{
 const s=start();s.nation.treasury=480;const next=applyPackage(s,{treasury:-1e9});assert.equal(next.nation.arrears,1e9-480);
 assert.doesNotThrow(()=>migrate(next));
});

test('C1 天灾当旬损当地民心，拨银救灾的收益作用于受灾州且不普遍白给',async()=>{
 const {eventsMonth}=await import('../src/core/events.js');let s=start(),disaster;
 for(let rng=1;rng<100&&!disaster;rng++){const r=eventsMonth({...s,rng});if(r.threads.some(t=>t.type==='天灾'))disaster=r;}
 assert.ok(disaster);const m=disaster.memorials.find(m=>m.type==='天灾'),p=disaster.nation.provinces.find(p=>p.id===m.provinceId);
 assert.equal(p.morale,58);const relief=resolveMemorial(disaster,m.id,'opt0').state;
 assert.equal(relief.nation.provinces.find(p=>p.id===m.provinceId).morale,66);
 for(const other of relief.nation.provinces.filter(p=>p.id!==m.provinceId))assert.equal(other.morale,62);
});

test('C6 权臣实批损皇威，分币种积欠在界面记账有中文名称',()=>{
 const s=start();s.emperor.prestige=20;s.court.factions[0].power=90;const n=court.proxyMemorial(s).state;
 assert.ok(n.ledger.some(e=>e.source.endsWith('代批：皇权旁落')&&e.path==='emperor.prestige'&&e.delta===-0.5));
 const html=ledgerHTML([{source:'月结',path:'nation.privyArrears',before:0,after:3,delta:3},{source:'月结',path:'nation.grainArrears',before:0,after:2,delta:2},{source:'月结',path:'emperor.depressedMonths',before:0,after:1,delta:1},{source:'月结',path:'faction.f0.powerModifier',before:0,after:1,delta:1}]);
 assert.ok(html.includes('内帑积欠')&&html.includes('缺粮积欠'));
 assert.ok(html.includes('郁结月数')&&html.includes('政局影响'));
});

test('C1 单州减赋项目竣结只改变该州民心，其他州保持原值',()=>{
 let s=start();s.nation.governance=100;s.emperor.prestige=100;s.court.officials.forEach(o=>{o.abilities.政=100;o.greed=0;});s.court.factions.forEach(f=>f.attitude=100);
 s=issueEdict(s,{edictType:'减赋',province:'z0'},20).state;const p=s.projects.at(-1);s.turn=p.end;const n=advanceProjects(s);
 close(n.nation.provinces[0].morale,62+p.effects.morale);assert.ok(n.nation.provinces.slice(1).every(p=>p.morale===62));close(n.nation.morale,weighted(n));
});

test('C6 月中恢复心情即解除连续郁结，不能把恢复前后的月份拼接扣健康',()=>{
 const s=start();s.emperor.mood=10;s.emperor.depressedMonths=2;
 const n=applyPackage(s,{mood:20},'散心');assert.equal(n.emperor.depressedMonths,0);n.emperor.mood=0;
 const m=emperorMonth(n);assert.equal(m.emperor.depressedMonths,1);assert.ok(!m.ledger.some(e=>e.source==='连续郁结：月损圣躬'));
});

test('C1 民心稳定时各州每月向55修复百分之一点八，全局低于25不白给恢复且全国仍人口加权',()=>{
 let s=start();s.nation.governance=50;s.nation.provinces.forEach(p=>p.morale=40);s.nation.morale=40;const n=nationMonth(s);close(n.nation.provinces[0].morale,40.27);close(n.nation.morale,weighted(n));
 s.nation.provinces.forEach(p=>p.morale=19);s.nation.morale=19;s.nation.treasury=3000;const low=nationMonth(s);assert.ok(low.nation.provinces.every(p=>p.morale<=19));
});

test('C1 钱粮足付且全国稳定时可修复低民心州，欠饷或全局危机时不白给恢复',()=>{
 let s=start();s.nation.governance=50;s.nation.provinces[0].morale=0;s.nation.morale=weighted(s);
 const n=nationMonth(s);close(n.nation.provinces[0].morale,0.99);
 s.nation.treasury=0;const poor=nationMonth(s);assert.equal(poor.nation.provinces[0].morale,0);
});

test('C5 地方在任官员也可构成权臣，由同派在京官员实际代批；新局势力不等月结才突变',()=>{
 let s=start();assert.deepEqual(s.court.factions.map(f=>f.power),court.courtMonth(s).court.factions.map(f=>f.power));
 s.emperor.prestige=45;s.court.officials.forEach(o=>o.ambition=0);const o=s.court.officials[0];o.ambition=100;o.inCapital=false;o.post='p29';s.court.posts[0].holder=null;s.court.posts[29].holder=o.id;s.court.factions.forEach(f=>f.power=30);s.court.factions[0].power=60;
 assert.equal(court.strongman(s),true);const n=court.proxyMemorial(s);assert.ok(n.note);assert.notEqual(n.officialId,o.id);assert.ok(court.inCapital(n.state.court.officials.find(o=>o.id===n.officialId)));
});

test('C3 真实v4和v5无新字段待续快照原样读入，提交只补新版字段而不改旧钱粮与骰子',()=>{
 for(const version of [4,5]){
  const raw=JSON.parse(readFileSync(new URL('./fixtures/v'+version+'-pending.json',import.meta.url))),f=raw.pending.forecast;
  assert.equal(raw.v,version);assert.ok(!('privyArrears' in f.state.nation));const before=hash(raw),receipt=hash(f),n=migrate(raw);
  assert.equal(hash(raw),before);assert.equal(hash(n.pending.forecast),receipt);const next=commitTurn(n,n.pending.forecast,{});
  for(const field of ['treasury','privy','grain','morale','governance'])assert.equal(next.nation[field],f.state.nation[field]);
  assert.equal(next.lastTurn.die,f.die);assert.equal(next.rng,f.state.rng);assert.equal(next.v,VERSION);assert.equal(next.nation.privyArrears,0);assert.equal(next.nation.grainArrears,0);assert.equal(hash(n.pending.forecast),receipt);
 }
});

test('C6 长期郁结时健康净减1而不被太医回血抵消，满健康不重复扣回血',()=>{
 for(const health of [80,99.8,100]){const s=start();s.emperor.tags=[];s.emperor.health=health;s.emperor.mood=0;s.emperor.depressedMonths=3;close(emperorMonth(s).emperor.health,health-1);}
});

test('C6 事务预演中的长期郁结也净减健康1，事务副本不得让回血抵消伤害',()=>{
 const s=start();s.turn=2;s.day=20;s.revision=2;s.emperor.tags=[];s.emperor.health=80;s.emperor.mood=0;s.emperor.depressedMonths=3;
 const old=hash(s),f=forecastTurn(s);assert.equal(hash(s),old);close(f.state.emperor.health,79);assert.equal(f.state.emperor.depressedMonths,4);
});

test('C2 模拟粮储峰值包含年结霉变之前的真实入仓峰值',async()=>{
 const {simulate}=await import('../scripts/simulate.mjs');let peak=0;
 const r=simulate(1,'粮储峰值',{onForecast:(s,f)=>{for(const e of f.entries.filter(e=>e.path==='nation.grain'))peak=Math.max(peak,e.before,e.after);}});
 close(r.maxGrain,peak);
});

test('C7 留任后不每年重复生成同一人的七十岁致仕请求，既有事件保留',()=>{
 let s=start();s.turn=36;s.court.officials.forEach(o=>o.age=30);s.court.officials[0].age=69;s=court.courtYear(s);
 const m=s.memorials.find(m=>m.type==='致仕');assert.ok(m);s=resolveMemorial(s,m.id,'opt1').state;
 s.turn+=36;s=court.courtYear(s);assert.equal(s.threads.filter(t=>t.type==='致仕'&&t.actors[0]==='o0').length,1);
});

test('C5 权臣每月最多代批一本，同旬重调不结第二本，留守指定代批沿用独立机制',()=>{
 let s=start();s.emperor.prestige=20;s.court.factions[0].power=90;
 const first=court.proxyMemorial(s);assert.ok(first.note);assert.equal(court.proxyMemorial(first.state).note,null);
 const later=court.proxyMemorial({...first.state,turn:s.turn+3});assert.ok(later.note);
 const minister=s.court.officials.find(o=>court.inCapital(o)&&o.post);assert.ok(court.proxyMemorial(first.state,{minister,label:'留守代批'}).note);
});
