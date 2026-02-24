"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  setProgress,
  getProgress,
  getBookmarks,
  addBookmark,
  removeBookmark,
  setLastOpened,
  type Bookmark,
} from "@/lib/progress";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfReaderProps {
  bookId: string;
  blob: Blob;
}

export default function PdfReader({ bookId, blob }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    const initialPage = getProgress(bookId);
    setPageNumber(initialPage);
    setLastOpened(bookId, Date.now());
    setBookmarks(getBookmarks(bookId));
    return () => URL.revokeObjectURL(url);
  }, [blob, bookId]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      const saved = getProgress(bookId);
      setPageNumber(Math.min(saved, numPages));
    },
    [bookId]
  );

  const baseWidth = useMemo(
    () => Math.min(typeof window !== "undefined" ? window.innerWidth : 800, 900),
    []
  );

  const goToPage = useCallback(
    (target: number) => {
      setPageNumber((current) => {
        const safe = Math.min(Math.max(target, 1), numPages || current || 1);
        setProgress(bookId, safe);
        setLastOpened(bookId, Date.now());
        return safe;
      });
    },
    [bookId, numPages]
  );

  const goPrev = useCallback(() => {
    goToPage(pageNumber - 1);
  }, [goToPage, pageNumber]);

  const goNext = useCallback(() => {
    goToPage(pageNumber + 1);
  }, [goToPage, pageNumber]);

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      if (!Number.isNaN(value)) {
        goToPage(value);
      }
    },
    [goToPage]
  );

  const saveCurrentPage = useCallback(() => {
    setProgress(bookId, pageNumber);
    setLastOpened(bookId, Date.now());
  }, [bookId, pageNumber]);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(2))));
  }, []);

  const handleAddBookmark = useCallback(() => {
    const label =
      typeof window !== "undefined"
        ? window.prompt("Nom du signet", `Page ${pageNumber}`)
        : null;
    if (!label) return;
    const created = addBookmark(bookId, pageNumber, label);
    if (created) {
      setBookmarks((prev) => [...prev, created]);
    }
  }, [bookId, pageNumber]);

  const handleRemoveBookmark = useCallback(
    (id: string) => {
      removeBookmark(bookId, id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    },
    [bookId]
  );

  if (!objectUrl) return null;

  const progressPercent =
    numPages > 0 ? Math.round((pageNumber / numPages) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-stone-100/80 to-stone-200 dark:from-stone-900 dark:to-stone-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-stone-950/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-500">
            Lecture
          </span>
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
            <span className="tabular-nums">
              Page {pageNumber} / {numPages || "—"}
            </span>
            {numPages > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[11px] text-stone-600 dark:text-stone-300">
                <span
                  className="inline-block h-1.5 w-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                  style={{ width: `${Math.max(progressPercent, 4)}%` }}
                />
                {progressPercent}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
          <button
            type="button"
            onClick={zoomOut}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            −
          </button>
          <span className="w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center p-4">
        <Document
          file={objectUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center min-h-[400px] text-stone-600 dark:text-stone-400">
              Chargement du PDF…
            </div>
          }
          error={
            <div className="flex items-center justify-center min-h-[400px] text-red-600 dark:text-red-400">
              Impossible de charger ce PDF.
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-2xl rounded-md border border-stone-200/70 dark:border-stone-800/70 bg-white"
            width={baseWidth * zoom}
          />
        </Document>
      </div>

      <footer className="flex flex-col gap-2 py-3 px-4 bg-white/95 dark:bg-stone-950/95 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1}
            className="px-3 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors text-sm"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNumber >= numPages}
            className="px-3 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors text-sm"
          >
            Suivant →
          </button>
          <button
            type="button"
            onClick={saveCurrentPage}
            className="ml-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Sauvegarder cette page
          </button>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={handleSliderChange}
              className="flex-1 accent-amber-500"
            />
            <span className="w-14 text-right text-xs tabular-nums text-stone-500 dark:text-stone-400">
              {pageNumber}/{numPages || "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-dashed border-stone-200 dark:border-stone-800 pt-2">
          <button
            type="button"
            onClick={handleAddBookmark}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 text-xs font-medium text-stone-900 hover:bg-amber-400 transition-colors"
          >
            <span className="w-4 h-4 rounded-full bg-stone-900/90 text-[10px] flex items-center justify-center text-amber-300">
              ★
            </span>
            Ajouter un signet
          </button>
          {bookmarks.length > 0 && (
            <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
              {bookmarks
                .slice()
                .sort((a, b) => a.page - b.page)
                .map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => goToPage(b.page)}
                    className="group inline-flex items-center gap-1 px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-700 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    title={`Aller à la page ${b.page}`}
                  >
                    <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {b.page}
                    </span>
                    <span className="max-w-[120px] truncate">{b.label}</span>
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveBookmark(b.id);
                      }}
                      className="ml-0.5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200"
                    >
                      ×
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
