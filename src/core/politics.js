// Derive office influence without changing the input state. Event influence is
// kept separately so removing an official cannot erase an unrelated event.
export function factionPowers(s){
 return s.court.factions.map(f=>{
  const offices=s.court.posts.reduce((sum,p)=>{
   const o=s.court.officials.find(o=>o.id===p.holder&&o.post===p.id&&o.alive&&o.health>0&&!o.retired&&!o.jailed&&o.faction===f.id);
   return sum+(o?Math.max(1,5-p.rank)*(o.abilities.政+o.abilities.权谋)/2:0);
  },0);
  return {...f,power:Math.min(100,Math.max(0,offices/20+(f.powerModifier||0)))};
 });
}
