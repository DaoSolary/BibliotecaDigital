"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BookFilters, BookSortOption } from "@/types/database";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function applySort(query: ReturnType<Awaited<ReturnType<typeof createClient>>["from"]>, sort?: BookSortOption) {
  switch (sort) {
    case "title_desc":
      return query.order("title", { ascending: false });
    case "author_asc":
      return query.order("author", { ascending: true });
    case "newest":
      return query.order("created_at", { ascending: false });
    case "popular":
      return query.order("read_count", { ascending: false });
    default:
      return query.order("title", { ascending: true });
  }
}

export async function getBooks(filters: BookFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select("*, category:categories(*)")
    .eq("is_published", true);

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`);
  }
  if (filters.author) query = query.ilike("author", `%${filters.author}%`);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.featured) query = query.eq("is_featured", true);

  query = applySort(query, filters.sort);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBookById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const { data: ratingSummary } = await supabase
    .from("book_ratings_summary")
    .select("avg_rating, rating_count")
    .eq("book_id", id)
    .maybeSingle();

  return {
    ...data,
    avg_rating: ratingSummary?.avg_rating ?? 0,
    rating_count: ratingSummary?.rating_count ?? 0,
  };
}

export async function toggleFavorite(bookId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Faça login para favoritar" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    revalidatePath(`/livros/${bookId}`);
    return { favorited: false };
  }

  await supabase.from("favorites").insert({ user_id: user.id, book_id: bookId });
  revalidatePath(`/livros/${bookId}`);
  return { favorited: true };
}

export async function saveReadingProgress(
  bookId: string,
  currentPage: number,
  totalPages: number,
  extraSeconds = 0
) {
  const { supabase, user } = await getAuthUser();
  if (!user) return;

  const progressPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  const { data: existing } = await supabase
    .from("reading_progress")
    .select("reading_time_seconds")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      current_page: currentPage,
      total_pages: totalPages,
      progress_percent: progressPercent,
      reading_time_seconds: (existing?.reading_time_seconds ?? 0) + extraSeconds,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" }
  );

  if (!error) {
    revalidatePath("/perfil");
    revalidatePath(`/livros/${bookId}`);
  }
}

export async function recordDownload(bookId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Faça login para baixar" };

  const { data: book } = await supabase
    .from("books")
    .select("download_allowed, pdf_url")
    .eq("id", bookId)
    .single();

  if (!book?.download_allowed) return { error: "Download não permitido" };

  await supabase.from("download_history").insert({ user_id: user.id, book_id: bookId });
  return { url: book.pdf_url };
}

export async function addRating(bookId: string, score: number) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Faça login para avaliar" };

  const { error } = await supabase.from("ratings").upsert({
    book_id: bookId,
    user_id: user.id,
    score,
  });

  if (error) return { error: error.message };
  revalidatePath(`/livros/${bookId}`);
  return { success: true };
}

export async function addComment(bookId: string, content: string, parentId?: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Faça login para comentar" };

  const { error } = await supabase.from("comments").insert({
    book_id: bookId,
    user_id: user.id,
    content,
    parent_id: parentId ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/livros/${bookId}`);
  return { success: true };
}
