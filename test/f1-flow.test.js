import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn,validateSchedule} from '../src/core/turn.js';
import {cabinetDraft} from '../src/core/court.js';
import {actionMeta,repeatSchedule} from '../src/ui/view-model.js';
import {applyCabinetDrafts,createMemorialSession} from '../src/ui/memorials.js';

const fresh=()=>initialTurn(createState({seed:'f1-flow'}));
test('F1-L1 上朝与批折在行动卡上写明差别',()=>{
  assert.match(actionMeta('上朝'),/廷议/);assert.match(actionMeta('批折'),/不经廷议/);
});
test('F1-L2 票拟：首辅给出付得起的非留中选项，不改状态',()=>{
  const s=fresh(),before=JSON.stringify(s);
  for(const m of s.memorials){const d=cabinetDraft(s,m);assert.ok(d,'每本应有票拟');assert.notEqual(d.option,'hold');assert.ok(m.options.some(o=>o.id===d.option));}
  assert.equal(JSON.stringify(s),before);
  const poor={...s,nation:{...s.nation,treasury:0,privy:0,grain:0}};
  for(const m of poor.memorials){const d=cabinetDraft(poor,m);if(d){const o=m.options.find(o=>o.id===d.option);for(const k of ['treasury','privy','grain'])assert.ok(-(o.effects?.[k]||0)<=0,'国库为零时不得票拟花钱选项');}}
});
test('F1-L2 未批者依票拟只填非急报，填后可生成合法日程',()=>{
  const s=fresh();s.memorials[0].urgent=true;
  const session=createMemorialSession(s,'批折','朝');
  const n=applyCabinetDrafts(s,session);
  assert.equal(session.choices[s.memorials[0].id],undefined,'急报不得自动处理');
  assert.equal(n,session.ids.filter(id=>!s.memorials.find(m=>m.id===id).urgent).length);
});
test('F1-L3 沿用上旬只保留可重复且本旬合规的行动',()=>{
  const s=fresh();
  const last={朝:{kind:'批折',memorials:['x']},午:{kind:'歇息'},夜:{kind:'后宫',person:s.harem.consorts[0]?.id}};
  const next=repeatSchedule(s,last);
  assert.equal(next.朝,null);assert.equal(next.午?.kind,'歇息');
  validateSchedule(s,next);
  assert.deepEqual(repeatSchedule(s,null),{朝:null,午:null,夜:null});
});
