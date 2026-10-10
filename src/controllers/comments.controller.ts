import type { Request, Response } from "express";
import * as service from "../services/comments.service.js";
import { HttpError } from "../lib/http-error.js";

const statuses: unknown[] = ["pending", "approved", "rejected"];
const MAX_LENGTH = 2000;

export async function list(req: Request<{ slug: string }>, res: Response) {
  res.json(await service.listApproved(req.params.slug));
}

export async function create(req: Request<{ slug: string }>, res: Response) {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body || body.length > MAX_LENGTH) throw new HttpError(400, `Comment must be 1-${MAX_LENGTH} characters`);
  const user = req.user!;
  res.status(201).json(await service.create(user.token, user.id, req.params.slug, body));
}

export async function moderationQueue(req: Request, res: Response) {
  const status = req.query.status ?? "pending";
  if (!statuses.includes(status)) throw new HttpError(400, "Invalid status");
  res.json(await service.listByStatus(req.user!.token, status as service.CommentStatus));
}

export async function moderate(req: Request<{ id: string }>, res: Response) {
  const status = req.body?.status;
  if (status !== "approved" && status !== "rejected") throw new HttpError(400, "Status must be approved or rejected");
  res.json(await service.setStatus(req.user!.token, req.params.id, status));
}
