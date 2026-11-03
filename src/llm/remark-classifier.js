import { normalizeMemorialAction, memorialDecision, REMARK_KINDS } from '../core/memorial-decisions.js';
// Request injection keeps orchestration testable without network access. This
// runs before forecast only; a saved pending forecast is never classified again.
export async function classifyMemorialSchedule(schedule,request){
 const next=structuredClone(schedule);
 for(const [slot,action]of Object.entries(next)){
  if(!action||!['上朝','批折'].includes(action.kind))continue;
  const normalized=normalizeMemorialAction(action);next[slot]=normalized;
  for(const id of normalized.memorials||[]){
   const d=memorialDecision(normalized,id);if(!d.remark)continue;
   try{
    const result=await request(d.remark);
    if(REMARK_KINDS.includes(result?.kind))normalized.decisions[id]={...d,remarkKind:result.kind};
   }catch{/* The engine's negation-aware fallback remains authoritative. */}
  }
 }
 return next;
}
