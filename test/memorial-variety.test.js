import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {seedMemorials,pickMemorialist} from '../src/core/events.js';
import {MEMORIAL_TEMPLATES,memorialText,routineOptions} from '../src/core/memorial-templates.js';
import {diplomacy} from '../src/core/foreign.js';
import {mockNarrative} from '../src/llm/validate.js';
import {turnMessages,memorialMessages} from '../src/llm/prompts.js';
// Legacy corpus stays executable for received v22 petitions and frozen forecasts.
const fresh=()=>{const s=createState({seed:'奏折轮换验收',demo:true});s.v=22;delete s.briefings;return initialTurn(s);};
test('旧奏折兼容：短期覆盖各类，单批不重复、未批同题不重发、正文不套同一模板',()=>{
 let s=fresh();const seen=new Set(),types=new Set(),texts=new Set();
 for(let turn=1;turn<=36;turn++){
  s.turn=turn;s.memorials=s.memorials.filter(m=>m.due>=turn);
  const before=new Set(s.memorials.map(m=>m.templateId)),oldIds=new Set(s.memorials.map(m=>m.id));s=seedMemorials(s);
  const added=s.memorials.filter(m=>!oldIds.has(m.id));assert.equal(new Set(added.map(m=>m.type)).size,added.length);
  for(const m of added){assert.ok(!before.has(m.templateId),m.templateId);seen.add(m.templateId);types.add(m.type);texts.add(m.text);assert.ok(m.text.includes(m.request));assert.deepEqual({from:m.from,fromId:m.fromId,fromPost:m.fromPost,fromRole:m.fromRole},pickMemorialist(s,m.type,m.provinceId));}
  assert.ok(added.every(m=>m.text.length>=140&&m.text.split('\n\n').length===3),'奏折须有详情与分段');
 }
 assert.ok(seen.size>=65,'题目覆盖 '+seen.size);assert.ok(types.size>=22,'类型覆盖 '+types.size);assert.ok(texts.size>=100,'正文覆盖 '+texts.size);
 assert.ok(s.memorialVariety.length<=72);
});
test('旧奏折兼容：抽取可复现、不改输入，饥荒与战事只在对应国势出现',()=>{
 let s=fresh();s.memorials=[];const before=structuredClone(s),a=seedMemorials(s),b=seedMemorials(s);assert.deepEqual(a,b);assert.deepEqual(s,before);
 const expected=new Set(MEMORIAL_TEMPLATES.filter(t=>t.when(s)).map(t=>t.type)),seen=new Set();
 for(let i=0;i<72;i++){s.turn=i;s.memorials=[];s=seedMemorials(s);s.memorials.forEach(m=>{seen.add(m.type);assert.notEqual(m.type,'请赈');assert.notEqual(m.type,'战事');});}
 for(const type of expected)assert.ok(seen.has(type),type);
 s.nation.provinces[0].disaster=50;s.nation.grain=0;let relief=false,shortage=false;
 for(let i=72;i<108;i++){s.turn=i;s.memorials=[];s=seedMemorials(s);for(const m of s.memorials){if(m.type==='请赈'){relief=true;assert.ok(s.nation.provinces.find(p=>p.id===m.provinceId).disaster>0);}if(m.templateId==='grain-shortage')shortage=true;assert.ok(!/晾晒|漕运耗粮|仓斛/.test(m.title));}}
 assert.ok(relief&&shortage);
 s=diplomacy(fresh(),{country:'w0',operation:'宣战'},20).state;let war=false;
 for(let i=0;i<24;i++){s.turn=i;s.memorials=[];s=seedMemorials(s);war ||= s.memorials.some(m=>m.type==='战事');}assert.ok(war);
});
test('旧奏折兼容：试读及正文接口携带具体事务、选择与已有文本，旧档补轮换记录且旧预演不动',()=>{
 const s=fresh(),f=forecastTurn(s),n=mockNarrative(f);assert.ok(n.memorialTexts.every(m=>m.text===f.newMemorials.find(x=>x.id===m.id).text));
 assert.doesNotMatch(turnMessages(s,f)[0].content,/memorialTexts/);
 const prompt=memorialMessages(f.state,f.newMemorials).map(m=>m.content).join('\n');assert.match(prompt,/160–260字/);for(const m of f.newMemorials){assert.ok(prompt.includes(m.request));assert.ok(prompt.includes(m.options[0].label));}
 for(const t of MEMORIAL_TEMPLATES){const text=memorialText({...t,title:'江南 '+t.title,provinceId:'z2',options:routineOptions(t,{id:'z2'})},true);assert.ok(text.length>=160&&text.length<=260,t.id);}
 const old=structuredClone(s);old.v=11;delete old.memorialVariety;old.pending={forecast:structuredClone(f)};old.pending.forecast.state.v=11;delete old.pending.forecast.state.memorialVariety;
 const raw=JSON.stringify(old.pending.forecast),restored=migrate(old);assert.equal(restored.v,VERSION);assert.ok(Array.isArray(restored.memorialVariety));assert.equal(JSON.stringify(restored.pending.forecast),raw);
 const c=commitTurn(restored,restored.pending.forecast,n);assert.ok(Array.isArray(c.memorialVariety));assert.equal(c.rng,f.state.rng);
 const broken=fresh();broken.memorialVariety={};assert.throws(()=>migrate(broken),/奏折轮换/);
});
