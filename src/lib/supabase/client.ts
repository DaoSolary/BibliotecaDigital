import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseFetch } from "@/lib/supabase/fetch";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  if (!hasSupabaseEnv() && typeof window !== "undefined") {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel: Settings → Environment Variables)."
    );
  }

  browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { fetch: supabaseFetch },
  });

  return browserClient;
}
