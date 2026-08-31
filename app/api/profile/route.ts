import { NextRequest, NextResponse } from "next/server";
import { isUnlockedRequest, lockedResponse } from "@/lib/auth";
import { buildResumeDocx } from "@/lib/resume/build-resume-docx";
import { parseHourlyRate } from "@/lib/resume/overview";
import { parseResumeProfile } from "@/lib/resume/parse-profile";

export const maxDuration = 300;

const N8N_PROFILE_WEBHOOK_URL =
  process.env.N8N_PROFILE_WEBHOOK_URL ??
  "https://dev868848.app.n8n.cloud/webhook/profile-generator";

const N8N_TIMEOUT_MS = 280_000;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function docxResponse(buffer: Buffer) {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": 'attachment; filename="upwork-profile.docx"',
    },
  });
}

function isDocxBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 2).toString("ascii") === "PK";
}

function messageFromJson(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as {
      error?: unknown;
      value?: unknown;
      message?: unknown;
    };
    const candidates = [parsed.error, parsed.value, parsed.message];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!isUnlockedRequest(request)) {
    return lockedResponse();
  }

  try {
    const payload = (await request.json()) as {
      stack?: unknown;
      country?: unknown;
      hourlyRate?: unknown;
    };
    const stack = typeof payload.stack === "string" ? payload.stack.trim() : "";
    const country =
      typeof payload.country === "string" ? payload.country.trim() : "";
    const hourlyRateRaw =
      typeof payload.hourlyRate === "string"
        ? payload.hourlyRate.trim()
        : payload.hourlyRate == null
          ? ""
          : String(payload.hourlyRate).trim();
    const hourlyRate = parseHourlyRate(hourlyRateRaw);

    if (!stack || !country || !hourlyRate) {
      return jsonError(
        "Technical stack, education country, and a numeric hourly rate are required.",
        400,
      );
    }

    const webhookResponse = await fetch(N8N_PROFILE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stack, country, hourlyRate }),
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    const contentType = webhookResponse.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await webhookResponse.arrayBuffer());
    const text = buffer.toString("utf8");

    if (
      contentType.includes(DOCX_MIME) ||
      contentType.includes("application/octet-stream") ||
      isDocxBuffer(buffer)
    ) {
      if (isDocxBuffer(buffer)) {
        return docxResponse(buffer);
      }
    }

    const parsedMessage = messageFromJson(text);
    const timedOutGateway =
      webhookResponse.status === 524 ||
      text.includes("524: A timeout occurred") ||
      /request timed out/i.test(text) ||
      /request timed out/i.test(parsedMessage ?? "");

    if (timedOutGateway) {
      return jsonError(
        "Profile generation timed out while researching companies. Try again in a moment.",
        504,
      );
    }

    if (!webhookResponse.ok) {
      return jsonError(
        parsedMessage ||
          text.trim() ||
          `Workflow failed with status ${webhookResponse.status}.`,
        webhookResponse.status,
      );
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    const profile = parseResumeProfile(parsed);
    if (profile) {
      const docx = await buildResumeDocx({ ...profile, hourlyRate });
      return docxResponse(docx);
    }

    return jsonError(
      parsedMessage || "n8n did not return a Word document.",
      502,
    );
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    const message = timedOut
      ? "n8n timed out. Try again in a moment."
      : error instanceof Error
        ? error.message
        : "Request failed";
    return jsonError(message, 500);
  }
}
