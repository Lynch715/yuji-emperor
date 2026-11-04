import { callJSON, createBudget } from '../llm/client.js';
import { memorialMessages } from '../llm/prompts.js';
import { validateTurn } from '../llm/validate.js';
import { memorialText } from '../core/memorial-templates.js';

export function templateMemorialTexts(state,memorials){
 return memorials.map(m=>({id:m.id,text:m.text||memorialText(m,state.settings.prose==='modern'),status:'template'}));
}
export function validateMemorialTexts(data,state,memorials){
 if(!Array.isArray(data?.memorialTexts))throw new Error('奏折正文缺失');
 const f={state,newMemorials:memorials,entries:[],facts:[],notes:[],slotResults:{}};
 const checked=validateTurn({chapter:{朝:'奏报尚待御览。',午:'',夜:''},memorialTexts:data.memorialTexts},f,{skipAssertions:state.settings.freedom==='free'}).memorialTexts;
 return templateMemorialTexts(state,memorials).map(fallback=>{
  const item=checked.find(t=>t.id===fallback.id&&t.text.trim());
  return item?{...item,status:'ready'}:fallback;
 });
}
export async function requestMemorialTexts(config,state,memorials,options={}){
 if(!memorials.length)return [];
 const budget=createBudget((options.now||Date.now)());
 if(options.deadline)budget.deadline=Math.min(budget.deadline,options.deadline);
 try{
  return await callJSON(config,memorialMessages(state,memorials),{...options,budget,maxAttempts:1,onPartial:undefined,validate:data=>validateMemorialTexts(data,state,memorials)});
 }catch(error){
  if(options.signal?.aborted)throw error;
  return templateMemorialTexts(state,memorials);
 }
}
