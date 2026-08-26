import type { ResumeProfile } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[\s]*(?:[★📌✦✔✓*]|##)\s*/, "")
    .replace(/^[-–—*•▸ㆍ>]\s+/, "")
    .trim();
}

function isDivider(line: string): boolean {
  return /^[-*_]{3,}$/.test(line.trim());
}

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (/^#{1,6}\s+\S/.test(trimmed)) return true;
  if (/^[★📌✦✔]/.test(trimmed)) return true;
  if (/^##\s/.test(trimmed)) return true;
  if (/^(tech stack|typical challenges|key results|how these tools|strategic )/i.test(cleanLine(trimmed))) {
    return true;
  }
  return false;
}

function isBullet(line: string): boolean {
  return /^[-–—*•▸ㆍ>]\s+\S/.test(line.trim());
}

function looksLikeHook(line: string): boolean {
  const text = cleanLine(line);
  return (
    text.length > 40 &&
    text.length < 280 &&
    (/[—–-]/.test(text) || /\bneeded\b|\brequired\b|\blacked\b/i.test(text))
  );
}

type OverviewBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

function parseOverview(overview: string): { hooks: string[]; blocks: OverviewBlock[] } {
  const rawLines = overview.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim());
  const lines = rawLines.filter((line, index) => line.length > 0 || (index > 0 && rawLines[index - 1]));
  const hooks: string[] = [];
  let i = 0;

  while (i < lines.length && hooks.length < 3) {
    const line = lines[i];
    if (!line) {
      i += 1;
      continue;
    }
    if (isHeading(line) && !looksLikeHook(line)) break;
    if (looksLikeHook(line) || (isBullet(line) && hooks.length < 3)) {
      hooks.push(cleanLine(line));
      i += 1;
      continue;
    }
    break;
  }

  const blocks: OverviewBlock[] = [];
  while (i < lines.length) {
    const line = lines[i];
    if (!line || isDivider(line)) {
      i += 1;
      continue;
    }
    if (isHeading(line)) {
      blocks.push({ type: "heading", text: cleanLine(line) });
      i += 1;
      continue;
    }
    if (/^>\s*/.test(line) || /^solution:/i.test(line)) {
      blocks.push({ type: "callout", text: cleanLine(line.replace(/^solution:\s*/i, "Solution: ")) });
      i += 1;
      continue;
    }
    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(cleanLine(lines[i]));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    blocks.push({ type: "paragraph", text: cleanLine(line) });
    i += 1;
  }

  return { hooks, blocks };
}

function renderOverviewBlocks(blocks: OverviewBlock[]): string {
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

function splitJobDescription(description: string): { summary: string; bullets: string[] } {
  const lines = description
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/illustrative employment/i.test(line));
  const bullets: string[] = [];
  const summaryParts: string[] = [];
  for (const line of lines) {
    if (isBullet(line) || line.startsWith("•")) {
      bullets.push(cleanLine(line));
    } else {
      summaryParts.push(cleanLine(line));
    }
  }
  return { summary: summaryParts.join(" "), bullets };
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
    .map((job) => {
      const { summary, bullets } = splitJobDescription(job.description);
      const bulletHtml = bullets.length
        ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
      return `<article class="job">
        <h3>${escapeHtml(job.role)}</h3>
        <p class="job-meta">${escapeHtml(job.company)}</p>
        <p class="job-meta">${escapeHtml(job.location)}</p>
        <p class="job-meta">${escapeHtml(job.period)}</p>
        ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
        ${bulletHtml}
      </article>`;
    })
    .join("");

  const educationNote = education.description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/illustrative education/i.test(line))
    .join(" ");

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
    <h2>Skills</h2>
    <p class="skills">${skillLine}</p>
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
    <h3>${escapeHtml(education.university)}</h3>
    <p class="job-meta">${escapeHtml(education.degree)}</p>
    <p class="job-meta">${escapeHtml(education.period)}</p>
    ${educationNote ? `<p>${escapeHtml(educationNote)}</p>` : ""}
  </section>
</body>
</html>`;
}
