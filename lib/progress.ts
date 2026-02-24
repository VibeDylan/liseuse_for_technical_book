const STORAGE_KEY_PROGRESS = "liseuse-progress";
const STORAGE_KEY_BOOKMARKS = "liseuse-bookmarks";
const STORAGE_KEY_LAST_OPENED = "liseuse-last-opened";
const STORAGE_KEY_FAVORITES = "liseuse-favorites";

export interface Bookmark {
  id: string;
  page: number;
  label: string;
  createdAt: number;
}

export function getProgress(bookId: string): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) return 1;
    const data = JSON.parse(raw) as Record<string, number>;
    const page = data[bookId];
    return typeof page === "number" && page >= 1 ? page : 1;
  } catch {
    return 1;
  }
}

export function setProgress(bookId: string, page: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    const data = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    data[bookId] = page;
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getBookmarks(bookId: string): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (!raw) return [];
    const data = JSON.parse(raw) as Record<string, Bookmark[]>;
    return data[bookId] ?? [];
  } catch {
    return [];
  }
}

export function addBookmark(
  bookId: string,
  page: number,
  label: string
): Bookmark | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const data = (raw ? JSON.parse(raw) : {}) as Record<string, Bookmark[]>;
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      page,
      label: label.trim() || `Page ${page}`,
      createdAt: Date.now(),
    };
    const list = data[bookId] ?? [];
    data[bookId] = [...list, bookmark];
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(data));
    return bookmark;
  } catch {
    return null;
  }
}

export function removeBookmark(bookId: string, bookmarkId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (!raw) return;
    const data = JSON.parse(raw) as Record<string, Bookmark[]>;
    const list = data[bookId];
    if (!list) return;
    data[bookId] = list.filter((b) => b.id !== bookmarkId);
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getLastOpened(bookId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_OPENED);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, number>;
    return typeof data[bookId] === "number" ? data[bookId] : null;
  } catch {
    return null;
  }
}

export function setLastOpened(bookId: string, timestamp: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_OPENED);
    const data = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    data[bookId] = timestamp;
    localStorage.setItem(STORAGE_KEY_LAST_OPENED, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (!raw) return [];
    const data = JSON.parse(raw) as string[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function isFavorite(bookId: string): boolean {
  if (typeof window === "undefined") return false;
  const ids = getFavoriteIds();
  return ids.includes(bookId);
}

export function toggleFavorite(bookId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    const data = (raw ? JSON.parse(raw) : []) as string[];
    const set = new Set(data);
    if (set.has(bookId)) {
      set.delete(bookId);
    } else {
      set.add(bookId);
    }
    const result = Array.from(set);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(result));
    return result.includes(bookId);
  } catch {
    return false;
  }
}
