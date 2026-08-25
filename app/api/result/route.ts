import { NextRequest, NextResponse } from "next/server";
import { getResult, setResult } from "@/lib/result-store";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function toOutputText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return raw;
  }
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}

export async function GET() {
  const stored = getResult();
  return jsonResponse({
    output: stored?.output ?? "",
    receivedAt: stored?.receivedAt ?? null,
  });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  setResult(toOutputText(raw));
  return jsonResponse({ ok: true });
}
