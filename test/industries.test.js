import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,assertState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {INDUSTRIES,TECHS} from '../src/core/tech-rules.js';
import {buildIndustry,industryBlock,industriesQuarter,industryTradeFactor} from '../src/core/industries.js';
import {advanceProjects} from '../src/core/edicts.js';
import {nationQuarter,nationYear} from '../src/core/nation.js';
import {quarterlyGrain} from '../src/core/finance.js';
import {seedDevelopmentMemorials,resolveMemorial} from '../src/core/events.js';
import {cabinetDraft} from '../src/core/court.js';
import {technologyHTML,industryForm} from '../src/ui/technology.js';
import {palacePanel} from '../src/ui/panels.js';
import {localIntents,intentInputs} from '../src/llm/intents.js';
const fresh=()=>{const s=initialTurn(createState({seed:'第二批产业',freedom:'free'}));s.tech.done=TECHS.map(t=>t.id);return s;};
const install=(s,type='farm',level=1,index=0)=>s.nation.provinces[index].industries.push({type,level,builtTurn:0,paused:''});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('兴业使用projects，按实际成本扣一次，未完成前无产业',()=>{
 const s=fresh(),before=structuredClone(s),r=buildIndustry(s,{province:'z0',industry:'farm'}).state;
 near(s.nation.treasury-r.nation.treasury,30);assert.equal(r.projects.at(-1).edictType,'兴业');assert.equal(r.projects.at(-1).end-r.turn,9);assert.equal(r.nation.provinces[0].industries.length,0);assert.deepEqual(s,before);
 const repeat=buildIndustry(r,{province:'z0',industry:'farm'});assert.equal(repeat.state.nation.treasury,r.nation.treasury);assert.equal(repeat.state.projects.length,r.projects.length);
});
test('前置、槽位、建造中占槽、三级上限和真实州郡均检查',()=>{
 const s=fresh();s.tech.done=[];assert.match(industryBlock(s,'z0','farm'),/技艺/);s.tech.done=TECHS.map(t=>t.id);
 install(s,'farm');install(s,'weaving');install(s,'kiln');assert.match(industryBlock(s,'z0','salt'),/槽/);
 const r=buildIndustry(s,{province:'z1',industry:'farm'}).state;assert.equal(r.projects.length,1);
 assert.match(industryBlock(s,'fake','farm'),/州郡/);s.nation.provinces[0].industries[0].level=3;assert.match(industryBlock(s,'z0','farm'),/三级/);
 assert.throws(()=>buildIndustry({...s,regency:{}},{province:'z1',industry:'farm'}),/摄政/);
});
test('投产及升级只结算一次，维护费按完成等级计算',()=>{
 let s=buildIndustry(fresh(),{province:'z0',industry:'farm'}).state;s.turn=9;s=advanceProjects(s);assert.equal(s.nation.provinces[0].industries[0].level,1);
 const q=advanceProjects(s);assert.deepEqual(q.nation.provinces[0].industries,s.nation.provinces[0].industries);
 s=buildIndustry(s,{province:'z0',industry:'farm'}).state;assert.equal(s.projects.at(-1).end-s.turn,12);s.turn+=12;s=advanceProjects(s);assert.equal(s.nation.provinces[0].industries[0].level,2);
 const r=industriesQuarter(s);near(s.nation.treasury-r.nation.treasury,0.6);assert.ok(r.nation.grain>s.nation.grain);
});
test('各产业产出、维护与副作用遵守规则，不改输入或随机数',()=>{
 for(const type of Object.keys(INDUSTRIES)){
  const s=fresh();install(s,type);s.nation.treasury=100;s.projects.push({edictType:'开海',done:true});const before=structuredClone(s),r=industriesQuarter(s);
  assert.deepEqual(s,before);assert.equal(r.rng,s.rng);assert.ok(r.ledger.some(e=>e.source==='季结：产业维护'));
  if(type==='farm')assert.ok(r.nation.grain>s.nation.grain);
  if(['weaving','kiln','salt','iron','customs'].includes(type))assert.ok(r.ledger.some(e=>e.path==='nation.treasury'&&e.source.endsWith('产出')&&e.delta>0));
  if(type==='salt')assert.ok(r.nation.governance<s.nation.governance);
  if(type==='iron')assert.ok(r.nation.army.frontiers[0].readiness>s.nation.army.frontiers[0].readiness);
  if(type==='customs')assert.ok(r.nation.army.frontiers.find(b=>b.dir==='东').threat>s.nation.army.frontiers.find(b=>b.dir==='东').threat);
 }
});
test('叛乱、当季民变、重灾、低民心及维护费不足都会停产，平复后复产',()=>{
 for(const condition of ['rebellion','quarter','disaster','morale','money']){
  const s=fresh();install(s,'farm');const p=s.nation.provinces[0];
  if(condition==='rebellion')p.rebellion=true;if(condition==='quarter')p.rebellionQuarter=0;if(condition==='disaster')p.disaster=80;if(condition==='morale')p.morale=14;if(condition==='money')s.nation.treasury=0;
  const r=industriesQuarter(s);assert.equal(r.nation.grain,s.nation.grain);assert.ok(r.nation.provinces[0].industries[0].paused);
  r.nation.provinces[0].rebellion=false;r.nation.provinces[0].rebellionQuarter=-1;r.nation.provinces[0].disaster=0;r.nation.provinces[0].morale=60;r.nation.treasury=100;
  const resumed=industriesQuarter(r);assert.equal(resumed.nation.provinces[0].industries[0].paused,'');assert.ok(resumed.nation.grain>r.nation.grain);
 }
});
test('多产业、多州结算不因拷贝丢掉暂停状态或产出，税粮都可追账',()=>{
 const s=fresh();install(s,'weaving');install(s,'farm');install(s,'salt',1,1);s.nation.provinces[1].disaster=90;
 const before=structuredClone(s),r=nationQuarter(s);assert.deepEqual(s,before);assert.ok(r.nation.provinces[1].industries[0].paused);assert.ok(r.nation.provinces[0].prosperity>s.nation.provinces[0].prosperity);
 const delta=r.ledger.filter(e=>e.path==='nation.treasury').reduce((n,e)=>n+e.after-e.before,0);near(r.nation.treasury-s.nation.treasury,delta);assertState(r);
});
test('低吏治盐课收入打折，战备和海防边患始终截断至100',()=>{
 const low=fresh(),high=fresh();install(low,'salt');install(high,'salt');low.nation.governance=0;high.nation.governance=100;
 const income=s=>industriesQuarter(s).ledger.filter(e=>e.source.endsWith('盐场产出')&&e.path==='nation.treasury').reduce((n,e)=>n+e.after-e.before,0);assert.ok(income(high)>income(low));
 install(high,'iron');install(high,'customs',1,1);high.nation.army.frontiers.forEach(b=>{b.readiness=100;b.threat=100;});const r=industriesQuarter(high);assert.ok(r.nation.army.frontiers.every(b=>b.readiness<=100&&b.threat<=100));
});
test('繁荣有基础、产业与科技成长并递减，上限100；灾害和苛政使之衰退',()=>{
 const s=fresh();s.tech.done=[];const r=industriesQuarter(s);near(r.nation.provinces[0].prosperity,0.5);
 const developed=fresh();install(developed,'weaving');assert.ok(industriesQuarter(developed).nation.provinces[0].prosperity>r.nation.provinces[0].prosperity);
 developed.nation.provinces[0].prosperity=100;assert.equal(industriesQuarter(developed).nation.provinces[0].prosperity,100);
 developed.nation.provinces[0].disaster=90;developed.nation.provinces[0].morale=10;assert.ok(industriesQuarter(developed).nation.provinces[0].prosperity<100);
});
test('漕运向相邻州扩散，运输收益有上限，海贸须开海且互市加成真实入库',()=>{
 const s=fresh();install(s,'canal',3,1);s.tech.done=['farming','waterwheel','river','canal'];
 const r=industriesQuarter(s);assert.ok(r.nation.provinces[0].prosperity>r.nation.provinces[3].prosperity);assert.ok(quarterlyGrain(s)>quarterlyGrain({...s,nation:{...s.nation,provinces:s.nation.provinces.map(p=>({...p,industries:[]}))}}));
 assert.match(industryBlock(s,'z0','customs'),/技艺/);s.tech.done.push('ships','customs');assert.match(industryBlock(s,'z0','customs'),/开海/);
 s.projects.push({edictType:'开海',done:true});assert.equal(industryBlock(s,'z0','customs'),'');install(s,'customs');assert.ok(industryTradeFactor(s)>1);
 s.foreign[0].trade={start:0,until:36,income:2};s.turn=9;const q=nationQuarter(s);assert.ok(q.ledger.some(e=>e.source==='季结：外邦互市岁入'&&e.delta>2));
});
test('繁荣提高赋税、人口加权粮产和年结人口，零繁荣保持原有基准',()=>{
 const base=fresh();base.tech.done=[];base.nation.provinces.forEach(p=>{p.pop=10000;p.disaster=0;});const rich=structuredClone(base);rich.nation.provinces.forEach(p=>p.prosperity=100);
 const tax=s=>nationQuarter(s).ledger.filter(e=>e.path==='nation.treasury'&&e.source.startsWith('季结：赋税')).reduce((n,e)=>n+e.after-e.before,0);near(tax(rich),tax(base)*2);near(quarterlyGrain(rich),quarterlyGrain(base)*1.5);
 assert.ok(nationYear(rich).nation.provinces[0].pop>nationYear(base).nation.provinces[0].pop);
});
test('兴业口谕映射真实州和产业，不产生额外一次性奖励',()=>{
 const s=fresh(),schedule={朝:{kind:'下旨',text:'命直隶兴建织造局'}},intents=localIntents(s,intentInputs(schedule));
 assert.equal(intents[0].industry,'weaving');assert.equal(intents[0].province,'z0');const f=forecastTurn(s,schedule,intents);assert.ok(f.state.projects.some(p=>p.edictType==='兴业'&&p.industry==='weaving'));assert.equal(f.state.nation.provinces[0].industries.length,0);
});
test('请研与请建奏折的选项使用同一引擎，成本只扣一次，重复处置拒绝',()=>{
 let s=fresh();s.turn=36;s=seedDevelopmentMemorials(s,s);const m=s.memorials.find(m=>m.id==='industry-request-36');assert.ok(m);const cost=-m.options[0].effects.treasury;
 const r=resolveMemorial(s,m.id,m.options[0].id).state;near(s.nation.treasury-r.nation.treasury,cost);assert.ok(r.projects.some(p=>p.edictType==='兴业'));assert.throws(()=>resolveMemorial(r,m.id,m.options[0].id),/不存在/);
 s=fresh();s.tech.done=[];s.turn=18;s=seedDevelopmentMemorials(s,s);const research=s.memorials.find(m=>m.id==='tech-request-18');assert.ok(research);const q=resolveMemorial(s,research.id,'approve').state;assert.equal(q.tech.funding,5);assert.ok(q.tech.current);assert.equal(q.nation.treasury,s.nation.treasury);
});
test('失效的科技与产业方案不会被票拟或代批强行执行',()=>{
 let s=fresh();s.turn=36;s=seedDevelopmentMemorials(s,s);const m=s.memorials.find(m=>m.id==='industry-request-36');s.nation.treasury=0;const draft=cabinetDraft(s,m);assert.equal(draft.option,'reject');
});
test('新面板显示科技树、经费和主持，州郡产业表单只使用真实ID',()=>{
 const s=fresh(),html=technologyHTML(s);for(const t of TECHS)assert.ok(html.includes(t.name));assert.match(html,/type="range"/);assert.match(html,/主持官员/);assert.match(html,/每月经费/);assert.ok(industryForm(s,'z2').includes('value="z2" selected'));
});
test('两个面板表单的时辰ID不同，满日程、摄政和待续不能覆盖原安排',()=>{
 const s=fresh();s.tech.done=[];let html=technologyHTML(s);assert.ok(html.includes('id="research-slot"'));assert.ok(html.includes('id="industry-slot"'));
 for(const mode of ['full','regency','pending']){
  const copy=structuredClone(s);if(mode==='full')copy.schedule={朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}};
  if(mode==='regency')copy.regency={};if(mode==='pending')copy.pending={};
  html=technologyHTML(copy);assert.match(html,/<button class="primary" type="submit" disabled>安排格物旨意/);
 }
});
test('模拟全力格物策略可复现、200年策略口径不变且逐年现金守恒',async()=>{
 const {simulate}=await import('../scripts/simulate.mjs');const a=simulate(3,'产业模拟',{strategy:'tech'}),b=simulate(3,'产业模拟',{strategy:'tech'});assert.deepEqual(a,b);
 assert.ok(a.development.completed>0);assert.ok(a.development.firstIndustryTurn<=72);assert.ok(a.development.research>0&&a.development.construction>0);
 for(const row of a.annual)assert.ok(Math.abs(row.closingTreasury-row.openingTreasury-row.income+row.expense-row.resetAdjustment)<0.03,'展示值按分位四舍五入，年度现金仍须守恒');
});
