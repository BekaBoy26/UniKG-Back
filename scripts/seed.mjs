// Генерирует SQL-сид из собранных данных: portal.json (2020.edu.gov.kg) + ручные данные из Kaktus/официальных сайтов
import fs from "node:fs";
import { deriveFields, FIELD_ORDER } from "./fields.mjs";
import { localize } from "./institution-i18n.mjs";
import { localizePrograms } from "./program-i18n.mjs";

const portal = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const outFile = process.argv[3];

const PORTAL = (id) => `https://2020.edu.gov.kg/reports?id_university=${id}`;
const K = (doc) => `https://kaktus.media/doc/${doc}.html`;

const city = {
  bishkek: { ru: "Бишкек", ky: "Бишкек", en: "Bishkek" },
  osh: { ru: "Ош", ky: "Ош", en: "Osh" },
  karakol: { ru: "Каракол", ky: "Каракол", en: "Karakol" },
  manas: { ru: "Манас (Джалал-Абад)", ky: "Манас (Жалал-Абад)", en: "Manas (Jalal-Abad)" },
  naryn: { ru: "Нарын", ky: "Нарын", en: "Naryn" },
  talas: { ru: "Талас", ky: "Талас", en: "Talas" },
  batken: { ru: "Баткен", ky: "Баткен", en: "Batken" },
  tokmok: { ru: "Токмок", ky: "Токмок", en: "Tokmok" },
};

const ru = (list) => list.map((p) => ({ ru: p }));

