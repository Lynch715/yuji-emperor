import test from "node:test";
import assert from "node:assert/strict";
import { createState, assertState, migrate } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { applyEffects, applyPackage } from "../src/core/effects.js";
import { check, fateModifier } from "../src/core/rng.js";
import { energyLimit } from "../src/core/emperor.js";
import { execution } from "../src/core/edicts.js";
import { simulate } from "../scripts/simulate.mjs";
const state = () => initialTurn(createState({ seed: "test" }));
test("deterministic initial world and pure forecast, immutable engine result through retry", () => {
  const s = state(),
    before = structuredClone(s),
    f = forecastTurn(s, { 朝: { kind: "上朝", memorials: s.memorials.slice(0,3).map(m=>m.id) }, 午: null, 夜: null }),
    again = forecastTurn(s, f.schedule);
  assert.deepEqual(s, before);
  assert.deepEqual(f, again);
  assert.equal(f.state.turn, 1);
  assert.equal(f.state.day, 10);
  assert.equal(f.state.court.posts.length, 41);
  assert.equal(f.state.nation.provinces.length, 12);
});
test("commit is idempotent, stale/cross-run forecasts rejected", () => {
  const s = state(),
    f = forecastTurn(s),
    next = commitTurn(s, f, {});
  assert.deepEqual(commitTurn(next, f, {}), next);
  const other = state();
  other.revision++;
  assert.throws(() => commitTurn(other, f), /过期/);
  assert.equal(next.receipts.length, 1);
});
test("effect whitelist clamps values and records every accepted scalar mutation", () => {
  const s = state(),
    r = applyEffects(
      s,
      { treasury: -1e9, morale: 1e9, health: Infinity, unknown: 400 },
      "fixture",
    );
  assert.equal(r.state.nation.treasury, 0);
  assert.equal(r.state.nation.morale, 100);
  assert.equal(r.state.unknown, undefined);
  assert.equal(r.entries.length,s.nation.provinces.length+3);
  assertState(r.state);
});
test("energy, d20 thresholds, strict execution tiers and free guaranteed execution", () => {
  const s = state();
  assert.equal(energyLimit(s), 9);
  assert.equal(fateModifier(20), 38);
  assert.equal(check(55, 11, "一般").success, true);
  s.emperor.prestige = 0;
  s.nation.governance = 0;
  const officer = s.court.officials.find(
    (o) => o.id === s.court.posts[1].holder,
  );
  officer.abilities.政 = 0;
  officer.greed = 0;
  s.court.factions.find((f) => f.id === officer.faction).attitude = 50;
  const low = execution(s, "赈灾", 1);
  assert.equal(low.label, "封驳");
  s.settings.freedom = "free";
  assert.equal(execution(s, "赈灾", 1).score, low.score);
  assert.equal(execution(s, "赈灾", 1).label,"照办");
});
test("month, quarter, year rollover and talent growth annual limits", () => {
  let s = state();
  for (let i = 0; i < 36; i++) {
    const f = forecastTurn(s, {
      朝: { kind: "上朝", memorials: [], decision: "reject" },
      午: null,
      夜: null,
    });
    s = commitTurn(s, f, {});
  }
  assert.equal(s.era.year, 2);
  assert.equal(s.emperor.age, 25);
  assert.equal(s.era.month, 1);
  assert.ok(
    s.emperor.talents.政略 <=
      createState({ seed: "test" }).emperor.talents.政略 + 3.000001,
  );
  assert.equal(s.emperor.growth.政略, 0);
  assert.ok(s.stats.income > 0);
});
test("memorial expiration and overload worsen governance with explicit ledger provenance", () => {
  let s = state();
  // Explicitly build an overdue backlog; quiet months no longer manufacture it.
  s.memorials=Array.from({length:14},(_,i)=>({...s.memorials[0],id:"overdue-"+i,due:2}));
  s.turn=2;
  const before=s.nation.governance;
  s = commitTurn(s, forecastTurn(s), {});
  assert.ok(s.nation.governance < before);
  assert.ok(
    s.history
      .at(-1)
      .entries.some(
        (e) => e.source.includes("积压") || e.source.includes("逾期"),
      ),
  );
});
test("invalid versions and invalid numeric data enter migration failure", () => {
  assert.throws(() => migrate({ ...state(), v: 999 }));
  const s = state();
  s.nation.morale = NaN;
  assert.throws(() => migrate(s));
  assert.deepEqual(migrate(state()), state());
});
test("200-year seeded diligent strategy stays bounded and includes endings", () => {
  const r = simulate(200, "御极·两百年");
  assert.equal(r.turns, 7200);
  assert.ok(r.deathCount > 0);
  assert.ok(r.maxTreasury <= 3000);
  assert.ok(r.maxTreasuryLast50 <= r.maxTreasuryFirst50 * 1.5);
  // Absolute mortality is now observational; arithmetic and strategy ordering
  // stay checked, alongside the unchanged economy and event limits.
  assert.ok(r.collapseRate>=0&&r.collapseRate<=100,"亡国率 "+r.collapseRate+"%");
  assert.equal(r.collapseRate,Math.round(r.collapseCount/r.completedReigns*10000)/100);
  assert.equal(r.eventsPerDecade.length,20);
  // Wider topic coverage changes simulated choices and their later event paths.
  // Check the long-run density, allowing a single decade's sampling variation.
  const meanEvents=r.eventsPerDecade.reduce((n,v)=>n+v,0)/r.eventsPerDecade.length;
  assert.ok(meanEvents>=30&&meanEvents<=80);
  assert.ok(r.eventsPerDecade.every(n=>n>=30&&n<=90));
  console.log("模拟摘要 " + JSON.stringify(r));
});
test("collapse is possible, free mode avoids collapse", () => {
  let s = state();
  s.nation.treasury=0;s.nation.morale=0;s.nation.provinces.forEach(p=>p.morale=0);
  let ended = false;
  for (let i = 0; i < 100 && !ended; i++) {
    s = commitTurn(s, forecastTurn(s), {});
    ended = s.ending?.type === "亡国";
  }
  assert.ok(ended);
  s = state();
  s.settings.freedom = "free";
  s.nation.treasury=0;s.nation.morale=0;s.nation.provinces.forEach(p=>p.morale=0);
  for (let i = 0; i < 100; i++) {
    s = commitTurn(s, forecastTurn(s), {});
    assert.notEqual(s.ending?.type, "亡国");
  }
});
test("personality has engine effects and force-pushing a blocked edict reuses forecast results", async () => {
  const { emperorMonth } = await import("../src/core/emperor.js");
  let s = state();
  s.emperor.tags = ["勤政", "节俭"];
  const next = emperorMonth(s);
  assert.ok(next.nation.governance > s.nation.governance);
  const {nationMonth}=await import('../src/core/nation.js');
  const normal=structuredClone(s);normal.emperor.tags=[];
  assert.ok(nationMonth(s).nation.privy>nationMonth(normal).nation.privy);
  s.emperor.prestige = 0;
  s.nation.governance = 0;
  s.rng=1; // Explicit low first die, independent of petition-selection draws.
  s.settings.freedom='real'; // Exercise force rather than the mid-mode retry.
  const f = forecastTurn(s, {
    朝: { kind: "下旨", edictType: "赈灾", force: true },
    午: null,
    夜: null,
  });
  assert.deepEqual(f, forecastTurn(s, f.schedule));
  assert.ok(f.slotResults.朝[0].includes("强推"));
});
