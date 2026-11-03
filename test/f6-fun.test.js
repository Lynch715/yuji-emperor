import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {mockNarrative,validateTurn} from '../src/llm/validate.js';
import {systemPrompt} from '../src/llm/prompts.js';
import {chapterHTML} from '../src/ui/render.js';
import {delegateSchedule,delegateStop} from '../src/ui/view-model.js';

const fresh=()=>initialTurn(createState({seed:'f6'}));
test('F6 委政：内阁依票拟批非急报、夜间歇息，日程合法；有急报则不可委政',()=>{
  const s=fresh();s.memorials.forEach(m=>m.urgent=false);
  const {schedule}=delegateSchedule(s);
  assert.equal(schedule.朝.kind,'批折');assert.ok(schedule.朝.memorials.length>0&&schedule.朝.memorials.length<=6);assert.equal(schedule.夜.kind,'歇息');
  for(const id of schedule.朝.memorials)assert.notEqual(schedule.朝.decisions[id].option,'hold');
  s.memorials[0].urgent=true;assert.equal(delegateSchedule(s).schedule,null);assert.match(delegateSchedule(s).reason,/急报/);
});
test('F6 委政连推若干旬，遇大事停止；推进与手动落账走同一引擎',()=>{
  let s=fresh(),turns=0,stop='';
  for(;turns<60;turns++){
    s.memorials.forEach(m=>m.urgent=false);
    const {schedule}=delegateSchedule(s);if(!schedule)break;
    const f=forecastTurn({...s,schedule},schedule);s=commitTurn(s,f,mockNarrative(f));
    stop=delegateStop(s);if(stop&&stop!=='急报呈至')break;
  }
  assert.ok(turns>0);
  const fake={...s,history:[...s.history,{settlement:{facts:[{kind:'death'}]}}]};assert.equal(delegateStop(fake),'有人亡故');
});
test('F6 章末伏笔：提示词要求未定语气；断言性伏笔被删；有伏笔时显示在章末',()=>{
  assert.match(systemPrompt(fresh()),/"hook":""/);
  const s=fresh(),f=forecastTurn(s,{朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}}),n=s.court.officials[0].name;
  const ok=validateTurn({chapter:{朝:'晨钟。',午:'',夜:''},hook:'河工恐将延误，未知下旬如何。'},f);assert.equal(ok.hook,'河工恐将延误，未知下旬如何。');
  const bad=validateTurn({chapter:{朝:'晨钟。',午:'',夜:''},hook:n+'下旬病故。'},f);assert.equal(bad.hook,'');
  const c=commitTurn(s,f,{...mockNarrative(f),hook:'河工恐将延误。'});
  assert.equal(c.history.at(-1).hook,'河工恐将延误。');assert.match(chapterHTML(c.history.at(-1)),/chapter-hook/);
});
