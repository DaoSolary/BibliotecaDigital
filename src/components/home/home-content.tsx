"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Book } from "@/types/database";

export function HomeContent() {
  const [featured, setFeatured] = useState<Book[]>([]);
  const [recent, setRecent] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetch("/api/books/home")
      .then((r) => r.json())
      .then((data) => {
        setFeatured(data.featured ?? []);
        setRecent(data.recent ?? []);
        setOffline(!!data.offline);
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <section className="py-16">
          <div className="container mx-auto px-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
            ))}
          </div>
        </section>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {offline && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400 py-4 bg-amber-500/10">
          Catálogo temporariamente indisponível. Verifique a ligação ao Supabase.
        </p>
      )}
      {featured.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Destaques</h2>
              <Button variant="ghost" asChild>
                <Link href="/livros?featured=true">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Adicionados recentemente</h2>
            <Button variant="ghost" asChild>
              <Link href="/livros">
                Ver catálogo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {recent.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
