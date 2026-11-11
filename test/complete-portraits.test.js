import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {SCENARIOS,applyScenario} from '../src/core/scenarios.js';
import {createState} from '../src/core/state.js';
import {initialTurn} from '../src/core/turn.js';
import {ART_UNIQUE,ART_POOLS} from '../src/ui/art-manifest.js';
import {portraitSource,portraitPool,poolFaceIndex} from '../src/ui/art.js';
const ids=['han-lingdi','song-huizong','ming-xizong','ming-yingzong','tang-xuanzong','song-qinzong','qing-jiaqing'];
const start=id=>initialTurn(applyScenario(createState({seed:'七局专属补全回归'}),id));
test('新增七局121位剧本开局历史人物均取本人专属，随机补员仍取原池，读图不改存档',()=>{
 let total=0;
 for(const id of ids){
  const sc=SCENARIOS.find(sc=>sc.id===id),s=start(id),before=JSON.stringify(s);
  const people=[s.emperor,...s.court.officials.slice(0,sc.officials.length),...s.harem.consorts,...s.harem.children,...s.foreign];
  if(s.dowager)people.push({name:s.dowager});
  for(const p of people){const name=p.ruler||p.name,src=portraitSource(s,p,name===s.dowager?'dowager':'');assert.ok(ART_UNIQUE[id][name],id+' '+name);assert.ok(src&&existsSync(src),id+' '+name);assert.ok(Object.values(ART_UNIQUE[id][name]).includes(src));total++;}
  for(const p of s.court.officials.slice(sc.officials.length)){assert.equal(portraitSource(s,p),ART_POOLS[portraitPool(s,p)]?.[poolFaceIndex(s,p)]||null);}
  assert.equal(JSON.stringify(s),before);
 }
 assert.equal(total,121);
 // Names shared by unrelated women must remain different dedicated files.
 assert.notEqual(ART_UNIQUE['ming-yingzong']['周氏'].base,ART_UNIQUE['ming-chongzhen']['周氏'].base);
 assert.notEqual(ART_UNIQUE['song-huizong']['刘氏'].base,ART_UNIQUE['ming-wanli']['刘氏']?.base);
});
test('五位未成年皇嗣16岁切换本人成年专属，跨剧本身份仅显式复用本人',()=>{
 const list=[['han-lingdi','刘辩'],['song-huizong','赵构'],['ming-yingzong','朱见深'],['song-qinzong','赵谌'],['qing-jiaqing','绵恺']];
 for(const [id,name] of list){const s=start(id),p=s.harem.children.find(p=>p.name===name),entry=ART_UNIQUE[id][name];assert.ok(p&&entry.adult&&existsSync(entry.adult));p.born=s.turn-15*36;assert.equal(portraitSource(s,p),entry.base);p.born=s.turn-16*36;assert.equal(portraitSource(s,p),entry.adult);assert.notEqual(entry.base,entry.adult);}
 assert.equal(ART_UNIQUE['song-huizong']['赵构'].adult,ART_UNIQUE['song-qinzong']['赵构'].base);
 assert.equal(ART_UNIQUE['song-huizong']['李纲'].base,ART_UNIQUE['song-qinzong']['李纲'].base);
 assert.equal(ART_UNIQUE['ming-xizong']['林丹汗'].base,ART_UNIQUE['ming-chongzhen']['林丹汗'].base);
 for(const name of ['李乾顺','李乾德'])assert.equal(ART_UNIQUE['song-huizong'][name].base,ART_UNIQUE['song-qinzong'][name].base);
 // Same man as prince/emperor needs distinct headwear, not borrowed imperial robe.
 assert.notEqual(ART_UNIQUE['song-huizong']['赵桓'].base,ART_UNIQUE['song-qinzong']['赵桓'].base);
});
