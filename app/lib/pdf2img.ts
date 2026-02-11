// app/lib/pdf2img.ts

export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        // ✅ Vite-compatible legacy build
        const lib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

        // ✅ Set worker directly (no redundant variable)
        lib.GlobalWorkerOptions.workerSrc = (
            await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")
        ).default;

        pdfjsLib = lib;
        return lib;
    })();

    return loadPromise;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

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

        await page.render({ canvasContext: context, viewport }).promise;

        return await new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                        return;
                    }

                    const originalName = file.name.replace(/\.pdf$/i, "");
                    const imageFile = new File([blob], `${originalName}.png`, {
                        type: "image/png",
                    });

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
