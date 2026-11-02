// A native dialog's queued close event may belong to the window it previously held.
export function onDialogExit(dialog, owner, callback) {
  let done=false;
  const closed=()=>{
    if(dialog.open&&owner.isConnected&&dialog.contains(owner))return;
    if(done)return;
    done=true;
    dialog.removeEventListener('close',closed);
    callback();
  };
  dialog.addEventListener('close',closed);
  return ()=>{done=true;dialog.removeEventListener('close',closed);};
}
export function createDialogRequestScope(dialog, owner) {
  let disposed=false,active=null;
  const attached=()=>!disposed&&dialog.open&&owner.isConnected&&dialog.contains(owner);
  onDialogExit(dialog,owner,()=>{disposed=true;active?.abort();active=null;});
  return {
    begin(){
      if(!attached())throw new Error('设置窗口已关闭，请重新打开。');
      active?.abort();active=new AbortController();return active;
    },
    current(request){return attached()&&active===request;},
    finish(request){if(active===request)active=null;},
  };
}
export function probeErrorMessage(error,metric) {
  const message=error?.message||'';
  const status=Number(message.match(/^HTTP (\d+)/)?.[1]||metric?.httpStatus||0);
  if(status===401)return '密钥未通过验证，请检查填写是否完整。';
  if(status===402)return '接口余额不足，请到服务商账户核对。';
  if(status===403)return '接口拒绝访问，请检查账户与地域权限。';
  if(status===404)return '接口或型号未找到，请核对地址和模型名称。';
  if(status===429)return '请求过于频繁，请稍后再试。';
  if(status>=500)return '服务商暂时不可用，请稍后再试。';
  if(/取消/.test(message))return '本次测试已取消，可以重新测试。';
  if(/240 秒|超时/.test(message))return '连接测试超时，请稍后再试。';
  if(metric?.httpStatus===0&&metric.result==='failed')return '网页未能连接接口，请检查网络或接口是否允许浏览器访问。';
  if(status===200)return '接口已回应，但回复格式不符合要求，请重试。';
  return message||'连接未完成，请重试。';
}
