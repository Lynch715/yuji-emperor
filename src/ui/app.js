import { initArt, portraitHTML, sceneHTML, sceneKey, scenarioArtHTML, withChapterArt, withPortraitArt } from './art.js';
import { assignFaces } from '../core/faces.js';
import { openKeju } from './keju.js';
import {industryForm,developmentAction,updateDevelopmentPreview} from './technology.js';
import {configureResearch} from '../core/tech.js';
import {buildIndustry} from '../core/industries.js';
import {openNPCMemory} from './memories.js';
import {forecastScene,commitScene,latestScene,sceneInput,sceneOutcomeText,sceneBudget} from '../core/scenes.js';
import {sceneMessages,mockSceneNarrative} from '../llm/scenes.js';
import { talkPeople } from '../core/text.js';
import { FREEDOM_RULES, selectionYear } from "../core/freedom.js";
import { globalYear } from "../core/calendar.js";
import { requestScheduleIntents, requestPlayerIntents } from "./intent-request.js";
import { resolveTalkIntents } from "../core/intents.js";
import { postTitle, SCENARIOS, scenarioPreview } from "../core/scenarios.js";
import { createDebouncedSave } from "../store/debounce.js";
import { requestMemorialTexts } from "./memorial-request.js";
import { applyMemorialTexts } from "../core/memorial-texts.js";
import { modernTalkFallback } from "../llm/mock-narrative.js";
import { initAppIcon } from "./icon.js";
import {
  $,
  esc,
  gameText,
  initCommon,
  toast,
  captureView,
  restoreView,
  throttleFrame,
  openDialog,
  closeDialog,
  setLeaveGuard,
  download,
} from "./common.js";
import { loadSettings, openSettings } from "./settings.js";
import { requestTurnContent, requestTurnNarrative, validateTurnNarrative } from "./turn-request.js";
import { createGameSeed, createOpening, openingErrorMessage } from "./new-game.js";
import { createDialogRequestScope } from "./request-scope.js";
import {
  renderApp,
  actionButton,
  memorialListHTML,
  ambitionsHTML,
  actionsHTML, chapterHTML, chapterTitle, chapterNotes, ledgerLabel,
} from "./render.js";
import { memorialDialog, scheduledMemorialDialog } from "./memorials.js";
import { memorialAssignments } from "./memorial-state.js";
import { openMemorialArchive } from "./memorial-archive.js";
import { memorialEntryKind, actionAvailability, repeatSchedule, delegateSchedule, delegateStop } from "./view-model.js";
import { actionDialog } from "./actions.js";
import { palacePanel } from "./panels.js";
import { createSaveStore, createIDB } from "../store/save.js";
import { migrate, clone, reignId } from "../core/state.js";
import {
  forecastTurn,
  commitTurn,
  ACTIONS,
  validateSchedule,
} from "../core/turn.js";
import { assignTutor, generateCandidates } from "../core/harem.js";
import { requestCompletion, applyBiography } from "../core/chronicles.js";
import { GOALS, goalsForScenario } from "../core/ambitions.js";
import { goalConditionsHTML } from "./render.js";
import { talkAttempt } from "../core/court.js";
import { callJSON, createBudget } from "../llm/client.js";
import {
  talkMessages,
  classifyMessages,
  biographyMessages,
  STYLES,
  LENGTHS,
  POVS,
} from "../llm/prompts.js";
import {
  extractPartialChapter,
  mockNarrative,
  validateTalk,
} from "../llm/validate.js";
import { DIFFICULTIES, scenarioDifficulty, scenarioRecommendations } from "./opening-options.js";
import { openNationOverview } from "./nation-overview.js";
initCommon();
initArt();
setLeaveGuard(() => busy);
initAppIcon();
const store = createSaveStore({
  primary: createIDB(globalThis.indexedDB),
  backup: {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
  },
  validate: migrate,
});
let state = null,
  slot = 1,
  readOnly = false,
  busy = false,
  saveStatus = "",
  config = loadSettings(),
  metrics = loadMetrics(),
  scheduleCollapsed = loadScheduleCollapsed(),
  preferred = "朝",
  saveQueue = Promise.resolve(),
  lastSchedule = null;
