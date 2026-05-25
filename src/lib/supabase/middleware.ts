import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseCookie } from "@/lib/supabase/cookie-types";

function copiarCookies(origem: NextResponse, destino: NextResponse) {
  origem.cookies.getAll().forEach((cookie) => {
    destino.cookies.set(cookie.name, cookie.value, cookie);
  });
}

function redirecionar(url: URL, respostaBase: NextResponse) {
  const redirect = NextResponse.redirect(url);
  copiarCookies(respostaBase, redirect);
  return redirect;
}

function temCookieSessao(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token") || c.name.startsWith("sb-"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute =
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/ler") ||
    pathname.startsWith("/favoritos") ||
    pathname.startsWith("/listas") ||
    pathname.startsWith("/notificacoes");

  if (!isProtectedRoute && !isAdminRoute) {
    return response;
  }

  if (!temCookieSessao(request)) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.searchParams.set("redirect", pathname);
    return redirecionar(login, response);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const login = request.nextUrl.clone();
      login.pathname = "/auth/login";
      login.searchParams.set("redirect", pathname);
      return redirecionar(login, response);
    }

    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_blocked")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin" || profile.is_blocked) {
        const home = request.nextUrl.clone();
        home.pathname = "/";
        return redirecionar(home, response);
      }
    }
  } catch {
    // Rede instável: não redirecionar para login com cookies válidos presentes
    return response;
  }

  return response;
}
