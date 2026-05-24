import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { comTimeout } from "@/lib/supabase/query";

export const revalidate = 60;

export async function GET() {
  const supabase = await createClient();

  const { data, timedOut } = await comTimeout(
    Promise.all([
      supabase
        .from("books")
        .select("id, title, author, cover_url, is_featured, read_count, category:categories(id, name)")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("read_count", { ascending: false })
        .limit(4),
      supabase
        .from("books")
        .select("id, title, author, cover_url, is_featured, read_count, category:categories(id, name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8),
    ]),
    6000
  );

  if (timedOut || !data) {
    return NextResponse.json({
      featured: [],
      recent: [],
      offline: true,
    });
  }

  const [featuredRes, recentRes] = data;
  return NextResponse.json({
    featured: featuredRes.data ?? [],
    recent: recentRes.data ?? [],
    offline: false,
  });
}
