import { createState, assertState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { canVisit } from "../src/core/harem.js";
import { succeedEmperor } from "../src/core/succession.js";
import { reignId } from "../src/core/state.js";
import { edictBlock } from "../src/core/edicts.js";
import { annualBudget } from "../src/core/finance.js";
import { random, seedNumber } from "../src/core/rng.js";
export function simulate(years = 200, seed = "御极·两百年", options = {}) {
  let strategy = seedNumber(seed),
    life = 0,
    s = initialTurn(createState({ seed: seed + "-" + life })),
    deaths = 0,
    collapse = 0,
    totalBirths = 0,
    childrenByReign = new Map(),
    events = 0,
    completedTurns = 0,
    maxTreasury = s.nation.treasury,
    maxTreasuryFirst50 = s.nation.treasury,
    maxTreasuryLast50 = 0,
    annual = [],
    yearRow = null,
    decades = [],
    decadeEvents = 0,
    reignStart = 0,
    completed = [],
    dynasties = 1,
    successionCount = 0;
  const pick = (n) => {
    const r = random(strategy);
    strategy = r.rng;
    return Math.floor(r.value * n);
  };
  for (let i = 0; i < years * 36; i++) {
    if (i % 36 === 0) yearRow = {
      year: 1 + Math.floor(i / 36), openingTreasury: s.nation.treasury,
      income: 0, expense: 0, taxIncome: 0, wasteExpense: 0,
      resetAdjustment: 0, peakTreasury: s.nation.treasury,
    };
    const action = options.strategy === "rest" ? -1 : pick(8),
      schedule = { 朝: null, 午: null, 夜: null };
    if (action < 4) {
      // Court hearings retain three issues; a dedicated paperwork slot processes
      // six memorials at the existing two-energy cost.
      const ms = s.memorials.slice(0, action < 2 ? 3 : 6);
      let available = Math.max(0, s.nation.treasury - 8);
      const decisions = {};
      for (const m of ms) {
        // Choose uniformly among affordable engine options, including hold.
        const choices = m.options.filter(o => Math.max(0,-(o.effects?.treasury || 0)) <= available);
        const option = choices[pick(choices.length)];
        decisions[m.id] = option.id;
        available -= Math.max(0,-(option.effects?.treasury || 0));
      }
      schedule.朝 = {
        kind: action < 2 ? "上朝" : "批折",
        memorials: ms.map((m) => m.id),
        decisions,
      };
    }
    if (action === 4 && s.nation.treasury > 80) {
      const types=["整饬吏治", "赈灾", "减赋"],start=pick(3);
      const edictType=types.map((_,i)=>types[(start+i)%3]).find(type=>!edictBlock(s,type));
      if(!s.regency&&edictType)schedule.午={kind:'下旨',edictType};
    }
    const partner = s.harem.consorts.find((c) => canVisit(s, c));
    if (action === 5 && partner)
      schedule.夜 = { kind: "后宫", operation: "侍寝", person: partner.id };
    if (action === 7) {
      const vacancy = s.court.posts.find((p) => !p.holder),
        person = s.court.officials.find(
          (o) =>
            o.alive &&
            !o.retired &&
            !o.jailed &&
            !o.post &&
            o.age >= 25 &&
            o.abilities.政 >= 40,
        );
      if (vacancy && person)
        schedule.午 = {
          kind: "任命",
          post: vacancy.id,
          person: person.id,
          operation: "appoint",
        };
    }
    if (action === 7 && !schedule.夜) schedule.夜 = { kind: "歇息" };
    if(s.regency){
      if(schedule.朝?.kind==='上朝')schedule.朝.kind='批折';
      if(schedule.午?.kind==='任命')schedule.午=null;
    }
    if (options.strategy === "rest") for (const slot of ["朝", "午", "夜"]) schedule[slot] = {kind:"歇息"};
    // Mock chapters contain no narrative. Discard them after their state has been checked.
    s.history = [];
    s.volumes = [];
    s.ledger = [];
    const f = forecastTurn(s, schedule),
      before = s.stats.events,
      birthBefore = s.stats.births;
    options.onForecast?.(s,f);
    s = commitTurn(s, f, {});
    assertState(s);
    const delta = s.stats.events - before;
    events += delta;
    totalBirths += s.stats.births - birthBefore;
    for (const child of s.harem.children.filter(
      (c) => c.born === s.turn && c.fatherId,
    )) {
      if (!childrenByReign.has(child.fatherId))
        childrenByReign.set(child.fatherId, new Set());
      childrenByReign.get(child.fatherId).add(child.id);
    }
    decadeEvents += delta;
    completedTurns++;
    const treasuryEntries = f.entries.filter((e) => e.path === "nation.treasury");
    const peak = Math.max(s.nation.treasury, ...treasuryEntries.flatMap((e) => [e.before,e.after]));
    maxTreasury = Math.max(maxTreasury, peak);
    if (i < 50 * 36) maxTreasuryFirst50 = Math.max(maxTreasuryFirst50,peak);
    if (i >= Math.max(0,years-50) * 36) maxTreasuryLast50 = Math.max(maxTreasuryLast50,peak);
    yearRow.peakTreasury = Math.max(yearRow.peakTreasury,peak);
    for (const e of treasuryEntries) {
      const change = e.after - e.before;
      if (change > 0) yearRow.income += change;
      else yearRow.expense -= change;
      if (e.source.startsWith("季结：赋税")) yearRow.taxIncome += change;
      if (e.source === "冗费与侵吞") yearRow.wasteExpense -= change;
    }
    if ((i + 1) % 360 === 0) {
      decades.push(decadeEvents);
      decadeEvents = 0;
    }
    if (s.ending) {
      deaths += s.ending.type === "驾崩" ? 1 : 0;
      collapse += s.ending.type === "亡国" ? 1 : 0;
      completed.push({
        id: reignId(s),
        turns: s.turn - reignStart,
        ending: s.ending.type,
        cause: s.ending.cause,
      });
      life++;
      if (options.stopOnCollapse && s.ending.type === "亡国") {
        yearRow.closingTreasury = s.nation.treasury;
        yearRow.turns = (i % 36) + 1;
        yearRow.budgetAtYearEnd = annualBudget(s);
        yearRow.morale = s.nation.morale;
        yearRow.governance = s.nation.governance;
        yearRow.arrears = s.nation.arrears;
        annual.push(yearRow);
        break;
      }
      if (s.ending.type === "驾崩") {
        s = succeedEmperor(s);
        successionCount++;
      } else {
        const oldBalance = s.nation.treasury;
        s = initialTurn(createState({ seed: seed + "-dynasty-" + dynasties++ }));
        yearRow.resetAdjustment += s.nation.treasury - oldBalance;
      }
      reignStart = s.turn;
    }
    if ((i+1) % 36 === 0) {
      yearRow.closingTreasury = s.nation.treasury;
      yearRow.budgetAtYearEnd = annualBudget(s);
      yearRow.morale = s.nation.morale;
      yearRow.governance = s.nation.governance;
      yearRow.arrears = s.nation.arrears;
      yearRow.turns = 36;
      annual.push(yearRow);
    }
  }
  const round = (n) => Math.round(n * 100) / 100;
  const roundedAnnual = annual.map((row) => Object.fromEntries(Object.entries(row).map(([k,v]) => [k,round(v)])));
  return {
    seed,
    years,
    strategy: options.strategy || "random",
    actualYears: Math.round(completedTurns / 36 * 100) / 100,
    ending: s.ending?.type || null,
    turns: completedTurns,
    reigns: life + (s.ending ? 0 : 1),
    dynasties,
    successionCount,
    completedReignsDetail: completed.map((r) => ({
      ...r,
      children: childrenByReign.get(r.id)?.size || 0,
    })),
    completedReigns: life,
    meanReignYears: life
      ? Math.round(
          (completed.reduce((n, r) => n + r.turns, 0) / life / 36) * 100,
        ) / 100
      : null,
    deathCount: deaths,
    collapseCount: collapse,
    collapseRate: life ? Math.round((collapse / life) * 10000) / 100 : 0,
    meanChildren:
      Math.round(
        (life
          ? completed.reduce(
              (n, r) => n + (childrenByReign.get(r.id)?.size || 0),
              0,
            ) / life
          : totalBirths) * 100,
      ) / 100,
    meanChildrenIncludingCurrent:
      Math.round((totalBirths / (life + (s.ending ? 0 : 1))) * 100) / 100,
    totalEvents: events,
    eventsPerDecade: decades,
    meanEventsPerDecade: events / (completedTurns / 360),
    maxTreasury,
    maxTreasuryFirst50,
    maxTreasuryLast50,
    treasuryPeakRatio: maxTreasuryLast50 / maxTreasuryFirst50,
    meanAnnualIncome: round(annual.reduce((n,r) => n + r.income,0) / (completedTurns / 36)),
    meanAnnualExpense: round(annual.reduce((n,r) => n + r.expense,0) / (completedTurns / 36)),
    annual: roundedAnnual,
    finalTreasury: Math.round(s.nation.treasury),
  };
}
if (process.argv[1] === import.meta.filename) {
  console.log(
    JSON.stringify(
      simulate(Number(process.argv[2]) || 200, process.argv[3]),
      null,
      2,
    ),
  );
}
