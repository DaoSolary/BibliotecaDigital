"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, Ban, UserCheck } from "lucide-react";
import { updateUserRole, blockUser } from "@/lib/actions/admin";
import { traduzirErro } from "@/lib/messages";
import type { UserRole } from "@/types/database";

interface UserActionsProps {
  userId: string;
  role: UserRole;
  isBlocked: boolean;
}

export function UserActions({ userId, role, isBlocked }: UserActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleRole = async (newRole: UserRole) => {
    setLoading(true);
    const result = await updateUserRole(userId, newRole);
    setLoading(false);
    if (result.error) toast.error(traduzirErro(result.error));
    else toast.success("Permissão atualizada");
  };

  const handleBlock = async (blocked: boolean) => {
    setLoading(true);
    const result = await blockUser(userId, blocked);
    setLoading(false);
    if (result.error) toast.error(traduzirErro(result.error));
    else toast.success(blocked ? "Utilizador bloqueado" : "Utilizador desbloqueado");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {role !== "admin" ? (
          <DropdownMenuItem onClick={() => handleRole("admin")}>
            <Shield className="mr-2 h-4 w-4" />
            Tornar administrador
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleRole("user")}>
            <UserCheck className="mr-2 h-4 w-4" />
            Remover admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleBlock(!isBlocked)}>
          <Ban className="mr-2 h-4 w-4" />
          {isBlocked ? "Desbloquear" : "Bloquear usuário"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
