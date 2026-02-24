import { NextRequest, NextResponse } from "next/server";
import {
  readLibrary,
  writeLibrary,
  ensureBooksDir,
  getBookFilePath,
  getCoverFilePath,
  type StoredBook,
} from "@/lib/books-storage";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";

export async function GET() {
  const lib = await readLibrary();
  return NextResponse.json(lib.books);
}

export async function POST(request: NextRequest) {
  try {
    await ensureBooksDir();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const cover = formData.get("cover") as string | null; // data URL ou vide

    if (!file || !file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Fichier PDF requis" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const title = (file.name || "").replace(/\.pdf$/i, "").trim() || file.name || "Sans titre";
    const addedAt = Date.now();

    const pdfPath = getBookFilePath(id);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(pdfPath, buffer);

    if (cover && typeof cover === "string" && cover.startsWith("data:image")) {
      const base64 = cover.replace(/^data:image\/\w+;base64,/, "");
      if (base64.length > 0) {
        const coverBuffer = Buffer.from(base64, "base64");
        await writeFile(getCoverFilePath(id), coverBuffer);
      }
    }

    const lib = await readLibrary();
    const book: StoredBook = { id, title, addedAt };
    lib.books.push(book);
    await writeLibrary(lib);

    return NextResponse.json(book);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du livre" },
      { status: 500 }
    );
  }
}
