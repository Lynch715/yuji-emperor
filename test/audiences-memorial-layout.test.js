import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,assertState,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn,validateSchedule,scheduleCost} from '../src/core/turn.js';
import {talkAttempt} from '../src/core/court.js';
import {normalizeIntents,resolveTalkIntents} from '../src/core/intents.js';
import {resolveMemorial,expireMemorials,pickMemorialist} from '../src/core/events.js';
import {issueEdict,advanceProjects} from '../src/core/edicts.js';
import {diplomacy} from '../src/core/foreign.js';
import {nationQuarter} from '../src/core/nation.js';
import {haremAction,recommendCandidates,selectConsort,canVisit} from '../src/core/harem.js';
import {applyScenario,SCENARIOS} from '../src/core/scenarios.js';
import {memorialArchive} from '../src/core/memorial-records.js';
import {pack,unpack} from '../src/store/save.js';
import {TEXT_LIMITS} from '../src/core/text.js';
import {memorialParagraphHTML,memorialAuthor} from '../src/ui/memorial-document.js';
import {memorialArchiveDetailHTML} from '../src/ui/memorial-archive.js';
import {memorialImageLayout} from '../src/ui/memorial-image.js';
import {createMemorialSession,memorialAction,memorialHTML} from '../src/ui/memorials.js';
import {scheduleEstimate,actionAvailability} from '../src/ui/view-model.js';
import {classifyMessages,talkMessages,turnMessages} from '../src/llm/prompts.js';
import {validateTalk} from '../src/llm/validate.js';
const fresh=(freedom='free')=>initialTurn(createState({seed:'召见与奏折',freedom}));
for(const mode of ['free','mid','real'])test('三档聊天均不限轮数，不掷骰、不刷好感：'+mode,()=>{
 let s=fresh(mode);const rng=s.rng,favor=s.court.officials[0].favor;
 for(let i=0;i<30;i++){const a=talkAttempt(s,'o0','说说近况，今日天气如何？');assert.equal(a.result.die,null);assert.equal(a.result.mode,'chat');s=a.state;}
 assert.equal(s.rng,rng);assert.equal(s.court.officials[0].favor,favor);assert.equal(s.talks.length,30);
 const a=talkAttempt(s,'o0','试探旧事');const b=talkAttempt(a.state,'o0','试探旧事');
 assert.equal(b.state.rng,a.state.rng);assert.equal(b.result.reused,true);assert.equal(b.state.court.officials[0].favor,a.state.court.officials[0].favor);
});
test('普通聊天不能凭空许诺拨银或办事，仍保留否定回话',()=>{
 const s=fresh(),r=talkAttempt(s,'o0','今日可好？').result;
 assert.equal(validateTalk({reply:'臣马上拨银一千万两。臣再尽力也办不到。'},r,s).reply,'臣再尽力也办不到。');
});
test('多位召见按不同人数计精力，已谈的人不可撤去；提交不重办',()=>{
 let s=talkAttempt(fresh(),'o0','近况').state;s=talkAttempt(s,'o1','近况').state;
 const schedule={午:{kind:'召见',person:'o1',persons:['o0','o1']}};
 assert.equal(scheduleCost(schedule),2);assert.equal(scheduleCost({午:{...schedule.午,persons:['o0','o0','o1']}}),2);
 assert.doesNotThrow(()=>validateSchedule(s,schedule));assert.throws(()=>validateSchedule(s,{午:{kind:'召见',person:'o1'}}),/保留/);
 const f=forecastTurn(s,schedule),n=commitTurn(s,f,{});assert.deepEqual(commitTurn(n,f,{}),n);
});
test('同一口谕重复问不重掷、不重扣；明确追加仍付真实银两',()=>{
 let s=fresh();const run=line=>{const id='t-'+s.talks.length,input={id,slot:'午',text:line};const actions=normalizeIntents(s,[{inputId:id,type:'allocate',resource:'treasury',amount:5,source:'treasury',destination:'privy'}],[input]);const a=talkAttempt(s,'o1',line,true);const b=resolveTalkIntents(a.state,a.result,actions);s=b.state;return b.result;};
 run('拨银五万两给内帑');const balance=s.nation.treasury,rng=s.rng;const first=s.talks[0].intentResults[0];
 run('拨银五万两给内帑');assert.equal(s.nation.treasury,balance);assert.equal(s.rng,rng);assert.deepEqual(s.talks[1].intentResults[0],first);
 run('再拨银五万两给内帑');assert.equal(s.nation.treasury,balance-5);
 const bytes=JSON.stringify(s.intentResults);s=migrate(unpack(pack(s)).state);assert.equal(JSON.stringify(s.intentResults),bytes);
});
for(const mode of ['free','mid','real'])test('上朝不限本数，再议不延期且逾期会处理：'+mode,()=>{
 let s=fresh(mode);s.memorials=Array.from({length:20},(_,i)=>({...s.memorials[0],id:'many-'+i}));
 const session=createMemorialSession(s,'上朝');session.ids.forEach(id=>session.choices[id]='hold');const a=memorialAction(s,session);
 assert.ok(!memorialHTML(s,session).includes('期限 +3'));
 assert.equal(a.memorials.length,20);assert.equal(scheduleCost({朝:a}),8);assert.doesNotThrow(()=>forecastTurn(s,{朝:a}));
 const id=s.memorials[0].id,due=s.memorials[0].due;
 for(let i=0;i<15;i++)s=resolveMemorial(s,id,'discuss').state;
 assert.equal(s.memorials[0].due,due);s.turn=due+1;s=expireMemorials(s);assert.ok(!s.memorials.some(m=>m.id===id));
});
test('圣旨可重申或追加督办，同一工程只竣结一次，不同州各自办理',()=>{
 let s=issueEdict(fresh(),{edictType:'修河',province:'z0'},20).state;
 const old=s.projects[0],money=s.nation.treasury;
 const repeated=issueEdict(s,{edictType:'修河',province:'z0'},20);assert.equal(repeated.state.nation.treasury,money);assert.equal(repeated.state.projects.length,1);
 s=issueEdict(s,{edictType:'修河',province:'z0',followup:'督办'},20).state;assert.equal(s.projects.length,1);assert.ok(s.projects[0].end<old.end);assert.equal(s.nation.treasury,money-60);
 s=issueEdict(s,{edictType:'修河',province:'z1'},20).state;assert.equal(s.projects.length,2);
 s.turn=s.projects[0].end;const done=advanceProjects(s),count=done.ledger.length;assert.equal(advanceProjects(done).ledger.length,count);
 assert.ok(forecastTurn(repeated.state,{朝:{kind:'下旨',edictType:'修河',province:'z0'}}).facts.some(f=>f.kind==='execution'&&f.label===repeated.execution.label));
 assert.doesNotThrow(()=>issueEdict(done,{edictType:'修河',province:'z0'},20));
});
test('两库拨转按余额及收款空间截断，允许小额，不受一百万两上限',()=>{
 const s=fresh();s.nation.treasury=600;s.nation.privy=0;
 let r=issueEdict(s,{edictType:'转内帑',amount:1000},20);assert.equal(r.state.nation.privy,600);assert.equal(r.state.nation.treasury,0);assert.match(r.note,/余银/);
 assert.equal(issueEdict(s,{edictType:'转内帑',amount:0.5},20).state.nation.privy,0.5);
 s.nation.privy=999999;assert.equal(issueEdict(s,{edictType:'转内帑',amount:50},20).state.nation.treasury,599);
 for(const amount of [-1,0,NaN,Infinity])assert.throws(()=>issueEdict(s,{edictType:'转内帑',amount},20));
 s.schedule={朝:{kind:'下旨',edictType:'转内帑',amount:1000}};assert.equal(scheduleEstimate(s).totals.treasury,-1);
});
test('互市可以重新议约，失败保留旧约，成功只有一份季度收入',()=>{
 let s=fresh('real');s.emperor.talents.魅力=100;s.foreign[0].attitude=100;
 s=diplomacy(s,{country:'w0',operation:'互市'},20).state;const old=structuredClone(s.foreign[0].trade);
 s.emperor.talents.魅力=0;s.foreign[0].attitude=0;
 const failed=diplomacy(s,{country:'w0',operation:'互市'},1);assert.equal(failed.check.success,false);assert.deepEqual(failed.state.foreign[0].trade,old);
 s.emperor.talents.魅力=100;s.foreign[0].attitude=100;s.turn=1;s=diplomacy(s,{country:'w0',operation:'互市'},20).state;assert.equal(s.foreign[0].trade.start,1);
 s.turn=9;const no=structuredClone(s);no.foreign[0].trade=null;assert.ok(Math.abs(nationQuarter(s).nation.treasury-nationQuarter(no).nation.treasury-s.foreign[0].trade.income)<1e-8);
});
test('赏赐受实际内帑约束，同旬分拆不多得好感，大额边际递减',()=>{
 const s=fresh();s.nation.privy=500;const id=s.harem.consorts[1].id;s.harem.consorts[1].favor=20;
 const gift=(s,n)=>haremAction(s,{person:id,operation:'赏赐',amount:n}).state;
 const f=forecastTurn(s,{夜:{kind:'后宫',operation:'赏赐',person:id,amount:40}});assert.ok(!f.entries.some(e=>e.path.includes('.gifts.')));
 const one=gift(s,40),split=gift(gift(s,20),20);assert.ok(Math.abs(one.harem.consorts[1].favor-split.harem.consorts[1].favor)<1e-9);
 assert.ok(gift(s,400).harem.consorts[1].favor<100);assert.equal(gift(s,999).nation.privy,0);assert.equal(gift(s,0.5).nation.privy,499.5);
 assert.doesNotThrow(()=>assertState(migrate(unpack(pack(one)).state)));
});
for(const mode of ['free','mid','real'])test('非大选年也可日常举荐，付内帑且仅生成年满十八人选：'+mode,()=>{
 let s=fresh(mode);s.turn=36;s.harem.candidates=[];const balance=s.nation.privy;
 assert.equal(actionAvailability(s,'选妃'),'');const f=forecastTurn(s,{午:{kind:'选妃',operation:'举荐'}});assert.equal(f.state.nation.privy,balance-3);
 s=recommendCandidates(s);assert.equal(s.harem.candidates.length,1);assert.ok(s.harem.candidates[0].age>=18);
 const c=s.harem.candidates[0];s=selectConsort(s,c.id);assert.ok(s.harem.consorts.some(o=>o.id===c.id));s.harem.consorts.at(-1).age=17;assert.equal(canVisit(s,s.harem.consorts.at(-1)),false);
});
test('七位皇帝的新奏折均有真实在任署名，空衙门标明转奏；无人时不编名字',()=>{
 for(const sc of SCENARIOS){const s=initialTurn(applyScenario(createState({seed:'署名-'+sc.id,freedom:'free'}),sc.id));for(const m of s.memorials){assert.ok(m.fromId,sc.id+':'+m.title);assert.ok(s.court.officials.some(o=>o.id===m.fromId&&o.name===m.from&&o.alive));assert.ok(m.fromPost);assert.match(m.fromRole,/上奏|转奏/);}}
 const s=fresh();for(const p of s.court.posts)p.holder=null;const m=pickMemorialist(s,'河工');assert.equal(m.fromId,null);assert.match(memorialAuthor(m),/未留署名/);
});
test('档案、分享图保留上奏时职务，段落逐段缩进且转义文本',()=>{
 const s=fresh(),m=s.memorials[0];m.text='第一段。\r\n\r\n第二段。\n<script>第三段</script>';const job=m.fromPost;
 const action={朝:{kind:'批折',memorials:[m.id],decisions:{[m.id]:{option:'approve',remark:'准奏'}}}};
 const n=commitTurn(s,forecastTurn(s,action),{}),r=memorialArchive(n)[0];n.court.officials.find(o=>o.id===m.fromId).post=null;
 assert.equal(r.fromPost,job);const html=memorialArchiveDetailHTML(r);assert.match(html,/<p>第一段。<\/p><p>第二段。<\/p>/);assert.ok(!html.includes('<script>'));assert.ok(html.includes(job));
 assert.equal(memorialParagraphHTML('甲\n乙'),'<p>甲</p><p>乙</p>');
 const runs=memorialImageLayout(r,(t,z)=>Array.from(t).length*z).flatMap(p=>p.runs);assert.ok(runs.some(r=>r.text==='　　第二段。'));assert.ok(runs.some(r=>r.text.includes(job)&&r.text.includes('谨奏')));
 assert.ok(runs.every(r=>Array.from(r.text).length*r.size<=912));
});
test('长朱批和口谕贯穿保存、提示词及档案，不再截成一百或五百字',()=>{
 const s=fresh(),remark='核查河工。'.repeat(150),line='请详奏。'.repeat(180);
 const session=createMemorialSession(s,'批折');session.ids=[s.memorials[0].id];session.choices[session.ids[0]]='remark';session.remarks[session.ids[0]]=remark;
 const a=memorialAction(s,session);assert.equal(a.decisions[session.ids[0]].remark,remark);
 const n=commitTurn(s,forecastTurn(s,{朝:a}),{});assert.equal(memorialArchive(unpack(pack(n)).state)[0].remark,remark);
 const talk=talkAttempt(s,'o0',line);assert.equal(talk.result.line,line);assert.ok(talkMessages(talk.state,talk.result).at(-1).content.includes(line));assert.equal(classifyMessages(line).at(-1).content,line);assert.equal(TEXT_LIMITS.remark,2000);
});
test('v16待续原封不动升级，v17新增记录损坏会拒读',()=>{
 const s=fresh();s.v=16;s.pending={forecast:forecastTurn(s)};s.pending.forecast.state.v=16;
 const bytes=JSON.stringify(s.pending.forecast),next=migrate(unpack(pack(s)).state);assert.equal(next.v,VERSION);assert.equal(JSON.stringify(next.pending.forecast),bytes);
 const broken=fresh();broken.harem.consorts[0].gifts={turn:0,amount:-5};assert.throws(()=>migrate(broken),/赏赐/);
 const invalid=fresh();invalid.memorials[0].fromPost={};assert.throws(()=>migrate(invalid),/上奏人/);
});

