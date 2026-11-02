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
    posthumous =
      s.ending.type === "亡国"
        ? "哀"
        : { 上: "文", 中上: "仁", 中: "平", 下: "厉", 末: "炀" }[tier],
    templeName =
      s.ending.type === "亡国"
        ? "哀宗"
        : { 上: "世宗", 中上: "仁宗", 中: "宪宗", 下: "厉宗", 末: "昏宗" }[
            tier
          ],
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
  const years = ((s.turn - (s.reign?.accessionTurn || 0)) / 36).toFixed(1),
    done = s.projects.filter((p) => p.done),
    titles =
      s.ambitions
        .filter((a) => a.status === "达成")
        .map((a) => a.title)
        .join("、") || "尚无全部达成之宏愿心事";
  let bio = `${s.dynasty}帝${s.emperor.name}，以${s.era.name}纪元。在位共${r.reignTurns}旬，折合${years}年。其初践祚，国库${(s.reign?.initialTreasury ?? 480).toFixed(1)}万两，六部承旧制而行。嗣后岁时递迁，所批奏报、所行诏令，皆有起居注可核，不以传闻增饰。至封卷时，国库实存${s.nation.treasury.toFixed(1)}万两，粮储${s.nation.grain.toFixed(1)}万石，内帑${s.nation.privy.toFixed(1)}万两。银粮各有所出入，政务因时推进，成败由当时吏治、朝局与天命相参而定。`;
  bio += `帝累计处置奏报${ownStats.petitions}本，颁布常规政令${ownStats.edicts}道，已竣政务${done.length}项，任免${ownStats.appointments}次，设宴${ownStats.banquets}次。边事方面，实录所记获胜战役${ownStats.warsWon}场。后宫所出皇嗣共${reignChildren.length}人，储位${s.harem.heir ? "已有所定" : "尚未预定"}。宏愿与心事之达成者为：${titles}。凡此皆据引擎台账，未结之工程不冒称其成，未遂之愿不以言辞补足。`;
  bio += `其朝终时，民心${s.nation.morale.toFixed(1)}，吏治${s.nation.governance.toFixed(1)}，皇威${s.emperor.prestige.toFixed(1)}，圣德${s.emperor.virtue.toFixed(1)}。四者各见施政之一端，不能以一端掩其余。${succ.text}。本朝终于${s.ending.type}，其由为${s.ending.cause}。史馆依实录与国势评定政绩${score}分，列${tier}档，定庙号${templeName}，谥${posthumous}。前后诏令、奏报与钱粮明细，悉存本朝起居注，后人可逐旬复核。`;
  if (bio.length < 500)
    bio +=
      "论帝王一生，功过终须落在民生与制度之间。观其所行，当并察朝臣奉行之实；观其所愿，当辨已经成就与仍在酝酿者。史官据册书其始终，所能详者不使遗失，所未见者不妄增一事。";
  while (bio.length < 500)
    bio +=
      "朝廷之事，不独系于御前一言。钱粮有册，官职有名，政务有期，故史官得据其迹而论之。未完成者记其在途，已结者载其得失；正文只叙经过，数目仍以台账为凭。此本纪保存本朝封卷之实，后续之事既未发生，亦不预为书写。";
  r.biography = bio.slice(0, 800);
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
