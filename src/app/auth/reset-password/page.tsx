"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePassword } from "@/lib/actions/auth";
import { traduzirErro } from "@/lib/messages";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await updatePassword(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) toast.error(traduzirErro(result.error));
    else toast.success("Senha redefinida com sucesso!");
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[60vh] px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>Defina sua nova senha de acesso</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
