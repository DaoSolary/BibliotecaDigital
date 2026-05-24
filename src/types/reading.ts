export const READING_LIST_SLUGS = ["quero-ler", "lendo", "finalizados"] as const;
export type ReadingListSlug = (typeof READING_LIST_SLUGS)[number];

export const READING_LIST_LABELS: Record<ReadingListSlug, string> = {
  "quero-ler": "Quero Ler",
  lendo: "Lendo",
  finalizados: "Finalizados",
};
