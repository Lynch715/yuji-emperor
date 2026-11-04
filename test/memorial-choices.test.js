import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {MEMORIAL_TEMPLATES,routineOptions} from '../src/core/memorial-templates.js';
import {applyEffects} from '../src/core/effects.js';
import {auditChanges} from '../src/core/audit.js';
import {resolveMemorial} from '../src/core/events.js';
import {effectItems,effectLabel} from '../src/ui/memorials.js';
const fresh=()=>initialTurn(createState({seed:'奏折实际取舍'}));
function prepare(id){const s=fresh(),z=s.nation.provinces[0];z.disaster=30;const t=MEMORIAL_TEMPLATES.find(t=>t.id===id);const options=routineOptions(t,z,s,'o0');s.memorials=[{id:'choice',templateId:id,title:t.title,type:t.type,provinceId:z.id,options}];return s;}
const choose=(s,index)=>resolveMemorial(s,'choice',s.memorials[0].options[index].id).state;
test('所有例奏都有独立取舍、可见后果，费用和影响不再套用一份效果包',()=>{
 const s=fresh(),z=s.nation.provinces[0],seen=new Set();let free=0,grain=0,military=0,people=0;
 for(const t of MEMORIAL_TEMPLATES){const options=routineOptions(t,z,s,'o0').filter(o=>o.id!=='hold');assert.ok(options.length>=2&&options.length<=3,t.id);assert.ok(options.every(o=>o.consequence&&o.label),t.id);assert.equal(new Set(options.map(o=>JSON.stringify(o.effects))).size,options.length,t.id);
  for(const o of options){seen.add(JSON.stringify(o.effects));if(!o.effects.treasury&&!o.effects.privy)free++;if(o.effects.grain)grain++;if(o.effects.army)military++;if(o.effects.official||o.effects.foreign)people++;}
 }
 assert.ok(seen.size>=100,seen.size);assert.ok(free>=15&&grain>=10&&military>=10&&people>=10);
});
test('退还重税与催缴旧册：真实钱粮和当地民心方向相反，输入状态不变',()=>{
 const s=prepare('tax-register'),before=structuredClone(s),refund=choose(s,0),collect=choose(s,2);
 assert.ok(refund.nation.treasury<s.nation.treasury);assert.ok(refund.nation.provinces[0].morale>s.nation.provinces[0].morale);
 assert.ok(collect.nation.treasury>s.nation.treasury);assert.ok(collect.nation.provinces[0].morale<s.nation.provinces[0].morale);assert.deepEqual(s,before);
});
test('学校借书与抄副本、军营轮休与操练各有不同实效',()=>{
 let s=prepare('school-books'),a=choose(s,0),b=choose(s,1);assert.notEqual(a.nation.treasury,b.nation.treasury);assert.notEqual(a.nation.provinces[0].morale,b.nation.provinces[0].morale);
 s=prepare('army-leave');a=choose(s,0);b=choose(s,1);const id=s.memorials[0].options[0].effects.army.id;
 const readiness=x=>id==='capital'?x.nation.army.capital.readiness:x.nation.army.frontiers.find(f=>f.dir===id).readiness;
 assert.ok(readiness(a)<readiness(s));assert.ok(readiness(b)>readiness(s));assert.ok(a.nation.provinces[0].morale>b.nation.provinces[0].morale);
});
test('赈灾可拨银、开仓、募赈；钱粮不足在实际执行前拒绝，不留下半笔变化',()=>{
 const s=fresh(),z=s.nation.provinces[0];z.disaster=30;s.memorials=[{id:'choice',type:'请赈',title:'赈济',provinceId:z.id,options:routineOptions({id:'disaster-relief:'+z.id,relief:true},z,s,'o0')}];
 const cash=choose(s,0),grain=choose(s,1),donate=choose(s,2);assert.equal(s.nation.treasury-cash.nation.treasury,8);assert.ok(grain.nation.grain<s.nation.grain);assert.ok(donate.nation.provinces[0].disaster>cash.nation.provinces[0].disaster);
 s.nation.grain=0;const before=structuredClone(s);assert.throws(()=>choose(s,1),/粮储|粮食/);assert.deepEqual(s,before);
});
test('外交礼遇动用内帑并改变既有外邦态度，预览可读且小数可比较',()=>{
 const s=prepare('envoy-food'),o=s.memorials[0].options[0],id=o.effects.foreign.id,a=choose(s,0),b=choose(s,1);
 assert.ok(a.nation.privy<s.nation.privy);assert.ok(a.foreign.find(f=>f.id===id).attitude>b.foreign.find(f=>f.id===id).attitude);
 assert.ok(effectItems(o.effects,s).some(f=>f.label.includes('态度')));assert.equal(effectLabel(0.4,''),'+0.4');
});
test('旧v12奏折与待续原样保留，新选项提交幂等且本旬结果写明实际处置',()=>{
 const s=prepare('school-books'),f=forecastTurn(s,{朝:{kind:'批折',memorials:['choice'],decisions:{choice:'approve'}}}),before=JSON.stringify(f),consequence=s.memorials[0].options[0].consequence;s.v=12;s.pending={forecast:structuredClone(f)};s.pending.forecast.state.v=12;
 s.memorials[0].options=[{id:'approve',label:'准奏',effects:{treasury:-2,governance:0.1}},{id:'reject',label:'驳回',effects:{}}];const legacy=structuredClone(s.memorials);
 const old=JSON.stringify(s.pending.forecast),restored=migrate(s);assert.deepEqual(restored.memorials[0].options,legacy[0].options);assert.equal(restored.v,VERSION);assert.equal(JSON.stringify(restored.pending.forecast),old);
 const c=commitTurn(restored,restored.pending.forecast,{});assert.equal(c.rng,f.state.rng);assert.deepEqual(commitTurn(c,f,{}),c);assert.ok(f.slotResults.朝.some(t=>t.includes(consequence)));assert.equal(JSON.stringify(f),before);
});

test('新政策上朝没有隐藏的驳回皇威奖励，小数账目存档往返一致',()=>{
 const s=prepare('school-books'),f=forecastTurn(s,{朝:{kind:'上朝',memorials:['choice'],decisions:{choice:'reject'}}});
 assert.ok(!f.entries.some(e=>e.source==='当廷驳回'));
 const r=applyEffects(s,{prestige:-0.0001},'微小变化');assert.ok(r.entries.length);assert.deepEqual(JSON.parse(JSON.stringify(r)),r);
 const tiny=structuredClone(s);tiny.emperor.prestige-=0.00001;const entries=auditChanges(s,tiny,[]);assert.ok(entries.length);assert.deepEqual(JSON.parse(JSON.stringify(entries)),entries);
});
