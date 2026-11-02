import { createState } from "../core/state.js";
import { initialTurn } from "../core/turn.js";
import { selectAmbitions } from "../core/ambitions.js";
import { applyWorld } from "../core/world.js";
import { callJSON } from "../llm/client.js";
import { worldMessages } from "../llm/prompts.js";
import { validateWorld } from "../llm/validate.js";

let seedSequence = 0;
// This is an opening seed, not an authentication token. All game rolls still
// use core/rng.js. Missing/restricted UUID APIs must not block the start form.
export function createGameSeed(cryptoAPI = globalThis.crypto, now = Date.now) {
  try {
    const id = cryptoAPI?.randomUUID?.();
    if (typeof id === "string" && id.trim()) return id;
  } catch {}
  try {
    if (typeof cryptoAPI?.getRandomValues === "function") {
      const words = cryptoAPI.getRandomValues(new Uint32Array(4));
      return "opening-" + [...words].map((n) => n.toString(16).padStart(8, "0")).join("");
    }
  } catch {}
  return "opening-" + now().toString(36) + "-" + (++seedSequence).toString(36);
}

export async function createOpening(options, goals, config, requestOptions = {}) {
  const name = options.name?.trim(), era = options.era?.trim();
  if (!name) throw new Error("请填写皇帝名");
  if (!era) throw new Error("请填写年号");
  if (!options.demo && !config.key?.trim())
    throw new Error("请先填写接口密钥，或选择试读。");
  const { onStage = () => {}, ...request } = requestOptions;
  onStage(options.demo ? "正在准备登基与六部奏报……" : "正在拟定朝局与人物，请稍候……");
  let draft = createState({ ...options, name, era, seed: options.seed ?? createGameSeed() });
  if (!options.demo) {
    const world = await callJSON(config, worldMessages(draft), {
      ...request,
      validate: validateWorld,
    });
    draft = applyWorld(draft, world);
  }
  return initialTurn(selectAmbitions(draft, goals));
}

export function openingErrorMessage(error) {
  const message = error?.message || "";
  if (/randomUUID|structuredClone|is not a function|not defined|DataCloneError/.test(message))
    return "当前浏览器缺少开局所需能力，请用系统浏览器打开后重试。";
  return message || "开局未完成，请重试。";
}
