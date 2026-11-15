import {TECHS,INDUSTRIES,identifyTech,identifyIndustry} from '../core/tech-rules.js';
import {localSocial} from '../core/social-rules.js';
import { normalizeIntents } from '../core/intents.js';
import { parseNumber, NUMBER_SOURCE } from './quantities.js';
import { normalizeMemorialAction } from '../core/memorial-decisions.js';
import {fiatEnabled} from '../core/fiat.js';
import {fiatIntentMessages,localFiatOperations} from './fiat-intents.js';
import {EDICTS, provinceMentioned} from '../core/edicts.js';

const edictWords = [
 ['赈灾', /赈灾|赈济|救灾|赈恤/],
 ['减赋', /减赋|减税|免赋|蠲免赋税/],
 ['加税', /加税|加赋|增税/],
 ['修河', /修河|治河|修堤|筑堤|疏浚河道/],
 ['整饬吏治', /整饬(?:吏治)?|整顿吏治|肃清吏治/],
 ['征兵', /征兵|募兵|招募兵丁/],
 ['大赦', /大赦/],
 ['修园', /修园|修缮御苑/],
 ['编修大典', /编修大典|编纂大典/],
 ['开海', /开海|开放海禁/],
 ['禅位', /禅位/],
 ['禁令', /颁布禁令|颁行禁令|下达禁令/],
];
const decreeClauses = text => text.split(/[。！？；;\n]/).map(line => line.trim()).filter(Boolean);
const negativeOrder = /(?:暂缓|暂停|不必|不要|无需|无须|不许|不得|不可|禁止|免去|停止|勿|毋).*?(?:赈|救灾|修|治河|税|赋|整|征兵|募兵|赦|开海|禅位|赐死|处死|斩首|下狱|收监|罢免|革职|任命|出任|升任|晋升|嘉奖|申饬|赏罚|宣战|议和|出兵|拨|调)/;
const ordinaryEdict = text => edictWords.find(([, pattern]) => pattern.test(text))?.[0];
export function edictFromText(text) {
 for (const line of decreeClauses(text)) {
  if (negativeOrder.test(line)) continue;
  const type = ordinaryEdict(line);
  // An explicit headcount is a troop allocation handled by the intent engine.
  if (type && !(type==='征兵' && new RegExp(NUMBER_SOURCE+'\\s*人').test(line))) return type;
 }
}
const CARD_EDICT_GUIDANCE = '输入若含 edictType，表示玩家已选该政令，由引擎办理。附言只有催办等套语时返回 other；附言明确拨银或调粮用于该政令时，用 allocate 并以该政令名为 destination，州郡用 province（州ID）。同一项拨款和政令不要拆成扣款与建项两步。分别解析独立任免等动作。';

