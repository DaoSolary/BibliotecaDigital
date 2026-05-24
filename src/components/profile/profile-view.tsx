"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Calendar,
  Heart,
  List,
  LogOut,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDuration } from "@/lib/utils";
import { READING_LIST_LABELS, type ReadingListSlug } from "@/types/reading";
import type { Profile } from "@/types/database";

interface ReadingHistoryItem {
  id: string;
  book_id: string;
  progress_percent: number;
  reading_time_seconds: number;
  last_read_at: string;
  current_page?: number;
  total_pages?: number;
  book?: { id: string; title: string; cover_url: string | null; author?: string } | null;
}

interface ProfileViewProps {
  profile: Profile;
  readingHistory: ReadingHistoryItem[];
  listStatusByBook: Record<string, ReadingListSlug>;
  stats: {
    favoritesCount: number;
    booksReadCount: number;
    listCounts: {
      queroLer: number;
      lendo: number;
      finalizados: number;
    };
  };
}

const roleLabels: Record<Profile["role"], string> = {
  admin: "Administrador",
  user: "Usuário",
};

export function ProfileView({
  profile,
  readingHistory,
  listStatusByBook,
  stats,
}: ProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    router.replace("/auth/login");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || profile.avatar_url || undefined} alt={profile.full_name} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                  {profile.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                  Perfil: {roleLabels[profile.role]}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
              {profile.phone && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membro desde {formatDate(profile.created_at)}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Livros lidos</CardDescription>
            <CardTitle className="text-lg">{stats.booksReadCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quero Ler</CardDescription>
            <CardTitle className="text-lg">{stats.listCounts.queroLer}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lendo</CardDescription>
            <CardTitle className="text-lg">{stats.listCounts.lendo}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Finalizados</CardDescription>
            <CardTitle className="text-lg">{stats.listCounts.finalizados}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Favoritos</CardDescription>
            <CardTitle className="text-lg">{stats.favoritesCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/livros">
              <BookOpen className="mr-2 h-4 w-4" />
              Catálogo
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/favoritos">
              <Heart className="mr-2 h-4 w-4" />
              Favoritos
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/listas">
              <List className="mr-2 h-4 w-4" />
              Minhas listas
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/notificacoes">
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </Link>
          </Button>
          {profile.role === "admin" && (
            <Button asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Administração
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="reading">Leitura</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da conta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{profile.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Perfil (papel)</p>
                <p className="font-medium">{roleLabels[profile.role]}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <ProfileForm profile={profile} onAvatarChange={setAvatarUrl} />
        </TabsContent>

        <TabsContent value="reading" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Livros que você leu ou abriu</CardTitle>
              <CardDescription>
                Registado automaticamente ao clicar em &quot;Ler agora&quot;. Abrir o leitor marca o livro
                como <strong>Lendo</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {readingHistory.length ? (
                readingHistory.map((item) => {
                  const listSlug = listStatusByBook[item.book_id];
                  return (
                    <div key={item.id}>
                      <div className="flex gap-4">
                        <div className="relative h-16 w-11 shrink-0 rounded overflow-hidden bg-muted">
                          {item.book?.cover_url ? (
                            <Image
                              src={item.book.cover_url}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <BookOpen className="h-5 w-5 m-auto text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Link
                            href={`/livros/${item.book_id}`}
                            className="font-medium hover:text-primary block truncate"
                          >
                            {item.book?.title ?? "Livro"}
                          </Link>
                          {item.book?.author && (
                            <p className="text-xs text-muted-foreground">{item.book.author}</p>
                          )}
                          <div className="flex flex-wrap gap-2 items-center">
                            {listSlug && (
                              <Badge variant="secondary">{READING_LIST_LABELS[listSlug]}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Última leitura: {formatDate(item.last_read_at)}
                              {item.reading_time_seconds > 0 &&
                                ` · ${formatDuration(item.reading_time_seconds)}`}
                            </span>
                          </div>
                          {(item.current_page ?? 0) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Página {item.current_page}
                              {item.total_pages ? ` de ${item.total_pages}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="w-28 space-y-1 shrink-0">
                          <Progress value={Number(item.progress_percent)} />
                          <p className="text-xs text-right text-muted-foreground">
                            {Number(item.progress_percent)}%
                          </p>
                          <Button size="sm" variant="outline" asChild className="w-full mt-1">
                            <Link href={`/ler/${item.book_id}`}>Continuar</Link>
                          </Button>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">
                    Nenhum livro registado no histórico ainda.
                  </p>
                  <Button asChild>
                    <Link href="/livros">Ir ao catálogo e ler um livro</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
