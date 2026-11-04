// Shared, data-only rules: safe to import from save validation and the UI.
export const WAR_GOALS={
 repel:{label:'安边退敌',silver:25,grain:30,rounds:6,score:1,enemy:50000,note:'击退敌军后争取停战，重在减少边患。'},
 market:{label:'打通商路',silver:30,grain:36,rounds:6,score:2,enemy:55000,note:'须取得更大优势，再议开放互市；通商也会帮助对方恢复实力。'},
 tribute:{label:'迫使称臣',silver:40,grain:48,rounds:8,score:3,enemy:65000,note:'须打出明显优势；战后驻军督贡还要长期支出钱粮。'},
};
export const CAMPAIGN_TACTICS={
 attack:{power:1.18,loss:1.35,cost:1.15},defend:{power:0.95,loss:0.65,cost:1},
 reinforce:{power:1,loss:1,cost:1},supply:{power:1.12,loss:0.85,cost:1},
 levy:{power:1.03,loss:1,cost:0.9},contract:{power:0.85,loss:0.45,cost:0.5},
 press:{power:1.25,loss:1.5,cost:1.2},consolidate:{power:0.98,loss:0.7,cost:0.9},
};
export const CAMPAIGN_CHOICES={
 maneuver:['attack','defend','reinforce'],supply:['supply','levy','contract'],
 finish:['press','consolidate','negotiate'],treaty:['peace','indemnity','market','tribute','silver','grain','retreat'],
};
export function campaignChoiceBlock(s,m,o){
 if(!m.campaignOrder)return '';
 const q=m.campaignOrder,w=s.campaigns.find(w=>w.id===q.warId);
 if(!w||w.campaignVersion!==1||!CAMPAIGN_CHOICES[q.stage]?.includes(o.id))return '这份军报已失效';
 if(q.stage==='treaty'?!w.done||w.settlement?.status!=='pending':w.done)return '战局已变，请重新查看军报';
 if(o.id==='reinforce'){
  const donor=s.nation.army.frontiers.find(b=>b.dir===q.donor);
  if(!donor||donor.dir===w.dir||donor.troops<13000||s.campaigns.some(x=>!x.done&&x.dir===donor.dir))return '援军来源不足，或该境另有战事';
  if(s.nation.army.frontiers.find(b=>b.dir===w.dir).troops>992000)return '本线兵员已满，无法接收整队援军';
 }
 if(o.id==='tribute'&&(s.nation.army.frontiers.find(b=>b.dir===w.dir)?.troops||0)<8000)return '边军不足，无法另留3000人驻军';
 for(const [key,label] of [['treasury','国库'],['grain','粮储'],['privy','内帑']])if((o.effects?.[key]||0)<-s.nation[key])return label+'不足';
 return '';
}
export function treatyActive(f,turn){return f?.treaty?.status==='active'&&turn<=f.treaty.until;}
export function treatyProtected(f,turn){return treatyActive(f,turn)&&f.treaty.truceUntil>f.treaty.start&&turn<=f.treaty.truceUntil;}
export function validateCampaignState(s){
 const ids=new Set();
 for(const w of s.campaigns){
  if(w.campaignVersion===undefined)continue;
  if(w.campaignVersion!==1||typeof w.id!=='string'||ids.has(w.id)||!Object.hasOwn(WAR_GOALS,w.warGoal)||
   !s.foreign.some(f=>f.id===w.country&&f.frontier===w.dir)||!s.nation.provinces.some(p=>p.id===w.levyProvince)||
   !Number.isSafeInteger(w.started)||w.started<0||w.started>s.turn||!Number.isSafeInteger(w.round)||w.round<0||w.round>8||
   !Number.isSafeInteger(w.reportsIssued)||w.reportsIssued<0||w.reportsIssued>3||!Array.isArray(w.orders)||w.orders.length>3||
   !Number.isSafeInteger(w.score)||Math.abs(w.score)>8||!Number.isSafeInteger(w.enemyTroops)||w.enemyTroops<0||w.enemyTroops>1000000||
   !Number.isFinite(w.enemyReadiness)||w.enemyReadiness<0||w.enemyReadiness>100||typeof w.done!=='boolean'||
   w.commander!==null&&!s.court.officials.some(o=>o.id===w.commander))throw new Error('战役资料损坏');
  ids.add(w.id);
  for(const o of w.orders)if(!Object.hasOwn(CAMPAIGN_TACTICS,o.id)&&o.id!=='negotiate'||
   !Number.isSafeInteger(o.round)||o.round<1||o.round>8||!Number.isSafeInteger(o.turn)||o.turn<w.started||o.turn>s.turn||typeof o.label!=='string')throw new Error('军令记录损坏');
  if(w.order&&(!Object.hasOwn(CAMPAIGN_TACTICS,w.order.id)||!Number.isSafeInteger(w.order.untilRound)||w.order.untilRound<w.round-2||w.order.untilRound>10))throw new Error('军令时限损坏');
  if(w.settlement!==null){const t=w.settlement;
   if(!w.done||!t||!['pending','signed'].includes(t.status)||!Number.isSafeInteger(t.turn)||t.turn<w.started||t.turn>s.turn||
    t.status==='signed'&&(!CAMPAIGN_CHOICES.treaty.includes(t.kind)||typeof t.label!=='string'||typeof w.goalAchieved!=='boolean'))throw new Error('议约结果损坏');
  }else if(w.done)throw new Error('战后议约资料缺失');
 }
 for(const m of s.memorials){if(!m.campaignOrder)continue;const q=m.campaignOrder;
  if(!ids.has(q.warId)||!CAMPAIGN_CHOICES[q.stage]||!CAMPAIGN_CHOICES[q.stage].includes(q.fallback)||
   !Array.isArray(m.options)||!m.options.length||new Set(m.options.map(o=>o.id)).size!==m.options.length||
   m.options.some(o=>!CAMPAIGN_CHOICES[q.stage].includes(o.id))||!m.options.some(o=>o.id===q.fallback)||
   !Number.isSafeInteger(m.due)||m.due<0||q.donor&&!s.nation.army.frontiers.some(b=>b.dir===q.donor))throw new Error('军报资料损坏');
 }
 for(const f of s.foreign){const t=f.treaty;if(t===undefined)continue;
  if(!t||!ids.has(t.warId)||!CAMPAIGN_CHOICES.treaty.includes(t.kind)||!['active','expired','breached'].includes(t.status)||
   typeof t.label!=='string'||!['start','until','truceUntil','lastPaid','garrison'].every(k=>Number.isSafeInteger(t[k])&&t[k]>=0)||
   t.start>s.turn||t.until<t.start||t.until-t.start>36||t.truceUntil<t.start||t.truceUntil>t.until||t.lastPaid>s.turn||
   t.garrison>3000||!s.nation.army.frontiers.some(b=>b.dir===t.dir)||
   !s.campaigns.some(w=>w.id===t.warId&&w.country===f.id&&w.dir===t.dir&&w.settlement?.status==='signed'))throw new Error('条约资料损坏');
 }
}
