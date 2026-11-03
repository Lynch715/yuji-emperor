import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn} from '../src/core/turn.js';
import {validateTurn,validateTalk,chineseNumber} from '../src/llm/validate.js';
const setup=freedom=>{const s=initialTurn(createState({seed:'断言改造',freedom}));return {s,f:forecastTurn(s)};};
const text=(s,f,line)=>validateTurn({chapter:{朝:line,午:'',夜:''}},f).chapter.朝;
for(const mode of ['free','mid','real']){
 test('第三步 A8 不改日常照办 '+mode,()=>{const {s,f}=setup(mode);f.facts=[{kind:'execution',slot:'朝',topic:'修河',label:'敷衍'}];assert.equal(text(s,f,'内侍照办，送来了茶。'),'内侍照办，送来了茶。');assert.equal(text(s,f,'修河一事照办。'),'修河一事敷衍。');});
 test('第三步 A12 否定和反问 '+mode,()=>{const {s}=setup(mode);for(const line of ['臣再尽力也办不到。','臣无法立即办妥。','臣岂能答应？'])assert.equal(validateTalk({reply:line},{success:false,reply:'原回话',die:1},s).reply,line);assert.equal(validateTalk({reply:'臣定当遵旨，马上办妥。'},{success:false,reply:'原回话',die:1},s).reply,'原回话');});
 test('第三步 A1 比喻与真实死亡 '+mode,()=>{const {s,f}=setup(mode);const line='那个死去的念头，又在心中冒了出来。';assert.equal(text(s,f,line),line);const n=s.court.officials[0].name;assert.equal(text(s,f,n+'病故。'),'');f.facts=[{kind:'death',actors:[n]}];assert.equal(text(s,f,n+'病故。'),n+'病故。');});
 test('第三步 A7 年龄兵力绑定对象 '+mode,()=>{const {s,f}=setup(mode),[a,b]=f.state.court.officials;a.age=41;b.age=52;assert.equal(text(s,f,a.name+'年方52岁。'),'');assert.equal(text(s,f,a.name+'年方41岁。'),a.name+'年方41岁。');f.state.nation.army.capital.troops=45000;f.state.nation.army.frontiers[0].troops=32000;assert.equal(text(s,f,'京营驻军三万二千人。'),'');assert.equal(text(s,f,'京营驻军四万五千人。'),'京营驻军四万五千人。');});
 test('第三步 A7 单位表 '+mode,()=>{const {s,f}=setup(mode);for(const line of ['户部调走九百九十九万石粮食。','仓中尚有九百九十九万斛。','赏田九百九十九万亩。','赐田九百九十九万顷。','征调九百九十九万匹。','新增九百九十九万户。','完成九十九成。','增至999%。'])assert.equal(text(s,f,line),'',line);assert.equal(text(s,f,'粮储'+f.state.nation.grain+'万石。'),'粮储'+f.state.nation.grain+'万石。');});
}
test('第三步 中文万亿和混写',()=>{for(const [raw,n] of [['一千万',10000000],['1亿2千万',120000000],['四亿三千万',430000000],['30.5万',305000],['二〇二六',2026],['1万零2',10002]])assert.equal(chineseNumber(raw),n,raw);});
