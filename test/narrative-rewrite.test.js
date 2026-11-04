import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate} from '../src/core/state.js';
import {initialTurn,forecastTurn} from '../src/core/turn.js';
import {requestTurnNarrative} from '../src/ui/turn-request.js';
import {inspectNarrative,applySentenceRewrites} from '../src/llm/rewrite.js';
import {pack,unpack} from '../src/store/save.js';
const config={base:'https://rewrite.example.test',model:'test',key:'test'};
const fixture=()=>{const state=initialTurn(createState({seed:'一次改写'})),forecast=forecastTurn(state);return {state,forecast};};
const bad=()=>({chapter:{朝:'殿门缓缓打开。拨银九亿两。',午:'臣尚未开口。',夜:'夜色渐深。'},summary:'宫中一旬'});
const json=data=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{headers:{'Content-Type':'application/json'}});
test('第四步 收集正文与附文全部违规句和原因，按ID只替换指定句子',()=>{
 const {forecast}=fixture(),data=bad();data.chapter.午+='赐死'+forecast.state.court.officials[0].name+'。';data.summary='拨银八亿两。';data.memorialTexts=[{id:forecast.newMemorials[0].id,text:'折纸完好。拨银七亿两。'}];
 const before=structuredClone(data),r=inspectNarrative(data,forecast);assert.equal(r.violations.length,4);assert.ok(r.violations.every(v=>v.reason&&v.sentence));assert.deepEqual(data,before);
 const patched=applySentenceRewrites(data,r.violations,{rewrites:r.violations.map(v=>({id:v.id,text:'臣请另议。'})),chapter:{朝:'劫持未违规正文'}});
 assert.ok(patched.chapter.朝.startsWith('殿门缓缓打开。'));assert.equal(patched.chapter.夜,data.chapter.夜);assert.equal(patched.summary,'臣请另议。');assert.ok(patched.memorialTexts[0].text.startsWith('折纸完好。'));assert.deepEqual(data,before);
});
test('第四步 全章问题一次请求，持久化标记先于改写请求；不展示改写JSON流',async()=>{
 const {state,forecast}=fixture(),before=structuredClone(forecast),budget={used:0},requests=[],partials=[];let persisted=false;
 const result=await requestTurnNarrative(config,state,forecast,{budget,onBeforeRewrite:async()=>{assert.equal(budget.rewriteAttempted,true);persisted=true;},onPartial:t=>partials.push(t),fetcher:async(url,o)=>{
  const body=JSON.parse(o.body);requests.push(body);if(requests.length===1)return json(bad());assert.ok(persisted);const content=JSON.parse(body.messages[1].content);assert.equal(content.violations.length,1);assert.ok(content.results.facts);return json({rewrites:content.violations.map(v=>({id:v.id,text:'户部尚需核问，皇帝暂未许诺。'}))});
 }});
 assert.equal(requests.length,2);assert.equal(budget.used,2);assert.ok(result.chapter.朝.includes('户部尚需核问'));assert.ok(partials.every(t=>!t.includes('rewrites')));assert.deepEqual(forecast,before);
});
test('第四步 改写仍违规、漏改或伪造ID则删句，不再发起第二次改写',async()=>{
 const {state,forecast}=fixture(),budget={used:0};let calls=0;
 const r=await requestTurnNarrative(config,state,forecast,{budget,fetcher:async()=>json(++calls===1?bad():{rewrites:[{id:'v0',text:'拨银八亿两。'},{id:'chapter.夜',text:'篡改好句。'}]})});
 assert.equal(calls,2);assert.equal(r.chapter.朝,'殿门缓缓打开。');assert.equal(r.chapter.夜,'夜色渐深。');assert.equal(budget.rewriteAttempted,true);
});
for(const failure of ['http','json'])test('第四步 改写'+failure+'失败只请求一次并回退删句',async()=>{
 const {state,forecast}=fixture();let calls=0;const r=await requestTurnNarrative(config,state,forecast,{sleep:async()=>{},fetcher:async()=>{if(++calls===1)return json(bad());return failure==='http'?new Response('',{status:503}):json({oops:true});}});
 assert.equal(calls,2);assert.equal(r.chapter.朝,'殿门缓缓打开。');
});
test('第四步 全章原本会删空时也先尝试改写',async()=>{
 const {state,forecast}=fixture();let calls=0;const r=await requestTurnNarrative(config,state,forecast,{fetcher:async()=>json(++calls===1?{chapter:{朝:'拨银九亿两。',午:'',夜:''}}:{rewrites:[{id:'v0',text:'臣暂不能报出确数。'}]})});assert.equal(calls,2);assert.equal(r.chapter.朝,'臣暂不能报出确数。');
});
test('第四步 读档后复用一次标记和原预演，手动续写不再改写',async()=>{
 const {state,forecast}=fixture();state.pending={forecast};state.turnBudget={used:2,rewriteAttempted:true};const restored=unpack(pack(state)).state,before=structuredClone(restored.pending.forecast);let calls=0;
 const r=await requestTurnNarrative(config,restored,restored.pending.forecast,{budget:restored.turnBudget,fetcher:async()=>{calls++;return json(bad());}});assert.equal(calls,1);assert.equal(r.chapter.朝,'殿门缓缓打开。');assert.deepEqual(restored.pending.forecast,before);assert.equal(restored.turnBudget.rewriteAttempted,true);
});
test('第四步 保存改写标记失败时不发请求，取消改写不提交故事',async()=>{
 const {state,forecast}=fixture();let calls=0;await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget:{used:0},onBeforeRewrite:async()=>{throw Error('保存失败');},fetcher:async()=>{calls++;return json(bad());}}),/保存失败/);assert.equal(calls,1);
 const ac=new AbortController();calls=0;await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget:{used:0},signal:ac.signal,fetcher:async()=>{if(++calls===1)return json(bad());ac.abort();throw Error('stop');}}),/取消/);
});
test('第四步 A8替词与A14含蓄化不触发额外请求；四次额度仍是上限',async()=>{
 const {state,forecast}=fixture();forecast.facts=[{kind:'execution',slot:'朝',topic:'修河',office:'工部',label:'敷衍'}];let calls=0;
 const r=await requestTurnNarrative(config,state,forecast,{fetcher:async()=>{calls++;return json({chapter:{朝:'工部照办修河。',午:'',夜:'描写性交。'}});}});assert.equal(calls,1);assert.equal(r.chapter.朝,'工部敷衍修河。');assert.equal(r.chapter.夜,'宫帘垂下，夜色渐深。');
 const budget={used:3};calls=0;await requestTurnNarrative(config,state,forecast,{budget,fetcher:async()=>{calls++;return json(bad());}});assert.equal(calls,1);assert.equal(budget.used,4);
});
test('第四步 改写后全章仍为空时可重试正文，但全章最多一次改写、合计四次',async()=>{
 const {state,forecast}=fixture(),budget={used:0};let calls=0,rewrite=0;
 await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget,sleep:async()=>{},fetcher:async(url,o)=>{calls++;if(JSON.parse(o.body).messages[0].content.includes('句子改写任务')){rewrite++;return json({rewrites:[{id:'v0',text:'拨银八亿两。'}]});}return json({chapter:{朝:'拨银九亿两。',午:'',夜:''}});}}));
 assert.equal(calls,4);assert.equal(rewrite,1);assert.equal(budget.used,4);
 const broken=structuredClone(state);broken.turnBudget={used:0,rewriteAttempted:'yes'};assert.throws(()=>migrate(broken),/改写标记/);
});
