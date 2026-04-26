import { cn } from "~/lib/utils";

type ApplicationChanceData = NonNullable<Feedback["applicationChance"]>;

const chanceLabel = {
    high: "High",
    medium: "Medium",
    low: "Low",
};

const chanceClasses = {
    high: "border-emerald-200 bg-emerald-50 text-emerald-800",
    medium: "border-amber-200 bg-amber-50 text-amber-800",
    low: "border-red-200 bg-red-50 text-red-800",
};

const getChanceLevel = (score: number): ApplicationChanceData["level"] => {
    if (score >= 70) return "high";
    if (score >= 45) return "medium";
    return "low";
};

const getFallbackChance = (feedback: Feedback): ApplicationChanceData => {
    const score = Math.round(
        feedback.ATS.score * 0.35 +
            feedback.skills.score * 0.3 +
            feedback.content.score * 0.2 +
            feedback.overallScore * 0.15
    );

    return {
        level: getChanceLevel(score),
        score,
        explanation:
            "Estimated from the review scores available for this saved resume.",
        signals: [
            `ATS alignment is ${feedback.ATS.score}/100.`,
            `Skills alignment is ${feedback.skills.score}/100.`,
            `Content strength is ${feedback.content.score}/100.`,
        ],
    };
};

const ApplicationChance = ({ feedback }: { feedback: Feedback }) => {
    const chance = feedback.applicationChance ?? getFallbackChance(feedback);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md w-full p-6 text-slate-800">
            <div className="flex flex-row items-start justify-between gap-4 max-sm:flex-col">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold uppercase text-slate-500">
                        Resume-to-role fit
                    </p>
                    <h2 className="text-2xl font-bold">Application Fit Estimate</h2>
                    <p className="text-slate-600">{chance.explanation}</p>
                </div>

                <div
                    className={cn(
                        "min-w-32 rounded-lg border px-4 py-3 text-center",
                        chanceClasses[chance.level]
                    )}
                >
                    <p className="text-2xl font-bold">{chanceLabel[chance.level]}</p>
                    <p className="text-sm font-semibold">{chance.score}/100 fit</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {chance.signals.map((signal, index) => (
                    <div
                        key={`${signal}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
                    >
                        {signal}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApplicationChance;
