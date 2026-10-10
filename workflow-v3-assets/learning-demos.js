(function () {
  'use strict';
  const D=window.SkillazLearningData,copy=D.clone;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const seed=()=>D.seeds.find(d=>d.id===state.workflow);
  const active=()=>Boolean(seed()&&!state.newWorkflow);
  let panel=null,session=null,simulationBranch='cashier',saveError=false;
  const storageKey=id=>'skillaz-learning-demo-v1:'+id;
  const runtime=()=>({...seed(),items:state.items,routes:state.elementRoutes,branches});
  const flat=()=>D.nodes(runtime());
  const currentConfig=()=>state.learningConfig||seed();
  const types={article:'Статья',course:'Курс',task:'Задание',test:'Тест',survey:'Опрос',assessment:'Полевой оценочный лист',file:'Памятка'};
  D.seeds.forEach(d=>{
    workflowCatalog[d.id]={name:d.name,short:d.short,stats:[d.branches.length+' ветки',D.nodes(d).length+' элементов','Обучение'],skips:[],stages:d.stages.map(s=>[s.id,s.name,s.days,s.count]),branches:d.branches.map(b=>[b.id,b.name,b.meta,b.desc,b.conditions]),items:Object.fromEntries(Object.entries(d.items).map(([cell,list])=>[cell,list.map(n=>[n.type,n.title,n.meta])])),extras:{}};
    for(const n of D.nodes(d)){
      const row={id:n.id,type:n.type,title:n.title,description:n.description,domain:'retail',source:'Ритейл · '+d.short,tags:['розница',...D.roles.map(r=>r.position)],learningDemo:d.id,branchId:d.branches.find(b=>n.cell.startsWith(b.id+'-'))?.id,...(n.evaluation||{})};
      window.SkillazProductionCatalog.elements.push(row);
      if(n.evaluation)window.SkillazObjects.evaluationSheets.unshift(row);
    }
    const extraTasks={cashier:['Разобрать расхождение кассового отчёта и журнала возвратов','Провести покупку с частичной оплатой бонусами','Решить ситуацию с ошибочно пробитым товаром'],sales:['Провести консультацию с ограниченным бюджетом покупателя','Разобрать претензию к товару без конфликта','Сравнить две модели и обосновать рекомендацию'],stock:['Найти и исправить пять ошибок в промовыкладке','Оформить расхождение поставки с учётными данными','Восстановить полку после вечернего пика продаж']};
    D.roles.forEach(r=>extraTasks[r.id].forEach((title,i)=>window.SkillazProductionCatalog.elements.push({id:d.id+'-extra-'+r.id+'-'+i,type:'task',title,description:'Практический кейс. Приложить результат; эксперт проверяет решение по стандарту магазина.',domain:'retail',source:'Ритейл · дополнительные кейсы',tags:['розница',r.position],learningDemo:d.id,branchId:r.id})));
  });
  window.SkillazProductionCatalog.stats.elements=window.SkillazProductionCatalog.elements.length;
  function catalog(){return window.SkillazProductionCatalog.elements.filter(n=>n.learningDemo===state.workflow);}
  function save(){
    if(!active()||state.screen!=='editor')return;
    try{localStorage.setItem(storageKey(state.workflow),JSON.stringify({version:seed().version,items:state.items,routes:state.elementRoutes,stages,branches,config:state.learningConfig,participants:state.newRoles,coordinator:state.coordinatorRule}));saveError=false;}catch{saveError=true;}
  }
  function install(d,saved){
    state.items=copy(saved?.items||d.items);state.elementRoutes=copy(saved?.routes||d.routes);
    stages.splice(0,stages.length,...copy(saved?.stages||d.stages));branches.splice(0,branches.length,...copy(saved?.branches||d.branches));
    state.newRoles=copy(saved?.participants||d.participants);state.coordinatorRule=saved?.coordinator||'Закреплённый куратор учебной группы сотрудника';
    state.learningConfig=copy(saved?.config||{event:d.event,timing:d.timing,territory:d.territory,structure:d.structure,recurrence:d.recurrence,packageVersion:d.packageVersion});
    state.processTitle=d.name;state.assistantAnswers={scenario:d.short,result:d.description,audience:D.roles.map(r=>r.position).join(', '),event:state.learningConfig.event,timing:state.learningConfig.timing,structure:d.structure,location:state.learningConfig.territory,pathType:'Общая часть + варианты'};
    state.launchScope={label:state.learningConfig.territory};state.manualLaunch={...state.assistantAnswers};
    state.goalScenarios=[];state.ktScenarios=[];state.goalPlacements={};state.ktPlacements={};state.outcomeRules={};state.activeTemplateScenario=null;state.catalogTargetScenario=null;
    state.goalLinkMode=null;state.selectedGoal=null;state.templateScenarioPicker=null;state.objectEditor=null;state.routeEditor=null;state.cleanCatalogType='';
    state.paletteOpen=false;state.cleanAddOpen=false;state.aiOpen=false;state.query='';state.zoom=.75;state.layer='process';state.focus=null;state.skips=[];extras={};
    if(typeof aiState==='object'){aiState.goals=[];aiState.sessions=[];aiState.proposals=[];aiState.busy=false;aiState.mode=null;}
  }
  const oldLoad=loadWorkflow;
  loadWorkflow=id=>{
    const wasLearning=active();save();panel=null;session=null;state.learningConfig=null;
    if(wasLearning&&!D.seeds.some(d=>d.id===id)){state.newRoles=[];state.coordinatorRule='';state.processTitle='';state.assistantAnswers={};state.manualLaunch={};state.launchScope=null;aiState.mode=null;}
    oldLoad(id);
    const d=D.seeds.find(s=>s.id===id);if(!d)return;
    let saved;try{saved=JSON.parse(localStorage.getItem(storageKey(id)));if(saved?.version!==d.version)saved=null;}catch{saved=null;}
    install(d,saved);
  };
  const oldStart=startNewWorkflow;startNewWorkflow=()=>{save();panel=null;session=null;state.learningConfig=null;oldStart();};
  const oldRail=scenarioRail,oldKt=checkpointRail;
  scenarioRail=()=>active()?'':oldRail();checkpointRail=()=>active()?'':oldKt();
  const section=(title,body)=>`<section class="setting"><h2>${title}</h2>${body}</section>`;
  function launchPage(){
    const d=seed(),c=currentConfig();
    return `<div class="page learning-page"><div class="page-card wide-card"><span class="tag blue">Обучение · встроенный демо-процесс</span><h1>${esc(d.name)}</h1><p>${esc(d.description)}</p><div class="settings-grid">${section('Событие и момент запуска',`<b>${esc(c.event)}</b><p>${esc(c.timing)}</p>${d.mode==='cycle'?`<div class="learning-fields">${D.roles.map(r=>`<label>${r.name}<select data-learning-period="${r.id}">${[6,12].map(n=>`<option value="${n}" ${c.recurrence[r.id]===n?'selected':''}>Каждые ${n} месяцев в роли</option>`).join('')}</select></label>`).join('')}</div><small>От даты вступления в роль. Новый цикл не создаёт второй активный план; после завершения назначается следующая проверка.</small>`:d.mode==='update'?`<label>Версия опубликованного учебного пакета<input data-learning-version value="${esc(c.packageVersion)}"></label><small>Сотрудники, уже прошедшие эту версию, исключаются. Новый план создаётся только для новой версии.</small>`:'<small>Один план на событие выхода сотрудника. Повторная доставка события не создаёт дубликат.</small>'}`)}${section('Охват',`<p><b>${esc(c.structure)}</b></p><label>Территория<input data-learning-territory value="${esc(c.territory)}"></label><p>${D.roles.map(r=>esc(r.position)).join(' · ')}</p><small>Общая часть назначается всем. Дополнительно — ветка по должности сотрудника.</small>`)}${section('Переход к практике','<p>Сначала обязательные знания и проверка по должности. Практика открывается, когда пройдены все её обязательные предшественники.</p><p>Полевая оценка: минимум 85% и отсутствие критичных ошибок. При неуспехе — дополнительное обучение и задание.</p>')}${section('Участники','<p>Куратор закреплён за учебной группой сотрудника. Эксперт назначается по бизнес-роли и магазину.</p><p>После трёх неуспешных попыток маршрут приостанавливается до решения руководителя.</p>')}</div><div class="wizard-next"><button class="btn" data-learning-reset>Восстановить демо-пример</button><button class="btn primary" data-step="participants">Проверить участников →</button></div><small>Изменения сохраняются в этом браузере. Встроенный процесс всегда остаётся в списке.</small></div></div>`;
  }
  function participants(){
    return `<div class="page learning-page"><div class="page-card wide-card"><h1>Кураторы и эксперты программы</h1><p>Сотрудник проходит обучение, эксперт проверяет практику, куратор сопровождает учебную группу.</p><div class="learning-role-grid">${state.newRoles.map((r,i)=>`<section class="setting"><h2>${esc(r.name)}</h2><p>${esc(r.scope)}</p><label>Как найти участника<input data-learning-role="${i}" value="${esc(r.assignmentRule)}"></label><p>${esc(r.purpose)}</p></section>`).join('')}</div><section class="setting"><b>Если участник не найден</b><p>Назначение проверки приостанавливается. Куратор группы получает задачу выбрать эксперта; результат не засчитывается автоматически.</p></section><div class="wizard-next"><button class="btn" data-step="base">← Запуск</button><button class="btn primary" data-step="canvas">Открыть программу →</button></div></div></div>`;
  }
  const oldBase=basePageV2,oldParticipants=participantsPageV2,oldFinal=finalPage;
  basePageV2=()=>active()?launchPage():oldBase();participantsPageV2=()=>active()?participants():oldParticipants();
  finalPage=()=>{
    if(!active())return oldFinal();
    const c=currentConfig();
    return `<div class="page learning-page"><div class="page-card wide-card"><h1>Проверка учебного процесса</h1><p>${esc(seed().name)}</p><div class="settings-grid">${section('Назначение',`<b>${esc(c.event)}</b><p>${esc(c.timing)}</p><p>${esc(c.territory)}</p><small>${D.roles.map(r=>r.position).join(' · ')}</small>`)}${section('Программа',`<p>${stages.length} этапов · ${branches.length} ветки · ${flat().length} элементов</p><p>${Object.values(state.elementRoutes).flat().length} правил по результатам</p><button class="btn" data-step="canvas">Проверить путь сотрудника</button>`)}${section('Сопровождение',state.newRoles.map(r=>`<p><b>${esc(r.name)}</b><br>${esc(r.assignmentRule)}</p>`).join(''))}${section('Демо-режим','<p>Можно редактировать программу и проходить тестовые маршруты. Изменения остаются в этом браузере.</p><p>Демо не назначает обучение реальным сотрудникам и не отправляет уведомления.</p>')}</div></div></div>`;
  };
  const oldCanvas=canvasPage;
  canvasPage=()=>{
    const html=oldCanvas();if(!active())return html;
    return `<div class="learning-toolbar"><div><span class="tag green">${esc(seed().short)}</span><span>Общая часть + 3 должностные ветки</span></div><div><button class="btn" data-learning-ai>✦ Подобрать с AI</button><button class="btn primary" data-learning-sim>▷ Проверить путь</button></div></div>`+html;
  };
  const oldItem=itemCard;
  itemCard=(item,cell)=>{
    let html=oldItem(item,cell);if(!active())return html;
    const l=item.learning;
    const hint=l?.conditional?'По результату неуспешной проверки':l?.entry?'Назначается при запуске':l?.after?.length?'После обязательных предшественников':'Добавлено в программу';
    return html.replace('<i class="port',`<div class="learning-card-meta"><span class="tag ${l?.conditional?'amber':'blue'}">${hint}</span><button class="btn small" data-learning-details="${esc(cell+'::'+item.id)}">Содержание и запуск</button></div><i class="port`);
  };
  function showPanel(body,title){return `<aside class="object-panel learning-panel" role="dialog" aria-modal="false" aria-label="${title}"><header><h2>${title}</h2><button class="btn icon-only" data-learning-close aria-label="Закрыть панель">×</button></header><div class="object-panel-body">${body}</div></aside>`;}
  function detailPanel(){
    const n=flat().find(n=>n.key===panel?.key);if(!n)return '';
    const before=(n.learning?.after||[]).map(key=>flat().find(n=>n.key===key)?.title||'Удалённая карточка');
    return showPanel(`<span class="tag">${esc(types[n.type]||n.type)}</span><h3>${esc(n.title)}</h3><p>${esc(n.description||n.meta)}</p><section class="object-section"><h3>Порядок назначения</h3>${before.length?`<p>Нужны все результаты:</p><ul>${before.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:`<p>${n.learning?.entry?'Назначается при запуске программы.':n.learning?.conditional?'Назначается только при срабатывании условия на другой карточке.':'Запуск определяется маршрутом программы.'}</p>`}${n.learning?.conditional?'<span class="tag amber">Дообучение по результату</span>':''}</section><section class="object-section"><h3>Содержание</h3>${n.type==='survey'?'<ol><li>Насколько полезным было обучение? (1–5)</li><li>Насколько уверенно применяете знания? (1–5)</li><li>Что осталось непонятным и какая помощь нужна?</li></ol>':n.type==='assessment'?`<p>Оценивает: ${esc(n.evaluation?.evaluator)}</p><ul>${(n.evaluation?.blocks||[]).flatMap(b=>b.criteria).map(c=>`<li>${esc(c.title)}${c.critical?' · критичный критерий':''}</li>`).join('')}</ul>`:`<p>${esc(n.type==='task'?'Выполните операцию в магазине. Приложите результат и комментарий. Эксперт проверит соблюдение стандарта и даст обратную связь.':n.type==='test'?'Проверяются рабочие ситуации из предшествующего модуля. Результат ниже порога назначает разбор ошибок и повторную проверку.':'Изучите порядок выполнения операции, пример корректной работы и распространённые ошибки. Для самостоятельной работы используйте памятку в программе.')}</p>`}</section>${n.type==='test'?`<label>Проходной балл, %<input type="number" min="1" max="100" data-learning-threshold="${esc(n.key)}" value="${n.learning?.threshold||80}"></label>`:''}<button class="btn primary" data-learning-route="${esc(n.key)}">Настроить условия и действия</button><p class="muted">Переходы можно проверить в тестовом пути сотрудника.</p>`, 'Элемент программы');
  }
  function simulator(){
    const d=runtime(),all=D.nodes(d),s=session;
    const ready=s?all.filter(n=>s.status[n.key]==='ready'):[];
    const waiting=s?all.filter(n=>s.status[n.key]==='waiting'):[];
    return showPanel(`<p>Тестовый сотрудник получает общую часть и выбранную должностную ветку. Действия выполняются только в этом просмотре.</p><label>Должность<select data-learning-sim-branch>${D.roles.map(r=>`<option value="${r.id}" ${simulationBranch===r.id?'selected':''}>${r.position}</option>`).join('')}</select></label><button class="btn" data-learning-sim-start>${s?'Начать заново':'Начать тестовый проход'}</button>${s?`<div class="learning-sim-status" role="status">${s.paused?'Маршрут приостановлен. Нужен руководитель.':s.complete?'Программа завершена. Допуск подтверждён.':`Выполнено: ${Object.values(s.status).filter(x=>x==='passed').length}. Доступно: ${ready.length}.`}</div>${!s.paused&&!s.complete?`<h3>Сейчас назначено</h3>${ready.map(n=>`<section class="learning-sim-card" data-sim-key="${esc(n.key)}"><span class="tag">${esc(types[n.type])}</span><h4>${esc(n.title)}</h4>${['test','assessment'].includes(n.type)?`<label>Результат, %<input data-sim-score type="number" min="0" max="100" value="90"></label>${n.type==='assessment'?'<label class="check-row"><input type="checkbox" data-sim-critical> Критичная ошибка</label>':''}<button class="btn primary small" data-learning-score="${esc(n.key)}">Проверить результат</button>`:`<button class="btn primary small" data-learning-result="passed" data-learning-key="${esc(n.key)}">${n.type==='task'?'Эксперт принял':'Выполнено'}</button><button class="btn small" data-learning-result="failed" data-learning-key="${esc(n.key)}">Не выполнено</button>`}<button class="btn small" data-learning-result="overdue" data-learning-key="${esc(n.key)}">Просрочено</button></section>`).join('')}${waiting.length?`<details><summary>Ожидают обязательных результатов (${waiting.length})</summary><ul>${waiting.map(n=>`<li>${esc(n.title)}</li>`).join('')}</ul></details>`:''}`:''}<h3>История переходов</h3><ol class="learning-sim-log">${s.log.slice().reverse().map(log=>`<li><span>${({passed:'✓ Выполнено',failed:'× Не выполнено',overdue:'Срок истёк',notify:'Уведомление',escalate:'Эскалация'})[log.outcome]}</span>${esc(log.title)}</li>`).join('')||'<li>Завершите первую карточку</li>'}</ol>`:''}`, 'Тестовый путь сотрудника');
  }
  const oldEditor=editor;
  editor=()=>{if(!active()||state.step!=='canvas'||state.objectEditor||state.routeEditor||state.paletteOpen||aiState.mode)panel=null;return oldEditor()+(active()&&panel?(panel.kind==='sim'?simulator():detailPanel()):'');};
  function closeOthers(){state.routeEditor=null;state.objectEditor=null;state.paletteOpen=false;state.cleanAddOpen=false;aiState.mode=null;}
  const oldBind=bind;
  bind=()=>{
    oldBind();document.body.classList.toggle('learning-mode',active());
    if(!active())return;
    document.body.classList.toggle('object-panel-open',Boolean(panel||state.objectEditor||state.routeEditor));
    document.querySelectorAll('[data-clean-element-type="goal"],[data-clean-element-type="checkpoint"],[data-layer="goals"],[data-layer="checkpoints"]').forEach(el=>el.remove());
    document.querySelectorAll('[data-open-assessment-catalog] small').forEach(el=>el.textContent='Проверка практических навыков в этапе');
    document.querySelectorAll('[data-evaluation-launch] option').forEach(el=>{if(el.textContent.includes('цели'))el.remove();});
    document.querySelectorAll('.saved-label').forEach(el=>el.textContent=saveError?'Не удалось сохранить в браузере':'Демо · сохранено в браузере');
    document.querySelectorAll('[data-action="openPublish"]').forEach(el=>{el.textContent='Проверить программу';el.onclick=()=>{panel=null;state.step='settings';render();};});
    document.querySelectorAll('[data-learning-ai]').forEach(el=>el.onclick=()=>{panel=null;closeOthers();aiOpen('elements');});
    document.querySelectorAll('[data-learning-sim]').forEach(el=>el.onclick=()=>{closeOthers();session=null;panel={kind:'sim'};render();});
    document.querySelectorAll('[data-learning-close]').forEach(el=>el.onclick=()=>{panel=null;render();});
    document.querySelectorAll('[data-learning-sim-start]').forEach(el=>el.onclick=()=>{simulationBranch=document.querySelector('[data-learning-sim-branch]').value;session=D.start(runtime(),simulationBranch);render();});
    document.querySelectorAll('[data-learning-details]').forEach(el=>el.onclick=e=>{e.stopPropagation();closeOthers();panel={kind:'detail',key:el.dataset.learningDetails};render();});
    document.querySelectorAll('[data-learning-route]').forEach(el=>el.onclick=()=>{const [cell,id]=el.dataset.learningRoute.split('::');panel=null;window.SkillazRouting.open(cell,id);});
    document.querySelectorAll('[data-learning-result],[data-learning-score]').forEach(el=>el.onclick=()=>{
      const key=el.dataset.learningScore||el.dataset.learningKey;
      const card=el.closest('[data-sim-key]'),score=Number(card.querySelector('[data-sim-score]')?.value);
      if(el.dataset.learningScore&&(!Number.isFinite(score)||score<0||score>100)){toast('Введите результат от 0 до 100');return;}
      D.advance(runtime(),session,key,el.dataset.learningScore?{score,critical:Boolean(card.querySelector('[data-sim-critical]')?.checked)}:el.dataset.learningResult);render();
    });
    document.querySelectorAll('[data-learning-reset]').forEach(el=>el.onclick=()=>{if(!confirm('Восстановить встроенный пример? Локальные изменения этого демо будут заменены.'))return;install(seed());session=null;save();render();});
    document.querySelectorAll('[data-learning-period],[data-learning-territory],[data-learning-version],[data-learning-role],[data-learning-threshold]').forEach(el=>{
      const update=()=>{
      const c=currentConfig();
      if(el.dataset.learningPeriod){c.recurrence[el.dataset.learningPeriod]=Number(el.value);c.timing=D.roles.map(r=>r.name+': каждые '+c.recurrence[r.id]+' месяцев в роли').join('; ');}
      if(el.hasAttribute('data-learning-territory'))c.territory=el.value.trim()||seed().territory;
      if(el.hasAttribute('data-learning-version')){c.packageVersion=el.value.trim()||'2.0';c.timing='После публикации учебного пакета, версия '+c.packageVersion;}
      if(el.hasAttribute('data-learning-role'))state.newRoles[Number(el.dataset.learningRole)].assignmentRule=el.value.trim();
      if(el.dataset.learningThreshold){const [cell,id]=el.dataset.learningThreshold.split('::'),n=state.items[cell].find(n=>n.id===id);n.learning||={};n.learning.threshold=Math.max(1,Math.min(100,Number(el.value)||80));n.meta='12 вопросов · порог '+n.learning.threshold+'%';}
      state.assistantAnswers.event=c.event;state.assistantAnswers.timing=c.timing;state.assistantAnswers.location=c.territory;save();
      };
      el.oninput=update;el.onchange=()=>{update();render();};
    });
    save();
  };
  // Opening another editor closes this panel instead of stacking two side panels.
  document.addEventListener('click',e=>{
    if(!active()||!e.target.closest('[data-route-item],[data-open-object],[data-action="togglePalette"],[data-clean-action],[data-step]'))return;
    panel=null;
  },true);
  const oldAsk=window.SkillazLiveAI.ask;
  window.SkillazLiveAI.ask=(task,payload)=>{
    if(!active())return oldAsk(task,payload);
    const existing=new Set((payload.context?.existingItems||[]).flatMap(n=>[n.sourceId,n.title]));
    const available=catalog().filter(n=>!existing.has(n.id)&&!existing.has(n.title)&&(!n.branchId||payload.context?.branches?.some(b=>b.id===n.branchId)));
    const enriched={...payload,message:payload.message+'\nЭто учебная программа ритейла: '+seed().description+' Участники: куратор учебной группы и эксперты должностей. Используй только курсы, статьи, тесты, задания, опросы, файлы и полевые оценочные листы. Не создавай цели и контрольные точки адаптации. Учитывай выбранную должностную ветку и этап. Предлагай дополнительные конкретные задания и проверяемые навыки, которые ещё отсутствуют в existingItems. Не повторяй карточки существующей программы.',context:{...payload.context,processKind:'learning',programme:seed().short,launch:state.assistantAnswers,roles:state.newRoles,learningRules:'Практика после успешной проверки знаний. При неуспехе — дообучение и повторная проверка. После 3 неуспешных попыток — руководитель.'},catalog:{...payload.catalog,elements:available}};
    return oldAsk(task,enriched);
  };
  const oldFallback=aiElementProposals;
  aiElementProposals=()=>{
    if(!active())return oldFallback();
    const result=[];
    aiState.scope.forEach(branchId=>{
      const stageId=aiState.stages.includes('s4')?'s4':aiState.stages[0];
      const existing=new Set(Object.entries(state.items).filter(([cell])=>cell.startsWith(branchId+'-')).flatMap(([,rows])=>rows.map(n=>n.title)));
      const source=catalog().filter(n=>n.branchId===branchId&&!existing.has(n.title));
      source.slice(0,2).forEach(n=>result.push({id:'learning-ai-'+n.id,branchId,stageId,type:n.type,title:n.title,sourceId:n.id,source:'Демо-каталог ритейла',reason:'Пример по должности и этапу программы; проверьте перед добавлением.',outcomes:[]}));
    });return result;
  };
  window.addEventListener('pagehide',save);
  const oldRender=render;
  render=()=>{if(active())state.elementRoutes=D.reconcile(runtime()).routes;return oldRender();};
  window.SkillazLearningDemos={active,catalog,listRows:()=>D.seeds.map(d=>({id:d.id,title:d.name,scenario:d.short,status:'Демо',branches:d.branches.length,elements:D.nodes(d).length,updated:'Встроенный пример'}))};
  render();
})();
