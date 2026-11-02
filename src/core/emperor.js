import { clone } from "./state.js";
import { applyPackage } from "./effects.js";
import { roll } from "./rng.js";
export function energyLimit(s) {
  return (
    Math.min(10, 6 + Math.floor(s.emperor.health / 25)) -
    (s.emperor.status.includes("劳累") ? 1 : 0)
  );
}
export function settleEnergy(state, cost) {
  let s = clone(state);
  const excess = Math.max(0, cost - energyLimit(s));
  s.emperor.status = s.emperor.status.filter((x) => x !== "劳累");
  if (excess) {
    s = applyPackage(
      s,
      { health: -2 * excess, mood: -3 * excess },
      "勉力理政：透支 " + excess + " 点精力",
    );
    s.emperor.status.push("劳累");
  }
  s.emperor.energy = Math.max(0, energyLimit(s) - cost);
  return s;
}
export function emperorMonth(state) {
  let s = applyPackage(
    state,
    {
      health: state.emperor.status.includes("劳累") ? -2 : 1,
      mood: state.emperor.mood < 20 ? 1 : -1,
    },
    "太医月诊与心绪",
  );
  const tags = s.emperor.tags;
  if (tags.includes("勤政"))
    s = applyPackage(s, { governance: 0.3, mood: -0.5 }, "性格：勤政");
  if (tags.includes("仁厚")) s = applyPackage(s, { virtue: 0.3 }, "性格：仁厚");
  if (tags.includes("节俭"))
    s = applyPackage(s, { privy: 1 }, "性格：节俭，核减宫费");
  if (tags.includes("多疑")) s = applyPackage(s, { mood: -0.3 }, "性格：多疑");
  if (tags.includes("嗜酒"))
    s = applyPackage(s, { health: -0.5, mood: 1 }, "性格：嗜酒");
  if (s.emperor.health < 30 && s.settings.freedom !== "free")
    s.emperor.lifespan = Math.max(s.emperor.age + 1, s.emperor.lifespan - 0.1);
  if (s.settings.freedom === "free")
    s = applyPackage(
      s,
      { health: Math.max(0, 30 - s.emperor.health) },
      "随心所欲：护持圣躬",
    );
  if (s.emperor.health < 10 && s.settings.freedom !== "free") {
    const r = roll(s, 1, 100);
    s = r.state;
    if (r.value <= 25) s.ending = { type: "驾崩", cause: "久病不起" };
  }
  return s;
}
export function emperorYear(state) {
  let s = clone(state);
  s.emperor.age++;
  s.emperor.growth = Object.fromEntries(
    Object.keys(s.emperor.talents).map((t) => [t, 0]),
  );
  if (s.emperor.age >= s.emperor.lifespan)
    s.ending = { type: "驾崩", cause: "寿终正寝" };
  return s;
}
