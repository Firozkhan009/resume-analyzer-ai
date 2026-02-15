// app/lib/pdf2img.ts

export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

const withTimeout = <T,>(promise: Promise<T>, ms = 20000) =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("PDF conversion timed out")), ms)
        ),
    ]);

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        const lib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

        lib.GlobalWorkerOptions.workerSrc = (
            await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")
        ).default;

        pdfjsLib = lib;
        return lib;
    })();

    return loadPromise;
}

/**
 * Optional helper to avoid memory leaks when you generate many previews.
 * Call this when you no longer need the preview URL.
 */
export function revokePdfImageUrl(url: string) {
    try {
        if (url) URL.revokeObjectURL(url);
    } catch {
        // ignore
    }
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();

        const pdf: any = await withTimeout(lib.getDocument({ data: arrayBuffer }).promise, 20000);
        const page: any = await withTimeout(pdf.getPage(1), 20000);

        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            return { imageUrl: "", file: null, error: "Failed to get canvas context" };
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await withTimeout(page.render({ canvasContext: context, viewport }).promise, 20000);

        return await new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve({ imageUrl: "", file: null, error: "Failed to create image blob" });
                        return;
                    }

                    const originalName = file.name.replace(/\.pdf$/i, "");
                    const imageFile = new File([blob], `${originalName}.png`, { type: "image/png" });

                    resolve({
                        imageUrl: URL.createObjectURL(blob),
                        file: imageFile,
                    });
                },
                "image/png",
                1.0
            );
        });
    } catch (err: any) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err?.message ?? String(err)}`,
        };
    }
}
