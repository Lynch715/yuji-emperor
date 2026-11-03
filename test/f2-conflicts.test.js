import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {validateTurn,validateTalk,mockNarrative} from '../src/llm/validate.js';
import {turnMessages,talkMessages,worldMessages,settlementDigest} from '../src/llm/prompts.js';
import {talkAttempt} from '../src/core/court.js';

const rest={朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}};
const setup=()=>{const s=initialTurn(createState({seed:'f2'}));return {s,f:forecastTurn(s,rest)};};

test('F2-C1 常见叙述不再被误删：量词“两”、追忆、背景描写、旧日履历',()=>{
  const {s,f}=setup(),n=s.court.officials[0].name;
  const keep=[n+'只说了一两句，便退回班列。','陛下三两步走下丹墀。','先帝驾崩那年，'+n+'年方二十。','北狄屡屡入寇，边民苦之。',n+'自出任户部以来，夙夜在公。'];
  const r=validateTurn({chapter:{朝:keep.slice(0,3).join(''),午:keep.slice(3).join(''),夜:'宫灯渐暗。'}},f);
  for(const line of keep)assert.ok((r.chapter.朝+r.chapter.午).includes(line),'不应删除：'+line);
});
test('F2-C1 本旬凭空的死亡、战果、金额仍被删除',()=>{
  const {s,f}=setup(),n=s.court.officials[0].name;
  const r=validateTurn({chapter:{朝:n+'于殿中病故。',午:'朝廷拨银三十七万两赈济。',夜:'我军大捷，收复三城。'}},f);
  assert.ok(!r.chapter.朝.includes('病故'));assert.ok(!r.chapter.午.includes('三十七万两'));assert.ok(!r.chapter.夜.includes('大捷'));
});
test('F2-C1 校验后某段被删空时以试读文案补足，不触发全空重试',()=>{
  const {s,f}=setup(),n=s.court.officials[0].name;
  const r=validateTurn({chapter:{朝:n+'于殿中病故。',午:'',夜:'宫灯渐暗。'}},f);
  assert.ok(r.chapter.朝.length>=10,'被删空的段落应补足');assert.equal(r.chapter.午,'','原本空着的槽保持略写');
});
test('F2-C1 提示词写明受限断言与追忆写法',()=>{
  const {s,f}=setup(),text=turnMessages(s,f).map(m=>m.content).join('\n');
  assert.match(text,/只在结算表列出时/);assert.match(text,/曾|昔/);
});
test('F2-C2 反应只限官员且须在本章出场，总量不超过10',()=>{
  const {s,f}=setup(),[a,b,c]=s.court.officials;
  const text=turnMessages(s,f).map(m=>m.content).join('\n');assert.match(text,/仅限官员/);
  const r=validateTurn({chapter:{朝:a.name+'出班奏事。'+b.name+'附议。',午:'',夜:''},reactions:[{name:a.name,favorDelta:5},{name:b.name,favorDelta:5},{name:c.name,favorDelta:5},{name:a.name,favorDelta:3}]},f);
  assert.deepEqual(r.reactions.map(x=>x.name),[a.name,b.name],'未出场者与重复者不采纳');
  assert.ok(r.reactions.reduce((t,x)=>t+Math.abs(x.favorDelta),0)<=10);
});
test('F2-C3 输出模板写全宏愿证据与长期事实字段，宏愿只发未完成的剧情目标',()=>{
  const {s,f}=setup(),text=turnMessages(s,f).map(m=>m.content).join('\n');
  assert.match(text,/"ambitionEvidence":\[\{"id":"","objectiveId":"","evidence":""\}\]/);
  assert.match(text,/"factUpdates":\[\{"subject":"","key":"","value":"","reason":""\}\]/);
});
test('F2-C4 面谈提示词不再索要会被丢弃的字段',()=>{
  const {s}=setup(),o=s.court.officials[0];
  const r=talkAttempt(s,o.id,'说说近况');
  const text=talkMessages(s,r.result||r,[]).map(m=>m.content).join('\n'),schema=text.match(/输出 (\{[^\n]*?\})/)[1];
  for(const k of ['"favor"','"effects"','"revealSecret"','"endTalk"'])assert.ok(!schema.includes(k),k);
  assert.match(schema,/"reply"/);
});
test('F2-C5 铸世提示词不再索要年号',()=>{
  const {s}=setup(),text=worldMessages(s).map(m=>m.content).join('\n');
  assert.ok(!text.includes('"era"'));
});
test('F2-C7 结算表聚合：同项合并、取整、中文标签，体积大幅缩小',()=>{
  let s=initialTurn(createState({seed:'f2-digest'}));
  for(let i=0;i<60;i++){const f=forecastTurn(s,rest);s=commitTurn(s,f,mockNarrative(f));}
  const f=forecastTurn(s,rest),digest=settlementDigest(f.state,f.entries);
  const raw=JSON.stringify(f.entries).length,small=JSON.stringify(digest).length;
  assert.ok(small*4<raw,'聚合后应不足原来的四分之一：'+small+'/'+raw);
  assert.doesNotMatch(JSON.stringify(digest),/\d\.\d{3,}/,'不得有未取整浮点');
  assert.doesNotMatch(JSON.stringify(digest),/province\.|nation\.|emperor\./,'应译成中文标签');
  const text=turnMessages(s,f)[1].content;assert.ok(!text.includes('"entries"'));
});
