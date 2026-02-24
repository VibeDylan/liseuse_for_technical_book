import { NextRequest, NextResponse } from "next/server";
import { readLibrary, getPdfStream } from "@/lib/blob-books";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const lib = await readLibrary();
  const book = lib.books.find((b) => b.id === id);
  if (!book) {
    return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
  }

  const result = await getPdfStream(book.pdfUrl);
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(book.title)}.pdf"`,
    },
  });
}
