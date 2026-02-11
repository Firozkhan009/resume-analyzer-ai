import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

// ✅ hard timeout so "Analyzing..." never hangs forever
const withTimeout = <T,>(promise: Promise<T>, ms = 45000) =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Analysis timed out. Please try again.")), ms)
        ),
    ]);

const Upload = () => {
    const { fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (f: File | null) => {
        setFile(f);
    };

    const stopWithError = (msg: string) => {
        setStatusText(`Error: ${msg}`);
        setIsProcessing(false);
    };

    const handleAnalyze = async ({
                                     companyName,
                                     jobTitle,
                                     jobDescription,
                                     file,
                                 }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        setIsProcessing(true);

        try {
            setStatusText("Uploading the file...");
            const uploadedFile: any = await fs.upload([file]);
            if (!uploadedFile?.path) {
                return stopWithError("Failed to upload file");
            }

            setStatusText("Converting to image...");
            const imageResult = await convertPdfToImage(file);
            if (!imageResult.file) {
                return stopWithError(imageResult.error || "Failed to convert PDF to image");
            }

            setStatusText("Uploading the image...");
            const uploadedImage: any = await fs.upload([imageResult.file]);
            if (!uploadedImage?.path) {
                return stopWithError("Failed to upload image");
            }

            setStatusText("Preparing data...");
            const uuid = generateUUID();

            const data: any = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: "",
            };

            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText("Analyzing...");

            const prompt = prepareInstructions({ jobTitle, jobDescription });

            // ✅ timeout + error handling
            const feedback: any = await withTimeout(ai.feedback(uploadedFile.path, prompt), 45000);
            if (!feedback) {
                return stopWithError("Failed to analyze resume (empty response)");
            }

            // ✅ Robust extraction: handle different response shapes
            let feedbackText: string | undefined;

            // Common: feedback.message.content is string OR array
            if (feedback?.message?.content) {
                if (typeof feedback.message.content === "string") {
                    feedbackText = feedback.message.content;
                } else if (Array.isArray(feedback.message.content)) {
                    // try first text chunk
                    feedbackText = feedback.message.content.find((c: any) => c?.text)?.text;
                }
            }

            // Fallbacks if Puter returns other structure
            if (!feedbackText && typeof feedback === "string") feedbackText = feedback;
            if (!feedbackText && feedback?.content && typeof feedback.content === "string")
                feedbackText = feedback.content;

            if (!feedbackText) {
                return stopWithError("Could not read AI feedback text");
            }

            try {
                data.feedback = JSON.parse(feedbackText);
            } catch (e) {
                return stopWithError("AI returned invalid JSON feedback");
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText("Analysis complete, redirecting...");
            navigate(`/resume/${uuid}`);
        } catch (err: any) {
            console.error("UPLOAD ANALYZE ERROR:", err);
            stopWithError(err?.message ?? String(err));
        } finally {
            // ✅ keep processing true until redirect or error; if redirect happens, component unmounts anyway
            // If you prefer to stop the animation right before redirect, uncomment next line:
            // setIsProcessing(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget.closest("form");
        if (!form) return;

        const formData = new FormData(form);

        const companyName = (formData.get("company-name") as string) || "";
        const jobTitle = (formData.get("job-title") as string) || "";
        const jobDescription = (formData.get("job-description") as string) || "";

        if (!file) {
            setStatusText("Error: Please upload a PDF first");
            return;
        }

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    };

    return (
        <main className="bg-[url('/images/up-new.jpg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>

                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}

                    {!isProcessing && (
                        <form
                            id="upload-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 mt-8"
                        >
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input
                                    type="text"
                                    name="company-name"
                                    placeholder="Company Name"
                                    id="company-name"
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input
                                    type="text"
                                    name="job-title"
                                    placeholder="Job Title"
                                    id="job-title"
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea
                                    rows={5}
                                    name="job-description"
                                    placeholder="Job Description"
                                    id="job-description"
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;
