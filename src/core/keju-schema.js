// Save validation and pure exam clock helpers; no imports from state or effects.
export const EXAM_INTERVAL = 108;
export const ENKE_COST = 30;
export const EXAM_SIZE = 9;
export const EXAM_STANCES = ['务实经世', '守成循礼', '锐意变法'];
export const EXAM_RANKS = ['状元', '榜眼', '探花', '二甲', '三甲', '黜落'];
export function defaultKeju(turn = 0, fresh = false) {
  return { interval: EXAM_INTERVAL, nextRegularTurn: fresh ? turn : turn + EXAM_INTERVAL, scholarReputation: 50, exams: [], hooks: [] };
}
export function examGraceReceipt(exam, turn) {
  return 'keju-grace:'+exam.id+':'+turn;
}
export function examGraceStart(state, exam) {
  let start=exam.createdTurn;
  const accept=turn=>{if(Number.isSafeInteger(turn)&&turn>=exam.createdTurn&&turn<=state.turn)start=Math.max(start,turn);};
  // Legacy v22 saves already record the actual accession to personal rule.
  for(const fact of state.facts||[])if(fact.key==='亲政'&&fact.subject===state.emperor.name)accept(fact.turn);
  const prefix='keju-grace:'+exam.id+':';
  for(const receipt of state.receipts||[])if(receipt.startsWith(prefix)) {
    const suffix=receipt.slice(prefix.length);
    if(/^(0|[1-9]\d*)$/.test(suffix))accept(Number(suffix));
  }
  return start;
}
export function validateKeju(s) {
  if (s.v < 22) return;
  const k = s.keju, integer = (n, a, b = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) && n >= a && n <= b;
  const text = (x, n, empty = false) => typeof x === 'string' && x.length <= n && (empty || !!x.trim());
  if (!k || !integer(k.interval, 1, 3600) || !integer(k.nextRegularTurn, 0) || !Number.isFinite(k.scholarReputation) || k.scholarReputation < 0 || k.scholarReputation > 100 || !Array.isArray(k.exams) || !Array.isArray(k.hooks)) throw new Error('科举存档损坏');
  const ids = new Set(), candidates = new Set();
  let active = 0;
  for (const e of k.exams) {
    if (!e || !text(e.id, 200) || ids.has(e.id) || !integer(e.year, 1) || !integer(e.createdTurn, 0) || !['regular', 'enke'].includes(e.type) || !['awaiting_examiner', 'topic', 'writing', 'grading', 'published'].includes(e.status) || typeof e.blindGrading !== 'boolean' || !text(e.topic, 2000, true) || !['system', 'emperor'].includes(e.topicSource) || !Array.isArray(e.candidates) || !Array.isArray(e.topics) || e.topics.length > 3 || e.topics.some(t => !text(t, 2000)) || !e.ranking || typeof e.ranking !== 'object') throw new Error('科场记录损坏');
    if(e.status==='published'&&(!e.outcome||!Number.isFinite(e.outcome.scholarReputation)||['commoners','nobles','clients'].some(k=>!integer(e.outcome[k],0,3))||typeof e.outcome.biased!=='boolean'||!integer(e.publishedTurn,e.createdTurn,s.turn)))throw new Error('放榜结算记录损坏');
    ids.add(e.id);
    if (e.status !== 'published') active++;
    if (e.examiner !== null && !s.court.officials.some(o => o.id === e.examiner)) throw new Error('主考官记录损坏');
    if (e.status !== 'awaiting_examiner' && (!e.examiner || !text(e.examinerFaction, 80))) throw new Error('科场缺少主考官');
    if (e.candidates.length !== (['writing', 'grading', 'published'].includes(e.status) ? EXAM_SIZE : 0)) throw new Error('考生名册损坏');
    for (const c of e.candidates) {
      const h = c?.hidden;
      if (!c || !text(c.id, 200) || candidates.has(c.id) || !text(c.name, 20) || !text(c.hometown, 40) || !['commoner', 'gentry', 'noble'].includes(c.origin) || !integer(c.age, 18, 65) || !h || ['ability', 'integrity', 'ambition'].some(key => !integer(h[key], 0, 100)) || !EXAM_STANCES.includes(h.stance) || !s.court.factions.some(f => f.id === h.faction) || !integer(c.literary, 0, 100) || !text(c.essaySummary, 1500, true) || !text(c.reviewerComment, 1000, true) || !integer(c.reviewerSuggestedRank, 1, EXAM_SIZE) || (c.essayFull !== undefined && !text(c.essayFull, 12000)) || (e.status !== 'writing' && (!c.essaySummary || !c.reviewerComment))) throw new Error('考生卷宗损坏');
      if(c.priorMentor!==undefined&&c.priorMentor!==null&&!s.court.officials.some(o=>o.id===c.priorMentor))throw new Error('考生师承记录损坏');
      candidates.add(c.id);
    }
    const own = new Set(e.candidates.map(c => c.id));
    if (Object.keys(e.ranking).some(id => !own.has(id)) || Object.values(e.ranking).some(r => !EXAM_RANKS.includes(r))) throw new Error('科举名次损坏');
    if (['grading', 'published'].includes(e.status) && (Object.keys(e.ranking).length !== EXAM_SIZE || ['状元', '榜眼', '探花'].some(r => Object.values(e.ranking).filter(v => v === r).length > 1 || e.status === 'published' && !Object.values(e.ranking).includes(r)))) throw new Error('一甲名次损坏');
  }
  if (active > 1 || k.hooks.some(h => !h || !ids.has(h.examId) || !['exam_fraud', 'failed_candidates_unrest'].includes(h.type) || !integer(h.due, 0) || typeof h.handled !== 'boolean')) throw new Error('科举事件记录损坏');
  for (const o of s.court.officials.filter(o => o.keju)) {
    if (!ids.has(o.keju.examId) || !Array.isArray(o.keju.revealed) || o.keju.revealed.some(key => !['ability', 'integrity', 'stance', 'ambition', 'faction'].includes(key)) || !integer(o.keju.lastRevealTurn, 0)) throw new Error('进士履历损坏');
  }
}
