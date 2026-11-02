import { clone, reignId } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { roll } from "./rng.js";
import { addEvent } from "./events.js";
export const RANKS = [
  "皇后",
  "皇贵妃",
  "贵妃",
  "妃",
  "嫔",
  "贵人",
  "常在",
  "答应",
];
export const RANK_CAPS = { 皇后: 1, 皇贵妃: 1, 贵妃: 2, 妃: 4, 嫔: 6 };
export function rankAvailable(s, rank, except = null) {
  return (
    RANKS.includes(rank) &&
    s.harem.consorts.filter(
      (c) => c.rank === rank && c.id !== except && !c.cold && !c.retired,
    ).length < (RANK_CAPS[rank] || Infinity)
  );
}
export function generateCandidates(state) {
  let s = clone(state);
  if (s.era.year % 3 !== 1) throw new Error("本年不是选秀年");
  if (s.harem.selectionYear === s.era.year) return s;
  const r = roll(s, 6, 10);
  s = r.state;
  s.harem.selectionYear = s.era.year;
  s.harem.candidates = Array.from({ length: r.value }, (_, i) => ({
    id: reignId(s) + "-candidate-" + s.era.year + "-" + i,
    name:
      ["顾", "谢", "方", "崔", "温", "郑", "宋", "柳", "韩", "许"][i] +
      [
        "静姝",
        "疏影",
        "明漪",
        "书宁",
        "婉清",
        "知微",
        "云岫",
        "晚晴",
        "映棠",
        "清圆",
      ][i],
    age: 20 + (i % 5),
    family: "仕宦之家",
    faction: "f" + (i % 6),
    appearance: 60 + i * 3,
    personality: ["沉静", "直率", "敏慧"][i % 3],
    ambition: 25 + i * 4,
    scheming: 20 + i * 5,
    health: 85,
  }));
  return s;
}
export function selectConsort(state, id, rank = "贵人") {
  if (state.era.year % 3 !== 1 || state.harem.selectionYear !== state.era.year)
    throw new Error("本年不是选秀年");
  let s = clone(state);
  const c = s.harem.candidates.find((c) => c.id === id);
  if (!c) throw new Error("此秀女已离开殿选");
  if (!rankAvailable(s, rank)) throw new Error("此位分已满额");
  s.harem.consorts.push({
    ...c,
    rank,
    favor: 40,
    mood: 60,
    preg: null,
    relations: {},
    secret: "入宫前与家族尚有一约。",
    confined: false,
    cold: false,
    retired: false,
    reignId: reignId(s),
    recoveryUntil: 0,
  });
  s.harem.candidates = s.harem.candidates.filter((c) => c.id !== id);
  s = applyPackage(s, { faction: { [c.faction]: 3 } }, "殿选赐位：" + c.name);
  return s;
}
export function canVisit(state, c) {
  return (
    !!c &&
    !c.retired &&
    c.health > 0 &&
    !c.cold &&
    !c.confined &&
    !c.preg &&
    c.age >= 18 &&
    c.age < 50 &&
    state.emperor.age >= 18 &&
    (c.recoveryUntil || 0) <= state.turn
  );
}
export function haremAction(state, action) {
  let s = clone(state),
    c = s.harem.consorts.find((c) => c.id === action.person);
  if (!c) throw new Error("此人不在后宫名册");
  const operation = action.operation || "探望";
  if (operation === "侍寝") {
    if (!canVisit(s, c))
      throw new Error(
        c.recoveryUntil > s.turn
          ? "产后调养中，请先探望休养"
          : "此时不能安排侍寝",
      );
    c.favor = clamp(c.favor + 5);
    c.mood = clamp(c.mood + 4);
    s.stats.visits++;
    s = applyPackage(s, { mood: 3, health: -0.3 }, "夜间侍寝");
    const r = roll(s, 1, 1000);
    s = r.state;
    c = s.harem.consorts.find((x) => x.id === c.id);
    const chance =
      150 *
      (c.health / 100) *
      (s.emperor.health / 100) *
      (c.age < 35 ? 1 : c.age < 45 ? 0.5 : 0.1);
    if (r.value <= chance)
      c.preg = {
        conceived: s.turn,
        due: s.turn + 30,
        father: s.emperor.name,
        fatherId: reignId(s),
      };
    for (const other of s.harem.consorts)
      if (other.id !== c.id)
        other.relations[c.id] = clamp((other.relations[c.id] ?? 50) - 2);
  } else if (operation === "探望") {
    c.favor = clamp(c.favor + 3);
    c.mood = clamp(c.mood + 5);
    s = applyPackage(s, { mood: 2 }, "探望 " + c.name);
  } else if (operation === "赏赐") {
    const amount = Number(action.amount) || 2;
    if (amount < 1 || amount > 20 || s.nation.privy < amount)
      throw new Error("内帑不足或赏赐超限");
    s = applyPackage(s, { privy: -amount }, "赏赐 " + c.name);
    c = s.harem.consorts.find((x) => x.id === action.person);
    c.favor = clamp(c.favor + amount);
  } else if (operation === "禁足") {
    c.confined = !c.confined;
    c.favor = clamp(c.favor - 4);
  } else if (operation === "冷宫") {
    c.cold = true;
    c.favor = 0;
    s = applyPackage(
      s,
      { faction: { [c.faction]: -15 } },
      "打入冷宫：家族反弹",
    );
  } else if (operation === "晋位" || operation === "降位") {
    const rank =
      RANKS[
        clamp(RANKS.indexOf(c.rank) + (operation === "晋位" ? -1 : 1), 0, 7)
      ];
    if (!rankAvailable(s, rank, c.id)) throw new Error("位分名额已满");
    c.rank = rank;
    s = applyPackage(
      s,
      { faction: { [c.faction]: operation === "晋位" ? 5 : -8 } },
      operation + "：" + c.name,
    );
  } else if (operation === "教养") {
    const child = s.harem.children.find((x) => x.id === action.child),
      tutor = s.court.officials.find((o) => o.id === action.tutor && o.alive);
    if (!child || !tutor) throw new Error("请选择皇嗣与师傅");
    child.tutor = tutor.id;
  } else throw new Error("未知后宫行动");
  return { state: s, note: c.name + " · " + operation };
}
export function haremMonth(state) {
  let s = clone(state);
  for (const mother of s.harem.consorts) {
    if (mother.preg && s.turn >= mother.preg.due) {
      const r = roll(s, 1, 100);
      s = r.state;
      const m = s.harem.consorts.find((c) => c.id === mother.id),
        index = s.harem.children.length + 1;
      const sex = r.value <= 51 ? "男" : "女";
      s.harem.children.push({
        id: "child-" + s.runId + "-" + index,
        name:
          "萧" +
          (sex === "男" ? "景" : "昭") +
          ["宁", "和", "安", "明", "瑜", "璋", "珩", "琬", "棠", "瑾"][
            index % 10
          ] +
          (index > 9 ? index : ""),
        sex,
        mother: m.id,
        fatherId: m.preg.fatherId || s.runId,
        legit: m.rank === "皇后",
        born: s.turn,
        aptitude: 40 + (r.value % 51),
        health: 85,
        tutor: null,
        education: 0,
        faction: m.faction,
        party: false,
      });
      m.preg = null;
      m.recoveryUntil = s.turn + 18;
      m.health = clamp(m.health - 5);
      s.stats.births++;
      s = applyPackage(s, { mood: 8, prestige: 1 }, "皇嗣诞生");
    }
  }
  const r = roll(s, 1, 100);
  s = r.state;
  const schemer = s.harem.consorts
    .filter((c) => !c.retired && !c.cold && c.ambition > 50)
    .sort((a, b) => b.scheming - a.scheming)[0];
  if (r.value < 8 && schemer && s.harem.consorts.length > 1) {
    const target = s.harem.consorts.find(
      (c) => !c.retired && c.id !== schemer.id && !c.cold,
    );
    if (target) {
      s = addEvent(
        s,
        "宫闱",
        "内廷争宠风波",
        schemer.name + " 与 " + target.name + " 旧怨未解",
        [
          { label: "秉公查问", effects: { mood: -1, prestige: 1 } },
          { label: "暂且压下", effects: { mood: -3 } },
        ],
        [schemer.name, target.name],
      );
      const t = s.harem.consorts.find((c) => c.id === target.id);
      t.mood = clamp(t.mood - 5);
      if (t.preg && r.value === 1) {
        t.preg = null;
        t.health = clamp(t.health - 10);
        s = applyPackage(s, { mood: -8 }, "宫闱事件：引擎判定小产");
      }
    }
  }
  for (const child of s.harem.children) {
    const tutor = s.court.officials.find((o) => o.id === child.tutor);
    if (tutor)
      child.education = clamp(child.education + tutor.abilities.才 / 200);
    if (s.turn - child.born >= 15 * 36 && !child.party && child.sex === "男") {
      child.party = true;
      s = applyPackage(s, { faction: { [child.faction]: 2 } }, "成年皇子结党");
    }
  }
  return s;
}
export function haremYear(state) {
  const s = clone(state);
  s.harem.royalWomen = (s.harem.royalWomen || []).map((w) => ({
    ...w,
    age: w.age + 1,
  }));
  s.harem.children = s.harem.children.map((c) => ({
    ...c,
    health: clamp(c.health - ((s.turn - c.born) / 36 > 65 ? 5 : 0)),
  }));
  s.harem.consorts = s.harem.consorts.map((c) => ({
    ...c,
    age: c.age + 1,
    health: clamp(c.health - (c.age > 55 ? 2 : 0)),
  }));
  return s;
}

