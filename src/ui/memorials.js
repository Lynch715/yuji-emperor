import { onDialogExit } from "./request-scope.js";
import { $, esc, openDialog, closeDialog, toast } from "./common.js";
import { forecastTurn } from "../core/turn.js";
import { EDICTS, execution } from "../core/edicts.js";
const number=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
export function createMemorialSession(s,kind,preferred='朝',startId=null) {
  const slot=kind==='上朝'?'朝':(['朝','午'].includes(preferred)?preferred:'朝');
  const old=s.schedule[slot]?.kind===kind?s.schedule[slot]:null;
  let ids=old?.memorials?.filter(id=>s.memorials.some(m=>m.id===id))||s.memorials.slice(0,kind==='上朝'?3:6).map(m=>m.id);
  if(startId) ids=[startId];
  const choices={};
  if(old&&!startId)for(const id of ids)choices[id]=old.decisions?.[id]||old.decision||'approve';
  return {kind,slot,ids,index:0,choices,stance:old?.stance||'依旨施行',target:old?.target||s.court.officials[0]?.id||'',remark:old?.remark||''};
}
function legacyChoice(m,value) {
  if(value==='opt0'&&m.options[0]?.id===value)return 'approve';
  if(value==='opt1'&&m.options[1]?.id===value)return 'reject';
  return value;
}
export function memorialAction(s,session) {
  if(!session.ids.length)throw new Error('请至少选择一本奏报');
  if(session.kind==='上朝'&&session.ids.length>3)throw new Error('上朝最多三个议题');
  if(session.ids.some(id=>!session.choices[id]))throw new Error('请逐本选择御批');
  const normalized=session.ids.map(id=>legacyChoice(s.memorials.find(m=>m.id===id),session.choices[id]));
  const uniform=normalized.every(x=>x===normalized[0]);
  const action={kind:session.kind,memorials:[...session.ids],decision:uniform?normalized[0]:'approve',stance:session.stance,target:session.target,remark:session.remark,label:session.ids.length+' 本奏报'};
  if(!uniform)action.decisions=Object.fromEntries(session.ids.map(id=>[id,session.choices[id]]));
  return action;
}
export function effectItems(effects,s,prefix='') {
  const names={treasury:'国库',privy:'内帑',grain:'粮储',morale:'民心',governance:'吏治',prestige:'皇威',virtue:'圣德',health:'健康',mood:'心情',favor:'好感',disaster:'灾情',stage:'阶段',result:'结果'};
  const result=[];
  for(const [key,value] of Object.entries(effects||{})) {
    if(key==='id')continue;
    if(value&&typeof value==='object') {
      let name=key;
      if(key==='province')name=s.nation.provinces.find(p=>p.id===value.id)?.name||'州郡';
      if(key==='official')name=s.court.officials.find(p=>p.id===value.id)?.name||'官员';
      if(key==='thread')name='事件';
      if(key==='faction') {
        for(const [id,n]of Object.entries(value))result.push({label:(s.court.factions.find(f=>f.id===id)?.name||id)+'态度',value:n,unit:''});
      }else result.push(...effectItems(value,s,name));
    }else result.push({label:(prefix?prefix+' ':'')+(names[key]||key),value,unit:['treasury','privy'].includes(key)?' 万两':key==='grain'?' 万石':''});
  }
  return result;
}
export function effectLabel(value,unit='') {
  if(typeof value!=='number')return String(value??'');
  if(value===0)return '0'+unit;
  if(Math.abs(value)<1)return value>0?'微升':'微降';
  return (value>0?'+':'−')+Math.round(Math.abs(value)).toLocaleString('zh-CN')+unit;
}
export function factionDemandReason(s,speaker,memorial) {
  const faction=s.court.factions.find(f=>f.id===speaker.faction);
  if(!faction?.demand)return '';
  return faction.name+' · '+(memorial.type||'政务')+'议题：派系诉求「'+faction.demand+'」';
}
export function memorialOptions(s,m) {
  const options=m.options.map(o=>({...o}));
  if(!options.some(o=>o.id==='hold'))options.push({id:'hold',label:'留中',effects:{}});
  options.push({id:'discuss',label:'发部议',effects:{},disabled:(m.referrals||0)>=2});
  options.push({id:'remark',label:'朱批 · 原请款待准驳',effects:{}});
  return options;
}
function choiceSelected(m,value,option) {
  return value===option.id||(value==='approve'&&option===m.options[0])||(value==='reject'&&option===m.options[1]);
}
function debateFor(s,session) {
  if(session.kind!=='上朝'||session.stance!=='廷议')return [];
  try {
    const action=memorialAction(s,session);
    return forecastTurn(s,{...s.schedule,[session.slot]:action}).debate||[];
  }catch{return [];}
}
export function memorialHTML(s,session) {
  const m=s.memorials.find(m=>m.id===session.ids[session.index]);
  if(!m)return '<p class="review-error">奏报已不在当前队列，请关闭后重选。</p>';
  const person=s.court.officials.find(o=>o.name===m.from),faction=s.court.factions.find(f=>f.id===person?.faction),post=s.court.posts.find(p=>p.holder===person?.id);
  const region=s.nation.provinces.find(p=>p.id===s.threads.find(t=>t.id===m.threadId)?.provinceId||m.title.includes(p.name));
  const opts=memorialOptions(s,m),selected=session.choices[m.id],debate=debateFor(s,session);
  const cards=opts.filter(o=>o.id!=='remark').map((o,i)=>{
    const chosen=choiceSelected(m,selected,o)||legacyChoice(m,selected)===legacyChoice(m,o.id);
    const fx=effectItems(o.effects,s).map(f=>'<span class="effect '+(typeof f.value==='number'?(f.value>0?'positive':f.value<0?'negative':'neutral'):'neutral')+'">'+esc(f.label)+' '+esc(effectLabel(f.value,f.unit))+'</span>').join('');
    const note=o.id==='hold'?'不改变原请款，期限照常推进':o.id==='discuss'?(o.disabled?'已发部议两次，须裁处':'期限 +3 旬 · 最多两次'):o.id==='remark'?'识别嘉奖／申饬，原请款仍待准驳':'无直接数值变化';
    const tag=o.edictType&&EDICTS[o.edictType]?'执行度预估「'+execution(s,o.edictType,11).label+'」':chosen?'已选':i<4?'按 '+(i+1):'';
    return '<button type="button" class="review-option" role="radio" aria-checked="'+chosen+'" tabindex="'+(chosen||(!selected&&i===0)?0:-1)+'" data-review-option="'+esc(o.id)+'" '+(o.disabled?'disabled':'')+'><span class="option-title"><span>'+esc(o.label)+'</span><small class="'+(tag.startsWith('按 ')?'key-hint':'')+'">'+esc(tag)+'</small></span><span class="effects">'+(fx||'<span class="effect neutral">'+note+'</span>')+'</span></button>';
  }).join('');
  return '<div class="memorial-queue"><div class="queue-tabs" role="group" aria-label="本次奏报队列">'+session.ids.map((id,i)=>'<button type="button" class="queue-tab '+(session.choices[id]?'done':'')+'" data-review-index="'+i+'" '+(i===session.index?'aria-current="step"':'')+'><span class="queue-number">'+(i+1)+'</span>'+esc(s.memorials.find(m=>m.id===id)?.title)+'</button>').join('')+'</div>'+(session.kind==='批折'?'<div class="segmented" role="group" aria-label="批折时辰">'+['朝','午'].map(sl=>'<button type="button" data-review-slot="'+sl+'" aria-pressed="'+(sl===session.slot)+'">'+sl+'</button>').join('')+'</div>':'')+'<details class="queue-picker"><summary>选折 '+session.ids.length+(session.kind==='上朝'?'/3':'')+'</summary><div class="queue-picker-list">'+s.memorials.map(m=>'<button type="button" data-review-add="'+esc(m.id)+'" aria-pressed="'+session.ids.includes(m.id)+'">'+(session.ids.includes(m.id)?'✓ ':'＋ ')+esc(m.title)+'</button>').join('')+'</div></details></div><div class="memorial-columns"><article class="paper memorial-paper"><div class="memorial-heading">'+(m.urgent?'<span class="stamp">急</span>':'')+'<h3 id="memorial-title" tabindex="-1">'+esc(m.title)+'</h3></div><div class="memorial-meta"><div class="memorial-author"><span>上奏　'+esc(post?.title||'')+' '+esc(m.from)+(faction?'（'+esc(faction.name)+'）':'')+'</span>'+(person?.alive?'<button type="button" class="accountability" data-review-account="'+person.id+'" aria-pressed="'+(session.stance==='当廷问责'&&session.target===person.id)+'">问责</button>':'')+'</div><div class="memorial-facts"><span>类型　'+esc(m.type)+'</span><span>期限　剩 '+Math.max(0,m.due-s.turn)+' 旬</span></div></div><p class="memorial-body">'+esc(m.text||'臣谨奏：'+m.title+'。'+(m.request||'伏乞陛下裁处。'))+'</p><div class="memorial-foot">'+(region?'<p class="memorial-region">'+esc(region.name)+' · 民心 '+number(region.morale)+' · 灾情 '+number(region.disaster)+' · 驻军 '+number(region.garrison)+'</p>':'')+'<div class="brush-control"><label for="review-remark" class="brush-label">御笔朱批（本次共用）</label><button type="button" class="brush-mode" data-review-option="remark" aria-pressed="'+(selected==='remark')+'">只作朱批</button></div><div class="brush-writing"><textarea id="review-remark" class="brush-input" maxlength="100" placeholder="写下嘉奖或申饬">'+esc(session.remark)+'</textarea></div><p class="shared-remark-note">只作朱批，可嘉奖申饬；原请款仍须准驳。</p></div></article><section class="review-panel" aria-label="御批"><div class="review-title"><h3>御批</h3><small>第 '+(session.index+1)+' / '+session.ids.length+' 本</small></div><div class="review-options" role="radiogroup" aria-label="处置选项">'+cards+'</div>'+(session.kind==='上朝'?'<div class="segmented" role="group" aria-label="朝堂立场">'+['依旨施行','廷议'].map(stance=>'<button type="button" data-review-stance="'+stance+'" aria-pressed="'+(session.stance===stance)+'">'+stance+'</button>').join('')+'</div>':'')+(session.stance==='当廷问责'?'<p class="review-help">已排当廷问责：'+esc(s.court.officials.find(o=>o.id===session.target)?.name)+'。起驾后当廷问话。</p>':'')+(debate.length?'<section class="debate" aria-label="廷议诸臣"><h4>廷议 · 议事诸臣</h4>'+debate.map(o=>{const v=o.opinions.find(v=>v.memorialId===m.id);return '<div class="debate-row"><span class="vote '+(v?.stance==='赞成'?'yes':v?.stance==='反对'?'no':'')+'">'+(v?.stance==='赞成'?'赞':v?.stance==='反对'?'否':'中')+'</span><span>'+esc(o.name)+'<small>'+esc(factionDemandReason(s,o,m))+'</small></span></div>';}).join('')+'</section>':'')+'<p class="review-help"><span class="keyboard-help">1–4 择批 · Enter 下一本 · Esc 暂退</span></p><p id="review-error" class="review-error" role="status" aria-live="polite"></p></section></div><footer class="review-footer"><button type="button" data-review-hold>留中不发</button><button type="button" id="review-next" class="primary" data-review-next>'+ (session.index===session.ids.length-1?'批毕，入日程':'朱批，下一本 ›')+'</button></footer>';
}
export function memorialDialog(s,kind,preferred,onSchedule,startId=null) {
  if(!s.memorials.length){toast('奏报匣暂无奏报');return;}
  const session=createMemorialSession(s,kind,preferred,startId);
  openDialog(kind+' · 御前批阅','<div id="review-root" class="memorial-overlay"></div>','memorial-shell');
  const root=$('#review-root'),d=$('#modal');
  const mobile=matchMedia('(max-width:899px)');
  const revealCurrent=()=>{
    if(!d.open)return;
    const tabs=root.querySelector('.queue-tabs'),current=tabs?.querySelector('[aria-current="step"]');
    if(!current)return;
    const box=tabs.getBoundingClientRect(),item=current.getBoundingClientRect();
    tabs.scrollLeft+=item.left-box.left-(tabs.clientWidth-item.width)/2;
  };
  const alignPicker=()=>{
    const picker=d.querySelector('.queue-picker');if(!picker)return;
    if(mobile.matches){d.querySelector('.dialog-head').insertBefore(picker,$('#close-modal'));picker.onclick=handleClick;}
    else {root.querySelector('.memorial-queue').append(picker);picker.onclick=null;}
    revealCurrent();
  };
  const paint=(focus=null)=>{
    d.querySelector('.dialog-head .queue-picker')?.remove();
    root.innerHTML=memorialHTML(s,session);
    alignPicker();
    requestAnimationFrame(revealCurrent);
    if(focus)d.querySelector(focus)?.focus({preventScroll:true});
  };
  const showError=err=>{const el=$('#review-error');if(el)el.textContent=err.message||String(err);};
  const next=()=>{
    try {
      if(!session.choices[session.ids[session.index]])throw new Error('请先选择本折御批');
      if(session.index<session.ids.length-1){session.index++;paint('#memorial-title');return;}
      const missing=session.ids.findIndex(id=>!session.choices[id]);
      if(missing>=0){session.index=missing;paint('#memorial-title');throw new Error('尚有奏折未选择御批');}
      onSchedule(session.slot,memorialAction(s,session));closeDialog();
    }catch(error){showError(error);}
  };
  const handleClick=e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;e.stopPropagation();
    if(b.dataset.reviewOption){session.choices[session.ids[session.index]]=b.dataset.reviewOption;paint('[data-review-option="'+b.dataset.reviewOption+'"]');}
    else if(b.dataset.reviewIndex!==undefined){session.index=Number(b.dataset.reviewIndex);paint('#memorial-title');}
    else if(b.dataset.reviewSlot){session.slot=b.dataset.reviewSlot;paint('[data-review-slot="'+session.slot+'"]');}
    else if(b.dataset.reviewStance){session.stance=b.dataset.reviewStance;paint('[data-review-stance="'+session.stance+'"]');}
    else if(b.dataset.reviewAccount){session.stance=session.stance==='当廷问责'&&session.target===b.dataset.reviewAccount?'依旨施行':'当廷问责';session.target=b.dataset.reviewAccount;paint('[data-review-account]');}
    else if(b.dataset.reviewAdd){
      const id=b.dataset.reviewAdd,at=session.ids.indexOf(id);
      if(at>=0){if(session.ids.length===1){showError('至少保留一本奏报');return;}session.ids.splice(at,1);delete session.choices[id];}
      else {if(kind==='上朝'&&session.ids.length===3){showError('上朝最多三个议题，请先移出一本');return;}session.ids.push(id);}
      session.index=Math.min(session.index,session.ids.length-1);paint();d.querySelector('.queue-picker').open=true;
    }else if(b.hasAttribute('data-review-hold')){session.choices[session.ids[session.index]]='hold';next();}
    else if(b.hasAttribute('data-review-next'))next();
  };
  root.onclick=handleClick;
  const resize=()=>{alignPicker();requestAnimationFrame(revealCurrent);};
  mobile.addEventListener('change',resize);
  onDialogExit(d,root,()=>mobile.removeEventListener('change',resize));
  document.fonts?.ready.then(()=>{if(d.open&&root.isConnected)revealCurrent();});
  root.oninput=e=>{if(e.target.id==='review-remark')session.remark=e.target.value;};
  d.onkeydown=e=>{
    if(e.target.matches('input,textarea,select'))return;
    const all=[...root.querySelectorAll('.review-options [data-review-option]')],opts=all.filter(b=>!b.disabled);
    if(/^[1-4]$/.test(e.key)){e.preventDefault();if(!all[Number(e.key)-1]?.disabled)all[Number(e.key)-1]?.click();}
    else if(['ArrowDown','ArrowUp'].includes(e.key)&&e.target.matches('.review-options [data-review-option]')){e.preventDefault();const i=opts.indexOf(e.target);opts[(i+(e.key==='ArrowDown'?1:opts.length-1))%opts.length]?.click();}
    else if(e.key==='Enter'&&(e.target.matches('[data-review-option],#memorial-title,#review-next')||e.target===d)){e.preventDefault();next();}
  };
  paint('#memorial-title');
}
