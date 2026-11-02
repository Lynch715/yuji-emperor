// Pure JSON repair. Never evaluate model text as JavaScript.
export function parseJSONLoose(raw) {
  if (typeof raw !== "string" || raw.length > 1500000)
    throw new Error("模型 JSON 为空或过长");
  let text = raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = text.indexOf("{");
  if (start < 0) throw new Error("模型未返回 JSON 对象");
  text = text.slice(start);
  const attempts = [
    text,
    text.slice(0, text.lastIndexOf("}") + 1),
    repairJSON(text),
  ];
  for (const candidate of attempts) {
    try {
      const obj = JSON.parse(candidate, (key, value) => {
        if (["__proto__", "constructor", "prototype"].includes(key))
          throw new Error("无效字段");
        return value;
      });
      if (!obj || Array.isArray(obj) || typeof obj !== "object") continue;
      return obj;
    } catch {
      /* try safe repair */
    }
  }
  throw new Error("模型 JSON 无法修复，请重试");
}
export function repairJSON(text) {
  let out = "",
    quoted = false,
    escaped = false;
  const stack = [];
  const punctuation = {
    "，": ",",
    "：": ":",
    "｛": "{",
    "｝": "}",
    "［": "[",
    "］": "]",
  };
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (quoted) {
      if (escaped) {
        out += /["\\/bfnrtu]/.test(c) ? c : "\\" + c;
        escaped = false;
        continue;
      }
      if (c === "\\") {
        out += c;
        escaped = true;
        continue;
      }
      if (c === '"' || c === "”") {
        const rest = text.slice(i + 1).trimStart();
        if (!rest || /^[,，:：}\]｝］]/.test(rest)) {
          out += '"';
          quoted = false;
        } else out += '\\"';
      } else
        out +=
          c === "\n"
            ? "\\n"
            : c === "\r"
              ? ""
              : c === "\t"
                ? "\\t"
                : c < " "
                  ? ""
                  : c;
    } else {
      c = punctuation[c] || c;
      if (c === '"' || c === "“") {
        quoted = true;
        out += '"';
      } else if (c === "{" || c === "[") {
        stack.push(c);
        out += c;
      } else if (c === "}" || c === "]") {
        if (!stack.length) break;
        if (stack.at(-1) !== (c === "}" ? "{" : "["))
          throw new Error("JSON 括号不匹配");
        stack.pop();
        out = out.replace(/,\s*$/, "") + c;
        if (!stack.length) break;
      } else out += c;
    }
  }
  if (escaped) out = out.slice(0, -1);
  if (quoted) out += '"';
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ":null");
  while (stack.length) out += stack.pop() === "{" ? "}" : "]";
  return out;
}
export function cleanText(value, limit = 3000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u0008\u000b\u000c]/g, "").slice(0, limit)
    : "";
}
export function validateProbe(data) {
  if (data.ok !== true || typeof data.message !== "string")
    throw new Error("接口已响应，但 JSON 字段不符合要求");
  return { ok: true, message: cleanText(data.message, 500) };
}
export function mockNarrative(forecast) {
  const texts = {
    朝: "晓钟传至殿前，百官依班肃立。御案上的折子已按轻重排定，朱笔落下，内侍随即传旨。",
    午: "日影移过廊柱，值房仍有案牍往来。各衙门领旨回署，待办诸事仍须依期复奏。",
    夜: "宫灯初上，殿外脚步渐稀。今日得失收入起居注，留待来旬再议。",
  };
  return {
    chapter: Object.fromEntries(
      ["朝", "午", "夜"].map((slot) => [slot, texts[slot]]),
    ),
    summary: "本旬" + forecast.fate + "，诸事已据实落账",
    memorialTexts: forecast.newMemorials.map((m) => ({
      id: m.id,
      text:
        "臣谨奏：" +
        m.title +
        "。事关地方生计与朝廷成法，伏乞陛下裁处，臣等当依旨奉行。",
    })),
    reactions: [],
    rumors: [],
    ambitionEvidence: [],
    factUpdates: [],
    fixNotes: [],
  };
}
// Extract assertions and compare them with typed engine facts; ordinary vocabulary is never a reason to delete prose.
const NUMERAL = "[0-9０-９零〇一二两三四五六七八九十百千万亿点.,，]+";
export function chineseNumber(text) {
  text = text
    .replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 65296))
    .replace(/[,，]/g, "");
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const digits = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  for (const [unit, mult] of [
    ["亿", 100000000],
    ["万", 10000],
  ]) {
    if (text.includes(unit)) {
      const [left, right] = text.split(unit);
      return chineseNumber(left) * mult + (right ? chineseNumber(right) : 0);
    }
  }
  const [whole, decimal] = text.split("点");
  let result = 0,
    n = 0;
  for (const c of whole) {
    if (/\d/.test(c)) n = n * 10 + Number(c);
    else if (c in digits) n = digits[c];
    else if ({ 十: 10, 百: 100, 千: 1000 }[c]) {
      result += (n || 1) * { 十: 10, 百: 100, 千: 1000 }[c];
      n = 0;
    } else return NaN;
  }
  return (
    result +
    n +
    (decimal
      ? Number("0." + [...decimal].map((c) => digits[c] ?? c).join(""))
      : 0)
  );
}

