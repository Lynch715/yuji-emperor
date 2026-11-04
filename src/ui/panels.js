import {technologyHTML} from './technology.js';
import {INDUSTRIES} from '../core/tech-rules.js';
import {memoryButton,relationName} from './memories.js';
import { postTitle } from "../core/scenarios.js";
import { selectionDescription } from "./view-model.js";
import { annualBudget, wasteQuote,grainBudget } from "../core/finance.js";
import { esc, openDialog } from "./common.js";
import { num, ledgerHTML, chapterHTML, chapterTitle, ambitionsHTML } from "./render.js";
import { campaignsHTML, treatyHTML } from './campaigns.js';
export function provinceCardHTML(z, governor) {
  const readings = [['民心', num(z.morale)], ['灾情', num(z.disaster)],
    ['人口', num(z.pop) + ' 万'], ['驻军', num(z.garrison)], ['繁荣', num(z.prosperity || 0)]];
  const industries = (z.industries || []).map(i =>
    '<li>' + esc(INDUSTRIES[i.type].name) + ' <span>' + i.level + '级' +
    (i.paused ? ' · 停产：' + esc(i.paused) : '') + '</span></li>').join('');
  return '<article class="province' + (z.disaster > 20 ? ' disaster' : '') + '"><h3>' + esc(z.name) +
    '</h3><dl class="province-readings">' + readings.map(([k,v]) =>
      '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('') + '</dl>' +
    '<div class="province-industries"><span>地方产业</span>' +
    (industries ? '<ul>' + industries + '</ul>' : '<p>尚未兴办</p>') + '</div>' +
    '<p class="province-governor">巡抚 <strong>' + esc(governor) + '</strong></p>' +
    '<button data-industry-province="' + esc(z.id) + '">兴办产业</button></article>';
}
export function palacePanel(s, name) {
  if (!s) {
    openDialog(name, "<p>请先登基，方可进入殿阁。</p>");
    return;
  }
  const official = (id) =>
    s.court.officials.find((o) => o.id === id)?.name || "空缺";
  let html = "";
  if(name==='格物')html=technologyHTML(s);
  if (name === "朝堂") {
    const total = s.court.factions.reduce((a, f) => a + f.power, 0);
    let angle = 0;
    const colors = ["var(--gold)", "var(--up)", "var(--glyph)", "var(--text-muted)", "var(--text-soft)", "var(--down)"];
    const stops = s.court.factions.map((f, i) => {
      const a = angle;
      angle += total ? (f.power / total) * 360 : 0;
      return colors[i] + " " + a + "deg " + angle + "deg";
    });
    html =
      '<h3>六派朝局</h3><div class="row"><div role="img" aria-label="各派势力占比，详见下表" class="faction-chart" style="background:conic-gradient(' +
      stops.join(",") +
      ')"></div><div class="faction-bars">' +
      s.court.factions
        .map(
          (f) =>
            "<div>" +
            esc(f.name) +
            " · 势力 " +
            num(f.power) +
            " · 态度 " +
            num(f.attitude) +
            '<div class="bar"><i style="width:' +
            f.power +
            '%"></i></div><small>' +
            esc(f.demand) +
            "</small></div>",
        )
        .join("") +
      '</div></div><h3 class="section-spacer">官职名册</h3>' +
      fold(
        s.court.posts.map(
          (p) =>
            '<div class="card"><h3>' +
            esc(postTitle(s, p)) +
            '</h3><span class="' +
            (p.holder ? "" : "negative") +
            '">' +
            esc(official(p.holder)) +
            '</span><p class="muted">' +
            p.rank +
            " 品 · " +
            esc(p.tags.join(" / ")) +
            "</p></div>",
        ),
      ) +
      '<h3 class="section-spacer">官员名录</h3>' +
      fold(
        s.court.officials.filter(o=>o.alive).map(
          (o) =>
            '<div class="card"><div class="row"><span class="portrait" aria-hidden="true">' +
            esc(o.name[0]) +
            "</span><h3>" +
            esc(o.name) +
            "</h3></div><p>" +
            o.age +
            " 岁 · " +
            esc(s.court.factions.find((f) => f.id === o.faction)?.name) +
            "</p><dl>" +
            Object.entries(o.abilities)
              .map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + v + "</dd>")
              .join("") +
            "<dt>好感</dt><dd>" +
            num(o.favor) +
            "</dd><dt>贪墨</dt><dd>" +
            (o.secretKnown ? num(o.greed) : "尚未揭露") +
            "</dd></dl>" +
            (o.secretKnown ? "<p>" + esc(o.secret) + "</p>" : "") +
            '<button data-talk="' +
            o.id +
            '">召见</button>'+memoryButton(o.id)+'</div>',
        ),
      );
  }
  if (name === "后宫")
    html =
      '<h3>内廷位分</h3><div class="row">' +
      ["皇后", "皇贵妃", "贵妃", "妃", "嫔", "贵人", "常在", "答应"]
        .map(
          (r) =>
            '<span class="tag">' +
            r +
            " " +
            s.harem.consorts.filter((c) => c.rank === r && !c.cold).length +
            "</span>",
        )
        .join("") +
      '</div><div class="grid section-spacer">' +
      s.harem.consorts
        .map(
          (c) =>
            '<div class="card"><div class="row"><span class="portrait" aria-hidden="true">' +
            esc(c.name[0]) +
            "</span><h3>" +
            esc(c.name) +
            "</h3></div><p>" +
            esc(c.rank) +
            " · " +
            c.age +
            " 岁 · " +
            esc(c.family) +
            "</p><dl><dt>宠爱</dt><dd>" +
            num(c.favor) +
            "</dd><dt>心情</dt><dd>" +
            num(c.mood) +
            "</dd><dt>健康</dt><dd>" +
            num(c.health) +
            "</dd><dt>孕期</dt><dd>" +
            (c.preg
              ? "孕 " +
                Math.floor((s.turn - c.preg.conceived) / 3) +
                " 月，预期尚余 " +
                Math.ceil((c.preg.due - s.turn) / 3) +
                " 月"
              : "未有身孕") +
            "</dd><dt>处境</dt><dd>" +
            (c.retired
              ? "前朝内廷"
              : c.cold
                ? "冷宫"
                : c.confined
                  ? "禁足"
                  : c.recoveryUntil > s.turn
                    ? "产后调养（尚余 " +
                      Math.ceil((c.recoveryUntil - s.turn) / 3) +
                      " 月）"
                    : "如常") +
            '</dd></dl><p class="muted">内廷关系：' +
            Object.entries(c.relations)
              .map(
                ([id, v]) =>
                  esc(relationName(s,id)) +
                  " " +
                  num(v),
              )
              .join("；") +
            '</p><button data-action="后宫">安排内廷</button>'+memoryButton(c.id)+'</div>',
        )
        .join("") +
      '</div><h3 class="section-spacer">殿选秀女</h3><p class="muted">本届 ' +
      s.harem.candidates.length +
      ' 位。'+selectionDescription(s)+'全部为成年候选人。</p><div class="grid">' +
      s.harem.candidates
        .slice(0, 10)
        .map(
          (c) =>
            '<div class="card"><h3>' +
            esc(c.name) +
            "</h3><p>" +
            c.age +
            " 岁 · " +
            esc(c.personality) +
            " · " +
            esc(s.court.factions.find((f) => f.id === c.faction)?.name) +
            "</p></div>",
        )
        .join("") +
      '</div><button data-action="选妃">殿选留牌</button>';
  if (name === "天下")
    html =
      '<h3>十二州郡</h3><div class="map-grid">' +
      s.nation.provinces
        .map(z => provinceCardHTML(z, official(z.governor)))
        .join("") +
      '</div><h3>京营</h3><div class="card"><p>兵力 '+num(s.nation.army.capital.troops)+' · 军备 '+num(s.nation.army.capital.readiness)+'</p></div><h3>四境军情</h3><div class="grid">' +
      s.nation.army.frontiers
        .map(
          (f) =>
            '<div class="card"><h3>' +
            f.dir +
            "境</h3><p>兵力 " +
            num(f.troops) +
            " · 军备 " +
            num(f.readiness) +
            "</p><label>边患 " +
            num(f.threat) +
            '</label><progress value="' +
            f.threat +
            '" max="100" aria-label="' +
            f.dir +
            '境边患"></progress></div>',
        )
        .join("") +
      '</div><h3 class="section-spacer">外邦国书</h3><div class="grid">' +
      s.foreign
        .map(
          (f) =>
            '<div class="card"><h3>' +
            esc(f.name) +
            "</h3><p>" +
            esc(f.ruler) +
            " · " +
            esc(f.status) +
            "</p><p>实力 " +
            num(f.power) +
            " · 态度 " +
            num(f.attitude) +
            "</p><small>" +
            esc(f.demand) +
            '</small>'+treatyHTML(s,f)+(f.trade&&f.trade.income>0&&f.trade.until>=s.turn?'<p>互市每季 '+num(f.trade.income)+' 万两 · 余 '+(f.trade.until-s.turn)+' 旬'+(f.status==='交战'?'（交战停收）':'')+'</p>':'')+'<p><button data-action="外交">遣使接见</button>'+memoryButton(f.id)+'</p></div>',
        )
        .join("") +
      '</div><h3 class="section-spacer">战役与议约</h3>' +campaignsHTML(s);
  if (name === "内库") {
    const entries = [...s.volumes.flatMap((v) => v.chapters), ...s.history]
      .flatMap((h) => h.entries)
      .filter((e) =>
        ["nation.treasury", "nation.privy", "nation.grain","nation.arrears","nation.privyArrears","nation.grainArrears"].includes(e.path),
      );
    html =
      '<div class="grid"><div class="card"><h3>国库</h3><p>' +
      num(s.nation.treasury) +
      ' 万两</p></div><div class="card"><h3>内帑</h3><p>' +
      num(s.nation.privy) +
      ' 万两</p></div><div class="card"><h3>粮储</h3><p>' +
      num(s.nation.grain) +
      ' 万石</p><p>仓库存粮上限 '+num(grainBudget(s).storageCapacity)+' 万石，超出的陈粮每年损耗三成。</p></div><div class="card"><h3>年度预算</h3><p>' +
      num(annualBudget(s)) + ' 万两</p><p>一年的俸禄与军饷。余银超过两年预算，超出部分每月额外耗费 ' +
      num(wasteQuote(s).rate * 100) + '%。</p></div><div class="card"><h3>欠饷与积欠</h3><p>' +
      num(s.nation.arrears || 0) + ' 万两</p><p>国库不足，便记作欠款；进项先补旧欠。</p></div><div class="card"><h3>内帑积欠</h3><p>'+num(s.nation.privyArrears||0)+' 万两</p><p>皇庄盐课每月入三万两，先补旧欠再付宫用。</p></div><div class="card"><h3>缺粮积欠</h3><p>'+num(s.nation.grainArrears||0)+' 万石</p></div></div><h3 class="section-spacer">近月钱粮明细</h3>' +
      ledgerHTML(entries.filter((e) => e.turn >= s.turn - 3).slice(-60)) +
      '<h3 class="section-spacer">在途政务</h3>' +
      fold(
        s.projects
          .slice()
          .reverse()
          .map(
            (p) =>
              '<div class="card"><h3>' +
              esc(p.edictType==='兴业'?(p.name||p.edictType):p.edictType) +
              " · " +
              (p.done ? "已结" : "在途") +
              "</h3><p>" +
              esc(p.office) +
              " · 落实 " +
              Math.round(p.execRate * 100) +
              "% · 支出 " +
              p.cost +
              ' 万两</p><progress value="' +
              p.progress +
              '" max="100" aria-label="' +
              esc(p.edictType==='兴业'?(p.name||p.edictType):p.edictType) +
              '进度"></progress></div>',
          ),
      );
  }
  if (name === "宗室")
    html =
      "<h3>储位 · " +
      esc(
        s.harem.children.find((c) => c.id === s.harem.heir)?.name || "尚未册立",
      ) +
      '</h3><p class="muted">慈宁宫：' +
      esc(s.dowager || "慈宁太后") +
      '。皇嗣满六岁显资质，十五岁后可能结党。</p><div class="grid">' +
      s.harem.children
        .map(
          (c) =>
            '<div class="card"><h3>' +
            esc(c.name) +
            " · " +
            (c.sex === "男" ? "皇子" : "公主") +
            "</h3><p>" +
            Math.floor((s.turn - c.born) / 36) +
            " 岁 · " +
            (c.legit ? "嫡出" : "庶出") +
            " · 生母 " +
            esc(s.harem.consorts.find((m) => m.id === c.mother)?.name) +
            "</p><dl><dt>健康</dt><dd>" +
            num(c.health) +
            "</dd><dt>资质</dt><dd>" +
            (s.turn - c.born >= 6 * 36 ? c.aptitude : "年幼未显") +
            "</dd><dt>师傅</dt><dd>" +
            esc(official(c.tutor)) +
            "</dd><dt>教养</dt><dd>" +
            num(c.education) +
            '</dd></dl><button data-tutor="' +
            c.id +
            '">择师教养</button>'+memoryButton(c.id)+'</div>',
        )
        .join("") +
      '</div><h3 class="section-spacer">宗室女</h3>' +
      (s.harem.royalWomen || [])
        .map(
          (w) =>
            "<p>" +
            esc(w.name) +
            " · " +
            w.age +
            " 岁 · " +
            (w.married ? "已和亲" : "待字闺中") +
            "</p>",
        )
        .join("") +
      '<button data-action="下旨">下诏立储</button>';
  if (name === "史馆") {
    const chapters = [...s.volumes.flatMap((v) => v.chapters), ...s.history];
    html =
      '<div class="row"><button data-command="memorial-archive">御批档案</button>' +
      '<button data-command="export-md">导出起居注</button><button data-command="export-json">导出存档</button>' +
      (s.ambitions
        .filter((a) => a.kind === "宏愿")
        .every((a) => a.status === "达成") &&
      s.ambitions.some((a) => a.kind === "宏愿") &&
      !s.ending
        ? '<button data-command="complete">宏愿圆满 · 自愿封卷</button>'
        : "") +
      '</div><h3 class="section-spacer">宏愿与心事</h3>' +
      ambitionsHTML(s) +
      '<h3 class="section-spacer">本朝史册</h3>' +
      s.chronicles
        .map(
          (r) =>
            '<div class="card"><h3>' +
            esc(r.templeName) +
            " · " +
            esc(r.posthumous) +
            "</h3><p>" +
            esc(r.ending) +
            " · 政绩 " +
            r.score +
            "</p><p>" +
            esc(r.biography) +
            "</p><p>史臣曰：" +
            esc(r.commentary) +
            "</p><p>" +
            esc(r.succession) +
            "</p></div>",
        )
        .join("") +
      '<h3 class="section-spacer">成就 · ' +
      s.achievements.length +
      ' / 30</h3><div class="row">' +
      s.achievements
        .map((a) => '<span class="tag">' + esc(a.title) + "</span>")
        .join("") +
      '</div><h3 class="section-spacer">起居注全本 · ' +
      chapters.length +
      " 旬</h3>" +
      chapters
        .slice(-6)
        .reverse()
        .map(
          (h) =>
            "<details><summary>第 " +
            h.turn +
            " 旬 · " +
            esc(chapterTitle(h.summary)) +
            "</summary>" +
            '<article class="paper section-spacer">' + chapterHTML(h) + "</article>" +
            "</details>",
        )
        .join("") +
      (chapters.length > 6
        ? "<details><summary>展开更早 " +
          (chapters.length - 6) +
          " 旬</summary>" +
          chapters
            .slice(0, -6)
            .reverse()
            .map(
              (h) =>
                "<details><summary>第 " +
                h.turn +
                " 旬 · " +
                esc(chapterTitle(h.summary)) +
                "</summary>" +
                '<article class="paper section-spacer">' + chapterHTML(h) + "</article>" +
                "</details>",
            )
            .join("") +
          "</details>"
        : "");
  }
  openDialog(
    name + "殿",
    html || '<p class="muted">本旬尚无记录。</p>',
    "palace",
  );
}
export function fold(cards) {
  return (
    '<div class="grid">' +
    cards.slice(0, 6).join("") +
    "</div>" +
    (cards.length > 6
      ? "<details><summary>展开其余 " +
        (cards.length - 6) +
        ' 项</summary><div class="grid">' +
        cards.slice(6).join("") +
        "</div></details>"
      : "")
  );
}
