// Presentation identities only: no dice, art pool sizes, or changes to gameplay.
// Copy on write also protects deceased officials shared by clone() and frozen forecasts.
export function assignFaces(state) {
  if (state.faceCounters !== undefined && (!state.faceCounters || typeof state.faceCounters !== 'object' ||
    Array.isArray(state.faceCounters) || Object.values(state.faceCounters).some(n=>!Number.isSafeInteger(n)||n<0)))
    throw new Error('人物脸号计数器损坏');
  const counters = { ...(state.faceCounters || {}) };
  const groups = [
    ['emperor', [state.emperor]],
    ['official', state.court.officials],
    ['consort', [...state.harem.consorts, ...(state.harem.candidates || [])]],
    ['child', state.harem.children],
    ['royalWoman', state.harem.royalWomen || []],
    ['foreign', state.foreign],
  ];
  const replacements = new Map();
  for (const [key, people] of groups) {
    let next = Number.isSafeInteger(counters[key]) && counters[key] >= 0 ? counters[key] : 0;
    for (const p of people) if (Number.isSafeInteger(p.faceNo) && p.faceNo >= 0) next = Math.max(next, p.faceNo + 1);
    for (const p of people) {
      if (p.faceNo !== undefined) {
        if (!Number.isSafeInteger(p.faceNo) || p.faceNo < 0) throw new Error('人物脸号损坏');
        continue;
      }
      if (!Number.isSafeInteger(next + 1)) throw new Error('人物脸号超出范围');
      replacements.set(p, { ...p, faceNo: next++ });
    }
    counters[key] = next;
  }
  if (!replacements.size && state.faceCounters &&
    Object.keys(counters).length === Object.keys(state.faceCounters).length &&
    Object.entries(counters).every(([key,value])=>state.faceCounters[key]===value)) return state;
  const person = p => replacements.get(p) || p;
  return { ...state, faceCounters: counters, emperor: person(state.emperor),
    court: { ...state.court, officials: state.court.officials.map(person) },
    harem: { ...state.harem, consorts: state.harem.consorts.map(person),
      candidates: (state.harem.candidates || []).map(person), children: state.harem.children.map(person),
      royalWomen: (state.harem.royalWomen || []).map(person) },
    foreign: state.foreign.map(person) };
}
