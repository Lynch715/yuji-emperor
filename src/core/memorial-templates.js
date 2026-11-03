import { seedNumber, random } from './rng.js';
// Routine requests fund a small, specified administrative task. Approval trades
// silver (and, for handling grain, stock) for execution; refusal saves resources
// and asserts authority. Large rewards remain in events and edicts.
const stateTrigger=type=>s=>{
 if(['钱粮','赋税','盐政'].includes(type))return s.nation.provinces.some(p=>p.tax>0&&!p.rebellion);
 if(['仓储','漕运'].includes(type))return s.nation.grain>=0.6&&s.nation.army.capital.troops+s.nation.army.frontiers.reduce((n,b)=>n+b.troops,0)>0;
 if(['兵务','军粮','边警'].includes(type))return s.nation.army.frontiers.some(b=>b.troops>0||b.pressure>30);
 if(type==='科举')return Math.floor(s.turn/36)%3===0||s.court.posts.some(p=>!p.holder);
 if(type==='河工')return s.nation.provinces.some(p=>p.disaster>0)||s.era.month<=6;
 if(type==='言官')return s.nation.governance<80||s.nation.arrears>0;
 if(type==='宗室')return s.harem.children.length>0||s.harem.royalWomen.length>0;
 if(type==='礼制')return s.turn%9<3;
 return s.court.posts.some(p=>p.holder);
};
const entry=(id,group,title,type,request,when=stateTrigger(type),grain=0)=>({id,group,title,type,request,when,grain});
export const MEMORIAL_TEMPLATES = [
 entry('tax-register',0,'钱粮月报','钱粮','请核对本季钱粮底册'),
 entry('tax-audit',0,'请复核赋税册籍','赋税','请拨书吏缮写税册'),
 entry('salt-books',0,'请清理盐课账册','盐政','请核盐引，仍照旧额征课'),
 entry('land-books',0,'请校勘鱼鳞图册','钱粮','请查田亩册籍，暂缓另议加征'),
 entry('deficit',0,'请核库银亏空','钱粮','国库拮据，请逐库查核',s=>s.nation.treasury<100),
 entry('arrears',0,'请核积欠次第','钱粮','积欠未清，请核偿付名册',s=>s.nation.arrears>0),
 entry('tax-receipts',0,'请稽赋税收解','赋税','请查收解凭照'),
 entry('old-tax',0,'请勾稽旧年钱粮','钱粮','请厘清历年报销案'),
 entry('documents',1,'六部请整饬案牍','政务','请拨书吏整饬案牍'),
 entry('exams',1,'礼部请校乡试名册','科举','请校考生籍贯与保结'),
 entry('exam-rooms',1,'请修贡院号舍','科举','请修缮旧号舍，不增录取额'),
 entry('river-inspect',1,'请查河工埽岸','河工','请派员查验旧堤，不冒称工程竣工'),
 entry('roads',1,'请整驿站文移','政务','请稽查驿递公文'),
 entry('official-records',1,'请校官员履历','政务','请补齐考成履历'),
 entry('grain-shortage',2,'请核报粮缺','仓储','库存不足，请支核验役粮、核列欠粮与待收数目',s=>s.nation.grain<0.6,0.6),
 entry('grain-register',2,'请核实仓廪','仓储','请核实库存并支用检仓役粮',stateTrigger('仓储'),0.6),
 entry('grain-air',2,'请晾晒仓粮','仓储','请支役粮翻晾旧谷',stateTrigger('仓储'),0.6),
 entry('grain-boat',2,'请清漕运耗粮','漕运','请支搬运口粮，核验漕单',stateTrigger('仓储'),0.6),
 entry('grain-measure',2,'请校仓斛量器','仓储','请支役粮校准仓斛',stateTrigger('仓储'),0.6),
 entry('grain-seal',2,'请查仓门封识','仓储','请支役粮巡查仓门',stateTrigger('仓储'),0.6),
 entry('grain-road',2,'请整漕运交割','漕运','请支役粮清点粮袋',stateTrigger('仓储'),0.6),
 entry('army-grain',3,'边营请补军粮','军粮','请拨检运费用，支运粮役粮',stateTrigger('军粮'),0.6),
 entry('army-arms',3,'兵部请检军械','兵务','请查旧械修补簿'),
 entry('army-roll',3,'请核边营兵籍','兵务','请核实点卯名册'),
 entry('army-post',3,'请修边台烽燧','边警','请修缮传警器具'),
 entry('army-horses',3,'请核马政刍秣','兵务','请核马匹草料册'),
 entry('army-scout',3,'请校边关塘报','边警','请整理塘报传递次序'),
 entry('classics',4,'言官请开经筵','言官','请备经筵讲义'),
 entry('censor',4,'言官请查考成','言官','请按册稽查考成'),
 entry('greed',4,'言官请核贪墨风闻','贪腐','请先核证据，不据风闻定罪',s=>s.court.officials.some(o=>o.alive&&o.greed>50)),
 entry('prison-books',4,'请核刑狱文书','言官','请清点刑狱文卷，不预断罪名'),
 entry('rules',4,'言官请重申旧章','言官','请校订现行仪制'),
 entry('censor-merit',4,'言官请录清明考成','言官','请校录清明考成，不据奏词先行加赏',s=>s.nation.governance>=80),
 entry('accounts',4,'请稽部院报销','言官','请交叉核对各部报销凭据'),
 entry('good-official',5,'地方请奖循吏','政务','请核循吏事迹，先行存案'),
 entry('clan',5,'宗室请校封爵谱牒','宗室','请据玉牒核验请封资格，不预授爵位'),
 entry('envoy',5,'礼部请定来使仪注','外邦','请备接使仪注',s=>s.foreign.some(f=>f.status!=='交战')),
 entry('tribute-books',5,'请核朝贡译牍','外邦','请缮写通好邦国译牍',s=>s.foreign.some(f=>f.status!=='交战')),
 entry('schools',5,'请修州学祭器','政务','请小修州学祭器'),
 entry('ritual',5,'请校岁时祀典','礼制','请核祀典用物账册'),
];
export function routineTemplate(state,group,province,draw){
 if(group===2&&province.disaster>0)return {id:'disaster-relief',title:province.name+' 请赈灾民',type:'请赈',request:'灾情未解，请拨银赈济',relief:true};
 const pool=MEMORIAL_TEMPLATES.filter(t=>t.group===group&&t.when(state));
 // Derive a separate content draw; preserve the engine's event RNG stream.
 const index=Math.floor(random(seedNumber(`memorial:${state.rng}:${state.turn}:${group}:${draw}`)).value*pool.length);
 const t=pool[index]||{id:'vacancy-report',title:'通政司请核衙门缺额',type:'政务',request:'请据实查报衙门缺额'};
 return {...t,title:group===0||group===2?province.name+' '+t.title:t.title};
}
export function routineOptions(t,province){
 return [
  {id:'approve',label:'准奏',effects:t.relief?{treasury:-8,province:{id:province.id,morale:2,disaster:-5},virtue:1}:{treasury:-2,governance:0.1,...(t.grain?{grain:-t.grain}:{})}},
  {id:'reject',label:'驳回',effects:{prestige:0.2,...(t.relief?{virtue:-2}:{})}},
  {id:'hold',label:'留中',effects:{}},
 ];
}
