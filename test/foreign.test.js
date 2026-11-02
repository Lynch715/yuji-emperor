import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { diplomacy, borderInvasions } from "../src/core/foreign.js";
import { eventsMonth, resolveMemorial } from "../src/core/events.js";
const initial = () => initialTurn(createState({ seed: "foreign" }));
test("full border threat always invades and creates engine consequence", () => {
  const s = initial();
  s.nation.army.frontiers[0].threat = 100;
  const next = borderInvasions(s);
  assert.ok(next.threads.some((t) => t.type === "边警"));
  assert.equal(next.nation.army.frontiers[0].threat, 45);
  assert.ok(next.nation.treasury < s.nation.treasury);
});
test("marriage validates adult unmarried bride and changes relationship to 婚盟", () => {
  const s = initial();
  assert.throws(() =>
    diplomacy(s, { country: "w0", operation: "和亲", bride: "missing" }, 20),
  );
  const r = diplomacy(
    s,
    { country: "w0", operation: "和亲", bride: "royal-1" },
    20,
  );
  assert.equal(r.state.foreign[0].status, "婚盟");
  assert.equal(r.state.harem.royalWomen[0].married, "w0");
  assert.throws(() =>
    diplomacy(
      r.state,
      { country: "w1", operation: "和亲", bride: "royal-1" },
      20,
    ),
  );
});
test("personal campaign advances by turns, regent may process memorials and grow influence", () => {
  let s = initial();
  s.emperor.prestige = 30;
  s = diplomacy(s, { country: "w0", operation: "宣战" }, 20).state;
  const regent = s.court.posts[0].holder,
    f = forecastTurn(s, { 朝: { kind: "亲征", regent }, 午: null, 夜: null });
  assert.equal(f.state.campaigns[0].round, 1);
  assert.ok(f.entries.some((e) => e.source.includes("留守大臣")));
  assert.throws(() =>
    forecastTurn(f.state, { 朝: { kind: "上朝" }, 午: null, 夜: null }),
  );
  s = commitTurn(s, f, {});
  for (let i = 0; i < 6 && !s.campaigns[0].done; i++)
    s = commitTurn(s, forecastTurn(s), {});
  assert.equal(s.campaigns[0].done, true);
});
test("capital can fall in normal mode, free mode avoids conquest ending", () => {
  for (const freedom of ["mid", "free"]) {
    const s = initial();
    s.settings.freedom = freedom;
    s.nation.army.capital.troops = 0;
    s.nation.army.frontiers[0].troops = 0;
    s.nation.army.frontiers[0].threat = 100;
    const n = borderInvasions(s);
    assert.equal(n.ending?.type === "亡国", freedom === "mid");
  }
});
test("ended event thread cannot be reopened or rewarded twice", () => {
  let s = initial();
  for (let i = 0; i < 20 && !s.threads.length; i++) s = eventsMonth(s);
  assert.ok(s.threads.length);
  const m = s.memorials.find((m) => m.threadId);
  s = resolveMemorial(s, m.id, "opt0").state;
  assert.equal(s.threads.find((t) => t.id === m.threadId).stage, "结束");
  assert.throws(() => resolveMemorial(s, m.id, "opt0"));
});
