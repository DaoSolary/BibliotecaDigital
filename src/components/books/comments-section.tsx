"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addComment } from "@/lib/actions/books";
import { traduzirErro } from "@/lib/messages";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/types/database";

interface CommentsSectionProps {
  bookId: string;
  comments: Comment[];
}

export function CommentsSection({ bookId, comments: initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const result = await addComment(bookId, content, replyTo ?? undefined);
    setLoading(false);

    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }

    toast.success("Comentário publicado!");
    setContent("");
    setReplyTo(null);
    window.location.reload();
  };

  const topLevel = comments.filter((c) => !c.parent_id);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comentários ({comments.length})
      </h3>

      <div className="space-y-3">
        <Textarea
          placeholder={replyTo ? "Escreva sua resposta..." : "Deixe seu comentário..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          {replyTo && (
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
              Cancelar resposta
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading}>
            {replyTo ? "Responder" : "Comentar"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={comments.filter((c) => c.parent_id === comment.id)}
            onReply={() => setReplyTo(comment.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: () => void;
}) {
  const initials = comment.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "?";

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.profile?.avatar_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.profile?.full_name}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <Button variant="ghost" size="sm" className="mt-1 h-7" onClick={onReply}>
            <Reply className="h-3 w-3 mr-1" />
            Responder
          </Button>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-12 space-y-3 border-l-2 pl-4">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} replies={[]} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
