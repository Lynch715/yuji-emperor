import { normalizeMemorialAction, remarkCategory, REMARK_KINDS } from '../core/memorial-decisions.js';
// Substantive orders still need intent parsing, even with praise or blame.
export function localRemarkKind(text){
 const value=String(text).trim();
 if(/赐死|处死|斩首|下狱|收监|罢免|革职|任命|出任|升任|晋升|拨|调兵|征兵|宣战|议和|出兵|赏银|赐银|修河|赈灾|减赋|加税|整饬吏治|大赦|修园|开海|立储|禅位|禁令/.test(value))return null;
 if(/申饬|斥责|责罚|严查|敷衍|懈怠|嘉奖|有功|可嘉|甚善|勤勉|责成|着令|令其|另拟|附旨|交.*核/.test(value))return remarkCategory(value);
 if(/^(知道了|已阅|阅|无|悉)[。！!\s]*$/.test(value))return '无';
 return null;
}
// No network here; persisted pending turns are never classified again.
export function classifyMemorialSchedule(schedule,remarks=[]){
 const next=structuredClone(schedule);
 for(const [slot,action]of Object.entries(next)){
  if(!action||!['上朝','批折'].includes(action.kind))continue;
  const normalized=normalizeMemorialAction(action);next[slot]=normalized;
  for(const [id,d]of Object.entries(normalized.decisions)){
   delete d.remarkKind;
   if(!d.remark.trim())continue;
   const kind=localRemarkKind(d.remark)??remarks.find(r=>r.inputId===slot+':remark:'+id)?.remarkKind;
   if(REMARK_KINDS.includes(kind))d.remarkKind=kind;
  }
 }
 return next;
}
