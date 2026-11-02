import { clone } from "./state.js";
export function applyWorld(state, data) {
  const s = clone(state),
    text = (v, n = 30) =>
      typeof v === "string"
        ? v.replace(/[<>\u0000-\u001f]/g, "").slice(0, n)
        : "";
  s.dynasty = text(data.dynasty) || s.dynasty;
  s.backstory =
    text(data.backstory, 1200) ||
    "先帝遗命，嗣皇帝即位。百官待诏，天下待新政。";
  const used = new Set();
  for (const [key, items] of [
    ["factions", s.court.factions],
    ["officials", s.court.officials],
    ["consorts", s.harem.consorts],
    ["foreign", s.foreign],
    ["provinces", s.nation.provinces],
  ]) {
    items.forEach((item, i) => {
      const source = data[key]?.[i];
      if (!source) return;
      const name = text(source.name);
      if (name && !used.has(name)) {
        item.name = name;
        used.add(name);
      }
      for (const f of [
        "demand",
        "family",
        "secret",
        "ruler",
        "description",
        "personality",
      ])
        if (source[f]) item[f] = text(source[f], 300);
      if (Array.isArray(item.life) && source.life)
        item.life = [text(source.life, 300)];
    });
  }
  s.dowager = text(data.dowager) || "慈宁太后";
  return s;
}
