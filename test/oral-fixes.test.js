import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, migrate, VERSION } from '../src/core/state.js';
import { commitTurn, forecastTurn, initialTurn } from '../src/core/turn.js';
import { advanceProjects, EDICTS, issueEdict } from '../src/core/edicts.js';
import { applyFiatOperations } from '../src/core/fiat.js';
import { resolveIntents } from '../src/core/intents.js';
import { intentInputs, intentMessages, localIntents, validateIntents } from '../src/llm/intents.js';
import { turnMessages } from '../src/llm/prompts.js';
import { mockNarrative } from '../src/llm/validate.js';
import { oralScheduleEntry } from '../src/ui/oral.js';
import { requestScheduleIntents, requestTalkIntents } from '../src/ui/intent-request.js';
import { ledgerHTML } from '../src/ui/render.js';

const fresh = (freedom, demo = true) => initialTurn(createState({seed:'oral-audit-2026-11-15',freedom,demo}));
const config = {key:'fixture',base:'https://fixture.test',model:'fixture',provider:'custom'};
const response = data => new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{
  headers:{'Content-Type':'application/json'},
});
function scheduleOrder(state, text) {
  const {slot,action} = oralScheduleEntry(state,text);
  return {...state.schedule,[slot]:action};
}
function forecastOrder(state, schedule) {
  return forecastTurn(state,schedule,localIntents(state,intentInputs(schedule)));
}

test('口谕按原样放入首个空槽，未知事项标占位，日程满时保留原安排', () => {
  const s = fresh('mid');
  s.schedule.朝 = {kind:'歇息'};
  const text = '  命户部严查贪腐\n处置结果须回奏  ';
  const {slot,action} = oralScheduleEntry(s,text);
  assert.equal(slot,'午');
  assert.equal(action.text,text);
  assert.equal(action.kind,'下旨');
  assert.equal(action.edictType,'禁令');
  assert.equal(action.placeholder,true);
  assert.equal(s.schedule.午,null);
  const relief = oralScheduleEntry(s,'赈济直隶').action;
  assert.equal(relief.edictType,'赈灾');
  assert.equal(relief.province,s.nation.provinces[0].id);
  assert.equal(relief.placeholder,undefined);
  s.schedule.午 = action;
  s.schedule.夜 = relief;
  assert.throws(() => oralScheduleEntry(s,'令天下文风大兴'),/日程已满/);
});

