import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";

// Простой лимит запросов в памяти процесса (на пользователя, иначе на IP)
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.user?.id ?? req.ip ?? "anonymous";
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) throw new HttpError(429, "Too many requests");
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
