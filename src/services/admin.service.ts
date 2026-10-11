import { supabase } from "../lib/supabase.js";
import { HttpError } from "../lib/http-error.js";
import type { AuthUser } from "../middleware/auth.js";
import type { InstitutionType, Localized } from "./institutions.service.js";

// Все запросы — с токеном админа: права на запись проверяет RLS (политики "admins … institutions")

/** Данные учебного заведения в формате таблицы (snake_case), уже проверенные контроллером */
export type InstitutionInput = {
  slug: string;
  type: InstitutionType;
  short: string;
  name: Localized;
  city: Localized;
  ownership: "state" | "private";
  fields: string[];
  image: string | null;
  description: Localized | null;
  languages: Localized | null;
  study_form: Localized | null;
  tuition_from: number | null;
  programs: Partial<Localized>[];
  website: string | null;
  address: Localized | null;
  sources: string[];
  popularity: number | null;
};

type Row = InstitutionInput & { id: string; updated_at: string };

const columns =
  "id, slug, type, short, name, city, ownership, fields, image, description, languages, study_form, tuition_from, programs, website, address, sources, popularity, updated_at";

const toAdminInstitution = ({ study_form, tuition_from, updated_at, ...rest }: Row) => ({
  ...rest,
  studyForm: study_form,
  tuitionFrom: tuition_from,
  updatedAt: updated_at,
});

// Повтор slug — понятная ошибка вместо 500
const fail = (error: { code?: string }) => {
  if (error.code === "23505") throw new HttpError(409, "Slug already exists");
  throw error;
};

const count = async (user: AuthUser, table: string, filter?: [string, string]) => {
  let query = supabase(user.token).from(table).select("*", { count: "exact", head: true });
  if (filter) query = query.eq(...filter);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
};

export async function stats(user: AuthUser) {
  const [universities, colleges, comments, users] = await Promise.all([
    count(user, "institutions", ["type", "university"]),
    count(user, "institutions", ["type", "college"]),
    count(user, "comments"),
    count(user, "profiles"),
  ]);
  return { universities, colleges, comments, users };
}

export async function listInstitutions(user: AuthUser, type?: InstitutionType) {
  let query = supabase(user.token)
    .from("institutions")
    .select(columns)
    .order("popularity", { ascending: true, nullsFirst: false })
    .order("short");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Row[]).map(toAdminInstitution);
}

export async function getInstitution(user: AuthUser, id: string) {
  const { data, error } = await supabase(user.token).from("institutions").select(columns).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Institution not found");
  return toAdminInstitution(data as Row);
}

export async function createInstitution(user: AuthUser, input: InstitutionInput) {
  const { data, error } = await supabase(user.token).from("institutions").insert(input).select(columns).single();
  if (error) fail(error);
  return toAdminInstitution(data as Row);
}

export async function updateInstitution(user: AuthUser, id: string, input: InstitutionInput) {
  const { data, error } = await supabase(user.token).from("institutions").update(input).eq("id", id).select(columns);
  if (error) fail(error);
  if (!data?.length) throw new HttpError(404, "Institution not found");
  return toAdminInstitution(data[0] as Row);
}

// Комментарии удаляются вместе с заведением (on delete cascade)
export async function deleteInstitution(user: AuthUser, id: string) {
  const { data, error } = await supabase(user.token).from("institutions").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data.length) throw new HttpError(404, "Institution not found");
}

export async function listComments(user: AuthUser, limit: number) {
  const { data, error } = await supabase(user.token)
    .from("comments")
    .select("id, body, created_at, author:profiles(display_name), institution:institutions(slug, short, type)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
