# HuntFlow: AI-Powered CV Builder & Job Application Tracker
## Technical Architecture & Phased Implementation Plan

HuntFlow is an end-to-end career companion platform built to ingest candidate data across multiple channels (GitHub, documents, web links), synthesize a standardized master profile using AI, generate ATS-certified resumes, dynamically tailor applications to target Job Descriptions (JDs), and track application lifecycle statuses.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph S1 [Stage 1: Multi-Source Ingestion]
        GH[GitHub API / Repos] --> DataCollector[Data Extraction Pipeline]
        DOCS[Uploaded Files: PDF / DOCX] --> DataCollector
        LINKS[External Links / Text / Bio] --> DataCollector
        DataCollector --> RawStash[(Raw Profile Store)]
    end

    subgraph S2 [Stage 2: AI Synthesis & Master Profile]
        RawStash --> AI_Engine[Gemini AI Synthesis Engine]
        AI_Engine --> MasterSchema[(Master CV Schema - JSON)]
        MasterSchema --> Editor[Interactive Master CV Studio]
    end

    subgraph S3 [Stage 3: ATS Engine & PDF Generation]
        MasterSchema --> ATSRenderer[ATS-Compliant Document Engine]
        ATSRenderer --> Checker[ATS Validation Rules / Resumly Metrics]
        ATSRenderer --> PDFGen[@react-pdf/renderer Vector PDF Export]
    end

    subgraph S4 [Stage 4: Contextual Tailoring Engine]
        JD[Job Description Input] --> JDAnalyzer[JD Keyword & Requirement Parser]
        MasterSchema --> TailorEngine[AI Re-weighting & Bullet Optimizer]
        JDAnalyzer --> TailorEngine
        TailorEngine --> TailoredCV[(Targeted CV Variant)]
    end

    subgraph S5 [Stage 5: Application Pipeline & Version Tracker]
        TailoredCV --> AppRecord[Application Tracker Entry]
        JD --> AppRecord
        AppRecord --> Kanban[Kanban Pipeline / Analytics]
    end
