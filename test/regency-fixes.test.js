import test from 'node:test';
import assert from 'node:assert/strict';
import {createState, TALENTS, migrate, VERSION, assertState, reignId} from '../src/core/state.js';
import {applyScenario, SCENARIOS} from '../src/core/scenarios.js';
import {initialTurn, forecastTurn, commitTurn, validateSchedule} from '../src/core/turn.js';
import {regentPerson, chooseRegent} from '../src/core/regency-info.js';
import {factionOptionScore, proxyMemorial} from '../src/core/court.js';
import {advanceRegency, succeedEmperor} from '../src/core/succession.js';
import {privateAction} from '../src/core/private.js';
import {emperorYear} from '../src/core/emperor.js';
import {createMemorialSession, memorialAction} from '../src/ui/memorials.js';
import {actionAvailability, memorialEntryKind} from '../src/ui/view-model.js';
import {pack, unpack, createSaveStore} from '../src/store/save.js';
const open=(id='song-renzong')=>initialTurn(applyScenario(createState({seed:'摄政修复-'+id}),id));
const rest={朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}};
const child=s=>s.harem.children.find(c=>c.id===s.reign.emperorId);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('奏报匣依上朝可用性选择批折：摄政朝间、已占朝间、御驾在外及正常亲政',()=>{
  const s=open();assert.match(actionAvailability(s,'上朝'),/摄政/);assert.equal(memorialEntryKind(s,'朝'),'批折');
  const m=s.memorials[0],session=createMemorialSession(s,memorialEntryKind(s,'朝'),'朝',m.id);
  session.choices[m.id]=m.options.find(o=>o.id!=='hold').id;s.schedule.朝=memorialAction(s,session);
  assert.doesNotThrow(()=>validateSchedule(s,s.schedule));const f=forecastTurn(s,s.schedule),n=commitTurn(s,f,{});
  assert.ok(!n.memorials.some(x=>x.id===m.id));assert.deepEqual(commitTurn(n,f,{}),n);
  const adult=open('tang-taizong');assert.equal(memorialEntryKind(adult,'朝'),'上朝');assert.equal(memorialEntryKind(adult,'午'),'批折');
  adult.schedule.朝={kind:'歇息'};assert.equal(memorialEntryKind(adult,'朝'),'批折');
  adult.schedule.朝=null;adult.campaigns=[{personal:true,done:false}];assert.equal(memorialEntryKind(adult,'朝'),'批折');
});
test('宋仁宗太后派系来自剧本；择摄政与在位太后使用同一派系规则',()=>{
  const s=open(),liu=s.court.factions.find(f=>f.name==='刘氏外戚');assert.equal(s.dowagerFaction,liu.id);assert.equal(regentPerson(s).faction,liu.id);
  for(const o of s.court.officials)o.abilities.权谋=0;
  assert.equal(chooseRegent(s).id,'dowager');assert.equal(chooseRegent(s).faction,liu.id);
  assert.deepEqual(SCENARIOS.filter(sc=>sc.regent==='dowager').map(sc=>sc.id),['song-renzong']);
});
test('摄政代批按刘氏外戚评分取最高分，而非台谏清议',()=>{
  const s=open(),m={id:'regency-choice',title:'请封太后亲族',type:'恩荫',request:'请裁定家族封赏',due:10,options:[
    {id:'family',label:'准奏册封',effects:{faction:{f2:1}}},
    {id:'audit',label:'驳回并查吏治',effects:{governance:3}},
    {id:'hold',label:'留中',effects:{}}
  ]};s.memorials=[m];
  const liu=s.court.factions.find(f=>f.id===regentPerson(s).faction),qing=s.court.factions[0];
  assert.ok(factionOptionScore(liu,m,m.options[0])>factionOptionScore(liu,m,m.options[1]));
  assert.ok(factionOptionScore(qing,m,m.options[0])<factionOptionScore(qing,m,m.options[1]));
  const p=proxyMemorial(s,{minister:regentPerson(s),label:'摄政代批'});assert.equal(p.optionId,'family');assert.match(p.note,/刘太后摄政代批.*准奏册封/);
  const f=forecastTurn(s,rest);assert.ok(f.notes.includes(p.note));
});
test('仁宗第一旬不覆盖五才；经筵文采和教养增量逐旬保留',()=>{
  let s=open();const before=structuredClone(s),base={...s.emperor.talents};
  s=commitTurn(s,forecastTurn(s,rest),{});assert.deepEqual(s.emperor.talents,base);assert.deepEqual(before.emperor.talents,base);
  const study={朝:{kind:'私下行事',operation:'经筵'},午:{kind:'私下行事',operation:'经筵'},夜:{kind:'歇息'}};
  for(let i=1;i<=3;i++){
    s=commitTurn(s,forecastTurn(s,study),{});near(s.emperor.talents.文采,base.文采+i*0.44);near(s.emperor.talents.政略,base.政略+i*0.04);
    assert.ok(s.emperor.talents.魅力>s.emperor.talents.文采&&s.emperor.talents.文采>s.emperor.talents.政略&&s.emperor.talents.政略>s.emperor.talents.权谋&&s.emperor.talents.权谋>s.emperor.talents.武略);
  }
});
test('历史幼帝的年龄、教养与经筵共用每年每才+3，封顶增量不留待明年补领',()=>{
  for(const id of ['song-renzong','ming-wanli','qing-kangxi']){
    let s=open(id),base={...s.emperor.talents};
    for(let i=0;i<40;i++){s=privateAction(s,{operation:'经筵'}).state;s=advanceRegency(s);}
    near(s.emperor.talents.文采-base.文采,3);
    s.turn=36;s=emperorYear(s);s=advanceRegency(s);
    for(const t of TALENTS)assert.ok(s.emperor.growth[t]<=3);
    const after={...s.emperor.talents};s=advanceRegency(s);assert.deepEqual(s.emperor.talents,after);
  }
});
test('仁宗走完四年并在十六岁亲政当旬保留高低差异和经筵积累',()=>{
  const results=[];
  for(const study of [false,true]){
    let s=open();s.settings.freedom='free';const schedule=study?{...rest,朝:{kind:'私下行事',operation:'经筵'},午:{kind:'私下行事',operation:'经筵'}}:rest;
    for(let i=0;i<144;i++){
      const before={...s.emperor.talents};s=commitTurn(s,forecastTurn(s,schedule),{});
      for(const t of TALENTS){assert.ok(s.emperor.talents[t]>=before[t]);assert.ok(s.emperor.growth[t]<=3+1e-9);}
      assertState(s);
    }
    assert.equal(s.emperor.age,16);assert.equal(s.regency,null);assert.equal(s.harem.consorts.filter(c=>!c.retired).length,3);
    assert.ok(s.emperor.talents.魅力>s.emperor.talents.文采&&s.emperor.talents.文采>s.emperor.talents.政略&&s.emperor.talents.政略>s.emperor.talents.权谋&&s.emperor.talents.权谋>s.emperor.talents.武略);
    const talents={...s.emperor.talents};s=commitTurn(s,forecastTurn(s,rest),{});assert.deepEqual(s.emperor.talents,talents);results.push(talents);
  }
  assert.ok(results[1].文采>results[0].文采);console.log('仁宗亲政五才：歇息 / 两次经筵',results);
});
test('婴儿及幼年继位保留原初值、自然成熟、摄政与亲政大婚；学习不被重置',()=>{
  for(const age of [0,8,15]){
    let s=initialTurn(createState({seed:'继位-'+age}));s.turn=600;
    s.harem.children=[{id:'infant',name:'萧幼宁',sex:'男',born:s.turn-age*36,health:90,aptitude:70,education:20,mother:'c0',fatherId:reignId(s),faction:'f0'}];s.harem.heir='infant';s.ending={type:'驾崩'};
    s=succeedEmperor(s);const base=70*age/16+2;for(const t of TALENTS)near(s.emperor.talents[t],base);
    assert.ok(s.regency);assert.equal(s.dowagerFaction,'f0');
    s=privateAction(s,{operation:'经筵'}).state;s.turn+=36;child(s).education+=1;
    s=advanceRegency(s);for(const t of TALENTS)near(s.emperor.talents[t],base+70/16+0.12+(t==='文采'?0.2:0));
    if(age===15){assert.equal(s.regency,null);assert.equal(s.harem.consorts.filter(c=>!c.retired).length,3);}else assert.ok(s.regency);
  }
});
test('v23仁宗档纠正太后派系，基准从当前值起算；迁移及往返不改原档',()=>{
  const old=open();old.v=23;delete old.dowagerFaction;delete old.regency.growth;old.turn=5;old.emperor.talents=Object.fromEntries(TALENTS.map(t=>[t,59.9]));
  const before=structuredClone(old),s=migrate(old);assert.equal(s.v,VERSION);assert.equal(s.dowagerFaction,'f2');assert.equal(regentPerson(s).faction,'f2');
  assert.deepEqual(s.emperor.talents,old.emperor.talents);assert.deepEqual(advanceRegency(s).emperor.talents,s.emperor.talents);assert.deepEqual(old,before);
  assert.deepEqual(migrate(unpack(pack(s)).state),s);
});
test('v23摄政冻结待续按原骰提交，不重算代批、成长或钱粮，提交后补基准且幂等',()=>{
  const old=open();old.v=23;delete old.dowagerFaction;delete old.regency.growth;
  const f=forecastTurn(old,rest);f.state.v=23;delete f.state.dowagerFaction;delete f.state.regency.growth;old.pending={forecast:f};
  const raw=JSON.stringify(f),s=migrate(old);assert.equal(JSON.stringify(s.pending.forecast),raw);
  const n=commitTurn(s,s.pending.forecast,{});assert.equal(n.v,VERSION);assert.equal(n.lastTurn.die,f.die);assert.equal(n.rng,f.state.rng);assert.deepEqual(n.nation,f.state.nation);assert.deepEqual(n.emperor.talents,f.state.emperor.talents);assert.equal(n.dowagerFaction,'f2');assert.deepEqual(commitTurn(n,f,{}),n);
});
test('v24成长基准损坏进入只读保护；不覆盖可恢复的原存档',async()=>{
  const s=open();s.regency.growth.education='损坏';const raw=pack(s);let writes=0;
  const store=createSaveStore({primary:{get:async()=>raw,put:async()=>writes++},backup:{getItem:()=>JSON.stringify(raw),setItem:()=>writes++},validate:migrate});
  const loaded=await store.load(1);assert.equal(loaded.readOnly,true);assert.equal(writes,0);
});
test('后继皇帝择母族派系，不沿用仁宗剧本的刘氏外戚',()=>{
  const s=open();s.reign.number=2;s.harem.consorts=[{id:'new-mother',name:'新太后',faction:'f4',scheming:100}];child(s).mother='new-mother';s.dowager='新太后';
  assert.equal(regentPerson(s).faction,'f4');assert.equal(chooseRegent(s).faction,'f4');
});
