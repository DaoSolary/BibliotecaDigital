/**
 * Fetch para Supabase no servidor.
 * Sem timeout global — o abort de 8s causava TimeoutError no middleware Edge
 * e falhas em uploads de capa/PDF.
 */
export function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, init);
}

/** Opcional: APIs que precisam de limite (ex. catálogo público) */
export function supabaseFetchComTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms = 15000
) {
  if (typeof AbortSignal.timeout !== "function") {
    return fetch(input, init);
  }
  const signal = init?.signal ?? AbortSignal.timeout(ms);
  return fetch(input, { ...init, signal });
}
