import {annualBudget,grainBudget} from './finance.js';
import {random,seedNumber} from './rng.js';

// New petitions require a decision outside ordinary departmental authority.
// Legacy templates remain available for received petitions and frozen forecasts.
const policy=(id,title,type,request,escalation,choices,when=()=>true,priority=0)=>
 ({id:'imperial-'+id,title,type,request,escalation,choices,when,priority});
export const IMPERIAL_AGENDA=[
 policy('relief','灾区请定赈济与核销办法','请赈',
  '请在拨银急赈、开仓给粮与官绅合赈之间定夺，并准灾区从急办理后再核销。',
  '灾情已重，救急须动用中央钱粮并放宽通常核销次序，地方无权自行更改。',[
   ['拨银急赈，事后核销','国库承担急赈，较快减轻灾情；事后仍须核账',{treasury:-10,localMorale:2,localDisaster:-6,governance:-0.2}],
   ['开仓给粮，派员监赈','支用中央粮储并付监赈费用，保留更多现银',{treasury:-2,grain:-6,localMorale:1.6,localDisaster:-5}],
   ['官绅合赈，依例核销','少动中央钱粮，救济较慢，灾民继续承受压力',{treasury:-1,localMorale:-0.3,localDisaster:-1,prestige:-0.3}],
  ],(s,p)=>p.disaster>=20,100),
 policy('grain','户兵二部请定缺粮应对','军粮',
  '存粮已不足一个月常用，请裁先动国帑籴粮，还是收缩军中支给、优先保留救济。',
  '粮储不足，军需与赈济争用同一仓储，须由御前裁定支给次序。',[
   ['动帑籴粮，维持支给','付购粮银以补仓储，现银压力增加',{treasury:-12,grain:10,readiness:0.5}],
   ['节缩军给，保留赈粮','保留钱粮但军备与地方信心受损',{grain:2,readiness:-2,localMorale:-0.5}],
  ],s=>s.nation.grain<grainBudget(s).monthly,95),
 policy('arrears','户部请裁积欠清偿次序','钱粮',
  '国帑尚有积欠，请定以现银补付、核减非急公务，还是暂缓清偿以保留周转。',
  '欠款涉及各衙门用度，单由户部裁减容易失衡，须确定中央财政取舍。',[
   ['核减非急公务，先保周转','以整顿开支换取周转，执行衙门暂受掣肘',{treasury:4,governance:-0.5,prestige:-0.3}],
   ['清核欠项，维持原支给','付稽核费用，整顿拖欠凭据，不额外削减支给',{treasury:-2,governance:0.6}],
  ],s=>s.nation.arrears>0,85),
 policy('border','兵部请定边防守备方略','边警',
  '边患已高，请裁增拨守备经费、整训要隘，还是节用守成并约束边地冲突。',
  '边防需在增军费与保财政之间取舍，地方将领无权增动中央军饷。',[
   ['增拨守备，整训要隘','动用国帑加强战备，降低边患',{treasury:-9,readiness:2,threat:-2}],
   ['节用守成，约束冲突','少花军费，守备改善有限，须承受边患压力',{treasury:-2,readiness:0.3,threat:0.5}],
  ],s=>s.nation.army.frontiers.some(b=>b.threat>=60),80),
 policy('war-supply','户兵二部会请筹措行营军需','战事',
  '行营仍在用兵，请裁由国库加拨转运费用，还是征用地方车役以接济军前。',
  '战时转运横跨军政两途，军需与民力难以兼顾，须裁定由谁承担。',[
   ['国库拨运，减扰地方','国库付转运费用，行营战备改善',{treasury:-10,grain:-2,readiness:2,localMorale:0.5}],
   ['征调车役，限期归还','少动现银，动用地方民力，行营得以接济',{treasury:-3,grain:-1,readiness:1,localMorale:-1}],
  ],s=>s.campaigns.some(w=>!w.done),75),
 policy('dike','工户二部请裁灾区堤防先后','河工',
  '灾区修堤须与赈济共筹经费，请裁集中修护险段，还是先疏散沿河居民、缓办大工。',
  '灾后工程与安置争用中央经费，涉及跨县迁移与超例拨款，须请御裁。',[
   ['先修险段，兼办安置','较多国帑用于减灾，安置仍需民力',{treasury:-8,localDisaster:-4,localMorale:0.7}],
   ['先办疏散，缓议大工','安置较快，堤防风险改善较少',{treasury:-3,localDisaster:-1,localMorale:1.1}],
  ],(s,p)=>p.disaster>=25,65),
 policy('resettle','灾区请议流民安置成例','民生',
  '请在给资返乡与就地安置之间定夺，明定客籍编户、土地与赋役由哪一地承接。',
  '灾情与民心承压，安置牵涉两地户籍、赋役权责，地方无法独断。',[
   ['给资返乡，修复生计','花钱粮帮助返乡，减轻灾情',{treasury:-6,grain:-2,localMorale:1.5,localDisaster:-2}],
   ['就地编户，缓征赋役','保留更多现银，安置协调负担增加',{treasury:-2,localMorale:1,governance:-0.3}],
  ],(s,p)=>p.disaster>=15&&p.morale<45,60),
 policy('tax','户部请议实征与额征之制','赋税',
  '请择一省试核实征税额，将额外摊派并入明册；或守旧额、严查册外加派，再观各省情形。',
  '涉及赋役成例与地方财权，户部只能拟议，须由御前确定试行范围。',[
   ['择省试核，明列税目','付查核费用、安定地方，旧有征解暂受扰动',{treasury:-5,localMorale:1.2,governance:0.3}],
   ['守旧额，严禁册外加派','少动国帑，治理小有改善，试行新制暂缓',{treasury:-1,governance:0.3,localMorale:0.2}],
  ],(s,p)=>p.tax>0&&!p.rebellion),
 policy('land','户部请议清丈田亩与宽限','钱粮',
  '请择省核丈隐漏田亩，或先给业户自报宽限；须定清丈费用与追征是否从宽。',
  '清丈关系田赋与乡绅利益，追征尺度将成为各省遵循的新例。',[
   ['拨费核丈，追征从宽','国库承担核查费用，提升治理，地方承受清丈压力',{treasury:-5,governance:0.8,localMorale:-0.3}],
   ['限期自报，暂不追旧','百姓较安，查核力度较弱',{treasury:-1,governance:0.2,localMorale:0.5}],
  ],(s,p)=>p.tax>0&&!p.rebellion),
 policy('salt','户部请裁盐课与民间行盐之禁','盐政',
  '请议放宽一省行盐、以核课代重禁，或保留专引并整饬缉私；税收与民用须作取舍。',
  '涉及盐课定制与民间经营边界，不能由地方用临时告示更改。',[
   ['试宽行盐，以核课代禁','付试行费用，便民而暂减收解',{treasury:-4,localMorale:1,governance:-0.2}],
   ['保留专引，整饬缉私','收回部分课银，地方受检查约束',{treasury:2,localMorale:-0.7,governance:0.3}],
  ]),
 policy('reserve','户部请议常平仓储备定额','仓储',
  '请增留地方仓粮以备灾，或将一部分余粮调入中央统一支用；须明定仓储与军需的优先次序。',
  '中央与地方争用储粮，涉及仓储定额，须确定钱粮留拨原则。',[
   ['增留地方仓粮','支用中央粮储安定地方，中央余粮减少',{treasury:-2,grain:-3,localMorale:1.1}],
   ['调入中央统一支用','增加中央周转粮，地方储备信心下降',{grain:2,localMorale:-0.5}],
  ],s=>s.nation.grain>=grainBudget(s).monthly*3),
 policy('canal','工户二部请议漕运与民运分流','漕运',
  '请择要道疏浚、分流官民船运，或先保漕粮、缓议民运扩容；工程支出与沿途商民生计须兼筹。',
  '牵涉跨省河道、漕粮优先权与中央工费，须裁定两部承办先后。',[
   ['拨费疏浚，分流官民船运','国库付工程费，地方生计与调运得益',{treasury:-6,localMorale:1,governance:0.3}],
   ['先保漕粮，缓办扩容','节省工程费，民运仍受挤压',{treasury:-1,grain:1,localMorale:-0.3}],
  ],s=>s.nation.grain>=grainBudget(s).monthly),
 policy('justice','刑部请定重案复核与限期之制','刑狱',
  '请议重案由刑部复核后再执行，或仍由地方依限办理、中央抽查；错判风险与积案时限须作取舍。',
  '涉及刑名成例及中央与地方审判权限，刑部不敢自行改章。',[
   ['重案复核，准予展限','付复核费用，慎刑安民，案牍负担增加',{treasury:-4,virtue:0.8,localMorale:0.6,governance:-0.2}],
   ['依限结案，中央抽查','付抽查费用，办理较快，慎刑收效较少',{treasury:-1,governance:0.5,virtue:-0.2}],
  ]),
 policy('audit','都察院请定督抚考成权责','言官',
  '请准御史跨省核考督抚，或先由督抚自陈、六部会核；须防地方相护，也须防言官挟察扰政。',
  '监察权与督抚事权互相牵制，须由皇帝明确问责尺度。',[
   ['御史跨省核考','付巡察费用，提升治理，地方承办受压',{treasury:-4,governance:0.8,localMorale:-0.2}],
   ['督抚自陈，六部会核','费用较少，核考较缓，对地方掣肘较轻',{treasury:-1,governance:0.3,prestige:-0.2}],
  ],s=>s.nation.governance<85),
 policy('gentry','户部请议绅户优免边界','赋税',
  '请议将绅户优免限于本人，或仍循旧例、先严核冒免；关系国课与士林，须定一体遵行之例。',
  '涉及功名优免与赋役成例，可能牵动士林利益，须由御前权衡。',[
   ['限于本人，试行清核','增加收解，地方旧有利益受触动',{treasury:3,governance:0.4,localMorale:-0.6,prestige:-0.4}],
   ['保留旧例，先核冒免','国库付清核费，治理渐进而不急改优免',{treasury:-2,governance:0.3,prestige:0.2}],
  ]),
 policy('schools','礼户二部请议官学取士与经费','文教',
  '请议由国库拨助偏远官学，或仍由地方自筹、中央加严考核；教养与中央用度须定轻重。',
  '官学经费牵涉中央与地方分担，取士教养的尺度须由御前定夺。',[
   ['国库拨助偏远官学','花国帑扩大教养，地方民心较安',{treasury:-5,virtue:0.7,localMorale:0.6}],
   ['地方自筹，中央核考','保留国帑，地方筹办负担较重',{governance:0.3,localMorale:-0.3}],
  ]),
 policy('appointment','吏部请议地方官候补与选任','铨选',
  '请议以考成择优补缺，或保留按资序推补并加试政务；须兼顾用人实绩与官员进阶成例。',
  '涉及铨选成例与仕进秩序，吏部只能拟定候选办法，具体任命仍候旨。',[
   ['以考成为先，核实荐举','付考核费，重实绩而触动资序',{treasury:-3,governance:0.6,prestige:-0.2}],
   ['循资序推补，加试政务','保留进阶成例，改革幅度较小',{treasury:-1,governance:0.2,prestige:0.2}],
  ]),
 policy('military','兵部请议边营轮防与常备','兵务',
  '请议定期轮防以防将兵私属，或留熟边旧营、加强中央点验；军队熟习与统属须作取舍。',
  '轮防牵动军队统属与中央军费，须由皇帝确定兵部权限。',[
   ['拨费轮防，重整统属','付换防费用，改善战备但扰动地方',{treasury:-5,readiness:1.4,localMorale:-0.2}],
   ['留营熟边，中央点验','点验费用较少，战备渐进',{treasury:-2,readiness:0.5,governance:0.2}],
  ],s=>s.nation.army.frontiers.some(b=>b.troops>0)),
 policy('trade','礼户二部请议互市查验与税例','外邦',
  '请议放宽通好邦国的互市查验，或维持关禁、以小额官市试探；税课、边安与邦交须兼筹。',
  '涉及对外成例与关税权限，不能由关吏自行放宽。',[
   ['宽验通商，严禁军械','改善邦交与地方生计，查验费用增加',{treasury:-4,attitude:1,localMorale:0.7}],
   ['维持关禁，先办官市','少付试办费用，邦交改善较缓',{treasury:-1,attitude:0.2,localMorale:-0.2}],
  ],s=>s.foreign.some(f=>f.status!=='交战')),
 policy('water','工户二部请议上下游水利权责','工务',
  '请议由中央统筹上下游水利、分摊工费，或仍由各省分段承修、共同会勘；须先明权责再兴工。',
  '水利跨越省界，受益与出资不在一地，两部请定共同遵行的原则。',[
   ['中央统筹，拨费会勘','国库多出工费，改善跨省协调',{treasury:-5,governance:0.5,localMorale:0.6}],
   ['分省承修，共同核验','中央少出钱，地方协调负担较重',{treasury:-1,governance:0.2,localMorale:-0.2}],
  ]),
 policy('clan','宗人府请议宗室俸养定额','宗室',
  '请议核限远支宗室俸养并另给教养出路，或仍循原额、先核重领冒支；国用与宗亲体面须两全。',
  '涉及宗室俸养成例与皇室名分，宗人府无权单独更改。',[
   ['核限远支，另助教养','节省国用，宗亲体面稍损',{treasury:2,prestige:-0.5,virtue:0.2}],
   ['维持原额，清核冒支','付清核费用，保持宗亲体面',{treasury:-2,governance:0.3,prestige:0.2}],
  ],s=>s.harem.children.length>0||s.harem.royalWomen?.length>0),
 policy('budget','户部请定国用缓急','钱粮',
  '国库周转已低于全年常用，请裁紧缩非急公务留银，还是维持常用、另付费用清查收解。',
  '中央用度吃紧，裁减涉及各部，须先确定国用的缓急顺序。',[
   ['紧缩非急公务','保留周转银，各衙门办事承压',{treasury:3,governance:-0.4,prestige:-0.2}],
   ['维持常用，清查收解','付查核费整顿治理，周转压力暂留',{treasury:-2,governance:0.5}],
  ],s=>s.nation.treasury<annualBudget(s),30),
];

