import { clone } from './state.js';
import { roll } from './rng.js';
import { uniqueName } from './names.js';
import { applyPackage } from './effects.js';
import { adjudicate } from './freedom.js';
import { addEvent } from './events.js';
import { factionPowers } from './politics.js';
import { defaultKeju, examGraceStart, examGraceReceipt, ENKE_COST, EXAM_SIZE, EXAM_STANCES, EXAM_RANKS } from './keju-schema.js';
export function activeExam(s) { return s.keju?.exams.find(e => e.status !== 'published') || null; }
export function examiners(s) {
  return s.court.officials.filter(o => o.alive && o.health > 0 && !o.jailed && !o.retired && o.inCapital !== false && s.court.posts.some(p => p.id === o.post && p.holder === o.id));
}
function editable(s) {
  if (s.pending || s.ending) throw new Error('请先续完本旬；封卷后不能办理科举');
  if (s.regency) throw new Error('请待亲政后主持科举');
}
function findExam(s, id, statuses) {
  const e = s.keju?.exams.find(e => e.id === id);
  if (!e || !statuses.includes(e.status)) throw new Error('科场进度已变化，请重新打开');
  return e;
}
function revision(s) { s.revision++; return s; }
function openExam(s, type) {
  s.keju.exams.push({ id: 'keju-' + s.runId + '-' + s.turn + '-' + s.keju.exams.length, year: Math.floor(s.turn / 36) + 1, type, createdTurn: s.turn, examiner: null, examinerFaction: null, topic: '', topicSource: 'system', blindGrading: true, candidates: [], ranking: {}, topics: [], status: 'awaiting_examiner' });
  return s;
}
export function configureExams(state, interval) {
  editable(state);
  if (!Number.isSafeInteger(interval) || interval < 1 || interval > 3600) throw new Error('常科间隔须为1–3600旬的整数');
  const s = clone(state);
  s.keju.interval = interval;
  // A due exam remains available; a changed period starts after the current turn.
  if (s.keju.nextRegularTurn > s.turn) s.keju.nextRegularTurn = s.turn + interval;
  return revision(s);
}
export function enkeBlock(s, examiner) {
  if (activeExam(s)) return '本届尚未放榜，请先办完本届科举';
  if (s.nation.treasury < ENKE_COST) return '恩科需国库三十万两';
  if (examiner && !examiners(s).some(o => o.id === examiner)) return '请任命一位在京在任官员为主考';
  return '';
}
export function openEnke(state, examiner) {
  editable(state);
  const blocked = enkeBlock(state, examiner);
  if (blocked) throw new Error(blocked);
  if (!examiner) throw new Error('加开恩科须先任命主考官');
  let s = openExam(clone(state), 'enke');
  s = appointExaminer(s, activeExam(s).id, examiner);
  s = applyPackage(s, { treasury: -ENKE_COST, scholarReputation: 3 }, '加开恩科');
  s.stats.edicts++;
  return { state: s, note: '加开恩科，主考已任；请入科举殿命题' };
}
export function appointExaminer(state, examId, officialId) {
  editable(state);
  const s = clone(state), e = findExam(s, examId, ['awaiting_examiner', 'topic']);
  const o = examiners(s).find(o => o.id === officialId);
  if (!o) throw new Error('请选择在京在任且未下狱的官员主考');
  e.examiner = o.id; e.examinerFaction = o.faction; e.status = 'topic';
  return revision(s);
}
export function setExamTopics(state, id, topics) {
  editable(state);
  const s = clone(state), e = findExam(s, id, ['topic']);
  if (!Array.isArray(topics) || topics.length < 2 || topics.length > 3 || topics.some(t => typeof t !== 'string' || !t.trim() || t.length > 2000)) throw new Error('策问备选须为2–3道');
  e.topics = [...new Set(topics)];
  if (e.topics.length < 2) throw new Error('策问备选不能重复');
  return revision(s);
}
export function fallbackTopics(s) {
  const worst = [...s.nation.provinces].sort((a,b) => b.disaster - a.disaster)[0];
  return [s.nation.treasury < 200 ? '国用日绌，如何量入为出而不困民？' : '国用与民生如何相济，试陈理财之策。', worst.disaster > 20 ? worst.name + '灾情未息，赈济与备荒当如何并举？' : '承平之时，如何整饬吏治而免因循？', '边备与农事相争，如何安边而不扰民？'];
}
export function chooseExamTopic(state, id, topic, source = 'system', review = null) {
  editable(state);
  let s = clone(state), e = findExam(s, id, ['topic']);
  if (!examiners(s).some(o => o.id === e.examiner)) throw new Error('主考官已离任，请重新任命');
  if (typeof topic !== 'string' || !topic.trim() || topic.length > 2000 || !['system', 'emperor'].includes(source)) throw new Error('策问须为1–2000字');
  if (source === 'system' && !e.topics.includes(topic)) throw new Error('请选择本届备选策问');
  const unsuitable = source === 'emperor' && (review?.suitable === false || /长生|成仙|永生|神仙|外星|毁灭世界/.test(topic));
  let adopted = topic, note = '';
  if (unsuitable && s.settings.freedom !== 'free') {
    let accept = false;
    if (s.settings.freedom === 'mid') { const r = adjudicate(s, {success:false}, e.examiner); s = r.state; accept = r.verdict.success; note = r.verdict.partial ? r.verdict.cost : ''; }
    if (!accept) { adopted = typeof review?.rewrite==='string' && review.rewrite.trim() && review.rewrite.length<=2000 ? review.rewrite : fallbackTopics(s)[0]; note = '礼部劝谏：' + (review?.reason || '策问宜切合治国实务') + '；改拟为：' + adopted; }
  }
  e = s.keju.exams.find(e => e.id === id);
  e.topic = adopted; e.topicSource = source; e.requestedTopic = source === 'emperor' ? topic : null; e.topicNote = note;
  // Dossiers and independent literary skill are rolled once before any prose request.
  for (let i = 0; i < EXAM_SIZE; i++) {
    const named = uniqueName(s); s = named.state;
    const draw = (a,b) => { const r = roll(s,a,b); s = r.state; return r.value; };
    const origin = ['commoner','gentry','noble'][draw(0,2)], age = draw(18,48);
    const hometown = s.nation.provinces[draw(0,s.nation.provinces.length-1)].name;
    const hidden = {ability:draw(25,95),integrity:draw(10,95),stance:EXAM_STANCES[draw(0,2)],ambition:draw(5,95),faction:s.court.factions[draw(0,s.court.factions.length-1)].id};
    const literary = draw(25,98),current=s.keju.exams.find(e=>e.id===id);
    const priorMentor=hidden.faction===current.examinerFaction?current.examiner:null;
    s.keju.exams.find(e => e.id === id).candidates.push({id:id+'-c'+i,name:named.name,hometown,origin,age,hidden,literary,priorMentor,essaySummary:'',reviewerComment:'',reviewerSuggestedRank:i+1});
  }
  e = s.keju.exams.find(e => e.id === id); e.status = 'writing';
  return revision(s);
}
export function receiveExamPapers(state, id, papers) {
  editable(state);
  const s = clone(state), e = findExam(s,id,['writing']);
  if (!Array.isArray(papers) || papers.length !== EXAM_SIZE || new Set(papers.map(p=>p.id)).size !== EXAM_SIZE) throw new Error('试卷未齐，原名册已保留');
  if (papers.some(p=>!e.candidates.some(c=>c.id===p.id)||typeof p.essaySummary!=='string'||!p.essaySummary.trim()||p.essaySummary.length>1500||typeof p.reviewerComment!=='string'||!p.reviewerComment.trim()||p.reviewerComment.length>1000||!Number.isInteger(p.reviewerSuggestedRank)||p.reviewerSuggestedRank<1||p.reviewerSuggestedRank>EXAM_SIZE)) throw new Error('试卷格式有误');
  if (new Set(papers.map(p=>p.reviewerSuggestedRank)).size!==EXAM_SIZE) throw new Error('拟定名次不能重复');
  for (const c of e.candidates) { const p = papers.find(p=>p.id===c.id); c.essaySummary=p.essaySummary; c.reviewerComment=p.reviewerComment; c.reviewerSuggestedRank=p.reviewerSuggestedRank; }
  const ordered = [...e.candidates].sort((a,b)=>a.reviewerSuggestedRank-b.reviewerSuggestedRank);
  e.ranking = Object.fromEntries(ordered.map((c,i)=>[c.id, i<3?EXAM_RANKS[i]:i<5?'二甲':i<7?'三甲':'黜落']));
  e.status = 'grading';
  return revision(s);
}
export function setExamBlind(state,id,blind) {
  editable(state);
  const s=clone(state),e=findExam(s,id,['topic','writing','grading']);
  e.blindGrading=!!blind;
  return revision(s);
}
export function rankExamCandidate(state,id,candidateId,rank) {
  editable(state);
  const s=clone(state),e=findExam(s,id,['grading']);
  if(!e.candidates.some(c=>c.id===candidateId)||!EXAM_RANKS.includes(rank))throw new Error('请选择有效卷子与名次');
  const previous=e.ranking[candidateId];
  if(EXAM_RANKS.slice(0,3).includes(rank)) { const other=Object.keys(e.ranking).find(id=>e.ranking[id]===rank); if(other)e.ranking[other]=previous; }
  // Moving a top-three paper to a lower class leaves an explicit vacancy until another is selected.
  e.ranking[candidateId]=rank;
  return revision(s);
}
export function cacheExamEssay(state,id,candidateId,essay) {
  editable(state);
  const s=clone(state),e=findExam(s,id,['grading','published']),c=e.candidates.find(c=>c.id===candidateId);
  if(!c)throw new Error('试卷不存在');
  if(c.essayFull)return s;
  if(typeof essay!=='string'||essay.trim().length<80||essay.length>12000)throw new Error('全文未完整送达，请重试');
  c.essayFull=essay;
  return revision(s);
}
export function queueExamHook(state,examId,type,due=state.turn+1) {
  if(!['exam_fraud','failed_candidates_unrest'].includes(type)||!Number.isSafeInteger(due)||due<state.turn||!state.keju.exams.some(e=>e.id===examId&&e.status==='published'))throw new Error('科举事件参数无效');
  const s=clone(state);
  if(!s.keju.hooks.some(h=>h.examId===examId&&h.type===type))s.keju.hooks.push({examId,type,due,handled:false});
  return s;
}
export function publishExam(state,id) {
  editable(state);
  const original=state.keju.exams.find(e=>e.id===id);
  if(original?.status==='published')return clone(state);
  let s=clone(state),e=findExam(s,id,['grading']);
  if(Object.keys(e.ranking).length!==EXAM_SIZE||Object.values(e.ranking).some(r=>!EXAM_RANKS.includes(r))||EXAM_RANKS.slice(0,3).some(r=>Object.values(e.ranking).filter(v=>v===r).length!==1))throw new Error('请为每卷定名次，一甲须各有一人');
  const top=e.candidates.filter(c=>EXAM_RANKS.slice(0,3).includes(e.ranking[c.id]));
  const commoners=top.filter(c=>c.origin==='commoner').length,nobles=top.filter(c=>c.origin==='noble').length;
  const clients=top.filter(c=>c.priorMentor===e.examiner).length;
  const bias=!e.blindGrading&&clients>=2;
  const rep=commoners*2-nobles-(bias?5:0);
  const influence={};
  for(const c of e.candidates.filter(c=>e.ranking[c.id]!=='黜落')) {
    const rank=e.ranking[c.id],h=c.hidden,oid='jinshi-'+c.id;
    influence[h.faction]=(influence[h.faction]||0)+(EXAM_RANKS.slice(0,3).includes(rank)?2:1);
    const title=rank==='状元'?'翰林院修撰':['榜眼','探花'].includes(rank)?'翰林院编修':null;
    const pid=title?'post-'+oid:null;
    if(title)s.court.posts.push({id:pid,title,rank:7,office:'翰林',tags:['政务'],provinceId:null,holder:oid});
    s.court.officials.push({id:oid,name:c.name,gender:'男',age:c.age,post:pid,faction:h.faction,abilities:{政:h.ability,军:Math.round(h.ability/2),才:c.literary,德:h.integrity,忠:Math.max(5,100-h.ambition),权谋:h.ambition},ambition:h.ambition,greed:100-h.integrity,favor:50,health:90,alive:true,inCapital:true,secret:'吏部已按任职实绩察明其操守。',secretKnown:false,memory:[],life:[{turn:s.turn,event:rank+'及第'+(title?'，授'+title:'，入人才库候补')}],banquetTurn:-1000000,relations:{[e.examiner]:60},keju:{examId:id,candidateId:c.id,mentor:e.examiner,origin:c.origin,hometown:c.hometown,rank,revealed:[],lastRevealTurn:s.turn}});
    const mentorIndex=s.court.officials.findIndex(o=>o.id===e.examiner),oldMentor=s.court.officials[mentorIndex];
    s.court.officials[mentorIndex]={...oldMentor,relations:{...oldMentor.relations,[oid]:60},examStudents:[...(oldMentor.examStudents||[]),oid]};
  }
  influence[e.examinerFaction]=(influence[e.examinerFaction]||0)+(bias?6:2);
  e.status='published';e.publishedTurn=s.turn;e.outcome={scholarReputation:rep,commoners,nobles,clients,biased:bias};
  s=applyPackage(s,{scholarReputation:rep,faction:influence},'科举放榜');
  s.court.factions=factionPowers(s);
  // The hook contract supports both cases; only the protest example is dispatched automatically.
  if(bias)s=queueExamHook(s,id,'failed_candidates_unrest');
  return revision(s);
}
export function advanceExams(state) {
  let s=clone(state);s.keju??=defaultKeju(s.turn);
  if(!activeExam(s)&&s.turn>=s.keju.nextRegularTurn) {
    s=openExam(s,'regular');
    s.keju.nextRegularTurn=s.turn+s.keju.interval;
  }
  const exam=activeExam(s),start=exam?examGraceStart(s,exam):s.turn,age=s.turn-start;
  if(exam&&!s.regency&&start>exam.createdTurn){const receipt=examGraceReceipt(exam,start);if(!s.receipts.includes(receipt))s.receipts.push(receipt);}
  // Reuse existing receipts: no save shape change or replay of past periods.
  // Thirty-six turns are grace; the first complete overdue period ends at 48.
  if(exam&&!s.regency&&age>=48&&age%12===0) {
    const receipt='keju-delay:'+exam.id+':'+(start===exam.createdTurn?age:'grace:'+start+':'+age);
    if(!s.receipts.includes(receipt)) {
      s.receipts.push(receipt);
      s=applyPackage(s,{scholarReputation:-1},'科举迟未放榜：每十二旬士林声望下降');
      const reminder='keju-reminder:'+exam.id;
      if(!s.receipts.includes(reminder)) {
        s.receipts.push(reminder);
        s=addEvent(s,'科举催办','礼部催请钦定科举榜次','本届科举宽限已过，榜次久悬，士林议论渐起。礼部请尽早命题阅卷、钦定放榜。',[
          {label:'阅知，着即办理',effects:{}},
        ],exam.examiner?[exam.examiner]:[]);
        s.memorials.at(-1).text='臣礼部谨奏：本届'+(exam.type==='enke'?'恩科':'常科')+(start>exam.createdTurn?'亲政后已过':'开科迄今已')+age+'旬，尚未放榜。士子久候京师，旅食日艰，士林亦有疑议。伏请陛下督促科场，尽早完成任主考、命题阅卷与钦定榜次，使取士之典有始有终。谨候圣裁。';
      }
    }
  }
  // Actual service, once per year per person, reveals one quality through an event.
  for(const original of s.court.officials.filter(o=>o.keju&&o.alive&&o.health>0&&!o.retired&&!o.jailed&&o.post&&s.court.posts.some(p=>p.id===o.post&&p.holder===o.id)&&s.turn-o.keju.lastRevealTurn>=36)) {
    const o=s.court.officials.find(o=>o.id===original.id),key=['ability','integrity','stance','ambition','faction'].find(k=>!o.keju.revealed.includes(k));
    if(!key)continue;
    o.keju.revealed.push(key);o.keju.lastRevealTurn=s.turn;
    const labels={ability:'才干',integrity:'操守',stance:'立场',ambition:'野心',faction:'派系'};
    o.life.push({turn:s.turn,event:'履职考察：'+labels[key]+'渐为人知'});
    if(key==='integrity')o.secretKnown=true;
    s=addEvent(s,'进士履职',o.name+'履职考察','吏部按任职实绩呈报，其'+labels[key]+'已可在人物名录查阅。',[{label:'阅知，继续察看',effects:{}}],[o.id]);
  }
  const due=s.keju.hooks.filter(h=>!h.handled&&h.due<=s.turn);
  for(const h of due) {
    s.keju.hooks.find(x=>x.examId===h.examId&&x.type===h.type).handled=true;
    if(h.type==='failed_candidates_unrest')s=addEvent(s,'落第举子闹事','落第举子聚集贡院','一甲多出主考旧门生，落第举子质疑取士有私，请求复核。',[{label:'命礼部复核，安抚举子',effects:{treasury:-5,scholarReputation:2}},{label:'维持原榜，令其散去',effects:{scholarReputation:-3}}]);
    // exam_fraud is deliberately reserved for the next event pack.
  }
  return s;
}
export function examOfficialView(s,o) {
  if(!o.keju)return {abilities:o.abilities,faction:s.court.factions.find(f=>f.id===o.faction)?.name,ambition:o.ambition,stance:null};
  const known=new Set(o.keju.revealed),e=s.keju.exams.find(e=>e.id===o.keju.examId),c=e?.candidates.find(c=>c.id===o.keju.candidateId);
  return {abilities:Object.fromEntries(Object.entries(o.abilities).map(([k,v])=>[k,(k==='政'?known.has('ability'):k==='德'?known.has('integrity'):k==='权谋'||k==='忠'?known.has('ambition'):false)?v:'待察'])),faction:known.has('faction')?s.court.factions.find(f=>f.id===o.faction)?.name:'待察',ambition:known.has('ambition')?o.ambition:'待察',stance:known.has('stance')?c?.hidden.stance:'待察'};
}
