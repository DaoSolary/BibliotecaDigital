import { BookOpen, Download, Users, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types/database";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: "Total de usuários", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Total de livros", value: stats.totalBooks, icon: BookOpen, color: "text-green-500" },
    { title: "Downloads totais", value: stats.totalDownloads, icon: Download, color: "text-purple-500" },
    { title: "Novos hoje", value: stats.newUsersToday, icon: UserPlus, color: "text-orange-500" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
