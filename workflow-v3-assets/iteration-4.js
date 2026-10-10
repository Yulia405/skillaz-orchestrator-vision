// Local iteration 4: clean full-screen process and contextual add flows.
(() => {
  state.cleanAddOpen ??= false;
  state.cleanPaletteOpened ??= false;
  state.cleanCatalogType ??= '';
  state.outcomeModal ??= null;
  state.goalScenarios ??= [];
  state.ktScenarios ??= [];
  state.generatedGoalTemplates ??= [];
  state.generatedKtTemplates ??= [];
  state.goalPlacements ??= {};
  state.ktPlacements ??= {};
  state.goalLinkMode ??= null;
  state.activeTemplateScenario ??= null;
  state.templateScenarioPicker ??= null;
  state.catalogTargetScenario ??= null;
  state.pendingTemplateKind ??= null;
  state.outcomeRules ??= {
    'base-day1-1': { condition:'Не пройден в срок', action:'Уведомить руководителя и сотрудника' },
    'base-immerse-0': { condition:'Результат ниже 80%', action:'Назначить дополнительный тест' }
  };

  // Keep the bundled demo processes on the same editable scenario model as
  // newly generated drafts. Older demos used static goal/KT mockups and left
  // the new collections empty, which made the canvas fall back to legacy
  // placeholders.
  const demoScenarioContext = () => [
    currentWorkflow()?.name,
    currentWorkflow()?.short,
    ...branches.map(branch => `${branch.name} ${branch.desc || ''} ${(branch.conditions || []).join(' ')}`)
  ].filter(Boolean).join(' ');
  const templatesForDemo = (type, query, count = 2) => {
    const rows = window.SkillazProductionCatalog?.relevantElements?.(query, 80) || [];
    return rows.filter(row => row.type === type).slice(0, count).map((row,index) => ({
      id:`demo-${state.workflow}-${type}-${index}`,
      title:row.title,
      result:type === 'goal' ? row.description : undefined,
      agenda:type === 'checkpoint' ? row.agenda||row.description : undefined,
      pulse:row.pulse,participants:row.participants,showBeforeDays:row.showBeforeDays,subgoals:row.subgoals,
      day:type === 'goal' ? (index ? 45 : 30) : (index ? 45 : 14),
      meta:row.description,
      source:row.source,
      links:[]
    }));
  };
  const hydrateDemoScenarios = () => {
    if (state.newWorkflow || !branches.length) return;
    const branchIds = branches.map(branch => branch.id);
    const roleBranches = branches.filter(branch => branch.id !== 'base');
    const firstScope = roleBranches.length ? roleBranches.map(branch => branch.id) : branchIds;
    state.goalScenarios = [{branches:firstScope,creator:'Руководитель',timing:'При назначении плана'}];
    state.ktScenarios = [{branches:branchIds,creator:'Руководитель',timing:'По срокам шаблонов КТ'}];
    state.goalPlacements = {'goal-manual-0':templatesForDemo('goal',demoScenarioContext(),3)};
    state.ktPlacements = {'kt-manual-0':templatesForDemo('checkpoint',demoScenarioContext(),3)};
    state.activeTemplateScenario = null;
  };
  const previousLoadWorkflowV4 = loadWorkflow;
  loadWorkflow = id => {
    previousLoadWorkflowV4(id);
    state.generatedGoalTemplates=[]; state.generatedKtTemplates=[];
    state.goalLinkMode=null; state.catalogTargetScenario=null;
    hydrateDemoScenarios();
  };
  const previousStartWorkflowV4=startNewWorkflow;
  startNewWorkflow=()=>{
    state.newWorkflow=false;
    state.goalScenarios=[]; state.ktScenarios=[];
    state.goalPlacements={}; state.ktPlacements={};
    state.generatedGoalTemplates=[]; state.generatedKtTemplates=[];
    state.activeTemplateScenario=null; state.catalogTargetScenario=null;
    state.templateScenarioPicker=null; state.pendingTemplateKind=null;
    state.pendingCatalogTemplate=null;
    state.goalLinkMode=null; state.outcomeRules={};
    state.scopeSelections={org:[],role:[],group:[],location:[]};
    state.scopeSelectionConfigured={};
    state.launchScope=null;state.selectedGoal=null;state.objectEditor=null;
    state.newRoles=[]; state.coordinatorRule=''; state.generatedAiProcess=null;
    previousStartWorkflowV4();
  };

  const previousCanvasPage = canvasPage;
  const previousPalette = palette;
  const previousBind = bind;
  const previousEditor = editor;
  const previousItemCard = itemCard;
  const previousScenarioRail = scenarioRail;
  const previousCheckpointRail = checkpointRail;
  const previousScenarioModalV4 = scenarioModalV4;
  const safe4 = value => String(value ?? '').replace(/[&<>"']/g, symbol => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[symbol]));
  const scenarioKey = (kind,index) => `${kind}-manual-${index}`;
  const scenarioRecords = kind => (kind === 'goal' ? state.goalScenarios : state.ktScenarios).map((scenario,index)=>({kind,key:scenarioKey(kind,index),scenario,index,label:scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean).join(', ') || 'Все ветки'}));
  const placedTemplates = (kind,key) => (kind === 'goal' ? state.goalPlacements : state.ktPlacements)[key] || [];
  const addTemplate = (kind,key,data) => {
    const source=kind==='goal'?state.generatedGoalTemplates:state.generatedKtTemplates;
    const generated=source.find(item=>item.id===data.id)||(window.SkillazProductionCatalog?.elements||[]).find(item=>item.id===data.id)||{};
    const placements=kind==='goal'?state.goalPlacements:state.ktPlacements;
    const list=placements[key]||=[];
    const id=list.some(item=>item.id===data.id)?`${data.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2,6)}`:data.id||`${kind}-${Date.now()}`;
    list.push({...JSON.parse(JSON.stringify(generated)),id,sourceId:generated.sourceId||data.id,type:kind==='goal'?'goal':'checkpoint',title:data.title,meta:data.meta,result:generated.result||generated.description||data.meta,agenda:generated.agenda||generated.description||data.meta,pulse:generated.pulse||'Насколько уверенно вы выполняете задачи роли?; Что мешает двигаться дальше?; Какая поддержка нужна?',day:generated.day||30,links:kind==='goal'?[...(generated.links||generated.linked||[])]:[]});
  };
  const linkGoalToItem = (key,templateId,cell,itemId) => {
    const template=(state.goalPlacements[key]||[]).find(row=>row.id===templateId);
    const item=(state.items[cell]||[]).find(row=>row.id===itemId);
    if(!template||!item)return false;
    state.selectedGoal={id:templateId,key};
    template.links||=[];
    if(!template.links.some(link=>link.id===item.id&&link.cell===cell))template.links.push({id:item.id,title:item.title,cell});
    return true;
  };
  window.SkillazTemplateAPI={addTemplate,scenarioRecords};
  const goalTemplateCard = (template,key) => `<article class="placed-template-card goal-template-card" data-goal-template-id="${safe4(template.id)}" data-placement-key="${safe4(key)}"><span class="tag purple">Цель · ${safe4(template.day ? `до ${template.day} дня` : 'по сценарию')}</span><b>${safe4(template.title)}</b><small>${safe4(template.result || template.meta || 'Измеримый результат сотрудника')}</small><div class="template-links">${(template.links||[]).map(link=>`<button data-unlink-goal="${safe4(template.id)}" data-unlink-key="${safe4(key)}" data-unlink-item="${safe4(link.id)}" data-unlink-cell="${safe4(link.cell||'')}" title="Удалить связь">↗ ${safe4(link.title)} ×</button>`).join('') || '<span>Связей с действиями пока нет</span>'}</div>${window.SkillazObjects?.goalExtra(template,key)||''}<div class="template-actions"><button class="btn small ${state.goalLinkMode?.templateId===template.id?'active':''}" data-link-goal="${safe4(template.id)}" data-link-key="${safe4(key)}">${state.goalLinkMode?.templateId===template.id?'Выберите карточку этапа…':'Связать с действием'}</button><button class="btn icon-only small" data-remove-template="${safe4(template.id)}" data-remove-key="${safe4(key)}" data-remove-kind="goal" title="Убрать цель">×</button></div><i class="goal-port"></i></article>`;
  const ktTemplateCard = (template,key) => window.SkillazObjects ? window.SkillazObjects.ktCard(template,key) : `<article class="placed-template-card kt-template-card"><span class="tag amber">Контрольная точка · ${safe4(template.day ? `${template.day} день` : 'по сценарию')}</span><b>${safe4(template.title)}</b><small><strong>Повестка:</strong> ${safe4(template.agenda || template.meta || 'Проверка результата этапа')}</small>${template.pulse?`<small><strong>Пульс:</strong> ${safe4(template.pulse)}</small>`:''}<button class="btn icon-only small" data-remove-template="${safe4(template.id)}" data-remove-key="${safe4(key)}" data-remove-kind="kt" title="Убрать КТ">×</button></article>`;
  const scenarioDropZone = (kind,key) => {
    const templates = placedTemplates(kind,key);
    return `<div class="scenario-template-zone" data-template-drop-kind="${kind}" data-template-drop-key="${safe4(key)}">${templates.map(template=>kind==='goal'?goalTemplateCard(template,key):ktTemplateCard(template,key)).join('')}<div class="scenario-drop-placeholder">Перетащите сюда ${kind==='goal'?'цель':'контрольную точку'} из каталога</div></div>`;
  };

  // A branch is a variant of the employee path. Participant work stays inside
  // the stages as ordinary tasks, so the manager demo must not expose a
  // separate "participant tasks" branch.
  if (workflowCatalog?.manager?.branches?.[2]) {
    workflowCatalog.manager.branches[2] = [
      'director',
      'Менеджер ПВЗ после перевода',
      ['ПВЗ · ускоренный путь', '26 элементов'],
      'Практика новой роли с поддержкой руководителя и наставника',
      ['Событие: перевод на новую роль', 'Опыт работы в клиентском офисе']
    ];
  }

  const iconByType = { course:'▣', task:'✓', article:'≡', file:'⇩', test:'□', survey:'◉', action:'⚙', assessment:'▤', checkpoint:'◆', goal:'◎', meeting:'◈' };
  const labelByType = { course:'Курс / программа', task:'Задача', article:'Статья', file:'Файл', test:'Тест', survey:'Опрос', action:'Системное действие', assessment:'Оценочный лист', checkpoint:'Шаблон контрольной точки', goal:'Шаблон цели', meeting:'Встреча' };
  const elementRows = () => {
    const db = window.SkillazDemoDB?.catalogs || {};
    const learning = window.SkillazLearningDemos?.active();
    const production = learning ? window.SkillazLearningDemos.catalog() : (window.SkillazProductionCatalog?.elements || []);
    const scenarioBranchIds = state.activeTemplateScenario ? (scenarioRecords(state.activeTemplateScenario.kind).find(item=>item.key===state.activeTemplateScenario.key)?.scenario?.branches||[]) : [];
    const catalogQuery = (scenarioBranchIds.length ? scenarioBranchIds.map(id=>branches.find(branch=>branch.id===id)?.name) : [state.processTitle,state.assistantAnswers?.audience,state.assistantAnswers?.result]).filter(Boolean).join(' ');
    const contextualProduction = ['goal','checkpoint'].includes(state.cleanCatalogType) && window.SkillazProductionCatalog?.relevantElements ? window.SkillazProductionCatalog.relevantElements(catalogQuery,production.length) : production;
    const order = state.cleanCatalogType ? [state.cleanCatalogType] : learning ? ['course','article','file','task','test','survey','assessment'] : ['course','article','file','task','test','survey','assessment','action','goal','checkpoint'];
    const source = {course:'LMS',article:'База знаний',file:'Файлы клиента',task:'Шаблоны задач',test:'Оценка знаний',survey:'Опросы',assessment:'Каталог оценочных листов',action:'Skillaz',goal:'Каталог целей',checkpoint:'Каталог КТ'};
    const usage = {course:'Назначается сотруднику',article:'Открывается в плане',file:'Доступен для скачивания',task:'Создаёт задачу исполнителю',test:'Сохраняет результат',survey:'Собирает обратную связь',assessment:'Проверка навыка на рабочем месте',action:'Выполняется автоматически',goal:'Создаётся по сценарию целей',checkpoint:'Запускается по сценарию КТ'};
    return order.flatMap(type => {
      const generated = type === 'goal' ? state.generatedGoalTemplates : type === 'checkpoint' ? state.generatedKtTemplates : [];
      const generatedRows = generated.map(row=>({id:row.id,type,title:row.title,meta:row.result||row.agenda||'Создано AI по контексту должности',source:'AI · черновик',usage:usage[type],payload:row}));
      const liveRows = contextualProduction.filter(row => row.type === type).slice(0,['goal','checkpoint'].includes(type)?500:24).map(row => ({id:row.id,type,title:row.title,meta:row.description,source:row.source,usage:usage[type],payload:row}));
      const directoryRows = liveRows.length ? liveRows : (db[type] || []).slice(0,12).map(row => ({id:row[0],type,title:row[1],meta:row[2],source:source[type],usage:usage[type]}));
      return [...generatedRows,...directoryRows.filter(row=>!generatedRows.some(item=>item.id===row.id))];
    });
  };

  const outcomeEligible = type => ['course','assessment','survey','test'].includes(type);
  itemCard = (item, cell) => {
    const original = previousItemCard(item, cell);
    if (!outcomeEligible(item.type)) return original;
    const rule = state.outcomeRules[item.id];
    const outcome = rule
      ? `<button class="outcome-summary configured" data-outcome-item="${item.id}" data-outcome-cell="${cell}" title="Изменить выход элемента"><span>ЕСЛИ ${rule.condition}</span><i>→</i><b>${rule.action}</b>${rule.extraCondition?'<em>+1 исход</em>':''}</button>`
      : `<button class="outcome-summary" data-outcome-item="${item.id}" data-outcome-cell="${cell}" title="Добавить выход элемента"><i>⑂</i><span>Добавить выход</span></button>`;
    return original.replace('<i class="port"></i></article>', `${outcome}<i class="port outcome-port"></i></article>`);
  };

  const outcomeModal = () => {
    if (!state.outcomeModal) return '';
    const { item, cell } = state.outcomeModal;
    const current = state.outcomeRules[item.id] || {};
    const conditions = item.type === 'course'
      ? ['Не пройден в срок','Пройден','Не пройден после повторного назначения']
      : ['Результат ниже 80%','Проверка не пройдена','Проверка пройдена'];
    const actions = ['Уведомить руководителя и сотрудника','Назначить дополнительный тест','Повторно назначить элемент','Создать задачу наставнику','Перевести на следующий этап','Запустить контрольную точку'];
    const branch = branches.find(candidate => cell.startsWith(candidate.id + '-'))?.name || 'Текущая ветка';
    const stage = stages.find(candidate => cell.endsWith('-' + candidate.id))?.name || 'Текущий этап';
    const extra = state.outcomeModal.extra || current.extraCondition
      ? `<div class="outcome-flow-builder secondary"><section><small>ИНАЧЕ ЕСЛИ</small><label>Результат элемента<select id="outcomeCondition2">${conditions.map((value,index)=>`<option ${current.extraCondition===value || (!current.extraCondition&&index===1)?'selected':''}>${value}</option>`).join('')}</select></label></section><i class="outcome-arrow">→</i><section><small>ТОГДА</small><label>Действие<select id="outcomeAction2">${actions.map((value,index)=>`<option ${current.extraAction===value || (!current.extraAction&&index===4)?'selected':''}>${value}</option>`).join('')}</select></label></section></div>` : '';
    return `<div class="modal outcome-modal"><section class="dialog outcome-dialog"><header class="dialog-head"><div><span class="tag blue">Выход из элемента</span><h2>${item.title}</h2><p>Настройте, что произойдёт после результата элемента.</p></div><button class="btn icon-only" data-outcome-close>×</button></header><div class="dialog-body"><div class="outcome-flow-builder"><section><small>ЕСЛИ</small><label>Результат элемента<select id="outcomeCondition">${conditions.map(value=>`<option ${current.condition===value?'selected':''}>${value}</option>`).join('')}</select></label></section><i class="outcome-arrow">→</i><section><small>ТОГДА</small><label>Действие<select id="outcomeAction">${actions.map(value=>`<option ${current.action===value?'selected':''}>${value}</option>`).join('')}</select></label></section></div>${extra}<div class="outcome-target"><b>Где работает правило</b><span>${branch} · ${stage}</span></div><div class="outcome-examples"><b>Можно добавить несколько исходов</b><span>Например: не прошёл курс → уведомить; тест ниже порога → назначить дополнительный тест; тест пройден → открыть следующий этап.</span><button class="btn small" type="button" data-outcome-add>＋ Ещё исход</button></div></div><footer class="dialog-foot"><button class="btn" data-outcome-close>Отмена</button><button class="btn primary" data-outcome-save="${item.id}" data-outcome-cell="${cell}">Сохранить выход</button></footer></section></div>`;
  };

  palette = () => {
    const rows = elementRows();
    return `<aside class="palette clean-palette ${state.paletteOpen && state.cleanPaletteOpened ? 'open' : ''}">
      <div class="palette-head"><div class="palette-title"><div><span class="tag blue">Добавление</span><h3>${state.cleanCatalogType ? labelByType[state.cleanCatalogType] : 'Элементы процесса'}</h3><small class="muted">Выберите из каталогов или попросите AI подобрать набор</small></div><button class="btn icon-only" data-action="togglePalette">×</button></div></div>
      <div class="creation-method-tabs"><button class="active">Выбрать вручную</button><button data-clean-ai-elements>✦ ${state.cleanCatalogType==='goal'?'Создать цели с AI':state.cleanCatalogType==='checkpoint'?'Создать КТ с AI':'Подобрать с AI'}</button></div>
      <div class="palette-search"><input class="search" placeholder="Поиск по названию и источнику"></div>
      <div class="catalog-summary"><b>${rows.length} элементов</b><span>Из разрешённых справочников клиента</span></div>
      <div class="palette-list clean-catalog-list">${rows.map(row => `<div class="palette-card rich-palette-card" draggable="true" data-drag-id="${safe4(row.id)}" data-drag-type="${safe4(row.type)}" data-drag-title="${safe4(row.title)}" data-drag-meta="${safe4(row.meta)}"><span class="type-icon">${iconByType[row.type] || '□'}</span><div><b>${safe4(row.title)}</b><small>${safe4(labelByType[row.type])} · ${safe4(row.meta)}</small><span class="catalog-meta"><em>${safe4(row.source)}</em><em>${safe4(row.usage)}</em><em>ID ${safe4(row.id)}</em></span></div></div>`).join('')}</div>
    </aside>`;
  };

  const cleanAddMenu = () => !state.cleanAddOpen ? '' : `<div class="clean-add-menu">
    <header><b>${state.activeTemplateScenario ? `Добавить в ${state.activeTemplateScenario.kind==='goal'?'сценарий целей':'сценарий КТ'}` : 'Добавить в процесс'}</b><button class="btn icon-only small" data-clean-action="close-add">×</button></header>
    ${state.activeTemplateScenario?`<div class="active-scenario-hint"><span>Выбран сценарий</span><b>${safe4(state.activeTemplateScenario.label||'Текущий сценарий')}</b><button data-clear-active-scenario>Сбросить</button></div>`:''}
    <button data-clean-element-type="task"><i>✓</i><span><b>Задача</b><small>Действие сотрудника или участника</small></span></button>
    <button data-clean-element-type="course"><i>▣</i><span><b>Курс / программа</b><small>Объект из LMS</small></span></button>
    <button data-clean-element-type="article"><i>≡</i><span><b>Статья</b><small>Материал из Базы знаний</small></span></button>
    <button data-clean-element-type="file"><i>⇩</i><span><b>Файл</b><small>PDF, документ или рабочая памятка</small></span></button>
    <button data-clean-element-type="test"><i>□</i><span><b>Тест</b><small>Проверка знаний с результатом</small></span></button>
    <button data-clean-element-type="survey"><i>◉</i><span><b>Опрос</b><small>Пульс или обратная связь</small></span></button>
    <button data-open-assessment-catalog><i>▤</i><span><b>Оценочный лист</b><small>Практическая проверка в этапе или цели</small></span></button><button data-clean-element-type="goal"><i>◎</i><span><b>Цель</b><small>Шаблон цели из каталога</small></span></button>
    <button data-clean-element-type="checkpoint"><i>◆</i><span><b>Контрольная точка</b><small>Шаблон КТ из каталога</small></span></button>
    <p class="add-routing-hint">Условия и автоматические действия настраиваются в карточке элемента: «Если выполнен / не выполнен».</p>
    <button class="clean-ai-pick" data-clean-action="ai-elements"><i>✦</i><span><b>Подобрать с AI</b><small>Агент предложит элементы из разрешённых каталогов</small></span></button>
    <div class="clean-structure-actions"><span>Структура процесса</span><button data-action="addStage">＋ Этап</button><button data-action="addBranch">＋ Ветка</button></div>
  </div>`;

  const templateScenarioPicker = () => {
    const kind = state.templateScenarioPicker;
    if (!kind) return '';
    const records = scenarioRecords(kind);
    return `<div class="modal template-scenario-picker"><section class="dialog"><header class="dialog-head"><div><span class="tag ${kind==='goal'?'purple':'amber'}">Добавление</span><h2>Выберите сценарий</h2><p>${kind==='goal'?'Цель':'Контрольная точка'} будет добавлена в выбранный сценарий.</p></div><button class="btn icon-only" data-close-template-picker>×</button></header><div class="dialog-body scenario-choice-list">${records.map(record=>`<button data-choose-template-scenario="${record.key}" data-choose-template-kind="${kind}"><span><b>${safe4(record.label)}</b><small>${safe4(record.scenario.creator)} · ${safe4(record.scenario.timing)}</small></span><em>Выбрать →</em></button>`).join('')}</div><footer class="dialog-foot"><button class="btn" data-close-template-picker>Отмена</button></footer></section></div>`;
  };

  const cleanProcessPage = () => {
    return `<div class="generated-clean">
      <button class="btn clean-canvas-add" data-clean-action="toggle-add">＋ Добавить</button>
      ${previousCanvasPage()}
      ${cleanAddMenu()}
      ${templateScenarioPicker()}
    </div>`;
  };

  // Goals and checkpoints are part of the process itself. Keep both rails in
  // the canvas instead of making the administrator switch between layers.
  scenarioRail = () => {
    state.goalsOpen = true;
    const cards = [];
    state.goalScenarios.forEach((scenario,index)=>{
      const scopeNames = scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean);
      const key = scenarioKey('goal',index);
      cards.push(`<article class="scenario-card compact-scenario-card scenario-with-templates ${state.activeTemplateScenario?.key===key?'active':''}" data-template-scenario-kind="goal" data-template-scenario-key="${key}"><span class="tag purple">Сценарий целей</span><b>${safe4(scopeNames.join(', ') || 'Все ветки')}</b><small>Цели создаёт ${safe4(scenario.creator)} · ${safe4(scenario.timing)}</small><button class="btn small" data-edit-scenario="goal-manual-${index}">Изменить</button>${scenarioDropZone('goal',key)}</article>`);
    });
    return `<section class="scenario-rail expanded live-scenario-rail clean-scenario-rail"><div class="rail-label"><b>Сценарии целей</b><small>Сценарий задаёт ветки, автора и срок. Сами цели добавляются через «Добавить».</small></div><div class="scenario-cards">${cards.join('') || '<div class="rail-empty-inline"><b>Сценариев пока нет</b><span>Создайте сценарий для одной или нескольких должностей и наполните его целями.</span></div>'}<button class="btn small" data-action="addGoalScenario">＋ Сценарий целей</button></div></section>`;
  };

  scenarioModalV4 = () => {
    if (!state.scenarioModal) return '';
    const goalMode = state.scenarioModal.startsWith('goal');
    const match = state.scenarioModal.match(/manual-(\d+)$/);
    const collection = goalMode ? state.goalScenarios : state.ktScenarios;
    const existing = match ? collection[Number(match[1])] : null;
    const aiBranches = goalMode ? [...new Set((aiState.goals||[]).map(goal=>goal.branchId))] : [...new Set((aiState.sessions||[]).flatMap(session=>session.branches||[]))];
    const selected = existing?.branches || [];
    return `<div class="modal"><section class="dialog scenario-dialog-v4 clean-scenario-dialog"><header class="dialog-head"><div><span class="tag ${goalMode?'purple':'amber'}">${goalMode?'Сценарий целей':'Сценарий контрольных точек'}</span><h2>${existing?'Изменить сценарий':'Новый сценарий'}</h2><p>Настройте правило создания для выбранных веток процесса.</p></div><button class="btn icon-only" data-action="closeScenario">×</button></header><div class="dialog-body"><section class="scenario-scope"><div><b>Для каких веток работает сценарий</b><p class="muted">Можно создать отдельный сценарий для любой должности, группы или общего контура.</p></div><div class="branch-checks">${branches.map(branch=>`<label><input type="checkbox" data-scenario-branch value="${branch.id}" ${selected.includes(branch.id)?'checked':''}> ${safe4(branch.name)}</label>`).join('')}</div></section>${goalMode?`<div class="form-grid"><div class="field"><label>Кто создаёт цели</label><select data-scenario-creator><option ${existing?.creator==='Администратор'?'selected':''}>Администратор</option><option ${existing?.creator==='Руководитель'?'selected':''}>Руководитель</option><option ${existing?.creator==='Сотрудник'?'selected':''}>Сотрудник</option></select></div><div class="field"><label>Когда создать цели</label><select data-scenario-timing><option>При назначении плана</option><option ${existing?.timing==='В первый день'?'selected':''}>В первый день</option><option ${existing?.timing==='До 5 дня плана'?'selected':''}>До 5 дня плана</option></select></div></div>${window.SkillazObjects?.goalSettings(existing)||''}`:`<div class="form-grid"><div class="field"><label>Ответственный за КТ</label><select data-scenario-creator><option ${existing?.creator==='Руководитель'?'selected':''}>Руководитель</option><option ${existing?.creator==='Наставник'?'selected':''}>Наставник</option><option ${existing?.creator==='Бизнес-роль'?'selected':''}>Бизнес-роль</option></select></div><div class="field"><label>Когда запускать</label><select data-scenario-timing><option>По срокам шаблонов КТ</option><option ${existing?.timing==='После завершения этапа'?'selected':''}>После завершения этапа</option><option ${existing?.timing==='По результату элемента'?'selected':''}>По результату элемента</option></select></div></div>`}<section class="scenario-catalog-note"><b>${goalMode?'Цели':'Шаблоны контрольных точек'} добавляются отдельно</b><span>Используйте кнопку «＋ Добавить» на канве и выберите ${goalMode?'«Цель»':'«Контрольную точку»'} из каталога. Так один сценарий можно наполнить разными шаблонами.</span></section></div><footer class="dialog-foot"><button class="btn" data-action="closeScenario">Отмена</button><button class="btn primary" data-action="saveScenario" data-scenario-kind="${goalMode?'goal':'kt'}" data-scenario-index="${match?match[1]:''}">${existing?'Сохранить':'Создать сценарий'}</button></footer></section></div>`;
  };
  checkpointRail = () => {
    state.ktOpen = true;
    const cards = [];
    state.ktScenarios.forEach((scenario,index)=>{
      const scopeNames = scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean);
      const key = scenarioKey('kt',index);
      cards.push(`<article class="checkpoint-card compact-scenario-card scenario-with-templates ${state.activeTemplateScenario?.key===key?'active':''}" data-template-scenario-kind="kt" data-template-scenario-key="${key}"><span class="tag amber">Сценарий КТ</span><b>${safe4(scopeNames.join(', ') || 'Все ветки')}</b><small>${safe4(scenario.creator)} · ${safe4(scenario.timing)}</small><button class="btn small" data-edit-scenario="kt-manual-${index}">Изменить</button>${scenarioDropZone('kt',key)}</article>`);
    });
    return `<section class="checkpoint-rail expanded live-scenario-rail clean-scenario-rail"><div class="rail-label"><b style="color:var(--amber)">Сценарии контрольных точек</b><small>Сценарий задаёт ветки, ответственного и запуск. Шаблоны КТ добавляются через «Добавить».</small></div><div class="checkpoint-cards">${cards.join('') || '<div class="rail-empty-inline"><b>Сценариев пока нет</b><span>Создайте сценарий, затем добавьте нужные шаблоны контрольных точек.</span></div>'}<button class="btn small" data-action="addKtScenario">＋ Сценарий КТ</button></div></section>`;
  };

  canvasPage = () => state.view === 'canvas' ? cleanProcessPage() : previousCanvasPage();

  const unifiedHeader = () => {
    const itemCount = Object.values(state.items).reduce((sum,list) => sum + list.length, 0);
    const workflow = currentWorkflow();
    const title = state.newWorkflow
      ? (state.processTitle || 'Новый процесс')
      : workflow.name.replace(/^План\s+/i, '');
    const stats = stages.length
      ? `${stages.length} этапов · ${branches.length} ветки · ${itemCount} действий`
      : 'Черновик · структура ещё не собрана';
    return `<header class="topbar clean-editor-topbar"><button class="btn ghost" data-action="home">←</button><div class="brand"><span class="brand-mark">S</span></div><div class="titleblock clean-editor-title"><small>${stats}</small><b>${title}</b></div><nav class="clean-header-tabs"><button data-step="base" class="${state.step === 'base' ? 'active' : ''}">Запуск</button><button data-step="participants" class="${state.step === 'participants' ? 'active' : ''}">Участники</button><button data-step="canvas" class="${state.step === 'canvas' ? 'active' : ''}">Процесс</button><button data-step="settings" class="${state.step === 'settings' ? 'active' : ''}">Проверка и публикация</button></nav><div class="topbar-spacer"></div><span class="saved-label">Сохранено локально</span><button class="btn primary" data-action="openPublish">Опубликовать</button></header>`;
  };

  editor = () => previousEditor()
    .replace(/<header class="topbar">[\s\S]*?<\/header>/, unifiedHeader())
    .replace(/<nav class="stepbar[^\"]*">[\s\S]*?<\/nav>/, '')
    .replace('<div class="shell">', '<div class="shell clean-editor-shell unified-editor-shell">') + outcomeModal();

  const drawGoalLinks = () => {
    const surface = document.querySelector('.canvas-surface');
    if (!surface) return;
    surface.querySelector('.goal-link-layer')?.remove();
    const links = [];
    document.querySelectorAll('.goal-template-card[data-goal-template-id]').forEach(card=>{
      if(state.selectedGoal?.id!==card.dataset.goalTemplateId||state.selectedGoal?.key!==card.dataset.placementKey)return;
      const template = (state.goalPlacements[card.dataset.placementKey]||[]).find(item=>item.id===card.dataset.goalTemplateId);
      (template?.links||[]).forEach(link=>{
        const target = link.cell
          ? document.querySelector(`[data-source-cell="${CSS.escape(link.cell)}"][data-item="${CSS.escape(link.id)}"]`)
          : document.querySelector(`[data-item="${CSS.escape(link.id)}"]`);
        if (target) links.push({card,target});
      });
    });
    if (!links.length) return;
    const surfaceRect = surface.getBoundingClientRect();
    const scale = Number(state.zoom) || 1;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','goal-link-layer');
    svg.setAttribute('width',String(surface.scrollWidth)); svg.setAttribute('height',String(surface.scrollHeight));
    svg.innerHTML = '<defs><marker id="goalArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7651c7"/></marker></defs>';
    links.forEach(({card,target})=>{
      const from=card.getBoundingClientRect(),to=target.getBoundingClientRect();
      const x1=(from.left+from.width/2-surfaceRect.left)/scale,y1=(from.bottom-surfaceRect.top)/scale;
      const x2=(to.left+to.width/2-surfaceRect.left)/scale,y2=(to.top-surfaceRect.top)/scale;
      const bend=Math.max(30,(y2-y1)*.45);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${x1} ${y1} C ${x1} ${y1+bend}, ${x2} ${y2-bend}, ${x2} ${y2}`);
      path.setAttribute('marker-end','url(#goalArrow)'); svg.append(path);
    });
    surface.prepend(svg);
  };
  const previousApplyZoomV4=applyZoom;
  applyZoom=()=>{previousApplyZoomV4();requestAnimationFrame(drawGoalLinks);};

  bind = function () {
    previousBind();
    if (document.querySelector('.live-scenario-contents')) document.querySelectorAll('.ai-applied-list').forEach(node => node.remove());
    document.querySelectorAll('[data-template-scenario-key]').forEach(card => {
      card.onclick = event => {
        if (event.target.closest('[data-edit-scenario],[data-link-goal],[data-unlink-goal],[data-remove-template],[data-open-object],[data-add-goal-assessment],.goal-template-card')) return;
        const kind = card.dataset.templateScenarioKind;
        const key = card.dataset.templateScenarioKey;
        const record = scenarioRecords(kind).find(item=>item.key===key);
        state.activeTemplateScenario = {kind,key,label:record?.label || card.querySelector(':scope>b')?.textContent || 'Текущий сценарий'};
        state.cleanCatalogType = kind === 'goal' ? 'goal' : 'checkpoint';
        state.catalogTargetScenario = key;
        state.cleanPaletteOpened = true;
        state.paletteOpen = true;
        render();
        toast(`Выбран сценарий. Перетащите ${kind==='goal'?'цели':'КТ'} из каталога`);
      };
    });
    document.querySelectorAll('[data-edit-scenario]').forEach(button => button.onclick = event => {
      event.preventDefault(); event.stopPropagation(); state.scenarioModal = button.dataset.editScenario; render();
    });
    if (state.step === 'base') {
      const target = document.querySelector('.launch-title, .page-card .settings-title');
      if (target && !target.querySelector('.inner-ai-action')) {
        const button = document.createElement('button');
        button.className = 'btn inner-ai-action';
        button.dataset.localAction = 'resume-launch-assistant';
        button.textContent = '✦ Настроить с AI';
        const nextAction = target.querySelector(':scope > .btn');
        nextAction ? target.insertBefore(button, nextAction) : target.append(button);
      }
    }
    if (state.step === 'participants') {
      document.querySelectorAll('.participants-page .role-section-head [data-participant-action="open-assistant"]').forEach(button => {
        button.textContent = '✦ Настроить с AI';
      });
      const continueButton = document.querySelector('.participants-page [data-participant-action="generate-process"]');
      if (continueButton) continueButton.textContent = 'Перейти к процессу →';
    }
    document.querySelectorAll('.ai-canvas-button').forEach(button => button.classList.add('clean-hidden-ai-trigger'));
    const elementAi = document.querySelector('[data-clean-ai-elements]');
    if (elementAi) elementAi.onclick = () => {
      const mode = state.cleanCatalogType === 'goal' ? 'goals' : state.cleanCatalogType === 'checkpoint' ? 'checkpoints' : 'elements';
      aiOpen(mode);
    };

    document.querySelectorAll('.clean-catalog-list .palette-card').forEach(card=>card.ondragstart = event => {
      event.dataTransfer.setData('text/plain',JSON.stringify({id:card.dataset.dragId,type:card.dataset.dragType,title:card.dataset.dragTitle,meta:card.dataset.dragMeta}));
    });
    document.querySelectorAll('.clean-catalog-list .palette-card').forEach(card=>card.onclick = event => {
      if (!['goal','checkpoint'].includes(card.dataset.dragType)) return;
      event.preventDefault();
      const kind = card.dataset.dragType === 'goal' ? 'goal' : 'kt';
      const records = scenarioRecords(kind);
      const data={id:card.dataset.dragId,type:card.dataset.dragType,title:card.dataset.dragTitle,meta:card.dataset.dragMeta};
      if (!records.length) {
        state.pendingCatalogTemplate={kind,data}; state.pendingTemplateKind=kind;
        state.scenarioModal=`${kind}-new`; state.paletteOpen=false; render(); return;
      }
      let key = state.catalogTargetScenario || state.activeTemplateScenario?.key;
      if (!records.some(record=>record.key===key)) {
        if(records.length>1){state.pendingCatalogTemplate={kind,data};state.templateScenarioPicker=kind;state.paletteOpen=false;render();return;}
        key=records[0].key;
      }
      addTemplate(kind,key,data);
      state.activeTemplateScenario={kind,key,label:records.find(record=>record.key===key)?.label||'Текущий сценарий'};
      render(); toast(`${kind==='goal'?'Цель':'Контрольная точка'} добавлена в сценарий`);
    });
    document.querySelectorAll('[data-template-drop-key]').forEach(zone=>{
      zone.ondragover = event => { event.preventDefault(); zone.classList.add('dragover'); };
      zone.ondragleave = () => zone.classList.remove('dragover');
      zone.ondrop = event => {
        event.preventDefault(); event.stopPropagation(); zone.classList.remove('dragover');
        let data; try { data = JSON.parse(event.dataTransfer.getData('text/plain')); } catch { return; }
        const kind = zone.dataset.templateDropKind;
        const expected = kind === 'goal' ? 'goal' : 'checkpoint';
        if (data.type !== expected) return toast(`В этот сценарий можно добавить только ${kind==='goal'?'цели':'контрольные точки'}`);
        addTemplate(kind,zone.dataset.templateDropKey,data);
        render(); toast(`${kind==='goal'?'Цель':'Контрольная точка'} добавлена в сценарий`);
      };
    });
    document.querySelectorAll('.goal-template-card .goal-port').forEach(port=>{
      port.draggable=true; port.title='Перетащите к карточке этапа, чтобы связать цель';
      port.ondragstart=event=>{
        event.stopPropagation();
        const card=port.closest('[data-goal-template-id]');
        event.dataTransfer.setData('text/plain',JSON.stringify({type:'goal-link',key:card.dataset.placementKey,templateId:card.dataset.goalTemplateId}));
        document.querySelector('.canvas-surface')?.classList.add('goal-link-dragging');
      };
      port.ondragend=()=>document.querySelector('.canvas-surface')?.classList.remove('goal-link-dragging');
    });
    document.querySelectorAll('[data-source-cell][data-item]').forEach(card=>{
      card.addEventListener('dragover',event=>{event.preventDefault();event.stopPropagation();});
      card.addEventListener('drop',event=>{
        let data;try{data=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}
        if(data.type!=='goal-link')return;
        event.preventDefault();event.stopImmediatePropagation();
        if(linkGoalToItem(data.key,data.templateId,card.dataset.sourceCell,card.dataset.item)){render();toast('Цель связана с действием стрелкой');}
      },true);
    });

    const scenarioDialog = document.querySelector('.scenario-dialog-v4');
    const scenarioAi = scenarioDialog?.querySelector('.ai-scenario-button');
    if (scenarioDialog && scenarioAi && !scenarioDialog.querySelector('.scenario-method-tabs')) {
      scenarioAi.classList.add('clean-hidden-ai-trigger');
      const tabs = document.createElement('div');
      tabs.className = 'creation-method-tabs scenario-method-tabs';
      tabs.innerHTML = `<button class="active">Настроить вручную</button><button>✦ Предложить с AI</button>`;
      tabs.lastElementChild.onclick = () => scenarioAi.click();
      scenarioDialog.querySelector('.dialog-body')?.prepend(tabs);
    }
    document.querySelectorAll('[data-outcome-item]').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        const cell = button.dataset.outcomeCell;
        const item = (state.items[cell] || []).find(candidate => candidate.id === button.dataset.outcomeItem);
        if (item) state.outcomeModal = { item, cell };
        render();
      };
    });
    document.querySelectorAll('[data-outcome-close]').forEach(button => button.onclick = () => {
      state.outcomeModal = null;
      render();
    });
    document.querySelectorAll('[data-outcome-add]').forEach(button => button.onclick = () => {
      state.outcomeModal.extra = true;
      render();
    });
    document.querySelectorAll('[data-outcome-save]').forEach(button => button.onclick = () => {
      state.outcomeRules[button.dataset.outcomeSave] = {
        condition: document.querySelector('#outcomeCondition')?.value || 'Результат не достигнут',
        action: document.querySelector('#outcomeAction')?.value || 'Уведомить руководителя',
        extraCondition: document.querySelector('#outcomeCondition2')?.value || '',
        extraAction: document.querySelector('#outcomeAction2')?.value || ''
      };
      state.outcomeModal = null;
      render();
      toast('Выход элемента сохранён');
    });
    // Measure after the base render applies the canvas zoom.
    requestAnimationFrame(()=>requestAnimationFrame(drawGoalLinks));
  };

  if (!window.__workflowIterationFourBound) {
    window.__workflowIterationFourBound = true;
    document.addEventListener('click', event => {
      const addGoalScenario = event.target.closest('[data-action="addGoalScenario"]');
      if (addGoalScenario) { event.preventDefault(); event.stopImmediatePropagation(); state.scenarioModal='goal-new'; render(); return; }
      const addKtScenario = event.target.closest('[data-action="addKtScenario"]');
      if (addKtScenario) { event.preventDefault(); event.stopImmediatePropagation(); state.scenarioModal='kt-new'; render(); return; }
      const chooseScenario = event.target.closest('[data-choose-template-scenario]');
      if (chooseScenario) {
        event.preventDefault(); event.stopImmediatePropagation();
        const kind=chooseScenario.dataset.chooseTemplateKind,key=chooseScenario.dataset.chooseTemplateScenario;
        const record=scenarioRecords(kind).find(item=>item.key===key);
        state.activeTemplateScenario={kind,key,label:record?.label||'Текущий сценарий'};
        if(state.pendingCatalogTemplate?.kind===kind){addTemplate(kind,key,state.pendingCatalogTemplate.data);state.pendingCatalogTemplate=null;}
        state.catalogTargetScenario=key; state.templateScenarioPicker=null; state.cleanCatalogType=kind==='goal'?'goal':'checkpoint'; state.cleanPaletteOpened=true; state.paletteOpen=true; render(); return;
      }
      if (event.target.closest('[data-close-template-picker]')) { event.preventDefault(); state.templateScenarioPicker=null; render(); return; }
      if (event.target.closest('[data-clear-active-scenario]')) { event.preventDefault(); state.activeTemplateScenario=null; state.catalogTargetScenario=null; render(); return; }
      const linkButton = event.target.closest('[data-link-goal]');
      if (linkButton) { event.preventDefault(); event.stopImmediatePropagation(); state.goalLinkMode={templateId:linkButton.dataset.linkGoal,key:linkButton.dataset.linkKey};state.selectedGoal={id:linkButton.dataset.linkGoal,key:linkButton.dataset.linkKey}; render(); toast('Теперь нажмите на карточку действия в этапе'); return; }
      const unlinkButton = event.target.closest('[data-unlink-goal]');
      if (unlinkButton) {
        event.preventDefault(); event.stopImmediatePropagation();
        const template=(state.goalPlacements[unlinkButton.dataset.unlinkKey]||[]).find(item=>item.id===unlinkButton.dataset.unlinkGoal);
        if(template) template.links=(template.links||[]).filter(link=>!(link.id===unlinkButton.dataset.unlinkItem&&(!unlinkButton.dataset.unlinkCell||link.cell===unlinkButton.dataset.unlinkCell)));
        render(); return;
      }
      const removeButton = event.target.closest('[data-remove-template]');
      if (removeButton) {
        event.preventDefault(); event.stopImmediatePropagation();
        const collection=removeButton.dataset.removeKind==='goal'?state.goalPlacements:state.ktPlacements;
        collection[removeButton.dataset.removeKey]=(collection[removeButton.dataset.removeKey]||[]).filter(item=>item.id!==removeButton.dataset.removeTemplate);
        render(); toast('Шаблон убран из сценария'); return;
      }
      const targetItem = event.target.closest('[data-item]');
      if (targetItem && state.goalLinkMode) {
        event.preventDefault(); event.stopImmediatePropagation();
        const mode=state.goalLinkMode;
        linkGoalToItem(mode.key,mode.templateId,targetItem.dataset.sourceCell,targetItem.dataset.item);
        state.goalLinkMode=null; render(); toast('Цель связана с действием стрелкой'); return;
      }
      const save = event.target.closest('[data-action="saveScenario"][data-scenario-kind]');
      if (!save) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const branchIds = [...document.querySelectorAll('[data-scenario-branch]:checked')].map(input=>input.value);
      if (!branchIds.length) { toast('Выберите хотя бы одну ветку'); return; }
      const scenario = {
        branches:branchIds,
        creator:document.querySelector('[data-scenario-creator]')?.value || (save.dataset.scenarioKind==='goal'?'Администратор':'Руководитель'),
        timing:document.querySelector('[data-scenario-timing]')?.value || 'При назначении плана',
        managerReview:document.querySelector('[data-manager-review]')?.checked||false,
        publicationDays:Math.max(1,Number(document.querySelector('[data-publication-days]')?.value)||7)
      };
      const collection = save.dataset.scenarioKind === 'goal' ? state.goalScenarios : state.ktScenarios;
      const index = save.dataset.scenarioIndex === '' ? -1 : Number(save.dataset.scenarioIndex);
      if (index >= 0) collection[index] = scenario; else collection.push(scenario);
      const savedIndex = index >= 0 ? index : collection.length - 1;
      if (save.dataset.scenarioKind === 'goal') state.newGoalScenario = true; else state.newKtScenario = true;
      state.scenarioModal = null;
      const savedKey=scenarioKey(save.dataset.scenarioKind,savedIndex);
      if(state.pendingCatalogTemplate?.kind===save.dataset.scenarioKind){addTemplate(save.dataset.scenarioKind,savedKey,state.pendingCatalogTemplate.data);state.pendingCatalogTemplate=null;}
      state.activeTemplateScenario={kind:save.dataset.scenarioKind,key:savedKey,label:scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean).join(', ')||'Все ветки'};
      state.catalogTargetScenario=savedKey;
      state.cleanCatalogType=save.dataset.scenarioKind==='goal'?'goal':'checkpoint';
      state.cleanPaletteOpened=true; state.paletteOpen=true;
      if (state.pendingTemplateKind === save.dataset.scenarioKind) {
        const key=scenarioKey(save.dataset.scenarioKind,savedIndex);
        state.activeTemplateScenario={kind:save.dataset.scenarioKind,key,label:scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean).join(', ')||'Все ветки'};
        state.catalogTargetScenario=key; state.cleanCatalogType=save.dataset.scenarioKind==='goal'?'goal':'checkpoint'; state.cleanPaletteOpened=true; state.paletteOpen=true; state.pendingTemplateKind=null;
      }
      render();
      toast('Сценарий сохранён. Добавьте шаблоны через кнопку «Добавить»');
    }, true);
    document.addEventListener('click', event => {
      const node = event.target.closest('[data-clean-action]');
      const elementNode = event.target.closest('[data-clean-element-type]');
      if (elementNode) {
        event.preventDefault();
        const type = elementNode.dataset.cleanElementType;
        if (type === 'goal' || type === 'checkpoint') {
          const kind = type === 'goal' ? 'goal' : 'kt';
          const records = scenarioRecords(kind);
          if (!records.length) {
            state.cleanAddOpen = false;
            state.pendingTemplateKind = kind;
            state.scenarioModal = `${kind}-new`;
            render();
            toast(`Сначала создайте сценарий ${kind==='goal'?'целей':'контрольных точек'}`);
            return;
          }
          if (!state.activeTemplateScenario || state.activeTemplateScenario.kind !== kind) {
            if (records.length > 1) { state.cleanAddOpen = false; state.templateScenarioPicker = kind; render(); return; }
            state.activeTemplateScenario = {...records[0],label:records[0].label};
          }
          state.catalogTargetScenario = state.activeTemplateScenario.key;
        }
        state.cleanAddOpen = false;
        state.cleanCatalogType = type;
        state.cleanPaletteOpened = true;
        state.paletteOpen = true;
        render();
        return;
      }
      if (!node) return;
      event.preventDefault();
      const action = node.dataset.cleanAction;
      if (action === 'toggle-add') { state.cleanAddOpen = !state.cleanAddOpen; render(); }
      if (action === 'close-add') { state.cleanAddOpen = false; render(); }
      if (action === 'ai-elements') { state.cleanAddOpen = false; document.querySelector('.ai-canvas-button')?.click(); }
      if (action === 'goals') { state.cleanAddOpen = false; state.scenarioModal = 'goal-new'; render(); }
      if (action === 'checkpoints') { state.cleanAddOpen = false; state.scenarioModal = 'kt-new'; render(); }
    }, true);
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-action="togglePalette"]')) return;
      state.cleanPaletteOpened = false;
    }, true);
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-action="addStage"],[data-action="addBranch"]')) return;
      state.cleanAddOpen = false;
    }, true);
    document.addEventListener('click', event => {
      if (!event.target.closest('.clean-header-tabs button')) return;
      setTimeout(() => window.scrollTo({top: 0, left: 0}), 0);
    }, true);
    document.addEventListener('input', event => {
      if (!event.target.matches('.palette-search input')) return;
      const query = event.target.value.trim().toLowerCase().replace(/ё/g,'е');
      document.querySelectorAll('.clean-catalog-list .palette-card').forEach(card=>{
        card.hidden = query && !card.innerText.toLowerCase().replace(/ё/g,'е').includes(query);
      });
    }, true);
  }

  if (document.body.dataset.directProcess === 'true') {
    loadWorkflow('courier');
    state.screen = 'editor';
    state.newWorkflow = true;
    state.workflow = 'generated';
    state.generatedProcess = true;
    state.step = 'canvas';
    state.view = 'canvas';
    state.layer = 'process';
    state.cleanAddOpen = false;
    state.cleanPaletteOpened = false;
    state.paletteOpen = false;
    state.newGoalScenario = true;
    state.newKtScenario = true;
  }
  render();
  window.SkillazObjects?.install();
})();
