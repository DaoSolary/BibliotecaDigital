"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetPassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { obterSessaoCliente } from "@/lib/supabase/auth-client";
import { traduzirErro } from "@/lib/messages";

type AuthMode = "login" | "register" | "forgot";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const erro = searchParams.get("erro");
    const msg = searchParams.get("msg");
    if (erro === "callback") {
      toast.error(
        msg ? traduzirErro(decodeURIComponent(msg)) : "Link de confirmação inválido ou expirado."
      );
    }
    if (erro === "rate_limit") {
      toast.error(
        "Muitas tentativas de autenticação. Aguarde alguns minutos e entre novamente."
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode === "forgot") {
      setReady(true);
      return;
    }

    let ativo = true;
    obterSessaoCliente(supabase).then((session) => {
      if (!ativo) return;
      if (session?.user) {
        const redirect = searchParams.get("redirect") || "/";
        router.replace(redirect);
        return;
      }
      setReady(true);
    });
    return () => {
      ativo = false;
    };
  }, [mode, router, searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(traduzirErro(error.message));
          return;
        }
        toast.success("Bem-vindo de volta!");
        const redirect = searchParams.get("redirect") || "/";
        router.refresh();
        router.replace(redirect);
        return;
      }

      if (mode === "register") {
        const fullName = formData.get("fullName") as string;
        const redirectTo = `${window.location.origin}/auth/callback?next=/perfil`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("database error")) {
            toast.error(
              "Erro ao criar conta no banco. Execute supabase/migrations/fix_user_signup.sql no Supabase."
            );
          } else {
            toast.error(traduzirErro(error.message));
          }
          return;
        }

        if (data.session) {
          toast.success("Conta criada com sucesso!");
          router.refresh();
          router.replace("/perfil");
          return;
        }

        toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        router.replace("/auth/login");
        return;
      }

      const result = await resetPassword(formData);
      if (result.error) {
        toast.error(traduzirErro(result.error));
        return;
      }
      toast.success("E-mail de recuperação enviado!");
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: { title: "Entrar", desc: "Acesse sua conta na biblioteca" },
    register: { title: "Criar conta", desc: "Cadastre-se gratuitamente" },
    forgot: { title: "Recuperar senha", desc: "Enviaremos um link para seu e-mail" },
  };

  if (!ready && (mode === "login" || mode === "register")) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{titles[mode].title}</CardTitle>
          <CardDescription>A carregar…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{titles[mode].title}</CardTitle>
        <CardDescription>{titles[mode].desc}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" name="fullName" required placeholder="Seu nome" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required placeholder="seu@email.com" />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : mode === "register"
                  ? "Criar conta"
                  : "Enviar link"}
          </Button>
          <div className="text-sm text-center text-muted-foreground space-y-1">
            {mode === "login" && (
              <>
                <Link href="/auth/forgot-password" className="text-primary hover:underline block">
                  Esqueceu a senha?
                </Link>
                <p>
                  Não tem conta?{" "}
                  <Link href="/auth/register" className="text-primary hover:underline">
                    Criar conta
                  </Link>
                </p>
              </>
            )}
            {mode === "register" && (
              <p>
                Já tem conta?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            )}
            {mode === "forgot" && (
              <Link href="/auth/login" className="text-primary hover:underline">
                Voltar ao login
              </Link>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
