# AI-Powered Resume Analyzer

Major Project for the Master of Computer Science, Non-Thesis Program  
University of Georgia

Author: Firoz Khan Patan  
Faculty Advisor: Dr. Krzysztof J. Kochut

## Project Overview

AI-Powered Resume Analyzer is a web-based resume analysis application developed as a major project for the Master of Computer Science non-thesis program at the University of Georgia. The project focuses on using modern web technologies and AI-assisted feedback to help job seekers evaluate how well a resume matches a specific job posting.

The application allows a user to upload a PDF resume, enter a company name, job title, and job description, and receive a structured review. The feedback includes ATS readiness, writing tone, content quality, resume structure, skill alignment, and an overall resume-to-role fit estimate.

The Resume Analyzer is intended to support resume revision before applying for a job. It does not make hiring decisions, replace recruiter judgment, or guarantee interview outcomes.

## Motivation

Job applicants often reuse the same resume for many roles, even when each job description asks for different skills, keywords, and experience. Applicant Tracking Systems can also make resume screening difficult to understand from the applicant side.

This project explores how a web application can combine PDF processing, cloud storage, authentication, and AI-assisted review to give users clearer, role-specific feedback before submission.

## Objectives

- Build a working full-stack resume analysis workflow.
- Allow users to upload and preview PDF resumes.
- Analyze resumes against a target job description.
- Return structured scores for ATS, tone, content, structure, and skills.
- Estimate resume-to-job fit using high, medium, or low fit levels.
- Save previous resume reviews for later reference.
- Present feedback in a clean and usable interface.

## System Features

- User authentication through Puter services
- PDF resume upload and preview
- PDF-to-image conversion for analysis support
- AI-assisted resume feedback
- ATS compatibility scoring
- Resume-to-role fit estimation
- Persistent storage of resume review records
- Review dashboard for previously analyzed resumes

## Technology Stack

- React 19
- React Router 7
- TypeScript
- Tailwind CSS
- Zustand
- PDF.js
- Puter.js
- Vite

## Application Workflow

1. The user signs in to the application.
2. The user uploads a PDF resume.
3. The user enters company, job title, and job description details.
4. The resume file is stored and converted for preview/analysis.
5. The AI review prompt evaluates the resume against the target role.
6. The application stores the structured feedback.
7. The user views scores, improvement notes, and fit signals on the review page.

## Project Scope

The project demonstrates an end-to-end prototype for resume analysis. It emphasizes practical software engineering, frontend development, state management, file handling, and integration with AI/cloud services.

The current version is not a validated hiring model. Feedback quality depends on the uploaded resume, the job description, and the consistency of AI-generated responses.

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application runs locally at:

```text
http://localhost:5173
```

## Build

Create a production build:

```bash
npm run build
```

Run the built application:

```bash
npm run start
```

## Verification

The project can be checked with:

```bash
npm run typecheck
npm run build
```

## Limitations

- AI feedback may vary between runs.
- Resume scoring is an estimate, not a hiring decision.
- The system has not yet been formally benchmarked against recruiter evaluations.
- The quality of feedback depends heavily on the job description provided by the user.
- Current analysis focuses on PDF resumes.

## Future Work

- Add side-by-side comparison between resume versions.
- Improve score explanations and traceability.
- Support more document formats.
- Add exportable feedback reports.
- Evaluate feedback quality using a larger resume dataset.
- Include recruiter or career-services validation.

