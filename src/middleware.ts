import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Só /admin e /ler no middleware (1× getUser por pedido).
 * /perfil, /favoritos, /listas e /notificacoes validam sessão no cliente (evita 429).
 */
export const config = {
  matcher: ["/admin/:path*", "/ler/:path*"],
};
