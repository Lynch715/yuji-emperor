import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// All requests use the real orchestration/client/validators and a local mock.
// Pass an exported e7fb6d2 tree to reproduce the old request chain.
export async function speedBenchmark(root=resolve(import.meta.dirname,'..')){
 const module=path=>import(pathToFileURL(resolve(root,path)).href);
 const [{createState},{initialTurn,forecastTurn},{classifyMemorialSchedule},intent,turn,{callJSON},{classifyMessages}]=await Promise.all([
  module('src/core/state.js'),module('src/core/turn.js'),module('src/llm/remark-classifier.js'),module('src/ui/intent-request.js'),module('src/ui/turn-request.js'),module('src/llm/client.js'),module('src/llm/prompts.js'),
 ]);
 const config={key:'mock',base:'https://speed.example.test',model:'mock',provider:'custom'},rows=[];
 for(const scenario of ['无自由文本','四本明确朱批','混合口谕与含糊朱批','混合输入及软违规']){
  const state=initialTurn(createState({seed:'提速对照',demo:false,freedom:'mid'}));
  // Measure the maximum request chain on a monthly new-petition turn.
  if(state.v>=23){state.turn=2;state.day=20;state.era.xun=2;}
  while(state.memorials.length<4)state.memorials.push({...structuredClone(state.memorials[0]),id:'speed-'+state.memorials.length});
  const mixed=scenario.startsWith('混合'),soft=scenario.endsWith('软违规');
  const schedule=scenario==='无自由文本'?{朝:{kind:'歇息'}}:{朝:{kind:'批折',memorials:state.memorials.slice(0,4).map(m=>m.id),decisions:Object.fromEntries(state.memorials.slice(0,4).map((m,i)=>[m.id,{option:'hold',remark:mixed&&i<2?'此番有心了':'不必嘉奖，责成核查'}]))},...(mixed?{午:{kind:'下旨',text:'请户部再议仓储之事'}}:{})};
  const trace=[];let active=0,maxConcurrent=0,completedDepth=0;
  const fetcher=async(url,options)=>{
   const body=JSON.parse(options.body),system=body.messages[0].content,user=body.messages[1].content;
   const kind=system.includes('朱批分类员')?'朱批分类':system.includes('意图解析员')?'意图':system.includes('句子改写任务')?'改写':system.includes('奏折正文任务')?'奏折':'主叙事';
   const entry={kind,depth:completedDepth+1,inputCharacters:body.messages.reduce((n,m)=>n+m.content.length,0)};trace.push(entry);active++;maxConcurrent=Math.max(maxConcurrent,active);
   await new Promise(r=>setTimeout(r,1));
   let data;
   if(kind==='朱批分类')data={kind:user.includes('有心')?'嘉奖':'附旨'};
   else if(kind==='意图'){const {inputs}=JSON.parse(user);data={actions:[],remarks:inputs.filter(i=>i.id.includes(':remark:')).map(i=>({inputId:i.id,remarkKind:'嘉奖'}))};}
   else if(kind==='改写')data={rewrites:JSON.parse(user).violations.map(v=>({id:v.id,text:'户部尚须核问。'}))};
   else if(kind==='奏折')data={memorialTexts:JSON.parse(user).memorials.map(m=>({id:m.id,text:'臣谨陈此事，尚待御前裁处。\n\n所请仍须详议，未敢擅行。'}))};
   else data={chapter:{朝:'殿门缓缓打开。'+(soft?'拨银九亿两。':''),午:'廊下风静。',夜:'灯影渐低。'},summary:'御前一旬'};
   active--;completedDepth=Math.max(completedDepth,entry.depth);
   return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(data)}}]}),{headers:{'Content-Type':'application/json'}});
  };
  let prepared;
  if(turn.requestTurnContent)prepared=await intent.requestScheduleIntents(config,state,schedule,{fetcher});
  else{
   const classified=await classifyMemorialSchedule(schedule,text=>callJSON(config,classifyMessages(text,'remark'),{fetcher}));
   prepared={schedule:classified,intents:await intent.requestScheduleIntents(config,state,classified,{fetcher})};
  }
  const forecast=forecastTurn(state,prepared.schedule,prepared.intents);
  await (turn.requestTurnContent||turn.requestTurnNarrative)(config,state,forecast,{fetcher});
  rows.push({scenario,requests:trace.length,serialDepth:completedDepth,maxConcurrent,mainInputCharacters:trace.find(t=>t.kind==='主叙事').inputCharacters,trace});
 }
 return rows;
}
if(process.argv[1]===import.meta.filename)console.log(JSON.stringify(await speedBenchmark(process.argv[2]),null,2));
