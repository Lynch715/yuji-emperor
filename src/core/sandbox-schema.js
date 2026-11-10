export const WORLD_MAX=Number.MAX_SAFE_INTEGER;
export function defaultScenarioEvents(legacyFromTurn=-1){return {version:1,legacyFromTurn,seen:[],decisions:{}};}
export function defaultFiat(){return {used:false,objects:[],rules:[]};}
export function validateSandbox(s){
 if(s.v<26)return;
 const e=s.scenarioEvents,f=s.fiat;
 if(!e||e.version!==1||!Number.isSafeInteger(e.legacyFromTurn)||e.legacyFromTurn< -1||!Array.isArray(e.seen)||new Set(e.seen).size!==e.seen.length||e.seen.some(id=>typeof id!=='string')||!e.decisions||typeof e.decisions!=='object'||Array.isArray(e.decisions)||Object.entries(e.decisions).some(([id,v])=>!e.seen.includes(id)||typeof v!=='string'))throw new Error('剧本事件进度损坏');
 if(!Number.isSafeInteger(s.era.baseYear)||s.era.baseYear<1)throw new Error('开局纪年损坏');
 if(!f||typeof f.used!=='boolean'||!Array.isArray(f.objects)||!Array.isArray(f.rules))throw new Error('言出法随世界损坏');
 for(const list of [f.objects,f.rules]){
  if(new Set(list.map(x=>x?.id)).size!==list.length)throw new Error('自定义世界对象重复');
  for(const x of list)if(!x||typeof x.id!=='string'||typeof x.name!=='string'||typeof x.description!=='string'||!x.name.trim())throw new Error('自定义世界对象损坏');
 }
 for(const r of f.rules)if(!['once','eachTurn'].includes(r.period)||!Array.isArray(r.operations)||!Number.isSafeInteger(r.lastTurn)||r.lastTurn<0||r.lastTurn>s.turn||r.operations.some(o=>!o||typeof o.op!=='string'||o.op==='policy'))throw new Error('自定义制度损坏');
}
