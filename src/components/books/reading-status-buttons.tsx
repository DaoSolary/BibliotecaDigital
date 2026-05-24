"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setBookReadingStatus } from "@/lib/actions/reading";
import { traduzirErro } from "@/lib/messages";
import {
  READING_LIST_SLUGS,
  READING_LIST_LABELS,
  type ReadingListSlug,
} from "@/types/reading";

interface ReadingStatusButtonsProps {
  bookId: string;
  initialStatus?: ReadingListSlug | null;
  compact?: boolean;
  className?: string;
}

export function ReadingStatusButtons({
  bookId,
  initialStatus = null,
  compact = false,
  className,
}: ReadingStatusButtonsProps) {
  const [status, setStatus] = useState<ReadingListSlug | null>(initialStatus);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (slug: ReadingListSlug) => {
    if (status === slug) return;
    setLoading(slug);
    const result = await setBookReadingStatus(bookId, slug);
    setLoading(null);

    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }

    setStatus(slug);
    toast.success(`Marcado como: ${READING_LIST_LABELS[slug]}`);
  };

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {READING_LIST_SLUGS.map((slug) => (
        <Button
          key={slug}
          type="button"
          size={compact ? "sm" : "default"}
          variant={status === slug ? "default" : "outline"}
          disabled={loading !== null}
          onClick={() => handleSelect(slug)}
          className={compact ? "text-xs h-8" : ""}
        >
          {loading === slug ? "…" : READING_LIST_LABELS[slug]}
        </Button>
      ))}
    </div>
  );
}
