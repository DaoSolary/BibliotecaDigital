"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface ListItem {
  id: string;
  book?: { id: string; title: string; author: string; cover_url: string | null } | null;
}

interface List {
  id: string;
  name: string;
  slug: string;
  items?: ListItem[];
}

export function ListasPageClient() {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login?redirect=/listas");
        return;
      }
      const { data } = await supabase
        .from("reading_lists")
        .select(
          `*, items:reading_list_items(id, book:books(id, title, author, cover_url))`
        )
        .eq("user_id", user.id)
        .order("created_at");
      setLists(data ?? []);
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
      <div>
        <h1 className="text-3xl font-bold">Minhas Listas</h1>
        <p className="text-muted-foreground mt-1">
          Marque livros no catálogo. Abrir o leitor define automaticamente <strong>Lendo</strong>.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {lists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {list.name}
                <Badge variant="secondary">{list.items?.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {list.items?.length ? (
                list.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/livros/${item.book?.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                      {item.book?.cover_url ? (
                        <Image src={item.book.cover_url} alt="" fill className="object-cover" />
                      ) : (
                        <BookOpen className="h-4 w-4 m-auto text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.book?.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.book?.author}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Lista vazia</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
