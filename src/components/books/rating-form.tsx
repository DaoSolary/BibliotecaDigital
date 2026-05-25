"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obterSessaoCliente } from "@/lib/supabase/auth-client";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { addRating } from "@/lib/actions/books";
import { traduzirErro } from "@/lib/messages";

interface RatingFormProps {
  bookId: string;
  currentRating?: number;
}

export function RatingForm({ bookId, currentRating = 0 }: RatingFormProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(currentRating);

  useEffect(() => {
    const supabase = createClient();
    obterSessaoCliente(supabase).then(async (session) => {
      if (!session?.user) return;
      const { data } = await supabase
        .from("ratings")
        .select("score")
        .eq("user_id", session.user.id)
        .eq("book_id", bookId)
        .maybeSingle();
      if (data?.score) setSelected(data.score);
    });
  }, [bookId]);

  const handleRate = async (score: number) => {
    const result = await addRating(bookId, score);
    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }
    setSelected(score);
    toast.success("Avaliação registrada!");
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hovered || selected)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
      {selected > 0 && (
        <span className="text-sm text-muted-foreground ml-2">Sua nota: {selected}</span>
      )}
    </div>
  );
}
