import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,assertState} from '../src/core/state.js';
import {SCENARIOS,applyScenario} from '../src/core/scenarios.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {SCENARIO_EVENTS} from '../src/core/scenario-event-catalog.js';
import {seedScenarioEvents} from '../src/core/scenario-events.js';
import {resolveMemorial} from '../src/core/events.js';
import {calendarEra} from '../src/core/calendar.js';
const start=id=>initialTurn(applyScenario(createState({seed:'专属事件-'+id}),id));
test('14个预设各有3个固定事件，ID唯一、选项均可执行并保存决定',()=>{
 assert.equal(SCENARIOS.length,14);assert.deepEqual(Object.keys(SCENARIO_EVENTS).sort(),SCENARIOS.map(s=>s.id).sort());
 for(const sc of SCENARIOS){
  let s=start(sc.id);assert.equal(SCENARIO_EVENTS[sc.id].length,3);
  for(const t of [0,6,18]){
   s.turn=t;s=seedScenarioEvents(s);const ms=s.memorials.filter(m=>m.scenarioEvent&&!s.scenarioEvents.decisions[m.scenarioEvent]);
   for(const m of ms){for(const o of m.options)assert.doesNotThrow(()=>assertState(resolveMemorial(s,m.id,o.id).state),sc.id+' '+m.title+' '+o.label);s=resolveMemorial(s,m.id,'opt0').state;}
  }
  assert.equal(new Set(s.scenarioEvents.seen).size,3,sc.id);assert.equal(Object.keys(s.scenarioEvents.decisions).length,3,sc.id);
 }
});
test('固定事件纯函数、同旬重读不重复，不掷新骰；王振被罢后不强推土木结局',()=>{
 let s=start('ming-yingzong');const bytes=JSON.stringify(s),again=seedScenarioEvents(s);assert.equal(JSON.stringify(s),bytes);assert.deepEqual(again,s);
 const m=s.memorials.find(m=>m.scenarioEvent);s=resolveMemorial(s,m.id,'opt1').state;
 const wang=s.court.officials.find(o=>o.name==='王振');wang.post=null;wang.retired=true;for(const p of s.court.posts)if(p.holder===wang.id)p.holder=null;
 s.turn=18;const rng=s.rng;s=seedScenarioEvents(s);assert.equal(s.rng,rng);assert.ok(s.memorials.some(m=>m.title.includes('边军整备复报')));assert.ok(!s.memorials.some(m=>m.title.includes('土木方向')));
});
test('旧v25不追补开局事件，冻结预演原样迁移，继位不重演首帝事件',()=>{
 const old=start('ming-yingzong');old.v=25;delete old.scenarioEvents;delete old.fiat;delete old.era.baseYear;
 old.memorials=old.memorials.filter(m=>!m.scenarioEvent);old.threads=old.threads.filter(t=>!t.scenarioEvent);
 old.pending={forecast:forecastTurn(old)};const raw=JSON.stringify(old.pending.forecast),bytes=JSON.stringify(old);
 const next=migrate(old);assert.equal(JSON.stringify(old),bytes);assert.equal(JSON.stringify(next.pending.forecast),raw);assert.equal(seedScenarioEvents(next).memorials.filter(m=>m.scenarioEvent).length,0);
 const committed=commitTurn(next,next.pending.forecast,{});assertState(committed);assert.deepEqual(commitTurn(committed,next.pending.forecast,{}),committed);
 const successor=start('ming-yingzong');successor.reign.number=2;successor.turn=36;assert.deepEqual(seedScenarioEvents(successor),successor);
});
test('中途开局保持正统十四、天宝十四、嘉庆四，跨年及新朝改元正确',()=>{
 for(const [id,year]of [['ming-yingzong',14],['tang-xuanzong',14],['qing-jiaqing',4]]){
  const s=start(id);assert.equal(s.era.year,year);s.turn=36;assert.equal(calendarEra(s).year,year+1);
  s.reign.eraStartTurn=36;s.reign.eraName='承和';assert.equal(calendarEra(s).year,1);assert.equal(calendarEra(s).baseYear,1);
 }
});
