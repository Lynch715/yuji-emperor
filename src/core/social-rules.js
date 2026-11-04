// Narrative labels are classified, but all numerical consequences live here.
export const SOCIAL_RULES={
 accompany:{label:'陪伴',success:1,partial:0,failed:0},
 comfort:{label:'安慰',success:2,partial:1,failed:0},
 apologize:{label:'道歉',success:2,partial:1,failed:-1},
 protect:{label:'维护',success:3,partial:1,failed:0},
 humiliate:{label:'羞辱',success:-3,partial:-2,failed:-2},
 deceive:{label:'欺瞒',success:0,partial:-1,failed:-3},
 reconcile:{label:'调解',pair:true,success:4,partial:1,failed:-1},
 quarrel:{label:'争执',pair:true,success:-3,partial:-2,failed:-1},
 cooperate:{label:'合作',pair:true,success:2,partial:1,failed:0},
};
export function socialNPCs(s){return [...s.court.officials,...s.harem.consorts,...s.harem.children,...s.foreign];}
export function emperorKey(s){return (s.reign?.number||1)===1?s.runId:s.runId+':reign:'+s.reign.number;}
export function favorRecords(s,history=[],all=false){
 const records=[...s.intentResults.filter(r=>all||r.turn===s.turn),...history];
 for(const [i,e]of s.ledger.entries()){
  if(e.social&&e.socialKind==='favor')records.push({id:e.eventId+':'+e.path,type:'favor',status:'success',actual:{targetId:e.personId,amount:e.delta}});
  else if(e.source==='模型人物反应建议：引擎限额采纳'&&/^official\..+\.favor$/.test(e.path))records.push({id:'reaction:'+i+':'+e.path,type:'favor',status:'success',actual:{targetId:e.path.split('.')[1],amount:e.delta}});
 }
 return [...new Map(records.map(r=>[r.id,r])).values()].filter(r=>r.type==='favor'&&['success','partial'].includes(r.status));
}
export function normalizeSocial(s,raw,input){
 if(!input?.scene||!raw||!SOCIAL_RULES[raw.kind]||!Array.isArray(input.people))return null;
 const allowed=new Set(input.people),p=socialNPCs(s),target=p.find(p=>p.id===raw.targetId);
 if(!target||!allowed.has(target.id))return null;
 const out={kind:raw.kind,targetId:target.id};
 if(SOCIAL_RULES[raw.kind].pair){if(raw.otherId===target.id||!allowed.has(raw.otherId)||!p.some(p=>p.id===raw.otherId))return null;out.otherId=raw.otherId;}
 return out;
}
export function localSocial(s,input){
 if(!input.scene)return null;
 const clauses=String(input.text).split(/[，。；！？\n]/).filter(t=>!/(不必|不要|无须|无需|不得|不可|不宜|不想|不愿|不能|未曾|没有|勿|毋)/.test(t)).join('。');
 let kind=/调解|和解|冰释|化解.*(?:矛盾|误会)/.test(clauses)?'reconcile':/争吵|争执|吵架|反目/.test(clauses)?'quarrel':/联手|合作|协力/.test(clauses)?'cooperate':/羞辱|侮辱|当众斥|威胁|恐吓/.test(clauses)?'humiliate':/欺骗|欺瞒|骗她|骗他/.test(clauses)?'deceive':/道歉|赔不是|赔礼|认错/.test(clauses)?'apologize':/安慰|宽慰|关怀|谈心|敞开心扉/.test(clauses)?'comfort':/救助|救下|庇护|维护|撑腰/.test(clauses)?'protect':/陪伴|陪她|陪他|陪.*(?:散步|游园|赏|读书|下棋)|一起.*(?:散步|游园|读书|下棋)/.test(clauses)?'accompany':null;
 if(!kind)return null;
 const named=socialNPCs(s).filter(p=>input.people?.includes(p.id)&&clauses.includes(p.name)),ids=named.length?named.map(p=>p.id):input.people||[];
 if(SOCIAL_RULES[kind].pair)return ids.length===2?normalizeSocial(s,{kind,targetId:ids[0],otherId:ids[1]},input):null;
 return ids.length===1?normalizeSocial(s,{kind,targetId:ids[0]},input):null;
}
export function socialKey(e){return [e.kind,...(e.otherId?[e.targetId,e.otherId].sort():[e.targetId])].join(':');}
export function socialRelation(s,a,b){return socialNPCs(s).find(p=>p.id===a)?.relations?.[b]??50;}
export function groupRelationModifier(s,ids){
 if(ids.length<2)return 0;let sum=0,n=0;
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){sum+=socialRelation(s,ids[i],ids[j])+socialRelation(s,ids[j],ids[i]);n+=2;}
 return Math.max(-8,Math.min(8,(sum/n-50)/5));
}
