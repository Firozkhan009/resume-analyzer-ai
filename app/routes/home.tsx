import type { Route } from "./+types/home";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeAI" },
    { name: "description", content: "Welcome to ResumeAI" },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')] bg cover">
      <section className="main -section">
          <div className="page-heading">
              <h1>Track Your Applications & Resume Analysis</h1>
              <h2>Review your Job Applications</h2>
          </div>
      </section>
  </main>

}
