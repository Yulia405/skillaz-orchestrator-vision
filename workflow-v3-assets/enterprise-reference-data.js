// Rich demo reference data for contextual workflow generation.
// Organization structures are synthetic; geography follows the public Russian territorial classifiers.
(function () {
  const org = (id,name,type,children=[]) => ({id,name,type,children});
  const structures = {
    retail: org('retail','Розничная сеть','company',[
      org('retail-operations','Операционный департамент розничной сети','department',[
        org('retail-hyper','Гипермаркеты','format'),org('retail-super','Супермаркеты','format'),org('retail-convenience','Магазины у дома','format'),org('retail-dark','Дарксторы','format')]),
      org('retail-regions','Региональные управления','department',[
        org('retail-central','Центральный регион','region'),org('retail-northwest','Северо-Западный регион','region'),org('retail-volga','Поволжье','region'),org('retail-ural','Урал','region'),org('retail-siberia','Сибирь','region'),org('retail-south','Юг','region')]),
      org('retail-commercial','Коммерческий департамент','department',[
        org('retail-category','Категорийный менеджмент','division'),org('retail-pricing','Ценообразование','division'),org('retail-private-label','Собственные торговые марки','division'),org('retail-promo','Промо и трейд-маркетинг','division')]),
      org('retail-ecom','E-commerce','department',[
        org('retail-online','Интернет-магазин','division'),org('retail-fulfillment','Фулфилмент','division'),org('retail-lastmile','Последняя миля','division'),org('retail-support','Клиентская поддержка','division')]),
      org('retail-office','Офисные и поддерживающие функции','department',[
        org('retail-hr','HR и управление талантами','division'),org('retail-ld','Обучение и развитие','division'),org('retail-it','IT и цифровые продукты','division'),org('retail-finance','Финансы','division'),org('retail-legal','Юридический отдел','division'),org('retail-security','Безопасность','division'),org('retail-procurement','Закупки','division')])
    ]),
    logistics: org('logistics','Логистическая сеть','company',[
      org('log-hubs','Сортировочные и распределительные центры','department',[
        org('log-sort','Сортировочные центры','site'),org('log-distribution','Распределительные центры','site'),org('log-crossdock','Кросс-докинговые терминалы','site'),org('log-fulfillment','Фулфилмент-центры','site')]),
      org('log-warehouse','Складская логистика','department',[
        org('log-receiving','Приёмка','division'),org('log-storage','Хранение','division'),org('log-picking','Комплектация','division'),org('log-packing','Упаковка','division'),org('log-shipping','Отгрузка','division'),org('log-inventory','Инвентаризация','division')]),
      org('log-transport','Транспортная логистика','department',[
        org('log-linehaul','Магистральные перевозки','division'),org('log-lastmile','Последняя миля','division'),org('log-fleet','Автопарк','division'),org('log-dispatch','Диспетчерская','division'),org('log-route','Маршрутизация','division')]),
      org('log-pvz','Пункты выдачи и клиентские офисы','department',[
        org('log-own-pvz','Собственные ПВЗ','format'),org('log-partner-pvz','Партнёрские ПВЗ','format'),org('log-client-care','Клиентский сервис','division')]),
      org('log-office','Корпоративные и поддерживающие функции','department',[
        org('log-hr','HR и кадровое администрирование','division'),org('log-ld','Обучение и развитие','division'),org('log-it','IT, WMS и TMS','division'),org('log-finance','Финансы','division'),org('log-security','Безопасность и охрана труда','division'),org('log-quality','Качество процессов','division'),org('log-procurement','Закупки и снабжение','division')])
    ]),
    production: org('production','Производственный холдинг','company',[
      org('prod-plants','Производственные площадки и заводы','department',[
        org('prod-main','Основное производство','division'),org('prod-assembly','Сборочные линии','division'),org('prod-pack','Упаковка','division'),org('prod-shifts','Сменные участки','division')]),
      org('prod-engineering','Главный инженер','department',[
        org('prod-maintenance','Техническое обслуживание и ремонт','division'),org('prod-energy','Энергетическая служба','division'),org('prod-automation','АСУ ТП и автоматизация','division'),org('prod-metrology','Метрология','division')]),
      org('prod-quality','Качество и лаборатории','department',[
        org('prod-qc','ОТК','division'),org('prod-lab','Производственная лаборатория','division'),org('prod-cert','Сертификация','division'),org('prod-claims','Работа с несоответствиями','division')]),
      org('prod-supply','Снабжение и внутренняя логистика','department',[
        org('prod-raw','Склад сырья','division'),org('prod-finished','Склад готовой продукции','division'),org('prod-internal','Внутризаводская логистика','division'),org('prod-planning','Планирование производства','division')]),
      org('prod-office','Офисные и поддерживающие функции','department',[
        org('prod-hse','Охрана труда, промышленная и экологическая безопасность','division'),org('prod-hr','HR и кадровое администрирование','division'),org('prod-ld','Учебный центр','division'),org('prod-it','IT','division'),org('prod-finance','Экономика и финансы','division'),org('prod-legal','Юридический отдел','division'),org('prod-procurement','Закупки','division')])
    ]),
    office: org('office','Корпоративный центр','company',[
      org('office-hr','HR и управление талантами','department',[org('office-recruitment','Подбор','division'),org('office-ld','Обучение и развитие','division'),org('office-cnb','Компенсации и льготы','division'),org('office-hrbp','HR бизнес-партнёры','division')]),
      org('office-it','IT и цифровые продукты','department',[org('office-dev','Разработка','division'),org('office-data','Данные и аналитика','division'),org('office-infra','Инфраструктура','division'),org('office-support','Поддержка пользователей','division')]),
      org('office-finance','Финансы','department',[org('office-accounting','Бухгалтерия','division'),org('office-treasury','Казначейство','division'),org('office-fpna','Финансовое планирование','division')]),
      org('office-commercial','Продажи и клиентский сервис','department',[org('office-sales','Продажи','division'),org('office-key','Ключевые клиенты','division'),org('office-care','Клиентская поддержка','division')]),
      org('office-back','Корпоративные функции','department',[org('office-legal','Юридический отдел','division'),org('office-procurement','Закупки','division'),org('office-security','Безопасность','division'),org('office-marketing','Маркетинг и коммуникации','division'),org('office-pmo','Проектный офис','division')])
    ])
  };

  const positionSets = {
    retail:['Продавец-консультант','Продавец-кассир','Кассир','Старший кассир','Работник торгового зала','Сотрудник выкладки','Мерчандайзер','Комплектовщик интернет-заказов','Сборщик заказов','Администратор магазина','Заместитель директора магазина','Директор магазина','Региональный управляющий','Категорийный менеджер','Менеджер по ценообразованию','Специалист клиентского сервиса','Оператор контактного центра','Менеджер e-commerce'],
    logistics:['Кладовщик','Комплектовщик','Упаковщик','Сортировщик','Оператор склада','Оператор WMS','Контролёр склада','Водитель погрузчика','Курьер','Водитель-экспедитор','Водитель категории C/E','Диспетчер','Логист','Маршрутизатор','Специалист доставки','Оператор сортировочного центра','Начальник смены склада','Начальник ПВЗ','Менеджер ПВЗ','Руководитель распределительного центра'],
    production:['Оператор производственной линии','Оператор станка с ЧПУ','Аппаратчик','Сборщик','Упаковщик производства','Наладчик оборудования','Слесарь-ремонтник','Электромеханик','Энергетик','Мастер смены','Начальник участка','Технолог','Инженер-технолог','Инженер по качеству','Контролёр ОТК','Лаборант','Специалист по охране труда','Планировщик производства','Начальник производства'],
    office:['Рекрутер','HR бизнес-партнёр','Специалист по адаптации','Специалист по обучению','Методолог обучения','Бухгалтер','Финансовый аналитик','Юрист','Специалист по закупкам','Системный аналитик','Бизнес-аналитик','Разработчик','Тестировщик','Инженер поддержки','Менеджер проекта','Продуктовый менеджер','Менеджер по продажам','Аккаунт-менеджер','Специалист клиентской поддержки','Маркетолог','Специалист по внутренним коммуникациям','Руководитель отдела']
  };
  let positionSerial=0;
  const positions=Object.entries(positionSets).flatMap(([domain,titles])=>titles.map((title,index)=>({id:`pos-${++positionSerial}`,title,domain,level:/директор|начальник|руководитель|управляющий/.test(title.toLowerCase())?'manager':index%5===0?'senior':'specialist',tags:[domain,title.toLowerCase()]})));

  const groupSets = {
    retail:['Новые продавцы и кассиры','Сотрудники новых магазинов','Команды магазинов после переформатирования','Кадровый резерв директоров магазинов','Сотрудники с низким результатом тайного покупателя','Сотрудники на испытательном сроке','Сотрудники сезонного найма','Команды запуска новой торговой точки'],
    logistics:['Новые сотрудники складов','Новые курьеры и водители','Команды запуска распределительного центра','Сотрудники ПВЗ на испытательном сроке','Кадровый резерв начальников смен','Сотрудники без допуска по охране труда','Водители нового маршрута','Сотрудники после перехода на новую WMS'],
    production:['Новые рабочие производства','Сотрудники нового производственного участка','Работники без самостоятельного допуска','Кадровый резерв мастеров смен','Сотрудники после модернизации линии','Работники обязательного инструктажа','Команда запуска нового завода','Молодые специалисты производства'],
    office:['Новые сотрудники корпоративного центра','Новые руководители','Кадровый резерв руководителей','Участники программы HiPo','Внутренние переводы','Удалённые сотрудники','Участники школы наставников','Проектные команды трансформации']
  };
  let groupSerial=0;
  const groups=Object.entries(groupSets).flatMap(([domain,names])=>names.map(name=>({id:`grp-${++groupSerial}`,name,domain,rule:`Динамическая группа · ${name.toLowerCase()}`,tags:[domain,name.toLowerCase()]})));

  const roleSets = {
    retail:[['Наставник торговой точки','functional','Старший продавец или администратор той же торговой точки'],['Эксперт по кассовой дисциплине','functional','Проверяет кассовые операции и допуск'],['Тренер розничной сети','functional','Проводит продуктовые и сервисные тренировки'],['Директор магазина','administrative','Принимает итог адаптации'],['Региональный HRBP розницы','administrative','Координирует адаптацию в регионе'],['Специалист по товарным потерям','functional','Проверяет обязательные процедуры безопасности']],
    logistics:[['Наставник склада','functional','Обучает операциям WMS и безопасной работе'],['Наставник курьера','functional','Сопровождает первые маршруты'],['Эксперт по сортировке','functional','Подтверждает операции сортировочного центра'],['Диспетчер-наставник','functional','Проверяет маршрутизацию и связь'],['Руководитель логистического центра','administrative','Принимает итог адаптации'],['HRBP логистической сети','administrative','Координирует адаптацию по площадкам'],['Эксперт по транспортной безопасности','functional','Проводит допуск водителей']],
    production:[['Производственный наставник','functional','Обучает на рабочем месте'],['Мастер производственного обучения','functional','Ведёт практическую подготовку'],['Эксперт по оборудованию','functional','Подтверждает навык работы на оборудовании'],['Специалист по охране труда','functional','Проводит инструктаж и допуск'],['Контролёр качества-наставник','functional','Проверяет стандарты качества'],['Начальник смены','administrative','Принимает решение о самостоятельном допуске'],['HRBP производственной площадки','administrative','Координирует адаптацию на заводе']],
    office:[['Бадди','functional','Помогает освоиться в команде и рабочих практиках'],['Функциональный наставник','functional','Передаёт профессиональные практики роли'],['Эксперт по процессу','functional','Проверяет рабочий кейс'],['Владелец продукта','functional','Согласует результат для продуктовой роли'],['Руководитель подразделения','administrative','Отвечает за итог сотрудника'],['HR бизнес-партнёр','administrative','Координирует процесс и риски'],['Специалист по адаптации','administrative','Сопровождает сроки и коммуникации']]
  };
  let businessRoleSerial=0;
  const businessRoles=Object.entries(roleSets).flatMap(([domain,rows])=>rows.map(([name,assignmentType,purpose])=>({id:`biz-${++businessRoleSerial}`,name,domain,assignmentType,purpose,assignmentRule:assignmentType==='administrative'?'По оргструктуре сотрудника':'Из справочника бизнес-ролей в выбранном подразделении',tags:[domain,name.toLowerCase(),purpose.toLowerCase()]})));

  const geography = [
    ['77','Москва','ЦФО',['Москва','Зеленоград','Троицк']],['50','Московская область','ЦФО',['Балашиха','Химки','Подольск','Мытищи','Красногорск','Домодедово']],
    ['78','Санкт-Петербург','СЗФО',['Санкт-Петербург','Колпино','Пушкин']],['47','Ленинградская область','СЗФО',['Гатчина','Выборг','Всеволожск']],
    ['16','Республика Татарстан','ПФО',['Казань','Набережные Челны','Нижнекамск','Альметьевск']],['52','Нижегородская область','ПФО',['Нижний Новгород','Дзержинск','Арзамас']],
    ['63','Самарская область','ПФО',['Самара','Тольятти','Сызрань']],['02','Республика Башкортостан','ПФО',['Уфа','Стерлитамак','Салават']],
    ['59','Пермский край','ПФО',['Пермь','Березники','Соликамск']],['18','Удмуртская Республика','ПФО',['Ижевск','Воткинск','Сарапул']],
    ['66','Свердловская область','УрФО',['Екатеринбург','Нижний Тагил','Каменск-Уральский']],['74','Челябинская область','УрФО',['Челябинск','Магнитогорск','Миасс']],
    ['72','Тюменская область','УрФО',['Тюмень','Тобольск']],['86','Ханты-Мансийский автономный округ — Югра','УрФО',['Сургут','Нижневартовск','Ханты-Мансийск']],
    ['54','Новосибирская область','СФО',['Новосибирск','Бердск']],['24','Красноярский край','СФО',['Красноярск','Норильск','Ачинск']],
    ['55','Омская область','СФО',['Омск']],['42','Кемеровская область — Кузбасс','СФО',['Кемерово','Новокузнецк','Прокопьевск']],
    ['38','Иркутская область','СФО',['Иркутск','Братск','Ангарск']],['22','Алтайский край','СФО',['Барнаул','Бийск','Рубцовск']],
    ['23','Краснодарский край','ЮФО',['Краснодар','Сочи','Новороссийск','Армавир']],['61','Ростовская область','ЮФО',['Ростов-на-Дону','Таганрог','Шахты']],
    ['34','Волгоградская область','ЮФО',['Волгоград','Волжский']],['30','Астраханская область','ЮФО',['Астрахань']],
    ['26','Ставропольский край','СКФО',['Ставрополь','Пятигорск','Кисловодск']],['05','Республика Дагестан','СКФО',['Махачкала','Каспийск','Дербент']],
    ['25','Приморский край','ДФО',['Владивосток','Находка','Уссурийск']],['27','Хабаровский край','ДФО',['Хабаровск','Комсомольск-на-Амуре']],
    ['14','Республика Саха (Якутия)','ДФО',['Якутск','Нерюнгри']],['65','Сахалинская область','ДФО',['Южно-Сахалинск']],
    ['39','Калининградская область','СЗФО',['Калининград','Советск']],['29','Архангельская область','СЗФО',['Архангельск','Северодвинск']],
    ['35','Вологодская область','СЗФО',['Вологда','Череповец']],['10','Республика Карелия','СЗФО',['Петрозаводск']],
    ['36','Воронежская область','ЦФО',['Воронеж']],['31','Белгородская область','ЦФО',['Белгород','Старый Оскол']],
    ['40','Калужская область','ЦФО',['Калуга','Обнинск']],['71','Тульская область','ЦФО',['Тула','Новомосковск']],
    ['76','Ярославская область','ЦФО',['Ярославль','Рыбинск']],['69','Тверская область','ЦФО',['Тверь','Ржев']],
    ['46','Курская область','ЦФО',['Курск','Железногорск']],['57','Орловская область','ЦФО',['Орёл','Ливны']]
  ].map(([code,name,district,cities])=>({id:`region-${code}`,code,name,district,cities,tags:[name.toLowerCase(),district.toLowerCase(),...cities.map(city=>city.toLowerCase())]}));

  const normalize=value=>String(value||'').toLowerCase().replace(/ё/g,'е');
  const domainRules={retail:/продав|кассир|магазин|розниц|торгов|мерч|выклад|покупател/,logistics:/логист|склад|курьер|водител|достав|пвз|сортиров|комплект|wms|tms/,production:/производ|завод|цех|линия|станок|оператор|технолог|отк|лаборатор|инженер/,office:/офис|аналит|it|айти|финанс|юрист|hr|маркет|продаж|проект|продукт/};
  const detectDomains=query=>{const value=normalize(query);const found=Object.entries(domainRules).filter(([,rule])=>rule.test(value)).map(([domain])=>domain);return found.length?found:['office'];};
  const score=(row,query)=>{const words=normalize(query).split(/[^а-яa-z0-9]+/).filter(word=>word.length>2);const haystack=normalize([row.title,row.name,row.purpose,row.rule,row.domain,...(row.tags||[])].join(' '));return words.reduce((sum,word)=>sum+(haystack.includes(word)||haystack.includes(word.slice(0,Math.min(6,word.length)))?3:0),detectDomains(query).includes(row.domain)?8:0);};
  const relevant=(rows,query,limit)=>rows.map(row=>({row,score:score(row,query)})).sort((a,b)=>b.score-a.score||String(a.row.title||a.row.name).localeCompare(String(b.row.title||b.row.name),'ru')).slice(0,limit).map(item=>item.row);
  const relevantRegions=(query,limit=16)=>{const words=normalize(query);const exact=geography.filter(region=>region.tags.some(tag=>words.includes(normalize(tag))));const remaining=geography.filter(region=>!exact.includes(region));return [...exact,...remaining].slice(0,limit);};

  window.SkillazReferenceData={
    structures,positions,groups,businessRoles,regions:geography,
    stats:{structures:Object.keys(structures).length,positions:positions.length,groups:groups.length,businessRoles:businessRoles.length,regions:geography.length,cities:geography.reduce((sum,region)=>sum+region.cities.length,0)},
    detectDomains,
    relevantStructures(query){return detectDomains(query).map(domain=>structures[domain]).filter(Boolean);},
    relevantPositions(query,limit=18){
      const domains=detectDomains(query), stop=/магаз|сет|москв|област|регион|адаптац|сотрудник|новы/;
      const terms=normalize(query).split(/[^а-яa-z0-9]+/).filter(word=>word.length>4&&!stop.test(word)).map(word=>word.slice(0,6));
      const ranked=rows=>rows.map(row=>({row,score:score(row,query)+terms.reduce((sum,term)=>sum+(normalize(row.title).includes(term)?12:0),0)})).sort((a,b)=>b.score-a.score||a.row.title.localeCompare(b.row.title,'ru')).map(item=>item.row);
      return [...ranked(positions.filter(row=>domains.includes(row.domain))),...ranked(positions.filter(row=>!domains.includes(row.domain)))].slice(0,limit);
    },
    relevantGroups(query,limit=12){const domains=detectDomains(query);return [...relevant(groups.filter(row=>domains.includes(row.domain)),query,limit),...relevant(groups.filter(row=>!domains.includes(row.domain)),query,limit)].slice(0,limit);},
    relevantBusinessRoles(query,limit=18){const domains=detectDomains(query);return [...relevant(businessRoles.filter(row=>domains.includes(row.domain)),query,limit),...relevant(businessRoles.filter(row=>!domains.includes(row.domain)),query,limit)].slice(0,limit);},
    relevantRegions,
    context(query){return {domains:detectDomains(query),positions:this.relevantPositions(query),groups:this.relevantGroups(query),businessRoles:this.relevantBusinessRoles(query),regions:relevantRegions(query),structures:this.relevantStructures(query)};}
  };
})();
