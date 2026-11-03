import { NUMBER_SOURCE, parseNumber, quantityMatches, quantityEvidence, invalidQuantity } from "./quantities.js";
import { sceneNarrative } from "./mock-narrative.js";
// Pure JSON repair. Never evaluate model text as JavaScript.
export function parseJSONLoose(raw) {
  if (typeof raw !== "string" || raw.length > 1500000)
    throw new Error("模型 JSON 为空或过长");
  let text = raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^\s*\x60{3}(?:json)?/i, "")
    .replace(/\x60{3}\s*$/, "")
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
// 试读伏笔：只取下旬确实还在的急报或在途政务，不作任何断言。
export function mockHook(forecast) {
  const s = forecast.state, urgent = s?.memorials?.find((m) => m.urgent);
  if (urgent) return "下旬，「" + urgent.title + "」仍待御前裁处。";
  const project = s?.projects?.find((p) => !p.done && p.end > s.turn);
  return project ? "下旬，" + (project.name || project.type || "在途政务") + "尚未竣事。" : "";
}
export function mockNarrative(forecast) {
  const chapter=sceneNarrative(forecast);
  for(const r of forecast.state?.intentResults||[])if(chapter[r.slot]!==undefined)chapter[r.slot]+=' '+r.summary+'。';
  return {
    chapter,
    summary: "本旬" + forecast.fate,
    hook: mockHook(forecast),
    memorialTexts: forecast.newMemorials.map((m) => ({
      id: m.id,
      text:
        forecast.state?.settings?.prose === "modern"
        ? "陛下，" + m.title + "。这件事关系到地方百姓的生活和朝廷现行的规矩，请您决定如何处理。臣等会按照您的决定去办，并把后续情况及时报上来。"
        : "臣谨奏：" +
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
const NUMERAL = NUMBER_SOURCE;
export function chineseNumber(text) { return parseNumber(text); }
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
    /大获全胜|大捷|战败|败北|兵败|攻克|收复|夺回|失守|陷落|入寇|宣战|开战|议和|出兵/g,
  ],
];
const EXECUTION = /雷厉风行|照办|敷衍|阳奉阴违|封驳/g;
function hypothetical(prefix) {
  return /未能|未获|不能|拒绝|若|倘|假如|担心|恐怕|盼|但愿|希望|拟|奏请|请求|不曾|未曾|尚未|并未|没有|不敢|不可|切勿/.test(
    prefix.slice(-18),
  );
}
// 追忆与背景：明确指向过去或常态的句子不是本旬断言。
const RETROSPECT = /先帝|先皇|当年|那年|昔年|昔日|往昔|旧日|往年|早年|生前|已故|追忆|忆起|想起|曾经|自[^。！？]{0,12}以来/;
const HABITUAL = /屡屡|屡次|时常|常有|时有|频频|每每|素来|向来|历年|连年/;
export function retrospective(sentence, kind) {
  if (RETROSPECT.test(sentence)) return true;
  return kind === "war" && HABITUAL.test(sentence);
}
// “一两句”“三两步”中的“两”是约数，不是银两。
const LOOSE_MEASURE = /^[句声步眼行旁侧下回趟遍口天日个分笔字语言]/;
const MONEY_CONTEXT = /银|库|帑|款|饷|税|赏|拨|贿|俸|赋|钱粮|万两/;
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
    numbers = quantityEvidence(forecast);
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
  aliases.push(...['皇帝','陛下','新帝','天子'].map(alias=>({alias,name:s.emperor.name})),
    ...s.harem.consorts.map(c=>({alias:c.rank,name:c.name})));
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
        const invalidNumbers = quantityMatches(sentence).filter(q => invalidQuantity(q, sentence, numbers));
        if (!RETROSPECT.test(sentence))
          for (const m of sentence.matchAll(new RegExp("(?:年方|年仅|年届)(" + NUMERAL + ")", "g"))) {
            if (!invalidQuantity({index:m.index,raw:m[0],unit:'岁',kind:'age',value:chineseNumber(m[1])},sentence,numbers)) continue;
            invalidNumbers.push(m);
          }
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
            if (hypothetical(sentence.slice(0, claim.index)) || retrospective(sentence, kind)) continue;
            let claimSubjects=subjects;
            if (kind === "death") {
              const fragment=sentence.slice(Math.max(0,claim.index-6),claim.index+claim[0].length+8);
              if (/(?:死去|死了|已死|被杀)[的了]*(?:念头|心|梦|希望)|(?:念头|梦想?|心|希望)[^，。]{0,3}(?:死去|死了|已死)/.test(fragment)) continue;
              // Death requires an explicit person/title in this sentence, never an inherited subject.
              if (!actors.length) continue;
              const mentions=[...roster.map(o=>({alias:o.name,name:o.name})),...aliases].flatMap(a=>{
                const at=sentence.lastIndexOf(a.alias,claim.index);return at>=0?[{name:a.name,at}]:[];
              }).sort((a,b)=>b.at-a.at);
              const suffix=sentence.slice(claim.index+claim[0].length);
              const object=[...roster.map(o=>({alias:o.name,name:o.name})),...aliases].find(a=>suffix.startsWith(a.alias)||suffix.startsWith('了'+a.alias)||suffix.startsWith('的是'+a.alias));
              claimSubjects=object?[object.name]:mentions.length?mentions.filter(m=>m.at===mentions[0].at).map(m=>m.name):actors;
            }
            const compatible = (f) => {
              if (kind === "war") {
                const required = /议和/.test(claim[0]) ? '议和' : /出兵/.test(claim[0]) ? '出兵' : /败北|兵败|战败/.test(claim[0])
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
                  (!claimSubjects.length ||
                    f.actors?.some((a) => claimSubjects.includes(a))) &&
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
        const executions = facts.filter(f => f.kind === 'execution');
        const related = f => {
          const people=s.court.officials.filter(o => (forecast.slotResults?.[f.slot]||[]).join(' ').includes(o.name));
          const names=people.flatMap(o=>{const p=s.court.posts.find(p=>p.holder===o.id);return [o.name,p?.title,p?.office,p&&s.postNames?.[p.id]];});
          return [f.topic,f.official,f.office,...names].filter(Boolean).some(word=>sentence.includes(word));
        };
        const choices=executions.filter(related);
        const expected=choices.map(f=>f.label);
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
  const emptied = [];
  for (const slot of ["朝", "午", "夜"]) {
    const original = cleanText(data.chapter[slot], 3500);
    chapter[slot] = scrutinize(original, slot);
    if (original.trim() && !chapter[slot].trim()) emptied.push(slot);
  }
  // 只有部分段落被删空时才补足；整章都没有可保留文字时仍交由重试处理。
  if (emptied.length && Object.values(chapter).some((t) => t.trim()))
    for (const slot of emptied) {
      chapter[slot] = fallback.chapter[slot];
      fixNotes.push(slot + "段经核对后无可保留文字，以平实叙述补足");
    }
  const whole = Object.values(chapter).join("\n"),
    reactions = [];
  let reactionTotal = (s.intentResults||[]).filter(r=>r.type==='favor'&&['success','partial'].includes(r.status)).reduce((n,r)=>n+Math.abs(r.actual.amount||0),0);
  for (const r of Array.isArray(data.reactions)
    ? data.reactions.slice(0, 10)
    : []) {
    const npc = s.court.officials.find((o) => o.name === r.name && o.alive);
    if (!npc || !Number.isFinite(Number(r.favorDelta))) { fixNotes.push("未知人物反应未采用。"); continue; }
    if ((s.intentResults||[]).some(r=>r.type==='favor'&&r.actual.targetId===npc.id&&['success','partial'].includes(r.status))) continue;
    if (reactions.some((x) => x.id === npc.id) || !whole.includes(npc.name)) continue;
    let delta = Math.max(-5, Math.min(5, Math.round(Number(r.favorDelta))));
    delta = Math.sign(delta) * Math.min(Math.abs(delta), 10 - reactionTotal);
    if (!delta) continue;
    reactionTotal += Math.abs(delta);
    reactions.push({ id: npc.id, name: npc.name, favorDelta: delta, note: cleanText(r.note, 100) });
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
    hook: scrutinize(cleanText(data.hook, 60), null),
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
export function validateTalk(data, result, state) {
  const reply = cleanText(data.reply, 1200);
  if (!reply) throw new Error("面谈回复为空");
  if(result.success&&result.intentResults?.some(r=>r.type!=='other')){
    const f={state,die:result.die,newMemorials:[],slotResults:{朝:[],午:[],夜:[]},entries:result.intentEntries||[],notes:[],facts:result.intentFacts||[]};
    const checked=validateTurn({chapter:{朝:'',午:reply,夜:''}},f).chapter.午;
    return {reply:checked||result.intentResults.map(r=>r.summary).join('；'),innerThought:result.innerThought||'',effects:null};
  }
  if (result.denied || !result.success) {
    // Remove entire unsupported promise/number sentences so removing a word
    // cannot turn a refusal into an apparent agreement.
    const numeral='[0-9０-９零〇一二两三四五六七八九十百千万亿壹贰叁肆伍陆柒捌玖拾佰仟萬億]';
    const measurement = new RegExp(numeral+'(?:'+numeral+'|[点.,，])*\\s*(?:万两|两|兵|人|石|名|位|岁|万人|万石|匹|艘|亩|户|成)');
    const uncommitted = reply.split(/(?<=[。！？\n])/).filter((sentence) =>
      !measurement.test(sentence) &&
      ![...sentence.matchAll(/遵旨|领旨|奉旨|遵命|领命|奉命|谨遵|应允|允诺|承诺|答应|照办|照准|允准|即刻|立即|马上|拨付|拨款|拨银|给付|交付|调兵|发兵|已拨|已调|已办|办妥|奉行|依旨|尽力|定当|必当|定会|必会|这就|便去/g)].some(m => !/不|未|难|办不到|无法|岂能/.test(sentence.slice(Math.max(0,m.index-5),m.index+m[0].length+5))),
    ).join("");
    const checked = state ? validateTurn({ chapter: { 朝: "", 午: uncommitted, 夜: "" } }, {
      state, die: result.die, fate: "面谈", newMemorials: [],
      slotResults: { 朝: [], 午: [], 夜: [] }, entries: [], notes: [], facts: [],
    }).chapter.午 : uncommitted.split(/(?<=[。！？\n])/).filter((sentence) =>
      !ASSERTIONS.some(([, pattern]) => new RegExp(pattern.source).test(sentence))).join("");
    return {
      reply: checked.trim() || result.reply,
      innerThought: result.innerThought || "",
      effects: null,
    };
  }
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
