import { freedomRules } from "./freedom.js";
import { remarkCategory, REMARK_KINDS } from "./memorial-decisions.js";
import { routineTemplate, routineOptions, memorialText } from "./memorial-templates.js";
import { clone } from "./state.js";
import { roll } from "./rng.js";
import { applyPackage } from "./effects.js";
import { quarterIndex } from "./finance.js";
import {factionPowers} from './politics.js';
export function pickMemorialist(state, type, provinceId = null) {
  const eligible=state.court.posts.flatMap(post=>{
    const o=state.court.officials.find(o=>o.id===post.holder&&o.post===post.id&&o.alive&&o.health>0&&!o.jailed&&!o.retired);
    return o&&(o.inCapital!==false||post.provinceId===provinceId)?[{o,post}]:[];
  });
  const local=eligible.find(x=>x.post.provinceId===provinceId&&provinceId);
  const money=/赈|钱粮|赋税|天灾/.test(type), military=/军粮|边警|兵|战/.test(type), censor=/言官|贪腐|党争/.test(type);
  const exact=money?(local||eligible.find(x=>x.post.title==='户部尚书')):
    military?(eligible.find(x=>x.post.title===provinceId+'境总兵')||eligible.find(x=>x.post.title==='兵部尚书')):
    censor?eligible.find(x=>x.post.title==='左都御史'):null;
  const office=money||/盐政|仓储|漕运|商贸|农桑/.test(type)?'户部':military?'兵部':censor?'都察':/河工|工务/.test(type)?'工部':/刑狱/.test(type)?'刑部':/科举|文教|礼制|外邦/.test(type)?'礼部':/宗室/.test(type)?'宗人':'通政';
  const chosen=exact||eligible.find(x=>x.post.title.startsWith(office))||eligible.find(x=>x.post.title==='通政使');
  return chosen?{from:chosen.o.name,fromId:chosen.o.id}:{from:'通政司',fromId:null};
}
export function addEvent(state, type, title, cause, options, actors = [], provinceId = null) {
  const s = clone(state),
    id = "ev-" + s.turn + "-" + s.stats.events;
  s.stats.events++;
  s.threads.push({
    id,
    title,
    type,
    stage: "发生",
    cause,
    actors,
    provinceId,
    born: s.turn,
    updated: s.turn,
    result: "",
  });
  s.memorials.push({
    id: "m-" + id,
    title,
    ...pickMemorialist(s,type,provinceId),
    provinceId,
    type,
    request: title,
    options: options.map((o, i) => ({ id: "opt" + i, ...o })),
    due: s.turn + 3,
    threadId: id,
    urgent: true,
    secret: type === "贪腐",
    text: "",
  });
  return s;
}
export function seedMemorials(state) {
  let s = clone(state);
  const r = roll(s, 3, 6);
  s = r.state;
  for (let i = 0; i < r.value; i++) {
    const pool=i===2?s.nation.provinces.filter(p=>p.disaster>0):s.nation.provinces;
    const pick=roll(s,0,Math.max(0,(pool.length?pool:s.nation.provinces).length-1));s=pick.state;
    let z=(pool.length?pool:s.nation.provinces)[pick.value];
    const template=routineTemplate(s,i,z,pick.value);if(!template)continue;
    z=s.nation.provinces.find(p=>p.id===template.provinceId)||z;
    const relief=!!template.relief;
    const author=pickMemorialist(s,template.type,z.id);
    const memorial={
      id: "routine-" + s.turn + "-" + i,
      templateId:template.id,
      title:template.title,
      ...author,
      provinceId:z.id,
      type:template.type,
      request:template.request,
      options:routineOptions(template,z,s,author.fromId),
      due: s.turn + 4,
      threadId: null,
      urgent: relief,
      secret: false,
      text: "",
    };
    memorial.text=memorialText(memorial,s.settings.prose==='modern');s.memorials.push(memorial);
    s.memorialVariety=[...(s.memorialVariety||[]),{id:template.id,type:template.type,turn:s.turn}].slice(-72);
  }
  return s;
}
export function resolveMemorial(
  state,
  id,
  option = "approve",
  remark = "",
  sourcePrefix = "处置奏报",
  remarkKind = null,
) {
  const m = state.memorials.find((m) => m.id === id);
  if (!m) throw new Error("奏报已处置或不存在");
  const brushNote=remark?" · 朱批「"+String(remark).slice(0,100)+"」":"";
  if (option === "hold")
    return { state: applyMemorialRemark(state,m,remark,remarkKind), note: m.title + " · 留中" + brushNote };
  if (option === "discuss") {
    const s = clone(state),
      mem = s.memorials.find((x) => x.id === id);
    if ((mem.referrals || 0) >= freedomRules(s).referrals)
      throw new Error("此折已发部再议"+freedomRules(s).referrals+"次，请准驳裁处");
    mem.referrals = (mem.referrals || 0) + 1;
    mem.due += 3;
    const t = s.threads.find((t) => t.id === mem.threadId);
    if (t && t.stage !== "结束") t.stage = "搁置";
    return { state: applyMemorialRemark(s,m,remark,remarkKind), note: m.title + " · 发部再议" + brushNote };
  }
  if (option === "remark") {
    return {state:applyMemorialRemark(state,m,remark,remarkKind),note:m.title+' · 朱批「'+String(remark).slice(0,100)+'」（原请款仍待准驳）'};
  }
  const chosen =
    m.options.find((o) => o.id === option) ||
    m.options.find((o) => o.id === (option === "reject" ? "opt1" : "opt0"));
  if (!chosen) throw new Error("无此处置选项");
  for(const [key,label]of [['treasury','国库'],['privy','内帑'],['grain','粮储']])
    if(chosen.effects[key]<0&&state.nation[key]<-chosen.effects[key])throw new Error(label+'不足以办理此事');
  const regional=m.provinceId&&state.nation.provinces.some(p=>p.id===m.provinceId)&&Number.isFinite(chosen.effects.morale);
  const effects=regional?{...chosen.effects,morale:undefined,province:{...chosen.effects.province,id:m.provinceId,morale:(chosen.effects.province?.morale||0)+chosen.effects.morale}}:chosen.effects;
  let s = applyPackage(
    state,
    effects,
    sourcePrefix + "：" + m.title + " / " + chosen.label,
  );
  s.memorials = s.memorials.filter((x) => x.id !== id);
  s.stats.petitions++;
  const t = s.threads.find((x) => x.id === m.threadId);
  if(m.type==='致仕'&&chosen.id==='opt0'){
    const o=s.court.officials.find(o=>o.id===t?.actors[0]&&o.alive);
    if(o){o.retired=true;o.post=null;o.life.push({turn:s.turn,event:'准奏致仕'});for(const p of s.court.posts)if(p.holder===o.id)p.holder=null;}
    for(const p of s.nation.provinces)p.governor=s.court.posts.find(x=>x.provinceId===p.id)?.holder||null;
    s.court.factions=factionPowers(s);
  }
  if (t && t.stage !== "结束") {
    t.stage = "结束";
    t.updated = s.turn;
    t.result = chosen.label;
    if (t.type === "民变" && t.provinceId) {
      const province = s.nation.provinces.find((p) => p.id === t.provinceId);
      if (province) province.rebellion = false;
    }
  }
  return { state: applyMemorialRemark(s,m,remark,remarkKind), note: m.title + " · " + chosen.label + (chosen.consequence?'：'+chosen.consequence:'') + brushNote };
}
function applyMemorialRemark(state,memorial,remark,kind){
  const text=String(remark||'').slice(0,100),category=REMARK_KINDS.includes(kind)?kind:remarkCategory(text);
  const o=state.court.officials.find(o=>o.id===memorial.fromId&&o.alive&&o.health>0&&!o.jailed&&!o.retired&&state.court.posts.some(p=>p.holder===o.id&&p.id===o.post));
  if(!text||!o)return clone(state);
  const favor=category==='嘉奖'?2:category==='申饬'?-3:0;
  return favor?applyPackage(state,{official:{id:o.id,favor}},'朱批：'+text):clone(state);
}
export function expireMemorials(state) {
  let s = clone(state);
  for (const m of s.memorials.filter((m) => m.due < s.turn)) {
    if(m.type==='京畿民变' && !(s.nation.morale<18&&s.nation.treasury<10)) {
      s.threads=s.threads.map(t=>t.id===m.threadId?{...t,stage:'结束',updated:s.turn,result:'危机解除'}:t);
      continue;
    }
    s = applyPackage(
      s,
      { morale: m.urgent ? -0.4 : -0.03, governance: -0.08,prestige:m.urgent?-0.5:0 },
      "奏报逾期：" + m.title,
    );
    const t = s.threads.find((t) => t.id === m.threadId);
    if (t && t.stage !== "结束") {
      t.stage = "结束";
      t.result = "逾期放任";
      t.updated = s.turn;
    }
    if(m.type==='京畿民变'&&s.settings.freedom!=='free')
      s.ending={type:'亡国',cause:'京畿民变急报逾期未处置，民变攻入京师'};
    if (m.type === "民变") {
      s.nation.army.capital.troops = Math.max(
        0,
        s.nation.army.capital.troops - 10000,
      );
      if (s.nation.army.capital.troops === 0 && s.settings.freedom !== "free")
        s.ending = { type: "亡国", cause: "民变失控，攻入京师" };
    }
  }
  s.memorials = s.memorials.filter((m) => m.due >= s.turn);
  if (s.memorials.length > 12 && s.turn%3===0)
    s = applyPackage(s, { governance: -1 }, "奏报积压超过十二本：月度案牍考成");
  return s;
}
export function eventsMonth(state) {
  let s = clone(state);
  const r = roll(s, 1, 100);
  s = r.state;
  if (r.value <= 35) {
    const season = Math.floor(((s.turn-1)%36)/9), quarter=Math.floor(Math.max(0,s.turn-1)/9);
    const used=new Set(s.threads.filter(t=>t.type==='天灾'&&Math.floor(Math.max(0,t.born-1)/9)===quarter).map(t=>t.provinceId));
    const pool=s.nation.provinces.filter(p=>!used.has(p.id));
    if(pool.length) {
    const weights=pool.map(p=>1+[0.6,0.4,0.3,0.5][season]+p.pop/100);
    const pick=roll(s,1,1000000);s=pick.state;
    let point=(pick.value-1)/1000000*weights.reduce((a,b)=>a+b,0),index=pool.length-1;
    for(let i=0;i<pool.length;i++){point-=weights[i];if(point<0){index=i;break;}}
    const z=pool[index], kind = ["春旱", "夏涝", "秋蝗", "冬寒"][season];
    s = addEvent(s, "天灾", z.name + kind, "季候失调，地方急报", [
      {
        label: "拨银赈济",
        effects: {
          treasury: -12,
          morale: 8,
          virtue: 2,
          province: { id: z.id, disaster: -20 },
        },
      },
      {
        label: "令地方自筹",
        effects: { morale: -3, province: { id: z.id, disaster: 10 } },
      },
    ], [z.name], z.id);
    s = applyPackage(
      s,
      { province: { id: z.id, disaster: 25,morale:-4 } },
      kind + "发生",
    );
    }
  }
  const unrest = s.nation.provinces.filter((p) => p.morale < 30 && !p.rebellion);
  if (unrest.length) {
    const rebel = roll(s, 1, 100);
    s = rebel.state;
    const lowest = Math.min(...unrest.map((p) => p.morale));
    if (rebel.value <= Math.ceil((30 - lowest) / 5)) {
      const pick = roll(s, 0, unrest.length - 1);
      s = pick.state;
      const province = s.nation.provinces.find((p) => p.id === unrest[pick.value].id);
      province.rebellion = true;
      province.rebellionQuarter = quarterIndex(s.turn);
      s = addEvent(s, "民变", province.name + "民变告急", "民心低迷，钱粮困顿", [
        { label: "开仓赈抚", effects: { grain: -20, morale: 4, province: {id: province.id, morale: 12} } },
        { label: "调兵弹压", effects: { treasury: -8, morale: -2, prestige: 2, province: {id: province.id, morale: -3} } },
      ], [province.name], province.id);
      s.threads.at(-1).provinceId = province.id;
    }
  }
  for (const ret of s.retaliations.filter((x) => !x.done && x.due <= s.turn)) {
    ret.done = true;
    const f = s.court.factions.find((f) => f.id === ret.faction);
    s = addEvent(
      s,
      "党争",
      f.name + " 联名反奏",
      "此前罢免引发报复",
      [
        {
          label: "安抚调停",
          effects: { prestige: -1, faction: { [f.id]: 4 } },
        },
        {
          label: "严旨申饬",
          effects: { prestige: 2, faction: { [f.id]: -3 } },
        },
      ],
      [f.name],
    );
  }
  return s;
}
