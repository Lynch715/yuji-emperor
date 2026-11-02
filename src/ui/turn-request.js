import { callJSON } from "../llm/client.js";
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

export function requestTurnNarrative(config, state, forecast, options = {}) {
  return callJSON({ ...config }, turnMessages(state, forecast), {
    ...options,
    validate: (data) => validateTurnNarrative(data, forecast),
  });
}
