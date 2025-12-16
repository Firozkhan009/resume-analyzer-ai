import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import { useState } from "react";

type Resume = {
    id: string;
    jobTitle: string;
};

export function meta({}: Route.MetaArgs) {
    return [
        { title: "ResumeAI" },
        { name: "description", content: "Welcome to ResumeAI" },
    ];
}

export default function Home() {
    const [resume] = useState<Resume[]>([
        { id: "1", jobTitle: "Software Engineer Intern" },
        { id: "2", jobTitle: "Backend Developer Intern" },
    ]);

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading">
                    <h1>Track Your Applications & Resume Analysis</h1>
                    <h2>Review your Job Applications</h2>
                </div>
            </section>

            {resume.map((r) => (
                <div key={r.id}>
                    <h1>{r.jobTitle}</h1>
                </div>
            ))}
        </main>
    );
}

