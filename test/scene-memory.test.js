import test from 'node:test';
import assert from 'node:assert/strict';
import {seedNumber} from '../src/core/rng.js';
import {createState,migrate,assertState,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {resolveScene,forecastScene,commitScene,sceneInput} from '../src/core/scenes.js';
import {applySceneSocial} from '../src/core/social.js';
import {localSocial,normalizeSocial,groupRelationModifier,emperorKey,favorRecords} from '../src/core/social-rules.js';
import {npcMemories,memoryContext,rememberNPCScene,compactMemories} from '../src/core/memory.js';
import {auditChanges,numericSnapshot} from '../src/core/audit.js';
import {localIntents,intentInputs,validateIntents} from '../src/llm/intents.js';
import {mockNarrative,validateTurn} from '../src/llm/validate.js';
import {mockSceneNarrative,sceneMessages} from '../src/llm/scenes.js';
import {talkMessages,turnMessages} from '../src/llm/prompts.js';
import {talkAttempt} from '../src/core/court.js';
import {pack,unpack,createSaveStore} from '../src/store/save.js';
import {compactChapter} from '../src/core/archive.js';
import {npcMemoryHTML} from '../src/ui/memories.js';
import {sceneChapterHTML} from '../src/ui/scene-view.js';
const fresh=(mode='free')=>initialTurn(createState({seed:'人物往事',freedom:mode,prose:'modern'}));
const action=(text='安慰她，听她说说近日心事',people=['c0'])=>({kind:'自拟情节',people,text,place:'御花园'});
function start(text,people){const s=fresh(),a=action(text,people),f=forecastTurn(s,{夜:a},localIntents(s,intentInputs({夜:a})));return {base:s,f,s:commitTurn(s,f,validateTurn(mockNarrative(f),f))};}
const record=s=>s.history.at(-1).scenes[0];
function next(s,text='接着写'){const r=record(s),f=forecastScene(s,r.id,text,localIntents(s,[sceneInput(s,r,text)]));return {f,s:commitScene(s,f,validateTurn(mockSceneNarrative(s,f),f))};}
const plan=(kind,targetId='c0',otherId)=>({kind,targetId,...(otherId?{otherId}:{})});
for(const [id,field]of [['c0','favor'],['o0','favor'],['w0','attitude']])test('相处在引擎中改变'+id+'的'+field+'，并留下本人可读的往事',()=>{
 const {s,f}=start('安慰对方，谈谈近日心事',[id]),r=record(s),p=[...s.harem.consorts,...s.court.officials,...s.foreign].find(p=>p.id===id);
 assert.equal(r.social[0].kind,'comfort');assert.equal(r.socialChanges[0].delta,2);assert.equal(p[field],r.socialChanges[0].after);assert.equal(npcMemories(s,id).length,1);assert.match(npcMemories(s,id)[0].summary,/安慰/);assert.equal(npcMemories(s,'c2').length,0);assert.ok(f.entries.some(e=>e.social));assert.doesNotThrow(()=>assertState(s));
});
test('皇嗣沿用人物关系记录对当前皇帝的亲近，不添加另一套好感字段',()=>{
 const s=fresh();s.harem.children.push({id:'kid',name:'玉宁',health:80,relations:{}});
 const r=applySceneSocial(s,[plan('comfort','kid')],{status:'success'},'child');assert.equal(r.state.harem.children[0].relations[emperorKey(s)],52);assert.equal(r.state.harem.children[0].favor,undefined);assert.equal(s.harem.children[0].relations[emperorKey(s)],undefined);
});
test('成功、部分和失败采用不同后果，想做就成也不会把羞辱变成好感',()=>{
 const s=fresh();for(const [status,kind,delta]of [['success','comfort',2],['partial','comfort',1],['failed','comfort',0],['success','humiliate',-3],['failed','deceive',-3]]){
  const r=applySceneSocial(s,[plan(kind)],{status},'social');assert.equal(r.state.harem.consorts[0].favor-s.harem.consorts[0].favor,delta);
 }
 const {s:n}=start('当众羞辱她');assert.equal(record(n).outcome.status,'success');assert.equal(record(n).socialChanges[0].delta,-3);
});
test('调解写入双方真实关系，改变后续共同活动的配合程度，流水只有真实增量',()=>{
 const s=fresh(),before=structuredClone(s),r=resolveScene(s,action('调解二人的误会',['c0','c1']),[],'夜','pair');
 assert.deepEqual(s,before);assert.equal(r.state.harem.consorts[0].relations.c1,54);assert.equal(r.state.harem.consorts[1].relations.c0,54);assert.equal(groupRelationModifier(s,['c0','c1']),0);assert.equal(groupRelationModifier(r.state,['c0','c1']),0.8);
 const entries=auditChanges(s,r.state,r.state.ledger,'test').filter(e=>e.path.endsWith('.relations.c1')||e.path.endsWith('.relations.c0'));assert.equal(entries.length,2);assert.deepEqual(entries.map(e=>e.delta),[4,4]);
 const full=start('调解二人的误会',['c0','c1']).s;assert.match(npcMemories(full,'c0')[0].summary,new RegExp(full.harem.consorts[1].name));assert.ok(npcMemoryHTML(full,'c0').includes('54'));
});
test('人物关系实际参与下一次同场检定',()=>{
 const s=fresh('real');s.emperor.talents.魅力=30;
 const neutral=resolveScene(s,action('一起讨论一件难事',['c0','c1']),[],'朝','check');
 s.harem.consorts[0].relations.c1=100;s.harem.consorts[1].relations.c0=100;
 const close=resolveScene(s,action('一起讨论一件难事',['c0','c1']),[],'朝','check');
 assert.equal(neutral.record.outcome.die,close.record.outcome.die);assert.equal(groupRelationModifier(s,['c0','c1']),8);
 // Same die, higher cooperation bonus. Check seed sweep proves an actual outcome change.
 let changed=false;for(let seed=1;seed<50;seed++){s.rng=seedNumber('relation-'+seed);const high=resolveScene(s,action('一起讨论',['c0','c1']),[],'朝','high');s.harem.consorts[0].relations.c1=0;s.harem.consorts[1].relations.c0=0;const low=resolveScene(s,action('一起讨论',['c0','c1']),[],'朝','low');changed ||= high.record.outcome.status!==low.record.outcome.status;s.harem.consorts[0].relations.c1=100;s.harem.consorts[1].relations.c0=100;}assert.ok(changed);
});
test('同一场反复续写相同行为只记经过，不刷好感，单纯续写不重掷',()=>{
 const {s}=start(),before=structuredClone(s),a=next(s),b=next(a.s,'继续安慰她'),c=next(b.s,'陪她散步');
 assert.deepEqual(s,before);assert.equal(a.f.state.rng,s.rng);assert.equal(a.s.harem.consorts[0].favor,s.harem.consorts[0].favor);assert.equal(b.s.harem.consorts[0].favor,s.harem.consorts[0].favor);assert.equal(c.s.harem.consorts[0].favor,s.harem.consorts[0].favor+1);assert.equal(npcMemories(c.s,'c0').length,4);
 assert.deepEqual(commitScene(c.s,c.f,{}),c.s);
});
test('失败重试保存裁决和相处变化，读档与重复提交不重复生效',()=>{
 const {s}=start(),f=next(s,'向她道歉').f,pending={...s,pending:{kind:'scene',forecast:f},turnBudget:{used:1}},loaded=migrate(unpack(pack(pending)).state);
 assert.equal(JSON.stringify(loaded.pending.forecast),JSON.stringify(f));const n=commitScene(loaded,f,validateTurn(mockSceneNarrative(s,f),f));assert.equal(n.harem.consorts[0].favor,f.state.harem.consorts[0].favor);assert.deepEqual(commitScene(n,f,{}),n);assert.equal(npcMemories(n,'c0').length,2);
});
test('相处、赏罚与模型人物反应共用A9每人5总计10的额度',()=>{
 const s=fresh(),a=action('安慰他',['o0']),f=forecastTurn(s,{夜:a}),n=mockNarrative(f);n.chapter.夜=s.court.officials[0].name+'听完安慰，轻轻点头。';n.reactions=[{name:s.court.officials[0].name,favorDelta:5}];const v=validateTurn(n,f);assert.equal(v.reactions.length,0);
 const committed=commitTurn(s,f,v),continuation=next(committed,'嘉奖他');assert.equal(continuation.f.results[0].actual.amount,3);assert.equal(favorRecords(continuation.s,[],true).reduce((n,r)=>n+Math.abs(r.actual.amount||0),0),5);
 let social=applySceneSocial(s,[plan('protect','o0'),plan('comfort','o0'),plan('accompany','o0'),plan('protect','o1'),plan('protect','o2')],{status:'success'},'caps');assert.equal(social.changes.reduce((n,c)=>n+Math.abs(c.delta),0),10);assert.equal(social.changes.filter(c=>c.personId==='o0').reduce((n,c)=>n+c.delta,0),5);
});
test('已有模型反应在续写中只计一次，不重复挤占其他人的好感额度',()=>{
 const {s}=start('一起议事',['o0','o1']),p=s.court.officials[0];s.ledger.push({turn:s.turn,path:'official.'+p.id+'.favor',before:p.favor,after:p.favor+2,delta:2,source:'模型人物反应建议：引擎限额采纳'});p.favor+=2;
 const r=next(s,'嘉奖'+s.court.officials[1].name);assert.equal(r.f.results[0].actual.amount,5);
});
test('社交类型只对本场现有人物生效，普通口谕不能伪造互动',()=>{
 const s=fresh(),input={id:'x',scene:true,slot:'夜',people:['c0'],text:'安慰她'},raw={actions:[{inputId:'x',type:'other',interaction:plan('comfort')}]};assert.equal(validateIntents(raw,s,[input])[0].interaction.kind,'comfort');
 for(const bad of [plan('comfort','c1'),plan('madeup'),plan('reconcile','c0','c0'),plan('comfort','fake')])assert.equal(normalizeSocial(s,bad,input),null);
 assert.equal(validateIntents(raw,s,[{...input,scene:false}])[0].interaction,undefined);for(const text of ['不要羞辱她，只是谈天气','不想安慰她','没有羞辱她'])assert.equal(localSocial(s,{...input,text}),null);assert.equal(localSocial(s,{...input,people:['c0','c1']}),null);
 const before=structuredClone(s),talk=talkAttempt(s,'o0','安慰你');assert.equal(talk.state.court.officials[0].favor,before.court.officials[0].favor);assert.equal(talk.state.rng,before.rng);
});
test('个人记忆在召见、新情节及续写的提示词中可见，缺席者不会收到他人的私下经历',()=>{
 const {s}=start('安慰他',['o0']);s.court.officials[0].memory[0].summary='陛下曾在书房为沈守正解围，这件旧事他一直记得。';const marker='这件旧事他一直记得';
 const talk=talkAttempt(s,'o0','近来如何'),other=talkAttempt(s,'o1','近来如何');assert.ok(JSON.stringify(talkMessages(talk.state,talk.result)).includes(marker));assert.ok(!JSON.stringify(talkMessages(other.state,other.result)).includes(marker));
 const a=action('再见故人',['o0']),f=forecastTurn(s,{午:a});assert.ok(JSON.stringify(turnMessages(s,f)).includes(marker));assert.ok(JSON.stringify(sceneMessages(s,next(s).f)).includes(marker));assert.deepEqual(memoryContext(s,['o1'])[0].往事,[]);
});
test('模型记忆必须逐字来自校验后的整句，拒绝虚构、缺席者、私密心声和违规删句',()=>{
 const {f}=start(),name=f.state.harem.consorts[0].name,quote=name+'说：“多谢陛下记挂，今日心里宽慰了许多。”',thought=name+'暗想，自己还有不为人知的秘密。';
 const data={chapter:{朝:'',午:'',夜:quote+thought},sceneMemories:[{slot:'夜',personId:'c0',evidence:quote},{slot:'夜',personId:'c1',evidence:quote},{slot:'夜',personId:'c0',evidence:'她答应明日把全部秘密告知皇帝。'}]};
 assert.deepEqual(validateTurn(data,f).sceneMemories,[{slot:'夜',personId:'c0',evidence:quote}]);data.sceneMemories=[{slot:'夜',personId:'c0',evidence:thought}];assert.equal(validateTurn(data,f).sceneMemories.length,0);
 data.chapter.夜=name+'已怀孕，笑着向陛下报喜。';data.sceneMemories=[{slot:'夜',personId:'c0',evidence:data.chapter.夜}];assert.equal(validateTurn(data,f).sceneMemories.length,0);
});
test('欺瞒成功不会把皇帝的真实企图写入受骗者记忆，失败可损伤信任',()=>{
 const {s,f}=start('欺骗她，隐瞒故意离间的打算'),m=npcMemories(s,'c0')[0];assert.equal(m.kind,'shared');assert.ok(!/欺骗|离间|受骗/.test(m.summary));
 const name=f.state.harem.consorts[0].name,quote=name+'知道皇帝刚才骗过了自己。';assert.equal(validateTurn({chapter:{朝:'',午:'',夜:quote},sceneMemories:[{slot:'夜',personId:'c0',evidence:quote}]},f).sceneMemories.length,0);
});
test('记忆不依赖百条公共摘要，长期压缩仍保留早期伤害和最近往事，数字审计不把记忆当数值效果',()=>{
 const {s}=start('羞辱她'),r=record(s);let state=s;for(let i=1;i<=45;i++)state=rememberNPCScene(state,{...r,id:'later-'+i}, {...r,id:'later-'+i,turn:s.turn,sequence:i,social:[]},'她在廊下向皇帝问安，两人聊了几句家常。');
 state.facts=Array.from({length:100},(_,i)=>({key:'fact-'+i,value:'国事'}));const m=npcMemories(state,'c0');assert.equal(m.filter(x=>x.type==='scene').length,16);assert.ok(m.some(x=>x.type==='scene-summary'&&x.kind==='humiliate'));assert.ok(JSON.stringify(memoryContext(state,['c0'])).includes('斥责'));assert.equal(m.filter(x=>x.type==='scene-summary').reduce((n,x)=>n+x.count,0)+16,46);
 assert.deepEqual(numericSnapshot(state),numericSnapshot(s));assert.deepEqual(auditChanges(s,state,[]),[]);assert.doesNotThrow(()=>assertState(migrate(unpack(pack(state)).state)));
});
test('v18往事按既有正文回填，不改数值、不重建待续，也不泄露旧梗概中的秘密',()=>{
 const {s}=start();s.v=18;for(const p of [...s.court.officials,...s.harem.consorts,...s.foreign]){delete p.memory;delete p.memoryHydrated;}for(const r of s.history.at(-1).scenes){delete r.memoryVersion;r.text='骗她说自己没有秘密，其实另有打算';}
 const f=next(s).f;f.state.v=18;s.pending={kind:'scene',forecast:f};const bytes=JSON.stringify(s.pending.forecast),numeric=numericSnapshot(s),loaded=migrate(unpack(pack(s)).state);assert.equal(loaded.v,VERSION);assert.equal(JSON.stringify(loaded.pending.forecast),bytes);assert.deepEqual(numericSnapshot(loaded),numeric);assert.equal(npcMemories(loaded,'c0').length,1);assert.ok(!JSON.stringify(npcMemories(loaded,'c0')).includes('另有打算'));
 const n=commitScene(loaded,f,validateTurn(mockSceneNarrative(s,f),f));assert.equal(npcMemories(n,'c0').length,2);assert.equal(n.harem.consorts[0].memoryHydrated,true);
});
test('人物记忆与关系随分卷、恢复副本及导出保存，原文入口与变化安全展示',async()=>{
 const {s}=start('调解二人的误会',['c0','c1']);const h=s.history.at(-1);assert.deepEqual(compactChapter(h).scenes,h.scenes);const primary=new Map(),backup=new Map(),io={primary:{get:async k=>primary.get(k),put:async(k,v)=>primary.set(k,v)},backup:{getItem:k=>backup.get(k),setItem:(k,v)=>backup.set(k,v)},validate:migrate};await createSaveStore(io).save(1,s);primary.clear();const loaded=await createSaveStore(io).load(1);assert.equal(loaded.readOnly,false);assert.equal(loaded.state.harem.consorts[0].relations.c1,54);assert.equal(npcMemories(loaded.state,'c0').length,1);
 s.harem.consorts[0].memory[0].summary='<img src=x onerror=alert(1)>';assert.ok(!npcMemoryHTML(s,'c0').includes('<img'));assert.match(sceneChapterHTML(h,'夜',true,s),/相处变化/);assert.match(sceneChapterHTML(h,'夜',true,s),/的往事/);
});
test('损坏的新记忆、关系或情节变化记录拒读并保护原档',async()=>{
 const {s}=start();for(const mutate of [x=>x.harem.consorts[0].memory[0].turn=-1,x=>x.harem.consorts[0].relations={o0:101},x=>record(x).socialChanges[0].delta=999,x=>x.harem.consorts[0].memory.push(structuredClone(x.harem.consorts[0].memory[0]))]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>migrate(bad));}
 const bad=structuredClone(s);bad.harem.consorts[0].memory[0].summary=42;const original=pack(bad),primary=new Map([[1,original]]),store=createSaveStore({primary:{get:async k=>primary.get(k),put:async(k,v)=>primary.set(k,v)},backup:{getItem:()=>null,setItem(){}},validate:migrate});assert.equal((await store.load(1)).readOnly,true);assert.deepEqual(primary.get(1),original);
});
test('有分量的实事与当面承诺逐件保留，日常相处再多也不合并抹去',()=>{
 const {s}=start(),r=record(s);let n=s;for(let i=1;i<=3;i++)n=rememberNPCScene(n,{...r,id:'promise-'+i},{...r,id:'promise-'+i,sequence:i},'陆令仪听见皇帝答应明日到第'+i+'处院落探望她。');
 for(let i=4;i<=40;i++)n=rememberNPCScene(n,{...r,id:'routine-'+i},{...r,id:'routine-'+i,sequence:i},'陆令仪在廊下问安，两人闲谈了几句家常。');
 const entries=npcMemories(n,'c0');for(let i=1;i<=3;i++)assert.ok(entries.some(m=>m.summary.includes('第'+i+'处院落')));assert.doesNotThrow(()=>assertState(n));assert.deepEqual(compactMemories(entries),entries);
});
