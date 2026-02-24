"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBookBlob, getAllBooks } from "@/lib/api-books";
import PdfReader from "@/components/PdfReader";
import type { Book } from "@/types/book";

export default function LirePage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const [book, setBook] = useState<Book | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const list = await getAllBooks();
    const b = list.find((x) => x.id === id) ?? null;
    setBook(b);
    if (!b) {
      setError("Livre introuvable");
      return;
    }
    const bl = await getBookBlob(id);
    if (!bl) {
      setError("Impossible de charger le fichier");
      return;
    }
    setBlob(bl);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500">Identifiant manquant.</p>
      </div>
    );
  }

  if (error || (book === null && !blob)) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600 dark:text-red-400">{error ?? "Chargement…"}</p>
        <Link
          href="/"
          className="text-amber-600 dark:text-amber-400 hover:underline"
        >
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-100 dark:bg-stone-900">
      <header className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
        <Link
          href="/"
          className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="Retour à Folio"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="flex-1 truncate text-sm font-medium text-stone-900 dark:text-stone-100">
          {book?.title ?? "…"}
        </h1>
        <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500">Folio</span>
      </header>
      <div className="flex-1 min-h-0">
        {blob && <PdfReader bookId={id} blob={blob} />}
      </div>
    </div>
  );
}
