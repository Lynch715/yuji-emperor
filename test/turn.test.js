import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Script } from "node:vm";
import { createState } from "../src/core/state.js";
import {
  initialTurn,
  forecastTurn,
  commitTurn,
  validateSchedule,
} from "../src/core/turn.js";
import { mockNarrative, validateTurn } from "../src/llm/validate.js";
import { applyWorld } from "../src/core/world.js";
import { pack, unpack } from "../src/store/save.js";
const initial = () => initialTurn(createState({ seed: "twenty" }));
test("twenty turns: every change of tracked scalar has ledger provenance", () => {
  let s = initial();
  for (let i = 0; i < 20; i++) {
    const f = forecastTurn(s, {
      朝: { kind: "上朝", memorials: s.memorials.slice(0, 3).map((m) => m.id) },
      午: null,
      夜: { kind: "歇息" },
    });
    for (const [owner, fields] of [
      ["nation", ["treasury", "privy", "grain", "morale", "governance"]],
      ["emperor", ["health", "mood", "prestige", "virtue"]],
    ])
      for (const field of fields) {
        const delta = f.state[owner][field] - s[owner][field],
          sum = f.entries
            .filter((e) => e.path === owner + "." + field)
            .reduce((a, e) => a + e.after - e.before, 0);
        assert.ok(Math.abs(delta - sum) < 1e-6, owner + "." + field);
      }
    s = commitTurn(s, f, validateTurn(mockNarrative(f), f));
  }
  assert.equal(s.history.length, 20);
});
test("pending roundtrip preserves dice, settlement and idempotent receipt after network failure", () => {
  const s = initial(),
    f = forecastTurn(s);
  const pending = { ...s, pending: { forecast: f } };
  const restored = unpack(pack(pending)).state;
  assert.deepEqual(restored.pending.forecast, f);
  assert.deepEqual(s, initial());
  const n = commitTurn(restored, restored.pending.forecast, mockNarrative(f));
  assert.equal(n.turn, 1);
  assert.equal(n.pending, null);
  assert.equal(n.lastTurn.die, f.die);
});
test("model cannot grant treasury, rewrite hard outcomes, inject unknown people or fabricate evidence", () => {
  const s = initial(),
    f = forecastTurn(s);
  const data = {
    chapter: {
      朝: "国库增加1000万两。百官肃立。",
      午: "某妃怀孕。",
      夜: "帘幕垂下。",
    },
    summary: "一旬",
    effects: { treasury: 999999 },
    reactions: [{ name: "不在名册", favorDelta: 99 }],
    ambitionEvidence: [{ id: "x", evidence: "正文未出现的句子" }],
  };
  const result = validateTurn(data, f);
  assert.ok(!result.chapter.朝.includes("1000"));
  assert.ok(!result.chapter.午.includes("怀孕"));
  assert.equal(result.reactions.length, 0);
  assert.equal(result.ambitionEvidence.length, 0);
  assert.ok(result.fixNotes.length >= 2);
  assert.equal(
    commitTurn(s, f, result).nation.treasury,
    f.state.nation.treasury,
  );
});
test("world construction ignores every model-supplied numeric value", () => {
  const s = initial(),
    n = applyWorld(s, {
      dynasty: "新朝",
      officials: [{ name: "顾清源", greed: 0, abilities: { 政: 100 } }],
      factions: [{ name: "清议", power: 100 }],
      treasury: 99999,
    });
  assert.equal(n.dynasty, "新朝");
  assert.equal(n.court.officials[0].greed, s.court.officials[0].greed);
  assert.deepEqual(
    n.court.officials[0].abilities,
    s.court.officials[0].abilities,
  );
  assert.equal(n.nation.treasury, s.nation.treasury);
});
test("slot restrictions, full-turn actions and duplicate petitions reject invalid plans", () => {
  const s = initial();
  assert.throws(() =>
    validateSchedule(s, { 朝: null, 午: { kind: "上朝" }, 夜: null }),
  );
  assert.throws(() =>
    validateSchedule(s, {
      朝: { kind: "出巡" },
      午: null,
      夜: { kind: "后宫" },
    }),
  );
  assert.throws(() =>
    validateSchedule(s, {
      朝: { kind: "上朝", memorials: ["x"] },
      午: { kind: "批折", memorials: ["x"] },
      夜: null,
    }),
  );
});
test("standalone build parses without external scripts; optional Google Fonts only", () => {
  execFileSync(process.execPath, ["scripts/build.mjs"]);
  const html = readFileSync("index.html", "utf8"),
    js = html.match(/<script>([\s\S]*)<\/script>/)[1];
  assert.doesNotThrow(() => new Script(js));
  assert.ok(!/<script[^>]+src=/.test(html));
  const links=[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(links.length>=1);
  assert.ok(links.every(url=>['fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(url).hostname)));
});
test("partial streaming renders chapter prose without JSON metadata or reaction fields", async () => {
  const { extractPartialChapter } = await import("../src/llm/validate.js");
  const raw = '{"chapter":{"朝":"百官肃立。\\n御笔初落。","午":"廊外';
  const text = extractPartialChapter(raw);
  assert.equal(text, "朝\n百官肃立。\n御笔初落。\n\n午\n廊外");
  assert.ok(!text.includes("chapter"));
});
