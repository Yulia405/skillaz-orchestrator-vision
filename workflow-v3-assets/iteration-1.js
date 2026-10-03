// Local research branch. Loaded after the original prototype and never published automatically.
(() => {
  state.creationChoiceOpen = false;
  state.templatePickerOpen = false;
  state.creationAssistantOpen = false;
  state.creationTourOpen = false;
  state.assistantSkillsOpen = false;
  state.assistantStep = 1;
  state.assistantAnswers = { scenario: '', audienceIntent: '', result: '', event: '', timing: '', audience: '', pathType: '' };
  state.assistantUserMessages ??= {};
  state.assistantAudienceMode ??= '';

  const originalStartNewWorkflow = startNewWorkflow;
  const originalHub = hub;
  const originalEditor = editor;
  const originalCanvasPage = canvasPage;

  const catalogCount = () => Object.values(window.SkillazDemoDB?.catalogs || {})
    .reduce((sum, rows) => sum + rows.length, 0);

  const creationChoice = () => `
    <div class="local-overlay creation-entry" role="dialog" aria-modal="true" aria-label="Создание workflow">
      <section class="creation-entry-card">
        <header class="creation-entry-head">
          <div>
            <span class="tag blue">Новый workflow</span>
            <h1>Как хотите начать?</h1>
            <p>Выберите удобный уровень помощи. Любой вариант позже открывается в одном редакторе процесса.</p>
          </div>
          <button class="btn icon-only" data-local-action="close-entry" aria-label="Закрыть">×</button>
        </header>
        <div class="creation-mode-grid">
          <button class="creation-mode recommended" data-create-mode="assistant">
            <span class="mode-icon">✦</span>
            <span class="tag purple">Рекомендуется</span>
            <b>Собрать с помощником</b>
            <p>Помощник задаст вопросы по одному, заполнит параметры и покажет живой черновик.</p>
            <em>Начать диалог →</em>
          </button>
          <button class="creation-mode" data-create-mode="template">
            <span class="mode-icon">▤</span>
            <span class="tag green">Быстрый старт</span>
            <b>Взять типовой сценарий</b>
            <p>Пребординг, новый сотрудник или вход в новую роль с готовой структурой.</p>
            <em>Выбрать сценарий →</em>
          </button>
          <button class="creation-mode" data-create-mode="expert">
            <span class="mode-icon">⌘</span>
            <span class="tag">Для опытных</span>
            <b>Начать с пустого процесса</b>
            <p>Откроется экспертный редактор. Короткий тур покажет порядок сборки.</p>
            <em>Открыть редактор →</em>
          </button>
        </div>
        <footer class="creation-entry-foot">
          <span>Все способы ведут к проверке пути на тестовых сотрудниках перед публикацией.</span>
          <b>Черновик можно продолжить вручную в любой момент.</b>
        </footer>
      </section>
    </div>`;

  const templatePicker = () => `
    <div class="local-overlay template-entry" role="dialog" aria-modal="true" aria-label="Типовой сценарий">
      <section class="creation-entry-card template-card">
        <header class="creation-entry-head">
          <div>
            <button class="local-back" data-local-action="back-to-entry">← Способ создания</button>
            <h1>Выберите типовой сценарий</h1>
            <p>Сценарий задает стартовую структуру. Аудиторию, роли и содержание можно изменить.</p>
          </div>
          <button class="btn icon-only" data-local-action="close-entry" aria-label="Закрыть">×</button>
        </header>
        <div class="scenario-grid">
          ${[
            ['preboarding','До выхода','Пребординг','Оффер принят','Документы, доступы и готовность к первому дню'],
            ['onboarding','После выхода','Новый сотрудник','Сотрудник вышел','Общий контур, профессиональные ветки и КТ'],
            ['new-role','Внутренний путь','Вход в новую роль','Должность изменилась','Диагностика, обучение, практика и подтверждение готовности']
          ].map(row => `<button class="scenario-option" data-template-scenario="${row[0]}"><span class="tag blue">${row[1]}</span><b>${row[2]}</b><small>Запуск: ${row[3]}</small><p>${row[4]}</p><em>Использовать →</em></button>`).join('')}
        </div>
      </section>
    </div>`;

  const assistantSkills = () => {
    const skills = [
      ['01','Результат','Сформулировать ожидаемый результат процесса'],
      ['02','Запуск','Выбрать событие и момент назначения'],
      ['03','Аудитория','Собрать охват по данным мастер-системы'],
      ['04','Варианты пути','Создать ветки и объяснимые условия'],
      ['05','Участники','Подобрать системные и бизнес-роли'],
      ['06','Координатор','Определить владельца сопровождения'],
      ['07','Этапы','Предложить последовательность и сроки'],
      ['08','Элементы','Найти объекты в каталогах Skillaz'],
      ['09','Цели','Подобрать цель и связать с действиями'],
      ['10','Контроль','Настроить КТ, реакции и уведомления'],
      ['11','Проверка','Собрать путь тестового сотрудника']
    ];
    return `<aside class="assistant-skills ${state.assistantSkillsOpen ? 'open' : ''}">
      <header><div><b>Навыки помощника</b><small>Каждый навык заполняет конкретную часть workflow</small></div><button data-local-action="toggle-skills">×</button></header>
      <div>${skills.map(s => `<article><i>${s[0]}</i><span><b>${s[1]}</b><small>${s[2]}</small></span></article>`).join('')}</div>
      <footer>${catalogCount()} демонстрационных объектов доступны для подбора</footer>
    </aside>`;
  };

  const safeAssistantText = value => String(value || '').replace(/[&<>"']/g, symbol => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[symbol]));

  const assistantHistory = () => {
    const a = state.assistantAnswers;
    const u = state.assistantUserMessages;
    const messages = [];
    if (a.audienceIntent) messages.push(['user', u[1] || a.audienceIntent], ['bot', `Понял общий контекст: <b>${safeAssistantText(a.audienceIntent)}</b>. Нашёл несколько совпадений в оргструктуре и должностях.`]);
    if (a.audience) messages.push(['user', u[2] || a.audience], ['bot', `Зафиксировал охват: <b>${safeAssistantText(a.audience)}</b>.`]);
    if (a.result) messages.push(['user', u[3] || a.result], ['bot', `Сформулировал результат процесса: <b>${safeAssistantText(a.result)}</b>.`]);
    if (a.event) messages.push(['user', u[4] || a.event], ['bot', `Для автоматического старта свяжу процесс с событием <b>${safeAssistantText(a.event)}</b>.`]);
    if (a.timing) messages.push(['user', u[5] || a.timing], ['bot', `План будет создаваться: <b>${safeAssistantText(a.timing)}</b>.`]);
    if (a.pathType) messages.push(['user', u[6] || a.pathType], ['bot', `По вашему ответу настрою: <b>${safeAssistantText(a.pathType)}</b>.`]);
    return messages.map(([type,text]) => type === 'user'
      ? `<div class="assistant-message user"><div><p>${safeAssistantText(text)}</p></div></div>`
      : `<div class="assistant-message bot compact"><span>S</span><div><p>${text}</p></div></div>`).join('');
  };

  const assistantPrompt = () => ({
    1: ['Для каких должностей и подразделений нужен процесс?', 'Опишите аудиторию обычными словами. Например: «Для массовых сотрудников логистического центра».'],
    2: ['Уточните, какие части структуры включить', 'Я нашёл логистическую сеть, складские площадки и доставку. Напишите конкретные подразделения и должности — можно перечислить через запятую.'],
    3: ['Что сотрудник должен уметь делать самостоятельно в конце?', 'Не нужно придумывать системную формулировку. Опишите практический результат работы.'],
    4: ['Как в компании становится понятно, что пора начинать?', 'Например: сотрудник вышел на работу, оффер принят или изменилась должность.'],
    5: ['Нужно начать заранее или в момент изменения?', 'Я превращу ответ в правило даты запуска для каждого сотрудника.'],
    6: ['У всех будет одинаковый путь?', 'Если офису, складу и доставке нужны разные действия, просто скажите об этом — я создам варианты.']
  }[state.assistantStep] || []);

  const assistantSuggestions = () => ({
    1: ['Массовые сотрудники логистического центра','Сотрудники розницы','Сотрудники производства'],
    2: ['Складская логистика: кладовщики и комплектовщики','Доставка: курьеры и водители','Все подразделения логистического центра'],
    3: ['Самостоятельно выполняет работу по стандартам роли','Готов к первому рабочему дню'],
    4: ['Сотрудник вышел на работу','Оффер принят','Изменилась должность'],
    5: ['Начать сразу','Начать за 5 дней','Начать на следующий день'],
    6: ['У всех одинаково','Общее начало, потом разные действия']
  }[state.assistantStep] || []);

  const assistantQuestion = () => {
    if (state.assistantStep <= 6) {
      const prompt = assistantPrompt();
      return `${assistantHistory()}
        <div class="assistant-message bot current"><span>S</span><div><b>${prompt[0]}</b><p>${prompt[1]}</p></div></div>
        <div class="assistant-hints"><span>Можно ответить текстом</span>${assistantSuggestions().map(value => `<button data-assistant-suggest="${safeAssistantText(value)}">${safeAssistantText(value)}</button>`).join('')}</div>
        <form class="assistant-composer" data-assistant-form><textarea data-assistant-input rows="2" placeholder="Напишите ответ своими словами…"></textarea><button class="btn primary" type="submit">Отправить ↑</button></form>`;
    }
    return `
      ${assistantHistory()}
      <div class="assistant-message bot success"><span>✓</span><div><b>Настройка запуска готова</b><p>Я собрал результат, событие, аудиторию и модель путей. Откройте настройки, чтобы проверить значения или продолжить со мной к участникам.</p></div></div>
      <div class="assistant-launch-summary">
        <span><small>Результат</small><b>${state.assistantAnswers.result}</b></span>
        <span><small>Событие</small><b>${state.assistantAnswers.event}</b></span>
        <span><small>Когда</small><b>${state.assistantAnswers.timing}</b></span>
        <span><small>Охват</small><b>${state.assistantAnswers.audience}</b></span>
        <span><small>Пути</small><b>${state.assistantAnswers.pathType}</b></span>
      </div>
      <button class="btn primary assistant-continue" data-local-action="continue-to-launch">Открыть настроенный запуск →</button>`;
  };

  const assistantPanel = () => {
    const progress = state.assistantStep <= 2 ? 0 : state.assistantStep <= 4 ? 1 : state.assistantStep === 5 ? 2 : 3;
    return `
      <div class="local-overlay assistant-overlay" role="dialog" aria-modal="true" aria-label="Помощник создания workflow">
        <section class="assistant-shell">
          <header class="assistant-head">
            <div><span class="tag purple">AI · черновик под контролем</span><h1>Соберем workflow вместе</h1></div>
            <div><button class="btn" data-local-action="toggle-skills">Навыки помощника</button><button class="btn icon-only" data-local-action="close-assistant">×</button></div>
          </header>
          <div class="assistant-progress">
            ${['Зачем','Когда','Для кого','Пути','Участники','Процесс','Результат','Уведомления','Проверка','Публикация'].map((label,index) => `<span class="${index < progress ? 'done' : index === progress ? 'active' : ''}"><i>${index < progress ? '✓' : index + 1}</i>${label}</span>`).join('')}
          </div>
          <div class="assistant-layout">
            <main class="assistant-dialogue">
              <div class="assistant-context"><span class="status-dot"></span><div><b>Помощник работает с объектами Skillaz</b><small>События, справочники, бизнес-роли, каталоги элементов и целей</small></div></div>
              <div class="assistant-thread">${assistantQuestion()}</div>
              <footer><button class="btn" data-local-action="assistant-back" ${state.assistantStep === 1 ? 'disabled' : ''}>← Назад</button><span>Вопрос ${Math.min(state.assistantStep,6)} из 6 в блоке «Запуск» · изменения не публикуются</span></footer>
            </main>
            <aside class="draft-summary">
              <div class="draft-title"><span class="tag">Живой черновик</span><b>${state.assistantAnswers.scenario || 'Новый workflow'}</b><small>Обновляется после каждого ответа</small></div>
              <article class="${state.assistantAnswers.result ? 'filled' : ''}"><i>1</i><div><small>Результат</small><b>${state.assistantAnswers.result || 'Нужно определить'}</b></div></article>
              <article class="${state.assistantAnswers.event ? 'filled' : ''}"><i>2</i><div><small>Запуск</small><b>${state.assistantAnswers.event || 'Еще не настроено'}</b>${state.assistantAnswers.timing ? `<small>${state.assistantAnswers.timing}</small>` : ''}</div></article>
              <article class="${state.assistantAnswers.audience ? 'filled' : ''}"><i>3</i><div><small>Аудитория и пути</small><b>${state.assistantAnswers.audience || 'Еще не настроено'}</b>${state.assistantAnswers.pathType ? `<small>${state.assistantAnswers.pathType}</small>` : ''}</div></article>
              <article><i>4</i><div><small>Участники и координатор</small><b>Еще не настроено</b></div></article>
              <article><i>5</i><div><small>Действия, цели и КТ</small><b>Еще не настроено</b></div></article>
              <div class="draft-note"><b>Почему это безопасно</b><span>Помощник только готовит предложения. Проверка пути и публикация остаются за администратором.</span></div>
            </aside>
          </div>
          ${assistantSkills()}
        </section>
      </div>`;
  };

  const creationTour = () => `
    <div class="local-overlay tour-overlay" role="dialog" aria-modal="true" aria-label="Порядок создания процесса">
      <section class="tour-card">
        <header><span class="tag blue">Короткий тур · 2 минуты</span><button class="btn icon-only" data-local-action="close-tour">×</button></header>
        <h1>От задачи до опубликованного процесса</h1>
        <p>Не нужно заполнять все сразу. Конструктор ведет по порядку и показывает только нужные настройки.</p>
        <div class="tour-phases">
          <article><i>1</i><div><b>Запуск</b><span>Результат → событие → аудитория</span></div></article>
          <em>→</em>
          <article><i>2</i><div><b>Участники</b><span>Системные роли → бизнес-роли → координатор</span></div></article>
          <em>→</em>
          <article><i>3</i><div><b>Процесс</b><span>Варианты пути → этапы → действия → цели и КТ</span></div></article>
          <em>→</em>
          <article><i>4</i><div><b>Проверка</b><span>Тестовые сотрудники → ошибки → уведомления → публикация</span></div></article>
        </div>
        <div class="tour-tip"><b>Подсказка</b><span>В процессе можно переключиться между понятной схемой и экспертной матрицей этапов.</span></div>
        <footer><button class="btn" data-local-action="close-tour">Пропустить</button><button class="btn primary" data-local-action="close-tour">Начать с результата →</button></footer>
      </section>
    </div>`;

  startNewWorkflow = () => {
    state.creationChoiceOpen = true;
    state.templatePickerOpen = false;
    state.creationAssistantOpen = false;
    state.screen = 'hub';
    render();
  };

  hub = () => originalHub()
    .replaceAll('Workflow адаптации','Workflow входа в роль')
    .replaceAll('Открыть канву','Открыть процесс')
    .replace('Новый workflow с нуля','Новый workflow')
    + (state.creationChoiceOpen ? creationChoice() : '')
    + (state.templatePickerOpen ? templatePicker() : '')
    + (state.creationAssistantOpen ? assistantPanel() : '');

  steps = () => {
    const data = [
      ['base','Запуск','Результат, событие, аудитория'],
      ['participants','Участники','Роли и координатор'],
      ['canvas','Процесс','Пути, этапы и действия'],
      ['settings','Проверка и публикация','Уведомления, тест, версия']
    ];
    return `<nav class="stepbar local-stepbar"><span class="setup-label">Workflow входа в роль</span>${data.map((s,i) => `<button class="step ${state.step === s[0] ? 'active' : ''}" data-step="${s[0]}"><span class="step-num">${i + 1}</span><span><b>${s[1]}</b><small>${s[2]}</small></span></button>`).join('')}</nav>`;
  };

  canvasPage = () => originalCanvasPage()
    .replaceAll('Канва workflow','Процесс')
    .replaceAll('Открыть канву','Открыть процесс')
    .replaceAll('на канве','в процессе')
    .replaceAll('На канве','В процессе')
    .replace('>Конструктор<','>Матрица этапов<');

  editor = () => originalEditor()
    .replaceAll('Канва','Процесс')
    .replaceAll('Основа workflow','Запуск workflow')
    .replaceAll('Настройки workflow','Проверка и публикация')
    + (state.creationTourOpen ? creationTour() : '');

  const submitAssistantText = rawValue => {
    const value = String(rawValue || '').trim();
    if (!value || state.assistantStep > 6) return;
    state.assistantUserMessages[state.assistantStep] = value;
    const lower = value.toLowerCase();
    if (state.assistantStep === 1) {
      state.assistantAnswers.audienceIntent = value;
      state.assistantAnswers.scenario = /оффер|до выход|преборд/.test(lower) ? 'Пребординг'
        : /нов(ая|ую) рол|переход|перевод/.test(lower) ? 'Вход в новую роль'
        : 'Новый сотрудник';
    } else if (state.assistantStep === 2) {
      state.assistantAnswers.audience = /все.*логист/.test(lower) ? 'Логистический центр · все подразделения · массовые должности'
        : /склад|кладовщик|комплектовщик/.test(lower) ? 'Складская логистика · кладовщики и комплектовщики'
        : /достав|курьер|водител/.test(lower) ? 'Доставка · курьеры и водители'
        : /розниц/.test(lower) ? 'Розничная сеть · массовые должности'
        : /производ/.test(lower) ? 'Производственные подразделения · массовые должности'
        : value;
    } else if (state.assistantStep === 3) {
      state.assistantAnswers.result = value;
    } else if (state.assistantStep === 4) {
      state.assistantAnswers.event = /оффер/.test(lower) ? 'ATS · оффер принят'
        : /должност|перевод|новая роль/.test(lower) ? 'Мастер-система · должность изменилась'
        : /ручн/.test(lower) ? 'Администратор · ручной запуск'
        : /вышел|выход|работ/.test(lower) ? 'Мастер-система · сотрудник вышел'
        : value;
    } else if (state.assistantStep === 5) {
      state.assistantAnswers.timing = /за .*(дн|день)|до событ|до выход/.test(lower) ? 'За 5 дней до события'
        : /следующ|через.*день|после/.test(lower) ? 'Через 1 день после события'
        : 'В момент события';
    } else if (state.assistantStep === 6) {
      state.assistantAnswers.pathType = /разн|вариант|ветк|услов|офис|склад|достав/.test(lower)
        ? 'Общая часть + варианты по условиям'
        : 'Один общий путь';
    }
    state.assistantStep += 1;
    render();
    requestAnimationFrame(() => {
      const thread = document.querySelector('.assistant-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  };

  const openGuided = (scenario = '') => {
    state.creationChoiceOpen = false;
    state.templatePickerOpen = false;
    state.creationAssistantOpen = true;
    state.assistantStep = 1;
    state.assistantAnswers = { scenario: scenario || '', audienceIntent: '', result: '', event: '', timing: '', audience: '', pathType: '' };
    state.assistantUserMessages = {};
    state.assistantAudienceMode = '';
    render();
  };

  const useTemplateScenario = code => {
    const presets = {
      preboarding: {title:'Пребординг', result:'Готов к первому рабочему дню', event:'ATS · оффер принят', timing:'За 5 дней до события', audience:'Новые сотрудники выбранных подразделений', pathType:'Общая часть + варианты по условиям'},
      onboarding: {title:'Новый сотрудник', result:'Самостоятельно работает по стандартам роли', event:'Мастер-система · сотрудник вышел', timing:'В момент события', audience:'Логистическая сеть и дочерние подразделения', pathType:'Общая часть + варианты по условиям'},
      'new-role': {title:'Вход в новую роль', result:'Подтвердил готовность к новой роли', event:'Мастер-система · должность изменилась', timing:'В момент события', audience:'Сотрудники, перешедшие на новую должность', pathType:'Общая часть + варианты по условиям'}
    };
    const preset = presets[code] || presets.onboarding;
    loadWorkflow('courier');
    state.screen = 'editor';
    state.newWorkflow = true;
    state.workflow = 'generated';
    state.generatedProcess = true;
    state.newGoalScenario = true;
    state.newKtScenario = true;
    state.processTitle = preset.title;
    state.step = 'base';
    state.view = 'canvas';
    state.layer = 'process';
    state.launchConfigured = true;
    state.assistantAnswers = {...preset, scenario:preset.title};
    state.manualLaunch = {...preset};
    state.creationChoiceOpen = false;
    state.templatePickerOpen = false;
    state.creationAssistantOpen = false;
    render();
  };

  if (!window.__workflowIterationOneBound) {
    window.__workflowIterationOneBound = true;
    document.addEventListener('submit', event => {
      const form = event.target.closest('[data-assistant-form]');
      if (!form) return;
      event.preventDefault();
      submitAssistantText(form.querySelector('[data-assistant-input]')?.value);
    }, true);
    document.addEventListener('click', event => {
      const actionNode = event.target.closest('[data-local-action]');
      const modeNode = event.target.closest('[data-create-mode]');
      const scenarioNode = event.target.closest('[data-assistant-scenario]');
      const resultNode = event.target.closest('[data-assistant-result]');
      const eventNode = event.target.closest('[data-assistant-event]');
      const timingNode = event.target.closest('[data-assistant-timing]');
      const suggestionNode = event.target.closest('[data-assistant-suggest]');
      const audienceModeNode = event.target.closest('[data-audience-mode]');
      const audienceNode = event.target.closest('[data-assistant-audience]');
      const pathNode = event.target.closest('[data-assistant-path]');
      const templateNode = event.target.closest('[data-template-scenario]');

      if (suggestionNode) {
        event.preventDefault();
        submitAssistantText(suggestionNode.dataset.assistantSuggest);
        return;
      }

      if (modeNode) {
        event.preventDefault();
        const mode = modeNode.dataset.createMode;
        if (mode === 'assistant') openGuided();
        if (mode === 'template') {
          state.creationChoiceOpen = false;
          state.templatePickerOpen = true;
          render();
        }
        if (mode === 'expert') {
          state.creationChoiceOpen = false;
          state.creationTourOpen = true;
          originalStartNewWorkflow();
        }
        return;
      }

      if (templateNode) {
        event.preventDefault();
        useTemplateScenario(templateNode.dataset.templateScenario);
        return;
      }

      if (scenarioNode) {
        event.preventDefault();
        state.assistantAnswers.scenario = scenarioNode.dataset.assistantScenario;
        state.assistantStep = 2;
        render();
        return;
      }

      if (resultNode) {
        event.preventDefault();
        state.assistantAnswers.result = resultNode.dataset.assistantResult;
        state.assistantStep = 3;
        render();
        return;
      }

      if (eventNode) {
        event.preventDefault();
        state.assistantAnswers.event = eventNode.dataset.assistantEvent;
        state.assistantStep = 4;
        render();
        return;
      }

      if (timingNode) {
        event.preventDefault();
        state.assistantAnswers.timing = timingNode.dataset.assistantTiming;
        state.assistantStep = 5;
        render();
        return;
      }

      if (audienceModeNode) {
        event.preventDefault();
        const mode = audienceModeNode.dataset.audienceMode;
        if (mode === 'all') {
          state.assistantAnswers.audience = 'Все сотрудники компании';
          state.assistantStep = 6;
        } else {
          state.assistantAudienceMode = mode;
        }
        render();
        return;
      }

      if (audienceNode) {
        event.preventDefault();
        state.assistantAnswers.audience = audienceNode.dataset.assistantAudience;
        state.assistantAudienceMode = '';
        state.assistantStep = 6;
        render();
        return;
      }

      if (pathNode) {
        event.preventDefault();
        state.assistantAnswers.pathType = pathNode.dataset.assistantPath;
        state.assistantStep = 7;
        render();
        return;
      }

      if (!actionNode) return;
      event.preventDefault();
      const action = actionNode.dataset.localAction;
      if (action === 'close-entry') {
        state.creationChoiceOpen = false;
        state.templatePickerOpen = false;
        render();
      }
      if (action === 'back-to-entry') {
        state.templatePickerOpen = false;
        state.creationChoiceOpen = true;
        render();
      }
      if (action === 'close-assistant') {
        state.creationAssistantOpen = false;
        state.creationChoiceOpen = true;
        render();
      }
      if (action === 'toggle-skills') {
        state.assistantSkillsOpen = !state.assistantSkillsOpen;
        render();
      }
      if (action === 'assistant-back') {
        if (state.assistantStep === 5 && state.assistantAudienceMode) {
          state.assistantAudienceMode = '';
          render();
          return;
        }
        state.assistantStep = Math.max(1, state.assistantStep - 1);
        delete state.assistantUserMessages[state.assistantStep];
        if (state.assistantStep === 1) { state.assistantAnswers.scenario = ''; state.assistantAnswers.audienceIntent = ''; }
        if (state.assistantStep === 2) state.assistantAnswers.audience = '';
        if (state.assistantStep === 3) state.assistantAnswers.result = '';
        if (state.assistantStep === 4) state.assistantAnswers.event = '';
        if (state.assistantStep === 5) state.assistantAnswers.timing = '';
        if (state.assistantStep === 6) state.assistantAnswers.pathType = '';
        render();
      }
      if (action === 'change-audience-method') {
        state.assistantAudienceMode = '';
        state.assistantAnswers.audience = '';
        render();
      }
      if (action === 'continue-to-launch') {
        state.creationAssistantOpen = false;
        state.creationTourOpen = false;
        state.launchConfigured = true;
        originalStartNewWorkflow();
      }
      if (action === 'close-tour') {
        state.creationTourOpen = false;
        render();
      }
    }, true);
  }

  render();
})();
