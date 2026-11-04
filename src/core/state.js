import { normalizeMemorialAction } from "./memorial-decisions.js";
import { validateMemorialReviews } from "./memorial-records.js";
import { seedNumber, random, DRAFT } from "./rng.js";
import { uniqueName } from "./names.js";
import { chooseRegent } from "./regency-info.js";
import {factionPowers} from './politics.js';
export const VERSION = 14;
export const TALENTS = ["政略", "权谋", "武略", "文采", "魅力"];
export const SLOTS = ["朝", "午", "夜"];
export const POST_NAMES = [
  "内阁首辅",
  "户部尚书",
  "兵部尚书",
  "吏部尚书",
  "礼部尚书",
  "刑部尚书",
  "工部尚书",
  "左都御史",
  "司礼监掌印",
  "京营统领",
  "中书令",
  "门下侍中",
  "尚书令",
  "户部侍郎",
  "兵部侍郎",
  "吏部侍郎",
  "礼部侍郎",
  "刑部侍郎",
  "工部侍郎",
  "翰林学士",
  "太子太傅",
  "大理寺卿",
  "太常寺卿",
  "通政使",
  "宗人令",
  "北境总兵",
  "西境总兵",
  "南境总兵",
  "东境总兵",
  "直隶巡抚",
  "河南巡抚",
  "江南巡抚",
  "湖广巡抚",
  "山东巡抚",
  "山西巡抚",
  "陕西巡抚",
  "四川巡抚",
  "福建巡抚",
  "广东巡抚",
  "云南巡抚",
  "辽东巡抚",
];
let draftDepth = 0;
export function withDraft(operation) {
  draftDepth++;
  try {
    const result = operation();
    if (result?.state) delete result.state[DRAFT];
    if (result?.emperor) delete result[DRAFT];
    return result;
  } finally {
    draftDepth--;
  }
}
export function clone(state) {
  if (draftDepth && state?.[DRAFT]) return state;
  if (!state?.emperor || !Array.isArray(state.history))
    return structuredClone(state);
  // Sealed chapters are immutable. Share their contents while copying their containers.
  const {
    history,
    volumes,
    ledger,
    chronicles,
    pending,
    court,
    threads,
    projects,
    receipts,
    ...active
  } = state;
  const copied = {
    ...structuredClone(active),
    court: {
      ...court,
      factions: structuredClone(court.factions),
      posts: structuredClone(court.posts),
      officials: court.officials.map((o) => (o.alive ? structuredClone(o) : o)),
    },
    threads: threads.map((t) => (t.stage === "结束" ? t : structuredClone(t))),
    projects: projects.map((p) => (p.done ? p : structuredClone(p))),
    receipts: [...(receipts || [])],
    history: [...(history || [])],
    volumes: [...(volumes || [])],
    ledger: [...(ledger || [])],
    chronicles: [...(chronicles || [])],
    pending,
  };
  if (draftDepth) copied[DRAFT] = true;
  return copied;
}
export function createState(options = {}) {
  let rng = seedNumber(options.seed ?? "yuji"),
    n = (a, b) => {
      const r = random(rng);
      rng = r.rng;
      return a + Math.floor(r.value * (b - a + 1));
    };
  const factions = ["清流", "勋贵", "外戚", "宦官", "督抚", "宗室"].map(
    (name, i) => ({
      id: "f" + i,
      name,
      power: n(25, 55),
      powerModifier:0,
      attitude: n(42, 68),
      demand: [
        "纳谏清议",
        "军功封赏",
        "家族恩荫",
        "亲近信任",
        "钱粮自主",
        "宗藩安稳",
      ][i],
    }),
  );
  const surnames = [
    "沈",
    "陆",
    "顾",
    "谢",
    "裴",
    "程",
    "韩",
    "许",
    "杜",
    "魏",
    "方",
    "梁",
    "宋",
    "张",
    "崔",
    "温",
    "袁",
    "郑",
    "李",
    "王",
    "赵",
    "刘",
    "苏",
    "柳",
    "陈",
  ];
  const names = [
    "守正",
    "怀瑾",
    "文渊",
    "景行",
    "廷玉",
    "知远",
    "伯庸",
    "慎微",
    "长衡",
    "允中",
    "世宁",
    "明川",
    "思齐",
    "清和",
    "敬修",
    "望舒",
    "承安",
    "秉诚",
    "问渠",
    "砚秋",
    "信之",
    "元礼",
    "惟新",
    "济川",
    "云章",
  ];
  const officials = surnames.map((surname, i) => ({
    id: "o" + i,
    name: surname + names[i],
    gender: "男",
    age: n(32, 62),
    post: "p" + i,
    faction: "f" + (i % 6),
    abilities: {
      政: n(40, 85),
      军: n(35, 85),
      才: n(40, 85),
      德: n(40, 90),
      忠: n(35, 85),
      权谋: n(40, 85),
    },
    ambition: n(20, 75),
    greed: n(5, 55),
    favor: 50,
    health: 85,
    alive: true,
    inCapital: true,
    secret: "曾为故交隐瞒田产，尚无人知。",
    secretKnown: false,
    memory: [],
    life: [],
    banquetTurn:-1000000,
  }));
  const posts = POST_NAMES.map((title, i) => ({
    id: "p" + i,
    title,
    provinceId: i >= 29 ? "z" + (i - 29) : null,
    rank: i < 13 ? 1 : i < 29 ? 2 : 3,
    office: title.slice(0, 2),
    tags: [
      /户|工/.test(title)
        ? "管钱"
        : /兵|京|境/.test(title)
          ? "管兵"
          : /吏/.test(title)
            ? "管人"
            : /御史/.test(title)
              ? "言官"
              : "政务",
    ],
    holder: i < 25 ? "o" + i : null,
  }));
  const provinceNames = [
    "直隶",
    "河南",
    "江南",
    "湖广",
    "山东",
    "山西",
    "陕西",
    "四川",
    "福建",
    "广东",
    "云南",
    "辽东",
  ];
  const provinces = provinceNames.map((name, i) => ({
    id: "z" + i,
    name,
    pop: n(180, 480),
    tax: n(7, 13),
    morale: 62,
    disaster: 0,
    rebellion: false,
    rebellionQuarter: -1,
    garrison: n(8000, 18000),
    governor: null,
    taxRelief: null,
    taxSurge: null,
  }));
  const emperor = {
    name: String(options.name || "萧承熙").slice(0, 12),
    age: 24,
    lifespan: n(55, 80),
    health: 85,
    energy: 9,
    mood: 70,
    depressedMonths:0,
    prestige: 58,
    virtue: 60,
    talents: Object.fromEntries(TALENTS.map((t) => [t, n(42, 75)])),
    tags: [["勤政", "仁厚", "节俭", "多疑"][n(0, 3)]],
    status: [],
    growth: Object.fromEntries(TALENTS.map((t) => [t, 0])),
  };
  let state = {
    v: VERSION,
    runId:
      options.runId || "run-" + seedNumber(options.seed ?? "yuji").toString(36),
    rng,
    turn: 0,
    day: 0,
    dynasty: "大晟",
    // v10 历史剧本：剧本编号、官制显示名、地方长官称谓、皇嗣取名、亲政大婚人选。
    scenario: null,
    postNames: null,
    governorTitle: null,
    childNaming: null,
    weddingNames: null,
    imperialSurname: emperor.name[0],
    regency: null,
    edictCooldowns: {},
    era: {
      name: String(options.era || "永宁").slice(0, 8),
      year: 1,
      month: 1,
      xun: 0,
      startTurn: 0,
    },
    intentResults: [],
    settings: {
      freedom: options.freedom || "mid",
      difficulty: options.difficulty || "normal",
      prose: options.prose || "court",
      length: options.length || "standard",
      pov: options.pov || "third",
      demo: options.demo !== false,
    },
    emperor,
    reign: {
      number: 1,
      accessionTurn: 0,
      emperorId: "founder",
      initialTreasury: 480,
      initialStats: {},
      married: true,
      eraName: String(options.era || "永宁").slice(0, 8),
      eraStartTurn: 0,
    },
    nation: {
      treasury: 480,
      arrears: 0,
      privyArrears:0,
      grainArrears:0,
      privy: 90,
      grain: 240,
      morale: 62,
      governance: 58,
      provinces,
      army: {
        capital: { troops: 45000, readiness: 65 },
        frontiers: ["北", "西", "南", "东"].map((dir) => ({
          dir,
          troops: 35000,
          readiness: 60,
          threat: n(15, 40),
        })),
      },
    },
    court: { factions, posts, officials,proxyTurn:-1000000 },
    harem: {
      consorts: ["陆令仪", "沈清蘅", "裴映雪"].map((name, i) => ({
        id: "c" + i,
        name,
        age: 23 + i,
        rank: ["皇后", "妃", "嫔"][i],
        family: ["书香陆氏", "清流沈氏", "勋门裴氏"][i],
        faction: "f" + i,
        favor: 65 - i * 10,
        mood: 70,
        ambition: n(20, 65),
        scheming: n(20, 70),
        health: 85,
        preg: null,
        relations: {},
        secret: "家书中藏着旧事。",
        confined: false,
        cold: false,
        retired: false,
        reignId:
          options.runId ||
          "run-" + seedNumber(options.seed ?? "yuji").toString(36),
        recoveryUntil: 0,
      })),
      children: [],
      heir: null,
      candidates: [],
      selectionYear: 0,
      royalWomen: [{id:"royal-1",name:emperor.name[0]+"静宜",age:22,health:90,married:null}],
    },
    foreign: ["朔庭", "西陵", "南越", "东澜", "云岚"].map((name, i) => ({
      id: "w" + i,
      name,
      ruler: ["阿史那承", "拓跋珩", "黎明远", "崔景平", "木嘉措"][i],
      power: n(40, 90),
      attitude: n(25, 65),
      status: i === 0 ? "冷淡" : "通好",
      demand: "安定边贸",
      tribute: 5,
      authorization: 15,
      frontier: ["北", "西", "南", "东"][i % 4],
      trade:null,
    })),
    ambitions: [],
    memorials: [],
    memorialVariety: [],
    threads: [],
    projects: [],
    schedule: { 朝: null, 午: null, 夜: null },
    history: [],
    volumes: [],
    volumeIndex: [],
    ledger: [],
    facts: [],
    knowledge: [],
    rels: [],
    stats: {
      events: 0,
      births: 0,
      warsWon: 0,
      visits: 0,
      edicts: 0,
      banquets: 0,
      appointments: 0,
      petitions: 0,
      initialTreasury: 480,
      expense: 0,
      income: 0,
    },
    achievements: [],
    receipts: [],
    interimEntries: [],
    turnBudget: null,
    pending: null,
    lastTurn: null,
    ending: null,
    chronicles: [],
    talks: [],
    campaigns: [],
    retaliations: [],
    revision: 0,
  };
  for (const group of [state.court.officials, state.harem.consorts, state.harem.royalWomen])
    for (const item of group) if (item.name === state.emperor.name) {
      const r=uniqueName(state,{excludeId:item.id});state=r.state;item.name=r.name;
    }
  state.court.factions=factionPowers(state);
  return state;
}
export function migrate(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !Number.isInteger(input.v) ||
    input.v < 1 ||
    input.v > VERSION
  )
    throw new Error("存档版本不受支持，已进入保护模式");
  const s = structuredClone(input);
  if(s.schedule)for(const slot of ["朝","午","夜"]){
    const action=s.schedule[slot];
    if(s.v<8&&action&&["上朝","批折"].includes(action.kind)&&action.memorials===undefined)action.memorials=(s.memorials||[]).slice(0,3).map(m=>m.id);
    s.schedule[slot]=normalizeMemorialAction(action);
  }
  for (const key of [
    "emperor",
    "nation",
    "court",
    "harem",
    "era",
    "settings",
    "stats",
  ])
    if (!s[key] || typeof s[key] !== "object")
      throw new Error("存档缺少 " + key);
  for (const key of [
    "history",
    "volumes",
    "ledger",
    "facts",
    "knowledge",
    "rels",
    "achievements",
    "receipts",
    "chronicles",
    "talks",
    "campaigns",
    "retaliations",
    "ambitions",
    "memorials",
    "threads",
    "projects",
  ])
    if (s[key] === undefined) s[key] = [];
  if(s.pending?.forecast?.state){
    const saved=s.pending.forecast.state;
    if(!Number.isInteger(saved.v)||saved.v<1||saved.v>VERSION)throw new Error('预演存档版本无效');
    assertState(saved);
  }
  // Saved forecasts are immutable receipts. Upgrade their resulting state only
  // on commit; never rerun an old schedule, roll, settlement or calendar.
  if (input.v >= 11 && !Array.isArray(s.intentResults)) throw new Error("口谕裁决记录损坏");
  s.intentResults ??= [];
  if(input.v>=12&&!Array.isArray(s.memorialVariety))throw new Error('奏折轮换记录损坏');
  s.memorialVariety ??= s.memorials.filter(m=>m.templateId).slice(-72).map(m=>({id:m.templateId,type:m.type,turn:s.turn}));
  // v13 adds optional consequence/army/foreign packages on newly generated
  // options. Keep received petitions and saved forecasts exactly as they were.
  // v14 stores optional memorialReviews on committed chapters. Missing old
  // records are displayed from surviving notes; old chapters stay immutable.
  s.settings.freedom ??= "mid";
  s.v = VERSION;
  s.volumeIndex ??= [];
  // v9：叙事篇幅与视角。
  s.settings.length ??= "standard";
  s.settings.pov ??= "third";
  // v10：历史剧本字段，自拟王朝均为空。
  for (const key of ["scenario", "postNames", "governorTitle", "childNaming", "weddingNames"]) s[key] ??= null;
  s.nation.arrears ??= 0;
  s.nation.privyArrears ??= 0;
  s.nation.grainArrears ??= 0;
  s.emperor.depressedMonths ??= 0;
  s.court.proxyTurn ??= -1000000;
  for(const f of s.foreign)f.trade ??= null;
  for(const f of s.court.factions)f.powerModifier ??= 0;
  for(const o of s.court.officials)o.banquetTurn ??= -1000000;
  for(const p of s.projects)if(p.edictType==='征兵')p.armyTarget ??= 'all-frontiers';
  for (const p of s.nation.provinces) {
    p.rebellion ??= false;
    p.rebellionQuarter ??= -1;
  }
  s.reign ??= {
    number: 1,
    accessionTurn: 0,
    emperorId: "founder",
    initialTreasury: s.stats.initialTreasury || 480,
  };
  s.reign.initialStats ??= {};
  for (const o of s.court.officials) {
    o.abilities.权谋 ??= Math.round((o.abilities.政 + o.ambition) / 2);
    o.inCapital ??= !/巡抚|总兵/.test(
      s.court.posts.find((p) => p.id === o.post)?.title || "@@",
    );
  }
  for (const c of s.harem.consorts) {
    c.reignId ??= s.runId;
    c.retired ??= false;
    c.recoveryUntil ??= 0;
    if (c.preg) c.preg.fatherId ??= s.runId;
  }
  for (const c of s.harem.children) c.fatherId ??= s.runId;
  s.interimEntries ??= [];
  s.turnBudget ??= null;
  s.revision ??= s.turn;
  s.schedule ??= { 朝: null, 午: null, 夜: null };
  s.pending ??= null;
  s.lastTurn ??= null;
  s.ending ??= null;
  s.emperor.growth ??= Object.fromEntries(TALENTS.map((t) => [t, 0]));
  s.harem.candidates ??= [];
  s.harem.selectionYear ??= 0;
  s.imperialSurname ??= s.chronicles.find(r=>r.dynastyId===s.runId&&r.emperor)?.emperor?.[0] || s.emperor.name?.[0] || "萧";
  s.era.startTurn ??= Math.max(0, Math.floor((s.turn-(Math.max(1,s.era.year)-1)*36)/36)*36);
  s.reign.eraName ??= s.era.name;
  s.reign.eraStartTurn ??= s.era.startTurn;
  s.reign.married ??= s.emperor.age >= 16 && s.harem.consorts.some(c=>!c.retired);
  const child=s.harem.children.find(c=>c.id===s.reign.emperorId);
  s.regency ??= s.emperor.age < 16 ? {regentId:chooseRegent(s).id,until:Number.isFinite(child?.born)?child.born+16*36:s.turn+Math.ceil((16-s.emperor.age)*36)} : null;
  if(s.emperor.age<16)s.reign.married=false;
  if (s.regency && !s.reign.married) for (const c of s.harem.consorts) c.retired=true;
  for (const p of s.nation.provinces) {p.taxRelief ??= null;p.taxSurge ??= null;}
  for (const [i,p] of s.court.posts.entries()) p.provinceId ??= i>=29 ? s.nation.provinces[i-29]?.id || null : null;
  for (const [i,p] of s.nation.provinces.entries()) {
    let post=s.court.posts.find(x=>x.provinceId===p.id);
    if(!post) {post={id:'p'+(29+i),title:p.name+'巡抚',rank:3,office:'地方',tags:['政务'],holder:null,provinceId:p.id};s.court.posts.push(post);}
    post.title=p.name+'巡抚';
    p.governor=post.holder || null;
  }
  for(const [i,f] of s.foreign.entries()) f.frontier ??= s.nation.army.frontiers[i%s.nation.army.frontiers.length].dir;
  for(const m of s.memorials){
    m.provinceId ??= s.nation.provinces.find(p=>m.title?.includes(p.name))?.id || null;
    if(m.fromId===undefined){
      const candidates=s.court.officials.filter(o=>o.name===m.from&&o.alive&&o.health>0&&!o.jailed&&!o.retired&&s.court.posts.some(p=>p.id===o.post&&p.holder===o.id)&&(o.inCapital!==false||s.court.posts.some(p=>p.holder===o.id&&p.provinceId===m.provinceId)));
      m.fromId=candidates.length===1?candidates[0].id:null;
      if(!m.fromId)m.from='通政司';
    }
  }
  s.edictCooldowns ??= {};
  for(const p of s.projects.filter(p=>p.done)) {
    const key=p.edictType==='赈灾'?'赈灾:'+(p.province||'all'):p.edictType;
    s.edictCooldowns[key] ??= p.end+6;
  }
  for(const a of s.ambitions) if(s.receipts.includes('goal:'+a.id)&&!s.receipts.includes('goal:'+reignId(s)+':'+a.id)) s.receipts.push('goal:'+reignId(s)+':'+a.id);
  assertState(s);
  return s;
}
export function assertState(s) {
  if (
    !Number.isSafeInteger(s.turn) ||
    s.turn < 0 ||
    !Number.isSafeInteger(s.rng) ||
    typeof s.runId !== "string" ||
    !s.runId
  )
    throw new Error("存档回合资料无效");
  const range = (v, a, b) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < a || v > b)
      throw new Error("数值不在有效范围");
  };
  for (const field of ["health", "mood", "prestige", "virtue"])
    range(s.emperor[field], 0, 100);
  for (const t of TALENTS) range(s.emperor.talents?.[t], 0, 100);
  for (const f of ["morale", "governance"]) range(s.nation[f], 0, 100);
  for (const f of ["treasury", "privy", "grain"])
    range(s.nation[f], 0, 1000000);
  for (const a of [
    s.court.factions,
    s.court.posts,
    s.court.officials,
    s.harem.consorts,
    s.harem.children,
    s.nation.provinces,
    s.nation.army.frontiers,
    s.foreign,
  ])
    if (!Array.isArray(a)) throw new Error("名册结构无效");
  for (const x of s.court.factions)
    for (const f of ["power", "attitude"]) range(x[f], 0, 100);
  for (const x of s.nation.army.frontiers) {
    range(x.threat, 0, 100);
    range(x.troops, 0, 1000000);
    range(x.readiness, 0, 100);
  }
  for (const x of s.nation.provinces) {
    range(x.morale, 0, 100);
    range(x.disaster, 0, 100);
  }
  for (const x of s.harem.consorts) {
    range(x.health, 0, 100);
    range(x.favor, 0, 100);
  }
  if(s.v>=5){
    if(typeof s.imperialSurname!=='string'||!s.imperialSurname.trim())throw new Error('皇姓资料无效');
    if(!Number.isSafeInteger(s.era.startTurn)||s.era.startTurn<0)throw new Error('纪年起点无效');
    if(s.regency&&(!s.regency.regentId||!Number.isSafeInteger(s.regency.until)||s.regency.until<0))throw new Error('摄政资料无效');
    for(const f of s.foreign)if(!s.nation.army.frontiers.some(b=>b.dir===f.frontier))throw new Error('外邦边境资料无效');
    for(const p of s.nation.provinces)for(const k of ['taxRelief','taxSurge'])if(p[k]!==null&&(!p[k]||!Number.isFinite(p[k].factor)||p[k].factor<=0||!Number.isSafeInteger(p[k].untilQuarter)||p[k].untilQuarter<0))throw new Error('州税政策资料无效');
    for(const p of s.court.posts)if(p.provinceId&&!s.nation.provinces.some(z=>z.id===p.provinceId))throw new Error('地方官职资料无效');
  }
  if(s.v>=6){
    if(!Number.isSafeInteger(s.court.proxyTurn))throw new Error('权臣代批时序无效');
    for(const f of ['arrears','privyArrears','grainArrears'])range(s.nation[f],0,Number.MAX_SAFE_INTEGER);
    if(!Number.isSafeInteger(s.emperor.depressedMonths)||s.emperor.depressedMonths<0)throw new Error('郁结时长无效');
    for(const f of s.court.factions)range(f.powerModifier,-30,30);
    for(const o of s.court.officials)if(!Number.isSafeInteger(o.banquetTurn))throw new Error('宴请时序无效');
    for(const f of s.foreign)if(f.trade!==null&&(!f.trade||!Number.isSafeInteger(f.trade.start)||!Number.isSafeInteger(f.trade.until)||f.trade.start<0||f.trade.until!==f.trade.start+36||!Number.isFinite(f.trade.income)||f.trade.income<0||f.trade.income>6))throw new Error('互市条款无效');
    for(const p of s.projects)if(p.edictType==='征兵'&&!['capital','all-frontiers',...s.nation.army.frontiers.map(b=>b.dir)].includes(p.armyTarget))throw new Error('征兵目标无效');
  }
  if(s.v>=8){
    if(!Array.isArray(s.volumeIndex))throw new Error('分卷目录损坏');
    for(const ref of s.volumeIndex)if(!ref||typeof ref.key!=='string'||!Number.isSafeInteger(ref.from)||!Number.isSafeInteger(ref.to)||ref.from<0||ref.to<ref.from||typeof ref.checksum!=='string'||!/^[0-9a-f]{8}$/.test(ref.checksum))throw new Error('分卷目录损坏');
  }
  if(s.v>=11){
    if(!Array.isArray(s.intentResults))throw new Error('口谕裁决记录损坏');
    for(const r of s.intentResults)if(!r||typeof r.id!=='string'||!Number.isSafeInteger(r.turn)||!['success','partial','failed','narrative'].includes(r.status)||!r.actual||typeof r.actual!=='object')throw new Error('口谕裁决记录损坏');
  }
  if(s.v>=12&&(!Array.isArray(s.memorialVariety)||s.memorialVariety.length>72||s.memorialVariety.some(r=>!r||typeof r.id!=='string'||typeof r.type!=='string'||!Number.isSafeInteger(r.turn)||r.turn<0||r.turn>s.turn)))throw new Error('奏折轮换记录损坏');
  if(s.v>=12&&s.turnBudget?.rewriteAttempted!==undefined&&typeof s.turnBudget.rewriteAttempted!=='boolean')throw new Error('剧情改写标记损坏');
  if(s.v>=13&&s.memorials.some(m=>m.options?.some(o=>o.consequence!==undefined&&typeof o.consequence!=='string')))throw new Error('奏折后果说明损坏');
  if(s.v>=14)validateMemorialReviews([...(s.volumes||[]).flatMap(v=>v.chapters),...(s.history||[])]);
  const walk = (x) => {
    if (typeof x === "number" && !Number.isFinite(x))
      throw new Error("存档含 NaN/Infinity");
    if (x && typeof x === "object") for (const v of Object.values(x)) walk(v);
  };
  walk(s);
  return true;
}

export function reignId(s) {
  return (s.reign?.number || 1) === 1
    ? s.runId
    : s.runId + ":reign:" + s.reign.number;
}
