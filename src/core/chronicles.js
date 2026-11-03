import { fallbackBiography } from "./biography.js";
import { imperialTitles } from "./imperial-titles.js";
import { clone, reignId } from "./state.js";
import { clamp } from "./effects.js";
import { succession } from "./harem.js";
export const ACHIEVEMENTS = [
  ["accession", "初登大宝", (s) => s.turn >= 0],
  ["petition", "朱批初落", (s) => s.stats.petitions >= 1],
  ["ten", "十旬勤政", (s) => s.turn >= 10],
  ["hundred", "百旬御极", (s) => s.turn >= 100],
  ["decade", "十载春秋", (s) => s.turn >= 360],
  ["thirty", "三十年间", (s) => s.turn >= 1080],
  ["silver", "国有余财", (s) => s.nation.treasury >= 500],
  ["thousand", "千金入库", (s) => s.nation.treasury >= 1000],
  ["grain", "仓廪充盈", (s) => s.nation.grain >= 1000],
  ["people", "万民归心", (s) => s.nation.morale >= 80],
  ["clean", "吏治清明", (s) => s.nation.governance >= 80],
  ["power", "天威赫赫", (s) => s.emperor.prestige >= 85],
  ["virtue", "圣德昭彰", (s) => s.emperor.virtue >= 85],
  ["health", "圣躬康泰", (s) => s.emperor.health >= 95],
  ["edict", "诏令初颁", (s) => s.stats.edicts >= 1],
  ["edicts", "诏令有方", (s) => s.stats.edicts >= 10],
  ["project", "一事功成", (s) => s.projects.some((p) => p.done)],
  ["projects", "百废渐举", (s) => s.projects.filter((p) => p.done).length >= 5],
  ["victory", "边关奏捷", (s) => s.stats.warsWon >= 1],
  ["victories", "威服四境", (s) => s.stats.warsWon >= 3],
  ["tribute", "远人来朝", (s) => s.foreign.some((f) => f.status === "朝贡")],
  [
    "tributes",
    "四夷来宾",
    (s) =>
      s.foreign.filter((f) => ["朝贡", "婚盟"].includes(f.status)).length >= 4,
  ],
  ["banquet", "鹿鸣初宴", (s) => s.stats.banquets >= 1],
  ["banquets", "君臣相得", (s) => s.stats.banquets >= 10],
  ["post", "知人善任", (s) => s.stats.appointments >= 1],
  ["child", "麟儿初啼", (s) => s.harem.children.length >= 1],
  ["children", "儿女绕膝", (s) => s.harem.children.length >= 3],
  ["heir", "国本已定", (s) => !!s.harem.heir],
  ["goal", "心愿初遂", (s) => s.ambitions.some((a) => a.status === "达成")],
  [
    "goals",
    "宏愿圆满",
    (s) =>
      s.ambitions.filter((a) => a.kind === "宏愿" && a.status === "达成")
        .length === 2,
  ],
];
export function unlockAchievements(state) {
  const s = clone(state);
  for (const [id, title, condition] of ACHIEVEMENTS)
    if (!s.achievements.some((a) => a.id === id) && condition(s))
      s.achievements.push({ id, title, turn: s.turn });
  return s;
}
export function requestCompletion(state) {
  if (
    state.ambitions.filter((a) => a.kind === "宏愿" && a.status === "达成")
      .length !== 2
  )
    throw new Error("两件宏愿尚未全部达成");
  if (state.ending) return clone(state);
  const s = clone(state);
  s.ending = { type: "宏愿圆满", cause: "天下事已遂，自愿封卷" };
  return sealChronicle(s);
}
export function sealChronicle(state) {
  const s = clone(state);
  if (!s.ending) return s;
  const receipt = "chronicle:" + reignId(s);
  if (s.receipts.includes(receipt)) return s;
  const reignChildren = s.harem.children.filter(
    (c) => (c.fatherId || s.runId) === reignId(s),
  );
  const ownStats = Object.fromEntries(
    Object.entries(s.stats)
      .filter(([k, v]) => typeof v === "number")
      .map(([k, v]) => [k, v - (s.reign?.initialStats?.[k] || 0)]),
  );
  const ambition = s.ambitions.filter(
    (a) => a.kind === "宏愿" && a.status === "达成",
  ).length;
  let score = Math.round(
    clamp(
      s.nation.morale * 0.2 +
        s.nation.governance * 0.18 +
        s.emperor.virtue * 0.2 +
        s.emperor.prestige * 0.12 +
        Math.min(12, s.nation.treasury / 100) +
        ambition * 7 +
        Math.min(6, reignChildren.length) +
        Math.min(8, s.stats.warsWon * 3),
    ),
  );
  if (s.ending.type === "亡国") score = Math.min(score, 15);
  const tier =
      score >= 80
        ? "上"
        : score >= 60
          ? "中上"
          : score >= 40
            ? "中"
            : score >= 25
              ? "下"
              : "末",
    {posthumous,templeName}=imperialTitles(s,tier),
    succ =
      s.ending.type === "驾崩"
        ? s.ending.succession || succession(s)
        : s.ending.type === "禅位"
          ? succession(s)
          : s.ending.type === "亡国"
            ? { text: "国祚中绝，继统之事不书" }
            : { text: "宏愿既遂，自愿封卷，后事不书" };
  const r = {
    id: reignId(s),
    dynastyId: s.runId,
    ending: s.ending.type,
    cause: s.ending.cause,
    emperor: s.emperor.name,
    era: s.era.name,
    children: reignChildren.length,
    ambitions: clone(s.ambitions),
    stats: ownStats,
    reignTurns: s.turn - (s.reign?.accessionTurn || 0),
    score,
    tier,
    posthumous,
    templeName,
    succession: succ.text,
    biography: "",
    commentary: "",
  };
  r.biography = fallbackBiography(s,r);
  r.commentary =
    score >= 60
      ? "治道在于持久，得失俱在实录。愿后之继者，守已成之业，省未竟之失。"
      : "一朝兴替，非一言可蔽。省其钱粮与民心之记，成败之由自见。";
  s.chronicles.push(r);
  s.receipts.push(receipt);
  return s;
}
export function applyBiography(state, data) {
  const s = clone(state),
    r = s.chronicles.find((c) => c.id === reignId(s));
  if (!r) return s;
  const bio =
    typeof data.biography === "string" ? data.biography.slice(0, 800) : "";
  if (bio.length < 500) return s;
  const sentences = bio.split(/(?<=[。！？])/);
  r.biography = sentences
    .map((t) =>
      /谥|庙号/.test(t)
        ? "史馆定庙号" + r.templeName + "，谥" + r.posthumous + "。"
        : t,
    )
    .join("");
  r.commentary =
    typeof data.commentary === "string"
      ? data.commentary.slice(0, 500)
      : r.commentary;
  return s;
}
