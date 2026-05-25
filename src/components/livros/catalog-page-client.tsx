"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookFilters } from "@/components/books/book-filters";
import { CatalogGrid } from "@/components/livros/catalog-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Book, Category } from "@/types/database";
import type { ReadingListSlug } from "@/types/reading";

export function CatalogPageClient() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listStatus, setListStatus] = useState<Record<string, ReadingListSlug>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const qs = searchParams.toString();

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();

    Promise.all([
      fetch(`/api/books/catalog?${qs}`).then((r) => r.json()),
      supabase.auth.getUser(),
    ]).then(async ([catalog, userRes]) => {
      setBooks(catalog.books ?? []);
      setCategories(catalog.categories ?? []);
      const user = userRes.data.user;
      setIsLoggedIn(!!user);

      if (user) {
        const { data: lists } = await supabase
          .from("reading_lists")
          .select("id, slug")
          .eq("user_id", user.id);
        if (lists?.length) {
          const listIds = lists.map((l) => l.id);
          const slugById = Object.fromEntries(lists.map((l) => [l.id, l.slug as ReadingListSlug]));
          const { data: items } = await supabase
            .from("reading_list_items")
            .select("book_id, list_id")
            .in("list_id", listIds);
          const map: Record<string, ReadingListSlug> = {};
          items?.forEach((item) => {
            const slug = slugById[item.list_id];
            if (slug) map[item.book_id] = slug;
          });
          setListStatus(map);
        }
      }
      setLoading(false);
    });
  }, [qs]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Catálogo</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "A carregar…" : `${books.length} livro(s) encontrado(s)`}
        </p>
        {isLoggedIn && (
          <p className="text-sm text-muted-foreground mt-1">
           
          </p>
        )}
      </div>

      <BookFilters categories={categories} />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <CatalogGrid books={books} listStatusByBook={listStatus} isLoggedIn={isLoggedIn} />
      )}

      {!loading && books.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Nenhum livro encontrado. Tente outros filtros.
        </p>
      )}
    </div>
  );
}
