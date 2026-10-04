// Interactive, local-only AI proposal flow for the workflow prototype.
const aiState = { mode: null, step: 'configure', scope: [], stages: [], proposals: [], goals: [], sessions: [], context: null, creator: 'Руководитель', scenarioScope: [] };
const aiCatalog = {
  general: {
    signal: 'В похожих планах чаще задерживаются доступы и первая самостоятельная задача.',
    elements: [
      ['course', 'Вводный курс по роли', 'Каталог курсов'],
      ['task', 'Проверить доступы и рабочее место', 'Шаблоны задач'],
      ['article', 'Правила работы команды', 'База знаний'],
      ['task', 'Выполнить первую задачу с наставником', 'Шаблоны задач']
    ],
    goal: ['Освоить ключевые задачи роли', 'Выполнить первую задачу самостоятельно']
  },
  delivery: {
    signal: 'В прошлых планах дополнительная практика снижала ошибки первого маршрута.',
    elements: [
      ['course', 'Безопасная доставка и маршрут', 'Каталог курсов'],
      ['task', 'Пройти маршрут с наставником', 'Шаблоны задач'],
      ['file', 'Памятка по вручению отправления', 'База знаний'],
      ['task', 'Выполнить самостоятельный маршрут', 'Шаблоны задач']
    ],
    goal: ['Самостоятельно выполнять доставку', 'Провести маршрут без ошибок передачи']
  },
  warehouse: {
    signal: 'В прошлых планах ошибки чаще возникали на передаче и консолидации.',
    elements: [
      ['course', 'Приём и консолидация отправлений', 'Каталог курсов'],
      ['article', 'Схема движения отправления', 'База знаний'],
      ['task', 'Принять и передать партию под наблюдением', 'Шаблоны задач'],
      ['task', 'Самостоятельно закрыть смену', 'Шаблоны задач']
    ],
    goal: ['Освоить операции склада', 'Провести приём и передачу без ошибок']
  },
  retail: {
    signal: 'На первых сменах часто требовалась помощь с кассой и сервисными ситуациями.',
    elements: [
      ['course', 'Стандарты обслуживания клиента', 'Каталог курсов'],
      ['course', 'Касса и оформление оплаты', 'Каталог курсов'],
      ['task', 'Провести смену с наставником', 'Шаблоны задач'],
      ['assessment', 'Оценочная сессия по стандартам', 'Шаблоны задач']
    ],
    goal: ['Самостоятельно обслуживать клиентов', 'Пройти практику по стандартам сервиса']
  },
  expert: {
    signal: 'В похожих планах практика с обратной связью ускоряла самостоятельную работу.',
    elements: [
      ['course', 'Профессиональные инструменты роли', 'Каталог курсов'],
      ['file', 'Рабочие шаблоны и инструкции', 'База знаний'],
      ['task', 'Разобрать первый кейс с наставником', 'Шаблоны задач'],
      ['task', 'Защитить самостоятельное решение', 'Шаблоны задач']
    ],
    goal: ['Самостоятельно решать задачи роли', 'Защитить первый рабочий кейс']
  },
  manager: {
    signal: 'По прошлым планам ранняя обратная связь снижала задержки управленческих задач.',
    elements: [
      ['course', 'Управление командой и показателями', 'Каталог курсов'],
      ['file', 'Шаблон плана команды', 'База знаний'],
      ['task', 'Провести встречу с командой', 'Шаблоны задач'],
      ['task', 'Подготовить план улучшений', 'Шаблоны задач']
    ],
    goal: ['Войти в управление командой', 'Согласовать план улучшений']
  }
};

