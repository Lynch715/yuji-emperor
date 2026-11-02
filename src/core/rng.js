export const DRAFT = Symbol("internal-forecast-draft");
export function seedNumber(seed) {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0 || 1;
}
export function random(rng) {
  let x = rng >>> 0 || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return { rng: x >>> 0, value: (x >>> 0) / 4294967296 };
}
export function roll(state, low = 1, high = 20) {
  const r = random(state.rng);
  return {
    state: { ...state, rng: r.rng },
    value: low + Math.floor(r.value * (high - low + 1)),
  };
}
export function fateModifier(die) {
  return (die - 10.5) * 4;
}
export function fateLabel(die) {
  return die <= 3
    ? "大凶"
    : die <= 8
      ? "不顺"
      : die <= 14
        ? "平常"
        : die <= 18
          ? "顺遂"
          : "大吉";
}
export function check(
  talent,
  die,
  level = "一般",
  opposition = 0,
  modifier = 0,
) {
  const difficulty = { 容易: 40, 一般: 55, 困难: 70, 极难: 85 }[level];
  if (!difficulty) throw new Error("未知判定难度");
  const score = talent + modifier + fateModifier(die) - opposition / 2;
  return { score, difficulty, success: score >= difficulty };
}
