import { esc } from "./common.js";
import { fateLabel } from "../core/rng.js";
import { energyLimit } from "../core/emperor.js";
import { scheduleCost, ACTIONS } from "../core/turn.js";
import { ACTION_GROUPS, HALLS, GLYPHS, actionAvailability, actionMeta, energyView, metricGroups, scheduleEstimate } from "./view-model.js";
export const num = (n) =>
  Number(n).toLocaleString("zh-CN", { maximumFractionDigits: 1 });
export const date = (s) =>
  esc(s.era.name) +
  " " +
  s.era.year +
  "年" +
  s.era.month +
  "月" +
  ["上", "中", "下"][s.era.xun] +
  "旬";
export function actionButton(kind, s = null) {
  const reason=actionAvailability(s,kind);
  return '<button class="action-card" data-action="'+esc(kind)+'" draggable="'+(!reason)+'" '+(reason?'disabled ':'')+'title="'+esc(kind+' · '+(reason||actionMeta(kind)))+'"><span class="glyph" aria-hidden="true">'+GLYPHS[kind]+'</span><span class="action-copy"><strong>'+esc(kind)+'</strong><small>'+esc(reason||actionMeta(kind))+'</small></span></button>';
}
export function actionsHTML(s, includeHalls = false) {
  return ACTION_GROUPS.map(([group,kinds])=>'<section class="action-group"><h2>'+group+'</h2><div class="action-grid">'+kinds.map(k=>actionButton(k,s)).join('')+'</div></section>').join('')+(includeHalls?'<nav class="dock-halls" aria-label="殿阁"><h2>殿阁</h2><div>'+HALLS.map(p=>'<button data-panel="'+p+'">'+p+'</button>').join('')+'</div></nav>':'');
}
export function energyHTML(s, compact=false) {
  const e=energyView(s);
  return '<div class="energy '+(compact?'compact':'')+'" aria-label="精力 余 '+e.remaining+' / '+e.limit+(e.excess?'，透支 '+e.excess:'')+'"><span class="energy-label">精力</span><span class="pips" aria-hidden="true">'+Array.from({length:Math.max(e.limit,e.used)},(_,i)=>'<i class="pip '+(i>=e.limit?'over':i<e.used?'spent':'free')+'"></i>').join('')+'</span><span>余 <b>'+e.remaining+'</b> / '+e.limit+'</span></div>';
}
export function metricsHTML(s, mobile = false) {
 const groups=metricGroups(s),draw=(m)=>'<div class="metric '+(m.danger?'danger':'')+'"><span class="metric-label">'+m.label+'</span><span class="metric-reading"><strong>'+ (Number.isFinite(m.value)?num(m.value):'—')+'</strong><small>'+m.unit+'</small>'+(Math.abs(m.delta)>=.05?'<span class="trend '+(m.delta>0?'positive':'negative')+'" title="较上旬净变化">'+(m.delta>0?'▲':'▼')+num(Math.abs(m.delta))+'</span>':'')+'</span><span class="metric-meter" aria-hidden="true"><i style="width:'+Math.min(100,Math.max(0,(m.value||0)/m.max*100))+'%"></i></span></div>';
 if(mobile)return '<button class="mobile-stats" data-command="stats" title="展开完整国势" aria-description="点击查看四组完整国势与单位">'+['国库','民心','吏治','皇威'].map(k=>draw(groups.flatMap(g=>g.stats).find(m=>m.label===k))).join('')+'</button>';
 return '<div class="metrics" aria-label="国势四组">'+groups.map(g=>'<section class="metric-group weight-'+g.weight+' '+(g.stats.some(m=>m.danger)?'group-danger':'')+'"><h2>'+g.name+'</h2><div class="metric-values">'+g.stats.map(draw).join('')+'</div></section>').join('')+'</div>';
}
export function ledgerHTML(entries) {
  return (
    "<ul>" +
    entries
      .map(
        (e) =>
          "<li>" +
          esc(e.source) +
          "：" +
          esc(
            {
              treasury: "国库",
              arrears: "欠饷与积欠",
              privy: "内帑",
              grain: "粮储",
              morale: "民心",
              governance: "吏治",
              health: "健康",
              mood: "心情",
              prestige: "皇威",
              virtue: "圣德",
              favor: "好感",
              energy: "精力",
              age: "年岁",
              power: "势力",
              attitude: "态度",
              readiness: "军备",
              troops: "兵力",
              pop: "人口",
              tax: "赋税",
              education: "教养",
              progress: "政务进度",
              enemyTroops: "敌军兵力",
              enemyReadiness: "敌军军备",
              round: "战役旬数",
              threat: "边患",
              灾情: "灾情",
              disaster: "灾情",
            }[e.path.split(".").at(-1)] ||
              (/[\u3400-\u9fff]/.test(e.path.split(".").at(-1))
                ? e.path.split(".").at(-1)
                : "相关数值"),
          ) +
          ' <span class="' +
          ((e.path === "nation.arrears" ? e.delta <= 0 : e.delta >= 0)
            ? "positive"
            : "negative") +
          '">' +
          (e.delta > 0 ? "+" : "") +
          num(e.delta) +
          "</span></li>",
      )
      .join("") +
    "</ul>"
  );
}
export function chapterTitle(summary) {
 return String(summary||'').replace(/^(本旬(?:大凶|凶|平常|吉|大吉))，诸事已据实落账$/,'$1');
}
export function chapterHTML(h, ambitions = []) {
 return '<div class="chapter-head"><span class="eyebrow">第 '+h.turn+' 章</span><h2>'+esc(chapterTitle(h.summary))+'</h2><span class="chapter-fate">天命 · '+esc(h.fate||fateLabel(h.die))+'（'+h.die+'）</span></div><div class="chapter-date">'+esc(h.era.name)+' '+h.era.year+'年'+h.era.month+'月</div><div class="prose">'+['朝','午','夜'].map(slot=>'<h3>'+slot+'</h3><p>'+esc(h.chapter[slot]||'略。')+'</p>').join('')+'</div><div class="chapter-tabs"><details class="ledger"><summary>起居注 '+h.entries.length+' 条</summary><div class="chapter-detail">'+Object.entries(h.settlement?.slotResults||{}).map(([slot,results])=>'<p>'+slot+'：'+results.map(esc).join('；')+'</p>').join('')+ledgerHTML(h.entries)+(h.notes||[]).map(n=>'<p>'+esc(n)+'</p>').join('')+'</div></details><details><summary>风闻 '+(h.rumors?.length||0)+' 条</summary><div class="chapter-detail">'+(h.rumors?.length?h.rumors.map(r=>'<p>'+esc(r)+'</p>').join(''):'<p>本旬无新风闻。</p>')+'</div></details><details><summary>宏愿进展</summary><div class="chapter-detail">'+(ambitions.length?ambitionsHTML({ambitions}):'<p>详见史馆的宏愿与心事。</p>')+'</div></details></div>';
}
export function memorialHTML(m) {
 return '<button class="memorial '+(m.urgent?'urgent':'')+'" data-memorial="'+esc(m.id)+'"><span class="memorial-rail" aria-hidden="true"></span><span class="memorial-copy"><strong>'+esc(m.title)+(m.urgent?'<span class="stamp">急</span>':'')+(m.secret?'<span class="paper-tag">密</span>':'')+'</strong><small>'+esc(m.from)+' · 剩 '+Math.max(0,m.due-(m.currentTurn||0))+' 旬</small></span></button>';
}
export function ambitionsHTML(s) {
 return s.ambitions.map(a=>'<div class="ambition"><div class="ambition-heading"><span><small>'+esc(a.kind)+'</small>　'+esc(a.title)+'</span><span class="ambition-percent">'+num(a.progress)+'%</span></div><div class="bar" role="progressbar" aria-label="'+esc(a.title)+'" aria-valuenow="'+a.progress+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+a.progress+'%"></i></div></div>').join('');
}
export function introHTML() {
  return '<div class="intro"><div class="eyebrow">架空帝王 · 文字经营</div><h1>御 极</h1><p class="motto">一人之志，天下之重。</p><div class="rule"></div><p>朱笔落下，是一人心事，亦是万民生计。</p><p>在朝堂与宫闱之间，写下你的本纪。</p><div class="start-actions"><button class="primary" data-command="new">登基开局</button><button data-command="saves">续读旧卷</button></div><small>可接入叙事接口，也可先试读一局。</small><div class="onboarding">朝、午、夜，三时由你安排。<br>阅毕奏报，便可起驾；也可歇息一旬。</div></div>';
}
export function renderApp(s,{readOnly=false,busy=false,saveStatus=""}={}) {
 const last=s?.history.at(-1),locked=readOnly||busy||!!s?.ending||!!s?.pending,e=energyView(s),estimate=scheduleEstimate(s);
 const money=Object.entries(estimate.totals).filter(([,v])=>v).map(([k,v])=>'<span class="'+(v>0?'positive':'negative')+'">'+({treasury:'国库',privy:'内帑',grain:'粮储'}[k])+' '+(v>0?'+':'−')+num(Math.abs(v))+(k==='grain'?' 万石':' 万两')+'</span>').join('　');
 const scheduled=s&&Object.values(s.schedule).some(Boolean);
 const palaces=HALLS.map(p=>'<button data-panel="'+p+'">'+p+'</button>').join('');
 const opening=s?'<div class="chapter-head"><span class="eyebrow">御极 · 序章</span><h2>'+esc(s.era.name)+'新政</h2><span class="chapter-fate">'+esc(s.dynasty)+'</span></div><div class="prose"><p>'+esc(s.backstory||'先帝遗命传入宫门，百官在丹墀下依班肃立。新帝承统，宫中循着旧例运转，天下却已将目光投向御案上的第一封奏报。')+'</p><p>奏报已送到御前。此后的每一旬，朝、午、夜三时都由你安排。</p></div><div class="chapter-tabs"><button data-action="上朝">批阅六部奏报 ›</button></div>':introHTML();
 return '<header class="topbar"><div class="brand"><div class="seal" aria-hidden="true">御<br>极</div><div><h1>'+ (s?esc(s.dynasty)+' · '+esc(s.era.name)+s.era.year+'年':'御极 · 夜御案')+'</h1><div class="date">'+(s?s.era.month+'月 '+['上','中','下'][s.era.xun]+'旬 · 第 '+(s.turn+1)+' 旬　'+esc(s.emperor.name)+' 在位':'一人之志，天下之重。')+'</div><div class="mobile-energy">'+energyHTML(s,true)+'</div></div></div>'+metricsHTML(s)+'<div class="top-actions"><button data-command="saves">存档</button><button data-command="settings">设置</button></div><button class="mobile-menu" data-command="menu" aria-label="御前菜单">☰</button>'+metricsHTML(s,true)+'</header><div class="workbench"><aside class="dock" aria-label="行动坞">'+actionsHTML(s,true)+'</aside><main class="desk">'+(s?'<section class="planning" aria-label="本旬日程"><div class="planning-title"><h2>本旬日程</h2>'+energyHTML(s)+'</div><div class="schedule">'+['朝','午','夜'].map((slot)=>{
 const a=s.schedule[slot],energy=a?scheduleCost({[slot]:a}):0;
 const summary=a?.memorials?a.memorials.map(id=>s.memorials.find(m=>m.id===id)?.title||'已归档奏报').join(' · '):a?.label||ACTIONS&&Object.keys(ACTIONS).filter(k=>ACTIONS[k].slots.includes(slot)).slice(0,4).join(' · ');
 return '<div class="slot-wrap '+(a?'filled':'empty')+'"><button class="slot" data-slot="'+slot+'" '+(locked?'disabled':'')+'><span class="slot-meta"><span>'+slot+' · '+{朝:'辰时',午:'未时',夜:'戌时'}[slot]+'</span>'+(a?'<span>精力 '+energy+'</span>':'')+'</span><strong>'+esc(a?(a.kind+(a.memorials?' · '+a.memorials.length+' 本':'')):'＋ 安排'+{朝:'朝间',午:'午间',夜:'夜间'}[slot])+'</strong><small>'+esc(summary)+'</small></button>'+(a?'<button class="slot-clear" data-clear="'+slot+'" aria-label="清空'+slot+'时段" '+(locked?'disabled':'')+'>×</button>':'')+'</div>';
 }).join('')+'</div><div class="turnbar"><div class="estimate"><span>'+(money?'预估：'+money:'本旬暂无额外开销')+'</span>'+(estimate.executions.length?'<small>成算：'+esc(estimate.executions.join('、'))+' · 成败仍看天命</small>':'')+(e.excess?'<strong class="negative">透支 '+e.excess+' 点：劳累、健康与心情受损</strong>':'')+'</div><button class="oral-trigger" data-command="oral" '+(locked?'disabled':'')+'>口谕</button><button class="primary advance" data-command="advance" '+(readOnly||busy||s.ending?'disabled':'')+'>'+(busy?'正在续写…':s.pending?'重试本旬叙事':scheduled?'起驾':'歇息')+'</button></div></section>':'')+(readOnly?'<p class="warning">此卷暂不可改写，旧卷已保留。请先导出备份。</p>':'')+(s?.pending?'<div class="warning">本旬待续 · 天命 '+s.pending.forecast.die+'，钱粮与成败已定。<button data-command="settle" '+(busy?'disabled':'')+'>先记入起居注</button></div>':'')+(s?.ending?'<div class="warning">'+esc(s.ending.type)+' · '+esc(s.ending.cause)+'<button data-panel="史馆">查看本纪</button></div>':'')+'<article class="scroll" id="scroll" tabindex="0" aria-label="本旬正文章节">'+(last?chapterHTML(last,s.ambitions):opening)+'<div id="stream" class="streaming" aria-live="polite"></div></article><div class="saved-status">'+esc(saveStatus|| (s?(s.settings.demo?'试读中':'本纪续写中'):'御案待启。'))+'</div></main><aside class="sidebar" aria-label="奏报匣"><div class="side-title"><h2>奏报匣</h2><small>'+(s?.memorials.length||0)+' 本待阅 · '+(s?.memorials.filter(m=>m.urgent).length||0)+' 急</small></div>'+(s?s.memorials.slice(0,6).map(m=>memorialHTML({...m,currentTurn:s.turn})).join('')+(s.memorials.length>6?'<button data-command="memorials">展开余下 '+(s.memorials.length-6)+' 本</button>':''):'<p class="muted">待新帝登基，呈送六部奏报。</p>')+'<section class="ambitions-block"><h2>宏愿与心事</h2>'+(s?ambitionsHTML(s):'<p class="muted">两件天下事，两桩心中愿。</p>')+'</section></aside></div><nav class="mobile-nav" aria-label="移动导航"><button data-command="actions"><span aria-hidden="true">令</span>行动</button><button data-command="memorials"><span aria-hidden="true">折</span>奏报'+(s?' '+s.memorials.length:'')+'</button><button data-command="palaces"><span aria-hidden="true">阁</span>殿阁</button><button data-command="journal"><span aria-hidden="true">录</span>起居注</button></nav>';
}
