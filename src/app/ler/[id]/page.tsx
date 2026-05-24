import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ReaderShell } from "@/components/reader/reader-shell";

export const metadata = { title: "Leitor" };

interface PageProps {
  params: Promise<{ id: string }>;
}

function ReaderLoading() {
  return (
    <div className="flex h-screen items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-muted-foreground">A abrir leitor…</span>
    </div>
  );
}

export default async function ReaderPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ReaderLoading />}>
      <ReaderShell bookId={id} />
    </Suspense>
  );
}
