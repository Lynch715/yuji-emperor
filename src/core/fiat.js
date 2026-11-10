import {clone,assertState} from './state.js';
import {assignFaces} from './faces.js';
import {WORLD_MAX,defaultFiat} from './sandbox-schema.js';
import {factionPowers} from './politics.js';
import {TECHS,techById} from './tech-rules.js';
import {applyPackage} from './effects.js';
import {completeIndustry} from './industries.js';
import {quarterIndex} from './finance.js';

export function fiatEnabled(s){return s.v>=26&&s.settings?.freedom==='free';}
const banned=new Set(['__proto__','prototype','constructor']);
const clean=(v,max=8000)=>typeof v==='string'?v.trim().slice(0,max):'';
export const FIAT_OPERATIONS=['set','add','create','appoint','dismiss','imprison','kill','revive','relation','policy','object','technology','complete','war','fact','cancel'];
// No arbitrary JavaScript or paths: the model describes world operations; this
// interpreter alone maintains IDs, offices, accounts and transaction metadata.
export function normalizeFiatOperations(operations){
 if(!Array.isArray(operations)||!operations.length)throw new Error('言出法随缺少可执行指令');
 return operations.map(raw=>{
  if(!raw||!FIAT_OPERATIONS.includes(raw.op))throw new Error('无法识别言出法随操作');
  const out={op:raw.op};
  for(const key of ['target','other','field','name','kind','post','description','outcome','gender','period'])if(raw[key]!==undefined)out[key]=clean(raw[key]);
  if(raw.value!==undefined){if(!['string','number','boolean'].includes(typeof raw.value)||typeof raw.value==='number'&&(!Number.isFinite(raw.value)||Math.abs(raw.value)>WORLD_MAX))throw new Error('指令数值不可表示');out.value=typeof raw.value==='string'?clean(raw.value):raw.value;}
  if(raw.age!==undefined){if(!Number.isSafeInteger(raw.age)||raw.age<0||raw.age>10000)throw new Error('年龄无效');out.age=raw.age;}
  if(raw.fields!==undefined){
   if(!raw.fields||typeof raw.fields!=='object'||Array.isArray(raw.fields))throw new Error('对象属性无效');out.fields={};
   for(const [k,v]of Object.entries(raw.fields)){if(banned.has(k)||!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>WORLD_MAX))throw new Error('对象属性无效');out.fields[clean(k,120)]=typeof v==='string'?clean(v):v;}
  }
  if(raw.operations!==undefined){if(raw.op!=='policy'||raw.operations.some?.(o=>o?.op==='policy'))throw new Error('制度不能递归创建制度');out.operations=normalizeFiatOperations(raw.operations);}
  if(['set','add'].includes(out.op)&&(!out.target||!out.field||out.value===undefined||out.field.split('.').some(k=>banned.has(k))))throw new Error('请指明修改对象、属性和数值');
  return out;
 });
}
export function ensureFiatFunds(state,costs={}){
 if(!fiatEnabled(state))return state;
 const s=clone(state);
 for(const [key,cost]of Object.entries(costs))if(['treasury','privy','grain'].includes(key)&&Number.isFinite(cost)&&cost>s.nation[key]){
  const before=s.nation[key],after=Math.min(WORLD_MAX,cost);s.nation[key]=after;s.fiat.used=true;
  s.ledger.push({turn:s.turn,path:'nation.'+key,before,after,delta:after-before,source:'言出法随：补足办理所需'+({treasury:'国库',privy:'内帑',grain:'粮储'})[key]});
 }
 return s;
}
function people(s){return [s.emperor,...s.court.officials,...s.harem.consorts,...s.harem.children,...s.harem.royalWomen,...s.foreign];}
function targetList(s,target){
 const groups={emperor:[s.emperor],nation:[s.nation],capital:[s.nation.army.capital],tech:[s.tech],keju:[s.keju],officials:s.court.officials,consorts:s.harem.consorts,children:s.harem.children,provinces:s.nation.provinces,factions:s.court.factions,countries:s.foreign,armies:[s.nation.army.capital,...s.nation.army.frontiers]};
 const aliases={朕:'emperor',皇帝:'emperor',全国:'nation',国库:'nation',内帑:'nation',粮储:'nation',京营:'capital',全体官员:'officials',所有官员:'officials',全部百姓:'provinces',各州:'provinces',所有嫔妃:'consorts',所有外邦:'countries'};
 const key=aliases[target]||target;if(groups[key])return groups[key];
 const list=[...people(s),...s.nation.provinces,...s.court.factions,...s.court.posts,...s.nation.army.frontiers,...s.projects,...s.fiat.objects];
 const found=list.find(p=>p.id===target||p.name===target||p.ruler===target||p.dir===target);
 if(!found)throw new Error('请先创建或指明对象：'+target);return [found];
}
const fields={皇威:'prestige',圣德:'virtue',健康:'health',心情:'mood',年龄:'age',寿命:'lifespan',好感:'favor',宠眷:'favor',吏治:'governance',民心:'morale',国库:'treasury',内帑:'privy',粮储:'grain',兵力:'troops',战备:'readiness',边患:'threat',人口:'pop',税额:'tax',灾情:'disaster',繁荣:'prosperity',野心:'ambition',贪墨:'greed',忠诚:'abilities.忠',政略:'talents.政略',权谋:'talents.权谋',武略:'talents.武略',文采:'talents.文采',魅力:'talents.魅力',教养:'education',资质:'aptitude',姓名:'name',朝代:'dynasty',位分:'rank',关系:'attitude'};
function writeField(s,target,key,value,add,changes){
 let field=fields[key]||key;
 if(target===s.nation&&field==='morale'){
  for(const z of s.nation.provinces)writeField(s,z,'morale',value,add,changes);
 }
 if(target===s.emperor&&['dynasty','imperialSurname'].includes(field)){writeField(s,s,field,value,add,changes);return;}
 const allowed=target===s?['dynasty','imperialSurname']:target===s.emperor?['name','age','lifespan','health','mood','prestige','virtue','location',...Object.keys(s.emperor.talents).map(k=>'talents.'+k)]:target===s.nation?['treasury','privy','grain','arrears','privyArrears','grainArrears','governance','morale']:target===s.tech?['funding']:target===s.keju?['scholarReputation','interval']:s.fiat.objects.includes(target)?Object.keys(target.values||{}).map(k=>'values.'+k):['name','ruler','age','health','favor','mood','ambition','greed','scheming','education','aptitude','rank','family','personality','secret','secretKnown','attitude','power','powerModifier','troops','readiness','threat','pop','tax','morale','disaster','prosperity','garrison',...['政','军','才','德','忠','权谋'].map(k=>'abilities.'+k)];
 if(s.fiat.objects.includes(target)&&!field.startsWith('values.'))field='values.'+field;
 if(!allowed.includes(field)&&!s.fiat.objects.includes(target))throw new Error('该属性由其他世界操作维护：'+key);
 const parts=field.split('.');if(parts.some(k=>banned.has(k)))throw new Error('属性无效');
 let obj=target;for(const k of parts.slice(0,-1)){if(!obj[k]||typeof obj[k]!=='object')throw new Error('此人物没有该项属性：'+key);obj=obj[k];}
 const leaf=parts.at(-1),before=obj[leaf]??(typeof value==='number'?0:'');
 let after=add?Number(before)+Number(value):value;
 if(typeof after==='number'){
  if(!Number.isFinite(after)||Math.abs(after)>WORLD_MAX)throw new Error('指令数值不可表示');
  if(['age','education','aptitude','troops','pop','garrison','interval'].includes(leaf))after=Math.floor(after);
  if(after<0&&target===s.nation&&['treasury','privy','grain'].includes(leaf)){
   const debt={treasury:'arrears',privy:'privyArrears',grain:'grainArrears'}[leaf];s.nation[debt]=Math.min(WORLD_MAX,-after);after=0;
  }else after=Math.max(leaf==='powerModifier'?-30:0,after);
  if(leaf==='powerModifier')after=Math.min(30,after);
 }
 if(['name','ruler','rank','family','personality','secret','location','dynasty','imperialSurname'].includes(leaf)&&typeof after!=='string')throw new Error('此属性需要文字');
 if(['age','health','favor','mood','prestige','virtue','troops','treasury','privy','grain','education','aptitude','morale','governance','readiness','threat'].includes(leaf)&&typeof after!=='number')throw new Error('此属性需要数值');
 if(leaf==='age'&&s.harem.children.includes(target)){target.born=s.turn-after*36;}
 else obj[leaf]=after;
 if(target===s.emperor&&leaf==='age'){s.emperor.lifespan=Math.max(s.emperor.lifespan,after+1);if(s.regency&&after>=16)s.regency=null;}
 if(target===s.emperor&&['health','mood'].includes(leaf)&&after>0){s.ending=null;s.emperor.depressedMonths=0;}
 changes.push({target:target.name||target.id||'国势',field,before,after});
 const path=target===s.nation?'nation':target===s.emperor?'emperor':s.court.officials.includes(target)?'official.'+target.id:s.harem.consorts.includes(target)?'consort.'+target.id:s.nation.provinces.includes(target)?'province.'+target.id:'fiat.'+(target.id||'world');
 if(typeof before==='number'&&typeof after==='number'&&before!==after)s.ledger.push({turn:s.turn,path:path+'.'+field,before,after,delta:after-before,source:'言出法随：'+key});
}
function removePost(s,p){for(const post of s.court.posts)if(post.holder===p.id)post.holder=null;for(const z of s.nation.provinces)if(z.governor===p.id)z.governor=null;p.post=null;}
function addObject(s,o,id){
 const name=o.name||o.target;if(!name)throw new Error('请给新对象命名');
 const existing=s.fiat.objects.find(x=>x.name===name);if(existing){Object.assign(existing.values,o.fields||{});existing.description=o.description||existing.description;return existing;}
 const item={id,name,description:o.description||name,kind:o.kind||'自定义事物',values:{...(o.fields||{})}};s.fiat.objects.push(item);return item;
}
function createEntity(s,o,id){
 const name=o.name||o.target;if(!name)throw new Error('请给新对象命名');
 const kind=o.kind||'object',age=o.age??24;
 if(kind==='object')return addObject(s,o,id);
 if(kind==='post'){
  const post={id,title:name,rank:1,office:name,tags:['政务'],holder:null,provinceId:null};s.court.posts.push(post);s.postNames??={};s.postNames[id]=name;return post;
 }
 if(kind==='faction'){const f={id,name,demand:o.description||'亲近信任',power:50,attitude:80,powerModifier:0};s.court.factions.push(f);return f;}
 if(kind==='country'){
  const p={...clone(s.foreign[0]),id,name,ruler:o.description||name+'君主',frontier:'东',attitude:80,status:'通好',trade:null};delete p.treaty;s.foreign.push(p);return p;
 }
 if(kind==='province'){
  const p={...clone(s.nation.provinces[0]),id,name,pop:300,tax:10,morale:80,disaster:0,rebellion:false,governor:null,industries:[],taxRelief:null,taxSurge:null};s.nation.provinces.push(p);
  s.court.posts.push({id:id+'-governor',title:name+(s.governorTitle||'巡抚'),rank:3,office:'地方',tags:['政务'],holder:null,provinceId:id});return p;
 }
 if(kind==='official'){
  const p={...clone(s.court.officials[0]),id,name,age,gender:o.gender||'男',abilities:{政:80,军:80,才:80,德:80,忠:100,权谋:80},post:null,faction:s.court.factions[0].id,alive:true,health:100,retired:false,jailed:false,personality:o.description||'奉旨任事',secret:'',secretKnown:false,greed:0,ambition:20,relations:{},memory:[],life:['奉旨入朝'],favor:100};delete p.faceNo;s.court.officials.push(p);return p;
 }
 if(kind==='consort'){
  const base=s.harem.consorts[0]||{mood:80,ambition:20,scheming:20,health:100,preg:null,relations:{},confined:false,cold:false,retired:false,recoveryUntil:0};
  const p={...clone(base),id,name,age,faction:s.court.factions[0].id,family:'奉旨入宫',rank:'妃',favor:100,health:100,preg:null,retired:false,confined:false,cold:false,relations:{},memory:[],secret:'',reignId:s.runId};delete p.faceNo;s.harem.consorts.push(p);return p;
 }
 if(kind==='child'){
  const mother=s.harem.consorts.find(c=>c.id===o.other||c.name===o.other),p={id,name,sex:o.gender||'男',mother:mother?.id||null,fatherId:s.reign.emperorId||s.runId,legit:true,born:s.turn-age*36,aptitude:80,health:100,education:Math.min(100,age*4),tutor:null,faction:mother?.faction||s.court.factions[0].id,party:false};s.harem.children.push(p);return p;
 }
 throw new Error('新对象类型无法识别：'+kind);
}
function runOperation(s,o,id,changes,facts){
 if(o.op==='cancel'){
  const before=s.fiat.rules.length+s.fiat.objects.length;s.fiat.rules=s.fiat.rules.filter(r=>r.id!==o.target&&r.name!==o.target);s.fiat.objects=s.fiat.objects.filter(r=>r.id!==o.target&&r.name!==o.target);
  if(before===s.fiat.rules.length+s.fiat.objects.length)throw new Error('未找到可撤销的自定义对象或制度');changes.push({target:o.target,operation:'撤销'});return;
 }
 if(o.op==='set'||o.op==='add'){for(const p of targetList(s,o.target))writeField(s,p,o.field,o.value,o.op==='add',changes);return;}
 if(o.op==='create'||o.op==='object'){
  const p=o.op==='object'?addObject(s,o,id):createEntity(s,o,id);
  for(const [key,value]of Object.entries(o.fields||{}))if(!s.fiat.objects.includes(p))writeField(s,p,key,value,false,changes);
  changes.push({target:p.name||p.title,created:true,id:p.id});return;
 }
 if(o.op==='policy'){
  if(!o.name)throw new Error('请给制度命名');
  const old=s.fiat.rules.find(x=>x.name===o.name),rule={id:old?.id||id,name:o.name,description:o.description||o.name,period:o.period==='eachTurn'?'eachTurn':'once',operations:o.operations||[]};
  if(old)Object.assign(old,rule);else s.fiat.rules.push(rule);
  if(rule.period==='once')for(const [i,op]of rule.operations.entries())runOperation(s,op,id+'-rule-'+i,changes,facts);
  rule.lastTurn=s.turn;
  changes.push({target:rule.name,rule:true});return;
 }
 if(o.op==='fact'){
  const fact={subject:o.target||s.emperor.name,key:o.name||'御旨',value:o.description||String(o.value??''),turn:s.turn};if(!fact.value)throw new Error('请写明新事实');facts.push({kind:'fiat',...fact});return;
 }
 if(o.op==='technology'){
  const tech=techById(o.target)||TECHS.find(t=>t.name===o.name||t.name===o.target);
  if(tech){const finish=id=>{const t=techById(id);for(const dep of t?.prereq||[])if(!s.tech.done.includes(dep))finish(dep);if(!s.tech.done.includes(id))s.tech.done.push(id);};finish(tech.id);if(s.tech.current&&s.tech.done.includes(s.tech.current.id))s.tech.current=null;changes.push({target:tech.name,completed:true});}
  else{const p=addObject(s,{...o,name:o.name||o.target,kind:'技术',fields:{...(o.fields||{}),completed:true}},id);changes.push({target:p.name,completed:true});}return;
 }
 if(o.op==='complete'){
  const ids=s.projects.filter(p=>o.target==='all'||p.id===o.target||p.name===o.target||p.edictType===o.target).map(p=>p.id);if(!ids.length&&o.target!=='all')throw new Error('没有该在建项目');
  for(const projectId of ids){
   const p=s.projects.find(p=>p.id===projectId);if(p.done)continue;p.done=true;p.progress=100;
   // Preserve the original scheduled dates for old project validation. Instant
   // completion must install the real industry/tax/relief/recruitment result.
   if(p.edictType==='兴业')completeIndustry(s,p);
   else{
    const effects=p.province&&Number.isFinite(p.effects?.morale)?{...p.effects,morale:undefined,province:{id:p.province,morale:p.effects.morale}}:p.effects||{};
    Object.assign(s,applyPackage(s,effects,'言出法随：项目竣工'));
    for(const z of s.nation.provinces.filter(z=>!p.province||z.id===p.province)){
     if(p.edictType==='减赋')z.taxRelief={factor:0.8,untilQuarter:quarterIndex(s.turn)+4};
     if(p.edictType==='加税')z.taxSurge={factor:1.2,untilQuarter:quarterIndex(s.turn)+4};
     if(p.edictType==='赈灾'){z.disaster=Math.max(0,z.disaster-35*(p.execRate||1));z.morale=Math.min(WORLD_MAX,z.morale+8*(p.execRate||1));}
    }
    if(p.edictType==='征兵')for(const b of [s.nation.army.capital,...s.nation.army.frontiers])if(p.armyTarget==='all-frontiers'?b!==s.nation.army.capital:p.armyTarget==='capital'?b===s.nation.army.capital:b.dir===p.armyTarget){b.troops=Math.min(WORLD_MAX,b.troops+3000);b.readiness=Math.min(WORLD_MAX,b.readiness+5);}
   }
   changes.push({target:p.name||p.edictType,completed:true});
  }return;
 }
 if(o.op==='war'){
  const f=targetList(s,o.target)[0];if(!s.foreign.includes(f))throw new Error('请指定外邦');
  const result=o.outcome||'归附';f.status=result==='归附'?'朝贡':result==='宣战'?'交战':'通好';f.attitude=result==='宣战'?0:100;
  const active=s.campaigns.filter(w=>w.country===f.id&&!w.done);
  for(const w of active){w.done=true;w.result=result==='胜利'||result==='归附'?'胜利':result==='失败'?'失败':'议和';if(w.campaignVersion===1){w.settlement={status:'signed',turn:s.turn,kind:result==='归附'?'tribute':'peace',label:'奉旨'+result};w.goalAchieved=result==='胜利'||result==='归附';}s.memorials=s.memorials.filter(m=>m.campaignOrder?.warId!==w.id);}
  if(!active.length&&(result==='胜利'||result==='归附'))s.campaigns.push({id:id+'-war',country:f.id,dir:f.frontier,title:f.name+'奉旨'+result,started:s.turn,done:true,result:'胜利'});
  if(result==='胜利'||result==='归附')s.stats.warsWon++;
  for(const b of s.nation.army.frontiers)if(b.dir===f.frontier)b.threat=result==='宣战'?80:0;
  changes.push({target:f.name,outcome:result});facts.push({kind:'war',actors:[f.name],outcome:result});return;
 }
 if(o.op==='appoint'){
  let p=targetList(s,o.target)[0];if(!s.court.officials.includes(p))throw new Error('请先创建官员，再任官');
  let post=s.court.posts.find(x=>x.id===o.post||x.title===o.post||s.postNames?.[x.id]===o.post);if(!post)post=createEntity(s,{kind:'post',name:o.post},id+'-post');
  removePost(s,p);const prior=s.court.officials.find(x=>x.id===post.holder);if(prior)prior.post=null;
  p.alive=true;p.health=Math.max(1,p.health);p.retired=false;p.jailed=false;p.post=post.id;post.holder=p.id;
  const z=s.nation.provinces.find(z=>z.id===post.provinceId);if(z)z.governor=p.id;
  changes.push({target:p.name,post:post.title});facts.push({kind:'appointment',actors:[p.name],operation:'任命',post:post.title});return;
 }
 const targets=targetList(s,o.target);
 if(targets.length>1){for(const p of targets)runOperation(s,{...o,target:p.id||'emperor'},id+'-'+(p.id||'emperor'),changes,facts);return;}
 const p=targets[0];
 if(['dismiss','imprison','kill'].includes(o.op)){
  removePost(s,p);if(o.op==='imprison')p.jailed=true;
  if(o.op==='kill'){p.alive=false;p.health=0;if('preg'in p)p.preg=null;if(s.harem.heir===p.id)s.harem.heir=null;facts.push({kind:'death',actors:[p.name||p.ruler]});}
  changes.push({target:p.name,operation:o.op});return;
 }
 if(o.op==='revive'){
  p.alive=true;p.health=100;p.retired=false;p.jailed=false;if(p===s.emperor){s.ending=null;s.emperor.lifespan=Math.max(s.emperor.lifespan,s.emperor.age+50);}changes.push({target:p.name,revived:true});facts.push({kind:'fiat',subject:p.name,key:'复生',value:'奉旨恢复在世',turn:s.turn});return;
 }
 if(o.op==='relation'){
  const value=Number(o.value??100);if(!Number.isFinite(value)||value<0||value>WORLD_MAX)throw new Error('关系数值无效');
  if(o.other){const other=targetList(s,o.other)[0];p.relations??={};p.relations[other.id||'emperor:'+s.runId]=value;other.relations??={};other.relations[p.id||'emperor:'+s.runId]=value;}
  else if(s.foreign.includes(p))p.attitude=value;else p.favor=value;
  changes.push({target:p.name||p.ruler,relation:value});
 }
}
export function applyFiatOperations(state,operations,key='fiat'){
 if(!fiatEnabled(state))throw new Error('此指令仅用于言出法随档');
 const ops=normalizeFiatOperations(operations),s=structuredClone(state),changes=[],facts=[];s.fiat??=defaultFiat();s.fiat.used=true;
 for(const [i,op]of ops.entries())runOperation(s,op,'fiat-'+s.runId+'-'+s.turn+'-'+key+'-'+i,changes,facts);
 s.nation.morale=s.nation.provinces.reduce((v,p)=>v+p.pop*p.morale,0)/s.nation.provinces.reduce((v,p)=>v+p.pop,0)||0;
 s.court.factions=factionPowers(s);
 for(const fact of facts.filter(f=>f.kind==='fiat'&&f.subject))s.facts.push({subject:fact.subject,key:fact.key,value:fact.value,turn:s.turn});
 assignFaces(s);assertState(s);
 const labels=Object.fromEntries(Object.entries(fields).map(([label,key])=>[key,label]));
 const summary=changes.slice(0,6).map(c=>c.created?'创建'+c.target:c.revived?c.target+'复生':c.post?c.target+'出任'+c.post:c.field?c.target+' '+(labels[c.field]||c.field.split('.').at(-1))+'＝'+c.after:c.completed?c.target+'已完成':c.outcome?c.target+' '+c.outcome:c.operation==='撤销'?'撤销'+c.target:c.target).join('；');
 return {state:s,changes,facts,summary:'御旨已行：'+summary+(changes.length>6?'等'+changes.length+'项':'')};
}
export function applyFiatRules(state){
 if(!fiatEnabled(state)||!state.fiat?.rules.some(r=>r.period==='eachTurn'&&r.operations.length))return state;
 let s=state;for(const rule of state.fiat.rules.filter(r=>r.period==='eachTurn'&&r.operations.length&&r.lastTurn!==state.turn)){s=applyFiatOperations(s,rule.operations,'rule-'+rule.id).state;s.fiat.rules.find(r=>r.id===rule.id).lastTurn=s.turn;}return s;
}
