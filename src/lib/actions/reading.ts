"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReadingListSlug } from "@/types/reading";
import { READING_LIST_SLUGS } from "@/types/reading";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user: user ?? null };
}

/** Regista/abre leitura no histórico e marca lista "Lendo" */
export async function registerReadingSession(
  bookId: string,
  currentPage = 1,
  totalPages = 0
) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Não autenticado" };

  const { data: existing } = await supabase
    .from("reading_progress")
    .select("reading_time_seconds, total_pages")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  const resolvedTotal =
    totalPages > 0 ? totalPages : (existing?.total_pages ?? 0);

  const progressPercent =
    resolvedTotal > 0
      ? Math.min(100, Math.round((currentPage / resolvedTotal) * 100))
      : currentPage > 0
        ? 1
        : 0;

  const { error: progressError } = await supabase.from("reading_progress").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      current_page: currentPage,
      total_pages: resolvedTotal,
      progress_percent: progressPercent,
      reading_time_seconds: existing?.reading_time_seconds ?? 0,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" }
  );

  if (progressError) return { error: progressError.message };

  await setBookReadingStatus(bookId, "lendo", { skipRevalidate: true });

  revalidatePath("/perfil");
  revalidatePath(`/livros/${bookId}`);
  revalidatePath("/listas");

  return { success: true };
}

/** Define o livro numa única lista (remove das outras) */
export async function setBookReadingStatus(
  bookId: string,
  targetSlug: ReadingListSlug,
  options?: { skipRevalidate?: boolean }
) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Faça login para organizar suas listas" };

  if (!READING_LIST_SLUGS.includes(targetSlug)) {
    return { error: "Lista inválida" };
  }

  const { data: lists, error: listsError } = await supabase
    .from("reading_lists")
    .select("id, slug")
    .eq("user_id", user.id);

  if (listsError) return { error: listsError.message };

  const targetList = lists?.find((l) => l.slug === targetSlug);
  if (!targetList) return { error: `Lista "${targetSlug}" não encontrada` };

  const listIds = lists?.map((l) => l.id) ?? [];

  if (listIds.length > 0) {
    await supabase
      .from("reading_list_items")
      .delete()
      .eq("book_id", bookId)
      .in("list_id", listIds);
  }

  const { error: insertError } = await supabase.from("reading_list_items").insert({
    list_id: targetList.id,
    book_id: bookId,
  });

  if (insertError) return { error: insertError.message };

  if (!options?.skipRevalidate) {
    revalidatePath("/perfil");
    revalidatePath("/listas");
    revalidatePath(`/livros/${bookId}`);
    revalidatePath("/livros");
  }

  return { success: true, status: targetSlug };
}

export async function getBookReadingStatus(bookId: string): Promise<ReadingListSlug | null> {
  const { supabase, user } = await getAuthUser();
  if (!user) return null;

  const { data: lists } = await supabase
    .from("reading_lists")
    .select("id, slug")
    .eq("user_id", user.id);

  if (!lists?.length) return null;

  const listIds = lists.map((l) => l.id);
  const { data: item } = await supabase
    .from("reading_list_items")
    .select("list_id")
    .eq("book_id", bookId)
    .in("list_id", listIds)
    .maybeSingle();

  if (!item) return null;
  const list = lists.find((l) => l.id === item.list_id);
  return (list?.slug as ReadingListSlug) ?? null;
}

export async function getUserBooksListStatus(): Promise<Record<string, ReadingListSlug>> {
  const { supabase, user } = await getAuthUser();
  if (!user) return {};

  const { data: lists } = await supabase
    .from("reading_lists")
    .select("id, slug")
    .eq("user_id", user.id);

  if (!lists?.length) return {};

  const listIds = lists.map((l) => l.id);
  const slugByListId = Object.fromEntries(lists.map((l) => [l.id, l.slug as ReadingListSlug]));

  const { data: items } = await supabase
    .from("reading_list_items")
    .select("book_id, list_id")
    .in("list_id", listIds);

  const map: Record<string, ReadingListSlug> = {};
  items?.forEach((item) => {
    const slug = slugByListId[item.list_id];
    if (slug) map[item.book_id] = slug;
  });
  return map;
}
