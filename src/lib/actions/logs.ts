"use server";

import { createClient } from "@/lib/supabase/server";

export type LogAction =
  | "livro.criado"
  | "livro.atualizado"
  | "livro.excluido"
  | "perfil.atualizado"
  | "senha.alterada"
  | "usuario.bloqueado"
  | "usuario.desbloqueado"
  | "usuario.papel_alterado"
  | "categoria.criada"
  | "comentario.moderado"
  | "backup.exportado"
  | "login"
  | "logout";

export async function registarLog(
  action: LogAction | string,
  options?: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    userId?: string | null;
  }
) {
  try {
    const supabase = await createClient();
    let userId = options?.userId ?? null;

    if (userId === undefined) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    await supabase.from("system_logs").insert({
      user_id: userId,
      action,
      entity_type: options?.entityType ?? null,
      entity_id: options?.entityId ?? null,
      metadata: options?.metadata ?? null,
    });
  } catch {
    // Não bloquear a operação principal se o log falhar
  }
}
