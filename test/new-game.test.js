import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameSeed,createOpening,openingErrorMessage} from '../src/ui/new-game.js';
import {createState,migrate} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {selectAmbitions} from '../src/core/ambitions.js';
import {createSaveStore,pack,unpack} from '../src/store/save.js';
const options={name:'萧承熙',era:'永宁',demo:true,freedom:'mid',difficulty:'normal',prose:'court'};
const config={provider:'deepseek',key:'qa-placeholder',base:'https://api.example.test',model:'opening-fixture',thinking:true};
function memoryStore(){
  const p=new Map(),b=new Map();
  return createSaveStore({primary:{get:async k=>p.get(k),put:async(k,v)=>p.set(k,v)},backup:{getItem:k=>b.get(k),setItem:(k,v)=>b.set(k,v)},validate:migrate});
}
test('保留正常UUID；缺少或拒绝UUID时使用可用随机字节',()=>{
  assert.equal(createGameSeed({randomUUID(){return 'known-opening-id';},getRandomValues(){assert.fail();}}),'known-opening-id');
  const bytes={getRandomValues(array){array.set([1,2,3,4]);return array;}};
  assert.equal(createGameSeed(bytes),'opening-00000001000000020000000300000004');
  assert.equal(createGameSeed({...bytes,randomUUID(){throw new Error('restricted');}}),'opening-00000001000000020000000300000004');
});
test('所有Crypto种子能力缺失或抛错也不阻塞开局，同一毫秒两局不同',async()=>{
  const seed=createGameSeed(null,()=>12345),next=createGameSeed({randomUUID(){throw new Error();},getRandomValues(){throw new Error();}},()=>12345);
  assert.notEqual(seed,next);assert.match(seed,/^opening-/);
  const draft=await createOpening({...options,seed},['','','',''],{}, {fetcher:()=>assert.fail('试读不得调用接口')});
  assert.equal(draft.turn,0);assert.equal(draft.emperor.name,options.name);assert.equal(draft.era.name,options.era);assert.equal(draft.settings.demo,true);assert.equal(draft.ambitions.length,4);assert.ok(draft.memorials.length>=3);
  assert.doesNotThrow(()=>migrate(unpack(pack(draft)).state));
});
test('试读即使已有接口配置也完全离线；与原核心开局逐字段一致',async()=>{
  const setup={...options,seed:'开局一致性'},goals=['governance','wealth','heir','family'],stages=[];
  const actual=await createOpening(setup,goals,config,{onStage:s=>stages.push(s),fetcher:()=>assert.fail('勾选试读后不得发请求')});
  assert.deepEqual(actual,initialTurn(selectAmbitions(createState(setup),goals)));assert.ok(stages.length);
  const store=memoryStore();await store.load(1);await store.save(1,actual);const loaded=await store.load(1);
  assert.equal(loaded.readOnly,false);assert.deepEqual(loaded.state,migrate(actual));
  const f=forecastTurn(loaded.state),next=commitTurn(loaded.state,f,{});assert.equal(next.turn,1);await store.save(1,next);assert.equal((await store.load(1)).state.turn,1);
});
test('空白姓名或年号、缺少接口密钥在请求之前报告',async()=>{
  const noRequest={fetcher:()=>assert.fail('不应发送无效开局')};
  await assert.rejects(()=>createOpening({...options,name:'  '},[],config,noRequest),/皇帝名/);
  await assert.rejects(()=>createOpening({...options,era:'  '},[],config,noRequest),/年号/);
  await assert.rejects(()=>createOpening({...options,demo:false},[],{},noRequest),/密钥/);
});
test('接口开局使用同一配置和取消信号，完整名册才可进入游戏',async()=>{
  const s=createState({seed:'world-fixture'}),ac=new AbortController();let requests=0;
  const world={dynasty:'承宁',backstory:'先帝遗诏已宣。',factions:s.court.factions,officials:s.court.officials,consorts:s.harem.consorts,foreign:s.foreign,provinces:s.nation.provinces};
  const actual=await createOpening({...options,demo:false,seed:'interface-opening'},[],config,{signal:ac.signal,fetcher:async(url,request)=>{
    requests++;const b=JSON.parse(request.body);assert.equal(url,config.base+'/chat/completions');assert.equal(request.headers.Authorization,'Bearer qa-placeholder');assert.equal(b.model,config.model);assert.deepEqual(b.thinking,{type:'enabled'});assert.ok(request.signal);assert.match(b.messages[1].content,/25位官员/);
    return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(world)},finish_reason:'stop'}]}),{headers:{'Content-Type':'application/json'}});
  }});
  assert.equal(requests,1);assert.equal(actual.settings.demo,false);assert.equal(actual.dynasty,'承宁');assert.equal(actual.emperor.name,options.name);assert.equal(actual.era.name,options.era);assert.doesNotThrow(()=>migrate(actual));
});
test('关闭中的接口开局立即取消，不生成半份世界或自动转为试读',async()=>{
  const ac=new AbortController();let requests=0;
  const pending=createOpening({...options,demo:false},[],config,{signal:ac.signal,fetcher:()=>{requests++;return new Promise(()=>{});}});
  ac.abort();await assert.rejects(()=>pending,/取消/);assert.equal(requests,1);
});
test('不完整铸世回复两次失败，不能误当作已开局',async()=>{
  let requests=0;
  await assert.rejects(()=>createOpening({...options,demo:false},[],config,{sleep:async()=>{},fetcher:async()=>{requests++;return new Response(JSON.stringify({choices:[{message:{content:'{"ok":true,"message":"只有测试回音"}'}}]}),{headers:{'Content-Type':'application/json'}});}}),/格式|未完成/);
  assert.equal(requests,2);
});
test('开局能力错误改为中文提示，存档保护原因保留',()=>{
  assert.match(openingErrorMessage(new TypeError('crypto.randomUUID is not a function')),/浏览器/);
  assert.match(openingErrorMessage(new ReferenceError('structuredClone is not defined')),/浏览器/);
  assert.equal(openingErrorMessage(new Error('旧卷未能封存，已停止替换；原档完整保留')),'旧卷未能封存，已停止替换；原档完整保留');
});
