"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBookReadingStatus } from "@/lib/actions/reading";
import {
  BookOpen,
  Download,
  Heart,
  Star,
  Share2,
  Calendar,
  Globe,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toggleFavorite, recordDownload } from "@/lib/actions/books";
import { traduzirErro } from "@/lib/messages";
import { ReadingStatusButtons } from "@/components/books/reading-status-buttons";
import type { Book } from "@/types/database";
import type { ReadingListSlug } from "@/types/reading";

interface BookDetailProps {
  book: Book;
  isFavorited?: boolean;
  readingListStatus?: ReadingListSlug | null;
  isLoggedIn?: boolean;
}

export function BookDetail({
  book,
  isFavorited = false,
  readingListStatus = null,
  isLoggedIn = false,
}: BookDetailProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [listStatus, setListStatus] = useState<ReadingListSlug | null>(readingListStatus);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      const [{ data: fav }, status] = await Promise.all([
        supabase.from("favorites").select("id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle(),
        getBookReadingStatus(book.id),
      ]);
      setFavorited(!!fav);
      setListStatus(status);
    });
  }, [book.id]);

  const handleFavorite = async () => {
    if (!loggedIn) {
      toast.error("Faça login para favoritar");
      return;
    }
    const result = await toggleFavorite(book.id);
    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }
    setFavorited(result.favorited ?? false);
    toast.success(result.favorited ? "Adicionado aos favoritos" : "Removido dos favoritos");
  };

  const handleDownload = async () => {
    const result = await recordDownload(book.id);
    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }
    if (result.url) window.open(result.url, "_blank");
  };

  const shareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/livros/${book.id}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="relative aspect-[2/3] max-w-[280px] mx-auto lg:mx-0 overflow-hidden rounded-xl shadow-xl bg-muted">
        {book.cover_url ? (
          <Image src={book.cover_url} alt={book.title} fill className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-24 w-24 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          {book.is_featured && <Badge className="mb-2">Destaque</Badge>}
          <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
          <p className="text-xl text-muted-foreground mt-1">por {book.author}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {book.category && <Badge variant="secondary">{book.category.name}</Badge>}
          {book.year && (
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{book.year}</span>
          )}
          {book.language && (
            <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{book.language}</span>
          )}
          {book.page_count > 0 && (
            <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{book.page_count} páginas</span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {book.avg_rating ?? 0} ({book.rating_count ?? 0} avaliações)
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />{book.read_count} leituras
          </span>
        </div>

        {book.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground leading-relaxed">{book.description}</p>
            </CardContent>
          </Card>
        )}

        {loggedIn && (
          <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
            <p className="text-sm font-medium">Minha lista de leitura (escolha uma)</p>
            <ReadingStatusButtons bookId={book.id} initialStatus={listStatus} />
            <p className="text-xs text-muted-foreground">
              Ao clicar em &quot;Ler agora&quot;, o livro é marcado automaticamente como <strong>Lendo</strong> e
              aparece no seu histórico.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href={`/ler/${book.id}`}>
              <BookOpen className="mr-2 h-5 w-5" />
              Ler agora
            </Link>
          </Button>
          {book.download_allowed && book.pdf_url && (
            <Button size="lg" variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-5 w-5" />
              Baixar PDF
            </Button>
          )}
          <Button size="lg" variant={favorited ? "default" : "outline"} onClick={handleFavorite}>
            <Heart className={`mr-2 h-5 w-5 ${favorited ? "fill-current" : ""}`} />
            {favorited ? "Favoritado" : "Favoritar"}
          </Button>
          <Button size="lg" variant="outline" onClick={shareLink}>
            <Share2 className="mr-2 h-5 w-5" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  );
}
