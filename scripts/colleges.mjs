// Генерирует SQL-сид колледжей (топ-30). Данные — из открытых источников, ссылки в sources каждой записи.
// Запуск: node scripts/colleges.mjs supabase/seed_colleges.sql
import fs from "node:fs";
import { localizePrograms } from "./program-i18n.mjs";

const outFile = process.argv[2];

const RATING = "https://caravan-info.kg/ru/science/832793-.html"; // рейтинг СПО Минобразования КР, 21.05.2025
const SPUTNIK = "https://ru.sputnik.kg/20230623/kolledzhi-bishkeka-spisok-stoimost-adresa-1076487176.html";
const OSHSU = "https://www.oshsu.kg/en/page/121";
const K = (id) => `https://kaktus.media/${id}`;
const M = (id) => `https://college.mektep.pro/profile:${id}/`;
const PHOTO = (slug) => `/institutions/${slug}.jpg`;

const city = {
  bishkek: { ru: "Бишкек", ky: "Бишкек", en: "Bishkek" },
  osh: { ru: "Ош", ky: "Ош", en: "Osh" },
  jalalabad: { ru: "Джалал-Абад", ky: "Жалал-Абад", en: "Jalal-Abad" },
  uzgen: { ru: "Узген", ky: "Өзгөн", en: "Uzgen" },
};

const list = (s) => s.split("; ").map((p) => ({ ru: p.charAt(0).toUpperCase() + p.slice(1) }));
const rated = (place) => `${place}-е место в рейтинге учреждений среднего профессионального образования Министерства образования КР (2025).`;

