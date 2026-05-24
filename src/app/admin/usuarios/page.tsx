import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { UserActions } from "@/components/admin/user-actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Gerenciar Usuários" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Usuários</h1>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">E-mail</th>
              <th className="text-left p-3 font-medium">Papel</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Cadastro</th>
              <th className="text-right p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3 font-medium">
                  {user.full_name}
                  {user.is_blocked && <Badge variant="destructive" className="ml-2">Bloqueado</Badge>}
                </td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    Perfil: {user.role === "admin" ? "Administrador" : "Usuário"}
                  </Badge>
                </td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="p-3 text-right">
                  <UserActions userId={user.id} role={user.role} isBlocked={user.is_blocked} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
