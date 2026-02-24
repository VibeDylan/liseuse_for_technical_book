import { NextRequest, NextResponse } from "next/server";
import { readLibrary, uploadBook } from "@/lib/blob-books";
import { randomUUID } from "crypto";

export async function GET() {
  const lib = await readLibrary();
  return NextResponse.json(
    lib.books.map((b) => ({
      id: b.id,
      title: b.title,
      addedAt: b.addedAt,
      cover: b.coverUrl
        ? `/api/books/${b.id}/cover`
        : null,
    }))
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const cover = formData.get("cover") as string | null;

    if (!file || !file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Fichier PDF requis" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const title = (file.name || "")
      .replace(/\.pdf$/i, "")
      .trim() || file.name || "Sans titre";

    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    let coverBuffer: Buffer | null = null;
    if (cover && typeof cover === "string" && cover.startsWith("data:image")) {
      const base64 = cover.replace(/^data:image\/\w+;base64,/, "");
      if (base64.length > 0) {
        coverBuffer = Buffer.from(base64, "base64");
      }
    }

    const book = await uploadBook(id, title, pdfBuffer, coverBuffer);

    return NextResponse.json({
      id: book.id,
      title: book.title,
      addedAt: book.addedAt,
      cover: book.coverUrl ? `/api/books/${book.id}/cover` : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du livre" },
      { status: 500 }
    );
  }
}
