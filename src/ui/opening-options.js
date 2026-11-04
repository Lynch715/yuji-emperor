import { scenarioGoals } from '../core/scenario-goals.js';
export const DIFFICULTIES = {
  easy:{label:'容易',note:'大臣更容易把圣旨办好，适合先熟悉朝政。'},
  normal:{label:'标准',note:'圣旨能否落实，按平常的朝局条件判断。'},
  hard:{label:'困难',note:'圣旨更难落实，需要更用心地选人、理财和稳住朝局。'},
};
export function scenarioDifficulty(sc) {return {宽和:'easy',常制:'normal',艰危:'hard'}[sc?.difficulty] || 'normal';}
export function scenarioRecommendations(id) {
  return scenarioGoals(id);
}