```

---

## Detailed Staged Roadmap

---

### Stage 1: Multi-Source Profile Ingestion (GitHub, Files & External Links)

#### Objective
Build the data ingestion pipeline capable of scraping and reading public GitHub accounts, parsing uploaded legacy CVs/documents, and ingesting raw text or portfolio links into an aggregated candidate repository.

#### Key Features & Technical Details
1. **GitHub Repository Aggregator**:
   - Query GitHub REST API (`/users/{username}/repos`).
   - Extract repository name, description, top languages, stargazers, topics, and `README.md` content.
   - Filter out forks and trivial repositories; highlight showcase and pinned projects.
2. **File & Document Ingestion**:
   - Client-side drag-and-drop file uploader (supporting `.pdf`, `.docx`, `.txt`, `.md`).
   - Server-side text extraction using `pdf-parse` and `mammoth` (for `.docx`).
3. **Link & Portfolio Scraper**:
   - Ingest user-submitted URLs (portfolio websites, technical blogs, project demos).
4. **Staging Store**:
   - Store unstructured raw candidate data in an aggregated JSON staging schema ready for AI ingestion.

#### Review Checkpoint & Deliverables
- [ ] Working ingestion UI (GitHub handle input, file dropzone, link inputs).
- [ ] Raw extracted payload preview component.
- **Stage 1 Goal Report & Review Request**: Verify successful parsing across sample GitHub profiles and sample resumes.

---

### Stage 2: AI Parsing, Synthesis & Schema Normalization

#### Objective
Use an AI API (Gemini 2.5/3.x via Google Gen AI SDK) to structure unstructured data into a standardized, high-impact Master CV schema.

#### Key Features & Technical Details
1. **Structured Output Extraction**:
   - Define strict Zod / JSON schemas for candidate data:
     - `personalInfo`: Name, title, email, phone, location, links.
     - `skills`: Categorized into Languages, Frameworks, Cloud/DevOps, Databases, Tools.
     - `experience`: Company, title, dates, location, bullet points.
     - `projects`: Title, role, tech stack, GitHub link, demo link, measurable impact metrics.
     - `education` & `certifications`.
2. **Bullet Point Optimization (XYZ Formula)**:
   - AI rewrites project and experience bullets into high-impact ATS-friendly phrasing:
     *“Accomplished [X], as measured by [Y], by doing [Z]”*.
3. **Master CV Studio (Web UI)**:
   - Clean interactive editor allowing full manual review and correction of every AI-extracted field.

#### Review Checkpoint & Deliverables
- [ ] Gemini API backend route (`/api/cv/extract-profile`).
- [ ] Structured Master CV Editor with real-time field updates.
- **Stage 2 Goal Report & Review Request**: User reviews the synthesized profile against their source data to confirm accuracy.

---

### Stage 3: ATS-Certified CV Engine & PDF Export

#### Objective
Design an ATS-parsable CV template that passes strict ATS compliance checks (e.g., Resumly ATS Checker criteria) with high scores and exports clean vector PDFs.

#### Key Features & Technical Details
1. **ATS Optimization Rules**:
   - **Machine-readable text layer**: Avoid flattened images, SVG text paths, or low-contrast canvases.
   - **Standard typography**: Standard system fonts (Helvetica/Arial/Times/Inter) with clean hierarchy (H1: Name, H2: Sections, Body: 10-11pt).
   - **Standard section nomenclature**: Exact headings recognized by ATS parsers (`Work Experience`, `Education`, `Technical Skills`, `Projects`).
   - **Layout formatting**: Single-column layout or safe two-column layout free of nested tables or complex CSS grids that break parsers.
2. **Vector PDF Generation Engine**:
   - Implement `@react-pdf/renderer` for pixel-perfect, selectable-text PDF downloads directly in the browser or via API.
3. **Built-in ATS Health Audit**:
   - Local validation checks: character count, word density, action verb presence, contact info validation, font size compliance.

#### Review Checkpoint & Deliverables
- [ ] Real-time split-screen CV preview.
- [ ] Native PDF export (`Download ATS CV.pdf`).
- [ ] Verification on [Resumly ATS Resume Checker](https://www.resumly.ai/ats-resume-checker) and audit confirmation.
- **Stage 3 Goal Report & Review Request**: Download test PDF, upload to ATS checker, and review scoring report.

---

### Stage 4: Contextual Job Tailoring Engine

#### Objective
Allow the user to paste any target Job Description (JD), analyze the gaps against their Master CV, and automatically generate an optimized, tailored version of the CV targeted specifically to that role.

#### Key Features & Technical Details
1. **JD Ingestion & Keyword Extraction**:
   - Parse job requirements, must-have skills, preferred tech stack, and role responsibilities from the job posting.
2. **Gap & Match Scoring**:
   - Compute matching score (e.g. 78% Match).
   - Display a breakdown of **Matched Skills**, **Missing Skills**, and **Keyword Density**.
3. **Targeted CV Rewriter**:
   - Re-rank skills to place JD-relevant technologies first.
   - Rephrase project summaries and experience bullets to highlight relevant domain experience (strictly preserving factual accuracy).
   - Generate a custom 3-line Professional Summary specifically addressing the target job title.
4. **Side-by-Side Diff View**:
   - Inspect changes before accepting (Master CV vs. Tailored Version).

#### Review Checkpoint & Deliverables
- [ ] JD input modal with instant keyword match breakdown.
- [ ] Tailored CV generation button and side-by-side diff inspector.
- [ ] Export tailored PDF per application.
- **Stage 4 Goal Report & Review Request**: Verify that tailored output increases ATS match score for a sample real-world job posting.

---

### Stage 5: Job Application Pipeline & Versioned CV Tracker

#### Objective
Store each job application with its matching tailored CV snapshot, track application status through a visual Kanban pipeline, and monitor job hunting metrics.

#### Key Features & Technical Details
1. **Application Record Architecture**:
   - Link each job record with:
     - Target company, role title, salary range, location/remote policy, job posting URL.
     - Raw job description text.
     - Exact version of the CV used (snapshot JSON + generated PDF link).
     - Timeline: Date Applied, Last Follow-up, Interview Rounds, Offer/Rejection.
     - Custom interview notes and recruiter contact details.
2. **Visual Pipeline (Kanban Board)**:
   - Interactive drag-and-drop columns (`Wishlist` ➔ `Applied` ➔ `Screening` ➔ `Technical Interview` ➔ `Offer` ➔ `Archived/Rejected`).
   - Powered by `@dnd-kit/core` or responsive board view.
3. **Analytics & Performance Dashboard**:
   - Response rate metrics (Applications sent vs. Interviews received).
   - Top matching skills across applied positions.
   - Local persistence (IndexedDB / SQLite / Supabase ready).

#### Review Checkpoint & Deliverables
- [ ] Functional Kanban pipeline tracker.
- [ ] Application detail drawer showing linked tailored CV snapshot.
- [ ] Data export/import (JSON backup of all jobs & CVs).
- **Stage 5 Goal Report & Review Request**: End-to-end workflow review and sign-off.

---

## Execution Workflow Protocol

Each stage adheres to the following strict cycle:
1. **Implementation**: Code and build all stage components.
2. **Automated & Manual Verification**: Test features with real data.
3. **Stage Goal Report & Review Request**: Present outcomes, live testing steps, and confirm user approval before initiating the next stage.