// Фото: Wikimedia Commons (свободные лицензии) или сайт самого учреждения / mektep.pro (файлы в frontend/public/institutions).
// Страница-источник фото идёт в sources
const images = {
  auca: { image: "/institutions/auca.jpg",
    page: "https://univer.mektep.pro/profile:1737/" },
  ksapcs: { image: "/institutions/ksapcs.jpg",
    page: "https://univer.mektep.pro/profile:1804/" },
  intuit: { image: "/institutions/intuit.jpg",
    page: "https://univer.mektep.pro/profile:1839/" },
  salymbekov: { image: "/institutions/salymbekov.jpg",
    page: "https://univer.mektep.pro/profile:1795/" },
  adam: { image: "/institutions/adam.jpg",
    page: "https://adam.edu.kg/ru/" },
  batsu: { image: "/institutions/batsu.jpg",
    page: "https://batmu.kg" },
  oshtu: { image: "/institutions/oshtu.jpg",
    page: "https://oshtu.kg" },
  oshmpu: { image: "/institutions/oshmpu.jpg",
    page: "https://oshmpu.kg" },
  iukr: { image: "/institutions/iukr.jpg",
    page: "https://iukr.kg" },
  alatoo: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Building_B_of_IAAU.jpg/1280px-Building_B_of_IAAU.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Building_B_of_IAAU.jpg" },
  arabaev: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Kyrgyz_State_University_of_Arabaev.jpg/1280px-Kyrgyz_State_University_of_Arabaev.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Kyrgyz_State_University_of_Arabaev.jpg" },
  bsu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/BHU_fantan.jpg/1280px-BHU_fantan.jpg",
    page: "https://commons.wikimedia.org/wiki/File:BHU_fantan.jpg" },
  iuk: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/International_University_of_Kyrgyzstan_2017.jpg/1280px-International_University_of_Kyrgyzstan_2017.jpg",
    page: "https://commons.wikimedia.org/wiki/File:International_University_of_Kyrgyzstan_2017.jpg" },
  keu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/%D0%9A%D0%AD%D0%A3_%D0%B8%D0%BC._%D0%9C._%D0%A0%D1%8B%D1%81%D0%BA%D1%83%D0%BB%D0%B1%D0%B5%D0%BA%D0%BE%D0%B2%D0%B0.jpg/1280px-%D0%9A%D0%AD%D0%A3_%D0%B8%D0%BC._%D0%9C._%D0%A0%D1%8B%D1%81%D0%BA%D1%83%D0%BB%D0%B1%D0%B5%D0%BA%D0%BE%D0%B2%D0%B0.jpg",
    page: "https://commons.wikimedia.org/wiki/File:%D0%9A%D0%AD%D0%A3_%D0%B8%D0%BC._%D0%9C._%D0%A0%D1%8B%D1%81%D0%BA%D1%83%D0%BB%D0%B1%D0%B5%D0%BA%D0%BE%D0%B2%D0%B0.jpg" },
  knu: { image: "https://upload.wikimedia.org/wikipedia/commons/1/1e/%D0%93%D0%97_%D0%9A%D0%9D%D0%A3.jpg",
    page: "https://commons.wikimedia.org/wiki/File:%D0%93%D0%97_%D0%9A%D0%9D%D0%A3.jpg" },
  krsu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Kyrgyz-Russian_Slavic_University.jpg/1280px-Kyrgyz-Russian_Slavic_University.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Kyrgyz-Russian_Slavic_University.jpg" },
  kstu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/April_2012._Kyrgyz_State_Technical_University_named_after_I._Razzakov_-_panoramio.jpg/1280px-April_2012._Kyrgyz_State_Technical_University_named_after_I._Razzakov_-_panoramio.jpg",
    page: "https://commons.wikimedia.org/wiki/File:April_2012._Kyrgyz_State_Technical_University_named_after_I._Razzakov_-_panoramio.jpg" },
  kumu: { image: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Kyrgyz-Uzbek_state_universty.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Kyrgyz-Uzbek_state_universty.jpg" },
  manas: { image: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Manas_University.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Manas_University.jpg" },
  nsu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/University_Naryn.jpg/1280px-University_Naryn.jpg",
    page: "https://commons.wikimedia.org/wiki/File:University_Naryn.jpg" },
  oshsu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81_%D0%9E%D1%88%D0%93%D0%A3.jpg/1280px-%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81_%D0%9E%D1%88%D0%93%D0%A3.jpg",
    page: "https://commons.wikimedia.org/wiki/File:%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81_%D0%9E%D1%88%D0%93%D0%A3.jpg" },
  uca: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/University_of_Central_Asia_Naryn_Campus_aerial_shot.jpg/1280px-University_of_Central_Asia_Naryn_Campus_aerial_shot.jpg",
    page: "https://commons.wikimedia.org/wiki/File:University_of_Central_Asia_Naryn_Campus_aerial_shot.jpg" },
  knau: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81_%D0%9A%D0%9D%D0%90%D0%A3.jpg/1280px-%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81_%D0%9A%D0%9D%D0%90%D0%A3.jpg",
    page: "https://commons.wikimedia.org/wiki/File:%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81_%D0%9A%D0%9D%D0%90%D0%A3.jpg" },
  iksu: { image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Karakol_-_26_%2849358713971%29.jpg/1280px-Karakol_-_26_%2849358713971%29.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Karakol_-_26_(49358713971).jpg" },
  kgma: { image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ksmanur.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Ksmanur.jpg" },
};

// pid — id вуза на портале «Абитуриент онлайн»
const items = [
  { slug: "krsu", short: "КРСУ", pid: 24, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызско-Российский Славянский университет имени первого Президента Российской Федерации Б. Н. Ельцина", en: "Kyrgyz-Russian Slavic University" },
    address: { ru: "ул. Киевская, 44" }, website: "https://www.krsu.kg",
    description: { ru: "Выпускники получают дипломы государственного образца двух стран — Кыргызстана и России." },
    programs: ru(["Лечебное дело", "Педиатрия", "Стоматология", "Прикладная математика и информатика", "Программная инженерия", "Инфокоммуникационные технологии и системы связи", "Электроника и наноэлектроника", "Приборостроение", "Электроэнергетика и электротехника", "Прикладная механика", "Технология транспортных процессов", "Эксплуатация транспортно-технологических машин и комплексов", "Архитектура", "Дизайн архитектурной среды", "Искусство текстиля и костюма", "Строительство", "Техносферная безопасность", "Природообустройство и водопользование", "Физические процессы горного или нефтегазового производства", "Экономика", "Менеджмент", "Психология", "Реклама и связи с общественностью", "Филология", "Лингвистика", "История", "Философия", "Религиоведение", "Юриспруденция", "Политология", "Международные отношения", "Журналистика", "Перевод и переводоведение", "Судебная экспертиза"]),
    sources: [K("375060_gid_po_vyzam_bishkeka:_kyrgyzsko_rossiyskiy_slavianskiy_yniversitet_krsy")] },
  { slug: "auca", short: "АУЦА", pid: 4, ownership: "private", city: city.bishkek,
    name: { ru: "Американский университет в Центральной Азии", en: "American University of Central Asia" },
    address: { ru: "ул. Аалы Токомбаева, 7/6" }, website: "https://auca.kg",
    description: { ru: "Первый университет в Центральной Азии, обучающий по американской системе образования. Программы аккредитованы в США в партнёрстве с Bard College." },
    tuitionNote: "individual",
    programs: ru(["Антропология и международное развитие", "Журналистика и массовые коммуникации", "Международная сравнительная политика", "Международное и бизнес-право", "Прикладная математика и информатика", "Психология", "Бизнес-управление", "Программное обеспечение", "Кино, телевидение и медиаискусство", "Свободные искусства и науки", "Социология", "Экономика", "Экологическая устойчивость и климатология"]),
    fields: ["it", "economics", "humanities"],
    sources: [K("375709_gid_po_vyzam._amerikanskiy_yniversitet_v_centralnoy_azii_ayca")] },
  { slug: "manas", short: "КТУ «Манас»", pid: 25, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызско-Турецкий университет «Манас»", en: "Kyrgyz-Turkish Manas University" },
    address: { ru: "пр. Ч. Айтматова, 56" }, website: "https://manas.edu.kg",
    description: { ru: "Создан в 1995 году на основе договора между правительствами Кыргызстана и Турции. Обучение бесплатное, студентам выплачивается стипендия." },
    languages: { ru: "Турецкий, кыргызский; на отдельных направлениях — английский" },
    tuitionFrom: 0,
    programs: ru(["История", "Тюркология", "Русский язык и литература", "Английский язык и литература", "Китайский язык и литература", "Социология", "Философия", "Психолого-педагогическая помощь и консультирование", "Синхронный перевод (кыргызский — турецкий)", "Синхронный перевод (кыргызский — английский)", "Синхронный перевод (турецкий — русский)", "Экономика", "Менеджмент", "Финансы и банковское дело", "Международные отношения", "Компьютерная инженерия", "Экологическая инженерия", "Пищевая инженерия", "Химическая инженерия", "Электроника и электрическая инженерия", "Промышленная инженерия", "Журналистика", "Связи с общественностью и рекламное дело", "Радио, телевидение и кинематография", "Математика", "Прикладная математика и информатика", "Биология", "Графика", "Живопись", "Музыкальное искусство", "Театральное искусство", "Религиоведение", "Исламоведение", "Ветеринария", "Защита растений", "Плодоовощеводство", "Подготовка тренеров", "Подготовка преподавателей физической культуры и спорта", "Туризм и гостиничное дело", "Туристический бизнес и служба гидов"]),
    fields: ["it", "engineering", "economics", "humanities", "pedagogy"],
    sources: [K("376622_gid_po_vyzam_bishkeka:_kyrgyzsko_tyreckiy_yniversitet_manas_kty_manas")] },
  { slug: "kstu", short: "КГТУ", pid: 15, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский государственный технический университет имени И. Раззакова", en: "Kyrgyz State Technical University named after I. Razzakov" },
    address: { ru: "пр. Ч. Айтматова, 66" }, website: "https://kstu.kg",
    description: { ru: "Три кампуса, десять институтов и две высшие школы. Есть программы двойного диплома с зарубежными университетами." },
    languages: { ru: "Русский, кыргызский, английский" },
    sources: [K("375836_gid_po_vyzam_bishkeka:_kyrgyzskiy_gosydarstvennyy_tehnicheskiy_yniversitet_kgty")] },
  { slug: "knu", short: "КНУ", pid: 22, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский национальный университет имени Жусупа Баласагына", en: "Kyrgyz National University named after Jusup Balasagyn" },
    address: { ru: "ул. Фрунзе, 547" }, website: "https://www.knu.kg" },
  { slug: "oshsu", short: "ОшГУ", pid: 43, ownership: "state", city: city.osh,
    name: { ru: "Ошский государственный университет", en: "Osh State University" },
    address: { ru: "ул. Ленина, 331" }, website: "https://oshsu.kg" },
  { slug: "alatoo", short: "МУА", pid: 29, ownership: "private", city: city.bishkek,
    name: { ru: "Международный университет «Ала-Тоо»", en: "Ala-Too International University" },
    address: { ru: "ул. Анкара, 1/8, мкр. Тунгуч" }, website: "https://alatoo.edu.kg",
    description: { ru: "Основной язык обучения — английский. Приём по результатам ОРТ, без вступительных экзаменов." },
    languages: { ru: "Английский" },
    programs: ru(["Информатика и вычислительная техника", "Прикладная математика и информатика", "Электроника и наноэлектроника", "Управление качеством", "Филология", "Филологическое образование", "Лингвистика", "Педагогика", "Логопедия", "Экономика", "Менеджмент", "Юриспруденция", "Лечебное дело", "Международные отношения", "Психология", "Журналистика", "Реклама и связь с общественностью"]),
    sources: [K("376036_gid_po_vyzam_bishkeka:_mejdynarodnyy_yniversitet_ala_too_mya")] },
  { slug: "kgma", short: "КГМА", pid: 14, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызская государственная медицинская академия имени И. К. Ахунбаева", en: "Kyrgyz State Medical Academy" },
    address: { ru: "ул. Ахунбаева, 92" }, website: "https://kgma.kg",
    description: { ru: "Подготовка по медицинским и фармацевтическим специальностям." },
    programs: ru(["Лечебное дело", "Педиатрия", "Стоматология", "Фармация", "Медико-профилактическое дело", "Сестринское дело", "Медицинская инженерия"]),
    sources: [K("394190_gid_po_vyzam:_kyrgyzskaia_gosydarstvennaia_medicinskaia_akademiia_im._i._k._ahynbaeva_kgma")] },
  { slug: "bsu", short: "БГУ", pid: 5, ownership: "state", city: city.bishkek,
    name: { ru: "Бишкекский государственный университет имени К. Карасаева" },
    address: { ru: "пр. Ч. Айтматова, 27" }, website: "https://bsu.kg",
    description: { ru: "Десять факультетов, институт непрерывного и дистанционного образования и колледж." },
    sources: [K("375582_gid_po_vyzam_bishkeka:_bishkekskiy_gosydarstvennyy_yniversitet_bgy")] },
  { slug: "keu", short: "КЭУ", pid: 26, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский экономический университет имени Мусы Рыскулбекова", en: "Kyrgyz Economic University named after M. Ryskulbekov" },
    address: { ru: "ул. Тоголок Молдо, 58" }, website: "https://keu.kg" },
  { slug: "arabaev", short: "КГУ им. Арабаева", pid: 16, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский государственный университет имени И. Арабаева" },
    address: { ru: "ул. Раззакова, 51" }, website: "https://arabaevksu.edu.kg" },
  { slug: "iukr", short: "МУКР", pid: 31, ownership: "state", city: city.bishkek,
    name: { ru: "Международный университет Кыргызской Республики" },
    address: { ru: "пр. Чуй, 255" }, website: "https://iukr.kg",
    description: { ru: "Государственный вуз. С 2014 года действует программа двойных дипломов с университетами Германии, Польши, Болгарии и Турции." },
    programs: ru(["Управление бизнесом", "Экономика", "Государственное и муниципальное управление", "Юриспруденция", "Журналистика", "Психология", "Филологическое образование", "Программная инженерия", "Востоковедение"]),
    sources: [K("376033_gid_po_vyzam_bishkeka:_zapadnyy_kampys_mykr")] },
  { slug: "iuk", short: "МУК", pid: 65, ownership: "private", city: city.bishkek,
    name: { ru: "Международный университет Кыргызстана", en: "International University of Kyrgyzstan" },
    address: { ru: "ул. Л. Толстого, 17а/1" }, website: "https://muk.iuk.kg" },
  { slug: "salymbekov", short: "Салымбеков", pid: 64, ownership: "private", city: city.bishkek,
    name: { ru: "Салымбеков Университет", en: "Salymbekov University" },
    address: { ru: "ул. Малдыбаева, 24б" }, website: "https://salymbekov.com",
    description: { ru: "В составе — Американский институт технологии (IT) и Институт глобальных навыков с программами двойных дипломов." },
    programs: ru(["Компьютерная наука", "Бизнес-информатика", "Цифровое предпринимательство", "Международный бизнес"]),
    sources: [K("527184_gid_po_vyzam_bishkeka:_salymbekov_yniversitet")] },
  { slug: "inai", short: "КГИПИ", pid: 57, ownership: "private", city: city.bishkek,
    name: { ru: "Кыргызско-Германский институт прикладной информатики", en: "Kyrgyz-German Institute of Applied Informatics" },
    address: { ru: "ул. Анкара, 1/5" }, website: "https://inai.kg",
    description: { ru: "Единственный вуз Кыргызстана, специализирующийся только на компьютерных науках. Программа разработана с Западно-Саксонским университетом прикладных наук (WHZ, Германия)." },
    tuitionFrom: 100000,
    programs: ru(["Программные технологии", "Веб-информатика", "Прикладной анализ данных", "Финансовый инжиниринг"]),
    fields: ["it"],
    sources: [K("394195_gid_po_vyzam_bishkeka:_kyrgyzsko_germanskiy_instityt_prikladnoy_informatiki_kgipi")] },
  { slug: "uca", short: "УЦА", pid: 39, ownership: "private", city: city.naryn,
    name: { ru: "Университет Центральной Азии", en: "University of Central Asia" },
    address: { ru: "ул. Ленина, 310" }, website: "https://ucentralasia.org",
    description: { ru: "Кампус в Нарыне. Специализации бакалавриата: Computer Science и Communications and Media." },
    programs: [{ en: "Computer Science" }, { en: "Communications and Media" }],
    fields: ["it", "humanities"],
    sources: ["https://the.akdn/en/resources-media/whats-new/news-release/uca-launches-its-inaugural-admissions-campaign-2016-academic-year"] },
  { slug: "iksu", short: "ИГУ", pid: 36, ownership: "state", city: city.karakol,
    name: { ru: "Иссык-Кульский государственный университет имени К. Тыныстанова", en: "Issyk-Kul State University" },
    address: { ru: "ул. Тыныстанова, 32" }, website: "http://iksu.kg" },
  { slug: "jagu", short: "ЖАГУ", pid: 35, ownership: "state", city: city.manas,
    name: { ru: "Жалал-Абадский государственный университет имени Б. Осмонова", en: "Jalal-Abad State University" },
    address: { ru: "ул. Розы Азимовой, 49" }, website: "https://jagu.edu.kg" },
  { slug: "oshtu", short: "ОшТУ", pid: 45, ownership: "state", city: city.osh,
    name: { ru: "Ошский технологический университет имени М. М. Адышева", en: "Osh Technological University" },
    address: { ru: "ул. Н. Исанова, 81" }, website: "https://oshtu.kg" },
  { slug: "kumu", short: "КУМУ", pid: 40, ownership: "state", city: city.osh,
    name: { ru: "Кыргызско-Узбекский международный университет имени Б. Сыдыкова" },
    address: { ru: "ул. Г. Айтиева, 27" }, website: "https://kumu.kg" },
  { slug: "knau", short: "КНАУ", pid: 20, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский национальный аграрный университет имени К. И. Скрябина", en: "Kyrgyz National Agrarian University" },
    address: { ru: "ул. Медерова, 68" }, website: "https://knau.kg" },
  { slug: "adam", short: "АДАМ", pid: 66, ownership: "private", city: city.bishkek,
    name: { ru: "Университет АДАМ", en: "ADAM University" },
    address: { ru: "ул. 7 Апреля, 155А" }, website: "https://adam.edu.kg" },
  { slug: "iuca", short: "МУЦА", pid: 97, ownership: "private", city: city.tokmok,
    name: { ru: "Международный университет в Центральной Азии", en: "International University of Central Asia" },
    address: { ru: "ул. Шамсинская, 2" }, website: "https://www.iuca.kg" },
  { slug: "nsu", short: "НГУ", pid: 38, ownership: "state", city: city.naryn,
    name: { ru: "Нарынский государственный университет имени С. Нааматова", en: "Naryn State University" },
    address: { ru: "ул. Ленина, 127" }, website: "http://nsu.kg" },
  { slug: "talsu", short: "ТалГУ", pid: 46, ownership: "state", city: city.talas,
    name: { ru: "Таласский государственный университет", en: "Talas State University" },
    address: { ru: "аллея К. Нуржанова, 25" }, website: "https://talsu.kg",
    fields: ["pedagogy", "humanities", "economics", "it"], sources: ["https://talsu.kg"] },
  { slug: "batsu", short: "БатГУ", pid: 34, ownership: "state", city: city.batken,
    name: { ru: "Баткенский государственный университет", en: "Batken State University" },
    address: { ru: "ул. И. Жусупова, 11" }, website: "https://batmu.kg" },
  { slug: "ksapcs", short: "КГАФКиС", pid: 8, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызская государственная академия физической культуры и спорта имени Б. Т. Турусбекова" },
    address: { ru: "ул. Ахунбаева, 97" }, website: "https://www.ksapcs.kg" },
  { slug: "oshmpu", short: "ОшГПУ", pid: 41, ownership: "state", city: city.osh,
    name: { ru: "Ошский государственный педагогический университет имени А. Мырсабекова" },
    address: { ru: "ул. Исанова, 73" }, website: "https://oshmpu.kg" },
  { slug: "intuit", short: "МУИТ", pid: 30, ownership: "private", city: city.bishkek,
    name: { ru: "Международный университет инновационных технологий", en: "International University of Innovative Technologies" },
    address: { ru: "ул. Анкара, 1/17" }, website: "https://intuit.kg" },
  { slug: "kai", short: "КАИ", pid: 55, ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский авиационный институт имени И. Абдраимова" },
    address: { ru: "ул. Лущихина, 60" }, website: "https://kai.kg" },
];

const fieldOf = (code) => {
  if (/^(5102|5103|5106|5107|5805|59|71)/.test(code)) return "it";
  if (/^56/.test(code)) return "medicine";
  if (/^58/.test(code)) return "economics";
  if (/^55/.test(code)) return "pedagogy";
  if (/^(53|54|57)/.test(code)) return "humanities";
  if (/^(6[2-9]|70|7[2-6])/.test(code)) return "engineering";
  return null;
};
const formNames = { "Күндүзгү": "очная", "Кечки": "вечерняя", "Сырттан окуу": "заочная" };

// Порядок в массиве items = порядок популярности (popularity = индекс + 1)
const rows = items.map((it, index) => {
  const p = portal[it.pid];
  const pRows = p?.rows ?? [];
  const fullTime = pRows.filter((r) => /Күндүзгү/.test(r.form));
  const contract = fullTime.filter((r) => r.pay === "Контракт" && r.amount);

  const tuitionFrom = it.tuitionFrom !== undefined ? it.tuitionFrom : contract.length ? Math.min(...contract.map((r) => r.amount)) : null;
  const fields = it.fields ?? FIELD_ORDER.filter((f) => fullTime.some((r) => fieldOf(r.code) === f));
  // Недостающие языки названий — из словаря program-i18n.json
  const programs = localizePrograms(it.programs ?? [...new Set(fullTime.map((r) => r.direction.replace(/​/g, "").replace(/\s*\(кабыл алуу[^)]*\)/, "").replace(/[:\s]+$/, "").replace(/\s+,/g, ",").trim()))].sort((a, b) => a.localeCompare(b, "ky")).map((d) => ({ ky: d })));

  const forms = [...new Set(pRows.map((r) => formNames[r.form.replace(/ бакалавр$/, "")]).filter(Boolean))];
  const studyForm = forms.length ? { ru: forms.join(", ").replace(/^./, (c) => c.toUpperCase()) } : null;

  // Для вузов без прейскуранта на портале название на кыргызском взято из реестра 2020.edu.gov.kg/universities
  const registryKy = { 34: "Баткен мамлекеттик университети", 38: "С. Нааматов атындагы Нарын мамлекеттик университети", 46: "Талас мамлекеттик университети", 39: "Борбордук Азия Университети" };
  const name = { ...it.name };
  const kyName = p?.name && p.name !== "Нет данных" ? p.name : registryKy[it.pid];
  if (kyName) name.ky = kyName.replace(/"/g, "").replace(/\s+/g, " ").trim();

  const photo = images[it.slug];
  const sources = [...(pRows.length ? [PORTAL(it.pid)] : []), "https://2020.edu.gov.kg/universities", ...(it.sources ?? []), ...(photo ? [photo.page] : [])];

  return {
    slug: it.slug, type: "university", short: it.short, name: localize(it.slug, "name", name), city: it.city, ownership: it.ownership,
    fields: deriveFields(fields, programs), image: photo?.image ?? null, description: localize(it.slug, "description", it.description), languages: localize(it.slug, "languages", it.languages),
    study_form: localize(it.slug, "study_form", studyForm), tuition_from: tuitionFrom, programs, website: it.website, address: localize(it.slug, "address", it.address), sources, popularity: index + 1,
  };
});

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v === null || v === undefined ? "null" : `${q(JSON.stringify(v))}::jsonb`);
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;

