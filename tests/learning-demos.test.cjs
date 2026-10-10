const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../workflow-v3-assets/learning-data.js');

function walk(d,branch,choose=()=> 'passed'){
  const session=D.start(d,branch),visited=[];
  for(let tick=0;tick<200&&!session.complete&&!session.paused;tick++){
    const ready=D.nodes(d).filter(n=>session.status[n.key]==='ready');
    assert.ok(ready.length,`Dead end: ${d.id}/${branch}: ${JSON.stringify(session)}`);
    const n=ready[0];visited.push(n);D.advance(d,session,n.key,choose(n,session));
  }
  return {session,visited};
}

test('three protected retail programmes: rich content, exact routes, no adaptation objects',()=>{
  assert.equal(D.seeds.length,3);
  for(const d of D.seeds){
    assert.equal(d.protected,true);assert.equal(d.branches.length,4);
    const all=D.nodes(d),keys=new Set(all.map(n=>n.key));
    assert.ok(all.length>=40);assert.equal(keys.size,all.length);
    for(const type of ['course','article','test','task','survey','assessment','file'])assert.ok(all.some(n=>n.type===type),type);
    assert.ok(all.every(n=>!['goal','checkpoint'].includes(n.type)));
    all.forEach(n=>{
      n.learning.after.forEach(k=>assert.ok(keys.has(k),k));
      (d.routes[n.key]||[]).filter(r=>r.action==='assign').forEach(r=>assert.ok(keys.has(r.target),r.target));
    });
    for(const role of D.roles)assert.ok(all.filter(n=>n.cell.startsWith(role.id+'-')).length>=10);
  }
});

test('all nine role routes finish, without assigning another job or unnecessary remediation',()=>{
  for(const d of D.seeds)for(const role of D.roles){
    const {session,visited}=walk(d,role.id);
    assert.equal(session.complete,true,`${d.id}/${role.id}`);
    assert.ok(visited.every(n=>n.cell.startsWith('base-')||n.cell.startsWith(role.id+'-')));
    assert.ok(visited.every(n=>!n.learning.conditional));
  }
});

test('failed knowledge and failed field practice recover for every programme and position',()=>{
  for(const d of D.seeds)for(const role of D.roles){
    const failed=new Set();
    const {session,visited}=walk(d,role.id,n=>{
      if(['test','assessment','task'].includes(n.type)&&!n.learning.terminal&&!n.learning.conditional&&!failed.has(n.type)){failed.add(n.type);return 'failed';}
      return 'passed';
    });
    assert.equal(session.complete,true,`${d.id}/${role.id}`);
    assert.ok(visited.some(n=>n.learning.conditional));
  }
});

test('cyclical diagnostic failure assigns both courses; practice waits for knowledge and common part',()=>{
  const d=D.seeds.find(d=>d.mode==='cycle'),s=D.start(d,'cashier'),all=D.nodes(d);
  const find=slug=>all.find(n=>n.id.endsWith(slug));
  for(const slug of ['base-intro','cashier-role-guide','cashier-initial-case'])D.advance(d,s,find(slug).key,'passed');
  const diag=find('cashier-diagnostic');D.advance(d,s,diag.key,'failed');
  assert.equal(s.status[find('cashier-refresh-0').key],'ready');assert.equal(s.status[find('cashier-refresh-1').key],'ready');
  D.advance(d,s,find('cashier-refresh-0').key,'passed');
  assert.notEqual(s.status[find('cashier-diagnostic-case').key],'ready');
  D.advance(d,s,find('cashier-refresh-1').key,'passed');D.advance(d,s,find('cashier-diagnostic-case').key,'passed');D.advance(d,s,diag.key,'passed');
  assert.equal(s.status[find('cashier-practice').key],'waiting');
  assert.throws(()=>D.advance(d,s,find('cashier-practice').key,'passed'),/недоступен/);
  D.advance(d,s,find('base-common-test').key,'passed');D.advance(d,s,find('base-practice-guide').key,'passed');
  assert.equal(s.status[find('cashier-practice').key],'ready');
});

test('critical mistake fails a 100% field assessment and third failure requires manager',()=>{
  const d=D.seeds[0];
  let failedKey;
  const {session,visited}=walk(d,'sales',n=>{
    if(n.type==='assessment'){failedKey=n.key;return {score:100,critical:true};}return 'passed';
  });
  assert.equal(session.paused,true);assert.equal(session.complete,false);assert.equal(session.attempts[failedKey],3);
  assert.equal(visited.filter(n=>n.key===failedKey).length,3);
  assert.ok(session.log.some(log=>log.outcome==='escalate'));
});

test('late task sends curator notification without advancing the programme',()=>{
  const d=D.seeds[2],s=D.start(d,'stock'),n=D.nodes(d).find(n=>n.learning.entry);
  D.advance(d,s,n.key,'overdue');assert.equal(s.status[n.key],'ready');assert.equal(s.attempts[n.key],undefined);
  assert.ok(s.log.some(log=>log.outcome==='notify'&&log.title.includes('Куратор')));
});

test('moving a card keeps its incoming routes and practice prerequisites attached to the exact card',()=>{
  const d=D.clone(D.seeds[0]);
  const card=D.nodes(d).find(n=>n.id.endsWith('cashier-test-1'));
  const [moved]=d.items[card.cell].splice(d.items[card.cell].findIndex(n=>n.id===card.id),1);
  d.items['cashier-s2'].push(moved);D.reconcile(d);
  const nextKey='cashier-s2::'+card.id;
  assert.ok(d.routes[nextKey]);assert.equal(d.routes[card.key],undefined);
  assert.ok(Object.values(d.routes).flat().some(r=>r.target===nextKey));
  assert.ok(D.nodes(d).find(n=>n.id.endsWith('cashier-practice')).learning.after.includes(nextKey));
  assert.equal(walk(d,'cashier').session.complete,true);
});
