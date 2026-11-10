import {clone} from './state.js';
import {factionPowers} from './politics.js';
const serving=(s,name)=>s.court.officials.find(o=>o.name===name&&o.alive&&o.health>0&&!o.jailed&&!o.retired&&s.court.posts.some(p=>p.holder===o.id&&p.id===o.post));
export function applyScenarioOutcome(state,memorial,chosen){
 if(!memorial.scenarioEvent||!state.scenarioEvents)return state;
 const s=clone(state),q=chosen.scenarioOutcome||{};
 s.scenarioEvents.decisions[memorial.scenarioEvent]=chosen.id;
 if(q.dismiss){const o=serving(s,q.dismiss);if(o){o.post=null;o.retired=true;for(const p of s.court.posts)if(p.holder===o.id)p.holder=null;for(const z of s.nation.provinces)if(z.governor===o.id)z.governor=null;}}
 if(q.favor){const o=s.court.officials.find(o=>o.name===q.favor.name);if(o)o.favor=Math.max(0,Math.min(100,o.favor+q.favor.amount));}
 if(q.country){const f=s.foreign.find(f=>f.name===q.country.name);if(f)f.attitude=Math.max(0,Math.min(100,f.attitude+q.country.attitude));}
 s.court.factions=factionPowers(s);
 s.facts.push({subject:memorial.title,key:'御前裁定',value:chosen.label,turn:s.turn});
 return s;
}
