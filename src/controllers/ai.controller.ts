import type { Request, Response } from "express";
import * as service from "../services/ai.service.js";
import * as chats from "../services/ai-chats.service.js";
import { HttpError } from "../lib/http-error.js";

const MAX_MESSAGES = 20;
// В базе храним только последние сообщения чата (ограничение ai_chats_messages_size — 200)
const MAX_STORED = 100;
const MAX_LENGTH = 2000;
const langs: unknown[] = ["ru", "ky", "en"];
/** Текст ошибки, по которому фронтенд отличает дневной лимит от минутного */
const DAILY_LIMIT = "Daily AI limit reached";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function chatId(value: unknown) {
  if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, "Invalid chat id");
  return value;
}

// Новое сообщение в чат. История берётся из базы (chatId), без chatId создаётся новый чат
export async function chat(req: Request, res: Response) {
  const { message, lang } = req.body ?? {};
  const text = typeof message === "string" ? message.trim() : "";
  if (!text || text.length > MAX_LENGTH) throw new HttpError(400, `Message must be 1-${MAX_LENGTH} characters`);
  const id = req.body?.chatId == null ? null : chatId(req.body.chatId);
  const token = req.user!.token;
  if (!(await chats.takeQuota(token))) throw new HttpError(429, DAILY_LIMIT);

  const stored = id ? (await chats.get(token, id)).messages : [];
  // Берём последние сообщения: история для модели не должна расти бесконечно
  const history: service.ChatMessage[] = [...stored.map(({ role, text }) => ({ role, text })), { role: "user" as const, text }].slice(-MAX_MESSAGES);
  // Gemini ожидает, что диалог начинается с пользователя
  while (history[0].role !== "user") history.shift();

  const result = await service.chat(history, langs.includes(lang) ? lang : "ru");
  const all: chats.StoredMessage[] = [...stored, { role: "user", text }, { role: "model", text: result.reply, links: result.institutions }];
  const messages = all.slice(-MAX_STORED);
  if (id) await chats.update(token, id, messages);
  res.json({ ...result, chatId: id ?? (await chats.create(token, messages)) });
}

export async function listChats(req: Request, res: Response) {
  res.json(await chats.list(req.user!.token));
}

export async function getChat(req: Request<{ id: string }>, res: Response) {
  res.json(await chats.get(req.user!.token, chatId(req.params.id)));
}

export async function deleteChat(req: Request<{ id: string }>, res: Response) {
  await chats.remove(req.user!.token, chatId(req.params.id));
  res.status(204).end();
}
