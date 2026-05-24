"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createCategory } from "@/lib/actions/admin";
import { traduzirErro } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Category, Tag } from "@/types/database";

interface CategoryManagerProps {
  categories: Category[];
  tags: Tag[];
}

export function CategoryManager({ categories: initialCategories, tags: initialTags }: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [tagName, setTagName] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const supabase = createClient();

  const handleCreateCategory = async () => {
    if (!name.trim()) return;
    const result = await createCategory(name);
    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }
    toast.success("Categoria criada!");
    setCategories((c) => [...c, { id: crypto.randomUUID(), name, slug: slugify(name), description: null, created_at: "", updated_at: "" }]);
    setName("");
  };

  const handleCreateTag = async () => {
    if (!tagName.trim()) return;
    const slug = slugify(tagName);
    const { error } = await supabase.from("tags").insert({ name: tagName, slug });
    if (error) {
      toast.error(traduzirErro(error.message));
      return;
    }
    toast.success("Tag criada!");
    setTags((t) => [...t, { id: crypto.randomUUID(), name: tagName, slug, created_at: "" }]);
    setTagName("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={handleCreateCategory}>Criar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c.id} variant="secondary">{c.name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Nova tag" value={tagName} onChange={(e) => setTagName(e.target.value)} />
            <Button onClick={handleCreateTag}>Criar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge key={t.id} variant="outline">{t.name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