export function imperialTemplates(state,count){
 const active=new Set(state.memorials.map(m=>m.templateId)),recent=state.memorialVariety||[];
 const eligible=IMPERIAL_AGENDA.flatMap(t=>{
  if(active.has(t.id))return [];
  const last=recent.filter(r=>r.id===t.id).at(-1)?.turn??-1000;
  if(state.turn-last<(t.priority>=60?12:36))return [];
  // Prevent a second relief request for the same disaster already before court.
  const provinces=state.nation.provinces.filter(p=>t.when(state,p)&&
   (t.id!=='imperial-relief'||!state.memorials.some(m=>m.provinceId===p.id&&/赈|灾/.test(m.type))));
  if(!provinces.length)return [];
  const r=random(seedNumber(`agenda:${state.rng}:${state.turn}:${t.id}`));
  const p=provinces[Math.floor(r.value*provinces.length)];
  const context=t.id==='imperial-relief'||t.id==='imperial-dike'||t.id==='imperial-resettle'
   ?`${p.name}现有灾情 ${Math.round(p.disaster)}，民心 ${Math.round(p.morale)}。`
   :t.id==='imperial-grain'?`粮储 ${Math.round(state.nation.grain)} 万石，每月常用约 ${Math.ceil(grainBudget(state).monthly)} 万石。`
   :t.id==='imperial-arrears'?`国帑积欠 ${Math.round(state.nation.arrears)} 万两，现银 ${Math.round(state.nation.treasury)} 万两。`
   :t.id==='imperial-border'?`当前最高边患为 ${Math.round(Math.max(...state.nation.army.frontiers.map(b=>b.threat)))}。`
   :t.id==='imperial-budget'?`国库现银 ${Math.round(state.nation.treasury)} 万两，全年常用约 ${Math.ceil(annualBudget(state))} 万两。`
   :`拟由${p.name}先行承办，涉及改例之处须奉旨后再行。`;
  return [{...t,context,provinceId:p.id,last,title:(['请赈','河工','民生','赋税'].includes(t.type)?p.name+' ':'')+t.title}];
 });
 eligible.sort((a,b)=>b.priority-a.priority||a.last-b.last||
  seedNumber(`${state.rng}:${state.turn}:${a.id}`)-seedNumber(`${state.rng}:${state.turn}:${b.id}`));
 const chosen=[];
 for(const t of eligible){if(chosen.length>=count)break;if(!chosen.some(x=>x.type===t.type))chosen.push(t);}
 return chosen;
}

