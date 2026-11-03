// Quantities use base units. A 斛 needs explicit evidence: do not assume a dynasty's conversion.
export const NUMBER_SOURCE='[0-9０-９零〇一二两三四五六七八九十百千万亿点][0-9０-９零〇一二两三四五六七八九十百千万亿点.,，]*';
export const QUANTITY_UNITS={两银:['money',1],两:['money',1],石:['grain',1],斛:['hu',1],亩:['area',1],顷:['area',100],成:['ratio',10],'%':['ratio',1],'％':['ratio',1],户:['households',1],匹:['horses',1],岁:['age',1],兵马:['people',1],精兵:['people',1],禁军:['people',1],士卒:['people',1],骑兵:['people',1],人:['people',1],名:['people',1],位:['people',1]};
export function parseNumber(raw){
 const text=String(raw).replace(/[０-９]/g,c=>String(c.charCodeAt(0)-65296)).replace(/[,，]/g,'');
 if(/^\d+(?:\.\d+)?$/.test(text))return Number(text);
 for(const [unit,n]of [['亿',1e8],['万',1e4]]){const i=text.lastIndexOf(unit);if(i>=0)return parseNumber(text.slice(0,i)||'一')*n+(text.slice(i+1)?parseNumber(text.slice(i+1)):0);}
 const digits={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
 const [whole,decimal]=text.split('点');let total=0,part='';
 for(const c of whole){if(/\d/.test(c))part+=c;else if(c in digits)part+=digits[c];else if({十:10,百:100,千:1000}[c]){total+=(part?Number(part):1)*{十:10,百:100,千:1000}[c];part='';}else return NaN;}
 return total+Number(part||0)+(decimal?Number('0.'+[...decimal].map(c=>digits[c]??c).join('')):0);
}
export function quantityMatches(text){
 return [...text.matchAll(new RegExp('('+NUMBER_SOURCE+')\\s*('+Object.keys(QUANTITY_UNITS).join('|')+')','g'))].map(m=>({index:m.index,raw:m[0],number:m[1],unit:m[2],kind:QUANTITY_UNITS[m[2]][0],value:parseNumber(m[1])*QUANTITY_UNITS[m[2]][1]}));
}
function nearbyOwners(text,index,owners){
 const found=[];
 for(const owner of owners)for(const alias of owner.aliases.filter(Boolean)){
  let at=text.indexOf(alias);while(at>=0){found.push({owner,before:at<=index,distance:at<=index?index-at-alias.length:at-index});at=text.indexOf(alias,at+1);}
 }
 if(!found.length)return [];
 const pool=found.some(x=>x.before)?found.filter(x=>x.before):found;
 const distance=Math.min(...pool.map(x=>Math.max(0,x.distance)));
 return [...new Set(pool.filter(x=>Math.max(0,x.distance)===distance).map(x=>x.owner))];
}
export function quantityEvidence(f){
 const sets=Object.fromEntries(['money','grain','hu','area','ratio','households','horses','people','age'].map(k=>[k,new Set()]));
 const add=(kind,v)=>{if(!Number.isFinite(v))return;v=Math.abs(v);sets[kind].add(v);sets[kind].add(Math.round(v));if(kind==='money'){sets[kind].add(Math.round(v/1000)*1000);sets[kind].add(Math.round(v/10000)*10000);}};
 const keys={treasury:['money',1e4],privy:['money',1e4],arrears:['money',1e4],cost:['money',1e4],grain:['grain',1e4],grainArrears:['grain',1e4],troops:['people',1],garrison:['people',1],enemyTroops:['people',1],pop:['people',1e4],age:['age',1],area:['area',1],landArea:['area',1],households:['households',1],horses:['horses',1],execRate:['ratio',100],rate:['ratio',100],factor:['ratio',100],progress:['ratio',1]};
 const walk=v=>{if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(['history','volumes','pending','ledger'].includes(k))continue;if(keys[k])add(keys[k][0],x*keys[k][1]);if(typeof x==='object')walk(x);}};
 walk(f.state);
 const pathKind=p=>/grain/.test(p)?['grain',1e4]:/treasury|privy|arrears/.test(p)?['money',1e4]:/troops|garrison/.test(p)?['people',1]:/\.age$/.test(p)?['age',1]:null;
 for(const e of f.entries||[]){const spec=pathKind(e.path);if(spec)for(const v of [e.before,e.after,e.delta])add(spec[0],v*spec[1]);}
 for(const q of quantityMatches(JSON.stringify([f.slotResults,f.notes])))add(q.kind,q.value);
 const s=f.state,ageOwners=[];
 const owner=(o,aliases,path,age=o.age)=>({aliases:[o.name,...aliases],values:[age,...(f.entries||[]).filter(e=>e.path===path).flatMap(e=>[e.before,e.after])]});
 ageOwners.push(owner(s.emperor,['皇帝','陛下','新帝','天子'],'emperor.age'));
 for(const o of s.court.officials){const p=s.court.posts.find(p=>p.holder===o.id);ageOwners.push(owner(o,[p?.title,p&&s.postNames?.[p.id]],'official.'+o.id+'.age'));}
 for(const c of s.harem.consorts)ageOwners.push(owner(c,[c.rank],'consort.'+c.id+'.age'));
 for(const c of s.harem.children)ageOwners.push(owner(c,[], 'child.'+c.id+'.age',Math.floor((s.turn-c.born)/36)));
 const armyOwners=[{aliases:['京营','禁军'],values:[s.nation.army.capital.troops,...(f.entries||[]).filter(e=>e.path==='nation.army.capital.troops').flatMap(e=>[e.before,e.after])]}];
 s.nation.army.frontiers.forEach((b,i)=>armyOwners.push({aliases:[b.dir+'境',b.dir+'边',b.dir+'军',b.name],values:[b.troops,...(f.entries||[]).filter(e=>e.path==='nation.army.frontiers.'+i+'.troops').flatMap(e=>[e.before,e.after])]}));
 for(const p of s.nation.provinces)armyOwners.push({aliases:[p.name],values:[p.garrison]});
 for(const w of s.campaigns||[]){const country=s.foreign.find(c=>c.id===w.country);armyOwners.push({aliases:[country?.name,w.title,...((s.campaigns||[]).filter(w=>!w.done).length===1?['敌军']:[])],values:[w.enemyTroops]});}
 return {sets,ageOwners,armyOwners,add};
}
export function invalidQuantity(q,sentence,evidence){
 if(q.unit==='两'&&(/^[句声步眼行旁侧下回趟遍口天日个分笔字语言]/.test(sentence.slice(q.index+q.raw.length))||!/银|库|帑|款|饷|税|赏|拨|贿|俸|赋|钱粮|万两/.test(sentence)))return false;
 if(['人','名','位'].includes(q.unit)&&!/兵|丁|人口|户口|丁口|军|士卒|征发/.test(sentence))return false;
 // Historical ages are background; current object ages must match that object.
 if(q.kind==='age'&&/先帝|当年|昔年|那年|往年|早年|生前|追忆|曾经/.test(sentence))return false;
 const owners=q.kind==='age'?nearbyOwners(sentence,q.index,evidence.ageOwners):q.kind==='people'?nearbyOwners(sentence,q.index,evidence.armyOwners):null;
 const values=owners?(owners.length?owners.flatMap(o=>o.values):[]):[...evidence.sets[q.kind]];
 return !Number.isFinite(q.value)||!values.some(v=>Number.isFinite(v)&&Math.abs(Math.abs(v)-q.value)<0.01);
}
