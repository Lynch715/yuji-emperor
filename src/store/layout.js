import { previewDelta } from "./preview-delta.js";
import { hashText } from "./checksum.js";
const refs=new WeakMap();
function volumeRef(state,v){if(!refs.has(v))refs.set(v,hashText(JSON.stringify(v)));return {key:state.runId+':'+v.from,value:v,checksum:refs.get(v)};}
export function storedLayout(state){
 if(!Array.isArray(state.history)||!Array.isArray(state.volumes))return {main:state,volumes:[]};
 const volumes=state.volumes.map(v=>volumeRef(state,v));
 const main={...state,volumes:[],volumeIndex:volumes.length?volumes.map(({key,value,checksum})=>({key,from:value.from,to:value.to,checksum})):state.volumeIndex||[]};
 if(main.pending?.forecast){const f=main.pending.forecast;const {history,volumes:oldVolumes,...core}=f.state;main.pending={...main.pending,forecast:{...f,state:core,historyDetached:true}};}
 return {main,volumes};
}
export function recoveryState(state){
 const {main}=storedLayout(state);if(!Array.isArray(main.history))return main;
 // A scene continuation needs its chapter, cast and previous steps to resume.
 // Keep only that latest chapter; ordinary recovery copies remain text-free.
 const last=main.history.at(-1);
 const core={...main,history:last?.scenes?.length?[last]:[],recoveryOnly:true},f=core.pending?.forecast;
 if(f?.state){
  const base={...core,pending:null},delta=previewDelta(base,f.state);
  if(delta&&JSON.stringify(delta).length<JSON.stringify(f.state).length){const {state:preview,...forecast}=f;core.pending={...core.pending,forecast:{...forecast,statePatch:delta}};}
 }
 return core;
}
export function envelopeIdentity(raw){
 if(raw==null)return null;
 try{const r=typeof raw==='string'?JSON.parse(raw):raw;return [r.revision,r.checksum];}catch{return ['invalid'];}
}
export function sameEnvelope(a,b){return JSON.stringify(envelopeIdentity(a))===JSON.stringify(envelopeIdentity(b));}
