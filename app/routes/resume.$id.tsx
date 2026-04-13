import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import ApplicationChance from "~/components/ApplicationChance";

export const meta = () => [
    { title: "Resumind | Review" },
    { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
    const { auth, isLoading, fs, kv, puterReady } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    const navigate = useNavigate();

    // ✅ Wait until Puter is ready and auth status has had a chance to resolve
    useEffect(() => {
        if (!puterReady) return;

        // once loading flips to false at least once, we consider auth checked
        if (!isLoading) setHasCheckedAuth(true);
    }, [puterReady, isLoading]);

    // ✅ Auth guard (ONLY after auth has been checked)
    useEffect(() => {
        if (!puterReady) return;
        if (!hasCheckedAuth) return;

        if (!auth.isAuthenticated) {
            navigate(`/auth?next=/resume/${id ?? ""}`, { replace: true });
        }
    }, [puterReady, hasCheckedAuth, auth.isAuthenticated, id, navigate]);

    useEffect(() => {
        if (!id) return;

        let pdfUrlToClean = "";
        let imgUrlToClean = "";

        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);
            if (!resume) return;

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumePath);
            if (!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            pdfUrlToClean = pdfUrl;
            setResumeUrl(pdfUrl);

            const imageBlob = await fs.read(data.imagePath);
            if (!imageBlob) return;

            const imgUrl = URL.createObjectURL(imageBlob);
            imgUrlToClean = imgUrl;
            setImageUrl(imgUrl);

            setFeedback(data.feedback);
            console.log({ pdfUrl, imgUrl, feedback: data.feedback });
        };

        loadResume();

        return () => {
            if (pdfUrlToClean) URL.revokeObjectURL(pdfUrlToClean);
            if (imgUrlToClean) URL.revokeObjectURL(imgUrlToClean);
        };
    }, [id, fs, kv]);

    return (
        <main className="page-shell page-review !pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
                    <span className="text-slate-700 text-sm font-semibold">
            Back to Homepage
          </span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section review-preview-pane h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                    alt="resume preview"
                                />
                            </a>
                        </div>
                    )}
                </section>

                <section className="feedback-section">
                    <h2 className="text-4xl !text-slate-800 font-bold">Resume Review</h2>

                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ApplicationChance chance={feedback.applicationChance} />
                            <ATS
                                score={feedback.ATS?.score ?? 0}
                                suggestions={feedback.ATS?.tips ?? []}
                            />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img
                            src="/images/resume-scan-2.gif"
                            className="w-full"
                            alt="loading"
                        />
                    )}
                </section>
            </div>
        </main>
    );
};

export default Resume;
