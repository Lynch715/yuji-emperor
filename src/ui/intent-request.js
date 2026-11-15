import { callJSON, createBudget } from '../llm/client.js';
import { intentInputs, intentMessages, validateIntents, localIntents } from '../llm/intents.js';
import { localRemarkKind, classifyMemorialSchedule } from '../llm/remark-classifier.js';
import { REMARK_KINDS } from '../core/memorial-decisions.js';
export async function requestPlayerIntents(config,state,inputs,options={}){
 if(!inputs.length)return [];
 if(state.settings.demo||options.local)return localIntents(state,inputs);
 return callJSON(config,intentMessages(state,inputs),{...options,budget:createBudget(),validate:data=>validateIntents(data,state,inputs)});
}

const talkActionWords = /赐|赏|拨|调|任命|任用|任.*为|升任|出任|升官|升迁|升为|擢升|罢|革职|免职|斩|杀|处死|下狱|收监|宣战|议和|出兵|征兵|募兵|嘉奖|申饬|增兵|惩处|复活|创建|设为|转.*两|给.*两|借.*两/;
export function requestTalkIntents(config,state,line,options={}) {
 if(!talkActionWords.test(line))return [];
 const input={id:'talk-'+state.turn+'-'+state.talks.length,slot:'午',text:line};
 return requestPlayerIntents(config,state,[input],options);
}

export async function requestScheduleIntents(config,state,schedule,options={}){
 const inputs=intentInputs(schedule).filter(i=>!i.id.includes(':remark:')||localRemarkKind(i.text)===null);
 let intents=[],remarks=[];
 if(inputs.length){
  if(state.settings.demo||options.local)intents=localIntents(state,inputs);
  else{
   const budget=createBudget((options.now||Date.now)());
   // Keep time available for writing the turn even when intent parsing times out.
   if(options.deadline)budget.deadline=Math.min(budget.deadline,options.deadline-20000);
   try {
    const result=await callJSON(config,intentMessages(state,inputs),{...options,budget,maxAttempts:1,validate:data=>{
    const actions=validateIntents(data,state,inputs);
    const seen=new Set(),kinds=(Array.isArray(data.remarks)?data.remarks:[]).filter(r=>{
     if(!inputs.some(i=>i.id===r?.inputId&&i.id.includes(':remark:'))||!REMARK_KINDS.includes(r.remarkKind)||seen.has(r.inputId))return false;
     seen.add(r.inputId);return true;
    }).map(({inputId,remarkKind})=>({inputId,remarkKind}));
    return {actions,kinds};
    }});
    intents=result.actions;remarks=result.kinds;
   } catch(error) {
    if(options.signal?.aborted)throw error;
    intents=localIntents(state,inputs);
    options.onFallback?.();
   }
  }
 }
 const missing=inputs.filter(i=>schedule[i.slot]?.kind==='下旨'&&i.id===i.slot&&!intents.some(a=>a.inputId===i.id));
 if(missing.length)intents.push(...localIntents(state,missing));
 return {schedule:classifyMemorialSchedule(schedule,remarks),intents};
}
