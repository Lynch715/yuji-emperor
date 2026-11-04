import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate} from '../src/core/state.js';
import {SCENARIOS,applyScenario} from '../src/core/scenarios.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {nationMonth,nationQuarter} from '../src/core/nation.js';
import {applyEffects} from '../src/core/effects.js';
import {FREEDOM_RULES} from '../src/core/freedom.js';
import {createOpening} from '../src/ui/new-game.js';
import {DIFFICULTIES,scenarioRecommendations} from '../src/ui/opening-options.js';
import {nationData,nationSeries,nationFlow} from '../src/ui/nation-data.js';
import {nationOverviewHTML,nationSparkline} from '../src/ui/nation-overview.js';
import {turnMessages,talkMessages,biographyMessages,STYLES} from '../src/llm/prompts.js';
import {intentMessages} from '../src/llm/intents.js';
import {rewriteMessages} from '../src/llm/rewrite.js';
import {talkAttempt} from '../src/core/court.js';
import {callJSON} from '../src/llm/client.js';
const fresh=()=>initialTurn(createState({seed:'国势全览',freedom:'free'}));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('七位预设皇帝各有两宏愿两心事，崇祯使用专属中兴、辽东、周后与毕自严目标',async()=>{
 for(const sc of SCENARIOS){
  const goals=scenarioRecommendations(sc.id);assert.equal(goals.length,4);assert.equal(new Set(goals.map(g=>g.id)).size,4);
  assert.deepEqual(goals.map(g=>g.kind),['宏愿','宏愿','心事','心事']);assert.ok(goals.every(g=>g.reason));
  const s=await createOpening({scenario:sc.id,demo:true,seed:'推荐-'+sc.id},[],{}, {fetcher:()=>assert.fail('预设试读不得请求接口')});
  assert.deepEqual(s.ambitions.map(g=>g.id),goals.map(g=>g.id));assert.doesNotThrow(()=>migrate(s));
 }
 assert.deepEqual(scenarioRecommendations('ming-chongzhen').map(g=>g.id),
  ['restoration','liaodong','empress-zhou','bi-ziyan'].map(id=>'ming-chongzhen-'+id));
});
test('推荐不会覆盖玩家自选或明确随机，也不会更改已有存档的目标',async()=>{
 const options={scenario:'ming-chongzhen',demo:true,seed:'玩家自选'},selected=['sea','river','poetry','journey'];
 const s=await createOpening(options,selected,{});assert.deepEqual(s.ambitions.map(g=>g.id),selected);
 const random=['','','',''];const a=await createOpening(options,random,{}),b=await createOpening(options,random,{});assert.deepEqual(a,b);
 const old=structuredClone(s);assert.deepEqual(migrate(s).ambitions,s.ambitions);assert.deepEqual(s,old);
});
test('实际JSON请求只含当前皇帝、已选目标和文风，不携带其他皇帝与推荐清单',async()=>{
 for(const sc of SCENARIOS){
  const s=await createOpening({scenario:sc.id,demo:true,seed:'请求隔离-'+sc.id,prose:'modern'},['clean','wealth','friend','heir'],{});
  const f=forecastTurn(s),talk=talkAttempt(s,s.court.officials[0].id,'近来如何？');
  const requests=[turnMessages(s,f),talkMessages(talk.state,talk.result),intentMessages(s,[{id:'朝',text:'查清钱粮'}]),
   rewriteMessages(f,[]),biographyMessages(s,{stats:{},score:50})];
  for(const messages of requests)await callJSON({key:'fixture',base:'https://prompt.test',model:'m'},messages,{fetcher:async(url,init)=>{
   const body=JSON.parse(init.body),wire=JSON.stringify(body.messages);
   for(const other of SCENARIOS.filter(o=>o.id!==sc.id)){assert.ok(!wire.includes(other.blurb),other.id);assert.ok(!wire.includes(other.emperor[0]),other.emperor[0]);}
   for(const [id,style]of Object.entries(STYLES))if(id!=='modern')assert.ok(!wire.includes(style.sample));
   assert.ok(!wire.includes('推荐宏愿与心事'));assert.ok(!wire.includes('按这个开局推荐'));
   return new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]}),{headers:{'Content-Type':'application/json'}});
  }});
  const dynamic=JSON.parse(turnMessages(s,f)[1].content.split('【本旬状态】')[1].split('\n【玩家排程】')[0]);
  assert.deepEqual(dynamic.宏愿.map(g=>g.id),s.ambitions.filter(g=>g.status!=='达成').map(g=>g.id));
 }
});
test('正文、面谈与本纪只发送各自任务格式，保留当前开局事实约束',()=>{
 const s=initialTurn(applyScenario(createState({seed:'任务分流'}),'ming-chongzhen')),f=forecastTurn(s),r=talkAttempt(s,'o0','问安');
 const a=turnMessages(s,f)[0].content,b=talkMessages(r.state,r.result)[0].content,c=biographyMessages(s,{stats:{}})[0].content;
 assert.ok(a.includes('【正文任务】')&&!a.includes('【面谈任务】'));
 assert.ok(b.includes('【面谈任务】')&&!b.includes('【正文任务】'));
 assert.ok(!c.includes('【正文任务】')&&!c.includes('【面谈任务】'));
 for(const text of [a,b,c])assert.match(text,/不得按史书预言或补写结局/);
});
test('通俗档位沿用原自由度与难度ID，概率保持不变，上朝改为不限本数',()=>{
 assert.deepEqual(Object.keys(FREEDOM_RULES),['free','mid','real']);assert.equal(FREEDOM_RULES.free.k,1);assert.equal(FREEDOM_RULES.mid.k,0.5);assert.equal(FREEDOM_RULES.real.k,0);
 assert.deepEqual(Object.values(FREEDOM_RULES).map(r=>r.label),['想做就成','多数能成','成败看实力']);
 assert.deepEqual(Object.keys(DIFFICULTIES),['easy','normal','hard']);assert.equal(FREEDOM_RULES.real.courtLimit,Infinity);
});
test('国势测算复用月结季结，币种与债务口径正确且不改变状态或随机数',()=>{
 const s=fresh();s.nation.arrears=70;s.nation.privyArrears=2;s.nation.grainArrears=10;s.nation.provinces[0].disaster=35;
 const before=structuredClone(s),d=nationData(s),m=nationMonth(s),q=nationQuarter(s);
 for(const k of ['treasury','privy','grain'])near(d.monthNet[k],m.nation[k]-s.nation[k]);
 near(d.quarterIncome,q.stats.income-s.stats.income);near(d.quarterNet,q.nation.treasury-s.nation.treasury);
 near(d.population,s.nation.provinces.reduce((n,p)=>n+p.pop,0));assert.equal(d.provinces.length,12);assert.equal(d.armies.length,5);assert.equal(d.factions.length,6);
 nationOverviewHTML(s);assert.deepEqual(s,before);
});
test('走势从实际账目恢复，跨分卷不丢失；不把当前面谈变化重复算进已完旬',()=>{
 let s=fresh();const known=[];
 for(let i=0;i<24;i++){s=commitTurn(s,forecastTurn(s),{});known.push({turn:s.turn,value:s.nation.treasury});}
 s.volumes=[{from:1,to:12,chapters:s.history.slice(0,12),summary:''}];s.history=s.history.slice(12);
 const before=structuredClone(s);const series=nationSeries(s,'nation.treasury',36);
 assert.equal(series.length,24);series.forEach((p,i)=>{assert.equal(p.turn,known[i].turn);near(p.value,known[i].value);});
 const e=applyEffects(s,{treasury:12},'面谈已办'),next=e.state;next.interimEntries=e.entries;
 near(nationSeries(next,'nation.treasury',3).at(-1).value,s.nation.treasury);
 near(nationFlow(next,3).totals.treasury.net,nationFlow(s,3).totals.treasury.net+12);assert.deepEqual(s,before);
 const gap=structuredClone(s);gap.history.splice(-2,1);assert.equal(nationSeries(gap,'nation.treasury',36).length,1);
});
test('流水区分入出与库间调拨，缺钱缺粮的面板没有NaN或虚构曲线，名称安全转义',()=>{
 const s=fresh();s.nation.treasury=0;s.nation.grain=0;s.nation.provinces.forEach(p=>p.tax=0);s.nation.provinces[0].name='<img src=x>';
 s.interimEntries=[{path:'nation.treasury',before:10,after:5,source:'转内帑'},{path:'nation.privy',before:3,after:8,source:'转内帑'}];
 const flow=nationFlow(s);near(flow.totals.treasury.expense,5);near(flow.totals.privy.income,5);assert.equal(flow.rows.length,1);
 const html=nationOverviewHTML(s);assert.doesNotMatch(html,/NaN|Infinity|<img src=x>/);assert.match(html,/&lt;img/);assert.match(html,/尚无钱粮变化|现银不足/);
 assert.doesNotMatch(nationSparkline([],'国库'),/<svg/);assert.doesNotMatch(nationSparkline([{turn:1,value:0},{turn:2,value:0}],'国库'),/NaN|Infinity/);
 s.interimEntries=[{path:'nation.treasury',before:1,after:1-1e-8,source:'极小变化'}];assert.doesNotMatch(nationOverviewHTML(s),/−0<\/span>/);
});
