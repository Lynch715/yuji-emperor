import {npcMemories} from '../core/memory.js';
import {socialNPCs,emperorKey} from '../core/social-rules.js';
import {esc,openDialog} from './common.js';
export function memoryButton(id,name=''){return '<button data-person-memory="'+esc(id)+'">'+esc(name?name+'的往事':'记得的事')+'</button>';}
export function relationName(s,id){return socialNPCs(s).find(p=>p.id===id)?.name||'';}
export function socialChangesHTML(s,changes=[]){
 if(!changes.length)return '';
 return '<div class="scene-changes" aria-label="相处变化">'+changes.map(c=>'<span>'+esc(relationName(s,c.personId))+' · '+esc(c.field==='relation'?'与'+relationName(s,c.withId)+'的关系':s.foreign.some(f=>f.id===c.personId)?'态度':'好感')+' '+(c.delta>0?'+':'')+Number(c.delta.toFixed(2))+'（'+esc(c.reason)+'）</span>').join('')+'</div>';
}
export function npcMemoryHTML(s,id){
 const p=socialNPCs(s).find(p=>p.id===id);if(!p)return '<p>名册中没有此人。</p>';
 const memories=npcMemories(s,id).filter(m=>['scene','scene-summary'].includes(m?.type)).sort((a,b)=>b.turn-a.turn||b.order-a.order);
 const relationships=Object.entries(p.relations||{}).filter(([other])=>relationName(s,other)).sort((a,b)=>a[1]-b[1]);
 const affinity=p.favor??p.attitude??p.relations?.[emperorKey(s)]??50;
 return '<article class="person-memories"><h3>'+esc(p.name)+'</h3><p>对当今天子的'+(p.attitude!==undefined?'态度':'好感')+' '+Number(affinity.toFixed(2))+'</p><h4>与他人的关系</h4>'+
 (relationships.length?'<ul>'+relationships.map(([other,v])=>'<li>'+esc(relationName(s,other))+'：'+(v>=65?'亲近':v<=35?'不睦':'平常')+' · '+Number(v.toFixed(2))+'</li>').join('')+'</ul>':'<p class="muted">尚无特别的往来。</p>')+
 '<h4>记得的事</h4>'+(memories.length?memories.map(m=>'<section class="memory-entry"><p class="muted">'+esc(m.era?.name?m.era.name+m.era.year+'年'+m.era.month+'月':'第'+m.turn+'旬')+(m.type==='scene-summary'?' · 相似往事 '+m.count+'次':'')+'</p><p>'+esc(m.summary)+'</p><button data-memory-scene="'+esc(m.sceneId)+'">看这段经历</button></section>').join(''):'<p class="muted">还没有一起经历过值得记下的事情。</p>')+'</article>';
}
export function openNPCMemory(s,id){openDialog('人物往事',npcMemoryHTML(s,id));}
