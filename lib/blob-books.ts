import { put, get, del, list } from "@vercel/blob";

const PREFIX = "book_api";

export interface StoredBook {
  id: string;
  title: string;
  addedAt: number;
  pdfUrl: string;
  coverUrl?: string | null;
}

interface LibrarySchema {
  books: StoredBook[];
}

const LIBRARY_PATH = `${PREFIX}/library.json`;

const BLOB_OPTS = { access: "private" as const };

/** Lit le fichier library.json depuis le Blob store */
export async function readLibrary(): Promise<LibrarySchema> {
  const res = await get(LIBRARY_PATH, BLOB_OPTS);
  if (!res || res.statusCode !== 200 || !res.stream) return { books: [] };
  const chunks: Uint8Array[] = [];
  const reader = res.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const length = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  const text = new TextDecoder().decode(out);
  try {
    return JSON.parse(text) as LibrarySchema;
  } catch {
    return { books: [] };
  }
}

/** Écrit library.json dans le Blob store */
export async function writeLibrary(data: LibrarySchema): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  await put(LIBRARY_PATH, body, {
    ...BLOB_OPTS,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/** Chemin du PDF pour un id */
export function pdfPath(id: string): string {
  return `${PREFIX}/${id}.pdf`;
}

/** Chemin de la couverture pour un id */
export function coverPath(id: string): string {
  return `${PREFIX}/${id}.jpg`;
}

/** Upload un PDF et optionnellement une couverture, met à jour la library */
export async function uploadBook(
  id: string,
  title: string,
  pdfBuffer: Buffer,
  coverBuffer: Buffer | null
): Promise<StoredBook> {
  const pdfResult = await put(pdfPath(id), pdfBuffer, {
    ...BLOB_OPTS,
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  let coverUrl: string | null = null;
  if (coverBuffer && coverBuffer.length > 0) {
    const coverResult = await put(coverPath(id), coverBuffer, {
      ...BLOB_OPTS,
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    coverUrl = coverResult.url;
  }

  const book: StoredBook = {
    id,
    title,
    addedAt: Date.now(),
    pdfUrl: pdfResult.url,
    coverUrl,
  };

  const lib = await readLibrary();
  lib.books.push(book);
  await writeLibrary(lib);
  return book;
}

/** Récupère le stream du PDF (pour GET /api/books/[id]/file) */
export async function getPdfStream(urlOrPath: string) {
  return get(urlOrPath, BLOB_OPTS);
}

/** Récupère le stream de la couverture */
export async function getCoverStream(urlOrPath: string) {
  return get(urlOrPath, BLOB_OPTS);
}

/** Enregistre un livre déjà uploadé (URLs Blob) — utilisé après upload client */
export async function addBookFromUrls(
  id: string,
  title: string,
  pdfUrl: string,
  coverUrl?: string | null
): Promise<StoredBook> {
  const book: StoredBook = {
    id,
    title,
    addedAt: Date.now(),
    pdfUrl,
    coverUrl: coverUrl ?? null,
  };
  const lib = await readLibrary();
  lib.books.push(book);
  await writeLibrary(lib);
  return book;
}

/** Supprime le livre (PDF + cover) et met à jour la library */
export async function removeBook(id: string): Promise<void> {
  const lib = await readLibrary();
  const book = lib.books.find((b) => b.id === id);
  if (!book) return;

  const toDelete: string[] = [book.pdfUrl];
  if (book.coverUrl) toDelete.push(book.coverUrl);
  await del(toDelete);

  lib.books = lib.books.filter((b) => b.id !== id);
  await writeLibrary(lib);
}
