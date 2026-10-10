import type { Request, Response } from "express";
import * as service from "../services/comments.service.js";
import { HttpError } from "../lib/http-error.js";

const MAX_LENGTH = 2000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function list(req: Request<{ slug: string }>, res: Response) {
  res.json(await service.list(req.params.slug, req.user));
}

export async function create(req: Request<{ slug: string }>, res: Response) {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body || body.length > MAX_LENGTH) throw new HttpError(400, `Comment must be 1-${MAX_LENGTH} characters`);
  res.status(201).json(await service.create(req.user!, req.params.slug, body));
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  if (!UUID.test(req.params.id)) throw new HttpError(400, "Invalid comment id");
  await service.remove(req.user!, req.params.id);
  res.status(204).end();
}
