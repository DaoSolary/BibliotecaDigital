"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moderateComment } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";

interface ModerationPanelProps {
  comments: Array<{
    id: string;
    content: string;
    profile?: { full_name: string };
    book?: { title: string };
  }>;
  ratings: Array<{
    id: string;
    score: number;
    profile?: { full_name: string };
    book?: { title: string };
  }>;
  reports: Array<{
    id: string;
    reason: string;
    comment?: { content: string };
    reporter?: { full_name: string };
  }>;
}

export function ModerationPanel({ comments, ratings, reports }: ModerationPanelProps) {
  const supabase = createClient();

  const approveRating = async (id: string) => {
    await supabase.from("ratings").update({ is_approved: true }).eq("id", id);
    toast.success("Avaliação aprovada");
  };

  const resolveReport = async (id: string, status: string) => {
    await supabase.from("reports").update({ status }).eq("id", id);
    toast.success("Denúncia atualizada");
  };

  return (
    <Tabs defaultValue="comments">
      <TabsList>
        <TabsTrigger value="comments">Comentários ({comments.length})</TabsTrigger>
        <TabsTrigger value="ratings">Avaliações ({ratings.length})</TabsTrigger>
        <TabsTrigger value="reports">Denúncias ({reports.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="space-y-3 mt-4">
        {comments.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{c.profile?.full_name} em {c.book?.title}</p>
                <p className="text-sm mt-1">{c.content}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => moderateComment(c.id, true)}>Aprovar</Button>
                <Button size="sm" variant="destructive" onClick={() => moderateComment(c.id, false)}>Rejeitar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {comments.length === 0 && <p className="text-muted-foreground text-sm">Nenhum comentário pendente.</p>}
      </TabsContent>

      <TabsContent value="ratings" className="space-y-3 mt-4">
        {ratings.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{r.profile?.full_name} — {r.book?.title}</p>
                <p className="text-sm text-muted-foreground">Nota: {r.score}/5</p>
              </div>
              <Button size="sm" onClick={() => approveRating(r.id)}>Aprovar</Button>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="reports" className="space-y-3 mt-4">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Denúncia de {r.reporter?.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Motivo:</strong> {r.reason}</p>
              {r.comment && <p className="text-sm text-muted-foreground">Comentário: {r.comment.content}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => resolveReport(r.id, "resolved")}>Resolver</Button>
                <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "dismissed")}>Dispensar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
