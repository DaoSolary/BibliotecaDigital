/** Evita páginas presas quando o Supabase demora ou está offline */
export async function comTimeout<T>(
  promessa: PromiseLike<T>,
  ms = 6000
): Promise<{ data: T | null; timedOut: boolean }> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), ms);
  });

  const resultado = await Promise.race([promessa, timeout]);
  clearTimeout(timeoutId!);

  if (resultado === null) {
    return { data: null, timedOut: true };
  }
  return { data: resultado as T, timedOut: false };
}
