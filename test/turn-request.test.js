import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {callJSON,createBudget,requestBody} from '../src/llm/client.js';
import {validateProbe} from '../src/llm/validate.js';
import {requestTurnNarrative,validateTurnNarrative} from '../src/ui/turn-request.js';
import {pack,unpack} from '../src/store/save.js';

const config={provider:'deepseek',base:'https://api.example.test',model:'story-fixture',key:'qa-placeholder',thinking:true};
const prose={chapter:{朝:'晓钟敲过，殿门缓缓打开。',午:'廊下风静，案上仍摊着未读的旧折。',夜:'御案灯影渐低，近侍轻声请安。'},summary:'宫灯下的一旬',reactions:[],memorialTexts:[]};
const fixture=()=>{
  const state=initialTurn(createState({seed:'正文接口回归',demo:false}));
  const forecast=forecastTurn(state);
  return {state:{...state,pending:{forecast}},forecast};
};
function stream(data,{cut=false,length=false}={}){
  const text=typeof data==='string'?data:JSON.stringify(data);
  const lines=[JSON.stringify({choices:[{delta:{reasoning_content:'此处不应显示'}}]}),...Array.from({length:Math.ceil(text.length/13)},(_,i)=>JSON.stringify({choices:[{delta:{content:text.slice(i*13,i*13+13)}}]}))];
  if(!cut)lines.push(JSON.stringify({choices:[{delta:{},finish_reason:length?'length':'stop'}],usage:{prompt_tokens:120,completion_tokens:90}}));
  const bytes=new TextEncoder().encode(lines.map(v=>'data: '+v+'\r\n\r\n').join('')+(cut?'':'data: [DONE]\r\n\r\n'));
  return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));c.close();}}),{headers:{'Content-Type':'text/event-stream'}});
}
for(const [provider,thinking] of [['deepseek',true],['deepseek',false],['qwen_cn',true],['qwen_us',false],['custom',false]])
test(`连接测试后同配置生成正文：${provider} / 思考${thinking}`,async()=>{
  const c={...config,provider,thinking},requests=[],metrics=[],partials=[];
  const {state,forecast}=fixture(),before=structuredClone(state),budget=createBudget();
  const fetcher=async(url,options)=>{requests.push({url,...options,body:JSON.parse(options.body)});return stream(requests.length===1?{ok:true,message:'已接通'}:prose);};
  await callJSON(c,[{role:'user',content:'只输出 JSON：{"ok":true,"message":"已接通"}'}],{fetcher,validate:validateProbe});
  assert.equal(budget.used,0,'连接测试不占正文回合预算');
  const result=await requestTurnNarrative(c,state,forecast,{budget,fetcher,onPartial:s=>partials.push(s),onMetric:m=>metrics.push(m)});
  assert.equal(requests.length,2);
  for(const req of requests){assert.equal(req.url,'https://api.example.test/chat/completions');assert.equal(req.headers.Authorization,'Bearer qa-placeholder');assert.equal(req.body.model,c.model);assert.equal(req.body.stream,true);assert.deepEqual(req.body.response_format,{type:'json_object'});}
  const expected=requestBody(c,requests[1].body.messages);
  assert.deepEqual(requests[1].body,expected);
  assert.match(requests[1].body.messages[1].content,/本旬结算表/);
  assert.match(requests[1].body.messages[1].content,new RegExp('"die":'+forecast.die));
  assert.deepEqual(result.chapter,prose.chapter);
  assert.ok(partials.some(s=>s.includes('晓钟')));
  assert.ok(partials.every(s=>!s.includes('此处不应显示')));
  assert.equal(metrics[0].result,'ok');assert.equal(metrics[0].outputTokens,90);
  assert.deepEqual(state,before);
  const committed=commitTurn(state,forecast,result),restored=unpack(pack(committed)).state;
  assert.equal(restored.turn,state.turn+1);assert.equal(restored.history.length,state.history.length+1);
  assert.deepEqual(restored.history.at(-1).chapter,prose.chapter);
  assert.equal(restored.pending,null);assert.equal(restored.lastTurn.die,forecast.die);
  assert.deepEqual(commitTurn(restored,forecast,result),restored,'同一回合只提交一次');
});
test('原始空白正文拒绝提交，软断言删空则本地改成未定语气',()=>{
  const {forecast}=fixture();
  assert.throws(()=>validateTurnNarrative({chapter:{朝:' \n ',午:'',夜:''}},forecast),/正文为空/);
  assert.match(validateTurnNarrative({chapter:{朝:'拨银九亿两。',午:'',夜:''}},forecast).chapter.朝,/未有定论/);
  assert.equal(validateTurnNarrative({...prose,chapter:{朝:prose.chapter.朝,午:'',夜:''}},forecast).chapter.朝,prose.chapter.朝,'空槽仍可略写');
});
test('空白或错误结构的回复重试，不能以试读文案冒充接口正文',async()=>{
 for(const bad of [{chapter:{朝:'',午:'',夜:''}},{ok:true,message:'只有测试回音'}]){
  const {state,forecast}=fixture(),budget=createBudget(),before=structuredClone(state);let calls=0;
  const r=await requestTurnNarrative(config,state,forecast,{budget,sleep:async()=>{},fetcher:async()=>stream(++calls===1?bad:prose)});
  assert.equal(calls,2);assert.equal(budget.used,2);assert.deepEqual(r.chapter,prose.chapter);assert.deepEqual(state,before);
 }
});
test('流式断流和截断回复复用原结算，完整回复才可提交',async()=>{
 for(const failure of [{cut:true},{length:true}]){
  const {state,forecast}=fixture(),before=structuredClone(state);let calls=0;
  const result=await requestTurnNarrative(config,state,forecast,{sleep:async()=>{},fetcher:async()=>stream(prose,++calls===1?failure:{})});
  assert.equal(calls,2);assert.deepEqual(state,before);assert.equal(commitTurn(state,forecast,result).lastTurn.die,forecast.die);
 }
});
test('正文失败保留待续回合；读档后修正配置仍沿用相同天命和账目',async()=>{
  const {state,forecast}=fixture();state.turnBudget=createBudget();const before=structuredClone(state);let calls=0;
  await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget:state.turnBudget,fetcher:async()=>{calls++;return new Response('',{status:401});}}),/HTTP 401/);
  assert.equal(calls,1);assert.equal(state.turn,0);assert.deepEqual(state.pending,before.pending);assert.deepEqual(state.rng,before.rng);assert.deepEqual(state.history,before.history);
  const restored=unpack(pack(state)).state;
  const result=await requestTurnNarrative({...config,key:'qa-replaced-placeholder'},restored,restored.pending.forecast,{budget:restored.turnBudget,fetcher:async()=>stream(prose)});
  assert.deepEqual(restored.pending.forecast,forecast);assert.equal(restored.turnBudget.used,2);
  const next=commitTurn(restored,restored.pending.forecast,result);
  assert.equal(next.turn,1);assert.equal(next.lastTurn.die,forecast.die);assert.deepEqual(next.history.at(-1).entries,forecast.entries);
});
test('正文无效的两次上限不提交或重掷，旧绝对时间不阻止下一次正文请求',async()=>{
  const {state,forecast}=fixture(),before=structuredClone(state),budget=createBudget();let calls=0;
  await assert.rejects(()=>requestTurnNarrative(config,state,forecast,{budget,sleep:async()=>{},fetcher:async()=>{calls++;return stream({chapter:{朝:'',午:'',夜:''}});}}));
  assert.equal(calls,2);assert.equal(budget.used,2);assert.deepEqual(state,before);
  const restoredBudget={used:1,deadline:Date.now()-1};
  await requestTurnNarrative(config,state,forecast,{budget:restoredBudget,fetcher:async()=>stream(prose)});
  assert.deepEqual(restoredBudget,{used:2});
  assert.deepEqual(state,before);
});
test('非流式兼容回复也能保存为正文；没有密钥时不发请求',async()=>{
  const {state,forecast}=fixture();
  const result=await requestTurnNarrative(config,state,forecast,{fetcher:async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(prose)},finish_reason:'stop'}]}),{headers:{'Content-Type':'application/json'}})});
  assert.deepEqual(result.chapter,prose.chapter);
  await assert.rejects(()=>requestTurnNarrative({...config,key:''},state,forecast,{fetcher:async()=>assert.fail('不得发出无密钥请求')}),/密钥/);
});
