import { TECHS,INDUSTRIES,TECH_LINES,INDUSTRY_SLOTS,RESEARCH_CAP } from './tech-rules.js';
const finite=(v,min=0,max=Infinity)=>Number.isFinite(v)&&v>=min&&v<=max;
export function validateDevelopment(s){
 if(s.v<21)return;
 const t=s.tech,ids=new Set(TECHS.map(t=>t.id));
 if(!t||!finite(t.funding,0,RESEARCH_CAP)||!Array.isArray(t.done)||t.done.some(id=>!ids.has(id))||new Set(t.done).size!==t.done.length||!(t.lead===null||typeof t.lead==='string'&&s.court.officials.some(o=>o.id===t.lead))||!Array.isArray(t.custom))throw new Error('格物存档损坏');
 if(t.done.some(id=>TECHS.find(r=>r.id===id).prereq.some(pre=>!t.done.includes(pre))))throw new Error('科技前置记录损坏');
 if(t.current){const c=t.current,r=TECHS.find(t=>t.id===c.id);if(!r||t.done.includes(c.id)||!finite(c.progress,0,r.cost)||!Number.isSafeInteger(c.elapsed)||c.elapsed<0||!finite(c.spent)||(c.name!==undefined&&(typeof c.name!=='string'||!c.name.trim()||c.name.length>40)))throw new Error('在研记录损坏');}
 else if(t.current!==null)throw new Error('在研记录损坏');
 if(t.custom.some(c=>!c||!t.done.includes(c.id)||!TECH_LINES.includes(c.line)||typeof c.name!=='string'||!c.name.trim()||c.name.length>40)||new Set(t.custom.map(c=>c.id)).size!==t.custom.length)throw new Error('自拟技艺记录损坏');
 for(const p of s.nation.provinces){
  if(!finite(p.prosperity,0,100)||!Array.isArray(p.industries)||p.industries.length>INDUSTRY_SLOTS||new Set(p.industries.map(i=>i?.type)).size!==p.industries.length||p.industries.some(i=>!i||!Object.hasOwn(INDUSTRIES,i.type)||!Number.isInteger(i.level)||i.level<1||i.level>3||!Number.isSafeInteger(i.builtTurn)||i.builtTurn<0||i.builtTurn>s.turn||(i.paused!==undefined&&typeof i.paused!=='string')))throw new Error('州郡产业或繁荣损坏');
 }
 for(const p of s.projects.filter(p=>p.edictType==='兴业'))if(!Object.hasOwn(INDUSTRIES,p.industry)||!s.nation.provinces.some(z=>z.id===p.province)||!Number.isInteger(p.level)||p.level<1||p.level>3||!finite(p.cost)||!finite(p.progress,0,100)||!Number.isSafeInteger(p.start)||p.start<0||p.start>s.turn||!Number.isSafeInteger(p.end)||p.end<=p.start)throw new Error('产业工程损坏');
 for(const m of s.memorials)for(const o of m.options||[]){
  const a=o.development;if(!a)continue;
  if(a.kind==='research'){
   if(!ids.has(a.techId)||!finite(a.funding,0,RESEARCH_CAP))throw new Error('请研方案损坏');
  }else if(a.kind!=='industry'||!Object.hasOwn(INDUSTRIES,a.industry)||!s.nation.provinces.some(p=>p.id===a.province)||!Number.isInteger(a.level)||a.level<1||a.level>3)throw new Error('兴业方案损坏');
 }

}
