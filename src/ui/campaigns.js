import { esc } from './common.js';
import { WAR_GOALS } from '../core/campaign-rules.js';
const number=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
export function treatyHTML(s,f){
 const t=f.treaty;if(!t)return '';
 const active=t.status==='active'&&s.turn<=t.until;
 const status=active?'履行中':t.status==='breached'?'失约撤军':'已结束';
 const protectedTurns=active?Math.max(0,t.truceUntil-s.turn):0;
 return '<div class="treaty-note"><strong>'+esc(t.label)+' · '+status+'</strong><p>'+
  (protectedTurns?'停战约定余 '+protectedTurns+' 旬':'当前没有停战保证')+
  (active?' · 约期余 '+Math.max(0,t.until-s.turn)+' 旬':'')+'</p>'+
  (active&&t.kind==='tribute'?'<p>驻军 '+number(t.garrison)+' 人 · 每月支银0.8万两、粮1万石；供养不足将撤军失约。</p>':'')+
  (active&&t.kind==='market'?'<p>互市每季收入2万两；对方实力每月恢复0.4。</p>':'')+'</div>';
}
export function campaignsHTML(s){
 if(!s.campaigns.length)return '<p class="muted">暂无战役。宣战时可选择安边退敌、打通商路或迫使称臣。</p>';
 return '<div class="grid">'+s.campaigns.slice(-12).reverse().map(w=>{
  const pending=s.memorials.find(m=>m.campaignOrder?.warId===w.id);
  const goal=WAR_GOALS[w.warGoal],commander=s.court.officials.find(o=>o.id===w.commander)?.name||'随军将领';
  const order=w.orders?.at(-1),remaining=w.order?Math.max(0,w.order.untilRound-w.round):0;
  return '<article class="card campaign-card"><h3>'+esc(w.title)+'</h3><p>'+
   (goal?'目标：'+esc(goal.label)+' · ':'')+esc(w.result||'交战中')+
   (w.settlement?.status==='pending'?' · 条款待定':'')+(w.personal?' · 御驾在外':'')+'</p><p>已战 '+w.round+
   (goal?' / '+goal.rounds:'')+' 旬 · 胜负差 '+(w.score||0)+' · 敌兵 '+number(w.enemyTroops)+' 人</p>'+
   (goal?'<p>主将：'+esc(commander)+'</p>':'')+
   (order?'<p>最近军令：'+esc(order.label)+(remaining?'（还影响 '+remaining+' 轮交战）':'')+'</p>':'')+
   (w.settlement?.status==='signed'?'<p>议约：'+esc(w.settlement.label)+' · '+(w.goalAchieved?'原定目标已达成':'原定目标未达成')+'</p>':'')+
   (pending?'<button data-memorial="'+esc(pending.id)+'">批复'+(pending.campaignOrder.stage==='treaty'?'议约':'军报')+
    ' · 余 '+Math.max(0,pending.due-s.turn)+' 旬</button>':'')+'</article>';
 }).join('')+'</div>';
}
