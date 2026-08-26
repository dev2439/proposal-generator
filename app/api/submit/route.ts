import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ??
  "https://dev868848.app.n8n.cloud/webhook/upwork-proposal-agents";

const N8N_TIMEOUT_MS = 280_000;

type ScreeningAnswer = {
  question?: unknown;
  answer?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value) && value.length > 0) {
    return asRecord(value[0]);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("json" in record && record.json && typeof record.json === "object") {
      return asRecord(record.json);
    }
    return record;
  }
  return null;
}

function extractValue(parsed: unknown): string | null {
  if (typeof parsed === "string") {
    return parsed;
  }

  const record = asRecord(parsed);
  if (!record || !("value" in record)) {
    return null;
  }

  const value = record.value;
  if (typeof value === "string") {
    return value;
  }
  if (value != null) {
    return String(value);
  }
  return null;
}

function formatScreeningAnswers(answers: unknown): string | null {
  if (!Array.isArray(answers) || answers.length === 0) {
    return null;
  }

  const blocks = answers.map((item) => {
    if (!item || typeof item !== "object") {
      return String(item);
    }
    const row = item as ScreeningAnswer;
    const question = row.question != null ? String(row.question) : "";
    const answer = row.answer != null ? String(row.answer) : "";
    return `Q: ${question}\nA: ${answer}`;
  });

  return `---\nSCREENING ANSWERS\n${blocks.join("\n\n")}`;
}

function formatMeta(record: Record<string, unknown>): string | null {
  const lines: string[] = [];
  if (typeof record.suggestedBid === "string" && record.suggestedBid.trim()) {
    lines.push(`Bid: ${record.suggestedBid.trim()}`);
  }
  if (
    typeof record.suggestedTimeline === "string" &&
    record.suggestedTimeline.trim()
  ) {
    lines.push(`Timeline: ${record.suggestedTimeline.trim()}`);
  }
  if (record.fitScore != null && record.verdict != null) {
    lines.push(`Fit: ${record.fitScore}/100 (${record.verdict})`);
  }
  return lines.length > 0 ? `---\n${lines.join("\n")}` : null;
}

function formatWarnings(warnings: unknown): string | null {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return null;
  }
  const lines = warnings.map((warning) => `- ${String(warning)}`);
  return `---\nWARNINGS\n${lines.join("\n")}`;
}

function toOutputText(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const record = asRecord(parsed);
    const value = extractValue(parsed);

    if (value === null) {
      if (record && typeof record.message === "string") {
        return record.message;
      }
      return trimmed;
    }

    if (!record || record.status === "skipped" || record.status === "error") {
      return value;
    }

    return [value, formatScreeningAnswers(record.screeningAnswers), formatMeta(record), formatWarnings(record.warnings)]
      .filter((part): part is string => Boolean(part))
      .join("\n\n");
  } catch {
    return body;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { value?: unknown };
    const value = typeof payload.value === "string" ? payload.value.trim() : "";

    if (!value) {
      return NextResponse.json(
        {
          error:
            "No job post was received. Paste the Upwork job description and try again.",
        },
        { status: 400 },
      );
    }

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    const output = toOutputText(await webhookResponse.text());

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: output || `Webhook failed with status ${webhookResponse.status}` },
        { status: webhookResponse.status },
      );
    }

    return NextResponse.json({ output });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    const message = timedOut
      ? "n8n timed out. Try again in a moment."
      : error instanceof Error
        ? error.message
        : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
