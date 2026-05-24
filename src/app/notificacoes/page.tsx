"use client";

import { useEffect, useState } from "react";
import { Bell, BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types/database";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data ?? []);
    };
    load();
  }, [supabase]);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    setNotifications((n) => n.map((item) => ({ ...item, is_read: true })));
  };

  const icons = {
    new_book: BookOpen,
    comment_reply: MessageSquare,
    system: Bell,
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notificações</h1>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = icons[n.type];
          const content = (
            <Card className={!n.is_read ? "border-primary/50 bg-primary/5" : ""}>
              <CardContent className="flex gap-4 p-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          );
          return n.link ? (
            <Link key={n.id} href={n.link}>{content}</Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
        {notifications.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhuma notificação.</p>
        )}
      </div>
    </div>
  );
}
