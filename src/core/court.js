import {developmentChoiceBlock} from './development-choices.js';
import { freedomRules, adjudicate } from "./freedom.js";
import { resolveMemorial,addEvent } from "./events.js";
import { clone } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { roll, check } from "./rng.js";
import {factionPowers} from './politics.js';
import { campaignChoiceBlock } from './campaign-rules.js';
import { TEXT_LIMITS, talkMode } from './text.js';
export function strongmanCandidate(s){
 const candidates=s.court.officials.filter(o=>o.alive&&o.health>0&&!o.retired&&!o.jailed&&s.court.posts.some(p=>p.holder===o.id&&p.id===o.post));
 return candidates.map(o=>({o,power:s.court.factions.find(f=>f.id===o.faction)?.power||0}))
  .filter(({o,power})=>s.emperor.prestige<40&&power>70||o.ambition*power*(100-s.emperor.prestige)>150000)
  .sort((a,b)=>b.o.ambition*b.power-a.o.ambition*a.power)[0]?.o || null;
}
export function strongman(s) {
  return !!strongmanCandidate(s);
}
export function courtMonth(state) {
  let s = clone(state);
  const theft = s.court.posts
    .filter((p) => p.holder && p.tags.includes("管钱"))
    .reduce(
      (sum, p) =>
        sum +
        (s.court.officials.find((o) => o.id === p.holder)?.greed || 0) / 100,
      0,
    );
  const administration = s.court.posts
    .filter((p) =>
      [
        "吏部尚书",
        "户部尚书",
        "工部尚书",
        "刑部尚书",
        "礼部尚书",
        "兵部尚书",
      ].includes(p.title),
    )
    .reduce((n, p) => {
      const o = s.court.officials.find(
        (o) => o.id === p.holder && inCapital(o),
      );
      return n + (o ? Math.max(0, o.abilities.政 - o.greed / 2) / 150 : 0);
    }, 0);
  s = applyPackage(s, { governance: (50+administration*5-theft*2-s.nation.governance)*0.03 }, "月结：六部履职与贪墨决定治理回归");
  s = applyPackage(
    s,
    { treasury: -theft, governance: theft > 2 ? -0.5 : 0 },
    "月结：衙门侵耗",
  );
  s.court.factions = s.court.factions.map((f) => ({
    ...f,
    powerModifier:(f.powerModifier||0)*0.98,
    attitude: clamp(f.attitude + (50 - f.attitude) * 0.015),
  }));
  s.court.factions=factionPowers(s);
  return s;
}
export function courtYear(state) {
  let s = clone(state);
  for(const original of s.court.officials.filter(o=>o.alive)){
    let o=s.court.officials.find(o=>o.id===original.id);o.age++;
    let died=o.health<=0;const chance=officialDeathChance(o.age);
    if(chance){const r=roll(s,1,10000);s=r.state;died ||= r.value<=chance*10000;o=s.court.officials.find(o=>o.id===original.id);}
    if(died){
      o.alive = false;
      o.health=0;
      o.post = null;
      for (const p of s.court.posts) if (p.holder === o.id) p.holder = null;
      o.life.push({turn:s.turn,event:'年老病故'});
    } else if(o.age>=70&&!o.retired&&!o.jailed&&o.post&&!s.threads.some(t=>t.type==='致仕'&&t.actors.includes(o.id))){
      const post=s.court.posts.find(p=>p.holder===o.id);
      s=addEvent(s,'致仕',o.name+'请致仕','年届七旬，乞骸骨归里',[
        {label:'准予致仕',effects:{virtue:0.5}},{label:'温旨留任',effects:{prestige:0.2}},
      ],[o.id],post?.provinceId||null);
      const m=s.memorials.at(-1);if(inCapital(o)||post?.provinceId){m.from=o.name;m.fromId=o.id;m.fromPost=s.postNames?.[post?.id]||post?.title||'原任官';m.fromRole='上奏';}
    }
  }
  for(const p of s.nation.provinces)p.governor=s.court.posts.find(o=>o.provinceId===p.id)?.holder||null;
  s.court.factions=factionPowers(s);
  return s;
}
export function officialDeathChance(age){return age>=80?0.15:age>=70?0.06:age>=60?0.02:0;}

