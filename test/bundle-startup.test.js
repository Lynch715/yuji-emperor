import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
test('单文件脚本可以完成模块加载并到达DOM入口，无循环依赖或初始化异常',()=>{
 execFileSync(process.execPath,['scripts/build.mjs']);
 const code=readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 // Node deliberately has no DOM. Any earlier module-loader error is a failure;
 // actual rendering and interactions are checked in the in-app browser.
 assert.throws(()=>runInNewContext(code,{}, {timeout:5000}),e=>e.name==='ReferenceError'&&e.message==='document is not defined');
});
