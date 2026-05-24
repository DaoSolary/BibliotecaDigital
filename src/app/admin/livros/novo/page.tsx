import { BookForm } from "@/components/admin/book-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Novo Livro" };

export default async function NewBookPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Adicionar livro</h1>
      <BookForm categories={categories ?? []} />
    </div>
  );
}
