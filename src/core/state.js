import { seedNumber, random, DRAFT } from "./rng.js";
export const VERSION = 4;
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
  }));
  const posts = POST_NAMES.map((title, i) => ({
    id: "p" + i,
    title,
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
    governor: officials[(i + 13) % 25].id,
  }));
  const emperor = {
    name: String(options.name || "萧承熙").slice(0, 12),
    age: 24,
    lifespan: n(55, 80),
    health: 85,
    energy: 9,
    mood: 70,
    prestige: 58,
    virtue: 60,
    talents: Object.fromEntries(TALENTS.map((t) => [t, n(42, 75)])),
    tags: [["勤政", "仁厚", "节俭", "多疑"][n(0, 3)]],
    status: [],
    growth: Object.fromEntries(TALENTS.map((t) => [t, 0])),
  };
  const state = {
    v: VERSION,
    runId:
      options.runId || "run-" + seedNumber(options.seed ?? "yuji").toString(36),
    rng,
    turn: 0,
    day: 0,
    dynasty: "大晟",
    era: {
      name: String(options.era || "永宁").slice(0, 8),
      year: 1,
      month: 1,
      xun: 0,
    },
    settings: {
      freedom: options.freedom || "mid",
      difficulty: options.difficulty || "normal",
      prose: options.prose || "court",
      demo: options.demo !== false,
    },
    emperor,
    reign: {
      number: 1,
      accessionTurn: 0,
      emperorId: "founder",
      initialTreasury: 480,
      initialStats: {},
    },
    nation: {
      treasury: 480,
      arrears: 0,
      privy: 90,
      grain: 650,
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
    court: { factions, posts, officials },
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
    })),
    ambitions: [],
    memorials: [],
    threads: [],
    projects: [],
    schedule: { 朝: null, 午: null, 夜: null },
    history: [],
    volumes: [],
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
  if (s.pending?.forecast?.state) {
    s.pending = structuredClone(s.pending);
    s.pending.forecast.state = migrate(s.pending.forecast.state);
  }
  s.v = VERSION;
  s.nation.arrears ??= 0;
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
