import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,assertState,withDraft} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {applyFiatOperations,applyFiatRules,normalizeFiatOperations} from '../src/core/fiat.js';
import {localIntents,intentMessages,validateIntents} from '../src/llm/intents.js';
import {resolveIntents} from '../src/core/intents.js';
import {issueEdict} from '../src/core/edicts.js';
import {diplomacy} from '../src/core/foreign.js';
import {TECHS} from '../src/core/tech-rules.js';
import {buildIndustry} from '../src/core/industries.js';
import {fiatWorldHTML} from '../src/ui/fiat-world.js';
const fresh=(mode='free')=>initialTurn(createState({seed:'言出法随验收',freedom:mode,demo:true}));
const input=text=>[{id:'朝',slot:'朝',text}];
const run=(s,text)=>resolveIntents(s,localIntents(s,input(text)));
test('中文亿万、银粮单位正确；显式数值突破旧100与百万上限且输入不变',()=>{
 const s=fresh(),before=JSON.stringify(s),r=run(s,'国库设为一亿两；内帑增加一百万两；朕政略设为1000');
 assert.equal(r.results[0].status,'success');assert.equal(r.state.nation.treasury,10000);assert.equal(r.state.nation.privy,190);assert.equal(r.state.emperor.talents.政略,1000);assert.equal(JSON.stringify(s),before);
 const huge=applyFiatOperations(s,[{op:'set',target:'nation',field:'treasury',value:100000000}]).state;assertState(huge);assert.equal(huge.nation.treasury,100000000);
});
test('无银仍按指定数额拨款，补足单独记账；普通和写实档仍受余额限制',()=>{
 for(const mode of ['free','mid','real']){const s=fresh(mode);s.nation.treasury=0;s.emperor.talents.权谋=100;
  const r=run(s,'拨银一千万两修河'),result=r.results[0];if(mode==='free'){assert.equal(result.actual.amount,1000);assert.equal(result.clamped,false);assert.ok(r.state.ledger.some(e=>e.source.includes('补足')));}else assert.equal(result.actual?.amount||0,0);
 }
});
test('复合指令顺序创建12岁官员及新官职、任命并改属性，复生不冒用别人',()=>{
 let s=fresh();s=run(s,'创建官员张三；任命张三为工业部长；张三年龄设为12').state;const p=s.court.officials.find(p=>p.name==='张三');assert.equal(p.age,12);assert.equal(s.court.posts.find(x=>x.holder===p.id).title,'工业部长');
 s=applyFiatOperations(s,[{op:'kill',target:p.id},{op:'revive',target:p.id}]).state;assert.equal(s.court.officials.find(x=>x.id===p.id).alive,true);assert.equal(s.court.officials.find(x=>x.id===p.id).health,100);assertState(s);
});
test('任意一项不可执行则整条复合指令不生效，包括预演草稿优化路径',()=>{
 const s=fresh(),actions=validateIntents({actions:[{inputId:'朝',type:'fiat',operations:[{op:'set',target:'nation',field:'treasury',value:99999},{op:'set',target:'不存在的人',field:'age',value:18}]}]},s,input('复合御旨'));
 const f=forecastTurn(s,{朝:{kind:'下旨',edictType:'禁令',text:'复合御旨'}},actions);assert.equal(f.state.intentResults[0].status,'failed');assert.ok(f.state.nation.treasury<99999);assert.ok(!f.entries.some(e=>e.after===99999));
 assert.throws(()=>withDraft(()=>applyFiatOperations(s,actions[0].operations)));assert.equal(s.nation.treasury,480);
});
test('自定义事物与每旬制度可运行、读档、撤销；每旬仅一次，改档暂停规则而不损失家底',()=>{
 let s=applyFiatOperations(fresh(),[{op:'object',name:'工业部',description:'<img onerror=alert(1)>',fields:{产值:10}},{op:'policy',name:'工业增产',period:'eachTurn',operations:[{op:'add',target:'工业部',field:'产值',value:5}]}]).state;
 assert.equal(s.fiat.objects[0].values.产值,10);s.turn++;s=applyFiatRules(s);assert.equal(s.fiat.objects[0].values.产值,15);assert.deepEqual(applyFiatRules(s),s);assert.deepEqual(migrate(s).fiat,s.fiat);
 assert.ok(fiatWorldHTML(s).includes('&lt;img'));assert.ok(!fiatWorldHTML(s).includes('<img'));
 s=applyFiatOperations(s,[{op:'set',target:'nation',field:'treasury',value:10000000}]).state;s.settings.freedom='real';assertState(migrate(s));s.turn++;assert.equal(applyFiatRules(s).fiat.objects[0].values.产值,15);
 s.settings.freedom='free';s=applyFiatOperations(s,[{op:'cancel',target:'工业增产'}]).state;assert.equal(s.fiat.rules.length,0);
});
test('已有科技补齐前置、自创技术落入世界对象，新增州郡、势力和国家可续玩',()=>{
 let s=applyFiatOperations(fresh(),[...TECHS.map(t=>({op:'technology',target:t.id})),{op:'technology',name:'蒸汽动力'},{op:'create',kind:'province',name:'新州'},{op:'create',kind:'country',name:'新国'},{op:'create',kind:'faction',name:'工业派'}]).state;
 assert.equal(s.tech.done.length,TECHS.length);assert.ok(s.fiat.objects.some(o=>o.name==='蒸汽动力'));assert.ok(s.nation.provinces.some(p=>p.name==='新州'));assertState(s);assertState(commitTurn(s,forecastTurn(s),{}));
 const pending=fresh(),advanced=TECHS.find(t=>t.prereq.length);pending.tech.current={id:advanced.prereq[0],progress:0,elapsed:0,spent:0};
 const completed=applyFiatOperations(pending,[{op:'technology',target:advanced.id},{op:'fact',target:'天下',name:'新例',description:'以新法为准'}]).state;
 assert.equal(completed.tech.current,null);assert.equal(completed.facts.filter(f=>f.key==='新例').length,1);assertState(completed);
});
test('即时竣工真正建成产业、减赋与赈济，同旬新工程及重发旨意均有效且不重复结算',()=>{
 let s=applyFiatOperations(fresh(),TECHS.map(t=>({op:'technology',target:t.id}))).state;const province=s.nation.provinces[0].id;
 s=buildIndustry(s,{province,industry:'canal'}).state;s=issueEdict(s,{edictType:'减赋',province},20).state;s=issueEdict(s,{edictType:'赈灾',province},20).state;
 s.nation.provinces[0].disaster=50;const before=JSON.stringify(s),done=applyFiatOperations(s,[{op:'complete',target:'all'}]).state;
 assert.equal(JSON.stringify(s),before);assert.ok(done.projects.every(p=>p.done&&p.progress===100));assert.ok(done.nation.provinces[0].industries.some(i=>i.type==='canal'&&i.level===1));assert.ok(done.nation.provinces[0].taxRelief);assert.ok(done.nation.provinces[0].disaster<50);assertState(done);
 assert.deepEqual(applyFiatOperations(done,[{op:'complete',target:'all'}]).state,done);assertState(commitTurn(done,forecastTurn(done),{}));
});
test('战中指定归附会结算已有战役并撤回失效军报，战果真实记入该国',()=>{
 let s=fresh();const f=s.foreign[0];s=diplomacy(s,{country:f.id,operation:'宣战',confirmBreach:true},20).state;
 s=applyFiatOperations(s,[{op:'war',target:f.id,outcome:'归附'}]).state;assertState(s);assert.ok(s.campaigns.filter(w=>w.country===f.id).every(w=>w.done&&w.result==='胜利'));assert.equal(s.foreign[0].status,'朝贡');assert.ok(!s.memorials.some(m=>m.campaignOrder));
});
test('旧待续与新的复合御旨均可冻结后提交，重复提交不多办一次',()=>{
 const s=fresh(),text='国库设为一亿两；全体官员忠诚设为100',a=localIntents(s,input(text)),schedule={朝:{kind:'下旨',edictType:'禁令',text}};
 const f=forecastTurn(s,schedule,a);assert.deepEqual(forecastTurn(s,schedule,a),f);s.pending={forecast:f};const raw=JSON.stringify(f),next=migrate(s);assert.equal(JSON.stringify(next.pending.forecast),raw);
 const done=commitTurn(next,next.pending.forecast,{});assertState(done);assert.deepEqual(commitTurn(done,f,{}),done);
});
test('模式与事务字段不可越界；无法完整离线解析时明确保留待执行',()=>{
 for(const mode of ['mid','real'])assert.throws(()=>applyFiatOperations(fresh(mode),[{op:'set',target:'nation',field:'treasury',value:1000}]));
 for(const field of ['rng','runId','turn','__proto__.polluted'])assert.throws(()=>applyFiatOperations(fresh(),[{op:'set',target:'emperor',field,value:1}]));
 assert.throws(()=>normalizeFiatOperations([{op:'set',target:'nation',field:'treasury',value:Infinity}]));
 const s=fresh(),r=run(s,'国库设为一亿两；写一段复杂的新世界规则');assert.equal(r.results[0].status,'narrative');assert.equal(r.state.nation.treasury,s.nation.treasury);assert.match(r.results[0].summary,/连接模型/);
 assert.match(intentMessages(s,input('创建新事物'))[0].content,/不因钱粮/);
});
