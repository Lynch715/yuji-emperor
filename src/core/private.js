import { adjudicate } from "./freedom.js";
import { clone } from "./state.js";
import { check } from "./rng.js";
import { applyPackage, growTalent } from "./effects.js";
export function privateAction(state, action, die = 11) {
  let s = clone(state);
  const operation = action.operation || "闲谈";
  if(operation==='经筵') {
    const child=s.harem.children.find(c=>c.id===s.reign?.emperorId);
    if(child)child.education=Math.min(100,(child.education||0)+0.2);
    return {state:growTalent(s,'文采',0.2),note:'经筵进讲，习读经史'};
  }
  const
    spec = {
      试探: ["权谋", "一般"],
      离间: ["权谋", "困难"],
      暗查: ["权谋", "一般"],
      收买: ["魅力", "容易"],
      闲谈: ["魅力", "容易"],
    }[operation];
  if (!spec) throw new Error("未知私下行动");
  const target = s.court.officials.find(
    (o) => o.id === action.person && o.alive && !o.jailed && !o.retired,
  );
  if (!target) throw new Error("请选择可接触的官员");
  if (operation === "收买" && s.nation.privy < 5)
    throw new Error("内帑不足以收买");
  let verdict = check(
    s.emperor.talents[spec[0]],
    die,
    spec[1],
    target.abilities.才,
    s.emperor.mood < 20 ? -10 : 0,
  );
  const outcome=adjudicate(s,verdict,target.id);s=outcome.state;verdict=outcome.verdict;
  if (operation === "收买")
    s = applyPackage(s, { privy: -5 }, "私下行事：收买成本");
  if (verdict.success) {
    if (["试探", "暗查"].includes(operation))
      s.court.officials.find((o) => o.id === target.id).secretKnown = true;
    if (operation === "离间")
      s = applyPackage(
        s,
        {
          faction: { [target.faction]: -3 },
          official: { id: target.id, favor: -3 },
        },
        "私下离间",
      );
    if (operation === "收买")
      s = applyPackage(
        s,
        { official: { id: target.id, favor: 5 } },
        "私下收买",
      );
    if (operation === "暗查")
      s = applyPackage(s, { governance: 1 }, "暗查有据");
    if (operation === "闲谈") s = applyPackage(s, { mood: 1 }, "闲谈解忧");
  } else
    s = applyPackage(
      s,
      { official: { id: target.id, favor: -2 } },
      "私下行事未成",
    );
  return {
    state: s,
    note:
      operation +
      " " +
      target.name +
      " · " +
      (verdict.success ? "成功" : "未成"),
    check: verdict,
  };
}
