import { hallArtHTML } from './art.js';
import {INDUSTRIES} from '../core/tech-rules.js';
import { esc, gameText, openDialog } from './common.js';
import { campaignsHTML, treatyHTML } from './campaigns.js';
import { metricGroups } from './view-model.js';
import { nationData, nationFlow, nationSeries } from './nation-data.js';
import { FREEDOM_RULES } from '../core/freedom.js';
import { DIFFICULTIES } from './opening-options.js';

const number=n=>Number.isFinite(n)?n.toLocaleString('zh-CN',{maximumFractionDigits:2}):'—';
const sign=n=>Math.abs(n)<0.005?'0':(n>0?'+':n<0?'−':'')+number(Math.abs(n));
const delta=n=>'<span class="'+(Math.abs(n)<0.005?'muted':n>0?'positive':'negative')+'">'+sign(n)+'</span>';
const table=(headers,rows)=>'<div class="nation-table-wrap"><table class="nation-table"><thead><tr>'+
  headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
  rows.map(row=>'<tr>'+row.map((cell,i)=>'<td data-label="'+esc(headers[i])+'">'+esc(cell)+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div>';
const section=(title,body,note='')=>'<section class="nation-section"><h3>'+esc(title)+'</h3>'+
  (note?'<p class="muted nation-note">'+esc(note)+'</p>':'')+body+'</section>';
const figures=items=>'<dl class="nation-figures">'+items.map(([label,value,unit=''])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+
  (unit?'<small> '+esc(unit)+'</small>':'')+'</dd></div>').join('')+'</dl>';

export function nationSparkline(points,label) {
  if(!points.length)return '<p class="muted">推进几旬后，这里会留下走势。</p>';
  const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value));
  const xy=points.map((p,i)=>({x:12+i*296/Math.max(1,points.length-1),y:max===min?56:96-(p.value-min)/(max-min)*80,p}));
  return '<svg class="nation-spark" viewBox="0 0 320 112" role="img" aria-label="'+esc(label+'走势，共'+points.length+'旬记录')+'">'+
    '<path class="nation-spark-grid" d="M12 16H308 M12 56H308 M12 96H308"/>'+
    '<polyline points="'+xy.map(v=>v.x+','+v.y).join(' ')+'"/>'+xy.map(v=>'<circle cx="'+v.x+'" cy="'+v.y+'" r="3"><title>'+esc('第'+v.p.turn+'旬：'+number(v.p.value))+'</title></circle>').join('')+
    '</svg><p class="nation-chart-range"><span>最低 '+number(min)+'</span><span>最高 '+number(max)+'</span></p>';
}
function flowHTML(s,span,expanded) {
  const flow=nationFlow(s,span);
  const summary='<div class="nation-flow-totals">'+[['treasury','国库','万两'],['privy','内帑','万两'],['grain','粮储','万石']].map(([key,name,unit])=>{
    const t=flow.totals[key];return '<div><h4>'+name+' <small>'+unit+'</small></h4><p>入 '+number(t.income)+' · 出 '+number(t.expense)+'</p><strong>净变 '+delta(t.net)+'</strong></div>';
  }).join('')+'</div>';
  const rows=flow.rows.slice(0,expanded?undefined:12).map(r=>[r.current?'本旬已办':'第'+r.turn+'旬',gameText(r.source),sign(r.treasury),sign(r.privy),sign(r.grain)]);
  return summary+(rows.length?table(['时日','事项','国库 / 万两','内帑 / 万两','粮储 / 万石'],rows):'<p class="muted">这段时间尚无钱粮变化。</p>')+
    (flow.rows.length>12?'<button data-nation-expand>'+ (expanded?'收起流水':'展开全部 '+flow.rows.length+' 条流水')+'</button>':'');
}
export function nationOverviewHTML(s,span=12,expanded=false) {
  if(!s)return '<p>登基后，可在这里查看天下钱粮与朝局。</p>';
  const d=nationData(s),metrics=metricGroups(s).flatMap(g=>g.stats);
  const cards='<div class="nation-summary">'+metrics.map(m=>'<article class="nation-reading'+(m.danger?' nation-danger':'')+'"><span>'+m.label+'</span><strong>'+number(m.value)+
    '<small>'+m.unit+'</small></strong><p>本旬 '+delta(m.delta)+'</p></article>').join('')+'</div>';
  const dates=s.era.name+s.era.year+'年'+s.era.month+'月'+['上','中','下'][s.era.xun]+'旬';
  const top='<p class="nation-dateline">'+esc(s.dynasty+' · '+dates+' · '+s.emperor.name)+'</p><p class="muted">口谕：'+
    esc((FREEDOM_RULES[s.settings.freedom]||FREEDOM_RULES.mid).label)+' · 施政：'+esc((DIFFICULTIES[s.settings.difficulty]||DIFFICULTIES.normal).label)+'</p>'+cards+
    '<div class="nation-alerts">'+(d.alerts.length?d.alerts.map(a=>'<span>'+esc(a)+'</span>').join(''):'<span class="nation-calm">暂无紧急钱粮与边务警报</span>')+'</div>';
  const budget=figures([
    ['格物月经费',number(s.tech?.current?s.tech.funding:0),'万两'],['每月俸禄',number(d.monthly.salaries),'万两'],['每月军饷',number(d.monthly.armyPay),'万两'],
    ['现银可付俸饷',number(d.months),'月'],['国库积欠',number(s.nation.arrears),'万两'],
    ['内帑积欠',number(s.nation.privyArrears),'万两'],['缺粮积欠',number(s.nation.grainArrears),'万石'],
    ['每月军粮',number(d.grain.military),'万石'],['每月赈济用粮',number(d.grain.relief),'万石'],
    ['粮储可供',number(d.grainMonths),'月'],['仓容',number(d.grain.storageCapacity),'万石'],
    ['预计季入',number(d.quarterIncome),'万两'],['季入扣欠后',sign(d.quarterNet),'万两'],
    ['预计月变 · 国库',sign(d.monthNet.treasury),'万两'],['预计月变 · 内帑',sign(d.monthNet.privy),'万两'],
    ['预计月变 · 粮储',sign(d.monthNet.grain),'万石'],['每月冗费与侵吞',number(d.waste.amount),'万两'],
  ]);
  const charts='<div class="nation-charts">'+[['nation.treasury','国库'],['nation.morale','民心'],['nation.governance','吏治'],['emperor.prestige','皇威']].map(([path,label])=>
    '<article><h4>'+label+'</h4>'+nationSparkline(nationSeries(s,path,span),label)+'</article>').join('')+'</div>';
  const period='<div class="nation-period" role="group" aria-label="查看时段">'+[3,12,36].map(n=>'<button data-nation-period="'+n+'" aria-pressed="'+(n===span)+'">近'+n+'旬</button>').join('')+'</div>';
  const provinces=table(['州郡','人口 / 万人','月税额 / 万两','民心','灾情','繁荣','产业','驻军 / 人','主官'],d.provinces.map(p=>
    [p.name,number(p.pop),number(p.tax),number(p.morale),number(p.disaster)+(p.rebellion?' · 民变':''),number(p.prosperity||0),(p.industries||[]).map(i=>INDUSTRIES[i.type].name+i.level+'级'+(i.paused?'（停产）':'')).join('、')||'暂无',number(p.garrison),p.governor]));
  const armies=table(['军镇','兵员 / 人','战备','边患','主将'],d.armies.map(b=>[b.name,number(b.troops),number(b.readiness),b.threat===undefined?'—':number(b.threat),b.commander]));
  const factions=figures([['在任职位',d.serving],['空缺职位',d.vacancies],['已批奏折',s.stats.petitions],['已颁圣旨',s.stats.edicts]])+
    table(['派系','势力','态度','在任席位'],d.factions.map(f=>[f.name,number(f.power),number(f.attitude),f.posts]));
  const foreign=table(['外邦','关系','边境','态度','年贡 / 万两','互市约定'],s.foreign.map(f=>[f.name,f.status,f.frontier+'境',number(f.attitude),
    number(f.status==='朝贡'?f.tribute:0),f.trade&&f.trade.until>=s.turn&&f.status!=='交战'?number(f.trade.income)+'万两 / 季 · 余'+(f.trade.until-s.turn)+'旬':'无']));
  const projects=d.projects.length?table(['政务','主办','进度','尚余 / 旬'],d.projects.map(p=>[p.name||p.edictType,p.office,number(p.progress)+'%',Math.max(0,p.end-s.turn)])):'<p class="muted">暂无在途政务。</p>';
  const wars=d.campaigns.length?table(['战区','对手','已战 / 旬','胜负差','敌兵 / 人'],d.campaigns.map(w=>[w.dir+'境',s.foreign.find(f=>f.id===w.country)?.name||'外邦',w.round||0,w.score||0,number(w.enemyTroops)])):'<p class="muted">目前没有战事。</p>';
  const palace=figures([['皇帝年龄',s.emperor.age,'岁'],...Object.entries(s.emperor.talents).map(([k,v])=>[k,number(v)]),
    ['在宫嫔妃',d.consorts,'人'],['在世皇嗣',d.children.length,'人'],['储君',s.harem.children.find(c=>c.id===s.harem.heir)?.name||'尚未册立']]);
  return top+section('钱粮与用度',budget,'依眼下情势估算；俸饷月数仅计官俸与军饷。')+
    section('近旬走势',period+charts)+
    section('钱粮来去',flowHTML(s,span,expanded),'近'+span+'旬，含本旬已办事项与两库拨转。')+
    section('各州民情',figures([['总人口',number(d.population),'万人'],['有灾州郡',d.disaster],['州郡总数',d.provinces.length]])+provinces,'所列为原定税额，实收随地方情势而变。')+
    section('京营与四境',armies)+section('朝堂各派',factions)+section('外邦往来',foreign)+section('在途政务',projects)+section('当前战事',wars)+
    section('战役与议约',campaignsHTML(s)+s.foreign.filter(f=>f.treaty).map(f=>'<h4>'+esc(f.name)+'</h4>'+treatyHTML(s,f)).join(''))+
    section('圣躬与储位',palace);
}
export function openNationOverview(state) {
  let span=12,expanded=false;
  openDialog('国势全览','<div id="nation-overview">'+nationOverviewHTML(state,span,expanded)+'</div>','nation-shell');
  document.querySelector('#modal .dialog-head').insertAdjacentHTML('beforebegin',hallArtHTML('国势全览'));
  const root=document.querySelector('#nation-overview');
  root.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.nationPeriod){span=Number(b.dataset.nationPeriod);expanded=false;}
    else if(b.hasAttribute('data-nation-expand'))expanded=!expanded;
    else return;
    root.innerHTML=nationOverviewHTML(state,span,expanded);
  };
}
