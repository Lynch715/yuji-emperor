export function createDebouncedSave(run,{schedule=setTimeout,cancel=clearTimeout}={}){
 let timer=null;
 const clear=()=>{if(timer!==null)cancel(timer);timer=null;};
 const flush=()=>{if(timer===null)return Promise.resolve();clear();return run();};
 return {schedule(){clear();timer=schedule(()=>{timer=null;run();},800);},flush,cancel:clear};
}
