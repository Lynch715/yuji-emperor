export const STYLES = {
  court: { label: "庙堂", rules: "端正克制，重礼仪、言外之意与施政得失。" },
  cold: { label: "冷峻", rules: "短句、冷笔，少评语，写出权力代价。" },
  palace: { label: "宫闱", rules: "细写人物言行与情感，亲密场景止于帘落。" },
  history: { label: "野史", rules: "以逸闻写人情世态，轻巧而不使用现代词。" },
  classic: { label: "简古", rules: "文言浅白，叙述简练，不用生僻典故。" },
  warm: { label: "温润", rules: "从日常细节见人物，情绪含蓄，不用甜宠套话。" },
};
export function worldRules(state) {
  const style = STYLES[state.settings.prose] || STYLES.court;
  return `你是架空王朝「${state.dynasty}」的叙事引擎，制度近似明清。只输出一个 JSON 对象。\n铁律：引擎记账，模型叙事。所有钱粮、人物、派系、健康、受孕、生育、死亡、升迁、战争胜负、执行度由结算表决定，你不得追加或改写硬结果，不得另给数字。名册姓名一字不改，大臣称陛下、自称臣，妃嫔自称臣妾。人物各有利益。文风「${style.label}」：${style.rules} 白描，禁用嘴角勾起、眼中闪过一丝、现代词；对话用「」。亲密场面点到为止，禁止描写性行为或身体细节。${state.settings.freedom === "free" ? "随心所欲：宽容传奇，仍以引擎结果为准。" : state.settings.freedom === "real" ? "写实：成败有代价，人物不必讨好皇帝。" : "传奇：礼制内的戏剧性，不替玩家决定。"}`;
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
        (state.court.posts.find((p) => p.holder === o.id)?.title || "待任") +
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
      [(state.dowager || "慈宁太后") + "｜太后"],
      (state.harem.royalWomen || []).map((w) => w.id + "｜" + w.name + "｜宗室女"),
      state.foreign.map((f) => f.id + "｜" + f.ruler + "｜" + f.name + "君主｜" + f.status),
    )
    .join("\n");
}
export function turnMessages(state, forecast) {
  const before = state;
  state = forecast.state;
  const nationSummary = (s) => Object.fromEntries(
    ["treasury", "privy", "grain", "morale", "governance"].map((k) => [k, s.nation[k]]));
  const oldRoster = roster(before).split("\n"), newRoster = roster(state).split("\n");
  const context = {
    人物名册: roster(state),
    派系: state.court.factions,
    国势: {
      ...state.nation,
      provinces: state.nation.provinces.map((z) => ({
        name: z.name,
        morale: z.morale,
        disaster: z.disaster,
      })),
    },
    后宫: state.harem.consorts.map((c) => ({
      name: c.name,
      rank: c.rank,
      favor: c.favor,
    })),
    外邦: state.foreign,
    流水账: (state.history||before.history||[]).slice(-6).map((h) => h.summary),
    前尘: (state.volumes||before.volumes||[]).slice(-3).map((v) => v.summary),
    长期事实: state.facts.slice(-30),
    在途政务: state.projects.filter((p) => !p.done),
    宏愿: state.ambitions,
    本旬前后变化: {
      国势: { 之前: nationSummary(before), 之后: nationSummary(state) },
      人物旧况: oldRoster.filter((line) => !newRoster.includes(line)),
      人物新况: newRoster.filter((line) => !oldRoster.includes(line)),
    },
  };
  return [
    { role: "system", content: worldRules(state) },
    {
      role: "user",
      content: `把本旬写成「朝」「午」「夜」三段，每段120–300字，空槽可略写。必须表现结算表的执行度与成败。正文只写故事，不抄结算条目；起居注会另行展示结算。廷议按名单立场写。为新奏报写60–120字正文。风闻只写无关痛痒的市井传言。人物反应仅可建议好感-5到5。剧情条件证据必须逐字引用本章原句。\n输出：{"chapter":{"朝":"","午":"","夜":""},"summary":"30字内","memorialTexts":[{"id":"","text":""}],"reactions":[{"name":"名册全名","favorDelta":0,"mood":"","note":""}],"rumors":[],"ambitionEvidence":[],"factUpdates":[]}\n【状态】${JSON.stringify(context)}\n【玩家排程】${JSON.stringify(forecast.schedule)}\n【本旬结算表（不可更改）】${JSON.stringify({ die: forecast.die, fate: forecast.fate, slots: forecast.slotResults, entries: forecast.entries, notes: forecast.notes, facts: forecast.facts || [] })}\n【廷议名单】${JSON.stringify(forecast.debate || [])}\n【新奏报】${JSON.stringify(forecast.newMemorials.map((m) => ({ id: m.id, title: m.title, from: m.from })))}`,
    },
  ];
}
export function worldMessages(state) {
  return [
    { role: "system", content: worldRules(state) },
    {
      role: "user",
      content:
        '铸造王朝，只给文案，不给任何数值。输出 {"dynasty":"王朝名","era":"年号","backstory":"为何登基及继位局面","factions":[{"name":"","demand":""}],"officials":[{"name":"","personality":"","life":"","secret":""}],"consorts":[{"name":"","family":"","secret":""}],"foreign":[{"name":"","ruler":"","demand":""}],"provinces":[{"name":"","description":""}],"dowager":"太后名"}。依次生成六派系、25位官员、3位成年妃嫔、5外邦、12州。引擎赋值，不得更动玩家名与年号。',
    },
  ];
}
export function talkMessages(state, result, log) {
  const npc =
    state.court.officials.find((o) => o.id === result.person) ||
    state.harem.consorts.find((o) => o.id === result.person) ||
    state.foreign.find((o) => o.id === result.person);
  const { secret, secretKnown, memory, life, ...card } = npc;
  const known = secretKnown || (result.kind === "试探" && result.success);
  return [
    { role: "system", content: worldRules(state) },
    {
      role: "user",
      content: `扮演 ${npc.name} 御前面谈。只写此人言行，成功才让步，失败不得让步，effects 不得超过职权。未提供的秘密不得编造，未允时不得承诺拨款、调兵或落实请求。输出 {"reply":"","innerThought":"","mood":"","favor":0,"effects":null,"revealSecret":false,"endTalk":false,"summary":""}。\n【资料】${JSON.stringify(card)}${known ? "\n【已获准参考的秘密】" + secret : ""}\n【此人能做到什么】拨款上限 ${result.cap} 万两，其他职权外请求必须回去议，妃嫔不能给钱兵。\n【引擎判定】${JSON.stringify(result)}\n【对话】${JSON.stringify(log.slice(-6))}`,
    },
  ];
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
    { role: "system", content: worldRules(state) },
    {
      role: "user",
      content: `按引擎所定谥号与庙号写500–800字本纪与一段史臣曰。不得编造实录外的事，不得另定谥号。年度提要最多列本朝最近80个年度，较早政绩仅以引擎统计为据。输出 {"biography":"","commentary":""}。\n【封卷】${JSON.stringify(sealed)}\n【年度提要】${JSON.stringify(annual)}\n【引擎统计】${JSON.stringify({ accessionTurn: accession, reignTurns: record.reignTurns, stats: record.stats, children: record.children, score: record.score, 国势终值: { treasury: state.nation.treasury, privy: state.nation.privy, grain: state.nation.grain, morale: state.nation.morale, governance: state.nation.governance } })}`,
    },
  ];
}
