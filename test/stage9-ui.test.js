import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stage9Fixture} from '../qa/stage9-fixture.js';
import {forecastTurn} from '../src/core/turn.js';
import {createMemorialSession,memorialAction,effectItems} from '../src/ui/memorials.js';
import {renderApp} from '../src/ui/render.js';
import {energyView,metricGroups,scheduleEstimate} from '../src/ui/view-model.js';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const legacy=JSON.parse(readFileSync('qa/stage9-legacy-actions.json','utf8'));
const current=JSON.parse(readFileSync('qa/stage9-new-actions.json','utf8'));
for(const old of legacy)test('夜御案同种子实走对照：'+old.case,()=>{
 const fresh=current.find(x=>x.case===old.case);
 assert.deepEqual(fresh,old);
 const s=stage9Fixture(),before=structuredClone(s),session=createMemorialSession(s,old.action.kind,old.slot);
 session.ids=[...old.action.memorials];session.stance=old.action.stance;session.target=old.action.target;session.remark=old.action.remark;
 for(const id of session.ids)session.choices[id]=old.action.decision;
 const action=memorialAction(s,session);
 assert.deepEqual(action,old.action);
 assert.equal(hash(s),old.baseStateSha256);
 const forecast=forecastTurn(s,{...s.schedule,[old.slot]:action});
 assert.equal(hash(forecast),old.forecastSha256);
 assert.deepEqual(s,before);
});
test('逐本混合决定沿用既有 decisions 字段，未选完或超过三议题不得写入',()=>{
 const s=stage9Fixture(),model=createMemorialSession(s,'上朝','朝');
 assert.throws(()=>memorialAction(s,model),/逐本/);
 model.ids.forEach((id,i)=>model.choices[id]=['approve','hold','discuss'][i]);
 assert.deepEqual(memorialAction(s,model).decisions,model.choices);
 model.ids.push(s.memorials[3].id);model.choices[model.ids[3]]='reject';
 assert.throws(()=>memorialAction(s,model),/三个/);
});
test('国势涨跌、精力圆点与钱粮估算从现有数据推算，不写状态',()=>{
 const s=stage9Fixture(true),before=structuredClone(s),e=energyView(s);
 assert.equal(e.remaining,6);assert.equal(e.used,3);
 const groups=metricGroups(s);assert.equal(groups.length,4);
 assert.ok(groups.flatMap(g=>g.stats).some(m=>m.label==='吏治'&&m.danger&&m.delta<0));
 assert.ok(scheduleEstimate(s).totals.treasury<0);
 const html=renderApp(s);assert.ok(html.includes('殿阁'));assert.ok(!html.includes('class="palaces"'));
 assert.deepEqual(s,before);
});
test('效果包包含嵌套州郡、派系和人物，每个值都呈现',()=>{
 const s=stage9Fixture(),effects={treasury:-30,grain:-20,province:{id:'z0',morale:10,disaster:-20},faction:{f0:5},official:{id:'o0',favor:-3}};
 const all=effectItems(effects,s);
 assert.equal(all.length,6);assert.deepEqual(all.map(f=>f.value),[-30,-20,10,-20,5,-3]);
 assert.ok(all.some(f=>f.label==='直隶 民心'));
});
test('批次1未涉及的核心、LLM、存储源码与阶段9前逐字一致；颜色值仅在 :root 定义',()=>{
 const protectedFiles=JSON.parse(readFileSync('qa/stage9-protected-before.json','utf8'));
 // These four files now carry the explicitly authorized B11–B15 hotfixes.
 const hotfixFiles=new Set(['src/core/court.js','src/core/turn.js','src/llm/prompts.js','src/llm/validate.js']);
 for(const [file,sha]of Object.entries(protectedFiles))if(!hotfixFiles.has(file))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),sha,file);
 const css=readFileSync('src/ui/style.css','utf8'),end=css.indexOf('\n}');
 assert.ok(!/#[\da-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(css.slice(end+2)));
 for(const name of ['desk','desk-deep','desk-shade','panel','panel-active','chip','line','line-strong','line-dashed','text','text-strong','text-soft','text-muted','gold','cinnabar','cinnabar-ink','glyph','paper','paper-line','paper-chip','ink','ink-muted','up','down','danger-border'])assert.ok(css.slice(0,end).includes('--'+name+':'));
});

test('其余行动表单的日程序列化沿用改版前代码',()=>{
 const old=readFileSync('qa/stage9-legacy/actions.js','utf8'),fresh=readFileSync('src/ui/actions.js','utf8');
 const block=code=>{const a=code.indexOf('$("#action-form").onsubmit');return code.slice(code.indexOf('if (kind === "下旨")',a),code.indexOf('      onSchedule(val("action-slot"), a);',a));};
 assert.equal(block(fresh),block(old));
});
