import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const N8N_PROFILE_WEBHOOK_URL =
  process.env.N8N_PROFILE_WEBHOOK_URL ??
  "https://dev868848.app.n8n.cloud/webhook/profile-generator";

const N8N_TIMEOUT_MS = 280_000;

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      stack?: unknown;
      country?: unknown;
    };
    const stack = typeof payload.stack === "string" ? payload.stack.trim() : "";
    const country =
      typeof payload.country === "string" ? payload.country.trim() : "";

    if (!stack || !country) {
      return NextResponse.json(
        {
          error:
            "Technical stack and education country are required.",
        },
        { status: 400 },
      );
    }

    const webhookResponse = await fetch(N8N_PROFILE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stack, country }),
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    const contentType = webhookResponse.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await webhookResponse.arrayBuffer());

    const text = buffer.toString("utf8");
    if (!webhookResponse.ok) {
      let message = text.trim() || `Workflow failed with status ${webhookResponse.status}.`;
      if (webhookResponse.status === 524 || text.includes("524: A timeout occurred")) {
        message = "Profile generation timed out. Try again in a moment.";
      }
      try {
        const parsed = JSON.parse(text) as { error?: string; value?: string; message?: string };
        message = parsed.error ?? parsed.value ?? parsed.message ?? message;
      } catch {
        // keep text message
      }
      return NextResponse.json({ error: message }, { status: webhookResponse.status });
    }

    if (
      contentType.includes("application/pdf") ||
      buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    ) {
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="upwork-profile.pdf"',
        },
      });
    }

    try {
      const parsed = JSON.parse(text) as { error?: string; value?: string; message?: string };
      return NextResponse.json(
        { error: parsed.error ?? parsed.value ?? parsed.message ?? "n8n did not return a PDF." },
        { status: 502 },
      );
    } catch {
      return NextResponse.json(
        { error: "n8n did not return a PDF." },
        { status: 502 },
      );
    }
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
