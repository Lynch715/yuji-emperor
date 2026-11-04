import {memoryContext} from '../core/memory.js';
import { SCENE_RULES } from './scene-rules.js';
import {worldRules,dynastyBible,roster,settlementDigest} from './prompts.js';

export function sceneMessages(state,f){
 const h=state.history.at(-1),r=h.scenes.find(r=>r.id===f.sceneId);
 return [{role:'system',content:worldRules(f.state)+'\n'+SCENE_RULES+'\n只续写本场的新一段，不重复旧段。写200至600字，用自然段。输出 {"chapter":{"朝":"","午":"","夜":""},"summary":"情节续写","sceneMemories":[{"slot":"'+f.slot+'","personId":"","evidence":"正文完整原句"}]}，只填写'+f.slot+'这一段，其余留空。'},
 {role:'user',content:dynastyBible(f.state,{people:r.people,request:f.request,results:f.results})+'\n'+JSON.stringify({人物往事:memoryContext(state,r.people.map(p=>p.id)),场景:{人物:r.people,地点:r.place,原梗概:r.text,原结果:r.outcome},先前经过:[h.chapter[r.slot],...r.steps.slice(-6).map(t=>t.prose)],玩家接着写:f.request,本次结果:f.outcome,相处变化:f.socialChanges||[],实质行动:f.results,事实:f.facts,钱粮:settlementDigest(f.state,f.entries),当前名册:roster(f.state)})}];
}
export function mockSceneProse(r,results=[]){
 const names=r.people.slice(0,3).map(p=>p.name).join('、')+(r.people.length>3?'等人':''),where=r.place?'在'+r.place:'这一日';
 const opening=names?where+'，皇帝与'+names+'相见，话语从眼前的事情慢慢说开。':where+'，皇帝暂且独处，将心中所想细细理过。';
 const end=r.outcome.status==='success'?'事情渐渐朝皇帝所盼的方向发展，这番心意得到了回应。':r.outcome.status==='partial'?'事情虽有了进展，却也留下须承担的代价，余下的话还得慢慢说。':'对方的顾虑尚未消除，这番尝试未能如愿，事情仍有转圜的余地。';
 return opening+'\n\n'+(results.length?results.map(x=>x.summary.replace(/^口谕/,'所议之事')).join('。')+'。':end)+(r.outcome.cost?'\n\n此次'+r.outcome.cost+'。':'');
}
export function mockSceneNarrative(state,f){
 const r=state.history.at(-1).scenes.find(r=>r.id===f.sceneId);
 const prose=mockSceneProse({...r,outcome:f.outcome},f.results);
 const opening=r.people.length?'先前的话题又延续了片刻，皇帝没有急着定论，留意着这件事带来的变化。':'独处的片刻渐渐过去，皇帝又将先前的思绪往下理了理。';
 return {chapter:{朝:'',午:'',夜:'',[f.slot]:opening+'\n\n'+prose.split('\n\n').slice(1).join('\n\n')},fixNotes:[]};
}
