// Парсер 2020.edu.gov.kg/reports — официальные прейскуранты вузов (МНВОИ КР)
import fs from "node:fs";

const out = process.argv[2];
const ids = [...new Set([...fs.readFileSync(process.argv[3], "utf8").matchAll(/reports\?id_university=(\d+)/g)].map((m) => m[1]))];

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const result = {};
for (const id of ids) {
  let html;
  try {
    const res = await fetch(`https://2020.edu.gov.kg/reports?id_university=${id}`, { headers: { "User-Agent": "Mozilla/5.0" } });
    html = await res.text();
  } catch (e) {
    console.error(id, "fetch failed", e.message);
    continue;
  }
  const name = clean(html.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/)?.[1] ?? "");
  const address = clean(html.match(/Адрес:([\s\S]*?)<\/(?:p|div|span)>/)?.[1] ?? "");
  const site = clean(html.match(/Сайт:([\s\S]*?)<\/(?:p|div|span|a)>/)?.[1] ?? "");
  const rows = [];
  const re = /class="cell\s+sm-text">(\d{6})<\/div>\s*<div class="cell napr sm-text">([\s\S]*?)<span[\s\S]*?<div class="cell oplata sm-text">([^<]*)<\/div>\s*<div class="cell oplata sm-text">([^<]*)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    const text = clean(m[2]);
    const form = text.match(/\(([^()]*)\)\s*$/)?.[1]?.trim() ?? "";
    const direction = text.replace(/\s*\[[\s\S]*$/, "").trim();
    const profile = text.match(/\[([^\]]*)\]/)?.[1]?.trim() ?? "";
    rows.push({ code: m[1], direction, profile, form, pay: m[3].trim(), amount: Number(m[4].trim()) || null });
  }
  result[id] = { name, address, site, rows };
  console.error(id, name.slice(0, 60), rows.length);
}
fs.writeFileSync(out, JSON.stringify(result, null, 1));
