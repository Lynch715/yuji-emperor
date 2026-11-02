import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,migrate,VERSION} from '../src/core/state.js';
import {nationQuarter,nationMonth} from '../src/core/nation.js';
import {annualBudget,wasteQuote,quarterIndex} from '../src/core/finance.js';
import {initialTurn,forecastTurn,commitTurn} from '../src/core/turn.js';
import {eventsMonth,resolveMemorial} from '../src/core/events.js';
const initial = () => initialTurn(createState({seed:'经济闭环'}));
test('州税严格按 30/15 民心分档，民变州本季无税，解围也不追补', () => {
  const base=initial(); base.turn=9; base.nation.governance=100;
  base.nation.provinces=base.nation.provinces.slice(0,1);
  const p=base.nation.provinces[0]; p.tax=10; p.disaster=0;
  for(const [morale,expected] of [[30,28.5],[29.99,14.25],[15,14.25],[14.99,5.7]]){
    p.morale=morale;
    const next=nationQuarter(base);
    assert.ok(Math.abs(next.nation.treasury-base.nation.treasury-expected)<1e-8);
  }
  p.rebellion=true; p.morale=62;
  assert.equal(nationQuarter(base).nation.treasury,base.nation.treasury);
  p.rebellion=false; p.rebellionQuarter=quarterIndex(9);
  assert.equal(nationQuarter(base).nation.treasury,base.nation.treasury);
  base.turn=18;
  assert.ok(nationQuarter(base).nation.treasury>base.nation.treasury);
});
test('冗费仅超年度预算两倍部分征收，3%起随吏治降低而提高，有独立账目', () => {
  const s=initial(); s.nation.governance=100;
  const threshold=annualBudget(s)*2;
  s.nation.treasury=threshold;
  assert.equal(wasteQuote(s).amount,0);
  s.nation.treasury=threshold+100;
  assert.equal(wasteQuote(s).rate,0.03);
  assert.ok(Math.abs(wasteQuote(s).amount-3)<1e-10);
  s.nation.governance=0;
  assert.ok(wasteQuote(s).amount>3);
  s.nation.treasury=1000;
  const old=structuredClone(s),next=nationMonth(s),e=next.ledger.find(e=>e.source==='冗费与侵吞');
  assert.deepEqual(s,old);
  assert.ok(e && e.path==='nation.treasury' && e.delta<0);
});
test('民变事件指定州，处置平乱但不撤销本季停税凭据', () => {
  const base=initial();base.turn=3;
  for(const p of base.nation.provinces)p.morale=0;
  let found;
  for(let rng=1;rng<500&&!found;rng++){
    const s={...base,rng};const n=eventsMonth(s);
    if(n.threads.some(t=>t.type==='民变'))found=n;
  }
  assert.ok(found);
  const t=found.threads.find(t=>t.type==='民变'),p=found.nation.provinces.find(p=>p.id===t.provinceId);
  assert.ok(p.rebellion);
  const n=resolveMemorial(found,'m-'+t.id,'opt0').state,q=n.nation.provinces.find(q=>q.id===p.id);
  assert.equal(q.rebellion,false);
  assert.equal(q.rebellionQuarter,quarterIndex(3));
});
test('v3迁移补民变停税字段，不改原档和已保存骰子', () => {
  const s=initial();s.v=3;
  for(const p of s.nation.provinces){delete p.rebellion;delete p.rebellionQuarter;}
  const old=structuredClone(s),n=migrate(s);
  assert.equal(n.v,VERSION);assert.deepEqual(s,old);assert.equal(n.rng,s.rng);
  assert.ok(n.nation.provinces.every(p=>p.rebellion===false&&p.rebellionQuarter===-1));
});
test('低民心连续三年，国库不得净增长（不同吏治与起始余额）', () => {
  for(const governance of [0,58,100])for(const treasury of [0,480,3000])for(const provincialMorale of [19,62,100]){
    let s=initial();s.settings.freedom='free';s.nation.morale=19;s.nation.governance=governance;s.nation.treasury=treasury;
    for(const p of s.nation.provinces)p.morale=provincialMorale;
    for(let i=0;i<108;i++){
      s.history=[];s.volumes=[];s.ledger=[];
      s=commitTurn(s,forecastTurn(s),{});
      assert.ok(s.nation.morale<20);
    }
    assert.ok(s.nation.treasury<=treasury+1e-6,`${governance}/${treasury}/${provincialMorale} → ${s.nation.treasury}`);
  }
});
test('欠饷不会因国库见底消失，下一次税收先偿付，现金与债务各自落账', async () => {
  const {monthlyBudget}=await import('../src/core/finance.js');
  let s=initial();s.nation.treasury=0;s.nation.governance=0;s.nation.morale=60;
  for(const p of s.nation.provinces)p.morale=0;
  const due=monthlyBudget(s).salaries+monthlyBudget(s).armyPay;
  for(let month=0;month<3;month++)s=nationMonth(s);
  assert.ok(Math.abs(s.nation.arrears-due*3)<1e-8);
  const old=structuredClone(s);s.turn=9;
  const n=nationQuarter(s),income=n.ledger.filter(e=>e.source.startsWith('季结：赋税')).reduce((a,e)=>a+(e.path==='nation.treasury'?e.after-e.before:0),0);
  assert.equal(n.nation.treasury,0);
  assert.ok(Math.abs(n.nation.arrears+income-old.nation.arrears)<1e-8);
  assert.ok(n.ledger.some(e=>e.source==='补付欠饷与积欠'&&e.path==='nation.arrears'));
});
test('模拟年度现金表逐年守恒，重开国家的起始资金单列', async () => {
  const {simulate}=await import('../scripts/simulate.mjs');
  const r=simulate(2,'经济收支表');
  assert.equal(r.annual.length,2);
  for(const a of r.annual){
    assert.ok(Math.abs(a.closingTreasury-(a.openingTreasury+a.income-a.expense+a.resetAdjustment))<0.03);
    assert.ok(a.taxIncome>0 && a.expense>0);
  }
});