const escapeAi = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const branchProfile = branch => {
  const text = [branch.name, branch.desc, ...(branch.conditions || []), ...(branch.meta || [])].join(' ').toLowerCase();
  if (/курьер|достав|водител|маршрут/.test(text)) return 'delivery';
  if (/склад|кладов|сортиров|консолидац/.test(text)) return 'warehouse';
  if (/кассир|розниц|пвз|клиентск|торгов/.test(text)) return 'retail';
  if (/рекрутер|подбор|эксперт/.test(text)) return 'expert';
  if (/руковод|менеджер|директор/.test(text)) return 'manager';
  return 'general';
};
const aiBranch = id => branches.find(branch => branch.id === id);
const aiStage = id => stages.find(stage => stage.id === id);
const isSkipped = (branchId, stageId) => state.skips.includes(`${branchId}-${stageId}`);
const contextualDescription = branch => [branch.name, branch.desc, ...(branch.conditions || [])].filter(Boolean).join(' · ');
const selectedValues = (selector, root = document) => $$(selector, root).filter(input => input.checked).map(input => input.value);
const aiStageEnd = stage => Math.max(1, ...([...String(stage.days).matchAll(/\d+/g)].map(match => Number(match[0]))));
const aiPlanEnd = () => Math.max(30, ...stages.map(aiStageEnd));

function aiOpen(mode) {
  if (!branches.length || !stages.length) return toast('Сначала создайте этапы и ветки');
  aiState.creator = $('#aiScenarioCreator')?.value || aiState.creator;
  aiState.mode = mode;
  aiState.step = 'configure';
  aiState.proposals = [];
  aiState.scope = mode === 'elements' ? branches.filter(branch => branch.id !== 'base').map(branch => branch.id) :
    selectedValues('.scenario-scope input[data-ai-branch]');
  if (!aiState.scope.length) aiState.scope = [branches.find(branch => branch.id !== 'base')?.id || branches[0].id];
  if (mode !== 'elements') aiState.scenarioScope = [...aiState.scope];
  aiState.stages = stages.map(stage => stage.id);
  render();
}

