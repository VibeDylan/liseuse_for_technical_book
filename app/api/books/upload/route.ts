import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const PATH_REGEX = /^book_api\/[a-f0-9-]{36}\.(pdf|jpg)$/i;

/** Génère un token pour l’upload client (gros fichiers). Valide pathname book_api/<uuid>.pdf ou .jpg */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const match = pathname.match(PATH_REGEX);
        if (!match) {
          throw new Error("Pathname non autorisé. Utilisez /api/books/reserve pour obtenir un pathname.");
        }
        const ext = match[1].toLowerCase();
        return {
          allowedContentTypes:
            ext === "pdf"
              ? ["application/pdf"]
              : ["image/jpeg", "image/jpg"],
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
