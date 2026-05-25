"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProfileView } from "@/components/profile/profile-view";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { ReadingListSlug } from "@/types/reading";

export function PerfilPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [readingHistory, setReadingHistory] = useState<
    Array<{
      id: string;
      book_id: string;
      progress_percent: number;
      reading_time_seconds: number;
      last_read_at: string;
      current_page?: number;
      total_pages?: number;
      book?: { id: string; title: string; cover_url: string | null; author?: string } | null;
    }>
  >([]);
  const [listStatusByBook, setListStatusByBook] = useState<Record<string, ReadingListSlug>>({});
  const [stats, setStats] = useState({
    favoritesCount: 0,
    booksReadCount: 0,
    listCounts: { queroLer: 0, lendo: 0, finalizados: 0 },
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login?redirect=/perfil");
        return;
      }
      const userId = user.id;

      const [
        profileRes,
        historyRes,
        favoritesRes,
        listsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("reading_progress")
          .select(
            "id, book_id, progress_percent, reading_time_seconds, last_read_at, current_page, total_pages, book:books(id, title, cover_url, author)"
          )
          .eq("user_id", userId)
          .order("last_read_at", { ascending: false })
          .limit(20),
        supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase
          .from("reading_lists")
          .select("id, slug, items:reading_list_items(book_id)")
          .eq("user_id", userId),
      ]);

      setProfile(profileRes.data);
      const history = (historyRes.data ?? []).map((row) => {
        const book = row.book;
        const bookObj = Array.isArray(book) ? book[0] ?? null : book ?? null;
        return { ...row, book: bookObj };
      });
      setReadingHistory(history);
      setStats((s) => ({
        ...s,
        favoritesCount: favoritesRes.count ?? 0,
        booksReadCount: historyRes.data?.length ?? 0,
      }));

      const lists = listsRes.data ?? [];
      const listCounts = { queroLer: 0, lendo: 0, finalizados: 0 };
      const statusMap: Record<string, ReadingListSlug> = {};

      lists.forEach((list) => {
        const count = list.items?.length ?? 0;
        const slug = list.slug as ReadingListSlug;
        if (slug === "quero-ler") listCounts.queroLer = count;
        if (slug === "lendo") listCounts.lendo = count;
        if (slug === "finalizados") listCounts.finalizados = count;
        list.items?.forEach((item: { book_id: string }) => {
          statusMap[item.book_id] = slug;
        });
      });

      setStats((s) => ({ ...s, listCounts }));
      setListStatusByBook(statusMap);
      setLoading(false);
    });
  }, [router]);

  if (loading || !profile) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileView
        profile={profile}
        readingHistory={readingHistory}
        listStatusByBook={listStatusByBook}
        stats={stats}
      />
    </div>
  );
}
