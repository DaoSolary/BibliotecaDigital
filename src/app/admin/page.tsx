import { StatsCards } from "@/components/admin/stats-cards";
import { AdminCharts } from "@/components/admin/admin-charts";
import { getDashboardStats } from "@/lib/actions/admin";

export const metadata = { title: "Dashboard Administrativo" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da plataforma</p>
      </div>
      <StatsCards stats={stats} />
      <AdminCharts stats={stats} />
    </div>
  );
}
