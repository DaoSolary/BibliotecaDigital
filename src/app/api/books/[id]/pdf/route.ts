import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfFetchUrl } from "@/lib/storage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: book, error } = await supabase
    .from("books")
    .select("pdf_url, is_published")
    .eq("id", id)
    .single();

  if (error || !book?.pdf_url) {
    return NextResponse.json({ error: "PDF não encontrado" }, { status: 404 });
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

  let fetchUrl: string;
  try {
    fetchUrl = await resolvePdfFetchUrl(supabase, book.pdf_url);
  } catch {
    return NextResponse.json({ error: "Erro ao preparar PDF" }, { status: 500 });
  }

  const pdfResponse = await fetch(fetchUrl, {
    headers: { Accept: "application/pdf" },
    signal: AbortSignal.timeout(60000),
  });

  if (!pdfResponse.ok) {
    return NextResponse.json(
      {
        error: `Não foi possível obter o PDF (${pdfResponse.status}). Verifique se o ficheiro existe no Storage e se o bucket está configurado.`,
      },
      { status: 502 }
    );
  }

  const buffer = await pdfResponse.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
    },
  });
}