const values = rows.map((r) =>
  `  (${[q(r.slug), q(r.type), q(r.short), j(r.name), j(r.city), q(r.ownership), arr(r.fields), q(r.image), j(r.description), j(r.languages), j(r.study_form), r.tuition_from ?? "null", j(r.programs), q(r.website), j(r.address), arr(r.sources), r.popularity].join(", ")})`,
);

const sql = `-- Топ-30 вузов Кыргызстана. Сгенерировано из открытых источников (см. колонку sources):
-- 2020.edu.gov.kg (МНВОИ КР, прейскуранты 2026/27), kaktus.media «Гид по вузам», официальные сайты.
-- tuition_from — минимальная стоимость очного контракта, сом/год; null — неизвестно.

insert into public.institutions
  (slug, type, short, name, city, ownership, fields, image, description, languages, study_form, tuition_from, programs, website, address, sources, popularity)
values
${values.join(",\n")}
on conflict (slug) do update set
  type = excluded.type, short = excluded.short, name = excluded.name, city = excluded.city,
  ownership = excluded.ownership, fields = excluded.fields, image = excluded.image,
  description = excluded.description, languages = excluded.languages, study_form = excluded.study_form,
  tuition_from = excluded.tuition_from, programs = excluded.programs, website = excluded.website,
  address = excluded.address, sources = excluded.sources, popularity = excluded.popularity;
`;
fs.writeFileSync(outFile, sql);

for (const r of rows) console.log(r.slug.padEnd(11), String(r.tuition_from).padEnd(7), r.fields.join(",").padEnd(45), r.programs.length, r.study_form?.ru ?? "-", "|", r.name.ky ? "ky" : "--");
