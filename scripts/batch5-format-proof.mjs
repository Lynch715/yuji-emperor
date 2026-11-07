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
 // v17 deliberately changes hearing energy, referral deadlines and author snapshots.
 // v18 only adds optional scenes. Normalize its version for the v17 legacy-path comparison.
 f.state.v=17;
 // v21 neutral development fields do not alter these pre-quarter legacy paths.
 delete f.state.tech;
 // v22 exam scheduling is neutral until the player appoints an examiner.
 delete f.state.keju;
 // v24 dowager affiliation is neutral in these adult, non-regency paths.
 delete f.state.dowagerFaction;
 for(const p of f.state.nation.provinces){delete p.prosperity;delete p.industries;}
 // Keep the complete current forecast and retain historical hashes in summary.json.
 // v25 adds display identities to the published v24. Compare every pre-existing field unchanged.
 proof[name]=createHash('sha256').update(JSON.stringify(f,(key,value)=>
   key==='faceNo'||key==='faceCounters'?undefined:value)).digest('hex');
}
if(process.argv[2]!=='--stdout')writeFileSync(process.argv[2]||'qa/batch5/format-after.json',JSON.stringify(proof,null,2));
console.log(JSON.stringify(proof));
