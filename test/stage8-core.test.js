import test from "node:test";
import assert from "node:assert/strict";
import { createState, migrate, clone, reignId,VERSION } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import {
  courtDebate,
  factionOptionScore,
  proxyMemorial,
  accountability,
} from "../src/core/court.js";
import { execution } from "../src/core/edicts.js";
import { check, fateModifier } from "../src/core/rng.js";
import { succeedEmperor } from "../src/core/succession.js";
import { sealChronicle } from "../src/core/chronicles.js";
import { PRESETS, modelsFor, modelDescription } from "../src/llm/client.js";
const initial = () => initialTurn(createState({ seed: "阶段八专项" }));
test("预设与本地 reference 保持一致，说明可见且保留自填模型", () => {
  assert.equal(PRESETS.deepseek.model, "deepseek-v4-flash");
  assert.ok(modelsFor("deepseek").some((m) => m.id === "deepseek-v4-pro"));
  for (const p of ["qwen_cn", "qwen_sg", "qwen_us"]) {
    assert.equal(PRESETS[p].model, "qwen3.8-flash");
    assert.equal(modelsFor(p).length, 3);
  }
  assert.match(modelDescription("qwen_cn", "existing-custom"), /保留/);
});
test("廷议为按势力无放回抽样，排除不在京或已失职者", () => {
  let s = initial();
  for (const f of s.court.factions) f.power = f.id === "f0" ? 100 : 0;
  s.court.officials[0].inCapital = false;
  s.court.officials[6].jailed = true;
  const before = clone(s),
    r = courtDebate(s, s.memorials.slice(0, 3));
  assert.deepEqual(s, before);
  assert.ok(r.speakers.length >= 2 && r.speakers.length <= 3);
  assert.equal(
    new Set(r.speakers.map((o) => o.officialId)).size,
    r.speakers.length,
  );
  assert.ok(
    r.speakers.every(
      (o) => o.faction === "f0" && !["o0", "o6"].includes(o.officialId),
    ),
  );
  assert.deepEqual(r, courtDebate(s, s.memorials.slice(0, 3)));
});
test("每次上朝只列一份名单，所选每个议题各自表态", () => {
  const s = initial(),
    f = forecastTurn(s, {
      朝: {
        kind: "上朝",
        stance: "廷议",
        memorials: s.memorials.slice(0, 3).map((m) => m.id),
      },
      午: null,
      夜: null,
    });
  assert.equal(
    f.slotResults.朝.filter((t) => t.startsWith("廷议：")).length,
    1,
  );
  assert.ok(f.debate.every((o) => o.opinions.length === 3));
});
test("派系立场随议题及诉求变化，不跟随皇帝好感", () => {
  const s = initial(),
    clear = s.court.factions[0],
    military = s.court.factions[1],
    m = { type: "政务", title: "整饬吏治", request: "", options: [] },
    opt = { label: "准奏", effects: { governance: 3 } };
  assert.ok(
    factionOptionScore(clear, m, opt) > factionOptionScore(military, m, opt),
  );
  const old = factionOptionScore(clear, m, opt);
  clear.attitude = 0;
  assert.equal(factionOptionScore(clear, m, opt), old);
});
test("权臣按利益选项实际落账、结线程并记名，不能重复代批", () => {
  const s = initial();
  s.emperor.prestige = 20;
  s.court.factions[0].power = 90;
  s.memorials = [
    {
      id: "proxy",
      title: "整饬吏治",
      type: "贪腐",
      request: "查贪",
      threadId: "case",
      options: [
        { id: "yes", label: "严查", effects: { governance: 5, treasury: -10 } },
        { id: "no", label: "放任", effects: { governance: -3, treasury: 4 } },
      ],
    },
  ];
  s.threads = [{ id: "case", stage: "发生" }];
  const r = proxyMemorial(s);
  assert.equal(r.optionId, "yes");
  assert.equal(r.state.nation.treasury, s.nation.treasury - 10);
  assert.equal(r.state.nation.governance, s.nation.governance + 5);
  assert.equal(r.state.threads[0].stage, "结束");
  assert.match(r.note, /代批/);
  const name = s.court.officials.find((o) => o.id === r.officialId).name;
  assert.ok(r.state.ledger.some((e) => e.source.includes(name + "代批")));
  assert.equal(
    proxyMemorial(r.state).state.nation.treasury,
    r.state.nation.treasury,
  );
});
test("执行度只用一倍天命，属性仍用四倍", () => {
  const s = initial();
  assert.equal(
    execution(s, "赈灾", 20).score - execution(s, "赈灾", 1).score,
    19,
  );
  assert.equal(fateModifier(20) - fateModifier(1), 76);
  assert.equal(check(60, 20).score - check(60, 1).score, 76);
});
test("当廷问责使用双方权谋，对方再加派系势力十分之一", () => {
  const s = initial(),
    o = s.court.officials[0];
  s.emperor.talents.权谋 = 70;
  o.abilities.权谋 = 10;
  o.abilities.才 = 99;
  s.court.factions[0].power = 80;
  assert.equal(accountability(s, o, 11).score, 63);
  o.abilities.权谋 = 90;
  o.abilities.才 = 1;
  assert.equal(accountability(s, o, 11).score, 23);
});
test("驾崩继位保留同一国家、钱粮、官员派系与政务，旧妃不进入新皇后宫", () => {
  let s = initial();
  s.harem.children.push({
    id: "son",
    name: "萧景安",
    sex: "男",
    born: -720,
    health: 85,
    aptitude: 65,
    education: 20,
    mother: "c0",
    fatherId: s.runId,
    faction: "f0",
  });
  s.harem.heir = "son";
  s.turn = 360;
  s.revision = 360;
  s.ending = { type: "驾崩", cause: "寿终" };
  s = sealChronicle(s);
  const old = clone(s),
    next = succeedEmperor(s);
  assert.deepEqual(s, old);
  assert.equal(next.runId, s.runId);
  assert.equal(next.emperor.name, "萧景安");
  assert.equal(next.reign.number, 2);
  for (const field of [
    "nation",
    "court",
    "projects",
    "memorials",
    "threads",
    "stats",
    "chronicles",
  ])
    assert.deepEqual(next[field], s[field]);
  assert.ok(
    next.harem.consorts
      .filter((c) => !c.retired)
      .every((c) => c.reignId === reignId(next)),
  );
  assert.equal(next.turn, 360);
  assert.equal(next.ending, null);
  const f = forecastTurn(next);
  assert.equal(f.state.era.year, 1 + Math.floor(s.turn / 36));
});
test("v1/v2补权谋与在位信息，不重新抽随机数，旧预演仍可提交", () => {
  const s = initial(),
    f = forecastTurn(s);
  s.v = 2;
  delete s.reign;
  for (const o of s.court.officials) {
    delete o.abilities.权谋;
    delete o.inCapital;
  }
  s.pending = { forecast: f };
  const rng = s.rng,
    m = migrate(s);
  assert.equal(m.v,VERSION);
  assert.equal(m.rng, rng);
  assert.ok(m.court.officials.every((o) => Number.isFinite(o.abilities.权谋)));
  assert.equal(commitTurn(m, m.pending.forecast, {}).turn, 1);
});
test("提交不改变原状态或预演；全数值账目逐字段守恒", async () => {
  const { numericSnapshot } = await import("../src/core/audit.js");
  let s = initial();
  for (let turn = 0; turn < 25; turn++) {
    const old = clone(s),
      f = forecastTurn(s, {
        朝: { kind: "上朝", decision: "reject" },
        午: null,
        夜: null,
      }),
      snap = clone(f.state);
    const n = commitTurn(s, f, {});
    assert.deepEqual(s, old);
    assert.deepEqual(f.state, snap);
    const a = numericSnapshot(s),
      b = numericSnapshot(f.state);
    for (const [path, value] of Object.entries(b)) {
      const logged = f.entries
        .filter((e) => e.path === path)
        .reduce((sum, e) => sum + e.after - e.before, 0);
      assert.ok(Math.abs(value - (a[path] || 0) - logged) < 1e-6, path);
    }
    s = n;
  }
});
test("产后六个月调养，未到期只能探望，不改变受孕基础概率", async () => {
  const { haremMonth, canVisit, haremAction } =
    await import("../src/core/harem.js");
  const s = initial();
  s.turn = 30;
  s.harem.consorts[0].preg = { due: 30, conceived: 0, fatherId: s.runId };
  const n = haremMonth(s),
    mother = n.harem.consorts[0];
  assert.equal(mother.recoveryUntil, 48);
  assert.equal(canVisit(n, mother), false);
  assert.throws(
    () => haremAction(n, { person: mother.id, operation: "侍寝" }),
    /调养/,
  );
  n.turn = 48;
  assert.equal(canVisit(n, mother), true);
});
test("旧版死亡官员迁移不污染原对象；死亡人员不能接收模型好感奖励", async () => {
  const { applyEffects } = await import("../src/core/effects.js");
  const s = initial();
  s.v = 2;
  s.court.officials[0].alive = false;
  delete s.court.officials[0].abilities.权谋;
  const m = migrate(s);
  assert.equal(s.court.officials[0].abilities.权谋, undefined);
  assert.ok(Number.isFinite(m.court.officials[0].abilities.权谋));
  assert.equal(
    applyEffects(m, { official: { id: "o0", favor: 5 } }).state.court
      .officials[0].favor,
    m.court.officials[0].favor,
  );
});
