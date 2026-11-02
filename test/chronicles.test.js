import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { selectAmbitions, evaluateAmbitions } from "../src/core/ambitions.js";
import {
  ACHIEVEMENTS,
  unlockAchievements,
  sealChronicle,
  requestCompletion,
  applyBiography,
} from "../src/core/chronicles.js";
const initial = () =>
  initialTurn(
    selectAmbitions(createState({ seed: "chronicles" }), [
      "clean",
      "wealth",
      "poetry",
      "heir",
    ]),
  );
test("goals require all state conditions and pay each reward only once", () => {
  let s = initial();
  s.nation.governance = 90;
  s.nation.treasury = 1000;
  s.nation.morale = 80;
  s = evaluateAmbitions(s);
  assert.equal(
    s.ambitions.filter((a) => a.kind === "宏愿" && a.status === "达成").length,
    2,
  );
  const again = evaluateAmbitions(s);
  assert.equal(again.emperor.mood, s.emperor.mood);
  assert.deepEqual(again.receipts, s.receipts);
  assert.equal(requestCompletion(s).ending.type, "宏愿圆满");
});
test("story conditions need a literal chapter quote and expected keywords", () => {
  const s = initial(),
    text = "朕将往日诗稿编成一集，交翰林缮录。";
  assert.equal(
    evaluateAmbitions(s, {
      chapter: { 朝: text },
      ambitionEvidence: [
        { id: "poetry", objectiveId: "poem", evidence: "不曾出现过的诗集句子" },
      ],
    }).ambitions[2].status,
    "进行中",
  );
  const n = evaluateAmbitions(s, {
    chapter: { 朝: text },
    ambitionEvidence: [{ id: "poetry", objectiveId: "poem", evidence: text }],
  });
  assert.equal(n.ambitions[2].status, "达成");
});
test("four endings seal once, emperor titles stay engine-owned", () => {
  for (const ending of ["驾崩", "禅位", "亡国", "宏愿圆满"]) {
    let s = initial();
    s.ending = { type: ending, cause: "fixture" };
    s = sealChronicle(s);
    assert.equal(sealChronicle(s).chronicles.length, 1);
    assert.ok(s.chronicles[0].biography.length >= 500);
    const label = s.chronicles[0].posthumous;
    const n = applyBiography(s, {
      posthumous: "神",
      templeName: "天帝",
      biography: "谥号天帝。" + "宫门静肃，朝臣依次退班。".repeat(55),
      commentary: "史臣依实录论功过。",
    });
    assert.equal(n.chronicles[0].posthumous, label);
    assert.ok(!n.chronicles[0].biography.includes("天帝"));
  }
});
test("thirty achievements have unique identities and only unlock once", () => {
  assert.equal(ACHIEVEMENTS.length, 30);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a[0])).size, 30);
  let s = unlockAchievements(initial());
  assert.deepEqual(unlockAchievements(s).achievements, s.achievements);
});
test("death at annual lifespan limit seals biography with contested succession", () => {
  let s = initial();
  s.turn = 35;
  s.day = 350;
  s.emperor.age = s.emperor.lifespan - 1;
  const f = forecastTurn(s);
  s = commitTurn(s, f, {});
  assert.equal(s.ending.type, "驾崩");
  assert.equal(s.chronicles.length, 1);
  assert.ok(s.chronicles[0].succession.includes("继位争夺"));
});
