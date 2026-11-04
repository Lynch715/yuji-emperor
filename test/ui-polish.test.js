import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn} from '../src/core/turn.js';
import {actionCaption} from '../src/ui/view-model.js';
import {provinceCardHTML} from '../src/ui/panels.js';
import {technologyHTML,updateDevelopmentPreview} from '../src/ui/technology.js';
import {requestMetricHTML,cacheSummary} from '../src/ui/settings.js';
import {gameText} from '../src/ui/common.js';
import {chapterNotes} from '../src/ui/render.js';

test('州郡卡完整保留长身份、产业、停产原因与数值，并转义自拟文字',()=>{
  const s=initialTurn(createState({seed:'ui-polish'})),z=s.nation.provinces[0];
  z.name='<边州> & 长地名';z.garrison=123456;z.prosperity=37.5;
  z.industries=[{type:'farm',level:3,paused:'维护费不足'},{type:'canal',level:2,paused:''}];
  const before=structuredClone(z),html=provinceCardHTML(z,'<长官姓名>');
  for(const value of ['123,456','37.5','屯田／圩田','漕运','维护费不足','3级','2级'])assert.ok(html.includes(value),value);
  assert.match(html,/&lt;边州&gt; &amp; 长地名/);assert.match(html,/&lt;长官姓名&gt;/);
  assert.doesNotMatch(html,/<small>[\s\S]*<button|<长官姓名>/);
  assert.deepEqual(z,before);
});

test('格物展示保留进度与前提，不泄露产业槽、基数、前置等内部说法',()=>{
  const s=initialTurn(createState({seed:'ui-polish-tech'}));
  s.tech.current={id:'farming',name:'<御定新法>',progress:12.5,elapsed:2,spent:20};
  const before=structuredClone(s),html=technologyHTML(s);
  assert.match(html,/&lt;御定新法&gt;/);assert.match(html,/12.5／60/);
  assert.match(html,/须先研成精耕细作/);assert.match(html,/须先开海/);
  assert.doesNotMatch(html,/产业槽|基数|前置|解锁|月结|本线起点/);
  assert.deepEqual(s,before);
});

test('营建报价保留费用工期和季产，满额提示使用游戏用语',()=>{
  const s=initialTurn(createState({seed:'ui-polish-quote'}));s.tech.done=['farming'];
  const p=s.nation.provinces[0],quote={textContent:''};
  const fields={'industry-type':{value:'farm'},'industry-province':{value:p.id},'industry-quote':quote};
  const root={querySelector:selector=>fields[selector.slice(1)]};
  updateDevelopmentPreview(root,s);
  assert.match(quote.textContent,/银 30 万两 · 工期 3 月/);
  assert.match(quote.textContent,/养护 0.3 万两/);assert.match(quote.textContent,/粮 2.8 万石/);
  assert.doesNotMatch(quote.textContent,/基数|增益|月结/);
  p.industries=[{type:'weaving',level:1},{type:'salt',level:1},{type:'canal',level:1}];
  updateDevelopmentPreview(root,s);assert.equal(quote.textContent,'本州已兴办三类产业，可扩建已有产业。');
});

test('行动摘要保留时辰与开销，连接记录不暴露状态码或原始错误',()=>{
  assert.match(actionCaption('上朝'),/廷议.*2/);assert.match(actionCaption('批折'),/独断.*3本耗1/);
  assert.match(actionCaption('下旨'),/任意.*1/);assert.match(actionCaption('召见'),/午.*人/);
  const html=requestMetricHTML({at:0,result:'private-error',httpStatus:401,durationMs:1234,inputTokens:100,outputTokens:20});
  assert.match(html,/未完成.*1.2 秒/);assert.match(html,/输入 100.*输出 20/);
  assert.doesNotMatch(html,/private-error|HTTP|401|tokens|ms/);
  assert.equal(cacheSummary([{inputTokens:100,cachedTokens:80}]),'重复输入占 80%（80／100）。');
});

test('错误提示与章节附记不显示通讯代码或改写诊断，原存档文字仍保留',()=>{
  for(const code of ['HTTP 401','HTTP 500 private-response','STREAM_CUT','TRUNCATED','Failed to fetch']){
    const text=gameText(code);assert.doesNotMatch(text,/HTTP|401|500|private-response|STREAM|TRUNCATED|fetch/);
    assert.match(text,/[\u4e00-\u9fa5]/);
  }
  const h={notes:['情节结果有出入的句子已收束','河工延误，须催办。']},before=structuredClone(h);
  assert.deepEqual(chapterNotes(h),['河工延误，须催办。']);assert.deepEqual(h,before);
});
