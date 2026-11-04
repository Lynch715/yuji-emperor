import {localSocial} from '../core/social-rules.js';
import { normalizeIntents } from '../core/intents.js';
import { parseNumber, NUMBER_SOURCE } from './quantities.js';
export function intentInputs(schedule){return ['朝','午','夜'].flatMap(slot=>{const a=schedule[slot],inputs=[];if(['下旨','自拟情节'].includes(a?.kind)&&a.text?.trim())inputs.push({id:slot,slot,text:a.text.trim(),...(a.kind==='自拟情节'?{people:a.people,place:a.place||'',scene:true}:{})});for(const [id,d]of Object.entries(a?.decisions||{}))if(d?.remark?.trim())inputs.push({id:slot+':remark:'+id,slot,text:d.remark.trim()});return inputs;});}
export function intentMessages(state,inputs){
 const persons=[...state.court.officials.filter(o=>o.alive),...state.harem.consorts.filter(c=>c.health>0),...state.harem.children.filter(c=>c.health>0)].map(o=>({id:o.id,name:o.name}));
 return [{role:'system',content:'你是帝王游戏的意图解析员，只输出 JSON，不写剧情、不决定成败、不返回数值效果。将每条自由输入拆成动作。type 只选 kill/appoint/dismiss/promote/imprison/war/allocate/favor/decree/other。人物、官职、外邦只用名册已有ID，找不到则 other。怀孕、生育、小产只能 other，不得解析为玩家动作。allocate.amount 用游戏单位：银为万两、粮为万石、征兵为人；中文与阿拉伯混写也须准确换算。allocate.source 为 treasury/privy/grain 或调兵来源 capital/边境方向，destination 可为对应账户、军队capital/方向、州ID或政令名称。favor.amount 限-5至5。decree.edictType 使用普通政令名称。scene标记的输入是玩家尝试的情节梗概，不能把希望或NPC反应当作已成事实。people列出本场人物ID；无姓名的指代只在唯一人物时绑定，多人不明则other；地点和情感描写可other。scene内有明确的相处行为时，另给一个type:other的动作并附interaction:{kind,targetId,otherId}。kind仅选accompany陪伴、comfort安慰、apologize道歉、protect维护、humiliate羞辱、deceive欺瞒、reconcile调解、quarrel争执、cooperate合作；targetId必须在people中，后三种须明确两个不同人物，并用otherId给出另一人。闲聊不必附interaction，不生成数值，不把未发生的事当已发生。每个动作必须带原输入的inputId，保留愿望的真实意图，不增加动作。输出 {"actions":[{"inputId":"","type":"other","targetId":"","postId":"","countryId":"","operation":"","resource":"","amount":0,"source":"","destination":"","edictType":"","text":""}]}。'}, {role:'user',content:JSON.stringify({persons,posts:state.court.posts.map(p=>({id:p.id,name:state.postNames?.[p.id]||p.title})),countries:state.foreign.map(f=>({id:f.id,name:f.name})),provinces:state.nation.provinces.map(p=>({id:p.id,name:p.name})),inputs})}];
}
export function validateIntents(data,state,inputs){if(!Array.isArray(data?.actions))throw new Error('口谕动作列表缺失');return normalizeIntents(state,data.actions,inputs);}
// Offline trial parser resolves only explicit existing names; unknown wishes stay narrative.
export function localIntents(state,inputs){
 const actions=[];
 for(const input of inputs){
  const roster=[...state.court.officials,...state.harem.consorts,...state.harem.children];
  const explicit=roster.filter(o=>input.text.includes(o.name));
  const people=explicit.length?explicit:input.scene&&input.people?.length===1?roster.filter(o=>o.id===input.people[0]):[];
  const post=state.court.posts.find(p=>input.text.includes(state.postNames?.[p.id]||p.title)),country=state.foreign.find(f=>input.text.includes(f.name)||f.ruler&&input.text.includes(f.ruler))||(input.scene&&input.people?.length===1?state.foreign.find(f=>f.id===input.people[0]):null);
  for(const target of people){const type=/赐死|处死|斩首/.test(input.text)?'kill':/下狱|收监/.test(input.text)?'imprison':/罢免|革职/.test(input.text)?'dismiss':/任命|出任/.test(input.text)?'appoint':/升任|晋升/.test(input.text)?'promote':/嘉奖|申饬|赏罚/.test(input.text)?'favor':'other';if(type!=='other')actions.push({inputId:input.id,type,targetId:target.id,postId:post?.id,text:input.text,amount:/申饬/.test(input.text)?-5:5});}
  if(country&&/宣战|议和|出兵/.test(input.text))actions.push({inputId:input.id,type:'war',countryId:country.id,operation:input.text.match(/宣战|议和|出兵/)[0],text:input.text});
  const number=input.text.match(new RegExp('('+NUMBER_SOURCE+')(两|石|人)'));
  if(number&&/拨|调|征兵/.test(input.text))actions.push({inputId:input.id,type:'allocate',resource:number[2]==='石'?'grain':number[2]==='人'?'troops':'treasury',source:number[2]==='石'?'grain':'treasury',amount:parseNumber(number[1])/(number[2]==='人'?1:10000),destination:number[2]==='人'?'capital':/内帑/.test(input.text)?'privy':post?.id||(/修河/.test(input.text)?'修河':'政务'),text:input.text});
  const interaction=localSocial(state,input);if(interaction)actions.push({inputId:input.id,type:'other',text:input.text,interaction});
  if(!actions.some(a=>a.inputId===input.id))actions.push({inputId:input.id,type:'other',text:input.text});
 }
 return normalizeIntents(state,actions,inputs);
}