export function routineBriefings(state){
 if(state.turn%3!==0)return [];
 const p=state.nation.provinces[Math.floor(state.turn/3)%state.nation.provinces.length];
 const budget=grainBudget(state),round=n=>Math.round(n*10)/10;
 const reports=[
  ['钱粮','户部钱粮常报',`国库现存 ${round(state.nation.treasury)} 万两，积欠 ${round(state.nation.arrears)} 万两。${p.name}税额照现行册例收解；遇需减免或改章，再另具专折。`],
  ['仓储','户部粮储常报',`中央粮储现有 ${round(state.nation.grain)} 万石，军需与赈济每月常用合计 ${round(budget.monthly)} 万石。仓廪盘查、翻晒仍由有司按例办理；缺粮急务另折请裁。`],
  ['政务',p.name+'地方常报',`${p.name}现有灾情 ${round(p.disaster)}，民心 ${round(p.morale)}。地方日常公务照章办理；灾情扩大、民变及超例支用另具急折。`],
  ['边警','兵部边防常报',`各边镇现报：${state.nation.army.frontiers.map(b=>b.dir+'境边患 '+round(b.threat)).join('，')}。点卯、军械检修循例办理；增调大军与加拨军费另候旨。`],
 ];
 const local=[
  ['工务','衙署修缮',`${p.name}衙署修漏、领用旧瓦等小修由地方依定额办理，经费仍循原例。`],
  ['文教','乡塾借书',`${p.name}官学旧书借阅、归还与修补交教官立簿管理，毋庸逐件请旨。`],
  ['内廷','宫中灯油', '宫中灯油交领、旧物修补由内廷按额核销，管事按月查验。'],
  ['民生','里邻纠纷',`${p.name}日常井水、集期与邻里争执先由里老、州县依例调处；涉重案者仍依法上报。`],
  ['政务','案牍与驿递',`${p.name}文书誊录、驿递交割与簿册点验交所属衙门承办，不另增例外支用。`],
 ];
 const month=Math.floor(state.turn/3),selected=[reports[month%4],reports[(month+1)%4]];
 return [...selected.map(([type,title,text],i)=>({id:`brief-${state.turn}-${i}`,turn:state.turn,kind:'report',type,title,text,provinceId:p.id})),
  (([type,title,text])=>({id:`brief-${state.turn}-local`,turn:state.turn,kind:'local',type,title,text,provinceId:p.id}))(local[month%local.length])];
}