for (const freedom of ['real','mid','free']) {
  test(`${freedom} 赈济、修堤、整饬吏治、减赋均开项，附言只有套语也执行政令`, () => {
    const s = fresh(freedom);
    for (const [text,type,cost] of [['赈济直隶','赈灾',30],['修堤','修河',60],['整饬吏治','整饬吏治',20],['减赋','减赋',15]]) {
      const f = forecastOrder(s,scheduleOrder(s,text));
      assert.deepEqual(f.state.projects.map(p => [p.edictType,p.cost]),[[type,cost]]);
      assert.equal(s.nation.treasury-f.state.nation.treasury,cost);
    }
    const card = {kind:'下旨',edictType:'减赋'};
    const plain = forecastTurn(s,{朝:card});
    const withText = forecastOrder(s,{朝:{...card,text:'着有司速办'}});
    assert.deepEqual(withText.state,plain.state);
  });

  test(`${freedom} 两条口谕路径都按实付和标准价结算项目效果`, () => {
    const s = fresh(freedom);
    s.emperor.talents.权谋 = 100;
    s.nation.provinces[0].disaster = 80;
    const cases = [
      {text:'拨银一两修河',type:'修河',silver:0.0001,grain:0,ratio:0.0001/60,province:null},
      {text:'拨银十万两赈济直隶',type:'赈灾',silver:10,grain:20/3,ratio:1/3,province:'z0'},
      {text:'拨粮十万石赈济直隶',type:'赈灾',silver:15,grain:10,ratio:1/2,province:'z0'},
      {text:'拨银十万两、拨粮五万石赈济直隶',type:'赈灾',silver:10,grain:5,ratio:1/4,province:'z0'},
      {text:'赈济直隶',type:'赈灾',silver:30,grain:20,ratio:1,province:'z0'},
    ];
    for (const direct of [false,true]) {
      for (const {text,type,silver,grain,ratio,province} of cases) {
        const schedule = scheduleOrder(s,text);
        if (direct) schedule.朝={...schedule.朝,edictType:'禁令',placeholder:true};
        const f = forecastOrder(s,schedule);
        const [project] = f.state.projects;
        assert.deepEqual(f.state.projects.map(p => [p.edictType,p.province,p.cost]),[[type,province,silver]],text);
        assert.equal(f.state.nation.treasury,s.nation.treasury-silver,text);
        assert.equal(f.state.nation.grain,s.nation.grain-grain,text);
        assert.equal(project.fundingRatio,ratio,text);
        assert.deepEqual(project.effects,Object.fromEntries(
          Object.entries(EDICTS[type].effects).map(([key,base])=>[key,base*project.execRate*ratio]),
        ),text);
        const payments = f.entries.filter(e => e.path==='nation.treasury');
        assert.deepEqual(payments.map(e=>e.delta),[-silver],text);
        const grainPayments = f.entries.filter(e => e.path==='nation.grain');
        assert.deepEqual(grainPayments.map(e=>e.delta),grain?[-Number(grain.toFixed(2))]:[],text);
        assert.equal(payments[0].source.includes('钱粮不足，按比例办理'),ratio<1,text);
        assert.equal(f.slotResults.朝.join(' ').includes('钱粮不足，按比例办理'),ratio<1,text);
        if (type==='赈灾') {
          const disaster = f.state.nation.provinces[0].disaster;
          const finished = advanceProjects({...f.state,turn:project.end});
          assert.equal(finished.nation.provinces[0].disaster,disaster-35*project.execRate*ratio,text);
        } else {
          assert.match(ledgerHTML(payments),/-0\.0001/,text);
        }
      }
    }
  });

  test(`${freedom} 口谕的赐死按档位裁决，未识别事项只进入叙事`, () => {
    const s = fresh(freedom);
    const person = s.court.posts.find(p => p.title==='户部尚书').holder;
    const schedule = scheduleOrder(s,'赐死户部尚书');
    const f = forecastOrder(s,schedule);
    assert.equal(f.state.intentResults[0].type,'kill');
    assert.equal(f.state.court.officials.find(o => o.id===person).alive,false);
    assert.equal(s.court.officials.find(o => o.id===person).alive,true);
    assert.equal(f.state.projects.length,0);
    const unsupported = forecastOrder(s,scheduleOrder(s,'令天下文风大兴'));
    const r = unsupported.state.intentResults[0];
    assert.equal(r.status,freedom==='free'?'narrative-done':'narrative');
    assert.deepEqual(r.actual,{});
    assert.deepEqual(unsupported.state.nation,forecastTurn(s).state.nation);
    assert.deepEqual(unsupported.state.court,forecastTurn(s).state.court);
    assert.equal(turnMessages(s,unsupported)[1].content.includes('可写成既成事实'),freedom==='free');
    assert.match(mockNarrative(unsupported).chapter.朝,freedom==='free'?/已照旨办成：令天下文风大兴/:/拟议：令天下文风大兴/);
    assert.equal(migrate(commitTurn(s,unsupported,mockNarrative(unsupported))).history.at(-1).intentResults[0].status,r.status);
  });
}

