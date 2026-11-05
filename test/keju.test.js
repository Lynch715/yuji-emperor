import { advanceRegency, succeedEmperor } from '../src/core/succession.js';
import { examGraceStart, examGraceReceipt } from '../src/core/keju-schema.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,assertState,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {activeExam,advanceExams,configureExams,appointExaminer,setExamTopics,chooseExamTopic,receiveExamPapers,setExamBlind,rankExamCandidate,publishExam,cacheExamEssay,openEnke,queueExamHook,examOfficialView} from '../src/core/keju.js';
import {mockExamPapers,mockExamEssay,validateExamPapers,validateExamEssay,validateExamTopics,validateTopicReview,examPaperMessages,examEssayMessages} from '../src/llm/keju.js';
import {issueEdict} from '../src/core/edicts.js';
import {resolveMemorial} from '../src/core/events.js';
import {pack,unpack} from '../src/store/save.js';
import {kejuHTML,examPapersHTML} from '../src/ui/keju.js';
const fresh=(mode='mid')=>initialTurn(createState({seed:'keju-tests',freedom:mode}));
function writing(mode='mid',blind=true){let s=fresh(mode),id=activeExam(s).id;s=appointExaminer(s,id,'o4');s=setExamBlind(s,id,blind);s=setExamTopics(s,id,['如何整顿吏治？','如何安边？']);return chooseExamTopic(s,id,'如何整顿吏治？');}
function grading(mode='mid',blind=true){const s=writing(mode,blind),e=activeExam(s);return receiveExamPapers(s,e.id,validateExamPapers({candidates:mockExamPapers(e)},e));}

