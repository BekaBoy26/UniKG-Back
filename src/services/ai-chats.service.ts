import { supabase } from "../lib/supabase.js";
import { HttpError } from "../lib/http-error.js";

export type ChatLink = { slug: string; short: string; name: string | null; city: string | null };
export type StoredMessage = { role: "user" | "model"; text: string; links?: ChatLink[] };

const TITLE_LENGTH = 80;
const MAX_CHATS = 50;

// Все запросы — с токеном пользователя: RLS отдаёт и меняет только его чаты

export async function list(token: string) {
  const { data, error } = await supabase(token)
    .from("ai_chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_CHATS);
  if (error) throw error;
  return data;
}

export async function get(token: string, id: string) {
  const { data, error } = await supabase(token)
    .from("ai_chats")
    .select("id, title, messages, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Chat not found");
  return data as { id: string; title: string; messages: StoredMessage[]; updated_at: string };
}

export async function create(token: string, messages: StoredMessage[]) {
  const first = messages.find((m) => m.role === "user")?.text ?? "";
  const title = first.length > TITLE_LENGTH ? `${first.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : first;
  const { data, error } = await supabase(token).from("ai_chats").insert({ title, messages }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function update(token: string, id: string, messages: StoredMessage[]) {
  const { error } = await supabase(token).from("ai_chats").update({ messages }).eq("id", id);
  if (error) throw error;
}

export async function remove(token: string, id: string) {
  const { data, error } = await supabase(token).from("ai_chats").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data.length) throw new HttpError(404, "Chat not found");
}
