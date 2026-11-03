import { clone } from './state.js';
import { applyPackage } from './effects.js';
import { check, roll } from './rng.js';
import { appoint } from './court.js';
import { diplomacy } from './foreign.js';
import { issueEdict, EDICTS } from './edicts.js';
import { auditChanges } from './audit.js';
import { factionPowers } from './politics.js';
export const INTENT_TYPES=['kill','appoint','dismiss','promote','imprison','war','allocate','favor','decree','other'];
const persons=s=>[...s.court.officials,...s.harem.consorts,...s.harem.children];
export function normalizeIntents(state,actions,inputs){
 const byId=(list,value)=>list.find(x=>x.id===value||x.name===value);
 return (Array.isArray(actions)?actions:[]).map((raw,i)=>{
  const input=inputs.find(x=>x.id===raw?.inputId),type=INTENT_TYPES.includes(raw?.type)?raw.type:'other';
  const a={id:(input?.id||'unknown')+':'+i,inputId:input?.id||'',slot:input?.slot||'朝',type,text:String(raw?.text||input?.text||'').slice(0,500)};
  if(!input)return {...a,type:'other',text:'未能对应原口谕'};
  const person=byId(persons(state),raw.targetId||raw.target),country=byId(state.foreign,raw.countryId||raw.country);
  const post=state.court.posts.find(p=>p.id===raw.postId||p.title===raw.postId||state.postNames?.[p.id]===raw.postId);
  if(['kill','appoint','dismiss','promote','imprison','favor'].includes(type)){
   if(!person||person.alive===false||person.health<=0)return {...a,type:'other',text:'拟议：'+a.text,reason:'未找到在世人物'};
   a.targetId=person.id;
   if(['appoint','promote'].includes(type)&&raw.postId&&!post)return {...a,type:'other',text:'拟议：'+a.text,reason:'未找到官职'};
   if(post)a.postId=post.id;
  }
  if(type==='war'){if(!country)return {...a,type:'other',text:'拟议：'+a.text,reason:'未找到外邦'};a.countryId=country.id;a.operation=['宣战','议和','出兵'].includes(raw.operation)?raw.operation:'宣战';}
  if(type==='allocate'){
   a.resource=['treasury','privy','grain','troops'].includes(raw.resource)?raw.resource:'treasury';
   a.amount=Number.isFinite(raw.amount)?Math.max(0,raw.amount):0;
   a.source=a.resource==='grain'?'grain':(['treasury','privy',...(a.resource==='troops'?['capital',...state.nation.army.frontiers.map(b=>b.dir)]:[])].includes(raw.source)?raw.source:'treasury');
   a.destination=state.court.posts.find(p=>p.id===raw.destination)?.id||state.nation.provinces.find(p=>p.id===raw.destination)?.id||(['privy','treasury','grain','capital',...state.nation.army.frontiers.map(b=>b.dir),...Object.keys(EDICTS)].includes(raw.destination)?raw.destination:'政务');
  }
  if(type==='favor'){a.requestedAmount=raw.amount;a.amount=Number.isFinite(raw.amount)?Math.max(-5,Math.min(5,raw.amount)):0;}
  if(type==='decree'){if(!EDICTS[raw.edictType])return {...a,type:'other',text:'拟议：'+a.text,reason:'普通叙事口谕'};a.edictType=raw.edictType;a.province=state.nation.provinces.find(p=>p.id===raw.province)?.id||null;}
  return a;
 });
}
function killPerson(s,id){
 const o=s.court.officials.find(o=>o.id===id);
 if(o){o.alive=false;o.health=0;o.post=null;for(const p of s.court.posts)if(p.holder===id)p.holder=null;for(const z of s.nation.provinces)if(z.governor===id)z.governor=null;s.court.factions=factionPowers(s);}
 const c=s.harem.consorts.find(c=>c.id===id);if(c){c.health=0;c.preg=null;c.retired=true;}
 const child=s.harem.children.find(c=>c.id===id);if(child){child.health=0;if(s.harem.heir===id)s.harem.heir=null;}
}
export function resolveIntents(state,actions,{slot='朝',source='decree'}={}){
 let s=clone(state);s.intentResults??=[];
 const results=[],facts=[];
 for(const a of actions){
  const id=s.runId+':'+s.turn+':'+source+':'+a.id;
  const prior=s.intentResults.find(r=>r.id===id);if(prior){results.push(prior);continue;}
  const target=persons(s).find(o=>o.id===a.targetId),actor=target?.name;
  const factStart=facts.length;
  const r={id,turn:s.turn,slot:a.slot||slot,type:a.type,status:'failed',inputId:a.inputId,actual:{},clamped:false};
  let success=s.settings.freedom==='free';
  if(a.type==='other'){r.status='narrative';r.summary='拟议：'+a.text;}
  else{
   const die=roll(s);s=die.state;r.die=die.value;
   const verdict=check(s.emperor.talents.权谋,die.value,'一般',target?.abilities?.权谋||target?.scheming||0);
   success ||= verdict.success;r.baseSuccess=verdict.success;r.status=success?'success':'failed';
   if(!success)r.summary='口谕未能落实';
   else try{
    if(s.regency)throw new Error('摄政期间不可下达此口谕');
    if(a.type==='kill'){
     if(!target||target.alive===false||target.health<=0){r.clamped=true;r.summary='此人已不在在世名册';}
     else{killPerson(s,target.id);r.actual={targetId:target.id,name:actor};r.summary=actor+'被赐死';facts.push({kind:'death',actors:[actor]});}
    }else if(['appoint','promote','dismiss','imprison'].includes(a.type)){
     const current=s.court.posts.find(p=>p.holder===a.targetId),post=s.court.posts.find(p=>p.id===a.postId)||current;
     if(!target?.abilities)throw new Error('此人不在官员名册');
     const operation=a.type==='dismiss'?'remove':a.type==='imprison'?'jail':'appoint';
     if(!post)throw new Error('未找到可任免官职');
     const result=appoint(s,{post:post.id,person:target.id,operation,pardon:false});s=result.state;r.summary=result.note;
     const done=operation==='appoint'?s.court.posts.find(p=>p.id===post.id)?.holder===target.id:!s.court.posts.find(p=>p.holder===target.id);
     if(!done)r.status='failed';
     else{r.actual={targetId:target.id,postId:post.id};facts.push({kind:'appointment',actors:[actor],operation:operation==='jail'?'下狱':operation==='remove'?'罢免':'任命',post:post.title});}
    }else if(a.type==='allocate'){
     const room=['treasury','privy','grain'].includes(a.destination)&&a.destination!==a.source?Math.max(0,1000000-s.nation[a.destination]):1000000;
     const origin=a.source==='capital'?s.nation.army.capital:s.nation.army.frontiers.find(b=>b.dir===a.source);
     const cap=a.resource==='troops'?Math.min(Math.max(0,1000000-((a.destination==='capital'?s.nation.army.capital:s.nation.army.frontiers.find(b=>b.dir===a.destination))?.troops||0)),origin?origin.troops:Math.floor((s.nation[a.source]||0)*3000/EDICTS.征兵.cost)):Math.min(room,s.nation[a.source]||0);
     const amount=Math.min(Math.max(0,a.amount||0),cap);r.clamped=amount!==a.amount;
     if(a.resource==='troops'){
      const army=a.destination==='capital'?s.nation.army.capital:s.nation.army.frontiers.find(b=>b.dir===a.destination);
      if(!army)throw new Error('未找到军队');if(origin)origin.troops-=Math.floor(amount);else s=applyPackage(s,{[a.source]:-Math.floor(amount)*EDICTS.征兵.cost/3000},'口谕征兵');
      const destination=a.destination==='capital'?s.nation.army.capital:s.nation.army.frontiers.find(b=>b.dir===a.destination);destination.troops+=Math.floor(amount);
     }else{
      const effects={[a.source]:-amount};if(['treasury','privy','grain'].includes(a.destination)&&a.destination!==a.source)effects[a.destination]=amount;
      s=applyPackage(s,effects,'口谕调拨');
      if(EDICTS[a.destination]&&EDICTS[a.destination].months)s.projects.push({id:'intent-project-'+id,edictType:a.destination,start:s.turn,end:s.turn+EDICTS[a.destination].months*3,progress:0,execRate:1,cost:amount,office:EDICTS[a.destination].office,effects:{...EDICTS[a.destination].effects},province:null,done:false});
     }
     r.actual={resource:a.resource,source:a.source,destination:a.destination,amount};
     r.summary=(a.resource==='troops'?'征兵 '+Math.floor(amount)+' 人':(a.source==='grain'?'调粮 '+amount+' 万石':'拨银 '+amount+' 万两'))+(r.clamped?'（已按可用数量截断）':'');
     facts.push({kind:'allocation',...r.actual});
    }else if(a.type==='favor'){
     const used=s.intentResults.filter(r=>r.turn===s.turn&&r.type==='favor'&&['success','partial'].includes(r.status)).reduce((n,r)=>n+Math.abs(r.actual.amount||0),0);
     const personal=s.intentResults.filter(r=>r.turn===s.turn&&r.type==='favor'&&r.actual.targetId===target.id&&['success','partial'].includes(r.status)).reduce((n,r)=>n+Math.abs(r.actual.amount||0),0);
     const beforeFavor=target.favor||0;
     const amount=Math.sign(a.amount)*Math.min(Math.abs(a.amount),Math.max(0,10-used),Math.max(0,5-personal));r.clamped=amount!==a.amount;
     if(target?.abilities)s=applyPackage(s,{official:{id:target.id,favor:amount}},'口谕赏罚');else if(target&&'favor' in target)target.favor=Math.max(0,Math.min(100,target.favor+amount));
     r.actual={targetId:target.id,amount:(persons(s).find(o=>o.id===target.id)?.favor||0)-beforeFavor};r.clamped=r.actual.amount!==a.requestedAmount;r.summary=actor+(amount>=0?'受到嘉奖':'受到申饬');
    }else if(a.type==='war'){
     const country=s.foreign.find(f=>f.id===a.countryId);if(!country)throw new Error('外邦不在名册');
     if(a.operation==='出兵'&&country.status==='交战'){r.summary='向'+country.name+'出兵';facts.push({kind:'war',actors:[country.name],outcome:'出兵'});}
     else{const operation=a.operation==='出兵'?'宣战':a.operation;const result=diplomacy(s,{country:country.id,operation,confirmBreach:true,intent:true},die.value);s=result.state;r.summary=result.note;const done=operation==='议和'?s.foreign.find(f=>f.id===country.id).status!=='交战':true;if(!done)r.status='failed';else facts.push({kind:'war',actors:[country.name],outcome:operation});}
     r.actual={countryId:country.id,operation:a.operation};
    }else if(a.type==='decree'){
     const result=issueEdict(s,{edictType:a.edictType,province:a.province,intent:true},die.value);s=result.state;r.summary=result.note;r.actual={edictType:a.edictType};
     const label=result.note.match(/雷厉风行|照办|敷衍|阳奉阴违|封驳/)?.[0];if(label)facts.push({kind:'execution',slot:r.slot,topic:a.edictType,label});if(label==='封驳')r.status='failed';
    }
   }catch(error){r.status='failed';r.summary='口谕未能落实：'+error.message;}
  }
  r.facts=facts.slice(factStart);results.push(r);s.intentResults.push(r);
 }
 return {state:s,results,facts};
}

export function resolveTalkIntents(state,result,actions){
 const before=state.ledger.length,resolved=resolveIntents(state,actions,{slot:'午',source:result.id});
 let s=resolved.state;
 const entries=auditChanges(state,s,s.ledger.slice(before),'御前口谕');
 s.ledger=[...s.ledger.slice(0,before),...entries];
 s.interimEntries=[...(state.interimEntries||[]),...entries];
 result.intentResults=resolved.results;result.intentFacts=resolved.facts;result.intentEntries=entries;
 if(resolved.results.some(r=>r.type!=='other')){result.success=resolved.results.some(r=>['success','partial'].includes(r.status));result.denied=!result.success;}
 const saved=s.talks.find(t=>t.id===result.id);if(saved)Object.assign(saved,result);
 return {state:s,result:saved||result};
}
