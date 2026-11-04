import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,migrate,assertState,VERSION,reignId} from '../src/core/state.js';
import {applyScenario,SCENARIOS} from '../src/core/scenarios.js';
import {selectAmbitions,evaluateAmbitions,goalsForScenario} from '../src/core/ambitions.js';
import {scenarioGoals,scenarioRuleValue} from '../src/core/scenario-goals.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {diplomacy,advanceCampaigns} from '../src/core/foreign.js';
import {resolveMemorial} from '../src/core/events.js';
import {succeedEmperor} from '../src/core/succession.js';
import {grainBudget} from '../src/core/finance.js';
import {turnMessages} from '../src/llm/prompts.js';
import {ambitionsHTML,goalConditionsHTML} from '../src/ui/render.js';

const opening=id=>initialTurn(selectAmbitions(applyScenario(createState({seed:'专属目标-'+id,freedom:'free'}),id),scenarioGoals(id).map(g=>g.id)));
const find=(s,suffix)=>s.ambitions.find(a=>a.id.endsWith('-'+suffix));
const seat=(s,o,id)=>{
 o.alive=true;o.health=90;o.retired=false;o.jailed=false;
 for(const p of s.court.posts)if(p.holder===o.id)p.holder=null;
 const p=s.court.posts.find(p=>p.id===(id||o.post||'p0'));
 const old=s.court.officials.find(x=>x.id===p.holder);if(old)old.post=null;
 p.holder=o.id;o.post=p.id;
};
// Build reachable states from each preset's real IDs, retaining every condition.
function readyGoal(s,a){
 s.turn=Math.max(s.turn,180);s.emperor.age=Math.max(s.emperor.age,20);s.regency=null;
 for(const o of a.objectives){
  const q=o.rule;
  if(q){
   const official=s.court.officials.find(x=>x.id===q.id),child=s.harem.children.find(x=>x.id===q.id);
   if(['official','serving','officialTalks'].includes(q.type))seat(s,official,q.posts?.[0]);
   if(q.type==='official')official[q.field]=o.target;
   if(q.type==='inactiveOfficial'){
    const p=s.court.posts.find(p=>p.holder===official.id);if(p)p.holder=null;official.post=null;
   }
   if(q.type==='officialTalks')for(let i=0;i<o.target;i++)s.talks.push({id:'talk-'+q.id+'-'+i,person:q.id,turn:s.turn,reply:'臣愿直言此事。'});
   if(q.type==='province')s.nation.provinces.find(x=>x.id===q.id)[q.field]=o.target;
   if(q.type==='border')s.nation.army.frontiers.find(x=>x.dir===q.dir)[q.field]=o.target;
   if(q.type==='capital')s.nation.army.capital[q.field]=o.target;
   if(q.type==='borderWars')s.campaigns=s.campaigns.filter(w=>w.done||w.dir!==q.dir);
   if(q.type==='consort')s.harem.consorts.find(x=>x.id===q.id)[q.field]=o.target;
   if(q.type==='companion'){const c=s.harem.consorts.find(x=>x.id===q.id);c.health=90;c.cold=false;c.retired=false;}
   if(q.type==='child')child[q.field]=o.target;
   if(q.type==='isHeir'){child.health=90;s.harem.heir=q.id;}
   if(q.type==='childTutored'){const tutor=s.court.officials.find(x=>x.post&&x.alive);seat(s,tutor);child.tutor=tutor.id;}
   if(q.type==='settledCountry')s.foreign.find(x=>x.id===q.id).status='通好';
   if(q.type==='countryWins')for(let i=0;i<o.target;i++)s.campaigns.push({id:'victory-'+i,country:q.id,done:true,result:'胜利',dir:'北'});
  }else if(o.key.startsWith('project:')){
   for(let i=0;i<o.target;i++)s.projects.push({id:'project-'+o.id+i,done:true,start:s.turn,edictType:o.key.slice(8)});
  }else if(o.key.startsWith('talent:'))s.emperor.talents[o.key.slice(7)]=o.target;
  else if(o.key==='rebellions')s.nation.provinces.forEach(p=>p.rebellion=false);
  else if(o.key==='minMorale')s.nation.provinces.forEach(p=>p.morale=o.target);
  else if(o.key==='maxDisaster')s.nation.provinces.forEach(p=>p.disaster=o.target);
  else if(o.key==='grainMonths')s.nation.grain=grainBudget(s).monthly*o.target;
  else if(['livingHeir','heirTutored','heirEducation'].includes(o.key)){
   let c=s.harem.children.find(c=>c.id===s.harem.heir);
   if(!c){c={id:'test-heir',name:'刘承',health:90,education:40,fatherId:reignId(s)};s.harem.children.push(c);s.harem.heir=c.id;}
   if(o.key==='heirEducation')c.education=o.target;
   if(o.key==='heirTutored')c.tutor=s.court.officials.find(x=>x.alive&&x.post&&!x.jailed&&!x.retired).id;
  }else if(['virtue','prestige','health'].includes(o.key))s.emperor[o.key]=o.target;
  else if(['governance','morale','treasury','arrears'].includes(o.key))s.nation[o.key]=o.target;
 }
 if(a.holdTurns){a.checkedTurn=s.turn;a.stableTurns=0;}
 return s;
}
function prevent(s,o){
 const q=o.rule;
 if(q){
  if(['official','serving','inactiveOfficial','officialTalks'].includes(q.type)){
   const p=s.court.officials.find(x=>x.id===q.id);
   if(q.type==='inactiveOfficial')seat(s,p);else p.jailed=true;
  }else if(q.type==='province')s.nation.provinces.find(x=>x.id===q.id)[q.field]=o.op==='lte'?o.target+1:o.target-1;
  else if(q.type==='border')s.nation.army.frontiers.find(x=>x.dir===q.dir)[q.field]=o.op==='lte'?o.target+1:o.target-1;
  else if(q.type==='borderWars')s.campaigns.push({id:'unfinished',country:s.foreign[0].id,dir:q.dir,done:false});
  else if(q.type==='capital')s.nation.army.capital[q.field]=o.target-1;
  else if(['consort','companion'].includes(q.type))s.harem.consorts.find(x=>x.id===q.id).health=0;
  else if(['child','isHeir','childTutored'].includes(q.type))s.harem.children.find(x=>x.id===q.id).health=0;
  else if(q.type==='countryWins')s.campaigns=[];
  else if(q.type==='settledCountry')s.foreign.find(x=>x.id===q.id).status='交战';
 }else if(o.key.startsWith('project:'))s.projects=[];
 else if(o.key.startsWith('talent:'))s.emperor.talents[o.key.slice(7)]=o.target-1;
 else if(o.key==='rebellions')s.nation.provinces[0].rebellion=true;
 else if(o.key==='minMorale')s.nation.provinces[0].morale=o.target-1;
 else if(o.key==='maxDisaster')s.nation.provinces[0].disaster=o.target+1;
 else if(o.key==='grainMonths')s.nation.grain=0;
 else if(o.key==='personalRule')s.regency={regentId:'dowager',until:s.turn+36};
 else if(['livingHeir','heirTutored','heirEducation'].includes(o.key))s.harem.heir=null;
 else if(o.key==='reignYears')s.turn=s.reign.accessionTurn;
 else if(['virtue','prestige','health'].includes(o.key))s.emperor[o.key]=o.target-1;
 else s.nation[o.key]=o.op==='lte'?o.target+1:o.target-1;
}
function finish(s){
 s=structuredClone(s);
 const turns=s.ambitions[0].holdTurns||1;
 for(let i=0;i<turns;i++){s.turn++;s=evaluateAmbitions(s);}
 return s;
}

