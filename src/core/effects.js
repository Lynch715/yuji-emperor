import { clone } from "./state.js";
export function clamp(n, low = 0, high = 100) {
  return Math.min(high, Math.max(low, Number.isFinite(n) ? n : 0));
}
export function applyEffects(state, effects = {}, source = "引擎结算") {
  const s = clone(state),
    entries = [];
  const set = (obj, key, delta, path, max = 100) => {
    if (typeof delta !== "number" || !Number.isFinite(delta)) return;
    const old = obj[key];
    obj[key] = clamp(old + delta, 0, max);
    if (obj[key] !== old)
      entries.push({
        path,
        before: old,
        after: obj[key],
        delta: Math.round((obj[key] - old) * 100) / 100,
        source,
      });
  };
  for (const f of ["treasury", "privy", "grain", "arrears"])
    set(s.nation, f, effects[f], "nation." + f, 1000000);
  for (const f of ["morale", "governance"])
    set(s.nation, f, effects[f], "nation." + f);
  for (const f of ["health", "mood", "prestige", "virtue"])
    set(s.emperor, f, effects[f], "emperor." + f);
  if (effects.province) {
    const p = s.nation.provinces.find((p) => p.id === effects.province.id);
    if (p)
      for (const f of ["morale", "disaster"])
        set(p, f, effects.province[f], "province." + p.id + "." + f);
  }
  if (effects.faction)
    for (const [id, n] of Object.entries(effects.faction)) {
      const f = s.court.factions.find((f) => f.id === id);
      if (f) set(f, "attitude", n, "faction." + id + ".attitude");
    }
  if (effects.official) {
    const o = s.court.officials.find(
      (o) => o.id === effects.official.id && o.alive,
    );
    if (o)
      set(o, "favor", effects.official.favor, "official." + o.id + ".favor");
  }
  if (effects.thread) {
    const t = s.threads.find((t) => t.id === effects.thread.id);
    if (t && t.stage !== "结束") {
      t.stage = effects.thread.stage;
      t.result = String(effects.thread.result || "");
      t.updated = s.turn;
    }
  }
  s.ledger.push(...entries.map((e) => ({ ...e, turn: s.turn })));
  return { state: s, entries };
}
export function applyPackage(state, effects, source) {
  return applyEffects(state, effects, source).state;
}
export function growTalent(state, talent, amount = 1) {
  const s = clone(state),
    left = 3 - (s.emperor.growth[talent] || 0);
  if (left > 0) {
    const inc = Math.min(left, amount, 100 - s.emperor.talents[talent]);
    s.emperor.talents[talent] += inc;
    s.emperor.growth[talent] = (s.emperor.growth[talent] || 0) + inc;
    s.ledger.push({
      turn: s.turn,
      path: "emperor.talents." + talent,
      delta: inc,
      before: s.emperor.talents[talent] - inc,
      after: s.emperor.talents[talent],
      source: "经世历练（每年每才最多 +3）",
    });
  }
  return s;
}
