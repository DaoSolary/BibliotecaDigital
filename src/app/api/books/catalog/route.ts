import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { comTimeout } from "@/lib/supabase/query";
import type { BookSortOption } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  let query = supabase
    .from("books")
    .select("id, title, author, cover_url, is_featured, read_count, category:categories(id, name)")
    .eq("is_published", true);

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const sort = searchParams.get("sort") as BookSortOption | null;

  if (search) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
  if (category) query = query.eq("category_id", category);
  if (featured === "true") query = query.eq("is_featured", true);

  switch (sort) {
    case "title_desc":
      query = query.order("title", { ascending: false });
      break;
    case "author_asc":
      query = query.order("author", { ascending: true });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "popular":
      query = query.order("read_count", { ascending: false });
      break;
    default:
      query = query.order("title", { ascending: true });
  }

  const { data: result, timedOut } = await comTimeout(
    Promise.all([
      query,
      supabase.from("categories").select("id, name, slug").order("name"),
    ]),
    6000
  );

  if (timedOut || !result) {
    return NextResponse.json({ books: [], categories: [], offline: true });
  }

  const [booksRes, categoriesRes] = result;
  return NextResponse.json({
    books: booksRes.data ?? [],
    categories: categoriesRes.data ?? [],
    offline: false,
  });
}