for(const sc of SCENARIOS)test(sc.id+'：四个专属目标均可达成，每一项条件都不可省略',()=>{
 const s=opening(sc.id);assert.doesNotThrow(()=>assertState(s));
 assert.ok(s.ambitions.every(a=>a.status==='进行中'&&a.scenarioId===sc.id&&a.ownerReignId===s.runId));
 for(const goal of s.ambitions){
  const ready=structuredClone(s);ready.ambitions=[structuredClone(goal)];readyGoal(ready,ready.ambitions[0]);
  for(const o of goal.objectives){
   const blocked=structuredClone(ready);prevent(blocked,o);
   assert.equal(finish(blocked).ambitions[0].status,'进行中',goal.title+' / '+o.label);
  }
  const before=structuredClone(ready),done=finish(ready);
  assert.equal(done.ambitions[0].status,'达成',goal.title);assert.equal(done.ambitions[0].progress,100);
  assert.doesNotThrow(()=>assertState(done));assert.deepEqual(ready,before);
  assert.deepEqual(evaluateAmbitions(done),done,'达成后不重复奖励');
 }
});
test('中兴大明须钱粮、吏治、民心和无民变连续12旬，断一旬重新计数',()=>{
 let s=opening('ming-chongzhen');s.ambitions=[find(s,'restoration')];readyGoal(s,s.ambitions[0]);
 for(let i=0;i<6;i++){s.turn++;s=evaluateAmbitions(s);s=evaluateAmbitions(s);}
 assert.equal(s.ambitions[0].stableTurns,6);assert.equal(s.ambitions[0].status,'进行中');
 s.nation.provinces[0].rebellion=true;s.turn++;s=evaluateAmbitions(s);assert.equal(s.ambitions[0].stableTurns,0);
 s.nation.provinces[0].rebellion=false;
 for(let i=0;i<11;i++){s.turn++;s=evaluateAmbitions(s);}
 assert.equal(s.ambitions[0].status,'进行中');s.turn++;s=evaluateAmbitions(s);assert.equal(s.ambitions[0].status,'达成');
});
test('辽东只认辽东与东境，别处太平、累计胜场和模型宣称均不能替代',()=>{
 let s=opening('ming-chongzhen');s.ambitions=[find(s,'liaodong')];readyGoal(s,s.ambitions[0]);
 s.nation.provinces.find(p=>p.name==='辽东').morale=20;s.nation.army.frontiers.find(b=>b.dir==='西').threat=0;s.stats.warsWon=99;
 const text='朕已稳住辽东，百姓安居乐业，宏愿就此达成。';
 s=finish(s);s=evaluateAmbitions(s,{chapter:{朝:text},ambitionEvidence:[{id:s.ambitions[0].id,objectiveId:'people',evidence:text}]});
 assert.equal(s.ambitions[0].status,'进行中');assert.equal(s.ambitions[0].objectives.find(o=>o.id==='people').current,20);
});
test('人物按ID判定，改名仍为本人；他人好感、离任、下狱不能冒充毕自严掌户部',()=>{
 const s=opening('ming-chongzhen');s.ambitions=[find(s,'bi-ziyan')];readyGoal(s,s.ambitions[0]);
 const q=s.ambitions[0].objectives[0].rule,bi=s.court.officials.find(o=>o.id===q.id);bi.name='毕尚书';
 assert.equal(finish(s).ambitions[0].status,'达成');
 for(const change of [(s,p)=>p.favor=79,(s,p)=>p.jailed=true,(s,p)=>p.retired=true,(s,p)=>p.alive=false,(s,p)=>seat(s,p,'p2')]){
  const copy=structuredClone(s),o=copy.court.officials.find(o=>o.id===q.id);
  change(copy,o);
  copy.court.officials.filter(x=>x.id!==q.id).forEach(x=>x.favor=100);
  assert.equal(finish(copy).ambitions[0].status,'进行中');
 }
});
test('北击匈奴只认该外邦的完整胜仗，实际宣战及战役结算能累计',()=>{
 let s=opening('han-wudi');s.ambitions=[find(s,'xiongnu')];const q=s.ambitions[0].objectives[0].rule;
 s.stats.warsWon=20;s.campaigns=[{id:'别国大捷',country:s.foreign.find(f=>f.id!==q.id).id,done:true,result:'胜利'}];
 assert.equal(scenarioRuleValue(s,q),0);
 for(let i=0;i<2;i++){
  s.turn++;const border=s.nation.army.frontiers.find(b=>b.dir==='北');border.troops=500000;border.readiness=100;border.threat=20;
  s.nation.treasury=1000;s.nation.grain=1000;s=diplomacy(s,{operation:'宣战',country:q.id,confirmBreach:true},20).state;
  for(let j=0;j<6;j++)s=advanceCampaigns(s);
  s=resolveMemorial(s,s.memorials.find(m=>m.campaignOrder?.stage==='treaty').id,'peace').state;
 }
 assert.equal(scenarioRuleValue(s,q),2);assert.equal(evaluateAmbitions(s).ambitions[0].status,'达成');
});
test('面谈必须与指定人物完成，过期、重复ID及未作答不计；弘历储位不由其他皇子替代',()=>{
 let s=opening('qing-yongzheng');const a=find(s,'yinxiang');s.ambitions=[a];readyGoal(s,a);
 const q=a.objectives.find(o=>o.rule?.type==='officialTalks').rule;
 const talk=s.talks[0];s.talks=[{...talk,turn:s.turn-36},{...talk,id:'empty',reply:''},{...talk,person:'wrong'},{...talk},{...talk}];
 assert.equal(scenarioRuleValue(s,q),1);
 s=opening('qing-yongzheng');s.ambitions=[find(s,'hongli')];readyGoal(s,s.ambitions[0]);
 s.harem.heir=s.harem.children.find(c=>c.name==='弘时').id;
 assert.equal(finish(s).ambitions[0].status,'进行中');
});
test('预演、提交、重试和读档只累计一旬，重复提交及跨局过期保护不变',()=>{
 let s=opening('ming-chongzhen');s.ambitions=[find(s,'restoration')];readyGoal(s,s.ambitions[0]);
 s.nation.governance=95;s.nation.morale=95;s.nation.provinces.forEach(p=>{p.morale=95;p.disaster=0;});
 s.nation.treasury=1000;s.nation.grain=1000;const before=structuredClone(s),f=forecastTurn(s);
 assert.equal(f.state.ambitions[0].stableTurns,1);assert.deepEqual(forecastTurn(s),f);assert.deepEqual(s,before);
 s.pending={forecast:f};s=migrate(s);assert.deepEqual(s.pending.forecast,f);
 const n=commitTurn(s,s.pending.forecast,{});assert.equal(n.ambitions[0].stableTurns,1);
 assert.deepEqual(commitTurn(n,f,{}),n);assert.equal(migrate(n).ambitions[0].stableTurns,1);
 const other=opening('ming-chongzhen');assert.throws(()=>commitTurn(other,f,{}),/过期|不符/);
 const gap=structuredClone(n);gap.turn+=3;assert.equal(evaluateAmbitions(gap).ambitions[0].stableTurns,1);
 let played=n;
 for(let i=1;i<12;i++)played=commitTurn(played,forecastTurn(played),{});
 assert.equal(played.ambitions[0].status,'达成');assert.equal(played.ambitions[0].stableTurns,12);
 assert.equal(played.receipts.filter(r=>r==='goal:'+reignId(played)+':'+played.ambitions[0].id).length,1);
});
test('旧v14目标与待续原样升级，损坏的v15专属对象或持续进度拒绝读取',()=>{
 const old=initialTurn(selectAmbitions(applyScenario(createState({seed:'旧目标'}),'ming-chongzhen'),['clean','wealth','friend','heir']));
 old.v=14;const f=forecastTurn(old);f.state.v=14;old.pending={forecast:f};
 const before=JSON.stringify(old),next=migrate(old);assert.equal(next.v,VERSION);assert.equal(JSON.stringify(old),before);
 assert.deepEqual(next.ambitions,old.ambitions);assert.deepEqual(next.pending,old.pending);
 assert.equal(commitTurn(next,next.pending.forecast,{}).lastTurn.die,f.die);
 const good=opening('ming-chongzhen');assert.deepEqual(migrate(good).ambitions,good.ambitions);
 for(const damage of [s=>find(s,'liaodong').objectives[0].rule.dir='假边境',s=>find(s,'liaodong').objectives[3].rule.id='假州',
  s=>delete find(s,'restoration').stableTurns,s=>find(s,'restoration').checkedTurn=s.turn+1,s=>find(s,'restoration').ownerReignId='他朝']){
  const bad=structuredClone(good);damage(bad);assert.throws(()=>migrate(bad),/专属宏愿/);
 }
});
test('专属目标限当前预设首位皇帝，后继之君另立宏愿，先帝史册保留旧目标',()=>{
 const s=opening('ming-chongzhen');
 assert.ok(goalsForScenario('ming-chongzhen').some(g=>g.title==='稳住辽东'));
 assert.ok(!goalsForScenario('han-wudi').some(g=>g.title==='稳住辽东'));assert.equal(goalsForScenario(null).length,16);
 assert.throws(()=>selectAmbitions(s,scenarioGoals('han-wudi').map(g=>g.id)),/不属于/);
 s.ending={type:'禅位',cause:'测试继统'};const n=succeedEmperor(s);
 assert.ok(n.ambitions.every(a=>!a.scenarioId));assert.deepEqual(n.chronicles.at(-1).ambitions,s.ambitions);
 assert.throws(()=>selectAmbitions(n,s.ambitions.map(a=>a.id)),/不属于/);
});
test('前端列出每项真实条件和持续进度，请求只含选定目标且不携带专属目标库',()=>{
 const s=opening('ming-chongzhen'),before=structuredClone(s),a=find(s,'liaodong'),html=ambitionsHTML(s);
 assert.match(html,/辽东民心至少55/);assert.match(html,/东境兵员至少30000人/);assert.match(html,/连续保持 12 旬/);
 assert.match(html,/已保持 0 旬/);assert.match(goalConditionsHTML(a),/达成条件/);
 assert.doesNotMatch(html,/undefined|NaN/);assert.deepEqual(s,before);
 const wire=JSON.stringify(turnMessages(s,forecastTurn(s)));
 for(const sc of SCENARIOS.filter(sc=>sc.id!==s.scenario))for(const goal of scenarioGoals(sc.id))assert.ok(!wire.includes(goal.title));
 assert.doesNotMatch(wire,/SCENARIO_GOALS|CATALOG/);
 const source=readFileSync('src/ui/app.js','utf8');assert.match(source,/goalsForScenario\(id\)/);
});
