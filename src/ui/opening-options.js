import { GOALS } from '../core/ambitions.js';
export const DIFFICULTIES = {
  easy:{label:'容易',note:'大臣更容易把圣旨办好，适合先熟悉朝政。'},
  normal:{label:'标准',note:'圣旨能否落实，按平常的朝局条件判断。'},
  hard:{label:'困难',note:'圣旨更难落实，需要更用心地选人、理财和稳住朝局。'},
};
export function scenarioDifficulty(sc) {return {宽和:'easy',常制:'normal',艰危:'hard'}[sc?.difficulty] || 'normal';}
const RECOMMENDATIONS = {
  'han-wudi':[
    ['clean','少年立新政，先把办事的班底理顺。'],['north','以北边匈奴为长期对手，逐步积攒军力。'],
    ['friend','在两宫之间，结识肯为你办事的大臣。'],['heir','立下储君，安定后宫与继统。']],
  'tang-taizong':[
    ['peace','兵临渭水之际，也要让百姓和朝臣安心。'],['north','先守住边关，再争取战场上的主动。'],
    ['friend','用人不拘旧怨，争取能臣信任。'],['love','朝堂之外，也留心身边相伴的人。']],
  'song-renzong':[
    ['clean','从厘清朝臣职责入手，为亲政做准备。'],['peace','把安民与治理当作长久功课。'],
    ['health','幼帝起步，先安稳长大，养好身体。'],['friend','结识直臣，亲政时才有人可用。']],
  'ming-wanli':[
    ['clean','考成与新政正待推行，可先整顿六部。'],['wealth','清理钱粮，让朝廷和地方都有余力。'],
    ['friend','在太后与首辅身边，逐渐建立自己的班底。'],['family','从幼帝成长到成家，经营自己的宫廷。']],
  'ming-chongzhen':[
    ['clean','阉党盘根错节，先选可用之臣、整顿朝局。'],['wealth','国库吃紧，赈灾与边饷都等着钱粮。'],
    ['friend','危局之中，找到能信任、能办事的大臣。'],['heir','在救急之外，也为大明留下承继之人。']],
  'qing-kangxi':[
    ['peace','从辅政起步，逐步稳住地方与朝局。'],['tribute','边地与藩镇各有所求，尝试以战和交涉安定四方。'],
    ['health','幼帝先养好身体，等待亲政。'],['friend','结识自己的能臣，逐渐掌握用人之权。']],
  'qing-yongzheng':[
    ['clean','继位之争未平，先理清六部、整顿官场。'],['wealth','清查亏空，让钱粮真正可用。'],
    ['heir','继统之事早做安排，免留后患。'],['friend','在旧党与新臣之间，建立可靠的班底。']],
};
export function scenarioRecommendations(id) {
  return (RECOMMENDATIONS[id] || []).map(([goal,reason]) => ({...GOALS.find(g=>g.id===goal),reason}));
}
