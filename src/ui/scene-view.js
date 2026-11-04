import {memoryButton,socialChangesHTML} from './memories.js';
import {esc} from './common.js';
import {scenePeople,sceneOutcomeText} from '../core/scenes.js';
export function sceneActionFields(s,old={}){
 return '<fieldset class="scene-people"><legend>一起经历的人（可多选，不选则独处）</legend><div class="scene-people-list">'+scenePeople(s).map(p=>'<label class="check"><input type="checkbox" name="scene-person" value="'+esc(p.id)+'" '+(old.people?.includes(p.id)?'checked':'')+'>'+esc(p.name)+'</label>').join('')+'</div></fieldset><label for="scene-place">地点（选填）</label><input id="scene-place" maxlength="120" value="'+esc(old.place||'')+'" placeholder="如：御花园、书房、城外驿站"><label for="scene-text">想发生怎样的故事</label><textarea id="scene-text" required maxlength="8000" rows="6" placeholder="如：陪她在御花园散步，聊聊近日心事，希望她说出自己的顾虑。">'+esc(old.text||'')+'</textarea><p class="muted">每场耗精力1。人物会记得共同经历，亲疏随相处变化；成败按当前自由度判断。起驾后展开故事，还可接着写。</p>';
}
export function sceneChapterHTML(h,slot,active=false,state=null){
 return (h.scenes||[]).filter(r=>r.slot===slot).map(r=>'<section class="scene-story"><p class="muted">'+esc([r.people.map(p=>p.name).join('、')||'独处',r.place,sceneOutcomeText(r.outcome)].filter(Boolean).join(' · '))+'</p>'+(state?socialChangesHTML(state,r.socialChanges||[]):'')+'<div class="scene-memory-links">'+r.people.map(p=>memoryButton(p.id,p.name)).join('')+'</div><details><summary>原定情节</summary><p>'+esc(r.text)+'</p></details>'+r.steps.map(t=>'<div class="scene-continuation">'+(state?socialChangesHTML(state,t.socialChanges||[]):'')+'<p class="scene-request">接着写：'+esc(t.request)+'</p><p>'+esc(t.prose).replace(/\n+/g,'</p><p>')+'</p></div>').join('')+(active?'<button class="scene-continue" data-scene="'+esc(r.id)+'">接着写</button>':'')+'</section>').join('');
}

export function sceneActionLabel(s,a){
 const names=a.people.map(id=>scenePeople(s).find(p=>p.id===id)?.name||id);
 return [(names.slice(0,3).join('、')+(names.length>3?'等人':''))||'独处',a.place].filter(Boolean).join(' · ');
}
