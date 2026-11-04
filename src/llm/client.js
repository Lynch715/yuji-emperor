import { parseJSONLoose } from "./validate.js";
export const PRESETS = {
  deepseek: {
    label: "DeepSeek",
    base: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
  },
  qwen_cn: {
    label: "千问 · 北京",
    base: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.8-flash",
  },
  qwen_sg: {
    label: "千问 · 新加坡",
    base: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.8-flash",
  },
  qwen_us: {
    label: "千问 · 弗吉尼亚",
    base: "https://dashscope-us.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.8-flash",
  },
  custom: { label: "自定义兼容接口", base: "", model: "" },
};
export const MODEL_OPTIONS = {
  deepseek: [
    { id: "deepseek-v4-flash", note: "与参考实现一致的默认 Flash 预设。" },
    {
      id: "deepseek-v4-pro",
      note: "参考实现的 Pro 备选，偏重剧情质量，通常较慢、成本较高。",
    },
  ],
  qwen: [
    {
      id: "qwen3.8-flash",
      note: "与参考实现一致的默认 Flash 预设，适合控制调用成本。",
    },
    { id: "qwen3.7-plus", note: "参考实现的 Plus 备选，费用按所选地域计费。" },
    {
      id: "qwen3.8-max",
      note: "参考实现的 Max 备选，成本较高，请核对服务商价格。",
    },
  ],
};
export function modelsFor(provider) {
  return MODEL_OPTIONS[provider?.startsWith("qwen") ? "qwen" : provider] || [];
}
export function modelDescription(provider, model) {
  return (
    modelsFor(provider).find((m) => m.id === model)?.note ||
    "保留自填模型名；请确认该模型支持兼容接口、流式回复和 JSON 输出。"
  );
}
export function createBudget(now = Date.now()) {
  return { used: 0, started: now, deadline: now + 240000 };
}
export function endpoint(base) {
  let u;
  try {
    u = new URL(base);
  } catch {
    throw new Error("请填写有效的 API 地址");
  }
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !(
      u.protocol === "https:" ||
      (u.protocol === "http:" &&
        ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname))
    )
  )
    throw new Error(
      "API 地址须为 HTTPS，本地测试可使用 HTTP；不要在地址中放密钥",
    );
  return (
    u.href.replace(/\/+$/, "").replace(/\/chat\/completions$/, "") +
    "/chat/completions"
  );
}
export function requestBody(config, messages) {
  const body = {
    model: config.model,
    messages,
    stream: true,
    max_tokens: config.thinking ? 16000 : 6000,
    response_format: { type: "json_object" },
  };
  if (config.provider === "deepseek")
    body.thinking = { type: config.thinking ? "enabled" : "disabled" };
  if (config.provider?.startsWith("qwen")) {
    body.enable_thinking = !!config.thinking;
    body.stream_options = { include_usage: true };
  }
  return body;
}
export async function readResponse(response, onPartial = () => {}) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const j = await response.json();
    const content = j.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim())
      throw new Error("EMPTY");
    if (j.choices?.[0]?.finish_reason === "length")
      throw new Error("TRUNCATED");
    onPartial(content);
    return { text: content, usage: j.usage || {} };
  }
  if (!response.body) throw new Error("EMPTY");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    text = "",
    usage = {},
    finished = false,
    reason = "";
  function consume(line) {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (data === "[DONE]") {
      finished = true;
      return;
    }
    if (!data) return;
    let j;
    try {
      j = JSON.parse(data);
    } catch {
      throw new Error("STREAM_INVALID");
    }
    if (j.error) throw new Error("STREAM_ERROR");
    if (j.usage) usage = j.usage;
    const choice = j.choices?.[0];
    if (choice?.finish_reason) {
      reason = choice.finish_reason;
      finished = true;
    }
    const delta = choice?.delta?.content;
    if (typeof delta === "string") {
      text += delta;
      if (text.length > 1500000) throw new Error("TOO_LARGE");
      onPartial(text);
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) consume(line.replace(/\r$/, ""));
      if (done) break;
    }
    if (buffer.trim()) consume(buffer.replace(/\r$/, ""));
    if (!finished) throw new Error("STREAM_CUT");
    if (!text.trim()) throw new Error("EMPTY");
    if (reason === "length") throw new Error("TRUNCATED");
    return { text, usage };
  } finally {
    try {
      await reader.cancel();
    } catch {}
    reader.releaseLock();
  }
}
export async function callJSON(config, messages, options = {}) {
  if (!config.key?.trim()) throw new Error("请先在设置中填写 API 密钥");
  if (!config.model?.trim()) throw new Error("请填写模型名称");
  const url = endpoint(config.base),
    budget = options.budget || createBudget();
  const now = options.now || Date.now,
    sleep = options.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const fetcher = options.fetcher || fetch;
  const attemptLimit=Math.min(4,budget.used+(options.maxAttempts??4));
  let lastError;
  while (budget.used < attemptLimit && now() < budget.deadline) {
    if (options.signal?.aborted) throw new Error("请求已取消");
    budget.used++;
    const ac = new AbortController(),
      started = now();
    let status = 0,
      result = "failed",
      usage = {},
      timedOut = false,
      timer;
    const abort = () => ac.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    let rejectStop;
    const stopped = new Promise((_, reject) => {
      rejectStop = reject;
    });
    const stop = () => {
      timedOut = true;
      ac.abort();
      rejectStop(new Error("TIMEOUT"));
    };
    timer = setTimeout(stop, Math.max(1, budget.deadline - now()));
    const cancel = () => rejectStop(new Error("CANCELLED"));
    options.signal?.addEventListener("abort", cancel, { once: true });
    let retryable = false,
      waitMs = 500 * budget.used;
    try {
      options.onPartial?.("");
      const response = await Promise.race([
        fetcher(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + config.key.trim(),
          },
          body: JSON.stringify(requestBody(config, messages)),
          signal: ac.signal,
          redirect: "error",
        }),
        stopped,
      ]);
      status = response.status;
      if (!response.ok) {
        retryable = status === 408 || status === 429 || status >= 500;
        const wait = Number(response.headers.get("retry-after"));
        if (Number.isFinite(wait) && wait > 0)
          waitMs = Math.min(wait * 1000, 10000);
        throw new Error("HTTP " + status);
      }
      const output = await Promise.race([
        readResponse(response, options.onPartial),
        stopped,
      ]);
      usage = output.usage;
      const parsed = parseJSONLoose(output.text);
      const validated = options.validate ? options.validate(parsed) : parsed;
      result = "ok";
      return validated;
    } catch (error) {
      const message = error.message || "";
      if (options.signal?.aborted) {
        result = "cancelled";
        throw new Error("请求已取消");
      }
      if (timedOut) {
        result = "timeout";
        throw new Error("本回合请求已达 240 秒预算，请保留预演结果后重试");
      }
      retryable ||= !status || status === 200;
      // Never propagate provider bodies, request text, URL, or credentials.
      lastError = new Error(
        /^HTTP \d+$/.test(message)
          ? message + "：请检查接口权限或稍后重试"
          : "模型回复未完成或格式有误，原有进度已保留",
      );
      if (!retryable) throw lastError;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      options.signal?.removeEventListener("abort", cancel);
      options.onMetric?.({
        at: started,
        attempt: budget.used,
        durationMs: Math.max(0, now() - started),
        httpStatus: status,
        result,
        inputTokens: Number(usage.prompt_tokens) || 0,
        outputTokens: Number(usage.completion_tokens) || 0,
        // 千问/OpenAI 兼容：prompt_tokens_details.cached_tokens；DeepSeek：prompt_cache_hit_tokens。
        cachedTokens: Number(usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens) || 0,
      });
    }
    if (budget.used < attemptLimit && now() + waitMs < budget.deadline)
      await sleep(waitMs);
  }
  throw lastError || new Error("本回合请求预算已用完（最多 4 次、240 秒）");
}
