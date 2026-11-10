export function globalYear(turn) { return 1 + Math.floor(turn / 36); }
export function calendarEra(s) {
  const nextStart=s.reign?.eraStartTurn;
  const changed=Number.isFinite(nextStart)&&s.turn>=nextStart&&s.era.startTurn!==nextStart;
  const start=changed?nextStart:(s.era.startTurn || 0);
  return {...s.era,name:changed?s.reign.eraName:s.era.name,startTurn:start,
    baseYear:changed?1:(s.era.baseYear||1),year:(changed?1:(s.era.baseYear||1))+Math.floor((s.turn-start)/36),month:1+Math.floor((s.turn%36)/3),xun:s.turn%3};
}
