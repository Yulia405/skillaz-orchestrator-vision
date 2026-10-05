(function () {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const key=(cell,id)=>`${cell}::${id}`;
  const conditions={passed:'Выполнен / пройден',failed:'Не выполнен / не пройден',overdue:'Срок выполнения истёк'};
  const actions={continue:'Продолжить основной маршрут',assign:'Назначить другую карточку процесса',catalog:'Назначить курс, тренинг или проверку из каталога',repeat:'Повторить этот элемент',notify:'Уведомить участника',escalate:'Эскалировать руководителю',branch:'Перевести на другую ветку',pause:'Приостановить план до решения руководителя'};
  const allItems=()=>Object.entries(state.items).flatMap(([cell,items])=>items.map(item=>({...item,cell})));
  const itemLabel=item=>`${item.title} · ${branches.find(b=>item.cell.startsWith(b.id+'-'))?.name||''} / ${stages.find(s=>item.cell.endsWith('-'+s.id))?.name||''}`;
  const context=()=>{
    const a=state.newWorkflow?{...state.manualLaunch,...state.assistantAnswers}:{};
    return {title:(state.newWorkflow?state.processTitle:null)||currentWorkflow().name,event:a.event||'По настройкам запуска',timing:a.timing||'При назначении плана',audience:a.audience?.replace(/ · Все регионы присутствия[\s\S]*$/, '').replace(/ · Территория:[\s\S]*$/, '')||branches.map(b=>b.name).join(', '),territory:state.newWorkflow?(state.launchScope?.label||'По выбранному охвату процесса'):'По охвату процесса'};
  };
  Object.entries(window.SkillazProductionCatalog.jobFamilies).forEach(([domain,family])=>window.SkillazProductionCatalog.elements.push({id:'training-'+domain,type:'course',format:'training',domain,title:'Практический тренинг: '+family.tasks[0].toLowerCase(),description:'Отработка рабочих ситуаций с тренером и обратной связью',source:'Каталог тренингов',tags:family.keywords}));
  const targets=()=>window.SkillazProductionCatalog.elements.filter(row=>['course','training','test','assessment'].includes(row.type));
  const recipientOptions=()=>[...new Set(['Сотрудник','Административный руководитель','Функциональный руководитель','Координатор процесса',...(state.newRoles||[]).map(r=>r.name)])];
  const emptyRule=()=>({when:'failed',action:'catalog',target:'',recipient:'Административный руководитель',limit:1});
  function legacyRules(cell,id){
    const old=state.outcomeRules?.[id];if(!old)return [];
    return [[old.condition,old.action],[old.extraCondition,old.extraAction]].filter(([when])=>when).map(([when,action])=>({...emptyRule(),when:/срок|просроч/i.test(when)?'overdue':/не |ниже|ошиб/i.test(when)?'failed':'passed',action:/уведом/i.test(action)?'notify':/эскал/i.test(action)?'escalate':/повтор/i.test(action)?'repeat':/назнач/i.test(action)?'catalog':'continue'}));
  }
  function rulesFor(cell,id){return state.elementRoutes?.[key(cell,id)]??legacyRules(cell,id);}
  function describe(rule){
    const target=rule.action==='assign'?allItems().find(i=>key(i.cell,i.id)===rule.target):rule.action==='catalog'?targets().find(i=>i.id===rule.target):null;
    if(target)return `${rule.action==='assign'?'Назначить':'Добавить в план'} «${target.title}»`;
    if(rule.action==='branch')return `Перейти в ветку «${branches.find(b=>b.id===rule.target)?.name||'не выбрана'}»`;
    if(['notify','escalate'].includes(rule.action))return `${rule.action==='notify'?'Уведомить':'Эскалировать'}: ${rule.recipient}`;
    if(rule.action==='repeat')return `Повторить элемент · не более ${rule.limit} раз`;
    return actions[rule.action];
  }
  function evaluate(rules,outcome){return rules.filter(rule=>rule.when===outcome).map(copy);}
  function validate(rules,cell,id){
    for(const rule of rules){
      if(!conditions[rule.when]||!actions[rule.action])return 'Выберите результат и действие.';
      if(rule.action==='assign'&&(!allItems().some(i=>key(i.cell,i.id)===rule.target)||rule.target===key(cell,id)))return 'Выберите другую карточку процесса. Для текущей используйте «Повторить этот элемент».';
      if(rule.action==='catalog'&&!targets().some(i=>i.id===rule.target))return 'Выберите конкретный курс, тренинг или проверку из каталога.';
      if(rule.action==='branch'&&!branches.some(b=>b.id===rule.target))return 'Выберите ветку назначения.';
      if(rule.action==='repeat'&&(!Number.isInteger(rule.limit)||rule.limit<1||rule.limit>3))return 'Число повторов — от 1 до 3. После этого требуется решение руководителя.';
    }
    return '';
  }
  const options=(map,value)=>Object.entries(map).map(([id,label])=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(label)}</option>`).join('');
  function ruleFields(rule,index,source){
    const selected=(id,title)=>`<option value="${esc(id)}" ${rule.target===id?'selected':''}>${esc(title)}</option>`;
    let extra='';
    if(rule.action==='assign')extra=`<label>Карточка процесса<select data-route-field="target"><option value="">Выберите карточку</option>${allItems().filter(i=>key(i.cell,i.id)!==key(source.cell,source.id)).map(i=>selected(key(i.cell,i.id),itemLabel(i))).join('')}</select></label>`;
    if(rule.action==='catalog'){
      const query=[source.title,context().title].join(' '),ranked=window.SkillazProductionCatalog.relevantElements(query,500).filter(i=>targets().some(t=>t.id===i.id));
      extra=`<label>Найти в каталоге<input data-route-search placeholder="Название курса, тренинга или проверки"></label><label>Что назначить<select data-route-field="target"><option value="">Выберите элемент каталога</option>${ranked.map(i=>selected(i.id,i.title)).join('')}</select></label>`;
    }
    if(rule.action==='branch')extra=`<label>Ветка назначения<select data-route-field="target"><option value="">Выберите ветку</option>${branches.map(b=>selected(b.id,b.name)).join('')}</select></label><p class="muted">Общий контур сохраняется. Выполненные элементы остаются в истории плана.</p>`;
    if(['notify','escalate'].includes(rule.action))extra=`<label>Получатель<select data-route-field="recipient">${recipientOptions().map(r=>`<option ${r===rule.recipient?'selected':''}>${esc(r)}</option>`).join('')}</select></label>`;
    if(rule.action==='repeat')extra=`<label>Максимум повторов<input type="number" data-route-field="limit" min="1" max="3" value="${rule.limit||1}"></label><p class="muted">После последней неуспешной попытки — эскалация руководителю.</p>`;
    return `<section class="route-rule" data-route-rule="${index}"><header><b>Правило ${index+1}</b><button class="btn small" data-remove-route="${index}" aria-label="Удалить правило ${index+1}">×</button></header><label>ЕСЛИ результат элемента<select data-route-field="when">${options(conditions,rule.when)}</select></label><label>ТОГДА<select data-route-field="action">${options(actions,rule.action)}</select></label>${extra}</section>`;
  }
  function panel(){
    const e=state.routeEditor;if(!e)return '';
    return `<aside class="object-panel route-panel" role="dialog" aria-modal="false" aria-label="Маршрут после элемента"><header><div><span class="tag blue">Условие → автоматическое действие</span><h2>Маршрут после элемента</h2></div><button class="btn icon-only" data-route-close aria-label="Закрыть маршрут">×</button></header><div class="object-panel-body"><h3>${esc(e.title)}</h3><p>Задайте, что делать после результата этой карточки. Все подходящие правила выполняются вместе.</p>${e.rules.map((rule,i)=>ruleFields(rule,i,e)).join('')}<button class="btn" data-add-route>＋ Условие и действие</button><p class="muted">Если ни одно условие не сработало — продолжить основной маршрут.</p><section class="object-section"><h3>Проверить маршрут</h3><label>Тестовый результат<select data-route-test>${options(conditions,e.testOutcome||'failed')}</select></label><button class="btn" data-test-route>Показать следующий шаг</button><div class="route-preview" role="status">${e.preview?`<b>Тестовый маршрут</b><ol>${e.preview.map(text=>`<li>${esc(text)}</li>`).join('')}</ol><small>Проверка не назначает обучение и не отправляет уведомления.</small>`:''}</div></section><p class="object-error" role="alert">${esc(e.error||'')}</p></div><footer><button class="btn" data-route-close>Отмена</button><button class="btn primary" data-save-routes>Сохранить маршрут</button></footer></aside>`;
  }
  function sync(){
    const e=state.routeEditor;if(!e)return;
    document.querySelectorAll('[data-route-rule]').forEach(row=>row.querySelectorAll('[data-route-field]').forEach(input=>e.rules[Number(row.dataset.routeRule)][input.dataset.routeField]=input.type==='number'?Number(input.value):input.value));
    e.testOutcome=document.querySelector('[data-route-test]')?.value||'failed';
  }
  function open(cell,id){
    const item=state.items[cell]?.find(i=>i.id===id);if(!item)return;
    state.routeEditor={cell,id,title:item.title,rules:copy(rulesFor(cell,id))};
    if(!state.routeEditor.rules.length)state.routeEditor.rules=[emptyRule()];
    state.outcomeModal=null;state.objectEditor=null;state.paletteOpen=false;state.cleanAddOpen=false;state.goalLinkMode=null;render();
  }
  const oldEditor=editor,oldBind=bind,oldItem=itemCard;
  editor=()=>{if(state.step!=='canvas'){state.routeEditor=null;state.objectEditor=null;}return oldEditor()+panel();};
  itemCard=(item,cell)=>{
    let html=oldItem(item,cell).replace(/<button class="outcome-summary[\s\S]*?<\/button>/g,'');
    if(['goal','checkpoint','action'].includes(item.type))return html;
    const count=rulesFor(cell,item.id).length;
    return html.replace('<i class="port',`<button class="outcome-summary route-entry ${count?'configured':''}" data-route-item="${esc(item.id)}" data-route-cell="${esc(cell)}"><span>⑂ Если выполнен / не выполнен</span><b>${count?`Изменить маршрут · правил: ${count}`:'Настроить следующий шаг'}</b></button><i class="port`);
  };
  bind=()=>{
    oldBind();document.body.classList.toggle('object-panel-open',Boolean(state.objectEditor||state.routeEditor));
    document.querySelectorAll('[data-route-item]').forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();open(button.dataset.routeCell,button.dataset.routeItem);});
    const audience=context().audience;
    document.querySelectorAll('[data-ai-condition]').forEach(input=>input.placeholder=Number(input.dataset.aiCondition)===0?`Например: ${branches.find(b=>b.id!=='base')?.name||audience}`:'Подразделение или узел выбранной структуры');
    document.querySelectorAll('.clean-palette [data-drag-type="action"]').forEach(card=>card.remove());
    if(state.cleanCatalogType==='action')document.querySelectorAll('[data-clean-ai-elements]').forEach(button=>button.hidden=true);
  };
  const oldStart=startNewWorkflow;startNewWorkflow=()=>{state.elementRoutes={};state.workflowNotifications={};state.routeEditor=null;oldStart();};
  const oldLoad=loadWorkflow;loadWorkflow=id=>{state.elementRoutes={};state.workflowNotifications={};state.routeEditor=null;oldLoad(id);};
  const notificationSection=()=>'<section class="setting wide"><b>Уведомления workflow</b>'+['План назначен','Скоро начнется план','Приближается окончание','Изменились даты','Изменился участник'].map((label,index)=>'<label class="toggle-row"><span>'+label+'</span><input type="checkbox" data-workflow-notification="'+index+'" '+(state.workflowNotifications?.[index]===false?'':'checked')+'></label>').join('')+'</section>';
  finalPage=()=>{
    const c=context();const routes=Object.values(state.elementRoutes||{}).flat().length;
    return `<div class="page"><div class="page-card wide-card"><div class="settings-title"><div><h1>Проверка и публикация</h1><p class="muted">${esc(c.title)}</p></div></div><div class="settings-grid"><section class="setting wide"><div class="section-head"><b>Правило назначения этого процесса</b><button class="btn" data-step="base">Изменить запуск</button></div><div class="publication-context"><div><small>СОБЫТИЕ</small><b>${esc(c.event)}</b><span>${esc(c.timing)}</span></div><div><small>АУДИТОРИЯ</small><b>${esc(c.audience)}</b><span>${esc(c.territory)}</span></div><div><small>ДЕЙСТВИЕ</small><b>Назначить «${esc(c.title)}»</b><span>Вне выбранного охвата план не назначается.</span></div></div></section><section class="setting"><b>Ветки процесса</b>${branches.map(b=>`<p><strong>${esc(b.name)}</strong><br><small>${esc((b.conditions||[]).join('; ')||b.desc||'По условиям процесса')}</small></p>`).join('')}<button class="btn" data-step="canvas">Открыть процесс</button></section><section class="setting"><b>Содержание и маршруты</b><p>${stages.length} этапов · ${allItems().length} элементов</p><p>${(state.goalScenarios||[]).length} сценариев целей · ${(state.ktScenarios||[]).length} сценариев КТ</p><p>${routes} правил по результатам элементов</p><small>Проверьте маршруты в карточках элементов: выберите тестовый результат и посмотрите следующий шаг.</small></section><section class="setting"><b>Версия</b><p>Текущий черновик</p><small>Изменения сохраняются локально. Активные планы не изменяются автоматически.</small></section><section class="setting"><b>Участники и сопровождение</b><p>${esc((state.newRoles||[]).map(r=>r.name).join(', ')||'По настройкам участников процесса')}</p><p>Координатор: ${esc(state.coordinatorRule||'по правилу назначения')}</p><button class="btn" data-step="participants">Проверить участников</button></section>${notificationSection()}</div></div></div>`;
  };
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-workflow-notification]')){state.workflowNotifications||={};state.workflowNotifications[event.target.dataset.workflowNotification]=event.target.checked;render();}
    if(event.target.matches('[data-route-field="action"]')){sync();const index=Number(event.target.closest('[data-route-rule]').dataset.routeRule);state.routeEditor.rules[index].target='';state.routeEditor.preview=null;render();}
  });
  document.addEventListener('input',event=>{
    if(!event.target.matches('[data-route-search]'))return;
    const q=event.target.value.toLowerCase();event.target.closest('[data-route-rule]').querySelectorAll('[data-route-field="target"] option').forEach(o=>o.hidden=Boolean(o.value&&!o.textContent.toLowerCase().includes(q)));
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-route-close],[data-add-route],[data-remove-route],[data-save-routes],[data-test-route]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();sync();const e=state.routeEditor;
    if(button.hasAttribute('data-route-close'))state.routeEditor=null;
    if(button.hasAttribute('data-add-route'))e.rules.push(emptyRule());
    if(button.hasAttribute('data-remove-route'))e.rules.splice(Number(button.dataset.removeRoute),1);
    if(button.hasAttribute('data-save-routes')||button.hasAttribute('data-test-route')){
      e.error=validate(e.rules,e.cell,e.id);
      if(!e.error){
        if(button.hasAttribute('data-save-routes')){state.elementRoutes||={};state.elementRoutes[key(e.cell,e.id)]=copy(e.rules);state.routeEditor=null;toast('Маршрут сохранён');}
        else{const matched=evaluate(e.rules,e.testOutcome);e.preview=matched.length?matched.map(describe):['Продолжить основной маршрут'];}
      }
    }
    render();
  },true);
  window.SkillazRouting={key,evaluate,validate,rulesFor,context,open};
  render();
})();