test('常科自动开科、可配置间隔、不重开未放榜一届',()=>{
 let s=fresh();assert.equal(activeExam(s).status,'awaiting_examiner');assert.equal(s.keju.nextRegularTurn,108);
 s=configureExams(s,5);assert.equal(s.keju.interval,5);assert.equal(s.keju.nextRegularTurn,5);
 s.turn=20;s=advanceExams(s);assert.equal(s.keju.exams.length,1);
 assert.throws(()=>configureExams(s,0));assert.throws(()=>configureExams(s,Infinity));
});
test('恩科须任主考且国库够支，重复请求不扣款、不加声望',()=>{
 let s=createState({seed:'enke'});assert.throws(()=>openEnke(s));assert.throws(()=>openEnke(s,'not-an-official'));
 s.nation.treasury=29;assert.throws(()=>openEnke(s,'o4'));s.nation.treasury=100;
 const next=issueEdict(s,{edictType:'加开恩科',examiner:'o4'},1).state;
 assert.equal(next.nation.treasury,70);assert.equal(next.keju.scholarReputation,53);assert.equal(activeExam(next).examiner,'o4');assert.equal(activeExam(next).type,'enke');assert.throws(()=>openEnke(next,'o4'));assert.equal(s.nation.treasury,100);assertState(next);
});
test('开科前须任主考，主考离任后须重任，隐藏属性与文笔独立且生成可重现',()=>{
 const s=fresh(),id=activeExam(s).id;assert.throws(()=>chooseExamTopic(s,id,'题目','emperor'));
 const a=writing(),b=writing();assert.deepEqual(a,b);assert.equal(activeExam(a).candidates.length,9);assert.equal(new Set(activeExam(a).candidates.map(c=>c.name)).size,9);
 assert.ok(activeExam(a).candidates.some(c=>c.literary!==c.hidden.ability));assert.equal(activeExam(s).candidates.length,0);assertState(a);
 let n=appointExaminer(s,id,'o4');n.court.officials.find(o=>o.id==='o4').post=null;assert.throws(()=>chooseExamTopic(n,id,'自拟','emperor'));
});
test('自拟题三档：严格劝谏、最自由原样采用、中档复用可复现裁决',()=>{
 const topic='  请问如何求得长生？\n ',review={suitable:false,rewrite:'如何使百姓延年安居？',reason:'题宜务实'};
 for(const mode of ['real','mid','free']){let s=fresh(mode),id=activeExam(s).id;s=appointExaminer(s,id,'o4');const a=chooseExamTopic(s,id,topic,'emperor',review),b=chooseExamTopic(s,id,topic,'emperor',review);assert.deepEqual(a,b);assert.equal(activeExam(a).topicSource,'emperor');assert.equal(activeExam(a).requestedTopic,topic);if(mode==='real')assert.equal(activeExam(a).topic,review.rewrite);if(mode==='free')assert.equal(activeExam(a).topic,topic);assertState(a);}
});
test('收卷一次涵盖全部人、数值不受模型篡改、失败保留名册与原骰',()=>{
 const s=writing(),e=activeExam(s),before=structuredClone(s),data={candidates:mockExamPapers(e)};
 assert.ok(data.candidates.every(c=>!Object.hasOwn(c,'hidden')));
 data.candidates[0].hidden={ability:999999,integrity:-50,faction:'invented'};
 const checked=validateExamPapers(data,e);assert.ok(checked.every(c=>!Object.hasOwn(c,'hidden')));assert.deepEqual(s,before);
 assert.throws(()=>validateExamPapers({candidates:mockExamPapers(e).slice(1)},e));
 const wrong={candidates:mockExamPapers(e)};wrong.candidates[0].essayPosition='随机立场';assert.throws(()=>validateExamPapers(wrong,e));
 const n=receiveExamPapers(s,e.id,validateExamPapers({candidates:mockExamPapers(e)},e));assert.equal(activeExam(n).status,'grading');assert.equal(n.rng,s.rng);assertState(n);
});
test('糊名遮蔽身份及隐藏属性；揭名不重新生成卷子或拟次',()=>{
 const s=grading(),e=activeExam(s),html=examPapersHTML(e);
 for(const c of e.candidates){assert.ok(!html.includes(c.name));assert.ok(!html.includes(c.hometown));assert.ok(!html.includes(String(c.hidden.ability)+'分'));}
 const n=setExamBlind(s,e.id,false);assert.deepEqual(activeExam(n).candidates,e.candidates);assert.ok(examPapersHTML(activeExam(n)).includes(e.candidates[0].name));
 const prompt=JSON.stringify(examPaperMessages(s,e));assert.ok(prompt.includes('一次返回全部9名'));assert.ok(prompt.includes('不得修改引擎属性')); // corpus privacy instruction
});
test('全文按单卷加载并缓存，属性与立场校验，不接受短文',()=>{
 const s=grading(),e=activeExam(s),c=e.candidates[0],essay=mockExamEssay(e,c);
 assert.throws(()=>validateExamEssay({essayPosition:'错',essayFull:essay},c));assert.throws(()=>cacheExamEssay(s,e.id,c.id,'短文'));
 const n=cacheExamEssay(s,e.id,c.id,validateExamEssay({essayPosition:c.hidden.stance,essayFull:essay},c));assert.equal(n.rng,s.rng);assert.equal(n.keju.exams[0].candidates.filter(c=>c.essayFull).length,1);
 assert.deepEqual(cacheExamEssay(n,e.id,c.id,'不覆盖'),n);assert.equal(migrate(unpack(pack(n)).state).keju.exams[0].candidates[0].essayFull,essay);assertState(n);
});
test('一甲选择交换，缺位可存但不能放榜，二三甲及黜落可修改',()=>{
 let s=grading(),e=activeExam(s),top=Object.keys(e.ranking).find(id=>e.ranking[id]==='状元'),low=Object.keys(e.ranking).find(id=>e.ranking[id]==='黜落');
 s=rankExamCandidate(s,e.id,low,'状元');assert.equal(activeExam(s).ranking[top],'黜落');assert.equal(activeExam(s).ranking[low],'状元');assertState(s);
 s=rankExamCandidate(s,e.id,low,'二甲');assertState(s);assert.doesNotThrow(()=>migrate(s));assert.throws(()=>publishExam(s,e.id));
 s=rankExamCandidate(s,e.id,top,'状元');assertState(publishExam(s,e.id));
});
test('放榜生成翰林与候补人才，座师门生双向记录且幂等',()=>{
 const s=grading(),e=activeExam(s),n=publishExam(s,e.id),people=n.court.officials.filter(o=>o.keju);
 assert.equal(people.length,7);assert.equal(people.filter(o=>o.post).length,3);assert.equal(people.filter(o=>n.court.posts.find(p=>p.id===o.post)?.title==='翰林院修撰').length,1);assert.equal(people.filter(o=>n.court.posts.find(p=>p.id===o.post)?.title==='翰林院编修').length,2);
 for(const o of people){assert.equal(o.keju.mentor,'o4');assert.equal(o.relations.o4,60);assert.ok(n.court.officials.find(o=>o.id==='o4').examStudents.includes(o.id));assert.deepEqual(o.keju.revealed,[]);assert.equal(examOfficialView(n,o).abilities.政,'待察');}
 assert.deepEqual(publishExam(n,e.id),n);assertState(n);assert.doesNotThrow(()=>migrate(n));
});
test('一甲出身与同派偏私影响士林和势力，并触发示例事件',()=>{
 let s=grading('mid',false),e=activeExam(s);const top=e.candidates.filter(c=>['状元','榜眼','探花'].includes(e.ranking[c.id]));
 top.forEach(c=>{c.origin='noble';c.hidden.faction=e.examinerFaction;c.priorMentor=e.examiner;});const n=publishExam(s,e.id);assert.equal(n.keju.scholarReputation,42);assert.equal(n.keju.hooks.length,1);assert.ok(n.court.factions.find(f=>f.id===e.examinerFaction).powerModifier>s.court.factions.find(f=>f.id===e.examinerFaction).powerModifier);
 n.turn++;const a=advanceExams(n);assert.ok(a.memorials.some(m=>m.type==='落第举子闹事'));assert.equal(advanceExams(a).memorials.length,a.memorials.length);
 const m=a.memorials.find(m=>m.type==='落第举子闹事');const resolved=resolveMemorial(a,m.id,'opt0');assert.ok(resolved.state.keju.scholarReputation>a.keju.scholarReputation);
 const fraud=queueExamHook(n,e.id,'exam_fraud');assert.equal(fraud.keju.hooks.length,2);assert.equal(queueExamHook(fraud,e.id,'exam_fraud').keju.hooks.length,2);assertState(a);
});
test('任职每年通过事件揭示一种隐藏属性，候补无职者不揭示',()=>{
 let s=publishExam(grading(),activeExam(grading()).id);s.turn=36;s=advanceExams(s);const appointed=s.court.officials.find(o=>o.keju&&o.post),reserve=s.court.officials.find(o=>o.keju&&!o.post);
 assert.deepEqual(appointed.keju.revealed,['ability']);assert.equal(examOfficialView(s,appointed).abilities.政,appointed.abilities.政);assert.deepEqual(reserve.keju.revealed,[]);assert.equal(s.memorials.filter(m=>m.type==='进士履职').length,3);
 assert.equal(advanceExams(s).memorials.length,s.memorials.length);s.turn=72;s=advanceExams(s);assert.equal(s.court.officials.find(o=>o.id===appointed.id).keju.revealed.length,2);assertState(s);
});
test('旧v21存档及待续原骰升级，损坏新档拒读、不修改原档',()=>{
 let s=fresh(),f=forecastTurn(s);s.v=21;delete s.keju;f.state.v=21;delete f.state.keju;s.pending={forecast:f};const raw=JSON.stringify(f),before=structuredClone(s),n=migrate(s);
 assert.equal(n.v,VERSION);assert.equal(n.keju.exams.length,0);assert.equal(JSON.stringify(n.pending.forecast),raw);assert.deepEqual(s,before);
 const committed=commitTurn(n,n.pending.forecast,{});assert.equal(committed.rng,f.state.rng);assert.equal(committed.lastTurn.die,f.die);assertState(committed);
 const corrupt=grading();corrupt.keju.exams[0].candidates[0].hidden.ability=101;assert.throws(()=>migrate(corrupt));
});
test('真实回合恩科与预演幂等，过期回合不能覆盖科举操作',()=>{
 const s=createState({seed:'turn-enke'}),schedule={朝:{kind:'下旨',edictType:'加开恩科',examiner:'o4'},午:null,夜:null};const f=forecastTurn(s,schedule),n=commitTurn(s,f,{});assert.equal(activeExam(n).type,'enke');assert.deepEqual(commitTurn(n,f,{}),n);
 const old=fresh(),preview=forecastTurn(old),changed=appointExaminer(old,activeExam(old).id,'o4');assert.throws(()=>commitTurn(changed,preview,{}));
});
test('备选题及礼部建议校验拒绝损坏格式，显示转义自由文本',()=>{
 assert.throws(()=>validateExamTopics({topics:['重复','重复']}));assert.throws(()=>validateTopicReview({suitable:false}));
 const s=grading();activeExam(s).candidates[0].essaySummary='<script>bad</script>';const html=kejuHTML(s);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});

