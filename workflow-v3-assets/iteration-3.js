// Local iteration 3: participants assistant, generated process and table list.
(() => {
  state.participantAssistantOpen ??= false;
  state.participantAssistantStep ??= 1;
  state.participantUserMessages ??= {};
  state.coordinatorRule ??= '';
  state.generatedProcess ??= false;
  state.participantLivePrompt ??= null;
  state.participantLiveSuggestions ??= [];
  state.participantLiveHistory ??= [];
  state.participantBusy ??= false;
  state.participantError ??= '';
  state.processGenerating ??= false;
  state.rolePickerOpen ??= false;
  state.roleEditIndex ??= null;
  state.demoDraftId ??= null;

  const previousHub = hub;
  const previousEditor = editor;
  const previousParticipantsPage = participantsPageV2;
  const previousCanvasPage = canvasPage;

  const baseRoleDirectory = [
    { name:'Наставник логистического центра', scope:'Логистический центр · свое подразделение', source:'Справочник бизнес-ролей', use:'Практика и обратная связь' },
    { name:'HRBP логистического центра', scope:'Логистическая сеть', source:'Справочник бизнес-ролей', use:'Сопровождение и эскалации' },
    { name:'Эксперт по охране труда', scope:'Все подразделения', source:'Справочник бизнес-ролей', use:'Проверка обязательного допуска' },
    { name:'Специалист IT / IAM', scope:'Все подразделения', source:'Справочник бизнес-ролей', use:'Доступы и рабочие системы' },
    { name:'Руководитель подразделения', scope:'По оргструктуре сотрудника', source:'Системная связь', use:'Контрольные встречи и решения' }
  ];
  const participantContext = () => [state.assistantAnswers?.audience,state.assistantAnswers?.result,state.manualLaunch?.audience,...(state.assistantLiveHistory||[]).map(item=>item.text)].filter(Boolean).join(' ');
  const roleDirectory = () => {
    const rows = window.SkillazReferenceData?.relevantBusinessRoles(participantContext(),18) || [];
    if (!rows.length) return baseRoleDirectory;
    return rows.map(row=>({name:row.name,scope:row.assignmentRule,source:'Справочник бизнес-ролей',use:row.purpose,assignmentType:row.assignmentType,domain:row.domain}));
  };
  const participantSuggestions = step => {
    const rows = roleDirectory();
    const dominantDomain = rows[0]?.domain;
    const scopedRows = dominantDomain ? rows.filter(row=>row.domain===dominantDomain) : rows;
    if (step === 2) return scopedRows.filter(row=>row.assignmentType==='administrative').slice(0,3).map(row=>row.name).concat(['Назначающий администратор']).slice(0,4);
    const functional = scopedRows.filter(row=>row.assignmentType!=='administrative');
    const source = functional.length ? functional : scopedRows;
    return [source.slice(0,3),[source[0],source[3]].filter(Boolean),source.slice(1,4)].filter(group=>group.length).map(group=>group.map(row=>row.name).join(', '));
  };

  const rolePicker = () => {
    if (!state.rolePickerOpen) return '';
    const contextual = roleDirectory();
    const preferredDomain = contextual[0]?.domain;
    const all = (window.SkillazReferenceData?.businessRoles || []).map(row=>({name:row.name,scope:row.assignmentRule,source:'Справочник бизнес-ролей',use:row.purpose,assignmentType:row.assignmentType,domain:row.domain}));
    const rows = [...contextual,...all.filter(row=>!contextual.some(item=>item.name===row.name))];
    const labels = {retail:'Розница',logistics:'Логистика',production:'Производство',office:'Офис'};
    return `<div class="local-overlay role-picker-overlay" role="dialog" aria-modal="true" aria-label="Справочник бизнес-ролей"><section class="role-picker-card"><header><div><span class="tag blue">Справочник бизнес-ролей</span><h2>${state.roleEditIndex===null?'Добавить бизнес-роль':'Изменить бизнес-роль'}</h2><p>Сначала показаны роли, подходящие выбранной структуре, должностям и сценарию.</p></div><button class="btn icon-only" data-role-action="close-picker">×</button></header><div class="role-picker-search"><input placeholder="Найти роль по названию" data-role-search><span>${rows.length} ролей</span></div><div class="role-picker-list">${rows.map((role,index)=>`<button data-role-action="select-role" data-role-name="${safe(role.name)}" data-role-search-text="${safe(`${role.name} ${role.use} ${labels[role.domain]||role.domain}`.toLowerCase())}" class="${role.domain===preferredDomain?'recommended':''}"><span><b>${safe(role.name)}</b><small>${safe(role.use)}</small></span><em>${safe(labels[role.domain]||role.domain)} · ${role.assignmentType==='administrative'?'Административная':'Функциональная'}</em>${role.domain===preferredDomain&&index<6?'<i>Рекомендуется</i>':''}</button>`).join('')}</div><footer><button class="btn" data-role-action="close-picker">Отмена</button></footer></section></div>`;
  };

  const safe = value => String(value || '').replace(/[&<>"']/g, symbol => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[symbol]));

  const clone = value => JSON.parse(JSON.stringify(value));
  const draftSnapshot = () => ({
    stages:clone(stages), branches:clone(branches), items:clone(state.items || {}), extras:clone(extras || {}),
    state:clone({processTitle:state.processTitle,assistantAnswers:state.assistantAnswers,manualLaunch:state.manualLaunch,launchConfigured:state.launchConfigured,scopeSelections:state.scopeSelections,newRoles:state.newRoles,coordinatorRule:state.coordinatorRule,generatedProcess:state.generatedProcess,generatedAiProcess:state.generatedAiProcess,goalScenarios:state.goalScenarios,ktScenarios:state.ktScenarios,outcomeRules:state.outcomeRules,generatedGoalTemplates:state.generatedGoalTemplates,generatedKtTemplates:state.generatedKtTemplates,goalPlacements:state.goalPlacements,ktPlacements:state.ktPlacements,activeTemplateScenario:state.activeTemplateScenario}),
    ai:typeof aiState === 'object' ? clone({goals:aiState.goals,sessions:aiState.sessions,creator:aiState.creator}) : null
  });
  const persistDraft = () => {
    if (!state.demoDraftId || !state.newWorkflow || !window.SkillazDemoDB) return;
    const existing = window.SkillazDemoDB.loadProcesses().find(row=>row.id===state.demoDraftId);
    const now = new Date();
    const title = state.processTitle || state.assistantAnswers?.scenario || 'Новый процесс';
    const count = Object.values(state.items || {}).reduce((sum,list)=>sum+list.length,0);
    window.SkillazDemoDB.saveProcess({id:state.demoDraftId,title,scenario:state.assistantAnswers?.scenario||'Черновик',status:'Черновик',branches:branches.length,elements:count,createdAt:existing?.createdAt||now.toISOString(),updatedAt:now.toISOString(),deletable:true});
    window.SkillazDemoDB.saveWorkflow(state.demoDraftId,draftSnapshot());
  };
  const openDraft = id => {
    const saved = window.SkillazDemoDB?.loadWorkflow(id);
    if (!saved) return;
    stages.splice(0,stages.length,...clone(saved.stages || []));
    branches.splice(0,branches.length,...clone(saved.branches || []));
    state.items = clone(saved.items || {});
    extras = clone(saved.extras || {});
    Object.assign(state,clone(saved.state || {}),{screen:'editor',step:'base',view:'canvas',layer:'process',newWorkflow:true,workflow:id,demoDraftId:id,paletteOpen:false,rolePickerOpen:false,participantAssistantOpen:false});
    ensureCommonBranch();
    if (saved.ai && typeof aiState === 'object') Object.assign(aiState,clone(saved.ai));
    render();
  };
  const formatDraftDate = value => {
    const date = new Date(value || Date.now());
    return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(date).replace(',',' ·');
  };

  const tableHub = () => {
    const inherited = previousHub();
    const overlayIndex = inherited.indexOf('<div class="local-overlay');
    const overlays = overlayIndex >= 0 ? inherited.slice(overlayIndex) : '';
    const rows = [
      {id:'courier',title:'Новый сотрудник логистического центра',scenario:'Новый сотрудник',status:'Черновик',branches:'4',elements:'96',updated:'Сегодня, 12:40'},
      {id:'courier',title:'Пребординг массовых сотрудников',scenario:'Пребординг',status:'Опубликован',branches:'4',elements:'42',updated:'Вчера, 18:10'},
      {id:'manager',title:'Вход руководителя клиентского офиса',scenario:'Новая роль',status:'Черновик',branches:'3',elements:'82',updated:'29 сентября'},
      {id:'courier',title:'Новый сотрудник розничной сети',scenario:'Новый сотрудник',status:'На проверке',branches:'3',elements:'54',updated:'27 сентября'}
    ];
    const drafts = (window.SkillazDemoDB?.loadProcesses() || []).map(row=>({...row,updated:formatDraftDate(row.updatedAt),custom:true}));
    const allRows = [...drafts,...rows];
    return `<div class="hub process-hub"><header class="topbar"><div class="brand"><span class="brand-mark">S</span>Skillaz Start</div><div class="crumb">Процессы входа в роль</div><div class="topbar-spacer"></div><button class="btn">Справка</button></header>
      <main class="hub-main process-list-page"><div class="hub-head"><div><h1>Процессы</h1><p class="muted">Пребординг, новый сотрудник и вход в новую роль.</p></div><button class="btn primary" data-action="new">＋ Новый процесс</button></div>
      <div class="process-list-controls"><div class="process-search">⌕ <input placeholder="Найти процесс" data-process-search></div><button class="btn">Все сценарии</button><button class="btn">Все статусы</button><span>${allRows.length} процессов</span></div>
      <section class="process-table"><div class="process-row process-head"><span>Название</span><span>Сценарий</span><span>Статус</span><span>Ветки</span><span>Элементы</span><span>Изменён</span><span></span></div>
      ${allRows.map(row => `<div class="process-row" data-process-search-row="${safe(`${row.title} ${row.scenario} ${row.status}`.toLowerCase())}"><span><b>${safe(row.title)}</b><small>${row.custom?'Локальный демо-черновик':'Автоматический запуск · мастер-система'}</small></span><span>${safe(row.scenario)}</span><span><i class="status-pill ${row.status === 'Опубликован' ? 'green' : row.status === 'На проверке' ? 'amber' : ''}">${safe(row.status)}</i></span><span>${row.branches}</span><span>${row.elements}</span><span>${safe(row.updated)}</span><span class="process-row-actions"><button class="btn small" ${row.custom?`data-demo-draft="${row.id}"`:`data-workflow="${row.id}"`}>Открыть</button>${row.custom?`<button class="btn icon-only small danger" data-delete-demo-draft="${row.id}" title="Удалить черновик">×</button>`:''}</span></div>`).join('')}</section>
      </main></div>${overlays}`;
  };

  const canvasType = type => ({test:'assessment',checkpoint:'assessment',meeting:'task',action:'task',goal:'task'}[type] || type || 'task');
  const needsCommonBranch = () => /общая часть|вариант/i.test(String(state.assistantAnswers?.pathType || ''));
  const ensureCommonBranch = () => {
    if (!needsCommonBranch() || !branches.length || branches.some(branch=>branch.id==='base')) return;
    const commonIndex = branches.findIndex((branch,index)=>index===0 && /вся выбранная|общая часть|общий контур|^true$/i.test(`${branch.name} ${branch.desc||''} ${(branch.conditions||[]).join(' ')}`));
    if (commonIndex >= 0) {
      const oldId = branches[commonIndex].id;
      branches[commonIndex] = {...branches[commonIndex],id:'base',name:'Общий контур',desc:'Вся выбранная аудитория',conditions:['Вся выбранная аудитория'],meta:['Вся аудитория','AI']};
      stages.forEach(stage=>{ const oldKey=`${oldId}-${stage.id}`,newKey=`base-${stage.id}`; if(state.items?.[oldKey]){state.items[newKey]=state.items[oldKey];delete state.items[oldKey];} });
      return;
    }
    branches.unshift({id:'base',name:'Общий контур',meta:['Вся аудитория','AI'],desc:'Вся выбранная аудитория',conditions:['Вся выбранная аудитория']});
    state.items ||= {};
    stages.forEach(stage=>{
      const lists=branches.filter(branch=>branch.id!=='base').map(branch=>state.items[`${branch.id}-${stage.id}`]||[]);
      if(lists.length<2) return;
      const shared=[...new Set(lists[0].map(item=>item.title))].filter(title=>lists.every(list=>list.some(item=>item.title===title)));
      state.items[`base-${stage.id}`]=shared.map(title=>({...lists[0].find(item=>item.title===title),id:`base-${stage.id}-${Math.random().toString(36).slice(2,8)}`}));
      if(shared.length) branches.filter(branch=>branch.id!=='base').forEach(branch=>{const key=`${branch.id}-${stage.id}`;state.items[key]=(state.items[key]||[]).filter(item=>!shared.includes(item.title));});
    });
  };
  const enrichGeneratedItems = () => {
    const catalog = window.SkillazProductionCatalog;
    if (!catalog || !branches.length || !stages.length) return;
    const processContext = Object.values(state.assistantAnswers || {}).join(' ');
    let serial = 0;
    branches.forEach(branch => stages.forEach((stage,stageIndex) => {
      const cell = `${branch.id}-${stage.id}`;
      const list = state.items[cell] ||= [];
      const target = stageIndex === stages.length - 1 ? 1 : 2;
      if (list.length >= target) return;
      const matches = catalog.relevantElements(`${processContext} ${branch.name} ${branch.desc || ''} ${stage.name}`, 60)
        .filter(row => ['course','article','task','test','survey','action','meeting'].includes(row.type));
      for (const row of matches) {
        if (list.length >= target) break;
        if (list.some(item=>item.title===row.title)) continue;
        const id = `ai-catalog-${branch.id}-${stage.id}-${serial++}`;
        list.push({id,type:canvasType(row.type),title:row.title,meta:`AI · ${row.source}`,sourceId:row.id,outcomes:[]});
      }
    }));
  };

  const selectedRoles = () => (state.newRoles || []).map(role => {
    const found = roleDirectory().find(item => item.name === role.name);
    return found || { ...role, name:role.name, scope:role.scope || role.assignmentRule || 'По оргструктуре', source:'Справочник бизнес-ролей', use:role.use || role.purpose || 'Действия процесса' };
  });

  const participantsTargetPage = () => {
    const roles = selectedRoles();
    return `<div class="editor-toolbar participant-toolbar"><div><b>Участники и сопровождение</b><small>${roles.length ? `${roles.length} бизнес-роли настроено` : 'Нужно определить помощников и координатора'}</small></div><div class="topbar-spacer"></div><button class="btn" data-participant-action="open-assistant">✦ Настроить с помощником</button><span class="tag ${roles.length && state.coordinatorRule ? 'green' : ''}">${roles.length && state.coordinatorRule ? 'Настроено' : 'Черновик'}</span></div>
      <div class="page participants-page"><div class="page-card wide-card"><div class="settings-title"><div><span class="tag blue">Шаг 2 · Участники</span><h1>Кто помогает сотруднику пройти процесс</h1><p class="muted">Задайте роли. Конкретных людей система найдёт при назначении плана по структуре и доступности.</p></div></div>
      <h2 class="role-section-title">Системные роли</h2><div class="system-roles"><section><span class="tag blue">Всегда</span><h3>Сотрудник</h3><p>Получает персональный план</p></section><section class="manager-source-card"><span class="tag blue">Источник из оргструктуры</span><h3>Руководитель</h3><p>Выберите, кого система назначит в план.</p><div class="manager-source-options"><label><input type="radio" name="managerSource" checked> Административный</label><label><input type="radio" name="managerSource"> Функциональный</label></div></section></div>
      <div class="role-section-head"><div><h2>Бизнес-роли</h2><p class="muted">Выберите роль из справочника вручную или попросите AI подобрать набор по аудитории и сценарию.</p></div><div class="role-head-actions"><button class="btn" data-role-action="open-picker">＋ Добавить роль</button><button class="btn" data-participant-action="open-assistant">✦ Подобрать с AI</button></div></div>
      ${roles.length ? `<div class="business-role-table editable-role-table"><div class="role-row head"><span>Роль</span><span>Охват</span><span>Назначение</span><span>Действия</span></div>${roles.map((role,index) => `<div class="role-row"><span><b>${role.name}</b><small>${role.assignmentType==='administrative'?'Административная':'Функциональная'} роль</small></span><span>${role.scope}</span><span>${role.use}</span><span class="role-row-actions"><button class="btn small" data-role-action="edit-role" data-role-index="${index}">Изменить</button><button class="btn icon-only small" data-role-action="delete-role" data-role-index="${index}" title="Удалить роль">×</button></span></div>`).join('')}</div>` : `<div class="empty-setting"><b>Помощники ещё не выбраны</b><span>Добавьте роль из справочника или попросите AI подобрать наставника, HR, эксперта и других участников.</span></div>`}
      <section class="coordinator-card ${state.coordinatorRule ? 'ready' : ''}"><div><span class="tag">Владелец сопровождения</span><h2>Координатор процесса</h2><p>${state.coordinatorRule || 'Не определён. Координатор видит прогресс, просрочки и получает уведомления по отклонениям.'}</p></div><button class="btn" data-participant-action="open-assistant">${state.coordinatorRule ? 'Изменить' : 'Определить'}</button></section>
      <div class="wizard-next"><button class="btn" data-step="base">← Вернуться к запуску</button><button class="btn primary" data-participant-action="generate-process" ${roles.length && state.coordinatorRule ? '' : 'disabled title="Сначала настройте помощников и координатора"'}>✦ Перейти к процессу и собрать черновик</button></div>
      </div></div>`;
  };

  const participantHistory = () => {
    if (state.participantLiveHistory.length) return state.participantLiveHistory.map(message => message.role === 'user'
      ? `<div class="assistant-message user"><div><p>${safe(message.text)}</p></div></div>`
      : `<div class="assistant-message bot compact"><span>S</span><div><p>${safe(message.text)}</p></div></div>`).join('');
    const roles = selectedRoles();
    let html = '';
    if (state.participantUserMessages[1]) html += `<div class="assistant-message user"><div><p>${safe(state.participantUserMessages[1])}</p></div></div><div class="assistant-message bot compact"><span>S</span><div><p>Нашёл ${roles.length} подходящие бизнес-роли в справочнике и проверил их охват.</p></div></div>`;
    if (state.participantUserMessages[2]) html += `<div class="assistant-message user"><div><p>${safe(state.participantUserMessages[2])}</p></div></div><div class="assistant-message bot compact"><span>S</span><div><p>Координатор настроен: <b>${safe(state.coordinatorRule)}</b>.</p></div></div>`;
    return html;
  };

  const participantAssistant = () => {
    if (!state.participantAssistantOpen) return '';
    const roles = selectedRoles();
    const step = state.participantAssistantStep;
    const question = state.participantLivePrompt || (step === 1
      ? ['Кто помогает сотруднику пройти этот процесс?','Напишите бизнес роли обычными словами. Например: «наставник на рабочем месте, HR и эксперт по охране труда».']
      : ['Кто должен следить за процессом целиком?','Этот человек увидит прогресс, просрочки и отклонения. Например: HRBP подразделения или назначающий администратор.']);
    const suggestions = state.participantLiveSuggestions.length ? state.participantLiveSuggestions : participantSuggestions(step);
    return `<div class="local-overlay assistant-overlay" role="dialog" aria-modal="true" aria-label="Помощник по участникам"><section class="assistant-shell participant-assistant-shell">
      <header class="assistant-head"><div><span class="tag purple">AI · участники</span><h1>Настроим сопровождение</h1></div><button class="btn icon-only" data-participant-action="close-assistant">×</button></header>
      <div class="assistant-layout"><main class="assistant-dialogue"><div class="assistant-context"><span class="status-dot"></span><div><b>Справочник бизнес-ролей</b><small>AI рекомендует роли по сценарию, оргструктуре и доступному источнику назначения</small></div></div><div class="assistant-thread">${participantHistory()}
      ${step <= 2 ? `<div class="assistant-message bot current"><span>S</span><div><b>${question[0]}</b><p>${question[1]}</p></div></div><div class="assistant-hints"><span>Варианты по вашему процессу</span>${suggestions.map(text => `<button data-participant-suggest="${safe(text)}">${safe(text)}</button>`).join('')}</div>${state.participantError?`<p class="ai-error">${safe(state.participantError)}</p>`:''}<form class="assistant-composer" data-participant-form><textarea data-participant-input rows="2" placeholder="Напишите ответ своими словами…" ${state.participantBusy?'disabled':''}></textarea><button class="btn primary" type="submit" ${state.participantBusy?'disabled':''}>${state.participantBusy?'Подбираю роли…':'Отправить ↑'}</button></form>` : `<div class="assistant-message bot success"><span>✓</span><div><b>Участники настроены</b><p>Я связал роли со структурой и добавил координатора. Теперь могу собрать этапы, ветки и действия процесса.</p></div></div><button class="btn primary assistant-continue" data-participant-action="finish-assistant">Проверить участников →</button>`}
      </div></main><aside class="draft-summary"><div class="draft-title"><span class="tag">Черновик участников</span><b>${roles.length + 2} ролей</b><small>2 системные + ${roles.length} бизнес-роли</small></div>${roles.map((role,index) => `<article class="filled"><i>${index + 1}</i><div><small>Бизнес-роль</small><b>${role.name}</b><small>${role.scope}</small></div></article>`).join('')}<article class="${state.coordinatorRule ? 'filled' : ''}"><i>К</i><div><small>Координатор</small><b>${state.coordinatorRule || 'Нужно определить'}</b></div></article></aside></div>
      </section></div>`;
  };

  const parseRoles = value => {
    const lower = value.toLowerCase();
    const directory = roleDirectory();
    const roles = directory.filter(role => role.name.toLowerCase().split(/[^а-яa-z]+/).some(word=>word.length>4&&lower.includes(word.slice(0,6))));
    return roles.length ? roles : directory.slice(0,3);
  };

  const submitParticipant = async value => {
    const text = String(value || '').trim();
    if (!text || state.participantBusy) return;
    const step = state.participantAssistantStep;
    state.participantUserMessages[step] = text;
    state.participantLiveHistory.push({role:'user',text});
    state.participantBusy = true; state.participantError = ''; render();
    try {
      const contextText = [text,...Object.values(state.assistantAnswers || {}),(state.newRoles||[]).map(role=>role.name).join(' ')].join(' ');
      const result = await window.SkillazLiveAI.ask('participants', {
        message:text,
        context:{launch:state.assistantAnswers || {},currentRoles:state.newRoles || [],coordinator:state.coordinatorRule},
        history:state.participantLiveHistory,
        catalog:window.SkillazLiveAI.context(contextText)
      });
      if (Array.isArray(result.roles) && result.roles.length) state.newRoles = result.roles.map(role => ({name:role.name,scope:role.assignmentRule || 'По оргструктуре',purpose:role.purpose,assignmentType:role.assignmentType}));
      if (result.updates?.coordinator) state.coordinatorRule = result.updates.coordinator;
      if (result.message) state.participantLiveHistory.push({role:'assistant',text:result.message});
      state.participantLivePrompt = result.question ? [result.question,result.hint || 'Я подберу правило назначения по справочнику бизнес ролей.'] : null;
      state.participantLiveSuggestions = Array.isArray(result.suggestions) ? result.suggestions.slice(0,4) : [];
      state.participantAssistantStep = result.ready || (state.newRoles.length && state.coordinatorRule) ? 3 : Math.min(2,step + 1);
    } catch (error) {
      state.participantError = 'Живой подбор временно недоступен. Использую локальный справочник.';
      if (step === 1) state.newRoles = parseRoles(text).filter(role => role.source !== 'Системная связь').map(role => ({name:role.name,scope:role.scope}));
      if (step === 2) state.coordinatorRule = /руковод/.test(text.toLowerCase()) ? 'Руководитель подразделения по оргструктуре' : /назнач/.test(text.toLowerCase()) ? 'Назначающий администратор' : 'HRBP подразделения сотрудника';
      state.participantAssistantStep += 1;
    } finally { state.participantBusy = false; render(); }
    requestAnimationFrame(() => {
      const thread = document.querySelector('.participant-assistant-shell .assistant-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  };

  const generateProcess = async () => {
    if (state.processGenerating) return;
    state.processGenerating = true;
    toast('AI анализирует запуск, аудиторию, роли и каталоги…');
    let generated = null;
    try {
      const query = [...Object.values(state.assistantAnswers || {}),(state.newRoles||[]).map(role=>role.name).join(' ')].join(' ');
      const result = await window.SkillazLiveAI.ask('process', {
        message:'Собери полный черновик процесса',
        context:{launch:state.assistantAnswers || {},roles:state.newRoles || [],coordinator:state.coordinatorRule},
        history:[...(state.assistantLiveHistory||[]),...(state.participantLiveHistory||[])],
        catalog:window.SkillazLiveAI.context(query)
      });
      generated = result.process;
    } catch (error) { state.participantError = 'Не удалось получить живую генерацию — открыт демонстрационный черновик.'; }

    if (generated?.stages?.length && generated?.branches?.length) {
      stages.splice(0,stages.length,...generated.stages.map((stage,index)=>({id:stage.id||`stage-${index+1}`,name:stage.name,days:String(stage.days||''),count:0})));
      branches.splice(0,branches.length,...generated.branches.map((branch,index)=>{
        const rawCondition = String(branch.condition ?? '').trim();
        const condition = !rawCondition || rawCondition === 'true' ? (index === 0 ? 'Вся выбранная аудитория' : `Должность или группа: ${branch.name}`) : rawCondition;
        return {id:branch.id||`branch-${index+1}`,name:branch.name,meta:[condition,'AI'],desc:condition,conditions:[condition]};
      }));
      state.items = {};
      (generated.items||[]).forEach((item,index)=>{
        const branchId = branches.some(branch=>branch.id===item.branchId) ? item.branchId : branches[0].id;
        const stageId = stages.some(stage=>stage.id===item.stageId) ? item.stageId : stages[0].id;
        const cell = `${branchId}-${stageId}`;
        const id = item.id||`ai-${index}`;
        (state.items[cell] ||= []).push({id,type:canvasType(item.type),title:item.title,meta:item.assignee||'AI · каталог',sourceId:item.sourceId,outcomes:item.outcomes||[]});
        if (item.outcomes?.[0] && state.outcomeRules) state.outcomeRules[id] = {condition:item.outcomes[0].if,action:item.outcomes[0].then};
      });
      ensureCommonBranch();
      enrichGeneratedItems();
      extras = {};
      state.processTitle = generated.title || state.assistantAnswers?.scenario || 'Новый процесс';
      state.generatedAiProcess = generated;
      const defaultLinks = Object.values(state.items).flat().filter(item=>['task','course','assessment'].includes(item.type)).slice(0,3).map(item=>item.id);
      const generatedGoals = generated.goals?.length ? generated.goals : [{title:'Освоить ключевые задачи роли',result:state.assistantAnswers?.result||'Самостоятельно выполнять работу по стандартам роли',day:30,linkedItemIds:defaultLinks}];
      const generatedCheckpoints = generated.checkpoints?.length ? generated.checkpoints : [
        {title:'Проверка старта',day:7,result:'Доступы получены, обязательные действия выполнены',participants:['Руководитель','Наставник'],onFail:'Уведомить координатора'},
        {title:'Проверка практики',day:30,result:'Ключевые действия выполнены под наблюдением',participants:['Наставник','Эксперт'],onFail:'Назначить дополнительную практику'},
        {title:'Финальный допуск',day:60,result:state.assistantAnswers?.result||'Готовность к самостоятельной работе подтверждена',participants:['Руководитель','Проверяющий'],onFail:'Согласовать корректирующий план'}
      ];
      aiState.goals = generatedGoals.map((goal,index)=>({
        id:`generated-goal-${index}`,branchId:goal.branchId||branches[0].id,title:goal.title,result:goal.result||goal.title,
        day:Number(goal.day)||30,source:'AI · каталог целей',candidates:[],linked:(goal.linkedItemIds||[]).map(id=>({id,title:Object.values(state.items).flat().find(item=>item.id===id)?.title||id}))
      }));
      aiState.sessions = [{branches:branches.map(branch=>branch.id),entries:generatedCheckpoints.map((checkpoint,index)=>({
        id:`generated-kt-${index}`,title:checkpoint.title,day:Number(checkpoint.day)||[14,30,60][index]||30,
        agenda:checkpoint.result||'Проверить результат этапа и договориться о следующих шагах.',pulse:checkpoint.onFail||'Какая поддержка нужна сотруднику?',participants:checkpoint.participants||[]
      }))}];
    } else {
      const contextText = [...Object.values(state.assistantAnswers || {}),state.manualLaunch?.audience || ''].join(' ');
      const selectedPositionNames = (window.SkillazReferenceData?.positions || []).filter(position=>state.scopeSelections?.role?.includes(position.id)).map(position=>position.title);
      const audienceNames = selectedPositionNames.length ? selectedPositionNames : [state.assistantAnswers?.audience || state.assistantAnswers?.audienceIntent || 'Выбранная аудитория'];
      stages.splice(0,stages.length,
        {id:'local-stage-1',name:'Подготовка до старта',days:'до 1 дня',count:0},
        {id:'local-stage-2',name:'Знакомство и базовое обучение',days:'до 7 дня',count:0},
        {id:'local-stage-3',name:'Практика с наставником',days:'до 14 дня',count:0},
        {id:'local-stage-4',name:'Проверка знаний и навыков',days:'до 30 дня',count:0},
        {id:'local-stage-5',name:'Самостоятельная работа',days:'до 60 дня',count:0}
      );
      branches.splice(0,branches.length,{id:'base',name:'Общий контур',meta:['Вся аудитория','AI'],desc:'Вся выбранная аудитория',conditions:['Вся выбранная аудитория']},...audienceNames.slice(0,4).map((name,index)=>({id:`local-role-${index+1}`,name:`Путь: ${name}`,meta:[`Должность: ${name}`,'AI'],desc:`Должность: ${name}`,conditions:[`Должность: ${name}`]})));
      state.items = {};
      extras = {};
      state.processTitle = state.assistantAnswers?.scenario && state.assistantAnswers.scenario !== 'Новый сотрудник' ? state.assistantAnswers.scenario : `Адаптация: ${audienceNames.join(', ')}`;
      enrichGeneratedItems();
      const fallbackItems = Object.values(state.items).flat().filter(item=>['task','course','assessment'].includes(item.type));
      const fallbackLinks = fallbackItems.slice(0,3).map(item=>({id:item.id,title:item.title}));
      aiState.goals = [{
        id:'fallback-goal-1',branchId:branches[0]?.id,title:'Освоить ключевые задачи роли',
        result:state.assistantAnswers?.result||'Самостоятельно выполнять работу по стандартам роли',day:30,
        source:'AI · каталог целей',candidates:fallbackItems,linked:fallbackLinks
      }];
      aiState.sessions = [{branches:branches.map(branch=>branch.id),entries:[
        {id:'fallback-kt-1',title:'Проверка старта',day:7,agenda:'Проверить доступы и выполнение обязательных действий',pulse:'Какая поддержка нужна на старте?',participants:['Руководитель','Наставник']},
        {id:'fallback-kt-2',title:'Проверка практики',day:30,agenda:'Проверить выполнение ключевых действий под наблюдением',pulse:'Что мешает работать самостоятельно?',participants:['Наставник','Эксперт']},
        {id:'fallback-kt-3',title:'Финальный допуск',day:60,agenda:state.assistantAnswers?.result||'Подтвердить готовность к самостоятельной работе',pulse:'Готов ли сотрудник к самостоятельной работе?',participants:['Руководитель','Проверяющий']}
      ]}];
      state.generatedAiProcess = {title:state.processTitle||'Черновик процесса',context:contextText,goals:aiState.goals,checkpoints:aiState.sessions[0].entries};
    }
    state.newWorkflow = true;
    state.workflow = 'generated';
    state.generatedProcess = true;
    state.newGoalScenario = aiState.goals.length > 0;
    state.newKtScenario = aiState.sessions.some(session=>session.entries?.length);
    state.step = 'canvas';
    state.view = 'canvas';
    state.layer = 'process';
    state.processGenerating = false;
    render();
    setTimeout(() => toast(generated ? `AI собрал черновик: ${stages.length} этапов, ${branches.length} веток и ${Object.values(state.items).flat().length} элементов` : 'Открыт демонстрационный черновик'), 120);
  };

  hub = tableHub;
  participantsPageV2 = () => state.newWorkflow ? participantsTargetPage() : previousParticipantsPage();
  canvasPage = () => previousCanvasPage();
  editor = () => {
    const content = previousEditor();
    const titled = state.generatedProcess ? content.replace('<b>Новый workflow</b>','<b>Новый процесс логистического центра</b>') : content;
    return titled + participantAssistant() + rolePicker();
  };

  const originalDraftStart = startNewWorkflow;
  startNewWorkflow = function () {
    originalDraftStart();
    state.demoDraftId = `draft-${Date.now()}`;
    state.processTitle = 'Новый процесс';
    persistDraft();
  };
  const originalDraftLoad = loadWorkflow;
  loadWorkflow = function (id) {
    if (!state.processGenerating) state.demoDraftId = null;
    originalDraftLoad(id);
  };
  const originalDraftRender = render;
  let draftSaveTimer = 0;
  render = function () {
    clearTimeout(draftSaveTimer);
    if (state.demoDraftId && state.newWorkflow) draftSaveTimer = setTimeout(persistDraft,80);
    originalDraftRender();
  };

  if (!window.__workflowIterationThreeBound) {
    window.__workflowIterationThreeBound = true;
    document.addEventListener('submit', event => {
      const form = event.target.closest('[data-participant-form]');
      if (!form) return;
      event.preventDefault();
      submitParticipant(form.querySelector('[data-participant-input]')?.value);
    }, true);
    document.addEventListener('click', event => {
      const openDraftNode = event.target.closest('[data-demo-draft]');
      if (openDraftNode) { event.preventDefault(); event.stopImmediatePropagation(); openDraft(openDraftNode.dataset.demoDraft); return; }
      const deleteDraftNode = event.target.closest('[data-delete-demo-draft]');
      if (deleteDraftNode) {
        event.preventDefault(); event.stopImmediatePropagation();
        window.SkillazDemoDB?.deleteProcess(deleteDraftNode.dataset.deleteDemoDraft);
        render(); toast('Черновик удалён'); return;
      }
      if (event.target.closest('[data-action="home"]')) persistDraft();
      const roleNode = event.target.closest('[data-role-action]');
      if (roleNode) {
        event.preventDefault();
        const action = roleNode.dataset.roleAction;
        if (action === 'open-picker') { state.rolePickerOpen = true; state.roleEditIndex = null; render(); return; }
        if (action === 'close-picker') { state.rolePickerOpen = false; state.roleEditIndex = null; render(); return; }
        if (action === 'edit-role') { state.rolePickerOpen = true; state.roleEditIndex = Number(roleNode.dataset.roleIndex); render(); return; }
        if (action === 'delete-role') { state.newRoles.splice(Number(roleNode.dataset.roleIndex),1); render(); toast('Бизнес-роль удалена'); return; }
        if (action === 'select-role') {
          const found = roleDirectory().find(role=>role.name===roleNode.dataset.roleName) || (window.SkillazReferenceData?.businessRoles||[]).find(role=>role.name===roleNode.dataset.roleName);
          const next = {name:roleNode.dataset.roleName,scope:found?.scope||found?.assignmentRule||'По оргструктуре сотрудника',purpose:found?.use||found?.purpose||'Действия процесса',assignmentType:found?.assignmentType||'functional'};
          if (state.roleEditIndex===null) {
            if (!state.newRoles.some(role=>role.name===next.name)) state.newRoles.push(next);
          } else state.newRoles[state.roleEditIndex] = next;
          state.rolePickerOpen = false; state.roleEditIndex = null; render(); toast('Бизнес-роль сохранена'); return;
        }
      }
      const suggestion = event.target.closest('[data-participant-suggest]');
      if (suggestion) { event.preventDefault(); submitParticipant(suggestion.dataset.participantSuggest); return; }
      const node = event.target.closest('[data-participant-action]');
      if (!node) return;
      event.preventDefault();
      const action = node.dataset.participantAction;
      if (action === 'open-assistant') {
        state.participantAssistantOpen = true;
        state.participantAssistantStep = state.newRoles.length ? (state.coordinatorRule ? 3 : 2) : 1;
        render();
      }
      if (action === 'close-assistant') { state.participantAssistantOpen = false; render(); }
      if (action === 'finish-assistant') { state.participantAssistantOpen = false; render(); }
      if (action === 'generate-process') generateProcess();
    }, true);
    document.addEventListener('input', event => {
      if (event.target.matches('[data-process-search]')) {
        const query = event.target.value.trim().toLowerCase().replace(/ё/g,'е');
        document.querySelectorAll('[data-process-search-row]').forEach(row=>{ row.hidden = query && !row.dataset.processSearchRow.replace(/ё/g,'е').includes(query); });
        return;
      }
      if (!event.target.matches('[data-role-search]')) return;
      const query = event.target.value.trim().toLowerCase().replace(/ё/g,'е');
      document.querySelectorAll('.role-picker-list [data-role-search-text]').forEach(row=>{
        row.hidden = query && !row.dataset.roleSearchText.replace(/ё/g,'е').includes(query);
      });
    }, true);
  }

  render();
})();
