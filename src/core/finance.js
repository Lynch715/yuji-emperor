import { applyPackage } from "./effects.js";
// All amounts are 万两. Budget is twelve months of current recurring treasury obligations.
export function monthlyBudget(state) {
  const troops =
    state.nation.army.capital.troops +
    state.nation.army.frontiers.reduce((sum, b) => sum + b.troops, 0);
  const salaries = 8 + state.court.posts.filter((p) => p.holder).length * 0.08;
  return { salaries, armyPay: troops / 12000, grain: troops / 22000 };
}
export function annualBudget(state) {
  const b = monthlyBudget(state);
  return 12 * (b.salaries + b.armyPay);
}
export function grainBudget(state){
  const military=monthlyBudget(state).grain,relief=state.nation.provinces.filter(p=>p.disaster>0).length*2;
  return {military,relief,monthly:military+relief,storageCapacity:(military+relief)*36};
}
export function wasteQuote(state) {
  const budget = annualBudget(state),
    threshold = budget * 2,
    governance = Math.max(0, Math.min(100, state.nation.governance)),
    rate = 0.03 * (1 + 3 * Math.pow((100 - governance) / 100, 0.25)),
    excess = Math.max(0, state.nation.treasury - threshold);
  return { budget, threshold, rate, excess, amount: excess * rate };
}
export function quarterIndex(turn) {
  return Math.max(0, Math.ceil(turn / 9) - 1);
}
export function provinceTaxFactor(province, turn) {
  if (province.rebellion || province.rebellionQuarter === quarterIndex(turn))
    return 0;
  return province.morale < 15 ? 0.2 : province.morale < 30 ? 0.5 : 1;
}
export function settleArrears(state) {
  let s=state;
  for(const [account,debt,label]of [['treasury','arrears','补付欠饷与积欠'],['privy','privyArrears','补付内帑积欠'],['grain','grainArrears','补付缺粮积欠']]){
    const amount=Math.min(s.nation[account],s.nation[debt]||0);if(amount<=0)continue;
    s=applyPackage(s,{[account]:-amount,[debt]:-amount},label);
    if(account==='treasury')s.stats.expense+=amount;
  }
  return s;
}