async function aiGenerate() {
  const scope = selectedValues('#aiScope input');
  const selectedStages = selectedValues('#aiStages input');
  if (!scope.length) return $('#aiError').textContent = 'Выберите хотя бы одну ветку.';
  if (aiState.mode === 'elements' && !selectedStages.length) return $('#aiError').textContent = 'Выберите хотя бы один этап.';
  aiState.scope = scope;
  aiState.stages = selectedStages;
  aiState.context = {
    catalog: $('#aiSourceCatalog')?.checked ?? true,
    tasks: $('#aiSourceTasks')?.checked ?? true,
    knowledge: $('#aiSourceKnowledge')?.checked ?? true,
    history: $('#aiHistory')?.checked ?? true
  };
  if (aiState.mode === 'elements' && ![aiState.context.catalog, aiState.context.tasks, aiState.context.knowledge].some(Boolean)) {
    return $('#aiError').textContent = 'Выберите источник контента.';
  }
  const button = $('[data-ai-generate]');
  if (button) { button.disabled = true; button.textContent = 'AI подбирает…'; }
  const fallback = () => aiState.mode === 'elements' ? aiElementProposals() : aiState.mode === 'goals' ? aiGoalProposals() : aiKtProposals();
  try {
    const selectedBranches = scope.map(id => aiBranch(id)).filter(Boolean);
    const selectedStageRows = selectedStages.map(id => aiStage(id)).filter(Boolean);
    const query = [...selectedBranches.map(branch=>`${branch.name} ${contextualDescription(branch)}`),...selectedStageRows.map(stage=>stage.name),state.processTitle||''].join(' ');
    const result = await window.SkillazLiveAI.ask(aiState.mode, {
      message:aiState.mode === 'elements' ? 'Подбери элементы для выбранных веток и этапов' : aiState.mode === 'goals' ? 'Предложи цели и связи с действиями' : 'Предложи контрольные точки',
      context:{
        launch:state.assistantAnswers||{}, roles:state.newRoles||[], coordinator:state.coordinatorRule||'',
        branches:selectedBranches, stages:selectedStageRows,
        existingItems:Object.entries(state.items).filter(([cell])=>scope.some(id=>cell.startsWith(`${id}-`))).flatMap(([cell,items])=>items.map(item=>({...item,cell})))
      },
      history:[], catalog:window.SkillazLiveAI.context(query)
    });
    const proposals = Array.isArray(result.proposals) ? result.proposals : [];
    if (proposals.length && !dialog?.querySelector('.ai-applied-list,.live-scenario-contents')) {
      aiState.proposals = proposals.map((proposal,index) => {
        const branchId = proposal.branchId || scope[index % scope.length];
        const stageId = proposal.stageId || selectedStages[index % Math.max(1,selectedStages.length)];
        const available = Object.entries(state.items).filter(([key])=>key.startsWith(`${branchId}-`)||key.startsWith('base-')).flatMap(([cell,items])=>items.map(item=>({...item,cell})));
        const candidates = available.filter(item=>/task|course|assessment/.test(item.type)).slice(-6).map(item=>({id:item.id,title:item.title,cell:item.cell}));
        return {
          id:proposal.id||`live-${aiState.mode}-${index}`, branchId, stageId,
          type:proposal.type||'task', title:proposal.title, source:proposal.sourceId?'Каталог клиента':'AI · новый черновик',
          reason:proposal.reason||result.message||'Подобрано по контексту процесса.', outcomes:proposal.outcomes||[],
          result:proposal.result||proposal.title, day:Number(proposal.day)||Math.min(aiPlanEnd(),30),
          agenda:proposal.agenda||'Проверить результат, сложности и необходимую поддержку.',
          pulse:proposal.pulse||'Насколько уверенно сотрудник выполняет задачи роли?', candidates, linked:candidates.slice(0,2)
        };
      });
      if (aiState.mode === 'elements') aiState.proposals = supplementElementProposals(aiState.proposals, scope, selectedStages, query);
    } else aiState.proposals = fallback();
  } catch (error) {
    aiState.proposals = fallback();
    aiState.liveFallback = true;
  }
  if (aiState.mode === 'elements') aiState.proposals = supplementElementProposals(aiState.proposals, scope, selectedStages, [...scope.map(id=>aiBranch(id)?.name||''),...selectedStages.map(id=>aiStage(id)?.name||'')].join(' '));
  if (!aiState.proposals.length) return $('#aiError').textContent = 'Для этих условий новых предложений нет. Измените ветки, этапы или источники.';
  aiState.step = 'review';
  render();
}

function supplementElementProposals(current, scope, selectedStages, query) {
  const catalog = window.SkillazProductionCatalog;
  if (!catalog || !scope.length || !selectedStages.length) return current;
  const result = [...current];
  const target = Math.min(24, Math.max(scope.length * selectedStages.length, 12));
  const rows = catalog.relevantElements(query, 70).filter(row => ['course','article','task','test','survey','action','meeting'].includes(row.type));
  const mappedType = type => ({test:'assessment',action:'task',meeting:'task'}[type] || type);
  let serial = 0;
  const addForCell = (branchId,stageId) => {
    const existing = new Set([...(state.items[`${branchId}-${stageId}`]||[]).map(item=>item.title),...result.filter(item=>item.branchId===branchId&&item.stageId===stageId).map(item=>item.title)]);
    const row = rows.find(candidate=>!existing.has(candidate.title));
    if (!row) return;
    result.push({id:`live-catalog-${branchId}-${stageId}-${serial++}`,branchId,stageId,type:mappedType(row.type),title:row.title,source:row.source,sourceId:row.id,reason:'Подобрано из каталога по аудитории ветки и назначению этапа.',outcomes:[]});
  };
  scope.forEach(branchId=>selectedStages.forEach(stageId=>{
    if (!result.some(item=>item.branchId===branchId&&item.stageId===stageId)) addForCell(branchId,stageId);
  }));
  let pass = 0;
  while (result.length < target && pass < 3) {
    scope.forEach(branchId=>selectedStages.forEach(stageId=>{ if (result.length < target) addForCell(branchId,stageId); }));
    pass += 1;
  }
  return result.slice(0, target);
}

