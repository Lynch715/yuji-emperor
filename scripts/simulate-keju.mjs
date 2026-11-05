import {simulate} from './simulate.mjs';
import {activeExam,examiners,appointExaminer,setExamTopics,fallbackTopics,chooseExamTopic,receiveExamPapers,cacheExamEssay,publishExam,setExamBlind} from '../src/core/keju.js';
import {mockExamPapers,validateExamPapers,mockExamEssay} from '../src/llm/keju.js';
import {assertState,migrate} from '../src/core/state.js';
const stats={cohorts:0,papers:0,cachedEssays:0,roundtrips:0};
const result=simulate(Number(process.argv[2])||200,'科举·两百年',{
 prepareState(s,i){
  if(s.regency||s.ending)return s;
  let e=activeExam(s);if(!e)return s;
  if(['awaiting_examiner','topic'].includes(e.status)){
   const examiner=examiners(s).find(o=>o.post);if(!examiner)return s;
   s=appointExaminer(s,e.id,examiner.id);
   s=setExamBlind(s,e.id,stats.cohorts%2===0);
   const topics=fallbackTopics(s);s=setExamTopics(s,e.id,topics);s=chooseExamTopic(s,e.id,topics[0]);
  }
  e=activeExam(s);
  if(e.status==='writing'){s=receiveExamPapers(s,e.id,validateExamPapers({candidates:mockExamPapers(e)},e));stats.papers+=e.candidates.length;}
  e=activeExam(s);
  if(e.status==='grading'){
   const c=e.candidates[0];s=cacheExamEssay(s,e.id,c.id,mockExamEssay(e,c));stats.cachedEssays++;
   s=publishExam(s,e.id);stats.cohorts++;
   const restored=migrate(JSON.parse(JSON.stringify(s)));
   if(JSON.stringify(restored.keju)!==JSON.stringify(s.keju))throw new Error('科举往返存档不一致');
   stats.roundtrips++;
  }
  assertState(s);return s;
 }
});
console.log(JSON.stringify({years:result.years,turns:result.turns,actualYears:result.actualYears,...stats,deathCount:result.deathCount,collapseCount:result.collapseCount},null,2));