// Порядок в массиве = порядок популярности (popularity = индекс + 1)
const items = [
  { slug: "motion", short: "Motion", ownership: "private", city: city.bishkek,
    name: { ru: "Motion College", ky: "Motion College", en: "Motion College" },
    description: { ru: "IT-академия MotionWeb, работает с 2020 года. Имеет лицензию Министерства образования; по окончании программы выдаётся диплом или свидетельство." },
    fields: ["it"], website: "https://motion.kg", address: { ru: "ул. Куренкеева, 138" },
    programs: list("JavaScript-инженер (18 месяцев + 1 месяц стажировки); AI-разработка (15 месяцев + 1 месяц стажировки); кибербезопасность (6 месяцев); IT для детей (4 месяца)"),
    sources: ["https://motion.kg"] },
  { slug: "oshsu-ipk", short: "ИПК ОшГУ", ownership: "state", city: city.osh,
    name: { ru: "Индустриально-педагогический колледж ОшГУ" },
    description: { ru: `${rated(1)} Колледж в составе Ошского государственного университета, история которого начинается в 2012 году.` },
    fields: ["it", "pedagogy"], website: "http://ipk.oshsu.kg", address: { ru: "ул. Гапара Айтиева, 4" },
    programs: list("дошкольное образование; дизайн; конструирование, моделирование и технология швейных изделий; программное обеспечение вычислительной техники и автоматизированных систем; техническое обслуживание средств вычислительной техники и компьютерных сетей; автоматизированные системы обработки информации и управления; прикладная информатика"),
    sources: [OSHSU, RATING] },
  { slug: "jagu-college", short: "Колледж ЖАГУ", ownership: "state", city: city.jalalabad,
    name: { ru: "Колледж Жалал-Абадского государственного университета им. Б. Осмонова" },
    description: { ru: `${rated(2)} Колледж в составе Жалал-Абадского государственного университета.` },
    fields: ["it"],
    programs: list("программное обеспечение вычислительной техники и автоматизированных систем"),
    sources: [RATING, "http://jagu.kg/user_files/jak/%D0%9E%D0%9F%D0%9E%D0%9F-230109-%D0%9F%D0%A0%D0%9E%D0%93%D0%A0%D0%90%D0%9C%D0%9C%D0%9D%D0%9E%D0%95%D0%9E%D0%91%D0%95%D0%A1%D0%9F%D0%95%D0%A7%D0%95%D0%9D%D0%98%D0%95-%D0%92%D0%AB%D0%A7%D0%98%D0%A1%D0%9B%D0%98%D0%A2%D0%95%D0%9B%D0%AC%D0%9D%D0%9E%D0%99-%D0%A2%D0%95%D0%A5%D0%9D%D0%98%D0%9A%D0%98-%D0%98-%D0%90%D0%92%D0%A2%D0%9E%D0%9C%D0%90%D0%A2%D0%98%D0%97%D0%98%D0%A0%D0%9E%D0%92%D0%90%D0%9D%D0%9D%D0%AB%D0%A5-%D0%A1%D0%98%D0%A1%D0%A2%D0%95%D0%9C.pdf"] },
  { slug: "kstu-college", short: "Колледж КГТУ", ownership: "state", city: city.bishkek,
    name: { ru: "Колледж КГТУ им. И. Раззакова (кампус им. Н. Исанова)" },
    description: { ru: rated(3) },
    fields: ["engineering", "it", "economics"], address: { ru: "ул. Малдыбаева, 34б" }, languages: { ru: "Русский" },
    programs: list("архитектура; дизайн (по отраслям); строительство и эксплуатация зданий и сооружений; строительство и эксплуатация автомобильных дорог и аэродромов; производство неметаллических строительных изделий и конструкций; монтаж и эксплуатация оборудования и систем газоснабжения; водоснабжение и водоотведение; прикладная геодезия; организация перевозок и управление на транспорте (автомобильном и железнодорожном); защита в чрезвычайных ситуациях; экология и охрана окружающей среды; программное обеспечение вычислительной техники и автоматизированных систем; программирование компьютерных сетей; прикладная информатика (по отраслям); информационная безопасность автоматизированных систем; менеджмент (по отраслям); экономика и бухгалтерский учет (по отраслям); финансы (по отраслям); налоги и налогообложение"),
    sources: [RATING, SPUTNIK, M(3307)] },
  { slug: "oshsu-fjc", short: "ФЮК ОшГУ", ownership: "state", city: city.osh,
    name: { ru: "Финансово-юридический колледж ОшГУ" },
    description: { ru: `${rated(4)} Колледж в составе Ошского государственного университета.` },
    fields: ["economics"], website: "https://fjc.oshsu.kg", image: PHOTO("oshsu-fjc"),
    sources: [RATING, OSHSU, "https://fjc.oshsu.kg"] },
  { slug: "kstu-polytech", short: "Политех КГТУ", ownership: "state", city: city.bishkek,
    name: { ru: "Политехнический колледж КГТУ им. И. Раззакова" },
    description: { ru: rated(5) },
    fields: ["engineering", "it"], address: { ru: "пр. Чингиза Айтматова, 66" }, languages: { ru: "Кыргызский, русский" },
    programs: list("конструирование, моделирование и технология швейных изделий; техническое обслуживание и ремонт радиоэлектронной техники (по отраслям); техническое обслуживание и ремонт средств вычислительной техники и компьютерных сетей; электроснабжение (по отраслям); электрические станции, сети и системы; техническое обслуживание и ремонт автомобильного транспорта; организация перевозок и управление на транспорте (по видам транспорта, за исключением воздушного)"),
    sources: [RATING, SPUTNIK, M(1934)] },
  { slug: "kai-college", short: "Авиаколледж КАИ", ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызский авиационный колледж при Институте им. И. Абдраимова" },
    description: { ru: `Отделение СПО Кыргызского авиационного института им. И. Абдраимова — 6-е место в рейтинге учреждений среднего профессионального образования Министерства образования КР (2025).` },
    fields: ["engineering", "it"], address: { ru: "ул. Лущихина, 60" }, languages: { ru: "Русский" },
    programs: list("техническая эксплуатация летательных аппаратов и двигателей; организация перевозок и управление на воздушном транспорте; техническое обслуживание средств вычислительной техники и компьютерных сетей; техническая эксплуатация электрифицированных и пилотажно-навигационных комплексов; менеджмент на воздушном транспорте; обслуживание летательных аппаратов горюче-смазочными материалами; транспортная безопасность; эксплуатация судовых энергетических установок; техническая эксплуатация беспилотных летательных аппаратов; летная эксплуатация летательных аппаратов"),
    sources: [RATING, SPUTNIK, K(383485), M(1882)] },
  { slug: "ermatov", short: "БМПК", ownership: "state", city: city.bishkek,
    name: { ru: "Бишкекский музыкально-педагогический колледж им. Т. Эрматова" },
    description: { ru: "Отделение СПО Бишкекского музыкально-педагогического института им. Т. Эрматова — 7-е место в рейтинге учреждений среднего профессионального образования Министерства образования КР (2025)." },
    fields: ["pedagogy"], address: { ru: "ул. Исы Ахунбаева, 121" }, languages: { ru: "Кыргызский, русский" }, image: PHOTO("ermatov"),
    programs: list("учитель музыки; музыкальный руководитель; учитель начальных классов; учитель физической культуры; воспитатель дошкольного учреждения"),
    sources: [RATING, "https://24.kg/english/290724_Bishkek_Music_and_Pedagogical_College_building_to_be_overhauled/", M(1995)] },
  { slug: "oshsu-medical", short: "Медколледж ОшГУ", ownership: "state", city: city.osh,
    name: { ru: "Медицинский колледж ОшГУ" },
    description: { ru: `${rated(8)} Колледж в составе Ошского государственного университета.` },
    fields: ["medicine"],
    sources: [RATING, OSHSU] },
  { slug: "bmk", short: "БМК", ownership: "state", city: city.bishkek,
    name: { ru: "Бишкекский медицинский колледж им. А. Молдогазиева" },
    description: { ru: "Готовит медицинских работников среднего звена на бюджетной и контрактной основе. Принимает выпускников 11-х классов." },
    fields: ["medicine"], address: { ru: "ул. Логвиненко, 18" }, languages: { ru: "Кыргызский, русский" }, image: PHOTO("bmk"),
    programs: list("акушерское дело; лабораторная диагностика; медико-профилактическое дело; сестринское дело; стоматология ортопедическая; фармацевтика"),
    sources: [SPUTNIK, K(383425), M(1879)] },
  { slug: "compass", short: "Compass", ownership: "private", city: city.bishkek,
    name: { ru: "Compass College", ky: "Compass College", en: "Compass College" },
    fields: ["it"], address: { ru: "ул. Манаса, 41/1" }, languages: { ru: "Английский, русский" },
    programs: list("архитектурный дизайн; графический дизайн; креативный бизнес; дизайн одежды; медиадизайн; IT-инженерия и дизайн; IT и продуктовый дизайн"),
    sources: [SPUTNIK, M(1952)] },
  { slug: "arabaev-college", short: "Колледж КГУ", ownership: "state", city: city.bishkek,
    name: { ru: "Колледж КГУ им. И. Арабаева" },
    description: { ru: "Колледж в составе Кыргызского государственного университета им. И. Арабаева." },
    fields: ["it", "economics", "pedagogy", "humanities"], address: { ru: "ул. Чалдоварская, 91а" }, languages: { ru: "Русский" }, image: PHOTO("arabaev-college"),
    programs: list("право и организация социального обеспечения; автоматизированные системы обработки информации и управление; экономика; бухгалтерский учет и контроль; налоги и налогообложение; социальная работа; моделирование и конструирование швейных изделий; дизайн; туризм; экология и охрана окружающей среды; преподавание в начальных классах; дошкольное образование; прикладная информатика; программное обеспечение вычислительной техники и автоматизированных систем; преподавание английского языка в начальных классах"),
    sources: [SPUTNIK, K(384344), M(1904)] },
  { slug: "auca-college", short: "Колледж АУЦА", ownership: "private", city: city.bishkek,
    name: { ru: "Инновационный колледж АУЦА", en: "AUCA Innovative College" },
    description: { ru: "Колледж Американского университета в Центральной Азии." },
    fields: ["it", "economics"], address: { ru: "ул. Медерова, 161а" }, languages: { ru: "Английский, русский" },
    programs: list("стартап-финансы и высокие технологии; новое предпринимательство и человеческий интеллект; дизайн и высокие технологии; программная инженерия и социальные трансформации; экология и энергетическая эффективность; дизайн-менеджмент и дизайн-мышление"),
    sources: [SPUTNIK, M(1875)] },
  { slug: "krsu-college", short: "Колледж КРСУ", ownership: "state", city: city.bishkek,
    name: { ru: "Колледж КРСУ" },
    description: { ru: "Колледж Кыргызско-Российского Славянского университета. Принимает выпускников 9-х классов." },
    fields: ["economics"], website: "https://college.krsu.edu.kg", address: { ru: "ул. Анкара, 24к" }, languages: { ru: "Русский" },
    programs: list("дизайн среды; дизайн одежды; экономика и бухгалтерский учет"),
    sources: [SPUTNIK, K(384277), M(1919)] },
  { slug: "bsu-college", short: "Колледж БГУ", ownership: "state", city: city.bishkek,
    name: { ru: "Колледж БГУ им. К. Карасаева" },
    description: { ru: "Колледж в составе Бишкекского государственного университета им. К. Карасаева." },
    fields: ["humanities", "economics"], website: "https://bhu.kg/en/kolledzh-bgu/", address: { ru: "ул. Жукеева-Пудовкина, 34" }, languages: { ru: "Кыргызский, русский" },
    programs: list("иностранные языки; переводческое дело; менеджмент; налоги и налогообложение; экономика и бухгалтерский учет; финансы"),
    sources: [SPUTNIK, M(1862), "https://bhu.kg/en/kolledzh-bgu/"] },
  { slug: "keu-college", short: "КЭиС КЭУ", ownership: "state", city: city.bishkek,
    name: { ru: "Колледж экономики и сервиса КЭУ им. М. Рыскулбекова" },
    description: { ru: "Колледж в составе Кыргызского экономического университета им. М. Рыскулбекова." },
    fields: ["economics", "it"], address: { ru: "ул. Тоголока Молдо, 58" }, languages: { ru: "Кыргызский, русский" },
    programs: list("экономика и бухгалтерский учет (по отраслям); финансы (по отраслям); право и организация социального обеспечения; правоведение; менеджмент (по отраслям); банковское дело; туризм; технология продукции общественного питания; социальная педагогика; прикладная информатика (по отраслям); организация обслуживания в гостиницах и туристических комплексах; налоги и налогообложение"),
    sources: [SPUTNIK, M(1937)] },
  { slug: "komtehno", short: "КОМТЕХНО", ownership: "private", city: city.bishkek,
    name: { ru: "Бишкекский колледж компьютерных систем и технологий (КОМТЕХНО)" },
    fields: ["it", "economics"], address: { ru: "ул. Виноградная, 1/17а" }, languages: { ru: "Английский, русский" }, tuitionFrom: 40000,
    programs: list("программное обеспечение вычислительной техники и автоматизированных систем; техническое обслуживание средств вычислительной техники и компьютерных сетей; автоматизированные системы обработки информации и управления; прикладная информатика; дизайн; экономика и бухгалтерский учет; менеджмент; банковское дело"),
    sources: [K(384346), M(2021)] },
  { slug: "alatoo-college", short: "IT & Business", ownership: "private", city: city.bishkek,
    name: { ru: "IT & Business College Международного университета «Ала-Тоо»", en: "Ala-Too IT & Business College" },
    description: { ru: "Колледж Международного университета «Ала-Тоо»." },
    fields: ["it", "economics"], address: { ru: "мкр. Тунгуч, ул. Анкара, 1/8" }, languages: { ru: "Кыргызский, русский" },
    sources: [M(2025)] },
  { slug: "kite", short: "КИТЭ", ownership: "private", city: city.bishkek,
    name: { ru: "Колледж инновационных технологий и экономики" },
    fields: ["economics", "engineering"], address: { ru: "ул. Анкара, 1/17" }, languages: { ru: "Русский" },
    programs: list("гостиничный сервис; налоги и налогообложение; электроснабжение; моделирование и конструирование швейных изделий; строительство и эксплуатация зданий и сооружений; техническое обслуживание и ремонт автомобильного транспорта; земельно-имущественные отношения; реклама; менеджмент по отраслям; организация общественного питания"),
    sources: [SPUTNIK, M(1897)] },
  { slug: "bkams", short: "БКАМС", ownership: "state", city: city.bishkek,
    name: { ru: "Бишкекский колледж архитектуры и менеджмента в строительстве" },
    fields: ["engineering", "it"], website: "https://bkams.kg", address: { ru: "ул. Льва Толстого, 62/1" }, languages: { ru: "Русский" },
    programs: list("строительство и эксплуатация зданий и сооружений; архитектура; монтаж и эксплуатация внутренних санитарно-технических и вентиляционных устройств; технология деревообработки; дизайн и конструирование мебели; земельно-имущественные отношения; дизайн архитектурной среды; стоимостной инжиниринг; программное обеспечение вычислительной техники и автоматизированных систем"),
    sources: [SPUTNIK, M(1867), "https://bkams.kg"] },
  { slug: "iuk-nomad", short: "Nomad College", ownership: "private", city: city.bishkek,
    name: { ru: "Nomad College УНПК «МУК»", en: "Nomad College" },
    description: { ru: "Колледж учебно-научно-производственного комплекса «Международный университет Кыргызстана»." },
    fields: [], address: { ru: "ул. 7 Апреля, 4/3" }, languages: { ru: "Английский, русский" }, image: PHOTO("iuk-nomad"),
    sources: [M(2841)] },
  { slug: "chuykov", short: "Училище Чуйкова", ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызское государственное художественное училище им. С. А. Чуйкова" },
    fields: ["humanities"], address: { ru: "ул. Орозбекова, 6" }, languages: { ru: "Русский" }, image: PHOTO("chuykov"),
    programs: list("живопись; дизайн; декоративно-прикладное искусство (этнодизайн по коже, дизайн по керамике, текстиль-дизайн)"),
    sources: [SPUTNIK, K(384267), M(2034)] },
  { slug: "kurenkeev", short: "Училище Куренкеева", ownership: "state", city: city.bishkek,
    name: { ru: "Кыргызское государственное музыкальное училище им. М. Куренкеева" },
    fields: ["humanities"], address: { ru: "ул. Панфилова, 162" }, languages: { ru: "Кыргызский, русский" }, image: PHOTO("kurenkeev"),
    sources: [M(2037)] },
  { slug: "fintech", short: "БФЭТ", ownership: "state", city: city.bishkek,
    name: { ru: "Бишкекский финансово-экономический техникум им. А. Токтоналиева" },
    description: { ru: "Подведомствен Министерству финансов КР." },
    fields: ["economics"], address: { ru: "пр. Чуй, 269" }, languages: { ru: "Русский" },
    programs: list("операционная деятельность в логистике; маркетинг; менеджмент; налоги и налогообложение; страховое дело; банковское дело; финансы предприятий; бюджет и бюджетный учет; экономика и бухгалтерский учет"),
    sources: [SPUTNIK, K(532433), M(1929)] },
  { slug: "kolbaev", short: "БАДК", ownership: "state", city: city.bishkek,
    name: { ru: "Бишкекский автомобильно-дорожный колледж им. К. Кольбаева" },
    fields: ["engineering", "it"], address: { ru: "пр. Чингиза Айтматова, 52" }, languages: { ru: "Кыргызский, русский" }, image: PHOTO("kolbaev"),
    programs: list("техническое обслуживание и ремонт автомобильного транспорта; техническая эксплуатация подъемно-транспортных, строительных, дорожных машин и оборудования; организация перевозок и управление на транспорте; строительство и эксплуатация автомобильных дорог и аэродромов; эксплуатация транспортного электрооборудования и автоматики (по видам транспорта); техническое обслуживание средств вычислительной техники и компьютерных сетей; программирование компьютерных сетей; обеспечение безопасности дорожного движения"),
    sources: [SPUTNIK, K(383414), M(1872)] },
  { slug: "kgma-school", short: "Медучилище КГМА", ownership: "state", city: city.bishkek,
    name: { ru: "Медицинское училище при КГМА им. И. К. Ахунбаева" },
    description: { ru: "Медицинское училище в составе Кыргызской государственной медицинской академии им. И. К. Ахунбаева." },
    fields: ["medicine"], address: { ru: "ул. Ахунбаева" }, languages: { ru: "Русский" },
    sources: [M(1997)] },
  { slug: "knau-college", short: "ТЭК КНАУ", ownership: "state", city: city.bishkek,
    name: { ru: "Технико-экономический колледж при КНАУ им. К. И. Скрябина" },
    description: { ru: "Колледж при Кыргызском национальном аграрном университете им. К. И. Скрябина." },
    fields: ["engineering", "economics", "it"], address: { ru: "ул. Медерова, 68" }, languages: { ru: "Кыргызский, русский" }, image: PHOTO("knau-college"),
    programs: list("дизайн компьютерно-графический (по отраслям); технология тепличного хозяйства; электроснабжение (в сельском хозяйстве); организация и безопасность дорожного движения на автомобильном транспорте; электрификация и автоматизация сельского хозяйства; организация перевозок и управление на транспорте; экономика и бухгалтерский учет (по отраслям); финансы (по отраслям); менеджмент (по отраслям); технология производства и переработки сельскохозяйственной продукции; техническое обслуживание средств вычислительной техники и компьютерных сетей"),
    sources: [SPUTNIK, M(1915)] },
  { slug: "arabaev-law", short: "Юрколледж КГУ", ownership: "state", city: city.bishkek,
    name: { ru: "Юридический колледж при КГУ им. И. Арабаева" },
    fields: ["humanities"], address: { ru: "ул. Раззакова, 57" }, languages: { ru: "Кыргызский, русский" },
    sources: [M(2341)] },
  { slug: "uzgen-med", short: "УММК ОшГУ", ownership: "state", city: city.uzgen,
    name: { ru: "Узгенский международный медицинский колледж ОшГУ" },
    description: { ru: "Основан в 2000 году; с 2003 года — медицинский колледж в составе ОшГУ, с 2018 года — международный. Готовит медицинских специалистов среднего звена." },
    fields: ["medicine"], website: "http://umk.oshsu.kg", address: { ru: "ул. Манаса, 215" },
    sources: ["https://oshsu.kg/en/page/119"] },
  { slug: "theater", short: "Театральное училище", ownership: "state", city: city.bishkek,
    name: { ru: "Театральное училище при КНАДТ им. Т. Абдумомунова" },
    description: { ru: "Училище при Кыргызском национальном академическом драматическом театре им. Т. Абдумомунова." },
    fields: ["humanities"], address: { ru: "ул. Абдумомунова, 230" }, languages: { ru: "Кыргызский" },
    sources: [M(2041)] },
];

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v === null || v === undefined ? "null" : `${q(JSON.stringify(v))}::jsonb`);
const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;