export function appoint(state, action) {
  let s = clone(state),concession=null;
  const post = s.court.posts.find((p) => p.id === action.post),
    person = s.court.officials.find((o) => o.id === action.person && o.alive);
  if (!post) throw new Error("请选择有效官职");
  const removing = ["remove", "demote", "retire", "jail"].includes(
    action.operation,
  );
  if (
    !removing &&
    (!person ||
      person.age < freedomRules(s).appointmentAge ||
      person.abilities.政 < (post.rank === 1 ? freedomRules(s).firstRankTalent : freedomRules(s).otherTalent))
  )
    throw new Error("此人资历或能力不符任职要求");
  if (removing && !post.holder) throw new Error("此职空缺");
  if (!removing && person.jailed && !action.pardon) throw new Error("此人仍在下狱，须先赦免方可起用");
  if (strongman(s)) {
    const r = roll(s, 1, 20);
    s = r.state;
    const outcome=adjudicate(s,{success:r.value>=8},person?.id);s=outcome.state;if(outcome.verdict.partial)concession={partial:true,cost:outcome.verdict.cost};
    if (!outcome.verdict.success)
      return {
        state: applyPackage(s, { prestige: -1 }, "任命被权臣拦截"),
        note: "权臣封还任命，未能落实",
      };
  }
  const old = s.court.officials.find((o) => o.id === post.holder && o.alive);
  if (old) {
    s = applyPackage(
      s,
      { official: { id: old.id, favor: -20 }, faction: { [old.faction]: -12 } },
      "罢免 " + old.name,
    );
    s.court.officials.find((o) => o.id === old.id).post = null;
    s.retaliations.push({
      id: "ret-" + s.turn + "-" + old.id,
      faction: old.faction,
      due: s.turn + 3 + (old.ambition % 6),
      done: false,
    });
  }
  const targetPost = s.court.posts.find((p) => p.id === post.id);
  if (removing) {
    targetPost.holder = null;
    if (old) {
      const changed = s.court.officials.find((o) => o.id === old.id);
      changed.retired = action.operation === "retire";
      changed.jailed = action.operation === "jail";
      changed.life.push({ turn: s.turn, event: action.operation });
      if (action.operation === "demote") {
        const lesser = s.court.posts.find(
          (p) => !p.holder && p.rank > post.rank,
        );
        if (lesser) {
          lesser.holder = old.id;
          changed.post = lesser.id;
        }
      }
    }
  } else {
    for (const p of s.court.posts) if (p.holder === person.id) p.holder = null;
    targetPost.holder = person.id;
    const restored=s.court.officials.find((o)=>o.id===person.id);
    restored.post=post.id;restored.jailed=false;restored.retired=false;
    s.court.officials.find((o) => o.id === person.id).inCapital =
      !/巡抚|总兵/.test(post.title);
    s = applyPackage(
      s,
      {
        faction: { [person.faction]: 6 },
        official: { id: person.id, favor: 10 },
      },
      "任命 " + person.name,
    );
  }
  for (const province of s.nation.provinces) province.governor=s.court.posts.find(p=>p.provinceId===province.id)?.holder || null;
  s.stats.appointments++;
  s.court.factions=factionPowers(s);
  return {
    state: s,
    note: removing ? "处分 " + old?.name : person.name + " 出任 " + post.title,
    ...(concession||{}),
  };
}
export function talkAttempt(state, personId, line, structured = false) {
  let s = clone(state);
  const person =
    s.court.officials.find((o) => o.id === personId && o.alive) ||
    s.harem.consorts.find((o) => o.id === personId) ||
    s.foreign.find((o) => o.id === personId);
  if (!person||person.health!==undefined&&person.health<=0||person.jailed||person.retired)throw new Error('此人当前无法召见');
  const post = s.court.posts.find((p) => p.holder === personId),
    isOfficial = !!person.abilities;
  const requested = Number(line.match(/(\d+(?:\.\d+)?)\s*万?两/)?.[1] || 0),
    mode=talkMode(line,structured),asking=!structured&&mode==='拨款';
  const receipts=new Set();let used=0;
  for(const t of state.talks.filter(t=>t.person===personId&&t.turn===state.turn)){
    if(!t.intentResults?.length){used+=t.effects?.privy||0;continue;}
    for(const r of t.intentResults)if(!receipts.has(r.id)&&r.type==='allocate'&&['success','partial'].includes(r.status)&&r.actual.source==='treasury'){
      receipts.add(r.id);used+=r.actual.treasurySpent??r.actual.amount??0;
    }
  }
  const cap =
    s.settings.freedom==='free'&&s.v>=26?Number.MAX_SAFE_INTEGER:s.settings.freedom==='free'?s.nation.treasury:isOfficial && post?.tags.includes("管钱")
      ? Math.min(Math.max(0,20*freedomRules(s).talkMultiplier-used),Math.floor(s.nation.treasury*0.03)*freedomRules(s).talkMultiplier,Math.floor((person.favor||0)/3)*freedomRules(s).talkMultiplier,s.nation.treasury):0;
  const kind=mode;
  const prior=!structured&&state.talks.find(t=>t.person===personId&&t.turn===state.turn&&t.kind===kind&&
    (t.mode==='check'||t.mode===undefined&&Number.isFinite(t.die)));
  const mechanical=!['闲谈','议事'].includes(kind),r=mechanical&&!prior?roll(s):{state:s,value:prior?.die??null};
  s=r.state;
  let verdict=prior?{success:prior.success}:!mechanical?{success:true}:check(
    s.emperor.talents[['说服','拨款'].includes(kind) ? "魅力" : "权谋"],
    r.value,
    "一般",
    person.abilities?.才 || person.scheming || 50,
    (s.emperor.mood < 20 ? -10 : 0) +
      (person.favor || person.attitude || 0) / 5,
  );
  const outcome=!mechanical||prior?{state:s,verdict}:adjudicate(s,verdict,personId);s=outcome.state;verdict=outcome.verdict;
  const denied = asking && (requested > cap || cap === 0),
    effects =
      !prior && !denied && verdict.success && asking
        ? {
            treasury: -Math.min(requested, cap),
            privy: Math.min(requested, cap),
          }
        : {};
  if (verdict.success && !denied && kind === "试探" && isOfficial)
    s.court.officials.find((o) => o.id === personId).secretKnown = true;
  s = applyPackage(s, effects, "御前面谈：职权内拨款");
  if(mechanical&&!prior)s = applyPackage(
    s,
    { official: { id: personId, favor: verdict.success ? 2 : -1 } },
    "御前面谈：" + kind,
  );
  const result = {
    turn: s.turn,
    id: "talk-" + s.turn + "-" + s.talks.length,
    person: personId,
    line: String(line).slice(0, TEXT_LIMITS.talk),
    die: r.value,
    kind,
    mode:structured?'action':mechanical?'check':'chat',
    reused:!!prior,
    success: verdict.success && !denied,
    denied,
    cap,
    effects,
    ...(verdict.partial?{partial:true,cost:verdict.cost}:{}),
    reply:!mechanical&&!structured?'臣在，陛下请讲。':prior?'此事方才已议，臣仍照先前所奏办理。':denied
      ? "臣无此职权，请容臣回去议。"
      : verdict.success
        ? "臣谨遵圣意，当在职权内尽力。"
        : "臣有难处，此事尚难奉行。",
    innerThought:
      s.emperor.talents.魅力 >= 60
        ? (person.favor ?? person.attitude ?? 50) >= 60
          ? "圣眷尚厚，回话须顾全情面。" +
            (s.court.factions.find((f) => f.id === person.faction)?.demand || person.demand || "此事须从长计议。")
          : "此事牵涉自身进退，须谨慎回话。"
        : "",
  };
  s.interimEntries = [
    ...(state.interimEntries || []),
    ...s.ledger.slice(state.ledger.length),
  ];
  s.talks.push(result);
  s.revision++;
  return { state: s, result };
}
export function banquet(state, action) {
  const guests = [...new Set(action.guests || [])];
  if (
    guests.length < 2 ||
    guests.length > 6 ||
    guests.some(
      (id) => !state.court.officials.some((o) => o.id === id && inCapital(o)),
    )
  )
    throw new Error("宴请须选择 2–6 位在京官员");
  const cost = { 俭: 2, 常: 5, 盛: 12 }[action.cost || "常"];
  if (state.nation.privy < cost) throw new Error("内帑不足以置办宴席");
  let s = applyPackage(
    state,
    { privy: -cost, mood: 5 },
    "宴请：" + (action.type || "君臣宴"),
  );
  for (const id of guests){
    const o=s.court.officials.find(o=>o.id===id),gain={俭:2,常:4,盛:7}[action.cost||'常']*(s.turn-(o.banquetTurn??-1000000)<6?0.5:1);
    s = applyPackage(s, { official: { id, favor: gain } }, "宴席宾客礼遇");
    s.court.officials.find(o=>o.id===id).banquetTurn=s.turn;
  }
  const r = roll(s);
  s = r.state;
  let event = [
    "席间无事，君臣尽欢",
    "酒后失言，言官当席记下",
    "宾客私语，两家暂释前嫌",
    "乐舞既毕，宾客进诗",
  ][r.value % 4];
  if (action.type === "鸿门宴") {
    const target = s.court.officials.find((o) => o.id === guests[0]);
    let c = check(
      s.emperor.talents.权谋,
      r.value,
      "困难",
      target.abilities.才,
    );
    const outcome=adjudicate(s,c,target?.id);s=outcome.state;c=outcome.verdict;
    s = applyPackage(
      s,
      {
        prestige: c.success ? 4 : -3,
        official: { id: target.id, favor: c.success ? -10 : -20 },
      },
      "鸿门宴判定",
    );
    event = c.success ? "鸿门设宴，宾客低头服软" : "鸿门设宴，反遭席间诘问";
  }
  s.stats.banquets++;
  return { state: s, note: event };
}

