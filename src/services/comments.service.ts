import { supabase } from "../lib/supabase.js";
import { HttpError } from "../lib/http-error.js";
import type { AuthUser } from "../middleware/auth.js";

type Row = { id: string; user_id: string; body: string; created_at: string; author: { display_name: string | null } | null };

const columns = "id, user_id, body, created_at, author:profiles(display_name)";

// user_id наружу не отдаём — вместо него признак, может ли текущий пользователь удалить комментарий
const toComment = ({ user_id, ...rest }: Row, user?: AuthUser) => ({
  ...rest,
  canDelete: Boolean(user && (user.role === "admin" || user.id === user_id)),
});

async function institutionId(slug: string) {
  const { data, error } = await supabase().from("institutions").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Institution not found");
  return data.id as string;
}

// Комментарии публикуются сразу (status по умолчанию — approved), поэтому показываем только опубликованные.
// Старые сверху, новые снизу — как в переписке
export async function list(slug: string, user?: AuthUser) {
  const id = await institutionId(slug);
  const { data, error } = await supabase()
    .from("comments")
    .select(columns)
    .eq("institution_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as Row[]).map((row) => toComment(row, user));
}

export async function create(user: AuthUser, slug: string, body: string) {
  const id = await institutionId(slug);
  const { data, error } = await supabase(user.token)
    .from("comments")
    .insert({ institution_id: id, user_id: user.id, body })
    .select(columns)
    .single();
  if (error) throw error;
  return toComment(data as unknown as Row, user);
}

// Удалить может автор или админ — это проверяет RLS (политика "delete own or as admin")
export async function remove(user: AuthUser, commentId: string) {
  const { data, error } = await supabase(user.token).from("comments").delete().eq("id", commentId).select("id");
  if (error) throw error;
  if (!data.length) throw new HttpError(404, "Comment not found");
}
