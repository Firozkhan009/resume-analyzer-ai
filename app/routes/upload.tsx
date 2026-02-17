import { useEffect, useState } from "react";
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

const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "string" && err.trim()) return err;

    if (err && typeof err === "object") {
        const maybeErr = err as Record<string, unknown>;
        const nested =
            maybeErr.message ??
            maybeErr.error ??
            maybeErr.reason ??
            (typeof maybeErr.data === "object" && maybeErr.data
                ? (maybeErr.data as Record<string, unknown>).message
                : undefined);

        if (typeof nested === "string" && nested.trim()) return nested;

        try {
            return JSON.stringify(err);
        } catch {
            return "Unexpected error object";
        }
    }

    return String(err);
};

const extractJsonObjectFromText = (raw: string): unknown | null => {
    const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) return null;

        try {
            return JSON.parse(cleaned.slice(start, end + 1));
        } catch {
            return null;
        }
    }
};

const getFeedbackTextFromResponse = (response: any): string | null => {
    if (!response) return null;
    if (typeof response === "string") return response;

    const directContent = response?.message?.content;

    if (typeof directContent === "string") return directContent;

    if (Array.isArray(directContent)) {
        const collected = directContent
            .map((item: any) => {
                if (typeof item === "string") return item;
                if (typeof item?.text === "string") return item.text;
                if (typeof item?.content === "string") return item.content;
                if (typeof item?.value === "string") return item.value;
                return "";
            })
            .filter(Boolean)
            .join("\n")
            .trim();

        if (collected) return collected;
    }

    const choicesText = response?.choices?.[0]?.message?.content;
    if (typeof choicesText === "string") return choicesText;

    if (typeof response?.content === "string") return response.content;

    try {
        return JSON.stringify(response);
    } catch {
        return null;
    }
};

const clampScore = (value: unknown): number => {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
};

type NormalizedTip = {
    type: "good" | "improve";
    tip: string;
    explanation: string;
};

const normalizeTips = (tips: unknown, minCount = 3) => {
    const arr = Array.isArray(tips) ? tips : [];

    const normalized: NormalizedTip[] = arr
        .map((tip: any) => {
            if (typeof tip === "string") {
                return {
                    type: "improve" as const,
                    tip,
                    explanation: "This impacts resume quality and ATS readability.",
                };
            }

            const text =
                (typeof tip?.tip === "string" && tip.tip) ||
                (typeof tip?.title === "string" && tip.title) ||
                (typeof tip?.point === "string" && tip.point) ||
                "Improve this section";

            const explanation =
                (typeof tip?.explanation === "string" && tip.explanation) ||
                (typeof tip?.reason === "string" && tip.reason) ||
                "This impacts resume quality and ATS readability.";

            const type: "good" | "improve" = tip?.type === "good" ? "good" : "improve";

            return { type, tip: text, explanation };
        })
        .filter((tip: any) => typeof tip.tip === "string" && tip.tip.trim().length > 0);

    while (normalized.length < minCount) {
        normalized.push({
            type: "improve",
            tip: "Add more role-specific, measurable evidence.",
            explanation: "Quantified impact helps both ATS matching and recruiter confidence.",
        });
    }

    return normalized.slice(0, 4);
};

const normalizeFeedback = (input: unknown): Feedback | null => {
    const raw = (input && typeof input === "object" ? input : null) as Record<string, any> | null;
    if (!raw) return null;

    const atsRaw = raw.ATS ?? raw.ats;
    const toneRaw = raw.toneAndStyle ?? raw.tone_style ?? raw.tone ?? raw.style;
    const contentRaw = raw.content;
    const structureRaw = raw.structure;
    const skillsRaw = raw.skills;

    if (!atsRaw || !toneRaw || !contentRaw || !structureRaw || !skillsRaw) {
        return null;
    }

    const normalized: Feedback = {
        overallScore: clampScore(raw.overallScore ?? raw.overall_score),
        ATS: {
            score: clampScore(atsRaw.score),
            tips: normalizeTips(atsRaw.tips),
        },
        toneAndStyle: {
            score: clampScore(toneRaw.score),
            tips: normalizeTips(toneRaw.tips),
        },
        content: {
            score: clampScore(contentRaw.score),
            tips: normalizeTips(contentRaw.tips),
        },
        structure: {
            score: clampScore(structureRaw.score),
            tips: normalizeTips(structureRaw.tips),
        },
        skills: {
            score: clampScore(skillsRaw.score),
            tips: normalizeTips(skillsRaw.tips),
        },
    };

    if (!normalized.overallScore) {
        const average =
            (normalized.ATS.score +
                normalized.toneAndStyle.score +
                normalized.content.score +
                normalized.structure.score +
                normalized.skills.score) /
            5;
        normalized.overallScore = clampScore(average);
    }

    const allZero =
        normalized.overallScore === 0 &&
        normalized.ATS.score === 0 &&
        normalized.toneAndStyle.score === 0 &&
        normalized.content.score === 0 &&
        normalized.structure.score === 0 &&
        normalized.skills.score === 0;

    if (allZero) return null;

    return normalized;
};

const Upload = () => {
    const { fs, ai, kv, auth, isLoading, puterReady } = usePuterStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    const [companyName, setCompanyName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");

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

    const requestFeedback = async (resumePath: string, prompt: string): Promise<Feedback> => {
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const effectivePrompt =
                attempt === 1
                    ? prompt
                    : `${prompt}\n\nIMPORTANT RETRY: Return only a valid JSON object with all required fields and realistic non-zero scores based on the resume.`;

            const response: any = await withTimeout(ai.feedback(resumePath, effectivePrompt), 60000);
            const feedbackText = getFeedbackTextFromResponse(response);
            if (!feedbackText) continue;

            const parsedObject = extractJsonObjectFromText(feedbackText);
            const normalized = normalizeFeedback(parsedObject);

            if (normalized) return normalized;
        }

        throw new Error("AI returned incomplete feedback. Please try again.");
    };

    const handleAnalyze = async () => {
        if (!file) {
            setStatusText("Error: Please upload a PDF first");
            return;
        }

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
            const parsedFeedback = await requestFeedback(uploadedFile.path, prompt);

            data.feedback = parsedFeedback;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText("Analysis complete, redirecting...");
            navigate(`/resume/${uuid}`, { replace: true });

            setTimeout(() => {
                if (window.location.pathname.includes("/upload")) {
                    window.location.href = `/resume/${uuid}`;
                }
            }, 300);
        } catch (err: unknown) {
            stopWithError(getErrorMessage(err));
        }
    };

    return (
        <main className="page-shell page-upload">
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

                    {!isProcessing && statusText && (
                        <p
                            className={`mt-4 font-medium ${
                                statusText.startsWith("Error:") ? "text-red-600" : "text-slate-600"
                            }`}
                        >
                            {statusText}
                        </p>
                    )}

                    {!isProcessing && (
                        <div id="upload-form" className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input
                                    type="text"
                                    name="company-name"
                                    placeholder="Company Name"
                                    id="company-name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input
                                    type="text"
                                    name="job-title"
                                    placeholder="Job Title"
                                    id="job-title"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea
                                    rows={5}
                                    name="job-description"
                                    placeholder="Job Description"
                                    id="job-description"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button
                                className="primary-button"
                                type="button"
                                onClick={handleAnalyze}
                                disabled={isProcessing}
                            >
                                Analyze Resume
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;
