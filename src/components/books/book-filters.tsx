"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/database";

interface BookFiltersProps {
  categories: Category[];
}

export function BookFilters({ categories }: BookFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/livros?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por título ou autor..."
          className="pl-10"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => updateParam("search", e.target.value), 400);
          }}
        />
      </div>
      <Select
        value={searchParams.get("category") ?? "all"}
        onValueChange={(v) => updateParam("category", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("sort") ?? "title_asc"}
        onValueChange={(v) => updateParam("sort", v)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title_asc">Título A-Z</SelectItem>
          <SelectItem value="title_desc">Título Z-A</SelectItem>
          <SelectItem value="author_asc">Autor A-Z</SelectItem>
          <SelectItem value="newest">Mais recentes</SelectItem>
          <SelectItem value="popular">Mais lidos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
