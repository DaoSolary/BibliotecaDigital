"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, phone, role, is_blocked, created_at")
        .eq("id", userId)
        .single();
      setProfile(data);
      return data;
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(authUser ?? null);

      if (authUser) {
        await loadProfile(authUser.id);
      } else {
        setProfile(null);
      }

      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      supabase.auth.getUser().then(({ data: { user: authUser } }) => {
        if (!mounted) return;
        setUser(authUser ?? null);
        if (authUser) {
          loadProfile(authUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  return { user, profile, loading, isAdmin: profile?.role === "admin" };
}
