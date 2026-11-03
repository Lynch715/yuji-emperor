import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blockPinch} from '../src/ui/mobile.js';
import {APP_ICONS,createAppManifest} from '../src/ui/icon.js';
import {introHTML,chapterTitle} from '../src/ui/render.js';

test('双指和 Safari 缩放手势被阻止，单指滚动与不可取消事件不受干扰（Android 双指由 touch-action 阻止）',()=>{
  for(const [type,count,cancelable,expected]of [['touchstart',2,true,true],['touchmove',2,true,true],['touchmove',1,true,false],['gesturestart',0,true,true],['gesturechange',0,true,true],['touchmove',2,false,false]]){
    let prevented=false;blockPinch({type,touches:Array(count),cancelable,preventDefault(){prevented=true;}});assert.equal(prevented,expected,type+' '+count);
  }
  const shell=readFileSync('src/ui/shell.html','utf8');assert.match(shell,/user-scalable=no/);assert.match(shell,/viewport-fit=cover/);
});
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

test('A2 构建页面头部无同步加载的外域样式表',()=>{
  const head=readFileSync('index.html','utf8').match(/<head>([\s\S]*?)<\/head>/i)[1].replace(/<noscript>[\s\S]*?<\/noscript>/gi,'');
  const links=head.match(/<link\b[^>]*>/gi)||[];
  for(const link of links){
    if(!/href=["'](?:https?:)?\/\//i.test(link)||!/rel=["']stylesheet["']/i.test(link))continue;
    assert.match(link,/media=["'](?:print|not all)["']/i,'不得同步加载外域样式表：'+link);
  }
  assert.ok(!links.some(link=>/fonts\.googleapis\.com/.test(link)&&/rel=["']preconnect/.test(link)));
});
