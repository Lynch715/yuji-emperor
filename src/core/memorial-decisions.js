export const REMARK_KINDS=['嘉奖','申饬','附旨','无'];
export function memorialDecision(action,id){
 const value=action?.decisions?.[id];
 if(value!==undefined&&typeof value!=='string'){
  if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.option!=='string'||(value.remark!==undefined&&typeof value.remark!=='string')||(value.remarkKind!==undefined&&!REMARK_KINDS.includes(value.remarkKind)))throw new Error('逐本朱批决定格式无效');
 }
 const object=value&&typeof value==='object'&&!Array.isArray(value)?value:null;
 const option=typeof value==='string'?value:typeof object?.option==='string'?object.option:action?.decision||'approve';
 const remark=typeof object?.remark==='string'?object.remark:typeof action?.remark==='string'?action.remark:'';
 return {option,remark:remark.slice(0,100),...(REMARK_KINDS.includes(object?.remarkKind)?{remarkKind:object.remarkKind}:{})};
}
export function normalizeMemorialAction(action){
 if(!action||!['上朝','批折'].includes(action.kind))return action;
 return {...action,decisions:Object.fromEntries((action.memorials||[]).map(id=>[id,memorialDecision(action,id)]))};
}
export function remarkCategory(text){
 // Scope negation to the clause. “责成” is a task assignment, never blame.
 const affirmative=String(text).split(/[，,。；;！？!?]/).filter(t=>!/(?:不必|无需|无须|不要|不得|不可|不宜|不应|勿|毋|莫|并非|未予)/.test(t)).join('，');
 if(/申饬|斥责|责罚|严查|敷衍|懈怠/.test(affirmative))return '申饬';
 if(/嘉奖|有功|可嘉|甚善|勤勉/.test(affirmative))return '嘉奖';
 if(/责成|着令|令其|另拟|附旨|交.*核/.test(affirmative))return '附旨';
 return '无';
}
