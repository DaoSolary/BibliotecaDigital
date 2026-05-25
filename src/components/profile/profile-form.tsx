"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, updatePassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/storage";
import { traduzirErro } from "@/lib/messages";
import type { Profile } from "@/types/database";

interface ProfileFormProps {
  profile: Profile;
  onAvatarChange?: (url: string) => void;
}

export function ProfileForm({ profile, onAvatarChange }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = profile.role === "admin" ? "Administrador" : "Usuário";

  const handlePhotoFromPc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const supabase = createClient();
    const { url, error } = await uploadAvatar(supabase, file, profile.id);
    setUploadingPhoto(false);

    if (error) {
      toast.error(traduzirErro(error));
      return;
    }

    if (!url) return;

    setAvatarUrl(url);
    onAvatarChange?.(url);

    const formData = new FormData();
    formData.set("fullName", profile.full_name);
    formData.set("phone", profile.phone ?? "");
    formData.set("avatarUrl", url);

    const result = await updateProfile(formData);
    if (result.error) {
      toast.error(traduzirErro(result.error));
      return;
    }

    toast.success("Foto atualizada!");
    router.refresh();
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("avatarUrl", avatarUrl);
    const result = await updateProfile(formData);
    setLoading(false);
    if (result.error) toast.error(traduzirErro(result.error));
    else {
      toast.success("Perfil atualizado!");
      router.refresh();
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);
    setLoading(false);
    if (result.error) toast.error(traduzirErro(result.error));
    else toast.success("Senha alterada!");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            Dados do perfil
            <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
              Perfil: {roleLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
              <Label>Foto de perfil</Label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={avatarUrl || undefined} alt={profile.full_name} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-3 flex-1 w-full">
                  {avatarUrl && (
                    <div className="relative h-20 w-20 rounded overflow-hidden border hidden sm:block">
                      <Image src={avatarUrl} alt="Pré-visualização" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoFromPc}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingPhoto ? "A enviar…" : "Escolher foto do computador"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG ou WebP — máx. 5 MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil / Papel</Label>
              <Input id="role" value={roleLabel} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={profile.phone ?? ""}
                placeholder="923092312"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Salvar perfil
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <Button type="submit" variant="outline" disabled={loading}>
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
