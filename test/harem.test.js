import test from "node:test";
import assert from "node:assert/strict";
import { createState, assertState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import {
  haremAction,
  canVisit,
  generateCandidates,
  selectConsort,
  succession,
} from "../src/core/harem.js";
import { issueEdict } from "../src/core/edicts.js";
const initial = (seed) =>
  initialTurn(createState({ seed: seed || "harem", freedom: "free" }));
test("no pregnancy in 100 turns without a night visit", () => {
  let s = initial();
  for (let i = 0; i < 100; i++) {
    s.history = [];
    s.volumes = [];
    s = commitTurn(s, forecastTurn(s), {});
    assert.ok(s.harem.consorts.every((c) => !c.preg));
  }
  assert.equal(s.stats.births, 0);
});
test("only an active night visit can conceive, birth after ten months and retry cannot duplicate", () => {
  let found;
  for (let i = 0; i < 200; i++) {
    const s = initial("preg-" + i);
    const r = haremAction(s, { person: "c0", operation: "侍寝" });
    if (r.state.harem.consorts[0].preg) {
      found = r.state;
      break;
    }
  }
  assert.ok(found);
  const due = found.harem.consorts[0].preg.due;
  found.harem.consorts.forEach((c) => {
    c.ambition = 0;
  });
  while (found.turn < due) {
    found.history = [];
    found.volumes = [];
    const f = forecastTurn(found);
    const next = commitTurn(found, f, {});
    assert.deepEqual(commitTurn(next, f, {}), next);
    found = next;
  }
  assert.equal(found.harem.children.length, 1);
  assert.equal(found.stats.births, 1);
});
test("rank limits and triennial grand selection remain; pending candidates can be chosen later", () => {
  let s = initial();s.settings.freedom="real";
  assert.ok(s.harem.candidates.length >= 6 && s.harem.candidates.length <= 10);
  assert.throws(() => selectConsort(s, s.harem.candidates[0].id, "皇后"));
  s = selectConsort(s, s.harem.candidates[0].id, "贵人");
  assert.equal(s.harem.consorts.length, 4);
  s.era.year = 2;s.turn=36;
  assert.throws(() => generateCandidates(s));
  assert.doesNotThrow(() => selectConsort(s, s.harem.candidates[0].id));
});
test("heir edict needs a live son and death without heir triggers factional succession", () => {
  const s = initial();
  assert.throws(() =>
    issueEdict(s, { edictType: "立储", child: "missing" }, 20),
  );
  assert.equal(succession(s).contested, true);
  s.harem.children.push({
    id: "son",
    name: "萧景安",
    sex: "男",
    health: 90,
    born: 0,
    faction: "f0",
  });
  const next = issueEdict(s, { edictType: "立储", child: "son" }, 20).state;
  assert.equal(succession(next).contested, false);
});
test("fifty-year family simulation keeps children within a plausible bounded distribution", () => {
  const births = [];
  for (let seed = 0; seed < 3; seed++) {
    let s = initial("family-" + seed);
    s.emperor.lifespan = 100;
    for (let i = 0; i < 1800; i++) {
      s.history = [];
      s.volumes = [];
      const c = s.harem.consorts.find((c) => canVisit(s, c) && c.age < 45);
      const f = forecastTurn(s, {
        朝: null,
        午: null,
        夜: c ? { kind: "后宫", person: c.id, operation: "侍寝" } : null,
      });
      s = commitTurn(s, f, {});
      assertState(s);
    }
    births.push(s.stats.births);
  }
  assert.ok(births.every((n) => n >= 1 && n <= 50));
  console.log("50年子嗣分布 " + JSON.stringify(births));
});
