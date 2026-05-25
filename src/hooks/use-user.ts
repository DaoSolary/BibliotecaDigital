"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { obterSessaoCliente } from "@/lib/supabase/auth-client";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const aCarregarPerfil = useRef(false);

  const loadProfile = useCallback(
    async (userId: string) => {
      if (aCarregarPerfil.current) return;
      aCarregarPerfil.current = true;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, phone, role, is_blocked, created_at, updated_at")
          .eq("id", userId)
          .single();
        setProfile(data);
        return data;
      } finally {
        aCarregarPerfil.current = false;
      }
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const aplicarSessao = async (sessionUser: User | null) => {
      if (!mounted) return;
      setUser(sessionUser);
      if (sessionUser) {
        await loadProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    };

    obterSessaoCliente(supabase).then((session) => {
      aplicarSessao(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        loadProfile(sessionUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  return { user, profile, loading, isAdmin: profile?.role === "admin" };
}
