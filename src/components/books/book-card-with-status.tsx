"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, BookOpen, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReadingStatusButtons } from "@/components/books/reading-status-buttons";
import { READING_LIST_LABELS, type ReadingListSlug } from "@/types/reading";
import type { Book } from "@/types/database";

interface BookCardWithStatusProps {
  book: Book;
  listStatus?: ReadingListSlug | null;
  showStatusButtons?: boolean;
}

export function BookCardWithStatus({
  book,
  listStatus = null,
  showStatusButtons = false,
}: BookCardWithStatusProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
      <Link href={`/livros/${book.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
          {book.is_featured && <Badge className="absolute top-2 left-2">Destaque</Badge>}
          {book.is_favorite && (
            <Heart className="absolute top-2 right-2 h-5 w-5 fill-red-500 text-red-500" />
          )}
          {listStatus && (
            <Badge className="absolute bottom-2 left-2 text-xs" variant="secondary">
              {READING_LIST_LABELS[listStatus]}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
        </CardContent>
      </Link>
      {showStatusButtons && (
        <CardContent className="pt-0 pb-4 px-4">
          <ReadingStatusButtons
            bookId={book.id}
            initialStatus={listStatus}
            compact
            className="w-full"
          />
        </CardContent>
      )}
    </Card>
  );
}
