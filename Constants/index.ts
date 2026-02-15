// app/constants/resumes.ts

export type Tip = {
    type: "good" | "improve";
    tip: string;
    explanation?: string; // optional so mock data can have empty tips
};

export type FeedbackSection = {
    score: number; // 0-100
    tips: Tip[];
};

export type Feedback = {
    overallScore: number; // 0-100
    ATS: FeedbackSection;
    toneAndStyle: FeedbackSection;
    content: FeedbackSection;
    structure: FeedbackSection;
    skills: FeedbackSection;
};

export type Resume = {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
};

export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: { score: 90, tips: [] },
            toneAndStyle: { score: 90, tips: [] },
            content: { score: 90, tips: [] },
            structure: { score: 90, tips: [] },
            skills: { score: 90, tips: [] },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: { score: 90, tips: [] },
            toneAndStyle: { score: 90, tips: [] },
            content: { score: 90, tips: [] },
            structure: { score: 90, tips: [] },
            skills: { score: 90, tips: [] },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: { score: 90, tips: [] },
            toneAndStyle: { score: 90, tips: [] },
            content: { score: 90, tips: [] },
            structure: { score: 90, tips: [] },
            skills: { score: 90, tips: [] },
        },
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: { score: 90, tips: [] },
            toneAndStyle: { score: 90, tips: [] },
            content: { score: 90, tips: [] },
            structure: { score: 90, tips: [] },
            skills: { score: 90, tips: [] },
        },
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: { score: 90, tips: [] },
            toneAndStyle: { score: 90, tips: [] },
            content: { score: 90, tips: [] },
            structure: { score: 90, tips: [] },
            skills: { score: 90, tips: [] },
        },
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: { score: 90, tips: [] },
            toneAndStyle: { score: 90, tips: [] },
            content: { score: 90, tips: [] },
            structure: { score: 90, tips: [] },
            skills: { score: 90, tips: [] },
        },
    },
];

export const AIResponseFormat = `
{
  "overallScore": 0,
  "ATS": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" }
    ]
  },
  "toneAndStyle": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" }
    ]
  },
  "content": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" }
    ]
  },
  "structure": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" }
    ]
  },
  "skills": {
    "score": 0,
    "tips": [
      { "type": "good", "tip": "string", "explanation": "string" }
    ]
  }
}
`;

export const prepareInstructions = ({
                                        jobTitle,
                                        jobDescription,
                                    }: {
    jobTitle: string;
    jobDescription: string;
}) => {
    return `
You are an ATS + resume reviewer. Analyze the resume against the target job.

Target Job Title: ${jobTitle}

Job Description:
${jobDescription}

Return ONLY valid JSON.
- Do NOT include any markdown.
- Do NOT include \`\`\` fences.
- Do NOT include extra text before or after JSON.
- Do NOT include trailing commas.
- Include ALL keys exactly as shown, even if some tips are generic.

JSON shape example (follow this structure exactly):
${AIResponseFormat}

Rules:
- Scores must be integers from 0 to 100.
- Provide 3 to 4 tips per section.
- Every tip must include: type, tip, explanation.
`;
};
