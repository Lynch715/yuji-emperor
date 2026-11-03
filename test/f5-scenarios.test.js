import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,assertState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {SCENARIOS,applyScenario,postTitle,scenarioPreview} from '../src/core/scenarios.js';
import {strongmanCandidate} from '../src/core/court.js';
import {mockNarrative,validateTurn} from '../src/llm/validate.js';
import {systemPrompt,turnMessages,dynastyBible} from '../src/llm/prompts.js';
import {personNames} from '../src/core/names.js';
import {simulate} from '../scripts/simulate.mjs';
import {createOpening} from '../src/ui/new-game.js';

const open=id=>initialTurn(applyScenario(createState({seed:'f5-'+id}),id));
const rest={朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}};

test('F5 七个剧本：开局状态合法、核心人物在位、名字不重复',()=>{
  assert.equal(SCENARIOS.length,7);
  for(const sc of SCENARIOS){
    const s=open(sc.id);assertState(s);
    assert.equal(s.emperor.name,sc.emperor[0]);assert.equal(s.era.name,sc.era);assert.equal(s.dynasty,sc.dynasty);
    for(const line of sc.officials){const [name,post]=line.split('|');const o=s.court.officials.find(o=>o.name===name);assert.ok(o,name);assert.equal(s.court.posts.find(p=>p.id==='p'+post).holder,o.id,name+' 职位');}
    const people=[...s.court.officials,...s.harem.consorts,...s.harem.children].map(p=>p.name);
    assert.equal(new Set(people).size,people.length,sc.id+' 重名');
    assert.equal(s.court.posts.filter(p=>p.holder).length,new Set(s.court.posts.filter(p=>p.holder).map(p=>p.holder)).size,'一人一职');
    assert.deepEqual(scenarioPreview(sc).cast.length,6);
  }
});
test('F5 官职与地方长官按朝代显示，引擎内部职名不变',()=>{
  const s=open('tang-taizong'),p0=s.court.posts.find(p=>p.id==='p0'),gov=s.court.posts.find(p=>p.provinceId);
  assert.equal(p0.title,'内阁首辅');assert.equal(postTitle(s,p0),'尚书左仆射');
  assert.equal(postTitle(s,gov),s.nation.provinces.find(z=>z.id===gov.provinceId).name+'刺史');
  const bible=dynastyBible(s);assert.ok(bible.includes('房玄龄｜中书令'));assert.ok(!bible.includes('内阁首辅'));
  const plain=initialTurn(createState({seed:'f5-plain'}));assert.equal(postTitle(plain,plain.court.posts[0]),'内阁首辅');
});
test('F5 系统提示声明史实只作开局、以引擎为准；自拟王朝保持原措辞',()=>{
  const sys=systemPrompt(open('ming-wanli'));assert.match(sys,/1572年明神宗即位之初/);assert.match(sys,/已偏离史实/);assert.doesNotMatch(sys,/架空/);
  assert.match(systemPrompt(initialTurn(createState({seed:'f5-x'}))),/架空王朝/);
});
test('F5 幼帝剧本摄政至十六岁亲政，按预设人选大婚',()=>{
  let s=open('song-renzong');assert.equal(s.regency.regentId,'dowager');assert.equal(s.dowager,'刘太后');assert.equal(s.harem.consorts.length,0);
  for(let i=0;i<4*36+1&&s.regency;i++){const f=forecastTurn(s,{朝:{kind:'批折',memorials:[]},午:null,夜:null});s=commitTurn(s,f,{});}
  assert.equal(s.regency,null);assert.equal(s.emperor.age,16);
  assert.deepEqual(s.harem.consorts.slice(0,3).map(c=>c.name),['郭氏','曹氏','张氏']);
  const k=open('qing-kangxi');assert.equal(k.court.officials.find(o=>o.id===k.regency.regentId).name,'索尼');assert.equal(k.regency.until,(16-7)*36);
});
test('F5 权臣剧本开局即有权臣：鳌拜、魏忠贤、丁谓',()=>{
  for(const [id,name] of [['qing-kangxi','鳌拜'],['ming-chongzhen','魏忠贤'],['song-renzong','丁谓']])
    assert.equal(strongmanCandidate(open(id))?.name,name,id);
});
test('F5 清朝皇嗣按字辈取名，唐朝无太后时名册不虚构太后',()=>{
  const y=open('qing-yongzheng');assert.equal(y.childNaming.男,'弘');assert.ok(y.harem.children.some(c=>c.name==='弘历'));
  const t=open('tang-taizong');assert.equal(t.dowager,null);assert.ok(!dynastyBible(t).includes('慈宁太后'));
  assert.equal(t.harem.heir,t.harem.children.find(c=>c.name==='李承乾').id);
});
test('F5 开局事实与追忆叙述不被校验误删',()=>{
  const s=open('tang-taizong'),f=forecastTurn(s,rest);
  const text='玄武门之变那年，尉迟敬德曾亲斩齐王，至今朝中仍有人私下议论。';
  assert.equal(validateTurn({chapter:{朝:text,午:'',夜:''}},f).chapter.朝,text);
  assert.ok(turnMessages(s,f)[1].content.includes('渭水便桥'));
});
test('F5 剧本开局走 createOpening 时不请求模型铸世',async()=>{
  let called=false;
  const s=await createOpening({scenario:'han-wudi',demo:false,seed:'f5-open'},[], {key:'k',base:'https://x.test',model:'m'},{fetcher:async()=>{called=true;throw new Error('不应请求');}});
  assert.equal(called,false);assert.equal(s.emperor.name,'刘彻');assert.equal(s.scenario,'han-wudi');
});
test('F5 存档 v10：旧档补剧本字段为空',()=>{
  assert.equal(VERSION,10);const s=createState({seed:'f5-mig'});s.v=9;for(const k of ['scenario','postNames','governorTitle','childNaming','weddingNames'])delete s[k];
  const m=migrate(s);for(const k of ['scenario','postNames','governorTitle','childNaming','weddingNames'])assert.equal(m[k],null,k);
});
for(const sc of SCENARIOS)test('F5 剧本 '+sc.id+' 跑满 40 年无模型模拟不出错',()=>{
  const r=simulate(40,'f5-sim-'+sc.id,{scenario:sc.id});assert.ok(r);
});
