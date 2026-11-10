import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createState,migrate,assertState,VERSION} from '../src/core/state.js';
import {applyScenario,postTitle} from '../src/core/scenarios.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {createOpening} from '../src/ui/new-game.js';
import {portraitPool,portraitSource} from '../src/ui/art.js';
import {systemPrompt} from '../src/llm/prompts.js';
import {strongmanCandidate} from '../src/core/court.js';

const ids=['han-lingdi','song-huizong','ming-xizong'];
const start=id=>initialTurn(applyScenario(createState({seed:'昏君回归-'+id}),id));
test('三个开局的长短处、派系和边患各不相同，成年天子可以自行理政',()=>{
 const [han,song,ming]=ids.map(start);
 for(const s of [han,song,ming]){
  assertState(s);assert.equal(s.regency,null);assert.ok(s.emperor.talents.政略<40);
  assert.ok(strongmanCandidate(s),'近侍或权相已具备代批能力');
 }
 assert.equal(han.emperor.name,'刘宏');assert.ok(han.nation.governance<song.nation.governance);
 assert.ok(han.nation.privy>han.nation.treasury,'宫中聚财而国库缺钱');
 assert.ok(han.court.officials.find(o=>o.name==='张让').greed>han.court.officials.find(o=>o.name==='蔡邕').greed);
 assert.ok(han.harem.children.some(c=>c.name==='刘辩'));assert.equal(han.harem.heir,null);
 assert.equal(song.emperor.name,'赵佶');assert.equal(song.emperor.talents.文采,98);
 assert.equal(song.harem.children.find(c=>c.id===song.harem.heir).name,'赵桓');
 assert.ok(song.foreign.some(f=>f.name==='金'&&f.ruler==='完颜阿骨打'));
 assert.equal(ming.emperor.name,'朱由校');assert.equal(ming.emperor.age,16);
 assert.ok(ming.nation.army.frontiers.find(b=>b.dir==='东').threat>song.nation.army.frontiers.find(b=>b.dir==='北').threat);
 assert.ok(ming.foreign.some(f=>f.name==='后金'&&f.ruler==='努尔哈赤'));
});
test('同朝异时官制显示不串局，内部职位与职掌规则仍保留',()=>{
 const s=start('han-lingdi'),p=s.court.posts[0];
 assert.equal(p.title,'内阁首辅');assert.equal(postTitle(s,p),'司徒');
 assert.equal(postTitle(start('han-wudi'),p),'丞相');
 const x=start('ming-xizong'),w=x.court.officials.find(o=>o.name==='魏忠贤');
 assert.equal(postTitle(x,x.court.posts.find(p=>p.holder===w.id)),'司礼监秉笔');
 assert.equal(postTitle(start('ming-chongzhen'),x.court.posts[8]),'司礼监掌印');
});
test('新剧本按朝代池取现成头像，不冒用既有剧本专属像；宋两位宦官均无须',()=>{
 for(const id of ids){
  const s=start(id),before=JSON.stringify(s);
  for(const p of [s.emperor,...s.court.officials,...s.harem.consorts,...s.harem.children,...s.foreign]){
   const path=portraitSource(s,p);assert.ok(path&&existsSync(path),p.name||p.ruler);
   assert.ok(!path.includes('/unique/'),path);
  }
  assert.equal(JSON.stringify(s),before,'纯取图不改脸号或随机数');
 }
 const s=start('song-huizong');
 for(const name of ['童贯','梁师成'])assert.equal(portraitPool(s,s.court.officials.find(o=>o.name===name)),'song/eunuch-all');
 assert.equal(portraitPool(s,s.court.officials.find(o=>o.name==='蔡京')),'song/official-old');
});
for(const id of ids)test(id+' 试读、四目标、存读与待续提交兼容，无模型铸世或预言历史结局',async()=>{
 const s=await createOpening({scenario:id,demo:true,seed:'新局-'+id},[],{}, {fetcher:()=>assert.fail('历史开局不请求模型铸世')});
 assert.equal(s.ambitions.length,4);assert.ok(s.ambitions.every(a=>a.scenarioId===id&&a.status==='进行中'));
 const f=forecastTurn(s);s.pending={forecast:f};const bytes=JSON.stringify(s),next=migrate(s);
 assert.equal(VERSION,25);assert.equal(JSON.stringify(s),bytes);assert.deepEqual(next.pending.forecast,f);
 const done=commitTurn(next,f,{});assertState(done);assert.deepEqual(commitTurn(done,f,{}),done);
 assert.match(systemPrompt(s),/史实局势开局/);assert.doesNotMatch(systemPrompt(s),/即位之初/);
});
