import { ACTIONS, scheduleCost } from "../core/turn.js";
import { energyLimit } from "../core/emperor.js";
import { annualBudget } from "../core/finance.js";
import { EDICTS, execution } from "../core/edicts.js";
import { availableMemorials } from "./memorial-state.js";
export const ACTION_GROUPS = [
  ["朝政", ["上朝", "批折", "下旨", "任命"]],
  ["人事", ["召见", "宴请", "外交", "私下行事"]],
  ["内廷", ["后宫", "选妃"]],
  ["出行", ["出巡", "亲征"]],
];
export const HALLS = ["朝堂", "后宫", "天下", "内库", "宗室", "史馆"];
export const GLYPHS = {上朝:"朝",批折:"批",下旨:"旨",任命:"任",召见:"见",宴请:"宴",外交:"使",私下行事:"密",后宫:"宫",选妃:"选",出巡:"行",亲征:"征",歇息:"憩"};
export function actionAvailability(s, kind) {
  if (!s) return "待登基";
  if (s.pending) return "本旬待续写";
  if (s.ending) return "本朝已封卷";
  if ((kind === "上朝" || kind === "批折") && !s.memorials.length) return "暂无奏报";
  if (kind === "上朝" || kind === "批折") {
    if (!availableMemorials(s).length) return "本旬均已拟批";
    if (kind === "上朝" && s.schedule.朝) return "朝间已有安排";
    if (kind === "批折" && s.schedule.朝 && s.schedule.午) return "朝午已排定";
  }
  if (kind === "亲征" && !s.campaigns.some(w=>!w.done)) return "无战事";
  if (kind === "选妃" && (s.era.year % 3 !== 1 || !s.harem.candidates.length)) return "非选秀年";
  if (s.campaigns.some(w=>w.personal&&!w.done) && !["亲征","歇息"].includes(kind)) return "御驾在外";
  return "";
}
export function actionMeta(kind) {
  const rule = ACTIONS[kind];
  if (!rule) return "";
  const time = rule.full ? "占满一旬" : rule.slots.length === 3 ? "任意" : rule.slots.join("/");
  return time + " · " + (kind === "批折" ? "每3本1" : rule.full ? rule.energy+"点" : "精力 " + rule.energy);
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
    if (a.kind === "下旨" && EDICTS[a.edictType]) {
      const e=EDICTS[a.edictType];
      if (a.edictType === "转内帑" || a.edictType === "转国库") {
        const amount=Number(a.amount)||10,from=a.edictType==="转内帑"?"treasury":"privy";
        totals[from]-=amount;totals[from==="treasury"?"privy":"treasury"]+=amount;
      } else {
        totals[e.private?"privy":"treasury"]-=e.cost;
        totals.grain-=e.grain||0;
        if (e.months) executions.push(a.edictType+"「"+execution(s,a.edictType,11).label+"」");
      }
    }
    for (const id of a.memorials || []) {
      const m=s.memorials.find(x=>x.id===id);if(!m)continue;
      const decision=a.decisions?.[id]||a.decision||"approve";
      if (["hold","discuss","remark"].includes(decision)) continue;
      const o=m.options.find(o=>o.id===decision)||m.options[decision==="reject"?1:0];
      for(const k of Object.keys(totals)) totals[k]+=o?.effects?.[k]||0;
    }
    if(a.kind==="宴请")totals.privy-=({俭:2,常:5,盛:12}[a.cost||"常"]||0);
    if(a.kind==="出巡")totals.privy-=6;
    if(a.kind==="私下行事"&&a.operation==="收买")totals.privy-=5;
    if(a.kind==="后宫"&&a.operation==="赏赐")totals.privy-=Number(a.amount)||2;
    if(a.kind==="外交"&&a.operation==="宣战"){totals.treasury-=25;totals.grain-=30;}
    if(a.kind==="外交"&&a.operation==="和亲")totals.privy-=10;
  }
  return {totals,executions};
}
