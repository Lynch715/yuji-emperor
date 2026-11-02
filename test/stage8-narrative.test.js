import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { validateTurn, chineseNumber } from "../src/llm/validate.js";
function fixture(label = "敷衍") {
  const state = initialTurn(createState({ seed: "叙事样本" }));
  state.nation.treasury = 480;
  state.nation.arrears = 17;
  state.emperor.age = 24;
  return {
    state,
    slotResults: {
      朝: ["赈灾 · " + label + "（50）：陆怀瑾 主办"],
      午: [],
      夜: [],
    },
    schedule: { 朝: { kind: "下旨", edictType: "赈灾" } },
    entries: [
      {
        path: "nation.treasury",
        before: 480,
        after: 450,
        delta: -30,
        source: "赈灾",
      },
    ],
    notes: [],
    newMemorials: [],
    facts: [{ kind: "execution", slot: "朝", topic: "赈灾", label }],
  };
}
const validate = (text, f = fixture()) =>
  validateTurn(
    {
      chapter: {
        朝: text,
        午: "日影渐移，内侍添了一盏茶。",
        夜: "夜深，宫门依次落锁。",
      },
      summary: "御前记事",
    },
    f,
  );
for (const [name, text, label] of [
  [
    "敷衍描写",
    "户部的回文写得恭谨，赈务却只是敷衍。陆怀瑾垂手立在阶下，一时无人接话。",
    "敷衍",
  ],
  [
    "封驳描写",
    "内阁将圣旨封驳，朱匣送回御案。皇帝合上折子，命诸臣明日再议。",
    "封驳",
  ],
  [
    "阳奉阴违描写",
    "地方官阳奉阴违，把奉旨二字写在纸上，办事仍循旧例。",
    "阳奉阴违",
  ],
  ["照办描写", "有司依旨照办，廊下传来接续领命的脚步声。", "照办"],
  [
    "普通语境不误删",
    "陆怀瑾道：「臣不敢敷衍，更不敢拿套话塞责。」说罢俯身候旨。",
    "照办",
  ],
  [
    "请愿并非受孕事实",
    "皇后低声道：「但愿来年有孕。」殿中灯影微动，皇帝没有答话。",
    "敷衍",
  ],
  ["已知年龄", "新帝年仅二十四岁，却在群臣面前坐得很稳。", "敷衍"],
  ["已知金额", "三十万两赈银已从户部发付。另有积欠十七万两，仍须据册补付。陆怀瑾将收支簿呈到御案前。", "敷衍"],
])
  test("真实风格保留：" + name, () => {
    const r = validate(text, fixture(label));
    assert.equal(r.chapter.朝, text);
    assert.ok(!r.chapter.朝.includes("主办"));
  });
test("只纠正矛盾的执行度，不删除整句", () => {
  const t = "户部将旨意照办，陆怀瑾俯身候旨。";
  const r = validate(t, fixture("封驳"));
  assert.equal(r.chapter.朝, "户部将旨意封驳，陆怀瑾俯身候旨。");
  assert.ok(r.fixNotes.length);
});
test("无依据金额、人数和年龄逐句删除，留下相邻叙述", () => {
  for (const claim of [
    "国库平添一千万两。",
    "十万名禁军已至宫门。",
    "皇帝年满九十岁。",
  ]) {
    const r = validate(claim + "殿外细雨渐密。");
    assert.equal(r.chapter.朝, "殿外细雨渐密。");
  }
});
test("在状态中的兵数保留，数字类别不串用", () => {
  const f = fixture(),
    n = f.state.nation.army.capital.troops;
  assert.equal(
    validate("京营有" + n + "人驻守。", f).chapter.朝,
    "京营有" + n + "人驻守。",
  );
  assert.equal(validate("皇帝已满四百八十岁。", f).chapter.朝, "");
});
test("生死、孕事、任免、战果须匹配本旬人物与结果", () => {
  const f = fixture();
  for (const text of [
    "陆令仪诊得喜脉。",
    "陆怀瑾已被罢免。",
    "皇帝忽然驾崩。",
    "朔庭一役大获全胜。",
  ])
    assert.equal(validate(text, f).chapter.朝, "");
  f.facts.push(
    { kind: "pregnancy", actors: ["陆令仪"] },
    { kind: "appointment", actors: ["陆怀瑾"], operation: "任命" },
    { kind: "war", actors: ["朔庭"], outcome: "胜利" },
  );
  for (const text of [
    "陆令仪诊得喜脉，太医俯身报喜。",
    "陆怀瑾出任户部尚书，接诏后再拜。",
    "朔庭一役大获全胜，捷书送到御前。",
  ])
    assert.equal(validate(text, f).chapter.朝, text);
  assert.equal(validate("沈清蘅诊得喜脉。", f).chapter.朝, "");
  assert.equal(validate("朔庭一役兵败。", f).chapter.朝, "");
});
test("死亡真实结算留存，非同人的死亡不通过", () => {
  const f = fixture();
  f.facts.push({ kind: "death", actors: ["沈守正"] });
  assert.equal(
    validate("沈守正病故，朝中同僚闻讯肃立。", f).chapter.朝,
    "沈守正病故，朝中同僚闻讯肃立。",
  );
  assert.equal(validate("陆怀瑾病故。", f).chapter.朝, "");
});
test("历史结算单独保存，正文不拼结算字符串", () => {
  const s = initialTurn(createState({ seed: "单独记账" })),
    f = forecastTurn(s),
    r = validateTurn(
      { chapter: { 朝: "朝钟初响。", 午: "日影正长。", 夜: "宫灯依次熄灭。" } },
      f,
    ),
    n = commitTurn(s, f, r);
  assert.equal(n.history[0].chapter.朝, "朝钟初响。");
  assert.deepEqual(n.history[0].settlement.slotResults, f.slotResults);
});
test("中文与混合小数计数", () => {
  assert.equal(chineseNumber("四亿三千万"), 430000000);
  assert.equal(chineseNumber("30.5万"), 305000);
  assert.equal(chineseNumber("四万五千"), 45000);
});

for (const text of [
  "两位大臣在廊下低声商议，见御驾将至，便一同整肃衣冠。",
  "殿内只留一人研墨，帘外的雨声渐渐密了。",
  "三名内侍依次奉上茶盏，皇帝抬手命他们退下。",
]) test("8.1 泛指人数不误删：" + text, () => {
  assert.equal(validate(text).chapter.朝, text);
});
test("8.1 军伍户口语境仍核对人数，未知兵数不通过", () => {
  assert.equal(validate("十万名禁军已至宫门。殿外细雨渐密。").chapter.朝,"殿外细雨渐密。");
  assert.equal(validate("征发三名兵丁充作亲卫。").chapter.朝,"");
});