test('银与粮分别封顶，短缺按较低出资比例，零额度既不开项也不扣粮', () => {
  const s = fresh('real');
  s.emperor.talents.权谋=100;
  const relief={edictType:'赈灾',province:'z0',allocation:true};
  const capped=issueEdict(s,relief,11,{silver:999,grain:5});
  assert.equal(capped.state.nation.treasury,s.nation.treasury-30);
  assert.equal(capped.state.nation.grain,s.nation.grain-5);
  assert.equal(capped.state.projects[0].fundingRatio,0.25);
  const ample=fresh('free');
  const surplus=issueEdict(ample,relief,11,{silver:999,grain:999});
  assert.equal(surplus.state.projects[0].fundingRatio,1);
  assert.equal(surplus.state.nation.treasury,ample.nation.treasury-30);
  assert.equal(surplus.state.nation.grain,ample.nation.grain-20);
  const inputs=[{id:'朝',slot:'朝',text:'拨银十万两赈济直隶'}];
  const actions=localIntents(s,inputs);
  const limited=resolveIntents(s,actions,{transferCap:5});
  assert.equal(limited.results[0].actual.treasurySpent,5);
  assert.equal(limited.state.projects[0].fundingRatio,5/30);
  assert.equal(limited.state.nation.grain,s.nation.grain-20*(5/30));
  const blocked=resolveIntents(s,actions,{transferCap:0});
  assert.equal(blocked.results[0].status,'failed');
  assert.equal(blocked.state.projects.length,0);
  assert.equal(blocked.state.nation.grain,s.nation.grain);
});

test('言出法随用现有钱粮，单项指定时缺粮同步缩减银款，无指定金额须付足', () => {
  const s=fresh('free');
  s.nation.grain=2;
  const text='拨银十万两赈济直隶',relief={edictType:'赈灾',province:'z0'};
  const order=scheduleOrder(s,text);
  const direct={朝:{...order.朝,edictType:'禁令',placeholder:true}};
  for(const schedule of [order,direct]){
    const forecast=forecastOrder(s,schedule);
    assert.equal(forecast.state.nation.treasury,s.nation.treasury-3);
    assert.equal(forecast.state.nation.grain,0);
    assert.equal(forecast.state.projects[0].fundingRatio,0.1);
    assert.ok(!forecast.entries.some(e=>e.source.includes('补足')));
  }
  assert.throws(()=>issueEdict(s,relief,11),/钱粮不足/);
  const blank=resolveIntents(s,localIntents(s,[{id:'朝',slot:'朝',text:'赈济直隶'}]));
  assert.equal(blank.results[0].status,'failed');
  assert.deepEqual(blank.state.nation,s.nation);
});

test('分开的银粮指令与同一地区的政令合并，未识别卡也只建一次', () => {
  const s=fresh('free');
  const schedule=scheduleOrder(s,'拨银十万两；拨粮五万石；赈济直隶');
  schedule.朝={...schedule.朝,edictType:'禁令',placeholder:true};
  const forecast=forecastOrder(s,schedule);
  assert.equal(forecast.state.projects.length,1);
  assert.equal(forecast.state.projects[0].fundingRatio,1/4);
  assert.equal(forecast.state.nation.treasury,s.nation.treasury-10);
  assert.equal(forecast.state.nation.grain,s.nation.grain-5);
});

test('督办和言出法随竣工继续按累计出资比例兑现', () => {
  const s = fresh('free');
  const action = {edictType:'赈灾',province:'z0'};
  s.nation.provinces[0].disaster = 80;
  const issued = issueEdict(s,action,11,{silver:10});
  const supervised = issueEdict(issued.state,{...action,followup:'督办'},11,{silver:5});
  const project = supervised.state.projects[0];
  assert.equal(project.fundingRatio,0.5);
  assert.equal(project.effects.virtue,3*project.execRate*0.5);
  const finished = applyFiatOperations(supervised.state,[{op:'complete',target:'赈灾'}],'funding').state;
  assert.equal(finished.nation.provinces[0].disaster,80-35*project.execRate*0.5);
});

test('v27 在途项目保持旧效果，旧待续预演原样迁移', () => {
  const old = forecastOrder(fresh('free'),{朝:{kind:'下旨',edictType:'修河'}}).state;
  old.v = 27;
  delete old.projects[0].fundingRatio;
  const pending = forecastTurn(old);
  old.pending={forecast:pending};
  const migrated=migrate(old);
  assert.equal(migrated.v,28);
  assert.equal(migrated.projects[0].fundingRatio,1);
  assert.deepEqual(migrated.projects[0].effects,old.projects[0].effects);
  assert.deepEqual(migrated.pending.forecast,pending);
});

