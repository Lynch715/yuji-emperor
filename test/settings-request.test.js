import test from 'node:test';
import assert from 'node:assert/strict';
import {createDialogRequestScope,onDialogExit,probeErrorMessage} from '../src/ui/request-scope.js';
import {callJSON} from '../src/llm/client.js';
import {validateProbe} from '../src/llm/validate.js';
class Dialog extends EventTarget {
  open=true;owner;
  contains(node){return node===this.owner;}
  queuedClose(){this.dispatchEvent(new Event('close'));}
}
const setup=()=>{const d=new Dialog(),owner={isConnected:true};d.owner=owner;return{d,owner,scope:createDialogRequestScope(d,owner)};};
const config={key:'test-only',base:'http://127.0.0.1:1',model:'fixture',provider:'custom'};
const success=()=>new Response(JSON.stringify({choices:[{message:{content:'{"ok":true,"message":"已接通"}'},finish_reason:'stop'}]}),{headers:{'Content-Type':'application/json'}});
test('菜单延迟 close 不会取消当前设置页的首次真实请求',async()=>{
  const {d,scope}=setup();const request=scope.begin(),metrics=[];let sent=0;
  queueMicrotask(()=>d.queuedClose());await Promise.resolve();
  const result=await callJSON(config,[],{signal:request.signal,validate:validateProbe,fetcher:async()=>{sent++;return success();},onMetric:m=>metrics.push(m)});
  assert.equal(request.signal.aborted,false);assert.equal(sent,1);assert.equal(result.ok,true);assert.equal(metrics[0].result,'ok');assert.equal(scope.current(request),true);
});
test('真正关闭设置页会停止挂起请求，不自动重试',async()=>{
  const {d,scope}=setup(),request=scope.begin(),metrics=[];let sent=0;
  const pending=callJSON(config,[],{signal:request.signal,fetcher:()=>{sent++;return new Promise(()=>{});},onMetric:m=>metrics.push(m)});
  d.open=false;d.queuedClose();await assert.rejects(pending,/请求已取消/);
  assert.equal(sent,1);assert.equal(metrics.length,1);assert.equal(metrics[0].result,'cancelled');assert.equal(scope.current(request),false);
});
test('替换窗口只取消旧请求，不误取消新一轮测试',async()=>{
  const {d,owner,scope}=setup(),old=scope.begin();owner.isConnected=false;
  const newer={isConnected:true};d.owner=newer;
  const nextScope=createDialogRequestScope(d,newer),request=nextScope.begin();d.queuedClose();
  assert.equal(old.signal.aborted,true);assert.equal(request.signal.aborted,false);assert.equal(scope.current(old),false);
  const reply=await callJSON(config,[],{signal:request.signal,validate:validateProbe,fetcher:async()=>success()});assert.equal(reply.ok,true);
});
test('每次测试信号独立，旧 finally 不能释放新请求',()=>{
  const {scope}=setup(),old=scope.begin(),next=scope.begin();
  assert.notEqual(old,next);assert.equal(old.signal.aborted,true);assert.equal(next.signal.aborted,false);
  scope.finish(old);assert.equal(scope.current(next),true);scope.finish(next);assert.equal(scope.current(next),false);
  const third=scope.begin();assert.equal(third.signal.aborted,false);
});
test('共用退出监听跳过前一浮层的 close，真正退出只清理一次',()=>{
  const {d,owner}=setup();let cleanups=0;onDialogExit(d,owner,()=>cleanups++);
  d.queuedClose();assert.equal(cleanups,0);d.open=false;d.queuedClose();d.queuedClose();assert.equal(cleanups,1);
});
test('失效窗口不能启动测试',()=>{
  const {d,scope}=setup();d.open=false;assert.throws(()=>scope.begin(),/窗口已关闭/);
});
test('连接错误区分密钥、余额、型号、网络与超时，不回显服务商正文',()=>{
  for(const [status,word]of [[401,'密钥'],[402,'余额'],[403,'权限'],[404,'型号'],[429,'频繁'],[503,'服务商']]){
    const text=probeErrorMessage(new Error('HTTP '+status+' private-provider-body'));assert.ok(text.includes(word));assert.ok(!text.includes('private-provider-body'));
  }
  assert.match(probeErrorMessage(new Error('format'),{httpStatus:0,result:'failed'}),/网络/);
  assert.match(probeErrorMessage(new Error('本回合请求已达 240 秒预算')),/超时/);
});
