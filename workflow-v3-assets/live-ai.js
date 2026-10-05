(function () {
  const ENDPOINT = 'https://skillaz-workflow-ai.skillaz-sales-bot.workers.dev/assistant';
  const timeout = 60000;
  let active = 0;
  const labels = {launch:'Разбираю ответ и заполняю параметры запуска',participants:'Подбираю участников из справочника',process:'Собираю ветки, этапы и карточки процесса',goals:'Готовлю цели для выбранных должностей',checkpoints:'Готовлю повестку встречи и вопросы сотруднику',elements:'Подбираю содержимое этапов'};
  function progress(task, started) {
    let el=document.getElementById('live-ai-progress');
    if(!el){el=document.createElement('div');el.id='live-ai-progress';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el);}
    const seconds=Math.floor((Date.now()-started)/1000);
    el.innerHTML=`<span class="request-spinner"></span><div><b>${labels[task]||'Обрабатываю запрос'}</b><small>${seconds<12?'Ответ появится автоматически':`Запрос ещё выполняется · ${seconds} сек.`}</small></div>`;
    el.hidden=false;
  }

  async function request(task, payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({task,...payload}),
        signal:controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'AI сейчас недоступен');
      return result;
    } finally { clearTimeout(timer); }
  }

  async function ask(task, payload) {
    const id=++active,started=Date.now();progress(task,started);
    const ticker=setInterval(()=>{if(id===active)progress(task,started);},1000);
    try { return await request(task,payload); }
    catch(error){throw new Error(error.name==='AbortError'?'AI не ответил за минуту. Ответ сохранён; можно повторить запрос.':error.message);}
    finally {clearInterval(ticker);if(id===active){const el=document.getElementById('live-ai-progress');if(el)el.hidden=true;}}
  }

  const context = query => {
    const catalog = window.SkillazProductionCatalog;
    if (!catalog) return {};
    const references = window.SkillazReferenceData?.context(query) || {};
    return {
      elements:catalog.relevantElements(query, 28),
      businessRoles:catalog.relevantRoles(query, 24),
      organizationStructures:references.structures || [],
      positions:references.positions || [],
      jobContext:catalog.resolveJobContext?.(query) || null,
      employeeGroups:references.groups || [],
      territories:references.regions || [],
      catalogStats:{...catalog.stats,referenceData:window.SkillazReferenceData?.stats || {}}
    };
  };

  window.SkillazLiveAI = { endpoint:ENDPOINT, ask, context };
})();
