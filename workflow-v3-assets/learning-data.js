// Bundled, fictional retail training programmes. No customer data or external assignments.
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const roles = [
    {id:'cashier',name:'Кассиры',position:'Кассир',expert:'Эксперт кассовых операций',topics:['Касса: открытие смены, оплата и чек','Возвраты, скидки и программа лояльности'],practice:'Провести покупку, возврат и закрытие смены',criteria:['Проверяет кассу и открывает смену','Проводит оплату и выдаёт корректный чек','Оформляет возврат с проверкой документов','Сверяет выручку и закрывает смену'],product:'Новая программа лояльности: начисление, списание и возврат',case:'Рассчитать скидку и оформить возврат покупки с бонусами'},
    {id:'sales',name:'Продавцы-консультанты',position:'Продавец-консультант',expert:'Эксперт клиентского сервиса',topics:['Выявление потребности и подбор товара','Возражения, дополнительные продажи и обращения'],practice:'Провести консультацию покупателя от запроса до решения',criteria:['Выясняет задачу и ограничения покупателя','Сравнивает товары по потребности без неподтверждённых обещаний','Отрабатывает возражение и предлагает подходящее решение','Проверяет понимание условий покупки и возврата'],product:'Новая линейка товаров: свойства, отличия и ограничения',case:'Подобрать три товара новой линейки для разных запросов'},
    {id:'stock',name:'Сотрудники выкладки',position:'Сотрудник выкладки',expert:'Эксперт торгового зала',topics:['Приёмка, хранение и ротация товара','Планограмма, ценники и контроль доступности'],practice:'Принять партию и подготовить полку к открытию магазина',criteria:['Сверяет товар, количество и состояние упаковки','Размещает товар по планограмме с соблюдением ротации','Проверяет соответствие ценников и маркировки','Устраняет опасные условия и фиксирует расхождения'],product:'Новая линейка на полке: планограмма, маркировка и промозона',case:'Подготовить промополку новой линейки по новой планограмме'}
  ];
  const configurations = [
    {id:'retail-learning-new',mode:'new',name:'Ритейл · обучение новых сотрудников',short:'Программа обучения',event:'Создан новый сотрудник',timing:'В дату выхода на работу',days:21,description:'От обязательных знаний до самостоятельной работы в магазине.',stages:['Старт и обязательные знания','Знания по должности','Проверка знаний','Практика в магазине','Дообучение и повторная практика','Допуск к работе']},
    {id:'retail-learning-cycle',mode:'cycle',name:'Ритейл · регулярная проверка и дообучение',short:'Цикличное обучение',event:'Наступил срок проверки в роли',timing:'Каждые 6 месяцев для кассиров; каждые 12 месяцев для продавцов и выкладки',days:14,description:'Диагностика определяет объём дообучения; подтверждённые знания не изучаются заново.',stages:['Диагностика обязательных знаний','Диагностика по должности','Индивидуальное дообучение','Проверка навыков в магазине','Коррекция и повторная проверка','Подтверждение квалификации']},
    {id:'retail-learning-update',mode:'update',name:'Ритейл · обучение новому продукту и стандартам',short:'Изменения продукта',event:'Опубликована новая версия учебного пакета',timing:'После публикации пакета «Новая линейка и лояльность», версия 2.0',days:10,description:'Обновлённый продукт, правила лояльности и выкладка: знания, практика и проверка применения.',stages:['Что изменилось','Знания по новой версии','Проверка понимания изменений','Применение на рабочем месте','Разбор ошибок и дообучение','Готовность к запуску']}
  ];
  function makeSheet(id, role, title) {
    return {id,type:'assessment',title,description:'Полевая оценка: наблюдение эксперта и комментарий по каждому критерию.',domain:'retail',source:'Ритейл · оценочные листы',version:2,status:'published',competency:role.practice,threshold:85,resultMode:'score',evaluator:role.expert,deadlineDays:2,launch:'После связанных действий',required:true,positions:[role.position],tags:['розница',role.position],blocks:[{title:'Наблюдение на рабочем месте',criteria:role.criteria.map((title,i)=>({id:id+'-c'+i,title,critical:i===2,commentRequired:true}))}]};
  }
  function build(config) {
    const d={...clone(config),version:2,protected:true,territory:'Все регионы присутствия розничной сети',structure:'Розничная сеть → регион → магазин',items:{},routes:{},stages:config.stages.map((name,i)=>({id:'s'+(i+1),name,days:['1 день','до 3 дня','до 5 дня','до 7 дня','по результатам проверки','до '+config.days+' дня'][i],count:0})),branches:[{id:'base',name:'Обязательные знания для всех',meta:['Все магазины'],desc:'Общая часть учебной программы',conditions:['Все сотрудники выбранного охвата']},...roles.map((r,i)=>({id:r.id,name:r.name,meta:[r.position],desc:'Куратор группы + '+r.expert,conditions:['Должность: '+r.position],priority:i+1}))],participants:[{name:'Куратор учебной группы',scope:'Учебная группа сотрудника',assignmentRule:'Закреплённый куратор из карточки группы',purpose:'Сроки, помощь, просрочки и организация повторного обучения'},...roles.map(r=>({name:r.expert,scope:r.name,assignmentRule:'Эксперт по бизнес-роли в магазине сотрудника',purpose:'Проверка заданий, наблюдение в смене и заполнение оценочных листов'}))],recurrence:{cashier:6,sales:12,stock:12},packageVersion:'2.0'};
    const add=(branch,stage,slug,type,title,description,after=[],extra={})=>{
      const cell=branch+'-s'+stage,id=config.id+'-'+branch+'-'+slug,key=cell+'::'+id;
      const role=roles.find(r=>r.id===branch);
      const node={id,type,title,description,meta:type==='test'?'12 вопросов · порог 80%':type==='course'?'20 минут · интерактивный курс':type==='task'?(role?.expert||'Куратор учебной группы')+' · проверка задания':type==='survey'?'3 вопроса · обратная связь':type==='assessment'?(role?.expert||'Эксперт')+' · порог 85%':'5 минут · материал программы',sourceId:id,learning:{after,conditional:false,threshold:type==='test'?80:null,...extra}};
      if(type==='assessment'){
        const updatedCriteria={cashier:['Определяет условия начисления бонусов по новой программе','Правильно применяет частичную оплату бонусами','Оформляет возврат с пересчётом бонусного баланса','Объясняет покупателю ограничения новой программы'],sales:['Уточняет потребность покупателя перед подбором новой линейки','Объясняет отличия новых моделей на конкретных примерах','Корректно сообщает ограничения и условия использования','Подбирает продукт и проверяет понимание покупателем'],stock:['Сверяет артикулы и маркировку новой линейки','Размещает товары по обновлённой планограмме','Проверяет актуальность промоценников и обязательной маркировки','Фиксирует готовность промозоны и сообщает о расхождениях']};
        node.evaluation=makeSheet(id,config.mode==='update'?{...role,practice:role.case,criteria:updatedCriteria[role.id]}:role,title);
      }
      if(extra.terminal)node.meta='Куратор учебной группы · подтверждение допуска';
      (d.items[cell]||=[]).push(node);
      d.routes[key]=[{when:'overdue',action:'notify',recipient:'Куратор учебной группы'}];
      return key;
    };
    const node=key=>d.items[key.split('::')[0]].find(n=>n.id===key.split('::')[1]);
    const rule=(from,when,action,target,other={})=>d.routes[from].push({when,action,target,...other});
    const link=(from,to,when='passed')=>rule(from,when,'assign',to);
    const sequence=(from,to)=>{node(to).learning.after=[from];link(from,to);};
    const remediate=(test,branch,stage,slug,topic)=>{
      const course=add(branch,stage,slug,'course','Разбор ошибок: '+topic,'Короткий модуль с разобранными примерами и тренировкой.',[],{conditional:true});
      link(test,course,'failed');link(course,test);rule(test,'failed','notify',null,{recipient:roles.find(r=>r.id===branch)?.expert||'Куратор учебной группы'});
      return course;
    };
    const intro=add('base',1,'intro','article',config.mode==='update'?'Что изменилось: продукт, правила и сроки запуска':config.mode==='cycle'?'Правила регулярной проверки и критерии допуска':'Как устроено обучение в магазине','Порядок прохождения, контакты куратора и критерии успешного завершения.',[],{entry:true});
    const commonCourse=add('base',1,'common-course','course',config.mode==='update'?'Новый продукт и лояльность: обзор изменений':'Безопасность, персональные данные и сервис в магазине','Разберите обязательные правила на ситуациях из торгового зала.',config.mode==='cycle'?[]:[intro],{conditional:config.mode==='cycle'});
    const commonTest=add('base',1,'common-test','test',config.mode==='update'?'Проверка изменений продукта и правил':'Проверка обязательных стандартов магазина','12 вопросов, проходной балл 80%.',config.mode==='cycle'?[intro]:[commonCourse]);
    link(intro,config.mode==='cycle'?commonTest:commonCourse);if(config.mode!=='cycle')link(commonCourse,commonTest);else link(commonCourse,commonTest);
    if(config.mode==='cycle')link(commonTest,commonCourse,'failed');else remediate(commonTest,'base',1,'common-remedy','обязательные стандарты магазина');
    const pulse=add('base',3,'feedback','survey','Насколько понятна программа обучения','Понятность материалов (1–5); что осталось неясным; какая помощь нужна.',[commonTest]);link(commonTest,pulse);
    const guide=add('base',4,'practice-guide','file','Памятка: как проходит полевая проверка','Эксперт наблюдает реальную операцию. Критичная ошибка блокирует допуск.',[commonTest]);link(commonTest,guide);
    roles.forEach(role=>{
      let knowledge;
      const topics=config.mode==='update'?[role.product,'Нестандартные ситуации при запуске: '+role.position.toLowerCase()]:role.topics;
      const article=add(role.id,1,'role-guide','article','Карта навыков: '+role.position,'Задачи должности, примеры ошибок и критерии эксперта.',[intro]);link(intro,article);
      if(config.mode==='cycle'){
        const initialCase=add(role.id,2,'initial-case','task','Входной кейс: '+role.case,'Эксперт проверяет решение до начала диагностического тестирования.',[article]);link(article,initialCase);
        const diagnostic=add(role.id,2,'diagnostic','test','Диагностика: '+topics.join('; '),'Комплексная проверка по двум темам. При результате ниже 80% назначаются оба модуля.',[initialCase]);link(initialCase,diagnostic);
        const courses=topics.map((topic,i)=>add(role.id,3,'refresh-'+i,'course','Актуализация: '+topic,'Подборка кейсов по выявленным пробелам; затем повторная диагностика.',[],{conditional:true}));
        courses.forEach(course=>link(diagnostic,course,'failed'));
        const task=add(role.id,3,'diagnostic-case','task','Решить рабочий кейс: '+role.case,'Загрузить решение. Эксперт проверяет корректность и комментирует ошибки.',courses,{conditional:true});
        courses.forEach(course=>link(course,task));link(task,diagnostic);
        knowledge=diagnostic;
      } else {
        let previous=article;
        topics.forEach((topic,i)=>{
          const course=add(role.id,2,'course-'+i,'course',topic,'Видеопример, разбор типичных ошибок и тренировочные ситуации.',[previous]);link(previous,course);
          const test=add(role.id,3,'test-'+i,'test','Проверка: '+topic,'12 ситуационных вопросов. Не менее 80% верных ответов.',[course]);link(course,test);
          remediate(test,role.id,3,'knowledge-remedy-'+i,topic);
          previous=test;
        });knowledge=previous;
      }
      const practice=add(role.id,4,'practice','task',config.mode==='update'?role.case:role.practice,'Выполнить в смене и приложить подтверждение. Эксперт даёт обратную связь.',[knowledge,commonTest,guide]);link(knowledge,practice);link(commonTest,practice);link(guide,practice);
      const sheet=add(role.id,4,'field','assessment','Полевая оценка: '+role.position,'Минимум 85%, без критичных ошибок. Эксперт заполняет критерии при наблюдении.',[practice]);link(practice,sheet);
      const extra=add(role.id,5,'extra-course','course','Дополнительная отработка: '+topics[0],'Назначается только при неуспешной практике или полевой оценке.',[],{conditional:true});
      const extraTask=add(role.id,5,'extra-task','task','Повторная практика с экспертом: '+role.position,'Разобрать ошибки, выполнить операцию повторно и получить обратную связь.',[extra],{conditional:true});
      link(practice,extra,'failed');link(sheet,extra,'failed');link(extra,extraTask);link(extraTask,practice);
      rule(sheet,'failed','notify',null,{recipient:role.expert});
      const survey=add(role.id,6,'survey','survey','Обратная связь по обучению: '+role.position,'Полезность (1–5); уверенность в работе (1–5); что улучшить.',[sheet]);link(sheet,survey);
      const finish=add(role.id,6,'admission','task',config.mode==='cycle'?'Подтвердить квалификацию: '+role.position:config.mode==='update'?'Подтвердить готовность к новому продукту: '+role.position:'Допустить к самостоятельной работе: '+role.position,'Куратор фиксирует завершение после успешной полевой оценки и обратной связи.',[sheet,survey],{terminal:true});link(survey,finish);
      rule(finish,'passed','notify',null,{recipient:'Куратор учебной группы'});
      // Courses and practical tasks can be attempted twice more, then require a human decision.
    });
    Object.entries(d.items).forEach(([cell,nodes])=>nodes.forEach(n=>{
      const k=cell+'::'+n.id;
      if(!d.routes[k].some(r=>r.when==='failed'))rule(k,'failed','repeat',null,{limit:2});
      if(!d.routes[k].some(r=>r.when==='passed'))rule(k,'passed','continue');
    }));
    d.stages.forEach(s=>s.count=Object.entries(d.items).filter(([cell])=>cell.endsWith('-'+s.id)).reduce((sum,[,nodes])=>sum+nodes.length,0));
    return d;
  }
  const seeds=configurations.map(build);
  const nodes=d=>Object.entries(d.items).flatMap(([cell,list])=>list.map(item=>({...item,cell,key:cell+'::'+item.id})));
  function reconcile(d){
    const placements=new Map();
    nodes(d).forEach(n=>placements.set(n.id,placements.has(n.id)?null:n.key));
    const remap=key=>placements.get(String(key).split('::')[1])||key;
    d.routes=Object.fromEntries(Object.entries(d.routes||{}).map(([key,rules])=>[remap(key),rules.map(r=>({...r,...(r.action==='assign'?{target:remap(r.target)}:{})}))]));
    Object.values(d.items).flat().forEach(n=>{if(n.learning?.after)n.learning.after=n.learning.after.map(remap);});
    return d;
  }
  function start(d,branch){
    if(!d.branches.some(b=>b.id===branch&&b.id!=='base'))throw new Error('Выберите должностную ветку');
    const session={branch,status:{},attempts:{},requested:[],log:[],paused:false,complete:false};
    nodes(d).filter(n=>n.learning?.entry&&(n.cell.startsWith('base-')||n.cell.startsWith(branch+'-'))).forEach(n=>session.status[n.key]='ready');
    return session;
  }
  function advance(d,s,key,result){
    const all=nodes(d),index=Object.fromEntries(all.map(n=>[n.key,n])),n=index[key];
    if(s.paused||s.complete||s.status[key]!=='ready'||!n)throw new Error('Элемент пока недоступен');
    let outcome=typeof result==='string'?result:result.critical?'failed':Number(result.score)>=(n.evaluation?.threshold||n.learning?.threshold||80)?'passed':'failed';
    if(!['passed','failed','overdue'].includes(outcome))throw new Error('Неизвестный результат');
    if(outcome!=='overdue'){s.status[key]=outcome;s.attempts[key]=(s.attempts[key]||0)+1;}
    s.log.push({title:n.title,outcome});
    const applicable=(d.routes[key]||[]).filter(r=>r.when===outcome);
    const inBranch=t=>t&&(t.cell.startsWith('base-')||t.cell.startsWith(s.branch+'-'));
    const request=target=>{
      if(!inBranch(index[target]))return;
      s.status[target]='waiting';if(!s.requested.includes(target))s.requested.push(target);
    };
    if(outcome==='failed'&&s.attempts[key]>=3){s.paused=true;s.log.push({title:'Попытки исчерпаны. Решение руководителя и куратора',outcome:'escalate'});return s;}
    for(const r of applicable){
      if(r.action==='assign')request(r.target);
      if(r.action==='repeat'){
        if(s.attempts[key]>(r.limit||2)){s.paused=true;s.log.push({title:'Лимит повторов: эскалация руководителю',outcome:'escalate'});}else request(key);
      }
      if(['notify','escalate'].includes(r.action))s.log.push({title:(r.action==='notify'?'Уведомление: ':'Эскалация: ')+r.recipient,outcome:r.action});
      if(r.action==='pause')s.paused=true;
    }
    // Multiple incoming routes request a node, while all prerequisites form an AND barrier.
    s.requested=s.requested.filter(target=>{
      const next=index[target];
      if((next.learning?.after||[]).every(prerequisite=>s.status[prerequisite]==='passed')){s.status[target]='ready';return false;}return true;
    });
    s.complete=all.filter(n=>inBranch(n)&&n.learning?.terminal).every(n=>s.status[n.key]==='passed');
    return s;
  }
  root.SkillazLearningData={seeds,roles,clone,nodes,start,advance,makeSheet,reconcile};
  if(typeof module!=='undefined')module.exports=root.SkillazLearningData;
})(typeof window==='undefined'?globalThis:window);
