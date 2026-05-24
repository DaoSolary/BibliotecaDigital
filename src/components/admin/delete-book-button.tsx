"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteBook } from "@/lib/actions/admin";
import { traduzirErro } from "@/lib/messages";

interface DeleteBookButtonProps {
  bookId: string;
  title: string;
}

export function DeleteBookButton({ bookId, title }: DeleteBookButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    setLoading(true);
    const result = await deleteBook(bookId);
    setLoading(false);
    if (result.error) toast.error(traduzirErro(result.error));
    else toast.success("Livro excluído");
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
