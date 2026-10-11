import { supabase } from "../lib/supabase.js";
import { HttpError } from "../lib/http-error.js";

export type Localized = { ru: string; ky?: string; en?: string };
export type InstitutionType = "university" | "college";

export type Institution = {
  id: string;
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
  studyForm: Localized | null;
  /** Минимальная стоимость контракта, сом в год. null — неизвестно */
  tuitionFrom: number | null;
  /** Названия направлений; часть есть только на кыргызском (из госпортала) */
  programs: Partial<Localized>[];
  website: string | null;
  address: Localized | null;
  /** Ссылки на открытые источники данных */
  sources: string[];
};

type Row = Omit<Institution, "studyForm" | "tuitionFrom"> & {
  study_form: Localized | null;
  tuition_from: number | null;
};

const columns =
  "id, slug, type, short, name, city, ownership, fields, image, description, languages, study_form, tuition_from, programs, website, address, sources";

const toInstitution = ({ study_form, tuition_from, ...rest }: Row): Institution => ({
  ...rest,
  studyForm: study_form,
  tuitionFrom: tuition_from,
});

export async function listInstitutions(type?: InstitutionType) {
  // Сначала по популярности (popularity: меньше — выше), остальные — по названию
  let query = supabase()
    .from("institutions")
    .select(columns)
    .order("popularity", { ascending: true, nullsFirst: false })
    .order("short");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Row[]).map(toInstitution);
}

export type SearchParams = {
  query?: string;
  type?: InstitutionType;
  city?: string;
  field?: string;
  ownership?: "state" | "private";
  maxTuition?: number;
  limit?: number;
};

export async function searchInstitutions(p: SearchParams) {
  const { data, error } = await supabase().rpc("search_institutions", {
    q: p.query?.replace(/[%_\\]/g, "").trim() || null,
    p_type: p.type ?? null,
    p_city: p.city?.replace(/[%_\\]/g, "").trim() || null,
    p_field: p.field ?? null,
    p_ownership: p.ownership ?? null,
    p_max_tuition: p.maxTuition ?? null,
    p_limit: p.limit ?? 10,
  });
  if (error) throw error;
  return (data as Row[]).map(toInstitution);
}

export async function findInstitution(slug: string) {
  const { data, error } = await supabase().from("institutions").select(columns).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toInstitution(data as Row) : null;
}

export async function getInstitution(slug: string) {
  const item = await findInstitution(slug);
  if (!item) throw new HttpError(404, "Institution not found");
  return item;
}

/** slug → id учебных заведений (несуществующие slug пропускаются) — для комментариев и избранного */
export async function institutionIds(slugs: string[]) {
  const { data, error } = await supabase().from("institutions").select("id, slug").in("slug", slugs);
  if (error) throw error;
  return data as { id: string; slug: string }[];
}

/** id учебного заведения по slug; нет такого — 404 */
export async function institutionId(slug: string) {
  const [found] = await institutionIds([slug]);
  if (!found) throw new HttpError(404, "Institution not found");
  return found.id;
}
