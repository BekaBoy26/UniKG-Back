import { env } from "../config/env.js";
import { FIELDS } from "../lib/fields.js";
import { HttpError } from "../lib/http-error.js";
import {
  findInstitution,
  searchInstitutions,
  type Institution,
  type Localized,
  type SearchParams,
} from "./institutions.service.js";

type Lang = "ru" | "ky" | "en";
export type ChatMessage = { role: "user" | "model"; text: string };

type Part = { text?: string; functionCall?: { name: string; args?: Record<string, unknown> }; [key: string]: unknown };
type Content = { role: "user" | "model"; parts: Part[] };

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_TOOL_ROUNDS = 5;
const REQUEST_TIMEOUT_MS = 25_000;

const langNames: Record<Lang, string> = { ru: "русском", ky: "кыргызском", en: "английском" };

const systemPrompt = (lang: Lang) => `Ты — UniKG AI, справочный помощник по университетам и колледжам Кыргызстана.
Отвечай на ${langNames[lang]} языке.

Что ты делаешь:
- Только рассказываешь об университетах и колледжах из базы UniKG и помогаешь выбрать учебное заведение: стоимость, программы, адреса, языки обучения, форма собственности, сайт.
- У тебя есть доступ на чтение ко всей базе через инструменты search_institutions и get_institution. Ничего не изменяешь, не отправляешь, не регистрируешь и не выполняешь действия за пользователя — только передаёшь информацию.

Тема:
- На вопросы не про университеты, колледжи и поступление (погода, код, шутки, политика, домашние задания и т. п.) не отвечай по существу: одной фразой скажи, что помогаешь только с выбором учебного заведения, и предложи спросить об этом.

Факты:
- Факты бери ТОЛЬКО из инструментов. Не выдумывай. Если поля нет (null или пусто) — так и скажи: «нет данных», и посоветуй уточнить на официальном сайте.
- tuitionFrom — минимальная стоимость очного контракта в сомах за год; 0 — обучение бесплатное.
- Названия программ могут быть на кыргызском — это официальные названия из госпортала.
- Не упоминай технические названия полей (tuitionFrom, slug и т. п.).

Формат ответа — коротко:
- Не больше 5–7 строк. Без вступлений, повторов вопроса и длинных пояснений.
- Главное выделяй жирным через **…**: название, адрес, стоимость, форма собственности, языки, сайт. Другую разметку (#, таблицы, ссылки в скобках) не используй.
- Об одном заведении — так:
**КРСУ** — Кыргызско-Российский Славянский университет
- Город и адрес: **Бишкек, ул. Киевская, 44**
- Стоимость: **от 110 000 сом/год**
- Форма: **государственный**
- Несколько заведений — по одной строке на каждое: «- **Сокращение** — город, стоимость».
- Свою рекомендацию, если она нужна, дай одной короткой строкой в конце.
- Не проси и не сохраняй персональные данные.`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "search_institutions",
        description:
          "Поиск университетов и колледжей Кыргызстана в базе UniKG. Все параметры необязательны; без параметров вернёт первые записи.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Одно ключевое слово: часть названия, аббревиатура (КГТУ, АУЦА) или направление/программа (информатика, медицина, юриспруденция). Не передавай целые предложения.",
            },
            type: { type: "string", enum: ["university", "college"] },
            city: { type: "string", description: "Город, например Бишкек, Ош, Каракол, Нарын" },
            field: { type: "string", enum: FIELDS, description: "Укрупнённое направление" },
            ownership: { type: "string", enum: ["state", "private"] },
            maxTuition: { type: "integer", description: "Максимальная стоимость, сом в год" },
            limit: { type: "integer", description: "Сколько записей вернуть (1-30), по умолчанию 10" },
          },
        },
      },
      {
        name: "get_institution",
        description: "Полная информация об одном учебном заведении по slug (из результатов поиска).",
        parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
      },
    ],
  },
];

const pick = (value: Partial<Localized> | null | undefined, lang: Lang) =>
  value ? (value[lang] ?? value.ru ?? value.ky ?? value.en ?? null) : null;

