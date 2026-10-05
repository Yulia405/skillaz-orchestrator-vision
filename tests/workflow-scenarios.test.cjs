const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function appHarness() {
  const nodes = new Map(), listeners = [];
  const document = {
    body: { dataset: {} },
    querySelector: selector => (nodes.get(selector)||[])[0] || null,
    querySelectorAll: selector => nodes.get(selector)||[],
    addEventListener: (type, fn) => listeners.push({type, fn})
  };
  const noop = () => '';
  const ctx = vm.createContext({document, window:{}, state:{items:{},skips:[]}, branches:[{id:'base',name:'Общий контур'},{id:'cashier',name:'Кассиры'}], stages:[{id:'day1',days:'30'}], workflowCatalog:{}, console, setTimeout:noop, requestAnimationFrame:noop, toast:noop, render:noop,
    loadWorkflow:noop,startNewWorkflow:noop,canvasPage:noop,palette:noop,bind:noop,editor:noop,itemCard:noop,scenarioRail:noop,checkpointRail:noop,scenarioModalV4:noop,currentWorkflow:noop,applyZoom:noop,
    $:selector=>document.querySelector(selector),$$:(selector)=>document.querySelectorAll(selector)});
  vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/production-catalog.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/ai-generation.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/iteration-4.js'),'utf8'),ctx);
  return {ctx,nodes,listeners};
}
const event = data => ({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},dataTransfer:{getData:()=>JSON.stringify(data)}});

test('catalog drag places a KT into the dropped scenario and preserves its agenda and pulse',()=>{
  const {ctx,nodes}=appHarness();
  ctx.state.ktScenarios=[{branches:['base']},{branches:['cashier']}];
  ctx.state.generatedKtTemplates=[{id:'kt-a',title:'Проверка кассы',agenda:'Сверить кассу',pulse:'Есть ли расхождения?',day:14}];
  const zone={dataset:{templateDropKind:'kt',templateDropKey:'kt-manual-1'},classList:{add(){},remove(){}}};
  nodes.set('[data-template-drop-key]',[zone]);
  ctx.bind();
  zone.ondrop(event({id:'kt-a',type:'checkpoint',title:'Проверка кассы'}));
  assert.equal(ctx.state.ktPlacements['kt-manual-1'][0].agenda,'Сверить кассу');
  assert.equal(ctx.state.ktPlacements['kt-manual-1'][0].pulse,'Есть ли расхождения?');
  assert.equal(ctx.state.ktPlacements['kt-manual-0'],undefined);
  zone.ondrop(event({id:'goal-a',type:'goal',title:'Чужой тип'}));
  assert.equal(ctx.state.ktPlacements['kt-manual-1'].length,1);
});

test('AI adds goals and KTs to the active second scenario, including repeated generations',()=>{
  const {ctx,nodes}=appHarness();
  for(const [mode,kind,collection] of [['goals','goal','goalPlacements'],['checkpoints','kt','ktPlacements']]){
    ctx.state[kind==='goal'?'goalScenarios':'ktScenarios']=[{branches:['base']},{branches:['cashier']}];
    ctx.state.activeTemplateScenario={kind,key:`${kind}-manual-1`};
    for(let run=0;run<2;run++){
      const id=`${kind}-${run}`;
      nodes.set('.ai-proposal-check',[{checked:true,value:id}]);
      nodes.set(`[data-ai-proposal="${id}"]`,[{querySelector:selector=>({value:selector==='[data-ai-day]'?'14':'Результат кассира'})}]);
      vm.runInContext(`aiState.mode=${JSON.stringify(mode)};aiState.scope=['cashier'];aiState.proposals=[{id:${JSON.stringify(id)},branchId:'cashier',title:'Результат кассира',day:14,candidates:[],agenda:'Сверить кассу',pulse:'Какие сложности?'}];aiApply()`,ctx);
    }
    assert.equal(ctx.state[collection][`${kind}-manual-1`].length,2);
    assert.equal(ctx.state[collection][`${kind}-manual-0`],undefined);
  }
});

