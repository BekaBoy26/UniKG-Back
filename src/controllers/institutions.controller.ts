import type { Request, Response } from "express";
import * as service from "../services/institutions.service.js";
import { HttpError } from "../lib/http-error.js";

const types: unknown[] = ["university", "college"];

export async function list(req: Request, res: Response) {
  const { type } = req.query;
  if (type !== undefined && !types.includes(type)) throw new HttpError(400, "Invalid type");
  res.json(await service.listInstitutions(type as service.InstitutionType | undefined));
}

export async function getBySlug(req: Request<{ slug: string }>, res: Response) {
  res.json(await service.getInstitution(req.params.slug));
}
