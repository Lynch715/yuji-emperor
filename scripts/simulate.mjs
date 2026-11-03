import { createState, assertState } from "../src/core/state.js";
import { initialTurn, forecastTurn, commitTurn } from "../src/core/turn.js";
import { canVisit } from "../src/core/harem.js";
import { succeedEmperor } from "../src/core/succession.js";
import { reignId } from "../src/core/state.js";
import { edictBlock } from "../src/core/edicts.js";
import { annualBudget,grainBudget } from "../src/core/finance.js";
import { random, seedNumber } from "../src/core/rng.js";
export const SIMULATION_STRATEGIES=Object.freeze({rest:'无为',random:'乱批',diligent:'尽职',greedy:'贪心'});
export function makeSimulationSchedule(s,pick,strategy="diligent") {
    if(!Object.hasOwn(SIMULATION_STRATEGIES,strategy))throw new Error('未知模拟策略');
    const action = strategy === "rest" ? -1 : strategy==='greedy'?0:pick(8),
      schedule = { 朝: null, 午: null, 夜: null };
    if (action >= 0 && action < 4) {
      // Court hearings retain three issues; a dedicated paperwork slot processes
      // six memorials at the existing two-energy cost.
      const ordered=strategy==='random'?s.memorials:[...s.memorials].sort((a,b)=>Number(!!b.urgent)-Number(!!a.urgent)||(a.due??Infinity)-(b.due??Infinity));
      const ms = ordered.slice(0, action < 2 ? 3 : 6);
      const available = {treasury:Math.max(0,s.nation.treasury-8),grain:s.nation.grain,privy:s.nation.privy};
      const selected=[];
      const decisions = {};
      for (const m of ms) {
        // Choose uniformly among affordable engine options, including hold.
        const approved=m.options.find(o=>o.id==='approve') || m.options[0];
        const choices = (strategy==='greedy'?[approved]:m.options).filter(o => o&&Object.keys(available).every(k=>Math.max(0,-(o.effects?.[k]||0))<=available[k]));
        if(!choices.length)continue;
        const option = choices[strategy==='greedy'?0:pick(choices.length)];
        decisions[m.id] = option.id;selected.push(m.id);
        for(const k of Object.keys(available))available[k]-=Math.max(0,-(option.effects?.[k]||0));
      }
      schedule.朝 = {
        kind: action < 2 ? "上朝" : "批折",
        memorials: selected,
        decisions,
      };
    }
    if (action === 4 && s.nation.treasury > 80) {
      const types=["整饬吏治", "赈灾", "减赋"],start=pick(3);
      const edictType=types.map((_,i)=>types[(start+i)%3]).find(type=>!edictBlock(s,type));
      if(!s.regency&&edictType)schedule.午={kind:'下旨',edictType,...(edictType==='减赋'?{province:s.nation.provinces[pick(s.nation.provinces.length)].id}:{})};
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
    if (strategy === "rest") for (const slot of ["朝", "午", "夜"]) schedule[slot] = {kind:"歇息"};
    return schedule;
}
export function simulate(years = 200, seed = "御极·两百年", options = {}) {
  const policy=options.strategy||'diligent',sums={morale:0,governance:0,virtue:0,prestige:0},squares={...sums};
  let sampleTurns=0,saturatedTurns=0,strongmanTurns=0,maxGrain=0,maxGrainFirst50=0,maxGrainLast50=0,maxGrainCapacity=0,maxAnnualGrainProduction=0,firstCollapseTurn=null;
  let strategy = seedNumber(seed),
    life = 0,
    s = initialTurn(createState({ seed: seed + "-" + life })),
    deaths = 0,
    collapse = 0,
    totalBirths = 0,
    childrenByReign = new Map(),
    events = 0,
    invasionCount = 0,
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
    const schedule = makeSimulationSchedule(s,pick,policy);
    // Mock chapters contain no narrative. Discard them after their state has been checked.
    s.history = [];
    s.volumes = [];
    s.ledger = [];
    const f = forecastTurn(s, schedule),
      before = s.stats.events,
      birthBefore = s.stats.births;
    invasionCount+=f.state.threads.filter(t=>t.type==="边警"&&t.born===f.state.turn&&!s.threads.some(old=>old.id===t.id)).length;
    options.onForecast?.(s,f);
    s = commitTurn(s, f, {});
    assertState(s);
    if(i<20*36){
      sampleTurns++;
      const values={morale:s.nation.morale,governance:s.nation.governance,virtue:s.emperor.virtue,prestige:s.emperor.prestige};
      if(values.morale>=95||values.governance>=95||values.virtue>=95)saturatedTurns++;
      for(const k of Object.keys(sums)){sums[k]+=values[k];squares[k]+=values[k]**2;}
    }
    if(f.entries.some(e=>e.source.endsWith('代批：皇权旁落')&&!e.source.includes('摄政')&&!e.source.includes('留守')))strongmanTurns++;
    const grainPeak=Math.max(s.nation.grain,...f.entries.filter(e=>e.path==='nation.grain').flatMap(e=>[e.before,e.after]));
    maxGrain=Math.max(maxGrain,grainPeak);
    maxGrainCapacity=Math.max(maxGrainCapacity,grainBudget(s).storageCapacity);
    maxAnnualGrainProduction=Math.max(maxAnnualGrainProduction,s.nation.provinces.reduce((n,p)=>n+p.pop*0.15*4,0));
    if(i<50*36)maxGrainFirst50=Math.max(maxGrainFirst50,grainPeak);
    if(i>=Math.max(0,years-50)*36)maxGrainLast50=Math.max(maxGrainLast50,grainPeak);
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
      if(s.ending.type==='亡国'&&firstCollapseTurn===null)firstCollapseTurn=completedTurns;
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
    strategy: policy,
    strategyLabel:SIMULATION_STRATEGIES[policy],
    sampleTurns,saturationRatio:sampleTurns?saturatedTurns/sampleTurns:0,
    nationalStddev:Object.fromEntries(Object.keys(sums).map(k=>[k,Math.sqrt(Math.max(0,squares[k]/(sampleTurns||1)-(sums[k]/(sampleTurns||1))**2))])),
    strongmanTurns,maxGrain,maxGrainFirst50,maxGrainLast50,maxGrainCapacity,maxAnnualGrainProduction,
    firstCollapseTurn,
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
    invasionCount,
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
