export const RESEARCH_CAP=20;
export const INDUSTRY_SLOTS=3;
export const TECH_LINES=['农政','水利','工商','盐铁','海贸'];
export const TECHS=Object.freeze([
 {id:'farming',name:'精耕细作',line:'农政',cost:60,months:3,office:'户部尚书',prereq:[],effects:{grain:0.1},unlocks:['farm'],aliases:['精耕','屯田','圩田']},
 {id:'rice',name:'占城稻推广',line:'农政',cost:100,months:6,office:'户部尚书',prereq:['farming'],effects:{grain:0.15,cropProtection:0.05},unlocks:[],aliases:['占城稻','稻种']},
 {id:'crops',name:'番薯玉米',line:'农政',cost:180,months:9,office:'户部尚书',prereq:['rice'],effects:{grain:0.2,cropProtection:0.1},unlocks:[],aliases:['番薯','玉米','甘薯']},
 {id:'farm-tools',name:'农具范式',line:'农政',cost:240,months:12,office:'工部尚书',prereq:['crops'],effects:{grain:0.05,cropProtection:0.05},unlocks:[],aliases:['农具','耕犁']},
 {id:'waterwheel',name:'水车改良',line:'水利',cost:60,months:3,office:'工部尚书',prereq:[],effects:{riverDiscount:0.1,disasterProtection:0.05},unlocks:[],aliases:['水车','提水']},
 {id:'river',name:'束水攻沙',line:'水利',cost:120,months:6,office:'工部尚书',prereq:['waterwheel'],effects:{riverDiscount:0.1,disasterProtection:0.1},unlocks:[],aliases:['束水','攻沙']},
 {id:'canal',name:'漕运疏浚',line:'水利',cost:180,months:9,office:'工部尚书',prereq:['river'],effects:{cropProtection:0.05},unlocks:['canal'],aliases:['漕运','疏浚']},
 {id:'water-map',name:'水利图籍',line:'水利',cost:240,months:12,office:'工部尚书',prereq:['canal'],effects:{disasterProtection:0.1},unlocks:[],aliases:['水利图','水文']},
 {id:'weaving',name:'织造改良',line:'工商',cost:70,months:4,office:'工部尚书',prereq:[],effects:{},unlocks:['weaving'],aliases:['织造','纺织','织机']},
 {id:'artisans',name:'匠籍松绑',line:'工商',cost:110,months:6,office:'工部尚书',prereq:['weaving'],effects:{prosperity:0.15,governance:0.5},unlocks:['kiln'],aliases:['匠籍','窑场','陶瓷']},
 {id:'silver-tax',name:'银钱折纳',line:'工商',cost:180,months:9,office:'户部尚书',prereq:['artisans'],effects:{prosperity:0.2,governance:-0.5},unlocks:[],aliases:['折纳','银钱']},
 {id:'guilds',name:'行会则例',line:'工商',cost:240,months:12,office:'户部尚书',prereq:['silver-tax'],effects:{prosperity:0.15},unlocks:[],aliases:['行会','商会']},
 {id:'salt',name:'晒盐法',line:'盐铁',cost:60,months:3,office:'工部尚书',prereq:[],effects:{},unlocks:['salt'],aliases:['晒盐','盐场','制盐']},
 {id:'iron',name:'冶铁鼓风',line:'盐铁',cost:100,months:6,office:'工部尚书',prereq:['salt'],effects:{},unlocks:['iron'],aliases:['冶铁','鼓风','铁冶']},
 {id:'firearms',name:'新式火器',line:'盐铁',cost:180,months:9,office:'兵部尚书',prereq:['iron'],effects:{readiness:3},unlocks:[],aliases:['火器','火炮','火铳']},
 {id:'furnace',name:'炉温准式',line:'盐铁',cost:260,months:12,office:'工部尚书',prereq:['firearms'],effects:{production:0.1,readiness:2},unlocks:[],aliases:['炉温','钢炉']},
 {id:'ships',name:'宝船图式',line:'海贸',cost:120,months:6,office:'工部尚书',prereq:[],openSea:true,effects:{trade:0.1},unlocks:[],aliases:['宝船','造船','航海']},
 {id:'customs',name:'市舶则例',line:'海贸',cost:220,months:10,office:'户部尚书',prereq:['ships'],openSea:true,effects:{trade:0.25},unlocks:['customs'],aliases:['市舶','海贸']},
]);
export const INDUSTRIES=Object.freeze({
 farm:{name:'屯田／圩田',tech:'farming',cost:30,months:3,maintenance:0.3,grain:2.8,prosperity:0.45,aliases:['屯田','圩田']},
 weaving:{name:'织造局',tech:'weaving',cost:40,months:4,maintenance:0.7,tax:3,prosperity:0.65,morale:-0.8,aliases:['织造','纺织']},
 kiln:{name:'窑场',tech:'artisans',cost:30,months:3,maintenance:0.5,tax:2.4,prosperity:0.45,aliases:['窑场','陶瓷']},
 salt:{name:'盐场',tech:'salt',cost:35,months:3,maintenance:0.6,cash:3.5,prosperity:0.4,governance:-0.15,aliases:['盐场','晒盐']},
 iron:{name:'铁冶',tech:'iron',cost:45,months:4,maintenance:0.8,tax:2.5,prosperity:0.45,morale:-0.6,readiness:0.6,aliases:['铁冶','冶铁']},
 canal:{name:'漕运',tech:'canal',cost:60,months:5,maintenance:1.2,prosperity:0.6,grainTransport:0.03,aliases:['漕运','运河']},
 customs:{name:'市舶司',tech:'customs',openSea:true,cost:50,months:4,maintenance:1,cash:2,trade:0.08,prosperity:0.75,threat:0.35,aliases:['市舶','海贸']},
});
export function techById(id){return TECHS.find(t=>t.id===id);}
export function seaOpen(s){return s.projects.some(p=>p.edictType==='开海'&&p.done);}
export function techEffects(s){
 const effects={};
 for(const id of s.tech?.done||[])for(const [key,value]of Object.entries(techById(id)?.effects||{}))effects[key]=(effects[key]||0)+value;
 return effects;
}
export function researchLead(s,id){
 return s.court.officials.find(o=>o.id===id&&o.alive&&o.health>0&&!o.retired&&!o.jailed&&o.inCapital!==false&&s.court.posts.some(p=>p.holder===o.id&&p.id===o.post));
}
export function defaultResearchLead(s,tech){
 const post=s.court.posts.find(p=>p.title===(tech?.office||'工部尚书'));
 return researchLead(s,post?.holder)||s.court.officials.find(o=>researchLead(s,o.id));
}
export function identifyTech(s,text,line=null){
 const exact=TECHS.find(t=>text===t.id||text.includes(t.name)||t.aliases.some(a=>text.includes(a)));
 if(exact)return exact;
 const group=TECH_LINES.includes(line)?line:/海|船|航/.test(text)?'海贸':/盐|铁|火|炉/.test(text)?'盐铁':/水|河|渠/.test(text)?'水利':/农|粮|稻|田|种/.test(text)?'农政':'工商';
 return TECHS.find(t=>t.line===group&&!s.tech?.done.includes(t.id))||TECHS.find(t=>t.line===group);
}
export function identifyIndustry(text){return Object.entries(INDUSTRIES).find(([id,r])=>text===id||text.includes(r.name)||r.aliases.some(a=>text.includes(a)))?.[0]||null;}
export function activeIndustryLevels(s,type){
 const quarter=Math.max(0,Math.ceil(s.turn/9)-1);
 return s.nation.provinces.reduce((n,p)=>n+(!p.rebellion&&p.rebellionQuarter!==quarter&&p.morale>=15&&p.disaster<80?(p.industries||[]).filter(i=>i.type===type&&!i.paused).reduce((n,i)=>n+i.level,0):0),0);
}
