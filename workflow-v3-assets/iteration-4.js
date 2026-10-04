// Local iteration 4: clean full-screen process and contextual add flows.
(() => {
  state.cleanAddOpen ??= false;
  state.cleanPaletteOpened ??= false;
  state.cleanCatalogType ??= '';
  state.outcomeModal ??= null;
  state.goalScenarios ??= [];
  state.ktScenarios ??= [];
  state.outcomeRules ??= {
    'base-day1-1': { condition:'Не пройден в срок', action:'Уведомить руководителя и сотрудника' },
    'base-immerse-0': { condition:'Результат ниже 80%', action:'Назначить дополнительный тест' }
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

  const iconByType = { course:'▣', task:'✓', article:'≡', file:'⇩', test:'□', survey:'◉', action:'⚙', checkpoint:'◆', goal:'◎', meeting:'◈' };
  const labelByType = { course:'Курс / программа', task:'Задача', article:'Статья', file:'Файл', test:'Тест', survey:'Опрос', action:'Системное действие', checkpoint:'Шаблон контрольной точки', goal:'Шаблон цели', meeting:'Встреча' };
  const elementRows = () => {
    const db = window.SkillazDemoDB?.catalogs || {};
    const production = window.SkillazProductionCatalog?.elements || [];
    const order = state.cleanCatalogType ? [state.cleanCatalogType] : ['course','article','file','task','test','survey','action','goal','checkpoint'];
    const source = {course:'LMS',article:'База знаний',file:'Файлы клиента',task:'Шаблоны задач',test:'Оценка знаний',survey:'Опросы',action:'Skillaz',goal:'Каталог целей',checkpoint:'Каталог КТ'};
    const usage = {course:'Назначается сотруднику',article:'Открывается в плане',file:'Доступен для скачивания',task:'Создаёт задачу исполнителю',test:'Сохраняет результат',survey:'Собирает обратную связь',action:'Выполняется автоматически',goal:'Создаётся по сценарию целей',checkpoint:'Запускается по сценарию КТ'};
    return order.flatMap(type => {
      const liveRows = production.filter(row => row.type === type).slice(0,12).map(row => ({id:row.id,type,title:row.title,meta:row.description,source:row.source,usage:usage[type]}));
      return liveRows.length ? liveRows : (db[type] || []).slice(0,12).map(row => ({id:row[0],type,title:row[1],meta:row[2],source:source[type],usage:usage[type]}));
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
      <div class="creation-method-tabs"><button class="active">Выбрать вручную</button><button data-clean-ai-elements>✦ Подобрать с AI</button></div>
      <div class="palette-search"><input class="search" placeholder="Поиск по названию и источнику"></div>
      <div class="catalog-summary"><b>${rows.length} элементов</b><span>Из разрешённых справочников клиента</span></div>
      <div class="palette-list clean-catalog-list">${rows.map(row => `<div class="palette-card rich-palette-card" draggable="true" data-drag-type="${row.type}" data-drag-title="${row.title}"><span class="type-icon">${iconByType[row.type] || '□'}</span><div><b>${row.title}</b><small>${labelByType[row.type]} · ${row.meta}</small><span class="catalog-meta"><em>${row.source}</em><em>${row.usage}</em><em>ID ${row.id}</em></span></div></div>`).join('')}</div>
    </aside>`;
  };

  const cleanAddMenu = () => !state.cleanAddOpen ? '' : `<div class="clean-add-menu">
    <header><b>Добавить в процесс</b><button class="btn icon-only small" data-clean-action="close-add">×</button></header>
    <button data-clean-element-type="task"><i>✓</i><span><b>Задача</b><small>Действие сотрудника или участника</small></span></button>
    <button data-clean-element-type="action"><i>⚙</i><span><b>Системное действие</b><small>Выполняется автоматически</small></span></button>
    <button data-clean-element-type="course"><i>▣</i><span><b>Курс / программа</b><small>Объект из LMS</small></span></button>
    <button data-clean-element-type="article"><i>≡</i><span><b>Статья</b><small>Материал из Базы знаний</small></span></button>
    <button data-clean-element-type="file"><i>⇩</i><span><b>Файл</b><small>PDF, документ или рабочая памятка</small></span></button>
    <button data-clean-element-type="test"><i>□</i><span><b>Тест</b><small>Проверка знаний с результатом</small></span></button>
    <button data-clean-element-type="survey"><i>◉</i><span><b>Опрос</b><small>Пульс или обратная связь</small></span></button>
    <button data-clean-element-type="goal"><i>◎</i><span><b>Цель</b><small>Шаблон цели из каталога</small></span></button>
    <button data-clean-element-type="checkpoint"><i>◆</i><span><b>Контрольная точка</b><small>Шаблон КТ из каталога</small></span></button>
    <button data-action="addBranch"><i>◇</i><span><b>Условие</b><small>Настроить вариант пути</small></span></button>
    <button class="clean-ai-pick" data-clean-action="ai-elements"><i>✦</i><span><b>Подобрать с AI</b><small>Агент предложит элементы из разрешённых каталогов</small></span></button>
    <div class="clean-structure-actions"><span>Структура процесса</span><button data-action="addStage">＋ Этап</button><button data-action="addBranch">＋ Ветка</button></div>
  </div>`;

  const cleanProcessPage = () => {
    return `<div class="generated-clean">
      <button class="btn clean-canvas-add" data-clean-action="toggle-add">＋ Добавить</button>
      ${previousCanvasPage()}
      ${cleanAddMenu()}
    </div>`;
  };

  // Goals and checkpoints are part of the process itself. Keep both rails in
  // the canvas instead of making the administrator switch between layers.
  scenarioRail = () => {
    state.goalsOpen = true;
    const cards = [];
    if (aiState.goals?.length) {
      const scopeNames = [...new Set(aiState.goals.map(goal=>branches.find(branch=>branch.id===goal.branchId)?.name).filter(Boolean))];
      cards.push(`<article class="scenario-card compact-scenario-card" data-open-scenario="goal"><span class="tag purple">AI · сценарий целей</span><b>${safe4(scopeNames.join(', ') || 'Выбранные ветки')}</b><small>Цели создаёт ${safe4(aiState.creator || 'администратор')} · ${aiState.goals.length} шаблона добавлено</small><button class="btn small">Настроить сценарий</button></article>`);
    }
    state.goalScenarios.forEach((scenario,index)=>{
      const scopeNames = scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean);
      cards.push(`<article class="scenario-card compact-scenario-card" data-open-scenario="goal-manual-${index}"><span class="tag purple">Сценарий целей</span><b>${safe4(scopeNames.join(', ') || 'Все ветки')}</b><small>Цели создаёт ${safe4(scenario.creator)} · ${safe4(scenario.timing)}</small><button class="btn small">Изменить</button></article>`);
    });
    return `<section class="scenario-rail expanded live-scenario-rail clean-scenario-rail"><div class="rail-label"><b>Сценарии целей</b><small>Сценарий задаёт ветки, автора и срок. Сами цели добавляются через «Добавить».</small></div><div class="scenario-cards">${cards.join('') || '<div class="rail-empty-inline"><b>Сценариев пока нет</b><span>Создайте отдельные сценарии для кассиров, продавцов или сотрудников выкладки.</span></div>'}<button class="btn small" data-action="addGoalScenario">＋ Сценарий целей</button></div></section>`;
  };

  scenarioModalV4 = () => {
    if (!state.scenarioModal) return '';
    const goalMode = state.scenarioModal.startsWith('goal');
    const match = state.scenarioModal.match(/manual-(\d+)$/);
    const collection = goalMode ? state.goalScenarios : state.ktScenarios;
    const existing = match ? collection[Number(match[1])] : null;
    const aiBranches = goalMode ? [...new Set((aiState.goals||[]).map(goal=>goal.branchId))] : [...new Set((aiState.sessions||[]).flatMap(session=>session.branches||[]))];
    const selected = existing?.branches?.length ? existing.branches : aiBranches.length ? aiBranches : branches.slice(0,2).map(branch=>branch.id);
    return `<div class="modal"><section class="dialog scenario-dialog-v4 clean-scenario-dialog"><header class="dialog-head"><div><span class="tag ${goalMode?'purple':'amber'}">${goalMode?'Сценарий целей':'Сценарий контрольных точек'}</span><h2>${existing?'Изменить сценарий':'Новый сценарий'}</h2><p>Настройте правило создания для выбранных веток процесса.</p></div><button class="btn icon-only" data-action="closeScenario">×</button></header><div class="dialog-body"><section class="scenario-scope"><div><b>Для каких веток работает сценарий</b><p class="muted">Можно создать отдельные сценарии для кассиров, продавцов, выкладки и других вариантов пути.</p></div><div class="branch-checks">${branches.map(branch=>`<label><input type="checkbox" data-scenario-branch value="${branch.id}" ${selected.includes(branch.id)?'checked':''}> ${safe4(branch.name)}</label>`).join('')}</div></section>${goalMode?`<div class="form-grid"><div class="field"><label>Кто создаёт цели</label><select data-scenario-creator><option ${existing?.creator==='Администратор'?'selected':''}>Администратор</option><option ${existing?.creator==='Руководитель'?'selected':''}>Руководитель</option><option ${existing?.creator==='Сотрудник'?'selected':''}>Сотрудник</option></select></div><div class="field"><label>Когда создать цели</label><select data-scenario-timing><option>При назначении плана</option><option ${existing?.timing==='В первый день'?'selected':''}>В первый день</option><option ${existing?.timing==='До 5 дня плана'?'selected':''}>До 5 дня плана</option></select></div></div>`:`<div class="form-grid"><div class="field"><label>Ответственный за КТ</label><select data-scenario-creator><option ${existing?.creator==='Руководитель'?'selected':''}>Руководитель</option><option ${existing?.creator==='Наставник'?'selected':''}>Наставник</option><option ${existing?.creator==='Бизнес-роль'?'selected':''}>Бизнес-роль</option></select></div><div class="field"><label>Когда запускать</label><select data-scenario-timing><option>По срокам шаблонов КТ</option><option ${existing?.timing==='После завершения этапа'?'selected':''}>После завершения этапа</option><option ${existing?.timing==='По результату элемента'?'selected':''}>По результату элемента</option></select></div></div>`}<section class="scenario-catalog-note"><b>${goalMode?'Цели':'Шаблоны контрольных точек'} добавляются отдельно</b><span>Используйте кнопку «＋ Добавить» на канве и выберите ${goalMode?'«Цель»':'«Контрольная точка»'} из каталога. Так один сценарий можно наполнить разными шаблонами.</span></section></div><footer class="dialog-foot"><button class="btn" data-action="closeScenario">Отмена</button><button class="btn primary" data-action="saveScenario" data-scenario-kind="${goalMode?'goal':'kt'}" data-scenario-index="${match?match[1]:''}">${existing?'Сохранить':'Создать сценарий'}</button></footer></section></div>`;
  };
  checkpointRail = () => {
    state.ktOpen = true;
    const entries = (aiState.sessions || []).flatMap(session=>session.entries||[]);
    const cards = [];
    if (entries.length) {
      const scopeIds = (aiState.sessions || []).flatMap(session=>session.branches||[]);
      const scopeNames = [...new Set(scopeIds.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean))];
      cards.push(`<article class="checkpoint-card compact-scenario-card" data-open-scenario="kt"><span class="tag amber">AI · сценарий КТ</span><b>${safe4(scopeNames.join(', ') || 'Выбранные ветки')}</b><small>${entries.length} шаблона добавлено · по срокам элементов</small><button class="btn small">Настроить сценарий</button></article>`);
    }
    state.ktScenarios.forEach((scenario,index)=>{
      const scopeNames = scenario.branches.map(id=>branches.find(branch=>branch.id===id)?.name).filter(Boolean);
      cards.push(`<article class="checkpoint-card compact-scenario-card" data-open-scenario="kt-manual-${index}"><span class="tag amber">Сценарий КТ</span><b>${safe4(scopeNames.join(', ') || 'Все ветки')}</b><small>${safe4(scenario.creator)} · ${safe4(scenario.timing)}</small><button class="btn small">Изменить</button></article>`);
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

  bind = function () {
    previousBind();
    if (document.querySelector('.live-scenario-contents')) document.querySelectorAll('.ai-applied-list').forEach(node => node.remove());
    const goalScenario = document.querySelector('.scenario-rail .scenario-card');
    const checkpointScenario = document.querySelector('.checkpoint-rail .checkpoint-card');
    if (goalScenario) {
      goalScenario.dataset.focus = 'goals';
      goalScenario.onclick = event => {
        if (event.target.closest('button')) {
          state.scenarioModal = goalScenario.dataset.openScenario || 'goal';
        } else {
          state.focus = state.focus === 'goals' ? null : 'goals';
        }
        render();
      };
    }
    if (checkpointScenario) {
      checkpointScenario.dataset.focus = 'kt-standard';
      checkpointScenario.onclick = event => {
        if (event.target.closest('button')) {
          state.scenarioModal = checkpointScenario.dataset.openScenario || 'kt';
        } else {
          state.focus = state.focus === 'kt-standard' ? null : 'kt-standard';
        }
        render();
      };
    }
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
    if (elementAi) elementAi.onclick = () => document.querySelector('.ai-canvas-button')?.click();

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
  };

  if (!window.__workflowIterationFourBound) {
    window.__workflowIterationFourBound = true;
    document.addEventListener('click', event => {
      const save = event.target.closest('[data-action="saveScenario"][data-scenario-kind]');
      if (!save) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const branchIds = [...document.querySelectorAll('[data-scenario-branch]:checked')].map(input=>input.value);
      if (!branchIds.length) { toast('Выберите хотя бы одну ветку'); return; }
      const scenario = {
        branches:branchIds,
        creator:document.querySelector('[data-scenario-creator]')?.value || (save.dataset.scenarioKind==='goal'?'Администратор':'Руководитель'),
        timing:document.querySelector('[data-scenario-timing]')?.value || 'При назначении плана'
      };
      const collection = save.dataset.scenarioKind === 'goal' ? state.goalScenarios : state.ktScenarios;
      const index = save.dataset.scenarioIndex === '' ? -1 : Number(save.dataset.scenarioIndex);
      if (index >= 0) collection[index] = scenario; else collection.push(scenario);
      if (save.dataset.scenarioKind === 'goal') state.newGoalScenario = true; else state.newKtScenario = true;
      state.scenarioModal = null;
      render();
      toast('Сценарий сохранён. Добавьте шаблоны через кнопку «Добавить»');
    }, true);
    document.addEventListener('click', event => {
      const node = event.target.closest('[data-clean-action]');
      const elementNode = event.target.closest('[data-clean-element-type]');
      if (elementNode) {
        event.preventDefault();
        state.cleanAddOpen = false;
        state.cleanCatalogType = elementNode.dataset.cleanElementType;
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
})();
