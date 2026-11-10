import { ART_POOLS, ART_UNIQUE, ART_SCENES, ART_HALLS, ART_FOCUS, HALL_SCENES } from './art-manifest.js';
import { scenarioById } from '../core/scenarios.js';
import { esc } from './common.js';

let enabled = true;
export function illustrationsEnabled() { return enabled; }
export function setIllustrations(value) {
  enabled = !!value;
  try { localStorage.setItem('yuji:illustrations', String(enabled)); } catch {}
  refreshIllustrations();
}
function refreshIllustrations() {
  document.documentElement.classList.toggle('art-off', !enabled);
  for (const source of document.querySelectorAll('source[data-art-srcset]')) {
    if(enabled)source.setAttribute('srcset',source.dataset.artSrcset);
    else source.removeAttribute('srcset');
  }
  for (const img of document.querySelectorAll('img[data-art-src]')) {
    if (enabled) {
      if (img.dataset.artSrcset) img.setAttribute('srcset', img.dataset.artSrcset);
      img.setAttribute('src', img.dataset.artSrc);
    } else {
      img.removeAttribute('srcset'); img.removeAttribute('src');
    }
  }
}
export function initArt() {
  try { enabled = localStorage.getItem('yuji:illustrations') !== 'false'; } catch {}
  document.documentElement.classList.toggle('art-off', !enabled);
  document.addEventListener('load', e => {
    if (e.target.matches?.('img[data-art-src]')) {
      e.target.classList.add('art-loaded'); e.target.closest('.art-portrait')?.classList.remove('art-failed');
    }
  }, true);
  document.addEventListener('error', e => {
    if (e.target.matches?.('img[data-art-src]')) {
      e.target.classList.remove('art-loaded'); e.target.closest('.art-portrait')?.classList.add('art-failed');
    }
  }, true);
}

