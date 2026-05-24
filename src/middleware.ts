import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/** Auth (/auth/*) fica fora do middleware para login/registo renderizarem de imediato */
export const config = {
  matcher: [
    "/perfil/:path*",
    "/ler/:path*",
    "/favoritos/:path*",
    "/listas/:path*",
    "/notificacoes/:path*",
    "/admin/:path*",
  ],
};
