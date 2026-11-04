import {researchMonth} from './tech.js';
import {industriesQuarter,industryTradeFactor} from './industries.js';
import { clone } from "./state.js";
import { clamp, applyPackage } from "./effects.js";
import {
  monthlyBudget, grainBudget, quarterlyGrain, wasteQuote, provinceTaxFactor, settleArrears, quarterIndex,
} from "./finance.js";
export function nationMonth(state) {
  let s = settleArrears(applyPackage(state,{privy:3},'月结：皇庄与盐课收入'));
  const { salaries, armyPay } = monthlyBudget(s),grain=grainBudget(s).monthly;
  const due = armyPay + salaries,
    paid = Math.min(s.nation.treasury, due),
    unpaid = due - paid,
    deficit = unpaid > 0;
  s = applyPackage(
    s,
    {
      treasury: -paid,
      arrears: unpaid,
      privy: -(2+s.harem.consorts.filter(c=>!c.retired&&c.health>0).length*0.15)*(s.emperor.tags.includes('节俭')?0.7:1),
      grain: -grain,
      morale: deficit ? -3 : s.nation.governance<45?(s.nation.governance-45)/30:0,
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
  const canRepair=!deficit&&s.nation.arrears===0&&s.nation.morale>=25;
  s.nation.provinces = s.nation.provinces.map((p) => ({
    ...p,
    morale: clamp(
      p.morale + (canRepair&&!p.rebellion?(55-p.morale)*0.018:0) - (p.disaster > 0 ? 1 : 0),
    ),
    disaster: clamp(p.disaster - 2),
    rebellion: p.rebellion && p.morale < 40,
  }));
  s=applyPackage(s,{},'月结：各州民心归并');
  const reinforcement=Math.ceil(Math.max(0,45000-s.nation.army.capital.troops)*0.01),pay=reinforcement/1000;
  if(reinforcement>0&&s.nation.morale>=30&&s.nation.grain>=grainBudget(s).military&&s.nation.treasury>=pay){
    s=applyPackage(s,{treasury:-pay},'月结：京营补员付饷');
    s.nation.army.capital.troops+=reinforcement;
  }
  return researchMonth(s);
}
export function nationQuarter(state) {
  const rate = clamp(0.5 + state.nation.governance * 0.0045, 0.5, 0.95),
    income =
      state.nation.provinces.reduce(
        (sum, p) => sum + p.tax * (1+(p.prosperity||0)/100) * (1 - p.disaster / 150) * provinceTaxFactor(p, state.turn) *
          (p.taxRelief && quarterIndex(state.turn)<p.taxRelief.untilQuarter?p.taxRelief.factor:1) *
          (p.taxSurge && quarterIndex(state.turn)<p.taxSurge.untilQuarter?p.taxSurge.factor:1),
        0,
      ) *
      rate *
      3;
  let s = applyPackage(
    state,
    { treasury: income, grain: quarterlyGrain(state) },
    "季结：赋税实收 " + Math.round(rate * 100) + "% 与新粮入仓",
  );
  s.stats.income += income;
  s=industriesQuarter(s);
  const trade=s.foreign.filter(f=>f.status!=='交战'&&f.trade&&s.turn>f.trade.start&&s.turn<=f.trade.until).reduce((n,f)=>n+f.trade.income,0)*industryTradeFactor(s);
  if(trade){s=applyPackage(s,{treasury:trade},'季结：外邦互市岁入');s.stats.income+=trade;}
  const surging=s.nation.provinces.filter(p=>p.taxSurge&&quarterIndex(s.turn)<p.taxSurge.untilQuarter);
  for(const p of surging)s=applyPackage(s,{province:{id:p.id,morale:-2}},'季结：加税失民心');
  for(const p of s.nation.provinces){
    if(p.taxRelief&&quarterIndex(s.turn)>=p.taxRelief.untilQuarter)p.taxRelief=null;
    if(p.taxSurge&&quarterIndex(s.turn)>=p.taxSurge.untilQuarter)p.taxSurge=null;
  }
  return settleArrears(s);
}
export function nationYear(state) {
  let s = clone(state);
  const spoiled=Math.max(0,s.nation.grain-grainBudget(s).storageCapacity)*0.3;
  if(spoiled)s=applyPackage(s,{grain:-spoiled},'年结：超仓陈粮霉变三成');
  s.nation.provinces = s.nation.provinces.map((p) => ({
    ...p,
    pop: Math.round(p.pop * ((p.morale > 40 ? 1.002 : 0.995)+(p.prosperity||0)*0.00002)),
  }));
  return s;
}
