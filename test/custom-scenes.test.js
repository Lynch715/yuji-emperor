import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,assertState,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn,scheduleCost} from '../src/core/turn.js';
import {resolveScene,forecastScene,commitScene,sceneInput,sceneBlock,sceneBudget} from '../src/core/scenes.js';
import {localIntents,intentInputs} from '../src/llm/intents.js';
import {mockNarrative,validateTurn} from '../src/llm/validate.js';
import {sceneMessages,mockSceneNarrative} from '../src/llm/scenes.js';
import {turnMessages} from '../src/llm/prompts.js';
import {inspectNarrative} from '../src/llm/rewrite.js';
import {requestTurnNarrative} from '../src/ui/turn-request.js';
import {pack,unpack,createSaveStore} from '../src/store/save.js';
import {sceneActionFields,sceneChapterHTML} from '../src/ui/scene-view.js';
import {renderApp} from '../src/ui/render.js';
import {compactChapter} from '../src/core/archive.js';
import {talkAttempt} from '../src/core/court.js';
const fresh=(mode='free',seed='自拟情节')=>initialTurn(createState({seed,freedom:mode,prose:'modern'}));
const action=(text='陪她散步，聊近日心事',people=['c0'])=>({kind:'自拟情节',people,text,place:'御花园'});
const start=(mode='free')=>{const s=fresh(mode),a=action(),f=forecastTurn(s,{夜:a},localIntents(s,intentInputs({夜:a})));return commitTurn(s,f,mockNarrative(f));};
const record=s=>s.history.at(-1).scenes[0];
const step=(s,text='接着写')=>{const r=record(s),input=sceneInput(s,r,text),f=forecastScene(s,r.id,text,localIntents(s,[input]));return {f,next:commitScene(s,f,mockSceneNarrative(s,f))};};
for(const slot of ['朝','午','夜'])test('自拟情节可排'+slot+'，人物多选或独处，输入保留并随提交生成记录',()=>{
 const s=fresh(),a=action('独自作画，排遣心事',[]),before=structuredClone(s),f=forecastTurn(s,{[slot]:a},localIntents(s,intentInputs({[slot]:a})));
 assert.deepEqual(s,before);assert.equal(f.scenes[0].slot,slot);assert.equal(scheduleCost({[slot]:a}),1);
 const next=commitTurn(s,f,mockNarrative(f));assert.equal(record(next).text,a.text);assert.equal(record(next).outcome.status,'success');assert.deepEqual(commitTurn(next,f,{}),next);
 const people=fresh(),pair=action('一起议论近日见闻',['o0','c0']);assert.equal(forecastTurn(people,{[slot]:pair}).scenes[0].people.length,2);
});
test('真实行动只裁决一次：选中人物的代词能解析，成功处死进入事实与名册',()=>{
 const s=fresh(),a=action('将他赐死',['o0']),schedule={朝:a},inputs=intentInputs(schedule),intents=localIntents(s,inputs);
 assert.equal(intents[0].targetId,'o0');const f=forecastTurn(s,schedule,intents),next=commitTurn(s,f,mockNarrative(f));
 assert.equal(next.court.officials.find(o=>o.id==='o0').alive,false);assert.ok(f.facts.some(f=>f.kind==='death'));assert.equal(record(next).results.length,1);
 assert.equal(record(next).outcome.die,record(next).results[0].die);
 const war=action('向他宣战',['w0']),orders=localIntents(s,intentInputs({午:war}));assert.equal(orders[0].type,'war');assert.equal(orders[0].countryId,'w0');
});
test('超额拨款按实际余额截断，故事只允许真实扣款数字',()=>{
 const s=fresh();s.nation.treasury=8;const a=action('拨银一千万两修河',['o1']),schedule={午:a},f=forecastTurn(s,schedule,localIntents(s,intentInputs(schedule)));
 const r=f.scenes[0].results[0];assert.equal(r.actual.amount,f.entries.filter(e=>e.source==='口谕调拨'&&e.path==='nation.treasury').reduce((n,e)=>n-e.delta,0));assert.ok(r.actual.amount<=8);
 assert.equal(validateTurn({chapter:{朝:'',夜:'',午:'户部已拨一千万两。'}},f).chapter.午,'');
});
test('三档叙事目标沿用概率公式及一般档第二次部分成功判定',()=>{
 const counts={};for(const mode of ['free','mid','real']){const c={success:0,partial:0,failed:0};for(let i=0;i<500;i++){
  const s=fresh(mode,'情节概率-'+i);s.emperor.talents.魅力=19;
  const r=resolveScene(s,action('希望完成心中所想',[]),[],'朝','prob');c[r.record.outcome.status]++;
  if(r.record.outcome.status==='partial')assert.ok(r.record.outcome.cost);
 }counts[mode]=c;}
 assert.equal(counts.free.success,500);assert.ok(Math.abs(counts.real.success/500-0.2)<0.07);
 assert.ok(Math.abs(counts.mid.success/500-0.6)<0.07);assert.ok(Math.abs((counts.mid.success+counts.mid.partial)/500-0.8)<0.07);
 console.log('自拟情节500组种子',JSON.stringify(counts));
});
test('单纯接着写沿用结果，不多耗精力、不推进时间、不重掷，追加文字留下记录',()=>{
 const s=start('real'),before=structuredClone(s),{f,next}=step(s);
 assert.deepEqual(s,before);assert.equal(f.state.rng,s.rng);assert.equal(next.rng,s.rng);assert.equal(next.turn,s.turn);assert.equal(next.day,s.day);assert.deepEqual(next.era,s.era);
 assert.equal(next.emperor.health,s.emperor.health);assert.equal(next.revision,s.revision+1);assert.equal(record(next).steps.length,1);assert.equal(record(next).steps[0].outcome.status,record(s).outcome.status);
 assert.deepEqual(commitScene(next,f,{}),next);assert.equal(record(s).steps.length,0);
});
test('新的情节尝试重新按档位判定，原有判定不被推翻',()=>{
 const s=start('free'),r=record(s),f=forecastScene(s,r.id,'再试着解开她的心结');assert.notEqual(f.state.rng,s.rng);assert.equal(f.outcome.status,'success');assert.deepEqual(record(s).outcome,r.outcome);
});
test('重复拨款不重掷不重复扣款，明确追加才另扣，并且下一旬不再重述为新结果',()=>{
 let s=start();const run=text=>{const r=record(s),input=sceneInput(s,r,text),f=forecastScene(s,r.id,text,localIntents(s,[input]));s=commitScene(s,f,mockSceneNarrative(s,f));return f;};
 run('拨银五万两给内帑');const money=s.nation.treasury,privy=s.nation.privy,rng=s.rng;
 const reused=run('拨银五万两给内帑');assert.equal(reused.results[0].reused,true);assert.equal(s.nation.treasury,money);assert.equal(s.nation.privy,privy);assert.equal(s.rng,rng);
 run('再拨银五万两给内帑');assert.equal(s.nation.treasury,money-5);
 assert.ok(!forecastTurn(s).facts.some(f=>f.kind==='allocation'));assert.equal(record(s).steps.length,3);
});
test('失败续写本地删句且不额外请求',async()=>{
 const s=start('real'),f=step(s).f;f.outcome.status='failed';f.facts=[{kind:'scene_result',slot:f.slot,status:'failed'}];
 const bad={chapter:{朝:'',午:'',夜:'',[f.slot]:'她终于被成功说服。廊下的风声渐轻。'}},inspection=inspectNarrative(bad,f);assert.ok(inspection.violations.some(v=>v.reason.includes('未能如愿')));
 let calls=0;const budget={used:0},reply=x=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(x)}}]}),{headers:{'Content-Type':'application/json'}});
 const n=await requestTurnNarrative({provider:'custom',base:'https://test.invalid',key:'x',model:'x'},s,f,{messages:sceneMessages(s,f),sceneSlot:f.slot,budget,fetcher:async()=>reply(++calls===1?bad:{rewrites:[{id:'v0',text:'她尚有顾虑，未被说服。'}]}),sleep:async()=>{}});
 assert.equal(calls,1);assert.equal(budget.rewriteAttempted,undefined);assert.ok(n.chapter[f.slot].includes('廊下的风声渐轻')); assert.ok(!n.chapter[f.slot].includes('成功说服'));
});
test('孕产与未成年侍寝不由自拟情节放行，露骨句照常替换',()=>{
 const s=fresh();s.emperor.age=17;assert.match(sceneBlock(s,action('安排侍寝')),/不能/);assert.match(sceneBlock(s,action('不如今晚侍寝')),/不能/);assert.match(sceneBlock(s,action('发生性行为')),/不能/);assert.equal(sceneBlock(s,action('不要侍寝，只聊天')),'');
 s.emperor.age=25;s.harem.consorts[0].age=17;assert.match(sceneBlock(s,action('今晚同寝')),/不能/);
 s.harem.consorts[0].age=25;s.harem.consorts[0].preg={conceived:0,due:30};assert.match(sceneBlock(s,action('安排侍寝')),/不能/);assert.match(sceneBlock(s,action('不如今晚侍寝')),/不能/);assert.match(sceneBlock(s,action('发生性行为')),/不能/);
 const f=forecastTurn(fresh(),{夜:action()});assert.equal(validateTurn({chapter:{朝:'',午:'',夜:'陆令仪已怀孕。'}},f).chapter.夜,'');assert.match(validateTurn({chapter:{朝:'',午:'',夜:'他脱去衣衫，露出裸体。'}},f).chapter.夜,/宫帘/);
});
test('未知ID、重复人选、空梗概拒绝；摄政仍不能借此任免',()=>{
 const s=fresh();for(const a of [action('散步',['fake']),action('散步',['o0','o0']),action('')])assert.throws(()=>forecastTurn(s,{夜:a}));
 s.regency={regentId:'o0',until:30};const a=action('将他赐死',['o1']),f=forecastTurn(s,{朝:a},localIntents(s,intentInputs({朝:a})));
 assert.equal(f.scenes[0].results[0].status,'failed');assert.equal(f.state.court.officials.find(o=>o.id==='o1').alive,true);
});
test('待续保存、压缩恢复及失败重试保留原骰和裁决，不写另一份进度',()=>{
 const s=start(),f=step(s,'安慰她，试着解开心结').f,pending={...s,pending:{kind:'scene',forecast:f},turnBudget:{used:1}};
 const loaded=migrate(unpack(pack(pending)).state);assert.equal(JSON.stringify(loaded.pending.forecast),JSON.stringify(f));assert.equal(loaded.turnBudget.used,1);
 assert.deepEqual(commitScene(loaded,loaded.pending.forecast,mockSceneNarrative(loaded,f)).rng,f.state.rng);
 for(const change of [x=>x.runId='another',x=>x.turn++,x=>x.revision++,x=>x.rng++]){const stale=structuredClone(s);change(stale);assert.throws(()=>commitScene(stale,f,mockSceneNarrative(s,f)),/过期/);}
 const wrong=structuredClone(f);wrong.state.runId='another';assert.throws(()=>commitScene(s,wrong,mockSceneNarrative(s,f)),/过期/);
});
test('新回合后不能续写旧情节，过去的记录仍可阅读，开始下旬面谈也关闭旧场',()=>{
 const s=start(),id=record(s).id,n=commitTurn(s,forecastTurn(s),mockNarrative(forecastTurn(s)));
 assert.throws(()=>forecastScene(n,id,'继续'));assert.throws(()=>forecastScene(talkAttempt(s,'o0','近况').state,id,'继续'));
 assert.ok(sceneChapterHTML(s.history.at(-1),'夜',false).includes('御花园'));assert.ok(!sceneChapterHTML(s.history.at(-1),'夜',false).includes('data-scene'));
});
test('v17旧待续不重建，新场景损坏拒读且原始存档不覆盖',async()=>{
 const old=fresh();old.v=17;const f=forecastTurn(old);f.state.v=17;old.pending={forecast:f};const bytes=JSON.stringify(old.pending.forecast),up=migrate(old);assert.equal(up.v,VERSION);assert.equal(JSON.stringify(up.pending.forecast),bytes);
 const missing=start();delete record(missing).results;assert.throws(()=>migrate(missing),/情节/);
 const s=start();record(s).steps=[{id:'bad',sequence:1}];assert.throws(()=>migrate(s),/情节/);
 const raw=pack(s),p=new Map([[1,raw]]),store=createSaveStore({primary:{get:async k=>p.get(k),put:async(k,v)=>p.set(k,v)},backup:{getItem:()=>null,setItem(){}},validate:migrate});
 const read=await store.load(1);assert.equal(read.readOnly,true);assert.deepEqual(p.get(1),raw);
});
test('档案压缩与JSON导出保留续写；人物后续提示词能看到共同经历，表单和正文转义',()=>{
 let s=step(start()).next;const h=s.history.at(-1);assert.deepEqual(compactChapter(h).scenes,h.scenes);assert.deepEqual(unpack(pack(s)).state.history.at(-1).scenes,h.scenes);
 assert.ok(turnMessages(s,forecastTurn(s)).at(-1).content.includes('共同经历'));
 assert.match(renderApp(s),/data-scene/);assert.match(sceneActionFields(s),/name="scene-person"/);
 const html=sceneChapterHTML({...h,scenes:[{...record(s),place:'<script>坏</script>'}]},'夜',true);assert.ok(!html.includes('<script>'));
 assert.doesNotThrow(()=>assertState(s));
});
test('真实双通道保存：恢复副本保留当前情节，接口失败后刷新不误报损坏',async()=>{
 const p=new Map(),b=new Map(),io={primary:{get:async k=>p.get(k),put:async(k,v)=>p.set(k,structuredClone(v))},backup:{getItem:k=>b.get(k),setItem:(k,v)=>b.set(k,v)},validate:migrate};
 const s=start(),f=step(s,'希望她说出新的顾虑').f,pending={...s,pending:{kind:'scene',forecast:f},turnBudget:{used:1}};
 await createSaveStore(io).save(1,pending);const loaded=await createSaveStore(io).load(1);assert.equal(loaded.readOnly,false,JSON.stringify(loaded.problems));assert.equal(loaded.state.pending.forecast.state.rng,f.state.rng);
 p.clear();const recovered=await createSaveStore(io).load(1);assert.equal(recovered.readOnly,false,JSON.stringify(recovered.problems));assert.equal(record(recovered.state).id,record(s).id);
 const next=commitScene(recovered.state,recovered.state.pending.forecast,mockSceneNarrative(recovered.state,f));assert.equal(record(next).steps.length,1);assert.equal(next.rng,f.state.rng);
});
test('已完成情节也保留在恢复副本中，主库缺失后仍可接着写',async()=>{
 const p=new Map(),b=new Map(),io={primary:{get:async k=>p.get(k),put:async(k,v)=>p.set(k,v)},backup:{getItem:k=>b.get(k),setItem:(k,v)=>b.set(k,v)},validate:migrate};
 const s=step(start()).next;await createSaveStore(io).save(1,s);p.clear();const loaded=await createSaveStore(io).load(1);assert.equal(loaded.readOnly,false);assert.equal(record(loaded.state).steps.length,1);assert.doesNotThrow(()=>step(loaded.state));
});
test('同一章接着写不重置A9好感额度，原场嘉奖与后续追加合计仍受限',()=>{
 const s=fresh(),a=action('嘉奖沈守正',['o0']),f=forecastTurn(s,{夜:a},localIntents(s,intentInputs({夜:a}))),n=commitTurn(s,f,mockNarrative(f));
 const before=n.court.officials[0].favor,input=sceneInput(n,record(n),'追加嘉奖沈守正'),g=forecastScene(n,record(n).id,input.text,localIntents(n,[input]));
 assert.equal(g.results[0].actual.amount,0);assert.equal(g.state.court.officials[0].favor,before);
});
test('原场模型人物反应也计入续写好感额度，不借续写再次加满',()=>{
 const s=fresh(),f=forecastTurn(s,{夜:action('与沈守正谈心',['o0'])}),narrative=mockNarrative(f);narrative.reactions=[{id:'o0',favorDelta:5}];
 const n=commitTurn(s,f,narrative),input=sceneInput(n,record(n),'嘉奖沈守正'),g=forecastScene(n,record(n).id,input.text,localIntents(n,[input]));assert.equal(g.results[0].actual.amount,0);
});

