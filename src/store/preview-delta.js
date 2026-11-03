// Internal recovery encoding only. Normal JSON exports keep full forecast states.
export function previewDelta(before,after){
 if(JSON.stringify(before)===JSON.stringify(after))return null;
 const full=['v',after];
 if(!before||!after||typeof before!=='object'||typeof after!=='object'||Array.isArray(before)!==Array.isArray(after))return full;
 if(Array.isArray(before)&&before.length!==after.length)return full;
 const changes={},removed=Object.keys(before).filter(k=>!Object.hasOwn(after,k));
 for(const key of Object.keys(after)){const d=previewDelta(before[key],after[key]);if(d)changes[key]=d;}
 const patch=['o',changes,removed];
 return JSON.stringify(patch).length<JSON.stringify(full).length?patch:full;
}
export function applyPreviewDelta(before,patch,depth=0){
 if(depth>100||!Array.isArray(patch))throw new Error('恢复预演编码损坏');
 if(patch[0]==='v')return patch[1];
 if(patch[0]!=='o'||!patch[1]||!Array.isArray(patch[2]))throw new Error('恢复预演编码损坏');
 const out=Array.isArray(before)?[...before]:{...before};
 for(const key of [...Object.keys(patch[1]),...patch[2]])if(['__proto__','constructor','prototype'].includes(key))throw new Error('恢复预演字段无效');
 for(const [key,value] of Object.entries(patch[1]))out[key]=applyPreviewDelta(before?.[key],value,depth+1);
 for(const key of patch[2])delete out[key];
 return out;
}
export function restoreRecovery(state){
 const f=state.pending?.forecast;
 if(!f?.statePatch)return state;
 const base={...state,pending:null};const {statePatch,...forecast}=f;
 return {...state,pending:{...state.pending,forecast:{...forecast,state:applyPreviewDelta(base,statePatch)}}};
}
