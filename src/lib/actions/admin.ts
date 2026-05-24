"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registarLog } from "@/lib/actions/logs";
import { uploadBookCover, uploadBookPdf } from "@/lib/storage";
import type { DashboardStats } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Acesso negado");
  return { supabase, userId: user.id };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: totalBooks },
    { count: totalDownloads },
    { count: newUsersToday },
    { data: topBooks },
    { data: recentDownloads },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("download_history").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabase.from("books").select("title, read_count").order("read_count", { ascending: false }).limit(5),
    supabase.from("download_history").select("downloaded_at").gte("downloaded_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const downloadsByDay: Record<string, number> = {};
  recentDownloads?.forEach((d) => {
    const date = new Date(d.downloaded_at).toLocaleDateString("pt-BR");
    downloadsByDay[date] = (downloadsByDay[date] ?? 0) + 1;
  });

  return {
    totalUsers: totalUsers ?? 0,
    totalBooks: totalBooks ?? 0,
    totalDownloads: totalDownloads ?? 0,
    newUsersToday: newUsersToday ?? 0,
    topBooks: topBooks ?? [],
    downloadsByDay: Object.entries(downloadsByDay).map(([date, count]) => ({ date, count })),
  };
}

export async function createBook(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const bookId = formData.get("bookId") as string | null;
  const categoryId = formData.get("categoryId") as string;

  const { data: inserted, error } = await supabase.from("books").insert({
    ...(bookId ? { id: bookId } : {}),
    title: formData.get("title") as string,
    author: formData.get("author") as string,
    description: formData.get("description") as string,
    isbn: formData.get("isbn") as string,
    category_id: categoryId || null,
    cover_url: (formData.get("coverUrl") as string) || null,
    pdf_url: (formData.get("pdfUrl") as string) || null,
    year: parseInt(formData.get("year") as string) || null,
    language: formData.get("language") as string || "pt-BR",
    page_count: parseInt(formData.get("pageCount") as string) || 0,
    download_allowed: formData.get("downloadAllowed") === "true",
    is_featured: formData.get("isFeatured") === "true",
    created_by: userId,
  }).select("id").single();

  if (error) return { error: error.message };

  await registarLog("livro.criado", {
    entityType: "book",
    entityId: inserted.id,
    userId,
    metadata: { title: formData.get("title") as string },
  });

  revalidatePath("/admin/livros");
  return { success: true };
}

export async function adminUploadBookCover(bookId: string, formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    const file = formData.get("file") as File | null;
    if (!file?.size) return { error: "Selecione uma imagem válida" };
    return await uploadBookCover(supabase, file, bookId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao enviar capa";
    return { error: msg };
  }
}

export async function adminUploadBookPdf(bookId: string, formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    const file = formData.get("file") as File | null;
    if (!file?.size) return { error: "Selecione um PDF válido" };
    return await uploadBookPdf(supabase, file, bookId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao enviar PDF";
    return { error: msg };
  }
}

export async function updateBook(id: string, formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const categoryId = (formData.get("categoryId") as string)?.trim();

  const { error } = await supabase.from("books").update({
    title: formData.get("title") as string,
    author: formData.get("author") as string,
    description: (formData.get("description") as string) || null,
    isbn: (formData.get("isbn") as string) || null,
    category_id: categoryId || null,
    cover_url: (formData.get("coverUrl") as string) || null,
    pdf_url: (formData.get("pdfUrl") as string) || null,
    year: parseInt(formData.get("year") as string) || null,
    page_count: parseInt(formData.get("pageCount") as string) || 0,
    download_allowed: formData.get("downloadAllowed") === "true",
    is_featured: formData.get("isFeatured") === "true",
    is_published: formData.get("isPublished") !== "false",
  }).eq("id", id);

  if (error) return { error: error.message };

  await registarLog("livro.atualizado", {
    entityType: "book",
    entityId: id,
    userId,
    metadata: { title: formData.get("title") as string },
  });

  revalidatePath("/admin/livros");
  return { success: true };
}

export async function deleteBook(id: string) {
  const { supabase, userId } = await requireAdmin();
  const { data: book } = await supabase.from("books").select("title").eq("id", id).single();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { error: error.message };

  await registarLog("livro.excluido", {
    entityType: "book",
    entityId: id,
    userId,
    metadata: { title: book?.title },
  });

  revalidatePath("/admin/livros");
  return { success: true };
}

export async function updateUserRole(userId: string, role: "user" | "admin") {
  const { supabase, userId: adminId } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  await registarLog("usuario.papel_alterado", {
    entityType: "profile",
    entityId: userId,
    userId: adminId,
    metadata: { role },
  });
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function blockUser(userId: string, blocked: boolean) {
  const { supabase, userId: adminId } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ is_blocked: blocked }).eq("id", userId);
  if (error) return { error: error.message };
  await registarLog(blocked ? "usuario.bloqueado" : "usuario.desbloqueado", {
    entityType: "profile",
    entityId: userId,
    userId: adminId,
  });
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function createCategory(name: string, description?: string) {
  const { supabase, userId } = await requireAdmin();
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
  const { error } = await supabase.from("categories").insert({ name, slug, description });
  if (error) return { error: error.message };
  await registarLog("categoria.criada", {
    entityType: "category",
    userId,
    metadata: { name, slug },
  });
  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function moderateComment(commentId: string, approved: boolean) {
  const { supabase, userId } = await requireAdmin();
  await supabase.from("comments").update({ is_approved: approved }).eq("id", commentId);
  await registarLog("comentario.moderado", {
    entityType: "comment",
    entityId: commentId,
    userId,
    metadata: { approved },
  });
  revalidatePath("/admin/moderacao");
  return { success: true };
}

export async function exportarBackup(): Promise<{
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const { supabase, userId } = await requireAdmin();

  const [profiles, books, categories, tags, logs] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, created_at"),
    supabase.from("books").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("tags").select("*"),
    supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(500),
  ]);

  const backup = {
    exportadoEm: new Date().toISOString(),
    profiles: profiles.data ?? [],
    books: books.data ?? [],
    categories: categories.data ?? [],
    tags: tags.data ?? [],
    system_logs: logs.data ?? [],
  };

  await registarLog("backup.exportado", { userId, metadata: { registos: backup.books.length } });

  return { success: true, data: backup };
}

export async function notifyAllUsers(title: string, message: string, link?: string) {
  const { supabase } = await requireAdmin();
  const { data: users } = await supabase.from("profiles").select("id").eq("is_blocked", false);

  if (users?.length) {
    await supabase.from("notifications").insert(
      users.map((u) => ({
        user_id: u.id,
        type: "new_book" as const,
        title,
        message,
        link: link ?? null,
      }))
    );
  }
  return { success: true };
}
