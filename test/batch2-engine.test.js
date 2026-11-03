import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createState,migrate,VERSION,reignId} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn,validateSchedule} from '../src/core/turn.js';
import * as events from '../src/core/events.js';
import {courtYear,courtDebate,appoint,banquet} from '../src/core/court.js';
import {generateCandidates,selectConsort,haremMonth,canVisit} from '../src/core/harem.js';
import {succeedEmperor} from '../src/core/succession.js';
import {goalMetric,selectAmbitions,evaluateAmbitions} from '../src/core/ambitions.js';
import {issueEdict,advanceProjects} from '../src/core/edicts.js';
import {nationQuarter} from '../src/core/nation.js';
import {diplomacy,foreignMonth,advanceCampaigns} from '../src/core/foreign.js';
import {applyWorld} from '../src/core/world.js';
import {roster} from '../src/llm/prompts.js';
import {validateTalk} from '../src/llm/validate.js';
import {pack,unpack,createSaveStore} from '../src/store/save.js';
const initial=(seed='批次2')=>initialTurn(createState({seed,name:'朱厚照',freedom:'real'}));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const empty=()=>({朝:null,午:null,夜:null});
const high=s=>{s.emperor.prestige=100;s.nation.governance=100;for(const o of s.court.officials){o.abilities.政=100;o.greed=0;}for(const f of s.court.factions)f.attitude=100;return s;};
function infant(){const s=initial('幼帝');s.turn=400;s.revision=400;s.harem.children=[{id:'infant',name:'朱景宁',sex:'男',born:400,health:90,aptitude:70,education:0,mother:'c0',fatherId:reignId(s),faction:'f0'}];s.harem.heir='infant';s.ending={type:'驾崩',cause:'寿终'};for(const m of s.memorials)m.due=s.turn+4;return s;}

test('B1 五十年十二州均有天灾且同季同州不重复，请赈只来自有灾州',()=>{
 let s=initial('五十年天灾'),hit=new Set(),seasons=new Set();
 assert.ok(s.memorials.every(m=>m.type!=='请赈'),'无灾开局不应请赈');
 for(let turn=3;turn<=1800;turn+=3){s.turn=turn;s.era.month=1+Math.floor(((turn-1)%36)/3);s=events.eventsMonth(s);
  for(const t of s.threads.filter(t=>t.born===turn&&t.type==='天灾')){assert.ok(t.provinceId);const key=Math.floor((turn-1)/9)+':'+t.provinceId;assert.ok(!seasons.has(key));seasons.add(key);hit.add(t.provinceId);}
  s=events.seedMemorials(s);for(const m of s.memorials.filter(m=>m.id.startsWith('routine-'+turn+'-')&&m.type==='请赈'))assert.ok(s.nation.provinces.find(p=>p.id===m.provinceId)?.disaster>0);
  s.memorials=[];
 }
 console.log('B1 五十年各州天灾 '+JSON.stringify(Object.fromEntries(s.nation.provinces.map(p=>[p.name,[...seasons].filter(k=>k.endsWith(':'+p.id)).length]))));
 assert.equal(hit.size,12);assert.deepEqual(events.eventsMonth(initial('复现')),events.eventsMonth(initial('复现')));
});

test('B2 上奏人按衙门和州选取且朱批按ID区分同名官员',()=>{
 assert.equal(typeof events.pickMemorialist,'function');let s=initial();s.emperor.prestige=100;
 const p=s.court.posts.find(p=>p.provinceId==='z0');s=appoint(s,{post:p.id,person:'o13',operation:'appoint'}).state;
 assert.equal(events.pickMemorialist(s,'请赈','z0').fromId,'o13');
 const money=s.court.posts.find(p=>p.title==='户部尚书').holder;
 s.court.officials.find(o=>o.id==='o13').jailed=true;
 assert.equal(events.pickMemorialist(s,'钱粮','z0').fromId,money);
 for(const o of s.court.officials){o.alive=false;o.post=null;}for(const p of s.court.posts)p.holder=null;
 assert.deepEqual(events.pickMemorialist(s,'言官',null),{from:'通政司',fromId:null});
 s=initial();s.court.officials[1].name=s.court.officials[0].name;s.memorials=[{...s.memorials[0],from:s.court.officials[0].name,fromId:'o1'}];
 const n=events.resolveMemorial(s,s.memorials[0].id,'remark','勤勉可嘉').state;assert.equal(n.court.officials[1].favor,s.court.officials[1].favor+2);assert.equal(n.court.officials[0].favor,s.court.officials[0].favor);
});