export function artPerson(s, id) {
  return [s?.emperor, ...(s?.court.officials || []), ...(s?.harem.consorts || []),
    ...(s?.harem.candidates || []), ...(s?.harem.children || []), ...(s?.harem.royalWomen || []),
    ...(s?.foreign || [])].find(p => p && (p.id === id || p.name === id || p.ruler === id));
}
function contains(list, p) { return list?.some(x => x === p || p.id && x.id === p.id); }
export function portraitPool(s, p, role = '') {
  if (!s || !p) return null;
  const sc = scenarioById(s.scenario), dynasty = sc?.posts || 'ming';
  if (role === 'scholar') return 'shared/scholar-' + (p.age < 30 ? 'young' : 'mature');
  if (role === 'dowager') return dynasty === 'ming' ? 'ming/dowager-all' : null;
  const retained = s.artFaces?.[artPersonKey(s,p)];
  if (deceased(p) && ART_POOLS[retained?.pool]) return retained.pool;
  if (p === s.emperor) return dynasty + '/emperor-' + (p.age < 40 ? 'young' : 'old');
  if (contains(s.court.officials, p)) {
    if (p.gender !== '男') return null;
    const index = s.court.posts.findIndex(post => post.holder === p.id || p.post && post.id === p.post);
    return dynasty + '/' + (index === 9 || index >= 25 && index <= 28 ? 'general-all' :
      (sc?.eunuchPosts ? sc.eunuchPosts.includes(index) : dynasty === 'han' ? index === 10 : index === 8 && dynasty !== 'qing') ? 'eunuch-all' : 'official-' + (p.age < 55 ? 'mature' : 'old'));
  }
  if (contains(s.harem.consorts, p) || contains(s.harem.candidates, p))
    return dynasty + '/consort-' + (['皇后', '皇贵妃', '贵妃'].includes(p.rank) ? 'high' : 'regular');
  if (contains(s.harem.children, p)) {
    const age = Math.max(0, Math.floor((s.turn - p.born) / 36)), male = (p.gender || p.sex) === '男';
    return age <= 6 ? 'shared/' + (male ? 'boy' : 'girl') + '-young' :
      dynasty + '/' + (male ? 'prince' : 'princess') + '-' + (age < 16 ? 'teen' : 'adult');
  }
  if (contains(s.harem.royalWomen, p)) return dynasty + '/princess-adult';
  if (contains(s.foreign, p)) return 'shared/foreign-' + ({北:'north',西:'west',南:'south',东:'east'})[p.frontier];
  return null;
}
export function candidateFace(id) {
  let hash = 2166136261;
  for (const c of String(id)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  return hash;
}
export function artPersonKey(s,p) {
  return p === s.emperor ? 'emperor:' + (s.reign?.emperorId || 'founder') : p.id;
}
function portraitPeople(s) {
  return [s.emperor, ...s.court.officials, ...s.harem.consorts, ...(s.harem.candidates || []),
    ...s.harem.children, ...(s.harem.royalWomen || []), ...s.foreign];
}
function deceased(p) { return p.alive === false || p.health === 0; }
// Pure, inspectable assignment table. Persisting the optional display table is
// necessary: an existing overflow occupant must not change faces when someone
// dies. Only a NEW occupant may reuse a face whose owners are all deceased.
export function resolvePortraits(s) {
  const previous=s.artFaces || {}, result={}, groups=new Map();
  for (const p of portraitPeople(s)) {
    const key=portraitPool(s,p);
    if (!ART_POOLS[key]?.length || !Number.isSafeInteger(p.faceNo)) continue;
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(p);
  }
  for (const [pool,people] of groups) {
    const size=ART_POOLS[pool].length, owners=Array.from({length:size},()=>[]);
    people.sort((a,b)=>a.faceNo-b.faceNo || String(artPersonKey(s,a)).localeCompare(String(artPersonKey(s,b))));
    const valid=record=>record?.pool===pool && Number.isInteger(record.index) && record.index>=0 && record.index<size;
    // A live role/age transition may reorder its old and new pool, as §3.4 permits.
    const changed=Object.entries(previous).some(([id,record])=>record?.pool===pool &&
      portraitPeople(s).some(p=>artPersonKey(s,p)===id && !deceased(p) && portraitPool(s,p)!==pool)) ||
      people.some(p=>previous[artPersonKey(s,p)] && previous[artPersonKey(s,p)].pool!==pool);
    if (!changed) for (const p of people) {
      const id=artPersonKey(s,p), record=previous[id];
      if(valid(record)){result[id]={pool,index:record.index};owners[record.index].push(p);}
    }
    for (const p of people) {
      const id=artPersonKey(s,p);if(result[id])continue;
      let index=owners.findIndex(list=>!list.length);
      if(index<0)index=owners.findIndex(list=>list.every(deceased));
      if(index<0)index=p.faceNo%size;
      result[id]={pool,index};owners[index].push(p);
    }
  }
  return result;
}
export function withPortraitArt(s) {
  if(!s)return s;
  const artFaces=resolvePortraits(s);
  return JSON.stringify(artFaces)===JSON.stringify(s.artFaces)?s:{...s,artFaces};
}
export function poolFaceIndex(s, p, role = '') {
  const key=portraitPool(s,p,role),size=ART_POOLS[key]?.length;
  if(!size)return null;
  if(role==='scholar')return candidateFace(p.id)%size;
  if(role==='dowager')return (p.faceNo||0)%size;
  return resolvePortraits(s)[artPersonKey(s,p)]?.index ?? null;
}
export function portraitSource(s, p, role = '') {
  if (!p) return null;
  const name = p.ruler || p.name, unique = ART_UNIQUE[s?.scenario]?.[name];
  if (unique && role !== 'scholar') {
    const age = contains(s.harem.children, p) ? Math.floor((s.turn - p.born) / 36) : p.age;
    const variant = p === s.emperor && age >= 40 ? 'old' : age >= 16 && 'adult' in unique ? 'adult' : 'base';
    if (unique[variant]) return unique[variant];
  }
  const pool = ART_POOLS[portraitPool(s, p, role)], index = poolFaceIndex(s,p,role);
  return index === null ? null : pool?.[index] || null;
}
function imageHTML(src, width, height, focus, extra = '') {
  return '<img alt="" aria-hidden="true" loading="lazy" decoding="async" width="' + width + '" height="' + height +
    '" data-art-src="' + esc(src) + '"' + (enabled ? ' src="' + esc(src) + '"' : '') +
    ' style="object-position:' + focus + '" ' + extra + '>';
}
export function portraitHTML(s, p, size = 'avatar', role = '') {
  if (!p) return '';
  const src = portraitSource(s, p, role), name = p.ruler || p.name || '人';
  const status = p.alive === false || p.health === 0 ? ' art-dead' : p.cold || p.confined || p.retired ? ' art-muted' : '';
  const gold = p.rank === '皇后' || p.id && p.id === s?.harem.heir ? ' art-gold' : '';
  return '<span class="portrait art-portrait art-' + (src || size==='byline' ? size : 'avatar') + status + gold + '" aria-hidden="true"><span>' + esc(name[0]) + '</span>' +
    (src ? imageHTML(src, 400, 500, ART_FOCUS[size] || ART_FOCUS.avatar) : '') + '</span>';
}
export function sceneKey(action, slot = '朝') {
  if (action?.kind === '自拟情节') {
    const place = action.place || '';
    if (/园|花|亭/.test(place)) return 'garden';
    if (/城外|驿|出宫/.test(place)) return 'tour';
  }
  if (action?.kind === '后宫') return slot === '夜' ? 'palace' : 'garden';
  if (action?.kind === '下旨' && action.edictType === '格物') return 'study';
  if (action?.kind === '下旨' && action.edictType === '加开恩科') return 'exam';
  return ({上朝:'court',外交:'court',召见:'audience',面谈:'audience',任命:'audience',宴请:'banquet',选妃:'garden',私下行事:'study',经筵:'study',格物:'study',科举:'exam',出巡:'tour',亲征:'camp'})[action?.kind] || (slot === '夜' ? 'desk-night' : 'desk-day');
}
export function sceneHTML(key, type = 'chapter', night = false) {
  const art = ART_SCENES[key] || ART_HALLS[key];
  if (!art?.src) return '';
  const set = art.small ? art.small + ' 720w, ' + art.src + ' 1440w' : '';
  return '<div class="art-scene art-' + type + (night && !['desk-night','palace','ending'].includes(key) ? ' art-night' : '') + '" aria-hidden="true">' +
    '<picture>' + (art.small ? '<source media="(max-width: 600px)" data-art-srcset="' + esc(art.small) + '"' +
      (enabled ? ' srcset="' + esc(art.small) + '"' : '') + '>' : '') +
    imageHTML(art.src, 1440, type === 'hall' ? 480 : 810, art.focus,
      set ? 'data-art-srcset="' + esc(set) + '"' + (enabled ? ' srcset="' + esc(set) + '"' : '') + ' sizes="100vw"' : '') + '</picture></div>';
}
export function hallArtHTML(name) { return sceneHTML(HALL_SCENES[name], 'hall'); }
export function scenarioArtHTML(sc) {
  const s={scenario:sc.id,emperor:{name:sc.emperor[0],age:sc.emperor[1],faceNo:0},
    court:{officials:[],posts:[]},harem:{consorts:[],children:[]},foreign:[]};
  return sceneHTML('court','action') + portraitHTML(s,s.emperor,'card');
}
export function withChapterArt(s, forecast) {
  if (!s.history.some(h=>h.id===forecast.turnId&&!h.artScenes)) return s;
  return withPortraitArt({...s,history:s.history.map(h=>h.id===forecast.turnId&&!h.artScenes ? {...h,
    artScenes:Object.fromEntries(['朝','午','夜'].map(slot=>[slot,sceneKey(forecast.schedule?.[slot],slot)]))} : h)});
}
export function memorialPortraitHTML(s, m) {
  const p = artPerson(s, m.fromId || m.from);
  // Historical author snapshots must never be replaced by a current office holder.
  return p && p.name === m.from ? portraitHTML(s, p, 'byline') : '';
}
