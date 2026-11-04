import { clone } from './state.js';
import { applyPackage,clamp } from './effects.js';
import { INDUSTRIES,RESEARCH_CAP,techById,techEffects,seaOpen,researchLead,defaultResearchLead,identifyTech } from './tech-rules.js';
export function researchBlock(s,id){
 const t=techById(id);
 if(!t)return '请选择已有研究方向';
 if(s.tech?.done.includes(id))return '此法已经研成';
 if(t.prereq.some(id=>!s.tech?.done.includes(id)))return '须先研成：'+t.prereq.filter(id=>!s.tech?.done.includes(id)).map(id=>techById(id).name).join('、');
 if(t.openSea&&!seaOpen(s))return '须先完成开海';
 return '';
}
export function configureResearch(state,action){
 if(state.regency)throw new Error('摄政期间不可另立格物新政');
 const s=clone(state),prior=JSON.stringify(s.tech),funding=Number(action.funding??s.tech.funding);
 if(!Number.isFinite(funding)||funding<0)throw new Error('请填写有效月经费');
 const custom=action.name&&state.settings.freedom==='free';
 const t=techById(action.techId||action.id)||(custom?identifyTech(s,String(action.name),action.line):null);
 if(!t){if(!s.tech.current&&funding>0)throw new Error('请先选择研究方向');}
 else{
  const blocked=researchBlock(s,t.id);if(blocked)throw new Error(blocked);
  if(s.tech.current&&s.tech.current.id!==t.id)throw new Error('已有在研条目，请先完成或暂停经费');
  if(!s.tech.current)s.tech.current={id:t.id,progress:0,elapsed:0,spent:0,...(custom?{name:String(action.name).trim().slice(0,40)}:{})};
 }
 const lead=action.lead===undefined?(researchLead(s,s.tech.lead)?.id||defaultResearchLead(s,t)?.id):action.lead;
 if(lead&&!researchLead(s,lead))throw new Error('主持须为在朝任职的官员');
 if(funding>0&&!lead)throw new Error('请先委派主持官员');
 s.tech.funding=Math.min(RESEARCH_CAP,funding);s.tech.lead=lead||null;
 if(JSON.stringify(s.tech)!==prior)s.stats.edicts++;
 return {state:s,note:(s.tech.current?.name||t?.name||'格物')+' · 月经费 '+s.tech.funding+' 万两'+(funding>RESEARCH_CAP?'（按上限缩减）':'')};
}
export function researchQuote(s){
 const current=s.tech?.current,t=techById(current?.id),lead=researchLead(s,s.tech?.lead);
 const faction=s.court.factions.find(f=>/清流|清议|儒生|台谏/.test(f.name)&&f.power>=60&&f.attitude<40);
 const ability=lead?0.6+clamp(lead.abilities.政)*0.008:0;
 const factor=ability*(0.6+clamp(s.nation.governance)*0.004)*(faction?0.8:1);
 const paid=t&&lead&&current.progress<t.cost?Math.min(RESEARCH_CAP,s.tech.funding,s.nation.treasury):0;
 return {tech:t,lead,factor,paid,progress:paid*factor,opposed:!!faction};
}
export function researchMonth(state){
 if(!state.tech?.current)return clone(state);
 let s=clone(state);const q=researchQuote(s),c=s.tech.current;
 if(!q.tech||!q.lead)return s;
 if(q.paid>0){
  s=applyPackage(s,{treasury:-q.paid},'月结：格物经费 · '+(c.name||q.tech.name));
  s.stats.expense+=q.paid;s.tech.current.progress=Math.min(q.tech.cost,c.progress+q.progress);s.tech.current.spent+=q.paid;
 }
 if(q.paid>0||c.progress>=q.tech.cost)s.tech.current.elapsed++;
 if(s.tech.current.progress>=q.tech.cost&&s.tech.current.elapsed>=q.tech.months){
  s.tech.done.push(q.tech.id);
  if(c.name)s.tech.custom.push({id:q.tech.id,name:c.name,line:q.tech.line});
  s.tech.current=null;
  const e=q.tech.effects;
  if(e.governance)s=applyPackage(s,{governance:e.governance},'格物突破：'+(c.name||q.tech.name));
  if(e.readiness){s.nation.army.capital.readiness=clamp(s.nation.army.capital.readiness+e.readiness);for(const b of s.nation.army.frontiers)b.readiness=clamp(b.readiness+e.readiness);}
 }
 return s;
}
export function developmentNotes(before,after){
 const notes=(after.tech?.done||[]).filter(id=>!before.tech?.done.includes(id)).map(id=>'格物突破：'+(after.tech.custom.find(c=>c.id===id)?.name||techById(id).name));
 for(const p of after.nation.provinces){
  const old=before.nation.provinces.find(x=>x.id===p.id);
  for(const i of p.industries||[]){
   const prior=old?.industries?.find(x=>x.type===i.type);
   if(!prior||i.level>prior.level)notes.push(p.name+'产业建成：'+INDUSTRIES[i.type].name+' '+i.level+'级');
   if(i.paused!==prior?.paused&&i.paused)notes.push(p.name+'产业停产：'+INDUSTRIES[i.type].name+'（'+i.paused+'）');
   if(prior?.paused&&!i.paused)notes.push(p.name+'产业复产：'+INDUSTRIES[i.type].name);
  }
 }
 return notes;
}
