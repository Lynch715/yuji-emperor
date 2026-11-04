import {socialNPCs,SOCIAL_RULES} from './social-rules.js';
export function validateSocialState(s){
 for(const p of socialNPCs(s)){
  if(p.memoryHydrated!==undefined&&typeof p.memoryHydrated!=='boolean')throw new Error('人物记忆状态损坏');
  if(p.memory!==undefined&&!Array.isArray(p.memory))throw new Error('人物记忆损坏');
  const seen=new Set();for(const m of p.memory||[]){
   if(!['scene','scene-summary'].includes(m?.type))continue;
   if(typeof m.id!=='string'||!m.id||seen.has(m.id)||typeof m.summary!=='string'||m.summary.length>1000||typeof m.sceneId!=='string'||!Number.isSafeInteger(m.turn)||m.turn<0||m.turn>s.turn||!Number.isSafeInteger(m.order)||m.order<0||!Array.isArray(m.people)||m.people.some(id=>typeof id!=='string')||!['shared',...Object.keys(SOCIAL_RULES)].includes(m.kind)||![1,2,3].includes(m.importance))throw new Error('人物记忆损坏');
   if(m.type==='scene-summary'&&(!Number.isSafeInteger(m.count)||m.count<1||!Number.isSafeInteger(m.firstTurn)||m.firstTurn<0||m.firstTurn>m.turn||typeof m.first!=='string'||typeof m.last!=='string'))throw new Error('人物往事摘要损坏');
   seen.add(m.id);
  }
  if(p.relations!==undefined&&(!p.relations||typeof p.relations!=='object'||Array.isArray(p.relations)||Object.values(p.relations).some(v=>!Number.isFinite(v)||v<0||v>100)))throw new Error('人物关系损坏');
 }
}
