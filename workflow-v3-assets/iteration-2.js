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
              <button class="audience-source ${state.scopeSelections.org.length || /Структура:/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-audience"><i>⌘</i><span><b>Оргструктура</b><small>Подразделения и дочерние узлы</small></span><em>Выбрать</em></button>
              <button class="audience-source ${state.scopeSelections.role.length || /Должности:/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-role-audience"><i>▤</i><span><b>Должности</b><small>Должности и группы должностей</small></span><em>Выбрать</em></button>
              <button class="audience-source ${state.scopeSelections.group.length || /Группы:/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-group"><i>◉</i><span><b>Группы сотрудников</b><small>Сохраненные динамические группы</small></span><em>Выбрать</em></button>
              <button class="audience-source ${state.scopeSelections.location.length || /Территория:/.test(data.audience || '') ? 'selected' : ''}" data-local-action="select-demo-location-audience"><i>⌖</i><span><b>Территория</b><small>Регион, город или площадка</small></span><em>Выбрать</em></button>
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
    const directory = window.SkillazReferenceData;
    const query = [data.audience,data.result,state.assistantAnswers?.scenario,...(state.assistantLiveHistory||[]).map(item=>item.text)].filter(Boolean).join(' ');
    const domain = directory?.detectDomains(query)?.[0] || 'office';
    const roles = directory?.relevantPositions(query,3) || [];
    const regions = directory?.relevantRegions(query,2) || [];
    const names = ['Мария Волкова','Алексей Смирнов','Анна Крылова'];
    const department = {retail:'Розничная сеть',logistics:'Логистическая сеть',production:'Производственная площадка',office:'Корпоративный центр'}[domain];
    const counts = {retail:'1 846',logistics:'1 248',production:'936',office:'684'};
    const sampleRows = names.map((name,index)=>({name,role:roles[index]?.title || 'Сотрудник',profile:`${department} · ${regions[index%Math.max(regions.length,1)]?.cities?.[0] || regions[index%Math.max(regions.length,1)]?.name || 'Москва'}`}));
    return `<div class="local-overlay audience-preview-overlay" role="dialog" aria-modal="true" aria-label="Проверка охвата"><section class="audience-preview-card">
      <header><div><span class="tag green">Тестовая выборка</span><h1>Кто входит в базовый охват</h1><p>${data.audience || 'Аудитория еще не настроена'}</p></div><button class="btn icon-only" data-local-action="close-audience-preview">×</button></header>
      <div class="audience-metrics"><article><b>${hasAudience ? counts[domain] : '0'}</b><span>попадают в охват</span></article><article><b>${hasAudience ? String(directory?.relevantStructures(query)?.[0]?.children?.length || 0) : '0'}</b><span>подразделений верхнего уровня</span></article><article><b>${hasAudience ? String(directory?.relevantPositions(query,18)?.length || 0) : '0'}</b><span>должностей в подборе</span></article><article><b>0</b><span>ошибок данных</span></article></div>
      <div class="audience-test-table"><div class="head"><span>Сотрудник</span><span>Данные профиля</span><span>Результат</span></div>
        ${sampleRows.map(row=>`<div><span><b>${row.name}</b><small>${row.role}</small></span><span>${row.profile}</span><span class="tag green">В охвате</span></div>`).join('')}
      </div>
      <footer><span>Планы и уведомления не создаются.</span><button class="btn primary" data-local-action="close-audience-preview">Вернуться к настройке</button></footer>
    </section></div>`;
  };

  state.scopeSelections ??= {org:[],role:[],group:[],location:[]};
  const referenceQuery = () => [answers().audience,state.assistantAnswers?.audienceIntent,...(state.assistantLiveHistory||[]).filter(item=>item.role==='user').map(item=>item.text)].filter(Boolean).join(' ');
  const normalizedScope = value => String(value||'').toLowerCase().replace(/ё/g,'е');
  const audienceMatches = value => {
    const audience = normalizedScope(answers().audience);
    const stop = ['магаз','сотруд','регион','област','республик','край','округ','отдел','групп','подраздел','адаптац','специалист','менеджер','руководител','самостоятель','обучен'];
    const words = normalizedScope(value).split(/[^а-яa-z0-9]+/).filter(word=>word.length>4&&!stop.some(stem=>word.startsWith(stem)));
    return words.some(word=>audience.includes(word) || audience.includes(word.slice(0,Math.min(5,word.length))));
  };
  const audienceMentions = value => {
    if(state.scopePicker==='role'&&!audienceMatches(value))return false;
    const tokens = normalizedScope(answers().audience).split(/[^а-яa-z0-9]+/).filter(Boolean);
    const target = normalizedScope(value);
    const distance = (left,right) => {
      const row = Array.from({length:right.length+1},(_,index)=>index);
      for (let i=1;i<=left.length;i++) { let previous=row[0]; row[0]=i; for (let j=1;j<=right.length;j++) { const current=row[j]; row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(left[i-1]===right[j-1]?0:1)); previous=current; } }
      return row[right.length];
    };
    const prefixLength = target.length >= 8 ? 8 : target.length >= 5 ? target.length - 1 : target.length;
    return tokens.some(token=>token===target || (prefixLength>=4&&token.slice(0,prefixLength)===target.slice(0,prefixLength)) || (target.length<=4&&token.slice(0,2)===target.slice(0,2)&&distance(token,target)<=2));
  };
  const scopeWasChosen = type => state.scopeSelectionConfigured?.[type] || Boolean(state.scopeSelections[type]?.length);
  const checkedScope = (type,id,value) => scopeWasChosen(type) ? state.scopeSelections[type]?.includes(id) : audienceMatches(value);
  const domainLabel = value => ({retail:'Розница',logistics:'Логистика',production:'Производство',office:'Офис'}[value] || value);
  const levelLabel = value => ({manager:'Руководитель',senior:'Старший специалист',specialist:'Специалист'}[value] || value);
  const orgHasContextMatch = node => audienceMatches(node.name) || (node.children || []).some(orgHasContextMatch);
  const renderOrgNode = (node,depth=0,index=0,suppressDefault=false) => {
    const selected = checkedScope('org',node.id,node.name,index,suppressDefault);
    if (!node.children?.length) return `<label class="tree-leaf"><input type="checkbox" data-scope-value="${node.id}" data-scope-label="${node.name}" ${selected?'checked':''}><span><b>${node.name}</b><small>ID ${node.id} · ${node.type}</small></span></label>`;
    return `<details ${depth < 2?'open':''}><summary><span class="tree-chevron">›</span><label><input type="checkbox" data-scope-value="${node.id}" data-scope-label="${node.name}" ${selected?'checked':''}><b>${node.name}</b><small>${node.children.length}</small></label><em>${node.type}</em></summary><div class="tree-children">${node.children.map((child,childIndex)=>renderOrgNode(child,depth+1,childIndex,suppressDefault)).join('')}</div></details>`;
  };

  const scopePicker = () => {
    if (!state.scopePicker) return '';
    const directory = window.SkillazReferenceData;
    const query = referenceQuery();
    if (state.scopePicker === 'org') {
      const trees = directory?.relevantStructures(query) || [];
      const suppressDefault = trees.some(orgHasContextMatch);
      return `<div class="local-overlay scope-picker-overlay" role="dialog" aria-modal="true" aria-label="Выбор оргструктуры"><section class="scope-picker-card org-tree-card"><header><div><span class="tag blue">Базовый охват</span><h2>Оргструктура</h2><p>Показаны подразделения, подходящие контексту процесса. Можно раскрывать узлы и выбирать дочерние подразделения.</p></div><button class="btn icon-only" data-local-action="close-scope-picker">×</button></header><div class="directory-context"><b>Подобрано по контексту</b><span>${trees.map(tree=>tree.name).join(', ')}</span></div><div class="org-tree" role="tree">${trees.map((tree,index)=>renderOrgNode(tree,0,index,suppressDefault)).join('')}</div><footer><button class="btn" data-local-action="close-scope-picker">Отмена</button><button class="btn primary" data-local-action="apply-scope-picker">Применить выбор</button></footer></section></div>`;
    }
    const cityRows = (directory?.regions || []).flatMap(region => region.cities.map(city=>({id:`${region.id}-city-${normalizedScope(city)}`,label:city,meta:`Город · ${region.name} · ${region.district}`,preselected:audienceMentions(city)}))).filter(row=>row.preselected||state.scopeSelections.location?.includes(row.id));
    const rows = state.scopePicker === 'role' ? (directory?.relevantPositions(query,18)||[]).map(row=>({id:row.id,label:row.title,meta:`${domainLabel(row.domain)} · ${levelLabel(row.level)}`,preselected:audienceMentions(row.title)||audienceMatches(row.title)}))
      : state.scopePicker === 'group' ? (directory?.relevantGroups(query,14)||[]).map(row=>({id:row.id,label:row.name,meta:row.rule}))
      : [...cityRows,{id:'all-regions',label:'Все регионы присутствия',meta:'Все площадки выбранной структуры'},...(directory?.relevantRegions(query,100)||[]).map(row=>({id:row.id,label:row.name,meta:`${row.district} · ${row.cities.slice(0,4).join(', ')}`}))];
    const title = {role:'Должности',group:'Группы сотрудников',location:'Территория'}[state.scopePicker];
    const suppressDefault = state.scopePicker === 'location' ? (cityRows.length > 0 || rows.some(row=>audienceMatches(`${row.label} ${row.meta}`))) : state.scopePicker === 'role' ? rows.some(row=>row.preselected) : false;
    const rowChecked = (row,index) => scopeWasChosen(state.scopePicker) ? (state.scopeSelections[state.scopePicker]?.includes(row.id)||(state.scopePicker==='location'&&state.scopeSelections.location?.includes('all-regions'))) : row.preselected || (state.scopePicker==='location'&&cityRows.length ? false : checkedScope(state.scopePicker,row.id,row.label,index,suppressDefault));
    return `<div class="local-overlay scope-picker-overlay" role="dialog" aria-modal="true" aria-label="Выбор охвата"><section class="scope-picker-card reference-picker-card"><header><div><span class="tag blue">Базовый охват</span><h2>${title}</h2><p>Справочник отфильтрован по должностям, структуре и сценарию из диалога с AI.</p></div><button class="btn icon-only" data-local-action="close-scope-picker">×</button></header><div class="directory-context"><b>Найдено по контексту</b><span>${rows.length} значений · первые варианты рекомендованы</span></div><div class="scope-options reference-options">${rows.map((row,index)=>`<label><input type="checkbox" data-scope-value="${row.id}" data-scope-label="${row.label}" ${rowChecked(row,index)?'checked':''}><span><b>${row.label}</b><small>${row.meta}</small></span></label>`).join('')}</div><footer><button class="btn" data-local-action="close-scope-picker">Отмена</button><button class="btn primary" data-local-action="apply-scope-picker">Применить выбор</button></footer></section></div>`;
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
      const scopeInput=event.target.closest('[data-scope-value]');
      if(scopeInput&&state.scopePicker==='location'){
        const all=document.querySelector('[data-scope-value="all-regions"]');
        if(scopeInput===all)document.querySelectorAll('[data-scope-value]').forEach(input=>input.checked=all.checked);
        else if(all&&!scopeInput.checked)all.checked=false;
      }
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
        const checked = [...document.querySelectorAll('.scope-picker-card [data-scope-value]:checked')];
        let ids = checked.map(input=>input.dataset.scopeValue);
        let labels = [...new Set(checked.map(input=>input.dataset.scopeLabel).filter(Boolean))];
        if(state.scopePicker==='location'){
          if(ids.includes('all-regions')){ids=['all-regions'];labels=['Все регионы присутствия'];}
          state.launchScope={confirmed:ids.length>0,allRegions:ids.includes('all-regions'),locationIds:ids,label:labels.join(', ')};
        }
        state.scopeSelections[state.scopePicker] = ids;
        state.scopeSelectionConfigured||={};state.scopeSelectionConfigured[state.scopePicker]=true;
        const prefix = {org:'Структура',role:'Должности',group:'Группы',location:'Территория'}[state.scopePicker];
        const base = String(state.manualLaunch.audience || state.assistantAnswers?.audience || '').split(' · ').filter(part=>!part.startsWith(prefix+':'));
        if (labels.length) base.push(`${prefix}: ${labels.slice(0,8).join(', ')}`);
        state.manualLaunch.audience = base.join(' · ');
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
