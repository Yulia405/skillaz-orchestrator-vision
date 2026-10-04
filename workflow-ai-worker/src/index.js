const ALLOWED_ORIGINS = new Set(['https://yulia405.github.io']);
const RATE = new Map();

const TASK_INSTRUCTIONS = {
  launch: `Ты продуктовый AI-помощник Skillaz Start. Веди короткий адаптивный диалог с HR-администратором, который не обязан знать модель workflow. Максимум четыре ответа пользователя на весь блок запуска. После каждого ответа извлеки и верни в updates ВСЕ уже известные поля: scenario, result, event, timing, audience, pathType. Разрешённые системные значения: scenario — «Пребординг», «Новый сотрудник» или «Вход в новую роль»; event — «ATS · оффер принят», «Мастер-система · сотрудник вышел», «Мастер-система · должность изменилась» или «Администратор · ручной запуск»; timing — «За 5 дней до события», «В момент события» или «Через 1 день после события»; pathType — «Один общий путь» или «Общая часть + варианты по условиям». Делай разумные выводы из контекста: не спрашивай то, что можно вывести. Никогда не повторяй вопрос из context.askedQuestions или history. Задавай один конкретный следующий вопрос только по главному пробелу. На четвёртом ответе заполни пробелы разумными значениями и поставь ready=true.`,
  participants: `Ты настраиваешь участников workflow Skillaz. На основе процесса и справочника предложи нужные бизнес роли, для каждой укажи административное или функциональное назначение, правило поиска сотрудника и задачу в процессе. Обязательно определи координатора сопровождения, который видит прогресс, просрочки и получает уведомления. Не требуй от администратора знания системной модели: если данных мало, задай один понятный вопрос.`,
  process: `Ты проектируешь исполнимый workflow Skillaz. Если launch.pathType содержит «Общая часть + варианты», первая ветка обязана быть {id:"base",name:"Общий контур",condition:"Вся выбранная аудитория"}; общие карточки размещай только в ней, а отдельные ветки создавай лишь для различающихся действий. При одном общем пути используй только base. Создай 5-7 этапов и насыщенный черновик: минимум 2 действия в каждом основном этапе каждой ветки, 25-45 карточек суммарно. Сначала используй sourceId из переданного каталога. Обязательно создай 1-3 цели, 3 контрольные точки, уведомления и исходы карточек в формате если→то. У вариантных веток condition должен быть понятным бизнес-условием по должности, подразделению или формату работы.`,
  elements: `Ты подбираешь элементы для конкретных веток и этапов workflow Skillaz. Сначала используй релевантные объекты переданного каталога. Не дублируй существующие карточки. Для каждого предложения объясни связь с аудиторией и этапом. Добавляй разумный исход если→то для тестов, курсов и контрольных действий.`,
  goals: `Ты формируешь 3-6 измеримых целей процесса Skillaz для должностей и веток, выбранных в текущем сценарии целей. Каждая цель должна описывать конкретный наблюдаемый рабочий результат именно этой должности, иметь реалистичный срок, branchId и linkedItemIds из действий выбранной ветки. Не подменяй профессиональные цели универсальной адаптацией, когда должность известна.`,
  checkpoints: `Ты формируешь 2-4 контрольные точки процесса Skillaz для должностей и веток, выбранных в текущем сценарии КТ. Каждая КТ должна иметь branchId, срок, участников, проверяемый результат, содержательную повестку agenda, 2-4 должностных вопроса пульса pulse и реакцию onFail. Повестка и пульс должны различаться для кассира, продавца, маркетолога, складской, производственной, офисной и руководящей ролей.`
};

const DIALOG_POLICY = `Правила вариантов ответа в suggestions: это 3-4 коротких, но полноценных ответа пользователя на текущий вопрос. Каждый вариант должен быть построен из конкретного контекста запроса, уже собранных полей и переданных каталогов. Не повторяй варианты из предыдущих ходов. Не используй абстрактные табы вроде «Вариант 1», «Другое» или одинаковые универсальные наборы. Для логистики называй релевантные роли, события и результаты логистики; для розницы, производства, офиса и руководителей формируй другие варианты. Нажатие на вариант должно давать достаточно данных, чтобы заполнить соответствующее поле без дополнительного уточнения.`;

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

