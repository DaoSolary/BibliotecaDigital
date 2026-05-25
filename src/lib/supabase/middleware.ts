import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseCookie } from "@/lib/supabase/cookie-types";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

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

function limparCookiesAuth(resposta: NextResponse, request: NextRequest) {
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")) {
      resposta.cookies.delete(cookie.name);
    }
  });
}

function temCookieSessao(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token") || c.name.startsWith("sb-"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isReaderRoute = pathname.startsWith("/ler");

  if (!isAdminRoute && !isReaderRoute) {
    return response;
  }

  if (!temCookieSessao(request)) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.searchParams.set("redirect", pathname);
    return redirecionar(login, response);
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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
      error,
    } = await supabase.auth.getUser();

    const rateLimited =
      error &&
      (error.status === 429 ||
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("too many"));

    if (rateLimited) {
      limparCookiesAuth(response, request);
      const login = request.nextUrl.clone();
      login.pathname = "/auth/login";
      login.searchParams.set("redirect", pathname);
      login.searchParams.set("erro", "rate_limit");
      return redirecionar(login, response);
    }

    if (!user) {
      limparCookiesAuth(response, request);
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
    return response;
  }

  return response;
}
