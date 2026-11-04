import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {applyMemorialTexts} from '../src/core/memorial-texts.js';
import {requestScheduleIntents} from '../src/ui/intent-request.js';
import {requestTurnContent,requestTurnNarrative} from '../src/ui/turn-request.js';
import {requestMemorialTexts,validateMemorialTexts} from '../src/ui/memorial-request.js';
import {localRemarkKind} from '../src/llm/remark-classifier.js';
import {turnMessages,dynastyBible,LENGTHS,memorialMessages} from '../src/llm/prompts.js';
import {extractPartialChapter,validateTurn} from '../src/llm/validate.js';
import {createBudget} from '../src/llm/client.js';
import {pack,unpack,createSaveStore} from '../src/store/save.js';
import {speedBenchmark} from '../scripts/speed-benchmark.mjs';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const config={key:'fixture',base:'https://speed.test',model:'fixture',provider:'custom'};
const fresh=()=>initialTurn(createState({seed:'第一批提速',demo:false,freedom:'mid'}));
const prose={chapter:{朝:'殿门缓缓打开。',午:'廊下风静。',夜:'灯影渐低。'}};
const json=data=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{headers:{'Content-Type':'application/json'}});
const texts=memorials=>({memorialTexts:memorials.map(m=>({id:m.id,text:'臣请详议此事。\n\n未敢擅行，伏候裁处。'}))});

