import { NextRequest, NextResponse } from "next/server";
import { addBookFromUrls } from "@/lib/blob-books";

/** Enregistre un livre après upload client (pdfUrl + coverUrl optionnel). Body: { id, title, pdfUrl, coverUrl? } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : null;
    const title = typeof body?.title === "string" ? body.title : null;
    const pdfUrl = typeof body?.pdfUrl === "string" ? body.pdfUrl : null;
    const coverUrl =
      typeof body?.coverUrl === "string" ? body.coverUrl : body?.coverUrl === null ? null : undefined;

    if (!id || !title || !pdfUrl) {
      return NextResponse.json(
        { error: "id, title et pdfUrl requis" },
        { status: 400 }
      );
    }

    const book = await addBookFromUrls(id, title, pdfUrl, coverUrl ?? null);
    return NextResponse.json({
      id: book.id,
      title: book.title,
      addedAt: book.addedAt,
      cover: book.coverUrl ? `/api/books/${book.id}/cover` : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du livre" },
      { status: 500 }
    );
  }
}
