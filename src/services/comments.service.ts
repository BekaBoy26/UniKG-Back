import { supabase } from "../lib/supabase.js";
import { HttpError } from "../lib/http-error.js";

export type CommentStatus = "pending" | "approved" | "rejected";

const columns = "id, institution_id, body, status, created_at, author:profiles(display_name)";

async function institutionId(slug: string) {
  const { data, error } = await supabase().from("institutions").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Institution not found");
  return data.id as string;
}

export async function listApproved(slug: string) {
  const id = await institutionId(slug);
  const { data, error } = await supabase()
    .from("comments")
    .select(columns)
    .eq("institution_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Новый комментарий всегда уходит на модерацию (status = pending по умолчанию)
export async function create(token: string, userId: string, slug: string, body: string) {
  const id = await institutionId(slug);
  const { data, error } = await supabase(token)
    .from("comments")
    .insert({ institution_id: id, user_id: userId, body })
    .select(columns)
    .single();
  if (error) throw error;
  return data;
}

export async function listByStatus(token: string, status: CommentStatus) {
  const { data, error } = await supabase(token)
    .from("comments")
    .select(`${columns}, institution:institutions(slug, short)`)
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function setStatus(token: string, id: string, status: CommentStatus) {
  const { data, error } = await supabase(token)
    .from("comments")
    .update({ status })
    .eq("id", id)
    .select(columns)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Comment not found");
  return data;
}