function aiElementProposals() {
  const sourceAllowed = { 'Каталог курсов':aiState.context.catalog, 'Шаблоны задач':aiState.context.tasks, 'База знаний':aiState.context.knowledge };
  return aiState.scope.flatMap(branchId => {
    const branch = aiBranch(branchId), profile = branchProfile(branch);
    const available = aiState.stages.filter(stageId => !isSkipped(branchId, stageId));
    return aiCatalog[profile].elements.filter((record) => sourceAllowed[record[2]]).flatMap((record, index) => {
      const stageId = available[Math.min(index, available.length - 1)];
      if (!stageId || (state.items[`${branchId}-${stageId}`] || []).some(item => item.title === record[1])) return [];
      return [{ id:`el-${branchId}-${index}`, branchId, stageId, type:record[0], title:record[1], source:record[2], reason:aiState.context.history ? aiCatalog[profile].signal : 'Подобрано по условиям должности и подразделения ветки.' }];
    });
  });
}

function aiGoalProposals() {
  return aiState.scope.map((branchId, index) => {
    const branch = aiBranch(branchId), profile = branchProfile(branch);
    const available = Object.entries(state.items).filter(([key]) => key.startsWith(`${branchId}-`) || key.startsWith('base-'))
      .flatMap(([key, items]) => items.map(item => ({ ...item, cell:key })));
    const candidates = available.filter(item => /task|course|assessment/.test(item.type)).slice(-6).map(item => ({ id:item.id, title:item.title, cell:item.cell }));
    return { id:`goal-${branchId}-${index}`, branchId, title:aiCatalog[profile].goal[0], result:aiCatalog[profile].goal[1], day:Math.min(aiPlanEnd(), 30), source:'Каталог целей', candidates, linked:candidates.slice(0,2), reason:aiState.context.history ? aiCatalog[profile].signal : 'Подобрано по должности и подразделению ветки.' };
  });
}

function aiKtProposals() {
  const max = aiPlanEnd(), days = max >= 90 ? [30, 60, 90] : max >= 60 ? [14, 30, 60] : [7, 14, 30].filter(day => day <= max);
  return days.map((day, index) => ({ id:`kt-${day}`, day, title:['Первые результаты','Прогресс и поддержка','Итоги адаптации'][index],
    agenda: index === 0 ? 'Обсудить первые задачи, сложности и необходимую поддержку.' : index === 1 ? 'Проверить практику, результаты и договорённости до следующей встречи.' : 'Подвести итог, обсудить самостоятельность и следующие шаги.',
    pulse:'Насколько уверенно вы выполняете задачи роли? Что мешает двигаться дальше?',
    reason:aiState.context.history ? 'Повестка учитывает типичные точки затруднений похожих планов.' : 'Срок в пределах текущего плана.' }));
}