test('放榜时主考已故仍保留历史座师关系，纯函数不改原状态',()=>{
 const s=grading(),e=activeExam(s),mentor=s.court.officials.find(o=>o.id===e.examiner);mentor.alive=false;mentor.health=0;mentor.post=null;for(const p of s.court.posts)if(p.holder===mentor.id)p.holder=null;
 const before=JSON.stringify(s),n=publishExam(s,e.id);assert.equal(JSON.stringify(s),before);assert.equal(n.court.officials.find(o=>o.id===mentor.id).examStudents.length,7);assertState(n);
});
test('新进士未揭示派系不会进入正文名册与面谈上下文，揭示后才公开',async()=>{
 const {roster,talkMessages}=await import('../src/llm/prompts.js');let s=grading();const id=activeExam(s).id;s=publishExam(s,id);const o=s.court.officials.find(o=>o.keju);
 assert.ok(roster(s).split('\n').join('').includes(o.name));
 const row=roster(s).split('\n').find(row=>row.includes(o.id));assert.ok(row.includes('派系待察'));
 const messages=JSON.stringify(talkMessages(s,{person:o.id,turn:s.turn,line:'卿有何所长？',kind:'闲谈',cap:0,success:true},[]));assert.ok(messages.includes('待察'));
 o.keju.revealed.push('faction');assert.ok(!roster(s).split('\n').find(row=>row.includes(o.id)).includes('派系待察'));
});

