import type { Request, Response } from "express";

// Роль нужна фронтенду, чтобы показать вход в админку; доступ всё равно проверяют /admin и RLS
export function get(req: Request, res: Response) {
  const { id, role } = req.user!;
  res.json({ id, role });
}
