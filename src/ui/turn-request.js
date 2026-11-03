import { callJSON, createBudget } from "../llm/client.js";
import { turnMessages } from "../llm/prompts.js";
import { validateTurn } from "../llm/validate.js";

// Interface narration must contain prose after settlement checks. An empty
// chapter is a failed response, never a reason to silently use trial text.
export function validateTurnNarrative(data, forecast) {
  const narrative = validateTurn(data, forecast);
  if (!Object.values(narrative.chapter).some((text) => text.trim()))
    throw new Error("正文为空，请保留本旬结果后重试");
  return narrative;
}

export async function requestTurnNarrative(config, state, forecast, options = {}) {
  const saved = options.budget;
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
    return await callJSON({ ...config }, turnMessages(state, forecast), {
      ...options,
      budget,
      onMetric: (metric) => {
        rememberAttempts();
        options.onMetric?.(metric);
      },
      validate: (data) => validateTurnNarrative(data, forecast),
    });
  } finally {
    rememberAttempts();
  }
}
