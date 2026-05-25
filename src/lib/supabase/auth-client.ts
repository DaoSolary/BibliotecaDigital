import type { Session, SupabaseClient } from "@supabase/supabase-js";

function isRateLimit(error: { message?: string; status?: number } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return error.status === 429 || msg.includes("rate limit") || msg.includes("too many requests");
}

/** Sessão no browser sem disparar getUser() extra (evita 429 no refresh_token) */
export async function obterSessaoCliente(
  supabase: SupabaseClient
): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error && isRateLimit(error)) {
    await supabase.auth.signOut({ scope: "local" });
    return null;
  }

  return data.session ?? null;
}
