export function numericSnapshot(s) {
  const out = {};
  const walk = (value, path) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      out[path] = value;
    } else if (value && typeof value === "object")
      for (const [k, v] of Object.entries(value)) {
        if (
          [
            "lifespan",
            "aptitude",
            "greed",
            "secret",
            "secretKnown",
            "memory",
            "memoryHydrated",
            "gifts",
            "growth",
            "born",
            "due",
            "conceived",
          ].includes(k)
        )
          continue;
        walk(v, path + "." + k);
      }
  };
  for (const root of ["emperor", "nation"]) walk(s[root], root);
  const list = (items, prefix) => {
    for (const x of items) {
      for (const [k, v] of Object.entries(x)) {
        if (
          [
            "id",
            "aptitude",
            "greed",
            "secret",
            "secretKnown",
            "memory",
            "memoryHydrated",
            "gifts",
            "born",
            "due",
            "conceived",
          ].includes(k)
        )
          continue;
        walk(v, prefix + "." + x.id + "." + k);
      }
    }
  };
  // Canonical paths match effect packages. Replace index-based province paths.
  for (const k of Object.keys(out))
    if (k.startsWith("nation.provinces.")) delete out[k];
  list(s.nation.provinces, "province");
  list(s.court.factions, "faction");
  list(s.court.officials, "official");
  list(s.harem.consorts, "consort");
  list(s.harem.children, "child");
  list(s.foreign, "foreign");
  list(s.projects, "project");
  list(s.campaigns, "campaign");
  return out;
}
export function auditChanges(
  before,
  after,
  entries,
  source = "本旬引擎结算：人物、政务与岁时变化",
) {
  const result = [...entries],
    totals = new Map(),
    parents = new Set();
  for (const e of entries) {
    totals.set(e.path, (totals.get(e.path) || 0) + e.after - e.before);
    parents.add(e.path.slice(0, e.path.lastIndexOf(".")));
  }
  const excluded = new Set([
    "lifespan",
    "aptitude",
    "greed",
    "secret",
    "secretKnown",
    "memory",
    "memoryHydrated",
    "gifts",
    "growth",
    "born",
    "due",
    "conceived",
    "id",
  ]);
  const visit = (old, current, path) => {
    if (old === current) return;
    const adjust = parents.has(path);
    for (const [key, value] of Object.entries(current || {})) {
      if (excluded.has(key)) continue;
      if (typeof value === "number" && Number.isFinite(value)) {
        const prior = typeof old?.[key] === "number" ? old[key] : path.endsWith(".relations") ? 50 : 0;
        if (value === prior && !adjust) continue;
        const full = path + "." + key,
          logged = totals.get(full) || 0,
          delta = value - prior;
        if (Math.abs(delta - logged) > 1e-7)
          result.push({
            turn: after.turn,
            path: full,
            before: prior + logged,
            after: value,
            delta: Math.round((delta - logged) * 10000) / 10000 || 0,
            source,
          });
      } else if (value && typeof value === "object")
        visit(old?.[key], value, path + "." + key);
    }
  };
  visit(before.emperor, after.emperor, "emperor");
  const { provinces, ...nation } = after.nation;
  visit(before.nation, nation, "nation");
  for (const [old, rows, prefix] of [
    [before.nation.provinces, provinces, "province"],
    [before.court.factions, after.court.factions, "faction"],
    [before.court.officials, after.court.officials, "official"],
    [before.harem.consorts, after.harem.consorts, "consort"],
    [before.harem.children, after.harem.children, "child"],
    [before.foreign, after.foreign, "foreign"],
    [before.projects, after.projects, "project"],
    [before.campaigns, after.campaigns, "campaign"],
  ]) {
    const prior = new Map(old.map((o) => [o.id, o]));
    for (const row of rows)
      visit(prior.get(row.id), row, prefix + "." + row.id);
  }
  return result;
}
