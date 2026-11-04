import {rememberNPCScene} from './memory.js';
import {applySceneSocial} from './social.js';
import {localSocial,groupRelationModifier,emperorKey} from './social-rules.js';
import {clone,assertState,migrate,VERSION} from './state.js';
import {roll,check} from './rng.js';
import {adjudicate} from './freedom.js';
import {intentActionKey,resolveIntents} from './intents.js';
import {auditChanges} from './audit.js';
import {canVisit} from './harem.js';
export const SCENE_ENERGY=1;
export function scenePeople(s,inactive=false){return [...s.court.officials.filter(o=>inactive||o.alive&&o.health>0),...s.harem.consorts.filter(c=>inactive||c.health>0&&!c.retired),...s.harem.children.filter(c=>inactive||c.health>0),...s.foreign.map(f=>({...f,name:f.ruler||f.name}))];}
export function sceneBlock(s,a,historical=false){
 const recall=historical&&/^(?:接着写|继续)/.test(a.text||'')||historical&&/追忆|回忆|回想|善后|后事|收殓/.test(a.text||'');
 if(!Array.isArray(a.people)||new Set(a.people).size!==a.people.length||a.people.some(id=>!scenePeople(s,recall).some(p=>p.id===id)))return '请选择名册中仍可参与的人物';
 if(typeof a.text!=='string'||!a.text.trim()||a.text.length>8000)return '请写下八千字以内的情节梗概';
 if(a.place!==undefined&&(typeof a.place!=='string'||a.place.length>120))return '地点请写在一百二十字以内';
 const affirmative=a.text.split(/[，。；！？\n]/).filter(t=>!/(不必|不要|无需|无须|不得|不可|不宜|不想|不愿|不能|勿|毋|未曾|没有)/.test(t)).join('。');
 if(/侍寝|临幸|圆房|同寝|共枕|同房|行房|交欢|交合|性行为|性交|交媾|床笫|鱼水之欢|共赴云雨|巫山云雨|共度春宵/.test(affirmative)&&(a.people.length!==1||!canVisit(s,s.harem.consorts.find(c=>c.id===a.people[0]))))return '此时不能安排侍寝，可以改为探望或交谈';
 return '';
}
export function resolveScene(state,action,actions,slot,source,previous=null){
 const blocked=sceneBlock(state,action,!!previous);if(blocked)throw new Error(blocked);
 const people=action.people.map(id=>{const p=scenePeople(state,true).find(p=>p.id===id);return {id,name:p.name};});
 let s=clone(state),results=[],facts=[],outcome;
 const key=intentActionKey;
 const real=actions.filter(a=>a.type!=='other');
 if(real.length){
  const priorResults=previous?[...(previous.results||[]),...previous.steps.flatMap(t=>t.results)]:[],reuse=new Map();
  const fresh=real.filter(a=>{const r=!/再拨|再赏|追加|另拨|另赏|再给/.test(a.text)&&priorResults.find(r=>r.actionKey===key(a));if(r){reuse.set(a.id,r);return false;}return true;});
  const chapter=previous?state.history.at(-1):null;
  // Model reactions and scene effects already appear in the current ledger.
  const favorHistory=chapter?.intentResults||[];
  const r=resolveIntents(s,fresh,{slot,source,favorHistory});s=r.state;r.results.forEach((r,i)=>r.actionKey=key(fresh[i]));
  results=real.map(a=>reuse.has(a.id)?{...reuse.get(a.id),reused:true}:r.results[fresh.findIndex(x=>x.id===a.id)]);facts=[...r.facts,...[...reuse.values()].flatMap(r=>r.facts||[])];
  const completed=results.filter(r=>['success','partial'].includes(r.status));
  outcome={status:!completed.length?'failed':completed.length<results.length||results.some(r=>r.status==='partial')?'partial':'success',die:results.find(r=>r.die)?.die??null,...(results.every(r=>r.reused)?{reused:true}:{}),...(results.some(r=>r.cost&&(!r.reused||results.every(x=>x.reused)))?{cost:results.filter(r=>r.cost&&(!r.reused||results.every(x=>x.reused))).map(r=>r.cost).join('；')}:{})};
 }else if(previous&&/^(?:接着写|继续|继续写|继续描写|继续这(?:一)?段(?:情节)?)[。！\s]*$/.test(action.text.trim())){outcome={...(previous.steps.at(-1)?.outcome||previous.outcome),reused:true};
 }else{
  const people=action.people.map(id=>scenePeople(s,true).find(p=>p.id===id));
  const opposition=people.length?people.reduce((n,p)=>n+(p.abilities?.权谋??p.scheming??30),0)/people.length:0;
  const favor=people.length?people.reduce((n,p)=>n+(p.favor??p.attitude??p.relations?.[emperorKey(s)]??50),0)/people.length/5:10;
  const attr=/试探|调查|套话|揭穿|逼问/.test(action.text)?'权谋':/吟诗|作诗|赋诗|书画/.test(action.text)?'文采':'魅力';
  const r=roll(s);s=r.state;
  const judged=adjudicate(s,check(s.emperor.talents[attr],r.value,'一般',opposition,favor+groupRelationModifier(s,action.people)),action.people[0]);s=judged.state;
  outcome={status:judged.verdict.partial?'partial':judged.verdict.success?'success':'failed',die:r.value,...(judged.verdict.cost?{cost:judged.verdict.cost}:{})};
 }
 const plans=actions.filter(a=>a.interaction).map(a=>a.interaction);
 const fallback=localSocial(state,{scene:true,people:action.people,text:action.text});if(!plans.length&&fallback)plans.push(fallback);
 const social=applySceneSocial(s,plans,outcome,source,previous);s=social.state;
 facts.push({kind:'scene_result',slot,status:outcome.status});
 return {state:s,results,facts,record:{slot,people,emperorId:emperorKey(state),emperorName:state.emperor.name,place:action.place||'',text:action.text.trim(),outcome,results,social:social.events,socialChanges:social.changes,steps:[]}};
}
export function latestScene(s,id){const h=s.history.at(-1);return !s.talks.some(t=>t.turn===s.turn)&&h?.turn===s.turn?h.scenes?.find(r=>r.id===id):null;}
export function sceneInput(s,r,text){return {id:r.id+':'+(r.steps.length+1),slot:r.slot,text,people:r.people.map(p=>p.id),scene:true,place:r.place};}
export function sceneBudget(s){return {used:0,...(s.history.at(-1)?.rewriteAttempted?{rewriteAttempted:true}:{})};}
export function forecastScene(state,id,text,actions=[]){
 if(state.pending)throw new Error('请先续完正在进行的故事');
 if(state.ending)throw new Error('本朝已封卷');
 const record=latestScene(state,id);if(!record)throw new Error('这段情节已经过去，请另排新的情节');
 const input=sceneInput(state,record,text),turnId=record.id+':续'+(record.steps.length+1)+':'+state.revision;
 const r=resolveScene(state,{people:input.people,place:input.place,text},actions.filter(a=>a.inputId===input.id),record.slot,turnId,record);
 const entries=auditChanges(state,r.state,r.state.ledger.slice(state.ledger.length),'自拟情节：接着写');
 const s=r.state;s.revision++;s.pending=null;s.turnBudget=null;s.ledger=[...state.ledger,...entries];
 delete s.history;delete s.volumes;
 assertState(s);
 return {kind:'scene',historyDetached:true,turnId,runId:state.runId,baseTurn:state.turn,baseRevision:state.revision,baseFingerprint:JSON.stringify({rng:state.rng,turn:state.turn,revision:state.revision}),sceneId:id,chapterId:state.history.at(-1).id,slot:record.slot,request:text.trim(),sequence:record.steps.length+1,outcome:r.record.outcome,results:r.results,social:r.record.social,socialChanges:r.record.socialChanges,people:record.people,state:s,entries,die:r.record.outcome.die,fate:'情节续写',facts:r.facts,newMemorials:[],notes:[],slotResults:{朝:[],午:[],夜:[],[record.slot]:[sceneOutcomeText(r.record.outcome),...r.results.map(r=>r.summary)]},schedule:{}};
}
export function sceneOutcomeText(o){return ({success:'如愿',partial:'有所进展，也有代价',failed:'未能如愿'}[o.status])+(o.cost?'：'+o.cost+(o.reused?'（此前已承担）':''):'');}
export function commitScene(state,f,narrative){
 if(state.receipts.includes(f.turnId))return clone(state);
 if(f.kind!=='scene'||state.runId!==f.runId||f.state.runId!==state.runId||f.state.turn!==state.turn||f.state.revision!==state.revision+1||state.turn!==f.baseTurn||state.revision!==f.baseRevision||f.baseFingerprint!==JSON.stringify({rng:state.rng,turn:state.turn,revision:state.revision})||!latestScene(state,f.sceneId)||state.history.at(-1).id!==f.chapterId)throw new Error('这段续写已经过期，不能写入此进度');
 const prose=narrative.chapter?.[f.slot]?.trim();if(!prose||prose.length>2400)throw new Error('情节尚未续完，请重试');
 let s=f.state.v<VERSION?migrate(f.state):clone(f.state);s.v=VERSION;
 if(f.historyDetached){s.history=clone(state.history);s.volumes=[...state.volumes];s.volumeIndex=[...(state.volumeIndex||[])];}
 const h=s.history.at(-1),r=h.scenes.find(r=>r.id===f.sceneId);r.steps.push({id:f.turnId,sequence:f.sequence,request:f.request,prose,outcome:clone(f.outcome),memoryVersion:19,memoryNotes:clone(narrative.sceneMemories||[]),results:clone(f.results),social:clone(f.social||[]),socialChanges:clone(f.socialChanges||[]),entries:clone(f.entries)});
 if(state.turnBudget?.rewriteAttempted)h.rewriteAttempted=true;
 h.entries.push(...clone(f.entries));h.settlement??={slotResults:{}};h.settlement.slotResults[f.slot]??=[];h.settlement.slotResults[f.slot].push('接着写 · '+sceneOutcomeText(f.outcome),...f.results.map(r=>r.summary));
 s=rememberScene(s,r,prose,{...r.steps.at(-1),turn:s.turn},narrative.sceneMemories||[],h.era);
 h.settlement.facts=[...(h.settlement.facts||[]),...clone(f.facts)];
 for(const result of s.intentResults)if(result.turn===s.turn&&f.results.some(r=>r.id===result.id))result.sceneCommitted=true;
 s.receipts.push(f.turnId);s.pending=null;s.turnBudget=null;
 // Scene edits must survive the next turn without being applied again.
 s.interimEntries=[...(state.interimEntries||[])];
 assertState(s);return s;
}

export function rememberScene(s,r,prose,phase=r,notes=[],era=null){
 if(!prose)return s;
 s=rememberNPCScene(s,r,phase,prose,notes,era);
 const key='共同经历:'+r.id;s.facts=s.facts.filter(f=>f.key!==key);
 s.facts.push({subject:r.people.map(p=>p.name).join('、')||s.emperor.name,key,value:String(prose).slice(0,350),turn:s.turn,private:true,people:r.people.map(p=>p.id)});s.facts=s.facts.slice(-100);return s;
}
