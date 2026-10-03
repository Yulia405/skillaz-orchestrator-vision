const ALLOWED_ORIGINS = new Set(['https://yulia405.github.io']);
const RATE = new Map();

const TASK_INSTRUCTIONS = {
  launch: `Ты продуктовый AI-помощник Skillaz Start. Веди короткий адаптивный диалог с HR-администратором, который не обязан знать модель workflow. Из сообщения и уже собранного контекста выясни: зачем нужен процесс и ожидаемый результат, событие запуска, момент запуска, аудиторию по оргструктуре/должностям/территории и нужны ли разные пути. Не повторяй уже отвеченное. Задавай один конкретный следующий вопрос только по главному пробелу. Варианты ответа формируй из контекста пользователя. Когда данных достаточно, поставь ready=true.`,
  participants: `Ты настраиваешь участников workflow Skillaz. На основе процесса и справочника предложи нужные бизнес роли, для каждой укажи административное или функциональное назначение, правило поиска сотрудника и задачу в процессе. Обязательно определи координатора сопровождения, который видит прогресс, просрочки и получает уведомления. Не требуй от администратора знания системной модели: если данных мало, задай один понятный вопрос.`,
  process: `Ты проектируешь исполнимый workflow Skillaz. Построй общий контур и отдельные ветки только там, где действия реально отличаются. Создай 4-7 этапов, карточки действий из переданного каталога, цели, контрольные точки, уведомления и исходы карточек в формате если→то. Учитывай запуск, аудиторию и участников. Возвращай целостный черновик, пригодный для редактирования на канве.`,
  elements: `Ты подбираешь элементы для конкретных веток и этапов workflow Skillaz. Сначала используй релевантные объекты переданного каталога. Не дублируй существующие карточки. Для каждого предложения объясни связь с аудиторией и этапом. Добавляй разумный исход если→то для тестов, курсов и контрольных действий.`,
  goals: `Ты формируешь измеримые цели процесса Skillaz и связываешь их с действиями. Цель описывает наблюдаемый рабочий результат, имеет срок и подходящие карточки процесса.`,
  checkpoints: `Ты формируешь контрольные точки процесса Skillaz: срок, участники, проверяемый результат, вопросы и реакцию на негативный исход.`
};

function cors(origin) {
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin || '');
  return {
    'access-control-allow-origin': ALLOWED_ORIGINS.has(origin) || local ? origin : 'https://yulia405.github.io',
    'access-control-allow-methods':'POST,OPTIONS',
    'access-control-allow-headers':'content-type',
    'vary':'Origin'
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8',...cors(origin)}});
}

function outputText(response) {
  for (const item of response.output || []) for (const content of item.content || []) if (content.type === 'output_text') return content.text;
  return '';
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ok:true,model:env.OPENAI_MODEL || 'gpt-5-mini'},200,origin);
    if (url.pathname !== '/assistant' || request.method !== 'POST') return json({error:'Not found'},404,origin);
    if (!ALLOWED_ORIGINS.has(origin) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return json({error:'Origin is not allowed'},403,origin);
    if (!env.OPENAI_API_KEY) return json({error:'AI secret is not configured'},503,origin);
    const client = request.headers.get('cf-connecting-ip') || 'local';
    const now = Date.now(), current = RATE.get(client);
    if (!current || now - current.since > 60000) RATE.set(client,{since:now,count:1});
    else if (++current.count > 25) return json({error:'Too many requests. Try again in a minute.'},429,origin);
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 160000) return json({error:'Request is too large'},413,origin);

    let body;
    try { body = await request.json(); } catch { return json({error:'Invalid JSON'},400,origin); }
    const task = String(body.task || '');
    if (!TASK_INSTRUCTIONS[task]) return json({error:'Unknown assistant task'},400,origin);

    const contract = `Ответь только валидным JSON без markdown. Общий формат: {"message":"краткое подтверждение или результат","question":"следующий вопрос или пустая строка","hint":"зачем нужен вопрос","suggestions":["2-4 контекстных варианта"],"ready":false,"updates":{},"roles":[],"process":null,"proposals":[]}. updates может содержать scenario,result,event,timing,audience,pathType,coordinator. roles: [{name,assignmentType,purpose,assignmentRule}]. process: {title,stages:[{id,name,days}],branches:[{id,name,condition}],items:[{id,title,type,branchId,stageId,assignee,sourceId,outcomes:[{if,then}]}],goals:[{title,result,day,linkedItemIds}],checkpoints:[{title,day,result,participants,onFail}],notifications:[{event,recipient,message}]}. proposals имеют поля title,type,branchId,stageId,sourceId,reason,outcomes. Не выдумывай sourceId: бери его только из каталога.`;
    const input = {
      task,
      userMessage:String(body.message || '').slice(0,5000),
      context:body.context || {},
      history:Array.isArray(body.history) ? body.history.slice(-12) : [],
      catalog:body.catalog || {}
    };
    const response = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{'authorization':`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},
      body:JSON.stringify({
        model:env.OPENAI_MODEL || 'gpt-5-mini',
        instructions:`${TASK_INSTRUCTIONS[task]}\n\n${contract}`,
        input:JSON.stringify(input),
        text:{format:{type:'json_object'}},
        max_output_tokens:6000
      })
    });
    const upstream = await response.json();
    if (!response.ok) return json({error:'OpenAI request failed',details:upstream.error?.message || 'Unknown error'},502,origin);
    try { return json(JSON.parse(outputText(upstream)),200,origin); }
    catch { return json({error:'AI returned invalid JSON'},502,origin); }
  }
};
