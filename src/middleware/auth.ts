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

// Токен — access token из Supabase Auth, фронтенд передаёт его в заголовке Authorization
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, "Unauthorized");

  const db = supabase(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Unauthorized");

  const { data: profile } = await db.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  req.user = { id: data.user.id, role: profile?.role === "admin" ? "admin" : "user", token };
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") throw new HttpError(403, "Forbidden");
  next();
}
