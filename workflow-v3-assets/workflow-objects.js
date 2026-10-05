// Distinct workflow objects: goals, checkpoint meetings and skill assessments.
(function () {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const uid=prefix=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const families=window.SkillazProductionCatalog?.jobFamilies||{};
  const evaluationSheets=Object.entries(families).flatMap(([domain,family])=>family.tasks.slice(0,2).map((task,index)=>({
    id:`sheet-${domain}-${index}`,type:'assessment',title:`Практическая проверка: ${task.toLowerCase()}`,description:`Навык: ${task}. Критерии, наблюдение на рабочем месте и решение оценивающего.`,domain,source:'Каталог оценочных листов',status:'published',version:1,competency:task,positions:family.titles,tags:[domain,...family.titles],threshold:80,resultMode:'score',
    blocks:[{title:'Подготовка',criteria:[{id:'prepare',title:`Объясняет порядок выполнения: ${task.toLowerCase()}`,critical:false},{id:'safety',title:'Соблюдает обязательные правила и ограничения операции',critical:true,commentRequired:true}]},{title:'Выполнение и результат',criteria:[{id:'practice',title:'Выполняет операцию самостоятельно без подсказок',critical:false},{id:'quality',title:'Проверяет качество и фиксирует результат по стандарту',critical:true}]}]
  })));
  window.SkillazProductionCatalog?.elements.push(...evaluationSheets);
  if(window.SkillazProductionCatalog)window.SkillazProductionCatalog.stats.elements=window.SkillazProductionCatalog.elements.length;
  for(const row of window.SkillazProductionCatalog?.elements||[]){
    const family=families[row.domain];
    if(row.type==='checkpoint'){
      row.agenda ||= `Обсудить прогресс в роли, разобрать выполненные задачи${family?.tasks?.length?': '+family.tasks.slice(0,2).join('; '):''}. Выяснить затруднения и договориться о поддержке на следующий период.`;
      row.pulse ||= 'Насколько понятны ожидаемые результаты вашей работы?; Насколько уверенно вы выполняете основные задачи?; Какие сложности возникают и какая поддержка нужна?';
      row.showBeforeDays ??= 3;row.participants ||= ['Сотрудник','Руководитель'];
    }
    if(row.type==='goal'&&family)row.subgoals ||= family.tasks.slice(0,2).map((title,i)=>({id:`${row.id}-result-${i}`,title}));
  }
  const questions=template=>Array.isArray(template.questions)?template.questions: String(template.pulse||'').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,5).map((text,index)=>({id:`q-${index}`,text,type:/насколько|оцените/i.test(text)?'scale':'text',required:true}));
  function normalizeCheckpoint(template) {
    return {...template,type:'checkpoint',day:Number(template.day)||30,showBeforeDays:template.showBeforeDays??3,agenda:template.agenda||template.meta||'',participants:template.participants||['Сотрудник','Руководитель'],questions:questions(template),links:template.links||template.linked||[]};
  }
  function ktCard(template,key) {
    const point=normalizeCheckpoint(template);
    return `<article class="kt-meeting-card" data-open-object="kt" data-object-key="${esc(key)}" data-object-id="${esc(point.id)}" tabindex="0" role="button" aria-label="Открыть КТ: ${esc(point.title)}"><header><span class="kt-date"><b>${point.day}</b><small>день</small></span><div><span class="tag amber">Встреча · контрольная точка</span><h3>${esc(point.title)}</h3><small>Показать за ${point.showBeforeDays} дн. · ${esc(point.participants.join(', '))}</small></div></header><div class="kt-meeting-summary"><b>Повестка встречи</b><p>${esc(point.agenda||'Добавьте темы для обсуждения')}</p><span>Пульс сотрудника · ${point.questions.length} вопросов</span><span>Связано с действиями · ${point.links.length}</span></div><footer><button class="btn small" data-open-object="kt" data-object-key="${esc(key)}" data-object-id="${esc(point.id)}">Настроить встречу</button><button class="btn small" data-remove-template="${esc(point.id)}" data-remove-key="${esc(key)}" data-remove-kind="kt">Убрать</button></footer></article>`;
  }
  const goalExtra=(template,key)=>`<div class="goal-details-summary"><small>Промежуточные результаты: ${(template.subgoals||[]).length} · Оценочные листы: ${(template.evaluations||[]).length}</small><button class="btn small" data-open-object="goal" data-object-key="${esc(key)}" data-object-id="${esc(template.id)}">Настроить цель</button><button class="btn small" data-add-goal-assessment="${esc(template.id)}" data-object-key="${esc(key)}">＋ Оценочный лист</button></div>`;
  const goalSettings=scenario=>`<section class="object-section goal-scenario-settings"><label class="check-row"><input type="checkbox" data-manager-review ${scenario?.managerReview?'checked':''}> Руководитель должен проверить и опубликовать цели</label><label>Срок создания / доработки и публикации, дней<input type="number" min="1" max="365" data-publication-days value="${scenario?.publicationDays||7}"></label></section>`;
  function findObject(kind,key,id){return (kind==='goal'?state.goalPlacements:state.ktPlacements)?.[key]?.find(row=>row.id===id);}
  function open(kind,key,id){
    const object=findObject(kind,key,id);if(!object)return;
    state.objectEditor={kind,key,id,draft:copy(kind==='kt'?normalizeCheckpoint(object):object)};
    state.paletteOpen=false;state.scenarioModal=null;state.cleanAddOpen=false;
    if(kind==='goal')state.selectedGoal={id,key};
    render();
  }
  function linkChoices(kind,key,selected){
    const scenario=(kind==='goal'?state.goalScenarios:state.ktScenarios)[Number(key.split('-').pop())];
    const allowed=new Set(['base',...(scenario?.branches||[])]);
    return Object.entries(state.items).flatMap(([cell,items])=>{
      const branch=branches.find(row=>cell.startsWith(row.id+'-'));
      const stage=stages.find(row=>cell.endsWith('-'+row.id));
      if(!allowed.has(branch?.id))return [];
      return items.map(item=>`<label class="object-link-choice"><input type="checkbox" data-object-link value="${esc(cell+'::'+item.id)}" ${(selected||[]).some(link=>link.cell===cell&&link.id===item.id)?'checked':''}><span><b>${esc(item.title)}</b><small>${esc(branch.name)} · ${esc(stage?.name)}</small></span></label>`);
    }).join('')||'<p class="muted">В выбранных ветках пока нет действий.</p>';
  }
  function assessmentCard(sheet,index,goal=false){return `<div class="assessment-attachment"><b>${esc(sheet.title)}</b><small>${esc(sheet.competency)} · Порог ${sheet.threshold}% · версия ${sheet.version}</small><button class="btn small" data-edit-assessment="${index}" ${goal?'data-assessment-goal':''}>Настроить проверку</button>${goal?`<button class="btn small" data-remove-assessment="${index}">Убрать</button>`:''}</div>`;}
  function goalFields(d){return `<label>Название цели<input data-object-field="title" value="${esc(d.title)}" required></label><label>Описание и измеримый результат<textarea data-object-field="result" rows="4" maxlength="1000" required>${esc(d.result||d.meta)}</textarea></label><label>Достичь к дню плана<input type="number" data-object-field="day" min="1" max="365" value="${d.day||30}"></label><section class="object-section"><h3>Промежуточные результаты</h3>${(d.subgoals||[]).map((row,i)=>`<div class="subgoal-edit"><input data-subgoal="${i}" value="${esc(row.title)}" aria-label="Промежуточный результат ${i+1}"><button type="button" class="btn small" data-remove-subgoal="${i}" aria-label="Удалить промежуточный результат">×</button></div>`).join('')}<button type="button" class="btn small" data-add-subgoal>＋ Результат</button></section><section class="object-section"><h3>Проверка результата</h3>${(d.evaluations||[]).map((sheet,index)=>assessmentCard(sheet,index,true)).join('')}<button type="button" class="btn" data-goal-sheet-catalog>＋ Оценочный лист из каталога</button></section>`;}
  function checkpointFields(d){return `<label>Название встречи<input data-object-field="title" value="${esc(d.title)}" required></label><div class="object-field-grid"><label>День от начала плана<input type="number" data-object-field="day" min="1" max="365" value="${d.day}"></label><label>Показать сотруднику за, дней<input type="number" data-object-field="showBeforeDays" min="0" max="365" value="${d.showBeforeDays}"></label></div><label>Участники встречи<input data-object-field="participants" value="${esc(d.participants.join(', '))}" placeholder="Сотрудник, руководитель, наставник"></label><section class="object-section"><h3>Повестка встречи <em>*</em></h3><p class="muted">Что обсуждаем, какой прогресс рассматриваем и о чём нужно договориться.</p><textarea rows="7" data-object-field="agenda" required>${esc(d.agenda)}</textarea></section><section class="object-section"><h3>Вопросы для сотрудника <small>${d.questions.length}/5</small></h3><p class="muted">Пульс до встречи: сотрудник отвечает по шкале или свободным текстом.</p>${d.questions.map((q,i)=>`<div class="pulse-question"><label>Вопрос ${i+1}<textarea data-question-text="${i}" rows="2" required>${esc(q.text)}</textarea></label><div class="question-options"><select data-question-type="${i}" aria-label="Тип вопроса ${i+1}"><option value="scale" ${q.type==='scale'?'selected':''}>Шкала 1–5</option><option value="text" ${q.type==='text'?'selected':''}>Открытый ответ</option></select><label class="check-row"><input type="checkbox" data-question-required="${i}" ${q.required?'checked':''}>Обязательный</label><button type="button" class="btn small" data-remove-question="${i}" aria-label="Удалить вопрос ${i+1}">×</button></div></div>`).join('')}<button type="button" class="btn" data-add-question ${d.questions.length>=5?'disabled':''}>＋ Добавить вопрос</button></section>`;}
  const panel=(title,body,footer)=>`<aside class="object-panel" role="dialog" aria-modal="false" aria-label="${title}"><header><div><span class="tag blue">Настройка процесса</span><h2>${title}</h2></div><button class="btn icon-only" data-object-close aria-label="Закрыть настройки">×</button></header><div class="object-panel-body">${body}</div><footer>${footer}</footer></aside>`;
  function objectPanel(){
    const current=state.objectEditor;if(!current)return '';
    if(current.kind==='assessment-picker')return assessmentPicker(current);
    if(current.kind==='assessment')return assessmentEditor(current);
    const {kind,key,draft}=current;
    return panel(kind==='kt'?'Контрольная точка · встреча':'Цель адаптации',`<form id="workflow-object-form">${kind==='kt'?checkpointFields(draft):goalFields(draft)}<section class="object-section"><h3>${kind==='kt'?'Действия для обсуждения на встрече':'Связи с действиями этапов'}</h3><p class="muted">${kind==='kt'?'Результаты выбранных действий включаются в контекст встречи.':'Выберите действия, которые помогают достичь результата.'}</p><div class="object-link-list">${linkChoices(kind,key,draft.links||draft.linked)}</div></section><p id="object-error" class="object-error" role="alert"></p></form>`,`<button class="btn" data-object-close>Отмена</button><button class="btn primary" data-object-save>Сохранить ${kind==='kt'?'КТ':'цель'}</button>`);
  }
  function syncDraft(){
    const d=state.objectEditor?.draft;if(!d)return;
    document.querySelectorAll('[data-object-field]').forEach(input=>{let v=input.type==='number'?Number(input.value):input.value;d[input.dataset.objectField]=input.dataset.objectField==='participants'?String(v).split(',').map(s=>s.trim()).filter(Boolean):v;});
    document.querySelectorAll('[data-subgoal]').forEach(input=>{d.subgoals[Number(input.dataset.subgoal)].title=input.value;});
    document.querySelectorAll('[data-question-text]').forEach(input=>{d.questions[Number(input.dataset.questionText)].text=input.value;});
    document.querySelectorAll('[data-question-type]').forEach(input=>{d.questions[Number(input.dataset.questionType)].type=input.value;});
    document.querySelectorAll('[data-question-required]').forEach(input=>{d.questions[Number(input.dataset.questionRequired)].required=input.checked;});
    d.links=[...document.querySelectorAll('[data-object-link]:checked')].map(input=>{const [cell,id]=input.value.split('::');return {cell,id,title:state.items[cell]?.find(item=>item.id===id)?.title||''};});
  }
  function sheetSnapshot(sheet){return {...copy(sheet),instanceId:uid('evaluation'),evaluator:'Наставник',deadlineDays:7,launch:'При открытии этапа',required:true,onFail:'Назначить повторную проверку'};}
  function assessmentPicker(current){
    const query=[state.processTitle,state.assistantAnswers?.audience].join(' ');
    const family=window.SkillazProductionCatalog.resolveJobContext(query).key;
    const rows=[...evaluationSheets].sort((a,b)=>Number(b.domain===family)-Number(a.domain===family));
    return panel('Оценочные листы',`<p>Опубликованные шаблоны. При добавлении сохраняется копия критериев и настроек.</p><input class="search" data-sheet-search placeholder="Поиск по названию, навыку или должности">${current.goalReturn||current.replaceTarget?'':`<div class="object-field-grid"><label>Ветка<select data-sheet-branch>${branches.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label><label>Этап<select data-sheet-stage>${stages.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label></div>`}<div class="sheet-catalog">${rows.map(sheet=>`<article data-sheet-row><b>${esc(sheet.title)}</b><small>${esc(sheet.positions.join(', '))}</small><details><summary>${sheet.blocks.reduce((n,b)=>n+b.criteria.length,0)} критерия · порог ${sheet.threshold}%</summary>${sheet.blocks.map(b=>`<b>${esc(b.title)}</b><ul>${b.criteria.map(c=>`<li>${esc(c.title)}${c.critical?' · критичный':''}</li>`).join('')}</ul>`).join('')}</details><button class="btn" data-select-sheet="${sheet.id}">Добавить ${current.goalReturn?'в цель':'в этап'}</button></article>`).join('')}</div>`,`<button class="btn" data-sheet-back>Назад</button>`);
  }
  function assessmentEditor(current){
    const d=current.draft;
    return panel('Оценочный лист',`<h3>${esc(d.title)}</h3><p>${esc(d.competency)} · опубликован · версия ${d.version}</p><form id="assessment-form"><label>Кто оценивает<select data-evaluator>${['Наставник','Административный руководитель','Функциональный руководитель','Эксперт по бизнес-роли'].map(x=>`<option ${d.evaluator===x?'selected':''}>${x}</option>`).join('')}</select></label><div class="object-field-grid"><label>Срок проведения, дней<input type="number" min="1" max="365" data-evaluation-days value="${d.deadlineDays}"></label><label>Проходной балл, %<input type="number" min="1" max="100" data-evaluation-threshold value="${d.threshold}"></label></div><label>Когда запустить<select data-evaluation-launch>${['При открытии этапа','После связанных действий','При проверке результата цели'].map(x=>`<option ${d.launch===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Если лист не пройден<select data-evaluation-fail>${['Назначить повторную проверку','Уведомить руководителя','Назначить практику с наставником'].map(x=>`<option ${d.onFail===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="check-row"><input type="checkbox" data-evaluation-required ${d.required?'checked':''}>Обязательная проверка результата</label><section class="object-section"><h3>Критерии и шкала</h3><p>0 — не выполнено · 1 — с помощью · 2 — самостоятельно. «Не наблюдалось» не входит в расчёт. Критичная ошибка означает «не пройден».</p>${d.blocks.map(b=>`<h4>${esc(b.title)}</h4>${b.criteria.map(c=>`<div class="assessment-criterion"><span>${esc(c.title)}</span>${c.critical?'<em>Критичный</em>':''}${c.commentRequired?'<small>Комментарий обязателен</small>':''}</div>`).join('')}`).join('')}</section></form>`,`<button class="btn" data-sheet-back>Назад</button><button class="btn primary" data-save-assessment>Сохранить проверку</button>`);
  }
  function assessmentInStage(cell,sheet){
    const instance=sheetSnapshot(sheet);state.items[cell]||=[];
    const item={id:uid('assessment'),type:'assessment',title:sheet.title,meta:`${instance.evaluator} · ${instance.deadlineDays} дней · порог ${instance.threshold}%`,evaluation:instance};state.items[cell].push(item);return item;
  }
  function install(){
    const oldEditor=editor,oldBind=bind,oldItem=itemCard,oldPalette=palette,oldRender=render;
    render=()=>{const viewport=document.querySelector('#viewport');const position=viewport?{top:viewport.scrollTop,left:viewport.scrollLeft}:null;oldRender();if(position){const next=document.querySelector('#viewport');if(next){next.scrollTop=position.top;next.scrollLeft=position.left;}}};
    const pickedGoals=new Set();
    palette=()=>{
      let html=oldPalette();if(state.cleanCatalogType!=='goal')return html;
      return html.replace('<div class="palette-list clean-catalog-list',`<div class="goal-catalog-filters"><label>Функция<select data-goal-family><option value="">Все функции</option>${Object.entries(families).map(([id,f])=>`<option value="${id}">${esc(f.name)}</option>`).join('')}</select></label></div><div class="palette-list clean-catalog-list`)+`<div class="goal-catalog-apply" ${state.paletteOpen?'':'hidden'}><span data-picked-goals>Выбрано ${pickedGoals.size}</span><button class="btn primary" data-add-picked-goals>Добавить выбранные</button></div>`;
    };
    editor=()=>oldEditor()+objectPanel();
    itemCard=(item,cell)=>oldItem(item,cell).replace('</small>',`${item.evaluation?' · Оценочный лист':''}</small>`);
    bind=()=>{
      oldBind();document.body.classList.toggle('object-panel-open',Boolean(state.objectEditor));
      document.querySelectorAll('.clean-catalog-list [data-drag-type="goal"]').forEach(card=>{
        const template=[...(state.generatedGoalTemplates||[]),...window.SkillazProductionCatalog.elements].find(row=>row.id===card.dataset.dragId)||{};
        const previous=card.onclick;
        card.insertAdjacentHTML('beforeend',`<div class="goal-catalog-preview"><label class="check-row"><input type="checkbox" data-pick-goal="${esc(card.dataset.dragId)}" ${pickedGoals.has(card.dataset.dragId)?'checked':''}>Выбрать цель</label><details><summary>Описание и промежуточные результаты</summary><p>${esc(template.result||template.description||card.dataset.dragMeta)}</p><ul>${(template.subgoals||[]).map(row=>`<li>${esc(row.title)}</li>`).join('')}</ul><small>Срок: ${template.day||30} дней · ${esc(families[template.domain]?.name||'Все функции')}</small></details><button class="btn small" data-add-one-goal>Добавить в сценарий</button></div>`);
        card.onclick=event=>{if(event.target.closest('[data-add-one-goal]'))previous(event);else event.stopPropagation();};
      });
      document.querySelectorAll('[data-pick-goal]').forEach(input=>input.onchange=()=>{input.checked?pickedGoals.add(input.dataset.pickGoal):pickedGoals.delete(input.dataset.pickGoal);const label=document.querySelector('[data-picked-goals]');if(label)label.textContent=`Выбрано ${pickedGoals.size}`;});
      const familyFilter=document.querySelector('[data-goal-family]');if(familyFilter)familyFilter.onchange=()=>document.querySelectorAll('.clean-catalog-list [data-drag-type="goal"]').forEach(card=>{const row=window.SkillazProductionCatalog.elements.find(x=>x.id===card.dataset.dragId);card.hidden=Boolean(familyFilter.value&&row?.domain!==familyFilter.value);});
      const addPicked=document.querySelector('[data-add-picked-goals]');if(addPicked)addPicked.onclick=()=>{
        const key=state.catalogTargetScenario||state.activeTemplateScenario?.key;
        if(!window.SkillazTemplateAPI.scenarioRecords('goal').some(row=>row.key===key))return toast('Сначала выберите сценарий целей');
        document.querySelectorAll('.clean-catalog-list [data-drag-type="goal"]').forEach(card=>{if(pickedGoals.has(card.dataset.dragId))window.SkillazTemplateAPI.addTemplate('goal',key,{id:card.dataset.dragId,type:'goal',title:card.dataset.dragTitle,meta:card.dataset.dragMeta});});
        pickedGoals.clear();render();toast('Выбранные цели добавлены в сценарий');
      };
      document.querySelectorAll('[data-open-object]').forEach(el=>{el.onclick=event=>{event.stopPropagation();open(el.dataset.openObject,el.dataset.objectKey,el.dataset.objectId);};el.onkeydown=event=>{if(event.key==='Enter')el.click();};});
      document.querySelectorAll('.goal-template-card').forEach(card=>card.onclick=event=>{if(event.target.closest('button,input'))return;event.stopPropagation();const selected={id:card.dataset.goalTemplateId,key:card.dataset.placementKey};state.selectedGoal=state.selectedGoal?.id===selected.id&&state.selectedGoal?.key===selected.key?null:selected;render();});
      document.querySelectorAll('[data-item]').forEach(card=>{const item=state.items[card.dataset.sourceCell]?.find(x=>x.id===card.dataset.item);if(item?.type==='assessment'){const previous=card.onclick;card.onclick=event=>{if(event.target.closest('.card-actions,.outcome-summary')||state.goalLinkMode)return previous?.(event);state.objectEditor=item.evaluation?{kind:'assessment',cell:card.dataset.sourceCell,id:item.id,draft:copy(item.evaluation)}:{kind:'assessment-picker',replaceTarget:{cell:card.dataset.sourceCell,id:item.id}};state.paletteOpen=false;render();};}});
      document.querySelectorAll('.lane-cell[data-cell]').forEach(cell=>cell.addEventListener('drop',event=>{let data;try{data=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}if(data.existing||data.type!=='assessment')return;const sheet=evaluationSheets.find(s=>s.id===data.id);if(!sheet)return;event.preventDefault();event.stopImmediatePropagation();assessmentInStage(cell.dataset.cell,sheet);render();toast('Оценочный лист добавлен в этап');},true));
      document.querySelectorAll('[data-template-drop-kind="goal"]').forEach(zone=>zone.addEventListener('drop',event=>{let data;try{data=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}if(data.type!=='assessment')return;event.preventDefault();event.stopImmediatePropagation();const card=event.target.closest('[data-goal-template-id]');if(!card)return toast('Перетащите оценочный лист на конкретную цель');const g=findObject('goal',card.dataset.placementKey,card.dataset.goalTemplateId),sheet=evaluationSheets.find(s=>s.id===data.id);if(g&&sheet){g.evaluations||=[];g.evaluations.push({...sheetSnapshot(sheet),launch:'При проверке результата цели'});render();}},true));
    };
    document.addEventListener('input',event=>{if(event.target.matches('[data-sheet-search]')){const q=event.target.value.toLowerCase();document.querySelectorAll('[data-sheet-row]').forEach(el=>el.hidden=!el.innerText.toLowerCase().includes(q));}});
    document.addEventListener('click',event=>{
      const el=event.target.closest('[data-object-save],[data-object-close],[data-add-question],[data-remove-question],[data-add-subgoal],[data-remove-subgoal],[data-goal-sheet-catalog],[data-add-goal-assessment],[data-select-sheet],[data-sheet-back],[data-edit-assessment],[data-remove-assessment],[data-save-assessment],[data-open-assessment-catalog]');if(!el)return;
      event.preventDefault();event.stopImmediatePropagation();syncDraft();
      let current=state.objectEditor,d=current?.draft;
      if(el.hasAttribute('data-object-close'))state.objectEditor=null;
      if(el.hasAttribute('data-object-save')){
        if(!document.querySelector('#workflow-object-form').reportValidity())return;
        if(current.kind==='kt'&&d.showBeforeDays>d.day){document.querySelector('#object-error').textContent='Срок показа не может быть раньше начала плана.';return;}
        if(current.kind==='kt')d.pulse=d.questions.map(q=>q.text).join('; ');
        const target=findObject(current.kind,current.key,current.id);if(target)Object.assign(target,copy(d));state.objectEditor=null;toast('Изменения сохранены');
      }
      if(el.hasAttribute('data-add-question')&&d.questions.length<5)d.questions.push({id:uid('q'),text:'',type:'scale',required:true});
      if(el.hasAttribute('data-remove-question'))d.questions.splice(Number(el.dataset.removeQuestion),1);
      if(el.hasAttribute('data-add-subgoal')){d.subgoals||=[];d.subgoals.push({id:uid('subgoal'),title:''});}
      if(el.hasAttribute('data-remove-subgoal'))d.subgoals.splice(Number(el.dataset.removeSubgoal),1);
      if(el.hasAttribute('data-remove-assessment'))d.evaluations.splice(Number(el.dataset.removeAssessment),1);
      if(el.hasAttribute('data-add-goal-assessment')){open('goal',el.dataset.objectKey,el.dataset.addGoalAssessment);current=state.objectEditor;state.objectEditor={kind:'assessment-picker',goalReturn:current};}
      if(el.hasAttribute('data-goal-sheet-catalog'))state.objectEditor={kind:'assessment-picker',goalReturn:current};
      if(el.hasAttribute('data-open-assessment-catalog')){state.objectEditor={kind:'assessment-picker'};state.cleanAddOpen=false;state.paletteOpen=false;}
      if(el.hasAttribute('data-select-sheet')){
        const sheet=evaluationSheets.find(s=>s.id===el.dataset.selectSheet);if(!sheet)return;
        if(current.goalReturn){const parent=current.goalReturn;parent.draft.evaluations||=[];parent.draft.evaluations.push({...sheetSnapshot(sheet),launch:'При проверке результата цели'});state.objectEditor=parent;}
        else{const cell=current.replaceTarget?.cell||`${document.querySelector('[data-sheet-branch]').value}-${document.querySelector('[data-sheet-stage]').value}`;const item=current.replaceTarget?state.items[cell].find(row=>row.id===current.replaceTarget.id):assessmentInStage(cell,sheet);if(current.replaceTarget){item.evaluation=sheetSnapshot(sheet);item.title=sheet.title;}state.objectEditor={kind:'assessment',cell,id:item.id,draft:copy(item.evaluation)};}
      }
      if(el.hasAttribute('data-edit-assessment')){state.objectEditor={kind:'assessment',goalReturn:current,index:Number(el.dataset.editAssessment),draft:copy(d.evaluations[Number(el.dataset.editAssessment)])};}
      if(el.hasAttribute('data-sheet-back'))state.objectEditor=current.goalReturn||null;
      if(el.hasAttribute('data-save-assessment')){
        if(!document.querySelector('#assessment-form').reportValidity())return;
        Object.assign(d,{evaluator:document.querySelector('[data-evaluator]').value,deadlineDays:Number(document.querySelector('[data-evaluation-days]').value),threshold:Number(document.querySelector('[data-evaluation-threshold]').value),launch:document.querySelector('[data-evaluation-launch]').value,onFail:document.querySelector('[data-evaluation-fail]').value,required:document.querySelector('[data-evaluation-required]').checked});
        if(current.goalReturn){current.goalReturn.draft.evaluations[current.index]=copy(d);state.objectEditor=current.goalReturn;}
        else{const item=state.items[current.cell]?.find(x=>x.id===current.id);if(item){item.evaluation=copy(d);item.meta=`${d.evaluator} · ${d.deadlineDays} дней · порог ${d.threshold}%`;}state.objectEditor=null;}
      }
      render();
    },true);
    render();
  }
  window.SkillazObjects={ktCard,goalExtra,goalSettings,normalizeCheckpoint,assessmentInStage,evaluationSheets,open,install};
})();