test('B2 两百年每本新奏报署名均在世在任未下狱或为通政司',()=>{
 let s=initial('上奏人两百年'),checked=0;s.settings.freedom='free';s.emperor.lifespan=400;
 for(let i=0;i<7200;i++){
  s.history=[];s.volumes=[];s.ledger=[];
  const f=forecastTurn(s);for(const m of f.newMemorials){checked++;
   if(m.from==='通政司'){assert.equal(m.fromId,null);continue;}
   const o=f.state.court.officials.find(o=>o.id===m.fromId);assert.ok(o&&o.alive&&o.health>0&&!o.jailed&&!o.retired,m.title+':'+m.from);
   assert.ok(f.state.court.posts.some(p=>p.holder===o.id&&p.id===o.post));
   assert.ok(o.inCapital!==false||f.state.court.posts.some(p=>p.holder===o.id&&p.provinceId===m.provinceId));
  }
  s=commitTurn(s,f,{});
 }
 console.log('B2 两百年上奏人逐本核验 '+checked+' 本');
});

test('B3 全局uniqueName可复现且跨在世名册去重，历届秀女属性随机',async()=>{
 let s=initial();const mod=await import('../src/core/names.js');assert.equal(typeof mod.uniqueName,'function');
 const r=mod.uniqueName(s,[s.court.officials[0].name,s.harem.consorts[0].name,'全新姓名']);assert.equal(r.name,'全新姓名');assert.equal(hash(s),hash(initial()));
 s=selectConsort(s,s.harem.candidates[0].id);const old=s.harem.candidates.map(c=>c.name);s.turn=108;s.era.year=4;s=generateCandidates(s);
 assert.notDeepEqual(s.harem.candidates.map(c=>c.name),old);assert.ok(new Set(s.harem.candidates.map(c=>c.name)).size===s.harem.candidates.length);
 assert.ok(!s.harem.candidates.some(c=>s.harem.consorts.some(o=>o.health>0&&o.name===c.name)));
 assert.ok(new Set(s.harem.candidates.map(c=>c.family)).size>1);assert.deepEqual(generateCandidates(s),s);
});

test('B4 皇嗣旁支继位用皇姓且无数字，科举长期不重名',()=>{
 let s=initial('姓名长局');s.harem.consorts.forEach(c=>c.ambition=0);
 for(let i=0;i<30;i++){s.turn=i*33+30;s.harem.consorts[0].preg={due:s.turn,conceived:s.turn-30,fatherId:reignId(s)};s=haremMonth(s);}
 assert.ok(s.harem.children.every(c=>c.name.startsWith('朱')&&!/\d/.test(c.name)));assert.equal(new Set(s.harem.children.map(c=>c.name)).size,30);
 s=initial();for(let year=1;year<=75;year+=3){s.turn=(year-1)*36;for(const o of s.court.officials){o.alive=false;o.post=null;}s=courtYear(s);}
 const names=s.court.officials.map(o=>o.name);assert.equal(new Set(names).size,names.length);
 const previousNames=new Set([...s.court.officials,...s.harem.consorts,...s.harem.children].map(p=>p.name));
 s.harem.children=[];s.ending={type:'驾崩'};s=succeedEmperor(s);assert.ok(s.harem.consorts.filter(c=>!c.retired).every(c=>!previousNames.has(c.name)));assert.ok(s.emperor.name.startsWith('朱'));assert.ok(!/\d/.test(s.emperor.name));
});

test('B5 婴儿继位摄政且不生成后宫，十六岁亲政大婚后才有新妃',()=>{
 let s=succeedEmperor(infant());assert.ok(s.regency);assert.equal(s.emperor.age,0);assert.ok(Object.values(s.emperor.talents).every(v=>v===0));assert.ok(!s.harem.consorts.some(c=>!c.retired));
 assert.throws(()=>validateSchedule(s,{...empty(),朝:{kind:'上朝'}}),/摄政/);assert.throws(()=>validateSchedule(s,{...empty(),夜:{kind:'私下行事',operation:'收买',person:'o0'}}),/摄政/);
 assert.equal(validateSchedule(s,{...empty(),朝:{kind:'私下行事',operation:'经筵'}}),true);
 const f=forecastTurn(s,{...empty(),朝:{kind:'私下行事',operation:'经筵'}});assert.ok(f.notes.some(n=>n.includes('摄政')&&n.includes('代批')));assert.ok(f.state.stats.petitions>s.stats.petitions);
 s=commitTurn(s,f,{});s.settings.freedom='free';s.emperor.lifespan=100;
 while(s.regency){s.history=[];s.volumes=[];s.ledger=[];s=commitTurn(s,forecastTurn(s),{});assert.ok(s.turn<=400+16*36);}
 assert.equal(s.emperor.age,16);assert.ok(s.facts.some(f=>f.key==='亲政'));assert.ok(s.facts.some(f=>f.key==='大婚'));
 assert.equal(s.harem.consorts.filter(c=>!c.retired&&c.reignId===reignId(s)).length,3);assert.ok(Object.values(s.emperor.talents).every(v=>v>0));
});

