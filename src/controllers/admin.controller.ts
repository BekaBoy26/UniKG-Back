import type { Request, Response } from "express";
import * as service from "../services/admin.service.js";
import * as comments from "../services/comments.service.js";
import { HttpError } from "../lib/http-error.js";
import type { InstitutionType, Localized } from "../services/institutions.service.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{1,80}$/;
const TYPES = ["university", "college"];
const OWNERSHIP = ["state", "private"];
const FIELDS = ["it", "medicine", "engineering", "economics", "humanities", "pedagogy"];
const LANGS = ["ru", "ky", "en"] as const;

const bad = (message: string): never => {
  throw new HttpError(400, message);
};

const id = (value: string) => (UUID.test(value) ? value : bad("Invalid id"));

const text = (value: unknown, name: string, max: number, required = false) => {
  if (value === undefined || value === null || value === "") return required ? bad(`${name} is required`) : null;
  if (typeof value !== "string") return bad(`${name} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) return bad(`${name} is required`);
  if (trimmed.length > max) return bad(`${name} is too long`);
  return trimmed || null;
};

const isUrl = (value: string) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const url = (value: unknown, name: string, allowPath = false) => {
  const v = text(value, name, 1000);
  if (v && !isUrl(v) && !(allowPath && /^\/[\w./-]+$/.test(v))) bad(`${name} must be a link`);
  return v;
};

const int = (value: unknown, name: string, min: number, max: number) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) return bad(`${name} must be an integer ${min}-${max}`);
  return value;
};

/** Объект {ru, ky, en}: пустые языки отбрасываются; без единого значения — null */
function localized(value: unknown, name: string, max: number, requireRu = false): Localized | null {
  if (value === undefined || value === null) return requireRu ? bad(`${name}.ru is required`) : null;
  if (typeof value !== "object" || Array.isArray(value)) return bad(`${name} must be an object`);
  const source = value as Record<string, unknown>;
  const result: Partial<Localized> = {};
  for (const lang of LANGS) {
    const v = text(source[lang], `${name}.${lang}`, max);
    if (v) result[lang] = v;
  }
  if (requireRu && !result.ru) return bad(`${name}.ru is required`);
  return Object.keys(result).length ? (result as Localized) : null;
}

function list<T>(value: unknown, name: string, max: number, item: (v: unknown, i: number) => T | null): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return bad(`${name} must be an array`);
  if (value.length > max) return bad(`${name}: too many items`);
  return value.map(item).filter((v): v is T => v !== null);
}

function institutionInput(body: unknown): service.InstitutionInput {
  if (!body || typeof body !== "object") return bad("Invalid body");
  const b = body as Record<string, unknown>;
  const slug = text(b.slug, "slug", 80, true)!;
  if (!SLUG.test(slug)) bad("slug: only a-z, 0-9 and -");
  if (!TYPES.includes(b.type as string)) bad("Invalid type");
  if (!OWNERSHIP.includes(b.ownership as string)) bad("Invalid ownership");

  return {
    slug,
    type: b.type as InstitutionType,
    short: text(b.short, "short", 40, true)!,
    name: localized(b.name, "name", 300, true)!,
    city: localized(b.city, "city", 120, true)!,
    ownership: b.ownership as "state" | "private",
    fields: [...new Set(list(b.fields, "fields", FIELDS.length, (v) => (FIELDS.includes(v as string) ? (v as string) : bad("Invalid field"))))],
    image: url(b.image, "image", true),
    description: localized(b.description, "description", 5000),
    languages: localized(b.languages, "languages", 300),
    study_form: localized(b.studyForm, "studyForm", 300),
    tuition_from: int(b.tuitionFrom, "tuitionFrom", 0, 10_000_000),
    programs: list(b.programs, "programs", 400, (v, i) => localized(v, `programs[${i}]`, 300)),
    website: url(b.website, "website"),
    address: localized(b.address, "address", 300),
    sources: list(b.sources, "sources", 30, (v) => url(v, "sources")),
    popularity: int(b.popularity, "popularity", 1, 32767),
  };
}

export async function stats(req: Request, res: Response) {
  res.json(await service.stats(req.user!));
}

export async function listInstitutions(req: Request, res: Response) {
  const { type } = req.query;
  if (type !== undefined && !TYPES.includes(type as string)) bad("Invalid type");
  res.json(await service.listInstitutions(req.user!, type as InstitutionType | undefined));
}

export async function getInstitution(req: Request<{ id: string }>, res: Response) {
  res.json(await service.getInstitution(req.user!, id(req.params.id)));
}

export async function createInstitution(req: Request, res: Response) {
  res.status(201).json(await service.createInstitution(req.user!, institutionInput(req.body)));
}

export async function updateInstitution(req: Request<{ id: string }>, res: Response) {
  res.json(await service.updateInstitution(req.user!, id(req.params.id), institutionInput(req.body)));
}

export async function deleteInstitution(req: Request<{ id: string }>, res: Response) {
  await service.deleteInstitution(req.user!, id(req.params.id));
  res.status(204).end();
}

export async function listComments(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) bad("Invalid limit");
  res.json(await service.listComments(req.user!, limit));
}

export async function deleteComment(req: Request<{ id: string }>, res: Response) {
  await comments.remove(req.user!, id(req.params.id));
  res.status(204).end();
}
