import { clone } from "./state.js";
import { applyPackage, clamp } from "./effects.js";
import { roll, check } from "./rng.js";
import { proxyMemorial, inCapital } from "./court.js";
import { addEvent, pickMemorialist } from "./events.js";
import {monthlyBudget} from './finance.js';
export function foreignMonth(state) {
  let s = clone(state);
  for (const b of s.nation.army.frontiers) {
    const countries=s.foreign.filter(f=>f.frontier===b.dir);
    const force=b.troops*b.readiness/100/500;
    const delta=countries.length?countries.reduce((sum,f)=>sum+0.9+clamp((f.power-force)/250,-0.15,0.15)-(f.attitude-50)/250-(['婚盟','朝贡'].includes(f.status)?1.05:0),0)/countries.length:0;
    b.threat=clamp(b.threat+delta);
  }
  return s;
}
export function foreignYear(state) {
  const income = state.foreign
    .filter((f) => f.status === "朝贡")
    .reduce((a, f) => a + f.tribute, 0);
  return applyPackage(state, { treasury: income }, "年终外邦朝贡");
}
export function diplomacyBlock(state, action) {
  const other=state.foreign.find(f=>f.id===action.country),operation=action.operation || '接见';
  if(!other)return '请选择外邦';
  if(other.status==='交战'&&!['议和','接见'].includes(operation))return '交战中只允许议和和接见';
  if(operation==='议和'&&other.status!=='交战')return '当前未交战';
  if(operation==='互市'&&other.trade&&state.turn-other.trade.start<36)return '同一外邦一年内只能议互市一次';
  if(operation==='宣战'){
    if(!state.nation.army.frontiers.some(b=>b.dir===other.frontier))return '外邦未绑定有效边境';
    if(['婚盟','朝贡'].includes(other.status)&&!action.confirmBreach)return '宣战将撕毁盟约，请再次确认';
  }
  return '';
}
export function diplomacy(state, action, die) {
  const blocked=diplomacyBlock(state,action);if(blocked)throw new Error(blocked);
  let s = clone(state);
  const other = s.foreign.find((f) => f.id === action.country);
  if (!other) throw new Error("请选择外邦");
  const operation = action.operation || "接见";
  if(other.status==='交战'&&!['议和','接见'].includes(operation))throw new Error('交战中只允许议和和接见');
  const
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
    const border=s.nation.army.frontiers.find(b=>b.dir===other.frontier);
    if(!border)throw new Error('外邦未绑定有效边境');
    const breach=['婚盟','朝贡'].includes(other.status);
    if(breach&&!action.confirmBreach)throw new Error('宣战将撕毁盟约，请再次确认');
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
      dir: other.frontier,
      score: 0,
      done: false,
      result: null,
      personal: !!action.personal,
      regent: action.regent || s.court.posts.find((p) => p.id === "p0")?.holder,
    });
    s = applyPackage(s, { treasury: -25, grain: -30, ...(breach?{prestige:-5,virtue:-5}:{}) }, breach?"背盟宣战：皇威圣德受损":"宣战备军");
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
    other.trade={start:s.turn,until:s.turn+36,income:0};
    if (c.success) {
      other.status = "通好";
      other.trade.income=Math.min(6,other.authorization/2);
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
      [border.dir + "境总兵"], border.dir,
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
    const generals=['兵部尚书',war.dir+'境总兵'].map(title=>s.court.officials.find(o=>o.id===s.court.posts.find(p=>p.title===title)?.holder&&inCapital({...o,inCapital:true}))).filter(Boolean);
    const general=generals.sort((a,b)=>b.abilities.军-a.abilities.军)[0];
    const power=border.troops*border.readiness/100*(1+((general?.abilities.军 ?? 50)-50)/100)
      *(war.personal?1+s.emperor.talents.武略/200:1)*(s.nation.grain>=monthlyBudget(s).grain?1:0.7);
    if(s.nation.grain<monthlyBudget(s).grain)s.facts.push({subject:war.id,key:'缺粮战力',value:'粮储不足一月军粮，当旬战力为七成',turn:s.turn});
    const enemy=war.enemyTroops*war.enemyReadiness/100;
    const victory=power*(1+(r.value-10.5)*0.04)>=enemy;
    war.round++;war.score=(war.score||0)+(victory?1:-1);
    war.enemyTroops=Math.max(0,Math.round(war.enemyTroops*(victory?0.76:0.88)));
    border.troops=Math.max(0,Math.round(border.troops*(victory?0.88:0.76)));
    war.enemyReadiness=clamp(war.enemyReadiness+(victory?-2:2));
    border.readiness=clamp(border.readiness+(victory?2:-2));
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
      const acting=regent&&inCapital(regent)?regent:s.court.officials.find(o=>o.id===s.court.posts.find(p=>p.title==='内阁首辅')?.holder&&inCapital(o));
      if(acting)for(let i=0;i<2;i++)s=proxyMemorial(s,{minister:acting,label:'留守代批'}).state;
    }
    if (war.personal && r.value <= 2)
      s = applyPackage(s, { health: -10 }, "亲征负伤");
    if (war.enemyTroops <= 0 || war.round >= 6 || border.troops <= 5000) {
      war = s.campaigns.find((w) => w.id === original.id);
      war.done = true;
      war.result = war.enemyTroops <= 0 || (border.troops>5000 && (war.score>0 || (war.score===0&&victory))) ? "胜利" : "失利";
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
  const s = clone(state);
  if (s.settings.freedom === "free" || s.ending?.type === "亡国") return s;
  const isCrisis = t => ["京畿危机", "京畿民变"].includes(t.type);
  const vulnerable = s.nation.morale < 18 && s.nation.treasury < 10;
  if (!vulnerable) {
    const recovered = new Set();
    s.threads = s.threads.map(t => {
      if (!isCrisis(t) || t.result === "危机解除") return t;
      recovered.add(t.id);
      return {...t, stage:"结束", updated:s.turn, result:"危机解除"};
    });
    s.memorials = s.memorials.filter(m => !recovered.has(m.threadId));
    return s;
  }
  // Use the existing thread clock. No new save fields and no random death roll.
  let index = s.threads.findLastIndex(t => isCrisis(t) && t.result !== "危机解除" && t.updated >= s.turn - 1);
  if (index < 0) {
    s.threads.push({id:"capital-"+s.runId+"-"+s.turn+"-"+s.threads.length,
      title:"京畿民变", type:"京畿危机", stage:"发生", cause:"民心低于18且国库低于10，京畿困顿", actors:[],
      provinceId:null, born:s.turn, updated:s.turn, result:"尚未急报"});
    index = s.threads.length - 1;
  }
  // clone() shares closed threads; a handled warning may still have a running
  // six-month clock until the national condition actually recovers.
  const thread = {...s.threads[index], updated:s.turn};
  s.threads[index] = thread;
  const turns = s.turn - thread.born + 1;
  if (turns >= 18) {
    s.ending = {type:"亡国", cause:"京畿困局持续满六个月，民变攻入京师"};
  } else if (turns >= 9 && thread.type === "京畿危机") {
    thread.type = "京畿民变";
    thread.stage = "请旨";
    thread.result = "已呈急报，待速处置";
    s.stats.events++;
    s.memorials.push({id:"m-"+thread.id,title:"京畿民变",type:"京畿民变",
      ...pickMemorialist(s,"政务"),provinceId:null,request:"请速开仓、调兵或下罪己诏，安定京畿",
      options:[
        {id:"opt0",label:"开仓赈济",effects:{grain:-30,morale:6}},
        {id:"opt1",label:"调兵弹压",effects:{treasury:-8,morale:3,prestige:-2}},
        {id:"opt2",label:"下罪己诏",effects:{prestige:-6,virtue:2,morale:4}},
      ],due:thread.born+17,threadId:thread.id,urgent:true,secret:false,text:""});
  }
  return s;
}
