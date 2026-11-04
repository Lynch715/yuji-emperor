import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,migrate,assertState,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn,validateSchedule} from '../src/core/turn.js';
import {diplomacy,diplomacyBlock,advanceCampaigns,foreignMonth,borderInvasions} from '../src/core/foreign.js';
import {resolveMemorial,expireMemorials} from '../src/core/events.js';
import {advanceTreaties,campaignTactic,openSettlement} from '../src/core/campaigns.js';
import {WAR_GOALS,campaignChoiceBlock} from '../src/core/campaign-rules.js';
import {cabinetDraft,proxyMemorial} from '../src/core/court.js';
import {turnFacts} from '../src/core/facts.js';
import {normalizeIntents} from '../src/core/intents.js';
import {turnMessages} from '../src/llm/prompts.js';
import {validateTurn} from '../src/llm/validate.js';
import {createSaveStore,pack} from '../src/store/save.js';
import {campaignsHTML,treatyHTML} from '../src/ui/campaigns.js';
import {memorialOptions,createMemorialSession,memorialAction} from '../src/ui/memorials.js';
import {availableMemorials} from '../src/ui/memorial-state.js';
import {scheduleEstimate,actionAvailability} from '../src/ui/view-model.js';

function fresh(seed='边事',goal='repel'){
 let s=initialTurn(createState({seed,freedom:'free'}));s.nation.treasury=1500;s.nation.grain=1500;
 s.court.officials.forEach(o=>{o.ambition=0;o.abilities.军=70;});s.emperor.prestige=80;
 s.foreign[0].power=50;s.foreign[0].status='冷淡';s.nation.army.frontiers[0].troops=150000;s.nation.army.frontiers[0].readiness=80;
 return diplomacy(s,{country:'w0',operation:'宣战',warGoal:goal,levyProvince:s.nation.provinces[1].id},20).state;
}
const war=s=>s.campaigns.at(-1);
const report=(s,stage)=>s.memorials.find(m=>m.campaignOrder?.stage===stage&&m.campaignOrder.warId===war(s).id);
function tick(s){s=structuredClone(s);s.turn++;s=expireMemorials(advanceCampaigns(s));assertState(s);return s;}
function finish(s){for(let i=0;i<9&&!war(s).done;i++)s=tick(s);assert.equal(war(s).done,true);return s;}
function sign(s,kind){const m=report(s,'treaty');assert.ok(m);return resolveMemorial(s,m.id,kind).state;}
const empty={朝:null,午:null,夜:null};
function order(s,m,id){return {...empty,朝:{kind:'批折',memorials:[m.id],decisions:{[m.id]:{option:id,remark:''}}}};}

