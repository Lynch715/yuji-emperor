import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createState, migrate,VERSION } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { selectAmbitions } from "../src/core/ambitions.js";
import { STYLES } from "../src/llm/prompts.js";
import { renderApp } from "../src/ui/render.js";
import { mockNarrative, validateTurn } from "../src/llm/validate.js";
import { pack, unpack } from "../src/store/save.js";
const initial = () =>
  initialTurn(
    selectAmbitions(createState({ seed: "polish", freedom: "free" })),
  );
test("core and prompt/validation modules do not depend on DOM, storage or networking", () => {
  for (const dir of ["src/core", "src/llm"])
    for (const file of readdirSync(dir)) {
      if (dir === "src/llm" && !["prompts.js", "validate.js"].includes(file))
        continue;
      const code = readFileSync(dir + "/" + file, "utf8");
      assert.ok(
        !/\b(?:document|window|localStorage|indexedDB|fetch)\s*[.(]/.test(code),
        file,
      );
    }
});
test("old version-1 saves fill compatible optional fields, future saves stay protected", () => {
  const s = initial();
  s.v = 1;
  for (const key of [
    "chronicles",
    "talks",
    "campaigns",
    "retaliations",
    "receipts",
  ])
    delete s[key];
  delete s.emperor.growth;
  const m = migrate(unpack(pack(s)).state);
  assert.deepEqual(m.chronicles, []);
  assert.deepEqual(m.emperor.growth, {
    政略: 0,
    权谋: 0,
    武略: 0,
    文采: 0,
    魅力: 0,
  });
  assert.throws(() => migrate({ ...s, v: VERSION+1 }));
});
test("E1 one thousand played turns keep history exportable, no duplicate receipts or blocked states", () => {
  let s = initial();
  s.settings.freedom='free';s.emperor.lifespan=400;
  for (let i = 0; i < 1000; i++) {
    const f = forecastTurn(s, {
      朝: {
        kind: "上朝",
        memorials: s.memorials.slice(0, 3).map((m) => m.id),
        decision: s.nation.treasury > 80 ? "approve" : "reject",
      },
      午: null,
      夜: { kind: "歇息" },
    });
    s = commitTurn(s, f, validateTurn(mockNarrative(f), f));
  }
  const chapters = [...s.volumes.flatMap((v) => v.chapters), ...s.history];
  assert.equal(chapters.length, 1000);
  assert.equal(new Set(chapters.map((h) => h.id)).size, 1000);
  assert.equal(new Set(s.receipts).size, s.receipts.length);
  const restored=migrate(unpack(pack(s)).state),roundtrip=[...restored.volumes.flatMap(v=>v.chapters),...restored.history];
  for(let i=0;i<1000;i++)assert.equal(JSON.stringify(roundtrip[i]),JSON.stringify(chapters[i]),'第'+(i+1)+'旬');
});
test("prose styles (14 since 第二轮审计 F4) and safe UI escaping of imported/model names", () => {
  assert.equal(Object.keys(STYLES).length, 14);
  const s = initial();
  s.emperor.name = "<img src=x onerror=alert(1)>";
  const html = renderApp(s);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("mobile-nav"));
});
test("model affinity suggestions clamp at five per known person even with duplicate requests", () => {
  const s = initial(),
    f = forecastTurn(s),
    before = f.state.court.officials[0].favor;
  const n = commitTurn(s, f, {
    reactions: Array.from({ length: 10 }, () => ({
      id: "o0",
      favorDelta: 100,
    })),
  });
  assert.ok(n.court.officials[0].favor <= before + 5);
});
test("intimate narration is restrained and no model secret/number grants enter state", () => {
  const s = initial(),
    f = forecastTurn(s);
  const n = validateTurn(
    {
      chapter: { 朝: "百官肃立。", 午: "银库无事。", 夜: "裸体与插入。" },
      summary: "获得1000万两",
      effects: { privy: 1000 },
    },
    f,
  );
  assert.ok(!n.chapter.夜.includes("裸体"));
  assert.ok(!n.summary.includes("1000"));
  assert.equal(commitTurn(s, f, n).nation.privy, f.state.nation.privy);
});
