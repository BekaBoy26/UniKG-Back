import type { NextFunction, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { HttpError } from "../lib/http-error.js";

export type AuthUser = { id: string; role: "user" | "admin"; token: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const bearer = (req: Request) => req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

// Токен — access token из Supabase Auth, фронтенд передаёт его в заголовке Authorization
async function resolveUser(token: string): Promise<AuthUser | null> {
  const db = supabase(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  // Колонка role закрыта от API (миграция 0012) — свою роль отдаёт функция my_role()
  const { data: role } = await db.rpc("my_role");
  return { id: data.user.id, role: role === "admin" ? "admin" : "user", token };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearer(req);
  const user = token ? await resolveUser(token) : null;
  if (!user) throw new HttpError(401, "Unauthorized");
  req.user = user;
  next();
}

// Вход не обязателен: с валидным токеном заполняет req.user, иначе запрос идёт как гостевой
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearer(req);
  if (token) req.user = (await resolveUser(token)) ?? undefined;
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") throw new HttpError(403, "Forbidden");
  next();
}
