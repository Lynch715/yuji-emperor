import {parseNumber,NUMBER_SOURCE} from './quantities.js';
import {TECHS} from '../core/tech-rules.js';
import {fiatEnabled} from '../core/fiat.js';
export function fiatIntentMessages(state,inputs){
 return [{role:'system',content:`你是帝王游戏言出法随档的指令解析员，只输出 JSON，不写剧情。玩家对游戏世界有最高决定权，不因钱粮、年龄资历、职位、历史年代、科技前置或既有动作模板拒绝要求。必须逐条落实玩家明确的目标和数量，尊重“不、不要、保留、仅”等限制，不擅自杀人、花钱、改变他人或增加愿望。普通闲聊无需改变状态。复合指令按顺序执行，可先创建新对象再按名字引用。未有专用模块的事物用object建立有数值属性的世界对象，或policy记录制度与每旬运行的具体操作；不能把实际请求降为other/拟议，也不能只写一句已完成。
每条输入返回一个type:"fiat"动作，带inputId、text原文、operations数组。op只选：
set/add {target,field,value}：指定值/增量。target可为emperor/nation/capital/tech/keju、人物或外邦/州/派系的ID或姓名、边境方向、officials/consorts/children/provinces/factions/countries/armies全组。钱粮单位万两/万石，兵力为人；明确两/石须除10000。中文亿万须准确换算。field可为国库、内帑、粮储、吏治、民心、健康、年龄、寿命、心情、皇威、圣德、教养、资质、好感、位分，五才talents.政略/权谋/武略/文采/魅力、官员abilities.政/军/才/德/忠/权谋，军队troops/readiness/threat，州pop/tax/disaster/prosperity，外邦attitude，姓名name等。数字不受旧100/百万游戏上限约束，但必须是有限可表示数。
create {kind,name,age,gender,description,fields,other}：kind为official/consort/child/country/province/faction/post/object。fields只给玩家要求的属性；child.other可给母亲姓名。新任官者若不在名册，先创建；新官职可直接给名称。
appoint {target,post}、dismiss/imprison/kill/revive {target}：任免、收监、死亡与复生。relation {target,other?,value}：与另一人双向关系，省other则对皇帝好感。
technology {target或name}：立即掌握已知或自创新技术；complete {target:项目ID/名称/all}竣工；war {target:外邦ID或名,outcome:归附/胜利/失败/议和/宣战}；object {name,kind,description,fields}建立新事物，之后set/add用对象名和values.属性；policy {name,description,period:once/eachTurn,operations:[上述操作]}制定新制度，eachTurn只在每旬末运行一次，不递归建制度；fact {target,name,description}记录玩家明确改写的世界事实。以现有世界状态为基础补足必要对象，禁止执行代码或修改存档事务。无法把任意概念等同现有制度时，创建对应世界对象及规则，保持玩家本意。所有结果交引擎验证执行，不能自行宣称成功。
输出 {"actions":[{"inputId":"朝","type":"fiat","text":"原文","operations":[{"op":"set","target":"nation","field":"treasury","value":10000}]}],"remarks":[]}。`},
 {role:'user',content:JSON.stringify({emperor:state.emperor,nation:{treasury:state.nation.treasury,privy:state.nation.privy,grain:state.nation.grain},persons:[...state.court.officials,...state.harem.consorts,...state.harem.children,...state.harem.royalWomen].map(p=>({id:p.id,name:p.name,age:p.age,alive:p.alive,health:p.health})),posts:state.court.posts.map(p=>({id:p.id,name:state.postNames?.[p.id]||p.title})),countries:state.foreign.map(f=>({id:f.id,name:f.name,ruler:f.ruler})),provinces:state.nation.provinces.map(p=>({id:p.id,name:p.name})),technologies:TECHS.map(t=>({id:t.id,name:t.name})),world:state.fiat,inputs})}];
}
// Deterministic offline examples; an unparsed clause is reported, never silently
// converted into an accomplished wish. Connected play uses the full interpreter.
export function localFiatOperations(state,input){
 if(!fiatEnabled(state)||!/(?:设为|设置|增加|变为|变成|复活|创建|新建|全部|所有|全体|无限|永生|满级|掌握|立即完成|每旬|从此|不要|不许|不得|不必)/.test(input.text))return null;
 const n=new RegExp('('+NUMBER_SOURCE+')(万两|万石|两|石|人|岁|点)?');
 const created=[],ops=[];
 const names=()=>[...state.court.officials,...state.harem.consorts,...state.harem.children,...state.foreign,...state.nation.provinces,...created];
 const who=t=>names().find(p=>t.includes(p.name||p.ruler))?.name||(/朕|皇帝/.test(t)?'emperor':null);
 const parse=text=>{
  if(/^(不要|不许|不得|不必|无需|勿|毋)/.test(text))return [];
  let m=text.match(/^(?:创建|新建)(官员|文臣|武将|妃嫔|皇子|公主|国家|势力|州郡|官职|事物)[：:\s]*(.+)$/);
  if(m){const kind={官员:'official',文臣:'official',武将:'official',妃嫔:'consort',皇子:'child',公主:'child',国家:'country',势力:'faction',州郡:'province',官职:'post',事物:'object'}[m[1]],name=m[2].trim();created.push({name});return [{op:'create',kind,name,...(m[1]==='公主'?{gender:'女'}:{})}];}
  if(/所有科技|全部科技/.test(text)&&/掌握|完成|解锁/.test(text))return TECHS.map(t=>({op:'technology',target:t.id}));
  if(/^掌握|^立即发明|^发明/.test(text))return [{op:'technology',name:text.replace(/^(掌握|立即发明|发明)/,'').trim()}];
  if(/立即完成.*(?:所有|全部).*项目/.test(text))return [{op:'complete',target:'all'}];
  if(/(?:全部|所有).*外邦.*(?:归附|臣服)/.test(text))return state.foreign.map(f=>({op:'war',target:f.id,outcome:'归附'}));
  const target=who(text);
  if(/复活/.test(text)&&target)return [{op:'revive',target}];
  if(/赐死|处死|斩首/.test(text)&&target)return [{op:'kill',target}];
  if(/罢免|革职/.test(text)&&target)return [{op:'dismiss',target}];
  if(/下狱|收监/.test(text)&&target)return [{op:'imprison',target}];
  m=text.match(/(?:任命|任|让)(.+?)(?:出任|担任|为)(.+)$/);if(m)return [{op:'appoint',target:who(m[1])||m[1].trim(),post:m[2].trim()}];
  if(/朕.*(?:全部|所有).*属性.*满级|朕.*无敌/.test(text))return ['政略','权谋','武略','文采','魅力','健康','心情','皇威','圣德'].map(field=>({op:'set',target:'emperor',field,value:100}));
  if(/朕.*永生/.test(text))return [{op:'policy',name:'天子永生',description:text,period:'eachTurn',operations:[{op:'set',target:'emperor',field:'health',value:100},{op:'set',target:'emperor',field:'lifespan',value:1000000}]}];
  const field=text.match(/国库|内帑|粮储|民心|吏治|健康|心情|皇威|圣德|年龄|好感|宠眷|忠诚|政略|权谋|武略|文采|魅力|兵力|战备|边患|教养|资质/)?.[0];
  if(field){const valueText=text.slice(text.indexOf(field)+field.length),number=valueText.match(n);let value=number?parseNumber(number[1]):/满级|全满/.test(text)?100:/无限/.test(text)?1000000000000:null;if(value===null)return null;
   if(['国库','内帑','粮储'].includes(field)){const unit=valueText.match(new RegExp('('+NUMBER_SOURCE+')\\s*(两|石)'));if(unit)value=parseNumber(unit[1])/10000;}
   const all=/所有官员|全体官员/.test(text)?'officials':/所有嫔妃/.test(text)?'consorts':/各州|所有百姓/.test(text)?'provinces':null;
   const receiver=all||(['国库','内帑','粮储','民心','吏治'].includes(field)?'nation':/京营/.test(text)?'capital':target||'emperor');
   return [{op:/增加|提升|提高|加上/.test(text)?'add':'set',target:receiver,field:field==='忠诚'?'abilities.忠':field,value}];
  }
  return null;
 };
 for(const raw of input.text.split(/[；;。\n，,]/).map(s=>s.trim()).filter(Boolean)){
  const match=raw.match(/^(每旬|从此每旬)(.+)$/);const result=parse(match?match[2]:raw);if(!result)return {error:'试读暂不能完整解析这条指令，请连接模型后重试：'+raw};
  if(match)ops.push({op:'policy',name:raw,description:raw,period:'eachTurn',operations:result});else ops.push(...result);
 }
 return ops.length?{operations:ops}:null;
}
