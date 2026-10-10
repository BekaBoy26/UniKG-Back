import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Not found"));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Ошибки самого Express (например, битый JSON в теле) приходят со своим status
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    res.status(status).json({ error: "Bad request" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
