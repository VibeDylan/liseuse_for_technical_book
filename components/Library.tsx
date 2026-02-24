"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllBooks, addBook, deleteBook } from "@/lib/api-books";
import { generatePdfCover } from "@/lib/pdf-cover";
import {
  getProgress,
  getFavoriteIds,
  toggleFavorite,
  getLastOpened,
} from "@/lib/progress";
import type { Book } from "@/types/book";

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [lastOpened, setLastOpenedState] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "added">("recent");

  const load = useCallback(async () => {
    setLoading(true);
    const list = await getAllBooks();
    setBooks(list);
    const prog: Record<string, number> = {};
    const opened: Record<string, number> = {};
    list.forEach((b) => {
      prog[b.id] = getProgress(b.id);
      const ts = getLastOpened(b.id);
      if (ts) opened[b.id] = ts;
    });
    setProgress(prog);
    setLastOpenedState(opened);
    setFavorites(new Set(getFavoriteIds()));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.includes("pdf")) return;
      e.target.value = "";
      setAdding(true);
      try {
        const cover = await generatePdfCover(file);
        await addBook(file, cover);
        await load();
      } catch (err) {
        console.error(err);
      } finally {
        setAdding(false);
      }
    },
    [load]
  );

  const onDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm("Supprimer ce livre de la bibliothèque ?")) return;
      await deleteBook(id);
      await load();
    },
    [load]
  );

  const toggleFav = useCallback((id: string) => {
    const next = toggleFavorite(id);
    setFavorites((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }, []);

  const enhancedBooks = useMemo(() => {
    return books.map((b) => {
      const p = progress[b.id] ?? 1;
      const openedAt = lastOpened[b.id] ?? null;
      const favorite = favorites.has(b.id);
      const ratio = p > 0 ? Math.min(p / (p || 1), 1) : 0; // fallback, affiné plus bas
      return {
        ...b,
        progressPage: p,
        favorite,
        lastOpened: openedAt,
        // ratio précis recalculé plus loin avec numPages si besoin
        progressRatio: ratio,
      };
    });
  }, [books, favorites, lastOpened, progress]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = enhancedBooks;
    if (q) {
      list = list.filter((b) => b.title.toLowerCase().includes(q));
    }

    const sortFn: Record<typeof sortBy, (a: any, b: any) => number> = {
      recent: (a, b) => {
        const aTs = a.lastOpened ?? a.addedAt;
        const bTs = b.lastOpened ?? b.addedAt;
        return bTs - aTs;
      },
      title: (a, b) => a.title.localeCompare(b.title, "fr"),
      added: (a, b) => b.addedAt - a.addedAt,
    };

    return [...list].sort(sortFn[sortBy]);
  }, [enhancedBooks, search, sortBy]);

  const currentlyReading = filteredAndSorted.filter(
    (b) => (progress[b.id] ?? 1) > 1 || lastOpened[b.id]
  );
  const remaining = filteredAndSorted.filter(
    (b) => !currentlyReading.find((c) => c.id === b.id)
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1c1917] dark:bg-[#1c1917] dark:text-[#faf9f7]">
      <header className="sticky top-0 z-20 border-b border-[#e7e5e4]/80 bg-[#faf9f7]/90 backdrop-blur-md dark:border-[#292524]/80 dark:bg-[#1c1917]/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c1917] text-[#faf9f7] font-semibold text-lg tracking-tight dark:bg-[#faf9f7] dark:text-[#1c1917]">
                F
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#1c1917] dark:text-[#faf9f7]">
                  Folio
                </h1>
                <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">
                  Bibliothèque PDF
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="search"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-56 rounded-lg border border-[#e7e5e4] bg-white py-2 pl-3 pr-9 text-sm text-[#1c1917] placeholder:text-[#a8a29e] focus:border-[#d6d3d1] focus:outline-none focus:ring-1 focus:ring-[#d6d3d1] dark:border-[#44403c] dark:bg-[#292524] dark:text-[#faf9f7] dark:placeholder:text-[#78716c] dark:focus:border-[#57534e] dark:focus:ring-[#57534e]"
                />
                <svg
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-[#1c1917] px-4 py-2 text-sm font-medium text-white hover:bg-[#292524] transition-colors dark:bg-[#faf9f7] dark:text-[#1c1917] dark:hover:bg-[#e7e5e4]">
                {adding ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                Ajouter un PDF
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={onFileChange}
                  className="sr-only"
                  disabled={adding}
                />
              </label>
            </div>
          </div>
          {books.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#78716c] dark:text-[#a8a29e]">
              <span>Trier :</span>
              {[
                { id: "recent", label: "Récemment ouverts" },
                { id: "title", label: "Titre" },
                { id: "added", label: "Date d’ajout" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id as "recent" | "title" | "added")}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    sortBy === opt.id
                      ? "bg-[#1c1917] text-white dark:bg-[#faf9f7] dark:text-[#1c1917]"
                      : "hover:bg-[#e7e5e4] text-[#57534e] dark:hover:bg-[#292524] dark:text-[#a8a29e]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="h-10 w-10 border-2 border-[#1c1917] border-t-transparent rounded-full animate-spin dark:border-[#faf9f7]" />
            <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">Chargement…</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#e7e5e4] text-[#a8a29e] dark:bg-[#292524] dark:text-[#57534e]">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="mb-2 text-base font-medium text-[#1c1917] dark:text-[#faf9f7]">Aucun livre</p>
            <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">Ajoutez un PDF pour commencer votre bibliothèque.</p>
          </div>
        ) : (
          <>
            {currentlyReading.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#78716c] dark:text-[#a8a29e]">
                  En cours de lecture
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {currentlyReading.map((book) => (
                    <LibraryCard
                      key={book.id}
                      book={book}
                      isFavorite={favorites.has(book.id)}
                      progressPage={progress[book.id] ?? 1}
                      lastOpened={lastOpened[book.id]}
                      onDelete={onDelete}
                      onToggleFavorite={toggleFav}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#78716c] dark:text-[#a8a29e]">
                {currentlyReading.length > 0 ? "Tous les livres" : "Bibliothèque"}
              </h2>
              {filteredAndSorted.length === 0 ? (
                <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">Aucun résultat pour « {search} ».</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remaining.map((book) => (
                    <LibraryCard
                      key={book.id}
                      book={book}
                      isFavorite={favorites.has(book.id)}
                      progressPage={progress[book.id] ?? 1}
                      lastOpened={lastOpened[book.id]}
                      onDelete={onDelete}
                      onToggleFavorite={toggleFav}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

interface LibraryCardProps {
  book: Book & {
    progressPage?: number;
    lastOpened?: number | null;
  };
  isFavorite: boolean;
  progressPage: number;
  lastOpened?: number;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onToggleFavorite: (id: string) => void;
}

function formatLastOpened(timestamp?: number) {
  if (!timestamp) return "Jamais ouvert";
  const date = new Date(timestamp);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LibraryCard({
  book,
  isFavorite,
  progressPage,
  lastOpened,
  onDelete,
  onToggleFavorite,
}: LibraryCardProps) {
  const [coverError, setCoverError] = useState(false);
  return (
    <Link
      href={`/lire/${book.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#e7e5e4] bg-white shadow-sm transition-all hover:border-[#d6d3d1] hover:shadow-md dark:border-[#292524] dark:bg-[#292524] dark:hover:border-[#44403c]"
    >
      {/* Couverture : ratio livre ~2/3 */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#e7e5e4] dark:bg-[#1c1917]">
        {book.cover && !coverError ? (
          <img
            src={book.cover}
            alt=""
            className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#a8a29e] dark:text-[#57534e]">
            <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(book.id);
            }}
            className="rounded-full bg-white/90 p-1.5 text-[#57534e] shadow-sm backdrop-blur hover:bg-white dark:bg-black/40 dark:text-[#d6d3d1] dark:hover:bg-black/60"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.332c.499.03.701.663.321.988l-4.204 3.566a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.224 20.393a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.565a.563.563 0 01.321-.988l5.518-.332a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(e, book.id)}
            className="rounded-full bg-white/90 p-1.5 text-[#57534e] shadow-sm backdrop-blur hover:bg-white hover:text-red-600 dark:bg-black/40 dark:text-[#d6d3d1] dark:hover:bg-black/60 dark:hover:text-red-400"
            title="Supprimer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h2 className="line-clamp-2 text-sm font-medium text-[#1c1917] group-hover:text-[#292524] dark:text-[#faf9f7] dark:group-hover:text-[#e7e5e4]">
          {book.title}
        </h2>
        <p className="mt-1 text-xs text-[#78716c] dark:text-[#a8a29e]">
          {formatLastOpened(lastOpened)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-[#78716c] dark:text-[#a8a29e]">Page {progressPage || 1}</span>
          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-[#e7e5e4] dark:bg-[#44403c]">
            <div
              className="h-full rounded-full bg-[#1c1917] dark:bg-[#faf9f7] transition-all"
              style={{
                width: `${Math.min(100, Math.max(2, (progressPage || 1) * 3))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
