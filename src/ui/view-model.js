import { freedomRules, selectionYear } from "../core/freedom.js";
import { memorialDecision } from "../core/memorial-decisions.js";
import { ACTIONS, scheduleCost, validateSchedule } from "../core/turn.js";
import { energyLimit } from "../core/emperor.js";
import { annualBudget } from "../core/finance.js";
import { EDICTS, execution } from "../core/edicts.js";
import { globalYear } from "../core/calendar.js";
import { availableMemorials } from "./memorial-state.js";
import { cabinetDraft } from "../core/court.js";
import { WAR_GOALS } from '../core/campaign-rules.js';
export const ACTION_GROUPS = [
  ["朝政", ["上朝", "批折", "下旨", "任命"]],
  ["人事", ["自拟情节", "召见", "宴请", "外交", "私下行事"]],
  ["内廷", ["后宫", "选妃"]],
  ["出行", ["出巡", "亲征"]],
];
export const HALLS = ["朝堂", "后宫", "天下", "内库", "宗室", "史馆"];
export const GLYPHS = {自拟情节:"叙",上朝:"朝",批折:"批",下旨:"旨",任命:"任",召见:"见",宴请:"宴",外交:"使",私下行事:"密",后宫:"宫",选妃:"选",出巡:"行",亲征:"征",歇息:"憩"};
export function selectionDescription(s){const period=freedomRules(s).selectionPeriod;return period?'每'+period+'年大选一次；平日可花内帑三万两举荐一人，已有候选人可随时留牌。':'可随时选秀，位分名额不限。';}
export function actionAvailability(s, kind) {
  if (!s) return "待登基";
  if(s.regency&&!["批折","召见","自拟情节","私下行事","歇息"].includes(kind))return "摄政期间不可安排";
  if (s.pending) return "本旬待续写";
  if (s.ending) return "本朝已封卷";
  if ((kind === "上朝" || kind === "批折") && !s.memorials.length) return "暂无奏报";
  if (kind === "上朝" || kind === "批折") {
    if (!availableMemorials(s).length) return "本旬均已拟批";
    if (kind === "上朝" && s.schedule.朝) return "朝间已有安排";
    if (kind === "批折" && s.schedule.朝 && s.schedule.午) return "朝午已排定";
  }
  if (kind === "亲征" && !s.campaigns.some(w=>!w.done)) return "无战事";

  if (s.campaigns.some(w=>w.personal&&!w.done) && !["亲征","歇息"].includes(kind)&&kind!=='批折') return "御驾在外";
  return "";
}
export function actionMeta(kind, s = null) {
  const rule = ACTIONS[kind];
  if (!rule) return "";
  const time = rule.full ? "占满一旬" : rule.slots.length === 3 ? "任意" : rule.slots.join("/");
  if (kind === "上朝") return time + " · 精力 " + rule.energy + " · " + (freedomRules(s).courtLimit===Infinity?"本数不限，每多3本加耗1":freedomRules(s).courtLimit+"本内") + "，可廷议问责";
  if (kind === "召见") return time+" · 每人精力1，续谈不加耗";
  if (kind === "批折") return time + " · 每3本1 · 独断，不经廷议";
  return time + " · " + (rule.full ? rule.energy+"点" : "精力 " + rule.energy);
}
export function energyView(s) {
  const limit = s ? energyLimit(s) : 9, used = s ? scheduleCost(s.schedule) : 0;
  return {limit,used,remaining:Math.max(0,limit-used),excess:Math.max(0,used-limit)};
}
export function metricGroups(s) {
  const change = new Map();
  for (const e of [...(s?.history.at(-1)?.entries || []), ...(s?.interimEntries || [])])
    change.set(e.path,(change.get(e.path)||0)+e.after-e.before);
  const mk = (label,path,value,unit="",max=100,danger=false) => ({label,path,value,unit,max,danger,delta:change.get(path)||0});
  return [
    {name:"钱粮",weight:3,stats:[mk("国库","nation.treasury",s?.nation.treasury,"万两",s?annualBudget(s)*2:1000,s?s.nation.treasury<annualBudget(s)/6:false),mk("内帑","nation.privy",s?.nation.privy,"万两",200),mk("粮储","nation.grain",s?.nation.grain,"万石",1000)]},
    {name:"民政",weight:2,stats:[mk("民心","nation.morale",s?.nation.morale,"",100,s?.nation.morale<40),mk("吏治","nation.governance",s?.nation.governance,"",100,s?.nation.governance<40)]},
    {name:"君威",weight:2,stats:[mk("皇威","emperor.prestige",s?.emperor.prestige,"",100,s?.emperor.prestige<40),mk("圣德","emperor.virtue",s?.emperor.virtue)]},
    {name:"圣躬",weight:2,stats:[mk("健康","emperor.health",s?.emperor.health,"",100,s?.emperor.health<40),mk("心情","emperor.mood",s?.emperor.mood,"",100,s?.emperor.mood<20)]},
  ];
}
export function scheduleEstimate(s) {
  const totals={treasury:0,privy:0,grain:0}, executions=[];
  if (!s) return {totals,executions};
  for (const a of Object.values(s.schedule).filter(Boolean)) {
    if (a.kind === "下旨" && a.text?.trim()) continue;
    if (a.kind === "下旨" && EDICTS[a.edictType]) {
      const e=EDICTS[a.edictType];
      if (a.edictType === "转内帑" || a.edictType === "转国库") {
        const from=a.edictType==="转内帑"?"treasury":"privy",to=from==="treasury"?"privy":"treasury",amount=Math.min(Math.max(0,Number(a.amount??10)),s.nation[from],1000000-s.nation[to]);
        totals[from]-=amount;totals[from==="treasury"?"privy":"treasury"]+=amount;
      } else {
        const existing=s.projects.find(p=>!p.done&&p.edictType===a.edictType&&(p.province||null)===(a.province||null)&&(a.edictType!=='征兵'||p.armyTarget===(a.armyTarget||'capital')));
        if(existing&&(a.followup!=='督办'||existing.end<=s.turn+1&&existing.execRate>=1))continue;
        totals[e.private?"privy":"treasury"]-=e.cost;
        totals.grain-=e.grain||0;
        if (e.months) executions.push(a.edictType+"「"+execution(s,a.edictType,11).label+"」");
      }
    }
    for (const id of a.memorials || []) {
      const m=s.memorials.find(x=>x.id===id);if(!m)continue;
      const decision=memorialDecision(a,id).option;
      if (["hold","discuss","remark"].includes(decision)) continue;
      const o=m.options.find(o=>o.id===decision)||m.options[decision==="reject"?1:0];
      for(const k of Object.keys(totals)) totals[k]+=o?.effects?.[k]||0;
    }
    if(a.kind==="宴请")totals.privy-=({俭:2,常:5,盛:12}[a.cost||"常"]||0);
    if(a.kind==="出巡")totals.privy-=6;
    if(a.kind==="私下行事"&&a.operation==="收买")totals.privy-=5;
    if(a.kind==="后宫"&&a.operation==="赏赐")totals.privy-=Math.min(Math.max(0,Number(a.amount??2)),s.nation.privy);
    if(a.kind==="外交"&&a.operation==="宣战"){const goal=WAR_GOALS[a.warGoal||'repel'];totals.treasury-=goal?.silver||25;totals.grain-=goal?.grain||30;}
    if(a.kind==="选妃"&&a.operation==="举荐")totals.privy-=3;
    if(a.kind==="外交"&&a.operation==="和亲")totals.privy-=10;
  }
  return {totals,executions};
}

