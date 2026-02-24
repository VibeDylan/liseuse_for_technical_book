import { NextRequest, NextResponse } from "next/server";
import { readLibrary, removeBook } from "@/lib/blob-books";

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
    if (!lib.books.some((b) => b.id === id)) {
      return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
    }
    await removeBook(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
