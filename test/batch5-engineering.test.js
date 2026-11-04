import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {APP_ICONS,createAppManifest} from '../src/ui/icon.js';
test('E2 图标只保留32、180、192且单文件小于660KB（新增战役军报与条约，图标预算不变）',()=>{
 assert.deepEqual(Object.keys(APP_ICONS),['32','180','192']);
 assert.ok(Buffer.byteLength(readFileSync('src/ui/icon.js'))<60000);
 execFileSync(process.execPath,['scripts/build.mjs']);
 assert.ok(readFileSync('index.html').length<660000);
 assert.deepEqual(createAppManifest('https://example.com/game/?x=1','#123').icons.map(i=>i.sizes),['192x192']);
});

import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {createSaveStore,unpack} from '../src/store/save.js';
const start=()=>initialTurn(createState({seed:'E工程',freedom:'free'}));
function storage(){const p=new Map(),b=new Map(),v=new Map(),a=new Map();return {p,b,v,a,primary:{get:async k=>p.get(k),put:async(k,x)=>p.set(k,structuredClone(x)),appendVolume:async(k,x)=>{if(v.has(k))assert.deepEqual(v.get(k),x);else v.set(k,structuredClone(x));},getVolume:async k=>v.get(k),archive:async(k,x)=>a.set(k,x),archives:async()=>[...a.values()]},backup:{getItem:k=>b.get(k),setItem:(k,x)=>b.set(k,x)},validate:migrate};}
test('E1 分卷只追加IDB、主档仅目录，恢复副本无正文，待续无历史副本且旧预演不重掷',async()=>{
 let s=start();for(let i=0;i<40;i++){const f=forecastTurn(s);assert.equal(Object.hasOwn(f.state,'history'),false);assert.equal(Object.hasOwn(f.state,'volumes'),false);s=commitTurn(s,f,{chapter:{朝:'正文'.repeat(150),午:'正文'.repeat(150),夜:'正文'.repeat(150)}});}
 const io=storage(),store=createSaveStore(io);await store.save(1,s);const main=unpack(io.p.get(1)).state,back=unpack(io.b.get('yuji:slot:1')).state;
 assert.equal(main.volumes.length,0);assert.ok(main.volumeIndex.length);assert.ok(io.v.size);assert.equal(back.history.length,0);assert.equal(back.volumes.length,0);
 assert.deepEqual((await store.load(1)).state,s);
 for(const version of [4,5,6,7]){const old=JSON.parse(readFileSync(`test/fixtures/v${version}-pending.json`));const raw=JSON.stringify(old.pending.forecast),next=migrate(old),f=next.pending.forecast;assert.equal(JSON.stringify(f),raw);const n=commitTurn(next,f,{});assert.equal(n.lastTurn.die,f.die);assert.equal(n.rng,f.state.rng);}
});
test('E1 排程去抖800ms且关键保存可立即冲刷',async()=>{
 const {createDebouncedSave}=await import('../src/store/debounce.js');let calls=0,fn=null,delay=0;
 const save=createDebouncedSave(async()=>++calls,{schedule:(f,ms)=>{fn=f;delay=ms;return 1;},cancel:()=>{fn=null;}});
 save.schedule();save.schedule();assert.equal(calls,0);assert.equal(delay,800);await save.flush();assert.equal(calls,1);assert.equal(fn,null);
});

import {privateAction} from '../src/core/private.js';
test('E4 私下行动复用传入骰子不改RNG、上朝批折必须显式选折、事实先查类型',()=>{
 const s=start(),action={kind:'私下行事',operation:'试探',person:s.court.officials[0].id};
 assert.equal(privateAction(s,action,20).state.rng,s.rng);assert.notEqual(privateAction(s,action,20).check.score,privateAction(s,action,1).check.score);
 for(const kind of ['上朝','批折'])assert.throws(()=>forecastTurn(s,{朝:{kind}}),/显式|奏报/);
 assert.doesNotThrow(()=>commitTurn(s,forecastTurn(s),{chapter:{朝:'事实文字足够长而明确。'},factUpdates:[{reason:{toString(){throw Error('不应强制转字符串');}}}]}));
 const source=readFileSync('src/core/edicts.js','utf8');assert.doesNotMatch(source,/import \{ fateModifier \}/);
});

test('E3 三个界面文件无长单行且七路径预演符合v13独立选项基线',()=>{
 for(const file of ['src/ui/render.js','src/ui/memorials.js','src/ui/style.css'])assert.ok(Math.max(...readFileSync(file,'utf8').split('\n').map(l=>l.length))<200,file);
 const actual=JSON.parse(execFileSync(process.execPath,['scripts/batch5-format-proof.mjs','--stdout'],{encoding:'utf8'}));
 assert.deepEqual(actual,JSON.parse(readFileSync('qa/batch5/summary.json')).memorialChoicesForecastHashesV13);
});

