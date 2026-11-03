import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createState,migrate} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {createSaveStore} from '../src/store/save.js';
import {makeSimulationSchedule} from './simulate.mjs';
export function memoryStorage(){
 const p=new Map(),b=new Map(),v=new Map(),a=new Map();
 return {p,b,v,a,primary:{get:async k=>p.get(k),put:async(k,x)=>p.set(k,x),appendVolume:async(k,x)=>{if(v.has(k))assert.deepEqual(v.get(k),x);else v.set(k,x);},getVolume:async k=>v.get(k),archive:async(k,x)=>a.set(k,x),archives:async()=>[...a.values()]},backup:{getItem:k=>b.get(k),setItem:(k,x)=>b.set(k,x)},validate:migrate};
}
const digest=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex');
export async function storageAcceptance(){
 const io=memoryStorage(),store=createSaveStore(io),chapter=Object.fromEntries(['朝','午','夜'].map(k=>[k,'宫门风起，案牍往来，史官据实录记下今日所见。'.repeat(20).slice(0,300)]));
 let s=initialTurn(createState({seed:'E1·两百年长卷',freedom:'free'})),maxMain=0,maxBackup=0;
 s.emperor.lifespan=400;let roundTrips=0;
 for(let i=0;i<7200;i++){
  const f=forecastTurn(s,makeSimulationSchedule(s,()=>0,'greedy'));s=commitTurn(s,f,{chapter,summary:'本旬奏报据实落账'});
  assert.equal(s.ending,null);s.talks.push({turn:s.turn-1,person:'o0',summary:'旧面谈记录'});
  await store.save(1,s);
  maxMain=Math.max(maxMain,Buffer.byteLength(JSON.stringify(io.p.get(1))));maxBackup=Math.max(maxBackup,Buffer.byteLength(io.b.get('yuji:slot:1')));
  if((i+1)%360===0)console.log(JSON.stringify({turn:s.turn,maxMain,maxBackup}));
  if(i<1000){const fresh=createSaveStore(memoryStorage());const text=store.exportJSON(s);await fresh.importJSON(1,text);const back=(await fresh.load(1)).state;assert.equal(digest(back),digest(s),`第${i+1}旬往返`);roundTrips++;}
 }
 const f=forecastTurn(s),pending={...s,pending:{forecast:f}};await store.save(1,pending);
 const pendingMain=Buffer.byteLength(JSON.stringify(io.p.get(1))),pendingBackup=Buffer.byteLength(io.b.get('yuji:slot:1'));
 const report={turns:s.turn,roundTrips,paragraphCharacters:chapter.朝.length,maxMain,maxBackup,pendingMain,pendingBackup,volumes:io.v.size,talks:s.talks.length,exportBytes:Buffer.byteLength(store.exportJSON(s))};
 writeFileSync('qa/batch5/storage.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert.ok(maxMain<2000000&&pendingMain<2000000,'主档<2MB');assert.ok(maxBackup<1000000&&pendingBackup<1000000,'恢复副本<1MB');assert.ok(s.talks.length<=37);return report;
}
if(process.argv[1]===import.meta.filename)await storageAcceptance();
