// No state mutation or randomness: migration can use the same selection rule.
export function chooseRegent(s) {
  const mother = s.harem.consorts.find(c => c.id === s.harem.children.find(c => c.id === s.reign?.emperorId)?.mother);
  const candidates = [{id:'dowager',name:s.dowager || mother?.name || '慈宁太后',power:mother?.scheming ?? 65,faction:mother?.faction || 'f0'}];
  for (const title of ['内阁首辅','宗人令']) {
    const id=s.court.posts.find(p=>p.title===title)?.holder;
    const o=s.court.officials.find(o=>o.id===id&&o.alive&&o.health>0&&!o.jailed&&!o.retired);
    if(o)candidates.push({id:o.id,name:o.name,power:o.abilities.权谋 ?? 50,faction:o.faction});
  }
  return candidates.sort((a,b)=>b.power-a.power)[0];
}
export function regentPerson(s) {
  if(s.regency?.regentId==='dowager')return {id:'dowager',name:s.dowager || '慈宁太后',faction:'f0'};
  return s.court.officials.find(o=>o.id===s.regency?.regentId&&o.alive&&!o.jailed&&!o.retired) || chooseRegent(s);
}