import {compactEntries} from '../src/core/archive.js';
test('E1 归档账目同路径同来源合并，净零剔除且不同来源不串账',()=>{
 const entries=[{path:'nation.grain',source:'甲',before:10,after:12,delta:2},{path:'nation.grain',source:'甲',before:12,after:10,delta:-2},{path:'nation.grain',source:'乙',before:10,after:13,delta:3},{path:'nation.treasury',source:'甲',before:8,after:9,delta:1}];
 assert.deepEqual(compactEntries(entries).map(e=>[e.path,e.source,e.delta]),[['nation.grain','乙',3],['nation.treasury','甲',1]]);
});
test('E1 封存只写IDB且第六份提示导出而不覆盖旧卷',async()=>{
 const io=storage(),store=createSaveStore(io);let s=start();await store.save(1,s);
 for(let i=0;i<5;i++){s={...s,runId:'archive-'+i};await store.archiveAndSave(1,s);}
 assert.equal(io.a.size,5);assert.ok([...io.b.keys()].every(k=>!k.includes('archive')));
 await assert.rejects(()=>store.archiveAndSave(1,{...s,runId:'sixth'}),/满5份.*导出/);assert.equal((await store.load(1)).state.runId,s.runId);
});
test('E1 分卷遗失或校验不符进入只读保护，不覆盖原档',async()=>{
 const io=storage(),store=createSaveStore(io);let s=start();s.volumes=[{from:1,to:18,chapters:[],summary:'旧卷'}];await store.save(1,s);const before=JSON.stringify(io.p.get(1));io.v.clear();const broken=await store.load(1);assert.equal(broken.readOnly,true);await assert.rejects(()=>store.save(1,s),/保护/);assert.equal(JSON.stringify(io.p.get(1)),before);
});

test('E1 v1至v3旧外壳与待续保留硬结果，v8补分卷目录',()=>{
 for(const v of [1,2,3]){const s=JSON.parse(readFileSync('test/fixtures/v4-pending.json'));s.v=v;s.pending.forecast.state.v=v;delete s.volumeIndex;const raw=JSON.stringify(s.pending.forecast),n=migrate(s);assert.equal(n.v,VERSION);assert.deepEqual(n.volumeIndex,[]);assert.equal(JSON.stringify(n.pending.forecast),raw);const committed=commitTurn(n,n.pending.forecast,{});assert.equal(committed.lastTurn.die,s.pending.forecast.die);assert.equal(committed.rng,s.pending.forecast.state.rng);}
});

test('E1 回合预演和提交不重复遍历不可变的旧分卷',()=>{
 const s=start();s.volumes=[{from:1,to:18,get chapters(){throw Error('不应逐旬读取已封存章节');}}];
 const f=forecastTurn(s);assert.doesNotThrow(()=>commitTurn(s,f,{}));
});

test('E1 旧档隐式选折迁移为显式ID；缺卷不得冒充完整JSON导出',async()=>{
 const old=start();old.v=7;old.schedule.朝={kind:'上朝',decision:'reject'};const next=migrate(old);assert.deepEqual(next.schedule.朝.memorials,old.memorials.slice(0,3).map(m=>m.id));assert.doesNotThrow(()=>forecastTurn(next,next.schedule));
 const io=storage(),store=createSaveStore(io);const incomplete={...start(),volumeIndex:[{key:'lost',from:1,to:18}]};assert.throws(()=>store.exportJSON(incomplete),/分卷.*原始/);
});

test('E1 待续恢复副本不复制未变核心，读回后原骰和预演账目一致',async()=>{
 const s=start();s.knowledge=[{note:'备忘'.repeat(120000)}];const f=forecastTurn(s);s.pending={forecast:f};const io=storage(),store=createSaveStore(io);await store.save(1,s);
 assert.ok(Buffer.byteLength(io.b.get('yuji:slot:1'))<1000000);io.p.clear();const restored=(await createSaveStore(io).load(1)).state;
 assert.equal(restored.pending.forecast.die,f.die);assert.deepEqual(restored.pending.forecast.state,f.state);assert.equal(commitTurn(restored,restored.pending.forecast,{}).rng,f.state.rng);
});

test('E1 分卷目录损坏进入只读保护而不是当作空目录覆盖',async()=>{
 const io=storage(),store=createSaveStore(io),s=start();s.volumeIndex={broken:true};const {pack}=await import('../src/store/save.js');io.p.set(1,pack(s));const before=JSON.stringify(io.p.get(1));const result=await store.load(1);assert.equal(result.readOnly,true);await assert.rejects(()=>store.save(1,start()),/保护/);assert.equal(JSON.stringify(io.p.get(1)),before);
});


test('E1 只有分卷目录的原始主档不可作为完整导入写入空位',async()=>{
 const io=storage(),store=createSaveStore(io),s=start();s.volumes=[{from:1,to:18,chapters:[],summary:'旧卷'}];await store.save(1,s);
 const fresh=storage(),target=createSaveStore(fresh);await assert.rejects(()=>target.importJSON(1,JSON.stringify(io.p.get(1))),/分卷.*完整/);assert.equal(fresh.p.size,0);assert.equal(fresh.b.size,0);
});
