// Переводы названий программ (program-i18n.json): ключ — исходное название (ru, иначе ky, иначе en), значение — недостающие языки.
// localizePrograms — для seed.mjs/colleges.mjs; запуск напрямую печатает SQL, который дополняет переводы в уже залитой БД:
//   node scripts/program-i18n.mjs   (вывод — SQL, применить в SQL Editor)
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dict = JSON.parse(fs.readFileSync(new URL("./program-i18n.json", import.meta.url), "utf8"));

/** Дополняет каждую программу недостающими языками; уже заполненные значения не меняются */
export function localizePrograms(programs) {
  return programs.map((p) => {
    const extra = (p.ru && dict.ru[p.ru]) || (!p.ru && p.ky && dict.ky[p.ky]) || (!p.ru && !p.ky && p.en && dict.en[p.en]) || {};
    return { ...extra, ...p };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
  const rows = Object.entries(dict).flatMap(([lang, names]) =>
    Object.entries(names).map(([name, tr]) => `  (${q(lang)}, ${q(name)}, ${q(JSON.stringify(tr))}::jsonb)`),
  );
  process.stdout.write(`-- Переводы названий программ (сгенерировано scripts/program-i18n.mjs из program-i18n.json).
-- Дополняет только недостающие языки: значения, уже записанные в БД (в т.ч. правки из админки), не меняются.
with dict (lang, name, tr) as (values
${rows.join(",\n")}
)
update public.institutions i
set programs = (
  select jsonb_agg(coalesce(d.tr, '{}'::jsonb) || e.value order by e.ord)
  from jsonb_array_elements(i.programs) with ordinality as e (value, ord)
  left join lateral (
    select dict.tr from dict
    where (dict.lang = 'ru' and dict.name = e.value ->> 'ru')
       or (dict.lang = 'ky' and not e.value ? 'ru' and dict.name = e.value ->> 'ky')
       or (dict.lang = 'en' and not e.value ? 'ru' and not e.value ? 'ky' and dict.name = e.value ->> 'en')
    limit 1
  ) d on true
)
where jsonb_array_length(i.programs) > 0;
`);
}
