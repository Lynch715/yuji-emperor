import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate} from '../src/core/state.js';
import {initialTurn,forecastTurn} from '../src/core/turn.js';
import {requestTurnNarrative} from '../src/ui/turn-request.js';
import {inspectNarrative,applySentenceRewrites} from '../src/llm/rewrite.js';
import {pack,unpack} from '../src/store/save.js';
const config={base:'https://rewrite.example.test',model:'test',key:'test'};
const fixture=()=>{const state=initialTurn(createState({seed:'一次改写'}));state.turn=2;state.day=20;state.era.xun=2;const forecast=forecastTurn(state);return {state,forecast};};
const bad=()=>({chapter:{朝:'殿门缓缓打开。拨银九亿两。',午:'臣尚未开口。',夜:'夜色渐深。'},summary:'宫中一旬'});
const json=data=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{headers:{'Content-Type':'application/json'}});
test('第四步 收集正文与附文全部违规句和原因，按ID只替换指定句子',()=>{
 const {forecast}=fixture(),data=bad();data.chapter.午+='赐死'+forecast.state.court.officials[0].name+'。';data.summary='拨银八亿两。';data.memorialTexts=[{id:forecast.newMemorials[0].id,text:'折纸完好。拨银七亿两。'}];
 const before=structuredClone(data),r=inspectNarrative(data,forecast);assert.equal(r.violations.length,4);assert.ok(r.violations.every(v=>v.reason&&v.sentence));assert.deepEqual(data,before);
 const patched=applySentenceRewrites(data,r.violations,{rewrites:r.violations.map(v=>({id:v.id,text:'臣请另议。'})),chapter:{朝:'劫持未违规正文'}});
 assert.ok(patched.chapter.朝.startsWith('殿门缓缓打开。'));assert.equal(patched.chapter.夜,data.chapter.夜);assert.equal(patched.summary,'臣请另议。');assert.ok(patched.memorialTexts[0].text.startsWith('折纸完好。'));assert.deepEqual(data,before);
});
test('软违规只本地删句，不请求改写或保存旧改写标记',async()=>{
 const {state,forecast}=fixture(),before=structuredClone(forecast),budget={used:0};let calls=0;
 const result=await requestTurnNarrative(config,state,forecast,{budget,onBeforeRewrite:()=>assert.fail('不应请求改写'),fetcher:async()=>{calls++;return json(bad());}});
 assert.equal(calls,1);assert.equal(budget.used,1);assert.equal(result.chapter.朝,'殿门缓缓打开。');assert.equal(result.chapter.夜,'夜色渐深。');assert.deepEqual(forecast,before);
});
test('软违规删空整段时在本地改成未定叙述，不额外请求',async()=>{
 const {state,forecast}=fixture();let calls=0;
 const r=await requestTurnNarrative(config,state,forecast,{fetcher:async()=>{calls++;return json({chapter:{朝:'拨银九亿两。',午:'',夜:''}});}});
 assert.equal(calls,1);assert.equal(r.chapter.朝,'此事尚待核问，未有定论。');
});
test('旧改写标记和待续预演不影响本地修句，原骰与数值不变',async()=>{
 const {state,forecast}=fixture();state.pending={forecast};state.turnBudget={used:1,rewriteAttempted:true};
 const restored=unpack(pack(state)).state,before=structuredClone(restored.pending.forecast);let calls=0;
 const r=await requestTurnNarrative(config,restored,restored.pending.forecast,{budget:restored.turnBudget,fetcher:async()=>{calls++;return json(bad());}});
 assert.equal(calls,1);assert.equal(r.chapter.朝,'殿门缓缓打开。');assert.deepEqual(restored.pending.forecast,before);assert.equal(restored.turnBudget.rewriteAttempted,true);
});
test('请求已取消时不再请求或提交',async()=>{
 const {state,forecast}=fixture(),ac=new AbortController();ac.abort();
 await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{signal:ac.signal,fetcher:()=>assert.fail('不得发送')}),/取消/);
});
test('执行度替词和亲密收束本地完成，两次额度是自动重试上限',async()=>{
 const {state,forecast}=fixture();forecast.facts=[{kind:'execution',slot:'朝',topic:'修河',office:'工部',label:'敷衍'}];let calls=0;
 const r=await requestTurnNarrative(config,state,forecast,{fetcher:async()=>{calls++;return json({chapter:{朝:'工部照办修河。',午:'',夜:'描写性交。'}});}});
 assert.equal(calls,1);assert.equal(r.chapter.朝,'工部敷衍修河。');assert.equal(r.chapter.夜,'宫帘垂下，夜色渐深。');
 const budget={used:1};await requestTurnNarrative(config,state,forecast,{budget,fetcher:async()=>json(bad())});assert.equal(budget.used,2);
 await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget,fetcher:()=>assert.fail('额度耗尽')}),/预算/);
});
test('原始JSON缺字段或正文为空才重试，最多两次且从不发改写',async()=>{
 const {state,forecast}=fixture(),budget={used:0};let calls=0;
 await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget,sleep:async()=>{},fetcher:async(url,o)=>{
  calls++;assert.ok(!JSON.parse(o.body).messages[0].content.includes('句子改写任务'));return json({chapter:{朝:'',午:'',夜:''}});
 }}));assert.equal(calls,2);assert.equal(budget.used,2);
 const broken=structuredClone(state);broken.turnBudget={used:0,rewriteAttempted:'yes'};assert.throws(()=>migrate(broken),/改写标记/);
});
