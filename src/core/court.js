import { resolveMemorial } from "./events.js";
import { clone } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { roll, check } from "./rng.js";
export function strongman(s) {
  return s.emperor.prestige < 40 && s.court.factions.some((f) => f.power > 70);
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
  s = applyPackage(s, { governance: administration }, "月结：六部有司履职");
  s = applyPackage(
    s,
    { treasury: -theft, governance: theft > 2 ? -0.5 : 0 },
    "月结：衙门侵耗",
  );
  s.court.factions = s.court.factions.map((f) => ({
    ...f,
    power: clamp(f.power + (50 - s.emperor.prestige) * 0.006),
    attitude: clamp(f.attitude + (50 - f.attitude) * 0.015),
  }));
  return s;
}
export function courtYear(state) {
  let s = clone(state);
  s.court.officials = s.court.officials.map((o) =>
    o.alive
      ? {
          ...o,
          age: o.age + 1,
          health: clamp(o.health - (o.age > 65 ? 3 : 0)),
        }
      : o,
  );
  for (const o of s.court.officials)
    if (o.alive && o.health <= 0) {
      o.alive = false;
      o.post = null;
      for (const p of s.court.posts) if (p.holder === o.id) p.holder = null;
    }
  const year = 1 + Math.floor(s.turn / 36);
  if (year % 3 === 1 && s.court.officials.filter((o) => o.alive).length < 60) {
    for (
      let i = 0;
      i < 3 && s.court.officials.filter((o) => o.alive).length < 60;
      i++
    ) {
      const index = s.court.officials.length - 25,
        abilities = {};
      for (const a of ["政", "军", "才", "德", "忠", "权谋"]) {
        const r = roll(s, 40, 85);
        s = r.state;
        abilities[a] = r.value;
      }
      s.court.officials.push({
        id: "exam-" + year + "-" + i,
        name:
          [
            "徐",
            "邵",
            "潘",
            "傅",
            "高",
            "马",
            "罗",
            "吕",
            "余",
            "周",
            "钱",
            "陶",
          ][index % 12] + ["守礼", "明哲", "慎行"][Math.floor(index / 12) % 3],
        gender: "男",
        age: 25,
        post: null,
        faction: "f" + (index % 6),
        abilities,
        ambition: 35,
        greed: 15,
        favor: 55,
        health: 90,
        alive: true,
        inCapital: true,
        secret: "科场旧交尚存于京。",
        secretKnown: false,
        memory: [],
        life: [{ turn: s.turn, event: "登科候选" }],
      });
    }
  }
  return s;
}

