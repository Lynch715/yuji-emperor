import { $, esc, openDialog, toast } from "./common.js";
import {
  PRESETS,
  callJSON,
  endpoint,
  modelsFor,
} from "../llm/client.js";
import { validateProbe } from "../llm/validate.js";
export function loadSettings() {
  const defaults = {
    provider: "deepseek",
    ...PRESETS.deepseek,
    key: "",
    thinking: false,
    remember: false,
  };
  try {
    const data = JSON.parse(localStorage.getItem("yuji:settings") || "{}");
    return { ...defaults, ...data };
  } catch {
    return defaults;
  }
}
export function openSettings(config, metrics, onSave) {
  openDialog(
    "御前设置",
    '<p class="muted">填写叙事接口，续写本纪。密钥只用于所填地址，不随存档导出。</p><form id="settings-form"><label for="provider">服务商与地域</label><select id="provider">' +
      Object.entries(PRESETS)
        .map(
          ([id, p]) =>
            '<option value="' +
            id +
            '" ' +
            (id === config.provider ? "selected" : "") +
            ">" +
            esc(p.label) +
            "</option>",
        )
        .join("") +
      '</select><label for="model-preset">模型预设</label><select id="model-preset"></select><p id="model-description" class="muted" role="note"></p><label for="api-base">API 地址</label><input id="api-base" type="url" required value="' +
      esc(config.base) +
      '" autocomplete="off"><label for="api-model">模型名称</label><input id="api-model" required value="' +
      esc(config.model) +
      '" autocomplete="off"><label for="api-key">API 密钥</label><input id="api-key" type="password" required value="' +
      esc(config.key) +
      '" autocomplete="off"><label class="check"><input type="checkbox" id="thinking" ' +
      (config.thinking ? "checked" : "") +
      '>启用思考模式</label><label class="check"><input type="checkbox" id="remember-key" ' +
      (config.remember ? "checked" : "") +
      '>在本机记住密钥</label><p class="muted">只在这台设备保存密钥，取消勾选即可清除。</p><div class="dialog-actions"><button type="button" id="probe">测试连接</button><button class="primary" type="submit">保存设置</button></div></form><div id="probe-result" class="result hidden" role="status" aria-live="polite"></div><details><summary>请求统计 · ' +
      metrics.length +
      ' 次</summary><p class="muted">只留用量记录，不保存密钥和正文。</p><div id="metric-list">' +
      metrics
        .slice(-10)
        .map(
          (m) =>
            "<p>" +
            new Date(m.at).toLocaleTimeString("zh-CN") +
            " · " +
            esc(m.result) +
            " · " +
            m.durationMs +
            "ms · " +
            m.inputTokens +
            "/" +
            m.outputTokens +
            " tokens</p>",
        )
        .join("") +
      "</div></details>",
  );
  const read = () => ({
    provider: $("#provider").value,
    base: $("#api-base").value.trim(),
    model: $("#api-model").value.trim(),
    key: $("#api-key").value.trim(),
    thinking: $("#thinking").checked,
    remember: $("#remember-key").checked,
  });
  const explain = () => {
    const name=$("#api-model").value.trim();
    $("#model-description").textContent = ({
      'deepseek-v4-flash':'默认叙事型号。',
      'deepseek-v4-pro':'进阶选项，请确认账户已开通。',
      'qwen3.8-flash':'默认叙事型号，地域须与账户一致。',
      'qwen3.7-plus':'可选型号，地域须与账户一致。',
      'qwen3.8-max':'可选型号，请确认账户已开通。',
    })[name] || '按服务商提供的名称填写，接口需支持流式回复和结构化输出。';
  };
  const presets = () => {
    const choices = modelsFor($("#provider").value);
    $("#model-preset").innerHTML =
      choices
        .map(
          (m) => '<option value="' + esc(m.id) + '">' + esc(m.id) + "</option>",
        )
        .join("") + '<option value="custom">自行填写</option>';
    $("#model-preset").value = choices.some(
      (m) => m.id === $("#api-model").value,
    )
      ? $("#api-model").value
      : "custom";
    explain();
  };
  presets();
  $("#model-preset").onchange = () => {
    if ($("#model-preset").value !== "custom")
      $("#api-model").value = $("#model-preset").value;
    explain();
  };
  $("#api-model").oninput = presets;
  $("#provider").onchange = () => {
    const p = PRESETS[$("#provider").value];
    $("#api-base").value = p.base;
    $("#api-model").value = p.model;
    presets();
  };
  $("#settings-form").onsubmit = (e) => {
    e.preventDefault();
    const next = read();
    try {
      endpoint(next.base);
      localStorage.setItem(
        "yuji:settings",
        JSON.stringify({ ...next, key: next.remember ? next.key : "" }),
      );
      onSave(next);
      toast("设置已保存");
    } catch (e) {
      toast(e.message);
    }
  };
  const ac = new AbortController();
  $("#modal").addEventListener("close", () => ac.abort(), { once: true });
  $("#probe").onclick = async () => {
    const button = $("#probe"),
      result = $("#probe-result");
    button.disabled = true;
    result.classList.remove("hidden");
    result.textContent = "正在连接……";
    try {
      const reply = await callJSON(
        read(),
        [
          {
            role: "user",
            content: '只输出 JSON：{"ok":true,"message":"御前接口已接通"}',
          },
        ],
        {
          validate: validateProbe,
          signal: ac.signal,
          onMetric: (m) => {
            metrics.push(m);
          },
          onPartial: () => {
            if (result.isConnected) result.textContent = "正在等待回音……";
          },
        },
      );
      result.textContent = "连接成功 · " + reply.message;
    } catch (e) {
      if (result.isConnected) result.textContent = e.message;
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };
}
