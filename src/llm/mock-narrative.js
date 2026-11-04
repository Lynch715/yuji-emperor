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
const MODERN_SCENES={
 上朝:'大臣们在殿里站好，等候皇帝问话。',批折:'皇帝翻开送来的奏折，拿起朱笔准备批阅。',
 下旨:'拟好的旨意摆在桌上，皇帝仔细看过措辞。',后宫:'宫人放轻脚步，内殿里还能闻到茶香。',
 外交:'使节送来国书，礼部官员在旁等候。',出巡:'车驾沿着驿路前行，皇帝看着沿途的田地。',
 歇息:'皇帝暂时放下手里的事，坐在窗边歇一会儿。',日常:'宫里照常有人来往，送来文书，再安静地退下。',
};
export function modernTalkFallback(result){
 if(result.mode==='chat')return '臣在听，陛下请讲。';
 return result.denied?'这件事超出了臣的职权，需要先回去商议。':result.success?'臣明白陛下的意思，会在自己的职权范围内尽力去办。':'臣有些难处，眼下还办不到。';
}
export function sceneNarrative(forecast){
 let rng=seedNumber(forecast.turnId||'试读');
 const pick=pool=>{const r=random(rng);rng=r.rng;return pool[Math.floor(r.value*pool.length)];};
 const month=forecast.state?.era?.month||1,season=Math.min(3,Math.max(0,Math.floor((month-1)/3)));
 return Object.fromEntries(['朝','午','夜'].map(slot=>{
  const kind=forecast.schedule?.[slot]?.kind||'日常',results=(forecast.slotResults?.[slot]||[]).join(' ');
  const execution=(forecast.facts||[]).find(f=>f.kind==='execution'&&f.slot===slot)?.label||results;
  const difficult=/封驳|阳奉阴违|敷衍|未允|失败|不足|未成/.test(execution);
  const heavy=(forecast.facts||[]).some(f=>['death','war','miscarriage'].includes(f.kind));
  if(forecast.state?.settings?.prose==='modern')return [slot,
   ['春风从窗外吹进来，院里的树长出了新叶。','夏天天气热，宫人轻轻摇着扇子。','秋风吹过院子，树叶慢慢落在台阶旁。','冬日的阳光照进窗里，屋内生着炭火。'][season]+
   (MODERN_SCENES[kind]||MODERN_SCENES.日常)+
   pick(difficult?['殿里安静了一会儿，皇帝还在考虑接下来该怎么办。','大家暂时没有开口，仍在琢磨刚才谈到的问题。']:heavy?['传来的消息让众人心情沉重，说话时也比平常谨慎。','殿里的气氛有些沉重，众人说话时都放低了声音。']:['话题暂时停了下来，桌边的茶还温着。','皇帝听着窗外的脚步声，想了想刚才谈过的事。'])];
  const outcome=difficult?['话语间仍有迟疑，案前的气氛未见舒展。','殿中沉默稍久，御前仍在斟酌。']:heavy?['外间消息压在心头，殿内的话语也沉了下来。','纸上消息牵动心绪，廊下的脚步显得急促。']:['御前话语渐缓，案边又添了茶香。','风穿过帘隙，方才的议论仍在心头。','笔锋稍停，内侍垂手静候。'];
  const sensitive=slot==='夜'&&(forecast.facts||[]).some(f=>['pregnancy','birth'].includes(f.kind));
  return [slot,pick(SEASONS[season])+pick(SCENES[kind]||SCENES.日常)+(sensitive?'内殿消息引人牵念，帘内的话语放得更轻。':pick(outcome))];
 }));
}