export function succession(state) {
  const heir = state.harem.children.find(
    (c) =>
      c.id === state.harem.heir &&
      c.health > 0 &&
      c.id !== state.reign?.emperorId,
  );
  if (heir)
    return {
      contested: false,
      successor: heir.name,
      successorId: heir.id,
      text: "遗诏奉储君 " + heir.name + " 即位",
    };
  const direct = state.harem.children.filter(
    (c) => c.fatherId === reignId(state) && c.health > 0 && c.sex === "男",
  );
  const candidates = (direct.length ? direct : state.harem.children)
    .filter(
      (c) => c.sex === "男" && c.health > 0 && c.id !== state.reign?.emperorId,
    )
    .map((c) => ({
      child: c,
      score:
        (state.court.factions.find((f) => f.id === c.faction)?.power || 0) +
        (c.legit ? 20 : 0) +
        (state.turn - c.born) / 36,
    }))
    .sort((a, b) => b.score - a.score);
  const winner = candidates[0]?.child.name || "宗室旁支";
  return {
    contested: true,
    successor: winner,
    successorId: candidates[0]?.child.id || null,
    text: "储位未定，诸派发生继位争夺；" + winner + " 凭势力承统",
  };
}

export function assignTutor(state, childId, tutorId) {
  const s = clone(state),
    child = s.harem.children.find((c) => c.id === childId && c.health > 0),
    tutor = s.court.officials.find(
      (o) => o.id === tutorId && o.alive && !o.jailed && !o.retired,
    );
  if (!child || !tutor) throw new Error("皇嗣或师傅不在可选名册");
  child.tutor = tutor.id;
  s.revision++;
  return s;
}
