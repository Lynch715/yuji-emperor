import { clone, reignId, TALENTS } from "./state.js";
import { roll } from "./rng.js";
import { succession } from "./harem.js";
import { clamp } from "./effects.js";
// Continue the existing polity. No call to createState, no reset of money, army, queues or factions.
export function succeedEmperor(state) {
  if (!["驾崩", "禅位"].includes(state.ending?.type))
    throw new Error("只有驾崩或禅位才能继位");
  let s = clone(state);
  const decision = succession(s),
    child = s.harem.children.find((c) => c.id === decision.successorId);
  const previous = s.harem.children.find((c) => c.id === s.reign?.emperorId);
  if (previous) previous.health = 0;
  const age = child ? Math.max(0, Math.floor((s.turn - child.born) / 36)) : 24,
    number = (s.reign?.number || 1) + 1;
  s.reign = {
    number,
    accessionTurn: s.turn,
    emperorId: child?.id || "collateral-" + number,
    initialTreasury: s.nation.treasury,
    initialStats: { ...s.stats },
  };
  const draw = (a, b) => {
    const r = roll(s, a, b);
    s = r.state;
    return r.value;
  };
  const talents = Object.fromEntries(
    TALENTS.map((t) => [
      t,
      clamp(
        (child?.aptitude || 58) + (child?.education || 0) / 10 + draw(-10, 10),
        30,
        90,
      ),
    ]),
  );
  const lifespan = Math.max(age + 1, draw(55, 80)),
    tag = ["勤政", "仁厚", "节俭", "多疑"][draw(0, 3)];
  s.emperor = {
    name:
      decision.successor === "宗室旁支" ? "萧承" + number : decision.successor,
    age,
    lifespan,
    health: Math.max(55, child?.health || 85),
    energy: 9,
    mood: 65,
    prestige: 50,
    virtue: 55,
    talents,
    tags: [tag],
    status: [],
    growth: Object.fromEntries(TALENTS.map((t) => [t, 0])),
  };
  for (const c of s.harem.consorts) c.retired = true;
  const owner = reignId(s);
  for (let i = 0; i < 3; i++)
    s.harem.consorts.push({
      id: owner + "-c" + i,
      name:
        ["赵", "林", "孟"][i] +
        ["静宜", "清容", "素宁"][(number + i) % 3] +
        (number > 3 ? number : ""),
      age: 22 + i,
      rank: ["皇后", "妃", "嫔"][i],
      family: "新朝内廷",
      faction: "f" + i,
      favor: 60 - i * 8,
      mood: 70,
      ambition: draw(20, 60),
      scheming: draw(20, 65),
      health: 85,
      preg: null,
      relations: {},
      secret: "家族旧事有待查明。",
      confined: false,
      cold: false,
      retired: false,
      reignId: owner,
      recoveryUntil: 0,
    });
  s.harem.heir = null;
  s.harem.candidates = [];
  s.harem.selectionYear = 0;
  s.era = {
    ...s.era,
    name: ["承和", "景平", "绍宁", "永和"][(number - 2) % 4],
    year: 1,
  };
  s.ending = null;
  s.pending = null;
  s.turnBudget = null;
  s.schedule = { 朝: null, 午: null, 夜: null };
  s.interimEntries = [];
  s.revision++;
  s.facts.push({
    subject: s.emperor.name,
    key: "即位",
    value: decision.text,
    turn: s.turn,
  });
  return s;
}
