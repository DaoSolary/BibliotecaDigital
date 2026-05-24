"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { BackupButton } from "@/components/admin/backup-button";

const LABELS: Record<string, string> = {
  "livro.criado": "Livro criado",
  "livro.atualizado": "Livro atualizado",
  "livro.excluido": "Livro excluído",
  "perfil.atualizado": "Perfil atualizado",
  "senha.alterada": "Senha alterada",
  "usuario.bloqueado": "Usuário bloqueado",
  "usuario.desbloqueado": "Usuário desbloqueado",
  "usuario.papel_alterado": "Papel alterado",
  "categoria.criada": "Categoria criada",
  "comentario.moderado": "Comentário moderado",
  "backup.exportado": "Backup exportado",
};

interface LogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  profile?: { full_name: string } | null;
}

export function LogsTable() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("system_logs")
      .select("*, profile:profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Registo de ações: livros, perfis, utilizadores e backups
          </p>
        </div>
        <div className="flex gap-2">
          <BackupButton />
          <button
            type="button"
            onClick={carregar}
            className="text-sm text-primary hover:underline"
          >
            Atualizar lista
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Data</th>
                <th className="text-left p-3 font-medium">Utilizador</th>
                <th className="text-left p-3 font-medium">Ação</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="p-3">{log.profile?.full_name ?? "Sistema"}</td>
                  <td className="p-3">
                    <Badge variant="outline">{LABELS[log.action] ?? log.action}</Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {log.entity_type}
                    {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registo ainda. As ações passam a aparecer após criar livros, editar perfis, etc.
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border p-4 bg-muted/30 text-sm text-muted-foreground">
        O backup JSON inclui perfis, livros, categorias, tags e os últimos 500 logs. Para backup
        completo da base de dados, use também o Supabase em Settings → Database → Backups.
      </div>
    </div>
  );
}