function aiApply() {
  const checked = selectedValues('.ai-proposal-check');
  if (!checked.length) return $('#aiReviewError').textContent = 'Выберите хотя бы одно предложение.';
  const proposals = aiState.proposals.filter(proposal => checked.includes(proposal.id)).map(proposal => {
    const row = $(`[data-ai-proposal="${proposal.id}"]`);
    return { ...proposal, title:row.querySelector('[data-ai-title]').value.trim() || proposal.title,
      ...(aiState.mode === 'goals' ? { result:row.querySelector('[data-ai-result]').value.trim() || proposal.result, day:Number(row.querySelector('[data-ai-day]').value), linked:proposal.candidates.filter(item => selectedValues('input[data-ai-link]', row).includes(item.id)) } : {}),
      ...(aiState.mode === 'checkpoints' ? { day:Number(row.querySelector('[data-ai-day]').value), agenda:row.querySelector('[data-ai-agenda]').value.trim(), pulse:row.querySelector('[data-ai-pulse]').value.trim() } : {}) };
  });
  if (proposals.some(proposal => (proposal.day !== undefined && (!Number.isInteger(proposal.day) || proposal.day < 1 || proposal.day > aiPlanEnd())) || (aiState.mode === 'checkpoints' && (!proposal.agenda || !proposal.pulse)))) {
    return $('#aiReviewError').textContent = `Проверьте сроки (1–${aiPlanEnd()} день), повестку и вопросы пульса.`;
  }
  if (aiState.mode === 'elements') {
    proposals.forEach((proposal, index) => {
      const key = `${proposal.branchId}-${proposal.stageId}`;
      state.items[key] ||= [];
      const id = `ai-${Date.now()}-${index}`;
      state.items[key].push({ id, type:proposal.type, title:proposal.title, meta:`AI · ${proposal.source}`, aiSource:proposal.source, outcomes:proposal.outcomes || [] });
      if (proposal.outcomes?.[0] && state.outcomeRules) state.outcomeRules[id] = {condition:proposal.outcomes[0].if,action:proposal.outcomes[0].then};
    });
    state.paletteOpen = false;
  } else if (aiState.mode === 'goals') {
    aiState.creator = 'Администратор';
    aiState.goals.push(...proposals);
    state.newGoalScenario = true;
    state.goalsOpen = true;
    state.layer = 'goals';
    state.scenarioModal = 'goal';
    state.generatedAiProcess ||= {};
    state.generatedAiProcess.goals = [...aiState.goals];
  } else {
    aiState.sessions.push({ branches:[...aiState.scope], entries:proposals });
    state.newKtScenario = true;
    state.ktOpen = true;
    state.layer = 'checkpoints';
    state.scenarioModal = 'kt';
    state.generatedAiProcess ||= {};
    state.generatedAiProcess.checkpoints = aiState.sessions.flatMap(session=>session.entries||[]);
  }
  const count = proposals.length;
  const mode = aiState.mode;
  aiState.mode = null;
  render();
  toast(`${count} ${mode === 'elements' ? 'элементов добавлено на канву' : mode === 'goals' ? 'целей добавлено в сценарий' : 'сессий КТ добавлено в сценарий'}`);
}

function aiModalMarkup() {
  if (!aiState.mode) return '';
  const mode = aiState.mode;
  const title = mode === 'elements' ? 'Наполнить этапы с AI' : mode === 'goals' ? 'Предложить цели с AI' : 'Предложить контрольные точки с AI';
  const configure = aiState.step === 'configure';
  return `<div class="modal ai-modal"><section class="dialog ai-dialog" role="dialog" aria-modal="true" aria-label="${title}">
    <header class="dialog-head"><div><span class="tag blue">AI · живой подбор</span><h2>${title}</h2></div><button class="btn icon-only" data-ai-close title="Закрыть">×</button></header>
    <div class="ai-stepbar"><span class="${configure?'active':''}">1 · Контекст</span><span class="${configure?'':'active'}">2 · Проверка предложений</span></div>
    ${configure ? aiConfigureMarkup(mode) : aiReviewMarkup(mode)}
    <footer class="dialog-foot">${configure ? `<button class="btn" data-ai-close>Отмена</button><button class="btn primary" data-ai-generate>Сформировать предложения</button>` : `<button class="btn" data-ai-back>← Контекст</button><button class="btn primary" data-ai-apply>Добавить выбранное</button>`}</footer>
  </section></div>`;
}

