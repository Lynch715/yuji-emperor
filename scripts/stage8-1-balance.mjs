import {writeFile} from 'node:fs/promises';
import {simulate,SIMULATION_STRATEGIES} from './simulate.mjs';
import {BALANCE_SEEDS} from './stage8-balance.mjs';
import {lowMoraleScenario} from './economy-scenarios.mjs';
import {createState} from '../src/core/state.js';
import {initialTurn} from '../src/core/turn.js';
import {diplomacy,advanceCampaigns} from '../src/core/foreign.js';
export function economicChecks(r) {
 return {
  invasions:r.invasionCount>=120&&r.invasionCount<=200,
  complete:r.turns===7200&&r.annual.length===200,
  treasuryPeak:r.maxTreasury<=3000,
  latePeak:r.maxTreasuryLast50<=r.maxTreasuryFirst50*1.5,
  children:r.strategy==='greedy'||r.meanChildren>=4&&r.meanChildren<=9,
  events:r.eventsPerDecade.length===20&&r.eventsPerDecade.every(n=>n>=30&&n<=80),
  annualCash:r.annual.every(a=>Math.abs(a.closingTreasury-(a.openingTreasury+a.income-a.expense+a.resetAdjustment))<0.03),
 };
}
export function equalPowerWarCheck(){
 let wins=0;
 for(let i=0;i<400;i++){
  let s=initialTurn(createState({seed:'同等战役'+i}));s.foreign[0].power=42;s.foreign[0].frontier='北';s.court.officials.forEach(o=>o.abilities.军=50);
  s=diplomacy(s,{country:'w0',operation:'宣战'},20).state;
  while(!s.campaigns[0].done)s=advanceCampaigns(s);
  wins+=s.campaigns[0].result==='胜利';
 }
 return {samples:400,wins,rate:wins/400,passed:wins/400>=0.4&&wins/400<=0.6};
}
export function strategyChecks(r,diligent=null){
 if(r.strategy==='rest')return {complete:r.turns===7200,collapseWithin15Years:Number.isSafeInteger(r.firstCollapseTurn)&&r.firstCollapseTurn>0&&r.firstCollapseTurn<=540};
 return {
  mortalityComparison:r.strategy==='random'?!!diligent&&r.collapseRate>=diligent.collapseRate:true,
  saturation:r.strategy==='greedy'?r.saturationRatio<0.15:true,
  variation:['random','diligent'].includes(r.strategy)?Object.values(r.nationalStddev).length===4&&Object.values(r.nationalStddev).every(n=>n>=5):true,
  strongman:['random','diligent'].includes(r.strategy)?r.strongmanTurns>0&&r.strongmanTurns<r.turns:true,
 };
}
if(process.argv[1]===import.meta.filename){
 const result={version:'0.9.1',strategies:{},lowMorale:[]};
 for(const strategy of Object.keys(SIMULATION_STRATEGIES)){
 result.strategies[strategy]=[];
 for(const seed of BALANCE_SEEDS){
  const r=simulate(200,seed,{strategy});
  result.strategies[strategy].push(r);
  const {annual,completedReignsDetail,eventsPerDecade,...compact}=r;
  console.log(JSON.stringify({...compact,eventRange:[Math.min(...eventsPerDecade),Math.max(...eventsPerDecade)]}));
  await writeFile('qa/stage8-1-balance.json',JSON.stringify(result,null,2));
 }
 }
 for(const [strategy,reports]of Object.entries(result.strategies))for(const r of reports){
  const diligent=result.strategies.diligent.find(d=>d.seed===r.seed);
  r.checks={...(strategy==='rest'?{}:{...economicChecks(r),grainBounded:r.maxGrain<=r.maxGrainCapacity+r.maxAnnualGrainProduction/0.1+650&&r.maxGrainLast50<=r.maxGrainFirst50*1.5}),...strategyChecks(r,diligent)};
 }
 for(const seed of BALANCE_SEEDS){
  for(const governance of [0,58,100])for(const treasury of [0,480,3000])for(const provincialMorale of [19,62,100]) result.lowMorale.push(lowMoraleScenario(seed,treasury,governance,provincialMorale));
 }
 result.equalPowerWar=equalPowerWarCheck();
 result.passed=Object.values(result.strategies).flat().every(r=>Object.values(r.checks).every(Boolean))&&result.lowMorale.every(r=>r.passed)&&result.equalPowerWar.passed;
 await writeFile('qa/stage8-1-balance.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({passed:result.passed,strategies:Object.fromEntries(Object.entries(result.strategies).map(([k,rs])=>[k,rs.map(r=>({seed:r.seed,collapseRate:r.collapseRate,checks:r.checks}))])),lowMoralePassed:result.lowMorale.filter(r=>r.passed).length,lowMoraleTotal:result.lowMorale.length}));
 process.exitCode=result.passed?0:1;
}
