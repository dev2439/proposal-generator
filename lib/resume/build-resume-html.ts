import {
  closeLastJobPeriod,
  formatHourlyRate,
  parseOverview,
  splitJobDescription,
} from "./overview";
import type { ResumeProfile } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderOverviewBlocks(
  blocks: ReturnType<typeof parseOverview>["blocks"],
): string {
  return blocks
    .map((block) => {
      if (block.type === "heading") {
        return `<h3>${escapeHtml(block.text)}</h3>`;
      }
      if (block.type === "list") {
        const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (block.type === "callout") {
        return `<p>${escapeHtml(block.text)}</p>`;
      }
      return `<p>${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

export function buildResumeHtml(profile: ResumeProfile): string {
  const { hooks, blocks } = parseOverview(profile.overview);
  const skills = profile.skills.slice(0, 20).filter(Boolean);
  const jobs = profile.employment.slice(0, 3);
  const education = profile.education;
  const title = profile.title || "Professional Profile";

  const hookHtml = hooks.map((hook) => `<p>${escapeHtml(hook)}</p>`).join("");
  const skillLine = skills.map(escapeHtml).join(", ");

  const jobHtml = jobs
    .map((job, jobIndex) => {
      const period =
        jobIndex === jobs.length - 1 ? closeLastJobPeriod(job.period) : job.period;
      const { summary, bullets } = splitJobDescription(job.description);
      const bulletHtml = bullets.length
        ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
      return `<article class="job">
        <h3>${escapeHtml(job.role)}</h3>
        <p class="job-meta">${escapeHtml(job.company)}</p>
        <p class="job-meta">${escapeHtml(job.location)}</p>
        <p class="job-meta">${escapeHtml(period)}</p>
        ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
        ${bulletHtml}
      </article>`;
    })
    .join("");

  const educationHtml = education
    .slice(0, 2)
    .map((entry) => {
      const educationNote = entry.description
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !/illustrative education/i.test(line))
        .join(" ");
      return `<article class="job">
        <h3>${escapeHtml(entry.university)}</h3>
        <p class="job-meta">${escapeHtml(entry.degree)}</p>
        <p class="job-meta">${escapeHtml(entry.period)}</p>
        ${educationNote ? `<p>${escapeHtml(educationNote)}</p>` : ""}
      </article>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: Letter; margin: 0.7in; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
    }
    h1 {
      font-size: 16pt;
      font-weight: 700;
      margin: 2px 0 16px;
      line-height: 1.25;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 18px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #000000;
    }
    h3 {
      font-size: 12pt;
      font-weight: 700;
      margin: 12px 0 4px;
    }
    p { margin: 0 0 8px; }
    ul {
      margin: 0 0 10px;
      padding: 0 0 0 18px;
    }
    li { margin: 0 0 3px; }
    .label {
      font-size: 10pt;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .skills { margin: 0 0 4px; }
    .job { margin: 0 0 12px; page-break-inside: avoid; }
    .job-meta { margin: 0 0 2px; }
    .note { font-size: 9.5pt; font-style: italic; margin: 0 0 8px; }
  </style>
</head>
<body>
  <header>
    <p class="label">Professional Title</p>
    <h1>${escapeHtml(title)}</h1>
  </header>
  <section>
    <h2>Hourly Rate</h2>
    <p>${escapeHtml(formatHourlyRate(profile.hourlyRate))}</p>
  </section>
  <section>
    <h2>Skills</h2>
    <p class="skills">${skillLine}</p>
  </section>
  <section>
    <h2>Languages</h2>
    <p>English — Fluent</p>
  </section>
  <section>
    <h2>Overview</h2>
    ${hookHtml}
    ${renderOverviewBlocks(blocks)}
  </section>
  <section>
    <h2>Employment History</h2>
    <p class="note">Illustrative employment history. Replace with actual history.</p>
    ${jobHtml}
  </section>
  <section>
    <h2>Education</h2>
    <p class="note">Illustrative education. Replace with actual education.</p>
    ${educationHtml}
  </section>
</body>
</html>`;
}
