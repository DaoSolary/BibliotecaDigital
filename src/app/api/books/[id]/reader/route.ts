import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerReadingSession } from "@/lib/actions/reading";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");

  const [{ data: book, error: bookError }, { data: progress }] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, page_count, pdf_url, is_published")
      .eq("id", id)
      .single(),
    supabase
      .from("reading_progress")
      .select("current_page")
      .eq("user_id", user.id)
      .eq("book_id", id)
      .maybeSingle(),
  ]);

  if (bookError || !book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
  }

  if (!book.pdf_url) {
    return NextResponse.json({ error: "Este livro não tem PDF associado" }, { status: 404 });
  }

  if (!book.is_published) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Livro indisponível" }, { status: 403 });
    }
  }

  // Incremento em background — não bloqueia a resposta
  void supabase.rpc("increment_book_read_count", { p_book_id: id }).then(async ({ error }) => {
    if (error) {
      const { data: row } = await supabase.from("books").select("read_count").eq("id", id).single();
      if (row) {
        await supabase.from("books").update({ read_count: row.read_count + 1 }).eq("id", id);
      }
    }
  });

  const initialPage = pageParam
    ? Math.max(1, parseInt(pageParam, 10) || 1)
    : progress?.current_page ?? 1;

  await registerReadingSession(id, initialPage, book.page_count ?? 0);

  return NextResponse.json({
    id: book.id,
    title: book.title,
    pageCount: book.page_count,
    pdfProxyUrl: `/api/books/${id}/pdf`,
    initialPage,
  });
}
