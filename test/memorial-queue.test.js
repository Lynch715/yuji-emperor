import test from 'node:test';
import assert from 'node:assert/strict';
import {stage9Fixture} from '../qa/stage9-fixture.js';
import {createMemorialSession,memorialAction,memorialHTML} from '../src/ui/memorials.js';
import {memorialAssignments,availableMemorials,memorialCounts,memorialDecisionLabel,memorialReceivedLabel} from '../src/ui/memorial-state.js';
import {memorialListHTML,mobileNavHTML} from '../src/ui/render.js';
import {actionAvailability} from '../src/ui/view-model.js';
import {forecastTurn,commitTurn,validateSchedule} from '../src/core/turn.js';
import {resolveMemorial} from '../src/core/events.js';
import {mockNarrative} from '../src/llm/validate.js';
import {pack,unpack} from '../src/store/save.js';
function queued(){const s=stage9Fixture(),ids=s.memorials.slice(0,2).map(m=>m.id);s.schedule.朝={kind:'上朝',memorials:ids,decision:'approve',stance:'依旨施行',remark:'勤勉可嘉',label:'2 本奏报'};return {s,ids};}
test('拟批由现有日程推导，待批计数立即扣除，读档后保持一致且不写状态',()=>{
  const {s,ids}=queued(),before=structuredClone(s),owners=memorialAssignments(s);
  assert.equal(owners.get(ids[0]).slot,'朝');assert.deepEqual(memorialCounts(s),{pending:4,queued:2,total:6});
  assert.ok(availableMemorials(s).every(m=>!ids.includes(m.id)));assert.equal(availableMemorials(s,'朝').length,6);
  assert.deepEqual(memorialCounts(unpack(pack(s)).state),memorialCounts(s));assert.deepEqual(s,before);
});
test('新批折自动使用空午间，默认队列不再包含朝间已拟批奏折',()=>{
  const {s,ids}=queued(),session=createMemorialSession(s,'批折','朝',null,{newBatch:true});
  assert.equal(session.slot,'午');assert.equal(session.ids.length,4);assert.ok(session.ids.every(id=>!ids.includes(id)));
  session.ids.forEach(id=>session.choices[id]='reject');const action=memorialAction(s,session);
  assert.doesNotThrow(()=>validateSchedule(s,{...s.schedule,午:action}));
  assert.throws(()=>createMemorialSession(s,'上朝','朝',null,{newBatch:true}),/已有安排/);
});
test('直接把已拟批奏折作为新折打开会被拒绝，重复ID或过期ID也不能入日程',()=>{
  const {s,ids}=queued();assert.throws(()=>createMemorialSession(s,'批折','午',ids[0],{newBatch:true}),/已拟批/);
  const session=createMemorialSession(s,'批折','午',null,{newBatch:true});
  session.ids=[ids[0]];session.choices[ids[0]]='reject';assert.throws(()=>memorialAction(s,session),/重复处置/);
  session.ids=[s.memorials[2].id,s.memorials[2].id];session.choices[s.memorials[2].id]='approve';assert.throws(()=>memorialAction(s,session),/重复处置/);
  session.ids=['already-resolved'];session.choices['already-resolved']='approve';assert.throws(()=>memorialAction(s,session),/已处置/);
});
test('明确编辑原日程保留已有准驳、朱批和时辰，不新增第二份拟批',()=>{
  const {s,ids}=queued(),session=createMemorialSession(s,'上朝','朝');
  assert.equal(session.originalSlot,'朝');assert.deepEqual(session.ids,ids);assert.equal(session.remark,'勤勉可嘉');
  assert.equal(session.choices[ids[0]],'approve');session.choices[ids[0]]='reject';
  const updated={...s,schedule:{...s.schedule,朝:memorialAction(s,session)}};
  assert.deepEqual(memorialCounts(updated),{pending:4,queued:2,total:6});
  assert.equal(memorialAssignments(updated).get(ids[0]).decision,'reject');
});
test('两时辰都拟批后禁止新批折，撤下原安排才释放奏折',()=>{
  const {s}=queued(),session=createMemorialSession(s,'批折','午',null,{newBatch:true});session.ids.forEach(id=>session.choices[id]='approve');s.schedule.午=memorialAction(s,session);
  assert.equal(actionAvailability(s,'上朝'),'本旬均已拟批');assert.equal(actionAvailability(s,'批折'),'本旬均已拟批');
  assert.throws(()=>createMemorialSession(s,'批折','午',null,{newBatch:true}),/已有安排/);
  s.schedule.朝=null;assert.equal(memorialCounts(s).pending,2);assert.equal(actionAvailability(s,'上朝'),'');
});
test('已拟批分组及选折列表有明确状态，其他时辰占用的折子不能再选',()=>{
  const {s,ids}=queued(),html=memorialListHTML(s),session=createMemorialSession(s,'批折','午',null,{newBatch:true});
  assert.match(html,/待批 · 4 本/);assert.match(html,/已拟批 · 2 本/);assert.ok(html.includes('已拟批 · 朝间 · '+s.memorials.find(m=>m.id===ids[0]).options.find(o=>o.id==='approve').label));
  const review=memorialHTML(s,session);assert.match(review,new RegExp('data-review-add="'+ids[0]+'"[^>]*disabled'));
  assert.match(review,/已拟批（朝间）/);
});
test('起驾后准驳真正结案，旧ID不能二次执行，回合重复提交也不再扣款',()=>{
  const {s,ids}=queued(),f=forecastTurn(s,s.schedule),n=commitTurn(s,f,mockNarrative(f));
  assert.ok(ids.every(id=>!n.memorials.some(m=>m.id===id)));assert.equal(n.stats.petitions,s.stats.petitions+ids.length);
  const before=structuredClone(n);assert.throws(()=>resolveMemorial(n,ids[0],'approve'),/已处置/);assert.deepEqual(n,before);
  assert.deepEqual(commitTurn(n,f,mockNarrative(f)),n);assert.equal(memorialCounts(n).queued,0);
});
test('留中、再议、只作朱批按原规则不结案，界面明确区别于准驳',()=>{
  for(const decision of ['hold','discuss','remark']){
    const {s,ids}=queued();s.schedule.朝.memorials=[ids[0]];s.schedule.朝.decision=decision;
    const f=forecastTurn(s,s.schedule),n=commitTurn(s,f,mockNarrative(f));assert.ok(n.memorials.some(m=>m.id===ids[0]),decision);
    assert.equal(memorialCounts(n).queued,0);assert.ok(availableMemorials(n).some(m=>m.id===ids[0]));
    assert.match(memorialDecisionLabel(s.memorials[0],decision),/留中候旨|发部再议|只作朱批/);
  }
});
test('底栏数量独立于标签，密集队列使用99+且不会改变原奏报数量',()=>{
  const {s}=queued();s.memorials=Array.from({length:120},(_,i)=>({...s.memorials[0],id:'many-'+i}));
  const html=mobileNavHTML(s);assert.match(html,/class="nav-count">99\+/);assert.match(html,/class="nav-label">奏报<\/span>/);assert.equal(s.memorials.length,120);
});
test('相同标题的新奏折显示呈入旬次，旧ID与新呈折不混淆',()=>{
  assert.equal(memorialReceivedLabel({id:'routine-5-0'},5),'本旬新呈');
  assert.equal(memorialReceivedLabel({id:'routine-0-0'},5),'第 1 旬呈入');
  assert.equal(memorialReceivedLabel({id:'m-ev-4-20'},5),'第 5 旬呈入');
  assert.equal(memorialReceivedLabel({id:'old-import-custom-id'},5),'');
});
