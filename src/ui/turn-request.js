import { callJSON, createBudget } from "../llm/client.js";
import { turnMessages } from "../llm/prompts.js";
import { inspectNarrative } from '../llm/validate.js';
import { requestMemorialTexts } from './memorial-request.js';

export function validateTurnNarrative(data, forecast) {
  if (!data?.chapter || !['朝','午','夜'].every(k=>typeof data.chapter[k]==='string'))
    throw new Error('章节须包含朝、午、夜三段');
  if (!['朝','午','夜'].some(slot=>data.chapter[slot].trim()))
    throw new Error('正文为空，请保留本旬结果后重试');
  // Assertion repairs are local, including a paragraph emptied by deletion.
  return inspectNarrative(data,forecast,{repairEmpty:true}).narrative;
}

export async function requestTurnNarrative(config, state, forecast, options = {}) {
  const budget=createBudget((options.now||Date.now)());
  budget.used=options.budget?.used||0;
  if(options.deadline)budget.deadline=Math.min(budget.deadline,options.deadline);
  const remember=()=>{
    if(!options.budget)return;
    options.budget.used=budget.used;
    delete options.budget.started;delete options.budget.deadline;
  };
  try{
    return await callJSON(config,options.messages||turnMessages(state,forecast),{
      ...options,budget,onMetric:metric=>{remember();options.onMetric?.(metric);},
      validate:data=>{
        // Only raw structure/empty prose can require another model request.
        if(options.sceneSlot&&(!data?.chapter?.[options.sceneSlot]?.trim()||data.chapter[options.sceneSlot].length>2400))throw new Error('情节正文为空，请重试');
        // Ignore stray legacy memorialTexts from the main response.
        return validateTurnNarrative({...data,memorialTexts:[]},forecast);
      },
    });
  }finally{remember();}
}

export async function requestTurnContent(config,state,forecast,options={}){
  const deadline=options.deadline??(options.now||Date.now)()+90000;
  const ac=new AbortController(),abort=()=>ac.abort();
  if(options.signal?.aborted)abort();
  options.signal?.addEventListener('abort',abort,{once:true});
  const parallel={...options,deadline,signal:ac.signal};
  try{
    const [narrative,memorialTexts]=await Promise.all([
      requestTurnNarrative(config,state,forecast,parallel),
      requestMemorialTexts(config,forecast.state,forecast.newMemorials,parallel),
    ]);
    return {...narrative,memorialTexts};
  }catch(error){ac.abort();throw error;}
  finally{options.signal?.removeEventListener('abort',abort);}
}