export function intentInputs(schedule) {
 return ['朝','午','夜'].flatMap(slot => {
  const a = normalizeMemorialAction(schedule[slot]), inputs = [];
  if (['下旨','自拟情节'].includes(a?.kind) && a.text?.trim()) {
   const fields = a.kind==='自拟情节' ? {people:a.people,place:a.place||'',scene:true} :
    !a.placeholder && Object.hasOwn(EDICTS,a.edictType) ? {edictType:a.edictType,province:a.province||null} : {};
   inputs.push({id:slot,slot,text:a.text.trim(),...fields});
  }
  for (const [id,d] of Object.entries(a?.decisions||{})) {
   if (d?.remark?.trim()) inputs.push({id:slot+':remark:'+id,slot,text:d.remark.trim()});
  }
  return inputs;
 });
}
export function intentMessages(state,inputs){
 if(fiatEnabled(state))return fiatIntentMessages(state,inputs,CARD_EDICT_GUIDANCE);
 const relevant=inputs.filter(i=>/研制|研究|研习|格物|发明|改良|研新|兴业|兴建|建造|开设|设立/.test(i.text));
 const techNames=[...new Map(relevant.filter(i=>/研|格物|发明|改良/.test(i.text)).map(i=>identifyTech(state,i.text)).filter(Boolean).map(t=>[t.id,{id:t.id,name:t.name,line:t.line}])).values()];
 const industryNames=[...new Set(relevant.map(i=>identifyIndustry(i.text)).filter(Boolean))].map(id=>({id,name:INDUSTRIES[id].name}));
 const persons=[...state.court.officials.filter(o=>o.alive),...state.harem.consorts.filter(c=>c.health>0),...state.harem.children.filter(c=>c.health>0)].map(o=>({id:o.id,name:o.name}));
 return [{role:'system',content:CARD_EDICT_GUIDANCE+' 你是帝王游戏的意图解析员，只输出 JSON，不写剧情、不决定成败、不返回数值效果。将每条自由输入拆成动作。type 只选 kill/appoint/dismiss/promote/imprison/war/allocate/favor/decree/other。人物、官职、外邦只用名册已有ID，找不到则 other。怀孕、生育、小产只能 other，不得解析为玩家动作。allocate.amount 用游戏单位：银为万两、粮为万石、征兵为人；中文与阿拉伯混写也须准确换算。allocate.source 为 treasury/privy/grain 或调兵来源 capital/边境方向，destination 可为对应账户、军队capital/方向、州ID或政令名称。favor.amount 限-5至5。decree.edictType 使用普通政令名称，也可格物/兴业。研究经费使用allocate，destination="tech"，amount为每月万两，techId从技艺名册选；lead为主持官员ID，可省略。兴业使用decree.edictType="兴业"，industry为产业ID，province为州ID。不拆成第二次普通拨款。自拟新发明仅在自由度free时附customName和techLine（农政/水利/工商/盐铁/海贸），techId映射最近技艺；不得自造效果。scene标记的输入是玩家尝试的情节梗概，不能把希望或NPC反应当作已成事实。people列出本场人物ID；无姓名的指代只在唯一人物时绑定，多人不明则other；地点和情感描写可other。scene内有明确的相处行为时，另给一个type:other的动作并附interaction:{kind,targetId,otherId}。kind仅选accompany陪伴、comfort安慰、apologize道歉、protect维护、humiliate羞辱、deceive欺瞒、reconcile调解、quarrel争执、cooperate合作；targetId必须在people中，后三种须明确两个不同人物，并用otherId给出另一人。闲聊不必附interaction，不生成数值，不把未发生的事当已发生。每个动作必须带原输入的inputId，保留愿望的真实意图，不增加动作。每条 :remark: 输入同时在 remarks 中返回 {inputId,remarkKind}，remarkKind 仅选嘉奖/申饬/附旨/无；识别否定，责成核查为附旨，不必嘉奖为无。嘉奖申饬已有朱批结算，不再生成重复的favor动作；实质拨款、任免等仍解析为动作。输出 {"remarks":[{"inputId":"","remarkKind":"无"}],"actions":[{"inputId":"","type":"other","targetId":"","postId":"","countryId":"","operation":"","resource":"","amount":0,"source":"","destination":"","edictType":"","text":""}]}。'}, {role:'user',content:JSON.stringify({freedom:state.settings.freedom,technologies:techNames,industries:industryNames,persons,posts:state.court.posts.map(p=>({id:p.id,name:state.postNames?.[p.id]||p.title})),countries:state.foreign.map(f=>({id:f.id,name:f.name})),provinces:state.nation.provinces.map(p=>({id:p.id,name:p.name})),inputs})}];
}
export function validateIntents(data,state,inputs){
 if(!Array.isArray(data?.actions))throw new Error('口谕动作列表缺失');
 const actions=data.actions.filter(a=>inputs.some(i=>a?.inputId===i.id)).map(a=>{
  if(a.type!=='allocate'||typeof a.destination!=='string'||Object.hasOwn(EDICTS,a.destination))return a;
  const type=ordinaryEdict(a.destination);
  return type?{...a,destination:type}:a;
 });
 return normalizeIntents(state,actions,inputs);
}
// Offline trial parser resolves only explicit existing names; unknown wishes stay narrative.
export function localIntents(state,inputs){
 const actions=[];
 for(const input of inputs){
  const fiat=localFiatOperations(state,input);
  if(fiat){actions.push(fiat.error?{inputId:input.id,type:'other',text:fiat.error,reason:'试读无法完整解析'}:{inputId:input.id,type:'fiat',text:input.text,operations:fiat.operations});continue;}
  const research=/研制|研究|研习|格物|发明|改良|研新/.test(input.text),industrial=/兴建|兴业|建造|设立|开设/.test(input.text)&&identifyIndustry(input.text);
  if(research){
   const known=TECHS.find(t=>input.text.includes(t.name)||t.aliases.some(a=>input.text.includes(a))),tech=known||identifyTech(state,input.text);
   if(known||state.settings.freedom==='free'){
    const number=input.text.match(new RegExp('('+NUMBER_SOURCE+')(两)'));
    actions.push({inputId:input.id,type:'allocate',destination:'tech',resource:'treasury',source:'treasury',amount:number?parseNumber(number[1])/10000:state.tech?.funding||5,techId:tech.id,...(!known?{customName:input.text.replace(/^.*?(?:研制|研究|发明|改良|研习|格物)[：:\s]*/,'').replace(/[，,。；;].*$/,'').replace(/每月.*|拨.*|花.*$/,'').trim().slice(0,40)||input.text.slice(0,40),techLine:tech.line}:{})});
    continue;
   }
  }
  if(industrial){actions.push({inputId:input.id,type:'decree',edictType:'兴业',industry:industrial,province:state.nation.provinces.find(p=>input.text.includes(p.name))?.id,text:input.text});continue;}
  const roster=[...state.court.officials,...state.harem.consorts,...state.harem.children];
  for(const line of decreeClauses(input.text)){
   if(negativeOrder.test(line))continue;
   const type=ordinaryEdict(line),province=provinceMentioned(state,line);
   const post=state.court.posts.find(p=>line.includes(state.postNames?.[p.id]||p.title));
   const country=state.foreign.find(f=>line.includes(f.name)||f.ruler&&line.includes(f.ruler))||
    (input.scene&&input.people?.length===1?state.foreign.find(f=>f.id===input.people[0]):null);
   const named=roster.filter(o=>line.includes(o.name));
   const personType=/赐死|处死|斩首/.test(line)?'kill':/下狱|收监/.test(line)?'imprison':
    /罢免|革职/.test(line)?'dismiss':/任命|出任/.test(line)?'appoint':/升任|晋升/.test(line)?'promote':/嘉奖|申饬|赏罚/.test(line)?'favor':null;
   const referenced=post?.holder&&['kill','imprison','dismiss'].includes(personType)?post.holder:
    input.scene&&input.people?.length===1?input.people[0]:null;
   const people=named.length?named:roster.filter(o=>o.id===referenced);
   if(personType)for(const target of people)actions.push({inputId:input.id,type:personType,targetId:target.id,postId:post?.id,text:line,amount:/申饬/.test(line)?-5:5});
   if(country&&/宣战|议和|出兵/.test(line))actions.push({inputId:input.id,type:'war',countryId:country.id,operation:line.match(/宣战|议和|出兵/)[0],text:line});

   const number=line.match(new RegExp('('+NUMBER_SOURCE+')\\s*(两|石|人)'));
   const amount=number?parseNumber(number[1])/(number[2]==='人'?1:10000):0;
   const project=type&&EDICTS[type].months&&(!EDICTS[type].private||/内帑/.test(line))?type:null;
   const allocation=number&&Number.isFinite(amount)&&(amount>0||project)&&/拨|调|征兵|募兵/.test(line);
   if(allocation){
    const resource=number[2]==='石'?'grain':number[2]==='人'?'troops':'treasury';
    const destination=resource==='troops'?'capital':project||(/内帑/.test(line)?'privy':post?.id||'政务');
    const source=resource==='grain'?'grain':project&&EDICTS[project].private?'privy':'treasury';
    actions.push({inputId:input.id,type:'allocate',resource,source,destination,province,amount,text:line});
   }
   if(type&&!(allocation&&(project||type==='征兵'&&number[2]==='人')))
    actions.push({inputId:input.id,type:'decree',edictType:type,province,text:line});
  }
  const interaction=localSocial(state,input);if(interaction)actions.push({inputId:input.id,type:'other',text:input.text,interaction});
  if(!actions.some(a=>a.inputId===input.id))actions.push({inputId:input.id,type:'other',text:input.text});
 }
 return normalizeIntents(state,actions,inputs);
}
