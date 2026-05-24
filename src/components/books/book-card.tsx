import Link from "next/link";
import Image from "next/image";
import { Star, BookOpen, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/types/database";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/livros/${book.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full">
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
          {book.is_featured && (
            <Badge className="absolute top-2 left-2">Destaque</Badge>
          )}
          {book.is_favorite && (
            <Heart className="absolute top-2 right-2 h-5 w-5 fill-red-500 text-red-500" />
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {book.category && (
              <Badge variant="secondary" className="text-xs">
                {book.category.name}
              </Badge>
            )}
            <div className="flex items-center gap-3">
              {book.avg_rating ? (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {book.avg_rating}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {book.read_count}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
