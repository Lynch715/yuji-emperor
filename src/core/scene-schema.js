const slots=['朝','午','夜'];
const statuses=['success','partial','failed'];
function outcome(v){return v&&statuses.includes(v.status)&&(v.die===null||Number.isInteger(v.die)&&v.die>=1&&v.die<=20)&&(v.cost===undefined||typeof v.cost==='string');}
function text(v,max,empty=true){return typeof v==='string'&&v.length<=max&&(empty||v.trim().length>0);}
function result(r){return r&&text(r.id,1000,false)&&text(r.actionKey,2400,false)&&typeof r.type==='string'&&['success','partial','failed','narrative'].includes(r.status)&&r.actual&&typeof r.actual==='object'&&!Array.isArray(r.actual)&&Array.isArray(r.facts);}
export function validSceneRecord(r){
 return r&&text(r.id,240,false)&&slots.includes(r.slot)&&Array.isArray(r.people)&&r.people.every(p=>p&&text(p.id,160,false)&&text(p.name,80,false))&&new Set(r.people.map(p=>p.id)).size===r.people.length&&text(r.place,120)&&text(r.text,8000,false)&&outcome(r.outcome)&&Array.isArray(r.results)&&r.results.every(result)&&Array.isArray(r.steps)&&r.steps.every((t,i)=>t&&text(t.id,300,false)&&text(t.request,8000,false)&&text(t.prose,2400,false)&&outcome(t.outcome)&&Array.isArray(t.results)&&t.results.every(result)&&Array.isArray(t.entries)&&t.sequence===i+1)&&new Set(r.steps.map(t=>t.id)).size===r.steps.length;
}
export function validateSceneState(s){
 for(const h of [...(s.volumes||[]).flatMap(v=>v.chapters),...(s.history||[])]){
  if(h.rewriteAttempted!==undefined&&typeof h.rewriteAttempted!=='boolean')throw new Error('剧情改写记录损坏');
  if(h.scenes===undefined)continue;
  if(!Array.isArray(h.scenes)||h.scenes.some(r=>!validSceneRecord(r))||new Set(h.scenes.map(r=>r.id)).size!==h.scenes.length||new Set(h.scenes.map(r=>r.slot)).size!==h.scenes.length)throw new Error('自拟情节记录损坏');
 }
 for(const a of Object.values(s.schedule||{}))if(a?.kind==='自拟情节'&&(!Array.isArray(a.people)||a.people.some(id=>!text(id,160,false))||new Set(a.people).size!==a.people.length||!text(a.place??'',120)||!text(a.text,8000,false)))throw new Error('自拟情节安排损坏');
 if(s.pending?.kind==='scene'){
  const f=s.pending.forecast,last=s.history?.at(-1),r=last?.scenes?.find(r=>r.id===f?.sceneId);
  if(!f||f.kind!=='scene'||!r||last.id!==f.chapterId||last.turn!==s.turn||f.runId!==s.runId||f.state?.runId!==s.runId||f.state?.revision!==s.revision+1||!text(f.turnId,300,false)||!Array.isArray(f.facts)||f.baseTurn!==s.turn||f.baseRevision!==s.revision||!f.state||f.state.turn!==s.turn||!text(f.request,8000,false)||!outcome(f.outcome)||(!Array.isArray(f.results)||!f.results.every(result))||!Array.isArray(f.entries)||!slots.includes(f.slot)||f.slot!==r.slot||f.sequence!==r.steps.length+1||f.baseFingerprint!==JSON.stringify({rng:s.rng,turn:s.turn,revision:s.revision}))throw new Error('情节待续记录损坏');
 }
}
