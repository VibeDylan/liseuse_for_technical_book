export interface Book {
  id: string;
  title: string;
  addedAt: number;
  /** Data URL de la couverture (1ère page du PDF) */
  cover?: string | null;
}

export type BookWithBlob = Book & { blob: Blob };
