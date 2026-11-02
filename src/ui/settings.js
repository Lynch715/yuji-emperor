import { createDialogRequestScope, probeErrorMessage } from "./request-scope.js";
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
export function openSettings(config, metrics, onSave, recordMetric = null) {
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
      '>在本机记住密钥</label><p class="muted">只在这台设备保存密钥，取消勾选即可清除。</p><div class="dialog-actions"><button type="button" id="probe">测试连接</button><button class="primary" type="submit">保存设置</button></div></form><div id="probe-result" class="result hidden" role="status" aria-live="polite"></div><details><summary>请求统计 · <span id="request-count">' +
      metrics.length +
      '</span> 次</summary><p class="muted">只留用量记录，不保存密钥和正文。</p><div id="metric-list">' +
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
  const save = () => {
    if (form.querySelector('#probe').disabled || !form.reportValidity()) return false;
    const next = read();
    try {
      endpoint(next.base);
      localStorage.setItem(
        "yuji:settings",
        JSON.stringify({ ...next, key: next.remember ? next.key : "" }),
      );
      onSave(next);
      toast("设置已保存");
      return true;
    } catch (e) {
      toast(e.message);
      return false;
    }
  };
  $("#settings-form").onsubmit = (e) => {
    e.preventDefault();
    save();
  };
  const dialog=$("#modal"),form=$("#settings-form"),scope=createDialogRequestScope(dialog,form);
  const metricList=$("#metric-list"),metricCount=$("#request-count");
  const renderMetrics=()=>{
    metricCount.textContent=String(metrics.length);
    metricList.innerHTML=metrics.slice(-10).map(m=>'<p>'+esc(new Date(m.at).toLocaleTimeString('zh-CN'))+' · '+esc(({ok:'成功',cancelled:'已取消',timeout:'超时',failed:'未完成'})[m.result]||m.result)+' · HTTP '+Number(m.httpStatus||0)+' · '+Number(m.durationMs||0)+'ms · 输入 '+Number(m.inputTokens||0)+' / 输出 '+Number(m.outputTokens||0)+'</p>').join('');
  };
  renderMetrics();
  $("#probe").onclick = async () => {
    if(!form.reportValidity())return;
    const button=form.querySelector('#probe'),result=dialog.querySelector('#probe-result');
    const config=read();
    result.classList.remove('hidden');
    let request;
    try{endpoint(config.base);request=scope.begin();}catch(error){result.textContent=probeErrorMessage(error);return;}
    const controls=[...form.elements].map(el=>[el,el.disabled]);
    for(const [el]of controls)el.disabled=true;
    button.textContent='测试中…';
    result.setAttribute('aria-busy','true');
    result.textContent='正在连接……';
    let lastMetric;
    try {
      const reply=await callJSON(config,[{role:'user',content:'只输出 JSON：{"ok":true,"message":"御前接口已接通"}'}],{
        validate:validateProbe,
        signal:request.signal,
        onMetric:m=>{
          lastMetric=m;
          if(recordMetric)recordMetric(m);
          else {metrics.push(m);if(metrics.length>100)metrics.splice(0,metrics.length-100);}
          if(scope.current(request))renderMetrics();
        },
        onPartial:()=>{if(scope.current(request))result.textContent='正在等待回音……';},
      });
      if(scope.current(request))result.textContent='连接成功 · '+reply.message+'。保存设置后用于续写。';
    } catch(error) {
      if(scope.current(request))result.textContent=probeErrorMessage(error,lastMetric);
    } finally {
      if(scope.current(request)){
        for(const [el,disabled]of controls)el.disabled=disabled;
        button.textContent='测试连接';
        result.removeAttribute('aria-busy');
      }
      scope.finish(request);
    }
  };
  return { save };
}