// A minister's vote follows the issue and his faction's stated interest, not loyalty to the throne.
export function inCapital(o) {
  return o.alive && o.health > 0 && !o.jailed && !o.retired && o.inCapital !== false;
}
export function factionOptionScore(faction, memorial, option) {
  const d = faction.demand,
    e = option.effects || {},
    topic = memorial.type + " " + memorial.title + " " + memorial.request;
  let score = (e.faction?.[faction.id] || 0) * 3;
  const localMorale=(e.morale||0)+(e.province?.morale||0);
  const support = /准|拨|增|查|赈|开仓|奖|册/.test(option.label),
    reject = /驳|压下|自筹|放任|暂息/.test(option.label);
  if (/清议|纳谏|清廉|吏治|名节/.test(d))
    score +=
      (e.governance || 0) * 4 +
      (e.virtue || 0) * 2 +
      localMorale +
      (/贪腐|弹劾|赈|经筵/.test(topic) ? (support ? 4 : reject ? -4 : 0) : 0);
  if (/军|兵|封赏|勋/.test(d))
    score +=
      (e.prestige || 0)+(e.army?.readiness||0)*1.5-(e.army?.threat||0) +
      (/军|边|兵|报捷|封赏/.test(topic) ? (support ? 7 : reject ? -6 : 0) : 0) -
      (e.governance || 0);
  if (/钱粮|地方|自主/.test(d))
    score +=
      -(e.treasury || 0) * 0.3 +
      localMorale +
      (/地方|州|赈|河/.test(topic) ? (support ? 4 : reject ? -3 : 0) : 0);
  if (/家族|恩荫|宗藩|封地|宗室/.test(d))
    score +=
      (/请封|宗室|恩荫|册|立储/.test(topic)
        ? support
          ? 7
          : reject
            ? -6
            : 0
        : 0) + (e.prestige || 0);
  if (/亲近|信任|宠/.test(d))
    score += (e.prestige || 0) * 2 + (e.privy || 0) - (e.governance || 0) * 2;
  if (/节俭|国库|税/.test(d)) score += (e.treasury || 0) * 0.5;
  return score;
}
export function courtDebate(state, memorials) {
  let s = clone(state),
    pool = s.court.officials.filter(inCapital),
    speakers = [];
  const countRoll = roll(s, 2, 3);
  s = countRoll.state;
  for (
    let i = 0;
    i < Math.min(countRoll.value, s.court.officials.filter(inCapital).length);
    i++
  ) {
    const weights = pool.map((o) =>
      Math.max(0, s.court.factions.find((f) => f.id === o.faction)?.power || 0),
    );
    const total = weights.reduce((a, b) => a + b, 0),
      r = roll(s, 1, 1000000);
    s = r.state;
    let point = ((r.value - 1) / 1000000) * (total || pool.length),
      index = pool.length - 1;
    for (let j = 0; j < pool.length; j++) {
      point -= total ? weights[j] : 1;
      if (point < 0) {
        index = j;
        break;
      }
    }
    const [o] = pool.splice(index, 1),
      f = s.court.factions.find((f) => f.id === o.faction);
    speakers.push({
      officialId: o.id,
      name: o.name,
      faction: o.faction,
      weight: weights[index],
      opinions: memorials.map((m) => {
        const choices = m.options
          .filter((opt) => opt.id !== "hold")
          .map((opt) => ({ opt, score: factionOptionScore(f, m, opt) }))
          .sort((a, b) => b.score - a.score);
        const best = choices[0];
        return {
          memorialId: m.id,
          type: m.type,
          stance: best && best.opt === m.options[0] ? "赞成" : "反对",
          optionId: best?.opt.id,
          reason: f.demand,
        };
      }),
    });
  }
  return { state: s, speakers };
}
export function accountability(state, target, die) {
  const power =
    state.court.factions.find((f) => f.id === target.faction)?.power || 0;
  const opposition = target.abilities.权谋 + power / 10;
  return {
    ...check(
      state.emperor.talents.权谋,
      die,
      "一般",
      opposition,
      state.emperor.mood < 20 ? -10 : 0,
    ),
    opposition,
  };
}
export function proxyMemorial(state, options = {}) {
  if (!options.minister && !strongman(state) || !state.memorials.length)
    return { state: clone(state), note: null };
  if(!options.minister&&state.turn-(state.court.proxyTurn??-1000000)<3)return {state:clone(state),note:null};
  const boss=strongmanCandidate(state);
  const minister = options.minister || (inCapital(boss||{})?boss:state.court.officials.filter(o=>inCapital(o)&&o.faction===boss?.faction&&state.court.posts.some(p=>p.holder===o.id&&p.id===o.post)).sort((a,b)=>b.abilities.权谋-a.abilities.权谋)[0]);
  if (!minister) return { state: clone(state), note: null };
  const faction=state.court.factions.find(f=>f.id===minister.faction)||state.court.factions[0];
  const choices = state.memorials
    .flatMap((m) =>
      m.options
        .filter(
          (o) =>
            o.id !== "hold" &&
            !campaignChoiceBlock(state,m,o) && !developmentChoiceBlock(state,o) &&
            ["treasury","privy","grain"].every(k=>state.nation[k]>=Math.max(0,-(o.effects?.[k]||0))),
        )
        .map((o) => ({ m, o, score: factionOptionScore(faction, m, o) })),
    )
    .sort((a, b) => b.score - a.score);
  if (!choices.length) return { state: clone(state), note: null };
  const { m, o } = choices[0],
    result = resolveMemorial(state, m.id, o.id, "", minister.name + (options.label || "代批"));
  if(!options.minister)result.state.court.proxyTurn=state.turn;
  return {
    state: applyPackage(
      result.state,
      { prestige: options.minister ? 0 : -0.5 },
      minister.name + (options.label || "代批") + "：皇权旁落",
    ),
    note: minister.name + (options.label || "代批") + "：" + m.title + " · " + o.label,
    officialId: minister.id,
    memorialId: m.id,
    optionId: o.id,
  };
}
// 票拟：首辅（或在京最高职官员）按本派立场拟出的建议批答。只给建议，不改状态；
// 只选国库/内帑/粮储付得起的选项，不选“留中”。
export function cabinetDraft(state, memorial) {
  if (!memorial?.options?.length) return null;
  const minister = state.court.posts
    .map((p) => state.court.officials.find((o) => o.id === p.holder))
    .find((o) => o && inCapital(o));
  if (!minister) return null;
  const faction = state.court.factions.find((f) => f.id === minister.faction) || state.court.factions[0];
  const affordable = (o) => ["treasury", "privy", "grain"].every(
    (k) => (state.nation[k] || 0) >= Math.max(0, -(o.effects?.[k] || 0)));
  const ranked = memorial.options
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => o.id !== "hold" && affordable(o) && !campaignChoiceBlock(state,memorial,o)&&!developmentChoiceBlock(state,o))
    .map((x) => ({ ...x, score: faction ? factionOptionScore(faction, memorial, x.o) : 0 }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  if (!ranked.length) return null;
  return { option: ranked[0].o.id, label: ranked[0].o.label, minister: minister.name, faction: faction?.name || "" };
}
