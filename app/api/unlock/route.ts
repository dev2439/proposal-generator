import { NextRequest, NextResponse } from "next/server";
import { APP_PASSKEY, setUnlockCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { passkey?: unknown };
    const passkey = typeof payload.passkey === "string" ? payload.passkey : "";

    if (passkey !== APP_PASSKEY) {
      return NextResponse.json({ error: "Incorrect passkey." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setUnlockCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Unlock failed." }, { status: 400 });
  }
}
