import { type FormEvent, useEffect, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const withTimeout = <T,>(promise: Promise<T>, ms = 45000) =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Analysis timed out. Please try again.")), ms)
        ),
    ]);

const tryParseFeedback = (raw: string): Feedback | null => {
    const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned) as Feedback;
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start === -1 || end === -1 || end <= start) return null;

        try {
            return JSON.parse(cleaned.slice(start, end + 1)) as Feedback;
        } catch {
            return null;
        }
    }
};

const Upload = () => {
    const { fs, ai, kv, auth, isLoading, puterReady } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        if (!puterReady) return;
        if (!isLoading) setHasCheckedAuth(true);
    }, [puterReady, isLoading]);

    useEffect(() => {
        if (!puterReady || !hasCheckedAuth) return;
        if (!auth.isAuthenticated) {
            navigate("/auth?next=/upload", { replace: true });
        }
    }, [puterReady, hasCheckedAuth, auth.isAuthenticated, navigate]);

    const handleFileSelect = (f: File | null) => {
        setFile(f);
        if (statusText.startsWith("Error:")) {
            setStatusText("");
        }
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
            if (!uploadedFile?.path) return stopWithError("Failed to upload file");

            setStatusText("Converting to image...");
            const imageResult = await convertPdfToImage(file);
            if (!imageResult.file) {
                return stopWithError(imageResult.error || "Failed to convert PDF to image");
            }

            setStatusText("Uploading the image...");
            const uploadedImage: any = await fs.upload([imageResult.file]);
            if (!uploadedImage?.path) return stopWithError("Failed to upload image");

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

            const feedback: any = await withTimeout(ai.feedback(uploadedFile.path, prompt), 45000);
            if (!feedback) return stopWithError("Failed to analyze resume (empty response)");

            let feedbackText: string | undefined;

            if (feedback?.message?.content) {
                if (typeof feedback.message.content === "string") {
                    feedbackText = feedback.message.content;
                } else if (Array.isArray(feedback.message.content)) {
                    feedbackText = feedback.message.content.find((c: any) => c?.text)?.text;
                }
            }

            if (!feedbackText && typeof feedback === "string") feedbackText = feedback;
            if (!feedbackText && feedback?.content && typeof feedback.content === "string") {
                feedbackText = feedback.content;
            }

            if (!feedbackText) return stopWithError("Could not read AI feedback text");

            const parsedFeedback = tryParseFeedback(feedbackText);
            if (!parsedFeedback) return stopWithError("AI returned invalid JSON feedback");

            data.feedback = parsedFeedback;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText("Analysis complete, redirecting...");
            navigate(`/resume/${uuid}`, { replace: true });

            setTimeout(() => {
                if (window.location.pathname.includes("/upload")) {
                    window.location.href = `/resume/${uuid}`;
                }
            }, 300);
        } catch (err: any) {
            stopWithError(err?.message ?? String(err));
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
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

                    {!isProcessing && statusText.startsWith("Error:") && (
                        <p className="mt-4 text-red-600 font-medium">{statusText}</p>
                    )}

                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
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
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
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

                            <button className="primary-button" type="submit" disabled={isProcessing}>
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