const rows = items.map((it, i) =>
  `  (${[
    q(it.slug), q("college"), q(it.short), j(it.name), j(it.city), q(it.ownership), arr(it.fields ?? []), q(it.image),
    j(it.description), j(it.languages), j(it.studyForm), it.tuitionFrom ?? "null", j(localizePrograms(it.programs ?? [])), q(it.website),
    j(it.address), arr(it.sources), i + 1,
  ].join(", ")})`,
);

const sql = `-- Топ-30 колледжей Кыргызстана (среднее профессиональное образование). Сгенерировано scripts/colleges.mjs.
-- Источники каждой записи — колонка sources: рейтинг СПО Минобразования КР (2025), Sputnik «Колледжи Бишкека — 2023»,
-- Kaktus.media «Гид по колледжам», mektep.pro, официальные сайты. Порядок — колонка popularity.
-- tuition_from заполнен только там, где есть данные за 2024/25 учебный год; остальное — null.

insert into public.institutions
  (slug, type, short, name, city, ownership, fields, image, description, languages, study_form, tuition_from, programs, website, address, sources, popularity)
values
${rows.join(",\n")}
on conflict (slug) do update set
  type = excluded.type, short = excluded.short, name = excluded.name, city = excluded.city,
  ownership = excluded.ownership, fields = excluded.fields, image = excluded.image,
  description = excluded.description, languages = excluded.languages, study_form = excluded.study_form,
  tuition_from = excluded.tuition_from, programs = excluded.programs, website = excluded.website,
  address = excluded.address, sources = excluded.sources, popularity = excluded.popularity;
`;
fs.writeFileSync(outFile, sql);
console.log(items.length, "colleges ->", outFile);
