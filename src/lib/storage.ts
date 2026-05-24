import type { SupabaseClient } from "@supabase/supabase-js";

const COVERS_BUCKET = "books-covers";
const PDFS_BUCKET = "books-pdfs";
const AVATARS_BUCKET = "avatars";

export function getPublicStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

/** Extrai bucket e path de URLs do Supabase Storage */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const publicMatch = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (publicMatch) return { bucket: publicMatch[1], path: decodeURIComponent(publicMatch[2]) };

    const signMatch = u.pathname.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)/);
    if (signMatch) return { bucket: signMatch[1], path: decodeURIComponent(signMatch[2]) };

    const privateMatch = u.pathname.match(/\/storage\/v1\/object\/([^/]+)\/(.+)/);
    if (privateMatch && privateMatch[1] !== "sign") {
      return { bucket: privateMatch[1], path: decodeURIComponent(privateMatch[2]) };
    }
  } catch {
    return null;
  }
  return null;
}

export async function resolvePdfFetchUrl(
  supabase: SupabaseClient,
  pdfUrl: string
): Promise<string> {
  if (!pdfUrl) return pdfUrl;

  const parsed = parseStorageUrl(pdfUrl);
  if (!parsed) return pdfUrl;

  if (parsed.bucket === PDFS_BUCKET) {
    const { data, error } = await supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  return pdfUrl;
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  file: File,
  userId: string
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp"];
  if (!allowed.includes(ext)) return { error: "Use JPG, PNG ou WebP" };
  if (file.size > 5 * 1024 * 1024) return { error: "Imagem até 5 MB" };

  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
  });

  if (error) return { error: error.message };
  return { url: `${getPublicStorageUrl(AVATARS_BUCKET, path)}?t=${Date.now()}` };
}

export async function uploadBookCover(
  supabase: SupabaseClient,
  file: File,
  bookId: string
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp"];
  if (!allowed.includes(ext)) {
    return { error: "Use JPG, PNG ou WebP para a capa" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Capa até 10 MB" };
  }

  const path = `${bookId}/cover.${ext}`;
  const contentType = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

  const { error } = await supabase.storage.from(COVERS_BUCKET).upload(path, file, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      return {
        error:
          "Sem permissão no Storage. Execute supabase/migrations/storage_and_read_count.sql e confirme que o seu utilizador é admin.",
      };
    }
    if (error.message.toLowerCase().includes("bucket")) {
      return { error: "Bucket books-covers não existe. Crie-o no Supabase Storage (público)." };
    }
    return { error: error.message };
  }

  return { url: `${getPublicStorageUrl(COVERS_BUCKET, path)}?t=${Date.now()}` };
}

export async function uploadBookPdf(
  supabase: SupabaseClient,
  file: File,
  bookId: string
): Promise<{ url?: string; error?: string }> {
  const path = `${bookId}/book.pdf`;

  if (file.size > 80 * 1024 * 1024) {
    return { error: "PDF até 80 MB" };
  }

  const { error } = await supabase.storage.from(PDFS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: "application/pdf",
    cacheControl: "3600",
  });

  if (error) return { error: error.message };

  // Guardamos URL pública ou path — o leitor usa proxy /api/books/[id]/pdf
  return { url: getPublicStorageUrl(PDFS_BUCKET, path) };
}

export { COVERS_BUCKET, PDFS_BUCKET, AVATARS_BUCKET };
