import {clone} from './state.js';
import {addEvent} from './events.js';
import {SCENARIO_EVENTS} from './scenario-event-catalog.js';
const serving=(s,name)=>s.court.officials.find(o=>o.name===name&&o.alive&&o.health>0&&!o.jailed&&!o.retired&&s.court.posts.some(p=>p.holder===o.id&&p.id===o.post));
export function seedScenarioEvents(state){
 if(state.v<26||!state.scenario||state.reign?.number!==1)return state;
 let s=clone(state);
 for(const original of SCENARIO_EVENTS[s.scenario]||[]){
  const progress=s.scenarioEvents;
  if(s.turn<original.at||progress.seen.includes(original.id))continue;
  progress.seen.push(original.id);
  if(original.at<=progress.legacyFromTurn)continue;
  const guarded=(!original.requires||serving(s,original.requires))&&(!original.requiresChoice||progress.decisions[s.scenario+'-'+original.requiresChoice.event]==='opt'+original.requiresChoice.choice);
  const event=guarded?original:original.alternative;
  if(!event)continue;
  // 新局的专属御前折占用一本例奏额度，不挤成四本开局作业。
  if(s.turn===0&&s.memorials.length>=3){const replace=s.memorials.findLast(m=>m.agendaVersion===1&&!m.urgent);if(replace)s.memorials=s.memorials.filter(m=>m.id!==replace.id);}
  s=addEvent(s,'剧本','【剧本】'+event.title,event.cause,event.choices.map(c=>({...c,consequence:c.label,scenarioOutcome:Object.fromEntries(['dismiss','favor','country'].filter(k=>c[k]!==undefined).map(k=>[k,c[k]]))})));
  // addEvent克隆状态，后续进度仍须引用克隆后的同一份进度。
  const m=s.memorials.at(-1);m.scenarioEvent=original.id;m.text=event.cause+'\n此后走向由陛下的选择与当前局势决定。';m.textStatus='template';
  const t=s.threads.at(-1);t.scenarioEvent=original.id;
 }
 return s;
}
