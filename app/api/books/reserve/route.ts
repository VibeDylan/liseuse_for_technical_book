import { NextRequest, NextResponse } from "next/server";
import { pdfPath, coverPath } from "@/lib/blob-books";
import { randomUUID } from "crypto";

/** Réserve un id pour un nouvel upload client (gros PDF). Body: { filename } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filename =
      typeof body?.filename === "string" ? body.filename : "document.pdf";
    const id = randomUUID();
    const title = filename.replace(/\.pdf$/i, "").trim() || "Sans titre";
    return NextResponse.json({
      id,
      title,
      pathnamePdf: pdfPath(id),
      pathnameCover: coverPath(id),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Requête invalide" },
      { status: 400 }
    );
  }
}