test('纯聊天不生成反复的拟议口谕，叙事仍收到交谈内容',()=>{
 const s=fresh(),a=talkAttempt(s,'o0','卿今日可好？'),actions=normalizeIntents(a.state,[{inputId:'talk',type:'other'}],[{id:'talk',slot:'午',text:a.result.line}]);
 const next=resolveTalkIntents(a.state,a.result,actions);assert.deepEqual(next.state.intentResults,[]);assert.equal(next.result.intentResults,undefined);
 const f=forecastTurn(next.state,{午:{kind:'召见',person:'o0'}});assert.ok(turnMessages(next.state,f).at(-1).content.includes('卿今日可好？'));
});
test('反复确认已办拨款，不虚耗面谈的职权额度',()=>{
 let s=fresh('real');s.emperor.talents.权谋=100;s.court.officials.find(o=>o.id==='o1').favor=100;
 const run=()=>{const id='confirm-'+s.talks.length,actions=normalizeIntents(s,[{inputId:id,type:'allocate',resource:'treasury',amount:2,source:'treasury',destination:'privy'}],[{id,slot:'午',text:'拨二万两'}]);const a=talkAttempt(s,'o1','拨二万两',true);s=resolveTalkIntents(a.state,a.result,actions).state;};
 run();const cap=talkAttempt(s,'o1','还余多少？',true).result.cap;
 for(let i=0;i<8;i++)run();assert.equal(talkAttempt(s,'o1','还余多少？',true).result.cap,cap);
});
