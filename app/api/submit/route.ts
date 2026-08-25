import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  "https://dev868848.app.n8n.cloud/webhook-test/842963f8-7730-4aaa-9f17-9ab340463b8f";

function toOutputText(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      return parsed;
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { value?: unknown };
    const value = typeof payload.value === "string" ? payload.value : "";

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    const raw = await webhookResponse.text();
    const output = toOutputText(raw);

    if (!webhookResponse.ok) {
      return NextResponse.json(
        {
          error: output || `Webhook failed with status ${webhookResponse.status}`,
        },
        { status: webhookResponse.status },
      );
    }

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
