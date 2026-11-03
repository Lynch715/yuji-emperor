import {requestPlayerIntents,requestScheduleIntents} from '../src/ui/intent-request.js';
import {resolveTalkIntents} from '../src/core/intents.js';
import {classifyMemorialSchedule} from "../src/llm/remark-classifier.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn,validateSchedule,scheduleCost} from '../src/core/turn.js';
import {talkAttempt} from '../src/core/court.js';
import {callJSON,createBudget} from '../src/llm/client.js';
import {requestTurnNarrative} from '../src/ui/turn-request.js';
import {talkMessages,turnMessages,biographyMessages} from '../src/llm/prompts.js';
import {validateTalk} from '../src/llm/validate.js';
import {pack,unpack} from '../src/store/save.js';
import {postTitle} from '../src/core/scenarios.js';

const initial=()=>initialTurn(createState({seed:'批次1热修',demo:false}));
const config={key:'fixture',base:'https://fixture.test',model:'fixture',provider:'custom'};
const prose={chapter:{朝:'晓钟传到殿前。',午:'廊下风静。',夜:'御案灯影渐低。'},summary:'御前问对'};
const response=data=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{headers:{'Content-Type':'application/json'}});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Execute the actual UI controller functions with controlled IO, clock and storage.
function controller(state,extra={}){
  const source=readFileSync('src/ui/app.js','utf8');
  const snippets=[['function guard()', 'async function persist()'],['function arrange(', 'function exportMarkdown()']].map(([a,b])=>source.slice(source.indexOf(a),source.indexOf(b))).join('\n');
  const oldBudget=source.includes('function budget()')?source.slice(source.indexOf('function budget()'),source.indexOf('function loadMetrics()')):'';
  const elements=Object.fromEntries(['#talk-form','#talk-form button','#talk-line','#talk-log','#action-document'].map(id=>[id,{value:'说说近况',disabled:false,insertAdjacentHTML(){}}]));
  const errors=[],saves=[];
  const context={scheduleSave:{cancel(){},schedule(){},flush:async()=>{}},classifyMemorialSchedule,state,readOnly:false,busy:false,config,AbortController,createBudget,forecastTurn,commitTurn,validateSchedule,talkAttempt,talkMessages,turnMessages,biographyMessages,validateTalk,
    requestPlayerIntents:(c,s,i,o)=>requestPlayerIntents(c,s,i,{...o,fetcher:async()=>response({actions:[]})}),requestScheduleIntents,resolveTalkIntents,gameText:x=>x,streamDraft(){},lastSchedule:null,postTitle,$:id=>elements[id],esc:x=>String(x),openDialog(){},closeDialog(){},render(){},toast:m=>errors.push(m),markMetric(){},persist:async()=>{saves.push(structuredClone(context.state));return true;},
    callJSON:(c,m,o)=>callJSON(c,m,{...o,fetcher:async()=>response({reply:'臣尚须查核旧档，此事未敢轻允。'})}),
    requestTurnNarrative:(c,s,f,o)=>requestTurnNarrative(c,s,f,{...o,fetcher:async()=>response(prose)}),...extra};
  runInNewContext(oldBudget+'\n'+snippets,context);
  return {context,elements,errors,saves};
}
test('A1 面谈后超过240秒仍可请求正文，三轮面谈与分类不占正文四次额度',async()=>{
  const {context:c,elements,errors,saves}=controller(initial());
  c.startTalk('o0');
  for(let i=0;i<3;i++)await elements['#talk-form'].onsubmit({preventDefault(){}});
  assert.equal(c.state.turnBudget,null,'面谈不得持久化正文预算');
  c.classifyMessages=()=>[];c.ACTIONS={};
  await c.oral('请卿另议一事');
  assert.equal(c.state.turnBudget,null,'口谕分类不得占正文预算');
  c.state.turnBudget={...createBudget(0),used:4}; // legacy planning-time budget, ten minutes later
  let calls=0;
  c.requestTurnNarrative=(cfg,s,f,o)=>requestTurnNarrative(cfg,s,f,{...o,now:()=>600000,sleep:async()=>{},fetcher:async()=>++calls<4?response({}):response(prose)});
  await c.advance();
  assert.equal(calls,4);assert.equal(c.state.turn,1,errors.join(';'));
  const pending=saves.find(s=>s.pending);
  assert.deepEqual(Object.keys(pending.turnBudget),['used']);assert.equal(pending.turnBudget.used,0);assert.equal(pending.v,VERSION);assert.equal(pending.pending.forecast.state.turnBudget,null,'新预演不得夹带旧预算时钟');
});
test('A1 待续重载只保留已用次数，重新计时且重试不重掷',async()=>{
  let s=initial();const f=forecastTurn(s),before=hash(f);
  s.pending={forecast:f};s.turnBudget={...createBudget(0),used:1};
  s=migrate(unpack(pack(s)).state);assert.equal(s.v,VERSION);
  let calls=0;const options={budget:s.turnBudget,now:()=>600000,fetcher:async()=>{calls++;return new Response('',{status:401});}};
  await assert.rejects(()=>requestTurnNarrative(config,s,s.pending.forecast,options),/401/);
  assert.equal(calls,1);assert.deepEqual(s.turnBudget,{used:2});assert.equal(hash(s.pending.forecast),before);
  s=migrate(unpack(pack(s)).state);
  await requestTurnNarrative(config,s,s.pending.forecast,{budget:s.turnBudget,now:()=>1200000,sleep:async()=>{},fetcher:async()=>++calls===2?response({}):response(prose)});
  assert.equal(s.turnBudget.used,4);assert.equal(hash(s.pending.forecast),before);
  await assert.rejects(()=>requestTurnNarrative(config,s,f,{budget:s.turnBudget,fetcher:()=>assert.fail('四次后不得再请求')}),/预算/);
  assert.equal(hash(s.pending.forecast),before);
});
test('B11 试读心声与普通面谈提示词不泄密，试探成功或已知才提供秘密',()=>{
  const s=initial();s.emperor.talents.魅力=100;
  const secret='密约藏在西阁暗匣';s.court.officials[0].secret=secret;
  const r=talkAttempt(s,'o0','说说近况');
  assert.ok(r.result.innerThought);assert.ok(!r.result.innerThought.includes(secret));
  assert.ok(!JSON.stringify(talkMessages(r.state,r.result,[])).includes(secret));
  const known=structuredClone(r.state);known.court.officials[0].secretKnown=true;
  assert.ok(JSON.stringify(talkMessages(known,r.result,[])).includes(secret));
  s.emperor.talents.权谋=1000;
  const probe=talkAttempt(s,'o0','试探旧事');assert.equal(probe.result.success,true);
  assert.ok(JSON.stringify(talkMessages(probe.state,probe.result,[])).includes(secret));
  const failed=talkAttempt({...s,emperor:{...s.emperor,talents:{...s.emperor.talents,权谋:-1000}}},'o0','试探旧事');
  assert.equal(failed.result.success,false);assert.ok(!JSON.stringify(talkMessages(failed.state,failed.result,[])).includes(secret));
});
test('B11 未允和越权保留安全推托台词，剔除数字承诺并校验硬事实',()=>{
  const s=initial(),r=talkAttempt(s,'o0','拨银1000万两').result;
  for(const result of [{...r,denied:true},{...r,denied:false,success:false}]){
    const reply='臣尚须查核旧档，此事未敢轻允。';
    assert.equal(validateTalk({reply,effects:{privy:1000}},result,s).reply,reply);
    const named='陆令仪垂首答道：「臣尚须查核旧档，此事未敢轻允。」';assert.equal(validateTalk({reply:named},result,s).reply,named);
    for(const bad of ['臣遵旨，即刻拨付1000万两。','臣遵旨，即刻拨付一千万两。','臣已调兵北上。','陆令仪已经怀孕。','朔庭已大获全胜。','臣允诺此事照办。','臣遵命，所请尽可放心。','臣愿照准陛下所请。','臣可给付壹佰万两。']){
      const safe=validateTalk({reply:bad},result,s);assert.equal(safe.reply,result.reply,bad);assert.equal(safe.effects,null);
    }
    const safe=validateTalk({reply:'臣遵旨，即刻拨付1000万两。臣尚须查核旧档，此事未敢轻允。'},result,s);
    assert.equal(safe.reply,reply);
  }
});
test('B12 面谈落账后午槽不可清空覆盖或换人，正确召见仅扣一次精力',()=>{
  let s=initial();s.emperor.talents.魅力=100;
  const id=s.court.posts.find(p=>p.title==='户部尚书').holder;
  s.court.officials.find(o=>o.id===id).favor=100;s=talkAttempt(s,id,'拨银1万两').state;
  const before=hash(s);
  for(const action of [null,{kind:'歇息'},{kind:'下旨',edictType:'减赋'},{kind:'召见',person:'o0'}]){
    const schedule={...s.schedule,午:action};
    assert.throws(()=>validateSchedule(s,schedule),/面谈|召见/);
    assert.throws(()=>forecastTurn(s,schedule),/面谈|召见/);
    const ui=controller(s);assert.throws(()=>ui.context.arrange('午',action),/面谈|召见/);
  }
  assert.equal(hash(s),before);
  const schedule={...s.schedule,午:{kind:'召见',person:id}};assert.equal(validateSchedule(s,schedule),true);assert.equal(scheduleCost(schedule),1);
  const f=forecastTurn(s,schedule),n=commitTurn(s,f,{});
  assert.deepEqual(n.interimEntries,[]);assert.deepEqual(commitTurn(n,f,{}),n);
  assert.equal(f.entries.filter(e=>e.source==='御前面谈：职权内拨款'&&e.path==='nation.privy').length,1);
  const old={...s,talks:s.talks.map(t=>({...t,turn:s.turn-1}))};assert.equal(validateSchedule(old,{朝:null,午:null,夜:null}),true);
});
test('B13 正文名册国势使用预演后状态，包含新人与储君太后宗室外君和前后变化',()=>{
  const s=initial(),f=forecastTurn(s);
  f.state.nation.treasury=321;
  f.state.court.officials.push({...s.court.officials[0],id:'new-official',name:'新任重臣'});
  f.state.court.posts[0].holder='new-official';
  f.state.harem.consorts.push({...s.harem.consorts[0],id:'new-consort',name:'新入宫人'});
  f.state.harem.children.push({id:'new-child',name:'新生皇嗣',sex:'男',born:f.state.turn,health:90});f.state.harem.heir='new-child';
  f.state.dowager='懿安太后';f.state.harem.royalWomen=[{id:'royal',name:'宗室嘉仪',age:22}];
  const before=hash({s,f}),text=turnMessages(s,f)[1].content;
  for(const name of ['新任重臣','新入宫人','新生皇嗣','储君','懿安太后','宗室嘉仪',f.state.foreign[0].ruler,'本旬前后变化'])assert.ok(text.includes(name),name);
  assert.ok(text.includes('"treasury":321'));assert.ok(text.includes('"treasury":'+s.nation.treasury));assert.equal(hash({s,f}),before);
});
test('B14 立传只汇总本朝实录，每年一行至多80行并附引擎统计',()=>{
  const s=initial();s.turn=7200;s.reign.accessionTurn=3600;
  const chapters=Array.from({length:7200},(_,i)=>({turn:i+1,summary:i+1<3600?'前朝不应出现':'本朝实录'+(i+1),notes:['年度史事'],chapter:{朝:'长篇正文不得输入'.repeat(100)}}));
  s.volumes=[{chapters:chapters.slice(0,7000)}];s.history=chapters.slice(7000);
  const text=biographyMessages(s,{id:'record',stats:{petitions:123},score:66})[1].content;
  assert.ok(!text.includes('前朝不应出现'));assert.ok(!text.includes('长篇正文不得输入'));assert.match(text,/年度提要/);assert.match(text,/引擎统计/);assert.ok(text.includes('123'));
  const lines=JSON.parse(text.match(/【年度提要】([^\n]+)/)?.[1]||'null');
  assert.ok(Array.isArray(lines));assert.equal(lines.length,80);assert.equal(new Set(lines.map(x=>x.year)).size,80);assert.ok(lines.every(x=>x.year>=101));assert.ok(text.length<40000);
  s.reign.accessionTurn=7199;const last=biographyMessages(s,{stats:{petitions:2}})[1].content;
  assert.ok(last.includes('本朝实录7199'));assert.ok(last.includes('本朝实录7200'));assert.ok(!last.includes('本朝实录7198'),'同年继位前的记录也须排除');
});
test('B15 大凶国库扣款明确记为户部银库失窃，内帑与数值公式不变',()=>{
  let s,f;for(let i=0;i<100;i++){s=initialTurn(createState({seed:'B15-'+i}));f=forecastTurn(s);if(f.die<=3)break;}
  assert.ok(f.die<=3);const entries=f.entries.filter(e=>e.source==='天命大凶：户部银库失窃');assert.ok(entries.length,'大凶账目须注明户部银库');
  assert.equal(entries.find(e=>e.path==='nation.treasury').after-entries.find(e=>e.path==='nation.treasury').before,-8);
  assert.ok(!f.entries.some(e=>e.source.includes('内库失窃')));assert.ok(!entries.some(e=>e.path==='nation.privy'));assert.equal(s.v,VERSION);
});
