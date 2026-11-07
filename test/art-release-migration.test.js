import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {applyScenario} from '../src/core/scenarios.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {pack,createSaveStore} from '../src/store/save.js';
const rest={朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}};
const people=s=>[s.emperor,...s.court.officials,...s.harem.consorts,...s.harem.candidates,...s.harem.children,...s.harem.royalWomen,...s.foreign];
const open=()=>initialTurn(applyScenario(createState({seed:'两类v24兼容'}),'ming-wanli'));
function mainV24(s){s.v=24;delete s.faceCounters;for(const p of people(s))delete p.faceNo;return s;}
function artV24(s){s.v=24;delete s.dowagerFaction;if(s.regency)delete s.regency.growth;return s;}
function frozen(s,shape){const f=forecastTurn(s,rest);shape(s);shape(f.state);s.pending={forecast:f};return f;}
function assertFrozenCommit(s,f){
 const bytes=JSON.stringify(s),pending=JSON.stringify(s.pending),next=migrate(s);
 assert.equal(VERSION,25);assert.equal(next.v,25);assert.equal(JSON.stringify(s),bytes);assert.equal(JSON.stringify(next.pending),pending);
 assert.ok(people(next).every(p=>Number.isSafeInteger(p.faceNo)));
 const done=commitTurn(next,next.pending.forecast,{});
 assert.equal(done.v,25);assert.equal(done.lastTurn.die,f.die);assert.equal(done.rng,f.state.rng);
 assert.deepEqual(done.nation,f.state.nation);assert.deepEqual(done.emperor.talents,f.state.emperor.talents);
 assert.deepEqual(commitTurn(done,f,{}),done);return next;
}
test('发布v24摄政旧档升v25只补脸号，成长基准和冻结待续原骰保持',()=>{
 const s=open(),f=frozen(s,mainV24),growth=structuredClone(s.regency.growth),next=assertFrozenCommit(s,f);
 assert.deepEqual(next.regency.growth,growth);assert.equal(next.dowagerFaction,s.dowagerFaction);
});
test('美术预览v24升v25保留原脸号和五才，缺失摄政基准从当前值补齐',()=>{
 const s=open(),f=frozen(s,artV24),faces=people(s).map(p=>p.faceNo),counters=structuredClone(s.faceCounters),next=assertFrozenCommit(s,f);
 assert.deepEqual(people(next).map(p=>p.faceNo),faces);assert.deepEqual(next.faceCounters,counters);
 assert.deepEqual(next.emperor.talents,s.emperor.talents);assert.equal(next.regency.growth.age,s.emperor.age);
 assert.equal(next.regency.growth.education,s.harem.children.find(p=>p.id===s.reign.emperorId)?.education||0);assert.ok(Object.hasOwn(next,'dowagerFaction'));
});
test('真正损坏的主线v24不能按美术预览放行，读取保持只读且不写原档',async()=>{
 for(const key of ['growth','faction']){
  const s=mainV24(open());if(key==='growth')delete s.regency.growth;else delete s.dowagerFaction;
  const raw=pack(s);let writes=0;
  const store=createSaveStore({primary:{get:async()=>raw,put:async()=>writes++},backup:{getItem:()=>JSON.stringify(raw),setItem:()=>writes++},validate:migrate});
  const loaded=await store.load(1);assert.equal(loaded.readOnly,true);assert.equal(writes,0);
 }
});
