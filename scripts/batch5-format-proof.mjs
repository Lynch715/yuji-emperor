import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {stage9Fixture,CASES} from '../qa/stage9-fixture.js';
import {createMemorialSession,memorialAction} from '../src/ui/memorials.js';
import {forecastTurn} from '../src/core/turn.js';
const proof={};
for(const [name,c] of Object.entries(CASES)){
 const s=stage9Fixture(),session=createMemorialSession(s,c.kind,c.slot);
 session.ids=s.memorials.slice(0,c.count).map(m=>m.id);session.stance=c.stance;
 for(const id of session.ids){session.choices[id]=c.decision;session.remarks[id]=c.remark||'';}
 const f=forecastTurn(s,{...s.schedule,[c.slot]:memorialAction(s,session)});
 // v12 changes the memorial catalogue and rotation history intentionally.
 // Hash the current complete forecast; older format-only hashes stay archived.
 proof[name]=createHash('sha256').update(JSON.stringify(f)).digest('hex');
}
if(process.argv[2]!=='--stdout')writeFileSync(process.argv[2]||'qa/batch5/format-after.json',JSON.stringify(proof,null,2));
console.log(JSON.stringify(proof));
