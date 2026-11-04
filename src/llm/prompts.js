import { postTitle, scenarioById } from "../core/scenarios.js";
// 文风：规则 + 范文。范文只示范笔法，人物与事件不得照搬；它们位于系统提示，
// 选定笔法后保持稳定，同时延长可缓存前缀。
export const STYLES = {
  court: { label: "庙堂", rules: "端正克制，重礼仪、言外之意与施政得失。", sample: "辰正，百官依班而立。户部尚书出班奏事，言辞恭谨，句句留有余地。御座上没有立刻答话，殿中便静得能听见笏板相触。良久，一句“着该部详议”落下，几位老臣交换了眼色，都明白这事今日不会有定论。" },
  modern: { label: "现代文", rules: "正文、人物对话、面谈、奏折、诏书和国书统一使用现代汉语白话，句意清楚，对话自然；奏折说清事情、理由与请求。保留古代称谓、官职与礼仪，不引入现代科技、现实机构或网络流行语。", sample: "早朝结束，皇帝留下户部尚书，问起地方送来的奏折。尚书说：「陛下，情况还不够清楚，臣想先核对账目，再请您定夺。」皇帝合上折子：「先查清楚，别让百姓一直等着。」尚书应了一声，收好折子退出殿外。" },
  cold: { label: "冷峻", rules: "短句、冷笔，少评语，写出权力代价。", sample: "折子递上来。准了。三个字，一州的税便少征了些。户部的人退下时没有抬头。他知道，少征的这笔税，明年要从别处找补。窗外起风，檐角铁马响了一声，又停了。" },
  palace: { label: "宫闱", rules: "细写人物言行与情感，亲密场景止于帘落。", sample: "她把茶盏往前推了半寸，手指在盏沿停了停，才收回袖中。“陛下近日睡得晚。”话说得轻，眼却一直落在案上那叠折子上。宫灯一晃，帘外有人放轻了脚步。" },
  history: { label: "野史", rules: "以逸闻写人情世态，轻巧而不使用现代词。", sample: "坊间传说，那日御膳房多备了一碟酱瓜，皇帝竟就着它多用了半碗粥。管膳的太监得了赏，逢人便讲，讲到后来，酱瓜成了贡品，酱园的掌柜也挂上了御笔的匾。" },
  classic: { label: "简古", rules: "文言浅白，叙述简练，不用生僻典故。", sample: "是日朝罢，上独坐便殿，召户部侍郎问岁入。侍郎具对，言北地旱，秋粮恐减。上默然良久，曰：“民食为天，卿其慎之。”侍郎顿首而出。" },
  warm: { label: "温润", rules: "从日常细节见人物，情绪含蓄，不用甜宠套话。", sample: "雨下了一整天。午后得闲，他把积了几日的家书拆开，是皇子写的，字歪歪扭扭，说园子里的杏子熟了。他看了两遍，叫人把信收进匣子里，又吩咐留几颗杏子别摘。" },
  chapter: { label: "章回", rules: "说书人口吻，开头可用“话说”“却说”，段末留一句悬念，不写回目。", sample: "话说这一日早朝方散，兵部值房里却来了个风尘仆仆的驿卒，怀里揣着一封插了三根雉羽的急报。值房官接过一看，脸色登时变了。要知这急报里写的是什么，且看午后分晓。" },
  annals: { label: "正史", rules: "编年记事体，冷静客观，先书时日后书事，不加渲染；段末可有一句“史臣曰”式的短评。", sample: "是旬，上御门听政，户部奏北地旱，诏议蠲免。午，召兵部尚书问边事，尚书对以边备粗安，惟粮道艰远。夜，还宫。史臣曰：岁旱而议蠲，忧边而问粮，可谓知本矣。" },
  intrigue: { label: "权谋", rules: "重算计与暗线，对话多机锋、话里有话，每段至少埋一处伏笔。", sample: "首辅笑着替同僚圆了场，转身时却把那份名单收进了袖里。“此事不急，”他说，“等吏部的考语下来再议。”在座的人都听懂了——考语，是他门生写的。" },
  harem: { label: "宫斗", rules: "细写位分、眼色、赏赐与站队，杀机藏于礼数，不写血腥与身体细节。", sample: "赏下来的是一对玉镯，成色比昭仪宫里那对还好半分。她笑着谢恩，转手便叫人把镯子供在了佛前。“这样的恩典，”她对贴身宫女说，“戴在手上，是要招人眼的。”" },
  strange: { label: "志怪", rules: "以天象、传说和异兆营造幽异气氛，异兆不决定事情成败。", sample: "是夜钦天监奏，荧惑入南斗，光芒赤如炭。同时京郊有农人报称，井水忽甜三日。两事并呈御前，殿中无人敢先开口，烛火却无风自动了一下。" },
  gazette: { label: "邸报", rules: "公文体，条陈式短段，多用“奉旨”“着即”“该部知道”等官腔。", sample: "一、户部题：北地被旱，请酌减本年钱粮。奉旨：着即会议具奏。一、兵部题：边镇缺饷，请拨银接济。奉旨：该部知道。一、礼部题：恭请秋祭事宜。奉旨：依议。" },
  farce: { label: "戏说", rules: "诙谐轻快，允许温和的喜剧化与夸张，人物仍守礼数，不用网络流行语与现代词。", sample: "户部尚书算盘打得噼啪响，算到一半忽然停了，抬头望天，又低头看账，最后把算盘轻轻放下：“陛下，臣算了三遍，国库里的银子，好像自己长了腿。”" },
  frontier: { label: "边塞", rules: "苍凉开阔，写风物、兵民与远方消息，适合边事、亲征与出巡。", sample: "关外的风从早吹到晚，旗子一直没垂下来过。守卒说，今年的雁回得早，怕是冬天要来得急。驿道上一骑远远奔来，扬起的尘土在夕阳里拖得很长。" },
};
// 篇幅：每段字数，同时决定正文的输出上限与费用。
export const LENGTHS = {
  brief: { label: "精简", words: "80–150", note: "每段 80–150 字，最省费用" },
  standard: { label: "标准", words: "120–300", note: "每段 120–300 字" },
  rich: { label: "详尽", words: "250–500", note: "每段 250–500 字，费用约为标准的 1.6 倍" },
};
// 视角：叙述人称。
export const POVS = {
  third: { label: "第三人称", rules: "以第三人称叙述，称皇帝为“皇帝”或“上”。" },
  second: { label: "第二人称", rules: "以第二人称叙述，地文称皇帝为“你”；人物对白仍称“陛下”。" },
  historian: { label: "史官", rules: "以起居注史官的口吻旁观记录，克制，可偶有史官自己的观感。" },
};
// 结算聚合：同一项合并，丢弃微小变动，取整并译成中文，供叙事参考。
// 起居注仍展示完整账目；校验仍以完整结算为据。
const NATION_LABELS = { treasury: ["国库", "万两", 0.1], privy: ["内帑", "万两", 0.1], grain: ["粮储", "万石", 0.1], grainArrears: ["粮欠", "万石", 0.1], treasuryArrears: ["国库积欠", "万两", 0.1], privyArrears: ["内帑积欠", "万两", 0.1], morale: ["民心", "", 0.5], governance: ["吏治", "", 0.5] };
const EMPEROR_LABELS = { prestige: "皇威", virtue: "圣德", mood: "心情", health: "健康", energy: "精力" };
const PERSON_LABELS = { favor: "好感", mood: "心情", health: "健康" };
const FACTION_LABELS = { power: "势力", attitude: "态度" };
const PROVINCE_LABELS = { morale: "民心", disaster: "灾情", pop: "人口" };
function digestLabel(state, path) {
  const p = path.split(".");
  const find = (list, id) => (list || []).find((x) => x.id === id);
  if (p[0] === "nation" && NATION_LABELS[p[1]] && p.length === 2) return NATION_LABELS[p[1]];
  if (p[0] === "nation" && p[1] === "army" && p.at(-1) === "threat") return ["边患" + (Number(p[3]) + 1 || ""), "", 1];
  if (p[0] === "emperor" && EMPEROR_LABELS[p[1]] && p.length === 2) return [EMPEROR_LABELS[p[1]], "", 0.5];
  if (p[0] === "province" && PROVINCE_LABELS[p[2]]) {
    const z = find(state.nation.provinces, p[1]);
    return [(z?.name || "某州") + PROVINCE_LABELS[p[2]], p[2] === "pop" ? "万口" : "", 1];
  }
  if (p[0] === "faction" && FACTION_LABELS[p[2]]) return [(find(state.court.factions, p[1])?.name || "某派") + FACTION_LABELS[p[2]], "", 1];
  if (p[0] === "official" && PERSON_LABELS[p[2]]) {
    const o = find(state.court.officials, p[1]);
    return o ? [o.name + PERSON_LABELS[p[2]], "", 1] : null;
  }
  if (p[0] === "consort" && PERSON_LABELS[p[2]]) {
    const c = find(state.harem.consorts, p[1]);
    return c ? [c.name + PERSON_LABELS[p[2]], "", 1] : null;
  }
  return null;
}
const round1 = (n) => Math.round(n * 10) / 10;
export function settlementDigest(state, entries = []) {
  const groups = new Map();
  for (const e of entries) {
    const label = digestLabel(state, e.path);
    if (!label || !Number.isFinite(e.delta)) continue;
    const g = groups.get(label[0]) || { label: label[0], unit: label[1], min: label[2], delta: 0, sources: new Map() };
    g.delta += e.delta;
    if (e.source) g.sources.set(e.source, (g.sources.get(e.source) || 0) + Math.abs(e.delta));
    groups.set(label[0], g);
  }
  let minorProvinces = 0;
  const out = [];
  for (const g of groups.values()) {
    if (Math.abs(g.delta) < g.min) { if (/民心$/.test(g.label) && g.label !== "民心") minorProvinces++; continue; }
    const value = g.min < 1 ? round1(g.delta) : Math.round(g.delta);
    const why = [...g.sources].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join("；");
    out.push(g.label + (value > 0 ? " +" : " ") + value + g.unit + (why ? "（" + why + "）" : ""));
  }
  if (minorProvinces) out.push("另有" + minorProvinces + "州民心微动");
  return out;
}
export function worldRules(state) {
  const style = STYLES[state.settings.prose] || STYLES.court,
    pov = POVS[state.settings.pov] || POVS.third;
  const sc = scenarioById(state.scenario);
  const modern = style === STYLES.modern;
  const frame = sc
    ? `你是「${state.dynasty}」朝的叙事引擎。本局以${sc.year}${sc.title.split(" · ")[0]}即位之初的史实开局，官职、地名用该朝称谓（见王朝设定）。史实只用于人物性格、关系与背景；本局自开局起已偏离史实，生死、成败、任免一律以引擎结算为准，不得按史书预言或补写结局，也不得写开局之后的史事。`
    : `你是架空王朝「${state.dynasty}」的叙事引擎，制度近似明清。`;
  return `${frame}只输出一个 JSON 对象。\n铁律：引擎记账，模型叙事。所有钱粮、人物、派系、健康、受孕、生育、死亡、升迁、战争胜负、执行度由结算表决定，你不得追加或改写硬结果，不得另给数字。名册姓名一字不改，大臣称陛下、自称臣，妃嫔自称臣妾。人物各有利益。文风「${style.label}」：${style.rules}${pov.rules}\n【文风范文（只学笔法，不照搬人物与事件）】${style.sample}\n白描，禁用嘴角勾起、眼中闪过一丝${modern ? "" : "、现代词"}；对话用「」。亲密场面点到为止，禁止描写性行为或身体细节。人物各有立场，不替玩家决定；自由度只影响口谕裁决，不改变叙事一致性要求。`;
}
export function roster(state) {
  return state.court.officials
    .filter((o) => o.alive)
    .map(
      (o) =>
        o.id +
        "｜" +
        o.name +
        "｜" +
        (postTitle(state, state.court.posts.find((p) => p.holder === o.id)) || "待任") +
        "｜" +
        (state.court.factions.find((f) => f.id === o.faction)?.name || "无党") +
        "｜好感" +
        o.favor,
    )
    .concat(
      state.harem.consorts.map(
        (c) => c.id + "｜" + c.name + "｜" + c.rank + "｜" + c.family,
      ),
      [state.emperor.name + "｜皇帝"],
      state.harem.children.filter(c=>c.health>0&&c.id!==state.reign?.emperorId&&c.name!==state.emperor.name).map((c) =>
        c.id + "｜" + c.name + "｜" + (c.id === state.harem.heir ? "储君" : c.sex === "男" ? "皇子" : "公主")),
      state.scenario && !state.dowager ? [] : [(state.dowager || "慈宁太后") + "｜太后"],
      (state.harem.royalWomen || []).map((w) => w.id + "｜" + w.name + "｜宗室女"),
      state.foreign.map((f) => f.id + "｜" + f.ruler + "｜" + f.name + "君主｜" + f.status),
    )
    .join("\n");
}
// ——— 缓存分层 ———
// 请求自前向后由稳定到易变排列，服务商按公共前缀缓存：
// L0 system：规则、文风、各类任务与输出格式（整局几乎不变，正文与面谈共用）
// L1 王朝设定集：人物与州郡静态资料（任免、生死、册封时才变）
// L2 只追加的历史：卷摘要与按窗口封存的长期事实
// L3 本旬动态：数值、变化、排程、结算、新奏报
export const FACT_WINDOW = 12;
const stable = (value) => JSON.stringify(value);
const r1 = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : n);
export function systemPrompt(state) {
  return worldRules(state) + "\n" + TASK_RULES.replace("{{LENGTH}}", (LENGTHS[state.settings.length] || LENGTHS.standard).words);
}
const TASK_RULES = `【叙事守则】死亡、怀孕、生产、小产、任免、战果、执行度只在结算表列出时才可写成本旬发生；其余只能作回忆或传闻，并用“曾”“昔”“当年”标明。不写结算表以外的金额、人数、年龄。人物反应仅限官员，须在本章出场，每人好感-5到5，合计绝对值不超过10。宏愿证据须逐字引用本章原句并含该目标全部关键词。长期事实只记本章写明、日后仍成立的事。
标题、正文、奏折、对白只写游戏中的人和事，禁用“据实落账”“引擎结算”“模型叙事”等开发说明，不向玩家解释生成或校验过程。
【正文任务】把本旬写成「朝」「午」「夜」三段，每段{{LENGTH}}字，空槽可略写。必须表现结算表的执行度与成败。正文只写故事，不抄结算条目；起居注会另行展示结算。廷议按名单立场写。为新奏报写60–120字正文。风闻只写无关痛痒的市井传言。
章末 hook 写一句 30 字内的下旬伏笔，只能取自未结奏报、在途政务或新近事实，用“恐”“将”“未知”等未定语气，不得断言结果。
正文输出：{"chapter":{"朝":"","午":"","夜":""},"summary":"30字内","hook":"","memorialTexts":[{"id":"","text":""}],"reactions":[{"name":"官员全名","favorDelta":0,"mood":"","note":""}],"rumors":[],"ambitionEvidence":[{"id":"","objectiveId":"","evidence":""}],"factUpdates":[{"subject":"","key":"","value":"","reason":""}]}
【面谈任务】扮演被召见者御前面谈。只写此人言行，成功才让步，失败不得让步，不得超过职权。未提供的秘密不得编造，未允时不得承诺拨款、调兵或落实请求。好感、让步与秘密是否揭露由引擎判定，照判定写即可。
面谈输出 {"reply":"","innerThought":"","mood":"","summary":""}`;
// L1：静态资料，按 id 排序，不含好感、势力等数值。
export function dynastyBible(state) {
  const post = (id) => postTitle(state, state.court.posts.find((p) => p.holder === id)) || "待任";
  const faction = (id) => state.court.factions.find((f) => f.id === id)?.name || "无党";
  const byId = (a, b) => String(a.id).localeCompare(String(b.id));
  return "【王朝设定】" + stable({
    王朝: state.dynasty, 皇帝: state.emperor.name, 年号: state.era?.name, 缘起: state.backstory || "",
    派系: state.court.factions.map((f) => ({ id: f.id, name: f.name, demand: f.demand })),
    官员: state.court.officials.filter((o) => o.alive).slice().sort(byId)
      .map((o) => [o.id, o.name, post(o.id), faction(o.faction), o.personality || ""].join("｜")),
    后宫: state.harem.consorts.slice().sort(byId).map((c) => [c.id, c.name, c.rank, c.family].join("｜")),
    皇嗣: state.harem.children.filter((c) => c.health > 0 && c.id !== state.reign?.emperorId && c.name !== state.emperor.name)
      .slice().sort(byId).map((c) => [c.id, c.name, c.id === state.harem.heir ? "储君" : c.sex === "男" ? "皇子" : "公主"].join("｜")),
    太后: state.scenario && !state.dowager ? "无" : state.dowager || "慈宁太后",
    宗室女: (state.harem.royalWomen || []).map((w) => w.id + "｜" + w.name),
    外邦: state.foreign.map((f) => [f.id, f.name, f.ruler].join("｜")),
    州郡: state.nation.provinces.map((z) => z.name),
  });
}
// L2：只追加的历史。长期事实按 FACT_WINDOW 旬一窗封存，当前窗内的新事实放到 L3。
export function factWindow(state) {
  const start = state.turn - (state.turn % FACT_WINDOW);
  const facts = state.facts || [];
  return {
    sealed: facts.filter((f) => !(Number.isFinite(f.turn) && f.turn >= start)).slice(-30),
    recent: facts.filter((f) => Number.isFinite(f.turn) && f.turn >= start),
  };
}
export function historyBlock(state) {
  return "【前尘】" + stable((state.volumes || []).slice(-3).map((v) => v.summary)) +
    "\n【长期事实】" + stable(factWindow(state).sealed.map(({ subject, key, value }) => ({ subject, key, value })));
}
// L2.5：分档的朝局格局。档位只在跨越门槛时变化，比逐旬浮动的数值稳定得多，
// 也更便于叙事。精确数值只保留国势五项。
const tier = (v, steps) => steps.find(([min]) => (v ?? 0) >= min)?.[1];
const FAVOR = [[80, "亲信"], [60, "亲近"], [40, "平常"], [20, "疏远"], [-Infinity, "怨怼"]];
const MORALE = [[70, "安"], [50, "平"], [30, "怨"], [-Infinity, "乱"]];
const DISASTER = [[50, "重灾"], [20, "有灾"], [-Infinity, ""]];
const POWER = [[60, "当权"], [35, "有力"], [-Infinity, "式微"]];
const ATTITUDE = [[60, "拥戴"], [40, "观望"], [-Infinity, "不满"]];
function grouped(items, label) {
  const out = {};
  for (const x of items) { const k = label(x); if (k) (out[k] ||= []).push(x.name); }
  return out;
}
export function situationBlock(state) {
  const byId = (a, b) => String(a.id).localeCompare(String(b.id));
  return "【朝局格局】" + stable({
    官员: grouped(state.court.officials.filter((o) => o.alive).slice().sort(byId), (o) => tier(o.favor, FAVOR)),
    后宫: grouped(state.harem.consorts.slice().sort(byId), (c) => tier(c.favor, FAVOR)),
    派系: state.court.factions.map((f) => f.name + "·" + tier(f.power, POWER) + "·" + tier(f.attitude ?? 50, ATTITUDE)),
    州郡民心: grouped(state.nation.provinces, (z) => tier(z.morale, MORALE)),
    灾情: grouped(state.nation.provinces, (z) => tier(z.disaster, DISASTER)),
    外邦: state.foreign.map((f) => f.name + "·" + f.status + "·" + tier(f.attitude ?? 50, ATTITUDE)),
  });
}
export function turnMessages(state, forecast) {
  const before = state;
  state = forecast.state;
  const nationSummary = (s) => Object.fromEntries(
    ["treasury", "privy", "grain", "morale", "governance"].map((k) => [k, r1(s.nation[k])]));
  const oldRoster = roster(before).split("\n"), newRoster = roster(state).split("\n");
  const dynamic = {
    国势: nationSummary(state),
    流水账: (state.history || before.history || []).slice(-6).map((h) => h.summary),
    新近事实: factWindow(state).recent.map(({ subject, key, value }) => ({ subject, key, value })),
    在途政务: state.projects.filter((p) => !p.done).map((p) => ({ name: p.name || p.type, province: p.province, end: p.end })),
    宏愿: state.ambitions.filter((a) => a.status !== "达成").map((a) => ({
      id: a.id, title: a.title, progress: a.progress,
      剧情目标: a.objectives.filter((o) => o.type === "story" && !o.done).map((o) => ({ objectiveId: o.id, keywords: o.keywords })),
    })),
    玩家口谕裁决: (state.intentResults||[]).map(({type,status,actual,summary})=>({type,status,actual,summary})),
    本旬前后变化: {
      国势: { 之前: nationSummary(before), 之后: nationSummary(state) },
      人物旧况: oldRoster.filter((line) => !newRoster.includes(line)),
      人物新况: newRoster.filter((line) => !oldRoster.includes(line)),
    },
  };
  return [
    { role: "system", content: systemPrompt(state) },
    {
      role: "user",
      content: dynastyBible(state) + "\n" + historyBlock(state) + "\n" + situationBlock(state) +
        `\n【本旬状态】${stable(dynamic)}\n【玩家排程】${stable(forecast.schedule)}\n【本旬结算表（不可更改）】${stable({ die: forecast.die, fate: forecast.fate, slots: forecast.slotResults, 账目: settlementDigest(state, forecast.entries), notes: forecast.notes, facts: forecast.facts || [] })}\n【廷议名单】${stable(forecast.debate || [])}\n【新奏报】${stable(forecast.newMemorials.map((m) => ({ id: m.id, title: m.title, type:m.type, from: m.from, request:m.request, choices:m.options.map(o=>o.label) })))}\n每本奏折写160–260字，交代事情来由、眼前难处、各方顾虑与具体请求；各折围绕所列事务展开，不套用“事关地方生计”等空话，不靠重复寒暄凑字。不能把请办的事写成已经办成，不得补造人名或硬结果。按【正文任务】写本旬，输出正文 JSON。`,
    },
  ];
}
export function worldMessages(state) {
  return [
    { role: "system", content: worldRules(state) },
    {
      role: "user",
      content:
        '铸造王朝，只给文案，不给任何数值。输出 {"dynasty":"王朝名","backstory":"为何登基及继位局面","factions":[{"name":"","demand":""}],"officials":[{"name":"","personality":"","life":"","secret":""}],"consorts":[{"name":"","family":"","secret":""}],"foreign":[{"name":"","ruler":"","demand":""}],"provinces":[{"name":"","description":""}],"dowager":"太后名"}。依次生成六派系、25位官员、3位成年妃嫔、5外邦、12州。引擎赋值，不得更动玩家名与年号。',
    },
  ];
}
// 面谈按真实多轮组织：同一人本旬的每一句在后续请求中原样重现，便于命中缓存。
// 好感、秘密等会变的信息只放在最后一条。
function talkTurnLine(t) {
  return "朕：" + t.line + "\n【引擎判定】" + stable({ kind: t.kind, die: t.die, success: t.success, denied: t.denied, cap: t.cap, effects: t.effects, ...(t.intentResults?.length?{口谕裁决:t.intentResults.map(({type,status,actual,summary})=>({type,status,actual,summary}))}:{}) });
}
export function talkMessages(state, result, log = []) {
  const npc =
    state.court.officials.find((o) => o.id === result.person) ||
    state.harem.consorts.find((o) => o.id === result.person) ||
    state.foreign.find((o) => o.id === result.person);
  const { secret, secretKnown, memory, life, favor, attitude, mood, health, ...card } = npc;
  const known = secretKnown || (result.kind === "试探" && result.success);
  const post = postTitle(state, state.court.posts.find((p) => p.holder === npc.id));
  const header = dynastyBible(state) + "\n【面谈对象】" + stable({ id: card.id, name: card.name, 职位: post || card.rank || card.status || "", personality: card.personality, family: card.family, faction: card.faction, ruler: card.ruler, demand: card.demand }) +
    "\n【此人能做到什么】妃嫔不能给钱兵；其他职权外请求必须回去议。\n";
  const prior = (Array.isArray(log) ? log : [])
    .filter((t) => t && t.person === result.person && t.turn === result.turn && t.id !== result.id && t.reply)
    .slice(-6);
  const messages = [{ role: "system", content: systemPrompt(state) }];
  prior.forEach((t, i) => {
    messages.push({ role: "user", content: (i === 0 ? header : "") + talkTurnLine(t) });
    messages.push({ role: "assistant", content: stable({ reply: t.reply }) });
  });
  messages.push({
    role: "user",
    content: (prior.length ? "" : header) + talkTurnLine(result) +
      "\n【此刻】" + stable({ favor: favor ?? attitude, mood, 拨款上限: result.cap + " 万两" }) +
      (known ? "\n【已获准参考的秘密】" + secret : "") +
      "\n按【面谈任务】作答，输出面谈 JSON。",
  });
  return messages;
}
export function classifyMessages(text,mode='oral') {
  if(mode==='remark')return [
    {role:'system',content:'你是御笔朱批分类员。只输出 JSON {"kind":"嘉奖"}，kind 仅限嘉奖、申饬、附旨、无。识别否定词；责成核查属于附旨，不是申饬；不必嘉奖属于无。混合措辞按主要意图归类，不决定对象，不创造数值，不执行附旨。'},
    {role:'user',content:String(text).slice(0,100)},
  ];
  return [
    {
      role: "system",
      content:
        '你是旨意分类员。只归类不写剧情，输出 JSON {"kind":"","edictType":null,"params":{},"risky":false,"attr":"","level":"","why":"十字内"}。kind 从上朝、批折、召见、宴请、下旨、任命、外交、后宫、出巡、私下行事、闲谈中选。edictType 从赈灾、减赋、加税、修河、整饬吏治、征兵、大赦、修园、编修大典、开海、转内帑、转国库、立储、禅位、禁令中选。不得创造数值效果。',
    },
    { role: "user", content: text.slice(0, 500) },
  ];
}
export function biographyMessages(state, record) {
  const accession = state.reign?.accessionTurn || 0;
  const years = new Map();
  for (const h of [...state.volumes.flatMap((v) => v.chapters), ...state.history]
    .filter((h) => Number.isFinite(h.turn) && h.turn >= accession && h.turn <= state.turn)
    .sort((a, b) => a.turn - b.turn)) {
    const year = 1 + Math.floor(Math.max(0, h.turn - 1) / 36);
    if (!years.has(year)) years.set(year, []);
    const text = [h.summary, ...(h.notes || [])].filter((x) => typeof x === "string" && x.trim()).join("；");
    if (text) years.get(year).push(text);
  }
  const annual = [...years].slice(-80).map(([year, summaries]) => ({
    year, summary: [...new Set(summaries)].join("；").slice(0, 320),
  }));
  // The sealed record already contains this reign's deltas, rather than the
  // dynasty-wide cumulative stats. Do not send existing full biographies.
  const { biography, commentary, ...sealed } = record;
  return [
    { role: "system", content: systemPrompt(state) },
    {
      role: "user",
      content: `按引擎所定谥号与庙号写500–800字本纪与一段史臣曰。不得编造实录外的事，不得另定谥号。年度提要最多列本朝最近80个年度，较早政绩仅以引擎统计为据。输出 {"biography":"","commentary":""}。\n【封卷】${JSON.stringify(sealed)}\n【年度提要】${JSON.stringify(annual)}\n【引擎统计】${JSON.stringify({ accessionTurn: accession, reignTurns: record.reignTurns, stats: record.stats, children: record.children, score: record.score, 国势终值: { treasury: state.nation.treasury, privy: state.nation.privy, grain: state.nation.grain, morale: state.nation.morale, governance: state.nation.governance } })}`,
    },
  ];
}
