import { examGraceReceipt } from './keju-schema.js';
import { clone, reignId, TALENTS } from './state.js';
import { roll } from './rng.js';
import { succession } from './harem.js';
import { clamp, growTalent } from './effects.js';
import { uniqueName, IMPERIAL_CHARS } from './names.js';
import { chooseRegent } from './regency-info.js';
import { selectAmbitions } from './ambitions.js';
import { sealChronicle } from './chronicles.js';

export function imperialWedding(state) {
  let s=clone(state);
  if(s.emperor.age<16 || s.reign.married)return s;
  s.reign.married=true;
  const owner=reignId(s);
  for(let i=0;i<3;i++){
    // 历史剧本预设的大婚人选优先；重名或用尽时照常取名。
    const preset=s.weddingNames?.[i];
    const named=uniqueName(s,preset?{names:[preset]}:{});s=named.state;
    const draw=(a,b)=>{const r=roll(s,a,b);s=r.state;return r.value;};
    s.harem.consorts.push({id:owner+'-c'+i,name:named.name,age:Math.max(18,Math.min(s.emperor.age,24))+i,
      rank:['皇后','妃','嫔'][i],family:preset&&named.name===preset?preset.replace(/氏$/,'')+'氏':'新朝内廷',faction:'f'+i,favor:60-i*8,mood:70,
      ambition:draw(20,60),scheming:draw(20,65),health:85,preg:null,relations:{},secret:'家族旧事有待查明。',
      confined:false,cold:false,retired:false,reignId:owner,recoveryUntil:0});
  }
  s.facts.push({subject:s.emperor.name,key:'大婚',value:'亲政后大婚，册立后妃',turn:s.turn});
  return s;
}
export function advanceRegency(state) {
  let s=clone(state);
  if(!s.regency)return s;
  const child=s.harem.children.find(c=>c.id===s.reign.emperorId);
  const age=child?Math.max(0,Math.floor((s.turn-child.born)/36)):s.emperor.age;
  s.emperor.age=age;
  const aptitude=child?.aptitude ?? 58,education=child?.education || 0;
  const previous=s.regency.growth;
  if(previous){
    const delta=Math.max(0,aptitude*(Math.min(1,age/16)-Math.min(1,previous.age/16)))+Math.max(0,education-previous.education)/10;
    // Historical openings already have authored talents. Their later maturation
    // shares the annual study budget; newborn successors retain natural maturation.
    const historical=s.reign.number===1&&!!s.scenario;
    for(const t of TALENTS)if(delta>0){
      if(historical)s=growTalent(s,t,delta);
      else {
        const before=s.emperor.talents[t];
        s.emperor.talents[t]=clamp(before+delta);
        s.ledger.push({turn:s.turn,path:'emperor.talents.'+t,before,after:s.emperor.talents[t],delta:s.emperor.talents[t]-before,source:'幼帝自然成熟：年龄与教养增量'});
      }
    }
  }
  // Consume even capped growth; it cannot be banked and claimed in another year.
  s.regency.growth={age:Math.min(16,age),education};
  if(age>=16){
    s.regency=null;
    const exam=s.keju?.exams.find(e=>e.status!=='published');
    if(exam){const receipt=examGraceReceipt(exam,s.turn);if(!s.receipts.includes(receipt))s.receipts.push(receipt);}
    s.facts.push({subject:s.emperor.name,key:'亲政',value:'年满十六，撤摄政，亲裁庶政',turn:s.turn});
    s=imperialWedding(s);
  }
  return s;
}
// Continue the polity. A sealed reign keeps its goals; the successor draws four fresh goals.
export function succeedEmperor(state) {
  if(!['驾崩','禅位'].includes(state.ending?.type))throw new Error('只有驾崩或禅位才能继位');
  let s=sealChronicle(state);
  const record=s.chronicles.find(r=>r.id===reignId(s));
  if(record&&!record.ambitions){s.chronicles=s.chronicles.map(r=>r.id===record.id?{...r,ambitions:clone(s.ambitions)}:r);}
  const decision=succession(s),child=s.harem.children.find(c=>c.id===decision.successorId);
  const previous=s.harem.children.find(c=>c.id===s.reign?.emperorId);
  if(previous)previous.health=0;
  const age=child?Math.max(0,Math.floor((s.turn-child.born)/36)):24,number=(s.reign?.number||1)+1;
  const eraName=['承和','景平','绍宁','永和'][(number-2)%4];
  // Even accession in the first xun keeps the old era until the next New Year.
  s.reign={number,accessionTurn:s.turn,emperorId:child?.id || 'collateral-'+number,
    initialTreasury:s.nation.treasury,initialStats:{...s.stats},married:false,eraName,eraStartTurn:(Math.floor(s.turn/36)+1)*36};
  const draw=(a,b)=>{const r=roll(s,a,b);s=r.state;return r.value;};
  const talents=Object.fromEntries(TALENTS.map(t=>[t,age<16
    ?clamp((child?.aptitude ?? 58)*age/16+(child?.education||0)/10)
    :clamp((child?.aptitude ?? 58)+(child?.education||0)/10+draw(-10,10),30,90)]));
  let name=decision.successor;
  if(!child){const prefix=s.imperialSurname+'承';const named=uniqueName(s,{names:IMPERIAL_CHARS.map(c=>prefix+c),prefix});s=named.state;name=named.name;}
  const lifespan=Math.max(age+1,draw(55,80)),tag=['勤政','仁厚','节俭','多疑'][draw(0,3)];
  s.emperor={name,age,lifespan,health:Math.max(55,child?.health||85),energy:9,mood:65,depressedMonths:0,prestige:50,virtue:55,
    talents,tags:[tag],status:[],growth:Object.fromEntries(TALENTS.map(t=>[t,0]))};
  const mother=s.harem.consorts.find(c=>c.id===child?.mother&&c.health>0);if(mother)s.dowager=mother.name;
  s.dowagerFaction=mother?.faction || null;
  for(const c of s.harem.consorts)c.retired=true;
  if(age<16){s.regency={regentId:chooseRegent(s).id,until:child.born+16*36,growth:{age,education:child?.education || 0}};}
  else {s.regency=null;s=imperialWedding(s);}
  s.harem.heir=null;s.harem.candidates=[];s.harem.selectionYear=0;
  s.ending=null;s.pending=null;s.turnBudget=null;s.schedule={朝:null,午:null,夜:null};s.interimEntries=[];
  s.revision++;
  s.facts.push({subject:s.emperor.name,key:'即位',value:decision.text,turn:s.turn});
  return selectAmbitions(s);
}
