import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn} from '../src/core/turn.js';
import {STYLES,LENGTHS,POVS,systemPrompt,turnMessages,talkMessages,worldMessages} from '../src/llm/prompts.js';
import {talkAttempt} from '../src/core/court.js';
import {validateTurn,mockNarrative} from '../src/llm/validate.js';
import {modernTalkFallback} from '../src/llm/mock-narrative.js';

test('文风共 15 种，每种有规则与 60 字以上范文，不含现代物件与禁写套话',()=>{
  assert.equal(Object.keys(STYLES).length,15);
  for(const [k,v] of Object.entries(STYLES)){
    assert.ok(v.label&&v.rules,k);assert.ok(v.sample.length>=60,k+' 范文过短');
    assert.doesNotMatch(v.sample,/嘴角勾起|眼中闪过一丝|OK|手机|网络/);
  }
});
test('现代文覆盖正文、面谈与铸世，解除现代用语禁令但保留古代背景；旧档可保存该选择',()=>{
  const s=initialTurn(createState({seed:'modern-prose',prose:'modern'})),f=forecastTurn(s);
  const t=talkAttempt(s,s.court.officials[0].id,'说说近况');
  for(const messages of [turnMessages(s,f),talkMessages(t.state,t.result,t.state.talks),worldMessages(s)]){
    const sys=messages[0].content;
    assert.match(sys,/现代文/);assert.match(sys,/正文、人物对话、面谈、奏折、诏书和国书统一使用/);
    assert.doesNotMatch(sys,/禁用[^；\n]*现代词/);assert.match(sys,/不引入现代科技/);
    assert.match(sys,/所有钱粮、人物、派系/);assert.match(sys,/大臣称陛下、自称臣/);
  }
  const restored=migrate(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.settings.prose,'modern');
  assert.equal(restored.v,VERSION);
  const old=migrate({...s,v:8,settings:{...s.settings,prose:'court'}});
  assert.equal(old.settings.prose,'court');assert.match(systemPrompt(old),/禁用[^；\n]*现代词/);
});
test('F4 范文本身能通过叙事校验（不会示范被删除的写法）',()=>{
  const s=initialTurn(createState({seed:'f4'})),f=forecastTurn(s,{朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}});
  for(const [k,v] of Object.entries(STYLES)){
    const r=validateTurn({chapter:{朝:v.sample,午:'',夜:''}},f);
    assert.equal(r.chapter.朝,v.sample,k+' 范文被校验改动：'+r.fixNotes.join('；'));
  }
});
test('现代文试读与面谈兜底也使用白话，保持同一预演与判定',()=>{
  const s=initialTurn(createState({seed:'modern-demo',prose:'modern'})),f=forecastTurn(s,{朝:{kind:'歇息'}}),before=structuredClone(f);
  const reply=mockNarrative(f),checked=validateTurn(reply,f);
  assert.deepEqual(checked.chapter,reply.chapter);assert.deepEqual(f,before);
  assert.match(reply.chapter.朝,/皇帝/);
  assert.ok(reply.memorialTexts.length);assert.doesNotMatch(reply.memorialTexts[0].text,/伏乞|臣谨奏/);
  assert.match(modernTalkFallback({denied:true,success:true}),/超出了臣的职权/);
  assert.match(modernTalkFallback({success:false}),/还办不到/);
  assert.match(modernTalkFallback({success:true}),/职权范围内/);
});
test('F4 文风、篇幅、视角进入系统提示且只影响系统提示',()=>{
  const s=initialTurn(createState({seed:'f4-sys',prose:'chapter',length:'rich',pov:'second'}));
  const sys=systemPrompt(s);
  assert.match(sys,/章回/);assert.ok(sys.includes(STYLES.chapter.sample));assert.ok(sys.includes(LENGTHS.rich.words));assert.ok(sys.includes(POVS.second.rules));
  const f=forecastTurn(s,{朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}}),m=turnMessages(s,f);
  const t={...s,settings:{...s.settings,prose:'court',length:'brief',pov:'third'}},m2=turnMessages(t,{...f,state:{...f.state,settings:t.settings}});
  assert.equal(m[1].content,m2[1].content,'换笔法不应改变 user 消息');
});
test('F4 存档 v9：旧档补默认篇幅与视角，非法值回落默认',()=>{
  assert.ok(VERSION>=9);
  const s=createState({seed:'f4-mig'});s.v=8;delete s.settings.length;delete s.settings.pov;
  const m=migrate(s);assert.equal(m.settings.length,'standard');assert.equal(m.settings.pov,'third');
  const odd=initialTurn(createState({seed:'f4-odd'}));odd.settings.length='x';odd.settings.pov='y';
  assert.ok(systemPrompt(odd).includes(LENGTHS.standard.words));
});
test('F4 开局与设置均可选择文风、篇幅、视角；中途修改不碰待续回合',()=>{
  const app=readFileSync('src/ui/app.js','utf8');
  assert.match(app,/narrativeFields\(\)/);assert.match(app,/故事文风/);
  assert.match(app,/readOnly \|\| busy \|\| state\.pending\) \{\n\s*toast\("请先过完本旬，再换"/);
});
