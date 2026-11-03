import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn} from '../src/core/turn.js';
import * as sim from '../scripts/simulate.mjs';
import * as balance from '../scripts/stage8-1-balance.mjs';

test('C1 验收口径 四类策略按同一规则选件，尽职与贪心先急后到期且不改原匣',()=>{
 const s=initialTurn(createState({seed:'四类策略'}));
 s.memorials=[['ordinary',false,1],['urgent-late',true,4],['urgent-first',true,2],['ordinary-next',false,3]].map(([id,urgent,due])=>({id,urgent,due,options:[{id:'approve',effects:{treasury:-1}},{id:'reject',effects:{}}]}));
 const before=JSON.stringify(s);
 assert.deepEqual(Object.keys(sim.SIMULATION_STRATEGIES),['rest','random','diligent','greedy']);
 const run=strategy=>sim.makeSimulationSchedule(s,()=>0,strategy);
 assert.deepEqual(run('random').朝.memorials,['ordinary','urgent-late','urgent-first']);
 assert.deepEqual(run('diligent').朝.memorials,['urgent-first','urgent-late','ordinary']);
 assert.deepEqual(run('greedy').朝.memorials,['urgent-first','urgent-late','ordinary']);
 assert.ok(Object.values(run('greedy').朝.decisions).every(v=>v.option==='approve'));
 assert.ok(Object.values(run('rest')).every(a=>a.kind==='歇息'));
 assert.equal(JSON.stringify(s),before);
 assert.throws(()=>sim.makeSimulationSchedule(s,()=>0,'seed-special'),/策略/);
});

test('C1 验收口径 贪心每旬准奏急件前三本，尽职保留八分支与可负担性',()=>{
 const s=initialTurn(createState({seed:'策略不按种子'}));
 const greedy=sim.makeSimulationSchedule(s,()=>7,'greedy');assert.equal(greedy.朝.kind,'上朝');
 assert.ok(greedy.朝.memorials.length<=3);
 const idle=sim.makeSimulationSchedule(s,()=>6,'diligent');assert.equal(idle.朝,null);
 const a=sim.simulate(1,'策略指标',{strategy:'diligent'}),b=sim.simulate(1,'策略指标',{strategy:'diligent'});
 assert.deepEqual(a,b);assert.equal(a.sampleTurns,36);
 assert.ok(a.saturationRatio>=0&&a.saturationRatio<=1);
 assert.deepEqual(Object.keys(a.nationalStddev),['morale','governance','virtue','prestige']);
});

test('C1 验收口径 绝对亡国率只观察，乱批不优于尽职且饱和与波动门槛保留',()=>{
 const fixture={strategy:'diligent',collapseRate:20,saturationRatio:0.1,nationalStddev:{morale:5,governance:5,virtue:5,prestige:5},strongmanTurns:1,turns:7200};
 assert.equal(typeof balance.strategyChecks,'function');
 assert.ok(Object.values(balance.strategyChecks(fixture)).every(Boolean));
 assert.equal(Object.hasOwn(balance.strategyChecks(fixture),'mortality'),false);
 assert.ok(Object.values(balance.strategyChecks({...fixture,collapseRate:0})).every(Boolean));
 assert.ok(Object.values(balance.strategyChecks({...fixture,strategy:'greedy',collapseRate:15,saturationRatio:0.149})).every(Boolean));
 assert.equal(balance.strategyChecks({...fixture,strategy:'greedy',saturationRatio:0.15}).saturation,false);
 assert.ok(Object.values(balance.strategyChecks({...fixture,strategy:'greedy',collapseRate:80})).every(Boolean));
 assert.equal(balance.strategyChecks({...fixture,nationalStddev:{...fixture.nationalStddev,virtue:4.99}}).variation,false);
 assert.equal(balance.strategyChecks({...fixture,strategy:'random',collapseRate:19},fixture).mortalityComparison,false);
 assert.equal(balance.strategyChecks({...fixture,strategy:'random',collapseRate:20},fixture).mortalityComparison,true);
 assert.equal(balance.strategyChecks({...fixture,strategy:'random',strongmanTurns:0},fixture).strongman,false);
});

test('C1 验收口径 无为也统计完整200年和前20年波动，15年门槛检查第一次亡国',()=>{
 assert.equal(balance.strategyChecks({strategy:'rest',turns:7200,firstCollapseTurn:540}).collapseWithin15Years,true);
 assert.equal(balance.strategyChecks({strategy:'rest',turns:7200,firstCollapseTurn:541}).collapseWithin15Years,false);
 assert.equal(balance.strategyChecks({strategy:'rest',turns:7200,firstCollapseTurn:null}).collapseWithin15Years,false);
});