export function appoint(state, action) {
  let s = clone(state);
  const post = s.court.posts.find((p) => p.id === action.post),
    person = s.court.officials.find((o) => o.id === action.person && o.alive);
  if (!post) throw new Error("请选择有效官职");
  const removing = ["remove", "demote", "retire", "jail"].includes(
    action.operation,
  );
  if (
    !removing &&
    (!person ||
      person.age < 25 ||
      person.abilities.政 < (post.rank === 1 ? 40 : 25))
  )
    throw new Error("此人资历或能力不符任职要求");
  if (strongman(s)) {
    const r = roll(s, 1, 20);
    s = r.state;
    if (r.value < 8)
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
    s.court.officials.find((o) => o.id === person.id).post = post.id;
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
  s.stats.appointments++;
  return {
    state: s,
    note: removing ? "处分 " + old?.name : person.name + " 出任 " + post.title,
  };
}
export function talkAttempt(state, personId, line) {
  if (
    state.talks.filter((t) => t.person === personId && t.turn === state.turn)
      .length >= 3
  )
    throw new Error("本旬面谈已三轮，请待下旬再议");
  let s = clone(state);
  const person =
    s.court.officials.find((o) => o.id === personId && o.alive) ||
    s.harem.consorts.find((o) => o.id === personId) ||
    s.foreign.find((o) => o.id === personId);
  if (!person) throw new Error("此人不在名册");
  const post = s.court.posts.find((p) => p.holder === personId),
    isOfficial = !!person.abilities;
  const requested = Number(line.match(/(\d+(?:\.\d+)?)\s*万?两/)?.[1] || 0),
    asking = /拨|钱|银|挪|给|赏|借/.test(line);
  const used = state.talks
    .filter((t) => t.person === personId && t.turn === state.turn)
    .reduce((n, t) => n + (t.effects?.privy || 0), 0);
  const cap =
    isOfficial && post?.tags.includes("管钱")
      ? Math.min(
          Math.max(0, 20 - used),
          Math.floor(s.nation.treasury * 0.03),
          Math.floor((person.favor || 0) / 3),
        )
      : 0;
  const r = roll(s);
  s = r.state;
  const kind = /威吓|问罪|斩|严惩/.test(line)
    ? "威吓"
    : /试探|秘密|暗查/.test(line)
      ? "试探"
      : "说服";
  const verdict = check(
    s.emperor.talents[kind === "说服" ? "魅力" : "权谋"],
    r.value,
    "一般",
    person.abilities?.才 || person.scheming || 50,
    (s.emperor.mood < 20 ? -10 : 0) +
      (person.favor || person.attitude || 0) / 5,
  );
  const denied = asking && (requested > cap || cap === 0),
    effects =
      !denied && verdict.success && asking
        ? {
            treasury: -Math.min(requested, cap),
            privy: Math.min(requested, cap),
          }
        : {};
  if (verdict.success && !denied && kind === "试探" && isOfficial)
    s.court.officials.find((o) => o.id === personId).secretKnown = true;
  s = applyPackage(s, effects, "御前面谈：职权内拨款");
  s = applyPackage(
    s,
    { official: { id: personId, favor: verdict.success ? 2 : -1 } },
    "御前面谈：" + kind,
  );
  const result = {
    turn: s.turn,
    id: "talk-" + s.turn + "-" + s.talks.length,
    person: personId,
    line: String(line).slice(0, 500),
    die: r.value,
    kind,
    success: verdict.success && !denied,
    denied,
    cap,
    effects,
    reply: denied
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
      (id) => !state.court.officials.some((o) => o.id === id && o.alive),
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
  for (const id of guests)
    s = applyPackage(s, { official: { id, favor: 5 } }, "宴席宾客礼遇");
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
    const c = check(
      s.emperor.talents.权谋,
      r.value,
      "困难",
      target.abilities.才,
    );
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
  return o.alive && !o.jailed && !o.retired && o.inCapital !== false;
}
export function factionOptionScore(faction, memorial, option) {
  const d = faction.demand,
    e = option.effects || {},
    topic = memorial.type + " " + memorial.title + " " + memorial.request;
  let score = (e.faction?.[faction.id] || 0) * 3;
  const support = /准|拨|增|查|赈|开仓|奖|册/.test(option.label),
    reject = /驳|压下|自筹|放任|暂息/.test(option.label);
  if (/清议|纳谏|清廉|吏治|名节/.test(d))
    score +=
      (e.governance || 0) * 4 +
      (e.virtue || 0) * 2 +
      (e.morale || 0) +
      (/贪腐|弹劾|赈|经筵/.test(topic) ? (support ? 4 : reject ? -4 : 0) : 0);
  if (/军|兵|封赏|勋/.test(d))
    score +=
      (e.prestige || 0) +
      (/军|边|兵|报捷|封赏/.test(topic) ? (support ? 7 : reject ? -6 : 0) : 0) -
      (e.governance || 0);
  if (/钱粮|地方|自主/.test(d))
    score +=
      -(e.treasury || 0) * 0.3 +
      (e.morale || 0) +
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
export function proxyMemorial(state) {
  if (!strongman(state) || !state.memorials.length)
    return { state: clone(state), note: null };
  const faction = state.court.factions
    .filter((f) => f.power > 70)
    .sort((a, b) => b.power - a.power)[0];
  const minister = state.court.officials
    .filter((o) => inCapital(o) && o.faction === faction.id)
    .sort(
      (a, b) => b.abilities.权谋 + b.ambition - (a.abilities.权谋 + a.ambition),
    )[0];
  if (!minister) return { state: clone(state), note: null };
  const choices = state.memorials
    .flatMap((m) =>
      m.options
        .filter(
          (o) =>
            o.id !== "hold" &&
            state.nation.treasury >= Math.max(0, -(o.effects?.treasury || 0)),
        )
        .map((o) => ({ m, o, score: factionOptionScore(faction, m, o) })),
    )
    .sort((a, b) => b.score - a.score);
  if (!choices.length) return { state: clone(state), note: null };
  const { m, o } = choices[0],
    result = resolveMemorial(state, m.id, o.id, "", minister.name + "代批");
  return {
    state: applyPackage(
      result.state,
      { prestige: -0.5 },
      minister.name + "代批：皇权旁落",
    ),
    note: minister.name + "代批：" + m.title + " · " + o.label,
    officialId: minister.id,
    memorialId: m.id,
    optionId: o.id,
  };
}
