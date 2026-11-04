import { researchBlock,configureResearch } from './tech.js';
import { industryQuote,buildIndustry } from './industries.js';
import { defaultResearchLead } from './tech-rules.js';
export function developmentChoiceBlock(s,option){
 const a=option?.development;if(!a)return '';
 if(s.regency)return '摄政期间暂缓另立新政';
 if(a.kind==='research'){
  if(s.tech?.current&&s.tech.current.id!==a.techId)return '已有其他条目在研';
  return researchBlock(s,a.techId)||(!defaultResearchLead(s)?'暂无可主持的官员':'');
 }
 const q=industryQuote(s,a.province,a.industry);
 return q.blocked||(q.level!==a.level?'产业进度已变':s.nation.treasury<q.cost?'国库不足':'');
}
export function applyDevelopmentChoice(s,action){
 return action.kind==='research'?configureResearch(s,action):buildIndustry(s,action);
}