test('模型返回重复的建项和拨款时只结算一次，独立的任免与拨转照常执行', () => {
  const s = fresh('free');
  const schedule = {朝:{kind:'下旨',edictType:'赈灾',province:'z0',text:'拨银十万两、拨粮五万石赈济直隶；罢免户部尚书；另拨五万两入内帑。'}};
  const inputs = intentInputs(schedule);
  const post = s.court.posts.find(p => p.title==='户部尚书');
  const raw = {actions:[
    {inputId:'朝',type:'decree',edictType:'赈灾',province:'z0'},
    {inputId:'朝',type:'allocate',destination:'赈灾',resource:'grain',amount:5},
    {inputId:'朝',type:'allocate',destination:'赈灾',source:'treasury',amount:10},
    {inputId:'朝',type:'allocate',destination:'赈灾',source:'treasury',amount:10},
    {inputId:'朝',type:'dismiss',targetId:post.holder},
    {inputId:'朝',type:'allocate',destination:'privy',source:'treasury',amount:5},
  ]};
  for(const current of [schedule,{朝:{...schedule.朝,edictType:'禁令',placeholder:true}}]){
    const f = forecastTurn(s,current,validateIntents(raw,s,intentInputs(current)));
    assert.deepEqual(f.state.projects.map(p => [p.edictType,p.cost,p.fundingRatio]),[['赈灾',10,1/4]]);
    assert.equal(f.state.nation.treasury,s.nation.treasury-15);
    assert.equal(f.state.nation.grain,s.nation.grain-5);
    assert.equal(f.state.nation.privy,s.nation.privy+5);
    assert.notEqual(f.state.court.posts.find(p => p.id===post.id).holder,post.holder);
  }
  assert.equal(JSON.parse(intentMessages(s,inputs)[1].content).inputs[0].edictType,'赈灾');
});

test('接口无效 JSON 回退到字面结算，取消请求时保留原有事务', async () => {
  const s = fresh('mid',false);
  const schedule = scheduleOrder(s,'拨银十万两赈济直隶');
  let fallback = 0;
  const result = await requestScheduleIntents(config,s,schedule,{
    fetcher:async () => new Response('bad JSON'),
    onFallback:() => fallback++,
  });
  assert.equal(fallback,1);
  const f = forecastTurn(s,result.schedule,result.intents);
  assert.equal(f.state.projects[0].cost,10);
  assert.equal(commitTurn(s,f,mockNarrative(f)).turn,s.turn+1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(requestScheduleIntents(config,s,schedule,{
    signal:controller.signal,
    fetcher:() => assert.fail('取消后不得请求'),
    onFallback:() => assert.fail('取消后不得走回退结算'),
  }),/取消/);
});

test('召见闲谈跳过意图接口，命令仍请求且复用正常解析', async () => {
  const s = fresh('mid',false);
  let calls = 0;
  const options = {fetcher:async () => {
    calls++;
    return response({actions:[{inputId:'talk-0-0',type:'allocate',destination:'privy',amount:5}]});
  }};
  assert.deepEqual(await requestTalkIntents(config,s,'卿近来读了什么书？',options),[]);
  assert.equal(calls,0);
  const result = await requestTalkIntents(config,s,'拨银五万两入内帑',options);
  assert.equal(calls,1);
  assert.equal(result[0].type,'allocate');
  assert.equal(result[0].amount,5);
});

test('v26 自由拟旨迁移为占位，冻结待续原样保留，v27 仍可显式颁布禁令', () => {
  const v26 = fresh('free');
  v26.v = 26;
  v26.schedule.朝 = {kind:'下旨',edictType:'禁令',text:'令天下文风大兴'};
  const old = forecastTurn(v26);
  v26.pending = {forecast:old};
  const migrated = migrate(v26);
  assert.equal(migrated.v,VERSION);
  assert.equal(migrated.schedule.朝.placeholder,true);
  assert.deepEqual(migrated.pending.forecast,old);
  assert.equal(commitTurn(migrated,old,{}).rng,old.state.rng);
  const current = fresh('free');
  const f = forecastOrder(current,{朝:{kind:'下旨',edictType:'禁令',text:'着有司速办'}});
  assert.equal(f.state.projects[0].edictType,'禁令');
});
