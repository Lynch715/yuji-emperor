import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createState, migrate, VERSION } from '../src/core/state.js';
import { assignFaces } from '../src/core/faces.js';
import { initialTurn, forecastTurn, commitTurn } from '../src/core/turn.js';
import { applyScenario, SCENARIOS } from '../src/core/scenarios.js';
import { portraitPool, poolFaceIndex, resolvePortraits, withPortraitArt, portraitSource, portraitHTML, candidateFace, sceneKey, sceneHTML, withChapterArt } from '../src/ui/art.js';
import { ART_POOLS, ART_UNIQUE, ART_SCENES, ART_HALLS } from '../src/ui/art-manifest.js';
const start=seed=>initialTurn(createState({seed,freedom:'free'}));
const people=s=>[s.emperor,...s.court.officials,...s.harem.consorts,...s.harem.candidates,...s.harem.children,...s.harem.royalWomen,...s.foreign];
test('脸号为确定性纯函数，官员共用递增号，候选与后妃接续同一计数器',()=>{
 const raw=createState({seed:'脸号'}),before=structuredClone(raw),a=assignFaces(raw),b=assignFaces(raw);
 assert.deepEqual(a,b);assert.deepEqual(raw,before);assert.equal(a.rng,raw.rng);
 assert.deepEqual(a.court.officials.map(o=>o.faceNo),Array.from({length:25},(_,i)=>i));
 assert.deepEqual(assignFaces(a),a);
 assert.equal(assignFaces(a),a,'无补号时保留状态引用，不能打断正在进行的界面请求');
 const s=start('脸号');assert.ok(people(s).every(p=>Number.isSafeInteger(p.faceNo)));
 const candidate=s.harem.candidates[0],accepted={...s,harem:{...s.harem,consorts:[...s.harem.consorts,candidate],candidates:s.harem.candidates.slice(1)}};
 assert.equal(assignFaces(accepted).harem.consorts.at(-1).faceNo,candidate.faceNo);
});
test('v23老档按数组顺序补号，不改数值和原预演，不在原存档上写入',()=>{
 const old=start('迁移');old.v=23;delete old.faceCounters;for(const p of people(old))delete p.faceNo;
 old.harem.children.push({id:'art-child',name:'萧和',sex:'男',born:0,health:90,aptitude:60,education:0,mother:'c0',fatherId:old.runId});
 old.pending={forecast:forecastTurn(old)};
 const bytes=JSON.stringify(old),pending=JSON.stringify(old.pending),next=migrate(old);
 assert.equal(VERSION,25);assert.equal(next.v,25);assert.equal(JSON.stringify(old),bytes);assert.equal(JSON.stringify(next.pending),pending);
 assert.ok(people(next).every(p=>Number.isSafeInteger(p.faceNo)));
 assert.equal(next.rng,old.rng);assert.deepEqual(next.nation,old.nation);assert.deepEqual(next.emperor.talents,old.emperor.talents);
 assert.deepEqual(next.court.officials.map(p=>p.faceNo),Array.from({length:25},(_,i)=>i));
 const done=commitTurn(next,next.pending.forecast,{});assert.ok(people(done).every(p=>Number.isSafeInteger(p.faceNo)));
 assert.deepEqual(commitTurn(done,next.pending.forecast,{}),done);
});
test('新人物在回合末尾补号，旧人号和计数器不回退，保护共享亡故人物',()=>{
 const s=start('新脸'),f=forecastTurn(s),old=f.state.court.officials[0];
 f.state.court.officials.push({...old,id:'new-art-official',faceNo:undefined});
 const done=commitTurn(s,f,{});assert.equal(done.court.officials.at(-1).faceNo,s.faceCounters.official);
 assert.equal(done.faceCounters.official,s.faceCounters.official+1);assert.equal(f.state.court.officials.at(-1).faceNo,undefined);
 const raw=createState();raw.court.officials[0].alive=false;assignFaces(raw);assert.equal(raw.court.officials[0].faceNo,undefined);
 assert.throws(()=>assignFaces({...s,emperor:{...s.emperor,faceNo:-1}}),/脸号/);
});
test('同池前N人不提前撞脸，跨职类和年龄仍只发一个官员计数器',()=>{
 for(const size of [16,10,4,2]){
  const s=start('前N');s.court.officials=Array.from({length:size+1},(_,i)=>({...s.court.officials[0],id:'art-o'+i,age:40,faceNo:i*16}));
  const indices=s.court.officials.slice(0,16).map(o=>poolFaceIndex(s,o));
  assert.equal(new Set(indices).size,Math.min(16,size+1));
 }
 for(const seed of ['art-phase1','yuji','脸号回归']){
  const s=start(seed),groups=new Map();assert.equal(s.court.officials.length,25);
  assert.equal(new Set(s.court.officials.map(o=>o.faceNo)).size,25);
  for(const p of s.court.officials){const key=portraitPool(s,p);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  for(const [key,list]of groups){const n=ART_POOLS[key].length;assert.equal(new Set(list.slice(0,n).map(p=>poolFaceIndex(s,p))).size,Math.min(n,list.length),seed+key);}
 }
});
test('大晟开局25名官员无重复脸，已故者保留最后池且其余人的脸不变',()=>{
 const s=withPortraitArt(start('脸号回归')),before=resolvePortraits(s),keys=s.court.officials.map(p=>p.id);
 assert.equal(new Set(keys.map(id=>before[id].pool+':'+before[id].index)).size,25);
 const dead=structuredClone(s),general=dead.court.officials.find(p=>dead.court.posts[9].holder===p.id);
 general.alive=false;general.health=0;general.post=null;dead.court.posts[9].holder=null;
 dead.court.officials[0].alive=false;dead.court.officials[0].health=0;dead.court.officials[0].post=null;
 for(const post of dead.court.posts)if(post.holder===dead.court.officials[0].id)post.holder=null;
 const bytes=JSON.stringify(dead),after=resolvePortraits(dead);
 assert.deepEqual(after,before);assert.equal(JSON.stringify(dead),bytes);
 assert.equal(after[general.id].pool,'ming/general-all');
 assert.deepEqual(resolvePortraits(migrate(dead)),before);
});
test('满池新来者先复用全为已故占用者的脸，旧溢出者不因死亡换脸，无空位才取模',()=>{
 let s=start('满池');s.court.officials=Array.from({length:17},(_,i)=>({...s.court.officials[0],id:'overflow-'+i,age:40,faceNo:i}));
 for(const post of s.court.posts)post.holder=null;
 s=withPortraitArt(s);const before=resolvePortraits(s);
 assert.equal(before['overflow-16'].index,0);
 s.court.officials[2].alive=false;s.court.officials[2].health=0;
 assert.deepEqual(resolvePortraits(s),before,'死亡本身不重排已经有脸的溢出者');
 s.court.officials.push({...s.court.officials[0],id:'overflow-17',faceNo:17});
 let next=resolvePortraits(s);assert.equal(next['overflow-17'].index,2);
 s=withPortraitArt(s);s.court.officials.push({...s.court.officials[0],id:'overflow-18',faceNo:18});
 next=resolvePortraits(s);assert.equal(next['overflow-18'].index,18%16,'死者的脸已被活人复用，不能再按全已故复用');
});
test('清单完整预留377张，专属像只按当前剧本与姓名查，未出图不请求',()=>{
 assert.equal(Object.values(ART_POOLS).reduce((n,p)=>n+p.length,0),207);
 assert.equal(Object.values(ART_UNIQUE).flatMap(x=>Object.values(x)).reduce((n,p)=>n+Object.keys(p).length,0),154);
 assert.equal(Object.keys(ART_SCENES).length+Object.keys(ART_HALLS).length,16);
 for(const sc of SCENARIOS){const s=initialTurn(applyScenario(createState(),sc.id));
  for(const p of [s.emperor,...s.court.officials.slice(0,sc.officials.length),...s.harem.consorts,...s.harem.children,...s.foreign])assert.ok(ART_UNIQUE[sc.id][p.ruler||p.name]);
  if(s.dowager)assert.ok(ART_UNIQUE[sc.id][s.dowager]);
 }
 const s=start('取图'),p=s.court.officials[0],old=ART_POOLS['ming/official-mature'][0];
 assert.equal(portraitSource(s,{name:'未知',faceNo:0}),null);
 assert.ok(!portraitHTML(s,{name:'未知',faceNo:0}).includes('<img'));
 assert.equal(candidateFace('same-id'),candidateFace('same-id'));
 const female={...p,gender:'女'};assert.equal(portraitPool(s,female),null);
 const q=initialTurn(applyScenario(createState(),'qing-kangxi')),e=q.court.officials.find(o=>o.id===q.court.posts[8].holder);
 assert.match(portraitPool(q,e),/^qing\/official-/);
});
test('汉郎中令下标8取文官、中书谒者令下标10取宦官，其他朝代分池不变',()=>{
 const han=initialTurn(applyScenario(createState({seed:'汉官制取图'}),'han-wudi'));
 const wang=han.court.officials.find(p=>p.name==='王臧'),before=JSON.stringify(han);
 assert.equal(han.court.posts[8].holder,wang.id);
 assert.equal(portraitPool(han,wang),'han/official-mature');
 assert.equal(JSON.stringify(han),before,'取图不修改人物或官职');
 const cases=[
  [null,'ming/eunuch-all','ming/official-mature'],
  ['han-wudi','han/official-mature','han/eunuch-all'],
  ['tang-taizong','tang/eunuch-all','tang/official-mature'],
  ['song-renzong','song/eunuch-all','song/official-mature'],
  ['ming-wanli','ming/eunuch-all','ming/official-mature'],
  ['ming-chongzhen','ming/eunuch-all','ming/official-mature'],
  ['qing-kangxi','qing/official-mature','qing/official-mature'],
  ['qing-yongzheng','qing/official-mature','qing/official-mature'],
 ];
 for(const [id,at8,at10] of cases)for(const [index,expected] of [[8,at8],[10,at10]]){
  const s=id?initialTurn(applyScenario(createState({seed:'官制回归'}),id)):start('大晟官制');
  const p={...s.court.officials[0],id:'art-post-probe',age:40,post:s.court.posts[index].id};
  s.court.officials=[p];for(const post of s.court.posts)post.holder=null;
  s.court.posts[index].holder=p.id;
  assert.equal(portraitPool(s,p),expected,`${id||'大晟'}下标${index}`);
 }
});
test('场景按行动和地点取图，章节可选显示元数据不改结算和预演',()=>{
 assert.equal(sceneKey({kind:'上朝'}),'court');assert.equal(sceneKey({kind:'歇息'},'夜'),'desk-night');
 assert.equal(sceneKey({kind:'自拟情节',place:'花园凉亭'}),'garden');assert.equal(sceneKey({kind:'自拟情节',place:'城外驿站'}),'tour');
 assert.equal(sceneKey({kind:'后宫'},'午'),'garden');assert.equal(sceneKey({kind:'后宫'},'夜'),'palace');
 const s=start('章节图'),f=forecastTurn(s),raw=JSON.stringify(f),done=commitTurn(s,f,{}),art=withChapterArt(done,f);
 assert.deepEqual(art.history.at(-1).artScenes,{朝:'desk-day',午:'desk-day',夜:'desk-night'});
 assert.equal(JSON.stringify(f),raw);assert.deepEqual(art.nation,done.nation);assert.deepEqual(withChapterArt(art,f),art);
 assert.equal(sceneHTML('不存在'), '');
});
test('汉唐宋明清七剧本全部开局人物优先取专属像，40岁切换老年像，同名不串剧本',()=>{
 for(const id of ['han-wudi','tang-taizong','song-renzong','ming-wanli','ming-chongzhen','qing-kangxi','qing-yongzheng']){
  const sc=SCENARIOS.find(x=>x.id===id),s=initialTurn(applyScenario(createState({seed:'专属取图'}),id)),before=JSON.stringify(s);
  const base=`assets/art/portraits/unique/${id}/emperor-01.webp`,old=`assets/art/portraits/unique/${id}/emperor-01-old.webp`;
  assert.equal(portraitSource(s,s.emperor),s.emperor.age>=40?old:base);
  for(const p of [s.emperor,...s.court.officials.slice(0,sc.officials.length),...s.harem.consorts,...s.harem.children,...s.foreign]){
   const name=p.ruler||p.name;assert.equal(portraitSource(s,p),ART_UNIQUE[id][name][p===s.emperor&&p.age>=40?'old':'base'],name);assert.ok(portraitSource(s,p)?.includes(`/unique/${id}/`),name);
  }
  if(s.dowager)assert.equal(portraitSource(s,{name:s.dowager}),ART_UNIQUE[id][s.dowager].base);
  for(const age of [39,40]){const aged=structuredClone(s);aged.emperor.age=age;assert.equal(portraitSource(aged,aged.emperor),age<40?base:old);}
  const custom=start('同名不串剧本');custom.emperor.name=s.emperor.name;assert.notEqual(portraitSource(custom,custom.emperor),base);
  assert.equal(JSON.stringify(s),before,'取图不修改状态');
 }
});
test('清单仅引用已导出的WebP，尺寸体积预算与文件一一对应',()=>{
 const paths=[...Object.values(ART_POOLS).flat(),...Object.values(ART_UNIQUE).flatMap(s=>Object.values(s).flatMap(p=>Object.values(p))),
  ...Object.values({...ART_SCENES,...ART_HALLS}).flatMap(s=>[s.src,s.small])].filter(Boolean);
 const actual=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())walk(path);else actual.push(path);}}
 walk('assets/art');assert.deepEqual([...new Set(paths)].sort(),actual.sort());
 assert.equal(actual.length,390,'377张原画及13个场景720派生档；汉制池33张、汉武帝专属20张全部完成');
 assert.ok(actual.reduce((sum,path)=>sum+statSync(path).size,0)<=12000000);
 for(const path of actual){assert.match(path,/\.webp$/);assert.ok(statSync(path).size<=(path.includes('/portraits/')?30000:path.includes('/halls/')?100000:path.endsWith('-720.webp')?60000:150000));}
});

test('唐清皇子满16岁切换本人成年专属像，取图不改脸号、年龄或存档',()=>{
 for(const [id,names] of [['qing-yongzheng',['弘历','福惠']],['tang-taizong',['李承乾','李泰','李恪']]]){
  const s=initialTurn(applyScenario(createState({seed:'成年专属变体'}),id));
  for(const name of names){
   const p=s.harem.children.find(p=>p.name===name);assert.ok(p,id+name);
   assert.ok(ART_UNIQUE[id][name].base);assert.ok(ART_UNIQUE[id][name].adult);
   assert.notEqual(ART_UNIQUE[id][name].base,ART_UNIQUE[id][name].adult);
   for(const age of [6,7,15,16,20]){
    const state=structuredClone(s),child=state.harem.children.find(c=>c.id===p.id);child.born=state.turn-age*36;
    const before=JSON.stringify(state),faceNo=child.faceNo,expected=ART_UNIQUE[id][name][age<16?'base':'adult'];
    assert.equal(portraitSource(state,child),expected,id+name+age);assert.equal(child.faceNo,faceNo);assert.equal(JSON.stringify(state),before);
   }
  }
 }
});
