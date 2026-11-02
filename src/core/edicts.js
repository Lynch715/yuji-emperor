import { clone } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { addEvent } from "./events.js";
import { roll } from "./rng.js";
import { fateModifier } from "./rng.js";
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
    effects: { treasury: 40, morale: -6, virtue: -2 },
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
};
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
    (state.settings.freedom === "free" ? 30 : 0) +
    (state.settings.difficulty === "easy"
      ? 8
      : state.settings.difficulty === "hard"
        ? -8
        : 0);
  const tier =
    score >= 85 ? 0 : score >= 65 ? 1 : score >= 45 ? 2 : score >= 25 ? 3 : 4;
  return {
    score: Math.round(score),
    label: ["雷厉风行", "照办", "敷衍", "阳奉阴违", "封驳"][tier],
    rate: [1.2, 1, 0.6, 0.3, 0][tier],
    delay: [0.75, 1, 1.5, 1.5, 1][tier],
    official: official?.name || "署理官",
    tier,
  };
}
export function issueEdict(state, action, die) {
  const type = action.edictType || "禁令",
    rule = EDICTS[type];
  if (!rule) throw new Error("无法识别此旨意，请选择模板");
  if (type === "立储") {
    const s = clone(state),
      child = s.harem.children.find(
        (c) => c.id === action.child && c.sex === "男" && c.health > 0,
      );
    if (!child) throw new Error("立储须选择在世皇子");
    s.harem.heir = child.id;
    return {
      state: applyPackage(s, rule.effects, "册立储君"),
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
      amount = Math.floor(Number(action.amount) || 10);
    if (amount <= 0 || amount > 100 || state.nation[from] < amount)
      throw new Error("拨转须为 1–100 万两，且余额足够");
    return {
      state: applyPackage(state, { [from]: -amount, [to]: amount }, "两库拨转"),
      note: "拨转 " + amount + " 万两",
    };
  }
  const account = rule.private ? "privy" : "treasury";
  if (
    state.nation[account] < rule.cost ||
    state.nation.grain < (rule.grain || 0)
  )
    throw new Error("钱粮不足，无法下发此旨");
  let current = state,
    exec = execution(state, type, die),
    forced = false;
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
      [account]: -rule.cost,
      grain: -(rule.grain || 0),
      prestige: exec.tier === 0 ? 2 : exec.tier === 4 ? -3 : 0,
    },
    type + "：发付钱粮 / " + exec.label,
  );
  if (exec.rate > 0)
    s.projects.push({
      id: "pr-" + s.turn + "-" + s.projects.length,
      edictType: type,
      start: s.turn,
      end: s.turn + Math.max(3, Math.ceil(rule.months * exec.delay) * 3),
      progress: 0,
      execRate: exec.rate,
      cost: rule.cost,
      office: rule.office,
      effects: Object.fromEntries(
        Object.entries(rule.effects).map(([k, v]) => [k, v * exec.rate]),
      ),
      province: action.province || null,
      done: false,
    });
  s.stats.edicts++;
  return {
    state: s,
    note:
      type +
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
      project.progress = 100;
      s = applyPackage(s, project.effects, "政务竣结：" + project.edictType);
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
      if (project.edictType === "征兵")
        s.nation.army.frontiers = s.nation.army.frontiers.map((f) => ({
          ...f,
          troops: Math.min(1000000, f.troops + 3000),
          readiness: clamp(f.readiness + 5),
        }));
    }
  }
  return s;
}