test('B6 宏愿按本朝时间子嗣宠爱计算，继位重掷并封存旧愿且凭据分朝',()=>{
 let s=infant();s=selectAmbitions(s,['wealth','peace','health','family']);const previous=structuredClone(s.ambitions);s=succeedEmperor(s);
 assert.equal(goalMetric(s,'reignYears'),0);assert.equal(goalMetric(s,'children'),0);assert.equal(goalMetric(s,'maxFavor'),0);
 assert.ok(s.chronicles.at(-1).ambitions);assert.deepEqual(s.chronicles.at(-1).ambitions,previous);assert.equal(s.ambitions.length,4);assert.ok(s.ambitions.every(a=>a.status==='进行中'&&a.progress===0));
 s=selectAmbitions(s,['wealth','peace','health','family']);s.nation.treasury=1000;s.nation.morale=100;s.nation.governance=100;s=evaluateAmbitions(s);
 assert.ok(s.receipts.includes('goal:'+reignId(s)+':wealth'));const again=evaluateAmbitions(s);assert.equal(again.emperor.prestige,s.emperor.prestige);
});

test('B7 封驳退钱粮，阳奉阴违记侵吞，同类在途及完工后六旬禁止重复',()=>{
 let s=initial();s.emperor.prestige=0;s.nation.governance=0;s.court.officials.forEach(o=>{o.abilities.政=0;o.greed=100;});
 const no=issueEdict(s,{edictType:'赈灾'},1);assert.equal(no.execution.tier,4);assert.equal(no.state.nation.treasury,s.nation.treasury);assert.equal(no.state.nation.grain,s.nation.grain);assert.match(no.note,/内阁封还/);
 s=high(initial());const r=issueEdict(s,{edictType:'修河'},20);assert.throws(()=>issueEdict(r.state,{edictType:'修河'},20),/在途|冷却/);
 let done={...r.state,turn:r.state.projects[0].end};done=advanceProjects(done);assert.throws(()=>issueEdict(done,{edictType:'修河'},20),/冷却/);done.turn+=6;assert.doesNotThrow(()=>issueEdict(done,{edictType:'修河'},20));
 s=initial();s.emperor.prestige=30;s.nation.governance=30;for(const o of s.court.officials){o.abilities.政=50;o.greed=0;}for(const f of s.court.factions)f.attitude=50;
 const diverted=issueEdict(s,{edictType:'修河'},11);assert.equal(diverted.execution.tier,3);assert.match(diverted.note,/截留侵吞/);assert.equal(diverted.state.nation.treasury,s.nation.treasury-60);assert.equal(diverted.state.projects[0].execRate,0.3);
});

test('B7 减赋加税由季结真实收税，目标州冷却隔离且政策到期停止',()=>{
 const base=high(initial());base.turn=9;const relief=issueEdict(base,{edictType:'减赋',province:'z0'},20);relief.state.turn=relief.state.projects[0].end;
 let s=advanceProjects(relief.state);assert.equal(s.nation.provinces[0].taxRelief.factor,0.8);
 const plain=structuredClone(s);plain.nation.provinces[0].taxRelief=null;assert.ok(nationQuarter(s).stats.income<nationQuarter(plain).stats.income);
 const tax=issueEdict(base,{edictType:'加税',province:'z0'},20);assert.equal(tax.state.nation.treasury,base.nation.treasury);tax.state.turn=tax.state.projects[0].end;s=advanceProjects(tax.state);
 const before=s.nation.provinces[0].morale;const n=nationQuarter(s);assert.equal(n.nation.provinces[0].morale,before-2);assert.equal(s.nation.provinces[0].taxSurge.factor,1.2);
 s.turn=(s.nation.provinces[0].taxSurge.untilQuarter+1)*9;const expired=nationQuarter(s);assert.equal(expired.nation.morale,s.nation.morale);
 const aid=issueEdict(base,{edictType:'赈灾',province:'z0'},20).state;assert.doesNotThrow(()=>issueEdict(aid,{edictType:'赈灾',province:'z1'},20));
});

