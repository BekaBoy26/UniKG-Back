import { supabase } from "../lib/supabase.js";
import { institutionId, institutionIds } from "./institutions.service.js";
import type { AuthUser } from "../middleware/auth.js";

// Все запросы — с токеном пользователя: RLS сама ограничивает список его записями

/** Slug избранных, новые сверху */
export async function list(user: AuthUser) {
  const { data, error } = await supabase(user.token)
    .from("favorites")
    .select("institution:institutions(slug)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as { institution: { slug: string } | null }[]).flatMap((row) => (row.institution ? [row.institution.slug] : []));
}

async function insert(user: AuthUser, ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase(user.token)
    .from("favorites")
    .upsert(ids.map((institution_id) => ({ user_id: user.id, institution_id })), { onConflict: "user_id,institution_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function add(user: AuthUser, slug: string) {
  await insert(user, [await institutionId(slug)]);
}

export async function remove(user: AuthUser, slug: string) {
  const [found] = await institutionIds([slug]);
  if (!found) return;
  const { error } = await supabase(user.token).from("favorites").delete().eq("institution_id", found.id);
  if (error) throw error;
}

/** Переносит избранное гостя (из localStorage) в аккаунт и возвращает итоговый список */
export async function merge(user: AuthUser, slugs: string[]) {
  if (slugs.length) await insert(user, (await institutionIds(slugs)).map((i) => i.id));
  return list(user);
}
