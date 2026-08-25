import { NextRequest, NextResponse } from "next/server";
import { clearResult } from "@/lib/result-store";

const N8N_WEBHOOK_URL =
  "https://dev868848.app.n8n.cloud/webhook/842963f8-7730-4aaa-9f17-9ab340463b8f";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { value?: unknown };
    const value = typeof payload.value === "string" ? payload.value : "";

    clearResult();

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
      cache: "no-store",
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      return NextResponse.json(
        {
          error: errorBody || `Webhook failed with status ${webhookResponse.status}`,
        },
        { status: webhookResponse.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
