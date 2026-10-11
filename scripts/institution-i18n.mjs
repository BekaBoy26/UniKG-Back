// Переводы полей учебных заведений (institution-i18n.json): название, описание и адрес — по slug,
// языки и форма обучения — общие фразы по русскому значению. Заполняются только недостающие языки.
// localize — для seed.mjs/colleges.mjs; запуск напрямую печатает SQL для уже залитой БД:
//   node scripts/institution-i18n.mjs   (вывод — SQL, применить в SQL Editor)
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dict = JSON.parse(fs.readFileSync(new URL("./institution-i18n.json", import.meta.url), "utf8"));

/** Дополняет локализованное значение поля (name, description, address, languages, study_form) недостающими языками */
export function localize(slug, field, value) {
  if (!value) return value ?? null;
  const extra = field in dict.phrases ? dict.phrases[field][value.ru] : dict.bySlug[slug]?.[field];
  return { ...extra, ...value };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const json = JSON.stringify(dict).replace(/\$j\$/g, "");
  const bySlug = (f) => `${f} = case when i.${f} is null then null else coalesce(d.j -> 'bySlug' -> i.slug -> '${f}', '{}') || i.${f} end`;
  const phrase = (f) => `${f} = case when i.${f} is null then null else coalesce(d.j -> 'phrases' -> '${f}' -> (i.${f} ->> 'ru'), '{}') || i.${f} end`;
  process.stdout.write(`-- Переводы названий, описаний, адресов, языков и формы обучения (сгенерировано scripts/institution-i18n.mjs).
-- Дополняет только недостающие языки: уже записанные значения (в т.ч. правки из админки) не меняются.
with d (j) as (select $j$${json}$j$::jsonb)
update public.institutions i set
  ${bySlug("name")},
  ${bySlug("description")},
  ${bySlug("address")},
  ${phrase("languages")},
  ${phrase("study_form")}
from d;
`);
}
