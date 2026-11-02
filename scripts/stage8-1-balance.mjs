import {writeFile} from 'node:fs/promises';
import {simulate} from './simulate.mjs';
import {BALANCE_SEEDS} from './stage8-balance.mjs';
import {lowMoraleScenario} from './economy-scenarios.mjs';
export function economicChecks(r) {
 return {
  complete:r.turns===7200&&r.annual.length===200,
  treasuryPeak:r.maxTreasury<=3000,
  latePeak:r.maxTreasuryLast50<=r.maxTreasuryFirst50*1.5,
  collapseRate:r.collapseRate>=10&&r.collapseRate<=35,
  children:r.meanChildren>=4&&r.meanChildren<=9,
  events:r.eventsPerDecade.length===20&&r.eventsPerDecade.every(n=>n>=30&&n<=80),
  annualCash:r.annual.every(a=>Math.abs(a.closingTreasury-(a.openingTreasury+a.income-a.expense+a.resetAdjustment))<0.03),
 };
}
if(process.argv[1]===import.meta.filename){
 const result={version:'0.9.1',random:[],rest:[],lowMorale:[]};
 for(const seed of BALANCE_SEEDS){
  const r=simulate(200,seed);r.checks=economicChecks(r);result.random.push(r);
  const {annual,completedReignsDetail,eventsPerDecade,...compact}=r;
  console.log(JSON.stringify({...compact,eventRange:[Math.min(...eventsPerDecade),Math.max(...eventsPerDecade)]}));
  await writeFile('qa/stage8-1-balance.json',JSON.stringify(result,null,2));
 }
 for(const seed of BALANCE_SEEDS){
  const r=simulate(15,seed,{strategy:'rest',stopOnCollapse:true});
  r.passed=r.ending==='亡国'&&r.turns<=540;result.rest.push(r);
  for(const governance of [0,58,100])for(const treasury of [0,480,3000])for(const provincialMorale of [19,62,100]) result.lowMorale.push(lowMoraleScenario(seed,treasury,governance,provincialMorale));
 }
 result.passed=result.random.every(r=>Object.values(r.checks).every(Boolean))&&result.rest.every(r=>r.passed)&&result.lowMorale.every(r=>r.passed);
 await writeFile('qa/stage8-1-balance.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({passed:result.passed,random:result.random.map(r=>({seed:r.seed,checks:r.checks})),rest:result.rest.map(r=>({seed:r.seed,turns:r.turns,years:r.actualYears,ending:r.ending,passed:r.passed})),lowMoralePassed:result.lowMorale.filter(r=>r.passed).length,lowMoraleTotal:result.lowMorale.length}));
 process.exitCode=result.passed?0:1;
}
