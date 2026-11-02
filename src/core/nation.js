import { clone } from "./state.js";
import { clamp, applyPackage } from "./effects.js";
import {
  monthlyBudget, wasteQuote, provinceTaxFactor, settleArrears,
} from "./finance.js";
export function nationMonth(state) {
  let s = settleArrears(clone(state));
  const { salaries, armyPay, grain } = monthlyBudget(s);
  const due = armyPay + salaries,
    paid = Math.min(s.nation.treasury, due),
    unpaid = due - paid,
    deficit = unpaid > 0;
  s = applyPackage(
    s,
    {
      treasury: -paid,
      arrears: unpaid,
      privy: -2 - s.harem.consorts.length * 0.15,
      grain: -grain,
      morale: deficit ? -3 : s.nation.governance > 60 ? 0.5 : -0.2,
      governance: s.nation.morale < 25 ? -1 : 0,
    },
    "月结：俸禄、军饷与宫用",
  );
  s.stats.expense += paid;
  // A loss of public confidence requires emergency relief and security spending,
  // even while healthier provinces are still paying their old tax assessments.
  const relief = Math.max(0, 20 - s.nation.morale) * 1.25,
    reliefPaid = Math.min(s.nation.treasury, relief);
  if (relief > 0) {
    s = applyPackage(
      s,
      { treasury: -reliefPaid, arrears: relief - reliefPaid },
      "月结：低民心赈抚与维稳",
    );
    s.stats.expense += reliefPaid;
  }
  const waste = wasteQuote(s);
  if (waste.amount > 0) {
    s = applyPackage(s, { treasury: -waste.amount }, "冗费与侵吞");
    s.stats.expense += waste.amount;
  }
  s.nation.provinces = s.nation.provinces.map((p) => ({
    ...p,
    morale: clamp(
      p.morale + (s.nation.morale - p.morale) * 0.1 - (p.disaster > 0 ? 1 : 0),
    ),
    disaster: clamp(p.disaster - 2),
    rebellion: p.rebellion && p.morale < 40,
  }));
  return s;
}
export function nationQuarter(state) {
  const rate = clamp(0.5 + state.nation.governance * 0.0045, 0.5, 0.95),
    income =
      state.nation.provinces.reduce(
        (sum, p) => sum + p.tax * (1 - p.disaster / 150) * provinceTaxFactor(p, state.turn),
        0,
      ) *
      rate *
      3;
  let s = applyPackage(
    state,
    { treasury: income, grain: 75 },
    "季结：赋税实收 " + Math.round(rate * 100) + "% 与新粮入仓",
  );
  s.stats.income += income;
  return settleArrears(s);
}
export function nationYear(state) {
  let s = clone(state);
  s.nation.provinces = s.nation.provinces.map((p) => ({
    ...p,
    pop: Math.round(p.pop * (p.morale > 40 ? 1.002 : 0.995)),
  }));
  return s;
}
