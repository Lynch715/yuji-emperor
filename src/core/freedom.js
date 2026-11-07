import { roll } from './rng.js';
import { applyPackage } from './effects.js';
export const FREEDOM_RULES=Object.freeze({
 free:Object.freeze({label:'想做就成',note:'口谕必成，行动限制更少，人物更愿接话配合；钱粮仍以现有家底为限。',k:1,collapseImmune:true,courtLimit:Infinity,referrals:Infinity,talkRounds:Infinity,talkMultiplier:Infinity,appointmentAge:18,firstRankTalent:0,otherTalent:0,edictCooldown:0,selectionPeriod:0,rankCaps:false,tradeCooldown:0,energyPenalty:0.5}),
 mid:Object.freeze({label:'多数能成',note:'办事较容易，难事有时要多花钱、做让步或承担损失。',k:0.5,collapseImmune:false,partialCosts:Object.freeze({treasury:1,favor:3,morale:0.5}),courtLimit:Infinity,referrals:Infinity,talkRounds:Infinity,talkMultiplier:2,appointmentAge:20,firstRankTalent:30,otherTalent:15,edictCooldown:0,selectionPeriod:2,rankCaps:true,tradeCooldown:0,energyPenalty:1}),
 real:Object.freeze({label:'成败看实力',note:'按人物能力、朝局和天命判断，办事门槛也更严格。',k:0,collapseImmune:false,courtLimit:Infinity,referrals:Infinity,talkRounds:Infinity,talkMultiplier:1,appointmentAge:25,firstRankTalent:40,otherTalent:25,edictCooldown:0,selectionPeriod:3,rankCaps:true,tradeCooldown:0,energyPenalty:1}),
});
export function freedomRules(state){return FREEDOM_RULES[state?.settings?.freedom]||FREEDOM_RULES.mid;}
export function successProbability(p,state){return p+(1-p)*freedomRules(state).k;}
export function selectionYear(state){const period=freedomRules(state).selectionPeriod;return !period||(Math.floor(state.turn/36)+1)%period===1;}
// Strict consumes no additional dice. Mid first upgrades failures, then offers a costly partial success.
export function adjudicate(state,verdict,personId=null){
 const mode=freedomRules(state);if(!mode.k)return {state,verdict};
 if(verdict.success||mode.k===1)return {state,verdict:{...verdict,success:true,partial:false}};
 let r=roll(state,1,100),s=r.state;
 if(r.value<=mode.k*100)return {state:s,verdict:{...verdict,success:true,partial:false}};
 r=roll(s,1,100);s=r.state;
 if(r.value>50)return {state:s,verdict:{...verdict,success:false,partial:false}};
 r=roll(s,1,3);s=r.state;
 const person=s.court.officials.find(o=>o.id===personId&&o.alive&&o.favor>0);
 let costKind=r.value;if(costKind===2&&!person)costKind=3;if(costKind===3&&s.nation.morale<=0)costKind=1;
 const cost=costKind===1?{treasury:-mode.partialCosts.treasury}:costKind===2?{official:{id:person.id,favor:-mode.partialCosts.favor}}:{morale:-mode.partialCosts.morale};
 const costLabel=costKind===1?'额外支出'+mode.partialCosts.treasury+'万两':costKind===2?person.name+'好感下降':'民心小降';
 s=applyPackage(s,cost,'办成此事的代价：'+costLabel);
 return {state:s,verdict:{...verdict,success:true,partial:true,cost:costLabel}};
}
