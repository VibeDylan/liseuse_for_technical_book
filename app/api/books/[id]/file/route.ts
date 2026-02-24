import { NextRequest, NextResponse } from "next/server";
import { getBookFilePath, readLibrary } from "@/lib/books-storage";
import { readFile } from "fs/promises";

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

  try {
    const filePath = getBookFilePath(id);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(book.title)}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
