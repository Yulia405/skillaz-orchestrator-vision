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

  const previousHub = hub;
  const previousEditor = editor;
  const previousParticipantsPage = participantsPageV2;
  const previousCanvasPage = canvasPage;

  const roleDirectory = [
    { name:'Наставник логистического центра', scope:'Логистический центр · свое подразделение', source:'Справочник бизнес-ролей', use:'Практика и обратная связь' },
    { name:'HRBP логистического центра', scope:'Логистическая сеть', source:'Справочник бизнес-ролей', use:'Сопровождение и эскалации' },
    { name:'Эксперт по охране труда', scope:'Все подразделения', source:'Справочник бизнес-ролей', use:'Проверка обязательного допуска' },
    { name:'Специалист IT / IAM', scope:'Все подразделения', source:'Справочник бизнес-ролей', use:'Доступы и рабочие системы' },
    { name:'Руководитель подразделения', scope:'По оргструктуре сотрудника', source:'Системная связь', use:'Контрольные встречи и решения' }
  ];

  const safe = value => String(value || '').replace(/[&<>"']/g, symbol => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[symbol]));

  const tableHub = () => {
    const inherited = previousHub();
    const overlayIndex = inherited.indexOf('<div class="local-overlay');
    const overlays = overlayIndex >= 0 ? inherited.slice(overlayIndex) : '';
    const rows = [
      ['courier','Новый сотрудник логистического центра','Новый сотрудник','Черновик','4','96','Сегодня, 12:40'],
      ['courier','Пребординг массовых сотрудников','Пребординг','Опубликован','4','42','Вчера, 18:10'],
      ['manager','Вход руководителя клиентского офиса','Новая роль','Черновик','3','82','29 сентября'],
      ['courier','Новый сотрудник розничной сети','Новый сотрудник','На проверке','3','54','27 сентября']
    ];
    return `<div class="hub process-hub"><header class="topbar"><div class="brand"><span class="brand-mark">S</span>Skillaz Start</div><div class="crumb">Процессы входа в роль</div><div class="topbar-spacer"></div><button class="btn">Справка</button></header>
      <main class="hub-main process-list-page"><div class="hub-head"><div><h1>Процессы</h1><p class="muted">Пребординг, новый сотрудник и вход в новую роль.</p></div><button class="btn primary" data-action="new">＋ Новый процесс</button></div>
      <div class="process-list-controls"><div class="process-search">⌕ <input placeholder="Найти процесс"></div><button class="btn">Все сценарии</button><button class="btn">Все статусы</button><span>${rows.length} процесса</span></div>
      <section class="process-table"><div class="process-row process-head"><span>Название</span><span>Сценарий</span><span>Статус</span><span>Ветки</span><span>Элементы</span><span>Изменён</span><span></span></div>
      ${rows.map(row => `<div class="process-row"><span><b>${row[1]}</b><small>Автоматический запуск · мастер-система</small></span><span>${row[2]}</span><span><i class="status-pill ${row[3] === 'Опубликован' ? 'green' : row[3] === 'На проверке' ? 'amber' : ''}">${row[3]}</i></span><span>${row[4]}</span><span>${row[5]}</span><span>${row[6]}</span><span><button class="btn small" data-workflow="${row[0]}">Открыть</button></span></div>`).join('')}</section>
      </main></div>${overlays}`;
  };

  const canvasType = type => ({test:'assessment',checkpoint:'assessment',meeting:'task',action:'task',goal:'task'}[type] || type || 'task');
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
    const found = roleDirectory.find(item => item.name === role.name);
    return found || { ...role, name:role.name, scope:role.scope || role.assignmentRule || 'По оргструктуре', source:'Справочник бизнес-ролей', use:role.use || role.purpose || 'Действия процесса' };
  });

  const participantsTargetPage = () => {
    const roles = selectedRoles();
    return `<div class="editor-toolbar participant-toolbar"><div><b>Участники и сопровождение</b><small>${roles.length ? `${roles.length} бизнес-роли настроено` : 'Нужно определить помощников и координатора'}</small></div><div class="topbar-spacer"></div><button class="btn" data-participant-action="open-assistant">✦ Настроить с помощником</button><span class="tag ${roles.length && state.coordinatorRule ? 'green' : ''}">${roles.length && state.coordinatorRule ? 'Настроено' : 'Черновик'}</span></div>
      <div class="page participants-page"><div class="page-card wide-card"><div class="settings-title"><div><span class="tag blue">Шаг 2 · Участники</span><h1>Кто помогает сотруднику пройти процесс</h1><p class="muted">Задайте роли. Конкретных людей система найдёт при назначении плана по структуре и доступности.</p></div></div>
      <h2 class="role-section-title">Системные роли</h2><div class="system-roles"><section><span class="tag blue">Всегда</span><h3>Сотрудник</h3><p>Получает персональный план</p></section><section class="manager-source-card"><span class="tag blue">Источник из оргструктуры</span><h3>Руководитель</h3><p>Выберите, кого система назначит в план.</p><div class="manager-source-options"><label><input type="radio" name="managerSource" checked> Административный</label><label><input type="radio" name="managerSource"> Функциональный</label></div></section></div>
      <div class="role-section-head"><div><h2>Бизнес-роли</h2><p class="muted">В рабочей версии роли выбираются из справочника бизнес-ролей, а AI рекомендует подходящие по аудитории и сценарию.</p></div><button class="btn" data-participant-action="open-assistant">Изменить подбор</button></div>
      ${roles.length ? `<div class="business-role-table"><div class="role-row head"><span>Роль</span><span>Охват</span><span>Назначение</span><span>Источник</span></div>${roles.map(role => `<div class="role-row"><span><b>${role.name}</b></span><span>${role.scope}</span><span>${role.use}</span><span><span class="tag green">${role.source}</span></span></div>`).join('')}</div>` : `<div class="empty-setting"><b>Помощники ещё не выбраны</b><span>Расскажите помощнику, кто сопровождает сотрудника: наставник, HR, эксперт, IT или другая бизнес-роль.</span></div>`}
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
    const suggestions = state.participantLiveSuggestions.length ? state.participantLiveSuggestions : (step === 1 ? ['Наставник, HR и эксперт по охране труда','Наставник и руководитель','HR и специалист IT'] : ['HRBP подразделения','Назначающий администратор','Руководитель подразделения']);
    return `<div class="local-overlay assistant-overlay" role="dialog" aria-modal="true" aria-label="Помощник по участникам"><section class="assistant-shell participant-assistant-shell">
      <header class="assistant-head"><div><span class="tag purple">AI · участники</span><h1>Настроим сопровождение</h1></div><button class="btn icon-only" data-participant-action="close-assistant">×</button></header>
      <div class="assistant-layout"><main class="assistant-dialogue"><div class="assistant-context"><span class="status-dot"></span><div><b>Справочник бизнес-ролей</b><small>AI рекомендует роли по сценарию, оргструктуре и доступному источнику назначения</small></div></div><div class="assistant-thread">${participantHistory()}
      ${step <= 2 ? `<div class="assistant-message bot current"><span>S</span><div><b>${question[0]}</b><p>${question[1]}</p></div></div><div class="assistant-hints"><span>Варианты по вашему процессу</span>${suggestions.map(text => `<button data-participant-suggest="${safe(text)}">${safe(text)}</button>`).join('')}</div>${state.participantError?`<p class="ai-error">${safe(state.participantError)}</p>`:''}<form class="assistant-composer" data-participant-form><textarea data-participant-input rows="2" placeholder="Напишите ответ своими словами…" ${state.participantBusy?'disabled':''}></textarea><button class="btn primary" type="submit" ${state.participantBusy?'disabled':''}>${state.participantBusy?'Подбираю роли…':'Отправить ↑'}</button></form>` : `<div class="assistant-message bot success"><span>✓</span><div><b>Участники настроены</b><p>Я связал роли со структурой и добавил координатора. Теперь могу собрать этапы, ветки и действия процесса.</p></div></div><button class="btn primary assistant-continue" data-participant-action="finish-assistant">Проверить участников →</button>`}
      </div></main><aside class="draft-summary"><div class="draft-title"><span class="tag">Черновик участников</span><b>${roles.length + 2} ролей</b><small>2 системные + ${roles.length} бизнес-роли</small></div>${roles.map((role,index) => `<article class="filled"><i>${index + 1}</i><div><small>Бизнес-роль</small><b>${role.name}</b><small>${role.scope}</small></div></article>`).join('')}<article class="${state.coordinatorRule ? 'filled' : ''}"><i>К</i><div><small>Координатор</small><b>${state.coordinatorRule || 'Нужно определить'}</b></div></article></aside></div>
      </section></div>`;
  };

  const parseRoles = value => {
    const lower = value.toLowerCase();
    const roles = [];
    if (/настав|помощ/.test(lower)) roles.push(roleDirectory[0]);
    if (/hr|эйчар|кадр|координ/.test(lower)) roles.push(roleDirectory[1]);
    if (/охран|безопас|эксперт/.test(lower)) roles.push(roleDirectory[2]);
    if (/it|айти|доступ/.test(lower)) roles.push(roleDirectory[3]);
    if (/руковод/.test(lower)) roles.push(roleDirectory[4]);
    return roles.length ? roles : [roleDirectory[0], roleDirectory[1], roleDirectory[2]];
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
      loadWorkflow('courier');
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
      state.generatedAiProcess = {title:state.processTitle||'Черновик процесса',goals:aiState.goals,checkpoints:aiState.sessions[0].entries};
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
    return titled + participantAssistant();
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
  }

  render();
})();