test('无自由文本、空白朱批和明确朱批完全跳过意图请求，兼容旧式同批朱批',async()=>{
 const s=fresh(),ids=s.memorials.map(m=>m.id),before=structuredClone(s);
 for(const schedule of [{},{朝:{kind:'歇息'}},{朝:{kind:'批折',memorials:ids,remark:'  '}},{朝:{kind:'批折',memorials:ids,remark:'不必嘉奖，责成核查'}}]){
  const r=await requestScheduleIntents(config,s,schedule,{fetcher:()=>assert.fail('不应请求')});
  assert.deepEqual(r.intents,[]);
  if(schedule.朝?.remark?.trim())for(const d of Object.values(r.schedule.朝.decisions))assert.equal(d.remarkKind,'附旨');
 }
 assert.deepEqual(s,before);assert.equal(localRemarkKind('不必嘉奖'),'无');assert.equal(localRemarkKind('申饬'),'申饬');
});
test('含糊朱批与口谕合并成一次，模型分类限已有输入与枚举且不接受数值',async()=>{
 const s=fresh(),ids=s.memorials.map(m=>m.id),schedule={朝:{kind:'批折',memorials:ids,decisions:Object.fromEntries(ids.map(id=>[id,{option:'hold',remark:'此番有心了'}]))},午:{kind:'下旨',text:'请户部另议'}};
 let calls=0;
 const r=await requestScheduleIntents(config,s,schedule,{fetcher:async(url,o)=>{
  calls++;const body=JSON.parse(o.body),input=JSON.parse(body.messages[1].content);assert.equal(input.inputs.length,ids.length+1);assert.match(body.messages[0].content,/remarkKind/);
  return json({actions:[],remarks:[{inputId:'朝:remark:'+ids[0],remarkKind:'嘉奖',effects:{treasury:99999}},{inputId:'朝:remark:'+ids[1],remarkKind:'越权'},{inputId:'假朱批',remarkKind:'申饬'}]});
 }});
 assert.equal(calls,1);assert.equal(r.schedule.朝.decisions[ids[0]].remarkKind,'嘉奖');assert.equal(r.schedule.朝.decisions[ids[1]].remarkKind,undefined);assert.deepEqual(r.intents,[]);assert.equal(s.nation.treasury,480);
});
test('朱批中实质命令继续解析，离线也不漏掉拨款',async()=>{
 const s=fresh(),id=s.memorials[0].id,text='嘉奖，拨银五万两入内帑';assert.equal(localRemarkKind(text),null);
 const r=await requestScheduleIntents(config,s,{朝:{kind:'批折',memorials:[id],decisions:{[id]:{option:'hold',remark:text}}}},{local:true});
 assert.ok(r.intents.some(a=>a.type==='allocate'&&a.amount===5&&a.destination==='privy'));
});
test('意图接口异常最多请求一次，不预演或修改输入',async()=>{
 const s=fresh(),before=structuredClone(s);let calls=0;
 await assert.rejects(()=>requestScheduleIntents(config,s,{午:{kind:'下旨',text:'另议一事'}},{fetcher:async()=>{calls++;return new Response('',{status:503});}}));
 assert.equal(calls,1);assert.deepEqual(s,before);
});
test('主叙事与奏折真正并行，奏折流不进入正文章节，主叙事旧字段被忽略',async()=>{
 const s=fresh(),f=forecastTurn(s),before=structuredClone(f),started=[];let releaseMain,releaseMemorial;
 const work=requestTurnContent(config,s,f,{fetcher:async(url,o)=>{
  const body=JSON.parse(o.body),memorial=body.messages[0].content.includes('奏折正文任务');started.push(memorial?'奏折':'正文');
  await new Promise(resolve=>{if(memorial)releaseMemorial=resolve;else releaseMain=resolve;});
  return json(memorial?texts(f.newMemorials):{...prose,memorialTexts:[{id:f.newMemorials[0].id,text:'主请求夹带正文'}]});
 }});
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(started,['正文','奏折']);
 releaseMemorial();releaseMain();const n=await work;
 assert.equal(n.memorialTexts.length,f.newMemorials.length);assert.ok(n.memorialTexts.every(m=>m.status==='ready'&&!m.text.includes('夹带')));assert.deepEqual(f,before);
});
for(const failure of ['HTTP','结构','空折','断网'])test('奏折'+failure+'失败保留模板，照常提交并可独立重试',async()=>{
 const s=fresh(),f=forecastTurn(s);let calls=0;
 const n=await requestTurnContent(config,s,f,{fetcher:async(url,o)=>{
  calls++;if(!JSON.parse(o.body).messages[0].content.includes('奏折正文任务'))return json(prose);
  if(failure==='HTTP')return new Response('',{status:503});
  if(failure==='断网')throw Error('offline');
  return json(failure==='结构'?{}:{memorialTexts:[]});
 }});
 assert.equal(calls,2);assert.ok(n.memorialTexts.every(t=>t.status==='template'&&t.text.trim()));
 const next=commitTurn(s,f,n),original=structuredClone(next);assert.equal(next.turn,s.turn+1);
 const restored=unpack(pack(next)).state,target=restored.memorials.find(m=>m.textStatus==='template');let retries=0;
 const result=await requestMemorialTexts(config,restored,[target],{fetcher:async()=>{retries++;return json(texts([target]));}});
 const patched=applyMemorialTexts(restored,result);assert.equal(retries,1);assert.equal(patched.memorials.find(m=>m.id===target.id).textStatus,'ready');
 assert.equal(patched.turn,next.turn);assert.equal(patched.rng,next.rng);assert.equal(patched.revision,next.revision+1);assert.deepEqual(patched.nation,next.nation);assert.deepEqual(patched.history,next.history);assert.deepEqual(next,original);
 assert.deepEqual(applyMemorialTexts(patched,result),patched,'重复补写不改动已完成的奏文');
});
test('无新奏折时不发奏折请求，取消并行请求仍保留原预演',async()=>{
 const s=fresh(),f=forecastTurn(s);f.newMemorials=[];let calls=0;
 await requestTurnContent(config,s,f,{fetcher:async()=>{calls++;return json(prose);}});assert.equal(calls,1);
 const ac=new AbortController(),before=structuredClone(f);ac.abort();
 await assert.rejects(()=>requestTurnContent(config,s,f,{signal:ac.signal,fetcher:()=>assert.fail('取消后不请求')}),/取消/);assert.deepEqual(f,before);
});
test('主请求硬失败取消仍在等待的奏折请求，不留下并行请求占用',async()=>{
 const s=fresh(),f=forecastTurn(s);let siblingSignal;
 await assert.rejects(()=>requestTurnContent(config,s,f,{fetcher:async(url,o)=>{
  if(JSON.parse(o.body).messages[0].content.includes('奏折正文任务')){siblingSignal=o.signal;return new Promise(()=>{});}
  return new Response('',{status:401});
 }}),/401/);
 assert.equal(siblingSignal.aborted,true);
});
test('奏折超时使用与正文相同的截止时间，模板回退不阻塞提交',async()=>{
 const s=fresh(),f=forecastTurn(s),deadline=Date.now()+30;
 const n=await requestTurnContent(config,s,f,{deadline,fetcher:async(url,o)=>
  JSON.parse(o.body).messages[0].content.includes('奏折正文任务')?new Promise(()=>{}):json(prose)});
 assert.deepEqual(n.chapter,prose.chapter);assert.ok(n.memorialTexts.every(t=>t.status==='template'));
});
test('软断言本地处理，无额外请求；最高自由度跳过断言但不产生数值效果',async()=>{
 for(const freedom of ['mid','real','free']){
  const s=fresh();s.settings.freedom=freedom;const f=forecastTurn(s),money=f.state.nation.treasury;let calls=0;
  const n=await requestTurnNarrative(config,s,f,{fetcher:async()=>{calls++;return json({chapter:{朝:'拨银九亿两。',午:'',夜:''},effects:{treasury:999999}});}});
  assert.equal(calls,1);assert.equal(n.chapter.朝.includes('九亿'),freedom==='free');assert.equal(commitTurn(s,f,n).nation.treasury,money);
 }
});
test('奏文校验只接受本批ID，无依据数值删除，不重复写入状态或接受效果',()=>{
 const s=fresh(),f=forecastTurn(s),id=f.newMemorials[0].id;
 const r=validateMemorialTexts({memorialTexts:[{id:'fake',text:'伪造'},{id,text:'奏请详议。拨银九亿两。'}],effects:{treasury:999999}},f.state,f.newMemorials);
 assert.equal(r[0].text,'奏请详议。');assert.ok(!r.some(m=>m.id==='fake'));assert.ok(r.slice(1).every(m=>m.status==='template'));
});
test('补写期间换卷、换进度或修订已变时，旧回复不写入新存档',async()=>{
 const source=readFileSync('src/ui/app.js','utf8');
 const controller=source.slice(source.indexOf('async function retryMemorialText('),source.indexOf('function openScene('));
 for(const changed of ['slot','run','revision']){
  const state=fresh();state.memorials[0].textStatus='template';let finish,saves=0;
  const context={state,slot:1,busy:false,config,guard(){},$:()=>null,markMetric(){},
   requestMemorialTexts:()=>new Promise(resolve=>{finish=resolve;}),applyMemorialTexts,
   persist:async()=>{saves++;},toast(){},render(){}};
  runInNewContext(controller,context);
  const work=context.retryMemorialText(state.memorials[0].id);
  context.state=structuredClone(state);
  if(changed==='slot')context.slot=2;
  else if(changed==='run')context.state.runId+='-new';
  else context.state.revision++;
  const before=structuredClone(context.state);
  finish([{id:state.memorials[0].id,text:'旧请求正文',status:'ready'}]);await work;
  assert.deepEqual(context.state,before);assert.equal(saves,0);assert.equal(context.busy,false);
 }
});
test('v19迁移保留所有旧数值、奏文及待续原骰，v20状态损坏进入保护',async()=>{
 const old=fresh();old.v=19;old.memorials[0].text='旧奏文原样保留';const f=forecastTurn(old);old.pending={forecast:f};old.turnBudget={used:4,rewriteAttempted:true};
 const before=structuredClone(old),m=migrate(old);assert.equal(m.v,VERSION);assert.deepEqual(m,{...before,v:VERSION});assert.deepEqual(old,before);
 const committed=commitTurn(m,m.pending.forecast,prose);assert.equal(committed.rng,f.state.rng);assert.deepEqual(committed.nation,f.state.nation);
 const broken={...m,memorials:m.memorials.map((x,i)=>i?x:{...x,textStatus:'broken'})};assert.throws(()=>migrate(broken),/奏折正文状态/);
 const raw=pack(broken),store=createSaveStore({primary:{get:async()=>raw},backup:{getItem:()=>raw},validate:migrate});const loaded=await store.load(1);assert.equal(loaded.readOnly,true);
});
test('提示词只发被提及者完整资料，保留其他官员简表及独立奏折格式',()=>{
 const s=fresh();s.court.officials.forEach((o,i)=>o.personality='性格标识'+i);const [a,b]=s.court.officials;
 const bible=dynastyBible(s,{person:a.id});assert.ok(bible.includes('性格标识0'));assert.ok(!bible.includes('性格标识1'));assert.ok(bible.includes(b.id+'｜'+b.name+'｜'));
 const f=forecastTurn(s),main=turnMessages(s,f);assert.ok(!main[0].content.includes('memorialTexts'));assert.match(memorialMessages(s,f.newMemorials)[0].content,/memorialTexts/);assert.equal(LENGTHS.standard.words,'100–220');
 s.history=Array.from({length:6},(_,i)=>({summary:'旧旬摘要'+i}));const newer=turnMessages(s,forecastTurn(s))[1].content;assert.ok(newer.includes('旧旬摘要5'));assert.ok(!newer.includes('旧旬摘要2'));
});
test('reactions、factUpdates、rumors分别限3、3、2条并保留效果限额',()=>{
 const s=fresh(),f=forecastTurn(s),names=f.state.court.officials.slice(0,6).map(o=>o.name),line=names.join('、')+'共议旧事，事情仍须详查。';
 const n=validateTurn({chapter:{朝:line,午:'',夜:''},reactions:names.map(name=>({name,favorDelta:1})),rumors:['市集灯火。','檐外风声。','廊下落叶。'],factUpdates:names.map(subject=>({subject,key:'记事',value:'相见',reason:line}))},f);
 assert.equal(n.reactions.length,3);assert.equal(n.factUpdates.length,3);assert.equal(n.rumors.length,2);
});
test('流式JSON逐段提取未完成字符串，处理分段转义并忽略chapter之外的时段',()=>{
 assert.equal(extractPartialChapter('{"metadata":{"朝":"假正文"},"chapter":{"朝":"晨钟初响'), '朝\n晨钟初响');
 const raw='{"chapter":{"朝":"第一段\\n引号\\"与\\u671d。","午":"午后风';
 assert.equal(extractPartialChapter(raw),'朝\n第一段\n引号"与朝。\n\n午\n午后风');
 assert.equal(extractPartialChapter('{"chapter":{"朝":"晨\\u67'), '朝\n晨');
 assert.equal(extractPartialChapter('{"chapter":{"朝":"晨。","午":"","夜":"夜'),'朝\n晨。\n\n午\n\n\n夜\n夜');
 assert.equal(extractPartialChapter('{"chapter":{"朝":"晨。"},"other":{"午":"假午"}}'),'朝\n晨。');
});
test('预算为90秒；mock请求统计保证每旬最多一次意图、并行奏折及零改写',async()=>{
 assert.equal(createBudget(123).deadline,90123);
 const rows=await speedBenchmark();
 for(const row of rows){assert.ok(row.trace.filter(t=>t.kind==='意图').length<=1);assert.ok(!row.trace.some(t=>t.kind==='改写'));assert.equal(row.maxConcurrent,2);assert.ok(row.serialDepth<=2);}
 assert.deepEqual(rows.map(r=>r.requests),[2,2,3,3]);assert.deepEqual(rows.map(r=>r.serialDepth),[1,1,2,2]);
});