function numericEvidence(f) {
  const sets = { money: new Set(), people: new Set(), age: new Set() },
    add = (kind, v) => {
      if (Number.isFinite(v)) sets[kind].add(Math.abs(v));
    };
  const walk = (v) => {
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (["history", "volumes", "pending", "ledger"].includes(k)) continue;
      if (["treasury", "privy", "arrears", "cost"].includes(k)) add("money", x * 10000);
      if (["troops", "garrison", "enemyTroops"].includes(k)) add("people", x);
      if (k === "pop") add("people", x * 10000);
      if (k === "age") add("age", x);
      if (typeof x === "object") walk(x);
    }
  };
  walk(f.state);
  for (const e of f.entries || []) {
    const kind = /treasury|privy|arrears/.test(e.path)
      ? "money"
      : /troops|garrison/.test(e.path)
        ? "people"
        : /\.age$/.test(e.path)
          ? "age"
          : null;
    if (kind)
      for (const v of [e.before, e.after, e.delta])
        add(kind, v * (kind === "money" ? 10000 : 1));
  }
  const text = JSON.stringify([f.slotResults, f.notes]);
  for (const match of text.matchAll(
    new RegExp("(" + NUMERAL + ")(万两|两|万人|人|名|岁)", "g"),
  )) {
    const kind = /两/.test(match[2])
      ? "money"
      : match[2] === "岁"
        ? "age"
        : "people";
    add(
      kind,
      chineseNumber(match[1]) * (match[2].startsWith("万") ? 10000 : 1),
    );
  }
  for (const c of f.state.harem.children)
    add("age", Math.floor((f.state.turn - c.born) / 36));
  add("people", f.debate?.length);
  add("people", f.state.court.officials.length);
  add("people", f.state.harem.children.length);
  return sets;
}
const ASSERTIONS = [
  ["miscarriage", /小产|流产/g],
  ["pregnancy", /怀孕|身孕|有孕|受孕|喜脉/g],
  ["birth", /诞下|诞生|产下|分娩|生下皇[子女]/g],
  ["death", /驾崩|薨逝|身亡|死去|病故|处死|斩首|伏诛|赐死|寿终|被杀/g],
  [
    "appointment",
    /任命|出任|升任|擢升|罢免|革职|贬谪|下狱|致仕|晋为|册立|封后/g,
  ],
  [
    "war",
    /大获全胜|大捷|战败|败北|兵败|攻克|收复|夺回|失守|陷落|入寇|宣战|开战/g,
  ],
];
const EXECUTION = /雷厉风行|照办|敷衍|阳奉阴违|封驳/g;
function hypothetical(prefix) {
  return /若|倘|假如|担心|恐怕|盼|但愿|希望|拟|奏请|请求|不曾|未曾|尚未|并未|没有|不敢|不可|切勿/.test(
    prefix.slice(-18),
  );
}
export function validateTurn(data, forecast) {
  if (
    !data?.chapter ||
    !["朝", "午", "夜"].every((k) => typeof data.chapter[k] === "string")
  )
    throw new Error("章节须包含朝、午、夜三段");
  const fallback = mockNarrative(forecast),
    fixNotes = [],
    chapter = {},
    s = forecast.state,
    numbers = numericEvidence(forecast);
  const facts = forecast.facts || [],
    settlement = [
      ...Object.values(forecast.slotResults || {}).flat(),
      ...(forecast.notes || []),
      ...(forecast.entries || []).map((e) => e.source),
    ];
  const roster = [
    s.emperor,
    ...s.court.officials,
    ...s.harem.consorts,
    ...s.harem.children,
    ...s.foreign,
  ];
  const aliases = s.court.posts
    .filter((p) => p.holder)
    .map((p) => ({
      alias: p.title,
      name: s.court.officials.find((o) => o.id === p.holder)?.name,
    }));
  const scrutinize = (raw, slot) => {
    let previousActors = [];
    return raw
      .split(/(?<=[。！？\n])/)
      .map((original) => {
        let sentence = original;
        const actors = roster
          .filter((o) => sentence.includes(o.name))
          .map((o) => o.name);
        for (const a of aliases)
          if (sentence.includes(a.alias) && a.name) actors.push(a.name);
        const subjects = actors.length ? actors : previousActors;
        if (actors.length) previousActors = actors;
        const invalidNumbers = [
          ...sentence.matchAll(
            new RegExp(
              "(" +
                NUMERAL +
                ")(万两|两银|两|万人|人|名|位|兵马|精兵|禁军|士卒|骑兵|岁)",
              "g",
            ),
          ),
        ].filter((m) => {
          // Generic "两位/一人/三名" describe a scene, not a population assertion.
          if (
            ["人", "名", "位"].includes(m[2]) &&
            !/兵|丁|人口|户口|丁口|军|士卒|征发/.test(sentence)
          ) return false;
          const kind = /两/.test(m[2])
              ? "money"
              : m[2] === "岁"
                ? "age"
                : "people",
            value = chineseNumber(m[1]) * (m[2].startsWith("万") ? 10000 : 1);
          return ![...numbers[kind]].some((n) => Math.abs(n - value) < 0.01);
        });
        for (const m of sentence.matchAll(
          new RegExp("(?:年方|年仅|年届)(" + NUMERAL + ")", "g"),
        ))
          if (!numbers.age.has(chineseNumber(m[1]))) invalidNumbers.push(m);
        if (invalidNumbers.length) {
          fixNotes.push(
            (slot || "附文") + "中无结算或状态依据的金额/人数/年龄已删除",
          );
          return "";
        }
        for (const [kind, pattern] of ASSERTIONS) {
          for (const claim of sentence.matchAll(
            new RegExp(pattern.source, "g"),
          )) {
            if (hypothetical(sentence.slice(0, claim.index))) continue;
            const compatible = (f) => {
              if (kind === "war") {
                const required = /败北|兵败|战败/.test(claim[0])
                  ? "失利"
                  : /全胜|大捷|攻克|收复|夺回/.test(claim[0])
                    ? "胜利"
                    : /宣战|开战/.test(claim[0])
                      ? "宣战"
                      : /入寇/.test(claim[0])
                        ? "入寇"
                        : "失守";
                return f.outcome === required;
              }
              if (kind === "appointment") {
                const required = /罢免|革职/.test(claim[0])
                  ? "罢免"
                  : /贬谪/.test(claim[0])
                    ? "贬谪"
                    : /下狱/.test(claim[0])
                      ? "下狱"
                      : /致仕/.test(claim[0])
                        ? "致仕"
                        : /册立/.test(claim[0])
                          ? "册立"
                          : /封后|晋为/.test(claim[0])
                            ? "晋位"
                            : "任命";
                return (
                  f.operation === required ||
                  (required === "任命" && f.operation === "入宫")
                );
              }
              return true;
            };
            const supported =
              facts.some(
                (f) =>
                  f.kind === kind &&
                  (!subjects.length ||
                    f.actors?.some((a) => subjects.includes(a))) &&
                  compatible(f),
              ) ||
              (!forecast.facts &&
                settlement.some(
                  (line) =>
                    new RegExp(pattern.source).test(line) &&
                    (!subjects.length ||
                      subjects.some((name) => line.includes(name))),
                ));
            if (!supported) {
              const subject = {
                death: "生死",
                pregnancy: "受孕",
                birth: "生产",
                miscarriage: "小产",
                appointment: "任免",
                war: "战果",
              }[kind];
              fixNotes.push(
                (slot || "附文") + "中没有对应结算的" + subject + "陈述已删除",
              );
              return "";
            }
          }
        }
        const executions = facts.filter((f) => f.kind === "execution"),
          topical = executions.filter(
            (f) => f.topic && sentence.includes(f.topic),
          ),
          localFacts = executions.filter((f) => f.slot === slot);
        const choices = topical.length
          ? topical
          : localFacts.length
            ? localFacts
            : executions;
        const expected = choices.length
          ? choices.map((f) => f.label)
          : !forecast.facts
            ? [
                ...(forecast.slotResults?.[slot] || [])
                  .join(" ")
                  .matchAll(EXECUTION),
              ].map((m) => m[0])
            : [];
        if (new Set(expected).size === 1)
          sentence = sentence.replace(EXECUTION, (word, offset) => {
            if (word === expected[0] || hypothetical(sentence.slice(0, offset)))
              return word;
            fixNotes.push(
              (slot || "附文") + "执行度由" + word + "改为" + expected[0],
            );
            return expected[0];
          });
        if (/性交|交媾|生殖器|阴茎|阴道|插入|抽插|乳房|裸体/.test(sentence)) {
          fixNotes.push("亲密场景已收束为含蓄叙述。");
          return "宫帘垂下，夜色渐深。";
        }
        return sentence;
      })
      .join("");
  };
  for (const slot of ["朝", "午", "夜"])
    chapter[slot] = scrutinize(cleanText(data.chapter[slot], 3500), slot);
  const whole = Object.values(chapter).join("\n"),
    reactions = [];
  for (const r of Array.isArray(data.reactions)
    ? data.reactions.slice(0, 10)
    : []) {
    const npc = s.court.officials.find((o) => o.name === r.name && o.alive);
    if (npc && Number.isFinite(Number(r.favorDelta)))
      reactions.push({
        id: npc.id,
        name: npc.name,
        favorDelta: Math.max(-5, Math.min(5, Number(r.favorDelta))),
        note: cleanText(r.note, 100),
      });
    else fixNotes.push("未知人物反应未采用。");
  }
  const evidence = (
    Array.isArray(data.ambitionEvidence) ? data.ambitionEvidence : []
  )
    .filter(
      (e) =>
        typeof e.evidence === "string" &&
        e.evidence.length >= 8 &&
        whole.includes(e.evidence),
    )
    .map((e) => ({
      id: cleanText(e.id, 80),
      objectiveId: cleanText(e.objectiveId, 80),
      evidence: cleanText(e.evidence, 500),
    }));
  return {
    chapter,
    summary: scrutinize(cleanText(data.summary, 100), null) || fallback.summary,
    reactions,
    memorialTexts: (Array.isArray(data.memorialTexts) ? data.memorialTexts : [])
      .filter((m) => forecast.newMemorials.some((n) => n.id === m.id))
      .map((m) => ({
        id: m.id,
        text: scrutinize(cleanText(m.text, 1000), null),
      })),
    rumors: (Array.isArray(data.rumors) ? data.rumors : [])
      .map((r) => scrutinize(cleanText(r, 150), null))
      .filter(Boolean)
      .slice(0, 3),
    ambitionEvidence: evidence,
    factUpdates: (Array.isArray(data.factUpdates) ? data.factUpdates : [])
      .filter(
        (f) =>
          typeof f.reason === "string" &&
          f.reason.length >= 8 &&
          whole.includes(f.reason) &&
          scrutinize(String(f.value), null) === String(f.value),
      )
      .slice(0, 5)
      .map((f) => ({
        subject: cleanText(f.subject, 80),
        key: cleanText(f.key, 80),
        value: cleanText(f.value, 200),
        reason: cleanText(f.reason, 300),
      })),
    fixNotes: [...new Set(fixNotes)],
  };
}
export function validateWorld(data) {
  for (const [key, min] of [
    ["factions", 5],
    ["officials", 25],
    ["consorts", 2],
    ["foreign", 4],
    ["provinces", 10],
  ])
    if (
      !Array.isArray(data[key]) ||
      data[key].length < min ||
      data[key].some((x) => !cleanText(x?.name, 20))
    )
      throw new Error("铸世人物或州郡资料不全");
  return data;
}
export function validateTalk(data, result) {
  const reply = cleanText(data.reply, 1200);
  if (!reply) throw new Error("面谈回复为空");
  if (result.denied || !result.success)
    return {
      reply: result.reply,
      innerThought: result.innerThought || "",
      effects: null,
    };
  const safe = /\d.*(?:两|兵)|怀孕|身亡|处死|封后|裸体|插入/.test(reply)
    ? result.reply
    : reply;
  return {
    reply: safe,
    innerThought: result.innerThought ? cleanText(data.innerThought, 500) : "",
    effects: null,
  };
}

export function extractPartialChapter(raw) {
  const sections = [];
  for (const key of ["朝", "午", "夜"]) {
    const match = new RegExp('"' + key + '"\\s*:\\s*"').exec(raw);
    if (!match) continue;
    let value = "";
    for (
      let i = match.index + match[0].length;
      i < raw.length && value.length < 3500;
      i++
    ) {
      const c = raw[i];
      if (c === '"') break;
      if (c === "\\") {
        const n = raw[++i];
        if (n === undefined) break;
        if (n === "u") {
          const hex = raw.slice(i + 1, i + 5);
          if (!/^[a-fA-F0-9]{4}$/.test(hex)) break;
          value += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else value += n === "n" ? "\n" : n === "t" ? "\t" : n;
      } else value += c;
    }
    if (/裸体|插入|抽插|性交/.test(value)) value = "宫帘垂下，夜色渐深。";
    sections.push(key + "\n" + value);
  }
  return sections.join("\n\n");
}
