import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {initialTurn,forecastTurn} from '../src/core/turn.js';
import {STYLES,LENGTHS,POVS,systemPrompt,turnMessages} from '../src/llm/prompts.js';
import {validateTurn} from '../src/llm/validate.js';

test('F4 文风共 14 种，每种有规则与 60 字以上范文，范文不含现代词与禁写套话',()=>{
  assert.equal(Object.keys(STYLES).length,14);
  for(const [k,v] of Object.entries(STYLES)){
    assert.ok(v.label&&v.rules,k);assert.ok(v.sample.length>=60,k+' 范文过短');
    assert.doesNotMatch(v.sample,/嘴角勾起|眼中闪过一丝|OK|手机|网络/);
  }
});
test('F4 范文本身能通过叙事校验（不会示范被删除的写法）',()=>{
  const s=initialTurn(createState({seed:'f4'})),f=forecastTurn(s,{朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}});
  for(const [k,v] of Object.entries(STYLES)){
    const r=validateTurn({chapter:{朝:v.sample,午:'',夜:''}},f);
    assert.equal(r.chapter.朝,v.sample,k+' 范文被校验改动：'+r.fixNotes.join('；'));
  }
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
  assert.equal(VERSION,9);
  const s=createState({seed:'f4-mig'});s.v=8;delete s.settings.length;delete s.settings.pov;
  const m=migrate(s);assert.equal(m.settings.length,'standard');assert.equal(m.settings.pov,'third');
  const odd=initialTurn(createState({seed:'f4-odd'}));odd.settings.length='x';odd.settings.pov='y';
  assert.ok(systemPrompt(odd).includes(LENGTHS.standard.words));
});
test('F4 开局与设置均可选择文风、篇幅、视角；中途修改不碰待续回合',()=>{
  const app=readFileSync('src/ui/app.js','utf8');
  assert.match(app,/narrativeFields\(\)/);assert.match(app,/叙事笔法/);
  assert.match(app,/readOnly \|\| busy \|\| state\.pending\) \{\n\s*toast\("请先完成当前回合，再改叙事笔法"\)/);
});
