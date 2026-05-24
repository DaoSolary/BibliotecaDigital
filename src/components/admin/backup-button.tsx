"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportarBackup } from "@/lib/actions/admin";
import { traduzirErro } from "@/lib/messages";

export function BackupButton() {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    const result = await exportarBackup();
    setLoading(false);

    if (result.error || !result.data) {
      toast.error(traduzirErro(result.error ?? "Não foi possível gerar o backup."));
      return;
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblioteca-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Backup exportado com sucesso!");
  };

  return (
    <Button onClick={handleBackup} disabled={loading} variant="outline">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Exportar backup (JSON)
    </Button>
  );
}
