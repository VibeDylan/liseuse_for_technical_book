import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKS_DIR = path.join(DATA_DIR, "books");
const LIBRARY_FILE = path.join(DATA_DIR, "library.json");

export interface StoredBook {
  id: string;
  title: string;
  addedAt: number;
}

interface LibrarySchema {
  books: StoredBook[];
}

async function ensureBooksDir() {
  await mkdir(BOOKS_DIR, { recursive: true });
}

export async function readLibrary(): Promise<LibrarySchema> {
  try {
    const raw = await readFile(LIBRARY_FILE, "utf-8");
    return JSON.parse(raw) as LibrarySchema;
  } catch {
    return { books: [] };
  }
}

export async function writeLibrary(data: LibrarySchema): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LIBRARY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function getBookFilePath(id: string): string {
  return path.join(BOOKS_DIR, `${id}.pdf`);
}

export function getCoverFilePath(id: string): string {
  return path.join(BOOKS_DIR, `${id}.jpg`);
}

export async function bookFileExists(id: string): Promise<boolean> {
  try {
    const p = getBookFilePath(id);
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

export async function coverFileExists(id: string): Promise<boolean> {
  try {
    const p = getCoverFilePath(id);
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

export { BOOKS_DIR, ensureBooksDir };
