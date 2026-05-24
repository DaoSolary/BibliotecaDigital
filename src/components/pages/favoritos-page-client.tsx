"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/types/database";

export function FavoritosPageClient() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login?redirect=/favoritos");
        return;
      }
      const { data } = await supabase
        .from("favorites")
        .select("*, book:books(*, category:categories(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBooks(
        (data?.map((f) => ({ ...f.book, is_favorite: true })).filter(Boolean) as Book[]) ?? []
      );
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Meus Favoritos</h1>
      {books.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Você ainda não favoritou nenhum livro.</p>
      )}
    </div>
  );
}