test('真实请求通路只发一次九卷JSON，坏格式及服务失败不自动重试',async()=>{
 const {requestExamJSON}=await import('../src/ui/keju.js');const s=writing(),e=activeExam(s),data={candidates:mockExamPapers(e)};
 const config={key:'test-only',model:'mock',base:'http://127.0.0.1:58138'};let calls=0;
 const fetcher=async(_url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.messages.length,2);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{headers:{'content-type':'application/json'}});};
 const papers=await requestExamJSON(config,examPaperMessages(s,e),d=>validateExamPapers(d,e),{fetcher});assert.equal(calls,1);assert.equal(papers.length,9);
 calls=0;await assert.rejects(()=>requestExamJSON(config,examPaperMessages(s,e),d=>validateExamPapers(d,e),{fetcher:async()=>{calls++;return new Response('',{status:500});}}));assert.equal(calls,1);
 calls=0;await assert.rejects(()=>requestExamJSON(config,examPaperMessages(s,e),d=>validateExamPapers(d,e),{fetcher:async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:'{"candidates":[]}'}}]}),{headers:{'content-type':'application/json'}});}}));assert.equal(calls,1);assert.equal(activeExam(s).status,'writing');
});

test('文章请求只包含立场文笔及高低语气，师承只在评卷部分',()=>{
 const s=writing(),e=activeExam(s),c=e.candidates[0];
 const paper=JSON.parse(examPaperMessages(s,e)[1].content),essay=JSON.parse(examEssayMessages(e,c)[1].content);
 assert.deepEqual(Object.keys(paper).sort(),['grading','writing']);
 assert.deepEqual(Object.keys(paper.writing.candidates[0]).sort(),['ambitionTone','id','literary','stance']);
 assert.deepEqual(Object.keys(paper.grading).sort(),['blindGrading','candidates','examiner']);
 assert.deepEqual(paper.grading.candidates,e.candidates.map(c=>({id:c.id,priorMentor:c.priorMentor??null})));
 assert.deepEqual(Object.keys(essay).sort(),['ambitionTone','essaySummary','literary','stance','topic']);
 const forbidden=new Set(['hidden','ability','integrity','faction','ambition']);
 const walk=value=>{if(!value||typeof value!=='object')return;for(const [k,v]of Object.entries(value)){assert.ok(!forbidden.has(k),k);walk(v);}};
 walk(paper);walk(essay);
 const altered=structuredClone(e);for(const person of altered.candidates){person.hidden.ability=0;person.hidden.integrity=100;person.hidden.faction='different';}
 assert.deepEqual(examPaperMessages(s,altered),examPaperMessages(s,e));assert.deepEqual(examEssayMessages(altered,altered.candidates[0]),examEssayMessages(e,c));
 const changed=structuredClone(e);changed.candidates[0].priorMentor='o19';
 assert.deepEqual(JSON.parse(examPaperMessages(s,changed)[1].content).writing,paper.writing);
 assert.notDeepEqual(JSON.parse(examPaperMessages(s,changed)[1].content).grading,paper.grading);
 assert.deepEqual(examEssayMessages(changed,changed.candidates[0]),examEssayMessages(e,c));
 const tones=[20,21,90].map(ambition=>JSON.parse(examEssayMessages(e,{...c,hidden:{...c.hidden,ambition}})[1].content));
 assert.deepEqual(tones[0],tones[1]);assert.notEqual(tones[0].ambitionTone,tones[2].ambitionTone);
});
test('五字段卷宗接受无hidden，拒绝错号重复号、错立场、空文与坏拟次',()=>{
 const s=writing(),e=activeExam(s),data=()=>({candidates:mockExamPapers(e)});
 assert.doesNotThrow(()=>validateExamPapers(data(),e));
 const variants=[d=>{d.candidates[0].id='unknown';},d=>{d.candidates[1].id=d.candidates[0].id;},d=>{d.candidates[0].essayPosition='不符';},d=>{d.candidates[0].essaySummary='';},d=>{d.candidates[0].reviewerComment='';},d=>{d.candidates[0].reviewerSuggestedRank=1.5;},d=>{d.candidates[1].reviewerSuggestedRank=d.candidates[0].reviewerSuggestedRank;}];
 for(const change of variants){const d=data();change(d);assert.throws(()=>validateExamPapers(d,e));}
});
test('迟榜第48旬首次扣分、以后每12旬扣1，本届礼部只催办一次',()=>{
 let s=fresh();const id=activeExam(s).id;
 for(const turn of [36,37,47]){s.turn=turn;s=advanceExams(s);assert.equal(s.keju.scholarReputation,50);assert.equal(s.memorials.filter(m=>m.type==='科举催办').length,0);}
 s.turn=48;const before=JSON.stringify(s);const first=advanceExams(s);assert.equal(JSON.stringify(s),before);assert.equal(first.keju.scholarReputation,49);
 const m=first.memorials.find(m=>m.type==='科举催办');assert.ok(m.text.includes('48旬'));assert.equal(m.fromId,'o4');assert.equal(m.fromPost,'礼部尚书');
 assert.equal(first.ledger.at(-1).path,'keju.scholarReputation');assert.deepEqual(advanceExams(first),first);
 s=migrate(unpack(pack(first)).state);s=resolveMemorial(s,m.id,'opt0').state;s.turn=59;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);
 s.turn=60;s=advanceExams(s);assert.equal(s.keju.scholarReputation,48);assert.equal(s.memorials.filter(m=>m.type==='科举催办').length,0);assert.deepEqual(advanceExams(s),s);
 s.turn=72;s=advanceExams(s);assert.equal(s.keju.scholarReputation,47);assert.equal(s.threads.filter(t=>t.type==='科举催办').length,1);assertState(s);
 // The reminder remains per exam even after it expires or is resolved.
 assert.ok(s.receipts.includes('keju-reminder:'+id));
});
test('迟榜按开科时间计期，放榜后停止，声望不低于零且读档不追扣',()=>{
 let s=grading(),id=activeExam(s).id;activeExam(s).createdTurn=5;s.turn=48;assert.equal(advanceExams(s).keju.scholarReputation,50);
 s.turn=53;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);s=publishExam(s,id);const reputation=s.keju.scholarReputation;s.turn=65;s=advanceExams(s);assert.equal(s.keju.scholarReputation,reputation);
 const legacy=fresh();legacy.turn=100;const oldReputation=legacy.keju.scholarReputation;assert.equal(migrate(legacy).keju.scholarReputation,oldReputation);assert.equal(advanceExams(legacy).keju.scholarReputation,oldReputation);
 const zero=fresh();zero.keju.scholarReputation=0;zero.turn=48;const n=advanceExams(zero);assert.equal(n.keju.scholarReputation,0);assert.deepEqual(advanceExams(n),n);
});
test('糊名放榜不判偏私：免偏私扣分、额外派系加成和举子闹事',()=>{
 const blind=grading(),e=activeExam(blind);for(const c of e.candidates){c.origin='noble';c.hidden.faction=e.examinerFaction;c.priorMentor=e.examiner;}
 const open=setExamBlind(blind,e.id,false),a=publishExam(blind,e.id),b=publishExam(open,e.id);
 assert.equal(a.keju.exams[0].outcome.clients,3);assert.equal(a.keju.exams[0].outcome.biased,false);assert.equal(b.keju.exams[0].outcome.biased,true);
 assert.equal(a.keju.scholarReputation,47);assert.equal(b.keju.scholarReputation,42);assert.equal(a.keju.hooks.length,0);assert.equal(b.keju.hooks.length,1);
 const power=s=>s.court.factions.find(f=>f.id===e.examinerFaction).powerModifier;assert.equal(power(b)-power(a),1);
 assert.deepEqual(publishExam(a,e.id),a);assertState(a);assertState(b);
});

