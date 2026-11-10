import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createState} from '../src/core/state.js';
import {applyScenario} from '../src/core/scenarios.js';
import {initialTurn} from '../src/core/turn.js';
import {portraitSource,portraitPool,poolFaceIndex} from '../src/ui/art.js';
import {ART_UNIQUE,ART_POOLS} from '../src/ui/art-manifest.js';
const names={
 'han-lingdi':['刘宏','宋氏','何氏','张让','董太后'],
 'song-huizong':['赵佶','郑氏','蔡京'],
 'ming-xizong':['朱由校','张嫣','魏忠贤'],
 'ming-yingzong':['朱祁镇','钱氏','于谦','孙太后'],
 'tang-xuanzong':['李隆基','杨玉环','安禄山'],
 'song-qinzong':['赵桓','朱氏','李纲'],
 'qing-jiaqing':['颙琰','钮祜禄氏','和珅'],
};
const start=id=>initialTurn(applyScenario(createState({seed:'重要人物专属取图'}),id));
test('新七局24位重要人物按当前剧本与姓名取本人专属，文件存在且取图不修改存档',()=>{
 assert.equal(Object.values(names).flat().length,24);
 for(const [id,list]of Object.entries(names)){
  const s=start(id),before=JSON.stringify(s),people=[s.emperor,...s.court.officials,...s.harem.consorts,...s.harem.children,...s.foreign];
  for(const name of list){const p=people.find(p=>(p.name||p.ruler)===name)||{name};const src=portraitSource(s,p,name===s.dowager?'dowager':'');assert.ok(src&&existsSync(src),id+' '+name);assert.equal(src,ART_UNIQUE[id][name][p===s.emperor&&p.age>=40?'old':'base']);}
  assert.equal(JSON.stringify(s),before);
 }
});
test('六位皇帝40岁切换同一人的老年像，玄宗70岁开局用单张老年，魏忠贤复用本人专属',()=>{
 for(const id of Object.keys(names)){
  const s=start(id),entry=ART_UNIQUE[id][s.emperor.name];
  if(id==='tang-xuanzong'){assert.equal(entry.base,entry.old);assert.equal(portraitSource(s,s.emperor),entry.old);continue;}
  s.emperor.age=39;assert.equal(portraitSource(s,s.emperor),entry.base);s.emperor.age=40;assert.equal(portraitSource(s,s.emperor),entry.old);assert.notEqual(entry.base,entry.old);
 }
 assert.equal(ART_UNIQUE['ming-xizong']['魏忠贤'].base,ART_UNIQUE['ming-chongzhen']['魏忠贤'].base);
});
test('新局未配专属的人物仍取原朝代池，不借同姓他人的专属脸，董太后不再退回圆章',()=>{
 for(const id of Object.keys(names)){
  const s=start(id);for(const p of [...s.court.officials,...s.harem.consorts,...s.harem.children,...s.foreign].filter(p=>!ART_UNIQUE[id][p.ruler||p.name])){const pool=portraitPool(s,p),index=poolFaceIndex(s,p);assert.equal(portraitSource(s,p),ART_POOLS[pool]?.[index]||null);}
 }
 const s=start('han-lingdi');assert.match(portraitSource(s,{name:'董太后'},'dowager'),/unique\/han-lingdi\/dowager-01/);
});