function launchResult(result, input) {
  const previous = input.context?.answers || {};
  const turn = Number(input.context?.turn) || input.history.filter(item => item.role === 'user').length || 1;
  const text = `${JSON.stringify(input.history)} ${input.userMessage} ${JSON.stringify(previous)}`.toLowerCase();
  const updates = {...previous,...(result.updates || {})};
  const roles = [
    ['курьер','курьеры'],['водител','водители'],['диспетчер','диспетчеры'],['кладовщик','кладовщики'],
    ['комплектовщик','комплектовщики'],['продав','продавцы'],['кассир','кассиры'],['оператор','операторы'],
    ['руководител','руководители'],['менеджер','менеджеры'],['стажер','стажёры'],
    ['маркетолог','маркетологи'],['мерчандайз','мерчандайзеры'],['аналитик','аналитики'],
    ['рекрутер','рекрутеры'],['бухгалтер','бухгалтеры'],['юрист','юристы'],['разработчик','разработчики']
  ].filter(([needle]) => text.includes(needle)).map(([,label]) => label);
  const scopePattern = /москв|петербург|казан|сочи|курск|ор[её]л|екатерин|новосибир|регион|город|магазин|торгов.*точ|вся.*сет|подраздел|отдел|филиал|площадк|департамент|дочерн|логистическ.*центр/;
  const scopeMessage = scopePattern.test(input.userMessage.toLowerCase());
  const scopeKnown = scopePattern.test(text);

  if (!updates.scenario) updates.scenario = /оффер|преборд|до выход/.test(text) ? 'Пребординг' : /нов.*рол|перевод|должност.*измен/.test(text) ? 'Вход в новую роль' : 'Новый сотрудник';
  if (!updates.event) updates.event = updates.scenario === 'Пребординг' ? 'ATS · оффер принят' : updates.scenario === 'Вход в новую роль' ? 'Мастер-система · должность изменилась' : /ручн|администратор/.test(text) ? 'Администратор · ручной запуск' : 'Мастер-система · сотрудник вышел';
  if (!updates.timing) updates.timing = /за .*дн|до событ|до выход/.test(text) ? 'За 5 дней до события' : /через.*день|после событ/.test(text) ? 'Через 1 день после события' : 'В момент события';
  if (!updates.audience && roles.length) updates.audience = roles.join(', ');
  if (updates.audience && scopeMessage && !String(updates.audience).toLowerCase().includes(input.userMessage.toLowerCase())) updates.audience = `${updates.audience} · ${input.userMessage}`;
  if (!updates.pathType) updates.pathType = roles.length > 1 || /раздел|разн.*пут|ветк|по рол/.test(text) ? 'Общая часть + варианты по условиям' : 'Один общий путь';
  if (!updates.result && /самостоятель|безопас|допуск|осво|готовност|рабоч.*результ/.test(input.userMessage.toLowerCase())) updates.result = input.userMessage;

  const missing = ['result','audience'].find(key => !updates[key]) || (roles.length && !scopeKnown ? 'scope' : '');
  const domain = /логист|курьер|водител|достав|диспетчер/.test(text) ? 'logistics' : /розниц|продав|кассир|магазин/.test(text) ? 'retail' : /производ|оператор|станок|цех/.test(text) ? 'production' : /маркетолог|маркетинг/.test(text) ? 'marketing' : 'general';
  const choices = {
    logistics: {
      result:['Самостоятельно выполнять маршрут и доставку по стандартам','Безопасно работать с заказами, транспортом и клиентами','Пройти допуск и выполнять смену без сопровождения'],
      audience:['Курьеры и водители региональных центров','Курьеры, водители и диспетчеры','Вся логистическая сеть: склад, доставка и диспетчерская']
      ,scope:['Все регионы логистической сети','Москва и Московская область','Выбранные логистические центры и дочерние подразделения']
    },
    retail: {
      result:['Самостоятельно обслуживать покупателей по стандартам','Освоить кассу, выкладку и работу с обращениями','Пройти допуск к самостоятельной смене'],
      audience:['Продавцы и кассиры новых торговых точек','Все новые сотрудники розничной сети','Продавцы, администраторы и руководители смен']
      ,scope:['Все регионы розничной сети','Магазины Москвы и Московской области','Выбранные регионы и торговые точки']
    },
    production: {
      result:['Получить допуск к самостоятельной работе на оборудовании','Безопасно выполнять производственные операции','Подтвердить знание стандартов качества и охраны труда'],
      audience:['Операторы производственных линий','Рабочие и мастера выбранных цехов','Все новые сотрудники производственной площадки']
      ,scope:['Все производственные площадки','Выбранные цеха и дочерние подразделения','Площадки Москвы и Московской области']
    },
    marketing: {
      result:['Самостоятельно планировать и запускать маркетинговые кампании','Работать с бренд-стандартами, аналитикой и каналами продвижения','Подготовить и защитить план первой маркетинговой кампании'],
      audience:['Маркетологи отдела маркетинга','Маркетологи и специалисты по коммуникациям','Новые сотрудники маркетинговых команд'],
      scope:['Отделы маркетинга в выбранных городах','Москва, Казань и Сочи','Все региональные маркетинговые команды']
    },
    general: {
      result:['Самостоятельно выполнять ключевые задачи роли','Пройти обязательное обучение и подтвердить готовность','Начать работу по стандартам без постоянной поддержки'],
      audience:['Все сотрудники выбранных подразделений','Сотрудники указанных должностей','Новые сотрудники и внутренние переводы']
      ,scope:['Вся организационная структура','Выбранные регионы и подразделения','Москва и дочерние подразделения']
    }
  };

  result.updates = updates;
  if (turn >= 4 || !missing) {
    if (!updates.audience) updates.audience = 'Сотрудники выбранных подразделений и должностей';
    if (!updates.result) updates.result = choices[domain].result[0];
    result.ready = true;
    result.question = '';
    result.hint = '';
    result.suggestions = [];
    result.message = result.message || 'Параметры запуска собраны. Я заполнил форму и подготовил следующий шаг.';
    return result;
  }
  result.ready = false;
  result.question = missing === 'result' ? 'Какой рабочий результат сотрудник должен показать в конце процесса?' : missing === 'scope' ? 'В каких регионах и подразделениях действует этот процесс?' : 'Какие сотрудники должны проходить этот процесс?';
  result.hint = missing === 'result' ? 'Выберите наблюдаемый результат — по нему будут построены этапы, цели и контрольные точки.' : missing === 'scope' ? 'Уточните территорию и часть оргструктуры, чтобы охват не оказался слишком широким.' : 'Укажите роли или части структуры — по ним будут созданы ветки процесса.';
  result.suggestions = choices[domain][missing];
  return result;
}

