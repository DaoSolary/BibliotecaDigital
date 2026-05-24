import { CategoryManager } from "@/components/admin/category-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const { data: tags } = await supabase.from("tags").select("*").order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Categorias e Tags</h1>
      <CategoryManager categories={categories ?? []} tags={tags ?? []} />
    </div>
  );
}