test('goal linking distinguishes cards with equal IDs in different cells',()=>{
  const {ctx,listeners}=appHarness();
  ctx.state.items={'base-day1':[{id:'same',title:'Общая задача'}],'cashier-day1':[{id:'same',title:'Кассовая задача'}]};
  ctx.state.goalPlacements={'goal-manual-0':[{id:'goal',links:[]}]};
  ctx.state.goalLinkMode={templateId:'goal',key:'goal-manual-0'};
  const target={dataset:{item:'same',sourceCell:'cashier-day1'}};
  const click={...event(),target:{closest:selector=>selector==='[data-item]'?target:null}};
  listeners.filter(row=>row.type==='click').forEach(row=>row.fn(click));
  const link=ctx.state.goalPlacements['goal-manual-0'][0].links[0];
  assert.equal(link.cell,'cashier-day1');
  assert.equal(link.title,'Кассовая задача');
});

test('occupation catalog recognizes different office and frontline functions',()=>{
  const {ctx}=appHarness(),catalog=ctx.window.SkillazProductionCatalog;
  for(const [title,key] of [['Бухгалтер','finance'],['Юрист','legal'],['Разработчик','it'],['Кассир','retail'],['Кладовщик','logistics'],['Оператор производственной линии','production'],['Маркетолог','marketing'],['Рекрутер','hr']]){
    assert.equal(catalog.resolveJobContext(title).key,key,title);
    assert.equal(catalog.relevantElements(title,1)[0].domain,key,title);
  }
});

test('dragging a goal connector links the exact drop card',()=>{
  const {ctx,nodes}=appHarness(),handlers={};
  ctx.state.items={'base-day1':[{id:'same',title:'Общая задача'}],'cashier-day1':[{id:'same',title:'Кассовая задача'}]};
  ctx.state.goalPlacements={'goal-manual-1':[{id:'goal-b',links:[]}]};
  const target={dataset:{sourceCell:'cashier-day1',item:'same'},addEventListener:(name,fn)=>handlers[name]=fn};
  nodes.set('[data-source-cell][data-item]',[target]);
  ctx.bind();
  handlers.drop(event({type:'goal-link',key:'goal-manual-1',templateId:'goal-b'}));
  assert.equal(ctx.state.goalPlacements['goal-manual-1'][0].links[0].cell,'cashier-day1');
  assert.equal(ctx.state.goalPlacements['goal-manual-1'][0].links[0].title,'Кассовая задача');
});

test('opening a draft preserves existing common cards and their stable IDs',()=>{
  const {ctx}=appHarness();
  ctx.state.assistantAnswers={pathType:'Общая часть + варианты по условиям'};
  ctx.branches=[{id:'base',name:'Общий контур'},{id:'cashier',name:'Кассир'},{id:'seller',name:'Продавец'}];
  ctx.state.items={'base-day1':[{id:'original',title:'Получить доступы'}],'cashier-day1':[{id:'shared',title:'Охрана труда'}],'seller-day1':[{id:'shared-2',title:'Охрана труда'}]};
  const source=fs.readFileSync(path.join(root,'workflow-v3-assets/iteration-3.js'),'utf8');
  const helper=source.slice(source.indexOf('  const needsCommonBranch'),source.indexOf('  const enrichGeneratedItems'));
  vm.runInContext(`${helper};ensureCommonBranch();ensureCommonBranch();`,ctx);
  assert.equal(ctx.state.items['base-day1'][0].id,'original');
  assert.equal(ctx.state.items['cashier-day1'].length,1);
  vm.runInContext('ensureCommonBranch(true);ensureCommonBranch(true)',ctx);
  assert.deepEqual(Array.from(ctx.state.items['base-day1'],item=>item.id),['original','shared']);
});
