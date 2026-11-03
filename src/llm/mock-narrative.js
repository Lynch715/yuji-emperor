import { seedNumber, random } from '../core/rng.js';
const SCENES={
 上朝:['朝班肃立，殿门外衣冠相接。','御座前的奏牍铺开，廷臣静候垂询。','殿柱映着衣影，笏板轻触袍袖。'],
 批折:['案头折匣展开，朱笔搁在砚边。','纸页随手翻过，墨香停在窗下。','值房送来文卷，御案渐渐铺满。'],
 下旨:['拟旨的黄纸铺平，词句尚须细察。','中书候在屏外，静听御前措辞。','诏稿置于案侧，烛影掠过纸边。'],
 后宫:['帘幕低垂，宫人放轻了脚步。','内殿茶香未散，屏风后传来衣声。','宫灯映着花影，廊下私语渐轻。'],
 外交:['译官捧来国书，礼臣按仪侍立。','宾馆的回牍送至，礼官候在廊前。','使节话语经译官转述，御前静听。'],
 出巡:['驿路在车前延伸，风里夹着草木气息。','御辇经过田畴，沿途景物收入眼底。','行宫窗外树影摇曳，随驾官员捧册候问。'],
 歇息:['帘外脚步渐远，案边茶盏尚温。','屏风隔去人声，御前暂得安静。','书页停在膝上，檐下风声可闻。'],
 日常:['廊下有人传递文卷，宫门开合如常。','值房灯火未歇，纸墨气息飘过长廊。','内侍垂手候命，殿中只闻衣袖轻响。'],
};
const SEASONS=[['春风拂过帘角，庭树新绿。','春雨落在阶前，石色微润。'],['暑气停在檐下，凉扇轻摇。','夏云漫过殿顶，庭荫渐深。'],['秋风吹动帘钩，树叶轻落。','庭中秋色渐浓，阶前微凉。'],['寒风掠过宫墙，炭火轻鸣。','冬日斜照窗棂，炉香缓缓升起。']];
export function sceneNarrative(forecast){
 let rng=seedNumber(forecast.turnId||'试读');
 const pick=pool=>{const r=random(rng);rng=r.rng;return pool[Math.floor(r.value*pool.length)];};
 const month=forecast.state?.era?.month||1,season=Math.min(3,Math.max(0,Math.floor((month-1)/3)));
 return Object.fromEntries(['朝','午','夜'].map(slot=>{
  const kind=forecast.schedule?.[slot]?.kind||'日常',results=(forecast.slotResults?.[slot]||[]).join(' ');
  const execution=(forecast.facts||[]).find(f=>f.kind==='execution'&&f.slot===slot)?.label||results;
  const difficult=/封驳|阳奉阴违|敷衍|未允|失败|不足|未成/.test(execution);
  const heavy=(forecast.facts||[]).some(f=>['death','war','miscarriage'].includes(f.kind));
  const outcome=difficult?['话语间仍有迟疑，案前的气氛未见舒展。','殿中沉默稍久，御前仍在斟酌。']:heavy?['外间消息压在心头，殿内的话语也沉了下来。','纸上消息牵动心绪，廊下的脚步显得急促。']:['御前话语渐缓，案边又添了茶香。','风穿过帘隙，方才的议论仍在心头。','笔锋稍停，内侍垂手静候。'];
  const sensitive=slot==='夜'&&(forecast.facts||[]).some(f=>['pregnancy','birth'].includes(f.kind));
  return [slot,pick(SEASONS[season])+pick(SCENES[kind]||SCENES.日常)+(sensitive?'内殿消息引人牵念，帘内的话语放得更轻。':pick(outcome))];
 }));
}