const summary = (i: Institution, lang: Lang) => ({
  slug: i.slug,
  short: i.short,
  name: pick(i.name, lang),
  type: i.type,
  city: pick(i.city, lang),
  ownership: i.ownership,
  fields: i.fields,
  tuitionFrom: i.tuitionFrom,
});

const details = (i: Institution, lang: Lang) => ({
  ...summary(i, lang),
  description: pick(i.description, lang),
  languages: pick(i.languages, lang),
  studyForm: pick(i.studyForm, lang),
  programs: i.programs.map((p) => pick(p, lang)).filter(Boolean),
  website: i.website,
  address: pick(i.address, lang),
});

async function runTool(name: string, args: Record<string, unknown>, lang: Lang, seen: Map<string, Institution>) {
  if (name === "search_institutions") {
    const params: SearchParams = {
      query: typeof args.query === "string" ? args.query : undefined,
      type: args.type === "university" || args.type === "college" ? args.type : undefined,
      city: typeof args.city === "string" ? args.city : undefined,
      field: typeof args.field === "string" && FIELDS.includes(args.field) ? args.field : undefined,
      ownership: args.ownership === "state" || args.ownership === "private" ? args.ownership : undefined,
      maxTuition: typeof args.maxTuition === "number" ? args.maxTuition : undefined,
      limit: typeof args.limit === "number" ? args.limit : undefined,
    };
    const items = await searchInstitutions(params);
    items.forEach((i) => seen.set(i.slug, i));
    return { count: items.length, items: items.map((i) => summary(i, lang)) };
  }
  if (name === "get_institution") {
    const item = typeof args.slug === "string" ? await findInstitution(args.slug) : null;
    if (!item) return { error: "not_found" };
    seen.set(item.slug, item);
    return details(item, lang);
  }
  return { error: "unknown_tool" };
}

async function generate(contents: Content[], lang: Lang): Promise<Content> {
  let lastError = "";
  for (const model of env.geminiModels) {
    let res: globalThis.Response;
    try {
      res = await fetch(`${API}/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": env.geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
          contents,
          tools,
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
        // Зависшая модель не должна держать запрос пользователя — по таймауту пробуем следующую
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
      continue;
    }
    if (res.ok) {
      const json = (await res.json()) as { candidates?: { content?: Content }[] };
      const content = json.candidates?.[0]?.content;
      if (content?.parts?.length) return { role: "model", parts: content.parts };
      lastError = `${model}: empty response`;
      continue;
    }
    lastError = `${model}: ${res.status} ${(await res.text()).slice(0, 300)}`;
    // Перегрузка, лимиты или недоступная модель — пробуем следующую
    if (![404, 429, 500, 503].includes(res.status)) break;
  }
  console.error("Gemini error:", lastError);
  throw new HttpError(503, "AI is temporarily unavailable");
}

export async function chat(messages: ChatMessage[], lang: Lang) {
  if (!env.geminiKey || !env.geminiModels.length) throw new HttpError(500, "AI is not configured");

  const contents: Content[] = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  const seen = new Map<string, Institution>();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const reply = await generate(contents, lang);
    // Ответ модели возвращаем в историю целиком (включая thought signatures)
    contents.push(reply);

    const calls = reply.parts.filter((p) => p.functionCall);
    if (!calls.length || round === MAX_TOOL_ROUNDS) {
      const text = reply.parts.map((p) => p.text ?? "").join("").trim();
      // Ссылки на учебные заведения, которые упомянуты в ответе
      const institutions = [...seen.values()]
        .filter((i) => text.includes(i.short) || text.includes(pick(i.name, lang) ?? "\u0000"))
        .slice(0, 6)
        .map((i) => ({ slug: i.slug, short: i.short, name: pick(i.name, lang), city: pick(i.city, lang) }));
      return { reply: text, institutions };
    }

    const responses = await Promise.all(
      calls.map(async ({ functionCall }) => ({
        functionResponse: {
          name: functionCall!.name,
          response: { result: await runTool(functionCall!.name, functionCall!.args ?? {}, lang, seen) },
        },
      })),
    );
    contents.push({ role: "user", parts: responses });
  }
  throw new HttpError(503, "AI is temporarily unavailable");
}
