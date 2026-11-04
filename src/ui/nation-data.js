import { monthlyBudget, grainBudget, wasteQuote } from '../core/finance.js';
import { nationMonth, nationQuarter } from '../core/nation.js';

export function entryChange(e) {
  return Number.isFinite(e.before)&&Number.isFinite(e.after)?e.after-e.before:Number.isFinite(e.delta)?e.delta:0;
}
export function recentNationEntries(s, span=12) {
  const chapters=[...s.volumes.flatMap(v=>v.chapters),...s.history];
  return chapters.filter(h=>h.turn>s.turn-span&&h.turn<=s.turn).flatMap(h=>(h.entries||[]).map(e=>({...e,turn:h.turn})))
    .concat((s.interimEntries||[]).map(e=>({...e,turn:s.turn+1,current:true})));
}
export function nationSeries(s, path, span=12) {
  let value=path.split('.').reduce((o,k)=>o?.[k],s), next=s.turn;
  if(!Number.isFinite(value))return [];
  value-=(s.interimEntries||[]).filter(e=>e.path===path).reduce((n,e)=>n+entryChange(e),0);
  const chapters=[...s.volumes.flatMap(v=>v.chapters),...s.history].filter(h=>h.turn<=s.turn).sort((a,b)=>b.turn-a.turn);
  const out=[];
  for(const h of chapters){
    if(h.turn!==next||out.length>=span)break;
    out.push({turn:h.turn,value});
    value-=(h.entries||[]).filter(e=>e.path===path).reduce((n,e)=>n+entryChange(e),0);next--;
  }
  return out.reverse();
}
export function nationFlow(s, span=12) {
  const currencies=['treasury','privy','grain'],rows=new Map();
  const totals=Object.fromEntries(currencies.map(k=>[k,{income:0,expense:0,net:0}]));
  for(const e of recentNationEntries(s,span)){
    const k=e.path?.split('.')[1];if(!currencies.includes(k)||e.path!=='nation.'+k)continue;
    const change=entryChange(e);if(!change)continue;
    const t=totals[k];t.net+=change;if(change>0)t.income+=change;else t.expense-=change;
    const id=e.turn+'\0'+e.source;
    if(!rows.has(id))rows.set(id,{turn:e.turn,current:!!e.current,source:e.source,treasury:0,privy:0,grain:0});
    rows.get(id)[k]+=change;
  }
  return {totals,rows:[...rows.values()].filter(r=>currencies.some(k=>Math.abs(r[k])>1e-7)).reverse()};
}
export function nationData(s) {
  const monthly=monthlyBudget(s),grain=grainBudget(s),waste=wasteQuote(s);
  // Use the same pure settlements as the game; the preview never advances the
  // saved state or rolls dice. It is a quote at today's conditions, not a promise.
  const month=nationMonth(s),quarter=nationQuarter(s),fixed=monthly.salaries+monthly.armyPay;
  const named=id=>s.court.officials.find(o=>o.id===id&&o.alive&&!o.retired&&!o.jailed&&o.health>0)?.name||'空缺';
  const serving=s.court.posts.filter(p=>named(p.holder)!=='空缺');
  const alerts=[];
  if(s.nation.treasury<fixed)alerts.push('现银不足一月俸禄与军饷');
  if(s.nation.grain<grain.monthly)alerts.push('现粮不足一月军粮与赈济');
  if(s.nation.arrears>0)alerts.push('国库仍有积欠 '+s.nation.arrears.toFixed(1)+' 万两');
  const disaster=s.nation.provinces.filter(p=>p.disaster>0),unrest=s.nation.provinces.filter(p=>p.morale<30||p.rebellion);
  if(disaster.length)alerts.push(disaster.length+'州有灾');
  if(unrest.length)alerts.push(unrest.length+'州民情不稳');
  for(const b of s.nation.army.frontiers.filter(b=>b.threat>=80))alerts.push(b.dir+'境边患 '+Math.round(b.threat));
  const urgent=s.memorials.filter(m=>m.urgent&&m.due-s.turn<=1).length;if(urgent)alerts.push(urgent+'本急报即将到期');
  return {
    monthly,grain,waste,fixed,alerts,disaster:disaster.length,
    population:s.nation.provinces.reduce((n,p)=>n+p.pop,0),
    months:fixed?s.nation.treasury/fixed:null,grainMonths:grain.monthly?s.nation.grain/grain.monthly:null,
    monthNet:Object.fromEntries(['treasury','privy','grain'].map(k=>[k,month.nation[k]-s.nation[k]])),
    quarterIncome:quarter.stats.income-s.stats.income,quarterNet:quarter.nation.treasury-s.nation.treasury,
    provinces:s.nation.provinces.map(p=>({...p,governor:named(s.court.posts.find(x=>x.provinceId===p.id)?.holder||p.governor)})),
    armies:[{name:'京营',...s.nation.army.capital,commander:named(s.court.posts.find(p=>p.title==='京营统领')?.holder)},
      ...s.nation.army.frontiers.map(b=>({...b,name:b.dir+'境',commander:named(s.court.posts.find(p=>p.title===b.dir+'境总兵')?.holder)}))],
    serving:serving.length,vacancies:s.court.posts.length-serving.length,
    factions:s.court.factions.map(f=>({...f,posts:serving.filter(p=>s.court.officials.find(o=>o.id===p.holder)?.faction===f.id).length})),
    projects:s.projects.filter(p=>!p.done),campaigns:s.campaigns.filter(w=>!w.done),
    children:s.harem.children.filter(c=>c.health>0&&c.id!==s.reign?.emperorId&&c.name!==s.emperor.name),
    consorts:s.harem.consorts.filter(c=>!c.retired&&c.health>0).length,
  };
}
