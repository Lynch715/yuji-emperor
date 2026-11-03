import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
// Keep the national value at 19 under C1's population-weighted definition.
// The selected low-population province tests local morale 19/62/100; the
// remaining provinces carry the compensating low confidence.
export function lowMoraleFixture(state,provincialMorale=19){
 const s=structuredClone(state),total=s.nation.provinces.reduce((n,p)=>n+p.pop,0),local=[...s.nation.provinces].sort((a,b)=>a.pop-b.pop)[0];
 const rest=(19*total-local.pop*provincialMorale)/(total-local.pop);
 for(const p of s.nation.provinces)p.morale=p.id===local.id?provincialMorale:rest;
 // Isolate the economy from a minister autonomously approving relief.
 s.court.officials.forEach(o=>o.ambition=0);
 s.nation.morale=19;return s;
}
// Free mode prevents a premature game-over from shortening this isolated three-year economic test.
// It does not change taxation, budget, waste, cash payments or arrears.
export function lowMoraleScenario(seed, treasury=480, governance=58, provincialMorale=19) {
 let s=lowMoraleFixture(initialTurn(createState({seed,freedom:'free'})),provincialMorale);
 s.nation.morale=19;s.nation.treasury=treasury;s.nation.governance=governance;
 let income=0,expense=0,maxMorale=19,minMorale=19;
 for(let i=0;i<108;i++){
  s.history=[];s.volumes=[];s.ledger=[];
  const f=forecastTurn(s);s=commitTurn(s,f,{});
  for(const e of f.entries.filter(e=>e.path==='nation.treasury')){
   const d=e.after-e.before;
   if(d>0)income+=d;else expense-=d;
  }
  maxMorale=Math.max(maxMorale,s.nation.morale);minMorale=Math.min(minMorale,s.nation.morale);
 }
 const round=n=>Math.round(n*100)/100;
 return {seed,years:3,turns:108,freedom:'free',initialGovernance:governance,initialProvincialMorale:provincialMorale,openingTreasury:treasury,
  closingTreasury:round(s.nation.treasury),netChange:round(s.nation.treasury-treasury),income:round(income),expense:round(expense),
  arrears:round(s.nation.arrears),minMorale:round(minMorale),maxMorale:round(maxMorale),
  passed:maxMorale<20&&s.nation.treasury<=treasury+1e-8};
}
