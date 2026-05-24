"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { saveReadingProgress } from "@/lib/actions/books";
import { createClient } from "@/lib/supabase/client";

const Document = dynamic(
  () => import("react-pdf").then((mod) => {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    return mod.Document;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center gap-3 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">A carregar PDF…</p>
      </div>
    ),
  }
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

interface PdfReaderProps {
  bookId: string;
  pdfUrl: string;
  title: string;
  initialPage?: number;
  totalPagesHint?: number;
}

export function PdfReader({
  bookId,
  pdfUrl,
  title,
  initialPage = 1,
  totalPagesHint = 0,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState(totalPagesHint);
  const [page, setPage] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (!user) return;
      supabase
        .from("page_bookmarks")
        .select("page_number")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .then(({ data }) => setBookmarks(data?.map((b) => b.page_number) ?? []));
    });
  }, [bookId, supabase]);

  const scheduleSave = useCallback(
    (currentPage: number, total: number) => {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void saveReadingProgress(bookId, currentPage, total, 30);
      }, 800);
    },
    [bookId]
  );

  useEffect(() => {
    if (numPages > 0) {
      const interval = setInterval(() => saveReadingProgress(bookId, page, numPages, 30), 60000);
      return () => clearInterval(interval);
    }
  }, [page, numPages, bookId]);

  const goToPage = (p: number) => {
    const newPage = Math.max(1, Math.min(p, numPages || p));
    setPage(newPage);
    if (numPages > 0) scheduleSave(newPage, numPages);
  };

  const toggleBookmark = async () => {
    if (!userId) {
      toast.error("Faça login para marcar páginas");
      return;
    }

    if (bookmarks.includes(page)) {
      await supabase
        .from("page_bookmarks")
        .delete()
        .eq("book_id", bookId)
        .eq("user_id", userId)
        .eq("page_number", page);
      setBookmarks((b) => b.filter((p) => p !== page));
      toast.success("Marcador removido");
    } else {
      await supabase.from("page_bookmarks").insert({
        book_id: bookId,
        user_id: userId,
        page_number: page,
      });
      setBookmarks((b) => [...b, page]);
      toast.success(`Página ${page} marcada`);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/ler/${bookId}?page=${page}`;
    navigator.clipboard.writeText(link);
    toast.success("Link da leitura copiado!");
  };

  return (
    <div className={`flex flex-col h-screen ${theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"}`}>
      <div className="flex items-center justify-between border-b bg-background px-4 py-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/livros/${bookId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-semibold truncate text-sm">{title}</h1>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {page} / {numPages || "…"}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(page + 1)}
            disabled={numPages > 0 && page >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 w-32">
            <ZoomOut className="h-4 w-4 shrink-0" />
            <Slider
              value={[scale * 100]}
              min={50}
              max={200}
              step={10}
              onValueChange={([v]) => setScale(v / 100)}
            />
            <ZoomIn className="h-4 w-4 shrink-0" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBookmark}
            className={bookmarks.includes(page) ? "text-yellow-500" : ""}
          >
            <Bookmark className={`h-4 w-4 ${bookmarks.includes(page) ? "fill-current" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={copyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center p-4">
        {loadError ? (
          <div className="text-center space-y-3 p-8 max-w-lg">
            <p className="text-destructive font-medium">{loadError}</p>
            <p className="text-sm text-muted-foreground">
              O proxy <code className="text-xs bg-muted px-1 rounded">{pdfUrl}</code> não conseguiu
              devolver o ficheiro. Verifique o upload no Supabase Storage.
            </p>
            <Button onClick={() => { setLoadError(null); window.location.reload(); }}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <Document
            file={pdfUrl}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            setLoadError(null);
            const start = Math.min(Math.max(1, initialPage), n);
            setPage(start);
            void saveReadingProgress(bookId, start, n, 5);
          }}
            onLoadError={(err) => {
              console.error("PDF load error:", err);
              setLoadError(
                "Falha ao abrir o PDF. Confirme que o ficheiro existe no Storage (bucket books-pdfs) e que as políticas de acesso estão configuradas."
              );
            }}
            loading={
              <div className="flex flex-col items-center gap-3 p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">A renderizar páginas…</p>
              </div>
            }
          >
            {numPages > 0 && (
              <Page
                pageNumber={page}
                scale={scale}
                className="shadow-2xl"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                }
              />
            )}
          </Document>
        )}
      </div>
    </div>
  );
}
