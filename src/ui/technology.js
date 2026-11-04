import { TECHS,TECH_LINES,INDUSTRIES,RESEARCH_CAP,researchLead,defaultResearchLead,techById } from '../core/tech-rules.js';
import { researchBlock,researchQuote } from '../core/tech.js';
import { industryQuote } from '../core/industries.js';
import { esc } from './common.js';
const n=x=>Number(x||0).toLocaleString('zh-CN',{maximumFractionDigits:2});
const options=(rows,selected)=>rows.map(([id,label,disabled])=>'<option value="'+esc(id)+'" '+(id===selected?'selected ':'')+(disabled?'disabled':'')+'>'+esc(label)+'</option>').join('');
function slotField(s,id){return '<label for="'+id+'">安排时辰</label><select id="'+id+'" name="development-slot">'+options(['朝','午','夜'].map(k=>[k,k+'间',!!s.schedule[k]]),['朝','午','夜'].find(k=>!s.schedule[k]))+'</select>';}
function planButton(s,label,enabled=true){
 const available=enabled&&!s.regency&&!s.pending&&!s.ending&&['朝','午','夜'].some(k=>!s.schedule[k]);
 return '<div class="dialog-actions"><button class="primary" type="submit" '+(available?'':'disabled')+'>'+label+'</button></div>';
}
export function researchFields(s){
 const current=s.tech.current,selected=current?.id||TECHS.find(t=>!researchBlock(s,t.id))?.id;
 const lead=researchLead(s,s.tech.lead)?.id||defaultResearchLead(s,techById(selected))?.id;
 return '<label for="research-id">研究方向</label><select id="research-id">'+options(TECHS.map(t=>[t.id,t.name+(s.tech.done.includes(t.id)?' · 已研成':researchBlock(s,t.id)?' · '+researchBlock(s,t.id):''),!!researchBlock(s,t.id)||!!current&&current.id!==t.id]),selected)+'</select>'+
  '<label for="research-lead">主持官员</label><select id="research-lead">'+options(s.court.officials.filter(o=>researchLead(s,o.id)).map(o=>[o.id,o.name+' · 政务 '+o.abilities.政]),lead)+'</select>'+
  '<label for="research-funding">每月经费（万两）</label><input id="research-funding" type="range" min="0" max="'+RESEARCH_CAP+'" step="0.5" value="'+s.tech.funding+'"><output id="research-funding-value" for="research-funding">'+n(s.tech.funding)+' 万两／月</output>'+
  '<p class="muted field-note">每月最多拨银20万两。停拨或换人，研习所得仍在。</p>';
}
export function industryFields(s,province=null){
 const selected=Object.entries(INDUSTRIES).find(([,r])=>s.tech.done.includes(r.tech))?.[0]||'farm';
 return '<label for="industry-province">主办州郡</label><select id="industry-province">'+options(s.nation.provinces.map(p=>[p.id,p.name+' · 繁荣 '+n(p.prosperity)]),province||s.nation.provinces[0].id)+'</select>'+
  '<label for="industry-type">产业</label><select id="industry-type">'+options(Object.entries(INDUSTRIES).map(([id,r])=>[id,r.name+(!s.tech.done.includes(r.tech)?' · 须研成'+techById(r.tech).name:''),!s.tech.done.includes(r.tech)]),selected)+'</select><p id="industry-quote" class="muted field-note">每州可兴办三类产业，各可扩建至三级。</p>';
}
export function industryForm(s,province=null){return '<form id="industry-plan">'+industryFields(s,province)+slotField(s,'industry-slot')+planButton(s,'安排兴业旨意',Object.values(INDUSTRIES).some(r=>s.tech.done.includes(r.tech)))+'</form>';}
export function technologyHTML(s){
 const c=s.tech.current,q=researchQuote(s),title=c?(c.name||q.tech.name):'格物待兴';
 const status='<section class="card research-status"><span class="eyebrow">格物近况</span><h3>'+esc(title)+'</h3>'+(c?'<progress aria-label="研究进度" max="'+q.tech.cost+'" value="'+c.progress+'"></progress><p>研习 '+n(c.progress)+'／'+q.tech.cost+' · 已历 '+c.elapsed+' 月，至少需 '+q.tech.months+' 月</p>':'<p>择一门技艺，延请能臣，开物成务。</p>')+
  '<p>主持 '+esc(q.lead?.name||'待委派')+' · 每月 '+n(s.tech.funding)+' 万两</p>'+(c?'<p class="muted">预计下月拨银 '+n(q.paid)+' 万两，研习进展 '+n(q.progress)+'。'+(q.opposed?'清议阻挠，进展稍缓。':'')+'</p>':'')+'</section>';
 const tree=TECH_LINES.map(line=>'<details class="tech-line section-spacer" open><summary>'+line+'</summary><div class="grid">'+TECHS.filter(t=>t.line===line).map(t=>{
  const done=s.tech.done.includes(t.id),reason=researchBlock(s,t.id);
  return '<article class="card tech-card"><div class="tech-heading"><h3>'+esc(t.name)+'</h3><span class="tech-status">'+(done?'已研成':c?.id===t.id?'研习中':reason?'尚待条件':'可研习')+'</span></div><p>所需研习 '+t.cost+' · 至少 '+t.months+' 月</p>'+(t.prereq.length||t.openSea?'<p class="muted">'+esc(t.prereq.length?'须先研成'+t.prereq.map(id=>techById(id).name).join('、'):'')+(t.openSea?(t.prereq.length?'，':'')+'须先开海':'')+'</p>':'')+'<p>'+esc([techBenefit(t),...(t.unlocks.length?['可兴办'+t.unlocks.map(id=>INDUSTRIES[id].name).join('、')]:[])].filter(Boolean).join('；'))+'</p></article>';
 }).join('')+'</div></details>').join('');
 return status+'<div class="development-plans"><section class="development-form"><h3>格物研习</h3><form id="research-plan">'+researchFields(s)+slotField(s,'research-slot')+planButton(s,'安排格物旨意',!!s.tech.current||TECHS.some(t=>!researchBlock(s,t.id)))+'</form></section><section class="development-form"><h3>兴业营建</h3>'+industryForm(s)+'</section></div>'+tree;
}
function techBenefit(t){
 const labels={grain:'粮产',cropProtection:'灾年粮产减损',riverDiscount:'修河节费',disasterProtection:'灾情减缓',prosperity:'每季繁荣',governance:'吏治',readiness:'战备',trade:'互市收入',production:'产业产出'};
 return Object.entries(t.effects).map(([key,v])=>labels[key]+(v>0?' +':' ')+(key==='prosperity'||key==='governance'||key==='readiness'?n(v):n(v*100)+'%')).join('；');
}
export function developmentAction(root,kind){
 const value=id=>root.querySelector('#'+id)?.value;
 return kind==='格物'?{kind:'下旨',edictType:kind,label:'格物 · '+(techById(value('research-id'))?.name||'经费调整'),techId:value('research-id'),lead:value('research-lead'),funding:Number(value('research-funding'))}:{kind:'下旨',edictType:kind,label:'兴业 · '+(INDUSTRIES[value('industry-type')]?.name||''),province:value('industry-province'),industry:value('industry-type')};
}
export function updateDevelopmentPreview(root,s){
 const funding=root.querySelector('#research-funding'),out=root.querySelector('#research-funding-value');
 if(funding&&out)out.textContent=n(funding.value)+' 万两／月';
 const quote=root.querySelector('#industry-quote');
 if(quote){
  const type=root.querySelector('#industry-type').value,province=root.querySelector('#industry-province').value;
  const q=industryQuote(s,province,type),r=INDUSTRIES[type];
  const yields=[r.grain?'粮 '+n(r.grain*q.level)+' 万石':'',r.tax?'税银 '+n(r.tax*q.level)+' 万两':'',r.cash?'收入 '+n(r.cash*q.level)+' 万两':'',r.trade?'互市 +'+n(r.trade*q.level*100)+'%':'',r.grainTransport?'粮运 +'+n(r.grainTransport*q.level*100)+'%':''].filter(Boolean).join('、');
  quote.textContent=q.blocked==='本州三个产业槽已满'?'本州已兴办三类产业，可扩建已有产业。':q.blocked||r.name+' '+q.level+'级 · 银 '+q.cost+' 万两 · 工期 '+q.months+' 月\n每季养护 '+n(r.maintenance*q.level)+' 万两\n参考季产：'+yields+'；繁荣 +'+n(r.prosperity*q.level)+'。收成随地方情势而变。'+(r.morale?'营建时民心 '+r.morale+'。':'')+(r.governance?'盐课稽查承压。':'')+(r.threat?'海防边患增加。':'');
 }
}
