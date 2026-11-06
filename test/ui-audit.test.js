import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {APP_ICONS,createAppManifest} from '../src/ui/icon.js';
import {introHTML,chapterTitle,chapterHTML,renderApp} from '../src/ui/render.js';
import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {mockNarrative} from '../src/llm/validate.js';

test('桌面图标内嵌真实 PNG，安装清单不携带页面参数，保持同源目录',()=>{
  const manifest=createAppManifest('https://example.test/yuji/index.html?private=test#scroll','#1C1714');
  assert.equal(manifest.start_url,'https://example.test/yuji/');assert.equal(manifest.scope,manifest.start_url);assert.equal(manifest.display,'standalone');
  for(const n of [32,180,192]){
    const bytes=Buffer.from(APP_ICONS[n].split(',')[1],'base64');assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),n);assert.equal(bytes.readUInt32BE(20),n);
    assert.deepEqual(bytes,readFileSync('src/ui/assets/app-icon-'+n+'.png'));
  }
});
test('开篇保留玩法与接口入口，删除开发用语',()=>{
  assert.equal(chapterTitle("本旬大凶，诸事已据实落账"),"本旬大凶");assert.equal(chapterTitle("殿前问对"),"殿前问对");
  const html=introHTML();assert.match(html,/登基开局/);assert.match(html,/试读/);assert.doesNotMatch(html,/引擎|预演|大模型|JSON|样张/);
});
test('旧章节五档天命标题与起居注明细用游戏语言显示，保留原始记录和真实事件',()=>{
  for(const fate of ['大凶','不顺','平常','顺遂','大吉'])
    assert.equal(chapterTitle('本旬'+fate+'，诸事已据实落账'),'本旬'+fate);
  const s=initialTurn(createState({seed:'plain-copy'})),f=forecastTurn(s),n=commitTurn(s,f,mockNarrative(f));
  const h=n.history.at(-1);
  h.summary='本旬不顺，诸事已据实落账';
  h.entries.push({source:'模型人物反应建议：引擎限额采纳',path:'official.o0.favor',delta:2});
  h.notes=['夜中没有对应结算的生死陈述已删除','河工延误，须催办。','朝段经核对后无可保留文字，以平实叙述补足'];
  h.settlement.slotResults.午=['召见；面谈结果已落账'];
  const before=structuredClone(h),html=chapterHTML(h);
  assert.doesNotMatch(html,/据实落账|引擎|模型人物|陈述已删除|叙述补足|已落账/);
  assert.match(html,/河工延误，须催办/);assert.match(html,/人物态度变化/);assert.match(html,/已在面谈中议定/);
  assert.deepEqual(h,before);
});
test('待续回合给出清楚的继续和略过入口，不展示结算或预演术语',()=>{
  const s=initialTurn(createState({seed:'plain-pending'}));s.pending={forecast:forecastTurn(s)};
  const html=renderApp(s);
  assert.match(html,/继续本旬故事/);assert.match(html,/略过故事，进入下旬/);
  assert.doesNotMatch(html,/结算表|预演|本旬叙事|据实落账/);
});

test('A2 构建页面头部无同步加载的外域样式表',()=>{
  const head=readFileSync('index.html','utf8').match(/<head>([\s\S]*?)<\/head>/i)[1].replace(/<noscript>[\s\S]*?<\/noscript>/gi,'');
  const links=head.match(/<link\b[^>]*>/gi)||[];
  for(const link of links){
    if(!/href=["'](?:https?:)?\/\//i.test(link)||!/rel=["']stylesheet["']/i.test(link))continue;
    assert.match(link,/media=["'](?:print|not all)["']/i,'不得同步加载外域样式表：'+link);
  }
  assert.ok(!links.some(link=>/fonts\.googleapis\.com/.test(link)&&/rel=["']preconnect/.test(link)));
});
