import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {foreignMonth,checkCollapse} from '../src/core/foreign.js';
import {resolveMemorial,expireMemorials} from '../src/core/events.js';
import {pack,unpack} from '../src/store/save.js';
import * as simulation from '../scripts/simulate.mjs';
import {economicChecks} from '../scripts/stage8-1-balance.mjs';
const initial=()=>initialTurn(createState({seed:'C0前置校准'}));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function critical(){const s=initial();s.nation.morale=0;s.nation.provinces.forEach(p=>p.morale=0);s.nation.treasury=0;s.memorials=[];s.threads=[];return s;}
function through(s,turn){for(let t=s.turn+1;t<=turn;t++)s=checkCollapse({...s,turn:t});return s;}

test('C0-1 中性通好边患月增0.8至1.0，正式婚盟和朝贡可下降且保持纯函数',()=>{
 const s=initial();for(const b of s.nation.army.frontiers)b.threat=50;
 for(const f of s.foreign){const b=s.nation.army.frontiers.find(b=>b.dir===f.frontier);f.power=b.troops*b.readiness/100/500;f.attitude=50;f.status='通好';}
 const before=hash(s),next=foreignMonth(s);assert.equal(hash(s),before);assert.equal(next.rng,s.rng);
 for(const [i,b]of next.nation.army.frontiers.entries()){const delta=b.threat-s.nation.army.frontiers[i].threat;assert.ok(delta>=0.8&&delta<=1,'中性月增 '+delta);}
 for(const status of ['婚盟','朝贡']){const allied=structuredClone(s);allied.foreign.forEach(f=>f.status=status);assert.ok(foreignMonth(allied).nation.army.frontiers.every((b,i)=>b.threat<allied.nation.army.frontiers[i].threat));}
});

test('C0-2 危机连续三个月才出京畿民变急报，同旬重复检查不计时不掷骰',()=>{
 let s=critical();const rng=s.rng;s=through(s,8);assert.equal(s.ending,null);assert.equal(s.rng,rng);assert.equal(s.memorials.length,0);
 const original=hash(s);const next=checkCollapse({...s,turn:9});assert.equal(hash(s),original);s=next;
 assert.equal(s.ending,null);assert.equal(s.rng,rng);assert.equal(s.memorials.length,1);
 const m=s.memorials[0];assert.equal(m.title,'京畿民变');assert.equal(m.type,'京畿民变');assert.equal(m.urgent,true);assert.equal(m.options.length,3);
 for(const label of ['开仓','调兵','罪己诏'])assert.ok(m.options.some(o=>o.label.includes(label)),label);
 assert.equal(hash(checkCollapse(s)),hash(s));assert.equal(s.stats.events,1);
});

test('C0-2 京畿急报逾期或危机持续六个月才亡国，已处置仍须恢复国势',()=>{
 let s=through(critical(),9),m=s.memorials[0];assert.ok(m,'应先生成可处置的急报');
 assert.equal(expireMemorials(s).ending,null);
 const expired=expireMemorials({...s,turn:m.due+1});assert.equal(expired.ending?.type,'亡国');assert.match(expired.ending.cause,/京畿/);
 const end=through(s,18);assert.equal(end.ending?.type,'亡国');assert.match(end.ending.cause,/六个月/);
 s=resolveMemorial(s,m.id,m.options[2].id).state;assert.equal(s.memorials.length,0);assert.ok(s.nation.morale<18);
 assert.equal(through(s,17).ending,null);assert.equal(through(s,18).ending?.type,'亡国');
});

test('C0-2 民心或国库恢复即中断连续危机，存取后继续计时且自由模式不亡国',()=>{
 for(const recover of [{morale:18},{treasury:10}]){
  let s=through(critical(),8);Object.assign(s.nation,recover);s=checkCollapse({...s,turn:9});s.nation.morale=0;s.nation.treasury=0;
  s=through(s,17);assert.equal(s.memorials.length,0);s=through(s,18);assert.equal(s.memorials.length,1);
 }
 let s=through(critical(),6);const before=hash(s),stored=migrate(unpack(pack(s)).state);assert.equal(hash(s),before);assert.equal(stored.v,VERSION);
 s=through(stored,9);assert.equal(s.memorials.length,1);assert.equal(s.ending,null);
 s.settings.freedom='free';s=through(s,30);s=expireMemorials({...s,turn:50});assert.notEqual(s.ending?.type,'亡国');
 const base=critical();base.nation.morale=17;base.nation.provinces.forEach(p=>p.morale=17);let recover=through(base,9);const warning=recover.memorials[0];assert.ok(warning);
 recover=resolveMemorial(recover,warning.id,warning.options[2].id).state;assert.ok(recover.nation.morale>=18);recover=checkCollapse(recover);assert.equal(through(recover,25).ending,null);
});

test('C0-3 模拟减赋随机指定一州，批折最多六本且各资源可负担并留八万两',()=>{
 assert.equal(typeof simulation.makeSimulationSchedule,'function');
 const s=initial(),draws=[4,2,7];const before=hash(s),schedule=simulation.makeSimulationSchedule(s,n=>{const value=draws.shift();assert.ok(value<n);return value;});
 assert.equal(schedule.午.edictType,'减赋');assert.equal(schedule.午.province,'z7');assert.equal(hash(s),before);
 s.nation.treasury=18;s.nation.grain=5;s.nation.privy=0;
 s.memorials=Array.from({length:8},(_,i)=>({id:'cost-'+i,options:[{id:'too-silver',effects:{treasury:-20}},{id:'too-grain',effects:{grain:-6}},{id:'too-privy',effects:{privy:-1}},{id:'cost',effects:{treasury:-6}},{id:'free',effects:{}}]}));
 let count=0;const batch=simulation.makeSimulationSchedule(s,n=>count++===0?2:0);assert.equal(batch.朝.kind,'批折');assert.ok(batch.朝.memorials.length<=6);
 const left={treasury:s.nation.treasury,grain:s.nation.grain,privy:s.nation.privy};
 for(const id of batch.朝.memorials){const m=s.memorials.find(m=>m.id===id),o=m.options.find(o=>o.id===batch.朝.decisions[id].option);for(const k of Object.keys(left))left[k]-=Math.max(0,-(o.effects[k]||0));}
 assert.ok(left.treasury>=8);assert.ok(left.grain>=0&&left.privy>=0);
 s.memorials=[{id:'cannot-pay',options:[{id:'too-much',effects:{grain:-10}}]}];count=0;
 const skip=simulation.makeSimulationSchedule(s,n=>count++===0?2:0);assert.ok(!skip.朝||skip.朝.memorials.length===0);
});

test('C0-1 balance保留入寇120至200次硬断言，模拟按真实边警线程计数',()=>{
 const fixture={turns:7200,annual:Array.from({length:200},()=>({closingTreasury:10,openingTreasury:10,income:0,expense:0,resetAdjustment:0})),maxTreasury:100,maxTreasuryFirst50:100,maxTreasuryLast50:100,collapseRate:20,meanChildren:6,eventsPerDecade:Array(20).fill(50)};
 for(const [invasionCount,passed]of [[119,false],[120,true],[200,true],[201,false]])assert.equal(economicChecks({...fixture,invasionCount}).invasions,passed);
 let counted=0;const r=simulation.simulate(2,'C0边警计数',{onForecast:(s,f)=>{counted+=f.state.threads.filter(t=>t.type==='边警'&&t.born===f.state.turn&&!s.threads.some(o=>o.id===t.id)).length;}});
 assert.equal(r.invasionCount,counted);
});
