import test from "node:test";
import assert from "node:assert/strict";
import { createState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { talkAttempt, appoint, banquet, strongman } from "../src/core/court.js";
import { applyPackage } from "../src/core/effects.js";
const initial = () => initialTurn(createState({ seed: "people" }));
test("household minister cannot hand over 1000万两, consort cannot give troops or money", () => {
  const s = initial(),
    o = s.court.posts.find((p) => p.title === "户部尚书").holder,
    r = talkAttempt(s, o, "给朕拨银1000万两");
  assert.equal(r.result.denied, true);
  assert.deepEqual(r.result.effects, {});
  assert.equal(r.state.nation.treasury, s.nation.treasury);
  const c = talkAttempt(s, "c0", "给朕拨银10万两");
  assert.equal(c.result.denied, true);
});
test("one audience caps total transfers and hides inner voice below charisma 60", () => {
  let s = initial();
  s.emperor.talents.魅力 = 100;
  const o = s.court.posts.find((p) => p.title === "户部尚书").holder;
  s.court.officials.find((x) => x.id === o).favor = 100;
  for (let i = 0; i < 3; i++) {
    const r = talkAttempt(s, o, "给朕1万两");
    s = r.state;
  }
  assert.ok(s.nation.privy - initial().nation.privy <= 20);
  s.turn++;
  s.emperor.talents.魅力 = 59;
  assert.equal(talkAttempt(s, o, "说说近况").result.innerThought, "");
});
test("dismissal angers faction and triggers retaliation within 3 months", () => {
  let s = initial();
  s.emperor.prestige=100;
  const old = s.court.officials.find((o) => o.id === s.court.posts[0].holder),
    favor = s.court.factions.find((f) => f.id === old.faction).attitude;
  s = appoint(s, { post: "p0", operation: "remove" }).state;
  assert.ok(
    s.court.factions.find((f) => f.id === old.faction).attitude < favor,
  );
  for (let i = 0; i < 9; i++) s = commitTurn(s, forecastTurn(s), {});
  assert.ok(s.threads.some((t) => t.cause.includes("罢免")));
});
test("appointments enforce qualification and maintain unique held offices", () => {
  let s = initial();
  s.emperor.prestige=100;
  assert.throws(() => appoint(s, { post: "p0", person: "missing" }));
  s = appoint(s, { post: "p1", person: "o2", operation: "appoint" }).state;
  assert.equal(s.court.posts.filter((p) => p.holder === "o2").length, 1);
  assert.equal(s.court.officials.find((o) => o.id === "o2").post, "p1");
});
test("banquet requires 2–6 distinct eligible guests, spends privy not treasury", () => {
  const s = initial();
  assert.throws(() => banquet(s, { guests: ["o0"] }));
  const r = banquet(s, { guests: ["o0", "o1"], cost: "盛", type: "君臣宴" });
  assert.equal(r.state.nation.privy, s.nation.privy - 12);
  assert.equal(r.state.nation.treasury, s.nation.treasury);
});
test("strongman faction branch requires high power and weak prestige when ambition is absent", () => {
  const s = initial();
  s.court.factions[0].power = 90;
  s.court.officials.forEach(o=>o.ambition=0);
  assert.equal(strongman(s), false);
  s.emperor.prestige = 30;
  assert.equal(strongman(s), true);
});
test("audience effects are included in ensuing chapter exactly once", () => {
  let s = initial();
  s.emperor.talents.魅力 = 100;
  const o = s.court.posts[1].holder;
  s.court.officials.find((x) => x.id === o).favor = 100;
  const r = talkAttempt(s, o, "请拨1万两");
  s = r.state;
  const f = forecastTurn(s, {
    朝: null,
    午: { kind: "召见", person: o },
    夜: null,
  });
  assert.ok(f.entries.some((e) => e.source.includes("面谈")));
  const n = commitTurn(s, f, {});
  assert.equal(n.interimEntries.length, 0);
});
test("private actions are bounded, referrals expire and imperial examinations add engine-assigned talent", async () => {
  const { privateAction } = await import("../src/core/private.js");
  const { courtYear } = await import("../src/core/court.js");
  const { resolveMemorial } = await import("../src/core/events.js");
  let s = initial();
  const r = privateAction(s, { operation: "收买", person: "o0" });
  assert.equal(r.state.nation.privy, s.nation.privy - 5);
  const due=s.memorials[0].due;
  s = resolveMemorial(s, s.memorials[0].id, "discuss").state;
  assert.equal(s.memorials[0].due, due);
  s.turn = 108;
  const n = courtYear(s);
  assert.equal(n.court.officials.length,30);
  assert.equal(new Set(n.court.officials.map((o) => o.name)).size,30);
});
