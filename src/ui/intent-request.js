import { callJSON, createBudget } from '../llm/client.js';
import { intentInputs, intentMessages, validateIntents, localIntents } from '../llm/intents.js';
export async function requestPlayerIntents(config,state,inputs,options={}){
 if(!inputs.length)return [];
 if(state.settings.demo||options.local)return localIntents(state,inputs);
 return callJSON(config,intentMessages(state,inputs),{...options,budget:createBudget(),validate:data=>validateIntents(data,state,inputs)});
}
export async function requestScheduleIntents(config,state,schedule,options={}){return requestPlayerIntents(config,state,intentInputs(schedule),options);}
