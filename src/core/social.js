import {clone} from './state.js';
import {diminishing,clamp} from './effects.js';
import {SOCIAL_RULES,socialNPCs,socialKey,favorRecords,emperorKey} from './social-rules.js';
export function applySceneSocial(state,plans,outcome,eventId,previous=null){
 const s=clone(state),events=[],changes=[];
 const used=new Set([...(previous?.social||[]),...(previous?.steps||[]).flatMap(t=>t.social||[])].map(socialKey));
 for(const plan of plans){
  const rule=SOCIAL_RULES[plan.kind],key=socialKey(plan);if(!rule||used.has(key)||outcome.reused)continue;used.add(key);
  const p=socialNPCs(s).find(p=>p.id===plan.targetId),q=socialNPCs(s).find(p=>p.id===plan.otherId);
  if(!p||p.alive===false||p.health<=0||rule.pair&&(!q||q.alive===false||q.health<=0))continue;
  const event={...plan,key,status:outcome.status,changes:[]};
  const put=(owner,field,target,requested,category)=>{
   const isMap=field==='relations',before=isMap?(owner.relations?.[target]??50):owner[field];
   if(!Number.isFinite(before))return;
   let delta=requested;
   if(category==='favor'){
    const budget=favorRecords(s,previous?s.history.at(-1)?.intentResults||[]:[],true);
    const total=budget.reduce((n,r)=>n+Math.abs(r.actual.amount||0),0),personal=budget.filter(r=>r.actual.targetId===owner.id).reduce((n,r)=>n+Math.abs(r.actual.amount||0),0);
    delta=Math.sign(delta)*Math.min(Math.abs(delta),Math.max(0,10-total),Math.max(0,5-personal));
   }
   const after=clamp(before+diminishing(before,delta));if(after===before)return;
   if(isMap){owner.relations??={};owner.relations[target]=after;}else owner[field]=after;
   const prefix=owner.abilities?'official':s.foreign.some(f=>f.id===owner.id)?'foreign':s.harem.children.some(c=>c.id===owner.id)?'child':'consort';
   const path=prefix+'.'+owner.id+'.'+field+(isMap?'.'+target:'');
   const change={personId:owner.id,withId:target,field:category,before,after,delta:Math.round((after-before)*10000)/10000,reason:rule.label};
   event.changes.push(change);changes.push(change);
   s.ledger.push({turn:s.turn,path,before,after,delta:change.delta,source:'相处：'+rule.label,social:true,socialKind:category,personId:owner.id,eventId:eventId+':'+key});
  };
  const delta=rule[outcome.status]||0;
  if(rule.pair){put(p,'relations',q.id,delta,'relation');put(q,'relations',p.id,delta,'relation');}
  else if(s.foreign.some(f=>f.id===p.id))put(p,'attitude',emperorKey(s),delta,'favor');
  else if(Number.isFinite(p.favor))put(p,'favor',emperorKey(s),delta,'favor');
  else put(p,'relations',emperorKey(s),delta,'favor');
  events.push(event);
 }
 return {state:s,events,changes};
}