function aiConfigureMarkup(mode) {
  return `<div class="dialog-body ai-body"><p class="ai-disclaimer">AI учитывает выбранные ветки, этапы, участников и объекты каталога. Предложения добавятся только после вашей проверки.</p>
    ${mode === 'goals' && aiState.creator !== 'Администратор' ? '<p class="ai-disclaimer">После добавления предложенных целей в этом сценарии будет выбрано «Цели создаёт администратор». Если закрыть окно без добавления, настройка не изменится.</p>' : ''}
    <section class="ai-section"><h3>Ветки и аудитория</h3><p>ИИ учитывает должности и подразделения из условий каждой ветки. Общий контур не подменяет ролевую ветку.</p><div id="aiScope" class="ai-check-grid">${branches.map(branch => `<label><input type="checkbox" value="${escapeAi(branch.id)}" ${aiState.scope.includes(branch.id)?'checked':''}><span><b>${escapeAi(branch.name)}</b><small>${escapeAi(contextualDescription(branch))}</small></span></label>`).join('')}</div></section>
    ${mode === 'elements' ? `<section class="ai-section"><h3>Этапы для наполнения</h3><div id="aiStages" class="ai-stage-grid">${stages.map(stage => `<label><input type="checkbox" value="${escapeAi(stage.id)}" ${aiState.stages.includes(stage.id)?'checked':''}>${escapeAi(stage.name)} <small>${escapeAi(stage.days)}</small></label>`).join('')}</div></section><section class="ai-section"><h3>Источники</h3><div class="ai-source-grid"><label><input id="aiSourceCatalog" type="checkbox" checked> Каталог курсов</label><label><input id="aiSourceTasks" type="checkbox" checked> Шаблоны задач</label><label><input id="aiSourceKnowledge" type="checkbox" checked> Статьи, файлы и ссылки</label></div></section>` : `<section class="ai-section"><h3>Источники</h3><p>${mode === 'goals' ? 'Каталог целей и уже добавленные в выбранные ветки элементы. Промежуточный результат связывается только с подходящими элементами.' : 'Структура плана, длительность этапов и сценарии прошлых КТ. Для каждой сессии предлагаются срок, повестка и вопросы пульса.'}</p></section>`}
    <label class="ai-history"><input type="checkbox" id="aiHistory" checked><span><b>Учитывать исторические сигналы</b><small>Агрегированные затруднения похожих должностей и подразделений; без персональных ответов сотрудников.</small></span></label><p id="aiError" class="ai-error" role="alert"></p>
  </div>`;
}

function aiReviewMarkup(mode) {
  const scopeNames = aiState.scope.map(id => aiBranch(id)?.name).filter(Boolean);
  return `<div class="dialog-body ai-body"><div class="ai-review-intro"><div><b>${aiState.proposals.length} предложений</b><span>Для веток: ${escapeAi(scopeNames.join(', '))}</span></div><span class="tag blue">Только после подтверждения</span></div>
    <p class="ai-disclaimer">Проверьте содержание, этап, сроки и связи. Снимите отметку с неподходящих предложений; после добавления их можно отредактировать в канве.</p>
    <div class="ai-proposals">${aiState.proposals.map(proposal => `<article class="ai-proposal" data-ai-proposal="${escapeAi(proposal.id)}"><label class="ai-proposal-head"><input class="ai-proposal-check" type="checkbox" value="${escapeAi(proposal.id)}" checked><span>${mode === 'elements' ? `${escapeAi(aiBranch(proposal.branchId)?.name)} · ${escapeAi(aiStage(proposal.stageId)?.name)}` : mode === 'goals' ? escapeAi(aiBranch(proposal.branchId)?.name) : `КТ · ${escapeAi(aiState.scope.map(id=>aiBranch(id)?.name).join(', '))}`}</span><small>${escapeAi(proposal.source || 'Сессия КТ')}</small></label>
      <label class="ai-input-label">${mode === 'checkpoints' ? 'Название встречи' : mode === 'goals' ? 'Цель' : 'Название элемента'}<input data-ai-title value="${escapeAi(proposal.title)}"></label>
      ${mode === 'goals' ? `<label class="ai-input-label">Промежуточный результат<input data-ai-result value="${escapeAi(proposal.result)}"></label><label class="ai-input-label ai-day">Срок, день плана<input data-ai-day type="number" min="1" max="${aiPlanEnd()}" value="${proposal.day}"></label><div class="ai-links"><b>Связать результат с элементами</b>${proposal.candidates.length ? proposal.candidates.map(item => `<label><input data-ai-link type="checkbox" value="${escapeAi(item.id)}" ${proposal.linked.some(link=>link.id===item.id)?'checked':''}> ↗ ${escapeAi(item.title)} <small>${escapeAi(aiBranch(item.cell.split('-')[0])?.name || 'Общий контур')}</small></label>`).join('') : '<span class="ai-empty-link">В этой ветке пока нет подходящих элементов. Добавьте их на канву, затем выберите связь.</span>'}</div>` : ''}
      ${mode === 'checkpoints' ? `<label class="ai-input-label ai-day">День плана<input data-ai-day type="number" min="1" max="${aiPlanEnd()}" value="${proposal.day}"></label><label class="ai-input-label">Повестка<textarea data-ai-agenda rows="2">${escapeAi(proposal.agenda)}</textarea></label><label class="ai-input-label">Вопросы пульса<textarea data-ai-pulse rows="2">${escapeAi(proposal.pulse)}</textarea></label>` : ''}
      <p class="ai-reason">Почему предложено: ${escapeAi(proposal.reason)}</p></article>`).join('')}</div><p id="aiReviewError" class="ai-error" role="alert"></p></div>`;
}