test('B8 交战只允许议和接见，宣战绑定方向且背盟需二次确认和惩罚',()=>{
 let s=initial();s.foreign[1].frontier='西';s=diplomacy(s,{country:'w1',operation:'宣战'},20).state;assert.equal(s.campaigns[0].dir,'西');
 for(const operation of ['互市','册封','索贡','遣使','和亲','宣战'])assert.throws(()=>diplomacy(s,{country:'w1',operation},20),/交战/);
 assert.equal(diplomacy(s,{country:'w1',operation:'接见'},20).state.foreign[1].status,'交战');assert.doesNotThrow(()=>diplomacy(s,{country:'w1',operation:'议和'},20));
 s=initial();s.foreign[0].status='婚盟';assert.throws(()=>diplomacy(s,{country:'w0',operation:'宣战'},20),/确认/);
 const n=diplomacy(s,{country:'w0',operation:'宣战',confirmBreach:true},20).state;assert.equal(n.emperor.prestige,s.emperor.prestige-5);assert.equal(n.emperor.virtue,s.emperor.virtue-5);
 const invalid=initial();invalid.foreign[0].frontier='不存在';assert.throws(()=>diplomacy(invalid,{country:'w0',operation:'宣战'},20),/边境/);
});

test('B8 边患随对应外邦国力态度变化且可下降，同等实力战役胜率40至60%',()=>{
 let a=initial();a.foreign.forEach(f=>{f.power=20;f.attitude=100;f.status='婚盟';});let b=structuredClone(a);b.foreign.forEach(f=>{f.power=90;f.attitude=0;});
 const good=foreignMonth(a),bad=foreignMonth(b);assert.ok(good.nation.army.frontiers.every((f,i)=>f.threat<a.nation.army.frontiers[i].threat));assert.ok(bad.nation.army.frontiers.every((f,i)=>f.threat>good.nation.army.frontiers[i].threat));
 let wins=0;for(let i=0;i<400;i++){let s=initial('同等战役'+i);s.foreign[0].power=42;s.foreign[0].frontier='北';s.court.officials.forEach(o=>o.abilities.军=50);s=diplomacy(s,{country:'w0',operation:'宣战'},20).state;const before=s.campaigns[0].enemyReadiness;s=advanceCampaigns(s);assert.notEqual(s.campaigns[0].enemyReadiness,before);while(!s.campaigns[0].done)s=advanceCampaigns(s);wins+=s.campaigns[0].result==='胜利';}
 assert.ok(wins/400>=0.4&&wins/400<=0.6,'同等胜率 '+wins+'/400');console.log('B8 同等实力胜率 '+wins+'/400');
});

test('B9 留守代批执行真实效果并结束线程，最多两本不静默删除',()=>{
 let s=initial();s.emperor.prestige=30;s.memorials=[];s.threads=[];
 for(let i=0;i<3;i++){s=events.addEvent(s,'贪腐','留守案件'+i,'核查',[{label:'严查',effects:{treasury:-10,governance:5}},{label:'放任',effects:{governance:-3}}]);}
 s=diplomacy(s,{country:'w0',operation:'宣战',personal:true,regent:'o0'},20).state;const before=structuredClone(s);const n=advanceCampaigns(s),removed=before.memorials.filter(m=>!n.memorials.some(x=>x.id===m.id));
 assert.equal(removed.length,2);assert.ok(removed.every(m=>n.threads.find(t=>t.id===m.threadId).stage==='结束'));assert.ok(n.ledger.some(e=>e.source.includes('沈守正留守代批')));assert.equal(n.stats.petitions,before.stats.petitions+2);
});

test('B10 起用清除处分残留，空职处分报错，巡抚同步且宴请须在京',()=>{
 let s=initial();s.emperor.prestige=100;assert.throws(()=>appoint(s,{post:'p29',operation:'remove'}),/此职空缺/);
 s.court.officials[1].jailed=true;assert.throws(()=>appoint(s,{post:'p1',person:'o1',operation:'appoint'}),/赦免/);
 let n=appoint(s,{post:'p1',person:'o1',operation:'appoint',pardon:true}).state;assert.equal(n.court.officials[1].jailed,false);
 n.court.officials[1].retired=true;n=appoint(n,{post:'p29',person:'o1',operation:'appoint'}).state;assert.equal(n.court.officials[1].retired,false);assert.equal(n.nation.provinces[0].governor,'o1');assert.equal(n.court.officials[1].inCapital,false);
 assert.throws(()=>banquet(n,{guests:['o0','o1']}),/在京/);n=appoint(n,{post:'p29',operation:'remove'}).state;assert.equal(n.nation.provinces[0].governor,null);
});

