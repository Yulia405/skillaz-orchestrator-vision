(function () {
  const domains = {
    logistics: ['Логистика', ['кладовщик','комплектовщик','курьер','водитель','диспетчер','оператор склада']],
    retail: ['Розница', ['продавец','кассир','администратор магазина','мерчандайзер']],
    production: ['Производство', ['оператор линии','технолог','мастер смены','контролёр ОТК']],
    office: ['Офис', ['специалист','аналитик','менеджер проекта','аккаунт-менеджер']],
    management: ['Управление', ['руководитель группы','руководитель отдела','директор направления']]
  };

  const elementBlueprints = [
    ['course','Вводный курс по роли','Знакомство','first-week'],
    ['article','Стандарты и регламенты роли','База знаний','first-week'],
    ['file','Рабочая инструкция и чеклист роли','Файл','first-week'],
    ['task','Подготовить рабочее место и доступы','Задача','before-start'],
    ['task','Пройти первую операцию с наставником','Практика','first-week'],
    ['task','Выполнить рабочий кейс самостоятельно','Практика','practice'],
    ['test','Проверка обязательных знаний','Тест','knowledge-check'],
    ['test','Проверка готовности к самостоятельной работе','Тест','final-check'],
    ['meeting','Встреча с руководителем по итогам недели','Встреча','first-week'],
    ['meeting','Разбор практики с наставником','Встреча','practice'],
    ['survey','Пульс адаптации сотрудника','Опрос','pulse'],
    ['checkpoint','Допуск к самостоятельной работе','Контрольная точка','final-check'],
    ['action','Уведомить ответственных о риске','Системное действие','exception']
  ];

  let serial = 1000;
  const elements = Object.entries(domains).flatMap(([domain, [domainName, audiences]]) =>
    elementBlueprints.map(([type, title, kind, stage], index) => ({
      id: `prod-${++serial}`,
      type,
      title: `${title}${index < 7 ? `: ${domainName.toLowerCase()}` : ''}`,
      description: `${kind} для процессов «Новый сотрудник» и «Вход в новую роль»`,
      domain,
      domainName,
      audiences,
      stage,
      source: index % 3 === 0 ? 'Каталог клиента' : index % 3 === 1 ? 'База знаний Skillaz' : 'Шаблон процесса',
      duration: type === 'course' ? 45 : type === 'test' ? 20 : type === 'meeting' ? 30 : 15,
      tags: [domainName.toLowerCase(), stage, type, ...audiences.slice(0, 2)]
    }))
  );

  const universalElements = [
    ['course','Охрана труда и безопасность','Обязательное обучение'],
    ['course','Информационная безопасность','Обязательное обучение'],
    ['course','Защита персональных данных','Обязательное обучение'],
    ['article','Добро пожаловать в компанию','Корпоративная база знаний'],
    ['article','Карта команды и полезные контакты','Корпоративная база знаний'],
    ['article','Льготы, сервисы и правила компании','Корпоративная база знаний'],
    ['file','Чеклист первого рабочего дня','Корпоративный файл'],
    ['file','Памятка по стандартам роли','Корпоративный файл'],
    ['file','Контакты поддержки и эскалаций','Корпоративный файл'],
    ['task','Заполнить персональные данные и документы','Задача сотруднику'],
    ['task','Создать учётные записи и доступы','Задача IT'],
    ['task','Назначить наставника','Задача руководителю'],
    ['task','Провести знакомство с командой','Задача руководителю'],
    ['test','Итоговая проверка знаний','Тест'],
    ['survey','Пульс первого дня','Опрос'],
    ['survey','Пульс первой недели','Опрос'],
    ['survey','Пульс 30 дней','Опрос'],
    ['meeting','Встреча первого дня','Встреча'],
    ['meeting','Итоги испытательного срока','Встреча'],
    ['goal','Цель на период адаптации','Цель'],
    ['goal','Цель применения навыка','Цель'],
    ['checkpoint','Готовность к первому дню','Контрольная точка'],
    ['checkpoint','Итоги 30 дней','Контрольная точка'],
    ['checkpoint','Завершение испытательного срока','Контрольная точка'],
    ['action','Отправить напоминание сотруднику','Системное действие'],
    ['action','Эскалировать просрочку руководителю','Системное действие'],
    ['action','Назначить дополнительное обучение','Системное действие']
  ].map(([type,title,description], index) => ({
    id:`prod-${++serial}`, type, title, description, domain:'universal', domainName:'Все процессы',
    audiences:['все сотрудники'], stage:index < 10 ? 'start' : index < 17 ? 'practice' : 'final-check',
    source:index % 2 ? 'Каталог клиента' : 'Шаблон Skillaz', duration:15,
    tags:['универсальный',type,'адаптация','новая роль']
  }));

  const goalBlueprints = {
    logistics:[['Самостоятельно выполнять маршрут без критических отклонений','Не менее 95% доставок в срок и корректные статусы в системе'],['Освоить операции WMS','Все обязательные операции выполняются без помощи наставника'],['Соблюдать стандарты безопасной доставки','Нет нарушений чеклиста безопасности в течение 10 смен'],['Качественно взаимодействовать с получателями','Оценка сервиса не ниже установленного стандарта']],
    retail:[['Самостоятельно работать на кассе','Смена закрыта без критических ошибок и расхождений'],['Обслуживать покупателей по стандартам','Соблюдены этапы сервиса и корректно обработаны обращения'],['Поддерживать стандарты выкладки','Зона ответственности соответствует планограмме и ценники актуальны'],['Пройти допуск к самостоятельной смене','Руководитель подтвердил готовность по чеклисту']],
    production:[['Безопасно выполнять производственную операцию','Операция выполнена по технологической карте без нарушений ОТ'],['Подтвердить качество выпуска','Результат соответствует нормам ОТК в трёх последовательных циклах'],['Освоить оборудование участка','Сотрудник самостоятельно выполняет запуск, остановку и переналадку'],['Выполнять сменное задание','Достигнут норматив без роста брака и простоев']],
    office:[['Самостоятельно выполнить рабочий кейс','Результат принят внутренним заказчиком без критических доработок'],['Освоить регламенты и инструменты роли','Все обязательные операции выполняются в рабочих системах'],['Выстроить взаимодействие со смежными командами','Согласованы зоны ответственности и рабочий ритм'],['Подготовить план первых 90 дней','План согласован руководителем и содержит измеримые результаты']],
    management:[['Настроить управленческий ритм команды','Регулярные встречи и контроль задач проходят по согласованному расписанию'],['Сформировать цели команды','Цели связаны с метриками подразделения и назначены владельцы'],['Провести первые встречи один на один','Собраны ожидания и планы развития прямых подчинённых'],['Принять самостоятельное управленческое решение','Решение основано на данных и согласовано с заинтересованными сторонами']]
  };
  const goalElements = Object.entries(goalBlueprints).flatMap(([domain,rows])=>rows.map(([title,description],index)=>({
    id:`prod-${++serial}`,type:'goal',title,description,domain,domainName:domains[domain][0],audiences:domains[domain][1],stage:index<2?'practice':'final-check',source:index%2?'Каталог клиента':'Шаблон Skillaz',duration:0,tags:[domain,'цель',...domains[domain][1]]
  })));
  const checkpointBlueprints = {
    logistics:['Разбор первых маршрутов','Контроль самостоятельной работы в WMS','Допуск к самостоятельной доставке'],
    retail:['Проверка первой смены','Разбор кассы, сервиса и выкладки','Допуск к самостоятельной смене'],
    production:['Проверка безопасного старта','Разбор практики на оборудовании','Допуск к самостоятельной операции'],
    office:['Проверка первых результатов','Разбор рабочего кейса','Итоги первых 90 дней'],
    management:['Проверка управленческого старта','Разбор целей и ритма команды','Итоги первых управленческих решений']
  };
  const checkpointElements = Object.entries(checkpointBlueprints).flatMap(([domain,rows])=>rows.map((title,index)=>({
    id:`prod-${++serial}`,type:'checkpoint',title,description:`${['Проверить старт, доступы и первые действия','Обсудить практику, сложности и поддержку','Подтвердить готовность и согласовать дальнейший план'][index]}. Пульс: уверенность в задачах роли, препятствия и необходимая поддержка.`,domain,domainName:domains[domain][0],audiences:domains[domain][1],stage:['first-week','practice','final-check'][index],source:'Каталог КТ Skillaz',duration:30,tags:[domain,'контрольная точка','повестка','пульс',...domains[domain][1]]
  })));

  const roleBlueprints = [
    ['Наставник','functional','Обучает на рабочем месте и подтверждает практику'],
    ['Эксперт по процессу','functional','Проверяет профессиональные знания и рабочие кейсы'],
    ['Проверяющий','functional','Заполняет лист оценки и принимает контрольную точку'],
    ['HR бизнес-партнёр','administrative','Сопровождает процесс и получает сигналы риска'],
    ['Специалист по адаптации','administrative','Координирует сроки, участников и коммуникации'],
    ['Специалист по обучению','administrative','Назначает программы и контролирует результаты обучения'],
    ['IT специалист','functional','Выдаёт доступы и устраняет технические блокеры'],
    ['Специалист по охране труда','functional','Проводит обязательный инструктаж и допуск'],
    ['Кадровый администратор','administrative','Проверяет документы и кадровые события'],
    ['Руководитель подразделения','administrative','Отвечает за результат сотрудника и принимает решения']
  ];

  let roleSerial = 200;
  const businessRoles = Object.entries(domains).flatMap(([domain,[domainName,audiences]]) =>
    roleBlueprints.map(([name,assignmentType,purpose], index) => ({
      id:`role-${++roleSerial}`,
      name:index < 3 ? `${name} · ${domainName.toLowerCase()}` : name,
      assignmentType,
      purpose,
      domain,
      domainName,
      audiences,
      assignmentSource: assignmentType === 'administrative' ? 'По оргструктуре или назначающий администратор' : 'Справочник бизнес ролей',
      fallback:'Ручной выбор администратора',
      tags:[domainName.toLowerCase(),assignmentType,...audiences.slice(0,2)]
    }))
  );

  const normalize = value => String(value || '').toLowerCase().replace(/ё/g,'е');
  const score = (row, query) => {
    const words = normalize(query).split(/[^а-яa-z0-9]+/).filter(word => word.length > 2);
    const haystack = normalize([row.title,row.name,row.description,row.purpose,row.domainName,...(row.audiences||[]),...(row.tags||[])].join(' '));
    return words.reduce((sum, word) => sum + (haystack.includes(word) ? 2 : 0), row.domain === 'universal' ? 1 : 0);
  };
  const relevant = (rows, query, limit) => rows.map(row => ({row,score:score(row,query)})).sort((a,b)=>b.score-a.score).slice(0,limit).map(item=>item.row);

  const enterpriseRoles = window.SkillazReferenceData?.businessRoles || [];
  window.SkillazProductionCatalog = {
    elements:[...universalElements,...goalElements,...checkpointElements,...elements],
    businessRoles:[...enterpriseRoles,...businessRoles],
    relevantElements(query, limit=28){ return relevant(this.elements, query, limit); },
    relevantRoles(query, limit=24){
      const contextual = window.SkillazReferenceData?.relevantBusinessRoles(query,limit) || [];
      const fallback = relevant(this.businessRoles, query, limit);
      return [...contextual,...fallback.filter(role=>!contextual.some(item=>item.id===role.id))].slice(0,limit);
    },
    stats:{ elements:universalElements.length + goalElements.length + checkpointElements.length + elements.length, roles:businessRoles.length + enterpriseRoles.length }
  };
})();
