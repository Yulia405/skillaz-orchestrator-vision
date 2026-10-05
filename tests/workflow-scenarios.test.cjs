const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('scope answers accept all-company wording and resolve every named city',()=>{
  const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/scope-model.js'),'utf8'),ctx);
  const parse=ctx.SkillazScope.parse;
  for(const text of ['Вся организационная структура','вся структура по бухгалтерии','все регионы','по всей России'])assert.equal(parse(text).allRegions,true,text);
  const regions=[{id:'t',name:'Республика Татарстан',cities:['Казань']},{id:'k',name:'Краснодарский край',cities:['Сочи']},{id:'n',name:'Новосибирская область',cities:['Новосибирск']}];
  assert.equal(parse('Казань, Сочи, Новосибирск',regions).locationIds.length,3);
  assert.equal(parse('Выбранные регионы и подразделения',regions).confirmed,false);
});

test('worker respects explicit scope on the next turn without asking again',()=>{
  const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/scope-model.js'),'utf8'),ctx);
  const worker=fs.readFileSync(path.join(root,'workflow-ai-worker/src/index.js'),'utf8');
  vm.runInContext(worker.slice(worker.indexOf('function launchResult'),worker.indexOf('function participantsResult')),ctx);
  const input={userMessage:'Вся организационная структура',history:[],catalog:{territories:[]},context:{answers:{audience:'Бухгалтеры',result:'Самостоятельно закрывать месяц'}}};
  const result=ctx.launchResult({question:'Где?',updates:{}},input);
  assert.equal(result.ready,true);assert.equal(result.scope.allRegions,true);assert.equal(result.question,'');
  const next=ctx.launchResult({updates:{}},{...input,userMessage:'общая часть и варианты',context:{answers:result.updates,scope:result.scope}});
  assert.equal(next.ready,true);assert.equal(next.scope.allRegions,true);
});

test('checkpoint model stays a meeting and evaluation placements own independent snapshots',()=>{
  const {ctx}=appHarness();vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/workflow-objects.js'),'utf8'),ctx);
  const api=ctx.window.SkillazObjects;
  const meeting=api.normalizeCheckpoint({id:'kt',title:'Обратная связь',agenda:'Разобрать результаты',pulse:'Насколько понятна роль?; Какая поддержка нужна?'});
  assert.equal(meeting.type,'checkpoint');assert.equal(meeting.questions[0].type,'scale');assert.equal(meeting.questions[1].type,'text');assert.equal(meeting.showBeforeDays,3);
  const sheet=api.evaluationSheets.find(x=>x.domain==='finance');
  const a=api.assessmentInStage('base-day1',sheet),b=api.assessmentInStage('cashier-day1',sheet);
  a.evaluation.blocks[0].criteria[0].title='Изменено';
  assert.notEqual(b.evaluation.blocks[0].criteria[0].title,'Изменено');assert.notEqual(sheet.blocks[0].criteria[0].title,'Изменено');
  assert.equal(a.evaluation.status,'published');assert.ok(a.evaluation.blocks.some(block=>block.criteria.some(c=>c.critical)));
});

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


test('AI keeps its destination when another scenario is selected during review',()=>{
  const {ctx,nodes}=appHarness();
  ctx.state.goalScenarios=[{branches:['base']},{branches:['cashier']}];
  ctx.state.activeTemplateScenario={kind:'goal',key:'goal-manual-1'};
  vm.runInContext("aiOpen('goals')",ctx);
  ctx.state.activeTemplateScenario={kind:'goal',key:'goal-manual-0'};
  nodes.set('.ai-proposal-check',[{checked:true,value:'new-goal'}]);
  nodes.set('[data-ai-proposal="new-goal"]',[{querySelector:selector=>({value:selector==='[data-ai-day]'?'14':'Результат кассира'})}]);
  vm.runInContext("aiState.proposals=[{id:'new-goal',branchId:'cashier',title:'Результат кассира',day:14,candidates:[]}];aiApply()",ctx);
  assert.equal(ctx.state.goalPlacements['goal-manual-1'].length,1);
  assert.equal(ctx.state.goalPlacements['goal-manual-0'],undefined);
});

test('a goal catalog template can be added again as an independent editable instance',()=>{
  const {ctx}=appHarness();ctx.state.goalScenarios=[{branches:['cashier']}];
  ctx.state.generatedGoalTemplates=[{id:'template',title:'Закрыть период',subgoals:[{title:'Сверка'}]}];
  const api=ctx.window.SkillazTemplateAPI;
  api.addTemplate('goal','goal-manual-0',{id:'template',title:'Закрыть период'});
  api.addTemplate('goal','goal-manual-0',{id:'template',title:'Закрыть период'});
  const [a,b]=ctx.state.goalPlacements['goal-manual-0'];
  assert.notEqual(a.id,b.id);a.subgoals[0].title='Первый квартал';assert.equal(b.subgoals[0].title,'Сверка');
});

function routingHarness(){const app=appHarness();vm.runInContext(fs.readFileSync(path.join(root,'workflow-v3-assets/workflow-routing.js'),'utf8'),app.ctx);return app;}

test('failed evaluation schedules training and escalation while success keeps the main path',()=>{
  const {ctx}=routingHarness(),api=ctx.window.SkillazRouting;
  const rules=[{when:'failed',action:'catalog',target:'training-finance'},{when:'failed',action:'escalate',recipient:'Руководитель'}];
  assert.equal(api.validate(rules,'base-day1','evaluation'),'');
  assert.deepEqual(Array.from(api.evaluate(rules,'failed'),r=>r.action),['catalog','escalate']);
  assert.equal(api.evaluate(rules,'passed').length,0);
  assert.equal(api.evaluate(rules,'overdue').length,0);
});

test('element routes use exact placement and reject missing or self-referencing targets',()=>{
  const {ctx}=routingHarness(),api=ctx.window.SkillazRouting;
  ctx.state.items={'base-day1':[{id:'same',title:'Общий курс'}],'cashier-day1':[{id:'same',title:'Курс кассира'}]};
  ctx.state.elementRoutes={'base-day1::same':[{when:'passed',action:'continue'}],'cashier-day1::same':[{when:'failed',action:'repeat',limit:2}]};
  assert.equal(api.rulesFor('base-day1','same')[0].action,'continue');
  assert.equal(api.rulesFor('cashier-day1','same')[0].action,'repeat');
  assert.ok(api.validate([{when:'failed',action:'assign',target:'base-day1::same'}],'base-day1','same'));
  assert.equal(api.validate([{when:'failed',action:'assign',target:'cashier-day1::same'}],'base-day1','same'),'');
  assert.ok(api.validate([{when:'failed',action:'catalog',target:'deleted'}],'base-day1','same'));
});

test('publication uses the current process audience and launch settings',()=>{
  const {ctx}=routingHarness();ctx.state.newWorkflow=true;ctx.state.processTitle='Адаптация бухгалтера';ctx.state.assistantAnswers={audience:'Бухгалтеры · Все регионы присутствия',event:'Сотрудник вышел',timing:'В момент события'};ctx.state.launchScope={label:'Все регионы присутствия'};
  ctx.branches=[{id:'base',name:'Общий контур'},{id:'accountant',name:'Бухгалтер',conditions:['Должность: бухгалтер']}];
  const html=ctx.finalPage();assert.match(html,/Бухгалтеры/);assert.match(html,/Сотрудник вышел/);assert.doesNotMatch(html,/доставка|За 5 дней/);
});
