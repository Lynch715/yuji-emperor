export const POSTHUMOUS_TABLE={上:['文','武','明','睿','昭','圣','成','宣'],中上:['仁','惠','孝','章','景','端','穆','肃'],中:['平','康','安','靖','定','和','顺','恭'],下:['厉','简','夷','悼','愍','怀','冲','质'],末:['炀','幽','灵','荒','废','殇'],亡国:['哀','思','愍','悼','怀']};
export const TEMPLE_TABLE={上:['太祖','高祖','世宗','圣宗','仁宗','宣宗','宪宗'],中上:['仁宗','宣宗','宪宗','肃宗','睿宗','成宗'],中:['宪宗','成宗','穆宗','敬宗','宁宗','定宗'],下:['厉宗','简宗','悼宗','怀宗'],末:['昏宗','幽宗','灵宗','荒宗'],亡国:['哀宗','思宗','愍宗','悼宗']};
function unusedTitle(table,used,suffix=''){
 for(const title of table)if(!used.has(title))return title;
 const roots=table.map(t=>suffix?t.slice(0,-suffix.length):t);
 // Expand the grade's own character table when a very long dynasty exhausts
 // its short names; never renumber or rename an already sealed emperor.
 for(let length=2;;length++){
  const count=roots.length**length;
  for(let i=0;i<count;i++){
   let n=i,title='';for(let j=0;j<length;j++){title=roots[n%roots.length]+title;n=Math.floor(n/roots.length);}
   title+=suffix;if(!used.has(title))return title;
  }
 }
}
export function imperialTitles(state,tier){
 const key=state.ending.type==='亡国'?'亡国':tier;
 const records=state.chronicles.filter(r=>(r.dynastyId||state.runId)===state.runId);
 return {posthumous:unusedTitle(POSTHUMOUS_TABLE[key],new Set(records.map(r=>r.posthumous))),templeName:unusedTitle(TEMPLE_TABLE[key],new Set(records.map(r=>r.templeName)),'宗')};
}
