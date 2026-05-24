import { ModerationPanel } from "@/components/admin/moderation-panel";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Moderação" };

export default async function ModerationPage() {
  const supabase = await createClient();

  const [{ data: pendingComments }, { data: pendingRatings }, { data: reports }] = await Promise.all([
    supabase
      .from("comments")
      .select("*, profile:profiles(full_name), book:books(title)")
      .eq("is_approved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("ratings")
      .select("*, profile:profiles(full_name), book:books(title)")
      .eq("is_approved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("*, comment:comments(content), reporter:profiles!reports_reported_by_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Moderação</h1>
      <ModerationPanel
        comments={pendingComments ?? []}
        ratings={pendingRatings ?? []}
        reports={reports ?? []}
      />
    </div>
  );
}
