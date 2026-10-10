import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { HttpError } from "./http-error.js";

// Бэкенд работает с публичным ключом: доступ к данным ограничивает RLS.
// С токеном пользователя запросы выполняются от его имени.
export function supabase(accessToken?: string): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseKey) throw new HttpError(500, "Supabase is not configured");
  return createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
