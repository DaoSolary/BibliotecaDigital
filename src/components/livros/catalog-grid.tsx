"use client";

import { BookCardWithStatus } from "@/components/books/book-card-with-status";
import type { Book } from "@/types/database";
import type { ReadingListSlug } from "@/types/reading";

interface CatalogGridProps {
  books: Book[];
  listStatusByBook: Record<string, ReadingListSlug>;
  isLoggedIn: boolean;
}

export function CatalogGrid({ books, listStatusByBook, isLoggedIn }: CatalogGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <BookCardWithStatus
          key={book.id}
          book={book}
          listStatus={listStatusByBook[book.id] ?? null}
          showStatusButtons={isLoggedIn}
        />
      ))}
    </div>
  );
}
