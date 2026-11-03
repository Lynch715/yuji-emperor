// Sealed ledgers retain net contribution for each source/path. Non-numeric
// changes (appointments, text) remain in chronological order.
export function compactEntries(entries){
 const groups=new Map(),out=[];
 for(const e of entries||[]){
  if(typeof e.delta!=='number'){out.push({...e});continue;}
  if(e.delta===0)continue;
  const key=JSON.stringify([e.path,e.source]);
  if(!groups.has(key)){const row={...e};groups.set(key,row);out.push(row);}else{const row=groups.get(key);row.delta+=e.delta;row.after=row.before+row.delta;}
 }
 return out.filter(e=>e.delta!==0);
}
export function compactChapter(chapter){return {...chapter,entries:compactEntries(chapter.entries)};}
