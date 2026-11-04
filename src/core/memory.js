import {clone} from './state.js';
import {socialNPCs} from './social-rules.js';
import {textSentences} from './text.js';
const PRIVATE=/心想|暗想|心中|心底|暗自|私下|背地|未说出口|不为人知|秘密|内心|故意欺骗|骗过/;
export function publicMemoryQuote(prose,name){
 return textSentences(prose).filter(t=>t.length>=8&&t.length<=160&&!PRIVATE.test(t)&&(t.includes(name)||/[「“]/.test(t))).at(-1)||'';
}
function memoryEntry(s,r,phase,owner,prose,notes=[],legacy=false,era=null){
 const events=(phase.social||[]).filter(e=>e.targetId===owner.id||e.otherId===owner.id);
 const event=events.find(e=>e.kind==='humiliate'||e.kind==='deceive'&&e.status!=='success')||events[0];
 const hard=(phase.results||[]).filter(x=>['success','partial'].includes(x.status)&&!x.reused);
 const quote=notes.find(n=>n.personId===owner.id)?.evidence||publicMemoryQuote(prose,owner.name);
 const secret=event?.kind==='deceive'&&event.status==='success';
 const place=r.place?'在'+r.place:'在御前',emperor=legacy?'当时的皇帝':r.emperorName||s.emperor.name;
 const peer=event?.otherId?socialNPCs(s).find(p=>p.id===(event.targetId===owner.id?event.otherId:event.targetId))?.name||'另一位当事人':'';
 const phrase=secret?'听过'+emperor+'的一番解释':event?.kind==='reconcile'?emperor+'曾从中调解与'+peer+'的误会':event?.kind==='quarrel'?'曾与'+peer+'起过争执':event?.kind==='cooperate'?'曾与'+peer+'一道办事':event?.kind==='apologize'?emperor+'曾向其赔礼':event?.kind==='humiliate'?'曾被'+emperor+'斥责':event?.kind==='comfort'?'曾受'+emperor+'安慰':event?.kind==='protect'?'曾得'+emperor+'维护':event?.kind==='deceive'?'曾对'+emperor+'的一番话起过疑心':'曾与'+emperor+'相处';
 const result=phase.outcome.status==='failed'?'，那回未能把话说开。':phase.outcome.status==='partial'?'，虽有转机，仍留了些难处。':'。';
 const detail=secret?'':quote||hard.map(x=>x.summary).join('；');
 return {type:'scene',id:phase.id+':'+owner.id,sceneId:r.id,turn:phase.turn??s.turn,order:phase.sequence||0,kind:secret?'shared':event?.kind||'shared',otherId:peer?(event.targetId===owner.id?event.otherId:event.targetId):'',emperorId:r.emperorId||'',emperorName:legacy?'当时的皇帝':r.emperorName||s.emperor.name,people:r.people.map(p=>p.id),summary:(place+'，'+phrase+result+(detail?' '+detail:'')).slice(0,500),importance:hard.length||/承诺|约定|答应|约好|许诺/.test(detail)?3:event?2:1,...(era?{era:structuredClone(era)}:{})};
}
export function compactMemories(entries){
 const legacy=entries.filter(m=>!['scene','scene-summary'].includes(m?.type));
 const summaries=new Map(entries.filter(m=>m?.type==='scene-summary').map(m=>[m.id,structuredClone(m)]));
 const recent=[...new Map(entries.filter(m=>m?.type==='scene').map(m=>[m.id,structuredClone(m)])).values()].sort((a,b)=>a.turn-b.turn||a.order-b.order);
 while(recent.length>16){
  // Consequential acts and witnessed promises retain their own summaries.
  const old=recent.shift(),key='mem:'+(old.importance>=3?old.id:old.kind+':'+old.otherId+':'+old.emperorId);
  const previous=summaries.get(key);
  const first=previous?.first||old.summary,last=old.summary;
  summaries.set(key,{...old,type:'scene-summary',id:key,firstTurn:previous?.firstTurn??old.turn,count:(previous?.count||0)+1,first,last,summary:(first+(first===last?'':'；后来还记得：'+last)).slice(0,1000)});
 }
 return [...legacy,...summaries.values(),...recent];
}
function legacyEntries(s,id){
 const owner=socialNPCs(s).find(p=>p.id===id);if(!owner)return [];
 const out=[];
 for(const h of [...(s.volumes||[]).flatMap(v=>v.chapters),...(s.history||[])])for(const r of h.scenes||[]){
  if(!r.people.some(p=>p.id===id))continue;
  if(r.memoryVersion!==19)out.push(memoryEntry(s,r,{...r,turn:h.turn},owner,h.chapter?.[r.slot],r.memoryNotes||[],true,h.era));
  for(const t of r.steps||[])if(t.memoryVersion!==19)out.push(memoryEntry(s,r,{...t,turn:h.turn},owner,t.prose,t.memoryNotes||[],true,h.era));
 }
 return out;
}
export function npcMemories(s,id){
 const p=socialNPCs(s).find(p=>p.id===id);if(!p)return [];
 return compactMemories([...(p.memory||[]),...(p.memoryHydrated?[]:legacyEntries(s,id))]);
}
export function memoryContext(s,ids,limit=8){
 return [...new Set(ids)].map(id=>{
  const p=socialNPCs(s).find(p=>p.id===id);if(!p)return null;
  const memories=npcMemories(s,id).filter(m=>['scene','scene-summary'].includes(m?.type));
  const important=memories.filter(m=>m.type==='scene-summary'||m.importance>=2).sort((a,b)=>(['humiliate','deceive'].includes(b.kind)?4:0)+b.importance-(['humiliate','deceive'].includes(a.kind)?4:0)-a.importance||b.turn-a.turn).slice(0,3);
  const recent=memories.filter(m=>m.type==='scene').sort((a,b)=>b.turn-a.turn||b.order-a.order).slice(0,limit);
  return {id,name:p.name,往事:[...new Map([...important,...recent].map(m=>[m.id,m])).values()].slice(0,limit).map(m=>({经过:m.summary.slice(0,360),当时皇帝:m.emperorName,旬次:m.turn})),人物关系:Object.entries(p.relations||{}).filter(([other])=>socialNPCs(s).some(q=>q.id===other)).sort((a,b)=>Math.abs(b[1]-50)-Math.abs(a[1]-50)).slice(0,6).map(([other,value])=>({人物:socialNPCs(s).find(q=>q.id===other).name,亲近:value}))};
 }).filter(Boolean);
}
export function rememberNPCScene(state,r,phase,prose,notes=[],era=null){
 const s=clone(state);
 for(const cast of r.people){
  const p=socialNPCs(s).find(p=>p.id===cast.id);if(!p||p.alive===false||p.health<=0)continue;
  const complete=!s.recoveryOnly&&!s.volumeIndex?.length;
  const old=[...(p.memory||[]),...(!p.memoryHydrated&&complete?legacyEntries(s,p.id):[])];
  p.memory=compactMemories([...old,memoryEntry(s,r,phase,p,prose,notes,false,era)]);
  if(complete)p.memoryHydrated=true;
 }
 return s;
}