// 沿用上旬日程：只沿用不绑定具体奏报或人物结果的行动，逐槽校验，不合规的槽位留空。
export const REPEATABLE = ["歇息", "后宫", "宴请", "私下行事", "下旨"];
export function repeatSchedule(s, last) {
  const next = { 朝: null, 午: null, 夜: null };
  if (!s || !last) return next;
  for (const slot of ["朝", "午", "夜"]) {
    const a = last[slot];
    if (!a || !REPEATABLE.includes(a.kind) || actionAvailability(s, a.kind)) continue;
    const trial = { ...next, [slot]: JSON.parse(JSON.stringify(a)) };
    try { validateSchedule(s, trial); next[slot] = trial[slot]; } catch {}
  }
  return next;
}

// 委政内阁：内阁依票拟批最多六本非急报，其余时辰歇息。有急报、御驾在外或封卷时不可委政。
export function delegateSchedule(s) {
  if (!s || s.ending || s.pending) return { schedule: null, reason: "本旬尚未完结" };
  if (s.memorials.some((m) => m.urgent)) return { schedule: null, reason: "有急报待亲裁" };
  if (s.campaigns.some((w) => w.personal && !w.done)) return { schedule: null, reason: "御驾在外" };
  const picks = s.memorials.map((m) => ({ m, d: cabinetDraft(s, m) })).filter((x) => x.d).slice(0, 6);
  const schedule = { 朝: null, 午: null, 夜: { kind: "歇息" } };
  if (picks.length)
    schedule.朝 = { kind: "批折", delegated:true, memorials: picks.map((x) => x.m.id), stance: "依旨施行", target: s.court.officials[0]?.id || "",
      decisions: Object.fromEntries(picks.map((x) => [x.m.id, { option: x.d.option, remark: "" }])), label: "内阁票拟 " + picks.length + " 本" };
  try { validateSchedule(s, schedule); } catch (e) { return { schedule: null, reason: e.message }; }
  return { schedule, reason: "" };
}
// 本旬落账后若出现生死、孕产、战事、急报或封卷，停止委政，交还御前。
export const DELEGATE_STOPS = { death: "有人亡故", war: "边事有变", birth: "皇嗣诞生", pregnancy: "宫中有喜", miscarriage: "宫中小产" };
export function delegateStop(s) {
  if (!s) return "无卷";
  if (s.ending) return "本朝封卷";
  const last = s.history.at(-1), fact = (last?.settlement?.facts || []).find((f) => DELEGATE_STOPS[f.kind]);
  if (fact) return DELEGATE_STOPS[fact.kind];
  if (s.memorials.some((m) => m.urgent)) return "急报呈至";
  return "";
}
