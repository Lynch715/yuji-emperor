import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate} from '../src/core/state.js';
import {initialTurn,validateSchedule,forecastTurn} from '../src/core/turn.js';
import {FREEDOM_RULES,adjudicate,successProbability,selectionYear} from '../src/core/freedom.js';
import {check} from '../src/core/rng.js';
import {talkAttempt,appoint} from '../src/core/court.js';
import {resolveMemorial} from '../src/core/events.js';
import {edictBlock} from '../src/core/edicts.js';
import {rankAvailable,generateCandidates,selectConsort,canVisit} from '../src/core/harem.js';
import {diplomacyBlock,checkCollapse} from '../src/core/foreign.js';
import {settleEnergy,energyLimit} from '../src/core/emperor.js';
import {createMemorialSession} from '../src/ui/memorials.js';
import {selectionDescription} from '../src/ui/view-model.js';
import {localIntents} from '../src/llm/intents.js';
import {resolveTalkIntents,resolveIntents} from '../src/core/intents.js';
import {validateTalk,validateTurn} from '../src/llm/validate.js';
const fresh=mode=>initialTurn(createState({freedom:mode,seed:'模式回归'}));
for(const mode of ['free','mid','real'])test('第二步 门槛矩阵 '+mode,()=>{
 let s=fresh(mode),rules=FREEDOM_RULES[mode];
 s.memorials=Array.from({length:15},(_,i)=>({...s.memorials[0],id:'test-'+i}));
 const limit=Number.isFinite(rules.courtLimit)?rules.courtLimit:15;
 assert.doesNotThrow(()=>validateSchedule(s,{朝:{kind:'上朝',memorials:s.memorials.slice(0,limit).map(m=>m.id)}}));
 if(Number.isFinite(rules.courtLimit))assert.throws(()=>validateSchedule(s,{朝:{kind:'上朝',memorials:s.memorials.slice(0,limit+1).map(m=>m.id)}}));
 assert.equal(createMemorialSession(s,'上朝').ids.length,limit);
 const id=s.memorials[0].id;for(let i=0;i<(Number.isFinite(rules.referrals)?rules.referrals:12);i++)s=resolveMemorial(s,id,'discuss').state;
 if(Number.isFinite(rules.referrals))assert.throws(()=>resolveMemorial(s,id,'discuss'));
 s=fresh(mode);for(let i=0;i<(Number.isFinite(rules.talkRounds)?rules.talkRounds:8);i++)s=talkAttempt(s,'o0','说说近况').state;
 if(Number.isFinite(rules.talkRounds))assert.throws(()=>talkAttempt(s,'o0','说说近况'));
 s=fresh(mode);const o=s.court.officials.find(o=>o.id===s.court.posts[1].holder);assert.equal(talkAttempt(s,o.id,'近况',true).result.cap,{free:480,mid:28,real:14}[mode]);
 s.edictCooldowns.修河=s.turn+rules.edictCooldown;assert.equal(!!edictBlock(s,'修河'),false);
 s=fresh(mode);s.turn=3*36;assert.equal(selectionYear(s),mode!=='mid');assert.equal(rankAvailable(s,'皇后'),mode==='free');
 assert.ok(selectionDescription(s).includes(mode==='free'?'可随时选秀':'每'+rules.selectionPeriod+'年大选一次'));
 const f=s.foreign[0];f.status='通好';f.trade={start:s.turn,until:s.turn+36,income:1};assert.equal(!!diplomacyBlock(s,{country:f.id,operation:'互市'}),false);
 const before=fresh(mode),cost=energyLimit(before)+2,after=settleEnergy(before,cost);assert.equal(before.emperor.health-after.emperor.health,mode==='free'?2:4);
});
test('第二步 一般档100次：完整成功接近60%，办成接近80%，部分成功保存真实代价',()=>{
 let s=fresh('mid'),full=0,partial=0,paid=false;
 for(let i=0;i<100;i++){s=initialTurn(createState({freedom:'mid',seed:'一般档独立概率验收-'+i}));const result=adjudicate(s,check(31,i%20+1,'一般'),'o0');if(result.verdict.partial){partial++;assert.ok(result.verdict.cost);paid ||= result.state.nation.treasury<s.nation.treasury||result.state.court.officials[0].favor<s.court.officials[0].favor||result.state.nation.morale<s.nation.morale;}else if(result.verdict.success)full++;}
 console.log('一般档100次独立种子',JSON.stringify({base:0.2,full,partial,failed:100-full-partial}));
 assert.ok(Math.abs(successProbability(0.2,s)-0.6)<1e-12);assert.ok(Math.abs(full/100-0.6)<0.13);assert.ok(Math.abs((full+partial)/100-0.8)<0.13);assert.ok(partial>0);assert.ok(paid);
});
test('第二步 严格判定不新增掷骰，自由失败也成功；B1/B8/B10不放宽',()=>{
 const s=fresh('real'),v=check(1,1,'极难'),r=adjudicate(s,v);assert.equal(r.state,s);assert.deepEqual(r.verdict,v);
 assert.equal(adjudicate(fresh('free'),v).verdict.success,true);
 for(const mode of ['free','mid','real']){const s=fresh(mode);assert.throws(()=>validateSchedule(s,{夜:{kind:'上朝',memorials:[]}}));s.regency={regentId:'o0',until:100};assert.throws(()=>validateSchedule(s,{朝:{kind:'下旨',edictType:'修河'}}));s.regency=null;const c=s.harem.consorts[0];for(const age of [17,50]){c.age=age;assert.equal(canVisit(s,c),false);}c.age=25;c.preg={};assert.equal(canVisit(s,c),false);}
});
test('第二步 任命年龄才能门槛逐档生效',()=>{
 for(const mode of ['free','mid','real']){const s=fresh(mode);s.court.officials.forEach(o=>o.ambition=0);const o=s.court.officials[0],rules=FREEDOM_RULES[mode];o.age=rules.appointmentAge;o.abilities.政=rules.firstRankTalent;assert.doesNotThrow(()=>appoint(s,{person:o.id,post:'p1'}));o.age--;assert.throws(()=>appoint(s,{person:o.id,post:'p1'}));o.age++;if(rules.firstRankTalent){o.abilities.政--;assert.throws(()=>appoint(s,{person:o.id,post:'p1'}));}}
});
test('第二步 自由选秀补新池、位分不限，不重复候选ID；一般两年一次',()=>{
 let s=fresh('free');s.turn=36;s.harem.candidates=[];s=generateCandidates(s);const count=s.harem.candidates.length+2;
 for(let i=0;i<count;i++)s=selectConsort(s,s.harem.candidates[0].id,'皇后');
 assert.equal(new Set(s.harem.consorts.map(c=>c.id)).size,s.harem.consorts.length);
 const mid=fresh('mid');mid.turn=36;assert.equal(selectionYear(mid),false);mid.turn=72;assert.equal(selectionYear(mid),true);
});
test('第二步 面谈分配遵守各档额度，不重复执行旧拨款',()=>{
 for(const mode of ['free','mid','real']){let s=fresh(mode);const line='拨银一千万两给内帑',input={id:'talk-0',slot:'午',text:line},actions=localIntents(s,[input]),a=talkAttempt(s,'o1',line,true);if(mode!=='free')a.state.emperor.talents.权谋=100;
 const resolved=resolveTalkIntents(a.state,a.result,actions),r=resolved.state.intentResults[0];assert.ok(r.actual.amount<=a.result.cap);assert.ok(resolved.state.nation.privy<=90+a.result.cap);}
});
test('第二步 失败结构化面谈仍保留A12，缺档位旧档默认一般',()=>{
 const s=fresh('real');const r=validateTalk({reply:'臣遵旨，马上办妥。'},{success:false,reply:'臣尚不能应允。',intentResults:[{type:'kill',status:'failed'}],die:1},s);assert.equal(r.reply,'臣尚不能应允。');
 s.v=10;delete s.settings.freedom;delete s.intentResults;assert.equal(migrate(s).settings.freedom,'mid');
 for(const mode of ['mid','real','free']){let x=fresh(mode);x.nation.morale=0;x.nation.treasury=0;for(let i=0;i<18;i++){x.turn=i;x=checkCollapse(x);}assert.equal(x.ending?.type==='亡国',mode!=='free');}
});

