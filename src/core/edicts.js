import {configureResearch} from './tech.js';
import {buildIndustry,completeIndustry} from './industries.js';
import {techEffects} from './tech-rules.js';
import { freedomRules, adjudicate } from "./freedom.js";
import { quarterIndex } from "./finance.js";
import { clone } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { addEvent } from "./events.js";
import { roll } from "./rng.js";
export const EDICTS = {
  赈灾: {
    cost: 30,
    grain: 20,
    months: 1,
    difficulty: 0,
    office: "户部尚书",
    effects: { morale: 5, virtue: 3 },
  },
  减赋: {
    cost: 15,
    months: 1,
    difficulty: 0,
    office: "户部尚书",
    effects: { morale: 5, virtue: 3 },
  },
  加税: {
    cost: 0,
    months: 1,
    difficulty: 5,
    office: "户部尚书",
    effects: { morale: -6, virtue: -2 },
  },
  修河: {
    cost: 60,
    months: 4,
    difficulty: 5,
    office: "工部尚书",
    effects: { governance: 4, morale: 6 },
  },
  整饬吏治: {
    cost: 20,
    months: 3,
    difficulty: 5,
    office: "吏部尚书",
    effects: { governance: 8, prestige: 3 },
  },
  征兵: {
    cost: 35,
    months: 2,
    difficulty: 5,
    office: "兵部尚书",
    effects: { prestige: 2, morale: -2 },
  },
  大赦: {
    cost: 0,
    months: 1,
    difficulty: 0,
    office: "刑部尚书",
    effects: { virtue: 3, morale: 3, governance: -1 },
  },
  修园: {
    cost: 25,
    months: 4,
    difficulty: 2,
    office: "工部尚书",
    private: true,
    effects: { mood: 10 },
  },
  编修大典: {
    cost: 30,
    months: 6,
    difficulty: 5,
    office: "礼部尚书",
    effects: { virtue: 7 },
  },
  开海: {
    cost: 35,
    months: 4,
    difficulty: 8,
    office: "户部尚书",
    effects: { treasury: 70, governance: 3 },
  },
  转内帑: {
    cost: 0,
    months: 0,
    difficulty: 0,
    office: "户部尚书",
    effects: {},
  },
  转国库: {
    cost: 0,
    months: 0,
    difficulty: 0,
    office: "户部尚书",
    effects: {},
  },
  立储: {
    cost: 0,
    months: 0,
    difficulty: 0,
    office: "礼部尚书",
    effects: { prestige: 2 },
  },
  禅位: { cost: 0, months: 0, difficulty: 0, office: "礼部尚书", effects: {} },
  禁令: {
    cost: 5,
    months: 1,
    difficulty: 3,
    office: "刑部尚书",
    effects: { governance: 2, morale: -1 },
  },
  格物:{cost:0,months:0,difficulty:0,office:'工部尚书',effects:{}},
  兴业:{cost:0,months:0,difficulty:0,office:'工部尚书',effects:{}},
};
export function edictCost(state,type){return EDICTS[type]?.cost*(type==='修河'?1-(techEffects(state).riverDiscount||0):1);}
export function execution(state, type, die) {
  const edict = EDICTS[type];
  if (!edict) throw new Error("未知旨意类型");
  const post = state.court.posts.find((p) => p.title === edict.office),
    official = state.court.officials.find((o) => o.id === post?.holder),
    faction = state.court.factions.find((f) => f.id === official?.faction);
  const score =
    state.emperor.prestige * 0.4 +
    state.nation.governance * 0.3 +
    ((official?.abilities.政 ?? 20) - (official?.greed || 0) / 2) * 0.2 +
    ((faction?.attitude ?? 50) - 50) * 0.2 +
    (die - 10.5) -
    edict.difficulty +
    (state.settings.difficulty === "easy"
      ? 8
      : state.settings.difficulty === "hard"
        ? -8
        : 0);
  const baseTier=score>=85?0:score>=65?1:score>=45?2:score>=25?3:4;
  const tier=freedomRules(state).k===1?Math.min(1,baseTier):baseTier;
  return {
    score: Math.round(score),
    label: ["雷厉风行", "照办", "敷衍", "阳奉阴违", "封驳"][tier],
    rate: [1.2, 1, 0.6, 0.3, 0][tier],
    delay: [0.75, 1, 1.5, 1.5, 1][tier],
    official: official?.name || "署理官",
    tier,
  };
}
export function edictBlock(state, type, province = null) {
  if(!freedomRules(state).edictCooldown)return '';
  const same=p=>p.edictType===type&&(type!=='赈灾'||!province||!p.province||p.province===province);
  if(state.projects.some(p=>!p.done&&same(p)))return '同类旨意尚在途，请待竣结';
  const keys=type==='赈灾'?[type+':all',...(province?[type+':'+province]:Object.keys(state.edictCooldowns||{}).filter(k=>k.startsWith(type+':')))]:[type];
  if(keys.some(k=>(state.edictCooldowns?.[k]||0)>state.turn))return '同类旨意尚在'+freedomRules(state).edictCooldown+'旬冷却期';
  return '';
}
function finishInstant(s,type,province) {
  s.edictCooldowns ??= {};
  s.edictCooldowns[type==='赈灾'?type+':'+(province||'all'):type]=s.turn+freedomRules(s).edictCooldown;
  return s;
}
function projectExecution(p){
 const label=p.execRate>=1.2?'雷厉风行':p.execRate>=1?'照办':p.execRate>=0.6?'敷衍':'阳奉阴违';
 return {label,rate:p.execRate,official:p.office};
}
export function issueEdict(state, action, die) {
  const type = action.edictType || "禁令",
    rule = EDICTS[type]&&{...EDICTS[type],cost:edictCost(state,type)};
  if (!rule) throw new Error("无法识别此旨意，请选择模板");
  if(type==='格物')return configureResearch(state,action);
  if(type==='兴业')return buildIndustry(state,action);
  const blocked=edictBlock(state,type,action.province);if(blocked)throw new Error(blocked);
  if(action.province&&!state.nation.provinces.some(p=>p.id===action.province))throw new Error("请选择有效州郡");
  const armyTarget=action.armyTarget||'capital';
  if(type==='征兵'&&!['capital',...state.nation.army.frontiers.map(b=>b.dir)].includes(armyTarget))throw new Error('请选择有效军队');
  if (type === "立储") {
    const s = clone(state),
      child = s.harem.children.find(
        (c) => c.id === action.child && c.sex === "男" && c.health > 0,
      );
    if (!child) throw new Error("立储须选择在世皇子");
    if(s.harem.heir===child.id)return {state:s,note:child.name+' 已为储君，重申原旨'};
    s.harem.heir = child.id;
    return {
      state: finishInstant(applyPackage(s, rule.effects, "册立储君"),type),
      note: "册立 " + child.name + " 为储君",
    };
  }
  if (type === "禅位") {
    if (!state.harem.heir) throw new Error("尚未立储，不能禅位");
    const s = clone(state);
    s.ending = { type: "禅位", cause: "传位储君" };
    return { state: s, note: "诏告天下，禅位储君" };
  }
  if (type === "转内帑" || type === "转国库") {
    const from = type === "转内帑" ? "treasury" : "privy",
      to = from === "treasury" ? "privy" : "treasury",
      requested = Number(action.amount ?? 10);
    if (!Number.isFinite(requested)||requested<=0)throw new Error('请填写大于零的拨转金额');
    const amount=Math.min(requested,state.nation[from],1000000-state.nation[to]);
    return {
      state: finishInstant(applyPackage(state, { [from]: -amount, [to]: amount }, "两库拨转"),type),
      note: "拨转 " + amount + " 万两"+(amount<requested?'（按余银及收款余量办理）':''),
    };
  }
  const account = rule.private ? "privy" : "treasury";
  const ongoing=state.projects.find(p=>!p.done&&p.edictType===type&&(p.province||null)===(action.province||null)&&(type!=='征兵'||p.armyTarget===armyTarget));
  if(ongoing){
    if(action.followup!=='督办')return {state:clone(state),note:type+' · 重申原旨，仍由原班人马办理，未另支钱粮 · '+projectExecution(ongoing).label,execution:projectExecution(ongoing)};
    if(ongoing.end<=state.turn+1&&ongoing.execRate>=1)return {state:clone(state),note:type+' · 即将办结，未再追加钱粮 · '+projectExecution(ongoing).label,execution:projectExecution(ongoing)};
    if(state.nation[account]<rule.cost||state.nation.grain<(rule.grain||0))throw new Error('钱粮不足，无法追加督办');
    const s=applyPackage(state,{[account]:-rule.cost,grain:-(rule.grain||0)},type+'：追加督办');
    const p=s.projects.find(p=>p.id===ongoing.id);p.end=Math.max(s.turn+1,p.end-3);p.execRate=p.execRate<0.6?0.6:p.execRate<1?1:1.2;p.cost+=rule.cost;
    p.effects=Object.fromEntries(Object.entries(rule.effects).map(([k,v])=>[k,v*p.execRate]));
    s.stats.edicts++;
    return {state:s,note:type+' · 追加督办，期限缩短、执行改善；仍只办结一次 · '+projectExecution(p).label,execution:projectExecution(p)};
  }
  if (
    !action.intent && (state.nation[account] < rule.cost ||
    state.nation.grain < (rule.grain || 0))
  )
    throw new Error("钱粮不足，无法下发此旨");
  let current = state,
    exec = action.intent && freedomRules(state).k===1 ? {...execution(state,type,die),tier:1,label:"照办",rate:1,delay:1} : execution(state, type, die),
    forced = false;
  if(freedomRules(state).k&&exec.tier===4){const judged=adjudicate(current,{success:false});current=judged.state;if(judged.verdict.success)exec={...exec,tier:1,label:'照办',rate:1,delay:1,...(judged.verdict.partial?{partial:true,cost:judged.verdict.cost}:{})};}
  if (exec.tier === 4 && action.force) {
    const r = roll(current);
    current = r.state;
    exec = execution(current, type, r.value);
    forced = true;
    if (exec.tier === 4)
      current = addEvent(
        current,
        "党争",
        "强推圣旨激起党争",
        "封驳后再次强推未成",
        [
          { label: "暂息朝争", effects: { prestige: -2 } },
          { label: "召集廷议", effects: { mood: -2, governance: 1 } },
        ],
      );
  }
  let s = applyPackage(
    current,
    {
      [account]: exec.tier===4?0:-Math.min(rule.cost,current.nation[account]),
      grain: exec.tier===4?0:-Math.min(rule.grain||0,current.nation.grain),
      prestige: exec.tier === 0 ? 2 : exec.tier === 4 ? -3 : 0,
    },
    type + (exec.tier===4?"：内阁封还，钱粮未付 / ":"：发付钱粮 / ") + exec.label,
  );
  if (exec.rate > 0)
    s.projects.push({
      id: "pr-" + s.turn + "-" + s.projects.length,
      edictType: type,
      start: s.turn,
      end: s.turn + Math.max(3, Math.ceil(rule.months * exec.delay) * 3),
      progress: 0,
      execRate: exec.rate,
      cost: Math.min(rule.cost,current.nation[account]),
      office: rule.office,
      effects: Object.fromEntries(
        Object.entries(rule.effects).map(([k, v]) => [k, v * exec.rate]),
      ),
      province: action.province || null,
      ...(type==='征兵'?{armyTarget}:{}),
      done: false,
    });
  if(exec.tier===3)s.facts.push({subject:exec.official,key:"截留侵吞",value:type+"截留侵吞 "+(rule.cost*0.7).toFixed(1)+" 万两（已含于发付钱粮，不重复扣款）",turn:s.turn});
  s.stats.edicts++;
  return {
    state: s,
    note:
      type +
      (exec.tier===4?"（内阁封还，钱粮退回）":exec.tier===3?"（截留侵吞 "+(rule.cost*0.7).toFixed(1)+" 万两）":"") +
      (forced ? "（强推复核）" : "") +
      " · " +
      exec.label +
      "（" +
      exec.score +
      "）：" +
      exec.official +
      " 主办",
    execution: exec,
  };
}
export function advanceProjects(state) {
  let s = clone(state);
  for (const project of s.projects) {
    if (project.done) continue;
    project.progress = clamp(
      ((s.turn - project.start) / (project.end - project.start)) * 100,
    );
    if (s.turn >= project.end) {
      project.done = true;
      if(project.edictType==='兴业'){s=completeIndustry(s,project);project.progress=100;continue;}
      finishInstant(s,project.edictType,project.province);
      if(["减赋","加税"].includes(project.edictType)) {
        for(const p of s.nation.provinces.filter(p=>!project.province||project.province===p.id)) {
          p.taxRelief=project.edictType==="减赋"?{factor:0.8,untilQuarter:quarterIndex(s.turn)+4}:null;
          p.taxSurge=project.edictType==="加税"?{factor:1.2,untilQuarter:quarterIndex(s.turn)+4}:null;
        }
      }
      project.progress = 100;
      const effects=project.province&&Number.isFinite(project.effects.morale)?{...project.effects,morale:undefined,province:{id:project.province,morale:project.effects.morale}}:project.effects;
      s = applyPackage(s, effects, "政务竣结：" + project.edictType);
      if (project.province && project.edictType === "赈灾")
        s = applyPackage(
          s,
          {
            province: {
              id: project.province,
              disaster: -35 * project.execRate,
              morale: 8 * project.execRate,
            },
          },
          "地方赈济到位",
        );
      if (project.edictType === "征兵"){
        if(project.armyTarget==='capital')s.nation.army.capital.troops=Math.min(45000,s.nation.army.capital.troops+3000);
        s.nation.army.frontiers = s.nation.army.frontiers.map((f) => project.armyTarget==='all-frontiers'||project.armyTarget===f.dir?({
          ...f,
          troops: Math.min(1000000, f.troops + 3000),
          readiness: clamp(f.readiness + 5),
        }):f);
      }
    }
  }
  return s;
}
