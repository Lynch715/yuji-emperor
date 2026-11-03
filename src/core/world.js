import { uniqueName } from "./names.js";
import { clone } from "./state.js";
export function applyWorld(state, data) {
  let s = clone(state);
  const
    text = (v, n = 30) =>
      typeof v === "string"
        ? v.replace(/[<>\u0000-\u001f]/g, "").slice(0, n)
        : "";
  s.dynasty = text(data.dynasty) || s.dynasty;
  s.backstory =
    text(data.backstory, 1200) ||
    "先帝遗命，嗣皇帝即位。百官待诏，天下待新政。";
  s.court.officials=s.court.officials.map(o=>structuredClone(o));
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
        if(["officials","consorts"].includes(key)){const named=uniqueName(s,{names:[name],excludeId:item.id});s=named.state;item.name=named.name;}else item.name=name;
        used.add(item.name);
      }
      for (const f of [
        "demand",
        "family",
        "secret",
        "ruler",
        "description",
        "personality",
      ])
        if (source[f]) {
          if(f==="ruler"){const named=uniqueName(s,{names:[text(source[f],30)],excludeId:item.id});s=named.state;item[f]=named.name;}
          else item[f] = text(source[f], 300);
        }
      if (Array.isArray(item.life) && source.life)
        item.life = [text(source.life, 300)];
    });
  }
  for(const p of s.court.posts) if(p.provinceId) p.title=s.nation.provinces.find(z=>z.id===p.provinceId).name+"巡抚";
  s.dowager=null;const named=uniqueName(s,[text(data.dowager)||"慈宁太后"]);s=named.state;s.dowager=named.name;
  return s;
}
