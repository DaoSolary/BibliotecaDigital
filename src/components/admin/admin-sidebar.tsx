"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FolderOpen,
  MessageSquare,
  ScrollText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/livros", label: "Livros", icon: BookOpen },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/categorias", label: "Categorias", icon: FolderOpen },
  { href: "/admin/moderacao", label: "Moderação", icon: MessageSquare },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)] p-4 hidden lg:block">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold">Administração</span>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
