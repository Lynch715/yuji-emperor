import { clone } from './state.js';
// A prose retry cannot change the calendar, RNG, choices, accounts or history.
export function applyMemorialTexts(state,texts){
 const s=clone(state);let changed=false;
 for(const item of texts){
  const m=s.memorials.find(m=>m.id===item.id);
  if(!m||m.textStatus!=='template'||item.status!=='ready'||typeof item.text!=='string'||!item.text.trim())continue;
  m.text=item.text.slice(0,1000);m.textStatus='ready';changed=true;
 }
 if(changed)s.revision++;
 return s;
}
