import {createState} from '../src/core/state.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {selectAmbitions} from '../src/core/ambitions.js';
import {applyPackage} from '../src/core/effects.js';
import {talkAttempt} from '../src/core/court.js';
import {mockNarrative} from '../src/llm/validate.js';
export const SEED='御极·夜御案验收';
export function stage9Fixture(visual=false){
 let s=initialTurn(selectAmbitions(createState({seed:SEED,demo:true})));
 const f=forecastTurn(s);s=commitTurn(s,f,mockNarrative(f));
 s.memorials=s.memorials.slice(0,6);
 if(visual){
  const before=s.ledger.length;
  s=applyPackage(s,{treasury:12,grain:-5,morale:1,governance:-20,province:{id:'z2',morale:-21,disaster:72}},'界面验收：预置危险与涨跌样例');
  s.interimEntries=s.ledger.slice(before);
  s.history.at(-1).summary='永宁新政';
  const petition=s.memorials.find(m=>m.title.includes('江南'));
  if(petition)petition.text='臣'+petition.from+'谨奏：今夏江南霖雨不止，圩田浸没，饥民扶老携幼就食于城下。府库所存不足支应，臣已开仓平粜，然杯水车薪。\n\n伏乞陛下发帑赈济，以安民心。臣不胜惶恐待命之至。';
  const talk=talkAttempt(s,'o2','卿以为赈务当如何？');s=talk.state;
  s.schedule={朝:{kind:'上朝',memorials:s.memorials.slice(0,3).map(m=>m.id),decision:'approve',stance:'廷议',target:'o0',remark:'',label:'3 本奏报'},午:{kind:'召见',person:'o2',label:'顾文渊'},夜:null};
 }
 return s;
}
export const CASES={
 court3:{kind:'上朝',count:3,slot:'朝',decision:'approve',stance:'依旨施行'},
 batch6:{kind:'批折',count:6,slot:'午',decision:'reject',stance:'依旨施行'},
 discuss:{kind:'批折',count:1,slot:'午',decision:'discuss',stance:'依旨施行'},
 hold:{kind:'上朝',count:1,slot:'朝',decision:'hold',stance:'依旨施行'},
 accountability:{kind:'上朝',count:1,slot:'朝',decision:'approve',stance:'当廷问责'},
 remark:{kind:'批折',count:1,slot:'午',decision:'remark',stance:'依旨施行',remark:'勤勉可嘉，毋懈职守。'},
 debate:{kind:'上朝',count:3,slot:'朝',decision:'approve',stance:'廷议'},
};
