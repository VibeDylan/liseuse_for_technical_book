import type { Book } from "@/types/book";

const BASE = "";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

async function apiGetBlob(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.blob();
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

/** Liste des livres (stockés dans Vercel Blob, préfixe book_api) */
export async function getAllBooks(): Promise<Book[]> {
  const list = await apiGet<Array<{ id: string; title: string; addedAt: number; cover: string | null }>>("/api/books");
  return list.map((b) => ({
    ...b,
    cover: b.cover ?? `/api/books/${b.id}/cover`,
  }));
}

/** Récupère le PDF d'un livre sous forme de Blob */
export async function getBookBlob(id: string): Promise<Blob | null> {
  try {
    return await apiGetBlob(`/api/books/${id}/file`);
  } catch {
    return null;
  }
}

/** Réserve un id pour upload client (gros PDF, contourne la limite 4.5 Mo). */
export async function reserveBook(filename: string): Promise<{
  id: string;
  title: string;
  pathnamePdf: string;
  pathnameCover: string;
}> {
  const res = await fetch(`${BASE}/api/books/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

/** Enregistre le livre après upload client (pdfUrl + coverUrl optionnel). */
export async function confirmBook(
  id: string,
  title: string,
  pdfUrl: string,
  coverUrl?: string | null
): Promise<Book> {
  const res = await fetch(`${BASE}/api/books/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, title, pdfUrl, coverUrl: coverUrl ?? null }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const book = (await res.json()) as { id: string; title: string; addedAt: number; cover: string | null };
  return { ...book, cover: book.cover ?? `/api/books/${book.id}/cover` };
}

/** Supprime un livre (fichiers dans data/books + entrée dans library.json) */
export async function deleteBook(id: string): Promise<void> {
  await apiDelete(`/api/books/${id}`);
}
