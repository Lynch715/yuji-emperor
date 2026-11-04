import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {talkAttempt} from '../src/core/court.js';
import {mockNarrative} from '../src/llm/validate.js';
import {turnMessages,talkMessages,worldRules} from '../src/llm/prompts.js';
import {callJSON} from '../src/llm/client.js';

const flat=m=>m.map(x=>x.role+'\u0000'+x.content).join('\u0001');
const common=(a,b)=>{let k=0;while(k<a.length&&a[k]===b[k])k++;return k;};
const rest={朝:{kind:'歇息'},午:{kind:'歇息'},夜:{kind:'歇息'}};

test('F3 连续多旬正文请求的公共前缀不少于总长六成',()=>{
  let s=initialTurn(createState({seed:'f3-cache'})),prev=null,sum=0,len=0;
  for(let i=0;i<120;i++){
    const f=forecastTurn(s,rest),m=flat(turnMessages(s,f));
    if(prev&&i>=60){sum+=common(prev,m);len+=m.length;}
    prev=m;s=commitTurn(s,f,mockNarrative(f));
  }
  assert.ok(sum/len>=0.6,'公共前缀比例 '+(sum/len).toFixed(3));
});
test('F3 同人连续面谈：后一请求以前一请求为前缀（除末条），且不混入他人对话',()=>{
  let s=initialTurn(createState({seed:'f3-talk'}));
  const [a,b]=s.court.officials;
  let r=talkAttempt(s,b.id,'别人的话');s=r.state;r.result.reply='他人回话';
  r=talkAttempt(s,a.id,'说说近况');s=r.state;const m1=talkMessages(s,r.result,s.talks);r.result.reply='臣近来尚好。';
  r=talkAttempt(s,a.id,'户部可还宽裕？');s=r.state;const m2=talkMessages(s,r.result,s.talks);
  const a1=flat(m1),a2=flat(m2);
  assert.ok(common(a1,a2)/a1.length>=0.85,'前缀比例 '+(common(a1,a2)/a1.length).toFixed(3));
  assert.ok(!a2.includes('别人的话')&&!a2.includes('他人回话'));
  assert.equal(m2.length,4);assert.equal(m2[2].role,'assistant');assert.match(m2[2].content,/臣近来尚好/);
});
test('F3 正文与面谈共享王朝规则前缀，各自只带本任务格式',()=>{
  const s=initialTurn(createState({seed:'f3-share'})),f=forecastTurn(s,rest);
  const t=turnMessages(s,f),r=talkAttempt(s,s.court.officials[0].id,'问安'),k=talkMessages(r.state,r.result,r.state.talks);
  assert.ok(t[0].content.startsWith(worldRules(s)));assert.ok(k[0].content.startsWith(worldRules(s)));
  assert.ok(!t[0].content.includes('【面谈任务】'));assert.ok(!k[0].content.includes('【正文任务】'));
  const bible=t[1].content.slice(0,t[1].content.indexOf('\n'));
  assert.ok(k[1].content.startsWith(bible));
});
test('F3 用量指标记录缓存命中（千问 cached_tokens 与 DeepSeek prompt_cache_hit_tokens）',async()=>{
  for(const usage of [{prompt_tokens:1000,completion_tokens:10,prompt_tokens_details:{cached_tokens:800}},{prompt_tokens:1000,completion_tokens:10,prompt_cache_hit_tokens:800}]){
    const metrics=[];
    await callJSON({key:'k',base:'https://x.test',model:'m',provider:'custom'},[{role:'user',content:'hi'}],{
      fetcher:async()=>new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}],usage}),{headers:{'Content-Type':'application/json'}}),
      onMetric:m=>metrics.push(m)});
    assert.equal(metrics[0].cachedTokens,800);
  }
});
