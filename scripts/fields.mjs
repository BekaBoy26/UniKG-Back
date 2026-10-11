// Направления (fields) по названиям программ. Шесть исходных (it … pedagogy) проставлены по кодам специальностей госпортала,
// остальные выводятся из русских названий программ — только если такая программа реально есть в учебном заведении.
// deriveFields — для seed.mjs/colleges.mjs; запуск напрямую печатает SQL для уже залитой БД:
//   node scripts/fields.mjs > supabase/institution_fields.sql
import { fileURLToPath } from "node:url";

/** Порядок направлений (как в фильтре каталога) */
export const FIELD_ORDER = [
  "it", "medicine", "engineering", "construction", "transport", "economics", "law", "social",
  "humanities", "languages", "media", "arts", "natural", "agriculture", "pedagogy", "tourism",
];

/** Регулярные выражения (без учёта регистра) по названию программы на русском; синтаксис совместим с JS и Postgres */
export const FIELD_RULES = {
  construction: "архитект|строител|геодез|землеустрой|кадастр|газоснабж|водоснабж|санитарно-техн|тоннел|аэродром|гидротехн|стоимостной инжиниринг|неметаллическ",
  transport: "транспорт|перевоз|логист|летательн|воздушн|судов|подвижной состав|дорожного движения|беспилот",
  law: "юриспруд|правовед|судебн|таможен|(^|[ -])право([ ,]|$)",
  social: "психолог|социолог|политолог|социальная работа|социальные науки|международные отношения|регионовед|востоковед|американист|европеист|китаевед|антрополог|государственное и муниципальное|сравнительная политика",
  // «(на английском языке)» в названии — язык обучения, а не направление, поэтому без общего «язык»
  languages: "язык и литература|иностранные языки|английского языка|государственный язык|лингвист|перевод|филолог|тюрколог",
  media: "журналист|реклам|с общественностью|медиа|телевиден|кинематограф|кинооператор",
  arts: "дизайн|искусств|художествен|живопис|графика|музык|театр|костюм|текстил|творчеств",
  natural: "биолог|химия|^физика|математик|географ|геолог|эколог|биотехнолог|гидрометео|климат|естественнонауч|физико-математ",
  agriculture: "агро|сельскохоз|ветеринар|растени|плодоовощ|садовод|пастбищ|лесн|рыболов|аквакульт|теплич|животного происхождения|растительного сырья",
  tourism: "туризм|турист|гостинич|гостиниц|общественного питания",
};

const compiled = Object.entries(FIELD_RULES).map(([field, re]) => [field, new RegExp(re, "i")]);

/** Исходные направления + выведенные из программ, в порядке FIELD_ORDER */
export function deriveFields(fields, programs) {
  const names = programs.map((p) => p.ru ?? "").filter(Boolean);
  const result = new Set(fields);
  for (const [field, re] of compiled) if (names.some((n) => re.test(n))) result.add(field);
  return FIELD_ORDER.filter((f) => result.has(f));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
  const rules = Object.entries(FIELD_RULES).map(([f, re]) => `    (${q(f)}, ${q(re)})`).join(",\n");
  process.stdout.write(`-- Направления по названиям программ (сгенерировано scripts/fields.mjs). Уже проставленные направления сохраняются.
update public.institutions i
set fields = array(
  select o.f from unnest(array[${FIELD_ORDER.map(q).join(", ")}]) with ordinality as o (f, n)
  where o.f = any (i.fields) or exists (
    select 1
    from jsonb_array_elements(i.programs) e,
    (values
${rules}
    ) as r (field, re)
    where r.field = o.f and coalesce(e.value ->> 'ru', '') ~* r.re
  )
  order by o.n
);
`);
}
