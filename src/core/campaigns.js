import { clone } from './state.js';
import { applyPackage, clamp } from './effects.js';
import { WAR_GOALS, CAMPAIGN_TACTICS, campaignChoiceBlock } from './campaign-rules.js';
const eligible=o=>o&&o.alive&&o.health>0&&!o.jailed&&!o.retired;
const borderOf=(s,w)=>s.nation.army.frontiers.find(b=>b.dir===w.dir);
function troopChange(s,b,delta,source){
 const before=b.troops;b.troops=clamp(before+delta,0,1000000);
 if(b.troops!==before)s.ledger.push({turn:s.turn,path:'nation.army.frontiers.'+s.nation.army.frontiers.indexOf(b)+'.troops',
  before,after:b.troops,delta:b.troops-before,source});
}
export function campaignCommander(s,dir){
 const candidates=['兵部尚书',dir+'境总兵'].map(title=>{
  const p=s.court.posts.find(p=>p.title===title);return s.court.officials.find(o=>o.id===p?.holder&&o.post===p?.id&&eligible(o));
 }).filter(Boolean);
 return candidates.sort((a,b)=>b.abilities.军-a.abilities.军)[0]||null;
}
export function newCampaign(s,country,action){
 if(!Object.hasOwn(WAR_GOALS,action.warGoal||'repel'))throw new Error('请选择有效的战争目标');
 const province=action.levyProvince?s.nation.provinces.find(p=>p.id===action.levyProvince):[...s.nation.provinces].sort((a,b)=>b.pop-a.pop)[0];
 if(!province)throw new Error('请选择现有筹粮州');
 return {campaignVersion:1,warGoal:action.warGoal||'repel',started:s.turn,levyProvince:province.id,
  commander:campaignCommander(s,country.frontier)?.id||null,reportsIssued:0,orders:[],order:null,settlement:null,goalAchieved:false};
}
export function campaignTactic(w){return w.campaignVersion===1&&w.order&&w.round<w.order.untilRound?CAMPAIGN_TACTICS[w.order.id]:null;}
function petition(s,w,stage,options,fallback,request,donor=null){
 const country=s.foreign.find(f=>f.id===w.country),author=campaignCommander(s,w.dir);
 const title=country.name+' · '+({maneuver:'前线请定进止',supply:'行营请议粮饷',finish:'战局请定攻守',treaty:'战后议约'}[stage]);
 const details={
  maneuver:'一线守军与后方留守各有职责。若调邻境兵马来援，原来的关防便要少一支力量；若令本部继续进军，粮饷与伤亡也须有接续的准备。行营请明确进击或固守的办法，免得军中一面催兵、一面等饷。臣不敢因一时争胜，擅将别处兵力尽数抽走，伏候圣裁。',
  supply:'行营的钱粮从何处筹措，牵动军中与地方。由国库拨付，可以免扰百姓，却要挤占其他用度；向地方征粮，眼前容易凑办，往后赋税与收成便须多加顾惜。若两头都难支应，只能收缩战线，减少军中消耗，但原定战期不会因此延长。请陛下权衡眼前战事与地方生计，定下筹办之法。',
  finish:'用兵至此，继续争胜与保全兵力，各有一番道理。增拨钱粮催军进击，可能争得更大优势，也须承担更多伤亡；让军中巩固现有战果，可以少损将士，却可能错过进取的机会。若以当前战果遣使交涉，须另议收兵条款，不能把一时停火当作诸事已定。军中请旨之后再行，不敢擅定朝廷的战和大计。',
  treaty:w.result==='胜利'?'战场获胜，收兵未必事事皆了。索取赔款能解眼前之急，却未必能换来长久安稳；开市有利于钱粮，也会让对方休养；若留兵督贡，日后饷粮仍须朝廷按月供给。行营请把停战期限与后续供养一并定下，免得战场上虽已停手，关外仍无可遵的约定。所议条款请候陛下裁可后，再发国书办理。':
   '此次未能以全胜收局，眼下先要决定如何收兵。付银与交粮，占用的是不同家底，须留够国内俸饷与赈济；若不议条件便径自撤军，虽可省下眼前钱粮，却不能指望对方守住停战之约。后续守边仍需可用兵马，不能只求一时息事。请陛下核看各项条件，定下可以承担的办法，再令行营与使臣照旨办理。',
 };
 const text=request+'\n'+details[stage];
 s.memorials.unshift({id:'campaign-'+w.id+'-'+stage,title,type:stage==='treaty'?'战后议约':'战中军报',
  from:author?.name||'兵部',fromId:author?.id||null,...(author?{fromPost:s.postNames?.[author.post]||s.court.posts.find(p=>p.id===author.post)?.title||'行营',fromRole:'上奏'}:{}),provinceId:null,request,text,options,urgent:true,secret:false,
  threadId:null,due:s.turn+(stage==='treaty'?3:1),campaignOrder:{warId:w.id,stage,fallback,...(donor?{donor}:{})}});
}
const option=(id,label,consequence,effects={})=>({id,label,consequence,effects});
export function campaignReport(state,id){
 const s=clone(state),w=s.campaigns.find(w=>w.id===id);
 if(!w||w.campaignVersion!==1||w.done||w.reportsIssued>=3||w.round<1+w.reportsIssued*2||s.memorials.some(m=>m.campaignOrder?.warId===id))return s;
 const stage=['maneuver','supply','finish'][w.reportsIssued],province=s.nation.provinces.find(p=>p.id===w.levyProvince);
 let choices,donor;
 if(stage==='maneuver'){
  donor=[...s.nation.army.frontiers].filter(b=>b.dir!==w.dir&&b.troops>=13000&&!s.campaigns.some(x=>!x.done&&x.dir===b.dir)).sort((a,b)=>b.troops-a.troops)[0];
  choices=[option('attack','限期进击','拨粮6万石；随后两轮战力提高18%，伤亡增加35%，行营开销增加15%。',{grain:-6}),
   option('defend','据险稳守','支银4万两，战备提高3；随后两轮战力降低5%，伤亡减少35%。',{treasury:-4,army:{id:w.dir,readiness:3}})];
  if(donor)choices.push(option('reinforce','抽调'+donor.dir+'境援军','支银6万两、粮4万石；调来8000人，来源边境战备减4、边患加8。',{treasury:-6,grain:-4}));
 }else if(stage==='supply')choices=[
  option('supply','加拨行营钱粮','支银8万两、粮12万石；随后两轮战力提高12%，伤亡减少15%。',{treasury:-8,grain:-12}),
  option('levy','向'+province.name+'就地筹粮','得粮10万石；该州民心减6、灾情加3，影响之后赋税与收成；随后两轮战力提高3%，行营开销减少10%。',
   {grain:10,prestige:-1,province:{id:province.id,morale:-6,disaster:3}}),
  option('contract','收缩战线减耗','随后两轮战力降低15%，伤亡减少55%，行营开销减半；战期不延长。')];
 else choices=[option('press','追加攻势','支银6万两、粮8万石；随后两轮战力提高25%，伤亡增加50%，行营开销增加20%。',{treasury:-6,grain:-8}),
  option('consolidate','保住现有战果','随后两轮战力降低2%，伤亡减少30%，行营开销减少10%。'),
  option('negotiate','收兵遣使议和','停止本次战役，按现有战果议约；不算完整战役获胜，原定战争目标仍须看条款。',{prestige:-2})];
 w.reportsIssued++;
 petition(s,w,stage,choices,stage==='maneuver'?'defend':stage==='supply'?'contract':'consolidate',
  '本次以「'+WAR_GOALS[w.warGoal].label+'」为目标，已战'+w.round+'旬，胜负差为'+w.score+'。'+
  (stage==='supply'?'筹粮州为'+province.name+'。':'')+'请定下一步军令；及时批复的进退方略影响随后两轮交战。',donor?.dir);
 return s;
}
export function treatyOptions(s,w){
 const win=w.result==='胜利',advantage=win||w.score>0;
 const choices=[];
 if(advantage){
  choices.push(option('peace','撤军定界，安抚军民','支银6万两；皇威加3、边患减18、对方态度加10，约定停战18旬。',{treasury:-6,prestige:3,army:{id:w.dir,threat:-18},foreign:{id:w.country,attitude:10}}));
  choices.push(option('market','以开市换停战','边患减8、对方态度加10；停战18旬、互市36旬，每季收入2万两；对方实力立增6，此后每月再增0.4。',
   {prestige:-1,army:{id:w.dir,threat:-8},foreign:{id:w.country,attitude:10}}));
 }
 if(win){
  choices.push(option('indemnity','索赔后撤军','收赔银30万两；皇威加2、边患减8，但对方态度减15，仅停战9旬。',
   {treasury:30,prestige:2,army:{id:w.dir,threat:-8},foreign:{id:w.country,attitude:-15}}));
  if(w.warGoal==='tribute'||w.score>=3)choices.push(option('tribute','留军督贡','先支银12万两、粮12万石，另留3000人；皇威加6、边患减12、对方态度减20。督贡36旬，每月再支银0.8万两、粮1万石；无力供养会撤军失约。',
   {treasury:-12,grain:-12,prestige:6,army:{id:w.dir,threat:-12},foreign:{id:w.country,attitude:-20}}));
 }else{
  choices.push(option('silver','赔银换撤兵','赔银18万两；皇威减5、边患减12、对方态度加4，约定停战9旬。',
   {treasury:-18,prestige:-5,army:{id:w.dir,threat:-12},foreign:{id:w.country,attitude:4}}));
  choices.push(option('grain','输粮议和','交粮18万石；皇威减6、边患减8，约定停战9旬。',{grain:-18,prestige:-6,army:{id:w.dir,threat:-8}}));
 }
 choices.push(option('retreat','不议条件，径自收兵','不付钱粮；皇威减'+(win?3:8)+'、边患加'+(win?6:12)+'、对方态度减8，没有停战保证。',
  {prestige:win?-3:-8,army:{id:w.dir,threat:win?6:12},foreign:{id:w.country,attitude:-8}}));
 return choices;
}
export function openSettlement(state,id,result){
 let s=clone(state),w=s.campaigns.find(w=>w.id===id);if(w.settlement)return s;
 w.done=true;w.result=result;w.personal=false;w.order=null;w.settlement={status:'pending',turn:s.turn};
 s.memorials=s.memorials.filter(m=>m.campaignOrder?.warId!==id);
 s.foreign.find(f=>f.id===w.country).status='停战待议';
 petition(s,w,'treaty',treatyOptions(s,w),'retreat','本次目标为「'+WAR_GOALS[w.warGoal].label+'」，军事结果为'+result+'。'+
  '两军暂止交锋，条款尚未商定。'+(result==='胜利'?'请决定以什么代价换取停战，或是否承担驻军的长期供养。':'请权衡赔银、输粮与自行撤军的代价。'));
 return s;
}
export function applyCampaignDecision(state,m,o){
 let s=clone(state),w=s.campaigns.find(w=>w.id===m.campaignOrder.warId),q=m.campaignOrder;
 // Callers check availability before charging the option's effect package.
 if(q.stage!=='treaty'){
  w.orders.push({id:o.id,label:o.label,round:w.round,turn:s.turn});
  if(o.id==='negotiate')return openSettlement(s,w.id,'议和');
  w.order={id:o.id,untilRound:w.round+2};
  if(o.id==='reinforce'){
   const donor=s.nation.army.frontiers.find(b=>b.dir===q.donor),home=borderOf(s,w);
   troopChange(s,donor,-8000,'抽调'+donor.dir+'境援军：8000人转赴'+home.dir+'境');
   troopChange(s,home,8000,'抽调'+donor.dir+'境援军：8000人转赴'+home.dir+'境');
   s=applyPackage(s,{army:{id:donor.dir,readiness:-4,threat:8}},'抽调'+donor.dir+'境援军：原防线减弱');
  }
  return s;
 }
 const country=s.foreign.find(f=>f.id===w.country),duration={peace:18,indemnity:9,market:36,tribute:36,silver:9,grain:9,retreat:0}[o.id];
 country.status=o.id==='tribute'?'朝贡':o.id==='retreat'?'冷淡':'通好';
 const truce=o.id==='market'?18:duration;
 country.treaty={warId:w.id,kind:o.id,label:o.label,status:'active',dir:w.dir,start:s.turn,until:s.turn+duration,
  truceUntil:s.turn+truce,lastPaid:s.turn,garrison:o.id==='tribute'?3000:0};
 if(o.id==='tribute')troopChange(s,borderOf(s,w),-3000,'战后留军：3000人驻守'+country.name+'，另支饷粮');
 if(o.id==='market'){
  country.trade={start:s.turn,until:s.turn+36,income:2};country.power=clamp(country.power+6);
 }
 const commander=s.court.officials.find(o=>o.id===w.commander&&eligible(o));
 if(w.result==='胜利'&&commander)s=applyPackage(s,{official:{id:commander.id,favor:3},faction:{[commander.faction]:2}},'战后论功：'+commander.name+'与军功同僚得势');
 w=s.campaigns.find(x=>x.id===w.id);w.settlement={status:'signed',turn:s.turn,kind:o.id,label:o.label};
 w.goalAchieved=o.id!=='retreat'&&(w.warGoal==='repel'&&w.result==='胜利'||w.warGoal==='market'&&o.id==='market'||w.warGoal==='tribute'&&o.id==='tribute');
 s.facts.push({subject:country.name,key:'战后议约',value:o.label+'；'+o.consequence,turn:s.turn});
 return s;
}
export function expireCampaignPetition(state,m){
 let s=clone(state),w=s.campaigns.find(w=>w.id===m.campaignOrder.warId);if(!w)return s;
 if(m.campaignOrder.stage==='treaty'){
  const o=m.options.find(o=>o.id==='retreat');s=applyPackage(s,o.effects,'议约迟迟未决，行营自行收兵');
  return applyCampaignDecision(s,m,o);
 }
 if(!w.done){
  w.order={id:'contract',untilRound:w.round+1};
  s=applyPackage(s,{army:{id:w.dir,readiness:-2}},'军报逾期：行营收缩待命，战备受损');
 }
 return s;
}
function endTreaty(state,id,breach){
 let s=clone(state),f=s.foreign.find(f=>f.id===id),t=f.treaty;
 if(t.garrison){
  const home=s.nation.army.frontiers.find(b=>b.dir===t.dir),returned=Math.floor(t.garrison*(breach?0.9:1));
  const excess=Math.max(0,home.troops+returned-1000000);
  troopChange(s,home,returned,breach?'驻军断饷撤回：归建兵员减少一成':'驻军期满归建');t.garrison=0;
  if(excess)s.facts.push({subject:f.name,key:'驻军归建',value:'边营满额，归来的'+excess+'人就地复员。',turn:s.turn});
 }
 t.status=breach?'breached':'expired';t.ended=s.turn;
 if(t.kind==='tribute'&&f.status==='朝贡')f.status=breach?'冷淡':'通好';
 if(t.kind==='market'&&f.trade?.start===t.start)f.trade=null;
 if(breach){
  s=applyPackage(s,{prestige:-3,army:{id:t.dir,threat:8},foreign:{id:f.id,attitude:-10}},'驻军断饷，撤军失约');
 }
 s.facts.push({subject:f.name,key:'条约后续',value:breach?'驻军供养不足，撤回时兵员损失一成，边患回升。':'议约期满，驻军归建，后续来往另议。',turn:s.turn});
 return s;
}
export function breakTreaty(state,id){return endTreaty(state,id,false);}
export function advanceTreaties(state){
 let s=clone(state);
 for(const id of s.foreign.filter(f=>f.treaty?.status==='active').map(f=>f.id)){
  let f=s.foreign.find(f=>f.id===id),t=f.treaty;
  if(s.turn>t.until){s=endTreaty(s,id,false);continue;}
  if(s.turn%3||s.turn<=t.start||t.lastPaid>=s.turn)continue;
  if(t.kind==='tribute'){
   if(s.nation.treasury<0.8||s.nation.grain<1){s=endTreaty(s,id,true);continue;}
   s=applyPackage(s,{treasury:-0.8,grain:-1,army:{id:t.dir,threat:-0.4}},'驻军督贡：本月饷粮');
  }
  f=s.foreign.find(f=>f.id===id);t=f.treaty;t.lastPaid=s.turn;
  if(t.kind==='market')f.power=clamp(f.power+0.4);
 }
 return s;
}
