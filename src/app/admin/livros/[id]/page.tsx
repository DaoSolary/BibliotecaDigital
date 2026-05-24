import { notFound } from "next/navigation";
import { BookForm } from "@/components/admin/book-form";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: book }, { data: categories }] = await Promise.all([
    supabase.from("books").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!book) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Editar livro</h1>
      <BookForm categories={categories ?? []} book={book} />
    </div>
  );
}