test('B16 逾年改元且年月季按全局历法，选秀科举三年同基准',()=>{
 let s=infant();s.harem.children[0].born=-500;s.turn=50;s.revision=50;s.era={name:'旧年号',year:2,month:5,xun:2,startTurn:0};s=succeedEmperor(s);
 assert.equal(s.era.name,'旧年号');assert.equal(s.era.year,2);const newName=s.reign.eraName;assert.ok(newName);
 s.settings.freedom='free';while(s.turn<72){s.history=[];s.volumes=[];s=commitTurn(s,forecastTurn(s),{});}
 assert.equal(s.era.name,newName);assert.equal(s.era.year,1);assert.equal(s.era.month,1);assert.equal(s.era.startTurn,72);
 s.turn=108;s.era.year=2;s.harem.selectionYear=0;assert.doesNotThrow(()=>generateCandidates(s));assert.ok(courtYear(s).court.officials.length>s.court.officials.length);
});

test('B17 铸世州名与职位provinceId一一关联并同步巡抚标题',()=>{
 const s=initial();assert.equal(s.court.posts.filter(p=>p.provinceId).length,12);
 const n=applyWorld(s,{provinces:s.nation.provinces.map((p,i)=>({name:'新州'+i}))});
 for(const p of n.court.posts.filter(p=>p.provinceId))assert.equal(p.title,n.nation.provinces.find(z=>z.id===p.provinceId).name+'巡抚');
 assert.notEqual(s.court.posts.find(p=>p.provinceId).title,n.court.posts.find(p=>p.provinceId).title);
});

test('v5迁移 v1至v4补字段但旧pending逐字保留，读入提交幂等且不重掷',()=>{
 const old=JSON.parse(readFileSync('test/fixtures/v4-pending.json'));for(const v of [1,2,3,4]){
  const s=structuredClone(old);s.v=v;delete s.imperialSurname;delete s.regency;delete s.era.startTurn;
  for(const p of s.court.posts)delete p.provinceId;for(const p of s.nation.provinces){delete p.taxRelief;delete p.taxSurge;}for(const f of s.foreign)delete f.frontier;
  s.pending.forecast.state.v=v;
  if(v<3){delete s.reign;delete s.pending.forecast.state.reign;for(const state of [s,s.pending.forecast.state])for(const o of state.court.officials){delete o.abilities.权谋;delete o.inCapital;}}
  if(v<4)for(const state of [s,s.pending.forecast.state])for(const p of state.nation.provinces){delete p.rebellion;delete p.rebellionQuarter;}
  const before=hash(s),pendingHash=hash(s.pending.forecast),n=migrate(unpack(pack(s)).state);
  assert.equal(n.v,VERSION);assert.equal(n.imperialSurname,'朱');assert.equal(n.regency,null);assert.ok(n.nation.provinces.every(p=>p.taxRelief===null&&p.taxSurge===null));assert.ok(n.foreign.every(f=>['北','西','南','东'].includes(f.frontier)));assert.equal(n.era.startTurn,0);assert.equal(n.court.posts.filter(p=>p.provinceId).length,12);
  assert.equal(hash(s),before);assert.equal(n.rng,s.rng);assert.equal(hash(n.pending.forecast),pendingHash);
  const committed=commitTurn(n,n.pending.forecast,{});assert.equal(committed.v,VERSION);assert.equal(committed.turn,1);assert.equal(committed.lastTurn.die,s.pending.forecast.die);assert.equal(hash(n.pending.forecast),pendingHash);assert.deepEqual(commitTurn(committed,n.pending.forecast,{}),committed);assert.equal(migrate(unpack(pack(n)).state).rng,n.rng);
 }
 const baby=infant();baby.v=4;baby.emperor.age=0;delete baby.regency;assert.ok(migrate(baby).regency);
});

test('B11补 未允只删除计量数字与承诺句，普通一心十分万望原样保留',()=>{
 const s=initial(),result={success:false,denied:false,reply:'臣有难处，此事尚难奉行。',innerThought:'',die:10};
 const line='臣一心为国，此事十分为难，万望陛下体察。';assert.equal(validateTalk({reply:line},result,s).reply,line);
 assert.equal(validateTalk({reply:'臣即刻拨银五十万两。'+line},result,s).reply,line);
 assert.equal(validateTalk({reply:'臣手下兵卒五十人，粮储三十石。'+line},result,s).reply,line);
});