function wireAi() {
  if (state.screen !== 'editor') return;
  const branchDialog = $('#branchModal');
  if (branchDialog) {
    const selected = branches.find(branch => branch.id === state.editBranchId);
    const rows = $$('.condition-builder .condition-row', branchDialog);
    const prior = selected?.conditions || [];
    rows.forEach((row, index) => {
      const field = $('select', row);
      const matching = prior.find(condition => condition.startsWith(`${field.options[1]?.textContent || field.value}:`) || condition.startsWith(`${index === 0 ? 'Должность' : 'Подразделение'}:`));
      const value = matching?.split(':').slice(1).join(':').trim() || '';
      row.querySelector('.condition-values').innerHTML = `<input class="ai-condition-input" placeholder="${index === 0 ? 'Например: курьер, водитель' : 'Например: доставка и дочерние'}" value="${escapeAi(value)}" data-ai-condition="${index}">`;
    });
    $('[data-action="saveBranch"]', branchDialog).onclick = () => {
      const name = $('#branchName').value.trim() || 'Новая ветка';
      const conditions = rows.map((row, index) => {
        const field = $('select', row).value;
        const value = $(`[data-ai-condition="${index}"]`, row).value.trim();
        return value ? `${field === 'Выберите поле' ? index === 0 ? 'Должность' : 'Подразделение' : field}: ${value}` : null;
      }).filter(Boolean);
      if (state.editBranchId) {
        const branch = aiBranch(state.editBranchId);
        if (branch) { branch.name = name; branch.conditions = conditions.length ? conditions : branch.conditions; }
      } else {
        branches.push({ id:`branch${branches.length + 1}`, name, meta:['Новая ветка','0 элементов'], desc:conditions.join(' · ') || 'Настройте аудиторию ветки', conditions });
      }
      state.editBranchId = null;
      branchDialog.hidden = true;
      render();
      toast('Ветка и условия аудитории сохранены');
    };
  }
  if (state.step === 'canvas' && state.view === 'canvas' && stages.length && branches.length) {
    const tools = $('.canvas-tools');
    const button = document.createElement('button');
    button.className = 'btn ai-canvas-button';
    button.type = 'button';
    button.textContent = '✦ Предложить элементы с AI';
    button.title = 'Подбор из каталога курсов, шаблонов задач и материалов по условиям веток и истории';
    button.onclick = () => aiOpen('elements');
    tools?.querySelector('.layer-switch')?.before(button);
    if (aiState.goals.length) {
      const card = $('.scenario-card[data-open-scenario="goal"]');
      const names = [...new Set(aiState.goals.map(goal => aiBranch(goal.branchId)?.name).filter(Boolean))];
      if (card) { card.querySelector('b').textContent = names.join(', '); card.querySelector('small').textContent = `Цели создаёт администратор · ${aiState.goals.length} целей`; card.querySelector('.goal-result').innerHTML = `${aiState.goals.length} целей · ${aiState.goals.reduce((sum, goal) => sum + goal.linked.length, 0)} связей с элементами`; }
    }
    if (aiState.sessions.length) {
      const card = $('.checkpoint-card[data-open-scenario="kt"]');
      const group = aiState.sessions.at(-1);
      if (card) { card.querySelector('b').textContent = group.branches.map(id => aiBranch(id)?.name).filter(Boolean).join(', '); card.querySelector('.session-row').innerHTML = group.entries.map(entry => `<span>${entry.day} день · ${escapeAi(entry.title)}</span>`).join(''); }
    }
  }
  if (state.scenarioModal && !$('.clean-scenario-dialog')) {
    const goal = state.scenarioModal.startsWith('goal');
    const dialog = $('.scenario-dialog-v4');
    const creator = goal ? $('.form-grid select', dialog) : null;
    if (creator) { creator.id = 'aiScenarioCreator'; creator.value = aiState.creator; }
    if (goal && aiState.goals.length) dialog.querySelector('.dialog-head h2').textContent = 'Цели создаёт администратор';
    $$('.scenario-scope .branch-checks input', dialog).forEach((input, index) => {
      if (index < branches.length) { input.dataset.aiBranch = '1'; input.value = branches[index].id; if (aiState.scenarioScope.length) input.checked = aiState.scenarioScope.includes(input.value); }
    });
    const button = document.createElement('button');
    button.className = 'btn ai-scenario-button';
    button.type = 'button';
    button.textContent = goal ? '✦ Предложить цели с AI' : '✦ Предложить КТ с AI';
    button.title = goal ? 'Предложить цели по выбранным веткам; после добавления цели создаёт администратор' : 'Предложить сроки, повестку и вопросы пульса для выбранных веток';
    creator?.addEventListener('change', () => { aiState.creator = creator.value; });
    button.onclick = () => aiOpen(goal ? 'goals' : 'checkpoints');
    dialog?.querySelector('.scenario-contents .section-head')?.append(button);
    const proposals = goal ? aiState.goals : aiState.sessions.flatMap(group => group.entries);
    if (proposals.length) {
      const list = document.createElement('div');
      list.className = 'ai-applied-list';
      list.innerHTML = `<b>Предложения AI в сценарии · ${proposals.length}</b>${proposals.map(proposal => `<div><strong>${escapeAi(proposal.title)}</strong><small>${goal ? `Результат: ${escapeAi(proposal.result)} · ${proposal.linked.length} связей с элементами` : `${proposal.day} день · ${escapeAi(proposal.agenda)}`}</small></div>`).join('')}`;
      dialog?.querySelector('.scenario-contents')?.append(list);
    }
  }
  if (!aiState.mode) return;
  $('#app').insertAdjacentHTML('beforeend', aiModalMarkup());
  $$('[data-ai-close]').forEach(button => button.onclick = () => { aiState.mode = null; render(); });
  $('[data-ai-generate]')?.addEventListener('click', aiGenerate);
  $('[data-ai-back]')?.addEventListener('click', () => { aiState.step = 'configure'; render(); });
  $('[data-ai-apply]')?.addEventListener('click', aiApply);
}

const originalAiBind = bind;
bind = function () { originalAiBind(); wireAi(); };
const originalAiStart = startNewWorkflow;
startNewWorkflow = function () { aiState.mode = null; aiState.goals = []; aiState.sessions = []; aiState.creator = 'Руководитель'; aiState.scenarioScope = []; originalAiStart(); };
const originalAiLoad = loadWorkflow;
loadWorkflow = function (id) { aiState.mode = null; aiState.goals = []; aiState.sessions = []; aiState.creator = 'Руководитель'; aiState.scenarioScope = []; originalAiLoad(id); };
render();
