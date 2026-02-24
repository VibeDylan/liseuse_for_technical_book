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

/** Ajoute un livre (fichier enregistré dans data/books) */
export async function addBook(
  file: File,
  coverDataUrl?: string | null
): Promise<Book> {
  const formData = new FormData();
  formData.set("file", file);
  if (coverDataUrl) formData.set("cover", coverDataUrl);

  const res = await fetch(`${BASE}/api/books`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur lors de l'ajout");
  }
  const book = (await res.json()) as { id: string; title: string; addedAt: number };
  return {
    ...book,
    cover: coverDataUrl || `/api/books/${book.id}/cover`,
  };
}

/** Supprime un livre (fichiers dans data/books + entrée dans library.json) */
export async function deleteBook(id: string): Promise<void> {
  await apiDelete(`/api/books/${id}`);
}
