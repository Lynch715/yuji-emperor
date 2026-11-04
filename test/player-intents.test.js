import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION,assertState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {localIntents,validateIntents,intentMessages} from '../src/llm/intents.js';
import {validateTurn,mockNarrative,validateTalk} from '../src/llm/validate.js';
import {roster} from '../src/llm/prompts.js';
import {requestScheduleIntents} from '../src/ui/intent-request.js';
import {talkAttempt} from '../src/core/court.js';
import {resolveTalkIntents} from '../src/core/intents.js';
const start=()=>initialTurn(createState({seed:'player-intents',freedom:'free'}));
const forecast=(s,text)=>{const inputs=[{id:'朝',slot:'朝',text}],actions=localIntents(s,inputs);return forecastTurn(s,{朝:{kind:'下旨',edictType:'禁令',text}},actions);};
test('第一步 随心所欲赐死为真实结果，A1放行，后续在世名册不再出现',()=>{
 const s=start();s.court.officials[0].name='张三';const before=structuredClone(s),f=forecast(s,'将张三赐死');
 assert.equal(f.state.court.officials[0].alive,false);assert.equal(s.court.officials[0].alive,true);
 assert.ok(f.facts.some(x=>x.kind==='death'&&x.actors.includes('张三')));
 const n=validateTurn({chapter:{朝:'张三被赐死。',午:'',夜:''}},f);assert.equal(n.chapter.朝,'张三被赐死。');
 const c=commitTurn(s,f,n);assert.ok(!roster(c).includes('张三'));assert.deepEqual(s,before);
 assert.deepEqual(commitTurn(c,f,n),c);assert.equal(c.history.at(-1).intentResults[0].type,'kill');
});
test('第一步 千万两按余额截断，实际金额可叙述，原愿望金额不能冒充已拨',()=>{
 const s=start(),f=forecast(s,'拨银一千万两修河'),r=f.state.intentResults.find(r=>r.type==='allocate');
 assert.equal(r.status,'success');assert.equal(r.clamped,true);assert.ok(r.actual.amount>0&&r.actual.amount<=s.nation.treasury);
 assert.equal(r.actual.destination,'修河');assert.equal(f.state.nation.treasury,0);
 const n=validateTurn({chapter:{朝:'拨银'+r.actual.amount+'万两修河。',午:'',夜:''}},f);assert.equal(n.chapter.朝,'拨银'+r.actual.amount+'万两修河。');
 assert.equal(validateTurn({chapter:{朝:'拨银一千万两修河。',午:'',夜:''}},f).chapter.朝,'');
});
test('第一步 未知ID降other，模型不能开放孕产小产，也不能创造人物',()=>{
 const s=start(),inputs=[{id:'朝',slot:'朝',text:'将陌生人赐死'}],before=structuredClone(s);
 for(const type of ['kill','appoint','war','pregnancy']){
  const a=validateIntents({actions:[{inputId:'朝',type,targetId:'fake',countryId:'fake'}]},s,inputs);assert.equal(a[0].type,'other');
 }
 assert.deepEqual(s,before);assert.doesNotMatch(JSON.stringify(intentMessages(s,inputs)),/secretKnown|曾为故交/);
});
test('第一步 模型只解析JSON，动作解析发生在预演之前',async()=>{
 const s={...start(),settings:{...start().settings,demo:false}},name=s.court.officials[0].name,requests=[];
 const a=await requestScheduleIntents({key:'test',base:'https://test.invalid',model:'fixture'},s,{朝:{kind:'下旨',text:'将'+name+'赐死'}},{fetcher:async(url,options)=>{requests.push(JSON.parse(options.body));return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({actions:[{inputId:'朝',type:'kill',targetId:s.court.officials[0].id}]})}}]}),{headers:{'Content-Type':'application/json'}});}});
 assert.equal(a.intents[0].targetId,s.court.officials[0].id);assert.equal(requests.length,1);assert.equal(s.court.officials[0].alive,true);
 assert.match(requests[0].messages[0].content,/只输出 JSON，不写剧情/);
});
test('第一步 待续保存裁决与原骰，重读提交不重新执行',()=>{
 const s=start(),f=forecast(s,'将'+s.court.officials[0].name+'赐死');s.pending={forecast:f};
 const raw=JSON.stringify(f),loaded=migrate(JSON.parse(JSON.stringify(s)));
 assert.equal(JSON.stringify(loaded.pending.forecast),raw);
 const c=commitTurn(loaded,loaded.pending.forecast,mockNarrative(f));assert.equal(c.rng,f.state.rng);assert.equal(c.intentResults[0].id,f.state.intentResults[0].id);
 const old=start();old.v=10;delete old.intentResults;delete old.settings.freedom;const m=migrate(old);assert.deepEqual(m.intentResults,[]);assert.equal(m.settings.freedom,'mid');assert.equal(m.v,VERSION);
 const broken=start();broken.intentResults={};assert.throws(()=>migrate(broken),/裁决记录损坏/);
});
test('第一步 面谈意图即时落入同一状态，保存结果和对白检查复用裁决',()=>{
 const s=start(),n=s.court.officials[1].name,line='将'+n+'赐死',input={id:'talk-0',slot:'午',text:line};
 const a=localIntents(s,[input]),attempt=talkAttempt(s,s.court.officials[0].id,line,true),r=resolveTalkIntents(attempt.state,attempt.result,a);
 assert.equal(r.state.court.officials[1].alive,false);assert.equal(r.state.talks.at(-1).intentResults.length,1);
 assert.equal(validateTalk({reply:n+'被赐死。'},r.result,r.state).reply,n+'被赐死。');assertState(r.state);
});
