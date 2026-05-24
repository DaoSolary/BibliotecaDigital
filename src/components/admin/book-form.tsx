"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBook,
  updateBook,
  adminUploadBookCover,
  adminUploadBookPdf,
} from "@/lib/actions/admin";
import { traduzirErro } from "@/lib/messages";
import type { Book, Category } from "@/types/database";

interface BookFormProps {
  categories: Category[];
  book?: Book;
}

export function BookForm({ categories, book }: BookFormProps) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(book?.category_id ?? "");
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? "");
  const [pdfUrl, setPdfUrl] = useState(book?.pdf_url ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [downloadAllowed, setDownloadAllowed] = useState(book?.download_allowed ?? false);
  const [isFeatured, setIsFeatured] = useState(book?.is_featured ?? false);
  const [isPublished, setIsPublished] = useState(book?.is_published ?? true);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const uploadId = book?.id ?? crypto.randomUUID();

    try {
      if (coverFile) {
        const coverForm = new FormData();
        coverForm.append("file", coverFile);
        const { url, error } = await adminUploadBookCover(uploadId, coverForm);
        if (error) {
          toast.error(`Capa: ${traduzirErro(error)}`);
          return;
        }
        if (url) {
          setCoverUrl(url);
          formData.set("coverUrl", url);
        }
      } else {
        formData.set("coverUrl", coverUrl.trim());
      }

      if (pdfFile) {
        const pdfForm = new FormData();
        pdfForm.append("file", pdfFile);
        const { url, error } = await adminUploadBookPdf(uploadId, pdfForm);
        if (error) {
          toast.error(`PDF: ${traduzirErro(error)}`);
          return;
        }
        if (url) {
          setPdfUrl(url);
          formData.set("pdfUrl", url);
        }
      } else {
        formData.set("pdfUrl", pdfUrl.trim());
      }

      const pdfFinal = (formData.get("pdfUrl") as string)?.trim();
      if (!pdfFinal && !book) {
        toast.error("Envie um PDF ou cole a URL do ficheiro no Storage.");
        return;
      }
      if (!pdfFinal && book) {
        toast.error("O livro precisa de um PDF. Envie um ficheiro ou mantenha a URL existente.");
        return;
      }

      formData.set("bookId", uploadId);
      formData.set("categoryId", categoryId);

      const result = book
        ? await updateBook(book.id, formData)
        : await createBook(formData);

      if (result.error) {
        toast.error(traduzirErro(result.error));
        return;
      }

      toast.success(book ? "Livro atualizado!" : "Livro criado!");
      router.push("/admin/livros");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" name="title" defaultValue={book?.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Autor *</Label>
          <Input id="author" name="author" defaultValue={book?.author} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input id="isbn" name="isbn" defaultValue={book?.isbn ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" defaultValue={book?.description ?? ""} rows={4} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <Select
            value={categoryId || "__none__"}
            onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem categoria</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" name="year" type="number" defaultValue={book?.year ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <Input id="language" name="language" defaultValue={book?.language ?? "pt-BR"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pageCount">Nº de páginas</Label>
          <Input id="pageCount" name="pageCount" type="number" defaultValue={book?.page_count ?? 0} />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Capa do livro
        </h3>
        {coverUrl && (
          <div className="relative h-40 w-28 rounded overflow-hidden border bg-muted">
            <Image src={coverUrl} alt="Capa" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="coverFile">Enviar imagem (recomendado)</Label>
          <Input
            id="coverFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverUrl">Ou URL da capa (Supabase Storage)</Label>
          <Input
            id="coverUrl"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://SEU_PROJETO.supabase.co/storage/v1/object/public/books-covers/..."
          />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Ficheiro PDF {!book && "*"}
        </h3>
        <div className="space-y-2">
          <Label htmlFor="pdfFile">Enviar PDF (recomendado)</Label>
          <Input
            id="pdfFile"
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          />
          {pdfFile && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Upload className="h-3 w-3" />
              {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pdfUrl">Ou URL do PDF (Supabase Storage)</Label>
          <Input
            id="pdfUrl"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://SEU_PROJETO.supabase.co/storage/v1/object/public/books-pdfs/..."
          />
        </div>
        {book && (
          <p className="text-xs text-muted-foreground">
            Ao editar, pode alterar só a capa — o PDF atual mantém-se se não enviar outro ficheiro.
          </p>
        )}
      </div>

      <input type="hidden" name="downloadAllowed" value={String(downloadAllowed)} />
      <input type="hidden" name="isFeatured" value={String(isFeatured)} />
      {book && <input type="hidden" name="isPublished" value={String(isPublished)} />}

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch id="downloadAllowed" checked={downloadAllowed} onCheckedChange={setDownloadAllowed} />
          <Label htmlFor="downloadAllowed">Permitir download</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
          <Label htmlFor="isFeatured">Destacar livro</Label>
        </div>
        {book && (
          <div className="flex items-center gap-2">
            <Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} />
            <Label htmlFor="isPublished">Publicado</Label>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "A enviar…" : book ? "Atualizar livro" : "Adicionar livro"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
