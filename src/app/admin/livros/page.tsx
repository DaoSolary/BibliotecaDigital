import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { DeleteBookButton } from "@/components/admin/delete-book-button";

export const metadata = { title: "Gerenciar Livros" };

export default async function AdminBooksPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Livros</h1>
        <Button asChild>
          <Link href="/admin/livros/novo">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar livro
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Livro</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Autor</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Categoria</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {books?.map((book) => (
              <tr key={book.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-7 rounded overflow-hidden bg-muted shrink-0">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt="" fill className="object-cover" />
                      ) : (
                        <BookOpen className="h-4 w-4 m-auto text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium line-clamp-1">{book.title}</span>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{book.author}</td>
                <td className="p-3 hidden lg:table-cell">
                  {book.category?.name && <Badge variant="secondary">{book.category.name}</Badge>}
                </td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    {book.is_published && <Badge>Publicado</Badge>}
                    {book.is_featured && <Badge variant="outline">Destaque</Badge>}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/livros/${book.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteBookButton bookId={book.id} title={book.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
