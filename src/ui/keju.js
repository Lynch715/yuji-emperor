import { activeExam, examiners, configureExams, appointExaminer, setExamTopics, fallbackTopics, chooseExamTopic, receiveExamPapers, setExamBlind, rankExamCandidate, publishExam, cacheExamEssay } from '../core/keju.js';
import { EXAM_RANKS } from '../core/keju-schema.js';
import { callJSON } from '../llm/client.js';
import { examTopicMessages, examTopicReviewMessages, examPaperMessages, examEssayMessages, validateExamTopics, validateTopicReview, validateExamPapers, validateExamEssay, mockExamPapers, mockExamEssay } from '../llm/keju.js';
import { $, esc, openDialog, toast, gameText } from './common.js';
import { createDialogRequestScope } from './request-scope.js';
const origins={commoner:'寒门',gentry:'士绅',noble:'勋贵'};
const stages={awaiting_examiner:'待任主考',topic:'待定策问',writing:'待收试卷',grading:'御前阅卷',published:'已经放榜'};
export function examPapersHTML(e, readonly=false) {
  const blind=e.blindGrading&&e.status!=='published';
  return [...e.candidates].sort((a,b)=>a.reviewerSuggestedRank-b.reviewerSuggestedRank).map(c=>{
    const number=e.candidates.indexOf(c)+1,label=blind?'第'+number+'号卷':c.name+' · '+c.hometown+' · '+origins[c.origin]+' · '+c.age+'岁'+(c.priorMentor===e.examiner?' · 主考旧门生':'');
    return '<article class="card exam-paper" data-exam-paper="'+esc(c.id)+'"><h3>'+esc(label)+'</h3><p class="exam-summary">'+esc(c.essaySummary)+'</p><p class="muted">读卷官拟第'+c.reviewerSuggestedRank+'名 · '+esc(c.reviewerComment)+'</p><details data-essay="'+esc(c.id)+'"'+(c.essayFull&&e.openPaper===c.id?' open':'')+'><summary>展开读全文'+(c.essayFull?' · 已存卷':'')+'</summary><div class="prose exam-essay">'+(c.essayFull?'<p>'+esc(c.essayFull).replace(/\n+/g,'</p><p>')+'</p>':'<button type="button" data-exam-full="'+esc(c.id)+'"'+(readonly?' disabled':'')+'>补读此卷全文</button>')+'</div></details>'+ (e.status==='grading'?'<label for="rank-'+esc(c.id)+'">钦定名次 · '+esc(blind?'第'+number+'号卷':c.name)+'</label><select id="rank-'+esc(c.id)+'" data-exam-rank="'+esc(c.id)+'"'+(readonly?' disabled':'')+'>'+EXAM_RANKS.map(r=>'<option'+(e.ranking[c.id]===r?' selected':'')+'>'+r+'</option>').join('')+'</select>':'<p class="tag">'+esc(e.ranking[c.id])+'</p>')+'</article>';
  }).join('');
}
export function kejuHTML(s,selectedId=null,readonly=false) {
  const k=s.keju,active=activeExam(s),e=k.exams.find(e=>e.id===selectedId)||active||k.exams.at(-1),disabled=readonly?' disabled':'';
  let html='<p>士林声望 <strong>'+Math.round(k.scholarReputation)+'</strong> · '+(active?'本届待办：'+stages[active.status]:'距下届常科 '+Math.max(0,k.nextRegularTurn-s.turn)+' 旬')+'</p><form id="exam-period-form" class="exam-period"><label for="exam-period">常科间隔（旬）</label><input id="exam-period" type="number" min="1" max="3600" value="'+k.interval+'"'+disabled+'><button type="submit"'+disabled+'>调整间隔</button></form><p class="muted">每年36旬。恩科可在「下旨」中加开，国库三十万两，士林声望加3；须先选主考。</p>';
  if(!e)return html+'<p>本届尚未开科。到期由礼部呈请，或下旨加开恩科。</p>';
  html+='<label for="exam-session">科场档案</label><select id="exam-session">'+[...k.exams].reverse().map(x=>'<option value="'+esc(x.id)+'"'+(x.id===e.id?' selected':'')+'>第'+x.year+'年 · '+(x.type==='enke'?'恩科':'常科')+' · '+stages[x.status]+'</option>').join('')+'</select><section class="paper exam-session"><h3>'+ (e.type==='enke'?'恩科':'常科')+' · '+stages[e.status]+'</h3>';
  if(['awaiting_examiner','topic'].includes(e.status))html+='<form id="examiner-form"><label for="examiner">任命主考官</label><select id="examiner"'+disabled+'><option value="">请选择在京在任大臣</option>'+examiners(s).map(o=>'<option value="'+esc(o.id)+'"'+(o.id===e.examiner?' selected':'')+'>'+esc(o.name)+' · '+esc(s.court.posts.find(p=>p.holder===o.id)?.title)+'</option>').join('')+'</select><button type="submit"'+disabled+'>任主考</button></form>';
  else html+='<p>主考：'+esc(s.court.officials.find(o=>o.id===e.examiner)?.name||'原主考')+'</p>';
  if(e.status==='topic')html+='<button type="button" data-exam-topics'+disabled+'>'+(e.topics.length?'重拟备选策问':'拟备选策问')+'</button>'+ (e.topics.length?'<form id="exam-topic-form"><label for="exam-topic">备选策问</label><select id="exam-topic"'+disabled+'>'+e.topics.map((t,i)=>'<option value="'+i+'">'+esc(t)+'</option>').join('')+'</select><button type="submit"'+disabled+'>采用此题</button></form>':'')+'<form id="exam-custom-form"><label for="exam-custom">皇帝自拟策问</label><textarea id="exam-custom" maxlength="2000" rows="3" placeholder="试陈治国之策……"'+disabled+'></textarea><p class="muted">沿用口谕自由度：成败看实力时礼部可劝改，多数能成时可通融，想做就成时原样采用。</p><button type="submit"'+disabled+'>颁下自拟题</button></form>';
  if(e.topic)html+='<p class="exam-topic">策问：'+esc(e.topic)+'</p><p class="muted">'+esc(e.topicNote||'')+'</p>';
  if(['topic','writing','grading'].includes(e.status))html+='<label class="check"><input id="exam-blind" type="checkbox"'+(e.blindGrading?' checked':'')+disabled+'>糊名阅卷</label><p class="muted">糊名后隐藏姓名、籍贯与出身；收卷前的设置也约束读卷官，揭名后可按主考同派偏私。已有评语与拟次保留。</p>';
  if(e.status==='writing')html+='<p>考生名册已定，等待九卷一并呈上。</p><button class="primary" data-exam-papers'+disabled+'>收取本届全部试卷</button>';
  if(['grading','published'].includes(e.status))html+='<div class="exam-paper-list">'+examPapersHTML(e,readonly)+'</div>';
  if(e.status==='grading')html+='<p class="muted">点选钦定名次；选中已有的一甲名次会交换两卷。状元、榜眼、探花各须一人；二甲、三甲与黜落不限人数。名次自动存卷。</p><button class="primary" data-exam-publish'+disabled+'>钦定放榜</button>';
  if(e.status==='published')html+='<p>本届已放榜。士林声望 '+(e.outcome.scholarReputation>=0?'+':'')+e.outcome.scholarReputation+'；一甲寒门'+e.outcome.commoners+'人、勋贵'+e.outcome.nobles+'人、主考旧门生'+e.outcome.clients+'人。</p><p class="muted">进士已入朝堂人才库，座师—门生关系已记入人物履历。任职后经吏部事件逐步察明才干、操守、立场、野心与派系。</p>';
  return html+'</section><p id="exam-status" role="status" aria-live="polite"></p>';
}
export function requestExamJSON(config,messages,validate,options={}) {
  return callJSON(config,messages,{...options,maxAttempts:1,validate});
}
export function openKeju(ctx,selectedId=null,openPaper=null) {
  const s=ctx.getState();if(!s){toast('请先登基');return;}
  openDialog('科举 · 贡院','<div id="exam-owner">'+kejuHTML(openPaper?{...s,keju:{...s.keju,exams:s.keju.exams.map(e=>({...e,openPaper}))}}:s,selectedId,ctx.readonly())+'</div>');
  const owner=$('#exam-owner'),scope=createDialogRequestScope($('#modal'),owner);
  const e=s.keju.exams.find(e=>e.id===selectedId)||activeExam(s)||s.keju.exams.at(-1);
  const request=(messages,validate,signal)=>requestExamJSON(ctx.config(),messages,validate,{signal,onMetric:ctx.onMetric});
  async function run(operation) {
    let token;
    try {
      ctx.guard();token=scope.begin();ctx.setBusy(true);
      const base=ctx.getState();
      owner.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=true);
      $('#exam-status').textContent='贡院正在呈卷……';
      const next=await operation(base,token.signal);
      if(!scope.current(token)||ctx.getState()!==base)return;
      if(next)await ctx.saveState(next);
      if(scope.current(token)){
        const expanded=owner.querySelector('details[data-essay][open]')?.dataset.essay,scroll=$('#modal').scrollTop,focus=document.activeElement?.id;
        scope.finish(token);ctx.setBusy(false);openKeju(ctx,e?.id,expanded);
        $('#modal').scrollTop=scroll;if(focus)document.getElementById(focus)?.focus({preventScroll:true});
      }
    }catch(error) {
      if(token&&scope.current(token)) {
        owner.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=false);
        $('#exam-status').textContent=gameText(error.message)+'。已定考生和已读卷子会保留，可重试。';
      } else if(!token)toast(error.message);
    }finally{if(token){scope.finish(token);ctx.setBusy(false);ctx.render();}}
  }
  $('#exam-period-form').onsubmit=event=>{event.preventDefault();const n=Number($('#exam-period').value);run(s=>configureExams(s,n));};
  if($('#exam-session'))$('#exam-session').onchange=event=>openKeju(ctx,event.target.value);
  if($('#examiner-form'))$('#examiner-form').onsubmit=event=>{event.preventDefault();const id=$('#examiner').value;run(s=>appointExaminer(s,e.id,id));};
  if($('#exam-topic-form'))$('#exam-topic-form').onsubmit=event=>{event.preventDefault();const topic=e.topics[Number($('#exam-topic').value)];run(s=>chooseExamTopic(s,e.id,topic));};
  if($('#exam-custom-form'))$('#exam-custom-form').onsubmit=event=>{event.preventDefault();const topic=$('#exam-custom').value;run(async(s,signal)=>{
    if(!topic.trim())throw new Error('请先填写策问');
    const review=s.settings.freedom==='free'?null:s.settings.demo?{suitable:!(/长生|成仙|永生|神仙|外星|毁灭世界/.test(topic)),rewrite:fallbackTopics(s)[0],reason:'策问宜切合治国实务'}:await request(examTopicReviewMessages(s,topic),validateTopicReview,signal);
    return chooseExamTopic(s,e.id,topic,'emperor',review);
  });};
  if($('#exam-blind'))$('#exam-blind').onchange=event=>{const checked=event.target.checked;run(s=>setExamBlind(s,e.id,checked));};
  owner.querySelectorAll('[data-exam-rank]').forEach(el=>el.onchange=event=>{const rank=event.target.value;run(s=>rankExamCandidate(s,e.id,el.dataset.examRank,rank));});
  owner.onclick=event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.hasAttribute('data-exam-topics'))run(async(s,signal)=>setExamTopics(s,e.id,s.settings.demo?fallbackTopics(s):await request(examTopicMessages(s),validateExamTopics,signal)));
    if(b.hasAttribute('data-exam-papers'))run(async(s,signal)=>{
      const live=activeExam(s),papers=s.settings.demo?validateExamPapers({candidates:mockExamPapers(live)},live):await request(examPaperMessages(s,live),d=>validateExamPapers(d,live),signal);
      return receiveExamPapers(s,e.id,papers);
    });
    if(b.hasAttribute('data-exam-publish'))run(s=>publishExam(s,e.id));
    if(b.dataset.examFull)loadEssay(b.dataset.examFull);
  };
  function loadEssay(id) {
    run(async(s,signal)=>{
      const live=s.keju.exams.find(x=>x.id===e.id),c=live.candidates.find(c=>c.id===id);
      if(c.essayFull)return s;
      const essay=s.settings.demo?mockExamEssay(live,c):await request(examEssayMessages(live,c),d=>validateExamEssay(d,c),signal);
      return cacheExamEssay(s,e.id,id,essay);
    });
  }
  owner.addEventListener('toggle',event=>{
    const fold=event.target;if(!fold.matches('details[data-essay]')||!fold.open||ctx.readonly())return;
    const c=e.candidates.find(c=>c.id===fold.dataset.essay);
    if(!c?.essayFull)loadEssay(c.id);
  },true);
}