test('B13补 名册只列health大于0皇嗣，已故皇嗣与先帝不入册',()=>{
 const s=initial();s.harem.children=[{id:'dead',name:'朱已故',health:0},{id:'live',name:'朱在世',health:90},{id:'old-emperor',name:'朱先帝',health:0}];s.reign.emperorId='live';s.emperor.name='朱在世';
 const text=roster(s);assert.ok(text.includes('朱在世'));assert.ok(!text.includes('朱已故'));assert.ok(!text.includes('朱先帝'));
});

test('v5迁移 损坏字段进入只读保护，保留原主档与副本',async()=>{
 const old=JSON.parse(readFileSync('test/fixtures/v4-pending.json'));old.foreign[0].frontier='错误方向';
 const raw=pack(old),p=new Map([[1,raw]]),b=new Map([['yuji:slot:1',JSON.stringify(raw)]]);
 const before=JSON.stringify([...p,...b]);const store=createSaveStore({primary:{get:async k=>p.get(k),put:async(k,v)=>p.set(k,v)},backup:{getItem:k=>b.get(k),setItem:(k,v)=>b.set(k,v)},validate:migrate});
 const loaded=await store.load(1);assert.equal(loaded.readOnly,true);await assert.rejects(()=>store.save(1,initial()),/保护/);assert.equal(JSON.stringify([...p,...b]),before);
});

test('B5 B8 界面与排程入口执行摄政和交战限制，背盟确认不可省略',async()=>{
 const {actionAvailability}=await import('../src/ui/view-model.js');const {renderApp}=await import('../src/ui/render.js');
 const baby=succeedEmperor(infant());assert.match(actionAvailability(baby,'下旨'),/摄政/);assert.equal(actionAvailability(baby,'私下行事'),'');assert.match(renderApp(baby),/幼帝摄政/);
 const war=diplomacy(initial(),{country:'w0',operation:'宣战'},20).state;
 assert.throws(()=>validateSchedule(war,{...empty(),午:{kind:'外交',country:'w0',operation:'互市'}}),/交战/);
 const ally=initial();ally.foreign[0].status='婚盟';assert.throws(()=>validateSchedule(ally,{...empty(),午:{kind:'外交',country:'w0',operation:'宣战'}}),/确认/);
});

test('B4 旧朝记录优先恢复皇姓，不追改旧人物名字',()=>{
 const s=initial();s.v=4;delete s.imperialSurname;s.emperor.name='萧景宁';s.chronicles=[{id:s.runId,dynastyId:s.runId,emperor:'朱厚照'}];
 const before=hash(s.harem);const n=migrate(s);assert.equal(n.imperialSurname,'朱');assert.equal(hash(s.harem),before);
});

test('B3 B4 铸世人名也与皇帝及既有人物去重，同年科举不可重复生成ID',()=>{
 const s=initial();const n=applyWorld(s,{officials:[{name:s.emperor.name}],consorts:[{name:s.emperor.name}]});assert.notEqual(n.court.officials[0].name,s.emperor.name);assert.notEqual(n.harem.consorts[0].name,s.emperor.name);
 const exam=courtYear(s),again=courtYear(exam);assert.equal(new Set(again.court.officials.map(o=>o.id)).size,again.court.officials.length);
});

test('B11补 标点不被当作数字，人才等普通名词保留',()=>{
 const s=initial(),result={success:false,reply:'臣有难处，此事尚难奉行。',innerThought:'',die:10};
 const line='臣实在为难，人才凋敝，还须从长计议。';assert.equal(validateTalk({reply:line},result,s).reply,line);
});

test('B5 旧幼帝迁移退休旧妃并按生日确定亲政期限，摄政选择权谋最高者',()=>{
 let s=infant();s.v=4;s.emperor.age=0;s.reign.emperorId='infant';s.harem.children[0].born=399;delete s.regency;
 const n=migrate(s);assert.equal(n.regency.until,399+16*36);assert.equal(n.reign.married,false);assert.ok(n.harem.consorts.every(c=>c.retired));
 s=infant();s.court.officials[0].abilities.权谋=100;s.harem.consorts[0].scheming=20;const next=succeedEmperor(s);assert.equal(next.regency.regentId,'o0');
});
