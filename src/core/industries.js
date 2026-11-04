import { clone,withDraft } from './state.js';
import { applyPackage,clamp } from './effects.js';
import { provinceTaxFactor } from './finance.js';
import { INDUSTRIES,INDUSTRY_SLOTS,seaOpen,techEffects } from './tech-rules.js';
export function industryBlock(s,province,type){
 const p=s.nation.provinces.find(p=>p.id===province),r=INDUSTRIES[type];
 if(!p||!Object.hasOwn(INDUSTRIES,type))return '请选择州郡与产业';
 if(!s.tech?.done.includes(r.tech))return '尚未研成所需技艺';
 if(r.openSea&&!seaOpen(s))return '须先完成开海';
 if(!provinceTaxFactor(p,s.turn))return '地方民变未平，暂不能兴业';
 const old=p.industries?.find(i=>i.type===type);
 if(old?.level>=3)return '此产业已达三级';
 const kinds=new Set([...(p.industries||[]).map(i=>i.type),...s.projects.filter(x=>!x.done&&x.edictType==='兴业'&&x.province===province).map(x=>x.industry)]);
 if(!kinds.has(type)&&kinds.size>=INDUSTRY_SLOTS)return '本州三个产业槽已满';
 return '';
}
export function industryQuote(s,province,type){
 const r=INDUSTRIES[type],p=s.nation.provinces.find(p=>p.id===province),level=(p?.industries?.find(i=>i.type===type)?.level||0)+1;
 return {cost:r?.cost||0,months:(r?.months||0)+level-1,level,blocked:industryBlock(s,province,type)};
}
export function buildIndustry(state,action){
 if(state.regency)throw new Error('摄政期间不可另立兴业新政');
 const {province,industry:type}=action,q=industryQuote(state,province,type),r=INDUSTRIES[type];
 if(q.blocked)throw new Error(q.blocked);
 const ongoing=state.projects.find(p=>!p.done&&p.edictType==='兴业'&&p.province===province&&p.industry===type);
 if(ongoing)return {state:clone(state),note:r.name+'仍在营建，重申原旨，未重复支出'};
 if(action.level&&action.level!==q.level)throw new Error('此产业进度已变，请重新选择');
 if(state.nation.treasury<q.cost)throw new Error('国库不足，无法营建此产业');
 let s=applyPackage(state,{treasury:-q.cost,...(r.morale?{province:{id:province,morale:r.morale}}:{})},'兴业：'+r.name+'营建');
 s.stats.expense+=q.cost;s.stats.edicts++;
 s.projects.push({id:'industry-'+s.turn+'-'+s.projects.length,edictType:'兴业',name:s.nation.provinces.find(p=>p.id===province).name+' '+r.name,industry:type,level:q.level,start:s.turn,end:s.turn+q.months*3,progress:0,execRate:1,cost:q.cost,office:'工部尚书',effects:{},province,done:false});
 return {state:s,note:s.nation.provinces.find(p=>p.id===province).name+'兴建'+r.name+' '+q.level+'级，银 '+q.cost+' 万两，工期 '+q.months+' 月'};
}
export function completeIndustry(s,project){
 const p=s.nation.provinces.find(p=>p.id===project.province);
 if(!p||!Object.hasOwn(INDUSTRIES,project.industry))throw new Error('产业工程资料损坏');
 p.industries??=[];
 const existing=p.industries.find(i=>i.type===project.industry);
 if(existing){if(existing.level<project.level){existing.level=project.level;existing.builtTurn=s.turn;}}
 else p.industries.push({type:project.industry,level:project.level,builtTurn:s.turn,paused:''});
 return s;
}
export function industrialGrainFactor(s){
 const levels=s.nation.provinces.reduce((n,p)=>n+(provinceTaxFactor(p,s.turn)>0?(p.industries||[]).filter(i=>i.type==='canal'&&!i.paused).reduce((n,i)=>n+i.level,0):0),0);
 return 1+Math.min(0.18,levels*INDUSTRIES.canal.grainTransport);
}
export function industryTradeFactor(s){
 const levels=s.nation.provinces.reduce((n,p)=>n+(provinceTaxFactor(p,s.turn)>0?(p.industries||[]).filter(i=>i.type==='customs'&&!i.paused).reduce((n,i)=>n+i.level,0):0),0);
 return 1+(techEffects(s).trade||0)+Math.min(0.5,levels*INDUSTRIES.customs.trade);
}
export function industriesQuarter(state){
 return withDraft(()=>settleIndustryQuarter(state));
}
function settleIndustryQuarter(state){
 let s=clone(state);const effects=techEffects(s),bonus=1+(effects.production||0);
 const bill=s.nation.provinces.reduce((sum,p)=>sum+(p.industries||[]).reduce((n,i)=>n+INDUSTRIES[i.type].maintenance*i.level,0),0);
 const covered=s.nation.treasury+1e-8>=bill,paid=Math.min(s.nation.treasury,bill);
 if(paid){s=applyPackage(s,{treasury:-paid},'季结：产业维护');s.stats.expense+=paid;}
 const snapshot=s.nation.provinces.map(p=>({...p,industries:(p.industries||[]).map(i=>({...i}))}));
 for(let index=0;index<s.nation.provinces.length;index++){
  const p=s.nation.provinces[index],factor=provinceTaxFactor(p,s.turn),old=snapshot[index];
  let contribution=0;
  for(const i of p.industries||[]){
   const r=INDUSTRIES[i.type];
   i.paused=!factor?'地方民变':p.disaster>=80?'重灾':p.morale<15?'民心低落':!covered?'维护费不足':'';
   if(i.paused)continue;
   const productivity=factor*(1-p.disaster/100)*bonus*i.level;
   const cash=((r.tax||0)*(0.5+s.nation.governance*0.0045)+(r.cash||0)*(i.type==='salt'?0.3+s.nation.governance*0.007:1))*productivity;
   if(cash||r.grain){s=applyPackage(s,{treasury:cash,grain:(r.grain||0)*productivity},'季结：'+p.name+ r.name+'产出');s.stats.income+=cash;}
   if(r.governance)s=applyPackage(s,{governance:r.governance*i.level},'季结：盐课稽查压力');
   if(r.readiness)for(const b of s.nation.army.frontiers)b.readiness=clamp(b.readiness+r.readiness*productivity);
   if(r.threat){const b=s.nation.army.frontiers.find(b=>b.dir==='东')||s.nation.army.frontiers[0];b.threat=clamp(b.threat+r.threat*i.level);}
   contribution+=r.prosperity*productivity;
  }
  const spread=[snapshot[index-1],snapshot[index+1]].filter(Boolean).reduce((n,z)=>n+(provinceTaxFactor(z,s.turn)>0?(z.industries||[]).filter(i=>i.type==='canal'&&!i.paused&&covered).reduce((n,i)=>n+i.level*0.15,0):0),0);
  const growth=(0.5+contribution+(effects.prosperity||0)+spread-p.disaster/15-(p.morale<30?2:0)-(factor===0?3:0))*(1-(old.prosperity||0)/120);
  // applyPackage clones outside a forecast, so reacquire the province by id.
  const target=s.nation.provinces.find(z=>z.id===p.id);
  target.prosperity=clamp((old.prosperity||0)+growth);
 }
 return s;
}
