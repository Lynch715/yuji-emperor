import { callJSON, createBudget } from '../llm/client.js';
import { intentInputs, intentMessages, validateIntents, localIntents } from '../llm/intents.js';
import { localRemarkKind, classifyMemorialSchedule } from '../llm/remark-classifier.js';
import { REMARK_KINDS } from '../core/memorial-decisions.js';
export async function requestPlayerIntents(config,state,inputs,options={}){
 if(!inputs.length)return [];
 if(state.settings.demo||options.local)return localIntents(state,inputs);
 return callJSON(config,intentMessages(state,inputs),{...options,budget:createBudget(),validate:data=>validateIntents(data,state,inputs)});
}
export async function requestScheduleIntents(config,state,schedule,options={}){
 const inputs=intentInputs(schedule).filter(i=>!i.id.includes(':remark:')||localRemarkKind(i.text)===null);
 let intents=[],remarks=[];
 if(inputs.length){
  if(state.settings.demo||options.local)intents=localIntents(state,inputs);
  else{
   const budget=createBudget((options.now||Date.now)());if(options.deadline)budget.deadline=Math.min(budget.deadline,options.deadline);
   const result=await callJSON(config,intentMessages(state,inputs),{...options,budget,maxAttempts:1,validate:data=>{
    const actions=validateIntents(data,state,inputs);
    const seen=new Set(),kinds=(Array.isArray(data.remarks)?data.remarks:[]).filter(r=>{
     if(!inputs.some(i=>i.id===r?.inputId&&i.id.includes(':remark:'))||!REMARK_KINDS.includes(r.remarkKind)||seen.has(r.inputId))return false;
     seen.add(r.inputId);return true;
    }).map(({inputId,remarkKind})=>({inputId,remarkKind}));
    return {actions,kinds};
   }});
   intents=result.actions;remarks=result.kinds;
  }
 }
 return {schedule:classifyMemorialSchedule(schedule,remarks),intents};
}
