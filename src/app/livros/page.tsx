import { Suspense } from "react";
import { CatalogPageClient } from "@/components/livros/catalog-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Catálogo de Livros" };

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-6 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3]" />
            ))}
          </div>
        </div>
      }
    >
      <CatalogPageClient />
    </Suspense>
  );
}
