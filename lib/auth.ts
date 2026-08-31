import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const UNLOCK_COOKIE = "proposal_unlock";
export const APP_PASSKEY = process.env.APP_PASSKEY ?? "skwdukvif`12";

export const UNLOCK_TOKEN = createHash("sha256")
  .update(`proposal-unlock:${APP_PASSKEY}`)
  .digest("hex");

export function isUnlockedRequest(request: NextRequest): boolean {
  return request.cookies.get(UNLOCK_COOKIE)?.value === UNLOCK_TOKEN;
}

export function lockedResponse(): NextResponse {
  return NextResponse.json({ error: "Unlock required." }, { status: 401 });
}

export function setUnlockCookie(response: NextResponse): void {
  response.cookies.set(UNLOCK_COOKIE, UNLOCK_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function safeNextPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value === "/unlock" ||
    value.startsWith("/unlock?")
  ) {
    return "/";
  }
  return value;
}
