import { NextRequest, NextResponse } from "next/server";
import { getCoverFilePath, readLibrary } from "@/lib/books-storage";
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
    const coverPath = getCoverFilePath(id);
    const buffer = await readFile(coverPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Couverture introuvable" }, { status: 404 });
  }
}