test('旧章改写标记保留，续写使用本地校验',async()=>{
 const base=fresh(),first=forecastTurn(base,{夜:action()}),s=commitTurn({...base,turnBudget:{used:2,rewriteAttempted:true}},first,mockNarrative(first));
 assert.equal(s.history.at(-1).rewriteAttempted,true);const budget=sceneBudget(s);assert.equal(budget.rewriteAttempted,true);
 const f=step(s).f;f.state.settings.freedom='real';f.facts=[{kind:'scene_result',slot:f.slot,status:'failed'}];let calls=0;
 const n=await requestTurnNarrative({provider:'custom',base:'https://test.invalid',key:'x',model:'x'},s,f,{messages:sceneMessages(s,f),sceneSlot:f.slot,budget,fetcher:async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({chapter:{朝:'',午:'',夜:'她已成功说服众人。廊下的风渐渐停了。'}})}}]}),{headers:{'Content-Type':'application/json'}});},sleep:async()=>{}});
 assert.equal(calls,1);assert.equal(n.chapter.夜,'廊下的风渐渐停了。');
});
test('续写中首次尝试改写后，标记随本章保存并传给下一段',()=>{
 const s=start(),f=step(s).f,next=commitScene({...s,turnBudget:{used:2,rewriteAttempted:true}},f,mockSceneNarrative(s,f));assert.equal(sceneBudget(next).rewriteAttempted,true);assert.doesNotThrow(()=>migrate(unpack(pack(next)).state));
});
test('42旬三时段情节与续写跨分卷保留，旧场自动结束且JSON可再读',()=>{
 let s=fresh();for(let turn=0;turn<42;turn++){
  const schedule=Object.fromEntries(['朝','午','夜'].map(slot=>[slot,action('一起聊近日见闻',['c0'])])),f=forecastTurn(s,schedule);s=commitTurn(s,f,mockNarrative(f));s=step(s).next;
 }
 assert.equal(s.turn,42);assert.ok(s.volumes.length>0);const all=[...s.volumes.flatMap(v=>v.chapters),...s.history];assert.equal(all.length,42);assert.equal(all.flatMap(h=>h.scenes).length,126);assert.equal(all.flatMap(h=>h.scenes).flatMap(r=>r.steps).length,42);
 assert.doesNotThrow(()=>assertState(migrate(unpack(pack(s)).state)));assert.throws(()=>forecastScene(s,all[0].scenes[0].id,'接着写'));
});
