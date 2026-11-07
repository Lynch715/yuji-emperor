import test from 'node:test';
import assert from 'node:assert/strict';
import {createState, migrate, VERSION} from '../src/core/state.js';
import {applyScenario} from '../src/core/scenarios.js';
import {initialTurn, forecastTurn, commitTurn} from '../src/core/turn.js';
import {talkAttempt} from '../src/core/court.js';
import {talkMessages, turnMessages} from '../src/llm/prompts.js';
import {sceneMessages} from '../src/llm/scenes.js';
import {forecastScene} from '../src/core/scenes.js';
import {validateTalk, mockNarrative, validateTurn} from '../src/llm/validate.js';
import {pack, unpack} from '../src/store/save.js';

const fresh = (freedom = 'free') => initialTurn(applyScenario(createState({seed:'晏殊话题切换', freedom}), 'song-renzong'));
const yan = s => s.court.officials.find(o => o.name === '晏殊');

for (const mode of ['free', 'mid', 'real']) test('晏殊谈文章和日常不反复担忧前程，聊天不改好感或随机数：' + mode, () => {
  let s = fresh(mode);
  const id = yan(s).id, rng = s.rng;
  yan(s).favor = 35;
  const literary = talkAttempt(s, id, '卿以为文章应从何处落笔？');
  assert.equal(literary.result.mode, 'chat');
  assert.doesNotMatch(literary.result.innerThought, /进退|前程|谨慎|从长计议/);
  assert.match(literary.result.innerThought, /学问|见解/);
  assert.equal(yan(literary.state).favor, 35);
  s = literary.state;
  const switched = talkAttempt(s, id, '今日先不谈文章，卿闲时可有什么趣事？');
  assert.notEqual(switched.result.innerThought, literary.result.innerThought);
  assert.doesNotMatch(switched.result.innerThought, /学问|文章/);
  assert.equal(yan(switched.state).favor, 35);
  s = switched.state;
  // 提高亲近后继续聊日常，仍不复用论文章时的默认心声。
  yan(s).favor = 85;
  const daily = talkAttempt(s, id, '今日闲下来，卿可有别的趣事？');
  assert.notEqual(daily.result.innerThought, literary.result.innerThought);
  assert.doesNotMatch(daily.result.innerThought, /进退|前程|谨慎|从长计议/);
  assert.equal(daily.state.rng, rng);
  assert.equal(yan(daily.state).favor, 85);
});

test('普通聊天保留模型针对当前问题生成的心声，仍过滤虚假办事与硬结果', () => {
  const s = fresh(), r = talkAttempt(s, yan(s).id, '卿以为文章应从何处落笔？').result;
  const reply = '臣以为，文章贵在真切，先把眼前的人和事写明白。';
  const thought = '他对这篇文章的章法颇有自己的想法，正好与陛下细谈。';
  const checked = validateTalk({reply, innerThought:thought}, r, s);
  assert.equal(checked.reply, reply);
  assert.equal(checked.innerThought, thought);
  assert.equal(checked.effects, null);
  const daily = talkAttempt(s, yan(s).id, '近来可有闲趣？').result;
  const nextThought = '话题转到日常，倒可以说说读书之外的趣事。';
  assert.equal(validateTalk({reply:'臣闲时也爱看花。', innerThought:nextThought}, daily, s).innerThought, nextThought);
  for (const bad of ['臣马上拨银一千万两。', '晏殊已被处死。']) {
    assert.equal(validateTalk({reply, innerThought:bad}, r, s).innerThought, r.innerThought);
  }
  assert.equal(validateTalk({reply}, r, s).innerThought, r.innerThought);
});

test('放松交谈仍遵守心声显示资格、秘密与真实失败的边界', () => {
  const s = fresh(), npc = yan(s), secret = '密约藏在西阁暗匣';
  npc.secret = secret; npc.secretKnown = false;
  s.emperor.talents.魅力 = 59;
  const hidden = talkAttempt(s, npc.id, '卿近日读些什么？');
  assert.equal(validateTalk({reply:'臣近日在读旧文。', innerThought:'愿与陛下细谈。'}, hidden.result, hidden.state).innerThought, '');
  assert.ok(!JSON.stringify(talkMessages(hidden.state, hidden.result)).includes(secret));
  s.emperor.talents.魅力 = 80;
  const denied = talkAttempt(s, npc.id, '拨银999999万两');
  assert.equal(denied.result.denied, true);
  assert.equal(validateTalk({reply:'臣马上拨银一千万两。', innerThought:'此事已经办妥。'}, denied.result, denied.state).reply, denied.result.reply);
  assert.doesNotMatch(denied.result.innerThought, /前程|谨慎/);
  const strict = fresh('real');
  strict.emperor.talents.权谋 = -1000;
  const failed = talkAttempt(strict, yan(strict).id, '试探旧事');
  assert.equal(failed.result.success, false);
  assert.equal(validateTalk({reply:'臣答应此事照办。'}, failed.result, failed.state).reply, failed.result.reply);
});

test('最高自由度的接话规则贯穿面谈、新情节和续写，往事仍作为背景传入', () => {
  for (const mode of ['free', 'mid', 'real']) {
    const s = fresh(mode), id = yan(s).id;
    const scene = {kind:'自拟情节', people:[id], place:'书房', text:'与晏殊谈文章'};
    const f = forecastTurn(s, {午:scene}), n = commitTurn(s, f, validateTurn(mockNarrative(f), f));
    const record = n.history.at(-1).scenes[0];
    yan(n).memory[0].summary = '晏殊曾与陛下在书房论文章，后来此事已经说开。';
    const t = talkAttempt(n, id, '今日聊聊别的趣事');
    const continuation = forecastScene(n, record.id, '聊聊闲时的趣事');
    const requests = [talkMessages(t.state, t.result), turnMessages(s, f), sceneMessages(n, continuation)];
    for (const request of requests) {
      assert.equal(request[0].content.includes('【人物互动·想做就成】'), mode === 'free');
      assert.match(request[0].content, /已经说开或了结的事不反复翻回/);
    }
    assert.match(JSON.stringify(requests[0]), /后来此事已经说开/);
    assert.match(JSON.stringify(requests[2]), /后来此事已经说开/);
  }
});

test('旧档与既有谈话原样保留，新交谈采用新心声，不添加存档字段', () => {
  const s = fresh(), old = talkAttempt(s, yan(s).id, '说说近况');
  old.result.innerThought = '此事牵涉自身进退，须谨慎回话。';
  old.state.v = VERSION - 1;
  const bytes = JSON.stringify(old.state.talks), loaded = migrate(unpack(pack(old.state)).state);
  assert.equal(loaded.v, VERSION);
  assert.equal(JSON.stringify(loaded.talks), bytes);
  const next = talkAttempt(loaded, yan(loaded).id, '卿以为这篇文章如何？');
  assert.doesNotMatch(next.result.innerThought, /进退|谨慎/);
  assert.equal(next.state.talks[0].innerThought, old.result.innerThought);
});
