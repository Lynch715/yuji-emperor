import { applyPackage } from "./effects.js";
// Treasury uses 万两 and grain uses 万石. Budget covers twelve months of recurring treasury obligations.
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
// Grain is 万石; province population is 万人, not a grain yield. Scale
// normal harvest to recurring military demand, then weight crop damage by people.
export function quarterlyGrain(state){
  const population=state.nation.provinces.reduce((n,p)=>n+p.pop,0);
  const crop=population?state.nation.provinces.reduce((n,p)=>n+p.pop*(1-Math.max(0,Math.min(100,p.disaster))/100),0)/population:0;
  return monthlyBudget(state).grain*3*1.2*crop;
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
