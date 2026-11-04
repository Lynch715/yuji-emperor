import { callJSON, createBudget } from "../llm/client.js";
import { turnMessages } from "../llm/prompts.js";
import { validateTurn } from "../llm/validate.js";
import {inspectNarrative,rewriteMessages,validateRewrites,applySentenceRewrites} from '../llm/rewrite.js';

// Interface narration must contain prose after settlement checks. An empty
// chapter is a failed response, never a reason to silently use trial text.
export function validateTurnNarrative(data, forecast) {
  const narrative = validateTurn(data, forecast);
  if (!Object.values(narrative.chapter).some((text) => text.trim()))
    throw new Error("正文为空，请保留本旬结果后重试");
  return narrative;
}

export async function requestTurnNarrative(config, state, forecast, options = {}) {
  const validate=data=>{const n=validateTurnNarrative(data,forecast);if(options.sceneSlot&&(!n.chapter[options.sceneSlot]?.trim()||n.chapter[options.sceneSlot].length>2400))throw new Error('情节正文为空，请重试');return n;};
  const saved = options.budget;
  const tracker=saved||{};
  const budget = createBudget((options.now || Date.now)());
  budget.used = saved?.used || 0;
  const rememberAttempts = () => {
    if (saved) {
      saved.used = budget.used;
      delete saved.started;
      delete saved.deadline;
    }
  };
  try {
    const requestOptions={...options,budget,onMetric:(metric)=>{
        rememberAttempts();
        options.onMetric?.(metric);
    }};
    while(budget.used<4){
      const candidate=await callJSON({...config},options.messages||turnMessages(state,forecast),{...requestOptions,validate:data=>{
        const inspected=inspectNarrative(data,forecast);
        if(!inspected.violations.length||tracker.rewriteAttempted)validate(data);
        return {data,...inspected};
      }});
      let data=candidate.data;
      if(candidate.violations.length&&!tracker.rewriteAttempted&&budget.used<4&&(options.now||Date.now)()<budget.deadline){
        tracker.rewriteAttempted=true;rememberAttempts();
        // Persist before sending: cancellation, reload and manual retry reuse this marker.
        await options.onBeforeRewrite?.();
        try{
          const rewrites=await callJSON({...config},rewriteMessages(forecast,candidate.violations),{...requestOptions,maxAttempts:1,onPartial:undefined,validate:validateRewrites});
          data=applySentenceRewrites(data,candidate.violations,rewrites);
        }catch(error){if(options.signal?.aborted)throw error;}
      }
      try{return validate(data);}catch(error){
        if(budget.used>=4||(options.now||Date.now)()>=budget.deadline)throw error;
      }
    }
    throw new Error('本回合请求预算已用完');
  } finally {
    rememberAttempts();
  }
}
