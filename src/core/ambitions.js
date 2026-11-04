import { clone, reignId } from "./state.js";
import { roll } from "./rng.js";
import { applyPackage, clamp } from "./effects.js";
import { grainBudget } from "./finance.js";
import { scenarioGoals, SCENARIO_GOALS, bindScenarioGoal, scenarioRuleValue } from "./scenario-goals.js";
export const GOALS = [
  {
    id: "clean",
    kind: "宏愿",
    title: "整顿吏治",
    objectives: [{ id: "gov", key: "governance", target: 80 }],
  },
  {
    id: "wealth",
    kind: "宏愿",
    title: "富国安民",
    objectives: [
      { id: "silver", key: "treasury", target: 900 },
      { id: "people", key: "morale", target: 75 },
    ],
  },
  {
    id: "sea",
    kind: "宏愿",
    title: "开海通商",
    objectives: [
      { id: "open", key: "project:开海", target: 1 },
      { id: "friendly", key: "friendly", target: 3 },
    ],
  },
  {
    id: "river",
    kind: "宏愿",
    title: "修通运河",
    objectives: [
      { id: "river", key: "project:修河", target: 2 },
      { id: "people", key: "morale", target: 70 },
    ],
  },
  {
    id: "canon",
    kind: "宏愿",
    title: "编修大典",
    objectives: [
      { id: "book", key: "project:编修大典", target: 1 },
      { id: "virtue", key: "virtue", target: 75 },
    ],
  },
  {
    id: "tribute",
    kind: "宏愿",
    title: "四夷宾服",
    objectives: [{ id: "states", key: "tribute", target: 4 }],
  },
  {
    id: "north",
    kind: "宏愿",
    title: "北伐雪耻",
    objectives: [{ id: "victory", key: "warsWon", target: 2 }],
  },
  {
    id: "peace",
    kind: "宏愿",
    title: "天下归心",
    objectives: [
      { id: "people", key: "morale", target: 85 },
      { id: "gov", key: "governance", target: 75 },
    ],
  },
  {
    id: "heir",
    kind: "心事",
    title: "有人承继大统",
    objectives: [{ id: "heir", key: "heir", target: 1 }],
  },
  {
    id: "journey",
    kind: "心事",
    title: "微服下江南",
    objectives: [{ id: "trip", key: "outings", target: 1 }],
  },
  {
    id: "garden",
    kind: "心事",
    title: "一座寄情园林",
    objectives: [{ id: "garden", key: "project:修园", target: 1 }],
  },
  {
    id: "love",
    kind: "心事",
    title: "白头不负故人",
    objectives: [
      { id: "years", key: "reignYears", target: 20 },
      { id: "favor", key: "maxFavor", target: 85 },
    ],
  },
  {
    id: "poetry",
    kind: "心事",
    title: "诗稿结为一集",
    objectives: [{ id: "poem", type: "story", keywords: ["诗", "集"] }],
  },
  {
    id: "family",
    kind: "心事",
    title: "儿女绕膝",
    objectives: [{ id: "children", key: "children", target: 3 }],
  },
  {
    id: "health",
    kind: "心事",
    title: "安度十载春秋",
    objectives: [
      { id: "years", key: "reignYears", target: 10 },
      { id: "health", key: "health", target: 80 },
    ],
  },
  {
    id: "friend",
    kind: "心事",
    title: "君臣相知",
    objectives: [{ id: "friend", key: "maxOfficialFavor", target: 85 }],
  },
];
export function goalsForScenario(id) {return [...GOALS,...scenarioGoals(id)];}
export function selectAmbitions(state, selected = []) {
  let s = clone(state),
    chosen = [];
  for (const kind of ["宏愿", "心事"]) {
    const catalog=(s.reign?.number||1)===1?goalsForScenario(s.scenario):GOALS;
    const options = catalog.filter((g) => g.kind === kind);
    for (let i = 0; i < 2; i++) {
      let id = selected[kind === "宏愿" ? i : i + 2];
      if(id&&Object.values(SCENARIO_GOALS).flat().some(g=>g.id===id)&&!options.some(g=>g.id===id))throw new Error('此专属目标不属于当前皇帝');
      let g = options.find(
        (g) => g.id === id && !chosen.some((c) => c.id === id),
      );
      if (!g) {
        const pool = options.filter((g) => !chosen.some((c) => c.id === g.id)),
          r = roll(s, 0, pool.length - 1);
        s = r.state;
        g = pool[r.value];
      }
      chosen.push({
        ...(g.scenarioId?bindScenarioGoal(s,g,reignId(s)):clone(g)),
        completion: null,
        progress: 0,
        status: "进行中",
      });
    }
  }
  s.ambitions = chosen;
  return s;
}
export function goalMetric(s, key) {
  if(key.startsWith('talent:'))return s.emperor.talents[key.slice(7)]??null;
  if(key==='arrears')return s.nation.arrears;
  if(key==='rebellions')return s.nation.provinces.filter(p=>p.rebellion).length;
  if(key==='minMorale')return Math.min(...s.nation.provinces.map(p=>p.morale));
  if(key==='maxDisaster')return Math.max(...s.nation.provinces.map(p=>p.disaster));
  if(key==='grainMonths'){const budget=grainBudget(s).monthly;return budget?s.nation.grain/budget:null;}
  if(key==='personalRule')return Number(!s.regency&&s.emperor.age>=16);
  if(['livingHeir','heirTutored','heirEducation'].includes(key)){
    const c=s.harem.children.find(c=>c.id===s.harem.heir&&c.health>0&&c.id!==s.reign?.emperorId);
    if(!c)return key==='heirEducation'?null:0;
    if(key==='livingHeir')return 1;
    if(key==='heirEducation')return c.education;
    return Number(s.court.officials.some(o=>o.id===c.tutor&&o.alive&&o.health>0&&!o.jailed&&!o.retired&&s.court.posts.some(p=>p.holder===o.id&&p.id===o.post)));
  }
  if (key.startsWith("project:"))
    return s.projects.filter((p) => p.done && p.edictType === key.slice(8) && p.start >= (s.reign?.accessionTurn || 0))
      .length;
  return (
    {
      governance: s.nation.governance,
      treasury: s.nation.treasury,
      morale: s.nation.morale,
      virtue: s.emperor.virtue,
      prestige: s.emperor.prestige,
      health: s.emperor.health,
      friendly: s.foreign.filter((f) =>
        ["通好", "婚盟", "朝贡"].includes(f.status),
      ).length,
      tribute: s.foreign.filter((f) => ["朝贡", "婚盟"].includes(f.status))
        .length,
      warsWon: s.stats.warsWon - (s.reign?.initialStats?.warsWon || 0),
      heir: s.harem.heir ? 1 : 0,
      outings: (s.stats.outings || 0) - (s.reign?.initialStats?.outings || 0),
      reignYears: Math.max(0,s.turn - (s.reign?.accessionTurn || 0)) / 36,
      maxFavor: Math.max(0, ...s.harem.consorts.filter(c=>!c.retired&&c.health>0&&c.reignId===reignId(s)).map((c) => c.favor)),
      children: s.harem.children.filter(c=>c.fatherId===reignId(s)).length,
      maxOfficialFavor: Math.max(0, ...s.court.officials.map((o) => o.favor)),
    }[key] || 0
  );
}
export function evaluateAmbitions(state, narrative = {}) {
  let s = clone(state);
  const body = Object.values(narrative.chapter || {}).join("\n");
  for (const id of s.ambitions.map((a) => a.id)) {
    const a = s.ambitions.find((a) => a.id === id);
    if (a.status === "达成") continue;
    let total = 0;
    for (const o of a.objectives) {
      if (o.type === "story") {
        const e = (narrative.ambitionEvidence || []).find(
          (e) =>
            e.id === a.id &&
            e.objectiveId === o.id &&
            typeof e.evidence === "string" &&
            e.evidence.length >= 8 &&
            body.includes(e.evidence) &&
            o.keywords.every((k) => e.evidence.includes(k)),
        );
        if (e) {
          o.evidence = e.evidence;
          o.done = true;
        }
        total += o.done ? 1 : 0;
      } else {
        const v = o.rule?scenarioRuleValue(s,o.rule):goalMetric(s, o.key);
        o.current = v;
        o.done = Number.isFinite(v)&&(o.op==='lte'?v<=o.target:v>=o.target);
        total += !Number.isFinite(v)?0:o.op==='lte'?(o.done?1:o.target>0?clamp(o.target/v,0,1):1/(1+v)):clamp(v / o.target, 0, 1);
      }
    }
    let complete=a.objectives.every((o) => o.done);
    if(a.scenarioId&&a.ownerReignId!==reignId(s))complete=false;
    if(a.holdTurns){
      if(s.turn>a.checkedTurn){a.stableTurns=complete?(s.turn===a.checkedTurn+1?Math.min(a.holdTurns,a.stableTurns+1):1):0;a.checkedTurn=s.turn;}
      else if(!complete)a.stableTurns=0;
      total+=a.stableTurns/a.holdTurns;
      complete=complete&&a.stableTurns>=a.holdTurns;
    }
    a.progress = Math.round((total / (a.objectives.length+(a.holdTurns?1:0))) * 100);
    if(a.scenarioId&&!complete)a.progress=Math.min(99,a.progress);
    if (complete) {
      a.status = "达成";
      a.completion = s.turn;
      const receipt = "goal:" + reignId(s) + ":" + a.id;
      if (!s.receipts.includes(receipt)) {
        s.receipts.push(receipt);
        s = applyPackage(
          s,
          a.kind === "宏愿"
            ? { prestige: 5, virtue: 3, mood: 6 }
            : { mood: 10 },
          "达成" + a.kind + "：" + a.title,
        );
      }
    }
  }
  return s;
}
