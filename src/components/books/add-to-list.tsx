"use client";

import { useState } from "react";
import { ListPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { traduzirErro } from "@/lib/messages";

interface AddToListProps {
  bookId: string;
}

export function AddToList({ bookId }: AddToListProps) {
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  const loadLists = async () => {
    if (loaded) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para usar listas");
      return;
    }
    const { data } = await supabase
      .from("reading_lists")
      .select("id, name")
      .eq("user_id", user.id);
    setLists(data ?? []);
    setLoaded(true);
  };

  const addToList = async (listId: string, listName: string) => {
    const { error } = await supabase.from("reading_list_items").upsert(
      { list_id: listId, book_id: bookId },
      { onConflict: "list_id,book_id" }
    );
    if (error) {
      toast.error(traduzirErro(error.message));
      return;
    }
    toast.success(`Adicionado à lista "${listName}"`);
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && loadLists()}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg">
          <ListPlus className="mr-2 h-5 w-5" />
          Adicionar à lista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {lists.map((list) => (
          <DropdownMenuItem key={list.id} onClick={() => addToList(list.id, list.name)}>
            {list.name}
          </DropdownMenuItem>
        ))}
        {loaded && lists.length === 0 && (
          <DropdownMenuItem disabled>Nenhuma lista encontrada</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
