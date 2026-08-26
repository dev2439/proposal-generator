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
        return `<h3 class="block-title">${escapeHtml(block.text)}</h3>`;
      }
      if (block.type === "list") {
        const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
        return `<ul class="copy-list">${items}</ul>`;
      }
      if (block.type === "callout") {
        return `<p class="callout">${escapeHtml(block.text)}</p>`;
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
  const skills = profile.skills.slice(0, 20);
  const jobs = profile.employment.slice(0, 3);
  const education = profile.education;

  const hookHtml = hooks
    .map(
      (hook) =>
        `<article class="hook"><span class="hook-mark"></span><p>${escapeHtml(hook)}</p></article>`,
    )
    .join("");

  const skillHtml = skills
    .map((skill) => `<li class="skill">${escapeHtml(skill)}</li>`)
    .join("");

  const jobHtml = jobs
    .map((job) => {
      const { summary, bullets } = splitJobDescription(job.description);
      const bulletHtml = bullets.length
        ? `<ul class="copy-list">${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
      return `<article class="job">
        <div class="job-top">
          <h3>${escapeHtml(job.company)}</h3>
          <span class="period">${escapeHtml(job.period)}</span>
        </div>
        <p class="role">${escapeHtml(job.role)}</p>
        <p class="location">${escapeHtml(job.location)}</p>
        ${summary ? `<p class="job-summary">${escapeHtml(summary)}</p>` : ""}
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
  <title>${escapeHtml(profile.title || "Upwork Profile")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #162033;
      font-family: "Source Sans 3", "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 10.2pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-header {
      background: linear-gradient(135deg, #102038 0%, #1a3358 58%, #16304d 100%);
      color: #fff;
      padding: 34px 48px 26px;
      position: relative;
      overflow: hidden;
    }
    .page-header::after {
      content: "";
      position: absolute;
      right: -36px;
      top: -48px;
      width: 170px;
      height: 170px;
      border: 16px solid rgba(212, 175, 106, 0.16);
      border-radius: 50%;
    }
    .kicker {
      color: #d4af6a;
      letter-spacing: 0.28em;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      margin: 0 0 8px;
    }
    h1 {
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 27pt;
      font-weight: 700;
      line-height: 1.15;
      margin: 0 0 12px;
      max-width: 7.6in;
    }
    .gold-rule {
      width: 84px;
      height: 3px;
      background: #d4af6a;
    }
    .body { padding: 22px 48px 40px; }
    .section-label {
      font-size: 8.2pt;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #b08d4a;
      margin: 18px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #ead9b3;
    }
    .skills-band {
      background: #f8f4ec;
      padding: 12px 14px 8px;
      margin: 0 0 8px;
    }
    .skill-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .skill {
      display: inline-block;
      background: #102038;
      color: #f7ecd4;
      padding: 4px 10px;
      margin: 0 6px 7px 0;
      border-radius: 999px;
      font-size: 8.2pt;
      font-weight: 600;
    }
    .hook {
      width: 100%;
      margin: 0 0 8px;
      background: #f8f4ec;
      border-left: 3px solid #d4af6a;
      padding: 8px 12px;
    }
    .hook p { margin: 0; font-size: 9.7pt; color: #243049; }
    .block-title {
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 14.5pt;
      font-weight: 700;
      color: #102038;
      margin: 16px 0 6px;
    }
    p { margin: 0 0 8px; }
    .copy-list {
      margin: 0 0 10px;
      padding: 0 0 0 16px;
    }
    .copy-list li { margin: 0 0 4px; }
    .callout {
      background: #f8f4ec;
      padding: 7px 11px;
      margin: 0 0 8px;
      font-style: italic;
    }
    .note {
      font-size: 8.3pt;
      font-style: italic;
      color: #6b7789;
      margin: 0 0 10px;
    }
    .job {
      position: relative;
      padding: 0 0 14px 16px;
      margin: 0 0 4px;
      border-left: 1.5px solid #ead9b3;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .job::before {
      content: "";
      position: absolute;
      left: -5px;
      top: 7px;
      width: 8px;
      height: 8px;
      background: #d4af6a;
      border-radius: 50%;
    }
    .job-top {
      width: 100%;
      display: table;
    }
    .job-top h3, .job-top .period {
      display: table-cell;
      vertical-align: baseline;
    }
    .job-top h3 {
      font-size: 13pt;
      margin: 0;
      color: #102038;
      font-family: "Cormorant Garamond", Georgia, serif;
    }
    .period {
      text-align: right;
      white-space: nowrap;
      padding-left: 12px;
      font-size: 8.6pt;
      font-weight: 600;
      color: #8a7443;
    }
    .role {
      margin: 1px 0 0;
      font-weight: 600;
      color: #1f3358;
    }
    .location {
      margin: 0 0 6px;
      color: #6b7789;
      font-size: 9pt;
    }
    .job-summary { margin-bottom: 6px; }
    .edu-card {
      background: #102038;
      color: #f4efe6;
      padding: 18px 20px;
      margin-top: 8px;
    }
    .edu-card .section-label {
      color: #f0d9a0;
      border-bottom-color: rgba(240, 217, 160, 0.35);
      margin-top: 0;
    }
    .edu-name {
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 16pt;
      margin: 0 0 4px;
      color: #fff;
    }
    .edu-meta {
      color: #d4af6a;
      font-size: 9.2pt;
      font-weight: 600;
      margin: 0 0 3px;
    }
    .edu-copy { color: #d9e1ee; font-size: 9.4pt; margin: 8px 0 0; }
  </style>
</head>
<body>
  <header class="page-header">
    <p class="kicker">Upwork Specialist Profile</p>
    <h1>${escapeHtml(profile.title || "Professional Profile")}</h1>
    <div class="gold-rule"></div>
  </header>
  <div class="body">
    <section>
      <h2 class="section-label">Skills</h2>
      <div class="skills-band">
        <ul class="skill-list">${skillHtml}</ul>
      </div>
    </section>
    <section>
      <h2 class="section-label">Profile Overview</h2>
      ${hookHtml}
      ${renderOverviewBlocks(blocks)}
    </section>
    <section>
      <h2 class="section-label">Employment History</h2>
      <p class="note">Illustrative employment history — replace with actual history.</p>
      ${jobHtml}
    </section>
    <section>
      <div class="edu-card">
        <h2 class="section-label">Education</h2>
        <p class="note" style="color:#c5d0e0">Illustrative education — replace with actual education.</p>
        <h3 class="edu-name">${escapeHtml(education.university)}</h3>
        <p class="edu-meta">${escapeHtml(education.degree)}</p>
        <p class="edu-meta">${escapeHtml(education.period)}</p>
        ${educationNote ? `<p class="edu-copy">${escapeHtml(educationNote)}</p>` : ""}
      </div>
    </section>
  </div>
</body>
</html>`;
}