test('三种战争目标分别决定成本、敌兵、战期与所需优势，纯函数不改输入',()=>{
 for(const [id,g] of Object.entries(WAR_GOALS)){
  const s=initialTurn(createState({seed:'备军-'+id}));s.nation.treasury=500;s.nation.grain=500;
  const before=structuredClone(s),n=diplomacy(s,{country:'w0',operation:'宣战',warGoal:id},20).state;
  assert.equal(n.nation.treasury,500-g.silver);assert.equal(n.nation.grain,500-g.grain);
  assert.equal(war(n).enemyTroops,g.enemy);assert.equal(war(n).warGoal,id);assert.doesNotThrow(()=>migrate(n));assert.deepEqual(s,before);
  assert.equal(scheduleEstimate({...s,schedule:{...empty,午:{kind:'外交',operation:'宣战',warGoal:id}}}).totals.treasury,-g.silver);
 }
 assert.throws(()=>diplomacy(fresh(),{country:'w1',operation:'宣战',warGoal:'虚构目标'},20),/目标/);
 assert.throws(()=>diplomacy(fresh(),{country:'w1',operation:'宣战',levyProvince:'不存在'},20),/筹粮/);
 const poor=fresh();poor.nation.treasury=30;assert.throws(()=>diplomacy(poor,{country:'w1',operation:'宣战',warGoal:'tribute'},20),/40/);
});
test('进击与坚守有真实伤亡和钱粮差异，命令只影响随后两轮且不增加骰数',()=>{
 const base=tick(fresh('进退')),m=report(base,'maneuver');assert.ok(m);
 const attack=resolveMemorial(base,m.id,'attack').state,defend=resolveMemorial(base,m.id,'defend').state;
 assert.equal(attack.nation.grain,base.nation.grain-6);assert.equal(defend.nation.treasury,base.nation.treasury-4);
 const a=tick(attack),d=tick(defend);assert.ok(a.nation.army.frontiers[0].troops<d.nation.army.frontiers[0].troops);
 assert.equal(a.rng,d.rng);assert.ok(campaignTactic(a.campaigns[0]));
 const end=tick(a);assert.equal(campaignTactic(end.campaigns[0]),null);assert.equal(end.campaigns[0].orders.length,1);
 assert.throws(()=>resolveMemorial(attack,m.id,'attack'),/不存在/);
});
test('抽调援军守恒，来源边境变弱；来源不足、已有战事及接收超额均不允许',()=>{
 const s=tick(fresh('援军')),m=report(s,'maneuver'),donor=s.nation.army.frontiers.find(b=>b.dir===m.campaignOrder.donor),before=structuredClone(s);
 const n=resolveMemorial(s,m.id,'reinforce').state;
 assert.equal(n.nation.army.frontiers[0].troops,s.nation.army.frontiers[0].troops+8000);
 const changed=n.nation.army.frontiers.find(b=>b.dir===donor.dir);assert.equal(changed.troops,donor.troops-8000);
 assert.equal(changed.readiness,donor.readiness-4);assert.equal(changed.threat,donor.threat+8);assert.deepEqual(s,before);
 for(const mutate of [s=>s.nation.army.frontiers.find(b=>b.dir===donor.dir).troops=10000,
  s=>s.campaigns.push({id:'other',dir:donor.dir,done:false}),s=>s.nation.army.frontiers[0].troops=999000]){
  const bad=structuredClone(s);mutate(bad);assert.throws(()=>resolveMemorial(bad,m.id,'reinforce'),/援军|已满/);
  assert.equal(memorialOptions(bad,m).find(o=>o.id==='reinforce').disabled,true);
 }
});
test('补给、地方征粮与收缩战线各有代价，筹粮州按真实ID受影响',()=>{
 let s=tick(fresh('粮道'));s=resolveMemorial(s,report(s,'maneuver').id,'defend').state;s=tick(tick(s));
 const m=report(s,'supply');assert.ok(m);const id=war(s).levyProvince,p=s.nation.provinces.find(p=>p.id===id);
 const paid=resolveMemorial(s,m.id,'supply').state,levied=resolveMemorial(s,m.id,'levy').state,contract=resolveMemorial(s,m.id,'contract').state;
 assert.equal(paid.nation.treasury,s.nation.treasury-8);assert.equal(paid.nation.grain,s.nation.grain-12);
 assert.equal(levied.nation.grain,s.nation.grain+10);assert.equal(levied.nation.provinces.find(p=>p.id===id).morale,p.morale-6);
 assert.equal(levied.nation.provinces.find(p=>p.id===id).disaster,p.disaster+3);
 const next=tick(contract);assert.equal(next.nation.treasury,contract.nation.treasury-2);assert.equal(next.nation.grain,contract.nation.grain-3);
});
test('及时批复能收到三阶段军报；末段可按现有战果提前议和，不虚增完整胜场',()=>{
 let s=tick(fresh('三段'));const stages=[];
 for(const [stage,id] of [['maneuver','defend'],['supply','supply']]){
  const m=report(s,stage);assert.ok(m);stages.push(stage);s=resolveMemorial(s,m.id,id).state;s=tick(tick(s));
 }
 const m=report(s,'finish');assert.ok(m);stages.push('finish');
 s=resolveMemorial(s,m.id,'negotiate').state;assert.equal(war(s).result,'议和');assert.equal(s.stats.warsWon,0);
 assert.equal(s.foreign[0].status,'停战待议');assert.ok(report(s,'treaty'));assert.deepEqual(stages,['maneuver','supply','finish']);
});
test('军事获胜后必须议约，没有自动赔款或朝贡；条约决定战争目标是否达成',()=>{
 let s=finish(fresh('胜而议'));assert.equal(war(s).result,'胜利');assert.equal(s.foreign[0].status,'停战待议');
 assert.equal(war(s).goalAchieved,false);assert.ok(!s.ledger.some(e=>e.source==='战役获胜'&&e.path==='nation.treasury'));
 assert.match(diplomacyBlock(s,{country:'w0',operation:'宣战'}),/议约/);
 const before=s.nation.treasury,peace=sign(s,'peace'),money=sign(s,'indemnity');
 assert.equal(peace.nation.treasury,before-6);assert.equal(money.nation.treasury,before+30);
 assert.equal(peace.foreign[0].treaty.truceUntil-peace.turn,18);assert.equal(money.foreign[0].treaty.truceUntil-money.turn,9);
 assert.ok(money.foreign[0].attitude<peace.foreign[0].attitude);assert.equal(war(peace).goalAchieved,true);
 const trade=finish(fresh('商路','market'));assert.equal(war(sign(trade,'market')).goalAchieved,true);assert.equal(war(sign(trade,'peace')).goalAchieved,false);
 const tribute=finish(fresh('称臣','tribute'));assert.equal(war(sign(tribute,'tribute')).goalAchieved,true);assert.equal(war(sign(tribute,'indemnity')).goalAchieved,false);
});
test('失利可赔银、输粮或自行撤退，零钱粮仍有可行出口',()=>{
 let s=fresh('败局');s.nation.army.frontiers[0].troops=6000;s=finish(s);assert.equal(war(s).result,'失利');
 const a=sign(s,'silver'),b=sign(s,'grain'),c=sign(s,'retreat');
 assert.equal(a.nation.treasury,s.nation.treasury-18);assert.equal(b.nation.grain,s.nation.grain-18);
 assert.equal(war(a).goalAchieved,false);assert.equal(war(b).goalAchieved,false);
 assert.ok(c.nation.army.frontiers[0].threat>a.nation.army.frontiers[0].threat);assert.equal(war(c).goalAchieved,false);
 const poor=structuredClone(s);poor.nation.treasury=0;poor.nation.grain=0;
 assert.throws(()=>sign(poor,'silver'),/不足/);assert.throws(()=>sign(poor,'grain'),/不足/);assert.doesNotThrow(()=>sign(poor,'retreat'));
});
test('驻军实际离开边军，每月供养只扣一次；到期归建，断饷则失约并损失兵员',()=>{
 const base=finish(fresh('驻军','tribute')),s=sign(base,'tribute'),front=s.nation.army.frontiers[0];
 assert.equal(front.troops,base.nation.army.frontiers[0].troops-3000);assert.equal(s.foreign[0].status,'朝贡');
 let paid=structuredClone(s);paid.turn+=3-paid.turn%3;paid=advanceTreaties(paid);
 assert.equal(paid.nation.treasury,s.nation.treasury-0.8);assert.equal(paid.nation.grain,s.nation.grain-1);assert.deepEqual(advanceTreaties(paid),paid);
 const expired=structuredClone(s);expired.turn=s.foreign[0].treaty.until+1;const returned=advanceTreaties(expired);
 assert.equal(returned.nation.army.frontiers[0].troops,front.troops+3000);assert.equal(returned.foreign[0].treaty.status,'expired');
 const poor=structuredClone(s);poor.turn+=3-poor.turn%3;poor.nation.treasury=0;const lost=advanceTreaties(poor);
 assert.equal(lost.foreign[0].treaty.status,'breached');assert.equal(lost.foreign[0].status,'冷淡');assert.equal(lost.nation.army.frontiers[0].troops,front.troops+2700);
 assert.ok(lost.nation.army.frontiers[0].threat>front.threat);assert.deepEqual(advanceTreaties(lost),lost);assert.doesNotThrow(()=>migrate(lost));
});
test('开市有真实季入及对手恢复；停战期背约须确认且旧协议终止',async()=>{
 const s=sign(finish(fresh('商约','market')),'market');assert.equal(s.foreign[0].trade.income,2);
 const {nationQuarter}=await import('../src/core/nation.js');const season=structuredClone(s);season.turn+=9;
 assert.ok(nationQuarter(season).ledger.some(e=>e.source==='季结：外邦互市岁入'&&e.delta===2));
 const month=structuredClone(s);month.turn+=3;assert.equal(advanceTreaties(month).foreign[0].power,s.foreign[0].power+0.4);
 assert.throws(()=>diplomacy(s,{country:'w0',operation:'宣战'},20),/确认/);
 const n=diplomacy(s,{country:'w0',operation:'宣战',confirmBreach:true},20).state;
 assert.equal(n.foreign[0].trade,null);assert.equal(n.foreign[0].treaty.status,'expired');
 assert.ok(n.foreign[0].attitude<s.foreign[0].attitude);assert.equal(n.emperor.virtue,s.emperor.virtue-5);
});
test('停战约定实际压低该国边患，同境邻国均守约时不触发入寇，期满恢复风险',()=>{
 const s=sign(finish(fresh('停战守约')),'peace');s.foreign=s.foreign.filter(f=>f.id==='w0');
 s.nation.army.frontiers[0].threat=100;s.nation.army.frontiers.slice(1).forEach(b=>b.threat=0);
 assert.equal(borderInvasions(s).stats.events,s.stats.events);assert.ok(foreignMonth(s).nation.army.frontiers[0].threat<100);
 const expired=structuredClone(s);expired.turn=s.foreign[0].treaty.truceUntil+1;
 assert.ok(borderInvasions(expired).stats.events>s.stats.events);
});
test('军报与议约再议不延期限，逾期会收缩或自行收兵且不能重复生效',()=>{
 let s=tick(fresh('期限'));const m=report(s,'maneuver'),due=m.due;
 s=resolveMemorial(s,m.id,'discuss').state;assert.equal(s.memorials.find(x=>x.id===m.id).due,due);
 s=tick(tick(s));assert.ok(!s.memorials.some(x=>x.id===m.id));assert.ok(s.ledger.some(e=>e.source.includes('军报逾期')));
 s=finish(s);const t=report(s,'treaty');s=resolveMemorial(s,t.id,'discuss').state;
 for(let i=0;i<4;i++)s=tick(s);
 assert.equal(war(s).settlement.kind,'retreat');assert.equal(s.foreign[0].status,'冷淡');assert.equal(report(s,'treaty'),undefined);
 const again=expireMemorials(s);assert.equal(again.emperor.prestige,s.emperor.prestige);
});
test('选项在御批、票拟、代批与执行入口都检查真实可用资源',()=>{
 let s=tick(fresh('入口校验'));const m=report(s,'maneuver');s.nation.treasury=0;s.nation.grain=0;
 const donor=s.nation.army.frontiers.find(b=>b.dir===m.campaignOrder.donor);donor.troops=1000;
 assert.ok(m.options.every(o=>campaignChoiceBlock(s,m,o)));assert.equal(cabinetDraft(s,m),null);
 const before=structuredClone(s);assert.throws(()=>resolveMemorial(s,m.id,'reinforce'),/援军/);assert.deepEqual(s,before);
 s.memorials=[m];assert.doesNotThrow(()=>proxyMemorial(s,{minister:s.court.officials[0],label:'留守代批'}));
});
test('新军令随预演保存，重试相同，提交幂等，跨档及过期提交仍拒绝',()=>{
 let s=tick(fresh('事务'));const m=report(s,'maneuver'),schedule=order(s,m,'reinforce'),before=structuredClone(s);
 const f=forecastTurn(s,schedule);assert.deepEqual(forecastTurn(s,schedule),f);assert.deepEqual(s,before);
 s.pending={forecast:f};const restored=migrate(s);assert.deepEqual(restored.pending.forecast,f);
 const n=commitTurn(restored,restored.pending.forecast,{});assert.deepEqual(commitTurn(n,f,{}),n);assert.equal(war(n).orders.length,1);
 assert.throws(()=>commitTurn(fresh('另局'),f,{}),/过期|不符/);
 const stale=structuredClone(s);stale.revision++;assert.throws(()=>commitTurn(stale,f,{}),/过期/);
});
test('战后条约的待续复用原裁决，只收一次赔款，并保存真实御批档案',()=>{
 const s=finish(fresh('条约待续')),m=report(s,'treaty'),schedule=order(s,m,'indemnity');
 const f=forecastTurn(s,schedule);assert.deepEqual(forecastTurn(s,schedule),f);
 const restored=migrate({...s,pending:{forecast:f}});assert.deepEqual(restored.pending.forecast,f);
 const n=commitTurn(restored,restored.pending.forecast,{});assert.equal(war(n).settlement.kind,'indemnity');
 assert.deepEqual(commitTurn(n,f,{}),n);assert.equal(n.history.at(-1).memorialReviews[0].decision,'索赔后撤军');
 assert.equal(n.history.at(-1).entries.filter(e=>e.source.includes('索赔后撤军')&&e.path==='nation.treasury').length,1);
});
test('朱批自由口谕先行议和时，收回过时军令，档案不冒记两次执行',()=>{
 const s=tick(fresh('军报口谕')),m=report(s,'maneuver'),schedule=order(s,m,'attack'),inputId='朝:remark:'+m.id;
 schedule.朝.decisions[m.id].remark='与朔庭议和，停止进军';
 const intents=normalizeIntents(s,[{inputId,type:'war',countryId:'w0',operation:'议和'}],[{id:inputId,slot:'朝',text:'与朔庭议和，停止进军'}]);
 const f=forecastTurn(s,schedule,intents);assert.equal(war(f.state).result,'议和');assert.equal(war(f.state).orders.length,0);
 assert.deepEqual(f.canceledMemorials,[m.id]);assert.equal(f.state.intentResults[0].status,'success');
 const n=commitTurn(s,f,{});assert.match(n.history.at(-1).memorialReviews[0].decision,/收回/);
 assert.ok(!n.history.at(-1).entries.some(e=>e.source.includes('限期进击')));assert.deepEqual(forecastTurn(s,schedule,intents),f);
});
test('亲征时可在军中批军报，仍不能批普通奏折或进行京中行动',()=>{
 let s=fresh('亲征军报');war(s).personal=true;s=tick(s);const m=report(s,'maneuver');
 assert.equal(actionAvailability(s,'批折'),'');assert.ok(availableMemorials(s).every(m=>m.campaignOrder));
 assert.doesNotThrow(()=>forecastTurn(s,order(s,m,'defend')));assert.match(actionAvailability(s,'外交'),/御驾/);
 const ordinary=s.memorials.find(m=>!m.campaignOrder);assert.ok(ordinary);
 assert.throws(()=>validateSchedule(s,order(s,ordinary,ordinary.options[0].id)),/亲征/);
});
test('v15旧战役按原规则结束，旧待续不改骰不改结果，v16只接管新开战役',()=>{
 const old=fresh('旧战役');old.v=15;const w=war(old);
 for(const key of ['campaignVersion','warGoal','started','levyProvince','commander','reportsIssued','orders','order','settlement','goalAchieved'])delete w[key];
 const raw=JSON.stringify(w),next=migrate(old);assert.equal(JSON.stringify(war(next)),raw);assert.equal(war(next).campaignVersion,undefined);
 const oldForecast=forecastTurn(old),pendingRaw=JSON.stringify(oldForecast);old.pending={forecast:oldForecast};
 const resumed=migrate(old);assert.equal(JSON.stringify(resumed.pending.forecast),pendingRaw);
 assert.equal(commitTurn(resumed,resumed.pending.forecast,{}).rng,oldForecast.state.rng);
 const result=finish(next);assert.equal(result.foreign[0].status,'朝贡');assert.ok(result.ledger.some(e=>e.source==='战役获胜'&&e.delta===20));
 assert.equal(result.memorials.some(m=>m.campaignOrder),false);
 const pending=JSON.parse(readFileSync('test/fixtures/v7-pending.json')),saved=JSON.stringify(pending.pending.forecast),up=migrate(pending);
 assert.equal(JSON.stringify(up.pending.forecast),saved);assert.equal(commitTurn(up,up.pending.forecast,{}).lastTurn.die,pending.pending.forecast.die);
});
test('18组种子跨三种目标与自由度走完战争和议约，刷新及后续供养可持续推进',()=>{
 for(let i=0;i<18;i++){
  let s=fresh('战役长期-'+i,Object.keys(WAR_GOALS)[i%3]);s.settings.freedom=['free','mid','real'][i%3];
  s.nation.army.frontiers[0].troops=25000+i*5000;
  for(let step=0;step<12&&!war(s).done;step++){
   const m=s.memorials.find(m=>m.campaignOrder?.stage!=='treaty'&&m.campaignOrder);
   const choices=m?.options.filter(o=>!campaignChoiceBlock(s,m,o)),choice=choices?.[(i+step)%choices.length];
   const f=forecastTurn(s,choice?order(s,m,choice.id):empty);s=commitTurn(s,f,{});s=migrate(s);assertState(s);
  }
  assert.equal(war(s).done,true);const m=report(s,'treaty'),choices=m.options.filter(o=>!campaignChoiceBlock(s,m,o));
  s=commitTurn(s,forecastTurn(s,order(s,m,choices[i%choices.length].id)),{});assert.equal(war(s).settlement.status,'signed');
  for(let j=0;j<12;j++){s=commitTurn(s,forecastTurn(s),{});assertState(migrate(s));}
 }
});
test('损坏战役与条约只读保护，不覆盖主档或副本',async()=>{
 const valid=sign(finish(fresh('坏档','tribute')),'tribute');assert.equal(migrate(valid).v,VERSION);
 for(const damage of [s=>war(s).warGoal='假的',s=>war(s).levyProvince='假的',s=>war(s).round=99,
  s=>s.foreign[0].treaty.garrison=-1,s=>s.foreign[0].treaty.warId='别份战役',s=>s.foreign[0].treaty.truceUntil=99999]){
  const bad=structuredClone(valid);damage(bad);const raw=pack(bad),primary=new Map([[1,raw]]),backup=new Map([['yuji:slot:1',JSON.stringify(raw)]]);
  const before=JSON.stringify([...primary,...backup]);const store=createSaveStore({primary:{get:async k=>primary.get(k),put:async(k,v)=>primary.set(k,v)},
   backup:{getItem:k=>backup.get(k),setItem:(k,v)=>backup.set(k,v)},validate:migrate});
  assert.equal((await store.load(1)).readOnly,true);await assert.rejects(()=>store.save(1,valid),/保护/);assert.equal(JSON.stringify([...primary,...backup]),before);
 }
});
test('新事实区分军胜、待议和正式条约，叙事请求只附本局军情，前端显示真实后续',()=>{
 const before=finish(fresh('事实','market')),after=sign(before,'market');const facts=turnFacts(before,after,empty,{朝:[],午:[],夜:[]});
 assert.ok(facts.some(f=>f.kind==='war'&&f.outcome.includes('以开市换停战')));
 const f=forecastTurn(after),wire=JSON.stringify(turnMessages(after,f));assert.match(wire,/现有条约/);assert.match(wire,/market/);
 assert.doesNotMatch(wire,/CAMPAIGN_CHOICES|WAR_GOALS/);
 const html=campaignsHTML(after)+treatyHTML(after,after.foreign[0]);assert.match(html,/打通商路/);assert.match(html,/原定目标已达成/);
 assert.match(html,/每季收入2万两/);assert.doesNotMatch(html,/undefined|NaN/);
 const pending=finish(fresh('待议'));assert.match(campaignsHTML(pending),/条款待定/);assert.match(campaignsHTML(pending),/批复议约/);
 const session=createMemorialSession(pending,'批折','朝',report(pending,'treaty').id);session.choices[session.ids[0]]='peace';
 assert.doesNotThrow(()=>memorialAction(pending,session));
});
test('真实调兵与驻军数量不会被误删，错误数量仍按对象拦截',()=>{
 const s=tick(fresh('军数校验')),m=report(s,'maneuver'),donor=m.campaignOrder.donor,f=forecastTurn(s,order(s,m,'reinforce'));
 const text=donor+'境调拨八千士卒，驰援前线。';
 const narration=chapter=>({chapter:{朝:chapter,午:'内侍静候旨意。',夜:'宫灯亮起。'},summary:'边事待议',hook:'',memorialTexts:[],reactions:[],rumors:[],ambitionEvidence:[],factUpdates:[]});
 assert.ok(validateTurn(narration(text),f).chapter.朝.includes(text));
 assert.ok(!validateTurn(narration(donor+'境调拨九千九百九十九士卒，驰援前线。'),f).chapter.朝.includes('九千九百九十九'));
 const base=finish(fresh('驻军数字','tribute')),terms=report(base,'treaty'),signed=forecastTurn(base,order(base,terms,'tribute'));
 const stationed='朝廷在朔庭留驻三千士卒，另支饷粮。';assert.ok(validateTurn(narration(stationed),signed).chapter.朝.includes(stationed));
 assert.ok(!validateTurn(narration('朝廷在朔庭留驻九千士卒，另支饷粮。'),signed).chapter.朝.includes('九千'));
});