const scheduleSave=createDebouncedSave(()=>persist());
window.addEventListener("pagehide",()=>scheduleSave.flush());
function render() {
  if(state)state = withPortraitArt(assignFaces(state));
  const y = window.scrollY, kept = captureView($("#app"));
  const canRepeat = !!state && Object.values(repeatSchedule(state, lastScheduleFor(state))).some(Boolean);
  $("#app").innerHTML = renderApp(state, { readOnly, busy, saveStatus, canRepeat, scheduleCollapsed });
  document.querySelectorAll("[data-action]").forEach((b) => {
    const reason=readOnly?'存档暂时无法保存':busy?'故事正在继续':actionAvailability(state,b.dataset.action);
    b.disabled=!!reason;b.draggable=!reason;
    if(reason&&b.querySelector('.action-copy small'))b.querySelector('.action-copy small').textContent=reason;
  });
  window.scrollTo(0, y);
  restoreView($("#app"), kept);
}
// Streaming chunks arrive faster than a phone can paint; redraw at most once
// per frame and only when the draft has grown.
let streamedLength = -1;
const streamDraft = throttleFrame((raw) => {
  if (raw.length === streamedLength) return;
  streamedLength = raw.length;
  const el = $("#stream");
  if (el) el.textContent = "故事正在继续……\n\n" + extractPartialChapter(raw);
});
function guard() {
  if (!state) throw new Error("请先登基开局");
  if (readOnly) throw new Error("存档处于只读保护模式");
  if (busy) throw new Error("本旬正在续写");
  if (state.pending) throw new Error(state.pending.kind==='scene'?"请先续完这段情节，或简写后再安排。":"请先续完本旬故事，或略过故事进入下旬。");
  if (state.ending) throw new Error("本局已经封卷");
}
async function persist() {
  scheduleSave.cancel();
  const snapshot = clone(state);
  const currentSlot = slot;
  const work = saveQueue
    .catch(() => {})
    .then(() => store.save(currentSlot, snapshot));
  saveQueue = work;
  try {
    const r = await work;
    saveStatus = r.warnings.length
      ? r.warnings.join("；") + "，请导出备份"
      : "已存入第 " +
        currentSlot +
        " 卷 · " +
        new Date().toLocaleTimeString("zh-CN");
    if (r.warnings.length) toast(saveStatus);
    try {
      if (currentSlot === slot)
        localStorage.setItem("yuji:active-slot", String(slot));
    } catch {}
    return true;
  } catch (e) {
    saveStatus = e.message;
    toast(e.message);
    return false;
  }
}
function loadMetrics() {
  try {
    const v = JSON.parse(localStorage.getItem("yuji:metrics") || "[]");
    return Array.isArray(v) ? v.slice(-100) : [];
  } catch {
    return [];
  }
}
function loadScheduleCollapsed() {
  try { return localStorage.getItem("yuji:schedule-collapsed") === "true"; }
  catch { return false; }
}
// Native disclosure changes only the layout, including during streaming or
// read-only protection. Keep this preference outside the game save.
document.addEventListener("toggle", (event) => {
  const fold = event.target;
  if (fold.id !== "schedule-fold" || !fold.isConnected) return;
  scheduleCollapsed = !fold.open;
  try { localStorage.setItem("yuji:schedule-collapsed", String(scheduleCollapsed)); } catch {}
}, true);
function markMetric(m) {
  metrics.push(m);
  if (metrics.length > 100) metrics.shift();
  try {
    localStorage.setItem("yuji:metrics", JSON.stringify(metrics));
  } catch {}
}
async function showSaves() {
  await scheduleSave.flush();
  const slots = [];
  for (let i = 1; i <= 3; i++) slots.push({ id: i, ...(await store.load(i)) });
  const archives = await store.listArchives();
  openDialog(
    "存档阁",
    '<p class="muted">三卷分别保存。导入旧档时，请选空卷。</p><div class="grid">' +
      slots
        .map(
          (v) =>
            '<div class="card"><h3>第 ' +
            v.id +
            " 卷" +
            (v.readOnly ? " · 保护" : "") +
            "</h3><p>" +
            esc(
              v.state
                ? v.state.emperor.name +
                    " · " +
                    v.state.era.name +
                    " " +
                    v.state.era.year +
                    "年 / " +
                    v.state.turn +
                    "旬"
                : "空卷",
            ) +
            "</p>" +
            v.problems
              .map((p) => '<p class="negative">' + esc(gameText(p)) + "</p>")
              .join("") +
            '<div class="row">' +
            (v.state
              ? '<button data-load="' +
                v.id +
                '">读此卷</button><button data-export-slot="' +
                v.id +
                '">导出存档</button>'
              : !v.readOnly
                ? '<button data-import-slot="' +
                  v.id +
                  '">导入存档</button>' +
                  (state
                    ? '<button data-copy-slot="' +
                      v.id +
                      '">将当前进度另存于此</button>'
                    : "")
                : "") +
            (v.raw.some(Boolean)
              ? '<button data-raw="' + v.id + '">导出原始副本</button>'
              : "") +
            "</div></div>",
        )
        .join("") +
      '</div><div class="dialog-actions">' +
      (state
        ? '<button data-command="export-json">导出当前存档</button>'
        : "") +
      '<button data-command="new">另启新朝（优先空卷）</button></div>' +
      (archives.length
        ? "<details><summary>封存旧卷 · " +
          archives.length +
          " 卷</summary>" +
          archives
            .map(
              (a) =>
                '<div class="card"><p>' +
                esc(a.name) +
                " · " +
                a.turn +
                " 旬 · 原第 " +
                a.slot +
                ' 卷</p><button data-archive-export="' +
                esc(a.id) +
                '">导出旧卷</button><button data-archive-remove="'+esc(a.id)+'">移出已备份封存</button></div>',
            )
            .join("") +
          "</details>"
        : ""),
  );
}
async function newGame() {
  await scheduleSave.flush();
  if (busy) return;
  const available = [],
    occupied = new Map(),
    reusable = [];
  for (let i = 1; i <= 3; i++) {
    const l = await store.load(i);
    if (!l.readOnly) {
      if (!l.state) available.push(i);
      else {
        occupied.set(i, l.state);
        reusable.push(i);
      }
    }
  }
  available.push(...reusable);
  if (!available.length) {
    toast("三卷暂时都无法保存，请先到存档阁导出备份。");
    return;
  }
  openDialog(
    "登基 · 定年号",
    '<form id="new-form"><div class="scenario-pick"><label for="scenario">开局</label><select id="scenario"><option value="">自拟王朝（架空）</option>' +
      SCENARIOS.map((sc) => '<option value="' + sc.id + '">' + esc(sc.title) + " · " + esc(DIFFICULTIES[scenarioDifficulty(sc)].label) + "</option>").join("") +
      '</select><div id="scenario-card" class="scenario-card muted">自拟帝名与年号，开创自己的王朝。</div></div><div class="fields"><div><label for="emperor-name">皇帝名</label><input id="emperor-name" required maxlength="12" value="萧承熙"></div><div><label for="era-name">年号</label><input id="era-name" required maxlength="8" value="永宁"></div><div><label for="freedom">口谕自由度</label><select id="freedom" aria-describedby="freedom-hint">' +
      ['mid','free','real'].map(id=>'<option value="'+id+'">'+FREEDOM_RULES[id].label+'</option>').join('')+
      '</select><p class="muted mode-hint" id="freedom-hint">'+FREEDOM_RULES.mid.note+'</p></div><div><label for="difficulty">施政难度</label><select id="difficulty" aria-describedby="difficulty-hint">'+
      ['normal','easy','hard'].map(id=>'<option value="'+id+'">'+DIFFICULTIES[id].label+'</option>').join('')+
      '</select><p class="muted mode-hint" id="difficulty-hint">'+DIFFICULTIES.normal.note+'</p></div><div><label for="prose-style">文笔</label><select id="prose-style">' +
      Object.entries(STYLES)
        .map(([k, v]) => '<option value="' + k + '">' + v.label + "</option>")
        .join("") +
      '</select></div>' + narrativeFields() + '<div><label for="new-slot">启用存档位</label><select id="new-slot">' +
      available
        .map(
          (n) =>
            '<option value="' +
            n +
            '">第 ' +
            n +
            " 卷" +
            (occupied.has(n) ? "（先封存旧卷）" : "（空卷）") +
            "</option>",
        )
        .join("") +
      '</select></div></div><label class="check"><input id="demo-mode" type="checkbox" ' +
      (!config.key ? "checked" : "") +
      '>先试读一局（无需密钥）</label><p class="muted">试读无需密钥。已有卷位会先封存旧卷。</p><p id="new-result" class="result hidden" role="status" aria-live="polite" tabindex="-1"></p><div class="dialog-actions"><button type="button" data-command="settings">故事设置</button><button type="submit" class="primary">承天践祚</button></div></form>',
  );
  const goalsHTML = ["宏愿", "宏愿", "心事", "心事"]
    .map(
      (kind, i) =>
        '<div><label for="goal-' +
        i +
        '">' +
        kind +
        " " +
        ((i % 2) + 1) +
        '</label><select data-goal-select id="goal-' +
        i +
        '"><option value="">随机分配</option>' +
        GOALS.filter((g) => g.kind === kind)
          .map((g) => '<option value="' + g.id + '">' + g.title + "</option>")
          .join("") +
        "</select></div>",
    )
    .join("");
  $("#demo-mode")
    .closest("label")
    .insertAdjacentHTML(
      "beforebegin",
      '<section id="goal-recommendations" hidden></section><div class="fields">' + goalsHTML + "</div>",
    );
  const form = $("#new-form"), dialog = $("#modal"), result = $("#new-result");
  const scope = createDialogRequestScope(dialog, form);
  const goalDrafts = new Map(); let previousScenario='',customSetup=null;
  const goalInputs = () => [...form.querySelectorAll('[data-goal-select]')];
  const updateModeHints = () => {
    $("#freedom-hint").textContent=FREEDOM_RULES[$("#freedom").value].note;
    $("#difficulty-hint").textContent=DIFFICULTIES[$("#difficulty").value].note;
  };
  $("#freedom").onchange=updateModeHints;$("#difficulty").onchange=updateModeHints;
  $("#scenario").onchange = () => {
    goalDrafts.set(previousScenario,goalInputs().map(el=>el.value));
    if(!previousScenario)customSetup={name:$("#emperor-name").value,era:$("#era-name").value,difficulty:$("#difficulty").value};
    const id=$("#scenario").value,sc=SCENARIOS.find(x=>x.id===id),card=$("#scenario-card"),recommended=scenarioRecommendations(id);
    previousScenario=id;
    for (const name of ["emperor-name", "era-name"]) $("#"+name).disabled=!!sc;
    goalInputs().forEach((el,i)=>{
      const kind=i<2?'宏愿':'心事';
      el.innerHTML='<option value="">随机分配</option>'+goalsForScenario(id).filter(g=>g.kind===kind).map(g=>
        '<option value="'+esc(g.id)+'">'+esc(g.title)+(g.scenarioId?'（专属）':'')+'</option>').join('');
      el.value=(goalDrafts.get(id)||recommended.map(g=>g.id))[i]||'';
    });
    const panel=$("#goal-recommendations"); panel.hidden=!sc;
    if(sc){
      const v=scenarioPreview(sc);$("#emperor-name").value=v.emperor;$("#era-name").value=v.era;$("#difficulty").value=scenarioDifficulty(sc);
      card.innerHTML=scenarioArtHTML(sc)+'<strong>'+esc(v.dynasty+' · '+v.year+' · '+v.emperor+' '+v.age+' 岁')+'</strong><p>'+esc(v.blurb)+
        '</p><small>朝中：'+esc(v.cast.join('、'))+'等</small>';
      panel.innerHTML='<h3>这位皇帝的宏愿与心事</h3><p class="muted">每项都有自己的达成条件，也可以换选其他目标。</p><div class="goal-recommend-grid">'+
        recommended.map(g=>'<div><strong>'+esc(g.kind+' · '+g.title)+'</strong><p>'+esc(g.reason)+'</p>'+goalConditionsHTML(g)+'</div>').join('')+
        '</div><button type="button" id="use-recommended">采用这组推荐</button>';
      $("#use-recommended").onclick=()=>goalInputs().forEach((el,i)=>el.value=recommended[i].id);
    }else{
      card.textContent='自拟帝名与年号，开创自己的王朝。';
      if(customSetup){$("#emperor-name").value=customSetup.name;$("#era-name").value=customSetup.era;$("#difficulty").value=customSetup.difficulty;}
      panel.innerHTML='';
    }
    updateModeHints();
  };
  const showResult = (text, error = false) => {
    result.classList.remove("hidden");
    result.setAttribute("role", error ? "alert" : "status");
    result.textContent = text;
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy || !form.isConnected || !dialog.open) return;
    let request, controls = [], saving = false;
    const submit = form.querySelector('button[type=submit]'), close = $("#close-modal");
    const preventSaveExit = (event) => { if (saving) event.preventDefault(); };
    dialog.addEventListener("cancel", preventSaveExit);
    try {
      const value = (id) => form.querySelector("#" + id).value;
      const options = {
        name: value("emperor-name").trim(), era: value("era-name").trim(), scenario: value("scenario") || null,
        freedom: value("freedom"), difficulty: value("difficulty"),
        prose: value("prose-style"), length: value("prose-length"), pov: value("prose-pov"),
        demo: form.querySelector("#demo-mode").checked,
        seed: createGameSeed(),
      };
      const selected = Number(value("new-slot"));
      const goals = [...form.querySelectorAll("[data-goal-select]")].map(el => el.value);
      request = scope.begin();
      busy = true;
      controls = [...form.elements].map(el => [el, el.disabled]);
      for (const [el] of controls) el.disabled = true;
      form.setAttribute("aria-busy", "true");
      submit.textContent = "正在开局…";
      const draft = await createOpening(options, goals, { ...config }, {
        signal: request.signal, onMetric: markMetric,
        onStage: (text) => { if (scope.current(request)) showResult(text); },
      });
      if (!scope.current(request)) return;
      saving = true;
      close.disabled = true;
      showResult("正在保存新卷……");
      const work = saveQueue.catch(() => {}).then(() => occupied.has(selected)
        ? store.archiveAndSave(selected, draft) : store.save(selected, draft));
      saveQueue = work;
      const saved = await work;
      state = draft;
      slot = selected;
      readOnly = false;
      saveStatus = saved.warnings.length ? saved.warnings.join("；") + "，请导出备份" : "已存入第 " + selected + " 卷";
      try { localStorage.setItem("yuji:active-slot", String(selected)); } catch {}
      closeDialog();
      if (saved.warnings.length) toast(saveStatus);
    } catch (err) {
      if (form.isConnected && dialog.open) {
        showResult(gameText(openingErrorMessage(err)), true);
        result.focus();
      }
    } finally {
      dialog.removeEventListener("cancel", preventSaveExit);
      if (form.isConnected) {
        for (const [el, disabled] of controls) el.disabled = disabled;
        form.removeAttribute("aria-busy");
        submit.textContent = "承天践祚";
        close.disabled = false;
      }
      scope.finish(request);
      busy = false;
      render();
    }
  };
}
// 篇幅与视角下拉，开局与中途设置共用。
function proseNote() {
  return state.settings.prose === "modern"
    ? "句子清楚，对话自然，奏折也用白话。"
    : STYLES[state.settings.prose]?.rules || "";
}
function narrativeFields(current = {}) {
  const select = (id, label, table, value) => '<div><label for="' + id + '">' + label + '</label><select id="' + id + '">' +
    Object.entries(table).map(([k, v]) => '<option value="' + k + '"' + (k === value ? " selected" : "") + ">" + esc(v.label) + "</option>").join("") +
    "</select></div>";
  return select("prose-length", "篇幅", LENGTHS, current.length || "standard") + select("prose-pov", "视角", POVS, current.pov || "third");
}
function lastScheduleFor(s) {
  return lastSchedule && s && lastSchedule.runId === s.runId && lastSchedule.turn === s.turn ? lastSchedule.schedule : null;
}
function arrange(which, action) {
  guard();
  const next = { ...state.schedule, [which]: action };
  validateSchedule(state, next);
  state = { ...state, schedule: next };
  scheduleSave.schedule();
  render();
  toast("已安排" + which + "间" + action.kind);
}
function chooseAction(kind) {
  guard();
  actionDialog(state, kind, preferred, (sl, a) => arrange(sl, a), startTalk);
}
async function advance(local = false) {
  if (!state || readOnly || busy || state.ending) return;
  if(state.pending?.kind==='scene')return openScene(state.pending.forecast.sceneId,local,local);
  busy = true;
  let ac = new AbortController();
  const deadline=Date.now()+90000;
  try {
    if (!state.pending) {
      const {schedule,intents}=await requestScheduleIntents(config,state,state.schedule,{local,signal:ac.signal,onMetric:markMetric,deadline});
      const forecast = forecastTurn({ ...state, turnBudget: null }, schedule, intents);
      state = {
        ...state,
        pending: { forecast },
        turnBudget: { used: 0 },
      };
      if (!(await persist()))
        throw new Error("本旬尚未存妥，请先导出存档，再重试。");
    }
    const f = state.pending.forecast;
    // v4 saves may contain an absolute planning-time deadline. Only the
    // attempt count belongs to a pending turn; the request owns its clock.
    state.turnBudget = { used: (state.turnBudget?.used||0)>=2?0:(state.turnBudget?.used||0), ...(state.turnBudget?.rewriteAttempted?{rewriteAttempted:true}:{}) };
    render();
    let narrative;
    if (state.settings.demo || local) {narrative = mockNarrative(f);if(f.scenes?.length)narrative=validateTurnNarrative(narrative,f);}
    else {
      narrative = await requestTurnContent(config, state, f, {
        deadline,
        budget: state.turnBudget,
        signal: ac.signal,
        onMetric: markMetric,
        onPartial: streamDraft,
      });
    }
    state = commitTurn(state, f, narrative);
    state = withChapterArt(state, f);
    lastSchedule = { runId: state.runId, turn: state.turn, schedule: f.schedule };
    if (state.ending && !state.settings.demo) {
      try {
        const record = state.chronicles.find((r) => r.id === reignId(state)),
          bio = await callJSON(config, biographyMessages(state, record), {
            budget: createBudget(),
            onMetric: markMetric,
            validate: (d) => {
              if (typeof d.biography !== "string" || d.biography.length < 500)
                throw new Error("本纪字数不足");
              return d;
            },
          });
        state = applyBiography(state, bio);
      } catch {
        toast("本朝已封卷，本纪可在史馆查阅。");
      }
    }
    state.turnBudget = null;
    await persist();
  } catch (e) {
    toast(e.message);
    if (state) await persist();
  } finally {
    busy = false;
    render();
  }
}
async function retryMemorialText(id){
  guard();
  const memorial=state.memorials.find(m=>m.id===id&&m.textStatus==='template');
  if(!memorial)return;
  const reviewRoot=$('#review-root');
  const base=state,activeSlot=slot;
  busy=true;
  try{
    const texts=await requestMemorialTexts(config,state,[memorial],{onMetric:markMetric});
    if(slot!==activeSlot||state.runId!==base.runId||state.revision!==base.revision)return;
    state=applyMemorialTexts(state,texts);await persist();
    if(reviewRoot?.isConnected)reviewRoot.dispatchEvent(new CustomEvent('memorial-text-updated',{detail:state}));
    toast(texts.some(t=>t.status==='ready')?'奏文已补齐。':'奏文暂未补齐，仍可阅览现有奏文。');
  }finally{busy=false;render();}
}
function openScene(id,local=false,auto=false){
  if(readOnly||busy)throw new Error('此时无法续写，请稍后再试');
  const r=latestScene(state,id);if(!r)throw new Error('这段情节已经过去，请另排新的情节');
  if(state.pending&&(state.pending.kind!=='scene'||state.pending.forecast.sceneId!==id))throw new Error('请先续完正在进行的故事');
  const h=state.history.at(-1),pending=state.pending?.forecast;
  openDialog('自拟情节 · 接着写','<div id="scene-owner"><p class="muted">'+esc([r.slot+'间',r.people.map(p=>p.name).join('、')||'独处',r.place].filter(Boolean).join(' · '))+'</p><div class="scene-recap">'+
    [h.chapter[r.slot],...r.steps.slice(-3).map(t=>t.prose)].map(p=>'<p>'+esc(p).replace(/\n+/g,'</p><p>')+'</p>').join('')+
    '</div><p class="muted">'+esc(sceneOutcomeText(pending?.outcome||r.steps.at(-1)?.outcome||r.outcome))+'</p><form id="scene-form"><label for="scene-follow">接下来想发生什么（选填）</label><textarea id="scene-follow" maxlength="8000" rows="4" '+(pending?'readonly':'')+' placeholder="留空会接着描写；也可以写下新的想法。">'+esc(pending?.request||'')+'</textarea><p class="muted">续写不另耗精力。写下新的心意，让这段故事继续。</p><div class="dialog-actions"><button type="submit" class="primary">'+(pending?'重试续写':'接着写')+'</button></div><p id="scene-status" role="status"></p></form></div>','action-shell');
  $('#modal').classList.add('scene-dialog');
  $('#modal .dialog-head').insertAdjacentHTML('beforebegin',sceneHTML(sceneKey({kind:'自拟情节',place:r.place},r.slot),'action',r.slot==='夜'));
  if($('#action-document'))$('#action-document').innerHTML='<h3>'+esc(r.place||'自拟情节')+'</h3><p>'+esc(r.people.map(p=>p.name).join('、')||'独处')+'</p><p>'+esc(r.text)+'</p>';
  const dialog=$('#modal'),owner=$('#scene-owner'),scope=createDialogRequestScope(dialog,owner),form=$('#scene-form');
  form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    const base=state,activeSlot=slot,request=scope.begin();busy=true;
    const button=form.querySelector('button'),input=form.querySelector('textarea'),status=form.querySelector('#scene-status');
    button.disabled=true;input.readOnly=true;status.textContent='故事正在继续……';
    let forecast;
    const current=()=>scope.current(request)&&slot===activeSlot&&state.runId===base.runId&&(!forecast||state.pending?.forecast.turnId===forecast.turnId);
    try{
      if(!state.pending){
        await scheduleSave.flush();
        const line=input.value.trim()||'接着写',intents=await requestPlayerIntents(config,state,[sceneInput(state,r,line)],{local,signal:request.signal,onMetric:markMetric});
        if(!current())return;
        forecast=forecastScene(state,id,line,intents);
        state={...state,pending:{kind:'scene',forecast},turnBudget:sceneBudget(state)};
        if(!(await persist()))throw new Error('这段情节尚未存妥，请先导出存档再重试');
      }else forecast=state.pending.forecast;
      if(!current())return;
      if((state.turnBudget?.used||0)>=2)state.turnBudget.used=0;
      const narrative=state.settings.demo||local?validateTurnNarrative(mockSceneNarrative(state,forecast),forecast):await requestTurnNarrative(config,state,forecast,{
        messages:sceneMessages(state,forecast),sceneSlot:forecast.slot,budget:state.turnBudget,
        signal:request.signal,onMetric:markMetric,
      });
      if(!current())return;
      state=commitScene(state,forecast,narrative);await persist();closeDialog();
    }catch(error){
      if(scope.current(request)){status.textContent=gameText(error.message)+'，已保存的结果会保留。';toast(gameText(error.message));}
      if(slot===activeSlot&&state.runId===base.runId&&state.pending?.kind==='scene')await persist();
    }finally{
      scope.finish(request);busy=false;
      if(owner.isConnected){button.disabled=false;input.readOnly=!!state.pending;button.textContent=state.pending?'重试续写':'接着写';}
      render();
    }
  };
  if(auto)form.requestSubmit();
}
function startTalk(person) {
  guard();
  if (state.schedule.午 && state.schedule.午.kind !== "召见")
    throw new Error("午间已有安排，请先撤下");
  const npc =
    state.court.officials.find((o) => o.id === person) ||
    state.harem.consorts.find((o) => o.id === person) ||
    state.foreign.find((o) => o.id === person);
  if (!npc) throw new Error("请选择人物");
  openDialog(
    "召见 · " + npc.name,
    '<p class="muted">午间可先后召见多人，每人耗精力1；同一人继续交谈不再加耗。所议之事须在此人职权之内。</p><div id="talk-log">' +
      state.talks
        .filter((t) => t.person === person && t.turn === state.turn)
        .map(
          (t) =>
            '<div class="talk-line emperor">朕：' +
            esc(t.line) +
            '</div><div class="talk-line">' +
            esc(t.reply) +
            "</div>",
        )
        .join("") +
      '</div><form id="talk-form"><label for="talk-line">御前垂询</label><textarea id="talk-line" required maxlength="8000" placeholder="卿以为此事当如何？"></textarea><div class="dialog-actions"><button type="submit" class="primary">垂询</button></div></form>',
    "action-shell",
  );
  const refreshTalkPaper=()=>{
    if(!$('#talk-form')||!$('#action-document'))return;
    const live=state.court.officials.find(o=>o.id===person)||state.harem.consorts.find(o=>o.id===person)||state.foreign.find(o=>o.id===person)||npc;
    $('#action-document').innerHTML=portraitHTML(state,live,'paper')+'<h3>'+esc(live.ruler||live.name)+'</h3><p>'+esc(postTitle(state,state.court.posts.find(p=>p.holder===person))||live.family||live.status||'御前候见')+'</p><p>'+esc(live.age?live.age+' 岁':'')+(live.favor!==undefined?' · 好感 '+live.favor:'')+'</p><p class="muted">可以继续垂询，也可稍后召见别人。聊天不限轮数，办事仍须核对钱粮和职权。</p>';
  };
  $('#modal .dialog-head')?.insertAdjacentHTML('beforebegin',sceneHTML('audience','action'));
  refreshTalkPaper();
  $("#talk-form").onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const line = $("#talk-line").value.trim();
    if (!line) return;
    const button = $("#talk-form button"),
      log = $("#talk-log");
    button.disabled = true;
    busy = true;
    try {
      const intents=await requestPlayerIntents(config,state,[{id:'talk-'+state.turn+'-'+state.talks.length,slot:'午',text:line}],{onMetric:markMetric});
      let attempt = talkAttempt(state, person, line, intents.some(a=>a.type!=='other'));
      if(intents.length)attempt=resolveTalkIntents(attempt.state,attempt.result,intents);
      state = attempt.state;
      const persons=[...new Set([...talkPeople(state.schedule.午),...state.talks.filter(t=>t.turn===state.turn).map(t=>t.person),person])];
      state.schedule.午 = { kind: '召见', person, persons, label: persons.length>1?npc.name+'等 '+persons.length+' 人':npc.name };
      const result = attempt.result;
      await persist();
      let response = {
        reply: result.intentResults?.some(r=>r.type!=='other') ? result.intentResults.map(r=>r.summary).join("；") : state.settings.prose === "modern" ? modernTalkFallback(result) : result.reply,
        innerThought: result.innerThought,
      };
      if (!state.settings.demo) {
        try {
          response = await callJSON(
            config,
            talkMessages(state, result, state.talks),
            {
              budget: createBudget(),
              onMetric: markMetric,
              validate: (d) => validateTalk(d, result, state),
            },
          );
        } catch (e) {
          toast(gameText(e.message) + "；面谈已结束。");
        }
      }
      result.reply = response.reply;
      result.innerThought = response.innerThought;
      log.insertAdjacentHTML(
        "beforeend",
        '<div class="talk-line emperor">朕：' +
          esc(line) +
          '</div><div class="talk-line">' +
          esc(response.reply) +
          (response.innerThought
            ? '<p class="muted">心声：' + esc(response.innerThought) + "</p>"
            : "") +
          "<small>" + (result.mode==='chat'?'御前交谈':result.reused?'沿用方才议定':(result.die===null?'所议之事 · ':'天命 '+result.die+' · ') +
          (result.denied
            ? "超出职权"
            : result.success
              ? "应允"
              : "未允")) +
          "</small></div>",
      );
      if ($("#talk-line")) $("#talk-line").value = "";
      await persist();
    } catch (error) {
      toast(error.message);
    } finally {
      busy = false;
      button.disabled = false;
      refreshTalkPaper();
      render();
    }
  };
}
async function oral(text) {
  guard();
  let kind =
      Object.keys(ACTIONS).find((k) => text.startsWith(k)) ||
      (/试探|离间|暗查|收买|闲谈/.test(text) ? "私下行事" : "下旨"),
    type = Object.keys({
      格物:1,
      兴业:1,
      赈灾: 1,
      减赋: 1,
      加税: 1,
      修河: 1,
      整饬吏治: 1,
      征兵: 1,
      大赦: 1,
      修园: 1,
      编修大典: 1,
      开海: 1,
      立储: 1,
      禅位: 1,
    }).find((t) => text.includes(t));
  if (/赈济|救灾/.test(text)) type = "赈灾";
  if(/研制|研究|研习|格物|发明|改良|研新/.test(text))type='格物';
  else if(/兴业|兴建|建造|开设|设立/.test(text))type='兴业';
  if (!type && !state.settings.demo) {
    busy = true;
    render();
    try {
      const r = await callJSON(config, classifyMessages(text), {
        budget: createBudget(),
        onMetric: markMetric,
      });
      kind = r.kind === "闲谈" ? "私下行事" : r.kind;
      type = r.edictType;
    } finally {
      busy = false;
      render();
      await persist();
    }
  }
  if (type) {
    const sl = ["朝", "午", "夜"].find((k) => !state.schedule[k]);
    if (!sl) throw new Error("日程已满，请先撤下一张行动卡");
    const z = state.nation.provinces.find((z) => text.includes(z.name));
    arrange(sl, {
      kind: "下旨",
      edictType: type,
      province: z?.id,
      label: type,
      text,
    });
    if ($('#oral-form')) closeDialog();
  } else if (ACTIONS[kind]) chooseAction(kind);
  else toast("请在「下旨」中选定此事。");
}
function exportMarkdown() {
  if (!state) return;
  const chapters = [
    ...state.volumes.flatMap((v) => v.chapters),
    ...state.history,
  ];
  download(
    "御极-" + state.emperor.name + "-起居注.md",
    "# " +
      state.dynasty +
      " · " +
      state.emperor.name +
      "起居注\n\n" +
      chapters
        .map(
          (h) =>
            "## 第 " +
            h.turn +
            " 旬 · " +
            chapterTitle(h.summary) +
            "\n\n" +
            ["朝", "午", "夜"]
              .map((sl) => "### " + sl + "\n\n" + (h.chapter[sl] || "略")+(h.scenes||[]).filter(r=>r.slot===sl).flatMap(r=>r.steps).map(t=>"\n\n接着写："+t.request+"\n\n"+t.prose).join(""))
              .join("\n\n") +
            ((h.briefings||[]).length?'\n\n### 例行奏报与有司细务\n\n'+h.briefings.map(b=>'- '+b.title+'：'+b.text).join('\n'):'') +
            "\n\n### 本旬变化\n\n" +
            h.entries
              .map((e) => "- " + gameText(e.source) + "：" + ledgerLabel(e.path) + " " + (e.delta > 0 ? "+" : "") + e.delta)
              .join("\n") +
            "\n\n" +
            chapterNotes(h).join("\n"),
        )
        .join("\n\n---\n\n") +
      "\n\n" +
      state.chronicles
        .map(
          (c) =>
            "## " +
            c.templeName +
            " · " +
            c.posthumous +
            "\n\n" +
            c.biography +
            "\n\n史臣曰：" +
            c.commentary,
        )
        .join("\n\n"),
    "text/markdown;charset=utf-8",
  );
}
function showKeju() {
  openKeju({getState:()=>state,config:()=>config,onMetric:markMetric,guard,
    readonly:()=>readOnly||busy||!!state.pending||!!state.ending||!!state.regency,
    setBusy:value=>{busy=value;},render,
    saveState:async next=>{
      const entries=next.ledger.slice(state.ledger.length);
      next.interimEntries=[...(state.interimEntries||[]),...entries];
      state=next;
      if(!(await persist()))throw new Error('未能存妥，请先导出备份');
    }});
}
async function command(name) {
  if (name === "memorial-archive") return openMemorialArchive(state);
  if (name === "settings") {
    const settings = openSettings(config, metrics, (c) => {
      config = c;
    }, markMetric);
    if (state) {
      $("#modal").insertAdjacentHTML(
        "beforeend",
        '<p class="muted" id="story-mode">' +
          (state.settings.demo ? '正在试读。填写连接设置，即可随心续写。' : '故事随你的选择继续。') +
          '</p><div class="dialog-actions"><button id="mode-toggle">' +
          (state.settings.demo ? "保存并用于正文" : "切换为试读") +
          "</button></div>",
      );
      $("#modal").insertAdjacentHTML(
        "beforeend",
        '<section class="narrative-settings" aria-label="故事文风"><h3>故事文风</h3><div class="fields"><div><label for="prose-style">文风</label><select id="prose-style">' +
          Object.entries(STYLES).map(([k, v]) => '<option value="' + k + '"' + (k === state.settings.prose ? " selected" : "") + ">" + esc(v.label) + "</option>").join("") +
          "</select></div>" + narrativeFields(state.settings) +
          '<div><label for="freedom-mode">口谕自由度</label><select id="freedom-mode">'+Object.entries(FREEDOM_RULES).map(([id,r])=>'<option value="'+id+'"'+(id===state.settings.freedom?' selected':'')+'>'+r.label+'</option>').join('')+'</select><p class="muted mode-hint" id="freedom-mode-hint">'+esc((FREEDOM_RULES[state.settings.freedom]||FREEDOM_RULES.mid).note)+'</p></div>' +
          '</div><p class="muted">施政难度：'+esc((DIFFICULTIES[state.settings.difficulty]||DIFFICULTIES.normal).label)+'（开局确定）</p><p class="muted" id="prose-note">' + esc(proseNote()) + ' 用于之后的新故事。</p></section>',
      );
      for (const id of ["prose-style", "prose-length", "prose-pov", "freedom-mode"])
        $("#" + id).onchange = () => {
          if (readOnly || busy || state.pending) {
            toast("请先过完本旬，再换"+(id==='freedom-mode'?"自由度":"文风"));
            $("#freedom-mode").value = state.settings.freedom;
            $("#prose-style").value = state.settings.prose;
            $("#prose-length").value = state.settings.length || "standard";
            $("#prose-pov").value = state.settings.pov || "third";
            return;
          }
          state = { ...state, settings: { ...state.settings, freedom: $("#freedom-mode").value, prose: $("#prose-style").value, length: $("#prose-length").value, pov: $("#prose-pov").value } };
          if(id==='freedom-mode'&&selectionYear(state)&&(state.harem.selectionYear!==globalYear(state.turn)||!state.harem.candidates.length))state=generateCandidates(state);
          $("#prose-note").textContent = proseNote() + " 用于之后的新故事。";
          scheduleSave.schedule();
          if(id==='freedom-mode'){render();$('#freedom-mode-hint').textContent=FREEDOM_RULES[state.settings.freedom].note;}
          toast(id==='freedom-mode' ? "自由度已改为" + FREEDOM_RULES[state.settings.freedom].label : "文风已改为" + STYLES[state.settings.prose].label + " · " + LENGTHS[state.settings.length].label + " · " + POVS[state.settings.pov].label);
        };
      $("#mode-toggle").onclick = () => {
        if (readOnly) {
          toast("存档处于只读保护模式");
          return;
        }
        if (busy || state.pending) {
          toast("请先完成当前回合");
          return;
        }
        if (state.settings.demo && !settings.save()) return;
        state.settings.demo = !state.settings.demo;
        persist();
        render();
        closeDialog();
      };
    }
    return;
  }
  if (name === "new") return newGame();
  if (name === "saves") return showSaves();
  if (name === "advance") return advance();
  if (name === "delegate") {
    guard();
    openDialog("委政内阁",
      '<p class="muted">让内阁代批普通奏报，自己歇息几旬。遇到急报、战事或宫中大事，会停下来请你决断。期间只简记日常，不花费 API 额度。</p><div class="dialog-actions">' +
        [3, 6, 12].map((n) => '<button type="button" data-delegate="' + n + '">' + n + " 旬</button>").join("") + "</div>", "drawer");
    $("#modal").onclick = async (e) => {
      const n = Number(e.target.closest("[data-delegate]")?.dataset.delegate);
      if (!n) return;
      closeDialog();
      let done = 0, stop = "";
      for (; done < n; done++) {
        const plan = delegateSchedule(state);
        if (!plan.schedule) { stop = plan.reason; break; }
        state = { ...state, schedule: plan.schedule };
        const before = state.turn;
        await advance(true);
        if (state.turn === before) { stop = "本旬尚未结束"; break; }
        stop = delegateStop(state);
        if (stop) { done++; break; }
      }
      toast("委政 " + done + " 旬" + (stop ? "，" + stop + "，请御前裁处" : "，已交还御前"));
    };
    return;
  }
  if (name === "repeat") {
    guard();
    const next = repeatSchedule(state, lastScheduleFor(state));
    if (!Object.values(next).some(Boolean)) { toast("上旬安排本旬无法沿用"); return; }
    validateSchedule(state, next);
    state = { ...state, schedule: next };
    scheduleSave.schedule();
    render();
    toast("已沿用上旬可重复的安排");
    return;
  }
  if (name === "settle") return advance(true);
  if (name === "complete") {
    guard();
    state = requestCompletion(state);
    await persist();
    render();
    palacePanel(state, "史馆");
    return;
  }
  if (name === "export-json" && state){await scheduleSave.flush();return download("御极-第" + slot + "卷.json", store.exportJSON(state));}
  if (name === "export-md") return exportMarkdown();
  if (name === "menu") return openDialog('御前菜单','<div class="grid"><button data-command="saves">存档</button><button data-command="settings">设置</button><button data-command="self">天子心事</button><button data-command="oral">拟口谕</button></div>','drawer');
  if (name === "stats") return openNationOverview(state);
  if (name === "journal") return openDialog('起居注',state?'<button data-panel="史馆">前往史馆全本</button>'+state.history.slice(-3).reverse().map(h=>'<section class="paper section-spacer">'+chapterHTML(h,state.ambitions)+'</section>').join(''):'<p>尚未登基。</p>','drawer');
  if (name === "oral") { guard(); return openDialog('拟口谕','<form id="oral-form"><label for="oral">口谕</label><textarea id="oral" maxlength="8000" required placeholder="如：赈济河南、整饬吏治"></textarea><div class="dialog-actions"><button class="primary" type="submit">降旨</button></div></form>','drawer'); }
  if (name === "actions") return openDialog('行动坞',actionsHTML(state)+'<button class="section-spacer" data-command="oral">拟口谕</button>','drawer');
  if (name === "memorials") {
    openDialog(
      "奏报匣",
      memorialListHTML(state),
      "drawer",
    );
    return;
  }
  if (name === "palaces") {
    openDialog(
      "殿阁",
      '<div class="grid">' +
        ["朝堂", "科举", "后宫", "天下", "格物", "内库", "宗室", "史馆"]
          .map((p) => '<button data-panel="' + p + '">' + p + "</button>")
          .join("") +
        "</div>",
      "drawer",
    );
    return;
  }
  if (name === "self") {
    openDialog(
      "天子心事",
      state
        ? portraitHTML(state,state.emperor,'card') + '<h3>' +
            esc(state.emperor.name) +
            " · " +
            state.emperor.age +
            " 岁</h3><p>心情 " +
            state.emperor.mood +
            " · " +
            esc(state.emperor.tags.join("、")) +
            '</p><div class="grid">' +
            Object.entries(state.emperor.talents)
              .map(([k, v]) => '<div class="card">' + k + " " + v + "</div>")
              .join("") +
            "</div>" +
            ambitionsHTML(state) +
            '<button data-command="settings">设置</button><button data-command="saves">存档</button>'
        : '<button data-command="new">登基开局</button>',
      "drawer",
    );
  }
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  try {
    if (b.dataset.command) await command(b.dataset.command);
    else if (b.dataset.action) chooseAction(b.dataset.action);
    else if (b.dataset.panel){if(b.dataset.panel==='科举'){showKeju();return;}palacePanel(state,b.dataset.panel);if(state&&b.dataset.panel==='格物')updateDevelopmentPreview($('#modal'),state);}
    else if(b.dataset.industryProvince){guard();openDialog('兴业营建',industryForm(state,b.dataset.industryProvince));updateDevelopmentPreview($('#modal'),state);}
    else if (b.dataset.slot) {
      guard();
      preferred = b.dataset.slot;
      if (['上朝','批折'].includes(state.schedule[preferred]?.kind)) {
        memorialDialog(state,state.schedule[preferred].kind,preferred,(which,a)=>arrange(which,a));return;
      }
      if(state.schedule[preferred]?.kind==='自拟情节'){chooseAction('自拟情节');return;}
      openDialog(
        preferred + " · 选择行动",
        '<div class="grid">' +
          Object.keys(ACTIONS)
            .filter((k) => ACTIONS[k].slots.includes(preferred))
            .map(k=>actionButton(k,state))
            .join("") +
          "</div>",
        "drawer",
      );
    } else if (b.dataset.clear) {
      guard();
      if (
        state.schedule[b.dataset.clear]?.kind === "召见" &&
        state.talks.some((t) => t.turn === state.turn)
      )
        throw new Error("午间已经面谈，请先过完本旬。");
      state.schedule[b.dataset.clear] = null;
      scheduleSave.schedule();
      render();
    } else if (b.dataset.retryMemorialText) {
      await retryMemorialText(b.dataset.retryMemorialText);
    } else if (b.dataset.memorial) {
      guard();
      if(memorialAssignments(state).has(b.dataset.memorial)) {
        scheduledMemorialDialog(state,b.dataset.memorial);return;
      }
      const sl=['朝','午'].find(k=>!state.schedule[k]);
      if(!sl)throw new Error('朝、午已有安排，请先撤下行动');
      memorialDialog(state,memorialEntryKind(state,sl),sl,(which,a)=>arrange(which,a),b.dataset.memorial);
    } else if (b.dataset.editReviewSlot) {
      guard();
      const sl=b.dataset.editReviewSlot,a=state.schedule[sl];
      if(!a||!['上朝','批折'].includes(a.kind))throw new Error('原拟批已撤下，请重新选择奏报。');
      memorialDialog(state,a.kind,sl,(which,next)=>arrange(which,next));
    } else if(b.dataset.personMemory)openNPCMemory(state,b.dataset.personMemory);
    else if(b.dataset.memoryScene){const h=[...state.volumes.flatMap(v=>v.chapters),...state.history].find(h=>h.scenes?.some(r=>r.id===b.dataset.memoryScene));if(h)openDialog('过往一幕','<article class="paper">'+chapterHTML(h,state.ambitions)+'</article>');else toast('这段经历的原文暂未载入，可以先看往事摘要。');}
    else if (b.dataset.scene) openScene(b.dataset.scene);
    else if (b.dataset.talk) startTalk(b.dataset.talk);
    else if (b.dataset.tutor) {
      guard();
      const child = b.dataset.tutor;
      openDialog(
        "择师教养",
        '<form id="tutor-form"><label for="tutor">皇嗣师傅</label><select id="tutor">' +
          state.court.officials
            .filter((o) => o.alive && !o.jailed && !o.retired)
            .map(
              (o) =>
                '<option value="' +
                o.id +
                '">' +
                esc(o.name) +
                " · 才 " +
                o.abilities.才 +
                "</option>",
            )
            .join("") +
          '</select><div class="dialog-actions"><button type="submit" class="primary">授予教职</button></div></form>',
      );
      $("#tutor-form").onsubmit = async (ev) => {
        ev.preventDefault();
        try {
          guard();
          state = assignTutor(state, child, $("#tutor").value);
          await persist();
          palacePanel(state, "宗室");
        } catch (err) {
          toast(err.message);
        }
      };
    } else if (b.dataset.load) {
      if (busy) throw new Error("请待本旬续写结束再读档");
      await scheduleSave.flush();
      await saveQueue.catch(() => {});
      const l = await store.load(Number(b.dataset.load));
      if (!l.state) throw new Error("此卷没有可读进度");
      state = l.state;
      slot = Number(b.dataset.load);
      try {
        localStorage.setItem("yuji:active-slot", String(slot));
      } catch {}
      readOnly = l.readOnly;
      saveStatus = l.problems.join("；");
      closeDialog();
      render();
    } else if (b.dataset.exportSlot) {
      const l = await store.load(Number(b.dataset.exportSlot));
      if (l.state)
        download(
          "御极-第" + b.dataset.exportSlot + "卷.json",
          store.exportJSON(l.state),
        );
    } else if (b.dataset.archiveRemove) {
      if(!confirm('请确认已导出此封存。移出后请保管好备份文件。'))return;
      await store.removeArchive(b.dataset.archiveRemove);await showSaves();
    } else if (b.dataset.archiveExport) {
      const a = (await store.listArchives()).find(
        (a) => a.id === b.dataset.archiveExport,
      );
      if (a) download("御极-封存旧卷-" + a.turn + "旬.json", a.data);
    } else if (b.dataset.raw) {
      const l = await store.load(Number(b.dataset.raw));
      download(
        "御极-原始副本-" + b.dataset.raw + ".json",
        JSON.stringify(l.raw, null, 2),
      );
    } else if (b.dataset.copySlot) {
      if (!state) throw new Error("尚无进度");
      const target = Number(b.dataset.copySlot),
        l = await store.load(target);
      if (l.state || l.readOnly) throw new Error("此卷已非空白");
      await store.save(target, state);
      slot = target;
      readOnly = false;
      toast("已另存于第 " + slot + " 卷");
      await showSaves();
    } else if (b.dataset.importSlot) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.onchange = async () => {
        try {
          const file = input.files[0];
          if (!file) return;
          if (file.size > 30000000) throw new Error("文件超过 30 MB");
          await store.importJSON(
            Number(b.dataset.importSlot),
            await file.text(),
          );
          toast("导入完成，可读此卷");
          await showSaves();
        } catch (err) {
          toast(err.message);
        }
      };
      input.click();
    }
  } catch (error) {
    toast(error.message);
  }
});
document.addEventListener("submit", (e) => {
  if(['research-plan','industry-plan'].includes(e.target.id)){
    e.preventDefault();
    try{
      guard();const a=developmentAction(e.target,e.target.id==='research-plan'?'格物':'兴业'),which=e.target.querySelector('[name="development-slot"]').value;
      if(!which||state.schedule[which])throw new Error('该时段已有安排，请先撤下原行动');
      if(a.edictType==='格物')configureResearch(state,a);else buildIndustry(state,a);
      arrange(which,a);closeDialog();
    }catch(error){toast(error.message);}
    return;
  }

  if (e.target.id === "oral-form") {
    e.preventDefault();
    oral($("#oral").value.trim()).catch((err) => toast(err.message));
  }
});
document.addEventListener("dragstart", (e) => {
  const b = e.target.closest("[data-action]");
  if (b) e.dataTransfer.setData("text/plain", b.dataset.action);
});
document.addEventListener("dragover", (e) => {
  if (e.target.closest("[data-slot]")) e.preventDefault();
});
document.addEventListener("drop", (e) => {
  const target = e.target.closest("[data-slot]");
  if (!target) return;
  e.preventDefault();
  try {
    preferred = target.dataset.slot;
    chooseAction(e.dataTransfer.getData("text/plain"));
  } catch (err) {
    toast(err.message);
  }
});
async function boot() {
  let remembered = 1;
  try {
    remembered = Number(localStorage.getItem("yuji:active-slot")) || 1;
  } catch {}
  slot = [1, 2, 3].includes(remembered) ? remembered : 1;
  const first = await store.load(slot);
  if (first.state) {
    state = first.state;
    readOnly = first.readOnly;
    saveStatus = first.problems.join("；");
  }
  render();
}
boot().catch((error) => {
  toast(error.message);
  render();
});

document.addEventListener('input',event=>{
 if(state&&event.target.closest('#research-plan,#industry-plan'))updateDevelopmentPreview(event.target.closest('form'),state);
});
document.addEventListener('change',event=>{
 if(state&&event.target.closest('#research-plan,#industry-plan'))updateDevelopmentPreview(event.target.closest('form'),state);
});
