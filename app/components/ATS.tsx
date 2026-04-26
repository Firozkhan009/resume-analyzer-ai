import React from 'react'

interface Suggestion {
    type: "good" | "improve";
    tip: string;
}

interface ATSProps {
    score: number;
    suggestions: Suggestion[];
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
    // Determine background gradient based on score
    const gradientClass = score > 69
        ? 'from-emerald-100'
        : score > 49
            ? 'from-amber-100'
            : 'from-red-100';

    // Determine icon based on score
    const iconSrc = score > 69
        ? '/icons/ats-good.svg'
        : score > 49
            ? '/icons/ats-warning.svg'
            : '/icons/ats-bad.svg';

    // Determine subtitle based on score
    const subtitle = score > 69
        ? 'Strong ATS Match'
        : score > 49
            ? 'Some Gaps to Fix'
            : 'Needs More ATS Signals';

    return (
        <div className={`bg-gradient-to-b ${gradientClass} to-white border border-slate-200 rounded-2xl shadow-md w-full p-6 text-slate-800`}>
            {/* Top section with icon and headline */}
            <div className="flex items-center gap-4 mb-6">
                <img src={iconSrc} alt="ATS Score Icon" className="w-12 h-12" />
                <div>
                    <h2 className="text-2xl font-bold">ATS Score - {score}/100</h2>
                </div>
            </div>

            {/* Description section */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{subtitle}</h3>
                <p className="text-slate-600 mb-4">
                    This score estimates how clearly the resume matches common ATS signals for the target role.
                </p>

                {/* Suggestions list */}
                <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <img
                                src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                                alt={suggestion.type === "good" ? "Check" : "Warning"}
                                className="w-5 h-5 mt-1"
                            />
                            <p className={suggestion.type === "good" ? "text-emerald-700" : "text-amber-700"}>
                                {suggestion.tip}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Closing encouragement */}
            <p className="text-slate-700 italic">
                Use these notes as a revision guide, then rescan after tightening the role-specific details.
            </p>
        </div>
    )
}

export default ATS