test('迟榜真实预演失败重试与提交只扣一次，不修改原档和原骰',()=>{
 const s=fresh('free');s.turn=47;s.revision=47;const before=JSON.stringify(s),f=forecastTurn(s);
 assert.equal(JSON.stringify(s),before);assert.equal(f.state.keju.scholarReputation,49);assert.equal(f.state.memorials.filter(m=>m.type==='科举催办').length,1);
 assert.ok(f.entries.some(e=>e.path==='keju.scholarReputation'&&e.delta===-1));
 const pending={...s,pending:{forecast:f}},restored=migrate(unpack(pack(pending)).state);
 assert.equal(restored.keju.scholarReputation,50);assert.equal(restored.pending.forecast.die,f.die);
 const n=commitTurn(restored,restored.pending.forecast,{});assert.equal(n.keju.scholarReputation,49);assert.equal(n.rng,f.state.rng);assert.deepEqual(commitTurn(n,f,{}),n);assert.deepEqual(advanceExams(n),n);
 assert.ok(kejuHTML(n).includes('每再满12旬士林声望减1'));assert.ok(kejuHTML(grading()).includes('放榜时仍糊名，不判门生偏私'));
});

function regencyFixture(s=fresh('free'),until=108) {
 const child={id:'keju-young-emperor',name:'萧景宁',sex:'男',born:until-16*36,health:90,aptitude:70,education:0,mother:'c0',fatherId:s.runId,faction:'f0'};
 s.harem.children=[child];s.reign.emperorId=child.id;s.emperor.name=child.name;s.emperor.age=15;s.regency={regentId:'o0',until};s.reign.married=false;
 for(const c of s.harem.consorts)c.retired=true;
 return s;
}
test('摄政期间不扣迟榜声望、不生成催办，也不改原档',()=>{
 let s=regencyFixture();
 for(const turn of [48,60,96]){s.turn=turn;const before=JSON.stringify(s),n=advanceExams(s);assert.equal(JSON.stringify(s),before);assert.deepEqual(n,s);assert.equal(n.keju.scholarReputation,50);assert.ok(!n.memorials.some(m=>m.type==='科举催办'));assert.ok(!n.receipts.some(r=>r.startsWith('keju-delay:')));}
 assert.ok(kejuHTML(s).includes('摄政期间暂停迟榜扣分与催办'));
});
test('亲政当旬重启36旬宽限，第48旬才首次扣分催办',()=>{
 let s=regencyFixture();s.turn=108;s=advanceRegency(advanceExams(s));assert.equal(s.regency,null);assert.equal(examGraceStart(s,activeExam(s)),108);assert.equal(s.keju.scholarReputation,50);
 for(const turn of [109,144,155]){s.turn=turn;s=advanceExams(s);assert.equal(s.keju.scholarReputation,50);assert.ok(!s.memorials.some(m=>m.type==='科举催办'));}
 s.turn=156;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);assert.equal(s.memorials.filter(m=>m.type==='科举催办').length,1);assert.ok(s.memorials.find(m=>m.type==='科举催办').text.includes('亲政后已过48旬'));assert.ok(kejuHTML(s).includes('亲政后已过48旬'));assert.deepEqual(advanceExams(s),s);
 s.turn=168;s=advanceExams(s);assert.equal(s.keju.scholarReputation,48);assert.equal(s.threads.filter(t=>t.type==='科举催办').length,1);assertState(s);
});
test('亲政新周期不与摄政前迟榜凭据冲突，本届催办仍只一次',()=>{
 let s=fresh('free');s.turn=48;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);
 s=regencyFixture(s);s.turn=60;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);
 s.turn=108;s=advanceRegency(s);s.turn=156;s=advanceExams(s);assert.equal(s.keju.scholarReputation,48);assert.equal(s.receipts.filter(r=>r.startsWith('keju-delay:')).length,2);assert.equal(s.threads.filter(t=>t.type==='科举催办').length,1);assert.deepEqual(advanceExams(s),s);
});
test('亲政回合的真实预演、失败重试与提交不扣分且保存当旬起点',()=>{
 const s=regencyFixture(fresh('free'),48);s.turn=47;s.revision=47;const before=JSON.stringify(s),f=forecastTurn(s);
 assert.equal(JSON.stringify(s),before);assert.equal(f.state.regency,null);assert.equal(f.state.keju.scholarReputation,50);assert.ok(!f.entries.some(e=>e.path==='keju.scholarReputation'));assert.ok(!f.state.memorials.some(m=>m.type==='科举催办'));assert.equal(examGraceStart(f.state,activeExam(f.state)),48);
 const pending={...s,pending:{forecast:f}},bytes=JSON.stringify(f),loaded=migrate(unpack(pack(pending)).state);assert.equal(JSON.stringify(loaded.pending.forecast),bytes);
 const n=commitTurn(loaded,loaded.pending.forecast,{});assert.equal(n.rng,f.state.rng);assert.equal(n.keju.scholarReputation,50);assert.equal(examGraceStart(n,activeExam(n)),48);assert.deepEqual(commitTurn(n,f,{}),n);
});
test('亲政计时持久保存，旧v22亲政事实可恢复起点且不补算原预演',()=>{
 let s=regencyFixture();s.turn=108;s=advanceRegency(s);const id=activeExam(s).id,legacy=structuredClone(s);
 s.facts=[];s=migrate(unpack(pack(s)).state);assert.equal(examGraceStart(s,activeExam(s)),108);s.turn=156;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);assert.deepEqual(advanceExams(migrate(unpack(pack(s)).state)),s);
 legacy.receipts=legacy.receipts.filter(r=>!r.startsWith('keju-grace:'));legacy.turn=156;let restored=migrate(legacy);assert.equal(examGraceStart(restored,activeExam(restored)),108);restored=advanceExams(restored);assert.equal(restored.keju.scholarReputation,49);assert.ok(restored.receipts.includes(examGraceReceipt(activeExam(restored),108)));
 restored.facts=[];restored.turn=168;restored=advanceExams(restored);assert.equal(restored.keju.scholarReputation,48);assert.equal(activeExam(restored).id,id);assertState(restored);
});
test('幼帝继位继承旧科场，摄政免罚、亲政后从当旬重新计时',()=>{
 let s=fresh('free');s.turn=72;s.harem.children=[{id:'keju-heir',name:'萧绍宁',sex:'男',born:0,health:90,aptitude:70,education:0,mother:'c0',fatherId:s.runId,faction:'f0'}];s.harem.heir='keju-heir';s.ending={type:'驾崩',cause:'寿终'};const id=activeExam(s).id;
 s=succeedEmperor(s);assert.ok(s.regency);s.turn=84;s=advanceExams(s);assert.equal(s.keju.scholarReputation,50);assert.ok(!s.memorials.some(m=>m.type==='科举催办'));
 s.turn=576;s=advanceRegency(advanceExams(s));assert.equal(s.regency,null);assert.equal(activeExam(s).id,id);assert.equal(examGraceStart(s,activeExam(s)),576);s.turn=624;s=advanceExams(s);assert.equal(s.keju.scholarReputation,49);assertState(s);
});
