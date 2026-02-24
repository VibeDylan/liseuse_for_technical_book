import { NextRequest, NextResponse } from "next/server";
import {
  readLibrary,
  writeLibrary,
  getBookFilePath,
  getCoverFilePath,
  bookFileExists,
} from "@/lib/books-storage";
import { unlink } from "fs/promises";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  try {
    const lib = await readLibrary();
    const index = lib.books.findIndex((b) => b.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
    }

    const pdfPath = getBookFilePath(id);
    const coverPath = getCoverFilePath(id);
    try {
      await unlink(pdfPath);
    } catch {
      // fichier peut ne pas exister
    }
    try {
      await unlink(coverPath);
    } catch {
      // idem
    }

    lib.books.splice(index, 1);
    await writeLibrary(lib);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
