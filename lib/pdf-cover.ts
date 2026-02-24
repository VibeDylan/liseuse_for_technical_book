/**
 * Génère une image de couverture (1ère page) depuis un PDF.
 * À utiliser côté client uniquement.
 */
export async function generatePdfCover(blob: Blob): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const data = new Uint8Array(await blob.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.4 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    await page.render({
      canvasContext: ctx,
      canvas,
      viewport,
      intent: "display",
    }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}
