"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const PdfReader = dynamic(
  () => import("@/components/reader/pdf-reader-view").then((m) => m.PdfReader),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">A carregar leitor PDF…</p>
      </div>
    ),
  }
);

interface ReaderShellProps {
  bookId: string;
}

interface ReaderData {
  id: string;
  title: string;
  pageCount: number;
  pdfProxyUrl: string;
  initialPage: number;
}

export function ReaderShell({ bookId }: ReaderShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ReaderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`/auth/login?redirect=/ler/${bookId}`);
        return;
      }

      setAuthChecking(false);

      const page = searchParams.get("page");
      const qs = page ? `?page=${page}` : "";
      const res = await fetch(`/api/books/${bookId}/reader${qs}`, {
        credentials: "include",
      });

      if (cancelled) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Não foi possível abrir o livro");
        return;
      }

      const json = (await res.json()) as ReaderData;
      setData(json);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookId, router, searchParams]);

  if (authChecking || (!data && !error)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">A preparar leitor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Confirme que o PDF foi enviado ao bucket <strong>books-pdfs</strong> no Supabase e que a URL
          está correta no cadastro do livro.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/livros/${bookId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao livro
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <PdfReader
      bookId={data!.id}
      pdfUrl={data!.pdfProxyUrl}
      title={data!.title}
      initialPage={data!.initialPage}
      totalPagesHint={data!.pageCount}
    />
  );
}
