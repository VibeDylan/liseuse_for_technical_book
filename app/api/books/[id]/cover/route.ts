import { NextRequest, NextResponse } from "next/server";
import { readLibrary, getCoverStream } from "@/lib/blob-books";

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
  if (!book || !book.coverUrl) {
    return NextResponse.json({ error: "Couverture introuvable" }, { status: 404 });
  }

  const result = await getCoverStream(book.coverUrl);
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Couverture introuvable" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
