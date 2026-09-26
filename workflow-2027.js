(function(){
  const flows={
    preboarding:{name:'Пребординг',result:'Готовность к первому рабочему дню',event:'ATS · оффер принят',branches:{base:'Общий контур',office:'Офисный сотрудник',warehouse:'Склад и логистика',remote:'Удалённая работа'},nodes:[
      ['article','Что будет в первый рабочий день','Сотрудник','Материал открыт','Документы заполнены'],['task','Заполнить данные и документы','Сотрудник','Задача выполнена','Доступы готовы'],['task','Подготовить рабочее место и доступы','HR · IT','Все обязательные задачи выполнены','Проверить готовность'],['check','Контроль готовности до выхода','HR','Нет блокеров','Первый рабочий день'],['task','Встреча с командой','Руководитель','Встреча назначена','Цикл завершён']
    ]},
    onboarding:{name:'Адаптация',result:'Выход на целевую продуктивность',event:'Мастер-система · сотрудник вышел',branches:{base:'Общий контур',delivery:'Доставка · курьер',warehouse:'Склад · кладовщик',service:'Клиентский сервис'},nodes:[
      ['task','Подтвердить готовность доступов','Сотрудник','Выполнено','Освоить основы роли'],['course','Основы роли и обязательное обучение','Сотрудник','Тест ≥ 80%','Перейти к практике'],['task','Практика с наставником','Сотрудник · наставник','Практика выполнена','Контрольная точка 30 дней'],['check','Контрольная точка 30 дней','Руководитель','Риска нет','Самостоятельная работа'],['task','Самостоятельная рабочая смена','Сотрудник','Результат подтверждён','Итоговая оценка'],['goal','Цель адаптации достигнута','Руководитель','Все критерии выполнены','Цикл завершён']
    ]},
    transition:{name:'Внутренний переход',result:'Готовность к новой роли',event:'Мастер-система · должность изменилась',branches:{base:'Общие требования',horizontal:'Горизонтальный переход',vertical:'Повышение',manager:'Переход в руководство'},nodes:[
      ['check','Входная диагностика роли','Сотрудник','Пробелы определены','Согласовать цели'],['goal','Цели входа в новую роль','Сотрудник · руководитель','Цели согласованы','Назначить развитие'],['course','Знания новой роли','Сотрудник','Тест пройден','Практика'],['task','Рабочая задача под наблюдением','Сотрудник · наставник','Задача принята','Оценка навыка'],['check','Лист оценки практики','Эксперт','Навык подтверждён','Решение о готовности'],['goal','Готовность к роли подтверждена','Руководитель','Решение принято','Цикл завершён']
    ]},
    learning:{name:'Программа обучения',result:'Пробел навыка закрыт',event:'Оценка, расписание или ручной запуск',branches:{base:'Обязательная часть',gap:'Пробел по результату оценки',compliance:'Регулярная аттестация',request:'Обучение по запросу'},nodes:[
      ['check','Входное тестирование','Сотрудник','Результат ниже порога','Назначить обучение'],['course','Учебная программа по навыку','Сотрудник','Курс завершён','Промежуточный тест'],['check','Промежуточный тест','Сотрудник','Баллы ≥ 80%','Практика'],['task','Применить навык в работе','Сотрудник · руководитель','Практика принята','Финальная проверка'],['check','Повторная оценка навыка','Эксперт','Уровень подтверждён','Закрыть пробел'],['goal','Навык подтверждён','Руководитель','Целевой уровень достигнут','Цикл завершён']
    ]}
  };
  let selectedFlow='onboarding',selectedBranch='warehouse',selectedScenario='success',aiStep=1,aiTemplate='onboarding';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function enhance(){
    addBranchTab();addAiEntry();augmentDrawer();augmentHub();wirePorts();
  }
  function addBranchTab(){
    const tabs=$('.view-tabs');if(!tabs||$('.branch-test-btn',tabs))return;
    const b=document.createElement('button');b.className='branch-test-btn';b.textContent='Проверка веток';b.title='Показывает маршрут выбранной ветки и переходы по результатам';b.onclick=openBranchTest;tabs.appendChild(b);
  }
  function addAiEntry(){
    const bar=$('.topbar');if(!bar||$('.ai-workflow-entry',bar))return;
    const publish=$('[data-action="openPublish"]',bar);const b=document.createElement('button');b.className='btn ai-workflow-entry';b.textContent='✦ Новый workflow с AI';b.onclick=openAiWizard;bar.insertBefore(b,publish||null);
  }
  function augmentDrawer(){
    const drawer=$('.drawer:not([hidden])');if(!drawer||$('.notify-template-block',drawer))return;
    const body=$('.drawer-body',drawer)||drawer.querySelector('div');if(!body)return;
    const block=document.createElement('section');block.className='notify-template-block';block.innerHTML='<label>Шаблон уведомлений <span style="font-weight:400;color:#71869a">· необязательно</span></label><select><option>Без уведомлений</option><option selected>Назначение + напоминание до срока</option><option>Обязательное обучение · с эскалацией</option><option>Контрольная точка · руководителю</option><option>Результат проверки · сотруднику и руководителю</option></select><small>Каналы и текст хранятся в шаблоне. В этом размещении можно переопределить получателя и момент отправки.</small>';
    body.appendChild(block);
  }
  function augmentHub(){
    const root=$('.hub-main');if(!root||$('.demo-processes',root))return;
    const section=document.createElement('section');section.innerHTML='<div style="margin-top:26px"><b>Четыре процесса первой версии</b><p class="muted" style="margin:4px 0">Откройте проверку маршрута, чтобы увидеть ветвление по результатам.</p></div><div class="demo-processes">'+Object.entries(flows).map(([id,f])=>`<article class="demo-process"><span class="tag blue">${esc(f.event)}</span><h3>${esc(f.name)}</h3><p>${esc(f.result)}</p><footer><button class="btn" data-demo-route="${id}">Проверить путь</button></footer></article>`).join('')+'</div>';
    root.appendChild(section);$$('[data-demo-route]',section).forEach(b=>b.onclick=()=>{selectedFlow=b.dataset.demoRoute;selectedBranch=Object.keys(flows[selectedFlow].branches)[1]||'base';if(typeof loadWorkflow==='function')loadWorkflow('courier');state.screen='editor';state.step='canvas';render();setTimeout(openBranchTest,0)});
  }
  function wirePorts(){
    $$('.element-card .port').forEach(port=>{if(port.dataset.wired)return;port.dataset.wired='1';port.title='Добавить переход по результату';port.onclick=e=>{e.preventDefault();e.stopPropagation();openTransition(port.closest('.element-card')?.querySelector('b')?.textContent||'Элемент')}})
  }
  function openBranchTest(){
    const main=$('.main');if(!main)return;$('.workspace',main)?.setAttribute('hidden','');$('.branch-test-page',main)?.remove();
    $$('.view-tabs button').forEach(x=>x.classList.remove('active'));$('.branch-test-btn')?.classList.add('active');
    const page=document.createElement('section');page.className='branch-test-page';page.innerHTML=branchTestMarkup();main.appendChild(page);wireBranchTest(page);
  }
  function branchTestMarkup(){
    const f=flows[selectedFlow];const branches=f.branches;if(!branches[selectedBranch])selectedBranch=Object.keys(branches)[0];
    const nodes=f.nodes.map((n,i)=>{let node=[...n],edge=n[4];if(selectedScenario==='fail'&&i===2){node=['fail','Результат ниже порога','Система','Условие не выполнено','Добавить дообучение'];edge='Повторить после корректировки'}if(selectedScenario==='risk'&&i===3){node=['fail','Обнаружен риск','Контрольная точка','Нужна поддержка','Уведомить руководителя'];edge='После решения продолжить'}return `<article class="route-node ${node[0]}"><small>${esc(typeName(node[0]))}</small><h3>${esc(node[1])}</h3><span class="result">${esc(node[3])}</span><div class="who">Кто: <b>${esc(node[2])}</b></div></article>${i<f.nodes.length-1?`<div class="route-edge"><span>${esc(edge)}</span></div>`:''}`}).join('');
    return `<div class="branch-test-head"><div><span class="tag blue">Проверка до публикации</span><h1>Как сработает выбранная ветка</h1><p>Проверьте состав маршрута и каждый переход без создания реального плана.</p></div><div class="spacer"></div><button class="btn" data-close-test>Вернуться к канве</button></div>
    <div class="branch-test-controls"><label>Процесс<select data-test-flow>${Object.entries(flows).map(([id,x])=>`<option value="${id}" ${id===selectedFlow?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label>Ветка<select data-test-branch>${Object.entries(branches).map(([id,name])=>`<option value="${id}" ${id===selectedBranch?'selected':''}>${esc(name)}</option>`).join('')}</select></label><label>Проверяемый результат<select data-test-scenario><option value="success" ${selectedScenario==='success'?'selected':''}>Успешный путь</option><option value="fail" ${selectedScenario==='fail'?'selected':''}>Не пройдена проверка</option><option value="risk" ${selectedScenario==='risk'?'selected':''}>Риск на контрольной точке</option></select></label><button class="btn primary" data-rerun>Пересчитать маршрут</button></div>
    <div class="route-summary"><div><small>Событие запуска</small><b>${esc(f.event)}</b></div><div><small>Подключённая ветка</small><b>${esc(branches[selectedBranch])}</b></div><div><small>Целевой результат</small><b>${esc(f.result)}</b></div><div><small>Проверка</small><b class="ok">✓ Маршрут исполним</b></div></div>
    <div class="route-board"><div class="route-lane">${nodes}</div><div class="route-legend"><span><b>Карточка</b> — действие участника или системы</span><span><b>Подпись над стрелкой</b> — условие перехода</span><span><b>Красная карточка</b> — альтернативный путь</span></div></div>
    <div class="route-explanation"><article><h3>Почему сотрудник попал в ветку</h3><div class="condition-trace"><span><i></i>Базовая аудитория workflow выполнена</span><span><i></i>Условия «${esc(branches[selectedBranch])}» выполнены</span><span><i></i>Приоритет ветки выше пересекающихся правил</span><span><i class="off"></i>Другие ветки не добавлены</span></div></article><article><h3>Что проверяет система</h3><ul><li>у каждого обязательного действия есть успешный и неуспешный выход;</li><li>роли могут быть определены;</li><li>нет тупиков и бесконечных циклов;</li><li>уведомления привязаны к реальным событиям.</li></ul></article></div>`;
  }
  function wireBranchTest(root){
    $('[data-close-test]',root).onclick=()=>{root.remove();$('.workspace')?.removeAttribute('hidden');$$('.view-tabs button').forEach(x=>x.classList.remove('active'));$('[data-view="canvas"]')?.classList.add('active')};
    $('[data-test-flow]',root).onchange=e=>{selectedFlow=e.target.value;selectedBranch=Object.keys(flows[selectedFlow].branches)[0];refreshTest(root)};
    $('[data-test-branch]',root).onchange=e=>selectedBranch=e.target.value;
    $('[data-test-scenario]',root).onchange=e=>selectedScenario=e.target.value;
    $('[data-rerun]',root).onclick=()=>refreshTest(root);
  }
  function refreshTest(root){root.innerHTML=branchTestMarkup();wireBranchTest(root)}
  function typeName(t){return({course:'Курс / программа',task:'Задача',check:'Проверка / КТ',goal:'Цель / результат',article:'Статья / файл',fail:'Альтернативное действие'})[t]||'Действие'}

  function openAiWizard(){aiStep=1;document.body.insertAdjacentHTML('beforeend',aiWizardMarkup());wireAiWizard()}
  function aiWizardMarkup(){
    const flow=flows[aiTemplate];
    const body=aiStep===1?`<div class="aiw-templates">${Object.entries(flows).map(([id,f])=>`<button class="aiw-template ${id===aiTemplate?'active':''}" data-aiw-template="${id}"><b>${esc(f.name)}</b><small>${esc(f.result)}</small></button>`).join('')}</div><div class="aiw-grid" style="margin-top:16px"><div class="aiw-field"><label>Название workflow</label><input value="${esc(flow.name)} · новый workflow"></div><div class="aiw-field"><label>Событие запуска</label><select><option>${esc(flow.event)}</option><option>Ручной запуск администратором</option><option>Запуск сотрудником с согласованием</option></select></div><div class="aiw-field wide"><label>Целевой результат</label><input value="${esc(flow.result)}"></div><div class="aiw-field"><label>Срок процесса</label><select><option>90 дней</option><option>30 дней</option><option>14 дней</option></select></div><div class="aiw-field"><label>Базовая аудитория</label><select><option>Подразделения и должности из мастер-системы</option></select></div></div>`:
      aiStep===2?`<p class="muted">Выберите варианты маршрута. AI использует условия веток, роли, каталог курсов, Базу знаний и шаблоны задач.</p><div class="aiw-branch-list">${Object.entries(flow.branches).map(([id,name],i)=>`<label><input type="checkbox" checked><span><b>${esc(name)}</b><small>${i===0?'Назначается всем участникам процесса':'Дополнительная часть по должности, подразделению и другим условиям'}</small></span></label>`).join('')}</div><div class="aiw-callout"><b>Что сделает AI:</b> предложит этапы, разложит подходящие объекты по веткам, добавит роли и подготовит переходы по результатам. Обязательные требования компании не будут удалены.</div>`:
      `<div class="aiw-preview"><article><span class="tag blue">6 этапов</span><h3>Структура процесса</h3><p>Вводная часть → действия → промежуточный результат → доработка → подтверждение → завершение.</p></article><article><span class="tag purple">${Object.keys(flow.branches).length} ветки</span><h3>Персонализация</h3><p>Общий контур и дополнительные ветки с объяснимыми условиями попадания.</p></article><article><span class="tag green">28 элементов</span><h3>Наполнение</h3><p>Курсы, задачи, статьи, цели и контрольные точки из разрешённых источников.</p></article></div><div class="route-board" style="margin-top:16px;min-width:0;padding:16px"><div class="route-lane" style="transform:scale(.78);transform-origin:left center">${flow.nodes.slice(0,4).map((n,i)=>`<article class="route-node ${n[0]}"><small>${typeName(n[0])}</small><h3>${esc(n[1])}</h3><div class="who">${esc(n[2])}</div></article>${i<3?`<div class="route-edge"><span>${esc(n[4])}</span></div>`:''}`).join('')}</div></div><div class="aiw-callout"><b>Перед публикацией:</b> администратор проверит каждое предложение, маршрут выбранной ветки и список сотрудников, которых затронет правило.</div>`;
    return `<div class="aiw-modal"><section class="aiw-dialog"><header class="aiw-head"><div><span class="tag blue">AI · черновик под контролем</span><h2>Создать workflow с AI</h2></div><div class="spacer"></div><button class="btn icon-only" data-aiw-close>×</button></header><div class="aiw-body"><div class="aiw-steps"><span class="${aiStep===1?'active':''}">1 · Цель и запуск</span><span class="${aiStep===2?'active':''}">2 · Ветки и источники</span><span class="${aiStep===3?'active':''}">3 · Проверка черновика</span></div>${body}</div><footer class="aiw-foot">${aiStep>1?'<button class="btn" data-aiw-back>← Назад</button>':''}<button class="btn" data-aiw-close>Отмена</button><button class="btn primary" data-aiw-next>${aiStep===3?'Добавить черновик на канву':'Продолжить →'}</button></footer></section></div>`;
  }
  function wireAiWizard(){
    const modal=$('.aiw-modal');$$('[data-aiw-close]',modal).forEach(b=>b.onclick=()=>modal.remove());$$('[data-aiw-template]',modal).forEach(b=>b.onclick=()=>{aiTemplate=b.dataset.aiwTemplate;rerenderAi(modal)});$('[data-aiw-back]',modal)&&( $('[data-aiw-back]',modal).onclick=()=>{aiStep--;rerenderAi(modal)} );$('[data-aiw-next]',modal).onclick=()=>{if(aiStep<3){aiStep++;rerenderAi(modal)}else{applyAiWorkflow();modal.remove()}}
  }
  function rerenderAi(modal){const box=document.createElement('div');box.innerHTML=aiWizardMarkup();modal.replaceWith(box.firstElementChild);wireAiWizard()}
  function applyAiWorkflow(){
    const f=flows[aiTemplate];if(typeof state==='undefined'||typeof stages==='undefined'||typeof branches==='undefined')return;
    state.screen='editor';state.step='canvas';state.view='canvas';state.layer='process';state.newWorkflow=true;state.workflow='new';state.paletteOpen=false;state.items={};state.skips=[];
    const stageNames=['Вводная часть','Действия по процессу','Промежуточный результат','Доработка','Подтверждение результата','Завершение'];stages.splice(0,stages.length,...stageNames.map((name,i)=>({id:'ai'+i,name,days:i===0?'1 день':i===1?'до 7 дня':i===2?'до 14 дня':i===3?'до 30 дня':i===4?'до 60 дня':'до 90 дня',count:0})));
    branches.splice(0,branches.length,...Object.entries(f.branches).map(([id,name],i)=>({id,name,desc:i===0?'Обязательная часть для всех':'Условия предложены AI · требуют проверки',meta:[i===0?'Общий контур':`Приоритет ${i}`,i===0?'Все сотрудники':'Группа по условиям'],conditions:i===0?['Базовая аудитория workflow']:[`Должность и подразделение: ${name}`]})));
    Object.keys(f.branches).forEach((bid,bi)=>f.nodes.slice(0,Math.min(4+bi,6)).forEach((n,i)=>{const key=`${bid}-ai${Math.min(i,5)}`;(state.items[key]||=[]).push({id:`gen-${bid}-${i}`,type:n[0]==='check'?'assessment':n[0],title:n[1],meta:`AI · ${n[2]} · проверить`})}));
    render();setTimeout(()=>{enhance();const title=$('.topbar .titleblock b');if(title)title.textContent=f.name+' · черновик с AI';},0);
  }
  function openTransition(title){
    document.body.insertAdjacentHTML('beforeend',`<div class="transition-modal"><section class="transition-dialog"><header class="aiw-head"><div><span class="tag blue">Связь на канве</span><h2>Добавить выход из действия</h2></div><div class="spacer"></div><button class="btn icon-only" data-transition-close>×</button></header><div class="transition-body"><p class="muted">После «${esc(title)}» Оркестратор сопоставит результат с настроенными выходами.</p><div class="transition-grid"><label>Результат<select><option>Завершено успешно</option><option>Не завершено</option><option>Баллы ниже порога</option><option>Просрочено</option><option>Обнаружен риск</option></select></label><label>Настроенный переход<select><option>Открыть следующее действие</option><option>Назначить дополнительный курс</option><option>Вернуть на повторную попытку</option><option>Уведомить руководителя</option><option>Заблокировать этап</option><option>Передать на ручной разбор</option></select></label></div><div class="transition-preview">На канве появится стрелка. Условие будет подписано над связью и войдёт в проверку маршрута.</div></div><footer class="aiw-foot"><button class="btn" data-transition-close>Отмена</button><button class="btn primary" data-transition-save>Добавить связь</button></footer></section></div>`);
    const modal=$('.transition-modal');$$('[data-transition-close]',modal).forEach(b=>b.onclick=()=>modal.remove());$('[data-transition-save]',modal).onclick=()=>{modal.remove();typeof toast==='function'&&toast('Связь добавлена · проверьте маршрут во вкладке «Проверка веток»')};
  }

  const observer=new MutationObserver(()=>enhance());observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
