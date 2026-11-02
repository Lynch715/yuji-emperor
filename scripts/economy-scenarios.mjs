import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
// Free mode prevents a premature game-over from shortening this isolated three-year economic test.
// It does not change taxation, budget, waste, cash payments or arrears.
export function lowMoraleScenario(seed, treasury=480, governance=58, provincialMorale=19) {
 let s=initialTurn(createState({seed,freedom:'free'}));
 s.nation.morale=19;s.nation.treasury=treasury;s.nation.governance=governance;
 for(const p of s.nation.provinces)p.morale=provincialMorale;
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
