import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const N8N_WEBHOOK_URL =
  "https://dev868848.app.n8n.cloud/webhook/842963f8-7730-4aaa-9f17-9ab340463b8f";

function toOutputText(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
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
      cache: "no-store",
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
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
