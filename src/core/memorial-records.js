import { memorialDecision } from './memorial-decisions.js';

// Capture the original petition only on commit, including saved old forecasts.
export function collectMemorialReviews(state, forecast) {
  const records = [];
  for (const slot of ['朝', '午', '夜']) {
    const action = forecast.schedule?.[slot];
    if (!['上朝', '批折'].includes(action?.kind) || action.delegated || /^内阁票拟 \d+ 本$/.test(action.label || '')) continue;
    for (const id of action.memorials || []) {
      const m = state.memorials.find(m => m.id === id);
      if (!m) continue;
      const d = memorialDecision(action, id);
      const chosen = m.options.find(o => o.id === d.option) ||
        m.options.find(o => o.id === (d.option === 'reject' ? 'opt1' : 'opt0'));
      const labels = {hold:'留中', discuss:'发部再议', remark:'只作朱批'};
      const canceled=forecast.canceledMemorials?.includes(id);
      records.push({
        id: forecast.turnId + ':' + slot + ':' + id,
        memorialId: id, turn: forecast.state.turn, slot,
        dynasty: state.dynasty, emperor: state.emperor.name,
        era: structuredClone(state.era), title: m.title,
        from: m.from || '通政司', type: m.type || '政务',
        text: typeof m.text === 'string' && m.text ? m.text : String(m.request || ''),
        decision: canceled?'战局已变，原拟军令收回':labels[d.option] || chosen?.label || d.option,
        consequence: canceled?'原拟处置未再执行，口谕办理结果见本旬起居注。':labels[d.option] ? '' : chosen?.consequence || '',
        remark: d.remark,
      });
    }
  }
  return records;
}

export function validateMemorialReviews(chapters) {
  const seen = new Set();
  for (const h of chapters) {
    if (h.memorialReviews === undefined) continue;
    if (!Array.isArray(h.memorialReviews)) throw new Error('御批档案损坏');
    for (const r of h.memorialReviews) {
      if (!r || ['id','memorialId','dynasty','emperor','title','from','type','text','decision','consequence','remark']
        .some(k => typeof r[k] !== 'string') || !r.id || seen.has(r.id) ||
        !Number.isSafeInteger(r.turn) || r.turn !== h.turn || !['朝','午','夜'].includes(r.slot) ||
        !r.era || typeof r.era.name !== 'string' || !Number.isSafeInteger(r.era.year) ||
        !Number.isSafeInteger(r.era.month) || r.era.month < 1 || r.era.month > 12 ||
        ![0,1,2].includes(r.era.xun) || r.remark.length > 100) throw new Error('御批档案损坏');
      seen.add(r.id);
    }
  }
}

function legacyReviews(h) {
  const records = new Map();
  const add = (title, decision, remark = '', slot = '') => {
    const key = title + '\0' + decision, old = records.get(key);
    records.set(key, {...old, id: old?.id || h.id + ':旧录:' + records.size, memorialId: '', turn:h.turn,
      slot:slot || old?.slot || '', era:h.era, title, from:'', type:'旧折摘录',
      dynasty:'', emperor:'', text:'', decision, consequence:'', remark:remark || old?.remark || '', legacy:true});
  };
  for (const e of h.entries || []) {
    const match = /^处置奏报：(.+) \/ (.+)$/.exec(e.source || '');
    if (match) add(match[1], match[2]);
  }
  for (const [slot, notes] of Object.entries(h.settlement?.slotResults || {})) {
    for (const note of Array.isArray(notes) ? notes : []) {
      const match = /^(.+?) · (.+?) · 朱批「([\s\S]*)」$/.exec(note);
      if (match) add(match[1], match[2].split('：')[0], match[3].slice(0,100), slot);
      else {
        const brush = /^(.+?) · 朱批「([\s\S]*)」（原请款仍待准驳）$/.exec(note);
        if (brush) add(brush[1], '只作朱批', brush[2].slice(0,100), slot);
      }
    }
  }
  return [...records.values()];
}

export function memorialArchive(state) {
  if (!state) return [];
  const chapters = [...state.volumes.flatMap(v => v.chapters), ...state.history], seen = new Set();
  return chapters.flatMap(h => h.memorialReviews === undefined ? legacyReviews(h) : h.memorialReviews)
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .sort((a,b) => b.turn - a.turn || ['夜','午','朝'].indexOf(a.slot) - ['夜','午','朝'].indexOf(b.slot));
}

export function memorialReviewDate(record) {
  const e = record.era;
  return e?.name && e.year && e.month ? e.name + e.year + '年' + e.month + '月' +
    (['上','中','下'][e.xun] || '') + '旬' : '第' + record.turn + '旬';
}
