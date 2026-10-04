// Iteration 2: launch, audience and path model for the local research prototype.
(() => {
  state.launchConfigured ??= false;
  state.audiencePreviewOpen = false;
  state.scopePicker ??= null;
  state.manualLaunch = state.manualLaunch || {
    result: '',
    event: '',
    timing: '',
    audience: '',
    pathType: ''
  };

  const previousBasePage = basePageV2;
  const previousEditor = editor;

  const answers = () => ({ ...state.manualLaunch, ...(state.launchConfigured ? state.assistantAnswers : {}) });
  const isFilled = value => Boolean(String(value || '').trim());
  const eventOptions = () => (window.SkillazDemoDB?.events || [])
    .filter(([, name]) => /оффер принят|сотрудник вышел|должность изменилась|ручной запуск/i.test(name))
    .map(([, name]) => `<option ${answers().event === name ? 'selected' : ''}>${name}</option>`)
    .join('');

  const launchPage = () => {
    const data = answers();
    const launchReady = isFilled(data.event) && isFilled(data.timing);
    const readyCount = [data.result, launchReady ? 'ready' : '', data.audience, data.pathType].filter(isFilled).length;
    return `<div class="editor-toolbar launch-toolbar"><div><b>Запуск workflow</b><small>${readyCount} из 4 обязательных блоков заполнено</small></div><div class="launch-readiness"><i style="--ready:${readyCount * 25}%"></i><span>${readyCount * 25}%</span></div><div class="topbar-spacer"></div><button class="btn" data-local-action="resume-launch-assistant">✦ Продолжить с помощником</button><span class="tag ${readyCount === 4 ? 'green' : ''}">${readyCount === 4 ? 'Запуск настроен' : 'Черновик'}</span></div>
    <div class="page launch-page"><div class="page-card wide-card launch-card">
      <header class="launch-title"><div><span class="tag blue">Шаг 1 · Запуск</span><h1>Зачем, когда и для кого создается план</h1><p>Сначала задайте рамки процесса. Содержание и участников настроим на следующих шагах.</p></div><button class="btn" data-local-action="preview-audience" ${isFilled(data.audience) ? '' : 'disabled title="Сначала выберите базовый охват"'}>Проверить на сотрудниках</button></header>

      <section class="three-levels">
        <article><i>1</i><div><b>Охват</b><span>Кто вообще может получить workflow</span></div></article>
        <em>→</em>
        <article><i>2</i><div><b>Запуск</b><span>Когда конкретному сотруднику создается план</span></div></article>
        <em>→</em>
        <article><i>3</i><div><b>Вариант пути</b><span>Что именно войдет в персональный план</span></div></article>
      </section>

      <div class="launch-layout">
        <main class="launch-form">
          <section class="launch-section ${isFilled(data.result) ? 'complete' : ''}">
            <header><span>1</span><div><h2>Ожидаемый результат</h2><p>Что должно быть правдой в конце процесса?</p></div><em>${isFilled(data.result) ? '✓ Готово' : 'Обязательно'}</em></header>
            <label class="launch-field"><span>Результат для сотрудника</span><input data-launch-field="result" value="${data.result || ''}" placeholder="Например: самостоятельно работает по стандартам новой роли"></label>
          </section>

          <section class="launch-section ${isFilled(data.event) ? 'complete' : ''}">
            <header><span>2</span><div><h2>Событие и момент запуска</h2><p>Событие приходит из системы-источника, а правило определяет дату создания плана.</p></div><em>${isFilled(data.event) && isFilled(data.timing) ? '✓ Готово' : 'Обязательно'}</em></header>
            <div class="launch-field-grid">
              <label class="launch-field"><span>Системное событие</span><select data-launch-field="event"><option value="">Выберите событие</option>${eventOptions()}</select><small>Можно добавить несколько правил после создания основного.</small></label>
              <label class="launch-field"><span>Когда создать план</span><select data-launch-field="timing"><option value="">Выберите момент</option>${['За 5 дней до события','В момент события','Через 1 день после события'].map(value => `<option ${data.timing === value ? 'selected' : ''}>${value}</option>`).join('')}</select><small>Дата рассчитывается отдельно для каждого сотрудника.</small></label>
            </div>
          </section>

          <section class="launch-section ${isFilled(data.audience) ? 'complete' : ''}">
            <header><span>3</span><div><h2>Базовый охват</h2><p>Ветки и правила запуска не смогут выйти за пределы этой аудитории.</p></div><em>${isFilled(data.audience) ? '✓ Готово' : 'Обязательно'}</em></header>
            <div class="audience-builder">
              <button class="audience-source ${/Логистическая сеть|Клиентские офисы/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-audience"><i>⌘</i><span><b>Оргструктура</b><small>Подразделения и дочерние узлы</small></span><em>Выбрать</em></button>
              <button class="audience-source ${/Массовые роли/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-role-audience"><i>▤</i><span><b>Должности</b><small>Должности и группы должностей</small></span><em>Выбрать</em></button>
              <button class="audience-source ${/Группа сотрудников/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-group"><i>◉</i><span><b>Группы сотрудников</b><small>Сохраненные динамические группы</small></span><em>Выбрать</em></button>
              <button class="audience-source ${/Регионы присутствия/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-location-audience"><i>⌖</i><span><b>Территория</b><small>Регион, город или площадка</small></span><em>Выбрать</em></button>
            </div>
            ${data.audience ? `<div class="selected-audience"><span>Выбранный охват</span><b>${data.audience}</b><small>В расширенной настройке источники можно объединять условиями И/ИЛИ.</small></div>` : ''}
            <div class="scope-note"><b>Почему охват задается отдельно</b><span>Он защищает от ошибочного назначения за пределами выбранной структуры, даже если условие события настроено слишком широко.</span></div>
          </section>

          <section class="launch-section ${isFilled(data.pathType) ? 'complete' : ''}">
            <header><span>4</span><div><h2>Модель вариантов пути</h2><p>Выберите стартовую модель. Условия конкретных вариантов появятся в разделе «Процесс».</p></div><em>${isFilled(data.pathType) ? '✓ Готово' : 'Обязательно'}</em></header>
            <div class="path-models">
              <label class="${data.pathType === 'Один общий путь' ? 'selected' : ''}"><input type="radio" name="pathModel" value="Один общий путь" data-launch-field="pathType" ${data.pathType === 'Один общий путь' ? 'checked' : ''}><span><b>Один общий путь</b><small>Одинаковые этапы и действия для всей аудитории</small></span></label>
              <label class="${data.pathType === 'Общая часть + варианты по условиям' ? 'selected' : ''}"><input type="radio" name="pathModel" value="Общая часть + варианты по условиям" data-launch-field="pathType" ${data.pathType === 'Общая часть + варианты по условиям' ? 'checked' : ''}><span><b>Общая часть + варианты</b><small>Общее начало и разные блоки по должности, подразделению или формату работы</small></span></label>
            </div>
          </section>
        </main>

        <aside class="launch-summary">
          <span class="tag">Резюме запуска</span>
          <h2>${state.assistantAnswers.scenario || 'Новый workflow'}</h2>
          <article class="${isFilled(data.result) ? 'ready' : ''}"><small>Результат</small><b>${data.result || 'Не задан'}</b></article>
          <article class="${isFilled(data.event) ? 'ready' : ''}"><small>Запуск</small><b>${data.event || 'Не задан'}</b><span>${data.timing || ''}</span></article>
          <article class="${isFilled(data.audience) ? 'ready' : ''}"><small>Охват</small><b>${data.audience || 'Не задан'}</b></article>
          <article class="${isFilled(data.pathType) ? 'ready' : ''}"><small>Путь</small><b>${data.pathType || 'Не задан'}</b></article>
          <div class="launch-next"><b>Следующий шаг</b><span>Определить системные и бизнес-роли, затем выбрать координатора сопровождения.</span></div>
          <button class="btn primary" data-step="participants" ${readyCount < 4 ? 'disabled title="Заполните четыре обязательных блока"' : ''}>Продолжить к участникам →</button>
        </aside>
      </div>
    </div></div>`;
  };

  const audiencePreview = () => {
    if (!state.audiencePreviewOpen) return '';
    const data = answers();
    const hasAudience = isFilled(data.audience);
    return `<div class="local-overlay audience-preview-overlay" role="dialog" aria-modal="true" aria-label="Проверка охвата"><section class="audience-preview-card">
      <header><div><span class="tag green">Тестовая выборка</span><h1>Кто входит в базовый охват</h1><p>${data.audience || 'Аудитория еще не настроена'}</p></div><button class="btn icon-only" data-local-action="close-audience-preview">×</button></header>
      <div class="audience-metrics"><article><b>${hasAudience ? '1 248' : '0'}</b><span>попадают в охват</span></article><article><b>${hasAudience ? '3' : '0'}</b><span>подразделения</span></article><article><b>${hasAudience ? '12' : '0'}</b><span>должностей</span></article><article><b>0</b><span>ошибок данных</span></article></div>
      <div class="audience-test-table"><div class="head"><span>Сотрудник</span><span>Данные профиля</span><span>Результат</span></div>
        <div><span><b>Мария Волкова</b><small>Специалист доставки</small></span><span>Доставка · Москва · сменный график</span><span class="tag green">В охвате</span></div>
        <div><span><b>Алексей Смирнов</b><small>Кладовщик</small></span><span>Складская логистика · Казань</span><span class="tag green">В охвате</span></div>
        <div><span><b>Анна Крылова</b><small>Региональный менеджер</small></span><span>Корпоративный центр · Москва</span><span class="tag">Не входит</span></div>
      </div>
      <footer><span>Планы и уведомления не создаются.</span><button class="btn primary" data-local-action="close-audience-preview">Вернуться к настройке</button></footer>
    </section></div>`;
  };

  const scopePicker = () => {
    if (!state.scopePicker) return '';
    if (state.scopePicker === 'org') {
      return `<div class="local-overlay scope-picker-overlay" role="dialog" aria-modal="true" aria-label="Выбор оргструктуры"><section class="scope-picker-card org-tree-card"><header><div><span class="tag blue">Базовый охват</span><h2>Оргструктура</h2><p>Раскройте подразделения и выберите нужный узел целиком или отдельные дочерние подразделения.</p></div><button class="btn icon-only" data-local-action="close-scope-picker">×</button></header><div class="org-tree" role="tree">
        <div class="org-tree-root"><label><input type="checkbox"><span class="org-icon">▦</span><b>Подразделения</b><small>67</small></label></div>
        <details open><summary><span class="tree-chevron">›</span><label><input type="checkbox" checked><b>Розничная сеть</b><small>24</small></label><em>ID D001</em></summary><div class="tree-children">
          <label><input type="checkbox" checked><span><b>Москва и Московская область</b><small>ID D011 · 86 магазинов</small></span></label>
          <label><input type="checkbox"><span><b>Санкт-Петербург и Северо-Запад</b><small>ID D012 · 42 магазина</small></span></label>
          <label><input type="checkbox"><span><b>Поволжье</b><small>ID D013 · 37 магазинов</small></span></label>
        </div></details>
        <details><summary><span class="tree-chevron">›</span><label><input type="checkbox"><b>Логистическая сеть</b><small>18</small></label><em>ID D002</em></summary><div class="tree-children">
          <label><input type="checkbox"><span><b>Складская логистика</b><small>ID D021 · дочерние подразделения</small></span></label>
          <label><input type="checkbox"><span><b>Доставка</b><small>ID D022 · региональные центры</small></span></label>
        </div></details>
        <details><summary><span class="tree-chevron">›</span><label><input type="checkbox"><b>Клиентские офисы</b><small>16</small></label><em>ID D003</em></summary><div class="tree-children"><label><input type="checkbox"><span><b>Региональные офисы</b><small>ID D031 · все дочерние узлы</small></span></label></div></details>
      </div><footer><button class="btn" data-local-action="close-scope-picker">Отмена</button><button class="btn primary" data-local-action="apply-scope-picker">Применить выбор</button></footer></section></div>`;
    }
    const data = {
      role: ['Должности', ['Кладовщик', 'Специалист доставки', 'Менеджер клиентского офиса', 'Группа должностей «Массовые роли»']],
      group: ['Группы сотрудников', ['Новые сотрудники', 'Кадровый резерв руководителей', 'Сотрудники на испытательном сроке']],
      location: ['Территория', ['Москва', 'Казань', 'Екатеринбург', 'Все площадки выбранных подразделений']]
    }[state.scopePicker];
    return `<div class="local-overlay scope-picker-overlay" role="dialog" aria-modal="true" aria-label="Выбор охвата"><section class="scope-picker-card"><header><div><span class="tag blue">Базовый охват</span><h2>${data[0]}</h2><p>Можно выбрать несколько значений. В рабочей версии данные придут из справочников клиента.</p></div><button class="btn icon-only" data-local-action="close-scope-picker">×</button></header><div class="scope-options">${data[1].map((value,index)=>`<label><input type="checkbox" ${index < 2 ? 'checked' : ''}><span><b>${value}</b><small>${index < 2 ? 'Выбрано для демо' : 'Доступно для выбора'}</small></span></label>`).join('')}</div><footer><button class="btn" data-local-action="close-scope-picker">Отмена</button><button class="btn primary" data-local-action="apply-scope-picker">Применить выбор</button></footer></section></div>`;
  };

  basePageV2 = () => state.newWorkflow ? launchPage() : previousBasePage();
  editor = () => previousEditor() + audiencePreview() + scopePicker();

  if (!window.__workflowIterationTwoBound) {
    window.__workflowIterationTwoBound = true;
    document.addEventListener('input', event => {
      const field = event.target.closest('[data-launch-field]');
      if (!field) return;
      const key = field.dataset.launchField;
      state.manualLaunch[key] = field.value;
      if (state.launchConfigured) state.assistantAnswers[key] = field.value;
    });
    document.addEventListener('change', event => {
      const field = event.target.closest('[data-launch-field]');
      if (!field) return;
      const key = field.dataset.launchField;
      state.manualLaunch[key] = field.value;
      if (state.launchConfigured) state.assistantAnswers[key] = field.value;
      if (key === 'pathType') render();
    });
    document.addEventListener('click', event => {
      const node = event.target.closest('[data-local-action]');
      if (!node) return;
      const action = node.dataset.localAction;
      if (action === 'select-demo-audience') {
        event.preventDefault();
        state.scopePicker = 'org';
        render();
      }
      if (action === 'select-demo-role-audience') {
        event.preventDefault();
        state.scopePicker = 'role';
        render();
      }
      if (action === 'select-demo-group') {
        event.preventDefault();
        state.scopePicker = 'group';
        render();
      }
      if (action === 'select-demo-location-audience') {
        event.preventDefault();
        state.scopePicker = 'location';
        render();
      }
      if (action === 'close-scope-picker') {
        event.preventDefault();
        state.scopePicker = null;
        render();
      }
      if (action === 'apply-scope-picker') {
        event.preventDefault();
        const values = {org:'Розничная сеть · Москва и Московская область · дочерние подразделения',role:'Массовые роли: кладовщик, специалист доставки, менеджер клиентского офиса',group:'Группы: новые сотрудники и кадровый резерв руководителей',location:'Территория: Москва и Казань'};
        state.manualLaunch.audience = values[state.scopePicker];
        if (state.launchConfigured) state.assistantAnswers.audience = state.manualLaunch.audience;
        state.scopePicker = null;
        render();
      }
      if (action === 'preview-audience') {
        event.preventDefault();
        state.audiencePreviewOpen = true;
        render();
      }
      if (action === 'close-audience-preview') {
        event.preventDefault();
        state.audiencePreviewOpen = false;
        render();
      }
      if (action === 'resume-launch-assistant') {
        event.preventDefault();
        state.screen = 'hub';
        state.creationAssistantOpen = true;
        state.assistantStep = state.assistantAnswers.pathType ? 7 : state.assistantAnswers.audience ? 6 : state.assistantAnswers.timing ? 5 : state.assistantAnswers.event ? 4 : state.assistantAnswers.result ? 3 : 1;
        render();
      }
    }, true);
  }

  render();
})();
