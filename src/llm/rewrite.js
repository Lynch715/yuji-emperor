import {validateTurn,cleanText} from './validate.js';
import {worldRules,roster,settlementDigest} from './prompts.js';
const split=text=>text.split(/(?<=[。！？\n])/);
export function inspectNarrative(data,forecast){
 const violations=[];
 const narrative=validateTurn(data,forecast,{onViolation:v=>violations.push({...v,id:'v'+violations.length})});
 return {narrative,violations};
}
export function rewriteMessages(forecast,violations){
 const s=forecast.state;
 return [{role:'system',content:worldRules(s)+'\n【句子改写任务】只改列出的违规句，保留原有文风与原意中成立的部分；无依据的断言改为未然、疑问或人物反应，不虚构人物、数值或结果。不要改其他句子，不解释校验。每个ID只返回一条改写。仅输出 {"rewrites":[{"id":"v0","text":"改写后的句子"}]}。'},
 {role:'user',content:JSON.stringify({violations:violations.map(({id,sentence,reason})=>({id,sentence,reason})),results:{facts:forecast.facts||[],slots:forecast.slotResults,notes:forecast.notes,ledger:settlementDigest(s,forecast.entries),roster:roster(s),intents:s.intentResults||[]}})}];
}
export function validateRewrites(data){
 if(!Array.isArray(data?.rewrites))throw new Error('改写列表缺失');
 return {rewrites:data.rewrites.filter(r=>r&&typeof r.id==='string'&&typeof r.text==='string')};
}
export function applySentenceRewrites(data,violations,response){
 const out=structuredClone(data),patches=new Map(),fields=new Map();
 for(const r of response?.rewrites||[])if(!patches.has(r.id))patches.set(r.id,r.text);
 for(const v of violations){
  const text=patches.get(v.id);if(typeof text!=='string'||!text.trim()||text.length>Math.min(v.limit,v.sentence.length*2+100))continue;
  const key=JSON.stringify(v.path);if(!fields.has(key)){
   let parent=out;for(const p of v.path.slice(0,-1))parent=parent[p];const field=v.path.at(-1);
   fields.set(key,{parent,field,parts:split(cleanText(parent[field],v.limit))});
  }
  fields.get(key).parts[v.index]=text;
 }
 for(const {parent,field,parts}of fields.values())parent[field]=parts.join('');
 return out;
}
