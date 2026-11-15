import { provinceMentioned } from "../core/edicts.js";
import { edictFromText } from "../llm/intents.js";

export function oralScheduleEntry(state, text) {
  if (!text.trim()) throw new Error("请先拟写口谕");
  const slot = ["朝", "午", "夜"].find(key => !state.schedule[key]);
  if (!slot) throw new Error("日程已满，请先撤下一张行动卡");
  const type = edictFromText(text);
  return {
    slot,
    action: {
      kind: "下旨",
      edictType: type || "禁令",
      ...(type ? {} : { placeholder: true }),
      province: provinceMentioned(state, text),
      label: type || "口谕",
      text,
    },
  };
}
