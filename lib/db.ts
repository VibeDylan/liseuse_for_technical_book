import { openDB, type IDBPDatabase } from "idb";
import type { Book } from "@/types/book";

const DB_NAME = "liseuse-db";
const STORE_BOOKS = "books";
const DB_VERSION = 1;

interface BookRecord extends Book {
  blob: Blob;
  cover?: string | null;
}

let dbPromise: Promise<IDBPDatabase<{ books: { key: string; value: BookRecord } }>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore(STORE_BOOKS, { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  if (!db) return [];
  const records = await db.getAll(STORE_BOOKS);
  return records.map(({ id, title, addedAt, cover }) => ({
    id,
    title,
    addedAt,
    cover: cover ?? null,
  }));
}

export async function getBookBlob(id: string): Promise<Blob | null> {
  const db = await getDB();
  if (!db) return null;
  const record = await db.get(STORE_BOOKS, id);
  return record?.blob ?? null;
}

export async function addBook(
  file: File,
  coverDataUrl?: string | null
): Promise<Book> {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB non disponible");
  const id = crypto.randomUUID();
  const book: BookRecord = {
    id,
    title: file.name.replace(/\.pdf$/i, "") || file.name,
    addedAt: Date.now(),
    blob: file,
    cover: coverDataUrl ?? null,
  };
  await db.add(STORE_BOOKS, book);
  return {
    id,
    title: book.title,
    addedAt: book.addedAt,
    cover: book.cover ?? null,
  };
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_BOOKS, id);
}
