import { TEXT_LIMITS } from '../core/text.js';
import { memorialParagraphHTML, memorialAuthor, memorialSignature } from './memorial-document.js';
import { freedomRules } from "../core/freedom.js";
import { postTitle } from "../core/scenarios.js";
import { memorialDecision } from "../core/memorial-decisions.js";
import { onDialogExit } from "./request-scope.js";
import { $, esc, openDialog, closeDialog, toast } from "./common.js";
import { forecastTurn, validateSchedule } from "../core/turn.js";
import { EDICTS, execution } from "../core/edicts.js";
import { campaignChoiceBlock } from '../core/campaign-rules.js';
import { cabinetDraft } from "../core/court.js";
import {
  memorialAssignments,
  availableMemorials,
  memorialDecisionLabel,
} from "./memorial-state.js";
const number = (n) =>
  Number(n).toLocaleString("zh-CN", { maximumFractionDigits: 1 });
export function createMemorialSession(
  s,
  kind,
  preferred = "朝",
  startId = null,
  options = {},
) {
  let slot =
    kind === "上朝"
      ? "朝"
      : ["朝", "午"].includes(preferred)
        ? preferred
        : "朝";
  if (options.newBatch) {
    const slots = kind === "上朝" ? ["朝"] : ["朝", "午"];
    slot =
      slots.find((sl) => sl === slot && !s.schedule[sl]) ||
      slots.find((sl) => !s.schedule[sl]);
    if (!slot)
      throw new Error(
        kind === "上朝"
          ? "朝间已有安排，请从日程改批或撤下原安排。"
          : "朝、午已有安排，请先完成本旬或撤下安排。",
      );
  }
  const old = s.schedule[slot]?.kind === kind ? s.schedule[slot] : null;
  const available = availableMemorials(s, old ? slot : null);
  let ids =
    old?.memorials?.filter((id) => available.some((m) => m.id === id)) ||
    available.slice(0, kind === "上朝" ? freedomRules(s).courtLimit : 6).map((m) => m.id);
  if (startId) {
    if (!available.some((m) => m.id === startId))
      throw new Error("此折已拟批，请从原日程改批。");
    ids = [startId];
  }
  if (!ids.length) throw new Error("奏报已批好，可以起驾了。");
  const choices = {},
    remarks = {};
  for (const id of ids) {
    const d = memorialDecision(old, id);
    remarks[id] = old ? d.remark : "";
    if (old && !startId) choices[id] = d.option;
  }
  return {
    kind,
    slot,
    originalSlot: old ? slot : null,
    ids,
    index: 0,
    choices,
    remarks,
    stance: old?.stance || "依旨施行",
    target: old?.target || s.court.officials[0]?.id || "",
    remark: old?.remark || "",
  };
}
// 未选择的非急报按票拟填入；急报必须御览亲裁。返回填入的本数。
export function applyCabinetDrafts(s, session) {
  let filled = 0;
  for (const id of session.ids) {
    if (session.choices[id]) continue;
    const m = s.memorials.find((x) => x.id === id);
    if (!m || m.urgent) continue;
    const draft = cabinetDraft(s, m);
    if (draft) { session.choices[id] = draft.option; filled++; }
  }
  return filled;
}
function legacyChoice(m, value) {
  if (value === "opt0" && m.options[0]?.id === value) return "approve";
  if (value === "opt1" && m.options[1]?.id === value) return "reject";
  return value;
}
export function memorialAction(s, session) {
  if (!session.ids.length) throw new Error("请至少选择一本奏报");
  if (session.kind === "上朝" && session.ids.length > freedomRules(s).courtLimit)
    throw new Error("上朝最多"+(freedomRules(s).courtLimit===3?"三个":freedomRules(s).courtLimit+"个")+"议题");
  if (session.ids.some((id) => !session.choices[id]))
    throw new Error("请逐本选择御批");
  if (new Set(session.ids).size !== session.ids.length)
    throw new Error("同一奏报不能重复处置");
  if (session.ids.some((id) => !s.memorials.some((m) => m.id === id)))
    throw new Error("奏报已处置或不存在");
  const decisions = Object.fromEntries(
    session.ids.map((id) => [
      id,
      {
        option: session.choices[id],
        remark: String(session.remarks?.[id] ?? session.remark ?? "").slice(
          0,
          TEXT_LIMITS.remark,
        ),
      },
    ]),
  );
  const action = {
    kind: session.kind,
    memorials: [...session.ids],
    decisions,
    stance: session.stance,
    target: session.target,
    label: session.ids.length + " 本奏报",
  };
  validateSchedule(s, { ...s.schedule, [session.slot]: action });
  return action;
}
export function scheduledMemorialDialog(s, id) {
  const m = s.memorials.find((m) => m.id === id),
    assigned = memorialAssignments(s).get(id);
  if (!m || !assigned) return;
  const label = memorialDecisionLabel(m, assigned.decision);
  openDialog(
    "已拟批 · 本旬待发",
    '<article class="paper scheduled-memorial"><h3>' +
      esc(m.title) +
      '</h3><p class="decision-summary">' +
      esc(assigned.slot) +
      "间 · " +
      esc(label) +
      "</p><p>这本奏折已批好，起驾后便会传旨。</p>" +
      (assigned.remark
        ? '<p class="saved-remark">朱批：' + esc(assigned.remark) + "</p>"
        : "") +
      '<p class="muted">若要修改，请编辑原日程中的这次御批。</p></article><div class="dialog-actions"><button data-edit-review-slot="' +
      esc(assigned.slot) +
      '">编辑' +
      esc(assigned.slot) +
      "间拟批</button></div>",
    "drawer",
  );
}
export function effectItems(effects, s, prefix = "") {
  const names = {
    treasury: "国库",
    privy: "内帑",
    grain: "粮储",
    morale: "民心",
    governance: "吏治",
    prestige: "皇威",
    virtue: "圣德",
    health: "健康",
    mood: "心情",
    favor: "好感",
    disaster: "灾情",
    stage: "阶段",
    result: "结果",
    readiness: "战备",
    threat: "边患",
    attitude: "态度",
  };
  const result = [];
  for (const [key, value] of Object.entries(effects || {})) {
    if (key === "id") continue;
    if (value && typeof value === "object") {
      let name = key;
      if (key === "province")
        name =
          s.nation.provinces.find((p) => p.id === value.id)?.name || "州郡";
      if (key === "official")
        name = s.court.officials.find((p) => p.id === value.id)?.name || "官员";
      if (key === "thread") name = "事件";
      if (key === "army") name = value.id === "capital" ? "京营" : value.id + "境";
      if (key === "foreign")
        name = s.foreign.find(f => f.id === value.id)?.name || "外邦";
      if (key === "faction") {
        for (const [id, n] of Object.entries(value))
          result.push({
            label:
              (s.court.factions.find((f) => f.id === id)?.name || id) + "态度",
            value: n,
            unit: "",
          });
      } else result.push(...effectItems(value, s, name));
    } else
      result.push({
        label: (prefix ? prefix + " " : "") + (names[key] || key),
        value,
        unit: ["treasury", "privy"].includes(key)
          ? " 万两"
          : key === "grain"
            ? " 万石"
            : "",
      });
  }
  return result;
}
export function effectLabel(value, unit = "") {
  if (typeof value !== "number") return String(value ?? "");
  if (value === 0) return "0" + unit;
  return (
    (value > 0 ? "+" : "−") +
    Math.abs(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 }) +
    unit
  );
}
export function factionDemandReason(s, speaker, memorial) {
  const faction = s.court.factions.find((f) => f.id === speaker.faction);
  if (!faction?.demand) return "";
  return (
    faction.name +
    " · " +
    (memorial.type || "政务") +
    "议题：派系诉求「" +
    faction.demand +
    "」"
  );
}
export function memorialOptions(s, m) {
  const options = m.options.map((o) => ({ ...o,
    disabled: !!campaignChoiceBlock(s,m,o)||["treasury", "privy", "grain"].some(k => (s.nation[k] || 0) < -(o.effects?.[k] || 0))
  }));
  if (!options.some((o) => o.id === "hold"))
    options.push({ id: "hold", label: "留中", effects: {} });
  options.push({
    id: "discuss",
    label: "发部议",
    effects: {},
    disabled: (m.referrals || 0) >= freedomRules(s).referrals,
  });
  options.push({ id: "remark", label: "朱批 · 原请款待准驳", effects: {} });
  return options;
}
function choiceSelected(m, value, option) {
  return (
    value === option.id ||
    (value === "approve" && option === m.options[0]) ||
    (value === "reject" && option === m.options[1])
  );
}
function debateFor(s, session) {
  if (session.kind !== "上朝" || session.stance !== "廷议") return [];
  try {
    const action = memorialAction(s, session);
    return (
      forecastTurn(s, { ...s.schedule, [session.slot]: action }).debate || []
    );
  } catch {
    return [];
  }
}
export function memorialHTML(s, session) {
  const m = s.memorials.find((m) => m.id === session.ids[session.index]);
  if (!m)
    return '<p class="review-error">奏报已不在当前队列，请关闭后重选。</p>';
  const person = s.court.officials.find((o) => o.id === m.fromId),
    faction = s.court.factions.find((f) => f.id === person?.faction),
    post = s.court.posts.find((p) => p.holder === person?.id);
  const region = s.nation.provinces.find(
    (p) =>
      p.id === s.threads.find((t) => t.id === m.threadId)?.provinceId ||
      m.title.includes(p.name),
  );
  const opts = memorialOptions(s, m),
    draft = cabinetDraft(s, m),
    selected = session.choices[m.id],
    debate = debateFor(s, session),
    assigned = memorialAssignments(s);
  const pickerItems = s.memorials
    .map((item) => {
      const owner = assigned.get(item.id),
        blocked = owner && owner.slot !== session.originalSlot;
      return (
        '<button type="button" data-review-add="' +
        esc(item.id) +
        '" aria-pressed="' +
        session.ids.includes(item.id) +
        '" ' +
        (blocked ? "disabled" : "") +
        ">" +
        (session.ids.includes(item.id) ? "✓ " : "＋ ") +
        esc(item.title) +
        (blocked ? " · 已拟批（" + esc(owner.slot) + "间）" : "") +
        "</button>"
      );
    })
    .join("");
  const cards = opts
    .filter((o) => o.id !== "remark")
    .map((o, i) => {
      const chosen =
        choiceSelected(m, selected, o) ||
        legacyChoice(m, selected) === legacyChoice(m, o.id);
      const fx = effectItems(o.effects, s)
        .map(
          (f) =>
            '<span class="effect ' +
            (typeof f.value === "number"
              ? (/灾情|边患$/.test(f.label) ? -f.value : f.value) > 0
                ? "positive"
                : (/灾情|边患$/.test(f.label) ? -f.value : f.value) < 0
                  ? "negative"
                  : "neutral"
              : "neutral") +
            '">' +
            esc(f.label) +
            " " +
            esc(effectLabel(f.value, f.unit)) +
            "</span>",
        )
        .join("");
      const note =
        o.id === "hold"
          ? "留中未结案，下旬仍会呈送"
          : o.id === "discuss"
            ? o.disabled
              ? "已达再议次数，请裁处"
              : (m.campaignOrder?'军情紧急，再议不延期限':'发部再议，原定期限不顺延')+' · '+
                (freedomRules(s).referrals===Infinity?'次数不限':'最多'+freedomRules(s).referrals+'次')
            : o.id === "remark"
              ? "识别嘉奖／申饬，原请款仍待准驳"
              : m.campaignOrder?'本旬不另支钱粮':'无直接数值变化';
      const tag =
        o.edictType && EDICTS[o.edictType]
          ? "执行度预估「" + execution(s, o.edictType, 11).label + "」"
          : chosen
            ? "已选"
            : draft?.option === o.id
              ? "票拟"
              : i < 9
              ? "按 " + (i + 1)
              : "";
      return (
        '<button type="button" class="review-option" role="radio" aria-checked="' +
        chosen +
        '" tabindex="' +
        (chosen || (!selected && i === 0) ? 0 : -1) +
        '" data-review-option="' +
        esc(o.id) +
        '" ' +
        (o.disabled ? "disabled" : "") +
        '><span class="option-title"><span>' +
        esc(o.label) +
        '</span><small class="' +
        (tag.startsWith("按 ") ? "key-hint" : "") +
        '">' +
        esc(tag) +
        '</small></span><span class="effects">' +
        (fx || '<span class="effect neutral">' + note + "</span>") +
        "</span>" + (o.consequence ? '<small class="option-consequence">' + esc(o.consequence) + '</small>' : '') + "</button>"
      );
    })
    .join("");
  return (
    '<div class="memorial-queue"><div class="queue-tabs" role="group" aria-label="本次奏报队列">' +
    session.ids
      .map(
        (id, i) =>
          '<button type="button" class="queue-tab ' +
          (session.choices[id] ? "done" : "") +
          '" data-review-index="' +
          i +
          '" ' +
          (i === session.index ? 'aria-current="step"' : "") +
          '><span class="queue-number">' +
          (i + 1) +
          "</span>" +
          esc(s.memorials.find((m) => m.id === id)?.title) +
          "</button>",
      )
      .join("") +
    "</div>" +
    (session.kind === "批折"
      ? '<div class="segmented" role="group" aria-label="批折时辰">' +
        ["朝", "午"]
          .map(
            (sl) =>
              '<button type="button" data-review-slot="' +
              sl +
              '" aria-pressed="' +
              (sl === session.slot) +
              '" ' +
              ((session.originalSlot && sl !== session.originalSlot) ||
              (s.schedule[sl] && sl !== session.originalSlot)
                ? "disabled"
                : "") +
              ">" +
              sl +
              "</button>",
          )
          .join("") +
        "</div>"
      : "") +
    '<details class="queue-picker"><summary>选折 ' +
    session.ids.length +
    (session.kind === "上朝" && Number.isFinite(freedomRules(s).courtLimit) ? "/"+freedomRules(s).courtLimit : "") +
    '</summary><div class="queue-picker-list">' +
    pickerItems +
    '</div></details></div><div class="memorial-columns"><article class="paper memorial-paper"><div class="memorial-heading">' +
    (m.urgent ? '<span class="stamp">急</span>' : "") +
    '<h3 id="memorial-title" tabindex="-1">' +
    esc(m.title) +
    '</h3></div><div class="memorial-meta"><div class="memorial-author"><span>' +
    esc(memorialAuthor(m,postTitle(s,post))) +
    (faction ? "（" + esc(faction.name) + "）" : "") +
    "</span>" +
    (person?.alive
      ? '<button type="button" class="accountability" data-review-account="' +
        person.id +
        '" aria-pressed="' +
        (session.stance === "当廷问责" && session.target === person.id) +
        '">问责</button>'
      : "") +
    '</div><div class="memorial-facts"><span>类型　' +
    esc(m.type) +
    "</span><span>期限　剩 " +
    Math.max(0, m.due - s.turn) +
    ' 旬</span></div></div><div class="memorial-body">' +
    memorialParagraphHTML(
      m.text || "臣谨奏：" + m.title + "。" + (m.request || "伏乞陛下裁处。"),
    ) +
    '</div><p class="memorial-signature">'+esc(memorialSignature(m,postTitle(s,post)))+'</p><div class="memorial-foot">' +
    (region
      ? '<p class="memorial-region">' +
        esc(region.name) +
        " · 民心 " +
        number(region.morale) +
        " · 灾情 " +
        number(region.disaster) +
        " · 驻军 " +
        number(region.garrison) +
        "</p>"
      : "") +
    ('<div class="brush-control"><label for="review-remark" class="brush-label">御笔朱批（本折）</label><button type="button' +
      '" class="brush-mode" data-review-option="remark" aria-pressed="') +
    (selected === "remark") +
    ('">只作朱批</button></div><div class="brush-writing"><textarea id="review-remark" class="brush-input" maxlength="200' +
      '0" placeholder="写下嘉奖或申饬">') +
    esc(session.remarks[m.id] || "") +
    ('</textarea></div><p class="shared-remark-note">只作朱批，可嘉奖申饬；原请款仍须准驳。</p></div></article><section class="review-p' +
      'anel" aria-label="御批"><div class="review-title"><h3>御批</h3><small>第 ') +
    (session.index + 1) +
    " / " +
    session.ids.length +
    ' 本</small></div>' +
    (draft
      ? '<p class="cabinet-draft">票拟 · ' + esc(draft.minister) + (draft.faction ? "（" + esc(draft.faction) + "）" : "") + "：" + esc(draft.label) + "</p>"
      : "") +
    '<div class="review-options" role="radiogroup" aria-label="处置选项">' +
    cards +
    "</div>" +
    (session.kind === "上朝"
      ? '<div class="segmented" role="group" aria-label="朝堂立场">' +
        ["依旨施行", "廷议"]
          .map(
            (stance) =>
              '<button type="button" data-review-stance="' +
              stance +
              '" aria-pressed="' +
              (session.stance === stance) +
              '">' +
              stance +
              "</button>",
          )
          .join("") +
        "</div>"
      : "") +
    (session.stance === "当廷问责"
      ? '<p class="review-help">已排当廷问责：' +
        esc(s.court.officials.find((o) => o.id === session.target)?.name) +
        "。起驾后当廷问话。</p>"
      : "") +
    (debate.length
      ? '<section class="debate" aria-label="廷议诸臣"><h4>廷议 · 议事诸臣</h4>' +
        debate
          .map((o) => {
            const v = o.opinions.find((v) => v.memorialId === m.id);
            return (
              '<div class="debate-row"><span class="vote ' +
              (v?.stance === "赞成"
                ? "yes"
                : v?.stance === "反对"
                  ? "no"
                  : "") +
              '">' +
              (v?.stance === "赞成"
                ? "赞"
                : v?.stance === "反对"
                  ? "否"
                  : "中") +
              "</span><span>" +
              esc(o.name) +
              "<small>" +
              esc(factionDemandReason(s, o, m)) +
              "</small></span></div>"
            );
          })
          .join("") +
        "</section>"
      : "") +
    ('<p class="review-help"><span class="keyboard-help">1–' + Math.min(opts.length - 1, 9) +
      ' 择批 · Enter 下一本 · Esc 暂退</span></p><p id="review-error" ' +
      'class="review-error" role="status" aria-live="polite"></p></section></div><footer class="review-footer"><butto' +
      'n type="button" data-review-hold>留中不发</button>') +
    (session.ids.some((id) => !session.choices[id] && !s.memorials.find((x) => x.id === id)?.urgent)
      ? '<button type="button" data-review-drafts>未批者依票拟</button>'
      : "") +
    ('<button type="button" id="review-next" class="primary" data-revi' +
      "ew-next>") +
    (session.index === session.ids.length - 1
      ? "拟批完毕，入日程"
      : "记下，下一本 ›") +
    "</button></footer>"
  );
}
export function memorialDialog(
  s,
  kind,
  preferred,
  onSchedule,
  startId = null,
  options = {},
) {
  if (!s.memorials.length) {
    toast("奏报匣暂无奏报");
    return;
  }
  const session = createMemorialSession(s, kind, preferred, startId, options);
  openDialog(
    kind + " · 御前批阅",
    '<div id="review-root" class="memorial-overlay"></div>',
    "memorial-shell",
  );
  const root = $("#review-root"),
    d = $("#modal");
  const mobile = matchMedia("(max-width:899px)");
  const revealCurrent = () => {
    if (!d.open) return;
    const tabs = root.querySelector(".queue-tabs"),
      current = tabs?.querySelector('[aria-current="step"]');
    if (!current) return;
    const box = tabs.getBoundingClientRect(),
      item = current.getBoundingClientRect();
    tabs.scrollLeft +=
      item.left - box.left - (tabs.clientWidth - item.width) / 2;
  };
  const alignPicker = () => {
    const picker = d.querySelector(".queue-picker");
    if (!picker) return;
    if (mobile.matches) {
      d.querySelector(".dialog-head").insertBefore(picker, $("#close-modal"));
      picker.onclick = handleClick;
    } else {
      root.querySelector(".memorial-queue").append(picker);
      picker.onclick = null;
    }
    revealCurrent();
  };
  const fitBrush = () => {
    const field = root.querySelector("#review-remark");
    if (!field) return;
    field.style.height = "auto";
    field.style.height = field.scrollHeight + "px";
  };
  const paint = (focus = null) => {
    d.querySelector(".dialog-head .queue-picker")?.remove();
    root.innerHTML = memorialHTML(s, session);
    alignPicker();
    fitBrush();
    requestAnimationFrame(revealCurrent);
    if (focus) d.querySelector(focus)?.focus({ preventScroll: true });
  };
  const showError = (err) => {
    const el = $("#review-error");
    if (el) el.textContent = err.message || String(err);
  };
  let submitted = false;
  const next = () => {
    if (submitted) return;
    try {
      if (!session.choices[session.ids[session.index]])
        throw new Error("请先选择本折御批");
      if (session.index < session.ids.length - 1) {
        session.index++;
        paint("#memorial-title");
        return;
      }
      const missing = session.ids.findIndex((id) => !session.choices[id]);
      if (missing >= 0) {
        session.index = missing;
        paint("#memorial-title");
        throw new Error("尚有奏折未选择御批");
      }
      onSchedule(session.slot, memorialAction(s, session));
      submitted = true;
      closeDialog();
    } catch (error) {
      showError(error);
    }
  };
  const handleClick = (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    e.stopPropagation();
    if (b.dataset.reviewOption) {
      session.choices[session.ids[session.index]] = b.dataset.reviewOption;
      paint('[data-review-option="' + b.dataset.reviewOption + '"]');
    } else if (b.dataset.reviewIndex !== undefined) {
      session.index = Number(b.dataset.reviewIndex);
      paint("#memorial-title");
    } else if (b.dataset.reviewSlot) {
      const target = b.dataset.reviewSlot;
      if (
        (session.originalSlot && target !== session.originalSlot) ||
        (s.schedule[target] && target !== session.originalSlot)
      ) {
        showError("该时辰已有安排；换时辰请先撤下原拟批。");
        return;
      }
      session.slot = target;
      paint('[data-review-slot="' + session.slot + '"]');
    } else if (b.dataset.reviewStance) {
      session.stance = b.dataset.reviewStance;
      paint('[data-review-stance="' + session.stance + '"]');
    } else if (b.dataset.reviewAccount) {
      session.stance =
        session.stance === "当廷问责" &&
        session.target === b.dataset.reviewAccount
          ? "依旨施行"
          : "当廷问责";
      session.target = b.dataset.reviewAccount;
      paint("[data-review-account]");
    } else if (b.dataset.reviewAdd) {
      const id = b.dataset.reviewAdd,
        at = session.ids.indexOf(id),
        owner = memorialAssignments(s).get(id);
      if (owner && owner.slot !== session.originalSlot) {
        showError("此折已收入" + owner.slot + "间日程，不能重复拟批。");
        return;
      }
      if (at >= 0) {
        if (session.ids.length === 1) {
          showError("至少保留一本奏报");
          return;
        }
        session.ids.splice(at, 1);
        delete session.choices[id];
        delete session.remarks[id];
      } else {
        if (kind === "上朝" && session.ids.length >= freedomRules(s).courtLimit) {
          showError("上朝最多"+freedomRules(s).courtLimit+"个议题，请先移出一本");
          return;
        }
        session.ids.push(id);
        session.remarks[id] ??= "";
      }
      session.index = Math.min(session.index, session.ids.length - 1);
      paint();
      d.querySelector(".queue-picker").open = true;
    } else if (b.hasAttribute("data-review-drafts")) {
      const filled = applyCabinetDrafts(s, session);
      const missing = session.ids.findIndex((id) => !session.choices[id]);
      if (missing >= 0) session.index = missing;
      paint("#memorial-title");
      showError(filled ? "已依票拟填入 " + filled + " 本" + (missing >= 0 ? "；急报须亲裁" : "，可拟批完毕") : "急报须亲裁，未填入");
    } else if (b.hasAttribute("data-review-hold")) {
      session.choices[session.ids[session.index]] = "hold";
      next();
    } else if (b.hasAttribute("data-review-next")) next();
  };
  root.onclick = handleClick;
  const resize = () => {
    alignPicker();
    fitBrush();
    requestAnimationFrame(revealCurrent);
  };
  mobile.addEventListener("change", resize);
  window.addEventListener("resize", resize);
  onDialogExit(d, root, () => {
    mobile.removeEventListener("change", resize);
    window.removeEventListener("resize", resize);
  });
  document.fonts?.ready.then(() => {
    if (d.open && root.isConnected) { revealCurrent(); fitBrush(); }
  });
  root.oninput = (e) => {
    if (e.target.id === "review-remark") {
      session.remarks[session.ids[session.index]] = e.target.value;
      fitBrush();
    }
  };
  d.onkeydown = (e) => {
    if (e.target.matches("input,textarea,select")) return;
    const all = [
        ...root.querySelectorAll(".review-options [data-review-option]"),
      ],
      opts = all.filter((b) => !b.disabled);
    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      if (!all[Number(e.key) - 1]?.disabled) all[Number(e.key) - 1]?.click();
    } else if (
      ["ArrowDown", "ArrowUp"].includes(e.key) &&
      e.target.matches(".review-options [data-review-option]")
    ) {
      e.preventDefault();
      const i = opts.indexOf(e.target);
      opts[
        (i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length
      ]?.click();
    } else if (
      e.key === "Enter" &&
      (e.target.matches("[data-review-option],#memorial-title,#review-next") ||
        e.target === d)
    ) {
      e.preventDefault();
      next();
    }
  };
  paint("#memorial-title");
}