function participantsResult(result, input) {
  const directory = Array.isArray(input.catalog?.businessRoles) ? input.catalog.businessRoles : [];
  if (!directory.length) return result;
  const dominantDomain = directory.find(role=>role.domain)?.domain;
  const scopedDirectory = dominantDomain ? directory.filter(role=>role.domain === dominantDomain) : directory;
  const currentRoles = input.context?.currentRoles || [];
  const administrative = scopedDirectory.filter(role => role.assignmentType === 'administrative');
  const functional = scopedDirectory.filter(role => role.assignmentType !== 'administrative');
  if (!currentRoles.length) {
    const source = functional.length ? functional : directory;
    result.question = result.question || 'Кто будет сопровождать сотрудника в этом процессе?';
    result.hint = 'Предлагаю бизнес-роли из справочника с учётом должности, подразделения и отрасли.';
    result.suggestions = [source.slice(0,3),source.slice(1,4),source.slice(3,6)].filter(group=>group.length).map(group=>group.map(role=>role.name).join(', '));
  } else {
    const source = administrative.length ? administrative : directory;
    result.question = result.question || 'Кто отвечает за процесс целиком и получает сигналы риска?';
    result.hint = 'Координатор определяется по оргструктуре или назначается администратором.';
    result.suggestions = source.slice(0,4).map(role=>role.name);
  }
  if (!Array.isArray(result.roles) || !result.roles.length) result.roles = scopedDirectory.slice(0,4).map(role=>({name:role.name,assignmentType:role.assignmentType,purpose:role.purpose,assignmentRule:role.assignmentRule||role.assignmentSource}));
  return result;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ok:true,model:env.OPENAI_MODEL || 'gpt-4.1-mini'},200,origin);
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

    const contract = `Ответь только валидным JSON без markdown. Общий формат: {"message":"краткое подтверждение или результат","question":"следующий вопрос или пустая строка","hint":"зачем нужен вопрос","suggestions":["2-4 контекстных варианта"],"ready":false,"updates":{},"roles":[],"process":null,"proposals":[]}. updates может содержать scenario,result,event,timing,audience,pathType,coordinator. roles: [{name,assignmentType,purpose,assignmentRule}]. process: {title,stages:[{id,name,days}],branches:[{id,name,condition}],items:[{id,title,type,branchId,stageId,assignee,sourceId,outcomes:[{if,then}]}],goals:[{title,result,day,branchId,linkedItemIds}],checkpoints:[{title,day,branchId,result,agenda,pulse,participants,onFail}],notifications:[{event,recipient,message}]}. Для task=goals proposals: [{title,type:"goal",branchId,result,day,linkedItemIds,reason}]. Для task=checkpoints proposals: [{title,type:"checkpoint",branchId,day,result,agenda,pulse,participants,onFail,reason}]. pulse — строка из 2-4 вопросов, разделённых точкой с запятой. Не выдумывай sourceId: бери его только из каталога.`;
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
        model:env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions:`${TASK_INSTRUCTIONS[task]}\n\n${DIALOG_POLICY}\n\n${contract}`,
        input:`Return valid json for this request:\n${JSON.stringify(input)}`,
        text:{format:{type:'json_object'}},
        max_output_tokens:task === 'process' ? 5000 : task === 'elements' ? 2400 : 1400
      })
    });
    const upstream = await response.json();
    if (!response.ok) return json({error:'OpenAI request failed',details:upstream.error?.message || 'Unknown error'},502,origin);
    try {
      const result = JSON.parse(outputText(upstream));
      return json(task === 'launch' ? launchResult(result,input) : task === 'participants' ? participantsResult(result,input) : result,200,origin);
    }
    catch { return json({error:'AI returned invalid JSON'},502,origin); }
  }
};