test('第二步 同一困难口谕100次实际裁决，部分成功有代价且仍执行死亡',()=>{
 let full=0,partial=0;
 for(let i=0;i<100;i++){const s=initialTurn(createState({freedom:'mid',seed:'同一口谕验收-'+i}));s.emperor.talents.权谋=31;const o=s.court.officials[0];o.abilities.权谋=0;
 const a=localIntents(s,[{id:'朝',slot:'朝',text:'将'+o.name+'赐死'}]),r=resolveIntents(s,a),item=r.results[0];
 if(item.status==='partial'){partial++;assert.ok(item.cost);assert.equal(r.state.court.officials[0].alive,false);}else if(item.status==='success')full++;
 }
 console.log('同一困难口谕100次',JSON.stringify({full,partial,failed:100-full-partial}));
 assert.ok(Math.abs(full/100-0.6)<0.13);assert.ok(Math.abs((full+partial)/100-0.8)<0.13);
});

test('第二步 朱批自由输入同样裁决；真实征兵增量能通过对象数量检查',()=>{
 const s=fresh('free'),m=s.memorials[0],victim=s.court.officials[0],line='将'+victim.name+'赐死',actions=localIntents(s,[{id:'朝:remark:'+m.id,slot:'朝',text:line}]);
 const f=forecastTurn(s,{朝:{kind:'批折',memorials:[m.id],decisions:{[m.id]:{option:'hold',remark:line}}}},actions);assert.equal(f.state.court.officials[0].alive,false);
 const next=fresh('free'),a=localIntents(next,[{id:'朝',slot:'朝',text:'征兵三千人'}]),g=forecastTurn(next,{朝:{kind:'下旨',edictType:'征兵',text:'征兵三千人'}},a);
 assert.ok(g.state.nation.army.capital.troops>next.nation.army.capital.troops);const chapter='京营征兵三千人。';assert.equal(validateTurn({chapter:{朝:chapter,午:'',夜:''}},g).chapter.朝,chapter);
 const fractional=resolveIntents(next,[{...a[0],amount:3000.7}]);assert.equal(fractional.results[0].actual.amount,3000);assert.equal(fractional.results[0].clamped,true);
 const capped=resolveIntents(next,a,{transferCap:10});assert.ok(capped.results[0].actual.treasurySpent<=10);assert.equal(capped.state.nation.army.capital.troops-next.nation.army.capital.troops,capped.results[0].actual.amount);
 const same=resolveIntents(next,[{...a[0],resource:'treasury',source:'treasury',destination:'treasury'}]);assert.equal(same.results[0].actual.amount,0);assert.equal(same.state.nation.treasury,next.nation.treasury);
});
test('第二步 随心所欲八类动作都有真实结果；未知动作不制造孕产事实',()=>{
 const run=(s,raw)=>{const input={id:'朝',slot:'朝',text:'御旨'},a={...raw,inputId:input.id,id:'朝:0',slot:'朝'};return resolveIntents(s,[a]);};
 for(const type of ['appoint','dismiss','promote','imprison']){const s=fresh('free');s.emperor.prestige=100;const r=run(s,{type,targetId:'o0',postId:type==='appoint'||type==='promote'?'p29':undefined});assert.equal(r.results[0].status,'success',type);assert.ok(r.facts.some(f=>f.kind==='appointment'));}
 let s=fresh('free'),r=run(s,{type:'favor',targetId:'o0',amount:5,requestedAmount:5});assert.equal(r.state.court.officials[0].favor,55);
 s=fresh('free');r=run(s,{type:'war',countryId:s.foreign[0].id,operation:'宣战'});assert.equal(r.state.foreign[0].status,'交战');
 s=fresh('free');s.nation.treasury=0;r=run(s,{type:'decree',edictType:'修河'});assert.equal(r.results[0].status,'success');assert.ok(r.state.projects.some(p=>p.edictType==='修河'));
});

test('第二步 部分成功只影响相关大臣，无可下降民心时仍付出真实代价',()=>{
 let partial=0;
 for(let i=0;i<100;i++){
  const s=initialTurn(createState({freedom:'mid',seed:'无关人物不得受罚-'+i}));s.nation.morale=0;s.nation.provinces.forEach(p=>p.morale=0);s.nation.treasury=0;
  const r=adjudicate(s,{success:false});if(!r.verdict.partial)continue;partial++;
  assert.deepEqual(r.state.court.officials,s.court.officials);assert.ok(r.state.nation.arrears>s.nation.arrears);assert.equal(r.verdict.cost,'额外支出1万两');
 }
 assert.ok(partial>0);
});
