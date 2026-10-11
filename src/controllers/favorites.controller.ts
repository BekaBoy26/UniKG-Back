import type { Request, Response } from "express";
import * as service from "../services/favorites.service.js";
import { HttpError } from "../lib/http-error.js";

const SLUG = /^[a-z0-9-]{1,80}$/;
const MAX_MERGE = 200;

const slug = (value: string) => {
  if (!SLUG.test(value)) throw new HttpError(400, "Invalid slug");
  return value;
};

export async function list(req: Request, res: Response) {
  res.json(await service.list(req.user!));
}

export async function add(req: Request<{ slug: string }>, res: Response) {
  await service.add(req.user!, slug(req.params.slug));
  res.status(204).end();
}

export async function remove(req: Request<{ slug: string }>, res: Response) {
  await service.remove(req.user!, slug(req.params.slug));
  res.status(204).end();
}

export async function merge(req: Request, res: Response) {
  const slugs: unknown = req.body?.slugs;
  if (!Array.isArray(slugs) || slugs.length > MAX_MERGE || !slugs.every((s) => typeof s === "string" && SLUG.test(s))) {
    throw new HttpError(400, `slugs must be an array of up to ${MAX_MERGE} slugs`);
  }
  res.json(await service.merge(req.user!, [...new Set(slugs as string[])]));
}
