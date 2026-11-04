import {simulate} from './simulate.mjs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const baselineRoot=process.argv[2];
const baseline=baselineRoot?(await import(pathToFileURL(resolve(baselineRoot,'scripts/simulate.mjs')).href)).simulate:null;
const seeds=['格物对照','格物·河患','格物·薄赋'],strategies=['rest','diligent','greedy','tech'];
const rows=[];
for(const seed of seeds)for(const strategy of strategies){
 const r=simulate(30,seed,{strategy});
 rows.push({seed,strategy,treasury:r.finalTreasury,annualIncome:r.meanAnnualIncome,annualExpense:r.meanAnnualExpense,collapse:r.collapseCount,events:r.totalEvents,...r.development,annual:r.annual.map(a=>({year:a.year,income:a.income,taxIncome:a.taxIncome,closingTreasury:a.closingTreasury,prosperity:a.prosperity,techDone:a.techDone,industryLevels:a.industryLevels}))});
}
const old=[];
if(baseline)for(const seed of seeds)for(const strategy of strategies.filter(s=>s!=='tech')){
 const r=baseline(30,seed,{strategy});old.push({seed,strategy,treasury:r.finalTreasury,annualIncome:r.meanAnnualIncome,annualExpense:r.meanAnnualExpense,collapse:r.collapseCount,events:r.totalEvents});
}
console.log(JSON.stringify({years:30,seeds,baseline:old,current:rows},null,2));
