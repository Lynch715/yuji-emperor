import { roll } from './rng.js';
export const SURNAMES = [...'沈陆顾谢裴程韩许杜魏方梁宋张崔温袁郑李王赵刘苏柳陈林孟周徐邵潘傅高马罗吕余钱陶江叶秦唐白姚夏何卢季'];
export const GIVEN_NAMES = ['守礼','明哲','慎行','静姝','疏影','明漪','书宁','婉清','知微','云岫','晚晴','映棠','清圆','静宜','清容','素宁','怀瑾','景行','知远','慎微','清和','望舒','承安','惟新','济川','云章','若兰','思齐','元礼','长衡','廷玉','秉诚','砚秋','青岚','书仪','令仪','清蘅','映雪','雅颂','怀仁','修文','允恭','思宁','含章','若水','清晏','嘉言','明远','昭华','如玉','安澜','素心','沐晴','云舒','瑞宁','清韵','兰舟','文昕','景初','承泽'];
export const IMPERIAL_CHARS = [...'宁和安明瑜璋珩琬棠瑾瑞嘉懿昭晟昱煜熙晏清澄涵泽渊源润浩瀚泓澜淳沅洵浚溥濂洛汀湘沐潇温翊翼翎翰翕翡翘翮彰彤彬彦衍衡衷辰宸宇宥宏宽宣定宜寅容寰宪宗旭昂昀昕昊昶晖晋曦曜暄暘朔朗桓桐柏松楷榕楠榆槐枫棣棣桢楫榛榭棨荣芝芷若葳蕤菀菁萱萦蓉莲蔚蘅蘭璞琛琦瑶瑗璇璟璘璨璧琮琰珺珂琪瑛瑄琚瑀璐璜璠璋'];
export function personNames(state, excludeId = null) {
  // Historical names are also reserved: this exceeds the living-name minimum
  // and keeps names in old chronicles unambiguous.
  const groups = [state.court.officials, state.harem.consorts, state.harem.children,
    state.harem.royalWomen || [], state.harem.candidates || [], (state.keju?.exams||[]).flatMap(e=>e.candidates)];
  const names = groups.flat().filter(p => !excludeId || p.id !== excludeId).map(p => p.name);
  names.push(...(state.chronicles || []).map(r=>r.emperor),state.emperor.name, ...(state.foreign || []).filter(f=>f.id!==excludeId).map(f => f.ruler));
  if (typeof state.dowager === 'string') names.push(state.dowager);
  return new Set(names.filter(Boolean));
}
export function uniqueName(state, pool = {}) {
  const spec = Array.isArray(pool) ? {names: pool} : pool;
  const used = personNames(state, spec.excludeId);
  const candidates = spec.names || (spec.surnames || SURNAMES).flatMap(surname =>
    (spec.givenNames || GIVEN_NAMES).map(given => surname + given));
  let free = [...new Set(candidates)].filter(name => name && !used.has(name));
  if (!free.length && !spec.prefix)
    free = SURNAMES.flatMap(surname => GIVEN_NAMES.map(given => surname + given))
      .filter(name => !used.has(name));
  if (!free.length) {
    const prefixes = spec.prefix ? [spec.prefix] : (spec.surnames || SURNAMES);
    free = prefixes.flatMap(prefix => IMPERIAL_CHARS.flatMap(a => IMPERIAL_CHARS.map(b => prefix+a+b)))
      .filter(name => !used.has(name));
  }
  if (!free.length) throw new Error('姓名池已满，请扩充姓名池');
  const r = roll(state, 0, free.length - 1);
  return {state: r.state, name: free[r.value]};
}
