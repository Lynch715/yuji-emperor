import { clone } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { roll, check } from "./rng.js";
import { addEvent } from "./events.js";
export function foreignMonth(state) {
  let s = clone(state);
  for (let i = 0; i < s.nation.army.frontiers.length; i++) {
    const r = roll(s, -1, 3);
    s = r.state;
    s.nation.army.frontiers[i].threat = clamp(
      s.nation.army.frontiers[i].threat + r.value,
    );
  }
  return s;
}
export function foreignYear(state) {
  const income = state.foreign
    .filter((f) => f.status === "朝贡")
    .reduce((a, f) => a + f.tribute, 0);
  return applyPackage(state, { treasury: income }, "年终外邦朝贡");
}
export function diplomacy(state, action, die) {
  let s = clone(state);
  const other = s.foreign.find((f) => f.id === action.country);
  if (!other) throw new Error("请选择外邦");
  const operation = action.operation || "接见",
    envoy = s.court.officials.find((o) => o.id === action.envoy),
    ownPower =
      s.nation.army.frontiers.reduce(
        (a, f) => a + (f.troops * f.readiness) / 100,
        0,
      ) / 2000;
  const c = check(
    envoy?.abilities.才 || s.emperor.talents.魅力,
    die,
    "一般",
    0,
    (ownPower - other.power) * 0.2 + (other.attitude - 50) * 0.3,
  );
  if (operation === "宣战") {
    if (s.nation.treasury < 25 || s.nation.grain < 30)
      throw new Error("宣战需要国库 25 万两、军粮 30 万石");
    if (other.status === "交战") throw new Error("已经处于交战");
    other.status = "交战";
    s.campaigns.push({
      id: "war-" + s.turn + "-" + other.id,
      country: other.id,
      title: "征讨" + other.name,
      round: 0,
      enemyTroops: 50000,
      enemyReadiness: other.power,
      dir: s.nation.army.frontiers[0].dir,
      done: false,
      result: null,
      personal: !!action.personal,
      regent: action.regent || s.court.posts.find((p) => p.id === "p0")?.holder,
    });
    s = applyPackage(s, { treasury: -25, grain: -30 }, "宣战备军");
    return { state: s, note: "向 " + other.name + " 宣战，战役开始" };
  }
  if (operation === "和亲") {
    const woman =
      s.harem.children.find(
        (c) =>
          c.id === action.bride &&
          c.sex === "女" &&
          s.turn - c.born >= 18 * 36 &&
          !c.married,
      ) ||
      s.harem.royalWomen?.find(
        (w) => w.id === action.bride && w.age >= 18 && !w.married,
      );
    if (!woman) throw new Error("和亲须选择成年且未婚的公主或宗室女");
    if (s.nation.privy < 10) throw new Error("和亲仪礼需要内帑 10 万两");
    woman.married = other.id;
    other.status = "婚盟";
    other.attitude = clamp(other.attitude + 25);
    s = applyPackage(s, { privy: -10, prestige: 2 }, "和亲盟约");
    return { state: s, note: "和亲盟定：" + other.name + " 与本朝结为婚盟" };
  }
  if (operation === "议和") {
    if (other.status !== "交战") throw new Error("当前未交战");
    if (c.success) {
      other.status = "通好";
      for (const war of s.campaigns)
        if (war.country === other.id && !war.done) {
          war.done = true;
          war.result = "议和";
        }
    }
  } else if (operation === "互市") {
    if (c.success) {
      other.status = "通好";
      s = applyPackage(
        s,
        { treasury: Math.min(10, other.authorization) },
        "互市获准",
      );
    }
  } else if (operation === "册封" || operation === "索贡") {
    if (c.success) other.status = "朝贡";
    else other.attitude = clamp(other.attitude - 4);
  } else if (operation === "接见" || operation === "遣使") {
    other.attitude = clamp(other.attitude + (c.success ? 6 : -2));
  } else throw new Error("未知外交行动");
  return {
    state: s,
    note:
      other.name + " · " + operation + " · " + (c.success ? "议定" : "未成"),
    check: c,
  };
}
export function borderInvasions(state) {
  let s = clone(state);
  for (const border of s.nation.army.frontiers.filter((f) => f.threat >= 100)) {
    const b = s.nation.army.frontiers.find((f) => f.dir === border.dir);
    b.threat = 45;
    s = addEvent(
      s,
      "边警",
      border.dir + "境入寇",
      "边患满值，敌骑越境",
      [
        { label: "增拨边饷", effects: { treasury: -18, prestige: 2 } },
        { label: "固守城防", effects: { grain: -10, prestige: -1 } },
      ],
      [border.dir + "境总兵"],
    );
    s = applyPackage(s, { treasury: -8, morale: -2 }, "边境遇袭");
    if ((border.troops * border.readiness) / 100 < 4000) {
      s.nation.army.capital.troops = Math.max(
        0,
        s.nation.army.capital.troops - 12000,
      );
      if (s.nation.army.capital.troops === 0 && s.settings.freedom !== "free")
        s.ending = { type: "亡国", cause: "边城失守，京城被攻破" };
    }
  }
  return s;
}
export function advanceCampaigns(state) {
  let s = clone(state);
  for (const original of state.campaigns.filter((w) => !w.done)) {
    let war = s.campaigns.find((w) => w.id === original.id),
      border = s.nation.army.frontiers.find((f) => f.dir === war.dir),
      r = roll(s);
    s = r.state;
    war = s.campaigns.find((w) => w.id === original.id);
    border = s.nation.army.frontiers.find((f) => f.dir === war.dir);
    const general = s.court.officials.find(
        (o) =>
          o.id === s.court.posts.find((p) => p.title === "兵部尚书")?.holder,
      ),
      power =
        (border.troops * border.readiness) / 100 +
        (general?.abilities.军 || 40) * 200 +
        (war.personal ? s.emperor.talents.武略 * 100 : 0) +
        (s.nation.grain > 10 ? 5000 : -15000) +
        r.value * 500;
    const enemy = (war.enemyTroops * war.enemyReadiness) / 100 + 15000;
    const victory = power >= enemy;
    war.round++;
    war.enemyTroops = Math.max(0, war.enemyTroops - (victory ? 14000 : 5000));
    border.troops = Math.max(0, border.troops - (victory ? 2000 : 7000));
    s = applyPackage(
      s,
      { treasury: -4, grain: -6, mood: victory ? 1 : -2 },
      "战役第 " + war.round + " 旬：" + (victory ? "进军" : "受挫"),
    );
    war = s.campaigns.find((w) => w.id === original.id);
    if (war.personal && s.emperor.prestige < 45) {
      const regent = s.court.officials.find((o) => o.id === war.regent);
      if (regent)
        s = applyPackage(
          s,
          { faction: { [regent.faction]: 2 }, prestige: -1 },
          "亲征：留守大臣代批奏报并专权",
        );
      s.memorials = s.memorials.slice(0, -2);
    }
    if (war.personal && r.value <= 2)
      s = applyPackage(s, { health: -10 }, "亲征负伤");
    if (war.enemyTroops <= 0 || war.round >= 6 || border.troops <= 5000) {
      war = s.campaigns.find((w) => w.id === original.id);
      war.done = true;
      war.result = war.enemyTroops <= 0 ? "胜利" : "失利";
      const other = s.foreign.find((f) => f.id === war.country);
      other.status = war.result === "胜利" ? "朝贡" : "冷淡";
      if (war.result === "胜利") {
        s.stats.warsWon++;
        s = applyPackage(s, { treasury: 20, prestige: 8, mood: 5 }, "战役获胜");
      } else {
        s = applyPackage(s, { prestige: -8, morale: -4 }, "战役失利");
      }
    }
  }
  return s;
}
export function checkCollapse(state) {
  let s = clone(state);
  if (s.settings.freedom === "free") return s;
  if (s.nation.morale < 18 && s.nation.treasury < 10) {
    const r = roll(s, 1, 100);
    s = r.state;
    if (r.value < 12) s.ending = { type: "亡国", cause: "民变攻入京师" };
  }
  return s;
}
