import { settleArrears } from "./finance.js";
import { turnFacts } from "./facts.js";
import { privateAction } from "./private.js";
import { check } from "./rng.js";
import { evaluateAmbitions } from "./ambitions.js";
import { unlockAchievements, sealChronicle } from "./chronicles.js";
import { auditChanges } from "./audit.js";
import { clone, assertState, SLOTS, withDraft } from "./state.js";
import { roll, fateLabel } from "./rng.js";
import { applyPackage, growTalent } from "./effects.js";
import {
  energyLimit,
  settleEnergy,
  emperorMonth,
  emperorYear,
} from "./emperor.js";
import { nationMonth, nationQuarter, nationYear } from "./nation.js";
import {
  courtMonth,
  courtYear,
  strongman,
  appoint,
  banquet,
  courtDebate,
  accountability,
  proxyMemorial,
} from "./court.js";
import {
  haremMonth,
  haremYear,
  haremAction,
  selectConsort,
  generateCandidates,
  succession,
} from "./harem.js";
import {
  foreignMonth,
  foreignYear,
  diplomacy,
  borderInvasions,
  advanceCampaigns,
  checkCollapse,
} from "./foreign.js";
import { issueEdict, advanceProjects } from "./edicts.js";
import {
  seedMemorials,
  resolveMemorial,
  expireMemorials,
  eventsMonth,
} from "./events.js";
export const ACTIONS = {
  上朝: { slots: ["朝"], energy: 2 },
  批折: { slots: ["朝", "午"], energy: 1 },
  召见: { slots: ["午"], energy: 1 },
  宴请: { slots: ["夜"], energy: 2 },
  下旨: { slots: SLOTS, energy: 1 },
  任命: { slots: ["朝", "午"], energy: 1 },
  外交: { slots: ["午"], energy: 2 },
  选妃: { slots: ["午"], energy: 2 },
  后宫: { slots: ["夜"], energy: 1 },
  出巡: { slots: ["朝"], energy: 4, full: true },
  亲征: { slots: ["朝"], energy: 4, full: true },
  私下行事: { slots: SLOTS, energy: 1 },
  歇息: { slots: SLOTS, energy: 0 },
};
export function scheduleCost(schedule) {
  return Object.values(schedule)
    .filter(Boolean)
    .reduce(
      (a, x) =>
        a +
        (x.kind === "批折"
          ? Math.max(1, Math.ceil((x.memorials?.length || 1) / 3))
          : ACTIONS[x.kind]?.energy || 0),
      0,
    );
}
export function validateSchedule(state, schedule) {
  const talks = state.talks.filter((t) => t.turn === state.turn);
  if (talks.some((t) => schedule.午?.kind !== "召见" || schedule.午.person !== t.person))
    throw new Error("本旬面谈已落账，午槽须保留对应人物的召见");
  let full = false,
    count = 0;
  const seen = new Set();
  for (const slot of SLOTS) {
    const a = schedule[slot];
    if (!a) continue;
    count++;
    const rule = ACTIONS[a.kind];
    if (!rule || !rule.slots.includes(slot))
      throw new Error(a.kind + " 不能安排在" + slot + "槽");
    if (rule.full) full = true;
    for (const id of a.memorials || []) {
      if (seen.has(id)) throw new Error("同一奏报不能重复处置");
      seen.add(id);
    }
    if (a.kind === "上朝" && (a.memorials?.length || 0) > 3)
      throw new Error("上朝最多三个议题");
  }
  if (full && count > 1) throw new Error("出巡或亲征占满一旬，请清空其他时辰");
  if (
    state.campaigns.some((w) => w.personal && !w.done) &&
    count &&
    Object.values(schedule).some((a) => a && !["亲征", "歇息"].includes(a.kind))
  )
    throw new Error("亲征期间不能在京中安排其他行动");
  return true;
}
export function initialTurn(state) {
  let s = generateCandidates(seedMemorials(state));
  s.harem.royalWomen ??= [
    { id: "royal-1", name: "萧静宜", age: 22, married: null },
  ];
  return unlockAchievements(evaluateAmbitions(s));
}
export function forecastTurn(
  state,
  schedule = { 朝: null, 午: null, 夜: null },
) {
  return withDraft(() => forecastDraft(state, schedule));
}
function forecastDraft(state, schedule) {
  if (state.ending) throw new Error("此局已封卷");
  validateSchedule(state, schedule);
  let s = clone(state);
  s.pending = null;
  s.ledger = [...(state.interimEntries || [])];
  const baseRevision = s.revision,
    turnId = s.runId + ":" + (s.turn + 1) + ":" + baseRevision;
  const r = roll(s);
  s = r.state;
  const die = r.value,
    notes = [],
    slotResults = { 朝: [], 午: [], 夜: [] },
    cost = scheduleCost(schedule);
  let debate = [];
  s = settleEnergy(s, cost);
  if (die <= 3)
    s = applyPackage(
      s,
      { treasury: -Math.min(8, s.nation.treasury), mood: -2 },
      "天命大凶：户部银库失窃",
    );
  for (const slot of SLOTS) {
    const action = schedule[slot];
    if (!action) {
      slotResults[slot].push("未排程，静候宫中日常");
      continue;
    }
    let result;
    if (action.kind === "上朝" || action.kind === "批折") {
      const ids = action.memorials || s.memorials.slice(0, 3).map((m) => m.id);
      if (action.kind === "上朝" && action.stance === "廷议") {
        const hearing = courtDebate(
          s,
          ids.map((id) => s.memorials.find((m) => m.id === id)).filter(Boolean),
        );
        s = hearing.state;
        debate = hearing.speakers;
        slotResults[slot].push(
          "廷议：" +
            debate
              .map(
                (o) =>
                  o.name +
                  "（" +
                  o.opinions.map((v) => v.stance).join("、") +
                  "）",
              )
              .join("、"),
        );
      }
      for (const id of ids) {
        const option = action.decisions?.[id] || action.decision || "approve";
        result = resolveMemorial(s, id, option, action.remark);
        s = result.state;
        slotResults[slot].push(result.note);
      }
      if (action.stance === "当廷问责") {
        const target = s.court.officials.find((o) => o.id === action.target);
        if (!target) throw new Error("问责须选择在京官员");
        const verdict = accountability(s, target, die);
        s = applyPackage(
          s,
          {
            prestige: verdict.success ? 3 : -2,
            official: { id: target.id, favor: -8 },
            faction: { [target.faction]: -3 },
          },
          "当廷问责",
        );
        slotResults[slot].push(
          "当廷问责 " +
            target.name +
            " · " +
            (verdict.success ? "成功" : "未成"),
        );
      }
      s = growTalent(s, "政略", 0.2);
    } else if (action.kind === "下旨") {
      result = issueEdict(s, action, die);
      s = result.state;
      slotResults[slot].push(result.note);
    } else if (action.kind === "任命") {
      result = appoint(s, action);
      s = result.state;
      slotResults[slot].push(result.note);
    } else if (action.kind === "宴请") {
      result = banquet(s, action);
      s = result.state;
      slotResults[slot].push(result.note);
    } else if (action.kind === "外交") {
      result = diplomacy(s, action, die);
      s = result.state;
      slotResults[slot].push(result.note);
    } else if (action.kind === "后宫") {
      result = haremAction(s, action);
      s = result.state;
      slotResults[slot].push(result.note);
    } else if (action.kind === "私下行事") {
      result = privateAction(s, action);
      s = result.state;
      slotResults[slot].push(result.note);
    } else if (action.kind === "选妃") {
      s = selectConsort(s, action.person, action.rank);
      slotResults[slot].push(
        "殿选赐位，" + s.harem.consorts.at(-1).name + " 入宫",
      );
    } else if (action.kind === "出巡") {
      if (s.nation.privy < 6) throw new Error("内帑不足以安排出巡");
      s = applyPackage(
        s,
        {
          privy: -6,
          mood: 8,
          virtue: action.destination === "祭天" ? 0 : 2,
          prestige: action.destination === "祭天" ? 3 : 0,
          morale: 2,
        },
        "微服/游幸/狩猎/祭祀",
      );
      s.stats.outings = (s.stats.outings || 0) + 1;
      if (die === 1 && s.settings.freedom !== "free")
        s = applyPackage(s, { health: -15 }, "出巡遇刺受伤");
      slotResults[slot].push(
        (action.destination || "微服江南") + "，暂离京师，奏报积压",
      );
    } else if (action.kind === "亲征") {
      const war = s.campaigns.find((w) => !w.done);
      if (!war) throw new Error("当前没有战役可亲征");
      war.personal = true;
      war.regent = action.regent || s.court.posts[0].holder;
      slotResults[slot].push("御驾亲征，留守大臣代行政务");
    } else if (action.kind === "召见") {
      slotResults[slot].push(
        "召见 " +
          (s.court.officials.find((o) => o.id === action.person)?.name ||
            action.person) +
          "；面谈结果已落账",
      );
    } else {
      s = applyPackage(s, { health: 1, mood: 2 }, "休养静息");
      slotResults[slot].push("静息养神");
    }
  }
  s.turn++;
  s.day += 10;
  s.revision++;
  s.schedule = { 朝: null, 午: null, 夜: null };
  s = advanceCampaigns(s);
  s = borderInvasions(s);
  s = expireMemorials(s);
  if (s.turn % 3 === 0) {
    s = nationMonth(s);
    s = courtMonth(s);
    s = haremMonth(s);
    s = foreignMonth(s);
    s = emperorMonth(s);
    s = eventsMonth(s);
    s = advanceProjects(s);
    notes.push("月结：钱粮、朝局、后宫与圣躬已结算");
  }
  if (s.turn % 9 === 0) {
    s = nationQuarter(s);
    notes.push("季结：赋税入库、边情季报");
  }
  if (s.turn % 36 === 0) {
    s = emperorYear(s);
    s = nationYear(s);
    s = courtYear(s);
    s = haremYear(s);
    s = foreignYear(s);
    notes.push(
      "年结：长岁、朝贡、年度评估" +
        ((Math.floor(s.turn / 36) + 1) % 3 === 1 ? "；科举、选秀开科" : ""),
    );
  }
  s.era = {
    ...s.era,
    year: 1 + Math.floor((s.turn - (s.reign?.accessionTurn || 0)) / 36),
    month: 1 + Math.floor((s.turn % 36) / 3),
    xun: s.turn % 3,
  };
  if (s.era.year % 3 === 1 && s.harem.selectionYear !== s.era.year)
    s = generateCandidates(s);
  s = checkCollapse(s);
  if (s.ending?.type === "驾崩") s.ending.succession = succession(s);
  const proxy = proxyMemorial(s);
  s = proxy.state;
  if (proxy.note) notes.push(proxy.note);

  for (const child of s.harem.children.filter(
    (c) => !state.harem.children.some((old) => old.id === c.id),
  ))
    slotResults.夜.push(
      "皇嗣 " +
        child.name +
        " 诞生，生母 " +
        s.harem.consorts.find((m) => m.id === child.mother)?.name,
    );
  for (const c of s.harem.consorts)
    if (c.preg && !state.harem.consorts.find((old) => old.id === c.id)?.preg)
      slotResults.夜.push(c.name + " 诊得身孕");
  for (const o of s.court.officials.filter(
    (o) =>
      !o.alive && state.court.officials.find((old) => old.id === o.id)?.alive,
  ))
    notes.push(o.name + " 寿终，原职出缺");
  s = seedMemorials(s);
  s.emperor.energy = energyLimit(s);
  s = evaluateAmbitions(s);
  s = unlockAchievements(s);
  s = settleArrears(s);
  s.ledger = [
    ...(state.interimEntries || []),
    ...auditChanges(
      state,
      s,
      s.ledger.slice((state.interimEntries || []).length),
    ),
  ];
  assertState(s);
  return {
    turnId,
    runId: state.runId,
    baseTurn: state.turn,
    baseRevision,
    die,
    fate: fateLabel(die),
    schedule: clone(schedule),
    cost,
    state: s,
    entries: clone(s.ledger),
    notes,
    slotResults,
    debate,
    facts: turnFacts(state, s, schedule, slotResults),
    newMemorials: s.memorials.filter(
      (m) => !state.memorials.some((old) => old.id === m.id),
    ),
    baseFingerprint: JSON.stringify({
      rng: state.rng,
      turn: state.turn,
      revision: state.revision,
    }),
  };
}
export function commitTurn(state, forecast, narrative = {}) {
  return withDraft(() => commitDraft(state, forecast, narrative));
}
function commitDraft(state, forecast, narrative = {}) {
  if (state.receipts.includes(forecast.turnId)) return clone(state);
  if (
    state.runId !== forecast.runId ||
    state.turn !== forecast.baseTurn ||
    state.revision !== forecast.baseRevision ||
    JSON.stringify({
      rng: state.rng,
      turn: state.turn,
      revision: state.revision,
    }) !== forecast.baseFingerprint
  )
    throw new Error("预演已过期，不能提交到此存档");
  let s = clone(forecast.state);
  s.v = state.v;
  s.receipts.push(forecast.turnId);
  s.pending = null;
  s.interimEntries = [];
  s.lastTurn = { id: forecast.turnId, die: forecast.die, fate: forecast.fate };
  const reactionSeen = new Set();
  for (const reaction of (narrative.reactions || []).slice(0, 10)) {
    if (reactionSeen.has(reaction.id)) continue;
    reactionSeen.add(reaction.id);
    if (!s.court.officials.some((o) => o.id === reaction.id)) continue;
    const delta = Number(reaction.favorDelta);
    if (Number.isFinite(delta))
      s = applyPackage(
        s,
        {
          official: {
            id: reaction.id,
            favor: Math.max(-5, Math.min(5, delta)),
          },
        },
        "模型人物反应建议：引擎限额采纳",
      );
  }
  s = evaluateAmbitions(s, narrative);
  s = unlockAchievements(s);
  for (const fact of (narrative.factUpdates || []).slice(0, 5)) {
    if (
      Object.values(narrative.chapter || {})
        .join("\n")
        .includes(fact.reason) &&
      typeof fact.reason === "string" &&
      fact.reason.length >= 8
    )
      s.facts.push({ ...fact, turn: s.turn });
  }
  s.facts = s.facts.slice(-100);
  s.history.push({
    id: forecast.turnId,
    turn: s.turn,
    era: clone(state.era),
    chapter: narrative.chapter || {},
    summary: String(narrative.summary || "本旬诸事已入起居注").slice(0, 100),
    entries: clone(s.ledger),
    settlement: {
      slotResults: clone(forecast.slotResults),
      debate: clone(forecast.debate || []),
      facts: clone(forecast.facts || []),
    },
    notes: [...forecast.notes, ...(narrative.fixNotes || [])],
    rumors: narrative.rumors || [],
    die: forecast.die,
  });
  for (const text of narrative.memorialTexts || []) {
    const m = s.memorials.find((m) => m.id === text.id);
    if (m) m.text = String(text.text).slice(0, 1000);
  }
  if (s.history.length > 36) {
    const archived = s.history.splice(0, 18);
    s.volumes.push({
      from: archived[0].turn,
      to: archived.at(-1).turn,
      chapters: archived,
      summary: archived
        .map((h) => h.summary)
        .join("；")
        .slice(0, 1500),
    });
  }
  s = sealChronicle(s);
  assertState(s);
  return s;
}
